# Phase 1 Build Walkthrough — Tables + Flow

Click-by-click steps to build the **canonical 8 Phase 1 Dataverse tables**
plus the `mxr-approval-flow-v2` Power Automate flow in your Dev
environment.

> **Scope:** Canonical Phase 1 only (the 8 tables in
> `tables/README.md` Phase 1 list) with the **4-decision approval
> flow** (Approve / Deny / Escalate / Return). Phase 2 (3 more tables)
> and the 6 extension tables are **out of scope** here — build them
> later if and when you opt into that scope.

Read this alongside the column-by-column specs in `tables/cr_*.md` and
the canonical CSV data in `../../sharepoint-lists/`.

**Time estimate:** 4–5 hours for tables, 3–4 hours for the flow.

---

# Part A — Build the 8 Dataverse tables in Power Apps

## A.0 Prerequisites

- [ ] You're signed in at https://make.powerapps.com
- [ ] You're in the **right environment** — top-right environment picker;
      pick your Dev environment
- [ ] You have **System Customizer** or **System Administrator** role in
      that environment

## A.1 Create the solution (one time)

```
make.powerapps.com → left nav → Solutions → + New solution
   Display name:  MX Connect
   Name:          MXConnect
   Publisher:     + New publisher
                     Display name: IHC
                     Name:         ihc
                     Prefix:       cr     ← MUST be cr per the spec docs
                     Save
   Version:       0.1.0.0
   Save
```

Then: `Solutions → MX Connect → ⋯ → Set as preferred solution`.

This is the step that prevents tables from leaking into the Default
Publisher with a `cr87b_*` prefix. Don't skip it. (See
`rebuild-from-clean-state.md` if your tables landed under the wrong
publisher already.)

## A.2 Build order (dependency-aware)

```
1. cr_region                  (no dependencies)
2. cr_aircraft_type           (no dependencies)
3. cr_base                    → cr_region (text reference in Phase 1)
4. cr_aircraft                → cr_aircraft_type (Lookup); Base/Region/RMM are Text
5. cr_personnel_maintenance   (Region/Primary Base/Leader are Text)
6. cr_personnel_crew          (header-only; Phase 2 populates)
7. cr_mx_request              → cr_aircraft, cr_base (Lookups); RequestedBy/Approver are Text. Includes 4-decision columns.
8. cr_audit                   (Actor is Text)
```

Display names follow `tables/README.md`. Personnel separator is a
**regular hyphen** (`Personnel - Maintenance`).

## A.3 Generic table creation flow

The modern Power Apps maker uses different labels than the classic
solution explorer. Use the labels exactly as they appear in the maker
UI today (shown below). The dialog is **Properties → Advanced options**
on the table — same pane whether you open it during create or edit
later via the pencil icon.

```
Solutions → MX Connect → + New → Table → Table (advanced properties)

   Display name (singular):    Region
   Plural:                     Regions
   Name:                       cr_region              (auto-generated)
   Primary column display:     Name
   Primary column name:        cr_name
   Primary column type:        Text (use Single line of text)

   Advanced options:
     For this table
       Apply duplicate detection rules:           ☐ Off
       Track changes:                              ☑ On    (needed for Power Automate triggers)
       Provide custom help:                        ☐ Off
       Audit changes to its data:                  ☑ On    (do this on every business table)
       Leverage quick-create form if available:    ☐ Off
       Enable long term retention:                 ☐ Off

     Make this table an option when
       Creating a new activity:                    ☐ Off   (Activities are off in Phase 1)
       Doing a mail merge:                         ☐ Off
       Setting up SharePoint document management:  ☐ Off

     Rows in this table
       Can have connections:                       ☐ Off   (Connections are off in Phase 1)
       Can have a contact email:                   ☐ Off
       Have an access team:                        ☐ Off
       Can be linked to feedback:                  ☐ Off   (Notes/feedback are off in Phase 1)
       Appear in search results:                   ☑ On
       Can be taken offline:                       ☐ Off   (turn ☑ On only for canvas tables you read offline)
       Can be added to a queue:                    ☐ Off

   Save
```

