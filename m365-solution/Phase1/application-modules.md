# Phase 1 — The 8 Application Modules

> **⚠️ EXTENSION SCOPE — NOT in canonical Phase 1.**
>
> This 8-module breakdown comes from MC Documentation v3 page 6 and
> describes the role-matrix expansion of MX Connect. **None of these
> 8 modules are part of canonical Phase 1.**
>
> **Canonical Phase 1** ships only the MX Request submit + approval
> workflow (the equivalent of Module 2's submission form + a 4-decision
> approval inbox). The 7 other modules — Status, Ask Leadership, Safety
> Report, Docs, My Team, MX Tracking, Bulletins — require the 6
> extension tables (`cr_operational_bulletin`, `cr_safety_report`,
> `cr_aircraft_status_log`, `cr_personnel_status_log`,
> `cr_mx_request_comment`, `cr_user_filter_pref`) which have **no
> canonical CSV data** and have not been validated against real IHC
> requirements.
>
> **Build the 8 modules only if you've explicitly opted into the
> matrix-extension scope** (Week 9+ in `runbook.md`). For canonical
> Phase 1 follow `runbook.md` + `build-walkthrough.md` instead.
>
> Section text below describes the original SharePoint variant where
> applicable. For Dataverse extension scope, the table names map 1:1 to
> the `cr_*` Dataverse equivalents in `tables/cr_*.md`.

---

Source: MC Documentation v3 (page 6 of 9). Each module is an area of the
canvas app + its backing SharePoint List(s) + supporting Power Automate
flows.

| #   | Module             | Backing list(s)                                                  | Approvers                                | Notes                                                                |
| --- | ------------------ | ---------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| 1   | **Status**         | Aircraft, Personnel — Maintenance, Aircraft Status Log, Personnel Status Log | (write-through, no approval)             | Status changes write straight to Aircraft / Personnel + a log row    |
| 2   | **Schedule MX**    | MX Requests, Schedule Events, Audit Log                          | RMM (regional) or Scheduler              | Submission with countdown + Gantt view                               |
| 3   | **Ask Leadership** | MX Requests (Routing=Director), Audit Log                        | RMM → Director (full thread visibility)  | Single thread; any approver can respond at any point                 |
| 4   | **Safety Report**  | Safety Reports, Audit Log                                        | RMM (regional) → Director                | Anonymous-friendly; permanent archive                                |
| 5   | **Docs**           | SharePoint Document Library + Bulletin Archive view              | (no approval — managed by RMM/Director)  | Read-only for most; upload limited to RMM/Director/QA/Scheduler      |
| 6   | **My Team**        | Personnel — Maintenance, Personnel — Crew, Schedule Events       | (read-mostly; reassign by RMM/Director)  | On-call / call+text / Gantt views, time-off + reassign workflows     |
| 7   | **MX Tracking**    | Schedule Events, MX Requests (read), Aircraft (read)             | (read-only)                              | Calendar + Gantt + Inspections chart with saved filter prefs         |
| 8   | **Bulletins**      | Operational Bulletins                                            | (post by RMM/Director/QA; resolve same)  | 3 levels (Alert / Advisory / Info); resolve requires written notes   |

---

## 1. Status

**Aircraft status (In Service / AOG)** and **personnel status (Available
/ Unavailable / Red Status)**. Includes location and tail number.
Populates the live manager dashboard with timestamp and submitter info
instantly.

### Lists touched

- **Aircraft** (`Status`, `Status Reason`, `Status Updated At`)
- **Personnel — Maintenance** (`Status`, `Status Reason`, `Status Updated At`, `Status Updated By`)
- **Aircraft Status Log** — append-only event log (every change)
- **Personnel Status Log** — append-only event log (every change)

### Submitters
AMT, RMM, Director, QA. (Pilot/Scheduler/PR/Payroll cannot submit status changes.)

### No approval required
Write-through. Logged for audit; manager dashboard auto-updates.

### Power Automate hook
A `status-change-broadcast` flow subscribes to both Aircraft and Personnel
list updates. On AOG flag, posts a [ALERT] bulletin auto-draft to the
RMM channel. On Red Status flag, posts to the regional RMM only (DM, not
channel — privacy on personnel health flags).

