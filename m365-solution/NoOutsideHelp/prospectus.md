# MX Connect — No Outside Help Variant
## Self-Hosted Fleet Tracking + 2-API Operations Layer

**Version:** In-House Deployment Prospectus  
**Replaces:** Phase 2 full (4 APIs + SkyRouter)  
**APIs required:** CompleteFlight · ProteanHub  
**APIs eliminated:** SkyRouter · Veryon  
**Hardware:** Self-deployed ADS-B feeder network  

---

## Concept

Phase 2 as written requires four API procurement cycles (Veryon, CompleteFlight,
ProteanHub, SkyRouter) totalling 6–14 weeks of vendor coordination before a single
line of integration code can run. This variant eliminates two of those four
dependencies entirely:

- **SkyRouter** → replaced by owned ADS-B feeder stations. Real-time position
  data from aircraft transponders, ingested directly into Dataverse. No
  subscription, no vendor relationship, no refresh-rate ceiling.
- **Veryon** → replaced by scheduled Excel exports. Inspection due dates are
  batch-loaded nightly. Flight hours accumulate live from CompleteFlight, so
  the critical hours-remaining calculation stays current even between exports.

Result: **~90–95% of Phase 2 capability. 2 API procurement cycles instead of 4.
$3,000–$3,500 one-time hardware spend instead of ongoing SkyRouter + Veryon
subscription costs.**

---

## What You Keep from Phase 2

| Phase 2 Feature | Source | Status in this variant |
|---|---|---|
| Fleet Map (live positions) | SkyRouter → **ADS-B** | ✅ Better — sub-30s vs 15-min |
| Resource Scheduler — Inspections/Training | CompleteFlight API | ✅ Full |
| Resource Scheduler — Missions/MX/AOG | ProteanHub API | ✅ Full |
| Conflict + coverage gap detection | Both APIs + ADS-B | ✅ Full |
| Inspection due dates | Veryon → **Excel export** | ⚠️ 24hr lag |
| Time off + open shift workflows | Phase 1 pipeline | ✅ Full |
| Bulletins + safety reports | Phase 1 pipeline | ✅ Full |

---

## ADS-B Feeder Network

### How it works

Each station is a Raspberry Pi single-board computer connected to an RTL-SDR
USB receiver and a 1090 MHz antenna. Aircraft with ADS-B Out transponders
broadcast their ICAO address, GPS position, altitude, groundspeed, and heading
once per second. The station decodes these signals and exposes them as a local
JSON feed (`/aircraft.json`) via `tar1090`.

A lightweight Azure Function (or Power Automate flow) polls every station every
30 seconds, cross-references each ICAO hex address against a tail number registry
table in Dataverse, and upserts `cr_fleet_position` records. The Power Apps Fleet
Map screen reads those records — identical to how it would read SkyRouter data.

### Station hardware bill of materials (~$150/station)

| Component | Model | Cost |
|---|---|---|
| RTL-SDR receiver | RTL-SDR Blog V4 | $35 |
| Single-board computer | Raspberry Pi 3B+ or Zero 2W | $35–$45 |
| 1090 MHz antenna | FlightAware 26" antenna or equivalent | $35 |
| Outdoor enclosure + mount | IP65 ABS box | $15 |
| Power supply + USB cable | 5V 3A USB-C | $12 |
| **Total per station** | | **~$140–$155** |

Station software: Raspberry Pi OS Lite + `dump1090-fa` or `readsb` + `tar1090`.
All open source, no licensing cost.

### Station placement strategy

Stations should be mounted at existing IHC facilities — hospital rooftops, hangar
buildings, or base helipads. These locations already have power and internal
network access, eliminating site-prep cost. A station at 50–80ft AGL provides
reliable ADS-B reception from aircraft at 1,500ft AGL out to approximately
40–60nm in open terrain; less in mountain valleys, more above ridgelines.

### Coverage map and station count