The two checkboxes you must set on every business table are
**Audit changes to its data** and **Track changes**. Everything else
under Advanced options stays at its default (Off) for Phase 1.

For tables that the spec lists as having an Autonumber primary column
(`cr_mx_request`, `cr_audit`): the **modern maker dialog only allows
Text** for the primary column at table-creation time. There is no
Autonumber option in the Primary column tab.

Workaround — and this is the canonical Phase 1 path:

1. Create the table with a plain Text primary column. Use a generic
   name like `cr_request_label` (on `cr_mx_request`) or `cr_audit_label`
   (on `cr_audit`). Make it Optional, Max 100 chars. This column only
   satisfies Dataverse's "every table needs a primary" rule and is
   not used by Phase 1 logic.
2. After the table is saved, add the **business-ID column** as a
   separate Autonumber column:
   - On `cr_mx_request`: `cr_request_number`, prefix `MXR-`, min 5
     digits, seed 1 → produces `MXR-00001`.
   - On `cr_audit`: `cr_audit_number`, prefix `AUD-`, min 6 digits,
     seed 1 → produces `AUD-000001`. (The spec just calls this the
     row identifier; flows reference it as `cr_audit_number`.)
3. The flow, Adaptive Card, audit Subject ID, and Teams DM all
   reference the Autonumber column directly. They never read the
   primary column. So nothing downstream has to change.

The primary Text column on `cr_mx_request` can optionally be backfilled
by the canvas Patch on submit (e.g.,
`Concatenate("MXR-", Text(varNewRow.cr_request_number), " — ", varRequestType.Value)`
for human-readable Dataverse default views), but it's not required.

## A.4 Adding columns — by type

For each table, walk down its `cr_*.md` spec and add columns. Standard
patterns:

### Single line of text

```
+ New column
   Display name:  Tail
   Name:          cr_tail                (auto-generated)
   Data type:     Single line of text
   Format:        Text
   Maximum length: 8                     (per spec)
   Required:      Required               (or Business Required)
   Save
```

### Multiple lines of text

```
+ New column
   Display name:  Reason
   Data type:     Multiple lines of text
   Format:        Text
   Maximum length: 1000
   Save
```

### Date and time

```
+ New column
   Display name:  Window Start
   Data type:     Date and time
   Format:        Date and time
   Behavior:      User local
   Required:      Required
   Save
```

### Whole number

```
+ New column
   Display name:  Altitude
   Data type:     Whole number
   Format:        None
   Save
```

### Floating point (only on `cr_fleet_position` Phase 2)

```
+ New column
   Display name:  Latitude
   Data type:     Floating point
   Decimal places: 6
   Save
```

### Yes/No

```
+ New column
   Display name:  Active
   Data type:     Yes/No
   Default:       Yes
   Save
```

### Choice

Use **local Choices** for canonical Phase 1 unless the same enum is
shared across tables. The 8-table canonical scope only has one shared
case: `Aircraft Class` (used on both `cr_aircraft_type` and
`cr_aircraft`). Make that one a Global Choice; all others can be local
to the table that owns them.

```
+ New column
   Display name:  Status
   Data type:     Choice
   Sync this choice with: + New choice  (or pick existing for shared)
      Display name (option 1):  Submitted     Value: 1
      Display name (option 2):  Approved      Value: 2
      Display name (option 3):  Denied        Value: 3
      Display name (option 4):  Escalated     Value: 4
      Display name (option 5):  Returned      Value: 5
      Display name (option 6):  Cancelled     Value: 6
   Default:       Submitted
   Required:      Required
   Save
```

The numeric values matter — the flow filters on them. Use the values
from each spec's "Choice values" section verbatim.

### Lookup (single)

The target table **must already exist** (build-order rule).

```
+ New column
   Display name:  Aircraft Tail
   Name:          cr_aircraft_tail        (auto-generated)
   Data type:     Lookup
   Related table: Aircraft (cr_aircraft)
   Required:      Optional                (per spec)
   Save
```

