# Phase 1 — Copilot Prompt Cookbook

Copy-paste prompts that actually save time during the Phase 1 build.
Tested against Copilot in Power Apps Studio + Power Automate Studio +
the make.powerapps.com home page.

For each prompt: **what to load first**, the **prompt itself**, and
what to **manually fix afterward**. Copilot gets you 50–70% of the way;
the spec docs (`tables/`, `flows/`, `powerfx/canvas-app.md`) are the
ground truth for the last 30%.

---

## Table 1 — Where Copilot helps (and doesn't)

| Task                              | Copilot helps?  | Time saved |
| --------------------------------- | --------------- | ---------- |
| Generate Dataverse table from CSV | ✅ Big           | 60–80% per table |
| Generate Choice options           | ✅ Medium        | 30–50%     |
| Scaffold Power Automate flow      | ✅ Medium        | 50–60%     |
| Write individual Power Fx formula | ✅ Big           | 70%        |
| Design Adaptive Card              | ✅ Medium        | 40%        |
| Generate seed/test data           | ✅ Big           | 80%        |
| Write help text + tooltips        | ✅ Big           | 90%        |
| Configure security roles          | ❌ Manual UI     | 0%         |
| Set up business units             | ❌ Manual UI     | 0%         |
| Build relationships pane manually | ❌ UI-only       | 0%         |
| Map env vars to connection refs   | ❌ Manual UI     | 0%         |

---

# Tables

## Prompt 1 — Generate a Dataverse table from a populated CSV

**Where:** make.powerapps.com → Solutions → MX Connect → + New →
Table → Get data → Excel/CSV.

**What to load:** Upload one of the populated CSVs from
`m365-solution/sharepoint-lists/` (e.g., `04-aircraft.csv` or
`05-personnel-maintenance.csv`).

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

**What to fix afterward:**
- Convert text columns that should be Lookup (Type, Base, Region) once
  the target tables exist
- Add Status Updated At + Status Updated By columns (they aren't in
  the CSV)
- Set the RMM column to Person/Group manually

**Repeat for:** every table that has a populated CSV. The 8 specs
without a CSV (status logs, comments, filter prefs, audit) — build
manually per the spec.

---

## Prompt 2 — Generate Global Choice options

**Where:** Solutions → MX Connect → + New → More → Choice →
"Generate from data" or describe option.

**Prompt:**

```
Create a global Choice option called "Status (MX Requests)" with
schema name "cr_mx_request_status". Six values:

  1: Submitted (default)
  2: Approved
  3: Denied
  4: More Info Requested
  5: Escalated
  6: Cancelled
```

**Repeat for** each of the 22 global choices listed in
`build-walkthrough.md §A.4`. You can batch this — paste a markdown
table and say "create global Choice for each of these."

---

## Prompt 3 — Generate a table from text spec (no CSV)

**Where:** Solutions → MX Connect → + New → Table → Describe what you want.

**What to load:** Open the spec (e.g., `tables/cr_audit.md`) in
another tab.

**Prompt:**

```
Create a Dataverse table "MX Audit" with schema name "cr_audit".
Primary column: "Audit ID", autonumber format AUD-{SEQNUM:000000}.

Other columns:
- Event At: date and time (UTC), required
- Actor: lookup to User (systemuser), required
- Actor Role: text 32, required
- Action: choice (use existing global choice "Action (Audit Log)")
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

# Flows

## Prompt 4 — Scaffold the entire mxr-approval flow

**Where:** make.powerautomate.com → + New flow → Describe it to design it.

**Prompt:**

```
When a Dataverse row in the MX Requests table is created or modified
where Status equals "Submitted" and Decision is null:

1. Initialize three string variables: vAuditCorrelation (from row's
   Audit Correlation column), vRouting (from row's Routing column,
   default to "RMM"), vRecipientChannel (set to one of three Teams
   channel IDs based on vRouting: Director channel for Director,
   Scheduler channel for Scheduler, RMM channel for RMM).

2. Add a row to MX Audit with action mx_request.submitted, actor =
   the row's Requested By, audit correlation = vAuditCorrelation.

3. Compose an Adaptive Card body that displays the request details
   (tail, type, window, base, requestor, reason) with four buttons:
   Approve (positive style), Deny (destructive), Request Info, and
   Escalate.

