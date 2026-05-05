# Phase 1 — Role Capability Matrix

> **⚠️ EXTENSION SCOPE — NOT canonical Phase 1.**
>
> This matrix (8 roles × 42 capabilities, sourced from MC Documentation
> v3 pages 3–5) describes the role-matrix expansion of MX Connect. It
> defines what's possible across the **8-module** canvas app, the
> **8-role** access model, and the **6 extension tables**.
>
> **Canonical Phase 1** is a much smaller scope:
> - 5 roles (`MXC AMT` / `MXC RMM` / `MXC Director` / `MXC QA` / `MXC Service`) — not 8
> - 8 canonical tables — not 14 (8 canonical + 6 extension)
> - 1 module (the MX Request submit + 4-decision approval workflow) —
>   not 8
>
> Pilot / PR / Scheduler / Payroll roles below are extension scope.
> The Pilot Training / Aircraft Movement (PR) / Ask Leadership / Safety
> Report submission types and their approval rules below are extension
> scope. The Bulletins, MX Tracking dashboards, and Status
> dashboards are extension scope.
>
> **Build per this matrix only if you've explicitly opted into the
> matrix-extension scope** (Week 9+ in `runbook.md`). For canonical
> Phase 1 follow `runbook.md` + `build-walkthrough.md` instead.

---

Source: MC Documentation v3 (pages 3–5). This is the canonical truth
for who can do what in MX Connect under the **matrix-extension scope**.
The Power Apps form, SharePoint group permissions (or Dataverse role
privileges), Power Automate routing, and dashboard visibility all
derive from this matrix.

**Legend:** ✓ Full Access · ✗ No Access · View Only · Part. =
Partial / region-only · — N/A

## Roles (8)

| Role          | App login | Notes                                                                 |
| ------------- | --------- | --------------------------------------------------------------------- |
| **AMT**       | Yes       | Aviation Maintenance Technician — primary submitter of MX work        |
| **RMM**       | Yes       | Regional Maintenance Manager — first-line approver, regional scope    |
| **Director**  | Yes       | Director of Maintenance Operations — escalation target, full org      |
| **QA**        | Yes       | Quality / ADOM — reviews most submissions; mirrors RMM on most rights |
| **Pilot**     | Yes       | Limited submitter (Ask Leadership, Safety, Pilot Training); no MX     |
| **Scheduler** | Yes       | MX + Crew schedulers — owns the schedule; approves PR + Pilot Trng    |
| **PR**        | Yes       | Public Relations — submits PR aircraft movement requests              |
| **Payroll**   | View only | Direct SharePoint filtered-view link; no full app login. Read-only.   |

## What each role can SUBMIT (page 3 of 9)

| Capability                                                   | AMT | RMM | Director | QA | Pilot | Scheduler | PR  | Payroll |
| ------------------------------------------------------------ | :-: | :-: | :------: | :-: | :--: | :-------: | :-: | :-----: |
| Submit Aircraft Status (In Service / AOG)                    | ✓   | ✓   | ✓        | ✓  | ✗    | ✗         | ✗   | ✗       |
| Submit Personnel Status (Available / Unavailable / Red)      | ✓   | ✓   | ✓        | ✓  | ✗    | ✗         | ✗   | ✗       |
| Submit MX Schedule Request                                   | ✓   | ✓   | ✓        | ✓  | ✗    | ✗         | ✗   | ✗       |
| Submit Ask Leadership Question                               | ✓   | ✓   | ✓        | ✓  | ✓    | ✓         | ✓   | ✓       |
| Submit Safety Report                                         | ✓   | ✓   | ✓        | ✓  | ✓    | ✓         | ✓   | ✓       |
| Submit Aircraft Movement Request                             | ✓   | ✓   | ✓        | ✓  | ✗    | ✓         | ✓   | ✗       |
| Submit Pilot Training Request                                | ✗   | ✗   | ✗        | ✗  | ✓    | ✗         | ✗   | ✗       |
| Request Time Off                                             | ✓   | ✓   | ✓        | ✓  | ✗    | ✗         | ✗   | ✗       |
| Post an Operational Bulletin (Alert / Advisory / Info)       | ✗   | ✓   | ✓        | ✓  | ✗    | ✗         | ✗   | ✗       |

