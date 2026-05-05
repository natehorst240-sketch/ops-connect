# Phase 1 — Copilot Prompt Cookbook

Copy-paste prompts that actually save time during the Phase 1 build.
Tested against Copilot in Power Apps Studio + Power Automate Studio +
the make.powerapps.com home page.

> **All names below conform to `NAMING-CONVENTIONS.md`.** Personnel
> tables use a regular hyphen (`Personnel - Maintenance`), not an em
> dash. Choice qualifiers use the singular table display name
> (`Status (MX Request)`, not `Status (MX Requests)`). If you're
> copy-pasting an old prompt from elsewhere, normalize against the
> conventions doc first.

For each prompt: **what to load first**, the **prompt itself**, and
what to **manually fix afterward**. Copilot gets you 50–70% of the way;
the spec docs (`tables/`, `flows/`, `powerfx/canvas-app.md`) are the
ground truth for the last 30%.

---

## ⚠️ READ FIRST — Copilot in Power Apps cannot be paused or cancelled

Once you submit a prompt, Copilot runs to completion. There is **no
stop button, no abort, no Esc**. If it goes off the rails — generates
the wrong table, mis-types columns, names things weirdly — your only
recourse is to wait it out, then **clean up after**.

Mitigations:

1. **Save the solution before each Copilot run.** `Ctrl+S` on the
   solution itself. If Copilot creates 6 garbage columns, you can roll
   back via solution version restore.
2. **Run prompts on small surface area.** Don't paste a 14-step flow
   prompt as one ask — break into stages (see Chunked prompts below).
3. **Test in Dev only, never in Prod.** A bad Copilot run in Prod is
   harder to clean up than just wiping Dev.
4. **Duplicate the table first if editing.** When having Copilot
   "modify" an existing table, copy the table first. If Copilot
   destroys it, you still have the copy.
5. **Read the prompt one more time before submitting.** No takebacks.
6. **Confirm MX Connect is set as preferred solution** before any
   table-creation prompt. Otherwise tables go to Default Publisher
   (`cr87b_`) — see `rebuild-from-clean-state.md`.

The prompts in this doc are pre-chunked to minimize blast radius —
each one builds **one** thing. Don't combine them into a megaprompt.

---

## Table 1 — Where Copilot helps (and doesn't)

