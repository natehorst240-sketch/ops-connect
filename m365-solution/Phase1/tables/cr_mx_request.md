# Table: `cr_mx_request`

The core Phase 1 table. Every MX Request submitted via the canvas app lands
here. The Power Automate flow reads from + writes to this table.

## Display name

**MX Request**

## Schema name

`cr_mx_request` (replace `cr_` with your tenant's publisher prefix — likely
`ihc_`)

## Primary column

`cr_request_number` — **Autonumber**, format `MXR-{SEQNUM:00000}`, seed `1`.
This is the human-readable request ID that appears in Teams DMs.

## Columns

| Schema name             | Display              | Type                       | Required | Default | Notes                                                                                |
| ----------------------- | -------------------- | -------------------------- | -------- | ------- | ------------------------------------------------------------------------------------ |
| `cr_request_number`     | Request number       | Autonumber                 | System   | —       | Format `MXR-{SEQNUM:00000}`. Primary column.                                          |
| `cr_aircraft_tail`      | Aircraft tail        | Text (8)                   | Yes      | —       | E.g., `N431HC`. Phase 1 free text; Phase 2 swap to lookup off `cr_aircraft`.          |
| `cr_aircraft_type`      | Aircraft type        | Text (32)                  | No       | —       | E.g., `AW109SP`, `Bell 407`, `EC135P3H`. Phase 2 also moves to lookup.                |
| `cr_request_type`       | Request type         | Choice                     | Yes      | —       | See § *Choice values* below.                                                         |
| `cr_window_start`       | Window start         | Date and time              | Yes      | —       | Time zone: `User Local`. Surface as a date+time picker in canvas.                     |
| `cr_window_end`         | Window end           | Date and time              | Yes      | —       | Must be after `cr_window_start`. Validate in canvas (see Power Fx spec).              |
| `cr_base`               | Base                 | Text (32)                  | Yes      | —       | E.g., `Logan`, `St. George`. Phase 2 swap to lookup.                                  |
| `cr_reason`             | Reason / notes       | Multiline text (1000)      | No       | —       | What the AMT typed. Surfaces in the Adaptive Card.                                    |
| `cr_priority`           | Priority             | Choice                     | Yes      | Normal  | `Normal`, `High`, `AOG`. AOG-priority routes to a different approval channel later.   |
| `cr_status`             | Status               | Choice                     | Yes      | Submitted | `Submitted`, `Approved`, `Denied`, `Cancelled`. Flow writes the transitions.         |
| `cr_requested_by`       | Requested by         | Lookup → `systemuser`      | Yes      | `User()`| Auto-populated on canvas submit.                                                     |
| `cr_approver`           | Approver             | Lookup → `systemuser`      | No       | —       | Set by flow when RMM clicks Approve / Deny.                                          |
| `cr_decided_at`         | Decision timestamp   | Date and time              | No       | —       | UTC. `utcNow()` from the flow.                                                        |
| `cr_decision_comment`   | Decision comment     | Text (500)                 | No       | —       | From the Adaptive Card's comment input.                                              |
| `cr_outlook_event_id`   | Outlook event ID     | Text (200)                 | No       | —       | Set by flow on approve. Used for cancellation cleanup later.                          |
| `cr_audit_correlation`  | Audit correlation ID | Text (50)                  | No       | `GUID()`| Joins `cr_mx_request` rows to their `cr_audit` entries.                              |
| `createdon`             | Created on           | Date and time              | System   | —       | Built-in.                                                                             |
| `modifiedon`            | Modified on          | Date and time              | System   | —       | Built-in.                                                                             |
| `createdby`             | Created by           | Lookup → `systemuser`      | System   | —       | Built-in.                                                                             |

## Choice values

### `cr_request_type`

| Label              | Value | Notes                                                              |
| ------------------ | ----- | ------------------------------------------------------------------ |
| Phase Inspection   | 1     | Most common; from CompleteFlight Due_List in Phase 2.              |
| Repair             | 2     | Unscheduled repairs.                                               |
| Overhaul           | 3     | Major scheduled work.                                              |
| Time Off           | 4     | Pilot/AMT requesting time off (Phase 1 also covers this).          |
| Open Shift         | 5     | Crew posting an open shift for claim.                              |
| AOG                | 6     | Aircraft on Ground; emergency status. Auto-priority `AOG`.         |
| Other              | 99    | Free-text follow-up needed.                                        |

### `cr_priority`

| Label  | Value |
| ------ | ----- |
| Normal | 1     |
| High   | 2     |
| AOG    | 3     |

### `cr_status`

| Label     | Value | Notes                                                                  |
| --------- | ----- | ---------------------------------------------------------------------- |
| Submitted | 1     | Just landed from canvas. Flow trigger fires.                            |
| Approved  | 2     | RMM clicked Approve. Outlook event created.                             |
| Denied    | 3     | RMM clicked Deny. DM sent.                                              |
| Cancelled | 4     | AMT cancelled before decision (allowed only in `Submitted` state).      |

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
- `cr_aircraft_tail` — frequently filtered in views (per-tail history).
- `createdon` — most views are chronological.

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
`pac data export-schema` against an existing dev environment after you've
built the table by hand once.)
