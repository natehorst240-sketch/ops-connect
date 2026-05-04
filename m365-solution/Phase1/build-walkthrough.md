# Phase 1 Build Walkthrough — Tables + Flow

Click-by-click steps to build the 15 Dataverse tables and the
`mxr-approval-flow-v2` Power Automate flow in your Dev environment.
Read this alongside the column-by-column specs in `tables/cr_*.md` and
the flow JSON at `flows/mxr-approval-flow-v2.json`.

**Time estimate:** 4–6 hours for tables, 2–3 hours for the flow.

---

# Part A — Build the 15 Dataverse tables in Power Apps

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
                     Prefix:       cr     (or ihc — your call; cr is the default)
                     Save
   Version:       0.1.0.0
   Save
```

The solution is your container. Everything you build (tables, flows,
canvas app, env variables, roles) goes inside. When you export later,
you ship the whole bundle.

## A.2 Build order (dependency-aware)

Build tables in this order or you'll hit "referenced table doesn't
exist" errors:

```
1. cr_region                  (no dependencies)
2. cr_aircraft_type           (no dependencies)
3. cr_base                    → cr_region
4. cr_aircraft                → cr_aircraft_type, cr_base, cr_region, systemuser
5. cr_personnel_maintenance   → cr_region, cr_base, systemuser
6. cr_personnel_crew          → cr_region, cr_base, systemuser
7. cr_mx_request              → cr_aircraft, cr_base, systemuser
8. cr_audit                   → systemuser
9. cr_operational_bulletin    → cr_region, systemuser
10. cr_safety_report          → cr_region, cr_base, cr_aircraft, systemuser
11. cr_aircraft_status_log    → cr_aircraft, systemuser
12. cr_personnel_status_log   → cr_personnel_maintenance, systemuser
13. cr_mx_request_comment     → cr_mx_request, systemuser
14. cr_user_filter_pref       (no dependencies)
15. cr_schedule_event         → cr_mx_request, cr_aircraft, systemuser
```

## A.3 Generic table creation flow

Same steps for every table — only the columns and primary column differ.

```
Solutions → MX Connect → + New → Table → Table (advanced properties)

   Display name (singular):    Region
   Plural:                     Regions
   Name:                       cr_region              (auto-generated)
   Primary column display:     Name
   Primary column name:        cr_name
   Primary column type:        Text (use Single line of text)

   Advanced options:
     Enable auditing:          ☑ Yes      (do this on every business table)
     Enable Activities:        ☐ No
     Enable Notes:             ☐ No
     Allow custom Help URL:    ☐ No
     Track changes:            ☑ Yes      (needed for Power Automate triggers)
     Provide custom Help:      ☐ No

   Save
```

After Save, you land on the table page with its system columns
(`createdon`, `modifiedon`, `createdby`, `modifiedby`, etc.) plus your
primary column. **Now add the rest of the columns** per the spec.

## A.4 Adding columns — by type

For each table, walk down its `cr_*.md` spec and add columns. The
column-add UI is the same; the type and config differ.

### Single line of text

```
+ New column
   Display name:  Tail
   Name:          cr_tail                (auto-generated)
   Data type:     Single line of text
   Format:        Text
   Maximum length: 8                     (matches spec)
   Required:      Required               (or Business Required)
   Searchable:    ☑ (default)
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
   Format:        Date and time          (or Date only — spec says date+time)
   Behavior:      User local             (lets each user see in their TZ)
   Required:      Required
   Save
```

### Whole number

```
+ New column
   Display name:  Comments Count
   Data type:     Whole number
   Format:        None                   (just integer)
   Minimum:       0
   Default:       0
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

### Choice (the picky one)

For **Status**, **Routing**, **Decision**, **Priority**, etc.

**Best practice: use Global Choices** so the same enum is reusable on
multiple tables (e.g., Aircraft.Status and Aircraft Status Log.New
Status both reference the same global Choice).

#### First, create the Global Choice

```
Solutions → MX Connect → + New → More → Choice

   Display name:  Status (MX Requests)
   Name:          cr_mx_request_status
   Choices:
      Submitted              (value: 1)
      Approved               (value: 2)
      Denied                 (value: 3)
      More Info Requested    (value: 4)
      Escalated              (value: 5)
      Cancelled              (value: 6)
   Default:       Submitted
   Save
```

The numeric values matter — they're what the Power Automate flow filters
on. Use the values from each spec's "Choice values" section.

#### Then, add the Choice column to the table