## What each role can APPROVE OR ACT ON (page 4 of 9)

| Capability                                                   | AMT | RMM | Director | QA | Pilot | Scheduler | PR  | Payroll |
| ------------------------------------------------------------ | :-: | :-: | :------: | :-: | :--: | :-------: | :-: | :-----: |
| Approve MX Schedule Request                                  | ✗   | ✓   | ✓        | ✓  | ✗    | ✓         | ✗   | ✗       |
| Approve PR Aircraft Movement Request                         | ✗   | ✗   | ✓        | ✓  | ✗    | ✓         | ✗   | ✗       |
| Approve Pilot Training Request                               | ✗   | ✗   | ✗        | ✗  | ✗    | ✓         | ✗   | ✗       |
| Approve Employee Time Off Request                            | ✗   | ✓   | ✓        | ✓  | ✗    | ✗         | ✗   | ✗       |
| Deny Request with Written Reason                             | ✗   | ✓   | ✓        | ✓  | ✗    | ✓         | ✗   | ✗       |
| Return for More Information                                  | ✗   | ✓   | ✓        | ✓  | ✗    | ✓         | ✗   | ✗       |
| Escalate Ask or Safety to Director                           | ✗   | ✓   | ✗        | ✓  | ✗    | ✗         | ✗   | ✗       |
| Resolve and Archive Operational Bulletin                     | ✗   | ✓   | ✓        | ✓  | ✗    | ✗         | ✗   | ✗       |
| Permanently Delete from Bulletin Archive                     | ✗   | ✗   | ✓        | ✗  | ✗    | ✗         | ✗   | ✗       |
| Reassign Technician to Different Base                        | ✗   | ✓   | ✓        | ✗  | ✗    | ✗         | ✗   | ✗       |
| Create / Edit / Move / Delete MX Schedule Entries            | ✗   | ✗   | ✗        | ✗  | ✗    | ✓         | ✗   | ✗       |

## What each role can SEE (page 5 of 9)

| Capability                                                   | AMT | RMM     | Director | QA | Pilot | Scheduler | PR   | Payroll |
| ------------------------------------------------------------ | :-: | :-----: | :------: | :-: | :--: | :-------: | :--: | :-----: |
| Status Dashboard — Aircraft & Personnel                      | ✗   | ✓       | ✓        | ✓  | ✗    | ✗         | ✗    | ✗       |
| Schedule Dashboard with Countdown Timer                      | ✓   | ✓       | ✓        | ✓  | ✗    | ✓         | ✗    | ✗       |
| Ask Leadership Dashboard                                     | ✗   | ✓       | ✓        | ✓  | ✗    | ✗         | ✗    | ✗       |
| Safety Reports Dashboard                                     | ✗   | ✓       | ✓        | ✓  | ✗    | ✗         | ✗    | ✗       |
| PR & Pilot Requests Dashboard                                | ✗   | ✗       | ✓        | ✓  | ✗    | ✓         | ✗    | ✗       |
| Escalations Feed — Director Level                            | ✗   | ✗       | ✓        | ✗  | ✗    | ✗         | ✗    | ✗       |
| Operational Bulletin Feed — Read                             | ✓   | ✓       | ✓        | ✓  | ✓    | ✓         | ✓    | ✗       |
| Bulletin Archive — Read All Resolved                         | ✓   | ✓       | ✓        | ✓  | ✓    | ✓         | ✗    | ✗       |
| MX Tracking — Monthly Calendar View                          | ✓   | ✓       | ✓        | ✓  | View | ✓         | View | ✗       |
| MX Tracking — Weekly Gantt View                              | ✓   | ✓       | ✓        | ✓  | View | ✓         | View | ✗       |
| MX Tracking — Upcoming Inspections Chart                     | ✓   | ✓       | ✓        | ✓  | View | ✓         | View | ✗       |
| MX Tracking — Aircraft / Base / Region Filters               | ✓   | ✓       | ✓        | ✓  | ✓    | ✓         | ✓    | ✗       |
| MX Tracking — Save Filter Preferences                        | ✓   | ✓       | ✓        | ✓  | ✓    | ✓         | ✓    | ✗       |
| My Team — On Call Now with Call & Text                       | ✓   | ✓       | ✓        | ✓  | ✗    | ✓         | ✗    | View    |
| My Team — Tech List by Region                                | ✓   | ✓       | ✓        | ✓  | ✗    | ✓         | ✗    | View    |
| My Team — Weekly Gantt Coverage View                         | ✓   | ✓       | ✓        | ✓  | ✗    | ✓         | ✗    | ✗       |
| My Team — Monthly Regional Gantt View                        | ✓   | ✓       | ✓        | ✓  | ✗    | ✓         | ✗    | ✗       |
| Multi-Region Filter — Select Multiple Regions                | ✓   | ✓       | ✓        | ✓  | ✗    | ✓         | ✗    | ✗       |
| Full Visibility Across All Regions                           | ✗   | Part.   | ✓        | ✓  | ✗    | ✓         | ✗    | ✗       |
| Document Library — Browse & Download                         | ✓   | ✓       | ✓        | ✓  | ✓    | ✓         | ✓    | ✗       |
| Document Library — Upload & Manage                           | ✗   | ✓       | ✓        | ✓  | ✗    | ✓         | ✗    | ✗       |
| On Shift / Off Shift Toggle                                  | ✓   | ✓       | ✓        | ✓  | ✗    | ✓         | ✗    | ✗       |

