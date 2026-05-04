# Phase 1 Solution — Connection References + Security Groups

There are two deployable flow shapes in `flows/`:

- **`mxr-approval-flow-sharepoint.json`** — Phase 1 default. Uses
  SharePoint Lists as the data layer; no Premium Power Apps licensing
  required. Five connection references.
- **`mxr-approval-flow-v2.json`** — Phase 2 target shape. Same logic but
  bound to Dataverse. Requires Premium Power Apps (Per-User or Per-App).
  Three connection references.

Each connection must be re-authenticated per environment after solution
import. Define them in the `MXConnect` solution before turning on the
flow.

## Phase 1 (SharePoint variant) — five connection references

| Logical name                         | Connector              | Purpose                                                          |
| ------------------------------------ | ---------------------- | ---------------------------------------------------------------- |
| `cr_SharePointConnection`            | SharePoint             | Trigger on MX Requests list; update status; write Audit Log rows |
| `cr_TeamsConnection`                 | Microsoft Teams        | Post Adaptive Card to RMM / Scheduler / Director / Safety channel; DM the requestor   |
| `cr_OutlookConnection`               | Office 365 Outlook     | Create calendar event on approval; email Director on escalation  |
| `cr_Office365UsersConnection`        | Office 365 Users       | Resolve responder UPN → display name for audit + DM bodies       |

The fifth (`Office365Users`) is used by the SharePoint variant because
SharePoint Person/Group columns store user info as opaque claims —
resolving them to a display name for the requestor DM needs the Users
connector. The Dataverse variant gets that for free from `systemusers`.

## Phase 2 (Dataverse variant) — three connection references

| Logical name             | Connector              | Purpose                                                                |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------- |
| `cr_DataverseConnection` | Microsoft Dataverse    | Read trigger row, write request status updates, write `cr_audit` rows  |
| `cr_TeamsConnection`     | Microsoft Teams        | Post Adaptive Card to RMM channel; DM the requestor                    |
| `cr_OutlookConnection`   | Office 365 Outlook     | Create the calendar event on approval                                  |

## SharePoint security groups (8)

Match the role capability matrix (see
`roles-capability-matrix.md`). Create on the MXConnect SharePoint site
under `Site Settings > People and Groups`. Membership is managed via
Entra ID groups synced into the SharePoint group (recommended) or
direct user assignment.

| Group              | Members                              | List-level rights                                                                                                |
| ------------------ | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| `MXC AMT`          | All AMTs (~340 users)                | Contribute on MX Requests + Aircraft Status Log + Personnel Status Log + Safety Reports; Read elsewhere          |
| `MXC RMM`          | RMMs (~9, regional)                  | Edit on MX Requests + Operational Bulletins + Safety Reports; Contribute on Audit Log; Read elsewhere            |
| `MXC Director`     | Director of Maintenance Operations   | Full Control on Operational Bulletins (incl. permanent delete); Edit on MX Requests + Safety Reports; Read all   |
| `MXC QA`           | ADOM + QA team                       | Edit on MX Requests + Operational Bulletins + Safety Reports; Contribute on Audit Log; Read elsewhere            |
| `MXC Pilot`        | Active pilots                        | Contribute on MX Requests (filtered to Ask Leadership / Safety / Pilot Training Request types); Read MX Tracking |
| `MXC Scheduler`    | MX + Crew schedulers                 | Full Control on Schedule Events; Edit on MX Requests (PR + Pilot Training only); Edit on Aircraft                |
| `MXC PR`           | Public Relations team                | Contribute on MX Requests (Aircraft Movement / Ask Leadership / Safety only); Read MX Tracking                   |
| `MXC Payroll`      | Payroll team                         | Read-only on a SharePoint **filtered view link** of `Personnel — Maintenance` + on-call schedule. **No app login.** |

### Item-level permissions (set under each list's `Advanced settings`)

| List                       | Item-level rule                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| MX Requests                | AMT / Pilot / PR can Read+Edit own only. RMM / Director / QA / Scheduler can Read+Edit all.    |
| Safety Reports             | Reporters can Read+Edit own only. RMM / Director / QA can Read+Edit all. Anonymous-handled separately (see below). |
| Audit Log                  | Read for all groups. Append for service account only.                                          |
| Operational Bulletins      | Read for everyone except Payroll. Edit for RMM / Director / QA. Permanent Delete for Director only. |

### Anonymous Safety Reports