```
+ New column
   Display name:  Status
   Data type:     Choice
   Sync this choice with: Status (MX Requests)    ← pick the global choice
   Default:       Submitted
   Required:      Required
   Save
```

Repeat the global Choice creation for:

| Choice (global)                | Used by                                       |
| ------------------------------ | --------------------------------------------- |
| `Status (MX Requests)`         | cr_mx_request                                 |
| `Routing (MX Requests)`        | cr_mx_request                                 |
| `Decision (MX Requests)`       | cr_mx_request                                 |
| `Priority (MX Requests)`       | cr_mx_request                                 |
| `Request Type (MX Requests)`   | cr_mx_request                                 |
| `Audience (MX Requests)`       | cr_mx_request, cr_operational_bulletin        |
| `Status (Aircraft)`            | cr_aircraft, cr_aircraft_status_log           |
| `Status (Personnel)`           | cr_personnel_maintenance, cr_personnel_status_log |
| `Action Type (Personnel Status Log)` | cr_personnel_status_log                 |
| `Action (Audit Log)`           | cr_audit                                      |
| `Level (Operational Bulletins)`| cr_operational_bulletin                       |
| `Status (Operational Bulletins)`| cr_operational_bulletin                      |
| `Severity (Safety Reports)`    | cr_safety_report                              |
| `Status (Safety Reports)`      | cr_safety_report                              |
| `Visible To Roles (MX Request Comments)` | cr_mx_request_comment               |
| `View (User Filter Preferences)` | cr_user_filter_pref                         |
| `Class (Aircraft Type)`        | cr_aircraft_type, cr_aircraft                 |
| `Type (Region)`                | cr_region                                     |
| `Operations (Base)`            | cr_base                                       |
| `Role (Personnel Maintenance)` | cr_personnel_maintenance                      |
| `Role (Personnel Crew)`        | cr_personnel_crew                             |
| `Specialty (Personnel Crew)`   | cr_personnel_crew                             |

Tedious upfront but pays off on every Patch / Filter formula.

### Choice (multi-select)

Same as Choice but check the "Allow multiple selections" box:

```
+ New column
   Display name:  Audience
   Data type:     Choice
   Sync this choice with: Audience (MX Requests)
   Allow multiple selections: ☑ Yes
   Save
```

### Lookup (single)

Lookup columns reference another table. The target table **must already
exist** — that's why build order matters.

```
+ New column
   Display name:  Aircraft Tail
   Name:          cr_aircraft_tail        (auto-generated)
   Data type:     Lookup
   Related table: Aircraft (cr_aircraft)
   Required:      Optional                (per spec)
   Save
```

Behind the scenes Dataverse creates a 1-to-many relationship. Inspect
under `Schema → Relationships` if needed.

### Person/Group (Customer / User)

Dataverse handles "Person" via a Lookup to the built-in `User` table
(`systemuser`).

```
+ New column
   Display name:  Requested By
   Name:          cr_requested_by
   Data type:     Lookup
   Related table: User
   Required:      Required
   Save
```

When the canvas app's `Patch` writes `varCurrentUser` (which is `User()`),
Dataverse resolves it correctly.

### Autonumber (primary column on transactional tables)

Some tables use Autonumber as the primary column display value (Request
Number, Bulletin ID, etc.). To set this up, you can't just edit the
primary column — you have to create the table with Autonumber from the
start.

```
+ New → Table → Table (advanced properties)

   Display name:           MX Request
   Primary column display: Request Number
   Primary column type:    Autonumber             ← this option only at table create
   Format:                 String prefix          (or Date / Random Number)
   Prefix:                 MXR-
   Minimum number:         5                      (5-digit padding → MXR-00001)
   Seed value:             1
   Save
```

This is why the build-order doc says "create primary column as
autonumber from the start." If you forget, you have to delete and
recreate the table.

## A.5 Per-table walkthrough

Open each `cr_*.md` spec, follow the column list. Apply the
appropriate column-type pattern from §A.4. Hit Save after every column
to avoid losing work.

The column lists are short — mostly 6–18 columns per table. Pace
yourself: 15–25 minutes per table. The whole 15-table build is 4–6
hours of focused work.

## A.6 Wiring up the relationships pane

After Lookup columns are added, verify under each table's
`Relationships → Many-to-one`:

```
cr_mx_request ↔ cr_aircraft        (cr_aircraft_tail)
cr_mx_request ↔ cr_base            (cr_base)
cr_mx_request ↔ User (systemuser)  (cr_requested_by, cr_approver)
cr_aircraft   ↔ cr_aircraft_type   (cr_type)
cr_aircraft   ↔ cr_base            (cr_base)
cr_aircraft   ↔ cr_region          (cr_region)
... (and so on per the table specs)
```

