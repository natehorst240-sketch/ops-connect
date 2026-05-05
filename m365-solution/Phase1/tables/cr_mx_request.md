# Table: `cr_mx_request`

The core Phase 1 table. Every MX Request submitted via the canvas app
lands here. The Power Automate flow reads from + writes to this table.

## Display name

**MX Request**

## Schema name

`cr_mx_request`

## Primary column

`cr_request_number` — **Autonumber**, format `MXR-{SEQNUM:00000}`, seed `1`.
This is the human-readable request ID that appears in Teams DMs and the
Audit Log.

## Ownership + scope

- **Ownership:** User or team owned.
- **Business unit scoping:** Yes — enables RMM regional visibility via
  business unit hierarchy.
- **Activities / Notes / Connections:** off (not used in Phase 1).

---

## Canonical Phase 1 columns

Matches `m365-solution/sharepoint-lists/06-mx-requests.csv` (the 6
seed rows) plus the **4-decision** approval columns plus the
`cr_requested_by_email` companion column the flow needs to DM the
requestor. Build all of these for Phase 1.

| Schema name              | Display              | Type                       | Required | Default     | Notes                                                                                |
| ------------------------ | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------ |
| `cr_request_number`      | Request Number       | Autonumber                 | System   | —           | Format `MXR-{SEQNUM:00000}`. Primary column.                                         |
| `cr_aircraft_tail`       | Aircraft Tail        | Lookup → `cr_aircraft`     | No       | —           | Required for Phase Inspection / Repair / AOG / Open Shift; optional for Time Off.    |
| `cr_aircraft_type`       | Aircraft Type        | Text (40)                  | No       | —           | Denormalized for fast Adaptive Card render. Auto-set on save.                        |
| `cr_request_type`        | Request Type         | Choice                     | Yes      | —           | See § *Choice values*. 6 values: Phase Inspection / Repair / Overhaul / Time Off / Open Shift / AOG. |
| `cr_window_start`        | Window Start         | Date and time              | Yes      | —           | Time zone: User Local. CSV uses `5/4/2026 07:00` format.                              |
| `cr_window_end`          | Window End           | Date and time              | Yes      | —           | Validate End > Start in canvas.                                                       |
| `cr_base`                | Base                 | Lookup → `cr_base`         | No       | —           | Required for aircraft-tied requests; optional for org-wide.                          |
| `cr_reason`              | Reason               | Multiline text (1000)      | No       | —           | What the submitter typed. Surfaces in the Adaptive Card.                              |
| `cr_priority`            | Priority             | Choice                     | Yes      | Normal      | `Normal` / `High` / `AOG`. Priority=AOG forces Routing=Director.                      |
| `cr_status`              | Status               | Choice                     | Yes      | Submitted   | See § *Choice values*. Flow trigger filters on this.                                  |
| `cr_routing`             | Routing              | Choice                     | Yes      | RMM         | `RMM` / `Director`. Drives channel selection in flow.                                |
| `cr_requested_by`        | Requested By         | Text (60)                  | Yes      | —           | CSV stores requestor display name (e.g., `Mason Littledike`). Phase 2: convert to Lookup → `systemuser`. |
| `cr_requested_by_email`  | Requested By Email   | Text (100)                 | No       | —           | UPN / email of the requestor. Set by canvas Patch on submit (`varCurrentUser.Email`). Flow uses this as the Teams DM recipient. CSV seed rows have this blank, so flow DM step skips when empty. |
| `cr_approver`            | Approver             | Text (60)                  | No       | —           | Set by flow on Adaptive Card response (responder display name). Phase 2: convert to Lookup. |
| `cr_decision`            | Decision             | Choice                     | No       | —           | See § *Choice values*. 4 values: Approved / Denied / Escalated / Returned. Set by flow. |
| `cr_decision_reason`     | Decision Reason      | Multiline text (1000)      | No       | —           | Required when Decision = Denied. The written reason.                                  |
| `cr_more_info_request`   | More Info Request    | Multiline text (1000)      | No       | —           | Required when Decision = Returned. The question to the submitter.                    |
| `cr_decided_at`          | Decided At           | Date and time              | No       | —           | UTC. `utcNow()` from the flow.                                                         |
| `cr_decision_comment`    | Decision Comment     | Text (500)                 | No       | —           | Free-text comment from Adaptive Card (any decision).                                  |
| `cr_outlook_event_id`    | Outlook Event ID     | Text (200)                 | No       | —           | Set by flow on Approved. E.g., `AAMkAGI3...`.                                         |
| `cr_audit_correlation`   | Audit Correlation    | Text (50)                  | Yes      | `GUID()`    | Joins `cr_mx_request` rows to their `cr_audit` entries.                              |
| `createdon` / `modifiedon` / `createdby` | (system) | Date / Lookup       | System   | —           | Built-in.                                                                             |