| Region | Primary Bases | Stations | Coverage notes |
|---|---|---|---|
| Utah — Wasatch Front | SLC, Ogden, Provo, WOODSCROSS | 3 | Dense operations, multiple hospitals |
| Utah — South | St. George, Cedar City | 1 | Flat high desert, single station covers region |
| Utah — East / Moab | Moab, Price | 1 | Canyon terrain, station at rim elevation |
| Wyoming | Casper, Jackson, Sheridan | 3 | Large area, spread across I-25 / I-90 corridor |
| Montana | Billings | 1 | Eastern MT flat terrain, wide coverage |
| Idaho | Boise, Twin Falls | 2 | Snake River Plain, good propagation |
| Nevada | Las Vegas / Henderson | 1 | Adjacent to UT/AZ operations |
| Colorado | Grand Junction, Denver | 2 | Western slope + Front Range |
| New Mexico | Albuquerque | 1 | Central NM operations |
| Arizona — PAGE | PAGE, Flagstaff | 1 | Glen Canyon / northern AZ |
| North Carolina | Charlotte / regional | 1 | Eastern ops, flat terrain |
| Wisconsin | Regional | 1 | Midwestern ops |
| **Total** | | **18 stations** | |

**Hardware total: 18 × $150 = $2,700**  
**Contingency (2 spares + shipping): $600**  
**Total ADS-B capital cost: ~$3,300**

### ICAO hex to tail number registry

The FAA Aircraft Registry publishes a downloadable CSV mapping ICAO hex addresses
to N-numbers. Import this CSV into a Dataverse lookup table (`cr_aircraft_registry`)
once at deployment. IHC's active fleet is small enough (~20–30 aircraft) to verify
and maintain manually. Refresh the registry CSV annually or when fleet changes.

---

## Data Architecture

```
┌─────────────────────────────────────────────────────┐
│                  DATA SOURCES                       │
│                                                     │
│  CompleteFlight API   ProteanHub API                │
│  (flight hrs, insp,   (missions, MX,                │
│   training)            AOG, work orders)            │
│         │                    │                      │
│  Veryon Excel export   ADS-B Feeder Network         │
│  (inspection due       (18 stations → Azure Fn      │
│   dates, nightly)       polls every 30s)            │
└────────────────┬─────────────────┬──────────────────┘
                 │                 │
                 ▼                 ▼
┌─────────────────────────────────────────────────────┐
│              DATAVERSE TABLES                       │
│                                                     │
│  cr_schedule_event    cr_fleet_position             │
│  (CompleteFlight +    (ADS-B ingest,                │
│   ProteanHub +         upserted every 30s)          │
│   Veryon import)                                    │
│         │                    │                      │
│  cr_conflict (server-side detection flow)           │
│  cr_aircraft (tail → type → base mapping)          │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              MX CONNECT CANVAS APP                  │
│                                                     │
│  scr_Scheduler   scr_FleetMap   (Phase 1 screens)  │
└─────────────────────────────────────────────────────┘
```

---

## Power Automate Flows Required

### 1. ADS-B Ingest Flow
- **Trigger:** Scheduled — every 30 seconds (or Azure Function timer trigger)
- **Action:** HTTP GET to each station's `http://[station-ip]/aircraft.json`
- **Action:** For each aircraft in response, cross-reference `cr_aircraft_registry`
- **Action:** Upsert `cr_fleet_position` row (tail, lat, lon, altitude, groundspeed, heading, timestamp)
- **Complexity:** Low — standard HTTP + Dataverse connector

### 2. CompleteFlight Sync Flow
- **Trigger:** Scheduled — every 10 minutes
- **Action:** Custom connector → CompleteFlight API → fetch scheduled events
- **Action:** Upsert `cr_schedule_event` (type = Inspection / Training)
- **Complexity:** Medium — custom connector required

### 3. ProteanHub Sync Flow
- **Trigger:** Scheduled — every 10 minutes
- **Action:** Custom connector → ProteanHub API → fetch missions, MX, AOG
- **Action:** Upsert `cr_schedule_event` (type = Mission / MX / AOG)
- **Complexity:** Medium — custom connector required

### 4. Veryon Excel Import Flow
- **Trigger:** SharePoint file modified (Veryon export dropped into SharePoint folder)
- **Action:** Excel connector reads rows
- **Action:** For each row, upsert `cr_schedule_event` (inspection due date, next due hours)
- **Complexity:** Low — standard Excel + Dataverse connector, no custom connector