### Autonumber (primary column on `cr_mx_request` and `cr_audit`)

Set this at table create time only:

```
+ New → Table → Table (advanced properties)
   Display name:           MX Request
   Primary column display: Request Number
   Primary column type:    Autonumber             ← table-create only
   Format:                 String prefix
   Prefix:                 MXR-
   Minimum number:         5                      (5-digit padding → MXR-00001)
   Seed value:             1
   Save
```

Same pattern for `cr_audit` with prefix `AUD-` and 6-digit padding
(`AUD-000001`).

## A.5 Choices needed for canonical Phase 1

These are **all** the Choices the 8 canonical tables need. Build them as
you go, table by table.

| Choice (display name)        | Owner table                      | Values                                                                                                  |
| ---------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Region Type                  | `cr_region` (local)              | Field / HQ / Field/HQ / Rover                                                                           |
| Operations                   | `cr_base` (local)                | RW / FW / RW + FW / Office / Storage / Coverage / RW + Office                                           |
| Aircraft Class               | global (shared by AC + AC Type)  | Rotary / Fixed Wing                                                                                     |
| Aircraft Status              | `cr_aircraft` (local)            | In Service (1) / AOG (2) / Maintenance (3) / Away from Base (4) / Unavailable (5) / Spare (6)           |
| Personnel Role               | `cr_personnel_maintenance` (local) | AMT (1) / AMT (Rover) (2) / Supervisor (3) / RMM (4) / DOM (5) / QA (6) / QA Manager (7) / Parts (8) / Scheduler (9) / Senior Director Aviation Operations (10) |
| MX Request Type              | `cr_mx_request` (local)          | Phase Inspection (1) / Repair (2) / Overhaul (3) / Time Off (4) / Open Shift (5) / AOG (6)              |
| MX Request Priority          | `cr_mx_request` (local)          | Normal (1) / High (2) / AOG (3)                                                                          |
| MX Request Status            | `cr_mx_request` (local)          | Submitted (1) / Approved (2) / Denied (3) / Escalated (4) / Returned (5) / Cancelled (6)                |
| MX Request Routing           | `cr_mx_request` (local)          | RMM (1) / Director (2)                                                                                   |
| MX Request Decision          | `cr_mx_request` (local)          | Approved (1) / Denied (2) / Escalated (3) / Returned (4)                                                 |
| Audit Action                 | `cr_audit` (local)               | mx_request.submitted (1) / mx_request.approved (2) / mx_request.denied (3) / mx_request.escalated (4) / mx_request.returned (5) / mx_request.cancelled (6) / mx_request.outlook_created (10) |

11 Choice columns total for canonical Phase 1.

The numeric values come from the spec docs. **Use the exact values** —
the flow's trigger filter and Update actions use them.

**Decision vs Status:** Decision is what the approver clicked (set on
Adaptive Card response). Status is the resulting state. Past-tense
labels match between the two so they read consistently in audit + DM
messages.

## A.6 Per-table walkthrough

Open each `cr_*.md` spec, follow the column list. Apply the
appropriate column-type pattern from §A.4. Hit Save after every column
to avoid losing work.

The column lists are short — mostly 8–18 columns per table. Pace
yourself: 15–25 minutes per table.

For `cr_mx_request`, make sure to include the 3 decision-related
columns: `cr_decision` (Choice), `cr_decision_reason` (multiline text,
required when Decision = Denied), `cr_more_info_request` (multiline
text, required when Decision = Returned).

## A.7 Wiring up the relationships pane

After Lookup columns are added, verify under each table's
`Relationships → Many-to-one`:

```
cr_aircraft   ↔ cr_aircraft_type    (cr_type)
cr_mx_request ↔ cr_aircraft         (cr_aircraft_tail)
cr_mx_request ↔ cr_base             (cr_base)
```

Phase 1 canonical doesn't have many lookups because the CSV has values
that don't fit Lookup constraints (free-text names, "ALL", "Spare",
"NC Region (TBD)"). Phase 2 adds the rest.

