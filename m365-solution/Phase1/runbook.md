# Phase 1 Runbook — MX Connect Dashboard (Dataverse)

**Goal:** AMT (or Pilot, PR, RMM, Director, QA, Scheduler) submits a
request from Power Apps mobile → routed to the right approver →
Adaptive Card in Teams → Approve / Deny / Request Info / Escalate →
Dataverse + Outlook + DM update automatically. Audit log captures
everything across all 8 modules.

**Stack:** Power Apps (canvas) + Power Automate + Microsoft Teams +
**Dataverse** + Outlook.

**Estimated effort:** 6–8 weeks, 1 Power Platform developer + IHC IT
liaison.

> **Note:** The earlier "SharePoint Lists fallback" path documented here
> is deprecated. With Dataverse capacity available in the dev tenant,
> Dataverse is the canonical Phase 1 data layer. SharePoint variant
> artifacts (`flows/mxr-approval-flow-sharepoint.json` and
> `../sharepoint-lists/phase1-blank-templates/`) remain for reference
> only.

---

## Companion docs

- `roles-capability-matrix.md` — 8 roles × 42 capabilities
- `application-modules.md` — 8-module breakdown
- `tables/README.md` — Dataverse table index + build order
- `connections.md` — connection references + Dataverse roles
- `powerfx/canvas-app.md` — canvas app build guide
- `flows/mxr-approval-flow-v2.json` — Power Automate flow JSON
- `cards/approval-card.json` — Adaptive Card template

---

## Pre-flight checklist

Don't start week 1 until all of these are true:

- [ ] You have **Power Platform admin** access in the IHC tenant
- [ ] **Dataverse capacity** is allocated to your environment (you don't
      need a separate provisioning step — capacity comes with your
      Per-User Premium or Per-App license)
- [ ] You can create **three environments**: Dev, UAT, Prod (or have
      admins stand them up). Same region, all Dataverse-enabled.
- [ ] **Solution publisher** is registered (display name `IHC`, prefix
      `ihc` or whatever your IT picks). Solution name `MXConnect`.
- [ ] **DLP policy review** scheduled with IHC IT — Phase 1 uses
      Dataverse, Teams, Outlook, Office 365 Users. Phase 2 adds custom
      connectors. Confirm classifications match.
- [ ] **Approver Teams channels exist** — at least Logan RMM, Scheduler,
      Director, and Safety. Capture all four channel IDs.
- [ ] **Power Apps Premium licensing** path agreed — Per-App at $5/user/mo
      for end users, or Per-User at $20/user/mo. (Or wait until pilot
      success and convert via volume agreement.)
- [ ] **CompleteFlight + ProteanHub + SkyRouter API keys** — NOT needed
      for Phase 1, but request them now; they take 2–4 weeks at the
      source.

If any box is unchecked, fix it before week 1.

---

## Environment variables

Define these in the solution before week 2. Each varies between Dev /
UAT / Prod — environment variables exist exactly to keep them separate.

| Variable                        | Type   | Example value                       | Notes                                              |
| ------------------------------- | ------ | ----------------------------------- | -------------------------------------------------- |
| `mx_approver_team_id`           | String | `19:abc123...@thread.tacv2`         | IHC Life Flight Team ID                            |
| `mx_approver_channel_id`        | String | `19:def456...@thread.tacv2`         | Logan RMM channel — Routing=RMM default            |
| `mx_scheduler_channel_id`       | String | `19:ghi789...@thread.tacv2`         | Scheduler channel — PR + Pilot Training routing    |
| `mx_director_channel_id`        | String | `19:jkl012...@thread.tacv2`         | Director channel — Ask Leadership + escalation     |
| `mx_safety_channel_id`          | String | `19:mno345...@thread.tacv2`         | Safety Reports triage channel                      |
| `mx_outlook_calendar`           | String | `Logan MX Calendar`                  | Shared calendar name (or ID)                       |
| `mx_request_timeout_hours`      | Number | `24`                                 | Approval SLA before auto-escalation                |
| `mx_audit_retention_days`       | Number | `2555`                               | 7 years (HIPAA)                                    |
| `mx_safety_retention_days`      | Number | `-1`                                 | Safety reports never expire                         |
| `mx_app_deeplink_base`          | String | `https://make.powerapps.com/…`       | URL prefix for deep-links from emails / DMs        |
| `mx_director_email`             | String | `directors@ihc.org`                  | Recipient for timeout escalation emails             |
| `mx_anonymous_account`          | String | `mx-anonymous@ihc.org`               | Service account for anonymous safety reports       |

