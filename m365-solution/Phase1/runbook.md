# Phase 1 Runbook — MX Connect (Dataverse, Canonical Scope)

**Goal:** AMT submits a request from Power Apps mobile → routed to the
right approver via `cr_routing` → Adaptive Card in Teams → approver
chooses **Approve / Deny / Escalate / Return** → `cr_mx_request` +
Outlook + DM update automatically. `cr_audit` captures every state
change.

**Stack:** Power Apps (canvas) + Power Automate + Microsoft Teams +
**Dataverse** + Outlook.

**Scope:** This runbook covers **canonical Phase 1 only** — the 8
canonical tables in `tables/README.md` Phase 1 list, plus the
4-decision approval flow. The 6 extension tables and 8-module canvas
app suite are **extension scope** — flagged at the bottom as a
Week 9+ follow-up if you opt in.

**Estimated effort:** 5–6 weeks for canonical, 1 Power Platform
developer + IHC IT liaison.

---

## Companion docs

- `tables/README.md` — Dataverse table index (canonical 11 + extension 7)
- `tables/cr_*.md` — column-by-column specs (each derives from a canonical CSV)
- `connections.md` — connection references + Dataverse roles
- `powerfx/canvas-app.md` — canvas app build guide
- `flows/mxr-approval-flow-v2.json` — flow recipe (4-decision matches canonical)
- `cards/approval-card.json` — Adaptive Card template
- `build-walkthrough.md` — click-by-click build for canonical
- `rebuild-from-clean-state.md` — recovery if Plan mode poisoned the publisher
- `../sharepoint-lists/` — **canonical CSV truth** for all 11 tables
- `application-modules.md` / `roles-capability-matrix.md` — extension scope reference

---

## Pre-flight checklist

Don't start week 1 until all of these are true:

- [ ] You have **Power Platform admin** access in the IHC tenant
- [ ] **Dataverse capacity** is allocated to your environment
- [ ] You can create **three environments**: Dev, UAT, Prod (or have
      admins stand them up). Same region, all Dataverse-enabled.
- [ ] **Solution publisher** is registered (display name `IHC`,
      prefix `cr`). Solution name `MXConnect`. **Set as preferred
      solution** before creating any tables — see
      `rebuild-from-clean-state.md` if you've already hit the
      `cr87b_*` problem.
- [ ] **DLP policy review** scheduled with IHC IT — Phase 1 uses
      Dataverse, Teams, Outlook. Phase 2 adds custom connectors.
- [ ] **Approver Teams channels exist** — at least the regional RMM
      channel and a Director channel. Capture both channel IDs.
- [ ] **Power Apps Premium licensing** path agreed — required for
      Dataverse-bound canvas apps.

If any box is unchecked, fix it before week 1.

---

## Environment variables

Define these in the solution before week 2.

| Variable                        | Type   | Example value                       | Notes                                              |
| ------------------------------- | ------ | ----------------------------------- | -------------------------------------------------- |
| `cr_approver_team_id`           | String | `19:abc123...@thread.tacv2`         | IHC Life Flight Team ID                            |
| `cr_approver_channel_id`        | String | `19:def456...@thread.tacv2`         | Default RMM channel — `cr_routing = RMM`           |
| `cr_director_channel_id`        | String | `19:jkl012...@thread.tacv2`         | Director channel — `cr_routing = Director` + escalations |
| `cr_outlook_calendar`           | String | `Logan MX Calendar`                  | Shared calendar name (or ID)                       |
| `cr_request_timeout_hours`      | Number | `24`                                 | Approval SLA before auto-escalation                |
| `cr_audit_retention_days`       | Number | `2555`                               | 7 years (HIPAA)                                    |
| `cr_app_deeplink_base`          | String | `https://make.powerapps.com/…`       | URL prefix for deep-links from emails / DMs        |
| `cr_director_email`             | String | `directors@ihc.org`                  | Recipient for timeout escalation emails             |

8 env vars for canonical Phase 1. (The matrix-extension scope adds
`mx_scheduler_channel_id`, `mx_safety_channel_id`,
`mx_safety_retention_days`, `mx_anonymous_account` for a total of 12.)

---

