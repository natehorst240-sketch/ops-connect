# Canvas App Build Guide — MX Connect Dashboard (Dataverse)

## Build-time naming notes (discovered during Phase 1 build)

These override anything in the spec below where they conflict.

| Issue | What the spec says | What Power Apps actually needs |
|---|---|---|
| Data source names | `'MX Request'`, `'Personnel - Maintenance'` etc. | **Plural**: `'MX Requests'`, `'Personnel - Maintenances'`, `'Personnel - Crews'`, `Aircrafts`, `Regions`, `Bases` |
| Status column | `Status` | **`'Status (cr_status)'`** — plain `Status` resolves to the system `statecode` column (Active/Inactive) and causes a type error. For string comparison in Filter use **`Text('Status (cr_status)') = "Submitted"`** — `.Value` is not recognized on this column reference in current Studio |
| Decision column | `Decision` | **`cr_decision`** — logical name, not display name |
| OptionSet values in Patch | `'Status (MX Requests)'.Approved` | Column name and OptionSet type name are different. Use column name for the field key and OptionSet type name for the value — e.g. `{ 'Status (cr_status)': 'Status (MX Requests)'.Approved, cr_decision: 'Decision (MX Requests)'.Approved }` |
| Request Number | `'Request Number'` | **`cr_request_number`** — logical name of the Autonumber column |
| Role field | `varUserPersonnel.Role.Value` | `Role` on `Personnel - Maintenances` and `Role` on `Personnel - Crews` are **two separate local OptionSet types** — `Coalesce` rejects them because the types don't match. Use **`Text(varUserPersonnel.Role)`** (not `.Value`) to coerce each to a plain string before `Coalesce`. `Text()` returns the display label ("AMT", "RMM", …) and returns blank on blank, so `Coalesce` works correctly. |
| Navigate in OnStart | `Navigate(scr_ApprovalInbox, ...)` | **Not allowed in OnStart** — set `StartScreen` in App → Advanced tab instead |
| Leading spaces in column names | — | A leading space in a column's Display Name breaks formula resolution — Power Apps falls back to the system column. Fix in the column definition and re-add the data source. |
| Theme | `File → Settings → Theme → Custom` | **Removed** — theme is now `App → Theme` property in the formula bar. Replace `PowerAppsTheme` with a custom palette record. |

> **⚠️ EXTENSION SCOPE — most of this doc describes the role-matrix
> expansion (8 modules, 15 tables).**
>
> **Canonical Phase 1 canvas app needs only:**
> - **1 submit screen** — Universal MX Request form (the 6 canonical
>   Request Types: Phase Inspection / Repair / Overhaul / Time Off /
>   Open Shift / AOG)
> - **1 approval screen** — In-app mirror of the Adaptive Card inbox
>   (Approve / Deny / Escalate / Return — 4 buttons matching the flow)
> - **Optional: a home with a fleet status read-out** — list of
>   `cr_aircraft` rows
>
> Everything below — Bulletins, Safety, Status Log, My Team, MX
> Tracking, Docs modules; the 8-module side nav; the role-matrix
> capability gating; the `'Operational Bulletin'` / `'Safety Report'`
> Patch examples — is **extension scope**. Skip those sections unless
> you've opted into the role-matrix expansion (Week 9+ in
> `runbook.md`).
>
> The Dataverse-vs-SharePoint Power Fx differences in §3 and the
> `Patch` shapes in §15 still apply for canonical scope.

## Canonical Phase 1 canvas app — minimal sketch

Three screens:

```
scr_Home          (optional — fleet status read-out)
scr_NewMXRequest  (universal submit form, 6 canonical Request Types)
scr_RequestConfirm (post-submit confirmation)
scr_ApprovalInbox (approver's view; mirrors Adaptive Card with 4 buttons)
```

Data sources to add (just **8 canonical Phase 1 tables**):

```
View → Data → + Add data → Dataverse → MXConnect environment →
   ☑ MX Request                       (cr_mx_request)
   ☑ MX Audit                         (cr_audit)
   ☑ Aircraft                         (cr_aircraft)
   ☑ Aircraft Type                    (cr_aircraft_type)
   ☑ Personnel - Maintenance          (cr_personnel_maintenance)
   ☑ Personnel - Crew                 (cr_personnel_crew)    ← schema only, header-only CSV
   ☑ Region                           (cr_region)
   ☑ Base                             (cr_base)
```

For canonical scope, the key formulas are in §6 (Approval Inbox
buttons) and §8 (Submit form Patch). The 4 Approval Inbox buttons
should match the canonical Decision values:

```powerapps
// btn_Approve  → Decision = Approved   (value 1)
// btn_Deny     → Decision = Denied     (value 2; Decision Reason required)
// btn_Escalate → Decision = Escalated  (value 3; Routing → Director, then re-arm)
// btn_Return   → Decision = Returned   (value 4; More Info Request required)
```

The submit form's Routing logic is simpler in canonical (only RMM or
Director — no Scheduler):

```powerapps
Routing: If(
    dd_Priority.Selected.Value = "AOG",
    'Routing (MX Requests)'.Director,
    'Routing (MX Requests)'.RMM
)
```

When you opt into the matrix-extension scope, the rest of this doc
(Modules 1–8, capability gating, etc.) becomes the canvas app's full
scope.

---

A single Power Apps canvas app that hosts the full Phase 1 workflow:
role-based home, all 8 application modules, in-app approval inbox, plus
the universal MX Request submission form. Phone form factor (Tablet works
with minor padding tweaks).

**Backing data layer: Dataverse.** The app binds to the 15 Dataverse
tables in `../tables/` (8 canonical + 7 extension). For canonical
scope, only the 8 canonical tables are needed.

This guide is sequential. Build in the order below — every section
depends on the previous's variables and screens.

## Companion docs

- `../roles-capability-matrix.md` — who can do what (extension scope reference)
- `../application-modules.md` — what each module does (extension scope reference)
- `../tables/README.md` — Dataverse table index + build order
- `../flows/mxr-approval-flow-v2.json` — the approval flow (4-decision canonical)
- `../connections.md` — connection references + Dataverse roles (canonical 5)
- `../runbook.md` — canonical Phase 1 deployment runbook
- `../build-walkthrough.md` — click-by-click table + flow build

## Dataverse vs SharePoint syntax cheat sheet

If you're porting from a SharePoint version of this app, here are the
Power Fx differences:

| Concept              | SharePoint                                         | Dataverse                                  |
| -------------------- | -------------------------------------------------- | ------------------------------------------ |
| Lookup column write  | `{ Id: rec.ID, Value: rec.Title }`                 | `rec` (just the record itself)             |
| Person/Group write   | `varCurrentUser` (works on both, but…)             | `varCurrentUser` (cleaner — native)        |
| Person field read    | `record.'Posted By'.DisplayName`                   | `record.'Posted By'.'Full Name'`           |
| Choice column        | `{ Value: "Approved" }` (read: `.Value`)           | Same write shape; read via `.Value` works  |
| Filter on Choice     | `Status.Value = "Submitted"`                       | Same                                       |
| Internal column name | `Status` becomes `Status_x0020_x` server-side      | `cr_status` — but display names work in Power Fx |
| Auto-ID              | Manual (`Last(...).ID + 1`)                        | Native Autonumber                          |
| User natural key     | `Email`                                            | `Email` (display name) or `cr_email`       |

This doc uses display names throughout (e.g., `Status`, `Aircraft Tail`)
because Power Apps Studio resolves them to logical names automatically.

## Naming conventions

| Prefix     | Meaning                       |
| ---------- | ----------------------------- |
| `scr_`     | Screen                        |
| `cnt_`     | Container                     |
| `gal_`     | Gallery                       |
| `frm_`     | Edit/Display Form             |
| `lbl_`     | Label                         |
| `btn_`     | Button                        |
| `txt_`     | Text Input                    |
| `dd_`      | Dropdown                      |
| `dp_`      | DatePicker                    |
| `tgl_`     | Toggle                        |
| `ico_`     | Icon                          |
| `var`      | Global variable (Set)         |
| `col`      | Collection (ClearCollect)     |

---

> **Sections 1–17 below describe the extension-scope full-fat 8-module
> canvas app.** For canonical Phase 1, the relevant sections are §1
> (create app), §2 (data sources — but only the 8 canonical tables),
> §6 (Approval Inbox — but with the 4 canonical buttons matching
> Approved/Denied/Escalated/Returned), §8 (Submit form — but
> simplified Routing logic and the 6 canonical Request Types only).
>
> The button labels in §6 below say "Request Info" — for canonical,
> use **Return** (matches the flow's button label and the Decision
> value `Returned`).

# 1. Create the app

```
Power Apps Studio → + Create → Blank app → Canvas
   Name:    MX Connect
   Format:  Phone
   Save to: MXConnect solution
```