Store in `Power Platform admin center → Solutions → MXConnect →
Environment variables`.

---

## Routing — RMM / Scheduler / Director

Every MX Request carries a **`Routing`** Choice column with three values:

| Routing     | Default request types                                | Channel                       |
| ----------- | ---------------------------------------------------- | ----------------------------- |
| `RMM`       | MX Schedule, Time Off                                | `mx_approver_channel_id`      |
| `Scheduler` | Aircraft Movement (PR), Pilot Training               | `mx_scheduler_channel_id`     |
| `Director`  | Ask Leadership, AOG-priority, manual escalations     | `mx_director_channel_id`      |

The canvas form's submit handler sets Routing based on Request Type
(see `powerfx/canvas-app.md` §8). The flow reads it and switches
`recipient/channelId` accordingly.

Manual `Escalate` action on the Adaptive Card (or in-app inbox) sets
Routing → Director and re-arms the trigger so the request enters the
flow as a Director-routed item.

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
   Publisher:     IHC (prefix ihc)
   Version:       0.1.0.0
```

### 1.2 Build the 15 Dataverse tables

Build order matters — referenced tables before referencing tables. Per
`tables/README.md`:

1. `cr_region` (lookup)
2. `cr_aircraft_type` (lookup)
3. `cr_base` (lookup, refs `cr_region`)
4. `cr_aircraft` (refs `cr_aircraft_type`, `cr_base`, `cr_region`, `systemuser`)
5. `cr_personnel_maintenance` (refs `cr_region`, `cr_base`, `systemuser`)
6. `cr_personnel_crew` (Phase 2 prep — schema only)
7. `cr_mx_request` (PRIMARY — flow trigger; refs `cr_aircraft`, `cr_base`, `systemuser`)
8. `cr_audit` (write-only)
9. `cr_operational_bulletin`
10. `cr_safety_report`
11. `cr_aircraft_status_log`
12. `cr_personnel_status_log`
13. `cr_mx_request_comment` (refs `cr_mx_request`)
14. `cr_user_filter_pref` (canvas-only, no flow writes)
15. `cr_schedule_event` (denormalized approved-MX mirror)

For each table, follow the column-by-column spec in `tables/<table>.md`.
Enable Auditing on every business table; turn off Activities + Notes
unless specifically needed.

### 1.3 Define security roles

Create 8 custom Dataverse security roles inside the solution per
`connections.md`. The per-table privilege grid is in that doc.

```
Solutions > MXConnect > + New > Security role
   For each:
     MXC AMT, MXC RMM, MXC Director, MXC QA,
     MXC Pilot, MXC Scheduler, MXC PR, MXC Payroll
```

### 1.4 Set up business unit hierarchy

In `Power Platform admin center > Environment > Settings > Users +
permissions > Business units`:

```
ihc.org (root)
├── 109 UT
├── WY/MT
├── ID/NV
├── UT/AZ
├── CO/NM
├── PAGE
├── WOODSCROSS
├── NC
├── SLC FW
├── OFFICE
└── ROVERS
```

Assign each user to their region's BU. RMM regional scoping comes free
once the role's privilege level is set to **BU**.

### 1.5 Smoke test

In `Power Apps Studio → Tables → cr_mx_request → Add row`, manually
create a test row. Confirm:
- Auto-numbered `cr_request_number` populates
- `cr_audit_correlation` accepts a GUID
- The row is visible to the appropriate role members per BU scoping

(The flow isn't built yet, so don't expect audit rows.)

---

## Week 2 — Canvas app shell

**Deliverable:** AMT can open the app, navigate the home screen, and
submit any of 6 MX Request types. Row lands in `cr_mx_request`.

### 2.1 New canvas app

```
Solutions > MXConnect > + New > App > Canvas app
   Name:    MX Connect
   Format:  Phone
