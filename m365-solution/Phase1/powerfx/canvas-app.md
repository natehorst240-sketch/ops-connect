# Canvas App Build Guide — MX Connect Dashboard (Dataverse)

A single Power Apps canvas app that hosts the full Phase 1 workflow:
role-based home, all 8 application modules, in-app approval inbox, plus
the universal MX Request submission form. Phone form factor (Tablet works
with minor padding tweaks).

**Backing data layer: Dataverse.** The app binds to the 15 Dataverse
tables in `../tables/`. SharePoint Lists are the deprecated fallback —
not covered here.

This guide is sequential. Build in the order below — every section
depends on the previous's variables and screens.

## Companion docs

- `../roles-capability-matrix.md` — who can do what
- `../application-modules.md` — what each module does
- `../tables/README.md` — Dataverse table index + build order
- `../flows/mxr-approval-flow-v2.json` — the approval flow
- `../connections.md` — connection references + Dataverse roles

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

Add the 15 Dataverse tables from the `MXConnect` solution.

```
View → Data → + Add data → Dataverse → MXConnect environment →
   ☑ MX Request                       (cr_mx_request)
   ☑ MX Audit                         (cr_audit)
   ☑ Operational Bulletin             (cr_operational_bulletin)
   ☑ Safety Report                    (cr_safety_report)
   ☑ Aircraft                         (cr_aircraft)
   ☑ Aircraft Type                    (cr_aircraft_type)
   ☑ Aircraft Status Log              (cr_aircraft_status_log)
   ☑ Personnel — Maintenance          (cr_personnel_maintenance)
   ☑ Personnel — Crew                 (cr_personnel_crew)
   ☑ Personnel Status Log             (cr_personnel_status_log)
   ☑ MX Request Comment               (cr_mx_request_comment)
   ☑ Schedule Event                   (cr_schedule_event)
   ☑ User Filter Preference           (cr_user_filter_pref)
   ☑ Region                           (cr_region)
   ☑ Base                             (cr_base)
```

Power Apps surfaces tables by display name in formulas (e.g.,
`'Personnel — Maintenance'`). The `cr_*` logical names are visible in the
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
        'Personnel — Maintenance',
        Email = varCurrentUser.Email
    )
);

// --- Role detection ---
//   Personnel.Role drives every visibility check.
//   Pilot fallback checks Personnel — Crew.
//   Payroll users have no Personnel row → fall through via Entra group lookup.
Set(varRole,
    Coalesce(
        varUserPersonnel.Role,
        LookUp('Personnel — Crew', Email = varCurrentUser.Email).Role,
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
        'Operational Bulletin',
        Status = 'Status (Operational Bulletins)'.Active
    )
);