## Routing — canonical 2 channels

Every MX Request carries a **`cr_routing`** Choice column with two
values:

| Routing    | Default request types                            | Channel                       |
| ---------- | ------------------------------------------------ | ----------------------------- |
| `RMM`      | Phase Inspection, Repair, Overhaul, Time Off, Open Shift | `cr_approver_channel_id` |
| `Director` | AOG-priority requests; Escalated-decision re-routes; auto-escalations on timeout | `cr_director_channel_id` |

The canvas form's submit handler sets Routing based on Priority
(Priority=AOG forces Routing=Director, otherwise default RMM). The
flow reads `cr_routing` and switches the Teams `recipient/channelId`.

---

## Decisions — canonical 4 actions

Every approver responds with one of four decisions:

| Button label | Decision value | Required field            | Result                                                    |
| ------------ | -------------- | ------------------------- | --------------------------------------------------------- |
| Approve      | `Approved`     | (none)                    | Status → Approved. Outlook event created.                 |
| Deny         | `Denied`       | `cr_decision_reason`      | Status → Denied. DM with reason.                          |
| Return       | `Returned`     | `cr_more_info_request`    | Status → Returned. DM with the question. Submitter edits + resubmits → flow re-fires. |
| Escalate     | `Escalated`    | (none, but comment helps) | Status → Escalated, Routing → Director, then re-arms trigger so card re-posts to Director channel. |

**Plus a 5th implicit decision:** **Timeout**. If no response within
24h, the flow auto-escalates (same effect as Escalate).

---

## Week 1 — Foundation

**Deliverable:** Dataverse schema + security roles + environment is
queryable.

### 1.1 Create the solution

In Dev:

```
Power Apps Studio → Solutions → New solution
   Display name:  MX Connect
   Name:          MXConnect
   Publisher:     IHC (prefix cr)
   Version:       0.1.0.0
Solutions → MX Connect → ⋯ → Set as preferred solution
```

The "Set as preferred solution" step is critical — without it, new
tables go to Default Publisher with a `cr87b_*` prefix.

### 1.2 Build the 8 canonical Phase 1 tables

Build order (referenced tables before referencing tables):

1. `cr_region` (lookup)
2. `cr_aircraft_type` (lookup)
3. `cr_base` (Primary Region as Text in Phase 1)
4. `cr_aircraft` (Type as Lookup; Base/Region/RMM as Text per CSV constraints)
5. `cr_personnel_maintenance` (Region/Primary Base/Leader as Text)
6. `cr_personnel_crew` (header-only — Phase 2 populates)
7. `cr_mx_request` (Aircraft Tail + Base as Lookup; Requested By/Approver as Text; **includes cr_decision + cr_decision_reason + cr_more_info_request**)
8. `cr_audit` (Actor as Text; Action enum has 7 canonical values)

For each, follow the column-by-column spec in `tables/cr_*.md`. Enable
Auditing on every business table. See `build-walkthrough.md §A` for
click-by-click.

**Don't build the 6 extension tables in Week 1** (operational bulletin,
safety report, status logs, comments, filter prefs). Those are
Week 9+ if you opt into the matrix scope.

### 1.3 Define security roles

Create custom Dataverse security roles per `connections.md` privilege
grid. The canonical Phase 1 set is:

```
Solutions > MXConnect > + New > Security role
   For each:
     MXC AMT, MXC RMM, MXC Director, MXC QA, MXC Service
```

(Pilot / PR / Scheduler / Payroll roles are extension scope — required
for the 8-module canvas app, not for the canonical flow.)

### 1.4 Set up business unit hierarchy

Use the **canonical 12 region names** from `01-regions.csv`:

```
ihc.org (root)
├── 109 UT
├── CO/NM
├── ID/NV
├── NC Region
├── PAGE
├── SLC
├── SLC FW
├── UT/AZ
├── WI Region
├── WOODSCROSS
├── WY/MT
└── RW Rover
```

Names match the canonical CSV exactly — `NC Region` not `NC`, `SLC`
not `OFFICE`, `RW Rover` not `ROVERS`. Don't invent variants.

Assign each user to their region's BU. RMM regional scoping comes free
once the role's privilege level is set to **BU**.

