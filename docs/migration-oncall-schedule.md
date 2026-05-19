# Migration: cfSchedule.js → Dataverse `cr463_scheduleentries`

**Priority:** Ship blocker — every shift change currently requires a code deploy.

**Target entity:** `cr463_scheduleentries` (already defined in `TABLES.scheduleEntry`).
The `mapScheduleEntry()` mapper in `useFleetData.js` already reads the right field names.
This migration wires data into the entity it was always designed for.

---

## 1. Dataverse Entity Schema

The `cr463_scheduleentries` entity needs these columns. If any are missing, add them
in the Power Platform maker portal under **Solutions → OpsConnect → Tables → Schedule Entries → Columns**.

| Display name            | Schema name (`cr463_`)        | Type         | Required | Notes |
|-------------------------|-------------------------------|--------------|----------|-------|
| Schedule Entry          | `scheduleentryid`             | Primary Key  | Auto     | GUID, generated |
| Source System           | `sourcesystem`                | Text (50)    | Yes      | Always `'CompleteFlight'` for CF rows |
| Source Row ID           | `sourcerowid`                 | Text (100)   | No       | CF's internal ID if available; used for upsert dedup |
| Personnel Type          | `personneltype`               | Choice       | No       | Choice values: `MX On Call`, `1st Out`, `2nd Out`, `MX Control` |
| Role Type               | `roletype`                    | Text (100)   | No       | Verbatim from CF `type` field for display |
| Owner Name              | `ownername`                   | Text (150)   | Yes      | Full name from CF export |
| Personnel Lookup        | `personnelid`                 | Lookup → `cr463_personnelmaintenances` | No | Optional: match on name after import |
| Base Location           | `base`                        | Text (100)   | Yes      | CF `base` value verbatim (e.g., `"IMED/Hangar"`) |
| Region Code             | `region`                      | Text (50)    | No       | Populated by flow from BASE_META lookup |
| Shift Date              | `shiftdate`                   | Date Only    | Yes      | UTC date from CF `date` field |
| Hours                   | `hours`                       | Text (30)    | No       | e.g., `"07:00 - 06:59"` |
| Timezone                | `timezone`                    | Text (10)    | No       | e.g., `"MDT"` |
| Notes                   | `notes`                       | Multiline (500) | No   | Free text; unused by CF rows |

**Choice column — `cr463_personneltype` — values:**

| Label               | Value (integer) |
|---------------------|-----------------|
| MX On Call          | 1               |
| 1st Out MX On Call  | 2               |
| 2nd Out MX On Call  | 3               |
| Maintenance Control | 4               |

---

## 2. Power Automate Flow: `cf-schedule-sync`

**Location:** Power Platform → Solutions → OpsConnect → Cloud Flows → New

### Trigger

**Recurrence**
- Frequency: `Day`
- Interval: `1`
- Start time: `01:00:00` (Mountain Time — before any shift change)

### Variable: date range

Add a **Initialize variable** action before the HTTP call.

```
SyncStartDate = formatDateTime(addDays(utcNow(), -1), 'yyyy-MM-dd')
SyncEndDate   = formatDateTime(addDays(utcNow(), 21), 'yyyy-MM-dd')
```

This keeps a rolling 22-day window: yesterday (catches late changes) through 3 weeks ahead.

### Action 1 — Fetch from CompleteFlight

**HTTP**
```
Method:  GET
URI:     https://api.completeflight.com/v1/schedules
         ?startDate=@{variables('SyncStartDate')}
         &endDate=@{variables('SyncEndDate')}
         &type=maintenance
Headers:
  Authorization: Bearer @{parameters('CF_API_KEY')}
  Accept: application/json
```

Store the `CF_API_KEY` as an **Environment Variable** (secret), not hardcoded in the flow.

### Action 2 — Parse JSON

**Parse JSON** → Content: `@{body('HTTP')}`

