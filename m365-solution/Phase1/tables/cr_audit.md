# Table: `cr_audit`

Write-only table. Every state transition on `cr_mx_request` writes one
audit row. Read access restricted to QA + Director.

## Display name

**MX Audit**

## Schema name

`cr_audit`

## Primary column

The modern maker only allows Text for primary columns at create time,
so Phase 1 uses a two-column pattern (same as `cr_mx_request`):

- **Primary column (Dataverse-required):** `cr_audit_label` —
  Text(100), Optional. Not used by Phase 1 logic. Optional backfill
  by the flow for human-readable default views.
- **Business-ID column (used everywhere):** `cr_audit_id` —
  **Autonumber**, prefix `AUD-`, minimum digit count `6`, seed `1`.
  Format produces `AUD-000001`. No business meaning; used for joins
  and as the row identifier in audit-log views.

Add `cr_audit_label` first (during table creation), then add
`cr_audit_id` as a regular Autonumber column after the table is saved.

## Columns

Matches `m365-solution/sharepoint-lists/07-audit-log.csv` (5 seed rows):

| Schema name              | Display              | Type                       | Required | Notes                                                                          |
| ------------------------ | -------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------ |
| `cr_audit_label`         | Audit Label          | Text (100)                 | Optional | Primary column. Dataverse-required only; not used by logic.                    |
| `cr_audit_id`            | Audit ID             | Autonumber                 | System   | Prefix `AUD-`, min 6 digits. Produces `AUD-000001`. Business-ID, used in joins. |
| `cr_event_at`            | Event At             | Date and time              | Yes      | UTC. `utcNow()` from the flow.                                                 |
| `cr_actor`               | Actor                | Text (60)                  | Yes      | Name string per CSV. May be `System` for auto-actions. Phase 2: Lookup → `systemuser`. |
| `cr_actor_role`          | Actor Role           | Text (32)                  | Yes      | `AMT`, `RMM`, `Director`, `QA`, `System`. CSV also has `Supervisor / RMM` for cross-role users (Sean Brown). |
| `cr_action`              | Action               | Choice                     | Yes      | See § *Choice values*. Canonical 7 actions cover the 4 decisions + submit + cancel + outlook.created. |
| `cr_subject_table`       | Subject Table        | Text (40)                  | Yes      | The plural display name. CSV uses `MX Requests`.                              |
| `cr_subject_id`          | Subject ID           | Text (50)                  | Yes      | The subject row's primary identifier. CSV uses request number like `MXR-00001` (not GUID). |
| `cr_audit_correlation`   | Audit Correlation    | Text (50)                  | Yes      | Joins to `cr_mx_request.cr_audit_correlation`.                                  |
| `cr_comment`             | Comment              | Text (500)                 | No       | The decision comment, when applicable.                                         |
| `cr_metadata`            | Metadata             | Multiline text (4000)      | No       | JSON blob with full transition payload.                                        |
| `cr_retention_until`     | Retention Until      | Date and time              | Yes      | `addDays(utcNow(), 2555)` = 7 years HIPAA. CSV uses `5/2/2033 09:30` format.  |
| `createdon`              | Created on           | Date and time              | System   | Built-in.                                                                      |
| `createdby`              | Created by           | Lookup → `systemuser`      | System   | Built-in. Equal to flow's service principal.                                    |

**Why Actor is Text not Lookup:** the canonical CSV stores actor as a
name string (e.g., `Mason Littledike`, `Nate Horstmeier`, `System`).
This matches the requirement that audit rows survive even if the
actor's `systemuser` row is later deactivated. Phase 2 may add a
parallel `cr_actor_user` Lookup column for live joins, while keeping
`cr_actor` as the immutable text snapshot.

## Choice values

### `cr_action` — canonical Phase 1

| Label                              | Value | Subject Table   | Notes                                                            |
| ---------------------------------- | ----- | --------------- | ---------------------------------------------------------------- |
| `mx_request.submitted`             | 1     | `MX Requests`   | New row added by canvas. CSV: 1 row.                             |
| `mx_request.approved`              | 2     | `MX Requests`   | Approver clicked Approve. CSV: 2 rows.                           |
| `mx_request.denied`                | 3     | `MX Requests`   | Approver clicked Deny. CSV: 1 row.                               |
| `mx_request.escalated`             | 4     | `MX Requests`   | Approver clicked Escalate, OR auto-escalated past 24h timeout. CSV: 1 row. |
| `mx_request.returned`              | 5     | `MX Requests`   | Approver clicked Return (request more info). Not in seed.        |
| `mx_request.cancelled`             | 6     | `MX Requests`   | Submitter cancelled. Not in seed but supported.                   |
| `mx_request.outlook_created`       | 10    | `MX Requests`   | Outlook calendar event created on Approved.                       |

### `cr_action` — extension (NOT in canonical CSV)

The role-matrix extension adds these. Don't add unless you've opted
into the extension scope.

| Label                              | Value | Subject Table                  |
| ---------------------------------- | ----- | ------------------------------ |
| `mx_request.comment_added`         | 7     | `MX Requests`                  |
| `bulletin.posted`                  | 20    | `Operational Bulletins`        |
| `bulletin.resolved`                | 21    | `Operational Bulletins`        |
| `bulletin.permanently_deleted`     | 22    | `Operational Bulletins`        |
| `safety_report.submitted`          | 30    | `Safety Reports`               |
| `safety_report.acknowledged`       | 31    | `Safety Reports`               |
| `safety_report.escalated`          | 32    | `Safety Reports`               |
| `safety_report.closed`             | 33    | `Safety Reports`               |
| `aircraft.status_changed`          | 40    | `Aircraft`                     |
| `personnel.status_changed`         | 50    | `Personnel - Maintenance`      |
| `personnel.reassigned`             | 51    | `Personnel - Maintenance`      |
| `personnel.shift_toggled`          | 52    | `Personnel - Maintenance`      |

## Metadata schema

The `cr_metadata` column holds a JSON blob with the full transition
payload. CSV examples:

```json
{ "tail":"N531HC", "type":"Phase Inspection" }
{ "approver":"Nate Horstmeier" }
{ "reason":"coverage gap" }
{ "trigger":"AOG", "escalated_to":"Ryan Taul" }
```

Kept as text (not JSON column type) for portability; flows compose with
`json()`.

## Auditing settings

- **Enable Auditing on this table** as well. Audit the audit. Catches
  tampering.
- Set `cr_retention_until` per row to 7 years from now.
- **Restrict Read** to MXC Director + MXC QA. AMTs and RMMs see their
  own audit via the canvas app's history view (filtered by
  `cr_audit_correlation` joining their own requests).

## Indexes

- `cr_audit_correlation` — frequently joined.
- `cr_event_at` — most queries are time-windowed.
- `cr_action` — used in dashboards.
- `cr_subject_table` + `cr_subject_id` — walk all events for a subject row.

## Seed data

Populate from `m365-solution/sharepoint-lists/07-audit-log.csv`.
**5 seed rows** matching the 6 MX Request seed rows' state transitions.
