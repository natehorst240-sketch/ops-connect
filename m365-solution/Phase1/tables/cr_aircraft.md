# Table: `cr_aircraft`

Fleet master. **61 real tails** per the canonical CSV.

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
| `cr_type`                | Type                 | Lookup → `cr_aircraft_type` | Yes    | —           | All 61 rows have a Type in the CSV.                            |
| `cr_make`                | Make                 | Text (32)                  | No       | —           | Denormalized from Type for fast Adaptive Card render.          |
| `cr_model`               | Model                | Text (32)                  | No       | —           | Denormalized from Type.                                         |
| `cr_serial_number`       | Serial Number        | Text (32)                  | No       | —           | E.g., `22221`, `BB-1952`.                                      |
| `cr_aircraft_class`      | Aircraft Class       | Choice                     | No       | —           | `Rotary` / `Fixed Wing`. Denormalized from Type.               |
| `cr_base`                | Base                 | Text (50)                  | No       | —           | Free-text in CSV. Values: a `cr_base.cr_title`, OR `Spare`, OR `Unassigned`, OR `NC Region (TBD)`, OR `WI Region (TBD)`. Phase 2: convert to Lookup once TBDs are resolved. |
| `cr_region`              | Region               | Text (16)                  | No       | —           | Free-text in CSV. Spares have `—`. Phase 2: convert to Lookup.  |
| `cr_rmm`                 | RMM                  | Text (60)                  | No       | —           | CSV stores RMM as a name string (e.g., `Nate Horstmeier`). Phase 2: convert to Lookup → `systemuser`. |
| `cr_status`              | Status               | Choice                     | Yes      | In Service  | See § *Choice values*. Canonical CSV uses `In Service` and `Spare` only.   |
| `cr_status_reason`       | Status Reason        | Text (200)                 | No       | —           | Why current status. CSV is empty for all 61 rows.              |

**Why Base / Region / RMM are Text in the canonical schema:** the CSV
has non-Lookup-compatible values (`Spare`, `Unassigned`, `NC Region
(TBD)`, `WI Region (TBD)`, `—`, free-text names). Strict-Lookup would
reject those rows. Phase 1 keeps these as text to import the CSV
data as-is; Phase 2 cleans up TBDs and converts to Lookups.

## Choice values

### `cr_status`

The CSV uses only `In Service` and `Spare`. The other four are
legitimate states the system needs to handle but aren't in seed data.

| Label            | Value | Notes                                                       |
| ---------------- | ----- | ----------------------------------------------------------- |
| In Service       | 1     | Default. Used for 56 of 61 rows in CSV.                     |
| Spare            | 6     | Spare / no permanent base assigned. Used for 5 of 61 rows.  |
| AOG              | 2     | Aircraft on Ground. Not in CSV but supported by the model.  |
| Maintenance      | 3     | In active maintenance window. Not in CSV.                   |
| Away from Base   | 4     | Out on a mission. Not in CSV.                               |
| Unavailable      | 5     | Generic unavailable. Not in CSV.                            |

### `cr_aircraft_class`

| Label       | Value |
| ----------- | ----- |
| Rotary      | 1     |
| Fixed Wing  | 2     |

## Permissions

- **Read:** All app users.
- **Create:** Director, DOM, Scheduler.
- **Update Status / Status Reason:** AMT, RMM, Director, QA, Supervisor.
- **Update other fields:** Director, DOM, Scheduler.
- **Delete:** Director only (rare — retired tails).

## Indexes

- `cr_status` — frequently filtered.
- `cr_region` — region-scoped views.
- `cr_rmm` — RMM approval routing.

## Seed data

Populate from `m365-solution/sharepoint-lists/04-aircraft.csv`. **61 rows.**

Real tails. RMMs are stored as text names matching personnel rows by
full name: Martin Hodo, Tevita Silatolu, John Cutright, Sean Brown,
Dwight Brooks, Chris Gibson, Nate Horstmeier, Scott Winberg, Casey
Stockall, Chris Eells. Spares (5 rows) have blank RMM.