Set the app theme (optional — cosmetic only):

In modern Power Apps Studio the theme is applied from the **Themes pane**
in the toolbar, not via a formula. Do **not** set `App.Theme` in a Power Fx
formula — `App.Theme` is a read-only object exposing `Colors`, `Font`, etc.
and is not assignable to a `{ palette: … }` record; doing so produces a
type-incompatible app-level error.

```
Tree view → App → Theme property (formula bar)
```

Replace `PowerAppsTheme` with:

```powerapps
{
    palette: {
        themePrimary:   "#FF6A00",
        themeDark:      "#c45200",
        themeLight:     "#ffd4b3",
        neutralPrimary: "#18181B"
    }
}
```

(The old **File → Settings → Theme → Custom** menu was removed in
current Power Apps Studio. Theme is now a formula property on the App
object.)

# 2. Add data sources

Add the 15 Dataverse tables from the `MXConnect` solution.

```
View → Data → + Add data → Dataverse → MXConnect environment →
   ☑ MX Request                       (cr_mx_request)
   ☑ MX Audit                         (cr_audit)
   ☑ Operational Bulletin             (cr_operational_bulletin)         ← extension
   ☑ Safety Report                    (cr_safety_report)                ← extension
   ☑ Aircraft                         (cr_aircraft)
   ☑ Aircraft Type                    (cr_aircraft_type)
   ☑ Aircraft Status Log              (cr_aircraft_status_log)          ← extension
   ☑ Personnel - Maintenance          (cr_personnel_maintenance)
   ☑ Personnel - Crew                 (cr_personnel_crew)
   ☑ Personnel Status Log             (cr_personnel_status_log)         ← extension
   ☑ MX Request Comment               (cr_mx_request_comment)           ← extension
   ☑ Schedule Event                   (cr_schedule_event)               ← Phase 2
   ☑ User Filter Preference           (cr_user_filter_pref)             ← extension
   ☑ Region                           (cr_region)
   ☑ Base                             (cr_base)
```

Power Apps surfaces tables by display name in formulas (e.g.,
`'Personnel - Maintenance'`). The `cr_*` logical names are visible in the
data pane but you don't reference them in Power Fx.

# 3. App-level state

## App.OnStart

Loads the current user, their role, the action permissions matrix, and
the most recent bulletins. Fires once per session.

```powerapps
// --- Current user identity ---
Set(varCurrentUser, User());
Set(varUserPersonnel,
    LookUp(
        'Personnel - Maintenance',
        Email = varCurrentUser.Email
    )
);

// --- Role detection ---
//   Personnel.Role drives every visibility check.
//   Pilot fallback checks Personnel - Crew.
//   Payroll users have no Personnel row → fall through via Entra group lookup.
Set(varRole,
    Coalesce(
        varUserPersonnel.Role.Value,
        LookUp('Personnel - Crew', Email = varCurrentUser.Email).Role.Value,
        // Payroll fallback (Phase 2: replace with Entra group membership lookup)
        If(
            varCurrentUser.Email in [
                "payroll@ihc.org",
                "payroll-admin@ihc.org"
            ],
            "Payroll",
            "Unknown"
        )
    )
);

// --- Capability matrix (mirrors roles-capability-matrix.md) ---
Set(varCan,
    {
        // Submit
        SubmitAircraftStatus:   varRole in ["AMT","RMM","DOM","Director","QA","Supervisor","ADOM"],
        SubmitPersonnelStatus:  varRole in ["AMT","RMM","DOM","Director","QA","Supervisor","ADOM"],
        SubmitMXSchedule:       varRole in ["AMT","RMM","DOM","Director","QA","Supervisor","ADOM"],
        SubmitAskLeadership:    !(varRole in ["Unknown"]),
        SubmitSafetyReport:     !(varRole in ["Unknown"]),
        SubmitAircraftMovement: varRole in ["AMT","RMM","DOM","Director","QA","Scheduler","PR","ADOM","Supervisor"],
        SubmitPilotTraining:    varRole in ["Pilot","Chief Pilot"],
        SubmitTimeOff:          varRole in ["AMT","RMM","DOM","Director","QA","Supervisor","ADOM"],
        PostBulletin:           varRole in ["RMM","DOM","Director","QA","ADOM"],
        // Approve / Act
        ApproveMXSchedule:      varRole in ["RMM","DOM","Director","QA","Scheduler","ADOM"],
        ApprovePRMovement:      varRole in ["Director","QA","Scheduler","ADOM"],
        ApprovePilotTraining:   varRole in ["Scheduler"],
        ApproveTimeOff:         varRole in ["RMM","DOM","Director","QA","ADOM"],
        DenyWithReason:         varRole in ["RMM","DOM","Director","QA","Scheduler","ADOM"],
        Return:                 varRole in ["RMM","DOM","Director","QA","Scheduler","ADOM"],
        EscalateToDirector:     varRole in ["RMM","QA","ADOM"],
        ResolveBulletin:        varRole in ["RMM","DOM","Director","QA","ADOM"],
        DeleteBulletin:         varRole in ["Director","DOM"],
        ReassignTech:           varRole in ["RMM","DOM","Director","ADOM"],
        EditScheduleEntries:    varRole in ["Scheduler"],
        // See
        StatusDashboard:        varRole in ["RMM","DOM","Director","QA","ADOM"],
        AskLeadershipDashboard: varRole in ["RMM","DOM","Director","QA","ADOM"],
        SafetyDashboard:        varRole in ["RMM","DOM","Director","QA","ADOM"],
        PRPilotDashboard:       varRole in ["Director","QA","Scheduler","ADOM"],
        EscalationsFeed:        varRole in ["Director","DOM"],
        FullVisibility:         varRole in ["DOM","Director","QA","Scheduler","ADOM"],
        UploadDocs:             varRole in ["RMM","DOM","Director","QA","Scheduler","ADOM"]
    }
);

// --- Bulletin feed (cache) — extension scope ---
ClearCollect(colBulletins,
    Filter(
        'Operational Bulletin',
        Status = 'Status (Operational Bulletins)'.Active
    )
);

// --- Pending approvals for this user (canonical) ---
ClearCollect(colMyApprovals,
    Filter(
        'MX Request',
        Status = 'Status (MX Requests)'.Submitted,
        IsBlank(Decision),
        Or(
            (varRole = "RMM" && 'Aircraft Tail'.RMM.Email = varCurrentUser.Email),
            (varRole in ["Director","DOM"] && Routing = 'Routing (MX Requests)'.Director),
            (varRole in ["QA","ADOM"])
        )
    )
);

// --- Default landing screen ---
Set(varHomeScreen, scr_Home);
Navigate(scr_Home, ScreenTransition.None);
```

**Note on Choice column comparisons:** Dataverse Power Fx supports two
syntaxes:

```powerapps
// Option A — type-safe (preferred)
Status = 'Status (MX Requests)'.Submitted

// Option B — string compare (works for read; less type-safe)
Status.Value = "Submitted"
```

This guide uses Option A consistently for filter/comparison and Option B
only when constructing Patch values that need string literals.

## App.OnError

```powerapps
Notify(
    "Something went wrong: " & FirstError.Message,
    NotificationType.Error,
    5000
);
Trace(
    "MXConnect Error",
    TraceSeverity.Error,
    {
        screen: App.ActiveScreen.Name,
        message: FirstError.Message,
        source:  FirstError.Source
    }
);
```

# 4. Layout shell

Reusable component shared by every screen. Build once and copy as a
Component (`Insert → Custom → New component`).

## Component: `cmpAppShell`

### Header (top, 56px tall)

```
┌──────────┬─────────────────────────┬──────────┐
│  Logo    │  varPageTitle           │ Avatar  │
└──────────┴─────────────────────────┴──────────┘
```

| Control               | Property | Formula                                                        |
| --------------------- | -------- | -------------------------------------------------------------- |
| `lbl_PageTitle`       | `Text`   | `varPageTitle`                                                 |
| `lbl_PageTitle`       | `Color`  | `RGBA(255,255,255,1)`                                          |
| `lbl_PageTitle`       | `FontWeight` | `FontWeight.Bold`                                          |
| `lbl_UserInitials`    | `Text`   | `Left(varCurrentUser.FullName,1) & Mid(LastN(Split(varCurrentUser.FullName, " "), 1).Result, 1, 1)` |
| `cnt_Avatar`          | `Fill`   | `RGBA(255,106,0,1)`                                            |
| `cnt_Avatar`          | `OnSelect` | `Navigate(scr_Profile, ScreenTransition.Fade)`               |

### Side nav (left, 64px wide on phone — icon only)

A vertical Gallery rendering navigation tiles, filtered by `varCan`.

