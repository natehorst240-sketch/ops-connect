# Phase 1 Runbook — Request → Approval

**Goal:** AMT submits MX Request from Power Apps Mobile → RMM (or Director,
for Ask Leadership requests) gets Adaptive Card in Teams → approves /
denies → data layer + Outlook + DM all update automatically. Audit log
captures everything.

**Stack:** Power Apps (canvas) + Power Automate + Teams + SharePoint Lists
(Phase 1 default) **or** Dataverse (Phase 2 upgrade) + Outlook

**Estimated effort:** 6–8 weeks, 1 Power Platform developer + IHC IT liaison.

---

## Two deployable shapes

This runbook describes the operational walkthrough at the Dataverse-final
endpoint. **Phase 1 ships on SharePoint Lists** to avoid the Power Apps
Premium licensing tax — every step below maps cleanly to either backing
store, with two practical differences:

| Step                          | SharePoint variant                                                       | Dataverse variant                       |
| ----------------------------- | ------------------------------------------------------------------------ | --------------------------------------- |
| Tables                        | 10 SharePoint Lists (see `../sharepoint-lists/phase1-blank-templates/`)  | `cr_mx_request` + `cr_audit`            |
| Flow JSON                     | `flows/mxr-approval-flow-sharepoint.json`                                | `flows/mxr-approval-flow-v2.json`       |
| Connection references         | 4 (`cr_SharePointConnection`, Teams, Outlook, Office365Users)            | 3 (Dataverse, Teams, Outlook)           |
| Security model                | List-level + item-level via SharePoint groups                            | Dataverse roles + business-unit scope   |
| Status filter on trigger      | Trigger condition `Status eq 'Submitted'`                                | Trigger filter `cr_status eq 1`         |
| Routing                       | `Routing` Choice column (RMM / Director) drives channel selection        | Same; bound to environment variables    |
| Premium licensing             | Not required for end users (Standard connector)                          | Required (Per-User or Per-App)          |

When this runbook says *"create a row in cr_mx_request"*, in Phase 1 read
that as *"create an item in the MX Requests list"*. Field names map 1:1
between the two shapes — see the column reference in
`../sharepoint-lists/phase1-blank-templates/README.md`.

---

## Pre-flight checklist

Don't start week 1 until all of these are true:

- [ ] You have **Power Platform admin** access in the IHC tenant
- [ ] You can create **three environments**: Dev, UAT, Prod (or have admins
      stand them up). Same region.
- [ ] **Solution publisher** is registered (display name `IHC`, prefix `ihc`
      or whatever your IT picks). Solution name `MXConnect`.
- [ ] **DLP policy review** scheduled with IHC IT — the flow uses Teams,
      Outlook, SharePoint (Phase 1) or Dataverse (Phase 2), and (Phase 2)
      custom connectors. Confirm those classifications match.
- [ ] **Approver Teams channels exist** — at least `Logan RMM` and a
      `Director` channel (the Ask Leadership routing target). Capture
      both channel IDs.
- [ ] **Dev SKU sufficient** — Phase 1 needs no Premium; Phase 2 needs
      Power Apps Premium (Per-App or Per-User) trial.
- [ ] **CompleteFlight + ProteanHub + SkyRouter API keys** — NOT needed for
      Phase 1, but request them now; they take 2–4 weeks at the source.

If any box is unchecked, fix it before week 1.

---

## Environment variables

Define these in the solution before week 2. Each varies between Dev / UAT /
Prod — environment variables exist exactly to keep them separate.

| Variable                        | Type   | Example value                       | Notes                                              |
| ------------------------------- | ------ | ----------------------------------- | -------------------------------------------------- |
| `mx_approver_team_id`           | String | `19:abc123...@thread.tacv2`         | Microsoft Teams Team ID for IHC Life Flight        |
| `mx_approver_channel_id`        | String | `19:def456...@thread.tacv2`         | Logan RMM channel ID (default routing)             |
| `mx_director_channel_id`        | String | `19:ghi789...@thread.tacv2`         | Director channel ID (Ask Leadership routing)       |
| `mx_outlook_calendar`           | String | `Logan MX Calendar`                  | Shared calendar name (or ID)                       |
| `mx_request_timeout_hours`      | Number | `24`                                 | Approval SLA before escalation                     |
| `mx_audit_retention_days`       | Number | `2555`                               | 7 years (HIPAA)                                    |
| `mx_app_deeplink_base`          | String | `https://make.powerapps.com/…`       | URL prefix for deep-links from emails / DMs        |
| `mx_director_email`             | String | `directors@ihc.org`                  | Recipient for timeout escalation emails            |

