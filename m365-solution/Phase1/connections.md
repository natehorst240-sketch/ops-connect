# Phase 1 Solution — Connection References

The Power Automate flow uses three named connection references. Each must
be re-authenticated per environment after solution import. Define them in
the `MXConnect` solution before the flow can run.

| Logical name             | Connector              | Purpose                                                                |
| ------------------------ | ---------------------- | ---------------------------------------------------------------------- |
| `cr_DataverseConnection` | Microsoft Dataverse    | Read trigger row, write request status updates, write `cr_audit` rows  |
| `cr_TeamsConnection`     | Microsoft Teams        | Post Adaptive Card to RMM channel; DM the requestor                    |
| `cr_OutlookConnection`   | Office 365 Outlook     | Create the calendar event on approval                                  |

## How to set up

### 1. Create connections (per environment)

In `Power Platform admin center > Environment > Connections`:

- Add **Microsoft Dataverse** — sign in as a service account (recommended)
  or `mx-service@ihc.org`. Whoever signs in becomes the run-as identity
  for the flow's Dataverse calls.
- Add **Microsoft Teams** — sign in as the same service account. The flow
  will post as that identity ("Flow bot — mx-service@ihc.org").
- Add **Office 365 Outlook** — sign in as the calendar owner (e.g., the
  `Logan MX Calendar` owner).

### 2. Map connection references in the solution

After solution import:

```
Solutions > MXConnect > Connection references > [each ref] > Edit
   Connection: pick the matching connection from step 1
```

### 3. Turn on the flow

Flows are imported in the **off** state. Toggle on:

```
Solutions > MXConnect > mxr-approval-flow-v2 > Turn on
```

## Service-account vs interactive auth

**Strongly recommended: a dedicated service account** (e.g.,
`mx-service@ihc.org` with a Power Apps Premium license assigned). The flow
posts to Teams as this identity, which is preferable to a human's name
showing up on every approval card. Coordinate with IHC IT to provision.

**Avoid: tying connection references to a person's M365 account.** When
that person leaves or their license changes, every flow tied to that
identity stops working until reauthenticated. Service accounts are
stable.

## DLP impact

All three connectors used here (Dataverse, Teams, Office 365 Outlook) are
Microsoft-owned and live in the **Business** classification by default,
so the flow won't trip a DLP boundary in standard tenants. Confirm with
IHC IT before Phase 1 prod rollout.
