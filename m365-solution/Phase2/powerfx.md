# Phase 2 Power Fx — Scheduler + Fleet Map screens

Two new screens in the `MX Request` canvas app. Both are read-only mirrors
of source-system data; user actions deep-link out to CompleteFlight or
ProteanHub for edits.

---

## Screen — `frmOncallSchedule` *(Phase 1 ready — no API required)*

MX on-call rotation board. 8-day on / 6-day off, Wednesday-to-Wednesday
handoff. The rotation is pure date math — no SharePoint list needed for
Phase 1. Phase 2 just swaps the computed `PersonName` / `PersonPhone`
values for a lookup against a list CompleteFlight writes to.

### How the math works

```
slotIndex = RoundDown( DateDiff(anchorDate, today, Days) / 7, 0 )
personIndex = Mod( slotIndex + regionPhaseOffset, 2 )   // 0 = Person A, 1 = Person B
```

- **Anchor** — Wednesday April 16, 2025 (`Date(2025, 4, 16)`). Every slot is
  `anchor + slotIndex × 7 days`. Slot 53 = Wed Apr 22, 2026 (current demo week).
- **Phase offset** — each region is staggered by 0 or 1 slot so they're not
  all flipping on the same Wednesday.
- **8 days inclusive** — a person is on from their slot's Wednesday through
  the *next* Wednesday (the handoff day counts for both outgoing and incoming).

### OnVisible — initialize

```powerapps
// Anchor date — must match the JS ONCALL_ROSTER anchor
Set(varAnchorDate, Date(2025, 4, 16));

// Slot index for today
Set(varTodaySlotIdx,
    RoundDown(DateDiff(varAnchorDate, Today(), Days) / 7, 0));

// Wednesday that opens the current slot
Set(varCurrentSlotWed,
    DateAdd(varAnchorDate, varTodaySlotIdx * 7, Days));
Set(varCurrentSlotEnd,
    DateAdd(varCurrentSlotWed, 7, Days));

// Navigation offset (< > buttons shift this)
Set(varWeekViewOffset, 0);

// ── Roster: two AMTs per region, phase offset staggers them ───────────────
ClearCollect(colRoster,
    {Region:"109 UT",  Label:"Intermountain",   PhaseOffset:0,
     P0:"Alec Overton",     P0Ph:"801-660-7640", P0Base:"Logan IH-15",
     P1:"Mac Paye",         P1Ph:"916-871-6135", P1Base:"Logan IH-15"},
    {Region:"SLC FW",  Label:"SLC Fixed Wing",  PhaseOffset:1,
     P0:"Jean-Paul Guidry", P0Ph:"801-738-4919", P0Base:"SLC FW",
     P1:"Bryce Low",        P1Ph:"909-744-7878", P1Base:"SLC FW"},
    {Region:"WY/MT",   Label:"Wyoming / Montana", PhaseOffset:0,
     P0:"Nate Anderson",    P0Ph:"360-951-3875", P0Base:"Greybull IH-23",
     P1:"Robert Guty",      P1Ph:"307-272-2616", P1Base:"Greybull IH-23"},
    {Region:"CO/NM",   Label:"Colorado / NM",   PhaseOffset:1,
     P0:"Derek Jorgensen",  P0Ph:"801-707-0318", P0Base:"Glenwood Springs IH-24",
     P1:"John Modrow",      P1Ph:"907-209-9701", P1Base:"Steamboat Springs IH-26"},
    {Region:"ID/NV",   Label:"Idaho / Nevada",  PhaseOffset:0,
     P0:"Rex Schwarz",      P0Ph:"208-969-0844", P0Base:"Burley IH-08",
     P1:"Nicholas Gonzales",P1Ph:"337-519-5722", P1Base:"Elko IH-04"},
    {Region:"UT/AZ",   Label:"Utah / Arizona",  PhaseOffset:1,
     P0:"Jon Hankins",      P0Ph:"702-824-8755", P0Base:"Fort Mohave IH-06",
     P1:"Brian Hyland",     P1Ph:"801-842-9086", P1Base:"Richfield IH-12"},
    {Region:"PAGE",    Label:"Page / Southwest", PhaseOffset:0,
     P0:"Fred Bistline",    P0Ph:"435-233-8177", P0Base:"Page IH-17-18",
     P1:"Denton Siebrecht", P1Ph:"928-640-1840", P1Base:"Page IH-17-18"}
);

// ── Computed: current on-call for every region ────────────────────────────
ClearCollect(
    colCurrentOncall,
    AddColumns(
        colRoster,
        "PersonIndex",   Mod(varTodaySlotIdx + PhaseOffset, 2),
        "PersonName",    If(Mod(varTodaySlotIdx + PhaseOffset, 2) = 0, P0,    P1),
        "PersonPhone",   If(Mod(varTodaySlotIdx + PhaseOffset, 2) = 0, P0Ph,  P1Ph),
        "PersonBase",    If(Mod(varTodaySlotIdx + PhaseOffset, 2) = 0, P0Base,P1Base),
        "SlotStart",     varCurrentSlotWed,
        "SlotEnd",       varCurrentSlotEnd,
        "HandoffDays",   DateDiff(Today(), varCurrentSlotEnd, Days)
    )
)
```

