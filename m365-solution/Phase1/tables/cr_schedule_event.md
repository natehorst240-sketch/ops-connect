# Table: `cr_schedule_event`

**Phase 2 canonical.** External-system schedule mirror. Aggregates events
from CompleteFlight + ProteanHub via Power Automate sync flows so the
MX Tracking calendar can show one unified view.

> **Not part of Phase 1.** Phase 1 doesn't have the custom connectors
> for CompleteFlight / ProteanHub. The seed data in the CSV exists for
> Phase 2 development reference.

## Display name

**Schedule Event**

## Schema name

`cr_schedule_event`

## Primary column

`cr_event_id` — Text (24). Format `EVT-NNNNNN` (e.g., `EVT-000001`).
Written by the sync flow on row creation.

## Columns

Matches `m365-solution/sharepoint-lists/08-schedule-events.csv` (5 seed
rows):

| Schema name              | Display              | Type                       | Required | Notes                                                                                |
| ------------------------ | -------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------ |
| `cr_event_id`            | Event ID             | Text (24)                  | Yes      | Format `EVT-NNNNNN`. Primary column. Written by sync flow.                          |
| `cr_source_system`       | Source System        | Choice                     | Yes      | `CompleteFlight` / `ProteanHub`. Phase 3 may add `SkyRouter` for flight events.     |
| `cr_source_event_id`     | Source Event ID      | Text (40)                  | Yes      | The external system's primary key. E.g., `CF-12345`, `PH-67890`.                    |
| `cr_aircraft_tail`       | Aircraft Tail        | Lookup → `cr_aircraft`     | No       | Required for tail-tied events. Optional for org-wide entries.                       |
| `cr_event_type`          | Event Type           | Choice                     | Yes      | See § *Choice values*.                                                              |
| `cr_label`               | Label                | Text (200)                 | Yes      | Human-readable summary. E.g., `O2 bottle exchange`, `Pilot recurrent training`.     |
| `cr_window_start`        | Window Start         | Date and time              | Yes      | UTC.                                                                                |
| `cr_window_end`          | Window End           | Date and time              | Yes      | UTC.                                                                                |
| `cr_priority`            | Priority             | Choice                     | Yes      | `Normal` / `High` / `Critical`. CSV uses Critical for AOG events.                    |
| `cr_base`                | Base                 | Text (50)                  | No       | Free-text; CSV has values like `IMED Hangar, UT` or `Unassigned`.                    |
| `cr_source_url`          | Source URL           | URL                        | No       | Deep-link back to the external system row.                                          |
| `cr_last_synced_at`      | Last Synced At       | Date and time              | Yes      | When the sync flow last touched this row. Used to detect stale data.                |

## Choice values

### `cr_source_system`

| Label          | Value | Notes                                          |
| -------------- | ----- | ---------------------------------------------- |
| CompleteFlight | 1     | CSV: 2 of 5 seed rows.                          |
| ProteanHub     | 2     | CSV: 3 of 5 seed rows.                          |

### `cr_event_type`

| Label       | Value | Notes                                                  |
| ----------- | ----- | ------------------------------------------------------ |
| inspection  | 1     | CompleteFlight inspections.                            |
| mx          | 2     | ProteanHub maintenance windows.                        |
| aog         | 3     | AOG records mirrored from ProteanHub.                  |
| training    | 4     | CompleteFlight pilot training events.                  |

Labels are lowercase by CSV convention (event-name style). They
appear in audit metadata + URL slugs.

### `cr_priority`

| Label    | Value | Notes                                                |
| -------- | ----- | ---------------------------------------------------- |
| Normal   | 1     | CSV: 3 of 5 seed rows.                                |
| High     | 2     | CSV: 1 of 5 rows.                                     |
| Critical | 3     | CSV: 1 of 5 rows. Used for AOG events.                |

## Why this is separate from `cr_mx_request`

MX Requests are **internal** — submitted by AMTs and decided by RMMs
via the canvas app. Schedule Events are **external** — mirrored from
CompleteFlight/ProteanHub by sync flows. The MX Tracking calendar
shows both as a unified view, but the data sources, primary keys
(`MXR-*` vs `EVT-*`), and write paths are different.

A Phase 2 join view aligns approved `cr_mx_request` rows with their
created `cr_schedule_event` rows where applicable, but the two tables
don't share a primary key.

## Permissions

- **Read:** All app users.
- **Create / Update:** Service account only (the sync flow). No user
  edits — the source of truth is the external system.
- **Delete:** Service account on stale-row cleanup.

## Indexes

- `cr_window_start` + `cr_window_end` — calendar queries.
- `cr_aircraft_tail` — per-tail Gantt rows.
- `cr_source_system` + `cr_source_event_id` — composite, used by sync flow upsert.
- `cr_last_synced_at` — stale-row detection.

## Seed data

Populate from `m365-solution/sharepoint-lists/08-schedule-events.csv`.
**5 seed rows** for development.