## A.8 Enable Auditing

If you missed it during table creation:

```
Tables → cr_mx_request → Properties (top-right pencil icon)
   Advanced options → Audit changes to its data: ☑ Yes
   Save
```

Do this for every table that holds business data: `cr_aircraft`,
`cr_personnel_maintenance`, `cr_mx_request`, `cr_audit`. Lookup tables
(`cr_region`, `cr_base`, `cr_aircraft_type`) are optional.

## A.9 Set up business units (for RMM regional scoping)

```
Power Platform admin center → Environments → [Dev] → Settings →
   Users + permissions → Business units → + New
```

Create one BU per region using the **canonical region names** from
`01-regions.csv`:

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

Then assign each user to their region's BU under
`Users + permissions → Users → [user] → Manage roles + business unit`.

This is what makes RMM regional scoping work automatically.

## A.10 Smoke test

```
Solutions → MX Connect → Tables → MX Request → + New row
   Aircraft Tail:  N431HC
   Request Type:   Phase Inspection
   Window Start:   tomorrow 07:00
   Window End:     tomorrow 17:00
   Priority:       Normal
   Status:         Submitted
   Routing:        RMM
   Save
```

Confirm the autonumber populates (`MXR-00001`). Confirm `cr_decision`
is blank (the flow will set it on response). Confirm the flow isn't
built yet, so `cr_audit` stays empty. Once the flow lands, this same
smoke test fires the end-to-end pipeline.

## A.11 Import canonical seed data

After all tables are built and verified, import the populated CSVs:

```
Tables → cr_region → top toolbar → Import → Import from Excel
   Pick: 01-regions.csv from m365-solution/sharepoint-lists/
   Map columns (Title → Name, Type → Type, Notes → Notes)
   Import
```

Repeat for each canonical CSV. The CSV-vs-Lookup column tension (free
text vs strict Lookup) only matters in Phase 2 — for Phase 1 canonical,
the spec keeps Base/Region/RMM as Text precisely so CSV import works
out of the box.

The MX Request seed CSV pre-dates the `cr_decision` column, so all 6
seed rows will land with `cr_decision` blank. That's fine.

---

# Part B — Build the Power Automate flow

## B.1 Two paths: import JSON vs build manually

### Path 1 — Import the solution (if you have `pac` CLI)

```bash
pac auth create --environment <your-dev-env-url>
pac solution clone --name MXConnect --target-folder ./mxconnect-cloned

# Place flows/mxr-approval-flow-v2.json under ./mxconnect-cloned/Workflows/
# Add a corresponding .xml manifest if `pac` rejects the import

pac solution pack --folder ./mxconnect-cloned --zipfile ./MXConnect.zip
pac solution import --path ./MXConnect.zip
```

The shipped JSON `flows/mxr-approval-flow-v2.json` matches canonical
Phase 1 (4-decision Switch). The only piece that's still extension
scope inside the JSON is the `Routing = Scheduler` branch in the
recipient-channel selector — for canonical, that branch never fires
(the canvas form only sets `cr_routing` to RMM or Director).

### Path 2 — Build manually in Power Automate Studio

```
make.powerautomate.com → My flows → + New flow → Automated
   Flow name:  mxr-approval-flow-v2
   Trigger:    When a row is added, modified or deleted (Microsoft Dataverse)
```

## B.2 Configure the trigger

```
Change type:        Added or Modified
Table name:         MX Requests          (Power Automate uses plural display in dropdown)
Scope:              Organization
Filter columns:     cr_status,cr_decision
Filter rows:        cr_status eq 1 and cr_decision eq null
Run as:             Modifying user
```

The trigger filter is critical:
- `cr_status eq 1` (Submitted) — initial submissions
- `cr_decision eq null` — prevents re-fire on the flow's own Decision
  writes; allows re-fire for Returned-resubmit and Escalated-re-route
  (canvas/flow clears `cr_decision` for both)