**Why Requested By + Approver are Text in Phase 1:** the canonical CSV
stores them as name strings (e.g., `Mason Littledike`, `Nate Horstmeier`).
Keeping them as Text makes CSV import work without a per-row name →
`systemuser` lookup. Phase 2 normalizes to Lookup → `systemuser`.

**Why a separate `cr_requested_by_email` column:** Teams
`PostMessageToConversation` needs a UPN or user GUID for the
recipient. With `cr_requested_by` as Text, there's no Lookup-style
`_cr_requested_by_value` token to feed Teams. The companion
`cr_requested_by_email` column (set by canvas at submit time from
`varCurrentUser.Email`) gives the flow a stable email to DM. CSV seed
rows imported without this column will have it blank — the flow's DM
actions guard against empty values and skip the DM in that case.

**Note on cr_decision vs cr_status:** `cr_decision` is set when the
approver responds to the Adaptive Card. `cr_status` is then updated as
a consequence. They're correlated but separate:
- Decision = `Approved` → Status = `Approved`
- Decision = `Denied` → Status = `Denied`
- Decision = `Escalated` → Status = `Escalated`, Routing = `Director`, then re-arms
- Decision = `Returned` → Status = `Returned`, sits until submitter resubmits

---

## Extension columns (NOT in canonical CSV)

These were added during the role-capability-matrix expansion (MC Doc v3).
Not part of canonical Phase 1. Don't create unless you opt into the
matrix-extension scope.

| Schema name              | Display              | Type                       | Notes                                                                  |
| ------------------------ | -------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `cr_comments_count`      | Comments Count       | Whole number               | Tracks Ask Leadership thread length (uses `cr_mx_request_comment` table). |
| `cr_anonymous`           | Anonymous            | Yes/No                     | For routing safety reports through this table.                         |
| `cr_audience`            | Audience             | Choice (multi)             | For info-only requests.                                                |

---

## Choice values

### `cr_request_type`

Values from the canonical CSV plus standard related types:

| Label              | Value | Notes                                                              |
| ------------------ | ----- | ------------------------------------------------------------------ |
| Phase Inspection   | 1     | Most common. CSV: 2 of 6 seed rows.                                |
| Repair             | 2     | Unscheduled repairs. CSV: 1 of 6 rows.                             |
| Overhaul           | 3     | Major scheduled work. Not in seed but standard MX type.            |
| Time Off           | 4     | AMT/RMM time-off. CSV: 1 of 6 rows.                                |
| Open Shift         | 5     | AMT coverage requests. CSV: 1 of 6 rows.                           |
| AOG                | 6     | Aircraft on Ground. CSV: 1 of 6 rows. Auto-routes to Director.    |

### `cr_priority`

| Label  | Value | Notes                                                                |
| ------ | ----- | -------------------------------------------------------------------- |
| Normal | 1     | Default. CSV: 4 of 6 rows.                                           |
| High   | 2     | CSV: 1 of 6 rows.                                                    |
| AOG    | 3     | Forces Routing=Director. CSV: 1 of 6 rows.                            |

