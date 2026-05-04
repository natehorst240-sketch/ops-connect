# Phase 1 Solution — Connection References

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
| `cr_TeamsConnection`                 | Microsoft Teams        | Post Adaptive Card to RMM / Director channel; DM the requestor   |
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

## How to set up

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
