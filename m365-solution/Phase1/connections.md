# Phase 1 Solution — Connection References + Dataverse Roles

Phase 1 ships on **Dataverse** as the data layer. The SharePoint Lists
variant exists in `flows/mxr-approval-flow-sharepoint.json` only as a
fallback for tenants without Dataverse capacity.

## Connection references — three connectors

| Logical name             | Connector              | Purpose                                                                |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------- |
| `cr_DataverseConnection` | Microsoft Dataverse    | Read trigger row, write request status updates, write `cr_audit` rows  |
| `cr_TeamsConnection`     | Microsoft Teams        | Post Adaptive Card to RMM / Scheduler / Director / Safety channel; DM  |
| `cr_OutlookConnection`   | Office 365 Outlook     | Create calendar event on approval; email Director on escalation        |

Each must be re-authenticated per environment after solution import.

## Dataverse security roles — 8 roles

Mirror the role capability matrix (see `roles-capability-matrix.md`).
Each role becomes a custom Dataverse security role inside the `MXConnect`
solution. Membership is managed via Entra ID groups synced into
Dataverse Teams (recommended) or direct user assignment.

| Role             | Members                                | Privilege summary                                                                                       |
| ---------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `MXC AMT`        | All AMTs (~340 users)                  | Create + Read (own) on `cr_mx_request`, `cr_safety_report`, `cr_aircraft_status_log`, `cr_personnel_status_log`. Read on Aircraft / Personnel / Bulletins / Comments. |
| `MXC RMM`        | Regional Maintenance Managers (~9)     | Read+Write (BU) on `cr_mx_request`, `cr_operational_bulletin`, `cr_safety_report`. Append-To `cr_audit`. Read (BU) elsewhere. |
| `MXC Director`   | Director of Maintenance Operations     | Read+Write+Delete (Org) on `cr_operational_bulletin`. Read+Write (Org) on `cr_mx_request`, `cr_safety_report`. Read (Org) all other tables. |
| `MXC QA`         | ADOM + QA team                         | Read+Write (Org) on `cr_mx_request`, `cr_operational_bulletin`, `cr_safety_report`. Append-To `cr_audit`. Read (Org) elsewhere. |
| `MXC Pilot`      | Active pilots                          | Create+Read (own) on `cr_mx_request` filtered by Request Type ∈ {Ask Leadership, Pilot Training, Safety}. Read (Org) Aircraft + Bulletins. |
| `MXC Scheduler`  | MX + Crew schedulers                   | Full Control on `cr_schedule_event`. Read+Write (Org) on `cr_mx_request` (PR + Pilot Training only). Read+Write (Org) on `cr_aircraft`. |
| `MXC PR`         | Public Relations team                  | Create+Read (own) on `cr_mx_request` filtered by Request Type ∈ {Aircraft Movement (PR), Ask Leadership, Safety}. Read MX Tracking. |
| `MXC Payroll`    | Payroll team                           | Read-only on a published Power BI report or Dataverse view. **Effectively no app login.** |

### Privilege levels (Dataverse)