If any relationship is missing, Power Apps Studio won't see the
related fields when you do `record.RelatedTable.Field` lookups.

## A.7 Enable Auditing on each business table

If you missed it during table creation, retroactively enable:

```
Tables → cr_mx_request → Properties (top right pencil icon)
   Advanced options → Audit changes to its data: ☑ Yes
   Save
```

Do this for every table that holds business data (skip lookups like
Region / Base / Aircraft Type if you want; their changes are rare).

## A.8 Build security roles

Per `connections.md`, create 8 custom security roles:

```
Solutions → MX Connect → + New → Security → Security role

   Display name:  MXC RMM
   Name:          MXC_RMM
```

For each role, switch to the **Custom Entities** tab (or in the new
maker UI, scroll to the Custom Tables section). For each of your 15
tables, click the privilege circles to set the level per the per-table
grid in `connections.md`.

```
Privilege circles (left to right):
   None / User / Business Unit / Parent: Child Business Units / Organization

Click once = User
Click twice = BU
Click 3 times = Parent: Child BUs
Click 4 times = Org
Click 5 times = back to None
```

Save the role. Repeat for the other 7. **Tedious but one-time.**

## A.9 Set up business units (if not already)

```
Power Platform admin center → Environments → [Dev] → Settings →
   Users + permissions → Business units → + New

   Per region:
      Name:     109 UT (or WY/MT, ID/NV, etc.)
      Parent:   ihc.org (root)
      Save
```

Then assign each user to their region's BU under
`Users + permissions → Users → [user] → Manage roles + business unit`.

This is what makes RMM regional scoping work automatically.

## A.10 Smoke test

```
Solutions → MX Connect → Tables → MX Request → + New row
   Fill required fields manually
   Save
```

Confirm the autonumber populates (`MXR-00001`). Confirm `cr_audit`
remains empty (because the flow isn't built yet — it's the flow that
writes audit rows).

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

This is the fastest path if you're comfortable with `pac` and the
Solution XML format. Realistically, most builds take Path 2 the first
time.

### Path 2 — Build manually in Power Automate Studio

Read `flows/mxr-approval-flow-v2.json` as a recipe, not a deployable
artifact. The structure tells you which actions to add, in what order,
with what inputs.

## B.2 Create the flow (manual path)

```
make.powerautomate.com → left nav → My flows → + New flow → Automated
   Flow name:  mxr-approval-flow-v2
   Trigger:    When a row is added, modified or deleted (Microsoft Dataverse)
   Skip       (we'll set the trigger params next)
```

## B.3 Configure the trigger

Click the trigger card to expand:

```
Change type:        Added or Modified
Table name:         MX Requests
Scope:              Organization
Filter columns:     cr_status,cr_decision
Filter rows:        cr_status eq 1 and cr_decision eq null
Run as:             Modifying user (default — fine for now)
```

The filter is critical — it stops the flow from re-firing on its own
Decision writes.

## B.4 Add the actions

The flow JSON in `flows/mxr-approval-flow-v2.json` lists actions in
order. For each one:

```
+ New step → search for the action name (e.g., "Initialize variable")
   Pick the matching connector (Dataverse, Teams, Office 365, etc.)
   Fill in the inputs from the JSON's "parameters" object
```

### Action sequence (in order)

| # | Action display name              | Connector       | Operation                              |
| - | -------------------------------- | --------------- | -------------------------------------- |
| 1 | Initialize variable — vAuditCorrelation | Built-in | Initialize variable                    |
| 2 | Initialize variable — vRouting   | Built-in        | Initialize variable                    |
| 3 | Initialize variable — vRecipientChannel | Built-in | Initialize variable                    |
| 4 | Audit submitted                  | Dataverse       | Add a new row → table cr_audit         |
| 5 | Compose card body                | Built-in        | Compose                                 |
| 6 | Post card and wait               | Teams           | Post adaptive card and wait for response |
| 7 | Decision — Switch                | Built-in        | Switch                                 |
| 8 |   Approve case (4 actions inside) | Dataverse + Outlook + Teams | Update + Create event + Update + Post + Audit |
| 9 |   Deny case (3 actions)          | Dataverse + Teams | Update + Post + Audit                |
| 10 |  Request Info case (3 actions)  | Dataverse + Teams | Update + Post + Audit                |
| 11 |  Escalate case (3 actions)      | Dataverse        | Update + Update + Audit                |
| 12 | Update request escalated (timeout) | Dataverse    | Update a row                           |
| 13 | Reset decision (timeout)         | Dataverse       | Update a row                           |
| 14 | Email director escalation        | Office 365      | Send an email V2                       |
| 15 | Audit escalated (timeout)        | Dataverse       | Add a new row                          |

