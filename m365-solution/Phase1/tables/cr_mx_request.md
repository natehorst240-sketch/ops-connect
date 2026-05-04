# Table: `cr_mx_request`

The core Phase 1 table. Every MX Request submitted via the canvas app lands
here. The Power Automate flow reads from + writes to this table.

## Display name

**MX Request**

## Schema name

`cr_mx_request` (replace `cr_` with your tenant's publisher prefix —
likely `ihc_`)

## Primary column

`cr_request_number` — **Autonumber**, format `MXR-{SEQNUM:00000}`, seed `1`.
This is the human-readable request ID that appears in Teams DMs.

## Ownership + scope

- **Ownership:** User or team owned.
- **Business unit scoping:** Yes — enables RMM regional visibility via
  business unit hierarchy.
- **Activities / Notes / Connections:** off (not used in Phase 1).

## Columns

| Schema name              | Display              | Type                       | Required | Default     | Notes                                                                                |
| ------------------------ | -------------------- | -------------------------- | -------- | ----------- | ------------------------------------------------------------------------------------ |
| `cr_request_number`      | Request number       | Autonumber                 | System   | —           | Format `MXR-{SEQNUM:00000}`. Primary column.                                         |
| `cr_aircraft_tail_id`    | Aircraft             | Lookup → `cr_aircraft`     | No       | —           | Required for MX Schedule, Aircraft Movement, Pilot Training; optional otherwise.     |
| `cr_aircraft_type`       | Aircraft type        | Text (32)                  | No       | —           | Denormalized for fast Adaptive Card render. Auto-set from lookup on save.            |
| `cr_request_type`        | Request type         | Choice                     | Yes      | —           | See § *Choice values* below.                                                         |
| `cr_window_start`        | Window start         | Date and time              | No       | —           | Required for MX Schedule, AC Movement, Pilot Training, Time Off. Time zone: User Local. |
| `cr_window_end`          | Window end           | Date and time              | No       | —           | Validate End > Start in canvas.                                                       |
| `cr_base_id`             | Base                 | Lookup → `cr_base`         | No       | —           |                                                                                       |
| `cr_reason`              | Reason / notes       | Multiline text (1000)      | No       | —           | What the submitter typed. Surfaces in the Adaptive Card.                              |
| `cr_priority`            | Priority             | Choice                     | Yes      | Normal      | `Normal`, `High`, `AOG`. AOG-priority routes to Director.                             |
| `cr_status`              | Status               | Choice                     | Yes      | Submitted   | See § *Choice values*. Flow trigger filters on this.                                  |
| `cr_routing`             | Routing              | Choice                     | Yes      | RMM         | `RMM` / `Scheduler` / `Director`. Drives channel selection in flow.                   |
| `cr_requested_by`        | Requested by         | Lookup → `systemuser`      | Yes      | `User()`    | Auto-populated on canvas submit.                                                      |
| `cr_approver`            | Approver             | Lookup → `systemuser`      | No       | —           | Set by flow when approver responds to Adaptive Card.                                  |
| **`cr_decision`**        | Decision             | Choice                     | No       | —           | `Approve` / `Deny` / `Request Info` / `Escalate`. Set by flow on response.            |
| **`cr_decision_reason`** | Decision reason      | Multiline text (1000)      | No       | —           | Required when Decision = Deny.                                                        |
| **`cr_more_info_request`** | More info request  | Multiline text (1000)      | No       | —           | The question to the submitter when Decision = Request Info.                           |
| `cr_decided_at`          | Decision timestamp   | Date and time              | No       | —           | UTC. `utcNow()` from the flow.                                                         |
| `cr_decision_comment`    | Decision comment     | Text (500)                 | No       | —           | Free-text comment from Adaptive Card.                                                |
| `cr_outlook_event_id`    | Outlook event ID     | Text (200)                 | No       | —           | Set by flow on approve. Used for cancellation cleanup.                                |
| **`cr_comments_count`**  | Comments count       | Whole number               | No       | 0           | Tracks Ask Leadership thread length. Incremented by canvas on each comment Patch.     |
| **`cr_anonymous`**       | Anonymous            | Yes/No                     | No       | No          | Phase 1: only used for Safety Report submissions routed via this table.               |
| **`cr_audience`**        | Audience             | Choice (multi-select)      | No       | —           | For info-only requests: `RMM` / `Director` / `QA` / `Scheduler` / `All`.              |
| `cr_audit_correlation`   | Audit correlation ID | Text (50)                  | Yes      | `GUID()`    | Joins `cr_mx_request` rows to their `cr_audit` entries.                              |
| `createdon`              | Created on           | Date and time              | System   | —           | Built-in.                                                                             |
| `modifiedon`             | Modified on          | Date and time              | System   | —           | Built-in.                                                                             |
| `createdby`              | Created by           | Lookup → `systemuser`      | System   | —           | Built-in.                                                                             |