```

### 2.2 Build per `powerfx/canvas-app.md`

That guide is sequential, 17 sections. Week 2 covers:
- Section 1–4: Setup, data sources, App.OnStart, layout shell
- Section 5: Home screen with bulletin feed + KPI tiles
- Section 8 (form portion): Universal MX Request submit form

Defer the rest (modules + approval inbox) to weeks 3–4.

### 2.3 Smoke test

Play the app, log in as 3 different user personas (AMT, RMM, Director),
verify role-based visibility. Submit one request of each type. Confirm
rows land in `cr_mx_request` with the right `cr_routing` value.

---

## Week 3 — Power Automate flow (trigger → card)

**Deliverable:** Submitting in the canvas app causes an Adaptive Card
to land in the right Teams channel (RMM / Scheduler / Director) within
2 seconds. Dataverse webhook trigger is near-realtime.

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

The trigger condition is critical — without `cr_decision eq null` the
flow re-fires on its own Decision writes.

### 3.2 Build per `flows/mxr-approval-flow-v2.json`

That JSON is the deployable definition. Week 3 covers up through the
Adaptive Card post:

1. Trigger
2. Initialize variables — `vAuditCorrelation`, `vRouting`,
   `vRecipientChannel`
3. Audit submitted (write `cr_audit` row, action 1)
4. Compose Adaptive Card body — uses `cards/approval-card.json` as the
   template, swaps tokens
5. Post adaptive card and wait for response — recipient channel from
   `vRecipientChannel`

### 3.3 Smoke test

Submit one request of each Routing type from canvas. Confirm:
- Flow run shows in `Power Automate → My flows → mxr-approval-flow-v2 →
  28-day run history` within 2 seconds
- Card lands in the right channel: RMM channel for RMM-routed,
  Scheduler channel for PR/Pilot Training, Director channel for Ask
  Leadership
- Card displays tail, type, window, requestor, routing badge,
  4 buttons (Approve / Deny / Request Info / Escalate)

---

## Week 4 — Approve / Deny / Request Info / Escalate / Timeout

**Deliverable:** All 4 decisions plus timeout work end-to-end.

### 4.1 Add Switch action

After "Post adaptive card and wait for response":

```
Switch on:  outputs('Post_card_and_wait')?['body/data/action']
   case "approve":      → Approve branch
   case "deny":         → Deny branch
   case "request_info": → Request Info branch
   case "escalate":     → Escalate branch