| Task                              | Copilot helps?  | Time saved | Pause-safe?* |
| --------------------------------- | --------------- | ---------- | ------------ |
| Generate Dataverse table from CSV | ✅ Big           | 60–80% per table | ⚠️ No |
| Generate Choice options           | ✅ Medium        | 30–50%     | ⚠️ No        |
| Scaffold Power Automate flow      | ✅ Medium        | 50–60%     | ⚠️ No        |
| Write individual Power Fx formula | ✅ Big           | 70%        | ✅ Yes (just don't accept) |
| Design Adaptive Card              | ✅ Medium        | 40%        | ✅ Yes (external designer) |
| Generate seed/test data           | ✅ Big           | 80%        | ⚠️ No        |
| Write help text + tooltips        | ✅ Big           | 90%        | ✅ Yes        |
| Configure security roles          | ❌ Manual UI     | 0%         | n/a          |
| Set up business units             | ❌ Manual UI     | 0%         | n/a          |
| Build relationships pane manually | ❌ UI-only       | 0%         | n/a          |
| Map env vars to connection refs   | ❌ Manual UI     | 0%         | n/a          |

*"Pause-safe" = the prompt produces a *suggestion* you accept or
reject (safe), vs. *executes a change* on your environment (no undo).

---

# Tables — chunked prompts (safer)

Each table is one prompt. Don't ask Copilot to build all 15 in one go
— if it fumbles the first, you can't stop it before the rest get the
same treatment. Save solution between each.

## Prompt 1 — Generate ONE table from a populated CSV

**Where:** make.powerapps.com → Solutions → MX Connect → + New →
Table → Get data → Excel/CSV.

**What to load:** Upload one populated CSV at a time (e.g.,
`04-aircraft.csv`).

**Prompt:**

```
Use this CSV to create a Dataverse table called "Aircraft" with schema
name "cr_aircraft". The first column "Tail" is the primary column —
make it Single line of text, max length 8, required. Infer column
types from the data: tail/serial/make/model are text, region/base are
text-for-now (I'll convert to lookups later), status is a choice with
values In Service / AOG / Maintenance / Away from Base / Unavailable
/ Spare. Enable auditing on the table.
```

**Save solution → review the table → fix issues → save again → next
table.**

**What to fix afterward:**
- Convert text columns that should be Lookup (Type, Base, Region) once
  the target tables exist
- Add Status Updated At + Status Updated By columns (they aren't in
  the CSV)
- Set the RMM column to Person/Group manually
- **Verify schema name** — should be `cr_aircraft`, not `cr87b_aircraft`

**Repeat for:** every table that has a populated CSV. Count: 8 tables.
Pause for 30 seconds between each to verify the previous result.

---

## Prompt 2 — Generate Global Choice options (one at a time)

**Where:** Solutions → MX Connect → + New → More → Choice.

**Prompt:**

```
Create a global Choice option called "Status (MX Request)" with
schema name "cr_mx_request_status". Six values:

  1: Submitted (default)
  2: Approved
  3: Denied
  4: More Info Requested
  5: Escalated
  6: Cancelled
```

Run this 22 times — once per global choice in `NAMING-CONVENTIONS.md
§4`. Yes, tedious. But each run is small and contained, so failures
are easy to clean up.

**Don't batch all 22 into one prompt.** If it mis-types one,
it'll mis-type all of them and you lose the audit trail of what got
created.

**Use the singular table qualifier** — `Status (MX Request)`, not
`Status (MX Requests)`. The Choice describes one entity's enum, not a
collection. (See `NAMING-CONVENTIONS.md §4` for all 22.)

---

## Prompt 3 — Generate ONE table from text spec (no CSV)

**Where:** Solutions → MX Connect → + New → Table → Describe what you want.

**Prompt:**

```
Create a Dataverse table "MX Audit" with schema name "cr_audit".
Primary column: "Audit ID", autonumber format AUD-{SEQNUM:000000}.

Other columns:
- Event At: date and time (UTC), required
- Actor: lookup to User (systemuser), required
- Actor Role: text 32, required
- Action: choice (use existing global choice "Action (MX Audit)")
- Subject Table: text 40, required
- Subject ID: text 50, required
- Audit Correlation: text 50, required
- Metadata: multiline text 4000
- Comment: text 500
- Retention Until: date and time, required

Enable auditing. Don't enable Activities or Notes.
```

**What to fix afterward:** Verify the autonumber format and seed value;
the Actor lookup may need to be re-pointed to the right systemuser
table (it's a system table, not custom).

---

# Flows — chunked prompts

Power Automate's "Describe it to design it" runs to completion. The
single-prompt monolith is risky.

**Better path: build the flow in 5 small prompts**, accepting each
result before submitting the next.

## Prompt 4a — Trigger only

**Where:** make.powerautomate.com → + New flow → Describe it to
design it.

**Prompt:**

```
When a row in the MX Requests Dataverse table is created or modified,
where Status equals Submitted (numeric value 1) and Decision is null.
Trigger only. Don't add any actions yet.
```

Confirm the trigger landed correctly. Save the flow.

## Prompt 4b — Initialize variables

**Where:** Inside the flow, click "+" below the trigger.

**Prompt:**

```
Initialize three string variables in sequence:
- vAuditCorrelation = the trigger row's Audit Correlation column
- vRouting = coalesce(triggerOutputs row's Routing display value, "RMM")
- vRecipientChannel = if vRouting is "Director" use parameters
  mx_director_channel_id; if "Scheduler" use mx_scheduler_channel_id;
  else use mx_approver_channel_id.
```

## Prompt 4c — Audit submitted

**Prompt:**

```
Add a row to the MX Audits Dataverse table:
- cr_event_at = utcNow()
- cr_actor = bind to the systemuser whose ID is in the trigger row's
  _cr_requested_by_value
- cr_actor_role = "AMT"
- cr_action = 1 (mx_request.submitted)
- cr_subject_table = "cr_mx_request"
- cr_subject_id = trigger row's GUID
- cr_correlation = vAuditCorrelation
- cr_metadata = string of the entire trigger body
- cr_retention_until = addDays(utcNow(), 2555)
```

## Prompt 4d — Adaptive Card + Post

Use **Prompt 10** (Adaptive Card body) below for the Compose. Then:

**Prompt:**

```
Post the Adaptive Card to a Microsoft Teams channel and wait for
response. Team ID = parameters mx_approver_team_id. Channel ID =
vRecipientChannel variable. Set timeout to PT24H. Update message
on response: "Decision recorded."
```

## Prompt 4e — Decision Switch (one case at a time)

**Don't ask for all 4 cases in one prompt.** Submit each case
separately:

**Approve case prompt:**

```
After Post and wait, add a Switch on the response action. For case
"approve" add these actions in sequence:
1. Update the MX Request: Status=2, Decision=1, Approver bind,
   Decided At = utcNow(), Decision Comment.
2. If Request Type is not 5 (Ask Leadership) or 99 (Other), create
   an Outlook calendar event and update the row's Outlook Event ID.
3. Post a Teams DM to the requestor with an approval message.
4. Add an MX Audit row with action = 2 (mx_request.approved).
```

Repeat for `deny`, `request_info`, `escalate`. Save between each.

---

## Prompt 5 — Generate a single flow action (when stuck)

**Where:** Inside the flow, on a specific action, click the Copilot
icon in the action panel.

**Prompt (for a stuck Update action):**

```
Update the MX Request row that triggered this flow. Set:
- Status to "Approved"
- Decision to "Approve"
- Decided At to utcNow()
- Decision Comment to outputs of Post_card_and_wait body/data/comment
- Approver to the systemuser whose objectId is in the responder
  output of Post_card_and_wait
```

Per-action Copilot is **safer** — it suggests the field bindings,
you click Accept to apply. No mid-flight surprises.

---

## Prompt 6 — Auxiliary flow (aircraft AOG broadcast)

**Where:** + New flow → Describe it to design it.

**Prompt:**

```
When a row in the Aircraft table is modified and the Status column
changes to "AOG", add a new row to the Operational Bulletins table:
- Subject: the aircraft's Tail + " AOG - " + the aircraft's Base
- Body: the aircraft's Status Reason
- Level: Alert
- Audience: All
- Status: Active
- Posted By: the systemuser who modified the Aircraft row
- Posted At: utcNow()
- Audit Correlation: a new GUID

Then add a row to MX Audits with action aircraft.status_changed, the
same audit correlation, and metadata containing a JSON blob with the
old status, new status, and reason.
```

Manually verify the trigger condition catches *only* status transitions
to AOG (not every status change):

```
@equals(triggerOutputs()?['body/cr_status@OData.Community.Display.V1.FormattedValue'], 'AOG')
```

---

# Power Fx (Canvas App) — Pause-safe ✅

Power Fx prompts run *suggestion-style*. Copilot drafts a formula, you
review it, then click Accept or Discard. **These are the safest
prompts** — no environment changes happen unless you accept.

## Prompt 7 — Generate Patch formula for any table

**Where:** Power Apps Studio → button's `OnSelect` → Copilot icon at
the bottom of the formula bar.

**Prompt:**

```
Patch a new row to the MX Requests Dataverse table. Set:
- Aircraft Tail to dd_AircraftPicker.Selected
- Request Type to the selected value of dd_RequestType (use type-safe
  choice 'Request Type (MX Request)'.[option])
- Window Start to a datetime composed from dp_WindowStart and dd_StartTime
- Window End to a datetime composed from dp_WindowEnd and dd_EndTime
- Base to dd_Base.Selected
- Reason to txt_Reason.Text
- Priority to 'Priority (MX Request)' value matching dd_Priority.Selected.Value
- Status to 'Status (MX Request)'.Submitted
- Routing to 'Routing (MX Request)'.RMM
- Requested By to User()
- Audit Correlation to a new GUID
- Comments Count to 0
- Anonymous to false

Then navigate to scr_RequestConfirm with Cover transition.
```

**What to fix afterward:**
- Copilot may use `{ Value: "Submitted" }` syntax — works, but
  type-safe `'Status (MX Request)'.Submitted` is cleaner
- Add validation If() block above the Patch (Copilot rarely includes it)

---

## Prompt 8 — Generate App.OnStart

**Where:** App's `OnStart` → Copilot icon.

**Prompt:**

```
On app start, set varCurrentUser to User(). Look up the current user
in the "Personnel - Maintenance" Dataverse table by Email and store
as varUserPersonnel. Determine varRole from the user's Personnel.Role,
falling back to a "Personnel - Crew" lookup, then to "Payroll" if the
email matches a hard-coded list, otherwise "Unknown".

Build a record varCan with capability flags for: SubmitMXSchedule
(true for AMT, RMM, DOM, Director, QA, Supervisor, ADOM),
SubmitAskLeadership (true for everyone except Unknown),
SubmitSafetyReport (true for everyone except Unknown), PostBulletin
(RMM, DOM, Director, QA, ADOM only), and so on for all 27 capabilities
in the role matrix.

ClearCollect colBulletins from "Operational Bulletins" where Status is
'Status (Operational Bulletin)'.Active.

ClearCollect colMyApprovals from "MX Requests" where Status is
'Status (MX Request)'.Submitted, Decision is null, and the user is
the appropriate approver based on their role.

Navigate to scr_Home with no transition.
```

**What to fix afterward:** The full role matrix in
`roles-capability-matrix.md` has 42 capabilities total; the canvas
varCan record encodes ~27 of them as active flags. Copilot will
scaffold maybe 8–10. Paste the rest from `powerfx/canvas-app.md §3`
if it stops short.

---

## Prompt 9 — Generate a complete screen layout

**Where:** Power Apps Studio → + New screen → "Generate from data" or
the Copilot tab.

⚠️ **Note: this CREATES a screen, so it does mutate your app.** Save
the app first.

**Prompt:**

```
Generate a screen called scr_ApprovalInbox bound to the MX Requests
Dataverse table. Show a vertical gallery sorted by Submitted At
descending, filtered to where Status is in ['Status (MX Request)'.
Submitted, 'Status (MX Request)'.Escalated, 'Status (MX Request)'.
'More Info Requested'] AND Decision is null. Each gallery item shows:

- Top row: Request Number (bold) and Aircraft Tail
- Second row: Request Type and a colored Priority pill
- Third row: time ago since submitted

Below the gallery, a comment text input txt_Comment (multiline) and
four action buttons in a horizontal row: Approve (green), Deny (red),
Request Info (yellow), Escalate (orange). Each button patches the
selected gallery item with the appropriate Status / Decision / fields,
then removes the item from the gallery's collection.

Use a header at top with title "Approvals" and the persona avatar
on the right.
```

If it generates badly, delete the screen and re-prompt. Don't try to
fix a broken auto-generated screen — start over.

---

# Adaptive Card — Pause-safe ✅

## Prompt 10 — Generate the Adaptive Card body

**Where:** https://adaptivecards.io/designer (free, no Microsoft
login). External tool — you can iterate freely without touching your
flow.

**Prompt:**

```
Design an Adaptive Card v1.5 for an MX maintenance approval. Show:

- Header with the text "MX REQUEST · APPROVAL NEEDED" in accent color,
  the aircraft tail and request type as a large title, and a small
  subtitle with request number and priority

- A FactSet with: Aircraft (tail + type), Window (formatted start to
  end), Base, Requestor

- A "Reason" label and the request reason text below

- A multiline text input with id="comment" labeled "Comment / reason
  / question (used per action)"

- Four action buttons:
    Approve (positive style)
    Deny (destructive style)
    Request Info
    Escalate

Each button submits with action: "approve" / "deny" / "request_info" /
"escalate" plus a requestId data field.

Use Power Automate expression placeholders @{triggerOutputs()?...} for
the dynamic fields.
```

Copy the JSON output. Paste it into the Compose action's input as the
`messageBody`. The card you get is functional — manually verify the
expressions match your column names.

---

# Test Data

## Prompt 11 — Generate seed rows

⚠️ **Mutates your tables.** Save solution first.

**Where:** Power Apps Studio → Tables → Aircraft → + New row →
Generate sample data (Copilot button at top).

**Prompt:**

```
Generate 12 realistic MX Requests for testing. Mix of Request Types:
4 MX Schedule, 2 Aircraft Movement (PR), 2 Pilot Training, 2 Time Off,
2 Ask Leadership. Include a variety of Aircraft Tails from N251HC,
N431HC, N281HC, N407BY, N362AH. Window Starts spread across the next
2 weeks. Statuses: 6 Submitted, 3 Approved, 2 Denied, 1 More Info
Requested. Reasonable Reasons (1 sentence each). Mix of priorities
(mostly Normal, 2 High, 1 AOG).
```

If you get garbage data, manually delete the rows and retry. Easier
than letting Copilot try to fix its own mess.

---

## Prompt 12 — Adaptive Card test payload

**Where:** Power Automate → Run flow with test data.

**Prompt:**

```
Generate a sample Power Automate Post-card-and-wait response payload.
Action = "approve", responder is a fictional RMM (Steve Taul,
steve.taul@ihc.org), comment = "Approved - coordinated with
N251HC for cross-coverage."
```

This is read-only — Copilot just produces JSON for you to paste into
the test inputs. Pause-safe.

---

# Documentation — Pause-safe ✅

## Prompt 13 — Generate user help text + tooltips

**Where:** Power Apps Studio → on any control → HoverColor / Tooltip
property → Copilot.

**Prompt:**

```
Write a 1-sentence tooltip for an "Ask Leadership" toggle on an MX
Request form. The toggle changes the Routing column from RMM to
Director, sending the request to the Director's Teams channel
instead of the regional RMM channel.
```

Suggestion-style. Accept or reject.

---

## Prompt 14 — Audit log readable summaries

**Where:** Custom column "Summary" on `cr_audit` → calculated formula.

**Prompt:**

```
Write a calculated column formula for cr_audit that produces a
one-line human-readable summary based on cr_action. Examples:

- mx_request.submitted → "AMT Nathan Anderson submitted MXR-00012 for
  N431HC 100-hr inspection"
- mx_request.approved → "RMM Steve Taul approved MXR-00012"
- mx_request.escalated → "MXR-00012 escalated to Director after 24h"
- bulletin.posted → "Director Billy Ortega posted Alert: N291HC AOG"

Reference cr_actor, cr_subject_id, and joined columns from the
related MX Request or Operational Bulletin.
```

⚠️ Saving the calculated column is a mutation. The formula draft
itself is pause-safe.

---

# Order of operations — chunked + saved between

Day 1 morning. **Save solution between EACH numbered step.**

```
1. Prompt 2 (×22, one at a time)   Build all global choices       45 min
2. Prompt 1 (×8, one per CSV)      Build tables from CSVs         100 min
3. Prompt 3 (×7, one per spec)     Build tables from spec         70 min
4. Prompt 11 (×3, save between)    Generate test rows             20 min
                                                                  ─────
                                                          Total: 3.9h

Day 1 afternoon — Flow:
5. Prompts 4a–4e (chunked)         Scaffold the main flow         70 min
6. Prompt 5 (×3, suggestion)       Patch up stuck flow actions    20 min
7. Prompt 10 (external designer)   Adaptive Card body             10 min
8. Prompt 6 (single auxiliary)     Aircraft AOG broadcast flow    25 min
                                                                  ─────
                                                          Total: 2.1h

Day 2 morning — Canvas app (suggestion-style, pause-safe):
9. Prompt 8 (suggestion)           App.OnStart                    25 min
10. Prompt 9 (×8, save between)    Each module screen layout      3h
11. Prompt 7 (×6, suggestion)      Each Patch formula             45 min
                                                                  ─────
                                                          Total: 4h
```

**That's roughly 10h of effective AI-assisted build** with
chunking-and-save discipline. Slightly slower than the megaprompt
path, but **massively safer** — bad runs are bounded to one table or
one action, not the whole solution.

---

# What about ChatGPT or Claude for code outside the Power Platform?

For the React demo or analytical work *outside* the Power Platform,
external LLMs are great. But for **Dataverse + Power Apps + Power
Automate**, in-product Copilot has access to your environment metadata
(table names, column types, existing flows) that external chatbots
don't. Use external LLMs for:

- Reading + explaining the JSON specs in this repo
- Drafting the canvas-app.md / runbook.md sections
- Generating long Power Fx blocks before pasting into Studio
- Writing test plans + acceptance criteria checklists

Use Copilot in-product for:

- Anything that requires knowledge of *your* tables, *your* flows,
  *your* environment

External LLMs are **always pause-safe** — they produce text, you copy
what you want.

---

## Companion docs

- `NAMING-CONVENTIONS.md` — **canonical reference**; resolve any naming dispute against this
- `build-walkthrough.md` — click-by-click steps without AI
- `tables/README.md` — table specs (paste these into Copilot prompts)
- `flows/mxr-approval-flow-v2.json` — flow recipe
- `powerfx/canvas-app.md` — full Power Fx reference
- `roles-capability-matrix.md` — role × capability source of truth
- `rebuild-from-clean-state.md` — recovery if Plan mode poisoned the publisher
