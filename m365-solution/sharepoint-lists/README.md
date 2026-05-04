# ops-connect SharePoint Lists — production-ready import package

Built from the IHC **Master Base Mechanic Contact List** + **Aircraft
Information** + **Connect | Protean Connect** roster. All seed data is real.

This is the **Phase 1 data layer** for ops-connect. Phase 2 upgrades to
Dataverse (specs in `../Phase1/tables/*.md` and `../Phase2/tables.md`).

## Why SharePoint Lists for Phase 1

- No per-user Power Apps Premium licensing tax (Dataverse needs it; Lists
  don't)
- IHC IT already owns SharePoint — no new platform to operate
- Power Automate works fine against the SharePoint connector
- Lookup, Choice, Person/Group, and Date columns all native
- Soft cap ~5,000 items per list — well above IHC scale for everything
  except `Audit Log` and `Schedule Events`, which need archival rotation
  in year 2–3 (Phase 2 cleanup task, not a Phase 1 blocker)

## What's here

| # | List | Purpose | Phase | Roughly |
| - | ---- | ------- | ----- | ------- |
| 1 | Regions          | Lookup       | All | 12 rows  |
| 2 | Bases            | Lookup       | All | 44 rows  |
| 3 | Aircraft Types   | Lookup       | All | 19 rows  |
| 4 | Aircraft         | Fleet roster | 1+  | 61 rows (real fleet) |
| 5 | Personnel — Maintenance | Mechanics + RMMs + DOM + Supervisors + QA + Parts + Schedulers | 1+ | ~120 rows |
| 6 | Personnel — Crew | Pilots + Nurses + Paramedics + RTs + Ops Control + Coordinators | 1+ | ~250 rows |
| 7 | MX Requests      | Phase 1 hero | 1   | Schema + 4 seed rows  |
| 8 | Audit Log        | Compliance   | 1   | Schema + 4 seed rows  |
| 9 | Schedule Events  | Phase 2 mirror of CompleteFlight + ProteanHub | 2 | Schema + 3 seed rows  |
| 10 | Fleet Positions  | Phase 2 SkyRouter | 2 | Schema + 3 seed rows  |
| 11 | Conflicts        | Phase 2 cross-system flags | 2 | Schema + 2 seed rows  |

## Source-data cleanup notes

The source rosters had a few inconsistencies we cleaned up:

- `Hickery, NC` → `Hickory, NC`
- `Rockhill, SC` → `Rock Hill, SC`
- `Cedary City, UT` (typo in one row) → `Cedar City, UT`
- Several mechanic entries duplicated rows for the same person across
  multiple bases — the Personnel list dedupes by email and tracks
  coverage as a multi-base field
- Sean Brown is listed as `SUPERVISOR` on the mechanic list and `RMM` on
  the aircraft list — treated as PAGE RMM

## Import order (do not skip steps)

1. **Lookups first**: Regions → Bases → Aircraft Types
2. **Master data**: Aircraft → Personnel — Maintenance → Personnel — Crew
3. **Operational**: MX Requests → Audit Log → Schedule Events → Fleet Positions → Conflicts

### Per-list import procedure

1. Save the CSV locally
2. Open in Excel → Insert → Table (Ctrl+T) with "My table has headers"
3. Save As `.xlsx`
4. SharePoint site → New → List → From Excel → upload, pick the table
5. SharePoint will infer column types from the seed rows

### Post-import wiring (mandatory)

After all lists are imported, convert text-based reference columns to
Lookup or Person columns:

| List | Column | Type after import | Pointing at | Show field |
| ---- | ------ | ----------------- | ----------- | ---------- |
| Bases | Primary Region | Lookup | Regions | Title |
| Aircraft | Type | Lookup | Aircraft Types | Title |
| Aircraft | Base | Lookup | Bases | Title |
| Aircraft | Region | Lookup | Regions | Title |
| Aircraft | RMM | Person/Group | (Entra) | — |
| Personnel — Maintenance | Region | Lookup | Regions | Title |
| Personnel — Maintenance | Primary Base | Lookup | Bases | Title |
| Personnel — Maintenance | Leader | Person/Group | (Entra) | — |
| Personnel — Crew | (similar) | (similar) | (similar) | — |
| MX Requests | Aircraft Tail | Lookup | Aircraft | Tail |
| MX Requests | Base | Lookup | Bases | Title |
| MX Requests | Requested By | Person/Group | (Entra) | — |
| MX Requests | Approver | Person/Group | (Entra) | — |
| Schedule Events | Aircraft Tail | Lookup | Aircraft | Tail |
| Fleet Positions | Tail | Lookup | Aircraft | Tail |

### Choice columns

SharePoint inferred choice values from seed rows. After import, edit each
Choice column and lock the choice list. Per-list choice constraints
documented in column headers / seed comments.

## Power Automate flow note

The Power Automate flow JSON in `../Phase1/flows/mxr-approval-flow-v2.json`
was authored against the **Dataverse** connector. For Phase 1 on SharePoint
Lists, that flow needs reauthoring with **SharePoint connector** actions
(`Get items`, `Create item`, `Update item`, trigger `When an item is
created` on `MX Requests`). Same logic, different bindings. Re-author in
Power Automate Studio against the new lists. Keep the Dataverse-version
JSON as the Phase 2 upgrade reference.

## Phase 2 upgrade path (when ready)

1. Stand up Dataverse tables per `../Phase1/tables/*.md` and
   `../Phase2/tables.md` specs (cr_mx_request, cr_audit, cr_aircraft,
   cr_schedule_event, cr_fleet_position, cr_conflict)
2. Migrate data: a Power Automate flow that walks each SharePoint List
   and creates the matching Dataverse rows
3. Repoint canvas app data sources from SharePoint connector to Dataverse
4. Rewire Power Automate flows to use Dataverse actions (the
   `mxr-approval-flow-v2.json` shape is the target)
5. Apply Dataverse security roles for RLS by region
6. Decommission SharePoint Lists once Dataverse is verified

Migration is straightforward because the schemas align column-for-column.
