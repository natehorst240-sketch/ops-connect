# Phase 3 Runbook — Analytics + Live Tracking

Gated on 1000 Power BI Pro licenses. Don't start without them.

**Estimated effort:** 12–16 weeks. 1 Power Platform dev + 1 Power BI dev.

---

## Pre-flight

- [ ] Power BI Pro licenses assigned to all ~350 active users
- [ ] Power BI workspace `MX Connect` created in the Power BI service
- [ ] DAX-fluent dev identified
- [ ] Map visual decision: **ArcGIS** (included with Pro) vs
      **Mapbox** (richer styling). Default: ArcGIS.
- [ ] Streaming push decision: **Azure Function** (lower latency) vs
      **Power Automate** (M365-only). Default: Azure Function for the
      <30s latency.

---

## Week 1–2 — Semantic model

Build the Power BI dataset that all reports consume.

- DirectQuery against Dataverse for transactional data (`cr_mx_request`,
  `cr_audit`, `cr_schedule_event`, `cr_conflict`)
- Imported aggregations for utilization rollups (refreshed nightly)
- DAX measures: utilization %, MTTR, inspection compliance %, AOG hours
- Date table (standard Power BI pattern)
- Row-level security (RLS) bound to Entra security groups so RMMs see
  only their region

See `powerbi-spec.md` § *Semantic model* for the full spec.

---

## Week 3–6 — Static reports

Build the four executive-facing report pages:

- **Fleet Overview** — KPI cards + regional bar + status donut + 30-day
  availability trend (matches the existing PowerBIDashboard.jsx demo)
- **Inspections** — upcoming due list + overdue alerts + per-tail history
- **Utilization** — hours flown vs available, trend by tail
- **Compliance** — cert expirations, training matrix, audit log heatmap

Week 3: Fleet Overview. Week 4: Inspections. Week 5: Utilization. Week
6: Compliance.

---

## Week 7–9 — Live Fleet view

The cinematic Phase 3 deliverable. Sub-30s refresh.

### Week 7 — Streaming dataset

Create the Power BI streaming dataset. Schema matches `cr_fleet_position`
plus a `pushed_at` timestamp.

### Week 8 — Push mechanism

Build whichever push mechanism you picked in pre-flight:

- **Azure Function (recommended)** — timer trigger every 30s, pulls
  SkyRouter, pushes to Power BI streaming dataset. The same Function
  can also keep `cr_fleet_position` fresh, so Phase 2's stock map gets
  the lower-latency data for free.
- **Power Automate** — same pattern, but every 1 min (Power Automate has
  a 1-min minimum trigger frequency). Premium connector.

### Week 9 — Map visual

Drop in the chosen map visual (ArcGIS or Mapbox). Bind to the streaming
dataset. Configure styling: bearing rotation, custom marker, clustering
rules, basemap (dark or branded).

---

## Week 10–11 — Embedding + drill-through

Embed the Power BI report in:

- **Microsoft Teams** — add the Power BI tab to the IHC Life Flight
  channel and pin the Fleet Overview page
- **The canvas app** — a new screen `frmAnalytics` with a Power BI tile
  embed (`PowerBI.View()` Power Fx)

Drill-through from a Power BI visual back to the canvas app: configure a
drill-through URL on each report page that opens the relevant
`cr_mx_request` or aircraft detail screen.

---

## Week 12 — Self-service tuning

With one or two RMMs, walk through the slicer / filter pane and tune
based on the questions they actually ask. "What's the inspection backlog
in my region by aircraft type?" — verify they can answer it themselves
without opening a ticket.

---

## Week 13–14 — UAT → Prod

Power BI workspaces deploy via the Power BI service:

- Create a Dev workspace, build there
- Promote to Test workspace via Power BI deployment pipelines
- Promote to Prod workspace once UAT signs off

---

## Week 15–16 — Adoption

- Train Director + Asst Director on the Fleet Overview page
- Train each RMM on their region's slicer
- Schedule weekly PDF + PPT exports for the exec leadership group
- Decommission whichever Excel reports the Power BI report replaces

---

## Phase 3 acceptance criteria

- [ ] All ~350 users have Pro licenses and can open the report
- [ ] Live Fleet view refreshes in under 30s end-to-end
- [ ] RMMs can answer 5 chosen questions self-serve in <30s each
- [ ] Drill-through from any visual back to the canvas app works
- [ ] Weekly PDF export goes to the exec leadership group automatically
- [ ] Three weeks of clean refresh history in Prod
