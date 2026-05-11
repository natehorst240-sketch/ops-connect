# Phase 2 — Operations Layer

Layers operations on top of the Phase 1 audit + approval surface. Phase 1
establishes the request → decision pipeline; Phase 2 brings in the source
systems that hold the actual schedule and the live fleet position data.

**Status:** Proposed. Starts after Phase 1 acceptance criteria are met.
**Estimated effort:** 10–14 weeks, 1–2 Power Platform devs + IT liaison.

## What ships in Phase 2

- **Resource Scheduler** — read-only Gantt mirror of CompleteFlight (inspections,
  training) and ProteanHub (missions, MX, AOG, PR). 7-day timeline view
  with per-aircraft rows. Edits made at source; MX Connect is read-only.
- **Fleet Map** — stock Power Apps map control rendering aircraft positions
  from SkyRouter. 15-minute refresh cadence. No bearing rotation, no
  custom basemap (those land in Phase 3).
- **Server-side conflict + coverage gap detection** — a Power Automate flow
  scans `cr_schedule_event` and `cr_fleet_position`, computes overlaps,
  AOG cascades, coverage gaps, and writes results to `cr_conflict`. Runs
  on every source-system sync.
- **Time off + open shift workflows** — same Phase 1 pipeline (canvas form
  → Adaptive Card → RMM decision → Outlook event), reused for two new
  request types.
- **Bulletins + safety reports** — lightweight forms + Teams broadcast.

## Stack additions over Phase 1

- 4 custom connectors (Veryon, CompleteFlight, ProteanHub, SkyRouter) with
  API key auth, OpenAPI 2.0 swagger definitions
- 4 new Dataverse tables: `cr_aircraft`, `cr_schedule_event`,
  `cr_fleet_position`, `cr_conflict`
- 3 scheduled flows: scheduler poll, fleet position poll, conflict detection
- 2 new canvas screens: Scheduler, Fleet Map
- Phone-form-factor refresh of the existing canvas app
- **Responsive layout** — replace fixed pixel positions with `App.Width`/`App.Height`-relative formulas so the app adapts to both phone (AMT in the field) and desktop/tablet (Director/RMM reviewing requests). Priority screens: `scr_AskLeadership`, `scr_AskDetail`, `scr_ApprovalInbox`, `scr_Home`. Each control's `X`, `Y`, `Width`, `Height` expressed as fractions of `Parent.Width`/`Parent.Height` rather than hardcoded values.

## Dependencies on Phase 1

- `cr_audit` table (Phase 2 audit events join Phase 1 audit chain)
- Adaptive Card pipeline (reused for time-off + open shift)
- Outlook calendar pattern (reused for crew assignments)
- `MXC AMT`, `MXC RMM`, `MXC Director` security roles (extended with
  Phase 2 table privileges)

## What's here

- `runbook.md` — week-by-week deployment (lighter than Phase 1's runbook
  since Phase 2 inherits the operational pattern Phase 1 establishes)
- `tables.md` — schema specs for `cr_aircraft`, `cr_schedule_event`,
  `cr_fleet_position`, `cr_conflict`
- `connectors.md` — OpenAPI sketch for each of the 4 source-system
  connectors
- `powerfx.md` — Power Fx for Scheduler + Fleet Map screens
- `flows/` — (forthcoming) flow JSON for the 3 polling + detection flows

## Deployment path decision — Full vs No Outside Help

Before Phase 2 procurement starts, choose which variant to deploy.

### Full Phase 2 (4 APIs)

The original spec: CompleteFlight + ProteanHub + SkyRouter + Veryon.
All four API procurement cycles required (6–14 weeks total vendor coordination).

### No Outside Help variant (~90–95% of Phase 2 capability)

Eliminates SkyRouter and Veryon API dependencies entirely:

- **SkyRouter → self-hosted ADS-B feeder network.** 18 Raspberry Pi stations
  across IHC's footprint (UT, WY, MT, ID, NV, CO, NM, AZ, NC, WI). Each station
  runs `dump1090-fa` + `tar1090` and exposes `/aircraft.json`. An Azure Function
  polls every 30 seconds and upserts `cr_fleet_position`. Sub-30-second position
  refresh vs SkyRouter's 15-minute polling ceiling.
- **Veryon API → nightly Excel export.** Inspection due dates batch-loaded from
  a SharePoint-dropped Veryon export. Flight hours stay live from CompleteFlight.
  Hours-remaining calculation: `Next Due Hours (Veryon export) − Current Hours
  (CompleteFlight live)`. 24-hour lag on due-date threshold; operationally
  irrelevant for 100hr/300hr/annual intervals.

**Outcome:** 2 API procurement cycles instead of 4. $3,300 one-time hardware
instead of ongoing SkyRouter + Veryon subscriptions. 7–10 week timeline vs
10–14 weeks.

**Full spec:** `../NoOutsideHelp/prospectus.md`

**Choose No Outside Help if:** Veryon API is stalled, SkyRouter cost is a
friction point, or faster Phase 2 delivery is the priority.

**Choose Full Phase 2 if:** Veryon and SkyRouter are already contracted, or
IHC IT cannot support external hardware at hospital sites.

---

## Pre-flight checklist (start when Phase 1 is in UAT)

### Full Phase 2
- [ ] Veryon API key procured (typically 2–3 weeks)
- [ ] CompleteFlight API key procured (2–4 weeks)
- [ ] ProteanHub API key procured (2–4 weeks)
- [ ] SkyRouter API key procured (1–2 weeks)
- [ ] DLP review extended to cover the 4 new connectors
- [ ] Confirm Power Automate flow run quota (Phase 2 polling adds ~432 runs/day)

### No Outside Help variant
- [ ] CompleteFlight API key procured (2–4 weeks)
- [ ] ProteanHub API key procured (2–4 weeks)
- [ ] ADS-B hardware ordered — 18 × ~$150 + 2 spares + shipping (~$3,300 total)
- [ ] IHC IT provisioned network drop at each station mount point
- [ ] Azure Function consumption plan created (ADS-B ingest, ~$5/mo)
- [ ] Veryon Excel export drop folder created in SharePoint
- [ ] DLP review extended to cover 2 new connectors