```powerapps
// gal_SideNav.Items
Filter(
    [
        { id: "home",       icon: Icon.Home,       label: "Home",            screen: scr_Home,           show: true },
        { id: "schedule",   icon: Icon.Calendar,   label: "Schedule MX",     screen: scr_ScheduleMX,     show: varCan.SubmitMXSchedule || varCan.ApproveMXSchedule },
        { id: "status",     icon: Icon.Health,     label: "Status",          screen: scr_Status,         show: varCan.SubmitAircraftStatus || varCan.StatusDashboard },
        { id: "bulletins",  icon: Icon.Megaphone,  label: "Bulletins",       screen: scr_Bulletins,      show: true },
        { id: "asks",       icon: Icon.Message,    label: "Ask Leadership",  screen: scr_AskLeadership,  show: true },
        { id: "safety",     icon: Icon.Shield,     label: "Safety",          screen: scr_Safety,         show: varCan.SubmitSafetyReport },
        { id: "tracking",   icon: Icon.Trending,   label: "MX Tracking",     screen: scr_MXTracking,     show: true },
        { id: "myteam",     icon: Icon.People,     label: "My Team",         screen: scr_MyTeam,         show: !(varRole in ["Pilot","PR","Payroll"]) },
        { id: "docs",       icon: Icon.DockLeft,   label: "Docs",            screen: scr_Docs,           show: true },
        { id: "approvals",  icon: Icon.Check,      label: "Approvals",       screen: scr_ApprovalInbox,  show: CountRows(colMyApprovals) > 0 }
    ],
    show
)
```

| Control       | Property    | Formula                                                                |
| ------------- | ----------- | ---------------------------------------------------------------------- |
| `cnt_Tile`    | `Fill`      | `If(App.ActiveScreen = ThisItem.screen, RGBA(255,106,0,0.15), RGBA(0,0,0,0))` |
| `cnt_Tile`    | `OnSelect`  | `Navigate(ThisItem.screen, ScreenTransition.Fade)`                     |
| `ico_Tile`    | `Icon`      | `ThisItem.icon`                                                        |
| `ico_Tile`    | `Color`     | `If(App.ActiveScreen = ThisItem.screen, RGBA(255,106,0,1), RGBA(180,180,180,1))` |

# 5. Home screen — `scr_Home`

```
┌────────────────────────────────────────────────┐
│  Header (cmpAppShell)                           │
├────┬───────────────────────────────────────────┤
│Side│  Bulletin feed (scrollable)                │
│ Nav│  ┌──────────┐ ┌──────────┐                │
│    │  │ Pending  │ │ On Call  │                │
│    │  │ Approvals│ │ Now      │                │
│    │  └──────────┘ └──────────┘                │
│    │  Status Dashboard (RMM/Director/QA/ADOM)  │
└────┴───────────────────────────────────────────┘
```

## scr_Home.OnVisible

```powerapps
Set(varPageTitle, "Home — " & varRole);
Concurrent(
    Refresh('Operational Bulletin'),
    Refresh('MX Request')
);
ClearCollect(colBulletins,
    Filter('Operational Bulletin',
        Status = 'Status (Operational Bulletins)'.Active
    )
);
ClearCollect(colMyApprovals,
    Filter('MX Request',
        Status = 'Status (MX Requests)'.Submitted,
        IsBlank(Decision),
        Or(
            (varRole = "RMM" && 'Aircraft Tail'.RMM.Email = varCurrentUser.Email),
            (varRole in ["Director","DOM"] && Routing = 'Routing (MX Requests)'.Director),
            (varRole in ["QA","ADOM"])
        )
    )
)
```

## Bulletin feed gallery — `gal_BulletinFeed`

```powerapps
// gal_BulletinFeed.Items
SortByColumns(
    AddColumns(colBulletins,
        "LevelOrder",
        Switch(Level.Value,
            "Alert",    1,
            "Advisory", 2,
            "Info",     3,
            4
        )
    ),
    "LevelOrder", Ascending,
    "'Posted At'", Descending
)
```

| Control          | Property | Formula                                                                                          |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `cnt_BullTile`   | `Fill`   | `Switch(ThisItem.Level.Value, "Alert", RGBA(220,38,38,0.15), "Advisory", RGBA(217,119,6,0.15), "Info", RGBA(59,130,246,0.15))` |
| `cnt_BullTile`   | `BorderColor` | `Switch(ThisItem.Level.Value, "Alert", RGBA(220,38,38,1), "Advisory", RGBA(217,119,6,1), "Info", RGBA(59,130,246,1))` |
| `lbl_BullLevel`  | `Text`   | `Upper(ThisItem.Level.Value)`                                                                    |
| `lbl_BullSubject`| `Text`   | `ThisItem.Subject`                                                                               |
| `lbl_BullPosted` | `Text`   | `"Posted by " & ThisItem.'Posted By'.'Full Name' & " · " & DateDiff(ThisItem.'Posted At', Now(), Hours) & "h ago"` |
| `cnt_BullTile`   | `OnSelect` | `Set(varSelectedBulletin, ThisItem); Navigate(scr_BulletinDetail, ScreenTransition.Fade)`      |

## KPI tiles row

| Tile             | KPI label             | Number formula                                                  | OnSelect                                          |
| ---------------- | --------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Pending Approvals | "Pending Approvals"  | `CountRows(colMyApprovals)`                                     | `Navigate(scr_ApprovalInbox, ScreenTransition.Fade)` |
| On Call Now       | "On Call Now"        | `CountRows(Filter('Personnel - Maintenance', 'On Shift' = true && Region = varUserPersonnel.Region))` | `Navigate(scr_MyTeam, ScreenTransition.Fade)` |

Hide the second tile if `varRole in ["Pilot","PR","Payroll"]`.

## Status Dashboard tile

```powerapps
// lbl_AOGCount.Text
CountRows(Filter(Aircraft, Status = 'Status (Aircraft)'.AOG))

// lbl_RedStatusCount.Text
CountRows(Filter('Personnel - Maintenance', Status = 'Status (Personnel)'.'Red Status'))

// cnt_StatusTile.Visible
varCan.StatusDashboard
```

# 6. Approval Inbox — `scr_ApprovalInbox` (canonical scope!)

In-app mirror of the Teams Adaptive Card. Same flow back-end picks up
the Patch. **This screen is canonical Phase 1** — build it.

## scr_ApprovalInbox.OnVisible

```powerapps
Set(varPageTitle, "Approvals");
Refresh('MX Request');
ClearCollect(colMyApprovals,
    Filter('MX Request',
        Status in [
            'Status (MX Requests)'.Submitted,
            'Status (MX Requests)'.Escalated,
            'Status (MX Requests)'.Returned
        ],
        IsBlank(Decision),
        Or(
            (varRole = "RMM" && 'Aircraft Tail'.RMM.Email = varCurrentUser.Email),
            (varRole in ["Director","DOM"] && Routing = 'Routing (MX Requests)'.Director),
            (varRole in ["QA","ADOM"])
        )
    )
)
```

## Action buttons — Approve / Deny / Escalate / Return

The flow trigger condition is `cr_status eq 1 AND cr_decision eq null`,
so once we Patch a Decision the flow knows to skip the Adaptive Card.
The flow handles audit + DM + Outlook downstream.

### `btn_Approve.OnSelect`

```powerapps
Patch('MX Request', ThisItem,
    {
        Status:             'Status (MX Requests)'.Approved,
        Decision:           'Decision (MX Requests)'.Approved,
        Approver:           varCurrentUser.FullName,
        'Decided At':       Now(),
        'Decision Comment': txt_Comment.Text
    }
);
Notify("Approved.", NotificationType.Success);
Reset(txt_Comment);
ClearCollect(colMyApprovals,
    Filter(colMyApprovals, 'Request Number' <> ThisItem.'Request Number')
)
```

### `btn_Deny.OnSelect`

```powerapps
If(IsBlank(txt_Comment.Text),
    Notify("A written reason is required to deny.", NotificationType.Warning),
    Patch('MX Request', ThisItem,
        {
            Status:             'Status (MX Requests)'.Denied,
            Decision:           'Decision (MX Requests)'.Denied,
            'Decision Reason':  txt_Comment.Text,
            Approver:           varCurrentUser.FullName,
            'Decided At':       Now(),
            'Decision Comment': txt_Comment.Text
        }
    );
    Notify("Denied with reason.", NotificationType.Success);
    Reset(txt_Comment);
    ClearCollect(colMyApprovals,
        Filter(colMyApprovals, 'Request Number' <> ThisItem.'Request Number')
    )
)
```

### `btn_Escalate.OnSelect`

