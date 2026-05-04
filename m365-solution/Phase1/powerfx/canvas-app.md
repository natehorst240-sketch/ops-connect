# Canvas App Build Guide — MX Connect Dashboard

A single Power Apps canvas app that hosts the full Phase 1 workflow:
role-based home, all 8 application modules, in-app approval inbox, plus
the simple MX Request submission form. Phone form factor (Tablet works
too with minor padding tweaks).

This guide is sequential. Build the app in the order below — every
section depends on the previous one's variables and screens.

## Companion docs

- `../roles-capability-matrix.md` — who can do what
- `../application-modules.md` — what each module does
- `../../sharepoint-lists/phase1-blank-templates/README.md` — list schemas
- `../flows/mxr-approval-flow-sharepoint.json` — the approval flow

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

# 1. Create the app

```
Power Apps Studio → + Create → Blank app → Canvas
   Name:    MX Connect
   Format:  Phone
   Save to: MXConnect solution
```

Set the app theme:

```
File → Settings → Theme → Custom
   Primary:    #FF6A00   (IHC orange)
   Secondary:  #18181B   (neutral-900)
   Accent:     #3B82F6   (info blue)
```

# 2. Add data sources

Add all 14 SharePoint lists from
`m365-solution/sharepoint-lists/phase1-blank-templates/` plus the
SharePoint connector itself.

