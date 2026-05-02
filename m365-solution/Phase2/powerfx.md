# Phase 2 Power Fx — Scheduler + Fleet Map screens

Two new screens in the `MX Request` canvas app. Both are read-only mirrors
of source-system data; user actions deep-link out to CompleteFlight or
ProteanHub for edits.

## Screen — `frmScheduler`

7-day per-aircraft Gantt view. Each row is an aircraft; each column is a
day. Events render as positioned rectangles via the Container `X` /
`Width` formula trick.

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
