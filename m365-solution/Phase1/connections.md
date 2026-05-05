# Phase 1 Solution — Connection References + Dataverse Roles

Phase 1 ships on **Dataverse** as the data layer.

## Connection references — three connectors

| Logical name             | Connector              | Purpose                                                                |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------- |
| `cr_DataverseConnection` | Microsoft Dataverse    | Read trigger row, write request status updates, write `cr_audit` rows  |
| `cr_TeamsConnection`     | Microsoft Teams        | Post Adaptive Card to RMM or Director channel; DM the requestor        |
| `cr_OutlookConnection`   | Office 365 Outlook     | Create calendar event on approval; email Director on escalation        |

Each must be re-authenticated per environment after solution import.

---

## Dataverse security roles — canonical 5

Each role becomes a custom Dataverse security role inside the
`MXConnect` solution. Membership is managed via Entra ID groups synced
into Dataverse Teams (recommended) or direct user assignment.

The canonical Phase 1 build needs **5 roles**: AMT, RMM, Director, QA,
plus a Service account role for the flow's identity. Pilot / PR /
Scheduler / Payroll roles are extension scope (required only if you
opt into the role-matrix expansion — see `roles-capability-matrix.md`).

| Role             | Members (per canonical CSV)                                            | Privilege summary                                                                                       |
| ---------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `MXC AMT`        | All AMTs + AMT (Rover) + Supervisors + Parts (~73 per CSV)             | Create + Read (own) on `cr_mx_request`. Read on Aircraft / Personnel / Bases / Regions / Aircraft Types. Append-To `cr_audit`. |
| `MXC RMM`        | Regional Maintenance Managers (8 distinct per CSV)                     | Read+Write (BU) on `cr_mx_request`. Read+Write (BU) on `cr_aircraft.cr_status` for status changes. Append-To `cr_audit`. Read elsewhere. |
| `MXC Director`   | DOMs + Senior Director Aviation Operations (4 per CSV: Ryan Taul, Pete Robotham, Billy Ortega, Jared Thompson) | Read+Write (Org) on `cr_mx_request`. Read (Org) on all canonical tables including `cr_audit`. |
| `MXC QA`         | QA + QA Manager (3 per CSV: Taylor Sermon, Edwin Meza, Joe Sparto)     | Read+Write (Org) on `cr_mx_request`. Append-To `cr_audit`. Read (Org) `cr_audit` for compliance review.  |
| `MXC Service`    | Service account (`mx-service@ihc.org`) — the flow's identity           | Read+Write+Create on every Phase 1 table; no Delete. Used by the flow for all its writes.               |

### Privilege levels (Dataverse)