```powerapps
// Two-step Patch: first set Decision=Escalated + Routing=Director (audit
// trail), then clear Decision and reset Status so the flow re-triggers
// as a Director-routed request.
Patch('MX Request', ThisItem,
    {
        Status:             'Status (MX Requests)'.Escalated,
        Decision:           'Decision (MX Requests)'.Escalated,
        Routing:            'Routing (MX Requests)'.Director,
        'Decision Comment': txt_Comment.Text
    }
);
Patch('MX Request', ThisItem,
    {
        Status:   'Status (MX Requests)'.Submitted,
        Decision: Blank()
    }
);
Notify("Escalated to Director.", NotificationType.Success);
Reset(txt_Comment);
ClearCollect(colMyApprovals,
    Filter(colMyApprovals, 'Request Number' <> ThisItem.'Request Number')
)
```

### `btn_Return.OnSelect`

```powerapps
If(IsBlank(txt_Comment.Text),
    Notify("Type the question for the submitter first.", NotificationType.Warning),
    Patch('MX Request', ThisItem,
        {
            Status:              'Status (MX Requests)'.Returned,
            Decision:            'Decision (MX Requests)'.Returned,
            'More Info Request': txt_Comment.Text,
            Approver:            varCurrentUser.FullName,
            'Decided At':        Now(),
            'Decision Comment':  txt_Comment.Text
        }
    );
    Notify("Returned to submitter for more info.", NotificationType.Success);
    Reset(txt_Comment);
    ClearCollect(colMyApprovals,
        Filter(colMyApprovals, 'Request Number' <> ThisItem.'Request Number')
    )
)
```

# 7. Module 1 — Status (`scr_Status`)

> ⚠️ **Extension scope.** Status submission writes to extension tables
> (`cr_aircraft_status_log`, `cr_personnel_status_log`). Skip for
> canonical Phase 1.

Two tabs: Aircraft and Personnel.

## Aircraft tab

```powerapps
// dd_AircraftPicker.Items
SortByColumns(Aircraft, "Tail", Ascending)

// dd_AircraftPicker.OnChange
Set(varSelectedAircraft, Self.Selected)
```

Status submit pattern:

```powerapps
// btn_StatusInService.OnSelect
If(IsBlank(varSelectedAircraft),
    Notify("Pick an aircraft first.", NotificationType.Warning),

    // 1. Update Aircraft master
    Patch(Aircraft, varSelectedAircraft,
        {
            Status:               'Status (Aircraft)'.'In Service',
            'Status Reason':      "",
            'Status Updated At':  Now(),
            'Status Updated By':  varCurrentUser
        }
    );

    // 2. Append to log
    With({ correlationId: GUID() },
        Patch('Aircraft Status Log', Defaults('Aircraft Status Log'),
            {
                'Aircraft Tail':     varSelectedAircraft,
                'Previous Status':   varSelectedAircraft.Status,
                'New Status':        'Status (Aircraft)'.'In Service',
                'Status Reason':     "",
                'Changed At':        Now(),
                'Changed By':        varCurrentUser,
                'Audit Correlation': correlationId
            }
        )
    );

    Notify(varSelectedAircraft.Tail & " marked In Service.", NotificationType.Success);
    Refresh(Aircraft)
)
```

For the AOG variant, prompt for a reason via a small modal Container
(`cnt_AOGReasonModal`) with `txt_AOGReason` + Confirm/Cancel.

## Personnel tab

Same pattern, Patching `'Personnel - Maintenance'` and writing to
`'Personnel Status Log'` with `'Action Type'` =
`'Action Type (Personnel Status Log)'.status_change`.

## Recent log gallery

```powerapps
// gal_RecentStatus.Items
SortByColumns(
    FirstN('Aircraft Status Log', 25),
    "'Changed At'", Descending
)
```

Visibility: `varCan.StatusDashboard`.

# 8. Module 2 — Schedule MX (`scr_ScheduleMX`) — canonical submit form

Three sub-screens: list, submission form, confirmation.

> The submission form is **canonical Phase 1** — build it. The list +
> Gantt views are extension scope.

## scr_ScheduleMX.OnVisible

```powerapps
Set(varPageTitle, "Schedule MX");
Refresh('MX Request');
ClearCollect(colSchedule,
    Filter('MX Request',
        'Request Type' = 'Request Type (MX Requests)'.'Phase Inspection',
        Or(
            varCan.FullVisibility,
            'Requested By' = varCurrentUser.FullName,
            (varRole = "RMM" && 'Aircraft Tail'.Region = varUserPersonnel.Region)
        )
    )
)
```

## Countdown timer

```powerapps
// lbl_Countdown.Text
With({ hrs: DateDiff(Now(), ThisItem.'Window Start', Hours) },
    Switch(true,
        hrs < 0,    "OVERDUE",
        hrs < 24,   Text(hrs) & "h until RTS",
        hrs < 168,  Text(RoundDown(hrs/24, 0)) & "d " & Text(Mod(hrs, 24)) & "h",
        Text(RoundDown(hrs/24, 0)) & " days"
    )
)

// lbl_Countdown.Color
With({ hrs: DateDiff(Now(), ThisItem.'Window Start', Hours) },
    Switch(true,
        hrs < 24,   RGBA(220,38,38,1),
        hrs < 168,  RGBA(217,119,6,1),
        RGBA(22,163,74,1)
    )
)
```

## Submission form — `scr_NewMXRequest` (CANONICAL)

Universal form for the **6 canonical Request Types**:

```powerapps
// dd_RequestType.Items
[
    "Phase Inspection",
    "Repair",
    "Overhaul",
    "Time Off",
    "Open Shift",
    "AOG"
]
```

(Extension scope adds: `Aircraft Movement (PR)`, `Pilot Training`,
`Ask Leadership`, `Other`.)

### Conditional field visibility

```powerapps
// dd_AircraftPicker.Visible
dd_RequestType.Selected.Value <> "Time Off"   // Time Off has no aircraft

// dp_WindowStart.Visible / dp_WindowEnd.Visible
true   // all 6 canonical types have a window
```

### btn_Submit.OnSelect (canonical)

```powerapps
// 1. Validate
If(
    IsBlank(dd_RequestType.Selected.Value),
        Notify("Pick a request type.", NotificationType.Warning),
    dd_AircraftPicker.Visible && IsBlank(dd_AircraftPicker.Selected.Tail),
        Notify("Pick an aircraft.", NotificationType.Warning),
    DateTimeValue(Text(dp_WindowEnd.SelectedDate) & " " & dd_EndTime.Selected.Value) <=
    DateTimeValue(Text(dp_WindowStart.SelectedDate) & " " & dd_StartTime.Selected.Value),
        Notify("End must be after start.", NotificationType.Warning),

    // 2. Patch — Dataverse lookups take the full record reference
    Set(varSubmitting, true);
    Set(varNewRequest,
        Patch('MX Request', Defaults('MX Request'),
            {
                'Aircraft Tail': If(dd_AircraftPicker.Visible, dd_AircraftPicker.Selected, Blank()),
                'Aircraft Type': If(dd_AircraftPicker.Visible, dd_AircraftPicker.Selected.Type.Title, ""),
                'Request Type':  Switch(dd_RequestType.Selected.Value,
                    "Phase Inspection", 'Request Type (MX Requests)'.'Phase Inspection',
                    "Repair",           'Request Type (MX Requests)'.Repair,
                    "Overhaul",         'Request Type (MX Requests)'.Overhaul,
                    "Time Off",         'Request Type (MX Requests)'.'Time Off',
                    "Open Shift",       'Request Type (MX Requests)'.'Open Shift',
                    "AOG",              'Request Type (MX Requests)'.AOG
                ),
                'Window Start':  DateTimeValue(Text(dp_WindowStart.SelectedDate) & " " & dd_StartTime.Selected.Value),
                'Window End':    DateTimeValue(Text(dp_WindowEnd.SelectedDate) & " " & dd_EndTime.Selected.Value),
                Base:            dd_Base.Selected,
                Reason:          txt_Reason.Text,
                Priority:        Switch(dd_Priority.Selected.Value,
                    "Normal", 'Priority (MX Requests)'.Normal,
                    "High",   'Priority (MX Requests)'.High,
                    "AOG",    'Priority (MX Requests)'.AOG
                ),
                Status:          'Status (MX Requests)'.Submitted,
                Routing:         If(
                    dd_Priority.Selected.Value = "AOG",
                    'Routing (MX Requests)'.Director,
                    'Routing (MX Requests)'.RMM
                ),
                'Requested By':       varCurrentUser.FullName,
                'Audit Correlation':  GUID()
            }
        )
    );
    Set(varSubmitting, false);

    // 3. Branch on success
    If(IsBlank(varNewRequest.'Request Number'),
        Notify("Submission failed. Try again.", NotificationType.Error),
        Navigate(scr_RequestConfirm, ScreenTransition.Cover)
    )
)
```

