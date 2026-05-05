# Phase 1 Dataverse Tables — Index

The data layer is **11 canonical tables** (8 Phase 1 + 3 Phase 2) plus
**7 extension tables** (added during the role-capability-matrix expansion;
not validated against canonical IHC data; build only if you opt into
extension scope).

The canonical truth is the populated CSVs in
`m365-solution/sharepoint-lists/`. Each spec doc derives from that CSV
verbatim — if the CSV says "NC Region" then the spec says "NC Region",
not "NC".

---

## Canonical tables (11)

### Phase 1 canonical (build first — 8 tables)

These map 1:1 to populated CSVs in `../../sharepoint-lists/`. Real IHC
data, ready to import.

| #  | Schema name                  | Display name              | CSV file                          | Rows  |
| -- | ---------------------------- | ------------------------- | --------------------------------- | ----- |
| 1  | `cr_region`                  | Region                    | `01-regions.csv`                  | 12    |
| 2  | `cr_aircraft_type`           | Aircraft Type             | `03-aircraft-types.csv`           | 19    |
| 3  | `cr_base`                    | Base                      | `02-bases.csv`                    | 44    |
| 4  | `cr_aircraft`                | Aircraft                  | `04-aircraft.csv`                 | 61    |
| 5  | `cr_personnel_maintenance`   | Personnel - Maintenance   | `05-personnel-maintenance.csv`    | ~85   |
| 6  | `cr_personnel_crew`          | Personnel - Crew          | `11-personnel-crew.csv`           | 0 (header only — Phase 2 populates) |
| 7  | `cr_mx_request`              | MX Request                | `06-mx-requests.csv`              | 6 seed |
| 8  | `cr_audit`                   | MX Audit                  | `07-audit-log.csv`                | 5 seed |

### Phase 2 canonical (defer until external connectors land — 3 tables)

These also have populated CSVs but require the CompleteFlight /
ProteanHub / SkyRouter custom connectors. Build when those land, not
in Phase 1.

| #  | Schema name                  | Display name              | CSV file                          | Rows  |
| -- | ---------------------------- | ------------------------- | --------------------------------- | ----- |
| 9  | `cr_schedule_event`          | Schedule Event            | `08-schedule-events.csv`          | 5 seed |
| 10 | `cr_fleet_position`          | Fleet Position            | `09-fleet-positions.csv`          | 8     |
| 11 | `cr_conflict`                | Conflict                  | `10-conflicts.csv`                | 3 seed |

## Extension tables (7) — NOT in canonical CSVs

Added during the role-capability-matrix expansion (MC Doc v3). No
canonical seed data exists. Each spec has an **EXTENSION** banner at
the top.

**Build these only if you've opted into the role-matrix scope.** The
canonical 11 cover the documented IHC requirements as-of the CSVs.

| Schema name                  | Display name              | Module(s)                  | Status               |
| ---------------------------- | ------------------------- | -------------------------- | -------------------- |
| `cr_operational_bulletin`    | Operational Bulletin      | Bulletins                  | Extension (no CSV)   |
| `cr_safety_report`           | Safety Report             | Safety Report              | Extension (no CSV)   |
| `cr_aircraft_status_log`     | Aircraft Status Log       | Status                     | Extension (no CSV)   |
| `cr_personnel_status_log`    | Personnel Status Log      | Status + My Team           | Extension (no CSV)   |
| `cr_mx_request_comment`      | MX Request Comment        | Ask Leadership thread      | Extension (no CSV)   |
| `cr_user_filter_pref`        | User Filter Preference    | MX Tracking saved filters  | Extension (no CSV)   |

`cr_mx_request` itself has a few **extension columns** for the role
matrix (`cr_decision`, `cr_decision_reason`, `cr_more_info_request`,
`cr_comments_count`, `cr_anonymous`, `cr_audience`). Those are flagged
in `cr_mx_request.md`. Skip them for canonical Phase 1.

