# Phase 3 Power BI Spec

The Power BI side of Phase 3. Semantic model, report-by-report layout,
streaming dataset, map visual.

## Semantic model

### Tables

DirectQuery from Dataverse for these (current state always live):

- `cr_aircraft`         — aircraft master
- `cr_mx_request`       — request history (Phase 1)
- `cr_audit`            — audit trail (Phase 1)
- `cr_schedule_event`   — schedule data (Phase 2)
- `cr_conflict`         — detected conflicts (Phase 2)
- `cr_fleet_position`   — latest positions (Phase 2)

Imported (refreshed nightly) for these:

- `dim_date`            — standard Power BI date dimension, 5 years +/-
- `dim_region`          — region master (10 regions per IHC's roster)
- `fact_utilization`    — aggregated daily utilization per tail (rolled up
  from `cr_schedule_event` + `cr_fleet_position`)

### Relationships

```
dim_date         → cr_mx_request.createdon              (single, *→1)
dim_date         → cr_schedule_event.cr_window_start    (single, *→1)
dim_date         → fact_utilization.date                (single, *→1)
dim_region       → cr_aircraft.cr_region                (single, *→1)
cr_aircraft      → cr_schedule_event.cr_aircraft_id     (single, 1→*)
cr_aircraft      → cr_fleet_position.cr_tail            (single, 1→1)
cr_aircraft      → fact_utilization.cr_tail             (single, 1→*)
cr_schedule_event → cr_conflict.cr_event_ids            (many→many via bridge)
```

### Key DAX measures

```dax
Fleet Available =
    DIVIDE(
        CALCULATE(COUNTROWS(cr_aircraft), cr_aircraft[cr_status] = "IN_SERVICE"),
        COUNTROWS(cr_aircraft)
    )

AOG Count =
    CALCULATE(COUNTROWS(cr_aircraft), cr_aircraft[cr_status] = "AOG")

MX Compliance % =
    VAR DueOnTime =
        CALCULATE(
            COUNTROWS(cr_schedule_event),
            cr_schedule_event[cr_event_type] = "inspection",
            cr_schedule_event[cr_window_end] >= TODAY() - 30,
            cr_schedule_event[cr_window_end] <= TODAY()
        )
    VAR DueOverdue =
        CALCULATE(
            COUNTROWS(cr_schedule_event),
            cr_schedule_event[cr_event_type] = "inspection",
            cr_schedule_event[cr_window_end] < TODAY()
        )
    RETURN DIVIDE(DueOnTime, DueOnTime + DueOverdue)

Mean Time To Repair =
    AVERAGEX(
        FILTER(cr_mx_request, cr_mx_request[cr_status] = "Approved"),
        DATEDIFF(
            cr_mx_request[cr_window_start],
            cr_mx_request[cr_decided_at],
            HOUR
        )
    )

Utilization % =
    DIVIDE(
        SUM(fact_utilization[hours_flown]),
        SUM(fact_utilization[hours_available])
    )
```

### Row-level security (RLS)

Four roles, mapped to Entra security groups:

```dax
-- Director: see everything
[Region] = [Region]   -- always true

-- RMM: see only own region
[Region] = LOOKUPVALUE(
    dim_user[Region],
    dim_user[UserPrincipalName],
    USERPRINCIPALNAME()
)

-- AMT / QA: same as RMM, plus their own audit history
```

Bind in `Modeling > Manage roles` in Power BI Desktop, deploy with the
dataset.

---

## Reports

### Page 1 · Fleet Overview

Layout matches the existing `PowerBIDashboard.jsx` demo:

- Row 1: 4 KPI cards (Fleet Available, AOG Count, In Maintenance, MX
  Compliance) with trend deltas
- Row 2: Aircraft Available by Region (stacked bar) + Fleet Status Mix
  (donut)
- Row 3: 30-day Availability Trend (line + area) + Inspections Due in 7
  Days (table with conditional formatting)
- Row 4: Regional Performance Matrix (cross-tab heatmap)
- Right pane: slicers (Region, Aircraft Type, Status, Date Range)

Filters propagate across the entire report.

### Page 2 · Inspections

- Hero KPI: % compliant in last 30 days
- Upcoming due (7d, 14d, 30d) per tail
- Overdue alerts (red)
- Drill-through to per-tail inspection history

### Page 3 · Utilization

- Hours flown by tail (last 30 / 90 / 365 days)
- Utilization trend per region
- Idle aircraft analysis

### Page 4 · Compliance

- Cert expirations (CompleteFlight)
- Training matrix (CompleteFlight)
- Audit event heatmap by week
- DLP policy violations (zero, hopefully)

### Page 5 · Live Fleet

The cinematic page. Map visual + side panels.

See § *Live Fleet map* below.

---

## Streaming dataset (live fleet)

### Schema

```json
{
  "name": "FleetPositions",
  "defaultMode": "PushStreaming",
  "tables": [{
    "name": "position",
    "columns": [
      { "name": "tail",          "dataType": "string"   },
      { "name": "lat",           "dataType": "number"   },
      { "name": "lon",           "dataType": "number"   },
      { "name": "altitude_ft",   "dataType": "Int64"    },
      { "name": "bearing_deg",   "dataType": "Int64"    },
      { "name": "speed_kt",      "dataType": "Int64"    },
      { "name": "in_flight",     "dataType": "bool"     },
      { "name": "pushed_at",     "dataType": "DateTime" }
    ]
  }]
}
```

### Push endpoint

Power BI generates a push URL. Azure Function POSTs JSON arrays to that
URL on every poll cycle.

```js
// Azure Function (timer trigger every 30s)
const axios = require('axios');
module.exports = async function (context, myTimer) {
    const positions = await getSkyRouterPositions();
    const payload = positions.map(p => ({
        tail: p.tail,
        lat: p.lat,
        lon: p.lon,
        altitude_ft: p.altitude,
        bearing_deg: p.bearing,
        speed_kt: p.speed,
        in_flight: p.speed > 30,
        pushed_at: new Date().toISOString()
    }));
    await axios.post(process.env.POWERBI_PUSH_URL, payload);
};
```

---

## Live Fleet map

### Map visual choice

- **ArcGIS Maps for Power BI** — free, ships with Power BI Pro. Limited
  styling, supports basic rotation. **Recommended for v1.**
- **Mapbox custom visual** — paid (Mapbox account required), full
  control: custom basemap, smooth animations, true bearing rotation,
  weather overlays.

### Configuration (ArcGIS)

- Latitude:    `position[lat]`
- Longitude:   `position[lon]`
- Location:    `position[tail]` (label)
- Color:       `position[in_flight]` (true=green, false=gray)
- Size:        constant (medium)
- Custom basemap: ArcGIS Streets, Topographic, or upload IHC's branded
  layer if available

### Drill-through

Click aircraft pin → drill to canvas-app screen `frmAircraftDetail` with
the tail as a parameter. Configured via Power BI Page Drillthrough Filter.

### Auto-refresh

Streaming datasets refresh in real time on the Power BI service. No
separate refresh schedule needed. Latency end-to-end:

```
SkyRouter API
   ↓ (Azure Function timer)        ~10–30s
Power BI streaming push
   ↓ (push to streaming dataset)   ~1–3s
Power BI map visual
   ↓ (re-render)                   <1s
   = ~12–34s end-to-end
```

Tuning: tighten the Azure Function timer to 10s if budget allows,
floor latency at ~12s.