4. Post the Adaptive Card and wait for response in Microsoft Teams
   to the recipient channel from vRecipientChannel. Set timeout to
   24 hours.

5. Switch on the response action. For Approve: update the MX Request
   to Status=Approved, Decision=Approve, set Approver, create an
   Outlook calendar event (skip if Request Type is Ask Leadership or
   Other), DM the requestor, write an mx_request.approved audit row.
   For Deny: similar but Status=Denied and Decision=Deny, with a
   required Decision Reason. For Request Info: Status=More Info
   Requested, Decision=Request Info, populate More Info Request, DM
   requestor with the question. For Escalate: set Routing=Director,
   then reset Status=Submitted and Decision=null so the trigger
   re-fires.

6. If the wait times out, set Routing=Director, reset Status=Submitted
   and Decision=null, send an email to the Director group, write an
   mx_request.escalated audit row.

Use environment variables for: mx_approver_team_id,
mx_approver_channel_id, mx_scheduler_channel_id,
mx_director_channel_id, mx_outlook_calendar, mx_director_email,
mx_request_timeout_hours, mx_audit_retention_days,
mx_app_deeplink_base.
```

**What to fix afterward:**
- Copilot usually generates the Switch with only 2 cases — manually
  add the Request Info and Escalate cases
- The Adaptive Card body needs the FactSet + Input.Text from the JSON
- Trigger filter: confirm `cr_status eq 1 and cr_decision eq null`
- Configure run-after on the timeout actions to fire on TimedOut OR
  Failed (Copilot defaults to TimedOut only)

This single prompt saves 60–90 minutes vs starting from blank.

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

Copilot auto-generates the OData expressions for `recordId`,
`@odata.bind` for the Approver lookup, etc.

---

## Prompt 6 — Generate an auxiliary flow (aircraft AOG broadcast)

**Where:** + New flow → Describe it to design it.

**Prompt:**

```
When a row in the Aircraft table is modified and the Status column
changes to "AOG", add a new row to the Operational Bulletins table:
- Subject: the aircraft's Tail + " AOG — " + the aircraft's Base
- Body: the aircraft's Status Reason
- Level: Alert
- Audience: All
- Status: Active
- Posted By: the systemuser who modified the Aircraft row
- Posted At: utcNow()
- Audit Correlation: a new GUID

Then add a row to MX Audit with action aircraft.status_changed, the
same audit correlation, and metadata containing a JSON blob with the
old status, new status, and reason.
```

Copilot will generate this end-to-end. Manually verify the trigger
condition catches *only* status transitions to AOG (not every status
change). Use a Trigger Condition like:

```
@equals(triggerOutputs()?['body/cr_status@OData.Community.Display.V1.FormattedValue'], 'AOG')
```

---

# Power Fx (Canvas App)

## Prompt 7 — Generate Patch formula for any list

**Where:** Power Apps Studio → button's `OnSelect` → Copilot icon at
the bottom of the formula bar.

**Prompt:**

```
Patch a new row to the MX Requests Dataverse table. Set:
- Aircraft Tail to dd_AircraftPicker.Selected
- Request Type to the selected value of dd_RequestType (use type-safe
  choice 'Request Type (MX Requests)'.[option])
- Window Start to a datetime composed from dp_WindowStart and dd_StartTime
- Window End to a datetime composed from dp_WindowEnd and dd_EndTime
- Base to dd_Base.Selected
- Reason to txt_Reason.Text
- Priority to dd_Priority.Selected.Value
- Status to "Submitted" choice
- Routing to "RMM" choice
- Requested By to User()
- Audit Correlation to a new GUID
- Comments Count to 0
- Anonymous to false

Then navigate to scr_RequestConfirm with Cover transition.
```

**What to fix afterward:**
- Copilot may use `{ Value: "Submitted" }` syntax — works, but
  type-safe `'Status (MX Requests)'.Submitted` is cleaner
- Add validation If() block above the Patch (Copilot rarely includes it)

---

## Prompt 8 — Generate App.OnStart

**Where:** App's `OnStart` → Copilot icon.

**Prompt:**

```
On app start, set varCurrentUser to User(). Look up the current user
in the Personnel — Maintenance Dataverse table by Email and store as
varUserPersonnel. Determine varRole from the user's Personnel.Role,
falling back to a Personnel — Crew lookup, then to "Payroll" if the
email matches a hard-coded list, otherwise "Unknown".

