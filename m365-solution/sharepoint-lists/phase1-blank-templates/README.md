# Phase 1 Blank Import Templates

Header-only CSVs ready for SharePoint List import. These match the
schemas required by the Phase 1 Power Automate flow plus the full
8-module application breakdown (see
`../../Phase1/application-modules.md`) and 8-role capability matrix
(see `../../Phase1/roles-capability-matrix.md`).

**Use these to set up clean SharePoint Lists in any environment (dev,
test, prod) without seed data.** The populated CSVs in the parent
`sharepoint-lists/` folder are for actually populating Aircraft +
Personnel in production.

## All 14 lists

| #  | List                       | Module(s)                                           | Notes                                                  |
| -- | -------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| 1  | Regions                    | (lookup)                                            | Reference data                                         |
| 2  | Bases                      | (lookup)                                            | Reference data                                         |
| 3  | Aircraft Types             | (lookup)                                            | Reference data                                         |
| 4  | Aircraft                   | Status, MX Tracking, Schedule MX                    | Fleet master + status                                  |
| 5  | Personnel — Maintenance    | My Team, Status                                     | Maintenance roster + status                            |
| 6  | MX Requests                | Schedule MX, Ask Leadership, Time Off, PR, Pilot Trng | **Primary flow trigger**                             |
| 7  | Audit Log                  | (compliance)                                        | Append-only event log; flow service account writes    |
| 8  | Personnel — Crew           | My Team (Phase 2)                                   | Pilots / nurses / paramedics / dispatch                |
| 9  | Operational Bulletins      | Bulletins, Docs (archive)                           | Director/RMM/QA-posted; 3 levels                       |
| 10 | Safety Reports             | Safety Report                                       | Anonymous-friendly; permanent archive                  |
| 11 | Aircraft Status Log        | Status                                              | Append-only history of every Aircraft.Status change    |
| 12 | Personnel Status Log       | Status, My Team                                     | Append-only history of every Personnel.Status change + reassignment |
| 13 | MX Request Comments        | Ask Leadership                                      | Threaded replies on Ask Leadership requests            |
| 14 | User Filter Preferences    | MX Tracking                                         | Per-user saved filter state                            |

Plus a SharePoint **Document Library** (not a List) called `MX Connect
Docs` for the Docs module — see `application-modules.md §5`.

## Lists the flow actually touches

| List | Flow operation | Purpose |
|---|---|---|
| **MX Requests** | Trigger (item created/modified) + Update + Update + Update | Primary record |
| **Audit Log** | Create item (×3 typical, more with Request Info / Escalate) | Compliance trail |
| **Aircraft** | Get item (read) | Resolve tail → type, base, RMM |
| **Personnel — Maintenance** | (Optional) Get item | Resolve RMM/Director routing |
| **MX Request Comments** | Create item (Ask Leadership thread posts) | Threaded conversation |
| **Operational Bulletins** | Create item (auto-draft on AOG flag) | Auto-bulletin on aircraft going AOG |

## Import workflow

