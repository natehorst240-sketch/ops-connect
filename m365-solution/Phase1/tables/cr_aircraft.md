# Table: `cr_aircraft`

Fleet master. 61 real tails. Holds the *current* status; status history
lives in `cr_aircraft_status_log`.

## Display name

**Aircraft**

## Schema name

`cr_aircraft`

## Primary column

`cr_tail` — Text (8). E.g., `N431HC`. Primary column.

## Columns

| Schema name              | Display              | Type                       | Required | Default     | Notes                                                          |
| ------------------------ | -------------------- | -------------------------- | -------- | ----------- | -------------------------------------------------------------- |
| `cr_tail`                | Tail                 | Text (8)                   | Yes      | —           | E.g., `N431HC`. Primary column.                                |
| `cr_type_id`             | Type                 | Lookup → `cr_aircraft_type` | Yes    | —           |                                                                |
| `cr_make`                | Make                 | Text (32)                  | No       | —           | Denormalized from Type for fast Adaptive Card render.          |
| `cr_model`               | Model                | Text (32)                  | No       | —           | Denormalized from Type.                                         |
| `cr_serial_number`       | Serial number        | Text (32)                  | No       | —           |                                                                |
| `cr_aircraft_class`      | Aircraft class       | Choice                     | No       | —           | `Rotary` / `Fixed Wing`. Denormalized.                         |
| `cr_base_id`             | Base                 | Lookup → `cr_base`         | No       | —           | Spare aircraft = blank.                                        |
| `cr_region_id`           | Region               | Lookup → `cr_region`       | No       | —           |                                                                |
| `cr_rmm`                 | RMM                  | Lookup → `systemuser`      | No       | —           | Maintenance lead for this tail. Drives flow channel routing.   |
| `cr_status`              | Status               | Choice                     | Yes      | In Service  | See § *Choice values* below.                                  |
| `cr_status_reason`       | Status reason        | Text (200)                 | No       | —           | Why current status (e.g., "Tail rotor gearbox chip light").    |
| `cr_status_updated_at`   | Status updated at    | Date and time              | No       | —           | Set on every Status submission.                                |
| `cr_status_updated_by`   | Status updated by    | Lookup → `systemuser`      | No       | —           | Set on every Status submission.                                |

## Choice values

### `cr_status`

| Label            | Value | Notes                                                       |
| ---------------- | ----- | ----------------------------------------------------------- |
| In Service       | 1     | Default.                                                    |
| AOG              | 2     | Aircraft on Ground; auto-bulletin Alert posted.             |
| Maintenance      | 3     | In active maintenance window.                               |
| Away from Base   | 4     | Out on a mission or repositioning.                          |
| Unavailable      | 5     | Generic unavailable for ops.                                |
| Spare            | 6     | Spare / no permanent base assigned.                         |

## Permissions

- **Read:** All app users (regional scoping by BU for AMT/RMM).
- **Create:** Director, DOM, Scheduler.
- **Update Status / Status Reason / Updated At/By:** AMT, RMM, Director, QA, Supervisor.
- **Update other fields:** Director, DOM, Scheduler.
- **Delete:** Director only (rare — retired tails).

## Auto-bulletin on AOG

A flow watches `cr_status` and on transition to `AOG`, auto-creates an
Active Alert in `cr_operational_bulletin`. Subject:
`'{Tail} AOG — {Base}'`. Body inherits `cr_status_reason`.

## Indexes

- `cr_status` — frequently filtered (AOG count, dashboards).
- `cr_base_id` — base-scoped views.
- `cr_region_id` — region-scoped views.
- `cr_rmm` — RMM approval routing.

## Seed data

Populate from `m365-solution/sharepoint-lists/04-aircraft.csv`. 61 rows.