## B.3 Action sequence (canonical 4-decision)

| #  | Action display name              | Connector       | Purpose                                          |
| -- | -------------------------------- | --------------- | ------------------------------------------------ |
| 1  | Initialize variable — vAuditCorrelation | Built-in | String, from trigger row                         |
| 2  | Initialize variable — vRouting   | Built-in        | String, from trigger row's Routing               |
| 3  | Initialize variable — vRecipientChannel | Built-in | String, set per Routing                          |
| 4  | Audit submitted                  | Dataverse       | Add row → MX Audits, action 1                    |
| 5  | Compose card body                | Built-in        | Adaptive Card JSON (4 buttons + comment)         |
| 6  | Post card and wait               | Teams           | 24h timeout                                       |
| 7  | Decision — Switch                | Built-in        | On `body/data/action`                             |
| 8  |   Approve case (5 actions)       | Dataverse + Outlook + Teams | Update + Outlook event + Update event ID + DM + Audit |
| 9  |   Deny case (3 actions)          | Dataverse + Teams | Update + DM + Audit                            |
| 10 |   Escalate case (3 actions)      | Dataverse        | Update (Status=Escalated, Routing=Director) + Reset (Status=Submitted, Decision=null) + Audit |
| 11 |   Return case (3 actions)        | Dataverse + Teams | Update (Status=Returned, More Info Request) + DM + Audit |
| 12 | Update request escalated (timeout) | Dataverse    | Update Status=Escalated, Routing=Director         |
| 13 | Reset (timeout)                  | Dataverse       | Reset Status=Submitted, Decision=null (re-arm)    |
| 14 | Email director escalation        | Office 365      | Send an email V2                                  |
| 15 | Audit escalated (timeout)        | Dataverse       | Add row → MX Audits, action 4                    |

For Choice columns in Update actions, pick from the dropdown — Power
Automate Studio shows the labels (Submitted, Approved, etc.) but stores
the numeric value.

## B.4 Configure the Adaptive Card

The Compose action embeds JSON. Test-render the card body in
https://adaptivecards.io/designer to verify syntax before saving the
flow.

Canonical Phase 1 has **4 action buttons** plus a comment input:

```json
"body": [
  /* Header / FactSet / Reason / etc. */
  {
    "type": "Input.Text",
    "id": "comment",
    "label": "Comment / reason / question (used per action)",
    "placeholder": "Required for Deny + Return; optional for Approve + Escalate.",
    "maxLength": 1000,
    "isMultiline": true
  }
],
"actions": [
  { "type": "Action.Submit", "title": "Approve",  "data": { "action": "approve",  "requestId": "@{...}" }, "style": "positive" },
  { "type": "Action.Submit", "title": "Deny",     "data": { "action": "deny",     "requestId": "@{...}" }, "style": "destructive" },
  { "type": "Action.Submit", "title": "Escalate", "data": { "action": "escalate", "requestId": "@{...}" } },
  { "type": "Action.Submit", "title": "Return",   "data": { "action": "return",   "requestId": "@{...}" } }
]
```

The comment input feeds different fields per action:
- Approve → `cr_decision_comment` (optional)
- Deny → `cr_decision_reason` (required) + `cr_decision_comment`
- Return → `cr_more_info_request` (required) + `cr_decision_comment`
- Escalate → `cr_decision_comment` (optional)

## B.5 Post adaptive card and wait

```
Post as:           Flow bot
Post in:           Channel
Team:              @{parameters('mx_approver_team_id')}
Channel:           @{variables('vRecipientChannel')}
Adaptive Card:     @{outputs('Compose_card_body')}
Update message:    Decision recorded.
```

Set timeout under "Show advanced options":

```
Timeout duration: PT24H
```

## B.6 Switch on decision

```
Switch on: outputs('Post_card_and_wait')?['body/data/action']

Cases:
   approve  → Approve branch (5 actions)
   deny     → Deny branch (3 actions)
   escalate → Escalate branch (3 actions)
   return   → Return branch (3 actions)
Default:    (empty — covered by timeout branch in parallel)
```

