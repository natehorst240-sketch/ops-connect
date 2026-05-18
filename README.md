# MX Connect — IHC Aviation Maintenance Operations Platform

A Power Platform solution built for Intermountain Health Care (IHC) aviation
maintenance operations. Canvas app + Power Automate + Teams + Dataverse.

---

## What this is

MX Connect replaces manual text chains and email threads with a structured
request → approval → audit pipeline for aircraft maintenance operations across
IHC's ~85-person maintenance roster and 61-aircraft fleet.

**Phase 1** (active build): AMT submits a maintenance request from mobile →
Adaptive Card lands in the regional RMM's Teams channel → approver chooses
Approve / Deny / Escalate / Return → Outlook event created, requestor DM'd,
audit row written.

**Phase 2** (planning): Live fleet map, resource scheduler, conflict detection
via CompleteFlight + ProteanHub APIs. ADS-B self-hosted option available (see
`m365-solution/NoOutsideHelp/`).

**Phase 3** (future): Power BI executive dashboard consuming Phase 1 + 2 data.

---

## Repository layout

This repo holds **two parallel implementation tracks** that share a Dataverse
backend. See `docs/architecture-tracks.md` for the rules that keep them
separated.

```
ops-connect/
├─ docs/                   Cross-track docs (architecture, governance, plans)
├─ m365-solution/          Track A — Native Power Platform (canonical)
│  ├─ README.md            Kit overview + conventions
│  ├─ Phase1/              Active build — canonical request/approval flow
│  │  ├─ runbook.md        Week-by-week deployment guide — READ FIRST
│  │  ├─ build-walkthrough.md  Click-by-click table + flow build
│  │  ├─ tables/           Dataverse table schemas (cr_*.md per table)
│  │  ├─ flows/            Power Automate flow JSON
│  │  ├─ cards/            Adaptive Card JSON
│  │  └─ powerfx/          Canvas app spec + Power Fx formulas
│  │     ├─ canvas-app.md  Screen-by-screen build guide
│  │     └─ FIELD-MAP.md   Column name + formula dependency reference
│  ├─ Phase2/              Operations layer (planning)
│  ├─ Phase3/              Power BI (future)
│  ├─ NoOutsideHelp/       Self-hosted ADS-B variant for Phase 2
│  └─ sharepoint-lists/    Canonical seed CSVs (IHC real data)
└─ src/                    Track B — React + Entra → Dataverse SPA
   ├─ auth/                Entra app reg config + Dataverse table clients
   ├─ m365/                M365-shell screens calling Dataverse Web API
   └─ ...                  App logic, view models, UI
```

Both tracks write to the same Dataverse tables. Schema is owned by Track A's
`m365-solution/Phase1/tables/`; Track B mirrors it in `src/auth/schema.js`.
Do not cross-import between tracks.

---

## Phase 1 current state (as of May 2026)

| Screen | Status | Notes |
|---|---|---|
| `scr_Home` | Built | Fleet status cards, bulletin feed, KPI tiles |
| `scr_ApprovalInbox` | Built | 4-button Adaptive Card mirror (Approve/Deny/Escalate/Return) |
| `scr_NewMXRequest` | Built | Universal submit form, 6 request types |
| `scr_RequestConfirm` | Built | Post-submit confirmation |
| `scr_AskLeadership` | Built | Question list + submit |
| `scr_AskDetail` | Built | Thread view; comments stored in `colComments` (local collection, Phase 2 moves to Dataverse) |
| `scr_Scheduler` | Built | 14-day Gantt grid using nested galleries |

**Extension tables built:** `cr_mx_request_comment` (Ask Leadership thread).
Comment body column: `cr_body` (Single line of text, 100 chars). Display name: `Body`.

**Known open issue:** `btn_PostComment` Dataverse Patch fails due to Power Apps
schema-cache holding a stale reference. Phase 1 ships with `colComments` local
collection as interim. See `Phase1/tables/cr_mx_request_comment.md` for full
diagnosis and Phase 2 resolution path.

---

## Key naming conventions

| Convention | Value |
|---|---|
| Publisher prefix | `cr_` |
| Solution name | `MXConnect` |
| Solution display name | `MX Connect` |
| Control prefixes | `scr_` screens · `gal_` galleries · `btn_` buttons · `lbl_` labels · `txt_` inputs · `dd_` dropdowns · `cnt_` containers |
| Global variable prefix | `var` |
| Collection prefix | `col` |
| Primary orange | `#FF6A00` |
| Header dark | `#1E1E1E` |
| Background | `#F5F5F7` |

---

## Where to start

1. Read `m365-solution/Phase1/runbook.md` — week-by-week deployment plan
2. Read `m365-solution/Phase1/build-walkthrough.md` — click-by-click table + flow construction
3. Read `m365-solution/Phase1/powerfx/canvas-app.md` — screen-by-screen canvas app build
4. Use `m365-solution/Phase1/powerfx/FIELD-MAP.md` when a formula error needs tracing

For Track B (React + Entra), see `src/auth/config.js` for the Entra app
registration wiring and `src/auth/tables.js` for Dataverse Web API table
clients. Both tracks target the same Dataverse environment — see
`docs/architecture-tracks.md` for the separation rules.
