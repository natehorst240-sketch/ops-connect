# Table: `cr_conflict`

**Phase 2 canonical.** Cross-system flags. Detects double-booked
resources, AOG cascades, and other conflicts that span CompleteFlight
+ ProteanHub + MX Connect schedule data. Written by a detector flow;
resolved by RMM/Director acknowledgment.

> **Not part of Phase 1.** Phase 1 has no detector flow and no external
> data to conflict with. The seed data in the CSV exists for Phase 2
> development reference.

## Display name

**Conflict**

## Schema name

`cr_conflict`

## Primary column

`cr_conflict_id` — Text (16). Format `CFL-NNNNN`. Written by the
detector flow.

## Columns

Matches `m365-solution/sharepoint-lists/10-conflicts.csv` (3 seed rows):

| Schema name              | Display              | Type                       | Required | Notes                                                                                |
| ------------------------ | -------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `cr_title`               | Title                | Text (200)                 | Yes      | Human-readable summary. CSV: `N291HC AOG cascade · 0 missions affected`.            |
| `cr_conflict_id`         | Conflict ID          | Text (16)                  | Yes      | Format `CFL-NNNNN`. Primary identifier.                                              |
| `cr_type`                | Type                 | Choice                     | Yes      | See § *Choice values*.                                                              |
| `cr_severity`            | Severity             | Choice                     | Yes      | `critical` / `warning`. Lowercase per CSV convention.                                |
| `cr_detail`              | Detail               | Multiline text (2000)      | Yes      | Long-form description of the conflict.                                              |
| `cr_suggestion`          | Suggestion           | Multiline text (1000)      | No       | Recommended action.                                                                 |
| `cr_event_ids`           | Event IDs            | Multiline text (500)       | Yes      | Comma-delimited list of `cr_schedule_event.cr_event_id` values that triggered this. |
| `cr_actionable_event_id` | Actionable Event ID  | Text (24)                  | No       | The single event ID that the user should act on (subset of Event IDs). Used so the canvas can deep-link to one event without ambiguity. |
| `cr_actionable_source`   | Actionable Source    | Choice                     | No       | `CompleteFlight` / `ProteanHub`. Which external system to open for the actionable event. |
| `cr_acknowledged_by`     | Acknowledged By      | Text (60)                  | No       | Name of the user who acknowledged. Phase 2: convert to Lookup → `systemuser`.        |
| `cr_acknowledged_at`     | Acknowledged At      | Date and time              | No       | Set on Acknowledge action.                                                          |
| `cr_first_detected_at`   | First Detected At    | Date and time              | Yes      | When the detector flow first saw this conflict. Persists across re-detection.       |
| `cr_last_detected_at`    | Last Detected At     | Date and time              | Yes      | When the detector flow last confirmed the conflict still exists. Updated on each pass. |

## Choice values

### `cr_type`

Lowercase per CSV convention (event-name style):

| Label              | Value | Notes                                                                |
| ------------------ | ----- | -------------------------------------------------------------------- |
| aog_cascade        | 1     | Aircraft AOG and downstream missions impacted. CSV: 1 of 3 rows.    |
| double_booked      | 2     | Same resource on two events at the same time. CSV: 1 of 3 rows.     |
| resource_conflict  | 3     | Generic resource contention (e.g., crew double-assigned). CSV: 1.   |

### `cr_severity`

Lowercase per CSV convention:

| Label    | Value | Notes                                          |
| -------- | ----- | ---------------------------------------------- |
| critical | 1     | Immediate action required. CSV: 1 of 3 rows.    |
| warning  | 2     | Action recommended. CSV: 2 of 3 rows.           |

### `cr_actionable_source`

| Label          | Value | Notes                                          |
| -------------- | ----- | ---------------------------------------------- |
| CompleteFlight | 1     |                                                 |
| ProteanHub     | 2     |                                                 |

## Resolution semantics

Conflicts are **detected**, not deleted. The detector flow runs on a
5-minute interval and:

- If a conflict is **still present** → update `cr_last_detected_at`.
- If a conflict is **no longer present** (resource freed up, AOG
  resolved) → keep the row, but `cr_last_detected_at` stays at the last
  detection. The canvas filters "active conflicts" by
  `cr_last_detected_at >= utcNow() - 30 minutes`.
- If a user **acknowledges** → set `cr_acknowledged_by` +
  `cr_acknowledged_at`. Acknowledged conflicts drop off the alert feed
  but stay in history.

No manual delete — the detector flow owns the lifecycle.

## Permissions

- **Read:** RMM (BU), Director, QA, Scheduler (Org).
- **Create / Update Last Detected At:** Service account only (the
  detector flow).
- **Update Acknowledged By / Acknowledged At:** RMM, Director, QA,
  Scheduler.
- **Delete:** Director only (rare — manual cleanup of orphaned conflicts).

## Indexes

- `cr_severity` — dashboard sort.
- `cr_last_detected_at` — active conflicts filter.
- `cr_acknowledged_at` — unacknowledged-only views.

## Seed data

Populate from `m365-solution/sharepoint-lists/10-conflicts.csv`.
**3 seed rows** showing each Type variant.
