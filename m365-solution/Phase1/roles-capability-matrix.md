# Phase 1 — Role Capability Matrix

Source: MC Documentation v3 (pages 3–5). This is the canonical truth for
who can do what in MX Connect Phase 1. The Phase 1 Power Apps form,
SharePoint group permissions, Power Automate routing, and dashboard
visibility all derive from this matrix.

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
| Request More Information from Submitter                      | ✗   | ✓   | ✓        | ✓  | ✗    | ✓         | ✗   | ✗       |
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

## How this maps to SharePoint security

Each role becomes a SharePoint Group on the MXConnect site. Group members
get list-level + item-level permissions per the matrix above.

| Group              | List-level rights                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------- |
| `MXC AMT`          | Contribute on MX Requests + Aircraft Status Log + Personnel Status Log + Safety Reports; Read elsewhere |
| `MXC RMM`          | Edit on MX Requests + Operational Bulletins; Contribute on Audit Log; Read elsewhere                    |
| `MXC Director`     | Full Control on Operational Bulletins (delete); Edit on MX Requests; Read elsewhere                     |
| `MXC QA`           | Edit on MX Requests + Operational Bulletins; Contribute on Audit Log; Read elsewhere                    |
| `MXC Pilot`        | Contribute on MX Requests (filtered to Ask Leadership, Safety, Pilot Training only); Read MX Tracking   |
| `MXC Scheduler`    | Full Control on Schedule Events; Edit on MX Requests (PR + Pilot Training only); Edit on Aircraft       |
| `MXC PR`           | Contribute on MX Requests (Aircraft Movement, Ask Leadership, Safety only); Read MX Tracking            |
| `MXC Payroll`      | Read on a SharePoint **filtered view link** of `Personnel — Maintenance` + on-call schedule. No app login. |

Item-level permissions (set on each list, "Item-level Permissions" panel):

- **MX Requests** — AMT/Pilot/PR can Read+Edit own only. RMM/Director/QA/Scheduler can Read+Edit all.
- **Safety Reports** — Reporters can Read+Edit own only. RMM/Director/QA can Read+Edit all. **Anonymous reporters write but cannot read back** (handled by setting Created By to a service account when Anonymous=Yes).
- **Audit Log** — Read for all groups; Append for service account only (flow runs as service account).
- **Operational Bulletins** — Read for everyone except Payroll. Edit for RMM/Director/QA. Permanent Delete for Director only.

## How this maps to Power Apps form branching

The Power Apps canvas form's "Submit" screen shows one of nine action
buttons per persona based on this matrix. Each button branches to a
type-specific form section, then writes to the right SharePoint List on
Patch.

```
Pilot logged in        →  shows: [Ask Leadership] [Safety Report] [Pilot Training]
AMT logged in          →  shows: all 9 except [Pilot Training] [Operational Bulletin]
RMM/Director/QA in     →  shows: all 9
Scheduler in           →  shows: [Ask Leadership] [Safety Report] [Aircraft Movement]
PR in                  →  shows: [Ask Leadership] [Safety Report] [Aircraft Movement]
Payroll                →  redirected to SharePoint filtered view; no form access
```

Implementation: a `varAvailableActions` collection populated in
`App.OnStart` from a User().Email lookup against `Personnel — Maintenance`.
Buttons render with `Visible = varAvailableActions.[ActionName]`.

## How this maps to Power Automate routing

The existing `mxr-approval-flow-sharepoint` already branches on the
`Routing` Choice column (RMM / Director). Extending to the full matrix
adds a `Decision` Choice on the response side and per-type approval
chains:

| Submission                  | Default approver                    | Escalation path           | Outlook event? |
| --------------------------- | ----------------------------------- | ------------------------- | :------------: |
| MX Schedule Request         | RMM (regional) or Scheduler         | RMM → Director on timeout | Yes            |
| PR Aircraft Movement        | Scheduler                           | Director on timeout       | Yes            |
| Pilot Training Request      | Scheduler                           | Director on timeout       | Yes            |
| Time Off                    | RMM (regional)                      | Director on timeout       | Yes            |
| Ask Leadership              | RMM (regional)                      | Director on Escalate      | No             |
| Safety Report               | RMM (regional)                      | Director on Escalate      | No             |
| Aircraft Status Change      | (write-through — no approval)       | n/a                       | No             |
| Personnel Status Change     | (write-through — no approval)       | n/a                       | No             |
| Operational Bulletin Post   | (write-through — no approval)       | n/a                       | No             |

Decision actions on every approval card:

```
[ Approve ]  [ Deny — write reason ]  [ Request More Info ]  [ Escalate to Director ]
```

`Approve` and `Deny` are already wired in the Phase 1 flow. `Request More
Info` and `Escalate` are net-new switch cases — see
`flows/mxr-approval-flow-sharepoint.json` for the patch points
(`Decision` switch's `default` block becomes two new cases).

## Companion docs

- `application-modules.md` — the 8-module breakdown from page 6
- `runbook.md` — operational runbook (referenced from this matrix)
- `connections.md` — connection references + service account model
- `../sharepoint-lists/phase1-blank-templates/README.md` — schema reference