Build a record varCan with capability flags for: SubmitMXSchedule
(true for AMT, RMM, DOM, Director, QA, Supervisor, ADOM),
SubmitAskLeadership (true for everyone except Unknown),
SubmitSafetyReport (true for everyone except Unknown), PostBulletin
(RMM, DOM, Director, QA, ADOM only), and so on for all 27 capabilities
in the role matrix.

ClearCollect colBulletins from Operational Bulletins where Status is
Active. ClearCollect colMyApprovals from MX Requests where Status is
Submitted, Decision is null, and the user is the appropriate approver
based on their role.

Navigate to scr_Home with no transition.
```

**What to fix afterward:** The full capability matrix has 27 flags;
Copilot will scaffold maybe 8–10. Paste the rest from
`powerfx/canvas-app.md §3` if it stops short.

---

## Prompt 9 — Generate a complete screen layout

**Where:** Power Apps Studio → + New screen → "Generate from data" or
the Copilot tab.

**Prompt:**

```
Generate a screen called scr_ApprovalInbox bound to the MX Requests
Dataverse table. Show a vertical gallery sorted by Submitted At
descending, filtered to where Status is Submitted, Escalated, or
More Info Requested AND Decision is null. Each gallery item shows:

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

This generates a working screen scaffold in ~30 seconds. Manually:
- Wire up the action button OnSelect formulas (paste from
  `canvas-app.md §6`)
- Tweak the visual styling

---

# Adaptive Card

## Prompt 10 — Generate the Adaptive Card body

**Where:** https://adaptivecards.io/designer (free, no Microsoft login)
or Copilot in Power Automate's Compose action.

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

## Prompt 11 — Generate seed rows for testing

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

**What to fix afterward:** Lookups (Aircraft Tail, Base) will be string
names — manually pick the actual records. `Requested By` defaults to
the current user.

---

## Prompt 12 — Generate Adaptive Card test payload

**Where:** Power Automate → Run flow with test data.

**Prompt:**

```
Generate a sample Power Automate Post-card-and-wait response payload.
Action = "approve", responder is a fictional RMM (Steve Taul,
steve.taul@ihc.org), comment = "Approved — coordinated with
N251HC for cross-coverage."
```

Use the output to populate the test inputs when you "Test → With
manually entered data" the flow.

---

# Documentation

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

Copilot will write something like: *"Turn on for budget questions,
policy exceptions, or anything that needs a leadership call. Sends
the request to the Director instead of the regional RMM."*

Repeat for every control that needs a tooltip.

---

## Prompt 14 — Generate audit log readable summaries

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

Calculated columns have limits — Copilot will tell you which parts
need to be a Power Automate computed field instead. Useful as a
starting point for the audit dashboard.

---

# Order of operations — chain prompts for max speed

Day 1 morning, in this order:

```
1. Prompt 2 (×22)   Build all global choices       30 min
2. Prompt 1 (×8)    Build tables from CSVs          90 min
3. Prompt 3 (×7)    Build tables from spec          60 min
4. Prompt 11 (×3)   Generate test rows               15 min
                                                    ─────
                                            Total: 3.25h

Day 1 afternoon:
5. Prompt 4         Scaffold the main flow          60 min
6. Prompt 5 (×3)    Patch up stuck flow actions     20 min
7. Prompt 10        Adaptive Card body              10 min
8. Prompt 6         Aircraft AOG broadcast flow     20 min
                                                    ─────
                                            Total: 1.83h

Day 2 morning — Canvas app:
9. Prompt 8         App.OnStart                     20 min
10. Prompt 9 (×8)   Each module screen layout       2.5h
11. Prompt 7 (×6)   Each Patch formula              45 min
                                                    ─────
                                            Total: 3.5h
```

That's roughly **8.5h of effective AI-assisted build** vs ~30h doing it
all manually. The remaining 30% (security roles, BU hierarchy,
relationship verification, env vars, connection refs) stays manual.

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

---

## Companion docs

- `build-walkthrough.md` — click-by-click steps without AI
- `tables/README.md` — table specs (paste these into Copilot prompts)
- `flows/mxr-approval-flow-v2.json` — flow recipe
- `powerfx/canvas-app.md` — full Power Fx reference
- `roles-capability-matrix.md` — role × capability source of truth
