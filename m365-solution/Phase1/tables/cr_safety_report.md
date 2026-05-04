# Table: `cr_safety_report`

Anonymous-friendly safety concern reporting. Stored separately from
`cr_mx_request` because retention is permanent (never deleted) and
item-level security is stricter (anonymous reporters cannot read back).

## Display name

**Safety Report**

## Schema name

`cr_safety_report`

## Primary column

`cr_report_id` — Autonumber, format `SAF-{SEQNUM:000000}`.

## Ownership + scope

- **Ownership:** User-owned (when named) or service-account owned (when anonymous).
- **Business unit scoping:** Yes — RMM regional triage scopes via BU.

## Columns

| Schema name             | Display              | Type                       | Required | Default     | Notes                                                              |
| ----------------------- | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------------ |
| `cr_report_id`          | Report ID            | Autonumber                 | System   | —           | Format `SAF-{SEQNUM:000000}`. Primary column.                      |
| `cr_subject`            | Subject              | Text (200)                 | Yes      | —           |                                                                    |
| `cr_body`               | Body                 | Multiline text (8000)      | Yes      | —           | The concern in detail.                                             |
| `cr_severity`           | Severity             | Choice                     | Yes      | Medium      | `Low` / `Medium` / `High` / `Critical`.                            |
| `cr_status`             | Status               | Choice                     | Yes      | Submitted   | `Submitted` / `Acknowledged` / `Investigating` / `Escalated` / `Closed`. |
| `cr_anonymous`          | Anonymous            | Yes/No                     | Yes      | No          | Drives owner-rewrite + DM-back skip in flow.                       |
| `cr_reporter`           | Reporter             | Lookup → `systemuser`      | Yes      | `User()`    | When `cr_anonymous = true`, flow rewrites to service account.      |
| `cr_reporter_display_name` | Reporter display | Text (100)                 | No       | —           | Blank when Anonymous.                                              |
| `cr_region_id`          | Region               | Lookup → `cr_region`       | No       | —           |                                                                    |
| `cr_base_id`            | Base                 | Lookup → `cr_base`         | No       | —           |                                                                    |
| `cr_aircraft_id`        | Aircraft             | Lookup → `cr_aircraft`    | No       | —           | Tail involved, if any.                                             |
| `cr_submitted_at`       | Submitted at         | Date and time              | Yes      | `utcNow()`  |                                                                    |
| `cr_acknowledged_by`    | Acknowledged by      | Lookup → `systemuser`      | No       | —           | Set on Acknowledge action.                                         |
| `cr_acknowledged_at`    | Acknowledged at      | Date and time              | No       | —           |                                                                    |
| `cr_action_taken`       | Action taken         | Multiline text (4000)      | No       | —           | Filled at Close.                                                   |
| `cr_closed_at`          | Closed at            | Date and time              | No       | —           |                                                                    |
| `cr_closed_by`          | Closed by            | Lookup → `systemuser`      | No       | —           |                                                                    |
| `cr_escalated_to`       | Escalated to         | Lookup → `systemuser`      | No       | —           | Set on Escalate to Director action.                                |
| `cr_audit_correlation`  | Audit correlation ID | Text (50)                  | Yes      | `GUID()`    | Joins all audit rows for this report.                               |
| `createdon` / `modifiedon` / `createdby` | (system) | Date / Lookup       | System   | —           | Built-in.                                                           |

## Anonymous handling (in `safety-report-triage-flow`)

On create where `cr_anonymous = true`:

1. Set `cr_reporter` to the service account `mx-anonymous@ihc.org`
2. Clear `cr_reporter_display_name`
3. Re-assign the row's owner to the service account (Dataverse `Assign`
   action) so the original submitter loses owner-row read rights
4. Skip the requestor-DM step
5. Write audit with `cr_actor = mx-anonymous@ihc.org`

## Permissions

- **Create:** All roles (matrix § Submit row — even Payroll).
- **Read:** Reporters can read own only when not anonymous. RMM /
  Director / QA can read all. Anonymous rows visible only to RMM /
  Director / QA — never to the original submitter.
- **Acknowledge / Investigate / Close:** RMM (regional), Director, QA.
- **Escalate:** RMM, QA. Sets `cr_escalated_to` and reroutes to Director.

## Retention

**Permanent.** Per HIPAA + IHC safety policy, safety reports never
delete. Set `mx_safety_retention_days = -1` (sentinel for "never") and
the Purview policy excludes this table.

## Indexes

- `cr_status` — dashboard filter on open reports.
- `cr_severity` — dashboard sort.
- `cr_submitted_at` — chronological.
- `cr_anonymous` — separates anonymous triage queue.