| Level     | Meaning                                                   |
| --------- | --------------------------------------------------------- |
| None      | No access.                                                |
| User      | Self only (rows where `ownerid` = current user).          |
| BU        | Business Unit (current user's BU).                        |
| Parent: Child BU | User's BU + all descendant BUs.                    |
| Org       | All rows in the org.                                      |

### Per-table privilege grid

This is the matrix to fill in when you create each role inside the
`MXConnect` solution. Each cell is a Dataverse privilege level
(None / User / BU / Parent / Org). Append-To means "can write rows
that reference this table" without granting Read.

| Table                      | AMT | RMM | Director | QA  | Pilot | Scheduler | PR  | Payroll |
| -------------------------- | --- | --- | -------- | --- | ----- | --------- | --- | ------- |
| `cr_mx_request`            | User (C/R/U) | BU (C/R/U) | Org (R/U) | Org (R/U) | User (C/R) | Org (R/U) | User (C/R) | None |
| `cr_audit`                 | None | App-To | Org (R) | Org (R) | None | None | None | None |
| `cr_operational_bulletin`  | Org (R) | Org (R/U) | Org (R/U/D) | Org (R/U) | Org (R) | Org (R) | Org (R) | None |
| `cr_safety_report`         | User (C/R) | BU (C/R/U) | Org (R/U) | Org (R/U) | User (C/R) | User (C/R) | User (C/R) | None |
| `cr_aircraft`              | Org (R) | BU (R/U-status) | Org (R/U) | Org (R/U) | Org (R) | Org (R/U) | Org (R) | None |
| `cr_aircraft_status_log`   | Org (C/R) | Org (C/R) | Org (R) | Org (R) | None | None | None | None |
| `cr_personnel_maintenance` | Org (R) | BU (R/U) | Org (R/U) | Org (R/U) | None | Org (R) | None | View only |
| `cr_personnel_crew`        | Org (R) | Org (R) | Org (R/U) | Org (R/U) | None | Org (R/U) | None | None |
| `cr_personnel_status_log`  | Self (C) | BU (C/R) | Org (R) | Org (R) | None | Org (R) | None | None |
| `cr_mx_request_comment`    | User (C/R own request) | BU (C/R) | Org (C/R) | Org (C/R) | User (C/R own) | None | User (C/R own) | None |
| `cr_schedule_event`        | Org (R) | BU (R) | Org (R) | Org (R) | Org (R) | Org (C/R/U/D) | Org (R) | None |
| `cr_user_filter_pref`      | User (C/R/U) | User | User | User | User | User | User | None |
| `cr_aircraft_type` / `cr_base` / `cr_region` | Org (R) | Org (R) | Org (R/U) | Org (R) | Org (R) | Org (R/U) | Org (R) | None |

C = Create, R = Read, U = Update, D = Delete. App-To = Append-To
privilege.

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
pac admin assign-role --role "MXC RMM" --user steve.taul@ihc.org
```

## Business unit hierarchy for regional scoping

The cleanest way to give RMMs regional visibility without per-record
sharing is via Dataverse business unit hierarchy. Set up:

```
ihc.org (root BU)
├── 109 UT
├── WY/MT
├── ID/NV
├── UT/AZ
├── CO/NM
├── PAGE
├── WOODSCROSS
├── NC
├── SLC FW
├── OFFICE
└── ROVERS
```

Each user belongs to one BU (their region). When the RMM role is
defined with **BU** privilege on `cr_mx_request`, RMMs see only their
own region's rows automatically. Director / QA / DOM use **Org** for
full visibility.

This is the single biggest argument for Dataverse over SharePoint Lists
for Phase 1: regional scoping comes free, no per-record sharing or
item-level permission rules.

## Service-account vs interactive auth

**Strongly recommended: a dedicated service account** (e.g.,
`mx-service@ihc.org`). The flow posts to Teams as this identity, which is
preferable to a human's name showing up on every approval card.

Service account requirements:
- Power Apps **Per-User** Premium license (or org buys Per-App)
- Dataverse **System User** with the `MXC Service` security role
  (Org-level Read+Write on every Phase 1 table; no Delete)
- Teams membership in the IHC Life Flight Team
- Mailbox (for the Outlook calendar + escalation emails)

**Avoid: tying connection references to a person's M365 account.** When
that person leaves or their license changes, every flow tied to that
identity stops working until reauthenticated. Service accounts are
stable.

### Anonymous Safety Report service account

A second service account `mx-anonymous@ihc.org` handles anonymous safety
reports. The `safety-report-triage-flow` rewrites `cr_reporter` to this
account on create where `cr_anonymous = true`. This account:

- Is a member of `MXC AMT` only (minimum write privilege on Safety Reports)
- Has its mailbox disabled (cannot accidentally receive DMs back)
- Is excluded from the Office 365 Users connector lookup so its display
  name doesn't leak through audit DMs

## Payroll access pattern

Payroll does not get a Power App login (Premium-license cost not
justified for view-only access). Instead, IHC IT publishes one of:

1. A **Dataverse view** filtered to the on-call subset, shared to the
   Payroll Entra group with Read privilege only
2. A **Power BI dashboard** embedded in a SharePoint page or Teams tab

Either way, no PII beyond name + phone + base + on-shift status is
exposed.

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
   → MXC AMT      → assign Entra group "AMT — All"
   → MXC RMM      → assign Entra group "RMM — All Regions"
   → MXC Director → assign Director group
   → MXC QA       → assign QA team
   ...
```

### 4. Turn on the flow

Flows are imported in the **off** state. Toggle on:

```
Solutions > MXConnect > mxr-approval-flow-v2 > Turn on
```

## DLP impact

All connectors used here (Dataverse, Teams, Office 365 Outlook) are
Microsoft-owned and live in the **Business** classification by default,
so the flow won't trip a DLP boundary in standard tenants. Confirm with
IHC IT before Phase 1 prod rollout.

## Companion docs

- `roles-capability-matrix.md` — 8 roles × 42 capabilities (source of truth)
- `application-modules.md` — 8-module breakdown
- `runbook.md` — week-by-week operational deployment runbook
- `tables/README.md` — Dataverse table index + build order
- `powerfx/canvas-app.md` — canvas app build guide