Schema derived from CF_SCHEDULE shape:
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "date":     { "type": "string" },
      "type":     { "type": "string" },
      "base":     { "type": "string" },
      "hours":    { "type": "string" },
      "timezone": { "type": "string" },
      "owner":    { "type": "string" }
    }
  }
}
```

### Action 3 — Delete existing rows for the date range

Before inserting, remove stale rows so shift swaps are reflected.

**List rows** (Dataverse)
- Table: `Schedule Entries (cr463_scheduleentries)`
- Filter rows: `cr463_sourcesystem eq 'CompleteFlight' and cr463_shiftdate ge @{variables('SyncStartDate')} and cr463_shiftdate le @{variables('SyncEndDate')}`
- Select columns: `cr463_scheduleentryid`

**Apply to each** → value: `@{outputs('List_rows')?['body/value']}`
- **Delete a row** (Dataverse) → Row ID: `@{items()?['cr463_scheduleentryid']}`

### Action 4 — Map CF type to choice integer

Add a **Initialize variable** `TypeMap` (Object):
```json
{
  "Maintenance On Call":    1,
  "1st Out MX On Call":     2,
  "2nd Out MX On Call":     3,
  "Maintenance Control":    4
}
```

### Action 5 — Insert new rows

**Apply to each** → value: `@{body('Parse_JSON')}`

Inside the loop, **Add a new row** (Dataverse):
- Table: `Schedule Entries (cr463_scheduleentries)`

| Column | Expression |
|--------|-----------|
| `cr463_sourcesystem` | `CompleteFlight` |
| `cr463_roletype` | `@{items()?['type']}` |
| `cr463_personneltype` | `@{coalesce(variables('TypeMap')[items()?['type']], 1)}` |
| `cr463_ownername` | `@{items()?['owner']}` |
| `cr463_base` | `@{items()?['base']}` |
| `cr463_shiftdate` | `@{items()?['date']}` |
| `cr463_hours` | `@{items()?['hours']}` |
| `cr463_timezone` | `@{items()?['timezone']}` |

### Action 6 — Error notification (configure on flow failure)

In the flow's **Run After** settings on a final action, add a parallel branch that fires
if any prior step fails:

**Post message in a chat or channel** (Teams)
- Channel: `#mx-ops-alerts`
- Message: `⚠️ CF schedule sync failed for @{variables('SyncStartDate')} – @{variables('SyncEndDate')}. Manual upload required. Error: @{result('HTTP')}`

---

## 3. React Code Migration

### Step 1 — Update `useFleetData.js` to filter schedule entries by source

The current query fetches all schedule entries. Once CF data populates the table,
scope the query to avoid pulling crew schedule rows:

```js
// In useFleetData.js, inside the Promise.allSettled block:
query(TABLES.scheduleEntry, {
  filter: `cr463_sourcesystem eq 'CompleteFlight'`,
  orderby: 'cr463_shiftdate asc'
}),
```

### Step 2 — Update `mxOncallSchedule.js`

Replace `getOncallForDate()` with a version that reads from the context instead of
the static `CF_SCHEDULE` array.

```js
// NEW helper — accepts the scheduleEntries array from FleetDataContext
export function getOncallForDateLive(scheduleEntries, dateIso) {
  const entries = scheduleEntries.filter(e => e.shiftDate === dateIso);
  const byBase = {};
  for (const e of entries) {
    if (!byBase[e.base]) byBase[e.base] = [];
    byBase[e.base].push({
      date:     e.shiftDate,
      type:     e.roleType,
      base:     e.base,
      hours:    e.hours ?? '',
      timezone: e.timezone ?? '',
      owner:    e.ownerName ?? '',
    });
  }
  return byBase;
}
```

Keep `getOncallForDate()` (the static version) as the fallback until Dataverse is
confirmed populated.

### Step 3 — Update `OncallWidget.jsx`

```jsx
import { useFleet } from '../contexts/FleetDataContext';
import { getOncallForDateLive, getOncallForDate } from '../data/mxOncallSchedule';

export default function OncallWidget({ persona }) {
  const { scheduleEntries } = useFleet();

  const todayByBase = useMemo(() => {
    // Use live data when available, fall back to static CF_SCHEDULE
    if (scheduleEntries.length > 0) {
      return getOncallForDateLive(scheduleEntries, DEMO_TODAY_ISO);
    }
    return getOncallForDate(DEMO_TODAY_ISO);
  }, [scheduleEntries]);

  // ... rest unchanged
}
```

Once the flow is confirmed running and Dataverse has ≥7 days of data:
1. Remove `import { CF_SCHEDULE } from './cfSchedule'` from `mxOncallSchedule.js`
2. Remove the `getOncallForDate()` static fallback
3. Delete `src/data/cfSchedule.js`

---

## 4. Go-Live Checklist

- [ ] `cr463_scheduleentries` table exists in production Dataverse tenant
- [ ] All columns in schema table above exist with correct types
- [ ] `CF_API_KEY` environment variable created in Power Platform
- [ ] Flow created and tested against dev environment with real CF credentials
- [ ] Flow ran at least once — verify row count in Dataverse matches CF export
- [ ] `OncallWidget` shows live data (verify by checking a known shift against the CF export)
- [ ] Ran flow after a simulated shift swap — verify OncallWidget updates without a code deploy
- [ ] `cfSchedule.js` import removed from `mxOncallSchedule.js`
- [ ] `cfSchedule.js` file deleted from source tree