```

### 4.2 Approve branch

1. **Update row** — `cr_mx_request`: `cr_status` = 2 (Approved),
   `cr_decision` = 1 (Approve), `cr_decided_at`, `cr_decision_comment`,
   `cr_approver`
2. **Conditional**: skip Outlook step if Request Type is Ask Leadership
   or Other (request_type IN [5, 99])
3. **Create event V4** — Outlook calendar from `mx_outlook_calendar`
4. **Update row** — `cr_outlook_event_id`
5. **Post message** — Teams DM to requestor
6. **Create row** — `cr_audit` with action 2 (`mx_request.approved`)

### 4.3 Deny branch

1. **Update row** — `cr_status` = 3, `cr_decision` = 2,
   `cr_decision_reason` (the comment text), `cr_approver`
2. **Post message** — Teams DM with reason
3. **Create audit row** — action 3 (`mx_request.denied`)

### 4.4 Request Info branch

1. **Update row** — `cr_status` = 4 (More Info Requested), `cr_decision`
   = 3, `cr_more_info_request` (the question)
2. **Post message** — DM the question to requestor with deep-link to
   open the request in MX Connect and add the answer
3. **Create audit row** — action 6 (`mx_request.more_info_requested`)

When the submitter resubmits (canvas clears `cr_decision` and sets
`cr_status` back to 1), the flow re-fires on the modified trigger.

### 4.5 Escalate branch (manual)

1. **Update row** — `cr_status` = 5 (Escalated), `cr_decision` = 4,
   `cr_routing` = 3 (Director)
2. **Update row again** — set `cr_status` = 1 and `cr_decision` = null
   (re-arms the trigger)
3. **Create audit row** — action 5 (`mx_request.escalated`)

The next iteration of the flow sees Routing = Director and posts the
Adaptive Card to the Director channel.

### 4.6 Timeout branch

The "wait for response" action's `limit.timeout = PT24H`. On TimedOut
or Failed:

1. **Update row** — `cr_status` = 5, `cr_routing` = 3
2. **Update row** — reset `cr_status` = 1, `cr_decision` = null
3. **Send email V2** — Director group with full context
4. **Create audit row** — action 5, actor = `System`

### 4.7 Smoke test

Eight scenarios:
- Approve, Routing = RMM
- Approve, Routing = Scheduler (PR Movement)
- Approve, Routing = Director (Ask Leadership) → confirm no Outlook event
- Deny with reason
- Request Info → resubmit → re-routing fires correctly
- Manual Escalate from RMM channel → confirm card re-posts to Director
- Timeout (set `limit.timeout` to `PT5M` for testing)
- Force trigger failure → confirm escalation branch fires

Verify each: row state, Outlook event presence/absence, Teams DMs,
audit row count.

---

## Week 5 — Modules: Status / Bulletins / My Team / Tracking

**Deliverable:** All 8 application modules navigable + functional.

Build per `application-modules.md` and `powerfx/canvas-app.md` §7–14:

- **Status** (§7): Aircraft + Personnel status submission with
  status log writes
- **Schedule MX** (§8): list view with countdown timer, status pills
- **Ask Leadership** (§9): list + thread view with comment posts
- **Safety Report** (§10): submit + dashboard, anonymous toggle
- **Docs** (§11): Launch out to SharePoint Document Library
- **My Team** (§12): On-Call view, tappable call/text, Gantt mockup,
  On Shift toggle
- **MX Tracking** (§13): saved filter prefs, Upcoming Inspections chart
- **Bulletins** (§14): post / feed / resolve / Director-only delete

### 5.1 Auxiliary flows

Beyond the main approval flow, build these short flows:

- `aircraft-status-broadcast` — watches `cr_aircraft.cr_status`; on
  AOG transition auto-creates an Active Alert in `cr_operational_bulletin`
- `safety-report-triage` — separate flow for safety reports; rewrites
  `cr_reporter` to service account when Anonymous=Yes; posts to
  `mx_safety_channel_id`
- `bulletin-resolve-audit` — writes audit on resolve / archive / delete
- `personnel-status-log-from-canvas` — confirms status log rows are
  written by the canvas app (audit guard)

These are simpler than the main flow — each is 3–5 steps. Build directly
in Power Automate Studio; export JSON only if you need to re-import to
UAT/Prod.

---

## Week 6 — UAT

**Deliverable:** Sign-off from the Logan pilot region.

### 6.1 Promote to UAT

```bash
pac solution export --name MXConnect --path ./MXConnect-0.1.0.zip --managed false
pac auth select --name uat-environment
pac solution import --path ./MXConnect-0.1.0.zip
```

After import:
1. Re-map environment variables (Teams channel IDs differ)
2. Re-map connection references (re-authenticate Dataverse + Teams +
   Outlook connections)
3. Assign security roles to UAT user accounts
4. Turn on the flow

### 6.2 Pilot users

| Role        | Pilot users (UAT)                                       |
| ----------- | ------------------------------------------------------- |
| AMT         | 3–5 Logan AMTs                                          |
| RMM         | Steve Taul                                              |
| Director    | Billy Ortega                                            |
| QA          | Ryan Taul (ADOM)                                        |
| Pilot       | 1–2 Logan-based pilots                                  |
| Scheduler   | Carla Weir                                              |
| PR          | 1 PR team member                                        |
| Payroll     | (Power BI / Dataverse view link only, no app login)     |

Have them submit real requests over a 1-week window. Record:
- Average submit time per request type
- Adaptive Card response time
- Any blocking bugs (escalate immediately)
- UX nits (backlog for v0.2)

### 6.3 Issues to log

- Field validation gaps (e.g., "end before start" allowed?)
- Notification body wording
- Routing edge cases — should Time-Off ever route to Director?
- Missing audit fields that came up in real use

---

## Week 7 — Production

**Deliverable:** Logan region running live.

### 7.1 Promote to Prod

```bash
pac solution export --name MXConnect --path ./MXConnect-1.0.0.zip --managed true
pac auth select --name prod-environment
pac solution import --path ./MXConnect-1.0.0.zip
```

Use **managed solution** for Prod (`--managed true` on export) so users
can't accidentally edit components.

### 7.2 Monitor week 1

- `Power Platform admin center → Environments → IHC Prod → Analytics`
- Flow run failure rate target: <2% (mostly transient throttling)
- DLP policy violations target: 0
- App load time target: <3s on cellular
- Escalation rate (Director auto-escalations from timeouts) target:
  <5% of requests

If any miss, halt rollout and fix before expanding to other regions.

---

## Week 8 — Org-wide rollout

- Train remaining 8 RMMs on the Adaptive Card flow
- Onboard remaining ~340 active users to `MXC AMT`
- Onboard pilot/PR groups to their respective roles
- Hand off ownership doc to IHC IT

---

## Common pitfalls

| Symptom                                                | Cause                                                                       | Fix                                                                  |
| ------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Adaptive Card never appears in Teams                   | Wrong channel ID, or the bot isn't installed in the team                    | Verify channel IDs and add the Power Automate bot to the team        |
| Card appears but in wrong channel                      | `cr_routing` column missing or default-cast to RMM                          | Confirm canvas form sets Routing on every Patch                      |
| Flow re-fires on its own Decision writes               | Trigger condition missing `cr_decision eq null`                             | Add the filter expression in the trigger configuration               |
| Request Info loop doesn't re-trigger                   | Canvas didn't clear `cr_decision` on resubmit                               | Patch `cr_decision: Blank()` + `cr_status: Submitted` on resubmit    |
| Escalate doesn't re-route to Director channel          | Two-step Patch missed; need to set `cr_routing=3` AND `cr_status=1` AND `cr_decision=null` | See `powerfx/canvas-app.md` §6 btn_Escalate.OnSelect      |
| Outlook event created for Ask Leadership requests      | Conditional Skip_outlook branch not wired in flow                           | Verify the If action checks `cr_request_type` ∉ {5, 99}              |
| Patch fails with "Network error"                       | Canvas talking to wrong environment or table not in solution                | Re-add the data source; confirm table is part of MXConnect solution  |
| Audit rows never written                               | Service account lacks Append-To privilege on `cr_audit`                     | Add Append-To to `MXC AMT` and `MXC RMM` roles                       |
| Outlook event in wrong calendar                        | Env variable references calendar name, not ID                               | Use the calendar ID; names vary by user                              |
| RMM sees other regions' requests                       | RMM role configured with Org privilege instead of BU                        | Check the role's `cr_mx_request` Read privilege — should be BU       |
| Anonymous safety reports show reporter name            | safety-report-triage flow not catching Anonymous=Yes                        | Verify the flow's Assign action runs as the service account          |

---

## Phase 1 acceptance criteria

Phase 1 is done when, in Prod:

- [ ] An AMT can submit any of 6 MX Request types from a phone in under
      30 seconds
- [ ] The Adaptive Card lands in the right Teams channel (RMM /
      Scheduler / Director / Safety) within 2 seconds
- [ ] Approvers can Approve / Deny / Request Info / Escalate from the
      Teams card AND from the in-app inbox
- [ ] Approved MX Schedule / PR / Pilot Training / Time Off requests
      create an Outlook calendar event automatically
- [ ] Approved Ask Leadership requests do NOT create an Outlook event
- [ ] Request Info round-trip works (approver asks → submitter answers
      → flow re-triggers → final decision)
- [ ] Manual Escalate re-routes to Director channel
- [ ] Timeout (24h) auto-escalates to Director with email + audit row
- [ ] Status submissions hit Aircraft + Aircraft Status Log atomically
- [ ] Bulletins post + resolve + permanent-delete (Director only)
- [ ] Anonymous safety reports never leak the reporter back
- [ ] Audit row exists for every state change across all 8 modules
- [ ] DLP review signed off by IHC IT
- [ ] Three weeks of clean run history (>98% success) in the Logan pilot

When all checked, you're ready for Phase 2 (custom connectors +
read-only scheduler + fleet map).