For the SharePoint variant, also set: `mx_site_url`, `mx_list_requests`,
`mx_list_audit`, `mx_list_aircraft`. These are inlined as flow parameters
rather than Dataverse env vars (SharePoint-only deployments can skip the
env-var feature entirely).

Store them in `Power Platform admin center → Solutions → MXConnect →
Environment variables`.

---

## Routing — RMM vs Director ("Ask Leadership")

Every MX Request carries a **`Routing`** Choice column with two values:

- **`RMM`** (default) — most maintenance windows, time-off-coverage swaps,
  aircraft status changes. Adaptive Card goes to the regional RMM channel.
- **`Director`** — "Ask Leadership" requests. Anything that needs an
  exception, budget call, or policy interpretation. Card routes to the
  Director channel instead. Same approval shape, same audit trail —
  just a different recipient.

The canvas app picks `RMM` by default and exposes `Director` only when
the user toggles "Ask Leadership" on the form. The flow reads the column
and switches `recipient/channelId` between the two env vars. Status,
audit, and downstream DM all work identically.

---

## Week 1 — Foundation

**Deliverable:** Data layer + security + environment is queryable.

### 1.1 Create the solution

In Dev:

```
Power Apps Studio → Solutions → New solution
   Display name:  MX Connect
   Name:          MXConnect
   Publisher:     IHC (prefix ihc)
   Version:       0.1.0.0
```

### 1.2 Create the data layer

**Phase 1 (SharePoint):** Import the seven blank CSVs from
`../sharepoint-lists/phase1-blank-templates/` to a single SharePoint site
called `MXConnect`. The README in that folder lists every column type,
choice value, and lookup wiring step. Capture each list's GUID from
`List settings > List ID`.

**Phase 2 (Dataverse):** Follow `tables/cr_mx_request.md` and
`tables/cr_audit.md` for the field-by-field specs. Create both inside the
`MXConnect` solution.

Key decisions baked into both shapes:
- Primary identifier: `Request Number` (auto-numbered, format
  `MXR-{0:00000}`)
- Status field is a `Choice` (not Dataverse `Status`) so it's freely
  editable by flows; canonical states `Submitted`, `Approved`, `Denied`,
  `Escalated`, `Cancelled`
- Routing is a separate `Choice` column with values `RMM`, `Director`
- Aircraft reference: SharePoint Lookup → Aircraft list (Phase 1) or
  Dataverse `cr_aircraft` lookup (Phase 2)

### 1.3 Define security

**Phase 1 (SharePoint):** Three SharePoint groups on the MXConnect site:

| Group            | MX Requests permissions               | Audit Log permissions |
| ---------------- | ------------------------------------- | --------------------- |
| `MXC AMT`        | Contribute (own items only)           | Read (own only)       |
| `MXC RMM`        | Contribute (full)                     | Read                  |
| `MXC Director`   | Read + Contribute on Routing=Director | Read                  |

Set "Item-level permissions" on the MX Requests list to "Read items that
were created by the user" + "Edit items that were created by the user"
for the AMT group.

**Phase 2 (Dataverse):** Three Dataverse roles:

| Role             | cr_mx_request privileges          | cr_audit privileges |
| ---------------- | --------------------------------- | ------------------- |
| `MXC AMT`        | Create, Read (own), Append        | Read (own)          |
| `MXC RMM`        | Read (BU), Write (BU), Append To  | Read (BU)           |
| `MXC Director`   | Read (Org), Append To             | Read (Org)          |

### 1.4 Smoke test

Manually create an MX Requests row via `SharePoint > MX Requests > New`
(Phase 1) or `Power Apps Studio → Tables → cr_mx_request → Add row`
(Phase 2). Confirm an audit row gets written by your (forthcoming) flow
— OR for week 1, just confirm the list/table accepts data.

---

## Week 2 — Canvas app shell

**Deliverable:** AMT can open the app on a phone, fill the form, hit Submit;
a row lands in the MX Requests list (status = `Submitted`).

### 2.1 New canvas app

In the solution:

```
+ New → App → Canvas app
   Name:          MX Request
   Format:        Phone
```

### 2.2 Build per `powerfx/canvas-app.md`

That doc walks every screen and every formula. Two screens for Phase 1:

- `frmRequest` — the submission form (with Routing toggle for "Ask
  Leadership")
- `frmConfirmation` — "Submitted, request #MXR-00012, you'll get a Teams DM"

### 2.3 Wire OnSubmit

The submission button's `OnSelect` calls `Patch()` against the MX Requests
list (Phase 1) or `cr_mx_request` (Phase 2). Formula is in
`powerfx/canvas-app.md` §3.5.

### 2.4 Smoke test

Play the app, fill the form, submit. Confirm a row lands with the right
values. Don't worry about the flow yet — that's week 3.

---

## Week 3 — Power Automate flow (trigger → card)

**Deliverable:** Submitting in the app causes an Adaptive Card to appear in
the right Teams channel within 30 seconds (Phase 1, SharePoint trigger
poll interval) or 2 seconds (Phase 2, Dataverse webhook).

### 3.1 New cloud flow

In the solution:

```
+ New → Automation → Cloud flow → Automated
   Name:    mxr-approval-flow-sharepoint     (Phase 1)
            mxr-approval-flow-v2             (Phase 2)
   Trigger: When an item is created or modified  (Phase 1, SharePoint)
            When a row is added                  (Phase 2, Dataverse)
```

### 3.2 Build per the matching JSON

That file is the deployable definition. For week 3, build only the first
four actions:

1. Trigger — item created/modified (SharePoint) or row added (Dataverse)
2. Filter to Status = `Submitted` only
3. Compose Adaptive Card body — use `cards/approval-card.json` as the
   template, replace tokens with flow variables
4. Post adaptive card and wait for a response (Teams) — recipient channel
   chosen via Routing column (RMM channel by default, Director channel
   for Ask Leadership)

### 3.3 Adaptive Card payload

Use the JSON in `cards/approval-card.json` as the body of the
"Post adaptive card and wait for response" action. The card has two
actions: `Approve` and `Deny`, plus a comment input. Returned values flow
back to Power Automate.

### 3.4 Smoke test

Submit a request from the canvas app (one with Routing = `RMM`, one with
`Director`). Confirm:
- Flow run shows in `Power Automate → My flows → mxr-approval-flow-* →
  28-day run history`
- Adaptive Card appears in the matching channel
- Card displays the right tail, type, window, requestor, routing badge

---

## Week 4 — Approve / Deny / Escalate branches

**Deliverable:** Clicking Approve or Deny in the Teams card finalizes the
request. On approve: Outlook calendar event created, DM to requestor,
status set to `Approved`, audit row written. On deny: DM with reason,
status `Denied`, audit row. On 24h timeout: Director email + status
`Escalated` + audit row.

### 4.1 Add Switch action

After "Post adaptive card and wait for response":

```
Switch
   on:    outputs('Post_card_and_wait')?['body/data/action']
   case "approve":  approval branch
   case "deny":     denial branch
```

### 4.2 Approve branch

1. **Update item / Update row** — status → `Approved`, decided_at → now,
   approver claims → responder UPN
2. **Create event (V4)** — Office 365 Outlook. Calendar from environment
   variable `mx_outlook_calendar`. Subject = `{tail} · {type}`. Start/end
   from the request fields.
3. **Update item / Update row** — write back the new event ID
4. **Post message in chat or channel** — Teams. Recipient = requestor.
   Body = `Your MX request {request_number} was approved by
   {approver_name}. Comment: {comment}`
5. **Create audit row** — Action = `mx_request.approved`. Actor =
   approver. Actor role = `RMM` or `Director` based on Routing. Metadata
   = full decision payload.

### 4.3 Deny branch

1. **Update item / Update row** — status → `Denied`, decided_at → now
2. **Post message in chat or channel** — Teams DM, body =
   `Your MX request {request_number} was denied by {approver_name}.
   Comment: {comment}`
3. **Create audit row** — Action = `mx_request.denied`.

(No Outlook event for denied; nothing to schedule.)

### 4.4 Timeout / failure branch

The "wait for response" action accepts `limit.timeout = PT24H`. The flow
catches `TimedOut` and `Failed` states with a parallel branch:

1. **Update item / Update row** — status → `Escalated`, comment =
   `Auto-escalated after {N}h without decision`
2. **Send an email (V2)** — escalate to `mx_director_email` with the full
   request context and a deep-link back into MX Connect
3. **Create audit row** — Action = `mx_request.escalated`. Actor role =
   `System`.

### 4.5 Smoke test

Five scenarios:
- Approve from card with no comment, Routing = RMM
- Approve with comment, Routing = Director (Ask Leadership)
- Deny with comment
- Wait past timeout (set `limit.timeout` to `PT5M` for testing)
- Force trigger failure (e.g. revoke SharePoint connector mid-run) and
  confirm the escalation branch fires

Verify each: list/table status, Outlook event presence, Teams DM, audit row.

---

## Week 5 — UAT

**Deliverable:** Sign-off from the IHC pilot region (Logan).

### 5.1 Promote to UAT

```bash
pac solution export --name MXConnect --path ./MXConnect-0.1.0.zip --managed false
pac auth select --name uat-environment
pac solution import --path ./MXConnect-0.1.0.zip
```

After import: re-run environment variable mapping (Teams channel IDs and
SharePoint list GUIDs will differ) and re-authenticate connectors.

### 5.2 Pilot users

Grant `MXC AMT` to 3–5 Logan AMTs and `MXC RMM` to Steve Taul. Add the
director group (`MXC Director`) so Ask Leadership requests have a real
recipient. Have them submit real requests over a 1-week window.

### 5.3 Issues to log

- Field validation gaps (e.g., "end before start" allowed?)
- Notification body wording
- Routing edge cases — should Time-Off ever route to Director?
- Missing fields that came up in real use (don't add them in week 5;
  backlog for v0.2)

---

## Week 6 — Production

**Deliverable:** Logan region running live. One RMM, ~10 AMTs, 1 Director
on the Ask Leadership channel.

### 6.1 Promote to Prod

Same `pac solution import` command, target Prod environment. Use
**managed solution** for Prod (`--managed true` on export) so users can't
accidentally edit components.

### 6.2 Monitor

- `Power Platform admin center → Environments → IHC Prod → Analytics`
- Watch flow run failure rate in week 1; expect <2% (mostly transient
  SharePoint or Dataverse throttling)
- DLP policy violations — should be zero; if any, halt the rollout and
  fix before expanding

---

## Week 7–8 — Org-wide rollout

- Train remaining RMMs (St. George, WY/MT, ID/NV, CO/NM, UT/AZ, PAGE,
  SLC FW, NC) on the Adaptive Card flow
- Onboard remaining ~340 active users to `MXC AMT`
- Hand off ownership doc to IHC IT (separate file, see `runbook-handoff.md`)

---

## Common pitfalls

| Symptom                                      | Cause                                                                       | Fix                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| Adaptive Card never appears in Teams         | Post action used the wrong channel ID, or the bot isn't installed in the team | Verify channel IDs and add the Power Automate bot to the team |
| Ask Leadership requests land in RMM channel  | `Routing` column missing or default-cast to `RMM` because the form didn't set it | Confirm canvas app sets Routing on every Patch          |
| `Patch` fails with "Network error"            | Canvas app is talking to the wrong list / environment                       | Check the data source connection; re-add the list/table  |
| Flow times out at "wait for response"         | RMM didn't see the card (notifications muted on mobile)                     | Add a follow-up DM after `PT{half-of-timeout}H`           |
| Audit rows never written                      | Service account lacks Append/Contribute privilege on Audit Log              | Add Edit/Append-To to `MXC AMT` and `MXC RMM`             |
| Outlook event in wrong calendar              | Environment variable references calendar name, not ID                       | Use the calendar ID; names vary by user                   |
| `Patch` works but row missing fields          | Schema names use the wrong publisher prefix (Dataverse) or wrong internal name (SharePoint) | Search/replace prefix in formulas; for SharePoint inspect `_x0020_` encoded names |
| Trigger fires repeatedly on every status change (Phase 1) | "When item is created or modified" trigger lacks a Status filter | Add the `Filter_to_submitted_only` condition (already in the JSON) and double-check the column internal name |

---

## Phase 1 acceptance criteria

Phase 1 is done when, in Prod:

- [ ] An AMT can submit a request from a phone in under 30 seconds
- [ ] The Adaptive Card lands in the right Teams channel (RMM **or**
      Director, based on Routing) within 30 seconds
- [ ] The RMM (or Director, for Ask Leadership) can approve or deny with
      a comment from the Teams card
- [ ] An approved request creates an Outlook calendar event automatically
- [ ] The requestor receives a Teams DM within 5 seconds of decision
- [ ] An audit row exists in the Audit Log list for every state change
- [ ] Timeouts trigger Director escalation email + audit row
- [ ] DLP review signed off by IHC IT
- [ ] Three weeks of clean run history (>98% success) in the Logan pilot

When all checked, you're ready for Phase 2 (the Dataverse upgrade).