### Navigation buttons

```powerapps
btnPrev.OnSelect  = Set(varWeekViewOffset, varWeekViewOffset - 8)
btnToday.OnSelect = Set(varWeekViewOffset, 0)
btnNext.OnSelect  = Set(varWeekViewOffset, varWeekViewOffset + 8)
```

### Current on-call strip — `galCurrentOncall`

Horizontal wrapping gallery. Shows who is live right now, one card per region.

```powerapps
galCurrentOncall.Items     = colCurrentOncall
galCurrentOncall.Direction = Horizontal
galCurrentOncall.Wrap      = true

// Inside template:
lblCOCName.Text    = ThisItem.PersonName
lblCOCRegion.Text  = ThisItem.Region
lblCOCBase.Text    = ThisItem.PersonBase
lblHandoff.Text    = "Handoff in " & ThisItem.HandoffDays & " days"
btnCall.OnSelect   = Launch("tel:" & ThisItem.PersonPhone)
```

### 8-week schedule grid

**Build the grid as a flat precomputed collection** (7 regions × 8 weeks = 56 rows).
Power Fx's `ForAll` + `Ungroup` pattern keeps the gallery simple and avoids
the nested-gallery parent-reference gotcha.

```powerapps
// Call this on OnVisible AND whenever varWeekViewOffset changes
ClearCollect(
    colScheduleGrid,
    Ungroup(
        ForAll(
            colRoster As reg,
            {
                GridRows: ForAll(
                    Sequence(8, 0) As wk,   // wk.Value = 0..7
                    {
                        Region:     reg.Region,
                        Label:      reg.Label,
                        WeekOffset: wk.Value,
                        SlotIdx:    varTodaySlotIdx + varWeekViewOffset + wk.Value,
                        SlotStart:  Text(
                                        DateAdd(varAnchorDate,
                                            (varTodaySlotIdx + varWeekViewOffset + wk.Value) * 7,
                                            Days),
                                        "mmm d"),
                        IsCurrent:  varWeekViewOffset + wk.Value = 0,
                        PersonName: If(
                                        Mod(varTodaySlotIdx + varWeekViewOffset + wk.Value + reg.PhaseOffset, 2) = 0,
                                        reg.P0, reg.P1),
                        PersonPhone:If(
                                        Mod(varTodaySlotIdx + varWeekViewOffset + wk.Value + reg.PhaseOffset, 2) = 0,
                                        reg.P0Ph, reg.P1Ph),
                        PersonIndex:Mod(varTodaySlotIdx + varWeekViewOffset + wk.Value + reg.PhaseOffset, 2)
                    }
                )
            }
        ),
        "GridRows"
    )
);
```

#### Week header row (8 static labels — `lblHdr0` through `lblHdr7`)

