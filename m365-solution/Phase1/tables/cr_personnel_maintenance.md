# Table: `cr_personnel_maintenance`

Maintenance roster. ~85 active maintenance personnel: AMTs, supervisors,
RMMs, DOM, QA, Parts, Schedulers.

## Display name

**Personnel — Maintenance**

## Schema name

`cr_personnel_maintenance`

## Primary column

`cr_full_name` — Text (100). `First Last`.

## Columns

| Schema name              | Display              | Type                       | Required | Default     | Notes                                                              |
| ------------------------ | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------------ |
| `cr_full_name`           | Full name            | Text (100)                 | Yes      | —           | `First Last`. Primary column.                                      |
| `cr_first_name`          | First name           | Text (50)                  | Yes      | —           |                                                                    |
| `cr_last_name`           | Last name            | Text (50)                  | Yes      | —           |                                                                    |
| `cr_email`               | Email                | Email                      | Yes      | —           | Joined to `systemuser.internalemailaddress` for app-user lookups.  |
| `cr_phone`               | Phone                | Phone                      | No       | —           | Formatted with hyphens.                                            |
| `cr_role`                | Role                 | Choice                     | Yes      | —           | See § *Choice values*.                                            |
| `cr_region_id`           | Region               | Lookup → `cr_region`       | No       | —           |                                                                    |
| `cr_primary_base_id`     | Primary base         | Lookup → `cr_base`         | No       | —           |                                                                    |
| `cr_coverage_bases`      | Coverage bases       | Multiline text (500)       | No       | —           | Semicolon-delimited base names.                                    |
| `cr_leader`              | Leader               | Lookup → `systemuser`      | No       | —           | Direct manager.                                                    |
| `cr_active`              | Active               | Yes/No                     | Yes      | Yes         |                                                                    |
| `cr_status`              | Status               | Choice                     | No       | Available   | `Available` / `Unavailable` / `Red Status`.                        |
| `cr_status_reason`       | Status reason        | Text (200)                 | No       | —           |                                                                    |
| `cr_status_updated_at`   | Status updated at    | Date and time              | No       | —           |                                                                    |
| `cr_status_updated_by`   | Status updated by    | Lookup → `systemuser`      | No       | —           |                                                                    |
| `cr_on_shift`            | On Shift             | Yes/No                     | No       | No          | User toggles from home screen.                                     |
| `cr_notes`               | Notes                | Multiline text (1000)      | No       | —           |                                                                    |

## Choice values

### `cr_role`

| Label                                  | Value |
| -------------------------------------- | ----- |
| AMT                                    | 1     |
| AMT (Rover)                            | 2     |
| Supervisor                             | 3     |
| RMM                                    | 4     |
| DOM                                    | 5     |
| QA                                     | 6     |
| QA Manager                             | 7     |
| Parts                                  | 8     |
| Scheduler                              | 9     |
| Senior Director Aviation Operations    | 10    |
| ADOM                                   | 11    |

### `cr_status`

| Label       | Value | Notes                                                       |
| ----------- | ----- | ----------------------------------------------------------- |
| Available   | 1     | Default.                                                    |
| Unavailable | 2     | Out, time off, etc.                                         |
| Red Status  | 3     | Health-flagged; only RMM regional + Director DM (privacy).  |

## Permissions

- **Read:** All app users (regional scoping for AMT/RMM via BU).
- **Create / Update general fields:** Director, DOM, RMM (regional), QA.
- **Update Status / On Shift on self:** Self.
- **Update Status on others:** RMM (regional), Director, QA, Supervisor.
- **Reassign (change Primary Base):** RMM (regional), Director, DOM.
- **Delete:** Director, DOM (rare — personnel offboarding).

## Indexes

- `cr_email` — used as the natural key for app user lookups.
- `cr_role` — dashboard filters.
- `cr_region_id` — region scoping.
- `cr_primary_base_id` — base scoping.
- `cr_on_shift` — on-call dashboard.

## Seed data

Populate from `m365-solution/sharepoint-lists/05-personnel-maintenance.csv`.
85 rows.