---

## 2. Schedule MX

**Submit maintenance windows** with aircraft, location, MX start and RTS
date/time pickers, and description. Includes manager approval workflow,
**live countdown timer** (days or hours until RTS, shows overdue in
red), and **Gantt calendar view**.

### Lists touched

- **MX Requests** (Request Type = `MX Schedule`)
- **Schedule Events** (created on approve, mirrors approved MX Requests)
- **Audit Log** (state transitions)

### Submitters
AMT, RMM, Director, QA. Pilot/PR cannot submit MX Schedule.

### Approvers
RMM (regional default), Scheduler (alt path for PR/training requests).
Director on escalation. QA on approve-with-comment for high-priority.

### Power Automate hook
`mxr-approval-flow-v2` (deployed). Approve/Deny/Escalate/Return.

### Countdown timer
Power Apps formula on the schedule list:
```
DateDiff(Now(), ThisItem.'Window Start', Hours)
```
Color: green if > 168h (7 days), amber if 24–168h, red if < 24h or overdue.

---

## 3. Ask Leadership

**Direct question to leadership with full escalation thread.** AMT
submits → RMM reviews → Approve / Deny / Return (more info) /
Escalate. Full conversation thread visible to all approvers. Director
can see and respond to any point in the thread.

### Lists touched

- **MX Requests** (Request Type = `Ask Leadership`, Routing = `Director` always)
- **MX Request Comments** — threaded replies (new list)
- **Audit Log** (every action including comment posts)

### Submitters
**All 8 roles can submit Ask Leadership** — this is the universal
upward-communication channel.

### Approvers
RMM (regional first), Director (on Escalate). All approvers see the
full thread; any can comment without changing state.

### Power Automate hook
Same `mxr-approval-flow-v2` flow with Routing=Director branch. Adds a
`mxr-ask-comment-flow` that posts new comments to the Director channel
as a reply to the original Adaptive Card.

---

## 4. Safety Report

**Anonymous or named safety concern reporting.** Managers can
Acknowledge, Return for more info, or Escalate. Anonymous reporters
cannot receive replies. Named reporters get Teams notifications at
every step. All reports permanently archived.

### Lists touched

- **Safety Reports** (separate list — different retention, stricter access)
- **Audit Log**

### Submitters
**All 8 roles** including Payroll (one of the few things Payroll can do
in the app via a focused submission link).

### Approvers
RMM (regional), Director (on escalate), QA (parallel reviewer).

### Anonymous handling