Note: `Request Number` is auto-generated by Dataverse Autonumber on
insert — no manual `Last(...).ID + 1` math needed.

## Confirmation screen

```powerapps
// lbl_ConfirmHeader.Text
"Submitted!"

// lbl_ConfirmRequestNumber.Text
"Request " & varNewRequest.'Request Number'

// lbl_ConfirmBody.Text
"Sent to " & varNewRequest.Routing.Value & " for review. " &
"You'll get a Microsoft Teams DM when the approver decides."

// btn_New.OnSelect
Reset(dd_RequestType); Reset(dd_AircraftPicker); Reset(dp_WindowStart); Reset(dp_WindowEnd);
Reset(txt_Reason); Reset(dd_Priority);
Navigate(scr_NewMXRequest, ScreenTransition.UnCover)

// btn_Home.OnSelect
Navigate(scr_Home, ScreenTransition.Fade)
```

---

> **Sections 10–14 below are extension scope** (Safety, Docs, My Team,
> MX Tracking, Bulletins). Ask Leadership (section 9) is canonical Phase 1.

# 9. Module 3 — Ask Leadership

## Screens

- **`scr_AskLeadership`** — hub: submit new question + list of existing questions
- **`scr_AskDetail`** — thread view for a selected question

## Variables

| Variable            | Type          | Set in                        |
| ------------------- | ------------- | ----------------------------- |
| `varSelectedRequest`| MX Request record | `gal_Asks.OnSelect`, `btn_SubmitQuestion.OnSelect` |
| `colAsks`           | Collection    | `scr_AskLeadership.OnVisible` |

---

## `scr_AskLeadership`

### Controls

| Name                | Type           | Notes                                  |
| ------------------- | -------------- | -------------------------------------- |
| `cmpAppShell`       | Component      | Header + side nav                      |
| `lbl_AskTitle`      | Label          | Text: `"Ask Leadership"`               |
| `txt_Question`      | Text input     | Multiline. HintText: `"Type your question/request..."` |
| `btn_SubmitQuestion`| Button         | Text: `"Submit Question"`              |
| `gal_Asks`          | Gallery        | Vertical, blank template. Items: `colAsks` |
| `lbl_AskItem`       | Label (template) | Inside `gal_Asks`                    |

### `scr_AskLeadership.OnVisible`

```powerapps
Set(varPageTitle, "Ask Leadership");
Refresh('MX Requests');
Refresh('MX Request Comments');
ClearCollect(colAsks,
    Filter('MX Requests',
        'Request Type' = 'Request Type (MX Requests)'.'Ask Leadership',
        varRole in ["RMM","DOM","Director","QA","ADOM"] ||
        'Requested By' = varCurrentUser.FullName
    )
)
```

> Phase 2: replace inline `varRole` check with `varCan.FullVisibility || varCan.AskLeadershipDashboard`.

### `btn_SubmitQuestion.OnSelect`

```powerapps
If(
    IsBlank(txt_Question.Text),
    Notify("Please enter a question.", NotificationType.Warning),
    Set(varSubmitting, true);
    Set(varNewRequest,
        Patch('MX Requests', Defaults('MX Requests'),
            {
                'Request Type': 'Request Type (MX Requests)'.'Ask Leadership',
                Reason:         txt_Question.Text,
                'Status (cr_status)': 'Status (MX Requests)'.Submitted,
                Routing:        'Routing (MX Requests)'.Director,
                'Requested By': varCurrentUser.FullName
            }
        )
    );
    Set(varSubmitting, false);
    If(IsBlank(varNewRequest.cr_request_number),
        Notify("Submission failed. Try again.", NotificationType.Error),
        Set(varSelectedRequest, varNewRequest);
        Navigate(scr_AskDetail, ScreenTransition.Cover)
    )
)
```

### `gal_Asks.OnSelect`

```powerapps
Set(varSelectedRequest, ThisItem);
Navigate(scr_AskDetail, ScreenTransition.Fade)
```

### `lbl_AskItem.Text` (gallery template)

```powerapps
ThisItem.Reason & Char(10) & Text(ThisItem.'Created On', DateTimeFormat.ShortDate)
```

---

## `scr_AskDetail`

### Controls

| Name                  | Type           | Notes                                         |
| --------------------- | -------------- | --------------------------------------------- |
| `cmpAppShell`         | Component      | Header + side nav                             |
| `lbl_AskDetailQuestion` | Label        | Shows the question text                       |
| `gal_Comment`         | Gallery        | Flexible height. Thread of comments           |
| `lbl_commentBody`     | Label (template) | Inside `gal_Comment`                        |
| `txt_NewComment`      | Text input     | Multiline. Below gallery                      |
| `btn_PostComment`     | Button         | Text: `"Post"`                                |

### `lbl_AskDetailQuestion.Text`

```powerapps
varSelectedRequest.Reason
```

### `gal_Comment.Items`

```powerapps
Sort(
    Filter('MX Request Comments',
        cr_mx_request_id.cr_mx_requestid = varSelectedRequest.cr_mx_requestid
    ),
    'Posted at',
    SortOrder.Ascending
)
```

### `lbl_commentBody.Text` (gallery template)

```powerapps
ThisItem.'Posted by' & " — " & Text(ThisItem.'Posted at', DateTimeFormat.ShortDateTime) & Char(10) & ThisItem.Body
```

### `btn_PostComment.OnSelect`

```powerapps
If(
    IsBlank(txt_NewComment.Text),
    Notify("Enter a comment.", NotificationType.Warning),
    Patch('MX Request Comments', Defaults('MX Request Comments'),
        {
            'MX Request':  varSelectedRequest,
            Body:          txt_NewComment.Text,
            'Posted at':   Now(),
            'Posted by':   varCurrentUser.FullName
        }
    );
    Reset(txt_NewComment);
    Refresh('MX Request Comments')
)

# 10. MX Scheduler (`scr_Scheduler`)

Read-only Gantt view of MX Requests plotted on a date timeline. Director/RMM-facing. Uses Phase 1 `MX Requests` data — no Phase 2 dependency. Built entirely with standard Power Apps controls (no PCF, no external libraries).

## Architecture

Three layers stacked on the same coordinate space:

```
240px shell sidebar | 160px row labels | 966px bar area (14 days × ~69px/day)
─────────────────────────────────────────────────────────────────────────────
Y=56  [Aircraft header cell] [Mon 4][Tue 5][Wed 6]...[Sun 17]   ← gal_DateHeader
Y=96  [AW109SP             ] [████Approved████][              ]  ← gal_GanttGrid row 0
Y=144 [AS365               ] [      ][██Submitted██][          ]  ← row 1
Y=192 [H145                ] [      ][      ][██AOG████████    ]  ← row 2
```

- **`gal_DateHeader`** — horizontal gallery, one cell per day
- **`gal_RowLabels`** — vertical gallery, aircraft types down the left
- **`gal_GanttGrid`** — outer vertical gallery (one row per aircraft); inner `gal_DayCells` horizontal gallery (one cell per day), colored by task status

## Variables (set in OnVisible)

| Variable | Value | Notes |
|---|---|---|
| `varGanttDays` | `14` | Days in current view |
| `varGanttStart` | `DateAdd(Today(), -1, TimeUnit.Days)` | Yesterday |
| `varGanttEnd` | `DateAdd(varGanttStart, varGanttDays - 1, TimeUnit.Days)` | +13 days |
| `varRowH` | `48` | Row height in px |
| `varBarAreaW` | `966` | `App.Width - 400` |
| `varPixelsPerDay` | `varBarAreaW / varGanttDays` | ~69px for 14-day |

## `scr_Scheduler.OnVisible`

```powerapps
Set(varPageTitle, "MX Scheduler");
Set(varGanttDays, 14);
Set(varGanttStart, DateAdd(Today(), -1, TimeUnit.Days));
Set(varGanttEnd, DateAdd(varGanttStart, varGanttDays - 1, TimeUnit.Days));
Set(varRowH, 48);
Set(varBarAreaW, 966);
Set(varPixelsPerDay, varBarAreaW / varGanttDays);

// Date header cells
ClearCollect(colGanttDates,
    ForAll(Sequence(varGanttDays),
        {
            DayNum:   Value,
            DayDate:  DateAdd(varGanttStart, Value - 1, TimeUnit.Days),
            DayLabel: Text(DateAdd(varGanttStart, Value - 1, TimeUnit.Days), "ddd d"),
            IsToday:  DateAdd(varGanttStart, Value - 1, TimeUnit.Days) = Today()
        }
    )
);