For each Dataverse action:

```
Table name:    MX Requests / MX Audit / etc.
Row ID:        @{triggerOutputs()?['body/cr_mx_requestid']}
Fields:        Click "Show advanced options" to see all columns;
               populate per the JSON's parameters object
```

For Choice columns, pick from the dropdown — Power Automate Studio
shows the labels (Submitted, Approved, etc.) but stores the numeric
value.

For Lookup columns, you have two ways:
- Pick a row from the dropdown (interactive — use during testing)
- Use the OData bind syntax: `systemusers(@{output?['body/responder/objectId']})`

## B.5 Configure the Adaptive Card

The Compose action embeds a JSON literal. Copy the entire `body` and
`actions` arrays from the JSON's `Compose_card_body.inputs` section into
the Compose action's input.

Test-render the card in https://adaptivecards.io/designer to verify
syntax before saving the flow. Common gotchas:
- Triple curly braces in formulas — Power Automate evaluates them on
  flow run, not in the designer
- `@{...}` expressions only work inside Compose / Update inputs;
  literal `${}` placeholders won't substitute

## B.6 Post adaptive card and wait

```
Post as:           Flow bot
Post in:           Channel
Team:              @{parameters('mx_approver_team_id')}
Channel:           @{variables('vRecipientChannel')}
Adaptive Card:     @{outputs('Compose_card_body')}
Update message:    Decision recorded.
```

Set the **timeout** under "Show advanced options":

```
Timeout duration: PT24H
```

This action's outputs (`body/data/action`, `body/data/comment`,
`body/responder/objectId`, etc.) feed every downstream branch.

## B.7 Switch on decision

```
Switch on: outputs('Post_card_and_wait')?['body/data/action']

Cases:
   approve       → Approve branch (5 actions)
   deny          → Deny branch (3 actions)
   request_info  → Request Info branch (3 actions)
   escalate      → Escalate branch (3 actions)
Default:         (empty — covered by timeout branch in parallel)
```

For each case, drag the matching actions from the JSON's `Decision.cases`
section.

## B.8 Timeout / failure branch

The timeout branch runs **in parallel to** the Switch — set up via the
"Configure run after" option on each timeout action:

```
Update_request_escalated_timeout → Configure run after
   ✓ Post_card_and_wait timed out
   ✓ Post_card_and_wait failed
   ✗ has succeeded
```

This is how you implement the parallel branch that catches the 24h
timeout.

## B.9 Environment variables

Before the flow can run, set values:

```
Solutions → MX Connect → + New → More → Environment variable

   For each of the 11 mx_* parameters in the flow JSON:
      Display name:    mx_approver_team_id
      Name:            cr_mx_approver_team_id
      Data type:       Text
      Default value:   19:abc123...@thread.tacv2
      Save
```

Power Automate auto-resolves `@parameters('mx_approver_team_id')` →
`@parameters('cr_mx_approver_team_id')` from the connection reference
that maps to your env variable. If you used the JSON's
`metadata.schemaName` binding, this works automatically.

## B.10 Connection references

```
Solutions → MX Connect → + New → More → Connection reference

   Display name:  Dataverse — MXConnect
   Name:          cr_DataverseConnection
   Connector:     Microsoft Dataverse
   Connection:    Pick the one you authenticated as the service account
   Save
```

Repeat for `cr_TeamsConnection` (Microsoft Teams) and `cr_OutlookConnection`
(Office 365 Outlook).

## B.11 Smoke test the flow

```
Power Automate → My flows → mxr-approval-flow-v2 → Run history
```

In a separate tab, go to your canvas app or directly into Dataverse:

```
Power Apps → Tables → MX Request → + New row
   Fill required fields
   Status: Submitted
   Routing: RMM
   Save
```

Wait 5–30 seconds. The flow should fire, you should see it in run
history. Open the run, expand each action, verify it succeeded.

If the Adaptive Card lands in the wrong channel: check `vRouting` and
`vRecipientChannel` initialization values.

If no card lands: check that the Power Automate bot is added to the
target Teams channel (`Channel → Connectors → Power Automate`).

If the flow never triggers: check the trigger filter expression — the
single most common bug is missing `cr_decision eq null`.

---

# Part C — Common gotchas