### 1.5 Smoke test

In `Power Apps Studio → Tables → cr_mx_request → Add row`, manually
create a test row. Confirm:
- Auto-numbered `cr_request_number` populates (`MXR-00001`)
- `cr_audit_correlation` accepts a GUID
- Schema name shows `cr_*`, not `cr87b_*`
- The row is visible to the appropriate role members per BU scoping

(The flow isn't built yet, so don't expect audit rows.)

---

## Week 2 — Import canonical seed data + canvas app shell

**Deliverable:** All 11 canonical tables populated with real IHC data;
canvas app shell loads and shows fleet status.

### 2.1 Import canonical CSVs

```
Tables → cr_region → top toolbar → Import → Import from Excel
```

Per the order in `tables/README.md`:

1. `01-regions.csv` → cr_region
2. `03-aircraft-types.csv` → cr_aircraft_type
3. `02-bases.csv` → cr_base
4. `04-aircraft.csv` → cr_aircraft
5. `05-personnel-maintenance.csv` → cr_personnel_maintenance
6. `06-mx-requests.csv` → cr_mx_request (6 seed rows; cr_decision will be blank since the CSV pre-dates that column)
7. `07-audit-log.csv` → cr_audit (5 seed rows)

The CSVs are at `m365-solution/sharepoint-lists/` (the canonical
truth). Real IHC data, ready to import. Lookup-vs-Text column
decisions in the spec docs were made specifically so CSV import works
out of the box — don't try to convert columns to Lookup yet.

### 2.2 New canvas app

```
Solutions > MXConnect > + New > App > Canvas app
   Name:    MX Connect
   Format:  Phone
```

### 2.3 Build per `powerfx/canvas-app.md` §1–5

Just the shell + home screen + universal MX Request form for now.
Extension modules (Bulletins, Safety, Status, etc.) are Week 9+.

### 2.4 Smoke test

Submit one MX Request of each Routing type from canvas:
- Phase Inspection, Routing = RMM
- AOG (Priority=AOG forces Routing=Director)

Confirm rows land in `cr_mx_request` with the right `cr_routing` value
and `cr_decision` blank.

---

## Week 3 — Power Automate flow (trigger → card)

**Deliverable:** Submitting in canvas causes an Adaptive Card with
4 action buttons to land in the right Teams channel within ~2 seconds.

### 3.1 New cloud flow

```
Solutions > MXConnect > + New > Automation > Cloud flow > Automated
   Name:    mxr-approval-flow-v2
   Trigger: When a row is added, modified or deleted (Microsoft Dataverse)
     Table:           MX Request (cr_mx_request)
     Change type:     Added or Modified
     Scope:           Organization
     Filter columns:  cr_status,cr_decision
     Filter rows:     cr_status eq 1 and cr_decision eq null
```

The trigger filter is critical:
- `cr_status eq 1` (Submitted) — initial submissions
- `cr_decision eq null` — prevents re-fire on the flow's own Decision
  writes; allows re-fire for Returned-resubmit and Escalated-re-route
  (canvas/flow clears `cr_decision` for both)

### 3.2 Build the flow

The shipped JSON `flows/mxr-approval-flow-v2.json` is canonical for
the 4-decision flow. Either import via `pac` or build manually
following the action sequence in `build-walkthrough.md §B`.

The action sequence:

1. Trigger
2. Initialize variables — `vAuditCorrelation`, `vRouting`, `vRecipientChannel`
3. Audit submitted (write `cr_audit` row, action 1)
4. Compose Adaptive Card body (4 buttons: Approve, Deny, Escalate, Return)
5. Post Adaptive Card and wait for response (24h timeout)
6. Switch on response action — Approve / Deny / Escalate / Return cases
7. Timeout / Failed branch — auto-escalate to Director

### 3.3 Smoke test

Submit one Phase Inspection request from canvas. Confirm:
- Flow run shows in `Power Automate → My flows → mxr-approval-flow-v2 →
  28-day run history` within ~2 seconds
- Card lands in the RMM channel (Routing = RMM default)
- Card displays tail, type, window, requestor; **4 buttons (Approve /
  Deny / Escalate / Return)** plus a comment input
