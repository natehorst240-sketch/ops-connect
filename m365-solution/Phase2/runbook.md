# Phase 2 Runbook — Operations Layer

Picks up where Phase 1 left off. Phase 1 establishes the canvas-app +
flow + Adaptive Card pattern; Phase 2 reuses it and adds the source-
system integrations + read-only Scheduler + Fleet Map.

**Estimated effort:** 10–14 weeks, 1–2 Power Platform devs.

---

## Pre-flight (do during Phase 1 UAT)

- [ ] All 4 source-system API keys in hand
- [ ] Custom connector swagger files reviewed by IHC IT for DLP impact
- [ ] Confirm Power Automate flow quota: ~432 polling runs/day
- [ ] Service account `mx-service@ihc.org` has API key access

---

## Week 1–2 — Custom connectors

Build and certify the four custom connectors. Each lives in the
`MXConnect` solution alongside the Phase 1 flow.

1. **SkyRouter** (simplest, do first) — fleet positions, single GET
   operation
2. **Veryon** — inspection due list, multiple GET operations
3. **CompleteFlight** — cert + training data
4. **ProteanHub** — missions + MX + AOG

See `connectors.md` for OpenAPI sketches per connector.

---

## Week 3 — Dataverse expansion

Create the 4 new tables. See `tables.md` for full specs.

- `cr_aircraft` — master record per tail (Phase 1 had this as free text;
  Phase 2 promotes to a proper table with lookups across the schema)
- `cr_schedule_event` — read-only mirror of CompleteFlight + ProteanHub
  schedule data
- `cr_fleet_position` — latest SkyRouter positions, keyed by tail
- `cr_conflict` — computed conflicts cached for the canvas app

Migrate Phase 1's `cr_mx_request.cr_aircraft_tail` from free text to a
lookup against `cr_aircraft`.

---

## Week 4–5 — Polling flows

Three scheduled cloud flows in the `MXConnect` solution:

- `scheduler-poll-flow-v1` — every 15 min, pulls CompleteFlight +
  ProteanHub, upserts `cr_schedule_event`
- `skyrouter-poll-flow-v1` — every 15 min, pulls SkyRouter, upserts
  `cr_fleet_position`
- `conflict-detection-flow-v1` — triggered on `cr_schedule_event` change,
  runs detection logic, upserts `cr_conflict`

Flow JSON skeletons go in `flows/` (forthcoming — Phase 2 work item).

---

## Week 6–7 — Canvas screens

Add two screens to the existing `MX Request` canvas app:

- **Scheduler** — 7-day timeline, aircraft rows, color-coded events,
  conflict side panel with "Open in CompleteFlight" / "Open in
  ProteanHub" deep links. Read-only. Refresh-now button + freshness
  indicator.
- **Fleet Map** — stock Power Apps Map control. Bing pins per aircraft.
  Region + status filters. Click pin → side panel.

See `powerfx.md` for screen-by-screen Power Fx.

---

## Week 8–9 — Time off + open shift

Reuse the Phase 1 Request → Approval pipeline. Add two new values to
`cr_request_type` (already present in the Phase 1 schema), build a
request-type-aware Adaptive Card variant, route to the right approver
per request type:

- `Time Off` → Crew Scheduler
- `Open Shift` → RMM (same as MX)

No new flow; extend `mxr-approval-flow-v2` with switch on
`cr_request_type`.

---

## Week 10 — Bulletins + safety reports

Lightweight: form → Dataverse → Teams broadcast. No approval gate.
Goes to a separate `Bulletins` Teams channel.

---

## Week 11–14 — UAT → Prod

- Week 11–12: Logan-region UAT (same approach as Phase 1)
- Week 13: Promote to UAT environment, regression test
- Week 14: Promote to Prod, monitor flow run history

---

## Phase 2 acceptance criteria

- [ ] All 4 source systems polled at 15-min cadence with <1% failure rate
- [ ] Conflict + coverage gap detection runs in <30s
- [ ] Scheduler screen shows the next 7 days of events for any aircraft
      with current source-system data (within 15 min of source)
- [ ] Fleet Map shows current position pins, region/status filters work
- [ ] Time off + open shift workflows ship with the same audit pattern
      as Phase 1
- [ ] DLP review signed off on all 4 custom connectors
- [ ] Three weeks of clean run history (>98%) in the Logan pilot

When all checked, Phase 2 is done and Phase 3 is unblocked (assuming
Power BI Pro licenses have arrived).
