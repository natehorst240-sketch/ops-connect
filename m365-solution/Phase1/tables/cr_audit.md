# Table: `cr_audit`

Write-only table that captures every state transition on `cr_mx_request`.
The Power Automate flow writes one audit row per Approve, Deny, Escalate,
or Cancel action. Read access is granted to QA and Director roles only.

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
| `cr_actor`               | Actor                | Lookup → `systemuser`      | Yes      | Who caused the event.                                                          |
| `cr_actor_role`          | Actor role           | Text (32)                  | Yes      | `AMT`, `RMM`, `Director`, `System`. Snapshot of role at the time.              |
| `cr_action`              | Action               | Choice                     | Yes      | See § *Choice values* below.                                                  |
| `cr_subject_table`       | Subject table        | Text (32)                  | Yes      | E.g., `cr_mx_request`. Forward-looking for Phase 2 multi-table audit.          |
| `cr_subject_id`          | Subject ID           | Text (50)                  | Yes      | Dataverse GUID of the row being audited.                                       |
| `cr_correlation`         | Audit correlation    | Text (50)                  | Yes      | Joins to `cr_mx_request.cr_audit_correlation`. One per request lifecycle.       |
| `cr_metadata`            | Metadata             | Multiline text (4000)      | No       | JSON blob with full state transition payload. See § *Metadata schema* below.   |
| `cr_comment`             | Comment              | Text (500)                 | No       | The decision comment from the Adaptive Card, when applicable.                   |
| `cr_retention_until`     | Retention until      | Date and time              | Yes      | `addDays(utcNow(), env('mx_audit_retention_days'))`. Purview enforces.         |
| `createdon`              | Created on           | Date and time              | System   | Built-in.                                                                      |
| `createdby`              | Created by           | Lookup → `systemuser`      | System   | Built-in. Equal to `cr_actor` on writes from the flow's service principal.     |

## Choice values

### `cr_action`

| Label                          | Value | Notes                                                          |
| ------------------------------ | ----- | -------------------------------------------------------------- |
| `mx_request.submitted`         | 1     | New row added by the canvas app.                               |
| `mx_request.approved`          | 2     | RMM clicked Approve.                                           |
| `mx_request.denied`            | 3     | RMM clicked Deny.                                              |
| `mx_request.cancelled`         | 4     | AMT cancelled before decision.                                 |
| `mx_request.escalated`         | 5     | Auto-escalated past timeout to Director.                       |
| `mx_request.outlook_created`   | 6     | Outlook calendar event created on approval.                    |
| `mx_request.outlook_cancelled` | 7     | Outlook event cancelled (Phase 2 + cancellation flow).         |

## Metadata schema

The `cr_metadata` column holds a JSON blob with the full transition payload.
Kept as text (not JSON column) for portability; flows compose with
`json()`. Example for `mx_request.approved`:

```json
{
  "from_status": "Submitted",
  "to_status": "Approved",
  "approver": {
    "id": "a1b2c3d4-...",
    "name": "Steve Taul",
    "role": "RMM",
    "region": "Logan"
  },
  "request": {
    "number": "MXR-00012",
    "tail": "N431HC",
    "type": "Phase Inspection",
    "window_start": "2026-04-29T07:00:00Z",
    "window_end": "2026-04-30T17:00:00Z"
  },
  "comment": "Approved — coordinated with N251HC.",
  "outlook_event_id": "AAMkAGI3...",
  "flow_run_id": "08585..."
}
```

## Auditing settings

- **Enable Auditing on this table** as well — yes, audit the audit table.
  Catches anyone tampering with audit rows.
- Set `cr_retention_until` per-row to today + `mx_audit_retention_days`.
  Microsoft Purview retention policy uses this column.
- **Restrict Read** to `MXC Director` and `MXC QA` roles. AMTs and RMMs
  see their *own* audit via the canvas app's history view (Phase 2);
  they don't get raw table access.

## Indexes

- `cr_correlation` — frequently joined.
- `cr_event_at` — most queries are time-windowed.
- `cr_action` — used in dashboards (Phase 3).