For each case, build the Updates / Posts / Audit row writes per the
spec. The full sequence is in the shipped flow JSON; copy from there
or build manually.

### Approve branch nuance

The Approve branch has a conditional: skip the Outlook event step if
Request Type is `Time Off` (request_type = 4, no aircraft window).

```
If: equals(triggerOutputs()?['body/cr_request_type'], 4)
   Then: skip Outlook
   Else: Create event V4 + Save outlook event ID
```

### Escalate branch nuance

Two-step Update:
1. Update — Status = 4 (Escalated), Decision = 3 (Escalated),
   Routing = 2 (Director)
2. Update — Status = 1 (Submitted), Decision = null (re-arms trigger
   so the next iteration posts to Director channel)

### Return branch

Updates Status = 5 (Returned), Decision = 4 (Returned), and writes
`cr_more_info_request` from the comment. DM goes to the requestor with
the question. The requestor edits the request and resubmits — canvas
clears `cr_decision` and resets `cr_status` = 1, which re-fires the
trigger.

## B.7 Timeout / failure branch

The timeout branch runs **in parallel** to the Switch via "Configure
run after":

```
Update_request_escalated_timeout → Configure run after
   ✓ Post_card_and_wait timed out
   ✓ Post_card_and_wait failed
   ✗ has succeeded
```

Same two-step Update pattern as manual Escalate (set
Routing=Director, then reset Status + Decision to re-arm).

## B.8 Environment variables

```
Solutions → MX Connect → + New → More → Environment variable

   Display name:    mx_approver_team_id
   Name:            cr_mx_approver_team_id
   Data type:       Text
   Default value:   19:abc123...@thread.tacv2
   Save
```

Repeat for: `mx_approver_channel_id`, `mx_director_channel_id`,
`mx_outlook_calendar`, `mx_request_timeout_hours`,
`mx_audit_retention_days`, `mx_app_deeplink_base`, `mx_director_email`.

8 env vars for canonical Phase 1. (The matrix-extension scope adds
`mx_scheduler_channel_id`, `mx_safety_channel_id`,
`mx_safety_retention_days`, `mx_anonymous_account` for a total of 12.)

## B.9 Connection references

```
Solutions → MX Connect → + New → More → Connection reference

   Display name:  Dataverse — MXConnect
   Name:          cr_DataverseConnection
   Connector:     Microsoft Dataverse
   Connection:    Pick the one you authenticated as the service account
   Save
```

Repeat for `cr_TeamsConnection` (Microsoft Teams) and
`cr_OutlookConnection` (Office 365 Outlook).

## B.10 Smoke test the flow

```
Power Automate → My flows → mxr-approval-flow-v2 → Run history
```

In Dataverse:

```
Tables → MX Request → + New row
   Aircraft Tail: N431HC, Request Type: Phase Inspection,
   Window Start: tomorrow 07:00, Window End: tomorrow 17:00,
   Priority: Normal, Status: Submitted, Routing: RMM
   Save
```

Wait 5–30 seconds. The flow fires, Adaptive Card lands in the RMM
channel with **4 buttons**. Try each scenario:

1. **Approve** → row Status → Approved, Decision → Approved, Outlook
   event created, DM to requestor, audit row written
2. **Deny** with comment → Status → Denied, Decision → Denied,
   Decision Reason populated, DM with reason, audit row
3. **Return** with question → Status → Returned, Decision → Returned,
   More Info Request populated, DM with question. Submitter edits row
   → resubmits → flow re-fires
4. **Escalate** with optional comment → Status → Escalated then back
   to Submitted, Routing → Director, card re-posts to Director channel
5. **Wait past timeout** (set `limit.timeout` to `PT5M` for testing) →
   Status → Escalated then back to Submitted, Routing → Director,
   email sent to Director group

If the card lands in the wrong channel: check `vRouting` and
`vRecipientChannel` initialization values.

If no card lands: check that the Power Automate bot is added to the
target Teams channel.