### `cr_status`

| Label                | Value | Notes                                                                  |
| -------------------- | ----- | ---------------------------------------------------------------------- |
| Submitted            | 1     | Just landed. Flow trigger fires on this state. CSV: 2 of 6 rows.       |
| Approved             | 2     | CSV: 2 of 6 rows.                                                       |
| Denied               | 3     | CSV: 1 of 6 rows.                                                       |
| Escalated            | 4     | Auto-escalated past timeout to Director. CSV: 1 of 6 rows.              |
| Returned             | 5     | Returned to submitter (more info needed). Submitter edits + resubmits. |
| Cancelled            | 6     | Submitter cancelled before decision. Not in seed.                      |

### `cr_routing`

| Label     | Value | Notes                                                                  |
| --------- | ----- | ---------------------------------------------------------------------- |
| RMM       | 1     | Default. Goes to regional RMM channel. CSV: 5 of 6 rows.                |
| Director  | 2     | AOG-priority + escalations. CSV: 1 of 6 rows.                           |

### `cr_decision`

The approver's response on the Adaptive Card. Past-tense labels mirror
`cr_status` so they read consistently in audit + DM messages.

| Label        | Value | Notes                                                                                       |
| ------------ | ----- | ------------------------------------------------------------------------------------------- |
| Approved     | 1     | Sets `cr_status` = Approved. Outlook event created (unless Request Type is Time Off).        |
| Denied       | 2     | Sets `cr_status` = Denied. `cr_decision_reason` required.                                    |
| Escalated    | 3     | Sets `cr_status` = Escalated, `cr_routing` = Director, then resets to Submitted to re-arm trigger. |
| Returned     | 4     | Sets `cr_status` = Returned. `cr_more_info_request` required (the question to the submitter). |

Button labels on the Adaptive Card use action-verb form: **Approve**,
**Deny**, **Escalate**, **Return**. Decision values use the past-tense
outcome (matches `cr_status`).

---

## Auditing

- **Enable Auditing on this table** (Table properties → Advanced → Audit
  changes to its data: Yes). Captures every column change with actor +
  timestamp — the foundation of `cr_audit`.
- Microsoft Purview retention policy applies tenant-wide. Set 7 years
  for HIPAA-bearing data.
- Confirm `Activities` and `Notes` are disabled.

## Indexes

- `cr_status` — frequently filtered (Submitted only, for the flow trigger).
- `cr_decision` — used in trigger filter (must be null for re-fire).
- `cr_aircraft_tail` — frequently filtered in views (per-tail history).
- `cr_routing` — used in approval-inbox queries.
- `createdon` — most views are chronological.

## Trigger condition (for the flow)

The flow updates this same row, so it'll re-fire unless we filter:

```
Filtering attributes:  cr_status, cr_decision
Filter expression:     cr_status eq 1 AND cr_decision eq null
```

`cr_status eq 1` = Submitted. `cr_decision eq null` = no decision yet
(prevents re-fire when the flow itself sets `cr_decision`).

For the **Returned → resubmit** flow, the canvas app clears
`cr_decision` and resets `cr_status` back to Submitted, which re-arms
the trigger.

For the **Escalated re-route** flow, the flow itself clears
`cr_decision` and resets `cr_status` back to Submitted (after setting
`cr_routing` = Director), so the next iteration posts to the Director
channel.

## Seed data

Populate from `m365-solution/sharepoint-lists/06-mx-requests.csv`.
**6 seed rows** with real tails: N531HC, N407FC, N431HC, N291HC,
N407BY, N407CH.

The seed CSV doesn't yet have rows demonstrating Decision = Returned
or Decision = Escalated as separate states (only end-state Status
values). When you import, all seed rows will have `cr_decision` =
blank since the column was added after the CSV authoring. Same for
`cr_requested_by_email` — imported seed rows will have it blank, and
the flow's DM steps will no-op for those rows (they're for testing,
not live notifications).