- Audit row written (`mx_request.submitted`)

---

## Week 4 — Approve / Deny / Escalate / Return / Timeout

**Deliverable:** All 4 canonical decisions plus timeout work
end-to-end.

### 4.1 Add Switch action

After "Post adaptive card and wait for response":

```
Switch on:  outputs('Post_card_and_wait')?['body/data/action']
   case "approve":  → Approve branch
   case "deny":     → Deny branch
   case "escalate": → Escalate branch
   case "return":   → Return branch
```

### 4.2 Approve branch

1. **Update row** — `cr_status` = 2 (Approved), `cr_decision` = 1
   (Approved), `cr_decided_at`, `cr_decision_comment`, `cr_approver`
2. **Conditional** — skip Outlook step if Request Type is Time Off
   (request_type = 4) since time-off doesn't need a calendar event
3. **Create event V4** — Outlook calendar from `cr_outlook_calendar`
4. **Update row** — `cr_outlook_event_id` from Create event output
5. **Post message** — Teams DM to requestor
6. **Create row** — `cr_audit` action 2 (`mx_request.approved`)

### 4.3 Deny branch

1. **Update row** — `cr_status` = 3 (Denied), `cr_decision` = 2 (Denied),
   `cr_decision_reason` (the comment text — required), `cr_approver`
2. **Post message** — Teams DM with reason
3. **Create audit row** — action 3 (`mx_request.denied`)

(No Outlook event for Deny.)

### 4.4 Return branch

The approver clicks **Return** when they need more info from the
submitter. The request goes back to the submitter, who edits + resubmits.

1. **Update row** — `cr_status` = 5 (Returned), `cr_decision` = 4
   (Returned), `cr_more_info_request` (the question — required),
   `cr_approver`
2. **Post message** — DM the question to requestor with deep-link to
   open the request in MX Connect and add the answer
3. **Create audit row** — action 5 (`mx_request.returned`)

When the submitter resubmits (canvas clears `cr_decision` and resets
`cr_status` back to 1 Submitted), the trigger re-fires.

### 4.5 Escalate branch (manual)

1. **Update row** — `cr_status` = 4 (Escalated), `cr_decision` = 3
   (Escalated), `cr_routing` = 2 (Director), `cr_decision_comment`
2. **Update row again** — set `cr_status` = 1 (Submitted) and
   `cr_decision` = null (re-arms the trigger)
3. **Create audit row** — action 4 (`mx_request.escalated`)

The next iteration of the flow sees Routing = Director and posts the
Adaptive Card to the Director channel.

### 4.6 Timeout branch

The "wait for response" action's `limit.timeout = PT24H`. On TimedOut
or Failed (parallel branch via "Configure run after"):

1. **Update row** — `cr_status` = 4 (Escalated), `cr_routing` = 2
   (Director), `cr_decision_comment` = "Auto-escalated after 24h"
2. **Update row** — reset `cr_status` = 1 and `cr_decision` = null
   (re-arms trigger for Director re-post)
3. **Send email V2** — Director group with full context + deep-link
4. **Create audit row** — action 4 (`mx_request.escalated`), actor =
   `System`

### 4.7 Smoke test

Six canonical scenarios:
- Approve, Routing = RMM
- Deny with comment
- Return → submitter resubmits → flow re-fires → eventual Approve
- Manual Escalate from RMM channel → confirm card re-posts to Director
- Approve where Priority = AOG (auto-routed Director — verify card
  lands in Director channel)
- Wait past timeout (set `limit.timeout` to `PT5M` for testing)

Verify each: row state, Decision value, Outlook event presence/absence,
Teams DMs, audit row count.

---

## Week 5 — UAT

**Deliverable:** Sign-off from the Logan pilot region.

### 5.1 Promote to UAT

```bash
pac solution export --name MXConnect --path ./MXConnect-0.1.0.zip --managed false
pac auth select --name uat-environment
pac solution import --path ./MXConnect-0.1.0.zip
```

After import:
1. Re-map environment variables (Teams channel IDs differ)
2. Re-map connection references (re-authenticate Dataverse + Teams + Outlook)
3. Assign security roles to UAT user accounts
4. Turn on the flow

