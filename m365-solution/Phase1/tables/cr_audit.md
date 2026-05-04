# Table: `cr_audit`

Write-only table that captures every state transition across all Phase 1
modules. The Power Automate flow writes audit rows on every state change
in MX Requests, Operational Bulletins, Safety Reports, Aircraft Status,
and Personnel Status.

This table sits *next to* the Dataverse built-in audit log — it doesn't
replace it. Built-in audit captures every column change automatically;
`cr_audit` captures business events with the *why* attached.

## Display name

**MX Audit**

## Schema name

`cr_audit`

## Primary column

`cr_audit_id` — Autonumber, format `AUD-{SEQNUM:000000}`. No business
meaning; just for joins.

## Columns

| Schema name              | Display              | Type                       | Required | Notes                                                                          |
| ------------------------ | -------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------ |
| `cr_audit_id`            | Audit ID             | Autonumber                 | System   | Format `AUD-{SEQNUM:000000}`. Primary column.                                  |
| `cr_event_at`            | Event timestamp      | Date and time              | Yes      | UTC. `utcNow()` from the flow.                                                 |
| `cr_actor`               | Actor                | Lookup → `systemuser`      | Yes      | Who caused the event. May be the service account on anonymous safety writes.  |
| `cr_actor_role`          | Actor role           | Text (32)                  | Yes      | `AMT`, `RMM`, `Director`, `QA`, `Pilot`, `Scheduler`, `PR`, `System`. Snapshot. |
| `cr_action`              | Action               | Choice                     | Yes      | See § *Choice values* below.                                                  |
| `cr_subject_table`       | Subject table        | Text (40)                  | Yes      | E.g., `cr_mx_request`, `cr_operational_bulletin`, `cr_safety_report`.          |
| `cr_subject_id`          | Subject ID           | Text (50)                  | Yes      | Dataverse GUID of the row being audited.                                       |
| `cr_correlation`         | Audit correlation    | Text (50)                  | Yes      | Joins to the subject row's `cr_audit_correlation`.                             |
| `cr_metadata`            | Metadata             | Multiline text (4000)      | No       | JSON blob with full state transition payload.                                  |
| `cr_comment`             | Comment              | Text (500)                 | No       | The decision comment / resolution note / acknowledgment text, when applicable. |
| `cr_retention_until`     | Retention until      | Date and time              | Yes      | `addDays(utcNow(), env('mx_audit_retention_days'))`. Purview enforces.         |
| `createdon`              | Created on           | Date and time              | System   | Built-in.                                                                      |
| `createdby`              | Created by           | Lookup → `systemuser`      | System   | Built-in. Equal to `cr_actor` on writes from the flow's service principal.     |

## Choice values

### `cr_action` — full enum

| Label                              | Value | Subject table                  | Notes                                                |
| ---------------------------------- | ----- | ------------------------------ | ---------------------------------------------------- |
| `mx_request.submitted`             | 1     | `cr_mx_request`                | New row added by the canvas app.                     |
| `mx_request.approved`              | 2     | `cr_mx_request`                | Approver clicked Approve.                            |
| `mx_request.denied`                | 3     | `cr_mx_request`                | Approver clicked Deny.                               |
| `mx_request.cancelled`             | 4     | `cr_mx_request`                | Submitter cancelled before decision.                 |
| `mx_request.escalated`             | 5     | `cr_mx_request`                | Manually escalated or auto-escalated past timeout.   |
| **`mx_request.more_info_requested`** | 6   | `cr_mx_request`                | Approver asked for more info.                        |
| **`mx_request.comment_added`**     | 7     | `cr_mx_request`                | Reply posted to Ask Leadership thread.               |
| `mx_request.outlook_created`       | 10    | `cr_mx_request`                | Outlook calendar event created on approval.          |
| `mx_request.outlook_cancelled`     | 11    | `cr_mx_request`                | Outlook event cancelled (Phase 2).                   |
| **`bulletin.posted`**              | 20    | `cr_operational_bulletin`      | New bulletin posted by RMM/Director/QA.              |
| **`bulletin.resolved`**            | 21    | `cr_operational_bulletin`      | Resolution Notes written; Status → Resolved.         |
| **`bulletin.permanently_deleted`** | 22    | `cr_operational_bulletin`      | Director-only hard delete.                           |
| **`safety_report.submitted`**      | 30    | `cr_safety_report`             | New safety report (named or anonymous).              |
| **`safety_report.acknowledged`**   | 31    | `cr_safety_report`             | Manager acknowledged.                                |
| **`safety_report.escalated`**      | 32    | `cr_safety_report`             | Escalated to Director.                               |
| **`safety_report.closed`**         | 33    | `cr_safety_report`             | Action Taken filled; Status → Closed.                |
| **`aircraft.status_changed`**      | 40    | `cr_aircraft`                  | Aircraft status submission.                          |
| **`personnel.status_changed`**     | 50    | `cr_personnel_maintenance`     | Personnel status submission (Available/Unavail/Red). |
| **`personnel.reassigned`**         | 51    | `cr_personnel_maintenance`     | Manager reassigned tech to a different base.         |
| **`personnel.shift_toggled`**      | 52    | `cr_personnel_maintenance`     | On Shift / Off Shift toggle.                         |

**Bold** rows are new in the role-capability-matrix expansion.

## Metadata schema

The `cr_metadata` column holds a JSON blob with the full transition
payload. Kept as text (not a JSON column type) for portability; flows
compose with `json()`. Example for `mx_request.approved`:

```json
{
  "from_status": "Submitted",
  "to_status": "Approved",
  "decision": "Approve",
  "approver": {
    "id": "a1b2c3d4-...",
    "name": "Steve Taul",
    "role": "RMM",
    "region": "Logan"
  },
  "request": {
    "number": "MXR-00012",
    "tail": "N431HC",
    "type": "MX Schedule",
    "window_start": "2026-04-29T07:00:00Z",
    "window_end": "2026-04-30T17:00:00Z"
  },
  "comment": "Approved — coordinated with N251HC.",
  "outlook_event_id": "AAMkAGI3...",
  "flow_run_id": "08585..."
}
```

For `bulletin.resolved`:

```json
{
  "from_status": "Active",
  "to_status": "Resolved",
  "resolver": { "id": "...", "name": "…", "role": "RMM" },
  "resolution_notes": "Parts arrived; aircraft returned to service.",
  "original_post": { "level": "Alert", "subject": "N291HC AOG…", "posted_at": "…" }
}
```

For `personnel.reassigned`:

```json
{
  "personnel": { "id": "...", "name": "…" },
  "from_base": "Logan",
  "to_base": "St. George",
  "manager": { "id": "...", "name": "…", "role": "RMM" },
  "effective_at": "2026-05-01T00:00:00Z",
  "reason": "Coverage gap during May vacation."
}
```

## Auditing settings

- **Enable Auditing on this table** as well — yes, audit the audit table.
  Catches anyone tampering with audit rows.
- Set `cr_retention_until` per-row to today + `mx_audit_retention_days`.
  Microsoft Purview retention policy uses this column.
- **Restrict Read** to `MXC Director` and `MXC QA` roles by default. AMTs
  and RMMs see their *own* audit via the canvas app's history view
  (filtered by `cr_correlation` joining their submitted requests); they
  don't get raw table access.

## Indexes

- `cr_correlation` — frequently joined.
- `cr_event_at` — most queries are time-windowed.
- `cr_action` — used in dashboards (Phase 3).
- `cr_subject_table` + `cr_subject_id` — used to walk all events for a
  given subject row.
