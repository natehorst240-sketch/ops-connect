# Table: `cr_personnel_status_log`

Append-only history. Captures three event types: status changes
(Available / Unavailable / Red Status), reassignments (base change),
and shift toggles (On Shift / Off Shift).

## Display name

**Personnel Status Log**

## Schema name

`cr_personnel_status_log`

## Primary column

`cr_log_id` — Autonumber, format `PSL-{SEQNUM:000000}`.

## Columns

| Schema name              | Display              | Type                       | Required | Notes                                                      |
| ------------------------ | -------------------- | -------------------------- | -------- | ---------------------------------------------------------- |
| `cr_log_id`              | Log ID               | Autonumber                 | System   | Format `PSL-{SEQNUM:000000}`.                              |
| `cr_personnel_id`        | Personnel            | Lookup → `cr_personnel_maintenance` | Yes      | Subject person.                                  |
| `cr_action_type`         | Action type          | Choice                     | Yes      | `status_change` / `reassignment` / `shift_toggle`.        |
| `cr_previous_status`     | Previous status      | Choice                     | No       | Same enum as `cr_personnel_maintenance.cr_status`.        |
| `cr_new_status`          | New status           | Choice                     | No       | Blank when Action Type = `reassignment` or `shift_toggle`. |
| `cr_previous_base_id`    | Previous base        | Lookup → `cr_base`        | No       | For reassignments.                                        |
| `cr_new_base_id`         | New base             | Lookup → `cr_base`        | No       | For reassignments.                                        |
| `cr_status_reason`       | Status reason        | Text (500)                 | No       |                                                            |
| `cr_on_shift`            | On Shift             | Yes/No                     | No       | For shift_toggle action type.                             |
| `cr_changed_at`          | Changed at           | Date and time              | Yes      | UTC.                                                       |
| `cr_changed_by`          | Changed by           | Lookup → `systemuser`      | Yes      |                                                            |
| `cr_audit_correlation`   | Audit correlation ID | Text (50)                  | Yes      | Joins to `cr_audit` row.                                   |

## Choice values

### `cr_action_type`

| Label          | Value | Notes                                                              |
| -------------- | ----- | ------------------------------------------------------------------ |
| status_change  | 1     | Available / Unavailable / Red Status submission.                  |
| reassignment   | 2     | Manager moved tech to different base.                              |
| shift_toggle   | 3     | User toggled their own On Shift / Off Shift state.                |

## Permissions

- **Create:** All app users (own shift toggle); managers (others' status / reassignment).
- **Read:** RMM (regional), Director, QA, Scheduler.
- **Update / Delete:** None. Append-only.

## Indexes

- `cr_personnel_id` — per-person history.
- `cr_changed_at` — chronological.
- `cr_action_type` — filter dashboards by event type.