**Bold** rows are new in the role-capability-matrix expansion. The first
deploy can ship without `cr_anonymous` and `cr_audience` if you push
Safety Reports to its own table immediately (recommended).

## Choice values

### `cr_request_type`

| Label                       | Value | Notes                                                              |
| --------------------------- | ----- | ------------------------------------------------------------------ |
| MX Schedule                 | 1     | Routine + repair maintenance windows.                              |
| Aircraft Movement (PR)      | 2     | PR / media flight requests.                                        |
| Pilot Training              | 3     | Pilot-submitted training windows.                                  |
| Time Off                    | 4     | AMT/RMM/QA/Director time-off requests.                             |
| Ask Leadership              | 5     | Question routed to Director (any role can submit).                |
| Other                       | 99    | Free-text follow-up.                                               |

### `cr_priority`

| Label  | Value |
| ------ | ----- |
| Normal | 1     |
| High   | 2     |
| AOG    | 3     |

### `cr_status`

| Label                | Value | Notes                                                                  |
| -------------------- | ----- | ---------------------------------------------------------------------- |
| Submitted            | 1     | Just landed from canvas. Flow trigger fires on this state.             |
| Approved             | 2     | Approver clicked Approve. Outlook event created (if applicable).        |
| Denied               | 3     | Approver clicked Deny with written reason.                             |
| **More Info Requested** | 4  | Approver asked for more info. Submitter edits + re-submits.            |
| **Escalated**        | 5     | Routed up to Director (manual or auto-on-timeout).                     |
| Cancelled            | 6     | Submitter cancelled before decision.                                   |

### `cr_routing`

| Label     | Value | Notes                                                                  |
| --------- | ----- | ---------------------------------------------------------------------- |
| RMM       | 1     | Default for MX Schedule + Time Off. Goes to regional RMM channel.      |
| Scheduler | 2     | Default for Aircraft Movement (PR) + Pilot Training.                   |
| Director  | 3     | Default for Ask Leadership; also set by Escalate action.               |

### `cr_decision`

| Label         | Value | Notes                                                                  |
| ------------- | ----- | ---------------------------------------------------------------------- |
| Approve       | 1     | Sets Status = Approved.                                                 |
| Deny          | 2     | Sets Status = Denied. Decision Reason required.                         |
| Request Info  | 3     | Sets Status = More Info Requested. More Info Request required.          |
| Escalate      | 4     | Sets Status = Escalated, Routing = Director, re-enters flow.            |

### `cr_audience` (multi-select)

| Label     | Value |
| --------- | ----- |
| All       | 1     |
| RMM       | 2     |
| Director  | 3     |
| QA        | 4     |
| Scheduler | 5     |
| Pilot     | 6     |
| PR        | 7     |

## Auditing

- **Enable Auditing on this table** (Table properties → Advanced → Audit
  changes to its data: Yes). Captures every column change with actor +
  timestamp — the foundation of `cr_audit`.
- Microsoft Purview retention policy applies tenant-wide. Set 7 years for
  HIPAA-bearing data.
- Confirm `Activities` and `Notes` are disabled (not needed; reduces
  schema surface).

## Indexes

Dataverse creates indexes on the primary column and lookups automatically.
Add custom indexes on:

- `cr_status` — frequently filtered (`Submitted` only, for the flow trigger).
- `cr_aircraft_tail_id` — frequently filtered in views (per-tail history).
- `cr_routing` — used in approval-inbox queries (RMM vs Director vs Scheduler).
- `createdon` — most views are chronological.

## Trigger condition (for the flow)

Since the flow updates this same row, it'll re-fire unless we filter:

```
Filtering attributes:  cr_status
Filter expression:     cr_status eq 1 AND cr_decision eq null
```

This ensures the flow only fires on the Submitted state and not on its own
updates (which set `cr_decision`).

## How to create the table

### Option A — Make.PowerApps.com (recommended for Phase 1)

1. Open https://make.powerapps.com
2. Solution: `MX Connect`
3. New → Table → New table
4. Display name: `MX Request`
5. Add columns per the table above. For Choice columns, build the choice
   set inline (or pre-create as a global Choice if you want reuse).
6. Enable Auditing (Properties → Advanced).
7. Save.

### Option B — `pac` CLI

```bash
pac auth select --name dev-environment
pac data create-schema --table cr_mx_request --schema ./cr_mx_request.schema.json
```

(`cr_mx_request.schema.json` not provided in this kit — generate via
`pac data export-schema` against an existing dev environment after
you've built the table by hand once.)