When the form's `Anonymous` toggle is on:
- `Reporter` field is set to a service account (`mx-anonymous@ihc.org`)
- `Reporter Display Name` is left blank
- `Anonymous` flag = Yes
- DM-back step in the flow is skipped
- Item-level permission strips read access from the original submitter
  (so even the reporter can't go back and see/edit it after submit)

### Power Automate hook
`safety-report-triage-flow` — separate flow because the recipient and
audit shape differ from MX Requests. Posts to a dedicated `Safety
Reports` Teams channel; QA gets a parallel DM.

---

## 5. Docs

**Read-only library** organized by Aircraft Type, Manuals, and SOPs.
Managed by Managers and Directors via SharePoint. Includes **Bulletin
Archive** showing every resolved operational bulletin with resolution
notes, resolved by, and full timestamp.

### Backing storage

- SharePoint **Document Library** (not a List) called `MX Connect Docs`
- View grouped by metadata column `Doc Category` (`Aircraft Type`, `Manual`, `SOP`)
- Bulletin Archive is a SharePoint **List View** filtered to Operational Bulletins where Status = `Resolved`

### Permissions
Browse + Download: AMT, RMM, Director, QA, Pilot, Scheduler, PR.
Upload + Manage: RMM, Director, QA, Scheduler.
Payroll: no access.

### Why a Document Library and not a List
Native versioning, native PDF preview, native folder structure for
Aircraft Type subdivisions. Lists handle structured data; Libraries
handle binary blobs.

---

## 6. My Team

**Full technician roster across all 9 regions.** On Call Now view with
tappable call and text buttons. Weekly and monthly Gantt views. Time
off request and approval workflow. Manager tech reassignment. Multi-
region filter for coverage visibility.

### Lists touched

- **Personnel — Maintenance** (filtered to On Shift + region)
- **Personnel — Crew** (Phase 2 prep — pilots, flight nurses, etc.)
- **Schedule Events** (for Gantt rendering)
- **MX Requests** (Time Off rows)

### View permissions
Most app users see their own region. RMM sees regional partial.
Director/QA/Scheduler see all regions. Payroll has a `View` link to
On-Call list + Tech List by Region only — no other personnel data.

### Tappable call & text
Power Apps `Launch()` on phone numbers:
```
Launch("tel:" & ThisItem.Phone)              // call
Launch("sms:" & ThisItem.Phone)              // text
```
Phones are stored as text on the Personnel list; bare digits in
production for `tel:` URI compatibility.

### Manager reassignment
RMM/Director can change `Personnel.Primary Base` and `Coverage Bases`
on a tech. Writes to a `Personnel Status Log` row with action =
`personnel.reassigned`.

### On Shift / Off Shift toggle
Each user has a `Personnel.On Shift` Yes/No that they toggle from
their home screen. Drives the On-Call dashboard filter.

---

## 7. MX Tracking

**Enhanced calendar with search bar and Aircraft / Base / Region
dropdowns.** Monthly and weekly Gantt views. **Upcoming Inspections bar
chart** — green (7+ days), amber (within 7 days), red (under 24 hours
or overdue). Saved filter preferences per user.

### Lists touched

- **Schedule Events** (read-only mirror of approved MX Requests)
- **MX Requests** (read-only, joined for hover-card details)
- **Aircraft** (read-only, joined for tail-type-base lookups)
- **User Filter Preferences** — per-user saved filter state (new list)

### View permissions
AMT, RMM, Director, QA, Scheduler: full interactive access.
Pilot, PR: View-only on Calendar / Weekly Gantt / Inspections Chart;
full filter access on the dropdowns.
Payroll: no access.

### Inspections chart bar logic

```powerfx
// Color formula on each upcoming inspection card
If(
  ThisItem.'Days Until Due' < 1, RGBA(220, 38, 38, 1),    // red
  ThisItem.'Days Until Due' <= 7, RGBA(217, 119, 6, 1),   // amber
  RGBA(22, 163, 74, 1)                                    // green
)
```

### Saved filter preferences
On filter change → `Patch(UserFilterPrefs, Defaults(...), { User: User().Email, View: 'MX Tracking', Filter: <json blob> })`.
On screen load → `LookUp(UserFilterPrefs, User = User().Email)` → restore.

---

## 8. Bulletins

**Director/RMM-posted operational bulletins on every home screen.**
Three levels: **[ALERT] red**, **[ADVISORY] amber**, **[INFO] blue**.
Resolve requires written resolution notes before archiving. Full audit
trail of every bulletin posted and resolved.

### Lists touched

- **Operational Bulletins** (separate list)
- **Audit Log** (post + resolve actions)

### Posters
RMM, Director, QA. (AMT/Pilot/Scheduler/PR/Payroll cannot post.)

### Resolvers
RMM, Director, QA. Resolve requires `Resolution Notes` (not blank) and
sets `Resolved At` + `Resolved By`.

### Permanent delete
**Director only.** Logged in audit with action =
`bulletin.permanently_deleted`. Surfacing this requires Site Owner role
on the SharePoint site (because permanent delete bypasses the recycle
bin).

### Home-screen feed
Each persona's home renders the bulletin feed filtered by:
- Status = `Active` (not Resolved)
- Audience field includes the persona's role OR is `All`

Sorted by Level desc (Alert > Advisory > Info), then `Posted At` desc.

---

## Companion docs

- `roles-capability-matrix.md` — who can do what (8 roles × 42 capabilities) — also extension scope
- `runbook.md` — canonical Phase 1 deployment runbook
- `connections.md` — connection references + 5 canonical Dataverse roles
- `tables/cr_*.md` — Dataverse table specs (8 canonical + 7 extension)
