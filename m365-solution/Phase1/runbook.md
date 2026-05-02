# Phase 1 Runbook — Request → Approval

**Goal:** AMT submits MX Request from Power Apps Mobile → RMM gets Adaptive
Card in Teams → approves/denies → Dataverse + Outlook + DM all update
automatically. Audit log captures everything.

**Stack:** Power Apps (canvas) + Power Automate + Teams + Dataverse + Outlook

**Estimated effort:** 6–8 weeks, 1 Power Platform developer + IHC IT liaison.

---

## Pre-flight checklist

Don't start week 1 until all of these are true:

- [ ] You have **Power Platform admin** access in the IHC tenant
- [ ] You can create **three environments**: Dev, UAT, Prod (or have admins
      stand them up). Same region, ideally Dataverse-enabled.
- [ ] **Solution publisher** is registered (display name `IHC`, prefix `ihc`
      or whatever your IT picks). Solution name `MXConnect`.
- [ ] **DLP policy review** scheduled with IHC IT — the flow uses Teams,
      Outlook, Dataverse, and (Phase 2) custom connectors. Confirm those
      classifications match.
- [ ] **Approver Teams channel exists** — e.g., `Logan RMM` channel in the
      `IHC Life Flight` Team. Capture the channel ID.
- [ ] **Dev SKU sufficient** — confirm the Dev environment has Dataverse
      capacity and Power Apps Premium (Per-App or Per-User) trial.
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
| `mx_approver_channel_id`        | String | `19:def456...@thread.tacv2`         | Logan RMM channel ID                                |
| `mx_outlook_calendar`           | String | `Logan MX Calendar`                  | Shared calendar name (or ID)                       |
| `mx_request_timeout_hours`      | Number | `24`                                 | Approval SLA before escalation                     |
| `mx_audit_retention_days`       | Number | `2555`                               | 7 years (HIPAA)                                    |

Store them in `Power Platform admin center → Solutions → MXConnect →
Environment variables`.

---

## Week 1 — Foundation

**Deliverable:** Dataverse schema + security roles + environment is queryable.

### 1.1 Create the solution

In Dev:

```
Power Apps Studio → Solutions → New solution
   Display name:  MX Connect
   Name:          MXConnect
   Publisher:     IHC (prefix ihc)
   Version:       0.1.0.0
```

### 1.2 Add Dataverse tables

Follow `tables/cr_mx_request.md` and `tables/cr_audit.md` for the field-by-
field specs. Create both inside the `MXConnect` solution.

Key decisions baked in:
- Primary column: `cr_request_number` (auto-numbered, format `MXR-{0:00000}`)
- Status field is a `Choice` (not `Status`) so it's freely editable by
  flows; canonical states `Submitted`, `Approved`, `Denied`, `Cancelled`
- Relationship `cr_aircraft` lookup off the (forthcoming) aircraft table.
  For Phase 1, model it as a free-text Tail field; in Phase 2 swap in the
  lookup. Don't blocking-design Phase 2 today.

### 1.3 Define security roles

Create three roles in the solution:

| Role             | cr_mx_request privileges          | cr_audit privileges |
| ---------------- | --------------------------------- | ------------------- |
| `MXC AMT`        | Create, Read (own), Append        | Read (own)          |
| `MXC RMM`        | Read (BU), Write (BU), Append To  | Read (BU)           |
| `MXC Director`   | Read (Org), Append To             | Read (Org)          |

BU = Business Unit. Org = Organization. Owner-level read for AMTs prevents
them seeing other regions' requests.

### 1.4 Smoke test

Manually create a `cr_mx_request` row via `Power Apps Studio → Tables →
cr_mx_request → Add row`. Confirm an audit row gets written by your
(forthcoming) flow — OR for week 1, just confirm the table accepts data.

---

## Week 2 — Canvas app shell

**Deliverable:** AMT can open the app on a phone, fill the form, hit Submit;
a row lands in `cr_mx_request` (status = `Submitted`).

### 2.1 New canvas app

In the solution:

```
+ New → App → Canvas app
   Name:          MX Request
   Format:        Phone
```

### 2.2 Build per `powerfx/canvas-app.md`

That doc walks every screen and every formula. Two screens for Phase 1:

- `frmRequest` — the submission form
- `frmConfirmation` — "Submitted, request #MXR-00012, you'll get a Teams DM"

### 2.3 Wire OnSubmit

The submission button's `OnSelect` calls `Patch()` against `cr_mx_request`.
Formula is in `powerfx/canvas-app.md` §3.5.

### 2.4 Smoke test

Play the app, fill the form, submit. Confirm a row in `cr_mx_request` with
the right values. Don't worry about the flow yet — that's week 3.

---

## Week 3 — Power Automate flow (trigger → card)

**Deliverable:** Submitting in the app causes an Adaptive Card to appear in
the Logan RMM Teams channel within 2 seconds.

### 3.1 New cloud flow

In the solution:

```
+ New → Automation → Cloud flow → Automated
   Name:    mxr-approval-flow-v2
   Trigger: When a row is added (Microsoft Dataverse)
     Table: cr_mx_request
     Scope: Organization
```

### 3.2 Build per `flows/mxr-approval-flow.json`

That file is the deployable definition. For week 3, build only the first
four actions:

1. Trigger — row added
2. Get aircraft details (Phase 1: parse the tail string; Phase 2: lookup)
3. Compose Adaptive Card body — use `cards/approval-card.json` as the
   template, replace tokens with flow variables
4. Post adaptive card and wait for a response (Teams)

### 3.3 Adaptive Card payload

