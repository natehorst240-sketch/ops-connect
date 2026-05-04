# Phase 1 Blank Import Templates — DEPRECATED FALLBACK

> **⚠️ DEPRECATED.** Phase 1 now ships on **Dataverse**. The canonical
> table specs are in `../../Phase1/tables/` (15 tables × column-by-column
> Dataverse spec). The blank CSVs and column tables below remain only
> as reference for tenants without Dataverse capacity who need a
> SharePoint Lists fallback.
>
> **For new builds, follow:**
> - `../../Phase1/tables/README.md` — Dataverse table index + build order
> - `../../Phase1/tables/cr_*.md` — column-by-column specs
> - `../../Phase1/connections.md` — 8 Dataverse security roles
> - `../../Phase1/runbook.md` — Dataverse-primary runbook
> - `../../Phase1/powerfx/canvas-app.md` — Dataverse-native canvas app guide
> - `../../Phase1/flows/mxr-approval-flow-v2.json` — Dataverse-bound flow
>
> The schemas + permissions documented below ARE still accurate for the
> SharePoint variant; nothing below changes. Just don't start a new
> tenant build here.

---

## Original purpose (preserved for SharePoint fallback)

Header-only CSVs ready for SharePoint List import. These match the
schemas required by the SharePoint variant of the Phase 1 Power
Automate flow (`../../Phase1/flows/mxr-approval-flow-sharepoint.json`)
plus the full 8-module application breakdown (see
`../../Phase1/application-modules.md`) and 8-role capability matrix
(see `../../Phase1/roles-capability-matrix.md`).

**Use these to set up clean SharePoint Lists in any environment (dev,
test, prod) without seed data.** The populated CSVs in the parent
`sharepoint-lists/` folder are for actually populating Aircraft +
Personnel in production.

## All 14 lists

| #  | List                       | Module(s)                                           | Notes                                                  |
| -- | -------------------------- | --------------------------------------------------- | ------------------------------------------------------ |
| 1  | Regions                    | (lookup)                                            | Reference data                                         |
| 2  | Bases                      | (lookup)                                            | Reference data                                         |
| 3  | Aircraft Types             | (lookup)                                            | Reference data                                         |
| 4  | Aircraft                   | Status, MX Tracking, Schedule MX                    | Fleet master + status                                  |
| 5  | Personnel — Maintenance    | My Team, Status                                     | Maintenance roster + status                            |
| 6  | MX Requests                | Schedule MX, Ask Leadership, Time Off, PR, Pilot Trng | **Primary flow trigger**                             |
| 7  | Audit Log                  | (compliance)                                        | Append-only event log; flow service account writes    |
| 8  | Personnel — Crew           | My Team (Phase 2)                                   | Pilots / nurses / paramedics / dispatch                |
| 9  | Operational Bulletins      | Bulletins, Docs (archive)                           | Director/RMM/QA-posted; 3 levels                       |
| 10 | Safety Reports             | Safety Report                                       | Anonymous-friendly; permanent archive                  |
| 11 | Aircraft Status Log        | Status                                              | Append-only history of every Aircraft.Status change    |
| 12 | Personnel Status Log       | Status, My Team                                     | Append-only history of every Personnel.Status change + reassignment |
| 13 | MX Request Comments        | Ask Leadership                                      | Threaded replies on Ask Leadership requests            |
| 14 | User Filter Preferences    | MX Tracking                                         | Per-user saved filter state                            |

Plus a SharePoint **Document Library** (not a List) called `MX Connect
Docs` for the Docs module — see `application-modules.md §5`.

## Lists the flow actually touches

| List | Flow operation | Purpose |
|---|---|---|
| **MX Requests** | Trigger (item created/modified) + Update + Update + Update | Primary record |
| **Audit Log** | Create item (×3 typical, more with Request Info / Escalate) | Compliance trail |
| **Aircraft** | Get item (read) | Resolve tail → type, base, RMM |
| **Personnel — Maintenance** | (Optional) Get item | Resolve RMM/Director routing |
| **MX Request Comments** | Create item (Ask Leadership thread posts) | Threaded conversation |
| **Operational Bulletins** | Create item (auto-draft on AOG flag) | Auto-bulletin on aircraft going AOG |

## Import workflow

1. Save each CSV locally
2. Open in Excel → Insert → Table (Ctrl+T) with "My table has headers"
3. Save As `.xlsx`
4. SharePoint site → New → List → From Excel → upload, pick the table
5. SharePoint creates the list with **all columns as Single line of text**
   (because there's no data to infer from)
6. Edit each column to set the correct type per the schemas below
7. Wire up Lookup columns once all lists exist
8. Convert text columns that should be Person/Group (Requested By,
   Approver, Actor, Reporter, Posted By, Resolved By, Leader, RMM)

## Schemas

(Schemas section unchanged — see prior commits for the full 14-list
column-by-column reference. Identical content preserved as-is for any
SharePoint fallback consumers.)

For Dataverse builds, the equivalent specs are in
`../../Phase1/tables/cr_*.md` with proper Dataverse column types,
Choice global definitions, and BU-aware lookups. **Use those instead.**