1. Save each CSV locally
2. Open in Excel → Insert → Table (Ctrl+T) with "My table has headers"
3. Save As `.xlsx`
4. SharePoint site → New → List → From Excel → upload, pick the table
5. SharePoint creates the list with **all columns as Single line of text**
   (because there's no data to infer from)
6. Edit each column to set the correct type per the schemas below
7. Wire up Lookup columns once all lists exist
8. Convert text columns that should be Person/Group (Requested By,
   Approver, Actor, Reporter, Posted By, Resolved By, Leader, RMM)

## Schemas

### 1. Regions — lookup list

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Region name, e.g., `109 UT` |
| Type | Choice | No | `Field` / `HQ` / `Field/HQ` / `Rover` |
| Notes | Multiple lines of text | No | |

### 2. Bases — lookup list

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | `City, ST` format, unique |
| City | Single line of text | Yes | |
| State | Single line of text | Yes | 2-letter code |
| Primary Region | Lookup → Regions (Title) | No | |
| Operations | Choice | No | `RW` / `FW` / `RW + FW` / `Office` / `Storage` / `Coverage` |
| Has Maintenance Office | Yes/No | No | Default Yes |
| Notes | Multiple lines of text | No | |

### 3. Aircraft Types — lookup list

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | E.g., `Bell 407 GXi` |
| Make | Single line of text | Yes | E.g., `Bell` |
| Model | Single line of text | Yes | E.g., `407 GXi` |
| Class | Choice | Yes | `Rotary` / `Fixed Wing` |
| Notes | Multiple lines of text | No | |

### 4. Aircraft — fleet master

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Tail number |
| Tail | Single line of text (8) | Yes | E.g., `N431HC` |
| Type | Lookup → Aircraft Types (Title) | Yes | |
| Make | Single line of text (32) | No | Denormalized for flow speed |
| Model | Single line of text (32) | No | Denormalized for flow speed |
| Serial Number | Single line of text (32) | No | |
| Aircraft Class | Choice | No | `Rotary` / `Fixed Wing` |
| Base | Lookup → Bases (Title) | No | Spare aircraft = blank |
| Region | Lookup → Regions (Title) | No | |
| RMM | Person/Group | No | Single user; the maintenance lead for this tail |
| Status | Choice | Yes | `In Service` / `AOG` / `Maintenance` / `Away from Base` / `Unavailable` / `Spare` |
| Status Reason | Single line of text (200) | No | |
| **Status Updated At** | Date and time | No | Set by Power Apps form on Status submission |
| **Status Updated By** | Person/Group | No | Set by Power Apps form on Status submission |

### 5. Personnel — Maintenance

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | `First Last` |
| First Name | Single line of text | Yes | |
| Last Name | Single line of text | Yes | |
| Email | Single line of text | Yes | |
| Phone | Single line of text | No | Stored as text to preserve formatting |
| Role | Choice | Yes | `AMT` / `AMT (Rover)` / `Supervisor` / `RMM` / `DOM` / `QA` / `QA Manager` / `Parts` / `Scheduler` / `Senior Director Aviation Operations` |
| Region | Lookup → Regions (Title) | No | |
| Primary Base | Lookup → Bases (Title) | No | |
| Coverage Bases | Multiple lines of text | No | Semicolon-delimited base names |
| Leader | Person/Group | No | Direct manager |
| Active | Yes/No | Yes | Default Yes |
| **Status** | Choice | No | `Available` / `Unavailable` / `Red Status`. Default `Available`. |
| **Status Reason** | Single line of text (200) | No | Why Unavailable / Red |
| **Status Updated At** | Date and time | No | Set by Power Apps form on Status submission |
| **Status Updated By** | Person/Group | No | Set by Power Apps form on Status submission |
| **On Shift** | Yes/No | No | Toggled from home screen; drives On-Call dashboard filter |
| Notes | Multiple lines of text | No | |

### 6. MX Requests — PRIMARY (flow trigger)

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Mirror of Request Number |
| Request Number | Single line of text | Yes | Format `MXR-NNNNN`. Generated by canvas app on Patch. |
| Aircraft Tail | Lookup → Aircraft (Tail) | No | Required for MX Schedule, AC Movement, Pilot Training; optional otherwise |
| Aircraft Type | Single line of text | No | Denormalized for Adaptive Card |
| Request Type | Choice | Yes | `MX Schedule` / `Aircraft Movement (PR)` / `Pilot Training` / `Time Off` / `Ask Leadership` / `Other` |
| Window Start | Date and time | No | Required for MX Schedule, AC Movement, Pilot Training, Time Off |
| Window End | Date and time | No | Validate End > Start in canvas app |
| Base | Lookup → Bases (Title) | No | |
| Reason | Multiple lines of text (1000) | No | |
| Priority | Choice | Yes | `Normal` / `High` / `AOG` |
| Status | Choice | Yes | `Submitted` / `Approved` / `Denied` / `More Info Requested` / `Cancelled` / `Escalated`. **Default `Submitted`. Flow trigger filters on this.** |
| Routing | Choice | Yes | `RMM` / `Scheduler` / `Director`. Defaults: RMM for MX Schedule + Time Off, Scheduler for AC Movement + Pilot Training, Director for Ask Leadership. |
| Requested By | Person/Group | Yes | Auto-set by canvas Patch |
| Approver | Person/Group | No | Set by flow on Adaptive Card response |
| **Decision** | Choice | No | `Approve` / `Deny` / `Request Info` / `Escalate`. Set by flow from Adaptive Card response. |
| **Decision Reason** | Multiple lines of text (1000) | No | Required when Decision = `Deny` |
| **More Info Request** | Multiple lines of text (1000) | No | Set when Decision = `Request Info` (the question to the submitter) |
| Decided At | Date and time | No | Set by flow |
| Decision Comment | Single line of text (500) | No | Free-text comment from Adaptive Card |
| Outlook Event ID | Single line of text (200) | No | Set by flow on approve (skipped for Ask Leadership and Safety Report) |
| **Comments Count** | Number | No | Tracks Ask Leadership thread length |
| **Anonymous** | Yes/No | No | Phase 1 only used by Safety Report variants; default No |
| **Audience** | Choice (multi) | No | For info-only requests: `RMM` / `Director` / `QA` / `Scheduler` / `All` |
| Audit Correlation | Single line of text (50) | Yes | GUID set on canvas Patch; joins Audit Log + Comments |

### 7. Audit Log — write-only

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Mirror of Audit ID |
| Audit ID | Single line of text | Yes | Format `AUD-NNNNNN` |
| Event At | Date and time | Yes | UTC — use `utcNow()` from flow |
| Actor | Person/Group | Yes | Who caused the event |
| Actor Role | Single line of text (32) | Yes | Role snapshot at the time — e.g., `AMT`, `RMM`, `Director`, `QA`, `Pilot`, `Scheduler`, `PR`, `System` |
| Action | Choice | Yes | See Action enum below |
| Subject Table | Single line of text (32) | Yes | E.g., `MX Requests`, `Operational Bulletins`, `Safety Reports`, `Aircraft`, `Personnel — Maintenance` |
| Subject ID | Single line of text (50) | Yes | Subject row's primary key |
| Audit Correlation | Single line of text (50) | Yes | Joins back to MX Requests / other primary list |
| Comment | Single line of text (500) | No | |
| Metadata | Multiple lines of text (4000) | No | JSON blob with full transition payload |
| Retention Until | Date and time | Yes | `addDays(utcNow(), 2555)` = 7 years (HIPAA). Set by flow. |

**Action enum** (full set across all modules):

```
mx_request.submitted                   bulletin.posted
mx_request.approved                    bulletin.resolved
mx_request.denied                      bulletin.permanently_deleted
mx_request.more_info_requested         safety_report.submitted
mx_request.escalated                   safety_report.acknowledged
mx_request.comment_added               safety_report.escalated
mx_request.cancelled                   safety_report.closed
mx_request.outlook_created             aircraft.status_changed
                                       personnel.status_changed
                                       personnel.reassigned
                                       personnel.shift_toggled
```

### 8. Personnel — Crew (Phase 2 prep)

(Unchanged from prior version — see commit history.) Pilots, flight
nurses, flight paramedics, respiratory therapists, comm specialists.
Schema is locked now so Phase 2 flows don't have to migrate.

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | `First Last` |
| First Name | Single line of text | Yes | |
| Last Name | Single line of text | Yes | |
| Email | Single line of text | Yes | |
| Phone | Single line of text | No | |
| Role | Choice | Yes | `Pilot` / `Chief Pilot` / `Flight Nurse` / `Flight Paramedic` / `Respiratory Therapist` / `Crew Scheduler` / `Communication Specialist` / `Comm Lead` / `Lead Nurse` / `Lead Paramedic` |
| Specialty | Choice (multi) | No | `Urban` / `Rural` / `Pediatric` / `Neonatal` / `Adult` / `Helicopter IFR` / `Helicopter VFR` / `Fixed Wing` / `Multi-engine` / `IFR / FW Captain` / `IFR / FW SIC` |
| Region | Lookup → Regions (Title) | No | |
| Primary Base | Lookup → Bases (Title) | No | |
| Coverage Bases | Multiple lines of text | No | |
| Certifications | Multiple lines of text | No | Semicolon-delimited cache from CompleteFlight |
| Cert Earliest Expiry | Date and time | No | |
| Hired Date | Date and time | No | |
| Leader | Person/Group | No | |
| Active | Yes/No | Yes | Default Yes |
| Notes | Multiple lines of text | No | |

### 9. Operational Bulletins — Bulletins module

Posted by RMM / Director / QA on every persona's home screen until
resolved. Three levels driving the home-screen color treatment.

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Mirror of Subject |
| Bulletin ID | Single line of text | Yes | Format `BUL-NNNNNN` |
| Level | Choice | Yes | `Alert` (red) / `Advisory` (amber) / `Info` (blue) |
| Posted At | Date and time | Yes | |
| Posted By | Person/Group | Yes | |
| Subject | Single line of text (200) | Yes | One-line headline |
| Body | Multiple lines of text (4000) | Yes | Markdown supported in canvas via `HtmlText` |
| Audience | Choice (multi) | No | `All` / `AMT` / `RMM` / `Director` / `QA` / `Pilot` / `Scheduler` / `PR`. Default `All`. Drives home-screen feed filter. |
| Region | Lookup → Regions (Title) | No | Optional region scoping; blank = all regions |
| Status | Choice | Yes | `Active` / `Resolved` / `Archived`. Default `Active`. |
| Resolved At | Date and time | No | Required to set Status = `Resolved` |
| Resolved By | Person/Group | No | Required to set Status = `Resolved` |
| Resolution Notes | Multiple lines of text (2000) | No | **Required to set Status = `Resolved`** — enforce with a column validation formula or canvas-app guard |
| Audit Correlation | Single line of text (50) | Yes | Joins to Audit Log post + resolve rows |

### 10. Safety Reports — Safety Report module

Anonymous-friendly. Stored separately from MX Requests because
retention, access, and triage flow are different.

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Mirror of Report ID |
| Report ID | Single line of text | Yes | Format `SAF-NNNNNN` |
| Submitted At | Date and time | Yes | |
| Reporter | Person/Group | Yes | When Anonymous=Yes, set to service account `mx-anonymous@ihc.org` |
| Reporter Display Name | Single line of text (100) | No | Blank when Anonymous |
| Anonymous | Yes/No | Yes | Default No |
| Region | Lookup → Regions (Title) | No | |
| Base | Lookup → Bases (Title) | No | |
| Aircraft Tail | Lookup → Aircraft (Tail) | No | If aircraft-related |
| Subject | Single line of text (200) | Yes | |
| Body | Multiple lines of text (8000) | Yes | |
| Severity | Choice | Yes | `Low` / `Medium` / `High` / `Critical` |
| Status | Choice | Yes | `Submitted` / `Acknowledged` / `Investigating` / `Escalated` / `Closed`. Default `Submitted`. |
| Acknowledged By | Person/Group | No | Set on Acknowledge action |
| Acknowledged At | Date and time | No | |
| Action Taken | Multiple lines of text (4000) | No | Filled at Close |
| Closed At | Date and time | No | |
| Closed By | Person/Group | No | |
| Escalated To | Person/Group | No | Set on Escalate to Director |
| Audit Correlation | Single line of text (50) | Yes | Joins to Audit Log |

**Item-level permissions:** Reporters can read+edit own only. RMM /
Director / QA can read+edit all. Anonymous reporters write but cannot
read back (set Created By to service account so the original submitter
loses owner rights).

### 11. Aircraft Status Log — Status module

Append-only history of every change to `Aircraft.Status`. Power Apps
form writes one row per submission; the Aircraft list itself holds
only the current state.

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Mirror of Log ID |
| Log ID | Single line of text | Yes | Format `ACS-NNNNNN` |
| Aircraft Tail | Lookup → Aircraft (Tail) | Yes | |
| Previous Status | Choice | No | Same enum as Aircraft.Status; null on first row |
| New Status | Choice | Yes | Same enum as Aircraft.Status |
| Status Reason | Single line of text (500) | No | |
| Changed At | Date and time | Yes | UTC |
| Changed By | Person/Group | Yes | |
| Audit Correlation | Single line of text (50) | Yes | Joins to Audit Log row |

### 12. Personnel Status Log — Status + My Team modules

Append-only history. Captures both status changes and reassignments.

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Mirror of Log ID |
| Log ID | Single line of text | Yes | Format `PSL-NNNNNN` |
| Personnel | Person/Group | Yes | The subject person |
| Previous Status | Choice | No | Same enum as Personnel.Status |
| New Status | Choice | No | Same enum as Personnel.Status. Blank when Action Type = `reassignment` |
| Status Reason | Single line of text (500) | No | |
| Changed At | Date and time | Yes | UTC |
| Changed By | Person/Group | Yes | |
| Action Type | Choice | Yes | `status_change` / `reassignment` / `shift_toggle` |
| Audit Correlation | Single line of text (50) | Yes | Joins to Audit Log |

### 13. MX Request Comments — Ask Leadership thread

Threaded replies on Ask Leadership / Safety Report items. Drives the
"full conversation thread visible to all approvers" requirement.

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | Mirror of Comment ID |
| Comment ID | Single line of text | Yes | Format `CMT-NNNNNN` |
| MX Request | Lookup → MX Requests (Request Number) | Yes | Parent record |
| Posted At | Date and time | Yes | |
| Posted By | Person/Group | Yes | |
| Body | Multiple lines of text (4000) | Yes | |
| Visible To Roles | Choice (multi) | No | `All approvers` / `Director only` / `RMM only` / `Submitter`. Default `All approvers`. |

### 14. User Filter Preferences — MX Tracking module

Per-user saved filter state for the MX Tracking + My Team Gantt views.

| Column | Type | Required | Choices / Notes |
|---|---|---|---|
| Title | Single line of text | Yes | `<email> · <view>` |
| User Email | Single line of text | Yes | |
| View | Choice | Yes | `MX Tracking` / `My Team Weekly` / `My Team Monthly` / `Bulletin Feed` |
| Filter JSON | Multiple lines of text (4000) | Yes | JSON blob: `{aircraft, base, region, dateRange, levels, …}` |
| Last Updated | Date and time | Yes | |

## Power Automate flow data flow at a glance

```
Trigger: When an item is created or modified in MX Requests
         (with trigger condition Status eq 'Submitted')
   ↓
Get item: Aircraft (by Tail = trigger.AircraftTail)   [skipped for Ask Leadership / Safety]
   → reads RMM, Aircraft Type, Base, Region
   ↓
Switch on trigger.Routing:
   case 'RMM':       composeRecipient = aircraft.RMM channel
   case 'Scheduler': composeRecipient = parameters('mx_scheduler_channel_id')
   case 'Director':  composeRecipient = parameters('mx_director_channel_id')
   ↓
Create item: Audit Log (action = mx_request.submitted)
   ↓
Compose Adaptive Card body (request fields + aircraft fields)
   Card actions: [Approve] [Deny+Reason] [Request Info] [Escalate]
   ↓
Post Adaptive Card and wait for response (Teams)
   limit.timeout = PT24H
   ↓
Decision (Switch on response.action):
   case 'approve':
      Update item: MX Requests (Status=Approved, Decision=Approve, Approver, Decided At)
      Create event: Outlook calendar  (skipped for Ask Leadership / Safety)
      Update item: MX Requests (Outlook Event ID)
      Post message: Teams DM to requestor
      Create item: Audit Log (action = mx_request.approved)
   case 'deny':
      Update item: MX Requests (Status=Denied, Decision=Deny, Decision Reason, Approver, Decided At)
      Post message: Teams DM to requestor (with written reason)
      Create item: Audit Log (action = mx_request.denied)
   case 'request_info':
      Update item: MX Requests (Status=More Info Requested, Decision=Request Info, More Info Request)
      Post message: Teams DM to requestor (asking the question)
      Create item: Audit Log (action = mx_request.more_info_requested)
      [flow ends here; submitter edits row → Status back to Submitted → flow re-triggers]
   case 'escalate':
      Update item: MX Requests (Status=Escalated, Decision=Escalate, Routing=Director)
      Post Adaptive Card to Director channel (re-enters approval at Director level)
      Create item: Audit Log (action = mx_request.escalated)
   on TimedOut/Failed:
      Update item: MX Requests (Status=Escalated, comment)
      Send email V2: Director group
      Create item: Audit Log (action = mx_request.escalated)
```

Status / Bulletin / Safety Report flows are separate (write-through or
single-recipient triage) — see `application-modules.md` for each.

## Environment variables (set in your Power Platform solution)

| Variable | Type | Example value |
|---|---|---|
| `mx_site_url` | String | `https://ihc.sharepoint.com/sites/MXConnect` |
| `mx_list_requests` | String | GUID of `MX Requests` list |
| `mx_list_audit` | String | GUID of `Audit Log` list |
| `mx_list_aircraft` | String | GUID of `Aircraft` list |
| `mx_list_bulletins` | String | GUID of `Operational Bulletins` list |
| `mx_list_safety` | String | GUID of `Safety Reports` list |
| `mx_list_comments` | String | GUID of `MX Request Comments` list |
| `mx_list_aircraft_status_log` | String | GUID of `Aircraft Status Log` list |
| `mx_list_personnel_status_log` | String | GUID of `Personnel Status Log` list |
| `mx_approver_team_id` | String | `19:abc123...@thread.tacv2` (IHC Life Flight Team ID) |
| `mx_approver_channel_id` | String | RMM channel (default approver) |
| `mx_scheduler_channel_id` | String | Scheduler channel (PR + Pilot Training routing) |
| `mx_director_channel_id` | String | Director channel (Ask Leadership + escalation routing) |
| `mx_safety_channel_id` | String | Dedicated Safety Reports channel |
| `mx_outlook_calendar` | String | Shared calendar name or ID |
| `mx_request_timeout_hours` | Int | 24 |
| `mx_audit_retention_days` | Int | 2555 |
| `mx_safety_retention_days` | Int | -1 (permanent — never expires) |
| `mx_app_deeplink_base` | String | URL prefix for Outlook event → canvas app deep-links |
| `mx_director_email` | String | Director group email for AOG / escalation routing |
| `mx_anonymous_account` | String | `mx-anonymous@ihc.org` (service account for anonymous safety reports) |