// Tasks clamped to view window
ClearCollect(colGanttTasks,
    AddColumns(
        Filter('MX Requests',
            cr_window_start <= varGanttEnd,
            cr_window_end   >= varGanttStart
        ),
        "RowKey",       If(IsBlank(cr_aircraft_type), "Unassigned", cr_aircraft_type),
        "TaskLabel",    Text('Request Type (MX Requests)'),
        "ClampedStart", If(cr_window_start < varGanttStart, varGanttStart, cr_window_start),
        "ClampedEnd",   If(cr_window_end   > varGanttEnd,   varGanttEnd,   cr_window_end),
        "StatusPriority", Switch(Text('Status (cr_status)'),
            "Denied",    4,
            "Submitted", 2,
            "Approved",  1,
            0
        ),
        "BarColor", Switch(Text('Status (cr_status)'),
            "Approved",  RGBA(22,163,74,1),
            "Submitted", RGBA(217,119,6,1),
            "Denied",    RGBA(220,38,38,1),
            RGBA(156,163,175,1)
        )
    )
);

// Distinct rows with stable index for Y positioning
Clear(colGanttRows);
ForAll(
    Sort(Distinct(colGanttTasks, RowKey), Value, SortOrder.Ascending),
    Collect(colGanttRows, {RowKey: Value, RowIndex: CountRows(colGanttRows)})
)
```

## Navigation buttons

### `btn_SchPrev.OnSelect`
```powerapps
Set(varGanttStart, DateAdd(varGanttStart, -varGanttDays, TimeUnit.Days));
Set(varGanttEnd, DateAdd(varGanttStart, varGanttDays - 1, TimeUnit.Days));
ClearCollect(colGanttDates,
    ForAll(Sequence(varGanttDays),
        {
            DayNum:   Value,
            DayDate:  DateAdd(varGanttStart, Value - 1, TimeUnit.Days),
            DayLabel: Text(DateAdd(varGanttStart, Value - 1, TimeUnit.Days), "ddd d"),
            IsToday:  DateAdd(varGanttStart, Value - 1, TimeUnit.Days) = Today()
        }
    )
);
ClearCollect(colGanttTasks,
    AddColumns(
        Filter('MX Requests',
            cr_window_start <= varGanttEnd,
            cr_window_end   >= varGanttStart
        ),
        "RowKey",       If(IsBlank(cr_aircraft_type), "Unassigned", cr_aircraft_type),
        "TaskLabel",    Text('Request Type (MX Requests)'),
        "ClampedStart", If(cr_window_start < varGanttStart, varGanttStart, cr_window_start),
        "ClampedEnd",   If(cr_window_end   > varGanttEnd,   varGanttEnd,   cr_window_end),
        "StatusPriority", Switch(Text('Status (cr_status)'), "Denied", 4, "Submitted", 2, "Approved", 1, 0),
        "BarColor", Switch(Text('Status (cr_status)'), "Approved", RGBA(22,163,74,1), "Submitted", RGBA(217,119,6,1), "Denied", RGBA(220,38,38,1), RGBA(156,163,175,1))
    )
);
Clear(colGanttRows);
ForAll(Sort(Distinct(colGanttTasks, RowKey), Value, SortOrder.Ascending),
    Collect(colGanttRows, {RowKey: Value, RowIndex: CountRows(colGanttRows)}))
```

`btn_SchNext.OnSelect` — same formula, change `-varGanttDays` to `+varGanttDays`.

### `btn_Sch7Day.OnSelect` / `btn_Sch14Day.OnSelect`
```powerapps
// 7 day
Set(varGanttDays, 7);
Set(varPixelsPerDay, varBarAreaW / 7);
// then re-run the same ClearCollect(colGanttDates, ...) block from OnVisible
```

## Control layout

### Header bar
| Control | X / Y / W / H | Property | Value |
|---|---|---|---|
| `rect_SchHeader` | 240 / 0 / 1126 / 56 | Fill | `RGBA(30,30,30,1)` |
| `lbl_SchTitle` | 256 / 14 / 300 / 28 | Text | `"MX Scheduler"` |
| `lbl_SchTitle` | — | Color / FontWeight / Size | White / Bold / 18 |
| `btn_SchPrev` | 860 / 12 / 40 / 32 | Text | `"‹"` |
| `lbl_SchDateRange` | 906 / 12 / 200 / 32 | Text | `Text(varGanttStart,"mmm d") & " – " & Text(varGanttEnd,"mmm d")` |
| `btn_SchNext` | 1112 / 12 / 40 / 32 | Text | `"›"` |
| `btn_Sch7Day` | 1160 / 12 / 70 / 32 | Text | `"7 Day"` |
| `btn_Sch14Day` | 1238 / 12 / 80 / 32 | Text | `"14 Day"` |

### Row label header cell
| Control | X / Y / W / H | Property | Value |
|---|---|---|---|
| `rect_RowLabelHdr` | 240 / 56 / 160 / 40 | Fill | `RGBA(245,245,247,1)` |
| `rect_RowLabelHdr` | — | BorderColor / BorderThickness | `RGBA(220,220,220,1)` / 1 |
| `lbl_RowLabelHdr` | 248 / 68 / 144 / 16 | Text | `"Aircraft"` |
| `lbl_RowLabelHdr` | — | Size / FontWeight | 11 / Bold |

### `gal_DateHeader`
| Property | Value |
|---|---|
| Items | `colGanttDates` |
| X / Y / W / H | 400 / 56 / 966 / 40 |
| TemplateSize | `varPixelsPerDay` |
| Direction | Horizontal |
| ShowScrollbar | false |

Template controls:

| Control | Property | Value |
|---|---|---|
| `rect_DateCell` | W / H | `Parent.TemplateWidth` / 40 |
| `rect_DateCell` | Fill | `If(ThisItem.IsToday, RGBA(255,106,0,0.08), RGBA(245,245,247,1))` |
| `rect_DateCell` | BorderColor / BorderThickness | `RGBA(220,220,220,1)` / 1 |
| `lbl_DateLabel` | Text | `ThisItem.DayLabel` |
| `lbl_DateLabel` | Color | `If(ThisItem.IsToday, RGBA(255,106,0,1), RGBA(80,80,80,1))` |
| `lbl_DateLabel` | FontWeight | `If(ThisItem.IsToday, FontWeight.Bold, FontWeight.Normal)` |
| `lbl_DateLabel` | Size | 11 |
| `lbl_DateLabel` | Align | `Align.Center` |

### `gal_RowLabels`
| Property | Value |
|---|---|
| Items | `colGanttRows` |
| X / Y / W / H | 240 / 96 / 160 / `CountRows(colGanttRows) * varRowH` |
| TemplateSize | `varRowH` |
| ShowScrollbar | false |

Template controls:

| Control | Property | Value |
|---|---|---|
| `rect_RowLabelCell` | W / H | 160 / `varRowH` |
| `rect_RowLabelCell` | Fill | `If(Mod(ThisItem.RowIndex, 2) = 0, RGBA(255,255,255,1), RGBA(248,248,250,1))` |
| `rect_RowLabelCell` | BorderColor | `RGBA(235,235,235,1)` |
| `lbl_RowName` | Text | `ThisItem.RowKey` |
| `lbl_RowName` | X / Y | 8 / 14 |
| `lbl_RowName` | Size / FontWeight | 12 / Bold |
| `lbl_RowName` | Color | `RGBA(40,40,40,1)` |

### `gal_GanttGrid` (outer — one row per aircraft)
| Property | Value |
|---|---|
| Items | `colGanttRows` |
| X / Y / W / H | 400 / 96 / 966 / `CountRows(colGanttRows) * varRowH` |
| TemplateSize | `varRowH` |
| ShowScrollbar | false |

Template controls:

**`lbl_HiddenRowKey`** — captures outer `ThisItem.RowKey` for the inner gallery to reference:

| Property | Value |
|---|---|
| Text | `ThisItem.RowKey` |
| Visible | false |
| Width / Height | 1 / 1 |

**`gal_DayCells`** — inner horizontal gallery (one cell per day):

| Property | Value |
|---|---|
| Items | `colGanttDates` |
| X / Y / W / H | 0 / 0 / 966 / `varRowH` |
| TemplateSize | `varPixelsPerDay` |
| Direction | Horizontal |
| ShowScrollbar | false |

Inner template controls:

| Control | Property | Value |
|---|---|---|
| `rect_DayCell` | W / H | `Parent.TemplateWidth` / `varRowH` |
| `rect_DayCell` | Fill | See cell color formula below |
| `rect_DayCell` | BorderColor | `RGBA(235,235,235,1)` |
| `rect_DayCell` | BorderThickness | 1 |
| `lbl_CellTask` | Text | See cell label formula below |
| `lbl_CellTask` | X / Y / W / H | 2 / 16 / `Parent.TemplateWidth - 4` / 14 |
| `lbl_CellTask` | Size | 9 |
| `lbl_CellTask` | Color | White |
| `lbl_CellTask` | Overflow | `Overflow.Hidden` |

**`rect_DayCell.Fill` formula:**
```powerapps
With(
    {
        task: First(
            SortByColumns(
                Filter(colGanttTasks,
                    RowKey = lbl_HiddenRowKey.Text,
                    ClampedStart <= ThisItem.DayDate,
                    ThisItem.DayDate < ClampedEnd
                ),
                "StatusPriority", SortOrder.Descending
            )
        )
    },
    If(
        IsBlank(task),
        If(ThisItem.IsToday, RGBA(255,106,0,0.05), RGBA(255,255,255,1)),
        task.BarColor
    )
)
```

**`lbl_CellTask.Text` formula:**
```powerapps
With(
    {
        task: First(
            Filter(colGanttTasks,
                RowKey = lbl_HiddenRowKey.Text,
                ClampedStart = ThisItem.DayDate
            )
        )
    },
    If(IsBlank(task), "", task.TaskLabel)
)
```

### Today line
| Control | X / Y / W / H | Property | Value |
|---|---|---|---|
| `rect_TodayLine` | `400 + DateDiff(varGanttStart, Today(), TimeUnit.Days) * varPixelsPerDay` / 56 / 2 / `40 + CountRows(colGanttRows) * varRowH` | Fill | `RGBA(255,106,0,0.7)` |
| `rect_TodayLine` | — | Visible | `Today() >= varGanttStart && Today() <= varGanttEnd` |

### Legend
| Control | X / Y / W / H | Property | Value |
|---|---|---|---|
| `rect_LegApproved` | 400 / `96 + CountRows(colGanttRows) * varRowH + 12` / 12 / 12 | Fill | `RGBA(22,163,74,1)` |
| `lbl_LegApproved` | 416 / same Y / 80 / 14 | Text | `"Approved"` |
| `rect_LegSubmitted` | 504 / same Y / 12 / 12 | Fill | `RGBA(217,119,6,1)` |
| `lbl_LegSubmitted` | 520 / same Y / 80 / 14 | Text | `"Submitted"` |
| `rect_LegDenied` | 608 / same Y / 12 / 12 | Fill | `RGBA(220,38,38,1)` |
| `lbl_LegDenied` | 624 / same Y / 60 / 14 | Text | `"Denied"` |

---

# 11. Module 4 — Safety Report (`scr_Safety`) — extension

## btn_SubmitSafety.OnSelect

```powerapps
If(
    IsBlank(txt_SafetySubject.Text),
        Notify("Subject required.", NotificationType.Warning),
    IsBlank(txt_SafetyBody.Text),
        Notify("Describe the concern.", NotificationType.Warning),

    Patch('Safety Report', Defaults('Safety Report'),
        {
            Subject:                 txt_SafetySubject.Text,
            Body:                    txt_SafetyBody.Text,
            'Submitted At':          Now(),
            // Flow rewrites Reporter to mx-anonymous service account when Anonymous=Yes (server-side).
            // Client always writes the actual user.
            Reporter:                varCurrentUser,
            'Reporter Display Name': If(tgl_Anonymous.Value, "", varCurrentUser.FullName),
            Anonymous:               tgl_Anonymous.Value,
            Region:                  varUserPersonnel.Region,
            Base:                    varUserPersonnel.'Primary Base',
            Aircraft:                If(IsBlank(dd_SafetyAircraft.Selected.Tail), Blank(), dd_SafetyAircraft.Selected),
            Severity:                Switch(dd_Severity.Selected.Value,
                "Low",      'Severity (Safety Reports)'.Low,
                "Medium",   'Severity (Safety Reports)'.Medium,
                "High",     'Severity (Safety Reports)'.High,
                "Critical", 'Severity (Safety Reports)'.Critical
            ),
            Status:                  'Status (Safety Reports)'.Submitted,
            'Audit Correlation':     GUID()
        }
    );
    Notify("Safety report submitted. " &
        If(tgl_Anonymous.Value,
            "You won't receive replies (anonymous mode).",
            "You'll get a Teams DM when it's acknowledged."
        ),
        NotificationType.Success
    );
    Reset(txt_SafetySubject); Reset(txt_SafetyBody); Reset(dd_Severity); Reset(tgl_Anonymous);
    Navigate(scr_Home, ScreenTransition.Fade)
)
```

## Safety Reports Dashboard

```powerapps
// gal_SafetyReports.Items
SortByColumns(
    Filter('Safety Report',
        Status <> 'Status (Safety Reports)'.Closed,
        Or(
            varCan.FullVisibility,
            Region = varUserPersonnel.Region
        )
    ),
    "Severity", Descending,
    "'Submitted At'", Descending
)
```

# 11. Module 5 — Docs (`scr_Docs`) — extension

The Docs module backs to a SharePoint Document Library or to a Dataverse
File column on a `cr_doc` table (Phase 2).

## btn_OpenDocs.OnSelect

```powerapps
Launch(
    "https://ihc.sharepoint.com/sites/MXConnect/MX%20Connect%20Docs/Forms/AllItems.aspx",
    {},
    LaunchTarget.New
)
```

## Bulletin Archive sub-section

```powerapps
// gal_BulletinArchive.Items
SortByColumns(
    Filter('Operational Bulletin', Status = 'Status (Operational Bulletins)'.Resolved),
    "'Resolved At'", Descending
)
```

# 12. Module 6 — My Team (`scr_MyTeam`) — extension

## On Call view

```powerapps
// gal_OnCall.Items
SortByColumns(
    Filter('Personnel - Maintenance',
        'On Shift' = true,
        Or(
            varCan.FullVisibility,
            Region = varUserPersonnel.Region
        )
    ),
    "'Last Name'", Ascending
)
```

```powerapps
// btn_Call.OnSelect
Launch("tel:" & ThisItem.Phone)