When the Power Apps form's `Anonymous` toggle is on:

- `Reporter` field is set to the service account `mx-anonymous@ihc.org`
- `Reporter Display Name` is left blank
- `Anonymous` flag = Yes
- The DM-back step in the safety-report-triage flow is skipped
- Item-level "Edit / Read items created by user" rule strips access from
  the original submitter — even the reporter cannot navigate back

The `mx-anonymous` service account must:
- Be excluded from the Office 365 Users connector lookup (so its
  display name doesn't leak through audit DMs)
- Have an inbox-disabled mailbox (so it can't accidentally receive
  DMs back)
- Be a member of `MXC AMT` group only (minimum write privilege on
  Safety Reports)

### Payroll filtered-view-link pattern

Payroll does not get a Power App login. Instead, IHC IT provisions a
SharePoint **filtered list view** with these properties:

```
View name:    Payroll — On-Call & Tech List
Source list:  Personnel — Maintenance
Filter:       Active = Yes
Columns:      Title, First Name, Last Name, Phone, Primary Base, On Shift
Sort:         On Shift desc, Last Name asc
```

Payroll users get `Read` permission on this view only — not the parent
list. The link is shared via Outlook or pinned in the Payroll Teams
channel. No PII beyond name + phone + base + shift status is exposed.

### Why per-group, not per-user

Matches Entra ID group sync (the way IHC IT manages most M365 access).
When someone joins/leaves a role, IT updates the Entra group and
SharePoint inherits within ~15 minutes. No per-user list maintenance.

## How to set up connections

### 1. Create connections (per environment)

In `Power Platform admin center > Environment > Connections`:

- Add **SharePoint** (Phase 1) — sign in as a service account
  (recommended) or `mx-service@ihc.org`. Whoever signs in becomes the
  run-as identity for list reads/writes. Service account must have
  Edit access on every list referenced by the flow.
- Add **Microsoft Dataverse** (Phase 2) — same recommendation.
- Add **Microsoft Teams** — sign in as the same service account. The flow
  will post as that identity ("Flow bot — mx-service@ihc.org").
- Add **Office 365 Outlook** — sign in as the calendar owner (e.g., the
  `Logan MX Calendar` owner).
- Add **Office 365 Users** (Phase 1 only) — any account with `User.Read`
  graph permission. The connection only resolves UPN → display name.

### 2. Map connection references in the solution

After solution import:

```
Solutions > MXConnect > Connection references > [each ref] > Edit
   Connection: pick the matching connection from step 1
```

### 3. Turn on the flow

Flows are imported in the **off** state. Toggle on:

```
Solutions > MXConnect > mxr-approval-flow-sharepoint > Turn on   (Phase 1)
Solutions > MXConnect > mxr-approval-flow-v2          > Turn on   (Phase 2)
```

Run only one variant at a time per environment. Running both
simultaneously double-processes every submission.

## Service-account vs interactive auth

**Strongly recommended: a dedicated service account** (e.g.,
`mx-service@ihc.org`). The flow posts to Teams as this identity, which is
preferable to a human's name showing up on every approval card.
Coordinate with IHC IT to provision.

For Phase 1, the service account needs:
- SharePoint **Edit** permission on the MX Connect site
- Teams membership in the IHC Life Flight Team
- A mailbox (for the Outlook calendar + escalation emails)
- No Power Apps Premium license required — SharePoint connector is
  Standard

For Phase 2, the service account needs:
- Power Apps **Per-User** Premium license (or the org buys a Per-App plan)
- Dataverse **System User** with the `MXC Service` security role

**Avoid: tying connection references to a person's M365 account.** When
that person leaves or their license changes, every flow tied to that
identity stops working until reauthenticated. Service accounts are
stable.

## DLP impact

All connectors used here (SharePoint, Dataverse, Teams, Office 365 Outlook,
Office 365 Users) are Microsoft-owned and live in the **Business**
classification by default, so the flow won't trip a DLP boundary in
standard tenants. Confirm with IHC IT before Phase 1 prod rollout.

## Companion docs

- `roles-capability-matrix.md` — 8 roles × 42 capabilities (source of truth)
- `application-modules.md` — 8-module breakdown (Status, Schedule MX, Ask Leadership, Safety Report, Docs, My Team, MX Tracking, Bulletins)
- `runbook.md` — week-by-week operational deployment runbook
- `../sharepoint-lists/phase1-blank-templates/README.md` — column-by-column schema reference for all 14 lists