### 5. Conflict Detection Flow (unchanged from Phase 2 spec)
- **Trigger:** On `cr_schedule_event` create/update
- **Action:** Scan for overlaps, AOG cascades, coverage gaps
- **Action:** Write results to `cr_conflict`
- **Complexity:** Medium — same as full Phase 2

---

## Hours-Remaining Calculation

The key inspection metric is always current because its two inputs come from
different sources on different cadences:

```
Hours Remaining Until Due
= Next Due Hours (Veryon export — nightly)
− Current Hours (CompleteFlight API — every 10 min)
```

Even with a 24-hour lag on the due threshold, the hours accumulating toward
it update continuously. Warning color thresholds on the Gantt and Fleet Map
move in real time as aircraft fly.

**The only scenario where the lag matters:** a tech completes an inspection
today, Veryon is updated, but the export hasn't run yet. The system shows the
old due date until tonight. This is a known, bounded gap — operationally
irrelevant for most inspection intervals (100hr, 300hr, annual). For AOG
events, the AOG request type in Phase 1 handles same-day visibility through
the existing approval workflow, independent of Veryon.

---

## Cost Summary

### One-time capital

| Item | Cost |
|---|---|
| ADS-B feeder hardware (18 stations × ~$150) | $2,700 |
| Spare units + shipping | $600 |
| Azure Function hosting setup | $0 (consumption plan — ~$5/mo ongoing) |
| **Total one-time** | **~$3,300** |

### Ongoing

| Item | Monthly |
|---|---|
| Azure Function (ADS-B ingest, consumption plan) | ~$5 |
| CompleteFlight API | Per contract |
| ProteanHub API | Per contract |
| SkyRouter | **$0 — eliminated** |
| Veryon API | **$0 — eliminated** |

### Compared to full Phase 2

Full Phase 2 carries ongoing subscriptions for SkyRouter + Veryon API on top
of CompleteFlight + ProteanHub. This variant eliminates both recurring costs
and replaces them with a $3,300 one-time hardware investment that IHC owns
and controls.

---

## Timeline

| Milestone | Full Phase 2 | No Outside Help |
|---|---|---|
| API key procurement (all vendors) | 6–14 weeks | 2–6 weeks (CF + PH only) |
| ADS-B station deployment | — | 1–2 weeks (ship + mount) |
| Custom connectors (CF + PH) | 4 weeks | 4 weeks |
| Veryon connector | 3 weeks | **0 — Excel import instead** |
| ADS-B ingest flow | — | 1 week |
| Canvas screens (Scheduler + Fleet Map) | 4 weeks | 4 weeks |
| UAT + prod deploy | 2 weeks | 2 weeks |
| **Estimated total** | **10–14 weeks** | **7–10 weeks** |

---

## Known Limitations vs Full Phase 2

| Limitation | Impact | Mitigation |
|---|---|---|
| Veryon due dates lag up to 24hrs | Same-day inspection completions not reflected until nightly export | Document as known behavior; AOG workflow handles same-day visibility |
| ADS-B requires line-of-sight | Deep canyons, hangars block signal | Station placement at elevation points; gaps acceptable for ground ops |
| ADS-B only covers ADS-B Out aircraft | Any aircraft without ADS-B Out transponder invisible | All IHC aircraft required ADS-B Out since 2020 mandate |
| Stations need internet at mount point | Hospital/base IT must provision network drop | IHC facilities already networked; coordinate with IT during station deployment |

---

## What Moves to Phase 3 (Unchanged)

This variant does not affect Phase 3. Power BI reads from the same Dataverse
tables regardless of whether positions came from SkyRouter or ADS-B. The
streaming dataset push (Azure Function → Power BI) works identically. Phase 3
timeline and scope are unaffected.

---

## Decision Criteria

Deploy this variant if:
- Veryon API procurement is stalled or unavailable
- SkyRouter API cost or vendor relationship is a friction point
- Faster Phase 2 delivery is the priority
- IHC IT can mount a Raspberry Pi at hospital locations (low bar)

Revert to full Phase 2 if:
- Veryon API becomes available during Phase 1 UAT
- SkyRouter is already contracted
- IT cannot support external hardware at hospital sites

The two paths share identical Dataverse schema and canvas app code.
Swapping in SkyRouter or Veryon API later requires only replacing the
corresponding flow — no canvas app changes, no table changes.
