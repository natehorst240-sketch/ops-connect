# Table: `cr_aircraft_status_log`

Append-only history of every change to `cr_aircraft.cr_status`. The
Aircraft table itself holds only the current state; this log holds the
full history with reason + actor.

## Display name

**Aircraft Status Log**

## Schema name

`cr_aircraft_status_log`

## Primary column

`cr_log_id` — Autonumber, format `ACS-{SEQNUM:000000}`.

## Columns

| Schema name              | Display              | Type                       | Required | Notes                                          |
| ------------------------ | -------------------- | -------------------------- | -------- | ---------------------------------------------- |
| `cr_log_id`              | Log ID               | Autonumber                 | System   | Format `ACS-{SEQNUM:000000}`.                   |
| `cr_aircraft_id`         | Aircraft             | Lookup → `cr_aircraft`    | Yes      |                                                |
| `cr_previous_status`     | Previous status      | Choice                     | No       | Same enum as `cr_aircraft.cr_status`. Null on first row. |
| `cr_new_status`          | New status           | Choice                     | Yes      | Same enum as `cr_aircraft.cr_status`.          |
| `cr_status_reason`       | Status reason        | Text (500)                 | No       | Why the change.                                |
| `cr_changed_at`          | Changed at           | Date and time              | Yes      | UTC.                                           |
| `cr_changed_by`          | Changed by           | Lookup → `systemuser`      | Yes      |                                                |
| `cr_audit_correlation`   | Audit correlation ID | Text (50)                  | Yes      | Joins to `cr_audit` row.                        |

## Permissions

- **Create:** AMT, RMM, Director, QA, Supervisor (canvas writes one
  row per Aircraft.Status submission).
- **Read:** All roles except Pilot, PR, Payroll.
- **Update / Delete:** None. Append-only.

## Indexes

- `cr_aircraft_id` — most queries are per-tail.
- `cr_changed_at` — chronological.