```powerapps
lblHdr0.Text = Text(DateAdd(varAnchorDate, (varTodaySlotIdx + varWeekViewOffset + 0) * 7, Days), "mmm d")
lblHdr1.Text = Text(DateAdd(varAnchorDate, (varTodaySlotIdx + varWeekViewOffset + 1) * 7, Days), "mmm d")
// ... repeat for 2–7

// Highlight current week
lblHdr0.Fill = If(varWeekViewOffset = 0,  RGBA(249,115,22,0.10), RGBA(0,0,0,0))
```

#### Region rows gallery — `galRegionRows`

One row per region. Inside the template, 8 side-by-side containers or
labels pull from `colScheduleGrid` filtered to this region and week.

```powerapps
galRegionRows.Items = Distinct(colScheduleGrid, Region)   // 7 unique regions

// Region label
lblRowRegion.Text = ThisItem.Result    // Distinct returns .Result

// Week cell helper (repeat this pattern for lblCell0 through lblCell7):
// lblCell0 inside galRegionRows template
lblCell0.Text =
    With(
        LookUp(colScheduleGrid, Region = galRegionRows.ThisItem.Result && WeekOffset = 0),
        PersonName
    )

// Color-code: blue = person 0, orange = person 1
lblCell0.Fill =
    With(
        LookUp(colScheduleGrid, Region = galRegionRows.ThisItem.Result && WeekOffset = 0),
        If(PersonIndex = 0,
            RGBA(59,130,246,0.15),
            RGBA(249,115,22,0.15))
    )

// Highlight current week column
lblCell0.BorderColor =
    If(varWeekViewOffset = 0, RGBA(249,115,22,1), RGBA(50,50,50,1))
lblCell0.BorderThickness = If(varWeekViewOffset = 0, 2, 0)
```

### Phase 2 swap point

When CompleteFlight writes schedule data to a Dataverse/SharePoint list
(`cr_oncall_schedule` with columns `cr_region`, `cr_slot_start`,
`cr_person_name`, `cr_person_phone`), replace the `colScheduleGrid`
`ForAll` block with:

```powerapps
// Phase 2 — replace the ForAll/Ungroup block with this:
ClearCollect(
    colScheduleGrid,
    AddColumns(
        Filter(
            cr_oncall_schedule,
            cr_slot_start >= DateAdd(Today(), varWeekViewOffset * 7, Days) &&
            cr_slot_start <  DateAdd(Today(), (varWeekViewOffset + 8) * 7, Days)
        ),
        "WeekOffset", DateDiff(Today(), cr_slot_start, Days) / 7,
        "SlotStart",  Text(cr_slot_start, "mmm d"),
        "IsCurrent",  DateDiff(Today(), cr_slot_start, Days) = 0,
        "PersonName", cr_person_name,
        "PersonPhone",cr_person_phone
    )
);
// galCurrentOncall, galRegionRows, and all cell formulas stay identical.
```

### Power Fx gotchas for this screen

- **`Sequence(8, 0)` produces Values 0–7.** Don't use `Sequence(8)` —
  that gives 1–8 and breaks the week offset math.
- **`Ungroup` column name must match exactly.** The `GridRows` key in the
  `ForAll` record and the `"GridRows"` string in `Ungroup` must be identical.
- **Rebuild `colScheduleGrid` when `varWeekViewOffset` changes.** Put the
  `ClearCollect` call in `btnPrev.OnSelect`, `btnNext.OnSelect`, and
  `btnToday.OnSelect` (after setting the variable), not just in `OnVisible`.
- **`Distinct()` returns `.Result` not the column name.** That's why
  `galRegionRows.ThisItem.Result` is used, not `.Region`.
- **LookUp in cell labels fires per row.** With 7 regions × 8 weeks = 56
  lookups against a 56-row collection, performance is fine. If you grow past
  ~200 rows, switch to a nested horizontal gallery instead.

---

## Screen — `frmScheduler`