## How this maps to Dataverse security (extension scope)

Under canonical Phase 1, only 5 of these roles exist as Dataverse
roles. The full 8-role mapping for matrix-extension scope:

| Role             | Dataverse role name                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| AMT              | `MXC AMT` (canonical)                                                                                       |
| RMM              | `MXC RMM` (canonical)                                                                                       |
| Director         | `MXC Director` (canonical)                                                                                  |
| QA               | `MXC QA` (canonical)                                                                                        |
| Pilot            | `MXC Pilot` (extension)                                                                                     |
| Scheduler        | `MXC Scheduler` (extension)                                                                                 |
| PR               | `MXC PR` (extension)                                                                                        |
| Payroll          | `MXC Payroll` (extension; effectively no app login — Power BI / Dataverse view link only)                  |

## How this maps to Power Automate routing

The `mxr-approval-flow-v2` flow branches on the `cr_routing` Choice
column. Under canonical scope it has 2 values; under extension scope
it gains a 3rd:

| Submission                  | Default approver                    | Routing value (canonical / extension)            |
| --------------------------- | ----------------------------------- | ------------------------------------------------ |
| Phase Inspection / Repair / Overhaul / Open Shift | RMM (regional)    | RMM (canonical)                                  |
| Time Off                    | RMM (regional)                      | RMM (canonical)                                  |
| AOG (priority)              | Director                            | Director (canonical — forced by Priority=AOG)    |
| Aircraft Movement (PR)      | Scheduler                           | Scheduler (extension)                            |
| Pilot Training Request      | Scheduler                           | Scheduler (extension)                            |
| Ask Leadership              | Director                            | Director (extension request type)                |
| Safety Report               | RMM regional / Director on escalate | (separate `safety-report-triage-flow` — extension) |
| Aircraft Status / Personnel Status / Operational Bulletin Post | (write-through — no approval) | n/a (extension write-through tables) |

Decision actions on every approval card (canonical 4):

```
[ Approve ]  [ Deny — write reason ]  [ Return — ask for more info ]  [ Escalate to Director ]
```

All 4 are wired in `mxr-approval-flow-v2`.

## Companion docs

- `application-modules.md` — the 8-module breakdown from page 6 (also extension scope)
- `runbook.md` — canonical Phase 1 deployment runbook
- `connections.md` — 5 canonical Dataverse roles + 4 extension roles
- `tables/cr_*.md` — Dataverse table specs (8 canonical + 7 extension)