// btn_Text.OnSelect
Launch("sms:" & ThisItem.Phone)
```

## On Shift toggle

```powerapps
// tgl_OnShift.Default
varUserPersonnel.'On Shift'

// tgl_OnShift.OnChange
Patch('Personnel - Maintenance', varUserPersonnel,
    { 'On Shift': Self.Value }
);
With({ correlationId: GUID() },
    Patch('Personnel Status Log', Defaults('Personnel Status Log'),
        {
            Personnel:           varUserPersonnel,
            'Action Type':       'Action Type (Personnel Status Log)'.shift_toggle,
            'On Shift':          Self.Value,
            'Status Reason':     If(Self.Value, "Started shift", "Ended shift"),
            'Changed At':        Now(),
            'Changed By':        varCurrentUser,
            'Audit Correlation': correlationId
        }
    )
);
Set(varUserPersonnel, LookUp('Personnel - Maintenance', Email = varCurrentUser.Email))
```

# 13. Module 7 — MX Tracking (`scr_MXTracking`) — extension

## Save filter button

```powerapps
// btn_SaveFilters.OnSelect
With({
    existing: LookUp('User Filter Preference',
        'User Email' = varCurrentUser.Email && View = 'View (User Filter Preferences)'.'MX Tracking'
    )
},
    If(IsBlank(existing),
        Patch('User Filter Preference', Defaults('User Filter Preference'),
            {
                'User Email':   varCurrentUser.Email,
                View:           'View (User Filter Preferences)'.'MX Tracking',
                'Filter JSON':  JSON({
                    aircraft: dd_FilterAircraft.Selected.Tail,
                    base:     dd_FilterBase.Selected.Title,
                    region:   dd_FilterRegion.Selected.Name
                }),
                'Last Updated': Now()
            }
        ),
        Patch('User Filter Preference', existing,
            {
                'Filter JSON':  JSON({
                    aircraft: dd_FilterAircraft.Selected.Tail,
                    base:     dd_FilterBase.Selected.Title,
                    region:   dd_FilterRegion.Selected.Name
                }),
                'Last Updated': Now()
            }
        )
    )
);
Notify("Filters saved.", NotificationType.Success)
```

## Upcoming Inspections bar chart

```powerapps
// gal_UpcomingInspections.Items
SortByColumns(
    Filter('MX Request',
        'Request Type' = 'Request Type (MX Requests)'.'Phase Inspection',
        Status = 'Status (MX Requests)'.Approved,
        'Window Start' >= Now()
    ),
    "'Window Start'", Ascending
)