If the flow never triggers: check the trigger filter
(`cr_status eq 1 AND cr_decision eq null`).

If the flow re-fires in a loop: confirm the trigger filter has the
`cr_decision eq null` clause.

---

# Part C — Common gotchas

| Issue                                                          | Cause                                                                | Fix                                                              |
| -------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Schema name shows `cr87b_*` after creating a table             | MX Connect not set as preferred solution                             | Solutions → MX Connect → ⋯ → Set as preferred solution. See `rebuild-from-clean-state.md`. |
| "Required column missing" on Patch                             | Required column on the table without a default                       | Either remove Required, or add a Default value                   |
| Lookup column doesn't show the table I want                    | Target table not in the same solution                                | Add target table to the MXConnect solution                       |
| Flow runs in a loop                                            | Trigger filter missing `cr_decision eq null`                         | Add it to the trigger Filter rows expression                     |
| Return loop doesn't re-trigger after submitter resubmits       | Canvas didn't clear `cr_decision` on resubmit                        | Patch `cr_decision: Blank()` + `cr_status: Submitted` on resubmit |
| Escalate doesn't re-route to Director channel                  | Two-step Update missed; need to set Routing=2 then reset Status=1 + Decision=null | See §B.6 Escalate branch nuance                       |
| Adaptive Card doesn't render                                   | Compose action has malformed JSON                                    | Paste into adaptivecards.io/designer to find the syntax error    |
| `@parameters('mx_…')` is null at runtime                       | Env variable not mapped to a value                                   | Check Solutions → Env variables → set Current value              |
| "User can't see this row"                                      | Dataverse role privilege at User instead of BU                       | Bump to BU on the relevant role                                  |
| Outlook event in wrong calendar                                | Env variable references calendar name, not ID                        | Use the ID (visible in Graph Explorer)                           |
| Choice column saves "1" instead of "Submitted" in audit metadata | Logged the numeric value instead of FormattedValue                  | Use `@{triggerOutputs()?['body/cr_status@OData.Community.Display.V1.FormattedValue']}` |
| CSV import fails on Aircraft (Base/Region/RMM)                | Lookup target rows missing or names don't match                      | Spec keeps these as Text in Phase 1 — re-import. If you switched to Lookup, switch back. |

---

# Part D — Order of operations summary

```
Day 1 (3-4h)
   1. Create solution + IHC publisher (set as preferred!)
   2. Set up business units in admin center (12 regions per CSV)
   3. Build 11 Choice columns per spec (most are local; Aircraft Class is shared)
   4. Build cr_region, cr_aircraft_type, cr_base
   5. Build cr_aircraft, cr_personnel_maintenance, cr_personnel_crew

Day 2 (2-3h)
   6. Build cr_mx_request (with cr_decision + cr_decision_reason + cr_more_info_request)
   7. Build cr_audit
   8. Verify all relationships in Schema → Relationships
   9. Import canonical CSV seed data per `tables/README.md` import order

Day 3 (3-4h)
  10. Create environment variables (8 for canonical)
  11. Create connection references (3)
  12. Build mxr-approval-flow-v2 (4-decision, manual or pac import)
  13. Smoke test all 5 scenarios (Approve / Deny / Return / Escalate / Timeout)

Day 4+ (canvas app)
   See powerfx/canvas-app.md
```

Total to a working canonical Phase 1 data layer + 4-decision flow:
~12 hours of focused work.

---

## Companion docs

- `tables/README.md` — table index (canonical 11 + extension 7)
- `tables/cr_*.md` — column-by-column specs (each derives from a canonical CSV)
- `flows/mxr-approval-flow-v2.json` — flow recipe (4-decision; matches canonical)
- `connections.md` — security role privilege grid
- `runbook.md` — week-by-week deployment runbook
- `rebuild-from-clean-state.md` — recovery if Plan mode poisoned the publisher
- `powerfx/canvas-app.md` — canvas app build guide (Day 4+)
- `../sharepoint-lists/` — **canonical CSV truth** for all 11 tables
