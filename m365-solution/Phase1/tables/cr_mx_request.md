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

These match `m365-solution/sharepoint-lists/06-mx-requests.csv` (the 6
seed rows). Build all of these for Phase 1.

| Schema name              | Display              | Type                       | Required | Default     | Notes                                                                                |
| ------------------------ | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------ |
| `cr_request_number`      | Request Number       | Autonumber                 | System   | —           | Format `MXR-{SEQNUM:00000}`. Primary column.                                         |
| `cr_aircraft_tail`       | Aircraft Tail        | Lookup → `cr_aircraft`     | No       | —           | Required for Phase Inspection / Repair / AOG / Open Shift; optional for Time Off.    |
| `cr_aircraft_type`       | Aircraft Type        | Text (40)                  | No       | —           | Denormalized for fast Adaptive Card render. Auto-set on save.                        |
| `cr_request_type`        | Request Type         | Choice                     | Yes      | —           | See § *Choice values*. Canonical 5 values: Phase Inspection / Repair / Time Off / AOG / Open Shift. |
| `cr_window_start`        | Window Start         | Date and time              | Yes      | —           | Time zone: User Local. CSV uses `5/4/2026 07:00` format.                              |
| `cr_window_end`          | Window End           | Date and time              | Yes      | —           | Validate End > Start in canvas.                                                       |
| `cr_base`                | Base                 | Lookup → `cr_base`         | No       | —           | Required for aircraft-tied requests; optional for org-wide.                          |
| `cr_reason`              | Reason               | Multiline text (1000)      | No       | —           | What the submitter typed. Surfaces in the Adaptive Card.                              |
| `cr_priority`            | Priority             | Choice                     | Yes      | Normal      | `Normal` / `High` / `AOG`. Priority=AOG forces Routing=Director.                      |
| `cr_status`              | Status               | Choice                     | Yes      | Submitted   | See § *Choice values*. Flow trigger filters on this.                                  |
| `cr_routing`             | Routing              | Choice                     | Yes      | RMM         | `RMM` / `Director`. Drives channel selection in flow.                                |
| `cr_requested_by`        | Requested By         | Text (60)                  | Yes      | —           | CSV stores requestor name. Phase 2: convert to Lookup → `systemuser`.                  |
| `cr_approver`            | Approver             | Text (60)                  | No       | —           | Set by flow on Adaptive Card response. Phase 2: convert to Lookup.                   |
| `cr_decided_at`          | Decided At           | Date and time              | No       | —           | UTC. `utcNow()` from the flow.                                                         |
| `cr_decision_comment`    | Decision Comment     | Text (500)                 | No       | —           | Free-text comment from Adaptive Card.                                                |
| `cr_outlook_event_id`    | Outlook Event ID     | Text (200)                 | No       | —           | Set by flow on approve. E.g., `AAMkAGI3...`.                                          |
| `cr_audit_correlation`   | Audit Correlation    | Text (50)                  | Yes      | `GUID()`    | Joins `cr_mx_request` rows to their `cr_audit` entries.                              |
| `createdon` / `modifiedon` / `createdby` | (system) | Date / Lookup       | System   | —           | Built-in.                                                                             |

**Why Requested By + Approver are Text in Phase 1:** the canonical CSV
stores them as name strings (e.g., `Mason Littledike`, `Nate Horstmeier`).
Phase 2 normalizes to Lookup → `systemuser`.

---

## Extension columns (NOT in canonical CSV)

These were added during the role-capability-matrix expansion (MC Doc v3).
**They are not part of the canonical Phase 1 build** — don't create them
until you opt into the matrix-extension scope. The Phase 1 flow will work
without them.

| Schema name              | Display              | Type                       | Notes                                                                  |
| ------------------------ | -------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `cr_decision`            | Decision             | Choice                     | `Approve` / `Deny` / `Request Info` / `Escalate`. Used by 4-decision flow variant. |
| `cr_decision_reason`     | Decision Reason      | Multiline text (1000)      | Required when Decision = Deny.                                         |
| `cr_more_info_request`   | More Info Request    | Multiline text (1000)      | Set when Decision = Request Info.                                      |
| `cr_comments_count`      | Comments Count       | Whole number               | Tracks Ask Leadership thread length (uses `cr_mx_request_comment` table). |
| `cr_anonymous`           | Anonymous            | Yes/No                     | For routing safety reports through this table.                         |
| `cr_audience`            | Audience             | Choice (multi)             | For info-only requests.                                                |

If you build the canonical Phase 1 only, the existing
`flows/mxr-approval-flow-v2.json` will need to be simplified to use
only Approve and Deny cases (skip Request Info / Escalate). The
flow JSON as-shipped assumes the extension columns exist.

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
| Cancelled            | 5     | Submitter cancelled before decision. Not in seed.                      |

### `cr_routing`

| Label     | Value | Notes                                                                  |
| --------- | ----- | ---------------------------------------------------------------------- |
| RMM       | 1     | Default. Goes to regional RMM channel. CSV: 5 of 6 rows.                |
| Director  | 2     | AOG-priority + escalations. CSV: 1 of 6 rows.                           |

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
- `cr_aircraft_tail` — frequently filtered in views (per-tail history).
- `cr_routing` — used in approval-inbox queries.
- `createdon` — most views are chronological.

## Trigger condition (for the canonical 2-decision flow)

The flow updates this same row, so it'll re-fire unless we filter:

```
Filtering attributes:  cr_status
Filter expression:     cr_status eq 1
```

(The extension flow uses an additional `cr_decision eq null` clause to
prevent re-fire on its own Decision writes. Canonical Phase 1 doesn't
have the `cr_decision` column, so the simpler filter suffices.)

## Seed data

Populate from `m365-solution/sharepoint-lists/06-mx-requests.csv`.
**6 seed rows** with real tails: N531HC, N407FC, N431HC, N291HC,
N407BY, N407CH.