```
View → Data → + Add data → SharePoint → MXConnect site →
   ☑ Regions
   ☑ Bases
   ☑ Aircraft Types
   ☑ Aircraft
   ☑ Personnel — Maintenance
   ☑ Personnel — Crew                    (Phase 2 prep, but read-only here)
   ☑ MX Requests
   ☑ MX Request Comments
   ☑ Audit Log
   ☑ Operational Bulletins
   ☑ Safety Reports
   ☑ Aircraft Status Log
   ☑ Personnel Status Log
   ☑ User Filter Preferences
   ☑ Office 365 Users                    (separate connector — for current-user lookups)
```

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
//   The user's Personnel.Role drives every visibility check.
//   Payroll users don't have a Personnel row → fall through to "Payroll" if their email is in the Payroll Entra group (resolved server-side via flow on first sign-in; for Phase 1 we'll hard-code the list below).
Set(varRole,
    Coalesce(
        varUserPersonnel.Role.Value,
        // Crew / Pilot fallback — check Personnel - Crew
        LookUp('Personnel - Crew', Email = varCurrentUser.Email).Role.Value,
        // Payroll fallback (replace with Entra group membership in Phase 2)
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
        SubmitAskLeadership:    !(varRole in ["Unknown"]),                                     // everyone with a login
        SubmitSafetyReport:     !(varRole in ["Unknown"]),                                     // everyone with a login
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
        RequestMoreInfo:        varRole in ["RMM","DOM","Director","QA","Scheduler","ADOM"],
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

// --- Bulletin feed (cache) ---
ClearCollect(colBulletins,
    Filter(
        'Operational Bulletins',
        Status.Value = "Active"
        && (
            'Audience'.Value = "All" 
            || varRole in 'Audience'.Value
        )
    )
);

// --- Pending approvals for this user (MX Requests routed to them) ---
ClearCollect(colMyApprovals,
    Filter(
        'MX Requests',
        Status.Value = "Submitted",
        Or(
            // RMMs see requests where they're the Aircraft.RMM
            (varRole = "RMM" && 'Aircraft Tail'.Value in Filter(Aircraft, RMM.Email = varCurrentUser.Email).Tail),
            // Director sees Routing=Director
            (varRole in ["Director","DOM"] && Routing.Value = "Director"),
            // Scheduler sees Routing=Scheduler
            (varRole = "Scheduler" && Routing.Value = "Scheduler"),
            // QA + ADOM see all (org-wide visibility)
            (varRole in ["QA","ADOM"])
        )
    )
);

// --- Default landing screen ---
Set(varHomeScreen, scr_Home);
Navigate(scr_Home, ScreenTransition.None);
```

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

Every screen reuses the same header and side nav. Build it once in
`scr_Home` and copy as a Component (`Insert → Custom → New component`).

## Component: `cmpAppShell`

Two slots: a header at the top and a tab nav on the left edge.

### Header (top, 56px tall)

```
cmpAppShell.Height: parent.Height (filled by container)
cmpAppShell.Width:  parent.Width

Layout: HorizontalContainer at top, height 56
   ┌──────────┬────────────────────────────────┬──────────┐
   │  Logo    │  Page title (bound to varPageTitle)  │ Avatar │
   └──────────┴────────────────────────────────┴──────────┘
```

Header formulas:

| Control                | Property | Formula                                                        |
| ---------------------- | -------- | -------------------------------------------------------------- |
| `lbl_PageTitle`        | `Text`   | `varPageTitle`                                                 |
| `lbl_PageTitle`        | `Color`  | `RGBA(255,255,255,1)`                                          |
| `lbl_PageTitle`        | `Size`   | `18`                                                           |
| `lbl_PageTitle`        | `FontWeight` | `FontWeight.Bold`                                          |
| `lbl_UserInitials`     | `Text`   | `Left(varCurrentUser.FullName,1) & Mid(LastN(Split(varCurrentUser.FullName, " "), 1).Result, 1, 1)` |
| `cnt_Avatar`           | `Fill`   | `RGBA(255,106,0,1)` (IHC orange)                               |
| `cnt_Avatar`           | `OnSelect` | `Navigate(scr_Profile, ScreenTransition.Fade)`              |

### Side nav (left, 64px wide on phone — icon only)

A vertical Gallery rendering navigation tiles. The Items list is filtered
by `varCan` so users see only modules they can access.

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

Tile template:

| Control       | Property    | Formula                                                                |
| ------------- | ----------- | ---------------------------------------------------------------------- |
| `cnt_Tile`    | `Fill`      | `If(App.ActiveScreen = ThisItem.screen, RGBA(255,106,0,0.15), RGBA(0,0,0,0))` |
| `cnt_Tile`    | `OnSelect`  | `Navigate(ThisItem.screen, ScreenTransition.Fade)`                     |
| `ico_Tile`    | `Icon`      | `ThisItem.icon`                                                        |
| `ico_Tile`    | `Color`     | `If(App.ActiveScreen = ThisItem.screen, RGBA(255,106,0,1), RGBA(180,180,180,1))` |

Add a badge on the Approvals tile:

| Control            | Property | Formula                                          |
| ------------------ | -------- | ------------------------------------------------ |
| `lbl_ApprovalBadge`| `Text`   | `CountRows(colMyApprovals)`                      |
| `lbl_ApprovalBadge`| `Visible`| `ThisItem.id = "approvals" && CountRows(colMyApprovals) > 0` |

# 5. Home screen — `scr_Home`

Role-based dashboard. Layout (top to bottom):

```
┌────────────────────────────────────────────────┐
│  Header (cmpAppShell)                           │
├────┬───────────────────────────────────────────┤
│Side│  Bulletin feed (scrollable, max 3 visible) │
│ Nav│                                            │
│    │  ┌──────────────┐  ┌──────────────┐       │
│    │  │ Pending      │  │ My Team      │       │
│    │  │ Approvals    │  │ On Call Now  │       │
│    │  │ (CountRows)  │  │              │       │
│    │  └──────────────┘  └──────────────┘       │
│    │                                            │
│    │  ┌──────────────────────────────────────┐ │
│    │  │ Module quick-links (filtered by      │ │
│    │  │ varCan; same shape as side nav)      │ │
│    │  └──────────────────────────────────────┘ │
│    │                                            │
│    │  ┌──────────────────────────────────────┐ │
│    │  │ Status Dashboard (if varCan.Status...) │ │
│    │  │ — Aircraft AOG count                 │ │
│    │  │ — Personnel Red Status count         │ │
│    │  └──────────────────────────────────────┘ │
└────┴───────────────────────────────────────────┘
```

## scr_Home.OnVisible

```powerapps
Set(varPageTitle, "Home — " & varRole);
Refresh('Operational Bulletins');
Refresh('MX Requests');
ClearCollect(colBulletins,
    Filter('Operational Bulletins',
        Status.Value = "Active"
        && (Audience.Value = "All" || varRole in Audience.Value)
    )
);
ClearCollect(colMyApprovals,
    Filter('MX Requests',
        Status.Value = "Submitted",
        Or(
            (varRole = "RMM" && 'Aircraft Tail'.Value in Filter(Aircraft, RMM.Email = varCurrentUser.Email).Tail),
            (varRole in ["Director","DOM"] && Routing.Value = "Director"),
            (varRole = "Scheduler" && Routing.Value = "Scheduler"),
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

Tile template (inside the gallery):

| Control          | Property | Formula                                                                                          |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `cnt_BullTile`   | `Fill`   | `Switch(ThisItem.Level.Value, "Alert", RGBA(220,38,38,0.15), "Advisory", RGBA(217,119,6,0.15), "Info", RGBA(59,130,246,0.15))` |
| `cnt_BullTile`   | `BorderColor` | `Switch(ThisItem.Level.Value, "Alert", RGBA(220,38,38,1), "Advisory", RGBA(217,119,6,1), "Info", RGBA(59,130,246,1))` |
| `lbl_BullLevel`  | `Text`   | `Upper(ThisItem.Level.Value)`                                                                     |
| `lbl_BullSubject`| `Text`   | `ThisItem.Subject`                                                                                |
| `lbl_BullPosted` | `Text`   | `"Posted by " & ThisItem.'Posted By'.DisplayName & " · " & DateDiff(ThisItem.'Posted At', Now(), Hours) & "h ago"` |
| `cnt_BullTile`   | `OnSelect` | `Set(varSelectedBulletin, ThisItem); Navigate(scr_BulletinDetail, ScreenTransition.Fade)`       |

## KPI tiles row

Two side-by-side tiles. Each is a Container with a number + label.

| Tile             | KPI label             | Number formula                                                  | OnSelect                                          |
| ---------------- | --------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| Pending Approvals | "Pending Approvals"  | `CountRows(colMyApprovals)`                                     | `Navigate(scr_ApprovalInbox, ScreenTransition.Fade)` |
| On Call Now       | "On Call Now"        | `CountRows(Filter('Personnel - Maintenance', 'On Shift' = true && Region.Value = varUserPersonnel.Region.Value))` | `Navigate(scr_MyTeam, ScreenTransition.Fade)` |

Hide the second tile if `varRole in ["Pilot","PR","Payroll"]`.

## Status Dashboard tile (RMM/Director/QA/ADOM only)

```powerapps
// lbl_AOGCount.Text
CountRows(Filter(Aircraft, Status.Value = "AOG"))

// lbl_RedStatusCount.Text
CountRows(Filter('Personnel - Maintenance', Status.Value = "Red Status"))

// cnt_StatusTile.Visible
varCan.StatusDashboard
```

# 6. Approval Inbox — `scr_ApprovalInbox`

Mirrors what comes through Teams Adaptive Cards, but in-app for users
who'd rather work from the dashboard. Uses the same flow back-end.

## scr_ApprovalInbox.OnVisible

```powerapps
Set(varPageTitle, "Approvals");
Refresh('MX Requests');
ClearCollect(colMyApprovals,
    Filter('MX Requests',
        Status.Value in ["Submitted","Escalated","More Info Requested"],
        Or(
            (varRole = "RMM" && 'Aircraft Tail'.Value in Filter(Aircraft, RMM.Email = varCurrentUser.Email).Tail),
            (varRole in ["Director","DOM"] && Routing.Value = "Director"),
            (varRole = "Scheduler" && Routing.Value = "Scheduler"),
            (varRole in ["QA","ADOM"])
        )
    )
)
```

## gal_Approvals.Items

```powerapps
SortByColumns(colMyApprovals, "'Submitted At'", Descending)
```

Each item shows: Request Number · Aircraft Tail · Type · Priority · Time
ago · 4 action buttons.

## Action buttons — Approve / Deny / Request Info / Escalate

These run a child flow that mirrors the Adaptive Card response shape, so
the back-end flow doesn't have to change.

### `btn_Approve.OnSelect`

```powerapps
Patch('MX Requests',
    LookUp('MX Requests', ID = ThisItem.ID),
    {
        Status:   { Value: "Approved" },
        Decision: { Value: "Approve" },
        Approver: varCurrentUser,
        'Decided At': Now(),
        'Decision Comment': txt_Comment.Text
    }
);
// The flow trigger fires on modify; it sees Decision != null and skips the Adaptive Card path.
// (Add a trigger condition on the flow: trigger only if 'Decision' eq null AND 'Status' eq 'Submitted')
Notify("Approved.", NotificationType.Success);
Reset(txt_Comment);
ClearCollect(colMyApprovals,
    Filter(colMyApprovals, ID <> ThisItem.ID)
)
```

### `btn_Deny.OnSelect`

```powerapps
If(IsBlank(txt_Comment.Text),
    Notify("A written reason is required to deny.", NotificationType.Warning),
    Patch('MX Requests',
        LookUp('MX Requests', ID = ThisItem.ID),
        {
            Status:           { Value: "Denied" },
            Decision:         { Value: "Deny" },
            'Decision Reason': txt_Comment.Text,
            Approver:          varCurrentUser,
            'Decided At':      Now(),
            'Decision Comment':txt_Comment.Text
        }
    );
    Notify("Denied with reason.", NotificationType.Success);
    Reset(txt_Comment);
    ClearCollect(colMyApprovals, Filter(colMyApprovals, ID <> ThisItem.ID))
)
```

### `btn_RequestInfo.OnSelect`

```powerapps
If(IsBlank(txt_Comment.Text),
    Notify("Type the question for the submitter first.", NotificationType.Warning),
    Patch('MX Requests',
        LookUp('MX Requests', ID = ThisItem.ID),
        {
            Status:             { Value: "More Info Requested" },
            Decision:           { Value: "Request Info" },
            'More Info Request': txt_Comment.Text,
            'Decision Comment':  txt_Comment.Text
        }
    );
    Notify("Asked for more info.", NotificationType.Success);
    Reset(txt_Comment);
    ClearCollect(colMyApprovals, Filter(colMyApprovals, ID <> ThisItem.ID))
)
```

### `btn_Escalate.OnSelect`

```powerapps
Patch('MX Requests',
    LookUp('MX Requests', ID = ThisItem.ID),
    {
        Status:   { Value: "Escalated" },
        Decision: { Value: "Escalate" },
        Routing:  { Value: "Director" },
        'Decision Comment': txt_Comment.Text
    }
);
// Setting Decision=null after escalation re-enters the flow as a Director-routed request.
Patch('MX Requests',
    LookUp('MX Requests', ID = ThisItem.ID),
    { Decision: Blank() }
);
Notify("Escalated to Director.", NotificationType.Success);
Reset(txt_Comment);
ClearCollect(colMyApprovals, Filter(colMyApprovals, ID <> ThisItem.ID))
```

# 7. Module 1 — Status (`scr_Status`)

Two tabs: Aircraft and Personnel. Both let the user submit a status
change with a one-tap button row, plus see the most-recent log.

## Aircraft tab — `cnt_AircraftTab`

Top: a Dropdown to pick a tail. Below: a row of 4 Status buttons.

```powerapps
// dd_AircraftPicker.Items
SortByColumns(Aircraft, "Tail", Ascending)

// dd_AircraftPicker.OnChange
Set(varSelectedAircraft, Self.Selected)
```

Status submit buttons (each follows the same pattern):

```powerapps
// btn_StatusInService.OnSelect
If(IsBlank(varSelectedAircraft),
    Notify("Pick an aircraft first.", NotificationType.Warning),
    Patch(Aircraft,
        varSelectedAircraft,
        {
            Status: { Value: "In Service" },
            'Status Reason': "",
            'Status Updated At': Now(),
            'Status Updated By': varCurrentUser
        }
    );
    Patch('Aircraft Status Log',
        Defaults('Aircraft Status Log'),
        {
            Title:               "ACS · " & varSelectedAircraft.Tail & " · In Service",
            'Log ID':            "ACS-" & Text(Last('Aircraft Status Log').ID + 1, "[$-en-US]000000"),
            'Aircraft Tail':     { Id: varSelectedAircraft.ID, Value: varSelectedAircraft.Tail },
            'Previous Status':   { Value: varSelectedAircraft.Status.Value },
            'New Status':        { Value: "In Service" },
            'Status Reason':     "",
            'Changed At':        Now(),
            'Changed By':        varCurrentUser,
            'Audit Correlation': GUID()
        }
    );
    Notify(varSelectedAircraft.Tail & " marked In Service.", NotificationType.Success);
    Refresh(Aircraft);
    Refresh('Aircraft Status Log')
)
```

For the AOG variant, prompt for a reason first:

```powerapps
// btn_StatusAOG.OnSelect
If(IsBlank(varSelectedAircraft),
    Notify("Pick an aircraft first.", NotificationType.Warning),
    Set(varShowAOGReasonModal, true)
)
```

Build a small modal Container (`cnt_AOGReasonModal`) with a multi-line
text input + Confirm + Cancel buttons. Confirm runs the same Patch as
above with `Status.Value = "AOG"` and `'Status Reason' = txt_AOGReason.Text`.

## Personnel tab

Same pattern but Patch against `'Personnel - Maintenance'` and write to
`'Personnel Status Log'`. Three button options: Available / Unavailable /
Red Status. The `Action Type` log column is `"status_change"`.

## Recent log gallery

```powerapps
// gal_RecentStatus.Items
SortByColumns(
    FirstN('Aircraft Status Log', 25),
    "'Changed At'", Descending
)
```

Visibility: only RMM/Director/QA/ADOM see this — so tile.Visible =
`varCan.StatusDashboard`.

# 8. Module 2 — Schedule MX (`scr_ScheduleMX`)

Three sub-screens:
1. List view of all MX Schedule requests (filtered by region for AMT/RMM)
2. The submission form (the original 2-screen form, preserved below)
3. Confirmation

## scr_ScheduleMX.OnVisible

```powerapps
Set(varPageTitle, "Schedule MX");
Refresh('MX Requests');
ClearCollect(colSchedule,
    Filter('MX Requests',
        'Request Type'.Value = "MX Schedule",
        Or(
            varCan.FullVisibility,
            Requested By.Email = varCurrentUser.Email,
            (varRole = "RMM" && Region.Value = varUserPersonnel.Region.Value)
        )
    )
)
```

## gal_Schedule.Items

```powerapps
SortByColumns(colSchedule, "'Window Start'", Ascending)
```

Each tile shows: Tail · Type · Window · countdown to start · Status pill.

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

## Status pill

```powerapps
// lbl_StatusPill.Text
Upper(ThisItem.Status.Value)

// lbl_StatusPill.Fill
Switch(ThisItem.Status.Value,
    "Submitted", RGBA(59,130,246,0.2),
    "Approved",  RGBA(22,163,74,0.2),
    "Denied",    RGBA(220,38,38,0.2),
    "More Info Requested", RGBA(168,85,247,0.2),
    "Escalated", RGBA(217,119,6,0.2),
    "Cancelled", RGBA(120,120,120,0.2),
    RGBA(0,0,0,0.1)
)
```

## Submission form — `scr_NewMXRequest`

This is the existing 2-screen form, generalized to support all 6
request types. The form's layout adapts based on the chosen Request
Type.

### dd_RequestType (Dropdown)

```powerapps
// dd_RequestType.Items
Filter(
    [
        { value: "MX Schedule",            show: varCan.SubmitMXSchedule },
        { value: "Aircraft Movement (PR)", show: varCan.SubmitAircraftMovement },
        { value: "Pilot Training",         show: varCan.SubmitPilotTraining },
        { value: "Time Off",               show: varCan.SubmitTimeOff },
        { value: "Ask Leadership",         show: varCan.SubmitAskLeadership },
        { value: "Other",                  show: varCan.SubmitMXSchedule }
    ],
    show
).value

// dd_RequestType.Default
"MX Schedule"
```

### Conditional field visibility

```powerapps
// dd_AircraftPicker.Visible
dd_RequestType.Selected.Value in ["MX Schedule", "Aircraft Movement (PR)", "Pilot Training"]

// dp_WindowStart.Visible / dp_WindowEnd.Visible / dd_StartTime / dd_EndTime
dd_RequestType.Selected.Value in ["MX Schedule", "Aircraft Movement (PR)", "Pilot Training", "Time Off"]

// dd_Audience.Visible (multi-select Choice — Audience field on MX Requests)
dd_RequestType.Selected.Value = "Ask Leadership"

// dd_Priority.Visible
true   // priority always shows

// dd_AircraftPicker.Items
SortByColumns(Aircraft, "Tail", Ascending)
```

### Routing default — derived from Request Type

```powerapps
// dd_Routing.Default (hidden field, readable to user as a badge "Will be reviewed by: …")
Switch(dd_RequestType.Selected.Value,
    "MX Schedule",            "RMM",
    "Time Off",               "RMM",
    "Aircraft Movement (PR)", "Scheduler",
    "Pilot Training",         "Scheduler",
    "Ask Leadership",         "Director",
    "Other",                  "RMM"
)
```

### btn_Submit.OnSelect

```powerapps
// 1. Validate
If(
    IsBlank(dd_RequestType.Selected.Value),
        Notify("Pick a request type.", NotificationType.Warning),
    dd_AircraftPicker.Visible && IsBlank(dd_AircraftPicker.Selected.Tail),
        Notify("Pick an aircraft.", NotificationType.Warning),
    dp_WindowStart.Visible &&
        DateTimeValue(Text(dp_WindowEnd.SelectedDate) & " " & dd_EndTime.Selected.Value) <=
        DateTimeValue(Text(dp_WindowStart.SelectedDate) & " " & dd_StartTime.Selected.Value),
        Notify("End must be after start.", NotificationType.Warning),

    // 2. Patch
    Set(varSubmitting, true);
    Set(varNewRequest,
        Patch('MX Requests',
            Defaults('MX Requests'),
            {
                Title:           dd_RequestType.Selected.Value & " · " & varCurrentUser.FullName,
                'Request Number': "MXR-" & Text(Last('MX Requests').ID + 1, "[$-en-US]00000"),
                'Aircraft Tail': If(dd_AircraftPicker.Visible, { Id: dd_AircraftPicker.Selected.ID, Value: dd_AircraftPicker.Selected.Tail }, Blank()),
                'Aircraft Type': If(dd_AircraftPicker.Visible, dd_AircraftPicker.Selected.Type.Value, ""),
                'Request Type':  { Value: dd_RequestType.Selected.Value },
                'Window Start':  If(dp_WindowStart.Visible,
                    DateTimeValue(Text(dp_WindowStart.SelectedDate) & " " & dd_StartTime.Selected.Value),
                    Blank()
                ),
                'Window End':    If(dp_WindowEnd.Visible,
                    DateTimeValue(Text(dp_WindowEnd.SelectedDate) & " " & dd_EndTime.Selected.Value),
                    Blank()
                ),
                Base:            { Id: dd_Base.Selected.ID, Value: dd_Base.Selected.Title },
                Reason:          txt_Reason.Text,
                Priority:        { Value: dd_Priority.Selected.Value },
                Status:          { Value: "Submitted" },
                Routing:         { Value:
                    Switch(dd_RequestType.Selected.Value,
                        "MX Schedule", "RMM",
                        "Time Off", "RMM",
                        "Aircraft Movement (PR)", "Scheduler",
                        "Pilot Training", "Scheduler",
                        "Ask Leadership", "Director",
                        "Other", "RMM"
                    )
                },
                'Requested By':       varCurrentUser,
                'Audit Correlation':  GUID(),
                'Comments Count':     0,
                Anonymous:            false
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

## Confirmation screen

```powerapps
// lbl_ConfirmHeader.Text
"Submitted!"

// lbl_ConfirmRequestNumber.Text
"Request " & varNewRequest.'Request Number'

// lbl_ConfirmBody.Text
"Sent to " & varNewRequest.Routing.Value & " for review. " &
"You'll get a Microsoft Teams DM when " &
Switch(varNewRequest.'Request Type'.Value,
    "Ask Leadership", "leadership decides.",
    "the approver decides."
)

// btn_New.OnSelect
Reset(dd_RequestType); Reset(dd_AircraftPicker); Reset(dp_WindowStart); Reset(dp_WindowEnd);
Reset(txt_Reason); Reset(dd_Priority);
Navigate(scr_NewMXRequest, ScreenTransition.UnCover)

// btn_Home.OnSelect
Navigate(scr_Home, ScreenTransition.Fade)
```

# 9. Module 3 — Ask Leadership (`scr_AskLeadership`)

List view + thread view. Reuses the MX Requests list, filtered to
`Request Type = "Ask Leadership"`.

## scr_AskLeadership.OnVisible

```powerapps
Set(varPageTitle, "Ask Leadership");
Refresh('MX Requests');
Refresh('MX Request Comments');
ClearCollect(colAsks,
    Filter('MX Requests',
        'Request Type'.Value = "Ask Leadership",
        Or(
            varCan.FullVisibility,
            'Requested By'.Email = varCurrentUser.Email,
            varCan.AskLeadershipDashboard
        )
    )
)
```

## gal_Asks.OnSelect (per item)

```powerapps
Set(varSelectedAsk, ThisItem);
ClearCollect(colAskComments,
    SortByColumns(
        Filter('MX Request Comments', 'MX Request'.Value = ThisItem.'Request Number'),
        "'Posted At'", Ascending
    )
);
Navigate(scr_AskThread, ScreenTransition.Fade)
```

## scr_AskThread layout

```
Header: Subject + status pill + escalate button (if varCan.EscalateToDirector)
Body:   Original Reason text
Thread: gal_AskComments scrolling chronologically
Footer: txt_NewComment + btn_Post
```

## btn_PostComment.OnSelect

```powerapps
If(IsBlank(txt_NewComment.Text),
    Notify("Type a comment.", NotificationType.Warning),
    Patch('MX Request Comments',
        Defaults('MX Request Comments'),
        {
            Title:               "Comment on " & varSelectedAsk.'Request Number',
            'Comment ID':        "CMT-" & Text(Last('MX Request Comments').ID + 1, "[$-en-US]000000"),
            'MX Request':        { Id: varSelectedAsk.ID, Value: varSelectedAsk.'Request Number' },
            'Posted At':         Now(),
            'Posted By':         varCurrentUser,
            Body:                txt_NewComment.Text,
            'Visible To Roles':  { Value: "All approvers" }
        }
    );
    Patch('MX Requests',
        varSelectedAsk,
        { 'Comments Count': varSelectedAsk.'Comments Count' + 1 }
    );
    ClearCollect(colAskComments,
        SortByColumns(
            Filter('MX Request Comments', 'MX Request'.Value = varSelectedAsk.'Request Number'),
            "'Posted At'", Ascending
        )
    );
    Reset(txt_NewComment)
)
```

# 10. Module 4 — Safety Report (`scr_Safety`)

Submission-only screen for everyone except managers (who see the
dashboard). Anonymous toggle gates the Reporter field.

## tgl_Anonymous.OnChange

```powerapps
Set(varAnonymous, Self.Value)
```

## btn_SubmitSafety.OnSelect

```powerapps
If(
    IsBlank(txt_SafetySubject.Text),
        Notify("Subject required.", NotificationType.Warning),
    IsBlank(txt_SafetyBody.Text),
        Notify("Describe the concern.", NotificationType.Warning),

    Patch('Safety Reports',
        Defaults('Safety Reports'),
        {
            Title:                  txt_SafetySubject.Text,
            'Report ID':            "SAF-" & Text(Last('Safety Reports').ID + 1, "[$-en-US]000000"),
            'Submitted At':         Now(),
            // Per anonymous handling in connections.md, the flow swaps in mx-anonymous@ihc.org server-side.
            // Client-side we still write the actual user; the flow rewrites if Anonymous=Yes.
            Reporter:               varCurrentUser,
            'Reporter Display Name': If(varAnonymous, "", varCurrentUser.FullName),
            Anonymous:              varAnonymous,
            Region:                 If(IsBlank(varUserPersonnel.Region.Value), Blank(), { Value: varUserPersonnel.Region.Value }),
            Base:                   If(IsBlank(varUserPersonnel.'Primary Base'.Value), Blank(), { Value: varUserPersonnel.'Primary Base'.Value }),
            'Aircraft Tail':        If(IsBlank(dd_SafetyAircraft.Selected.Tail), Blank(), { Id: dd_SafetyAircraft.Selected.ID, Value: dd_SafetyAircraft.Selected.Tail }),
            Subject:                txt_SafetySubject.Text,
            Body:                   txt_SafetyBody.Text,
            Severity:               { Value: dd_Severity.Selected.Value },
            Status:                 { Value: "Submitted" },
            'Audit Correlation':    GUID()
        }
    );
    Notify("Safety report submitted. " &
        If(varAnonymous,
            "You won't receive replies (anonymous mode).",
            "You'll get a Teams DM when it's acknowledged."
        ),
        NotificationType.Success
    );
    Reset(txt_SafetySubject); Reset(txt_SafetyBody); Reset(dd_Severity); Reset(tgl_Anonymous);
    Navigate(scr_Home, ScreenTransition.Fade)
)
```

## Safety Reports Dashboard (scr_SafetyDashboard)

Visible only to RMM/Director/QA/ADOM. Same gallery pattern as Approval
Inbox, with action buttons: Acknowledge / Investigate / Escalate / Close.

```powerapps
// gal_SafetyReports.Items
SortByColumns(
    Filter('Safety Reports',
        Status.Value <> "Closed",
        Or(
            varCan.FullVisibility,
            Region.Value = varUserPersonnel.Region.Value
        )
    ),
    Severity, Descending,
    'Submitted At', Descending
)
```

# 11. Module 5 — Docs (`scr_Docs`)

The Docs module backs to a SharePoint Document Library, not a list. The
canvas app embeds an iframe-style link out (Power Apps doesn't render
arbitrary HTML, but it can launch a SharePoint URL).

## btn_OpenDocs.OnSelect

```powerapps
Launch(
    "https://ihc.sharepoint.com/sites/MXConnect/MX%20Connect%20Docs/Forms/AllItems.aspx",
    {},
    LaunchTarget.New
)
```

## Bulletin Archive sub-section

Inline gallery of resolved bulletins, filtered + sorted.

```powerapps
// gal_BulletinArchive.Items
SortByColumns(
    Filter('Operational Bulletins', Status.Value = "Resolved"),
    'Resolved At', Descending
)
```

Gallery template shows: Subject · Resolved By · Resolution Notes ·
Resolved At. Tap to open `scr_BulletinDetail` with the resolved bulletin.

# 12. Module 6 — My Team (`scr_MyTeam`)

Most-used screen for RMM/Director/Scheduler/QA. Three views via a
SegmentedControl-style 3-button row at the top: On Call · Tech List ·
Gantt.

## On Call view

```powerapps
// gal_OnCall.Items
SortByColumns(
    Filter('Personnel - Maintenance',
        'On Shift' = true,
        Or(
            varCan.FullVisibility,
            Region.Value = varUserPersonnel.Region.Value
        )
    ),
    'Last Name', Ascending
)
```

Each tile: Name · Role · Base · Phone (tappable) · Text (tappable).

```powerapps
// btn_Call.OnSelect
Launch("tel:" & ThisItem.Phone)

// btn_Text.OnSelect
Launch("sms:" & ThisItem.Phone)
```

## Tech List view

Same data source, but unfiltered by On Shift; alphabetical by name.

## Gantt view (Phase 1 scope: visual only — no edits)

Power Apps doesn't have a native Gantt control. Approximate with a
horizontal Gallery where each row is a person and each column is a day:

```powerapps
// gal_GanttRows.Items
'Personnel - Maintenance'

// Inside each row: gal_GanttCells.Items
ForAll(Sequence(7),
    {
        date: Today() + Value - 1,
        // each cell looks up Schedule Events for this person + this day
        events: Filter('Schedule Events',
            Personnel.Email = ThisItem.Email,
            Date = Today() + Value - 1
        )
    }
)
```

For Phase 1 the user wants a "watchtower" Gantt — read-only. Phase 2
upgrade is the PCF Gantt component.

## On Shift / Off Shift toggle (current user only)

```powerapps
// tgl_OnShift.Default
varUserPersonnel.'On Shift'

// tgl_OnShift.OnChange
Patch('Personnel - Maintenance',
    varUserPersonnel,
    { 'On Shift': Self.Value }
);
Patch('Personnel Status Log',
    Defaults('Personnel Status Log'),
    {
        Title:               "Shift toggle · " & varCurrentUser.FullName,
        'Log ID':            "PSL-" & Text(Last('Personnel Status Log').ID + 1, "[$-en-US]000000"),
        Personnel:           varCurrentUser,
        'Action Type':       { Value: "shift_toggle" },
        'Status Reason':     If(Self.Value, "Started shift", "Ended shift"),
        'Changed At':        Now(),
        'Changed By':        varCurrentUser,
        'Audit Correlation': GUID()
    }
);
Set(varUserPersonnel, LookUp('Personnel - Maintenance', Email = varCurrentUser.Email))
```

# 13. Module 7 — MX Tracking (`scr_MXTracking`)

Calendar view with saved filter prefs. Power Apps' Calendar Control is
the simplest path; for the Gantt + Inspections chart, use Galleries with
custom rendering.

## Filter sidebar

```powerapps
// dd_FilterAircraft.Items
[{Tail: "All", ID: 0}] & SortByColumns(Aircraft, "Tail", Ascending)

// dd_FilterBase.Items
[{Title: "All", ID: 0}] & SortByColumns(Bases, "Title", Ascending)

// dd_FilterRegion.Items
[{Title: "All", ID: 0}] & SortByColumns(Regions, "Title", Ascending)
```

## Save filter button

```powerapps
// btn_SaveFilters.OnSelect
With({
    existing: LookUp('User Filter Preferences',
        'User Email' = varCurrentUser.Email && View.Value = "MX Tracking"
    )
},
    If(IsBlank(existing.ID),
        Patch('User Filter Preferences',
            Defaults('User Filter Preferences'),
            {
                Title:         varCurrentUser.Email & " · MX Tracking",
                'User Email':  varCurrentUser.Email,
                View:          { Value: "MX Tracking" },
                'Filter JSON': JSON({
                    aircraft: dd_FilterAircraft.Selected.Tail,
                    base:     dd_FilterBase.Selected.Title,
                    region:   dd_FilterRegion.Selected.Title
                }),
                'Last Updated': Now()
            }
        ),
        Patch('User Filter Preferences', existing, {
            'Filter JSON': JSON({
                aircraft: dd_FilterAircraft.Selected.Tail,
                base:     dd_FilterBase.Selected.Title,
                region:   dd_FilterRegion.Selected.Title
            }),
            'Last Updated': Now()
        })
    )
);
Notify("Filters saved.", NotificationType.Success)
```

## Restore on screen load

```powerapps
// scr_MXTracking.OnVisible (additional)
With({ pref: LookUp('User Filter Preferences',
    'User Email' = varCurrentUser.Email && View.Value = "MX Tracking"
)},
    If(!IsBlank(pref),
        Set(varSavedFilters, ParseJSON(pref.'Filter JSON'))
    )
)
```

## Upcoming Inspections bar chart

A horizontal Gallery sorted by `Window Start ascending`, with bar fill
color coded:

```powerapps
// gal_UpcomingInspections.Items
SortByColumns(
    Filter('MX Requests',
        'Request Type'.Value = "MX Schedule",
        Status.Value = "Approved",
        'Window Start' >= Now()
    ),
    'Window Start', Ascending
)

// rect_BarFill.Fill (inside each row)
With({ days: DateDiff(Now(), ThisItem.'Window Start', Days) },
    Switch(true,
        days < 1,    RGBA(220,38,38,1),
        days <= 7,   RGBA(217,119,6,1),
        RGBA(22,163,74,1)
    )
)

// rect_BarFill.Width (proportional to days-out, capped at 30 days)
Min(DateDiff(Now(), ThisItem.'Window Start', Days), 30) * 10
```

# 14. Module 8 — Bulletins (`scr_Bulletins`)

Three sections: post (RMM/Director/QA only), feed, archive.

## scr_Bulletins.OnVisible

```powerapps
Set(varPageTitle, "Bulletins");
Refresh('Operational Bulletins');
ClearCollect(colActiveBulletins,
    SortByColumns(
        Filter('Operational Bulletins', Status.Value = "Active"),
        Switch(Level.Value, "Alert", 1, "Advisory", 2, "Info", 3, 4),
        'Posted At', Descending
    )
);
ClearCollect(colArchivedBulletins,
    SortByColumns(
        Filter('Operational Bulletins', Status.Value in ["Resolved","Archived"]),
        'Resolved At', Descending
    )
)
```

## Post bulletin form

Visible only when `varCan.PostBulletin`.

```powerapps
// btn_PostBulletin.OnSelect
If(IsBlank(txt_BulSubject.Text) || IsBlank(txt_BulBody.Text),
    Notify("Subject and body are required.", NotificationType.Warning),
    Patch('Operational Bulletins',
        Defaults('Operational Bulletins'),
        {
            Title:        txt_BulSubject.Text,
            'Bulletin ID': "BUL-" & Text(Last('Operational Bulletins').ID + 1, "[$-en-US]000000"),
            Level:        { Value: dd_BulLevel.Selected.Value },
            'Posted At':  Now(),
            'Posted By':  varCurrentUser,
            Subject:      txt_BulSubject.Text,
            Body:         txt_BulBody.Text,
            Audience:     If(IsBlank(dd_BulAudience.Selected.Value),
                             { Value: "All" },
                             { Value: dd_BulAudience.Selected.Value }
                         ),
            Region:       If(IsBlank(dd_BulRegion.Selected.Title),
                             Blank(),
                             { Id: dd_BulRegion.Selected.ID, Value: dd_BulRegion.Selected.Title }
                         ),
            Status:       { Value: "Active" },
            'Audit Correlation': GUID()
        }
    );
    Notify("Bulletin posted.", NotificationType.Success);
    Reset(txt_BulSubject); Reset(txt_BulBody); Reset(dd_BulLevel); Reset(dd_BulAudience); Reset(dd_BulRegion);
    Refresh('Operational Bulletins')
)
```

## Resolve bulletin

```powerapps
// btn_ResolveBulletin.OnSelect (in scr_BulletinDetail)
If(IsBlank(txt_ResolutionNotes.Text),
    Notify("Resolution notes are required to resolve.", NotificationType.Warning),
    Patch('Operational Bulletins',
        varSelectedBulletin,
        {
            Status:           { Value: "Resolved" },
            'Resolved At':    Now(),
            'Resolved By':    varCurrentUser,
            'Resolution Notes': txt_ResolutionNotes.Text
        }
    );
    Notify("Bulletin resolved.", NotificationType.Success);
    Refresh('Operational Bulletins');
    Navigate(scr_Bulletins, ScreenTransition.UnCover)
)
```

## Permanent delete (Director only)

```powerapps
// btn_PermDelete.Visible
varCan.DeleteBulletin && varSelectedBulletin.Status.Value = "Resolved"

// btn_PermDelete.OnSelect
If(varConfirmDelete,
    Remove('Operational Bulletins', varSelectedBulletin);
    Notify("Bulletin permanently deleted.", NotificationType.Success);
    Refresh('Operational Bulletins');
    Navigate(scr_Bulletins, ScreenTransition.UnCover),
    // first tap arms the confirm
    Set(varConfirmDelete, true);
    Notify("Tap again to confirm permanent deletion.", NotificationType.Warning)
)
```

# 15. Common Power Fx patterns

## Patch with Choice / Lookup / Person fields

```powerapps
// Choice
{ Status: { Value: "Approved" } }

// Lookup (single)
{ 'Aircraft Tail': { Id: varAircraft.ID, Value: varAircraft.Tail } }

// Lookup (multi-select Choice)
{ Audience: [{ Value: "RMM" }, { Value: "Director" }] }

// Person/Group (single)
{ 'Requested By': varCurrentUser }       // varCurrentUser = User()

// Person/Group (multi)
{ Approvers: [varCurrentUser, otherUser] }

// Date — write UTC, display local
{ 'Submitted At': DateAdd(Now(), -TimeZoneOffset(), Minutes) }
```

## Audit Correlation pattern

Every primary list write generates a GUID. Every Audit Log row references
that GUID. Lets reporting reconstruct full transition history.

```powerapps
With({ correlationId: GUID() },
    Patch('MX Requests', Defaults('MX Requests'), {
        // ... all fields ...
        'Audit Correlation': correlationId
    });
    Patch('Audit Log', Defaults('Audit Log'), {
        // ... audit fields ...
        'Audit Correlation': correlationId
    })
)
```

## Sequential row IDs

Power Apps doesn't have auto-numbering for SharePoint custom IDs. Use the
last row's ID + 1, formatted:

```powerapps
"MXR-" & Text(Last('MX Requests').ID + 1, "[$-en-US]00000")
```

For high-concurrency lists (race condition risk), generate the ID in the
flow instead — server-side uniqueness is guaranteed.

## Permission gating — UI level

```powerapps
btn_PostBulletin.Visible: varCan.PostBulletin
gal_StatusDashboard.Visible: varCan.StatusDashboard
```

## Permission gating — data level

UI gating prevents accidental writes; data-level gating prevents
malicious ones. SharePoint item-level permissions (set in
`connections.md`) enforce this server-side. The canvas app trusts but
verifies — never relies on UI-only gating for sensitive ops.

# 16. Performance + scale tips

- **Limit collection size.** ClearCollect on a 10K-row list will hang
  the app. Filter server-side first:
  ```
  ClearCollect(colMyApprovals, Filter('MX Requests', ID > 0))   // BAD
  ClearCollect(colMyApprovals, Filter('MX Requests', Status.Value = "Submitted"))  // GOOD
  ```
- **Delegation warnings (blue squiggles).** If the formula isn't
  delegable, Power Apps fetches only the first 500 (or 2000 with the
  data-row limit setting bumped). Resolve by:
  - Using delegable functions (`Filter`, `LookUp`, `Sort`) over
    in-memory ones (`AddColumns`, `GroupBy`)
  - Pre-filtering on indexed columns
- **Cache reference data.** Regions / Bases / Aircraft Types are small
  and never change in a session. Load once in `App.OnStart` and reuse.
- **Avoid `Refresh()` in `OnVisible` if the screen renders quickly
  enough off the cache.** Refresh only on submit/return navigation.
- **Concurrent loads.** Use `Concurrent()` to fan out independent reads:
  ```powerapps
  Concurrent(
      ClearCollect(colBulletins, ...),
      ClearCollect(colMyApprovals, ...),
      Set(varUserPersonnel, ...)
  )
  ```
- **App load target:** Phase 1 should hit `App.OnStart` complete in
  under 3 seconds on a cellular connection. If you exceed that, profile
  with `Trace()` and move slow steps to lazy-load on first relevant
  screen visit.

# 17. Deploy + share

## Save / publish

```
File → Save (Ctrl+S)
File → Publish version
File → Share → Add: Entra group `MXC App Users` → Permission: User
```

Don't share with individuals; always share via Entra groups so onboard /
offboard happens through IT's existing group lifecycle.

## Versioning

```
File → Versions → Restore (any prior version)
File → Versions → Live → tag a stable version
```

Version every demo / pilot / pre-prod / prod milestone. Restore is the
escape hatch when a bad change ships.

## Mobile vs Teams

The same canvas app works in three places:
- **Power Apps mobile** — install once, live tile per app
- **Teams** — Add the app via Teams admin center, pin in left rail
- **Browser** — share the play URL

For Phase 1, mobile is the primary surface. Teams embedding can be a
Phase 2 polish item.

## Telemetry

Power Apps has native usage telemetry (View → Analytics in Power Apps
Studio). Watch in week 1 for:
- Average load time
- Active users / day
- Most-visited screens
- Error rate by screen

If the load time creeps over 5s, profile with `Trace()` and move
preloads off `App.OnStart` to lazy-load on first relevant screen visit.

---

## Phase 1 acceptance criteria for the canvas app

The app is done when, in Prod:

- [ ] All 8 modules accessible from the side nav with role-based visibility
- [ ] AMT can submit any of 6 MX Request types in under 30 seconds
- [ ] RMM/Director/Scheduler/QA can approve / deny / request info /
      escalate from the in-app inbox AND from the Teams Adaptive Card
- [ ] Bulletin feed loads on every home screen sorted by severity
- [ ] On-Call screen shows the right region by default with tappable
      call/text buttons
- [ ] Status submissions hit Aircraft + Aircraft Status Log atomically
- [ ] Anonymous safety reports never leak the reporter back to the UI
- [ ] Saved filter preferences restore correctly after navigation
- [ ] Payroll users get redirected to the SharePoint filtered view (no
      app login)
- [ ] App load time < 3s on cellular
- [ ] Three weeks of clean run history in the Logan pilot