| Issue                                                          | Cause                                                                | Fix                                                              |
| -------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| "Required column missing" on Patch                             | Required column on the table without a default                       | Either remove Required, or add a Default value                   |
| Lookup column doesn't show the table I want                    | Target table not in the same solution                                | Add target table to the MXConnect solution                       |
| Flow runs in a loop                                            | Trigger filter missing `cr_decision eq null`                         | Add it to the trigger Filter rows expression                     |
| Adaptive Card doesn't render                                   | Compose action has malformed JSON                                    | Paste into adaptivecards.io/designer to find the syntax error    |
| `@parameters('mx_…')` is null at runtime                       | Env variable not mapped to the connection reference                  | Check Solutions → Env variables → set Current value              |
| "User can't see this row"                                      | Dataverse role privilege at User instead of BU                       | Bump to BU on the relevant role                                  |
| Outlook event in wrong calendar                                | Env variable references calendar name, not ID                        | Use the ID (visible in Graph Explorer)                           |
| Choice column saves "1" instead of "Submitted" in audit metadata | Logged the numeric value instead of FormattedValue                  | Use `@{triggerOutputs()?['body/cr_status@OData.Community.Display.V1.FormattedValue']}` |

---

# Part D — When to use Copilot

Copilot in Power Apps + Power Automate is licensed in your Premium plan.
Use it as a scaffold, then layer the spec on top.

## Tables — scaffold from a CSV

```
Solutions → MX Connect → + New → Table → Get data → Excel/CSV
   Upload one of the populated CSVs (e.g., 04-aircraft.csv)
   Copilot auto-infers column types from the data
   Review and tweak per the spec — it gets ~70% right
```

Saves the most time on tables with many text columns
(`cr_personnel_maintenance` with 17 columns, `cr_aircraft` with 14).

## Flow — Copilot prompt

```
Power Automate → + New flow → Describe it to design it →

Prompt:
"When a Dataverse row is added or modified to MX Requests where Status
is Submitted and Decision is null, look up the related Aircraft, then
post an Adaptive Card to a Microsoft Teams channel based on the
Routing column (RMM channel for Routing=RMM, Director channel for
Routing=Director, Scheduler channel for Routing=Scheduler). Wait for
the user's response. Then update the MX Requests row with Decision
and Status, post a Teams DM to the requestor, and create a row in MX
Audit. If the wait times out after 24 hours, escalate to Director."
```

Copilot generates ~70% of the flow structure. You'll still need to:
- Add the Switch with 4 cases (it usually only does 2)
- Wire up environment variable references
- Tune the Adaptive Card body
- Add the timeout / failure branch

But it gets you past the empty-canvas-syndrome.

## What Copilot can't help with

- Choice column enum values (you still configure those)
- Security roles (no Copilot UI yet)
- Business unit hierarchy (manual)
- Item-level relationship configurations
- Reading the existing Power Fx in the canvas app (it can suggest
  formulas in isolation, but won't reason across screens)

---

# Part E — Order of operations summary

Here's the all-in-one path:

```
Day 1 (3-4h)
   1. Create solution + publisher
   2. Set up business units in admin center
   3. Build global Choice options (~22 of them)
   4. Build lookup tables: cr_region, cr_aircraft_type, cr_base
   5. Build cr_aircraft, cr_personnel_maintenance

Day 2 (3-4h)
   6. Build cr_mx_request, cr_audit (the flow's primary targets)
   7. Build module tables: cr_operational_bulletin, cr_safety_report,
      cr_*_status_log, cr_mx_request_comment, cr_user_filter_pref,
      cr_schedule_event, cr_personnel_crew
   8. Verify all relationships in Schema → Relationships

Day 3 (2-3h)
   9. Create environment variables
   10. Create connection references
   11. Build mxr-approval-flow-v2 (manual or Copilot-assisted)
   12. Smoke test: manually add a row to cr_mx_request → confirm flow fires

Day 4 (1-2h)
   13. Create 8 security roles
   14. Assign roles to test users (yourself + 1-2 others)
   15. Verify BU-scoped visibility works (RMM only sees their region)

Day 5+ — Move to canvas app build
   See powerfx/canvas-app.md
```

Total: roughly a working week of focused effort to get the data layer
+ flow live before touching the canvas app.

---

## Companion docs

- `tables/README.md` — table index + dependencies
- `tables/cr_*.md` — column-by-column specs
- `flows/mxr-approval-flow-v2.json` — flow recipe
- `connections.md` — security role privilege grid
- `runbook.md` — week-by-week deployment runbook
- `powerfx/canvas-app.md` — canvas app build guide (Day 5+)
