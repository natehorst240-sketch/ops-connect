# Phase 1 Dataverse Tables — Index

All tables for the Phase 1 build, named with the `cr_` publisher prefix
(replace with your tenant prefix — likely `ihc_`). Each table has a
companion `.md` file with column-by-column specs.

> **All names below conform to `../NAMING-CONVENTIONS.md`.** Personnel
> tables use a regular hyphen (`Personnel - Maintenance`), not an em
> dash. Schema names are singular (`cr_mx_request`), Power Fx
> formulas reference plural display names (`'MX Requests'`).

## Build order

Dataverse forces you to build referenced tables before the tables that
reference them. Build in this order:

1. **`cr_region`** — lookup. No dependencies.
2. **`cr_aircraft_type`** — lookup. No dependencies.
3. **`cr_base`** — lookup. References `cr_region`.
4. **`cr_aircraft`** — master. References `cr_aircraft_type`, `cr_base`, `cr_region`, `systemuser`.
5. **`cr_personnel_maintenance`** — master. References `cr_region`, `cr_base`, `systemuser`.
6. **`cr_personnel_crew`** — master (Phase 2 prep). References `cr_region`, `cr_base`, `systemuser`.
7. **`cr_mx_request`** — PRIMARY (flow trigger). References `cr_aircraft`, `cr_base`, `systemuser`.
8. **`cr_audit`** — audit log. References `systemuser`.
9. **`cr_operational_bulletin`** — bulletins. References `cr_region`, `systemuser`.
10. **`cr_safety_report`** — safety. References `cr_region`, `cr_base`, `cr_aircraft`, `systemuser`.
11. **`cr_aircraft_status_log`** — status history. References `cr_aircraft`, `systemuser`.
12. **`cr_personnel_status_log`** — status + reassignment history. References `cr_personnel_maintenance`, `systemuser`.
13. **`cr_mx_request_comment`** — Ask Leadership thread. References `cr_mx_request`, `systemuser`.
14. **`cr_user_filter_pref`** — saved filters. No table refs (per-user).
15. **`cr_schedule_event`** — approved-MX mirror. References `cr_mx_request`, `cr_aircraft`, `systemuser`.

## Table index

| #  | Schema name                  | Display name (singular)    | Module(s)                                  | Has flow writes? |
| -- | ---------------------------- | -------------------------- | ------------------------------------------ | ---------------- |
| 1  | `cr_region`                  | Region                     | (lookup)                                   | No               |
| 2  | `cr_aircraft_type`           | Aircraft Type              | (lookup)                                   | No               |
| 3  | `cr_base`                    | Base                       | (lookup)                                   | No               |
| 4  | `cr_aircraft`                | Aircraft                   | Status, MX Tracking, Schedule MX           | Yes (status)     |
| 5  | `cr_personnel_maintenance`   | Personnel - Maintenance    | My Team, Status                            | Yes (status)     |
| 6  | `cr_personnel_crew`          | Personnel - Crew           | My Team (Phase 2)                          | No (Phase 1)     |
| 7  | `cr_mx_request`              | MX Request                 | Schedule MX, Ask Leadership, Time Off, etc. | **Yes — trigger** |
| 8  | `cr_audit`                   | MX Audit                   | (compliance)                               | Yes (write-only)  |
| 9  | `cr_operational_bulletin`    | Operational Bulletin       | Bulletins                                  | Yes              |
| 10 | `cr_safety_report`           | Safety Report              | Safety Report                              | Yes              |
| 11 | `cr_aircraft_status_log`     | Aircraft Status Log        | Status                                     | Yes (write-only)  |
| 12 | `cr_personnel_status_log`    | Personnel Status Log       | Status, My Team                            | Yes (write-only)  |
| 13 | `cr_mx_request_comment`      | MX Request Comment         | Ask Leadership                             | Yes              |
| 14 | `cr_user_filter_pref`        | User Filter Preference     | MX Tracking                                | No (canvas only) |
| 15 | `cr_schedule_event`          | Schedule Event             | MX Tracking, My Team Gantt                 | Yes              |

Display names are **singular**. Power Apps auto-generates the plural
form for collection contexts (the data pane, formulas like
`Filter('MX Requests', ...)`).

## Why Dataverse over SharePoint Lists

We pivoted to Dataverse-from-day-one for Phase 1 once Dataverse capacity
became available in the dev tenant. Wins:

- **Cleaner security model** — row-level + business-unit-scoped roles
  beat SharePoint groups + item-level rules. RMM regional visibility
  comes free via business unit hierarchy.
- **Native lookups** — no `_x0020_` encoded column names, no LookupId
  gymnastics, fast joins.
- **`pac solution export`** — tables move with the solution to UAT/Prod
  in one shot. SharePoint Lists need separate per-environment provisioning.
- **Person/Group fields** — native `systemuser` lookups; no opaque claims
  string parsing.
- **Audit ergonomics** — Dataverse built-in audit catches every column
  change automatically; `cr_audit` only needs to capture business events
  with the *why* attached.
- **API performance** — OData filters across millions of rows; SharePoint
  Lists hit the 5K view threshold at scale.

## Solution import order

When importing the solution to a clean environment:

1. Import the `MXConnect` solution (contains all 15 tables, the flow,
   the canvas app, and the connection references).
2. Set environment variables (see `../runbook.md` § Environment variables).
3. Map connection references (see `../connections.md`).
4. Turn on the flow.
5. Share the canvas app with the Entra group `MXC App Users`.

## Companion docs

- `../NAMING-CONVENTIONS.md` — **canonical naming reference**
- `../roles-capability-matrix.md` — 8 roles × 42 capabilities (source of truth)
- `../application-modules.md` — 8-module breakdown
- `../runbook.md` — week-by-week deployment runbook
- `../connections.md` — connection references + Dataverse roles
- `../powerfx/canvas-app.md` — canvas app build guide
- `../flows/mxr-approval-flow-v2.json` — Power Automate flow JSON
- `../build-walkthrough.md` — manual click-by-click build
- `../copilot-prompts.md` — chunked AI prompts (use sparingly)
- `../rebuild-from-clean-state.md` — recovery if publisher leaked