Use the JSON in `cards/approval-card.json` as the body of the
"Post adaptive card and wait for response" action. The card has two
actions: `Approve` and `Deny`, plus a comment input. Returned values flow
back to Power Automate.

### 3.4 Smoke test

Submit a request from the canvas app. Confirm:
- Flow run shows in `Power Automate → My flows → mxr-approval-flow-v2 →
  28-day run history`
- Adaptive Card appears in the Logan RMM Teams channel
- Card displays the right tail, type, window, requestor

---

## Week 4 — Approve / Deny branches

**Deliverable:** Clicking Approve or Deny in the Teams card finalizes the
request. On approve: Outlook calendar event created, DM to requestor,
status set to `Approved`, audit row written. On deny: DM with reason,
status `Denied`, audit row.

### 4.1 Add Condition action

After "Post adaptive card and wait for response":

```
Condition
   outputs('Post_adaptive_card')?['body/action']  is equal to  approve
```

### 4.2 If yes (approved) branch

1. **Update a row** — `cr_mx_request`, status → `Approved`, decided_at →
   `utcNow()`, decided_by → the responder
2. **Create event (V4)** — Office 365 Outlook connector. Calendar from
   environment variable `mx_outlook_calendar`. Subject = `{tail} · {type}`.
   Start/end from the request fields.
3. **Post message in chat or channel** — Teams. Recipient = requestor.
   Body = `✅ Your MX request {request_number} was approved by
   {approver_name}. Comment: {comment}`
4. **Add a row** — `cr_audit`. Action = `mx_request.approved`. Subject =
   request id. Actor = approver. Metadata = full decision payload.

### 4.3 If no (denied) branch

1. **Update a row** — `cr_mx_request`, status → `Denied`, decided_at → now
2. **Post message in chat or channel** — Teams DM, body =
   `❌ Your MX request {request_number} was denied by {approver_name}.
   Comment: {comment}`
3. **Add a row** — `cr_audit`. Action = `mx_request.denied`.

(No Outlook event for denied; nothing to schedule.)

### 4.4 Timeout branch

The "wait for response" action accepts a timeout. Set it to
`PT{mx_request_timeout_hours}H`. On timeout:

1. **Send an email (V2)** — escalate to the Director group
2. **Update a row** — status → `Submitted` (unchanged); add comment
   `Auto-escalated after {N}h`
3. **Add a row** — `cr_audit`. Action = `mx_request.escalated`.

### 4.5 Smoke test

Four scenarios:
- Approve from card with no comment
- Approve with comment
- Deny with comment
- Wait past timeout (set to `PT5M` for testing)

Verify each: Dataverse status, Outlook event presence, Teams DM, audit row.

---

## Week 5 — UAT

**Deliverable:** Sign-off from the IHC pilot region (Logan).

### 5.1 Promote to UAT

```bash
pac solution export --name MXConnect --path ./MXConnect-0.1.0.zip --managed false
pac auth select --name uat-environment
pac solution import --path ./MXConnect-0.1.0.zip
```

After import: re-run environment variable mapping (Teams channel ID will
differ) and re-authenticate connectors.

### 5.2 Pilot users

Grant `MXC AMT` role to 3–5 Logan AMTs and `MXC RMM` to Steve Taul. Have
them submit real requests over a 1-week window.

### 5.3 Issues to log

- Field validation gaps (e.g., "end before start" allowed?)
- Notification body wording
- Missing fields that came up in real use (don't add them in week 5; backlog
  for v0.2)

---

## Week 6 — Production

**Deliverable:** Logan region running live. One RMM, ~10 AMTs.

### 6.1 Promote to Prod

Same `pac solution import` command, target Prod environment. Use
**managed solution** for Prod (`--managed true` on export) so users can't
accidentally edit components.

### 6.2 Monitor

- `Power Platform admin center → Environments → IHC Prod → Analytics`
- Watch flow run failure rate in week 1; expect <2% (mostly transient
  Dataverse throttling)
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
| Adaptive Card never appears in Teams         | Post action used the wrong channel ID, or the bot isn't installed in the team | Verify `mx_approver_channel_id` and add the Power Automate bot to the channel |
| `Patch` fails with "Network error"            | Canvas app is talking to the wrong Dataverse environment                    | Check the data source connection; re-add the table       |
| Flow times out at "wait for response"         | RMM didn't see the card (notifications muted on mobile)                     | Add a follow-up DM after `PT{half-of-timeout}H`           |
| `cr_audit` rows never written                 | Service principal lacks Append-To privilege on `cr_audit`                   | Add `Append To` to `MXC AMT` and `MXC RMM` roles          |
| Outlook event in wrong calendar              | Environment variable references calendar name, not ID                       | Use the calendar ID; names vary by user                   |
| `Patch` works but row missing fields          | Schema names use the wrong publisher prefix (`cr_` vs `ihc_`)               | Search/replace the prefix in all formulas                 |

---

## Phase 1 acceptance criteria

Phase 1 is done when, in Prod:

- [ ] An AMT can submit a request from a phone in under 30 seconds
- [ ] The Adaptive Card lands in the right RMM channel within 5 seconds
- [ ] The RMM can approve or deny with a comment from the Teams card
- [ ] An approved request creates an Outlook calendar event automatically
- [ ] The requestor receives a Teams DM within 5 seconds of decision
- [ ] An audit row exists in `cr_audit` for every state change
- [ ] DLP review signed off by IHC IT
- [ ] Three weeks of clean run history (>98% success) in the Logan pilot

When all eight are checked, you're ready for Phase 2.
