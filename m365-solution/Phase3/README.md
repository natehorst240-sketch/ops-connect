# Phase 3 — Analytics + Live Tracking

Unlocks once IHC's 1000 Power BI Pro licenses arrive. Adds the executive
analytics surface and the cinematic real-time fleet view.

**Status:** Gated on Power BI Pro licensing.
**Estimated effort:** 12–16 weeks, 1 Power Platform dev + 1 Power BI dev.

## What ships in Phase 3

- **Power BI Fleet Operations report** — multi-page report:
  - Fleet Overview (KPIs, regional drill-down)
  - Inspections (upcoming + overdue, drill to tail)
  - Utilization (hours flown vs available, trend)
  - Compliance (cert + training + DLP posture)
- **Live Fleet view** — Power BI map visual (ArcGIS Maps for Power BI or
  Mapbox custom visual) reading from a streaming dataset. Sub-30s refresh
  cadence. Bearing-rotated icons. Custom basemap.
- **Self-service slicers + filters** — RMMs and Director slice the
  reports themselves; no ticket-and-wait.
- **Exec PDF / PowerPoint exports** — native Power BI export, scheduled
  weekly.
- **Drill-through** from any report visual back to the underlying
  Dataverse row in the canvas app (deep-link out).

## Stack additions over Phase 2

- Power BI Pro licensing for ~350 active users (or Premium Capacity —
  IHC's choice)
- A Power BI workspace dedicated to MX Connect
- A Power BI streaming dataset for live positions (Phase 2's
  `cr_fleet_position` polling becomes the source for the streaming push)
- An Azure Function (timer-triggered) to push streaming data — OR a
  Power Automate flow with the Power BI streaming connector. Both work;
  Azure Function is the lower-latency option.
- Either ArcGIS Maps for Power BI or Mapbox Power BI custom visual

## Dependencies on Phase 2

- All 4 Dataverse tables (`cr_aircraft`, `cr_schedule_event`,
  `cr_fleet_position`, `cr_conflict`) populated from source systems
- Audit trail (`cr_audit`) for the compliance report
- `cr_mx_request` history (Phase 1) for the volume / throughput metrics

## What's here

- `runbook.md` — week-by-week deployment
- `powerbi-spec.md` — semantic model (DAX measures, relationships) + per-
  report layout + streaming dataset spec + map visual config

## Pre-flight checklist

- [ ] **1000 Power BI Pro licenses procured.** This gates the whole phase.
      Without it, you're back to Phase 2 fidelity.
- [ ] Power BI workspace stood up (dedicated, not personal)
- [ ] At least one Power BI dev with DAX experience available
- [ ] Decision on map visual: ArcGIS Maps for Power BI (included with
      Pro) vs Mapbox custom visual (richer styling)
- [ ] Decision on streaming dataset push mechanism: Azure Function
      (lower latency) vs Power Automate (Microsoft-only stack)