### 5.2 Pilot users

Use real Logan-region people from the canonical CSV:

| Role        | Pilot users (UAT)                                       |
| ----------- | ------------------------------------------------------- |
| AMT         | Mac Paye, Alec Overton (Logan AMTs from CSV)            |
| RMM         | Nate Horstmeier (109 UT regional RMM per CSV)           |
| Director    | Billy Ortega or Pete Robotham (DOMs per CSV)            |
| QA          | Taylor Sermon or Edwin Meza (per CSV)                   |
| Senior Dir  | Jared Thompson (per CSV; oversight only)                |

(`Steve Taul` does not appear in the canonical CSV. Don't invent
pilot users — use real names from `05-personnel-maintenance.csv`.)

### 5.3 Issues to log

- Field validation gaps (e.g., "end before start" allowed?)
- Notification body wording
- Routing edge cases — should specific request types ever route differently?
- How often Return is used (a high rate suggests submission form
  needs better required-field guidance)
- Missing audit fields that came up in real use

---

## Week 6 — Production

**Deliverable:** Logan region running live.

### 6.1 Promote to Prod

```bash
pac solution export --name MXConnect --path ./MXConnect-1.0.0.zip --managed true
pac auth select --name prod-environment
pac solution import --path ./MXConnect-1.0.0.zip
```

Use **managed solution** for Prod (`--managed true`) so users can't
edit components.

### 6.2 Monitor week 1

- `Power Platform admin center → Environments → IHC Prod → Analytics`
- Flow run failure rate target: <2% (mostly transient throttling)
- DLP policy violations target: 0
- App load time target: <3s on cellular
- Auto-escalation rate (timeouts): track but no target threshold yet
- Return rate: track to see if submission form needs adjustment

If any miss, halt rollout and fix before expanding to other regions.

---

## Week 7+ — Org-wide rollout

The canonical CSV has these maintenance personnel counts:

- **AMTs:** ~64 across all regions
- **AMTs (Rover):** 3
- **Supervisors:** 3
- **RMMs:** 8 regional (per `cr_aircraft.cr_rmm` distinct names: Nate Horstmeier, Tevita Silatolu, John Cutright, Chris Gibson, Sean Brown, Casey Stockall, Chris Eells, Scott Winberg, Martin Hodo, Dwight Brooks — actually 10)
- **DOMs:** 3 (Ryan Taul, Pete Robotham, Billy Ortega)
- **QA:** 2 + 1 QA Manager (Joe Sparto)
- **Parts:** 3
- **Schedulers:** 2 (Carla Weir, Rachel Williams)
- **Senior Director:** 1 (Jared Thompson)

Total maintenance roster: ~85 active users per
`05-personnel-maintenance.csv`. The org-wide rollout target is to
onboard those 85 users to `MXC AMT` (or appropriate role) and the
relevant regional BU.

(Earlier docs cited "~340 active users" — that's not from canonical
data. The 85 number is the truth from the CSV.)

Train remaining RMMs on the Adaptive Card flow region by region, in
order:
- 109 UT (Logan pilot — already live after Week 6)
- WY/MT, ID/NV, UT/AZ, CO/NM
- PAGE, WOODSCROSS, NC Region, WI Region, SLC FW

---

## Common pitfalls

