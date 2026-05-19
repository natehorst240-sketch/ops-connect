# Migration: Static `AIRCRAFT` and `BASES` Arrays → Dataverse

**Priority:** Pre-scale — adding a base, retiring an aircraft, or changing a region
currently requires a code change and deployment. These should be ops-manager self-service.

---

## Overview of what moves where

| Static file | Destination | Status |
|---|---|---|
| `AIRCRAFT` array in `index.js` | `cr463_aircrafts` (already exists) | Needs field audit + `intl` column |
| `BASES` array in `bases.js` | `cr463_basemetadata` (new entity) | Full migration required |
| `BASE_META` map in `mxOncallSchedule.js` | Additional columns on `cr463_basemetadata` | Merges with BASES |

The static arrays become the demo fallback only — the same pattern already used for
personnel. No component needs to change its conditional logic.

---

## Part A — `cr463_aircrafts` Field Audit

The entity already exists. Compare the current `mapAircraft()` mapper against the
static `AIRCRAFT` array to find any missing columns.

### Fields already mapped (from `mapAircraft()` in `useFleetData.js`)

| Static field | Dataverse schema name | Status |
|---|---|---|
| `tail` | `cr463_tailnumber` or `cr463_title` | ✅ Mapped |
| `type` | `cr463_helicoptertype` | ✅ Mapped |
| `base` | `cr463_baselocation` | ✅ Mapped |
| `region` | `cr463_operatingregion` | ✅ Mapped |
| `status` | `cr463_operationalstatus` | ✅ Mapped (choice column) |
| `make` | `cr463_manufacturer` | ✅ Mapped |
| `model` | `cr463_modelnumber` | ✅ Mapped |
| `serial` | `cr463_serialnumber` | ✅ Mapped |
| `rmm` | `cr463_responsiblemaintenancemanager` | ✅ Mapped |
| `assignedTail` | `cr463_assignedaircrafttail` | ✅ Mapped (personnel entity) |

### Field missing from mapper

| Static field | Add to `cr463_aircrafts` | Type | Notes |
|---|---|---|---|
| `intl` | `cr463_internationalcapability` | Text (50) | Values: `"N/S America"`, `"Unrestricted"` |

Add this column in the Dataverse maker portal, then add to `mapAircraft()`:

```js
// In useFleetData.js mapAircraft():
return {
  // ... existing fields
  intl: pick(row, f('internationalcapability')),
};
```

### `cr463_operationalstatus` choice column — verify these values exist

| Label        | Value | Used by |
|---|---|---|
| In Service   | 1     | `STATUS_MAP[1]` = `'IN_SERVICE'` |
| Maintenance  | 2     | `STATUS_MAP[2]` = `'MAINTENANCE'` |
| AOG          | 3     | `STATUS_MAP[3]` = `'AOG'` |
| Spare        | 4     | `STATUS_MAP[4]` = `'SPARE'` |

The formatted value (e.g., `"In Service"`) is also read via the OData annotation and
normalized with `.toUpperCase().replace(/\s+/g, '_')`. Either approach works as long as
the formatted strings map to `IN_SERVICE`, `MAINTENANCE`, `AOG`, or `SPARE`.

### Seed data

To seed `cr463_aircrafts` from the static array, export to CSV from `AIRCRAFT` in
`index.js` and import via Power Platform's **Import data** → Excel/CSV. Map columns:

| CSV column | Dataverse column |
|---|---|
| tail | cr463_tailnumber |
| type | cr463_helicoptertype |
| base | cr463_baselocation |
| region | cr463_operatingregion |
| status | cr463_operationalstatus |
| intl | cr463_internationalcapability |

---

## Part B — New entity: `cr463_basemetadata`

Create this entity in the OpsConnect solution. It consolidates the `BASES` array
from `bases.js` and the `BASE_META` map from `mxOncallSchedule.js`.

### Entity definition

**Display name:** Base Metadata
**Schema name:** `cr463_basemetadata`
**Primary column:** `cr463_name` (Base Name, Text 100)

### Columns