7-day per-aircraft Gantt view. Each row is an aircraft; each column is a
day. Events render as positioned rectangles via the Container `X` /
`Width` formula trick.

### Gantt reference — RonLar community sample

**Why this reference, not a PCF:**
The [Universal Gantt Chart PCF](https://pcf.gallery/universal-gantt-chart/)
was evaluated and rejected for this project:
- GPL-3.0 license — requires IT/legal review at a healthcare org; any
  distribution of a modified build would require open-sourcing.
- Last commit October 2021 — 4+ years abandoned; 25 open issues; no
  guarantee it works against current Power Apps runtime.
- PCF import adds a managed-solution dependency and requires a DLP review
  cycle. Since Phase 2 is read-only, drag-and-drop editing (the PCF's
  main advantage) is not needed.

**Reference:** [RonLar community Gantt sample](https://community.powerplatform.com/galleries/gallery-posts/?postid=e4a07fa7-862c-4c4c-a031-591f69c9aa0c)
— standard controls only, MIT-equivalent community sample, last updated
2024, canvas apps only. Provides expand/collapse aircraft-type rows and
day/week/month zoom via pixel-per-day recalculation — both absent from
the Phase 1 `scr_Scheduler` build.

**Features to adopt from the sample:**

| Feature | RonLar pattern | Applies to `frmScheduler` |
|---|---|---|
| Expand/collapse rows | `Show` + `Expanded` boolean columns in the row collection; chevron `OnSelect` toggles and re-filters | Group aircraft by `cr_aircraft_type`; collapse hides individual aircraft rows and shows a summary type row |
| Day / Week / Month zoom | Recalculate `varPixelsPerDay` = `varBarAreaW / varZoomDays`; `varZoomDays` = 7 / 30 / 90 | Add `btnZoomDay`, `btnZoomWeek`, `btnZoomMonth` that set `varZoomDays` and re-run the date header collection |
| Label outside bar | `If(barWidth < 60, bar.X + barWidth + 4, bar.X + 4)` | Prevents task label from clipping when bar is narrow |
| Dynamic pixel math | `varPixelsPerDay = (barAreaEnd - barAreaStart) / varZoomDays` | Same formula; `barAreaStart` = label column width |

**Column mapping — RonLar flat structure → `cr_schedule_event`:**

| RonLar field | `cr_schedule_event` column | Notes |
|---|---|---|
| `Id` | `cr_schedule_eventid` | GUID |
| `TaskName` | `cr_event_type` | Display as label on bar |
| `StartDate` | `cr_window_start` | DateTime |
| `EndDate` | `cr_window_end` | DateTime |
| `TaskLvl` | 1 = type row, 2 = aircraft row | Computed in `AddColumns` |
| `TaskType` | `cr_event_type` | Drives `BarColor` switch |
| `Show` | Computed: `thisTypeExpanded \|\| TaskLvl = 1` | Controls gallery row visibility |
| `Expanded` | `varExpandedTypes` record | Store as `{AW109SP: true, H145: false, …}` |

**Row collection build pattern (adapt from RonLar):**

```powerapps
// Build a flat collection: one summary row per aircraft type + one detail
// row per aircraft, sorted so type header always precedes its children.
ClearCollect(colGanttRows,
    // Type-level summary rows (TaskLvl = 1)
    AddColumns(
        Distinct(colAircraft, cr_aircraft_type),
        "RowId",       Result,
        "RowLabel",    Result,
        "TaskLvl",     1,
        "Show",        true,
        "Expanded",    Coalesce(LookUp(varExpandedTypes, Key = Result).Val, true),
        "cr_tail",     Blank()
    )
);
// Aircraft-level rows (TaskLvl = 2), appended after their parent type row
ForAll(
    Sort(colAircraft, cr_aircraft_type, SortOrder.Ascending),
    Collect(colGanttRows,
        {
            RowId:    cr_tail,
            RowLabel: cr_tail & " — " & cr_base,
            TaskLvl:  2,
            Show:     Coalesce(LookUp(varExpandedTypes, Key = cr_aircraft_type).Val, true),
            Expanded: false,
            cr_tail:  cr_tail
        }
    )
)
```

**Expand/collapse chevron `OnSelect`:**

```powerapps
// btn_Chevron inside the TaskLvl=1 row template
UpdateIf(varExpandedTypes, Key = ThisItem.RowId, {Val: !ThisItem.Expanded});
// Re-show/hide TaskLvl=2 rows for this type
UpdateIf(colGanttRows, RowId = ThisItem.RowId, {Expanded: !ThisItem.Expanded});
UpdateIf(colGanttRows,
    TaskLvl = 2 &&
    LookUp(colAircraft, cr_tail = RowId).cr_aircraft_type = ThisItem.RowId,
    {Show: !ThisItem.Expanded}
)
```

**Gallery Items filter (hides collapsed rows without gallery rebuild):**

```powerapps
galRows.Items = Filter(colGanttRows, Show = true)
```

**Zoom buttons:**

```powerapps
btnZoomDay.OnSelect   = Set(varZoomDays, 7);  Set(varPixelsPerDay, varBarAreaW / 7)
btnZoomWeek.OnSelect  = Set(varZoomDays, 30); Set(varPixelsPerDay, varBarAreaW / 30)
btnZoomMonth.OnSelect = Set(varZoomDays, 90); Set(varPixelsPerDay, varBarAreaW / 90)
// After either zoom button: re-run ClearCollect(colGanttDates, ...) to rebuild header
```

**Install note:** The RonLar sample is distributed as a `.zip` canvas app
package. Import via **Apps → Import canvas app → From package (.zip)**,
open the imported app, and copy the relevant gallery + formula patterns
into `frmScheduler`. Do not deploy the sample app itself to production.

---

### Data sources

```powerapps
// On screen visible:
ClearCollect(colAircraft, Filter(cr_aircraft, cr_status = "IN_SERVICE"));
ClearCollect(
    colEvents,
    Filter(
        cr_schedule_event,
        cr_window_start >= Today() && cr_window_start <= Today() + 7
    )
);
ClearCollect(colConflicts, Filter(cr_conflict, IsBlank(cr_acknowledged_at)));
Set(varRegionFilter, "All");
Set(varSelectedConflict, Blank())
```

### Aircraft row gallery

```powerapps
galRows.Items =
    If(varRegionFilter = "All",
        colAircraft,
        Filter(colAircraft, cr_region = varRegionFilter)
    )
```

### Event bar (Container nested inside the row template)

```powerapps
// Items source: events for THIS aircraft within the 7-day window
galEvents.Items =
    Filter(colEvents, cr_aircraft_id.cr_tail = ThisItem.cr_tail)

// Container.X (positioned bar)
ctnEventBar.X =
    (DateDiff(Today(), ThisItem.cr_window_start, Days) / 7) * Parent.Width

// Container.Width
ctnEventBar.Width =
    (DateDiff(ThisItem.cr_window_start, ThisItem.cr_window_end, Days) / 7) * Parent.Width

// Container.Fill (color by event type)
ctnEventBar.Fill =
    Switch(ThisItem.cr_event_type,
        "inspection", RGBA(254, 217, 184, 1),
        "mx",         RGBA(222, 236, 249, 1),
        "aog",        RGBA(253, 231, 233, 1),
        "pr",         RGBA(233, 222, 250, 1),
        "training",   RGBA(223, 246, 221, 1),
        "mission",    RGBA(255, 233, 199, 1),
        RGBA(240, 240, 240, 1)
    )

// Border (red outline if conflicted)
ctnEventBar.BorderColor =
    If(
        CountRows(Filter(colConflicts, ThisItem.cr_event_id in cr_event_ids)) > 0,
        RGBA(164, 38, 44, 1),
        ctnEventBar.Fill
    )
ctnEventBar.BorderThickness = 2

// Click → open detail
ctnEventBar.OnSelect =
    Set(varSelectedEvent, ThisItem)
```

### Refresh button

```powerapps
btnRefresh.OnSelect =
    Refresh(cr_schedule_event);
    Refresh(cr_conflict);
    Set(varLastRefresh, Now())
```

### Auto-refresh timer

```powerapps
tmrAutoRefresh.Duration   = 900000     // 15 min
tmrAutoRefresh.AutoStart  = true
tmrAutoRefresh.Repeat     = true
tmrAutoRefresh.OnTimerEnd = Refresh(cr_schedule_event); Refresh(cr_conflict); Set(varLastRefresh, Now())
```

### Conflict panel side-bar

```powerapps
galConflicts.Items = colConflicts

// Open in source button (deep link)
btnOpenInSource.Text =
    "Open in " & varSelectedConflict.cr_actionable_source

btnOpenInSource.OnSelect =
    Launch(varSelectedConflict.cr_actionable_event_id.cr_source_url)

// Acknowledge
btnAcknowledge.OnSelect =
    Patch(cr_conflict, varSelectedConflict, {
        cr_acknowledged_by: User(),
        cr_acknowledged_at: Now()
    });
    Refresh(cr_conflict)
```

## Screen — `frmFleetMap`

Stock Power Apps Map control. Pins per aircraft from `cr_fleet_position`.

### Data sources

```powerapps
// On screen visible:
ClearCollect(
    colPositions,
    AddColumns(
        cr_fleet_position,
        "AircraftType", LookUp(cr_aircraft, cr_tail = ThisRecord.cr_tail).cr_type,
        "Region",       LookUp(cr_aircraft, cr_tail = ThisRecord.cr_tail).cr_region
    )
);
Set(varStatusFilter, "All");
Set(varRegionFilter, "All")
```

### Map control

```powerapps
Map1.Items =
    Filter(
        colPositions,
        (varRegionFilter = "All" || Region = varRegionFilter)
    )
Map1.ItemsLatitudes  = "cr_lat"
Map1.ItemsLongitudes = "cr_lon"
Map1.ItemsLabels     = "cr_tail"
Map1.DefaultLatitude  = 39.5
Map1.DefaultLongitude = -111.5
Map1.DefaultZoomLevel = 6
Map1.OnSelect = Set(varSelectedAircraft, Map1.Selected)
```

### Aircraft list panel (synced to map)

```powerapps
galAircraftList.Items = Map1.Items

galAircraftList.OnSelect =
    Set(varSelectedAircraft, ThisItem);
    Set(Map1.SelectedItems, [ThisItem])     // re-center via Map.SelectedItems
```

### Detail panel (right side)

```powerapps
lblTail.Text     = varSelectedAircraft.cr_tail
lblType.Text     = varSelectedAircraft.AircraftType
lblBearing.Text  = varSelectedAircraft.cr_bearing & "°"
lblSpeed.Text    = varSelectedAircraft.cr_speed & " kt"
lblLastSeen.Text = "Last seen " & DateDiff(varSelectedAircraft.cr_last_seen_at, Now(), Minutes) & " min ago"
```

### Refresh button + timer

```powerapps
btnRefresh.OnSelect =
    Refresh(cr_fleet_position);
    ClearCollect(colPositions, AddColumns(cr_fleet_position, ...));   // re-hydrate joined view
    Set(varLastRefresh, Now())

tmrAutoRefresh.Duration   = 900000
tmrAutoRefresh.OnTimerEnd = btnRefresh.OnSelect
```

### Power Fx gotchas (Phase 2 specific)

- **Joined collections re-hydrate on refresh.** `AddColumns` is a snapshot;
  if `cr_fleet_position` rows update, you have to `ClearCollect` again.
  Don't bind the Map directly to a join — cache it in a collection first.
- **`Map1.SelectedItems`** (vs `Map1.Selected`) is the writable property
  that re-centers the map programmatically.
- **Filter performance** — Power Apps galleries delegate filter operators
  back to Dataverse for sets >2000 rows. Phase 2's data volume is well
  below that, but if you grow past it, switch from `Filter()` to view-based
  data sources.