| Level     | Meaning                                                   |
| --------- | --------------------------------------------------------- |
| None      | No access.                                                |
| User      | Self only (rows where `ownerid` = current user).          |
| BU        | Business Unit (current user's BU).                        |
| Parent: Child BU | User's BU + all descendant BUs.                    |
| Org       | All rows in the org.                                      |

### Per-table privilege grid — canonical 8 Phase 1 tables

This is the matrix to fill in when you create each role. Each cell is a
Dataverse privilege level (None / User / BU / Org). Append-To means
"can write rows that reference this table" without granting Read.

| Table                          | AMT          | RMM          | Director  | QA         | Service     |
| ------------------------------ | ------------ | ------------ | --------- | ---------- | ----------- |
| `cr_mx_request`                | User (C/R/U) | BU (C/R/U)   | Org (R/U) | Org (R/U)  | Org (C/R/U) |
| `cr_audit`                     | App-To       | App-To       | Org (R)   | Org (R/App-To) | Org (C/R) |
| `cr_aircraft`                  | Org (R)      | BU (R/U-status) | Org (R/U) | Org (R/U) | Org (R/U)  |
| `cr_personnel_maintenance`     | Org (R)      | BU (R/U)     | Org (R/U) | Org (R/U)  | Org (R/U)   |
| `cr_personnel_crew`            | Org (R)      | Org (R)      | Org (R/U) | Org (R/U)  | Org (R/U)   |
| `cr_aircraft_type` / `cr_base` / `cr_region` (lookup tables) | Org (R) | Org (R) | Org (R/U) | Org (R) | Org (R/U) |

C = Create, R = Read, U = Update, D = Delete. App-To = Append-To
privilege.

> **Phase 2 + extension tables not shown in this grid.** When you add
> Phase 2 (`cr_schedule_event` / `cr_fleet_position` / `cr_conflict`)
> or extension tables (`cr_operational_bulletin` / `cr_safety_report` /
> etc.), add new rows here with their privilege levels. The 6 extension
> tables also typically require the 4 extension roles
> (Pilot / PR / Scheduler / Payroll) — see the extension roles section
> below.

### How to create a role

```
Power Apps Studio → Solutions → MXConnect → + New → Security role
   Name:               MXC RMM
   Business unit:      (root or per-region)
   For each table:     Click the privilege circles up to the right level
   Save
```

`pac` CLI alternative:

```bash
pac auth select --name dev-environment
pac admin assign-role --role "MXC RMM" --user nathan.horstmeier@ihc.org
```

---

## Business unit hierarchy for regional scoping

The cleanest way to give RMMs regional visibility without per-record
sharing is via Dataverse business unit hierarchy. Use the **canonical
12 region names** from `01-regions.csv`:

```
ihc.org (root BU)
├── 109 UT
├── CO/NM
├── ID/NV
├── NC Region
├── PAGE
├── SLC
├── SLC FW
├── UT/AZ
├── WI Region
├── WOODSCROSS
├── WY/MT
└── RW Rover
```

Names match the canonical CSV exactly — `NC Region` not `NC`, `SLC`
not `OFFICE`, `RW Rover` not `ROVERS`. Don't invent variants.

Each user belongs to one BU (their region). When the RMM role is
defined with **BU** privilege on `cr_mx_request`, RMMs see only their
own region's rows automatically. Director / QA use **Org** for full
visibility.

This is the single biggest argument for Dataverse over SharePoint Lists
for Phase 1: regional scoping comes free, no per-record sharing or
item-level permission rules.

---

## Service-account auth

**Strongly recommended: a dedicated service account** (e.g.,
`mx-service@ihc.org`). The flow posts to Teams as this identity, which
is preferable to a human's name showing up on every approval card.

Service account requirements:
- Power Apps **Per-User** Premium license (or org buys Per-App)
- Dataverse **System User** with the `MXC Service` security role
  (Org-level Read+Write+Create on every Phase 1 table; no Delete)
- Teams membership in the IHC Life Flight Team
- Mailbox (for the Outlook calendar + escalation emails)

**Avoid: tying connection references to a person's M365 account.** When
that person leaves or their license changes, every flow tied to that
identity stops working until reauthenticated. Service accounts are
stable.

---

## How to set up

### 1. Create connections (per environment)

In `Power Platform admin center > Environment > Connections`:

- Add **Microsoft Dataverse** — sign in as the service account.
- Add **Microsoft Teams** — same service account.
- Add **Office 365 Outlook** — sign in as the calendar owner (e.g.,
  the `Logan MX Calendar` owner).

### 2. Map connection references

```
Solutions > MXConnect > Connection references > [each ref] > Edit
   Connection: pick the matching connection from step 1
```

### 3. Assign security roles

```
Power Platform admin center > Environment > Settings > Users + permissions > Security roles
   → MXC AMT      → assign Entra group "MXC AMT" (all AMTs + Supervisors + Parts)
   → MXC RMM      → assign Entra group "MXC RMM" (regional RMMs, BU-scoped)
   → MXC Director → assign Entra group "MXC Director" (DOMs + Senior Director)
   → MXC QA       → assign Entra group "MXC QA" (QA + QA Manager)
   → MXC Service  → assign mx-service@ihc.org directly
```

### 4. Turn on the flow

Flows are imported in the **off** state. Toggle on:

```
Solutions > MXConnect > mxr-approval-flow-v2 > Turn on
```

---

## DLP impact

All canonical connectors (Dataverse, Teams, Office 365 Outlook) are
Microsoft-owned and live in the **Business** classification by default,
so the flow won't trip a DLP boundary in standard tenants. Confirm
with IHC IT before Phase 1 prod rollout.

---

## Extension roles (NOT canonical) — only build if opting into role matrix

The role-capability-matrix expansion (MC Doc v3) defines 4 additional
roles required for the 8-module canvas app (Bulletins, Safety Reports,
Status modules, etc.). Don't build these for canonical Phase 1.

| Role             | Members                                | Privilege summary                                                                                       |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `MXC Pilot`      | Active pilots                          | Create+Read (own) on `cr_mx_request` for Pilot Training + Ask Leadership types. Read MX Tracking.       |
| `MXC Scheduler`  | MX + Crew schedulers (Carla Weir, Rachel Williams per CSV) | Full Control on `cr_schedule_event`. Read+Write (Org) on `cr_mx_request` for PR Movement / Pilot Training. |
| `MXC PR`         | Public Relations team                  | Create+Read (own) on `cr_mx_request` for Aircraft Movement (PR) / Ask Leadership.                      |
| `MXC Payroll`    | Payroll team                           | Read-only on a published Power BI report or Dataverse view. **Effectively no app login.**             |

### Anonymous Safety Report service account (extension)

A second service account `mx-anonymous@ihc.org` handles anonymous safety
reports under extension scope. The `safety-report-triage-flow` (extension
auxiliary flow) rewrites `cr_reporter` to this account on create where
`cr_anonymous = true`. This account:

- Is a member of `MXC AMT` only (minimum write privilege on Safety Reports)
- Has its mailbox disabled (cannot accidentally receive DMs back)
- Is excluded from the Office 365 Users connector lookup so its display
  name doesn't leak through audit DMs

### Payroll access pattern (extension)

Payroll does not get a Power App login (Premium-license cost not
justified for view-only access). Instead, IHC IT publishes one of:

1. A **Dataverse view** filtered to the on-call subset, shared to the
   Payroll Entra group with Read privilege only
2. A **Power BI dashboard** embedded in a SharePoint page or Teams tab

Either way, no PII beyond name + phone + base + on-shift status is
exposed.

---

## Companion docs

- `tables/README.md` — Dataverse table index (canonical 11 + extension 7)
- `runbook.md` — week-by-week operational deployment runbook
- `build-walkthrough.md` — click-by-click build for canonical
- `flows/mxr-approval-flow-v2.json` — flow recipe (4-decision canonical)
- `roles-capability-matrix.md` — 8 roles × 42 capabilities (extension scope reference)
- `application-modules.md` — 8-module breakdown (extension scope reference)
- `powerfx/canvas-app.md` — canvas app build guide (extension-flavored; canonical needs only the submit form + approval inbox)