| Symptom                                                | Cause                                                                       | Fix                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Schema name shows `cr87b_*` after creating a table     | MX Connect not set as preferred solution                                    | Solutions → MX Connect → ⋯ → Set as preferred solution. See `rebuild-from-clean-state.md`. |
| Adaptive Card never appears in Teams                   | Wrong channel ID, or the bot isn't installed in the team                    | Verify channel IDs and add the Power Automate bot to the team        |
| Card appears but in wrong channel                      | `cr_routing` column missing or default-cast to RMM                          | Confirm canvas form sets Routing on every Patch                      |
| Flow re-fires on its own writes                        | Trigger filter missing `cr_decision eq null`                                | Add it to the trigger Filter rows expression                         |
| Return loop doesn't re-trigger                         | Canvas didn't clear `cr_decision` on resubmit                               | Patch `cr_decision: Blank()` + `cr_status: Submitted` on resubmit    |
| Escalate doesn't re-route to Director channel          | Two-step Patch missed; need to set `cr_routing=2` AND `cr_status=1` AND `cr_decision=null` | See flow JSON Escalate branch reference                |
| Patch fails with "Network error"                       | Canvas talking to wrong environment or table not in solution                | Re-add the data source; confirm table is part of MXConnect solution  |
| Audit rows never written                               | Service account lacks Append-To privilege on `cr_audit`                     | Add Append-To to `MXC AMT` and `MXC RMM` roles                       |
| Outlook event in wrong calendar                        | Env variable references calendar name, not ID                               | Use the calendar ID; names vary by user                              |
| RMM sees other regions' requests                       | RMM role configured with Org privilege instead of BU                        | Check the role's `cr_mx_request` Read privilege — should be BU       |
| CSV import fails on Aircraft                           | Tried to import with Lookup columns set up                                  | Spec keeps Base/Region/RMM as Text in Phase 1 — switch back to Text  |

---

## Phase 1 acceptance criteria (canonical)

Phase 1 is done when, in Prod:

- [ ] An AMT can submit any of 6 canonical Request Types (Phase
      Inspection / Repair / Overhaul / Time Off / Open Shift / AOG)
      from a phone in under 30 seconds
- [ ] The Adaptive Card lands in the right Teams channel (RMM channel
      for default; Director channel for Priority=AOG) within ~2 seconds
- [ ] Approvers can choose Approve / Deny / Escalate / Return from the
      Teams card; each writes the right Decision value and Status
- [ ] Approved requests create an Outlook calendar event (except Time Off)
- [ ] Denied requests DM the requestor with the comment
- [ ] Returned requests DM the requestor with the question; submitter
      can edit + resubmit; flow re-fires correctly
- [ ] Escalated requests re-route to Director channel
- [ ] Timeout (24h) auto-escalates to Director with email + audit row
- [ ] Audit row exists in `cr_audit` for every state change (one of
      the 7 canonical actions)
- [ ] DLP review signed off by IHC IT
- [ ] Three weeks of clean run history (>98% success) in the Logan pilot

When all checked, you're ready for Week 9+ extension scope or Phase 2
(custom connectors).

---

## Week 9+ — Extension scope (optional)

If you want the role-matrix features (8-module canvas app, 6 extension
tables, Routing=Scheduler), that's an additional 4–6 weeks of work.

What changes from canonical:

- Add 3 extension columns to `cr_mx_request`: `cr_comments_count`,
  `cr_anonymous`, `cr_audience` (the 4-decision columns are already
  canonical)
- Add 6 extension tables: `cr_operational_bulletin`, `cr_safety_report`,
  `cr_aircraft_status_log`, `cr_personnel_status_log`,
  `cr_mx_request_comment`, `cr_user_filter_pref` (each spec has an
  EXTENSION banner)
- Expand `cr_mx_request.cr_routing` from 2 to 3 values (add Scheduler)
- Expand `cr_audit.cr_action` enum with the 13 extension actions
- Add `mx_scheduler_channel_id`, `mx_safety_channel_id`,
  `mx_safety_retention_days`, `mx_anonymous_account` env vars
- Add MXC Pilot / MXC PR / MXC Scheduler / MXC Payroll security roles
- Build canvas app modules per `application-modules.md` (8 modules)
- Build auxiliary flows: aircraft-status-broadcast, safety-report-triage,
  bulletin-resolve-audit, personnel-status-log-from-canvas

Reference docs for extension scope:
- `application-modules.md` — 8-module breakdown
- `roles-capability-matrix.md` — 8 roles × 42 capabilities

---

## Phase 2 (when external connectors land)

Add the 3 Phase 2 canonical tables once CompleteFlight + ProteanHub +
SkyRouter custom connectors are signed off:

- `cr_schedule_event` — external-system schedule mirror
- `cr_fleet_position` — SkyRouter live positions (1-min poll)
- `cr_conflict` — cross-system conflict detection

These are documented in their respective spec files. Phase 2 is its
own runbook; Phase 1 acceptance is the prerequisite.