---

## Build order (canonical Phase 1 only)

Dataverse forces you to build referenced tables before the tables that
reference them:

1. **`cr_region`** — no dependencies
2. **`cr_aircraft_type`** — no dependencies
3. **`cr_base`** — references `cr_region` (free-text in Phase 1; Lookup in Phase 2)
4. **`cr_aircraft`** — references `cr_aircraft_type`. Base / Region / RMM kept as Text in canonical Phase 1 because the CSV has non-Lookup-compatible values (`Spare`, `Unassigned`, `NC Region (TBD)`, `WI Region (TBD)`, `—`). Phase 2 cleans up.
5. **`cr_personnel_maintenance`** — Region / Primary Base / Leader kept as Text for the same reason (CSV has `ALL`, `Rover`, name strings)
6. **`cr_personnel_crew`** — header-only; Phase 2 populates from external rosters
7. **`cr_mx_request`** — references `cr_aircraft`, `cr_base`. Requested By + Approver as Text (CSV stores names)
8. **`cr_audit`** — Actor as Text (CSV stores names + `System`)

That's the canonical 8. Stop here for the first deploy.

When you're ready for Phase 2 (external connectors):

9. **`cr_schedule_event`** — external-system mirror, service-account writes
10. **`cr_fleet_position`** — SkyRouter live positions, 1-minute upsert
11. **`cr_conflict`** — cross-system flags, detector-flow lifecycle

---

## Naming conventions in use

| Concept                       | Convention                                            | Example                          |
| ----------------------------- | ----------------------------------------------------- | -------------------------------- |
| Schema name                   | Singular `cr_*` snake_case                            | `cr_mx_request`                  |
| Display name (table)          | Singular Title Case                                   | `MX Request`                     |
| Plural display name           | Auto-pluralized by Power Apps                         | `MX Requests`                    |
| Personnel separator           | Regular hyphen with spaces                            | `Personnel - Maintenance`        |
| Power Fx table reference      | Quoted plural display                                 | `'MX Requests'`                  |
| Choice option labels          | Title Case with spaces (canonical CSV)                | `In Service`, `More Info Requested` |
| Action enum labels            | Lowercase dot-notation (event-style)                  | `mx_request.submitted`           |
| Audit Subject Table value     | Plural display name (per CSV)                         | `MX Requests` (not `cr_mx_request`) |
| Audit Subject ID value        | Request number string (per CSV)                       | `MXR-00001` (not GUID)           |

---

## Why Dataverse over SharePoint Lists

We pivoted to Dataverse-from-day-one for Phase 1 once Dataverse capacity
became available in the dev tenant. Wins:

- **Cleaner security model** — row-level + business-unit-scoped roles
  beat SharePoint groups + item-level rules. RMM regional visibility
  comes free via business unit hierarchy.
- **Native lookups** — no `_x0020_` encoded column names.
- **`pac solution export`** — tables move with the solution to UAT/Prod
  in one shot.
- **Audit ergonomics** — Dataverse built-in audit catches every column
  change automatically.

The CSVs in `m365-solution/sharepoint-lists/` were originally authored
for a SharePoint variant; they remain canonical because the schema is
identical between the two backings. Only the connector type differs.

---

## Companion docs

- `../runbook.md` — week-by-week deployment runbook
- `../connections.md` — connection references + Dataverse roles
- `../build-walkthrough.md` — manual click-by-click build
- `../powerfx/canvas-app.md` — canvas app build guide
- `../flows/mxr-approval-flow-v2.json` — Power Automate flow JSON (extension scope: 4-decision Switch)
- `../rebuild-from-clean-state.md` — recovery if Plan mode poisoned the publisher
- `../../sharepoint-lists/` — **canonical CSV truth** (all 11 populated tables)
- `../../sharepoint-lists/README.md` — CSV import instructions for SharePoint variant (deprecated for new builds)