| Display name          | Schema name (`cr463_`)      | Type         | Required | Notes |
|-----------------------|-----------------------------|--------------|----------|-------|
| Base Name             | `name`                      | Text (100)   | Yes      | Primary — display name (e.g., `"McKay-Dee"`) |
| Base ID               | `baseid`                    | Text (50)    | Yes      | Slug (e.g., `"mckay"`) — unique, used for lookup |
| IH Codes              | `ihcodes`                   | Text (50)    | No       | Semicolon-separated (e.g., `"IH-13;IH-15"`) |
| Region Code           | `regioncode`                | Text (50)    | Yes      | e.g., `"109 UT"`, `"WY/MT"` |
| Longitude             | `longitude`                 | Decimal      | No       | MapLibre x-coordinate |
| Latitude              | `latitude`                  | Decimal      | No       | MapLibre y-coordinate |
| Operational Status    | `operationalstatus`         | Choice       | Yes      | See choice values below |
| Status Reason         | `statusreason`              | Text (200)   | No       | e.g., `"N291HC AOG · awaiting parts"` |
| Weather Condition     | `weathercondition`          | Choice       | No       | `green`, `yellow`, `red` |
| Weather Detail        | `weatherdetail`             | Text (100)   | No       | e.g., `"VFR · 10SM · clear"` |
| CF Base Name          | `cfbasename`                | Text (100)   | No       | CompleteFlight name (e.g., `"IMED/Hangar"`) — used by OncallWidget |
| CF Display Label      | `cfdisplaylabel`            | Text (150)   | No       | Display label for OncallWidget (e.g., `"IMED IH-14"`) |
| Is Active             | `isactive`                  | Yes/No       | Yes      | Set to No when base closes; filtered out by queries |

**Choice column — `cr463_operationalstatus` — values:**

| Label            | Value |
|---|---|
| Available        | 1     |
| Away from Base   | 2     |
| Out of Service   | 3     |
| Unavailable      | 4     |

**Choice column — `cr463_weathercondition` — values:**

| Label | Value | Meaning |
|---|---|---|
| VFR     | 1 | green — visual flight rules |
| MVFR    | 2 | yellow — marginal VFR / IFR |
| LIFR    | 3 | red — low IFR, no-go |

### Weather update flow (optional, Phase 2)

Weather conditions change hourly. Until an automated feed is connected, a
Power Automate flow can pull from a weather API (e.g., Aviation Weather Center):

**Recurrence:** Every 30 minutes
**HTTP:** `GET https://aviationweather.gov/api/data/metar?ids={ICAO_LIST}&format=json`
**Update row:** For each base with a matching ICAO code, update `cr463_weathercondition`
and `cr463_weatherdetail`.

For the initial migration, weather can be manually maintained in Dataverse — this is
still better than hardcoded source code because ops managers can update it without a deploy.

---

## Part C — React code migration

### Step 1 — Add `mapBaseMetadata()` to `useFleetData.js`

```js
function mapBaseMetadata(row) {
  const rawStatus = row[f('operationalstatus')];
  const STATUS_MAP = { 1: 'AVAILABLE', 2: 'AWAY_FROM_BASE', 3: 'OUT_OF_SERVICE', 4: 'UNAVAILABLE' };
  const WEATHER_MAP = { 1: 'green', 2: 'yellow', 3: 'red' };
  return {
    id:           pick(row, f('baseid')),
    name:         pick(row, f('name')),
    codes:        (pick(row, f('ihcodes')) ?? '').split(';').filter(Boolean),
    coords:       [pick(row, f('longitude')), pick(row, f('latitude'))].map(Number),
    region:       pick(row, f('regioncode')),
    status:       STATUS_MAP[rawStatus] ?? 'AVAILABLE',
    statusReason: pick(row, f('statusreason')),
    weather:      WEATHER_MAP[row[f('weathercondition')]] ?? 'green',
    weatherDetail: pick(row, f('weatherdetail')),
    cfBaseName:   pick(row, f('cfbasename')),
    cfDisplayLabel: pick(row, f('cfdisplaylabel')),
  };
}
```

### Step 2 — Add `bases` to `TABLES` in `tables.js`

```js
export const TABLES = {
  // ... existing
  basemetadata: `${P}basemetadatas`,   // new
};
```

### Step 3 — Add `bases` to `useFleetData.js` state and fetch

```js
// In useState initial state:
bases: [],

// In Promise.allSettled:
query(TABLES.basemetadata, { filter: 'cr463_isactive eq true' }),

// In setState after allSettled:
const [aircraft, personnel, mxRequests, scheduleEvents, fleetPositions, conflicts, scheduleEntries, bases] = results;
// ...
bases: bases.status === 'fulfilled' ? bases.value.map(mapBaseMetadata) : [],
```

### Step 4 — Update consumers to fall back to static data

**`src/tabs/LiveFleet.jsx` (Map component)**

```jsx
import { BASES as STATIC_BASES } from '../data/bases';
import { useFleet } from '../contexts/FleetDataContext';

const { bases: liveBases } = useFleet();
const BASES = liveBases.length ? liveBases : STATIC_BASES;
```

**`mxOncallSchedule.js` — replace `BASE_META` lookup with Dataverse query**

`BASE_META` maps CF base names (e.g., `"IMED/Hangar"`) to display labels and regions.
After migration, `OncallWidget` builds this map from the `cr463_cfbasename` and
`cr463_cfdisplaylabel` columns:

```js
// Replace getOncallForDateLive() to also accept baseMeta from context
export function buildBaseMetaFromLive(bases) {
  const map = {};
  for (const b of bases) {
    if (b.cfBaseName) {
      map[b.cfBaseName] = {
        region: b.region,
        label:  b.cfDisplayLabel ?? b.name,
      };
    }
  }
  return map;
}
```

In `OncallWidget.jsx`:
```jsx
const { scheduleEntries, bases } = useFleet();
const baseMeta = useMemo(
  () => bases.length ? buildBaseMetaFromLive(bases) : BASE_META,
  [bases]
);
```

### Step 5 — Delete static files (after Dataverse confirmed populated)

Once `liveBases.length > 0` is consistently true in production:
1. Remove `import { BASES } from '../data/bases'` from all consumers
2. Remove `import { BASE_META } from '../data/mxOncallSchedule'` from OncallWidget
3. Delete `src/data/bases.js`
4. Delete `BASE_META` from `src/data/mxOncallSchedule.js`

Do **not** delete these until you have confirmed 30 days of stable production data.
Keep the static arrays as fallback during the transition window.

---

## Part D — Seed data

Both entities can be seeded from the existing static arrays using Power Platform's
**Import data** wizard (CSV upload) before any API integration is built.

### `cr463_aircrafts` CSV template

Headers: `cr463_tailnumber, cr463_helicoptertype, cr463_baselocation, cr463_operatingregion, cr463_operationalstatus, cr463_internationalcapability`

`cr463_operationalstatus` must use the choice integer (1–4), not the label string.

### `cr463_basemetadata` CSV template

Headers: `cr463_baseid, cr463_name, cr463_ihcodes, cr463_regioncode, cr463_longitude, cr463_latitude, cr463_operationalstatus, cr463_weathercondition, cr463_cfbasename, cr463_cfdisplaylabel, cr463_isactive`

The `BASES` array in `bases.js` and `BASE_META` in `mxOncallSchedule.js` together provide
all the data for this CSV. A one-time Node script can merge and export them:

```js
// scripts/export-base-meta.js — run once with: node scripts/export-base-meta.js
import { BASES } from '../src/data/bases.js';
import { BASE_META } from '../src/data/mxOncallSchedule.js';

const STATUS_INT = { AVAILABLE: 1, AWAY_FROM_BASE: 2, OUT_OF_SERVICE: 3, UNAVAILABLE: 4 };
const WEATHER_INT = { green: 1, yellow: 2, red: 3 };

// Build reverse CF map: find CF entries whose display label contains the base name
const rows = BASES.map(b => {
  const cfEntry = Object.entries(BASE_META).find(([, v]) =>
    v.label.toLowerCase().includes(b.name.toLowerCase())
  );
  return {
    cr463_baseid:              b.id,
    cr463_name:                b.name,
    cr463_ihcodes:             b.codes.join(';'),
    cr463_regioncode:          b.region,
    cr463_longitude:           b.coords[0],
    cr463_latitude:            b.coords[1],
    cr463_operationalstatus:   STATUS_INT[b.status] ?? 1,
    cr463_weathercondition:    WEATHER_INT[b.weather] ?? 1,
    cr463_weatherdetail:       b.weatherDetail ?? '',
    cr463_cfbasename:          cfEntry?.[0] ?? '',
    cr463_cfdisplaylabel:      cfEntry?.[1]?.label ?? b.name,
    cr463_isactive:            true,
  };
});

const header = Object.keys(rows[0]).join(',');
const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${v}"`).join(','))].join('\n');
process.stdout.write(csv);
```

---

## Go-Live Checklist

### Aircraft
- [ ] Audit `cr463_aircrafts` columns — verify all fields in `mapAircraft()` exist
- [ ] Add `cr463_internationalcapability` column if missing
- [ ] Import CSV seed data for all 47 aircraft
- [ ] Add `intl` to `mapAircraft()` in `useFleetData.js`
- [ ] Verify `useFleet().aircraft.length > 0` in production before removing static fallback

### Bases
- [ ] Create `cr463_basemetadata` entity in OpsConnect solution
- [ ] Add all columns from schema table above
- [ ] Run `export-base-meta.js` to generate seed CSV
- [ ] Import CSV — verify all 35 bases appear in Dataverse
- [ ] Add `basemetadata` to `TABLES` and `mapBaseMetadata()` to `useFleetData.js`
- [ ] Add `bases` to `FleetDataContext`
- [ ] Update Map and OncallWidget components to read from context with static fallback
- [ ] Confirm live data shows correctly for 30 days
- [ ] Delete `src/data/bases.js` and `BASE_META` from `mxOncallSchedule.js`