// rect_BarFill.Fill
With({ days: DateDiff(Now(), ThisItem.'Window Start', Days) },
    Switch(true,
        days < 1,    RGBA(220,38,38,1),
        days <= 7,   RGBA(217,119,6,1),
        RGBA(22,163,74,1)
    )
)
```

# 14. Module 8 — Bulletins (`scr_Bulletins`) — extension

## scr_Bulletins.OnVisible

```powerapps
Set(varPageTitle, "Bulletins");
Refresh('Operational Bulletin');
ClearCollect(colActiveBulletins,
    SortByColumns(
        Filter('Operational Bulletin', Status = 'Status (Operational Bulletins)'.Active),
        Switch(Level.Value, "Alert", 1, "Advisory", 2, "Info", 3, 4),
        'Posted At', Descending
    )
);
ClearCollect(colArchivedBulletins,
    SortByColumns(
        Filter('Operational Bulletin',
            Status in [
                'Status (Operational Bulletins)'.Resolved,
                'Status (Operational Bulletins)'.Archived
            ]
        ),
        'Resolved At', Descending
    )
)
```

## Post bulletin

```powerapps
// btn_PostBulletin.OnSelect
If(IsBlank(txt_BulSubject.Text) || IsBlank(txt_BulBody.Text),
    Notify("Subject and body are required.", NotificationType.Warning),
    Patch('Operational Bulletin', Defaults('Operational Bulletin'),
        {
            Subject:    txt_BulSubject.Text,
            Body:       txt_BulBody.Text,
            Level:      Switch(dd_BulLevel.Selected.Value,
                "Alert",    'Level (Operational Bulletins)'.Alert,
                "Advisory", 'Level (Operational Bulletins)'.Advisory,
                "Info",     'Level (Operational Bulletins)'.Info
            ),
            'Posted At':          Now(),
            'Posted By':          varCurrentUser,
            Audience:             [{ Value: dd_BulAudience.Selected.Value }],
            Region:               If(IsBlank(dd_BulRegion.Selected.Name), Blank(), dd_BulRegion.Selected),
            Status:               'Status (Operational Bulletins)'.Active,
            'Audit Correlation':  GUID()
        }
    );
    Notify("Bulletin posted.", NotificationType.Success);
    Reset(txt_BulSubject); Reset(txt_BulBody); Reset(dd_BulLevel); Reset(dd_BulAudience); Reset(dd_BulRegion);
    Refresh('Operational Bulletin')
)
```

## Resolve bulletin

```powerapps
// btn_ResolveBulletin.OnSelect
If(IsBlank(txt_ResolutionNotes.Text),
    Notify("Resolution notes are required to resolve.", NotificationType.Warning),
    Patch('Operational Bulletin', varSelectedBulletin,
        {
            Status:             'Status (Operational Bulletins)'.Resolved,
            'Resolved At':      Now(),
            'Resolved By':      varCurrentUser,
            'Resolution Notes': txt_ResolutionNotes.Text
        }
    );
    Notify("Bulletin resolved.", NotificationType.Success);
    Refresh('Operational Bulletin');
    Navigate(scr_Bulletins, ScreenTransition.UnCover)
)
```

## Permanent delete (Director only)

```powerapps
// btn_PermDelete.Visible
varCan.DeleteBulletin && varSelectedBulletin.Status = 'Status (Operational Bulletins)'.Resolved

// btn_PermDelete.OnSelect
If(varConfirmDelete,
    Remove('Operational Bulletin', varSelectedBulletin);
    Notify("Bulletin permanently deleted.", NotificationType.Success);
    Refresh('Operational Bulletin');
    Navigate(scr_Bulletins, ScreenTransition.UnCover),
    Set(varConfirmDelete, true);
    Notify("Tap again to confirm permanent deletion.", NotificationType.Warning)
)
```

# 15. Common Power Fx patterns (Dataverse)

## Patch with Choice / Lookup / Person fields

```powerapps
// Choice — type-safe
{ Status: 'Status (MX Requests)'.Approved }

// Lookup (single) — Dataverse takes the full record reference
{ 'Aircraft Tail': varAircraft }

// Lookup (multi) — array of records
{ 'Coverage Bases': [base1, base2, base3] }

// Multi-select Choice — array of choice options
{ Audience: [
    'Audience (Operational Bulletins)'.RMM,
    'Audience (Operational Bulletins)'.Director
]}

// Person/Group — User() works directly
{ 'Requested By': varCurrentUser }

// Person/Group (multi) — array of users
{ Approvers: [varCurrentUser, otherUser] }

// Date — Dataverse stores UTC; display layer converts to local
{ 'Submitted At': Now() }
```

> **Canonical Phase 1 nuance:** the spec keeps `cr_requested_by` and
> `cr_approver` as **Text** (not Lookup → systemuser) because the CSV
> stores them as name strings. So the Patch shape is:
> `{ 'Requested By': varCurrentUser.FullName }` — pass the string, not
> the user record. Phase 2 normalizes to Lookup; canvas can switch to
> `{ 'Requested By': varCurrentUser }` then.

## Audit Correlation pattern

Every primary table write generates a GUID. Audit rows reference that
GUID. Lets reporting reconstruct full transition history.

```powerapps
With({ correlationId: GUID() },
    Patch('MX Request', Defaults('MX Request'), {
        // ... all fields ...
        'Audit Correlation': correlationId
    });
    // Flow writes audit rows server-side. If the canvas needs to write
    // its own audit row (e.g. for client-only events like shift_toggle),
    // include 'Audit Correlation': correlationId on that Patch too.
)
```

## Permission gating

```powerapps
btn_PostBulletin.Visible: varCan.PostBulletin
gal_StatusDashboard.Visible: varCan.StatusDashboard
```

UI gating prevents accidental writes. Dataverse role privileges (set in
`connections.md`) prevent malicious ones server-side. The canvas app
trusts but verifies — never relies on UI-only gating for sensitive ops.

# 16. Performance + scale tips

- **Limit collection size.** ClearCollect on a 100K-row table will hang
  the app. Filter server-side first:
  ```
  ClearCollect(colMyApprovals, Filter('MX Request', /* anything */))   // BAD
  ClearCollect(colMyApprovals, Filter('MX Request', Status = 'Status (MX Requests)'.Submitted))  // GOOD
  ```
- **Delegation warnings (blue squiggles).** Dataverse delegates almost
  everything Power Fx supports — far more than SharePoint. If you do
  see a warning, check for:
  - In-memory functions (`AddColumns`, `GroupBy`) before a Filter
  - String functions on Choice columns (use the type-safe `'Status (Table)'.Value` syntax)
  - Lookup-walked filters (e.g. `'Aircraft Tail'.RMM.Email`) — these
    delegate but slow queries; consider denormalizing
- **Cache reference data.** Regions / Bases / Aircraft Types are small
  and never change in a session. Load once in `App.OnStart`.
- **Concurrent loads:**
  ```powerapps
  Concurrent(
      ClearCollect(colBulletins, ...),
      ClearCollect(colMyApprovals, ...),
      Set(varUserPersonnel, ...)
  )
  ```
- **App load target:** under 3 seconds on cellular. Profile with
  `Trace()`.

# 17. Deploy + share

## Save / publish

```
File → Save (Ctrl+S)
File → Publish version
```

## Sharing — Dataverse roles, not direct app shares

The cleanest pattern is to share the app with `MXC App Users` Entra
group, while the **per-user data access** is governed by the Dataverse
security roles (see `connections.md` — 5 canonical or 9 for full
extension scope). Members of the Entra group must also have at least
one MXC role assigned in the environment for the app to work.

```
File → Share → Add: Entra group `MXC App Users` → Permission: User
Power Platform admin center → Environment → Settings → Security roles →
   For each MXC role → Manage members → Add Entra group
```

## Versioning

```
File → Versions → Restore (any prior version)
File → Versions → Live → tag a stable version
```

## Mobile vs Teams

- **Power Apps mobile** — install once, live tile per app
- **Teams** — Add the app via Teams admin center, pin in left rail
- **Browser** — share the play URL

## Telemetry

Power Apps native usage telemetry (View → Analytics in Studio).
Watch for:
- Average load time
- Active users / day
- Most-visited screens
- Error rate by screen

---

## Phase 1 acceptance criteria

### Canonical Phase 1

The canvas app is canonical-complete when, in Prod:

- [ ] AMT can submit any of 6 canonical Request Types from a phone in
      under 30 seconds
- [ ] RMM/Director/QA can Approve / Deny / Escalate / Return from the
      in-app inbox AND from the Teams Adaptive Card
- [ ] Returned requests round-trip correctly (submitter sees the
      question, edits, resubmits → flow re-fires)
- [ ] App load time < 3s on cellular
- [ ] Three weeks of clean run history in the Logan pilot

### Extension scope (matrix-extension)

- [ ] All 8 modules accessible from the side nav with role-based visibility
- [ ] Bulletin feed loads on every home screen sorted by severity
- [ ] On-Call screen shows the right region by default with tappable
      call/text buttons
- [ ] Status submissions hit the master table + status log atomically
- [ ] Anonymous safety reports never leak the reporter back to the UI
- [ ] Saved filter preferences restore correctly after navigation
- [ ] Payroll users get redirected to the Power BI / Dataverse view
      (no app login)