// --- Pending approvals for this user ---
ClearCollect(colMyApprovals,
    Filter(
        'MX Request',
        Status = 'Status (MX Requests)'.Submitted,
        IsBlank(Decision),
        Or(
            (varRole = "RMM" && 'Aircraft Tail'.RMM.Email = varCurrentUser.Email),
            (varRole in ["Director","DOM"] && Routing = 'Routing (MX Requests)'.Director),
            (varRole = "Scheduler" && Routing = 'Routing (MX Requests)'.Scheduler),
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
            (varRole = "Scheduler" && Routing = 'Routing (MX Requests)'.Scheduler),
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
| On Call Now       | "On Call Now"        | `CountRows(Filter('Personnel — Maintenance', 'On Shift' = true && Region = varUserPersonnel.Region))` | `Navigate(scr_MyTeam, ScreenTransition.Fade)` |

Hide the second tile if `varRole in ["Pilot","PR","Payroll"]`.

## Status Dashboard tile

```powerapps
// lbl_AOGCount.Text
CountRows(Filter(Aircraft, Status = 'Status (Aircraft)'.AOG))

// lbl_RedStatusCount.Text
CountRows(Filter('Personnel — Maintenance', Status = 'Status (Personnel)'.'Red Status'))

// cnt_StatusTile.Visible
varCan.StatusDashboard
```

# 6. Approval Inbox — `scr_ApprovalInbox`

In-app mirror of the Teams Adaptive Card. Same flow back-end picks up
the Patch.

## scr_ApprovalInbox.OnVisible

```powerapps
Set(varPageTitle, "Approvals");
Refresh('MX Request');
ClearCollect(colMyApprovals,
    Filter('MX Request',
        Status in [
            'Status (MX Requests)'.Submitted,
            'Status (MX Requests)'.Escalated,
            'Status (MX Requests)'.'More Info Requested'
        ],
        IsBlank(Decision),
        Or(
            (varRole = "RMM" && 'Aircraft Tail'.RMM.Email = varCurrentUser.Email),
            (varRole in ["Director","DOM"] && Routing = 'Routing (MX Requests)'.Director),
            (varRole = "Scheduler" && Routing = 'Routing (MX Requests)'.Scheduler),
            (varRole in ["QA","ADOM"])
        )
    )
)
```

## Action buttons — Approve / Deny / Request Info / Escalate

The flow trigger condition is `cr_status eq 1 AND cr_decision eq null`,
so once we Patch a Decision the flow knows to skip the Adaptive Card.
The flow handles audit + DM + Outlook downstream.

### `btn_Approve.OnSelect`

```powerapps
Patch('MX Request', ThisItem,
    {
        Status:             'Status (MX Requests)'.Approved,
        Decision:           'Decision (MX Requests)'.Approve,
        Approver:           varCurrentUser,
        'Decided At':       Now(),
        'Decision Comment': txt_Comment.Text
    }
);
Notify("Approved.", NotificationType.Success);
Reset(txt_Comment);
ClearCollect(colMyApprovals,
    Filter(colMyApprovals, 'MX Request' <> ThisItem.'MX Request')
)
```

### `btn_Deny.OnSelect`

```powerapps
If(IsBlank(txt_Comment.Text),
    Notify("A written reason is required to deny.", NotificationType.Warning),
    Patch('MX Request', ThisItem,
        {
            Status:             'Status (MX Requests)'.Denied,
            Decision:           'Decision (MX Requests)'.Deny,
            'Decision Reason':  txt_Comment.Text,
            Approver:           varCurrentUser,
            'Decided At':       Now(),
            'Decision Comment': txt_Comment.Text
        }
    );
    Notify("Denied with reason.", NotificationType.Success);
    Reset(txt_Comment);
    ClearCollect(colMyApprovals,
        Filter(colMyApprovals, 'MX Request' <> ThisItem.'MX Request')
    )
)
```

### `btn_RequestInfo.OnSelect`

```powerapps
If(IsBlank(txt_Comment.Text),
    Notify("Type the question for the submitter first.", NotificationType.Warning),
    Patch('MX Request', ThisItem,
        {
            Status:              'Status (MX Requests)'.'More Info Requested',
            Decision:            'Decision (MX Requests)'.'Request Info',
            'More Info Request': txt_Comment.Text
        }
    );
    Notify("Asked for more info.", NotificationType.Success);
    Reset(txt_Comment);
    ClearCollect(colMyApprovals,
        Filter(colMyApprovals, 'MX Request' <> ThisItem.'MX Request')
    )
)
```

### `btn_Escalate.OnSelect`

```powerapps
// Two-step Patch: first set Decision=Escalate (audit trail), then clear
// Decision and bump Routing=Director so the flow re-triggers as a
// Director-routed request.
Patch('MX Request', ThisItem,
    {
        Status:             'Status (MX Requests)'.Escalated,
        Decision:           'Decision (MX Requests)'.Escalate,
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
    Filter(colMyApprovals, 'MX Request' <> ThisItem.'MX Request')
)
```

# 7. Module 1 — Status (`scr_Status`)

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

Same pattern, Patching `'Personnel — Maintenance'` and writing to
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

# 8. Module 2 — Schedule MX (`scr_ScheduleMX`)

Three sub-screens: list, submission form, confirmation.

## scr_ScheduleMX.OnVisible

```powerapps
Set(varPageTitle, "Schedule MX");
Refresh('MX Request');
ClearCollect(colSchedule,
    Filter('MX Request',
        'Request Type' = 'Request Type (MX Requests)'.'MX Schedule',
        Or(
            varCan.FullVisibility,
            'Requested By'.Email = varCurrentUser.Email,
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

## Submission form — `scr_NewMXRequest`

Universal form for all 6 request types.

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
```

### Conditional field visibility

```powerapps
// dd_AircraftPicker.Visible
dd_RequestType.Selected.Value in ["MX Schedule", "Aircraft Movement (PR)", "Pilot Training"]

// dp_WindowStart.Visible / dp_WindowEnd.Visible
dd_RequestType.Selected.Value in ["MX Schedule", "Aircraft Movement (PR)", "Pilot Training", "Time Off"]
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

    // 2. Patch — Dataverse lookups take the full record reference
    Set(varSubmitting, true);
    Set(varNewRequest,
        Patch('MX Request', Defaults('MX Request'),
            {
                'Aircraft Tail': If(dd_AircraftPicker.Visible, dd_AircraftPicker.Selected, Blank()),
                'Aircraft Type': If(dd_AircraftPicker.Visible, dd_AircraftPicker.Selected.Type.Title, ""),
                'Request Type':  Switch(dd_RequestType.Selected.Value,
                    "MX Schedule",            'Request Type (MX Requests)'.'MX Schedule',
                    "Aircraft Movement (PR)", 'Request Type (MX Requests)'.'Aircraft Movement (PR)',
                    "Pilot Training",         'Request Type (MX Requests)'.'Pilot Training',
                    "Time Off",               'Request Type (MX Requests)'.'Time Off',
                    "Ask Leadership",         'Request Type (MX Requests)'.'Ask Leadership',
                    "Other",                  'Request Type (MX Requests)'.Other
                ),
                'Window Start':  If(dp_WindowStart.Visible,
                    DateTimeValue(Text(dp_WindowStart.SelectedDate) & " " & dd_StartTime.Selected.Value),
                    Blank()
                ),
                'Window End':    If(dp_WindowEnd.Visible,
                    DateTimeValue(Text(dp_WindowEnd.SelectedDate) & " " & dd_EndTime.Selected.Value),
                    Blank()
                ),
                Base:            dd_Base.Selected,
                Reason:          txt_Reason.Text,
                Priority:        Switch(dd_Priority.Selected.Value,
                    "Normal", 'Priority (MX Requests)'.Normal,
                    "High",   'Priority (MX Requests)'.High,
                    "AOG",    'Priority (MX Requests)'.AOG
                ),
                Status:          'Status (MX Requests)'.Submitted,
                Routing:         Switch(dd_RequestType.Selected.Value,
                    "MX Schedule",            'Routing (MX Requests)'.RMM,
                    "Time Off",               'Routing (MX Requests)'.RMM,
                    "Aircraft Movement (PR)", 'Routing (MX Requests)'.Scheduler,
                    "Pilot Training",         'Routing (MX Requests)'.Scheduler,
                    "Ask Leadership",         'Routing (MX Requests)'.Director,
                    "Other",                  'Routing (MX Requests)'.RMM
                ),
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

```powerapps
// scr_AskLeadership.OnVisible
Set(varPageTitle, "Ask Leadership");
Refresh('MX Request');
Refresh('MX Request Comment');
ClearCollect(colAsks,
    Filter('MX Request',
        'Request Type' = 'Request Type (MX Requests)'.'Ask Leadership',
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
        Filter('MX Request Comment', 'MX Request' = ThisItem),
        "'Posted At'", Ascending
    )
);
Navigate(scr_AskThread, ScreenTransition.Fade)
```

## btn_PostComment.OnSelect

```powerapps
If(IsBlank(txt_NewComment.Text),
    Notify("Type a comment.", NotificationType.Warning),
    Patch('MX Request Comment', Defaults('MX Request Comment'),
        {
            'MX Request':       varSelectedAsk,
            'Posted At':        Now(),
            'Posted By':        varCurrentUser,
            Body:               txt_NewComment.Text,
            'Visible To Roles': 'Visible To Roles (MX Request Comments)'.'All approvers'
        }
    );
    Patch('MX Request', varSelectedAsk,
        { 'Comments Count': varSelectedAsk.'Comments Count' + 1 }
    );
    ClearCollect(colAskComments,
        SortByColumns(
            Filter('MX Request Comment', 'MX Request' = varSelectedAsk),
            "'Posted At'", Ascending
        )
    );
    Reset(txt_NewComment)
)
```

# 10. Module 4 — Safety Report (`scr_Safety`)

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

# 11. Module 5 — Docs (`scr_Docs`)

The Docs module backs to a SharePoint Document Library (Phase 1 still
uses SharePoint for the file blob even though data is in Dataverse) or
to a Dataverse File column on a `cr_doc` table (Phase 2).

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

# 12. Module 6 — My Team (`scr_MyTeam`)

## On Call view

```powerapps
// gal_OnCall.Items
SortByColumns(
    Filter('Personnel — Maintenance',
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
Patch('Personnel — Maintenance', varUserPersonnel,
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
Set(varUserPersonnel, LookUp('Personnel — Maintenance', Email = varCurrentUser.Email))
```

# 13. Module 7 — MX Tracking (`scr_MXTracking`)

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
        'Request Type' = 'Request Type (MX Requests)'.'MX Schedule',
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

# 14. Module 8 — Bulletins (`scr_Bulletins`)

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
group, while the **per-user data access** is governed by the 8
Dataverse security roles (`MXC AMT`, `MXC RMM`, etc.). Members of the
Entra group must also have at least one MXC role assigned in the
environment for the app to work.

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

The app is done when, in Prod:

- [ ] All 8 modules accessible from the side nav with role-based visibility
- [ ] AMT can submit any of 6 MX Request types in under 30 seconds
- [ ] RMM/Director/Scheduler/QA can Approve / Deny / Request Info /
      Escalate from the in-app inbox AND from the Teams Adaptive Card
- [ ] Bulletin feed loads on every home screen sorted by severity
- [ ] On-Call screen shows the right region by default with tappable
      call/text buttons
- [ ] Status submissions hit the master table + status log atomically
- [ ] Anonymous safety reports never leak the reporter back to the UI
- [ ] Saved filter preferences restore correctly after navigation
- [ ] Payroll users get redirected to the Power BI / Dataverse view
      (no app login)
- [ ] App load time < 3s on cellular
- [ ] Three weeks of clean run history in the Logan pilot
