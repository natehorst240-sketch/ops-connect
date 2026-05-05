# Table: `cr_aircraft_status_log`

> **⚠️ EXTENSION TABLE — NOT IN CANONICAL CSV.**
>
> This table was added during the role-capability-matrix expansion
> (MC Documentation v3). It does **not** appear in
> `m365-solution/sharepoint-lists/` and has no canonical seed data.
>
> **Don't build this table for the canonical Phase 1 deployment.** The
> canonical 11 tables cover the documented IHC requirements. This
> table is reserved for the **Status module** from the role matrix —
> append-only history of every Aircraft.Status change.
>
> If you proceed with this table, treat the spec as speculative —
> column names + Choice enums are not validated against real IHC data.

---

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
