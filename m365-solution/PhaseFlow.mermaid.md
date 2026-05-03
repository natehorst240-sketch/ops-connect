# Phase Flow Diagram — Mermaid Source

Three-phase rollout for IHC's M365 / Teams MX Connect deployment. The
Mermaid source below renders in GitHub, VS Code, and most markdown
viewers. Edit, paste into a Mermaid editor, or import into Lucidchart
via the companion CSV (`PhaseFlow.lucidchart.csv`).

## Phase flow

```mermaid
flowchart TB
    subgraph P1["Phase 1 · Greenlit · 6-8 wks · $60-100k"]
        P1A[AMT submits from phone\nPower Apps Mobile]
        P1B[Dataverse cr_mx_request\n+ cr_audit + security roles]
        P1C[Power Automate flow\nmxr-approval-flow-v2]
        P1D[Adaptive Card in Teams\nRMM approves / denies]
        P1E[Outlook calendar event\non approval]
        P1F[DM + audit chain\nrequestor notified]
        P1A --> P1B --> P1C --> P1D --> P1E
        P1D --> P1F
    end

    subgraph P2["Phase 2 · Proposed · 10-14 wks · $120-180k"]
        P2A[4 custom connectors\nVeryon + CompleteFlight + ProteanHub + SkyRouter]
        P2B[Read-only Scheduler\n7-day Gantt mirror]
        P2C[Stock Fleet Map\nBing pins · 15-min refresh]
        P2D[Conflict + gap detection\ncr_conflict server-side]
        P2E[Time-off + open-shift\nreuses Phase 1 pipeline]
        P2F[Bulletins + safety reports\nlightweight forms + Teams]
        P2A --> P2B
        P2A --> P2C
        P2B --> P2D
        P2C --> P2D
    end

    subgraph P3["Phase 3 · Gated on 1000 PBI Pro licenses · 12-16 wks · $100-150k"]
        P3A[Power BI semantic model\nDirectQuery + imports]
        P3B[4 static reports\nFleet · Inspections · Utilization · Compliance]
        P3C[Streaming dataset\nSkyRouter → Azure Fn → PBI push]
        P3D[Live Fleet map\nsub-30s refresh · ArcGIS or Mapbox]
        P3E[Self-service slicers\nRLS by region]
        P3F[PDF / PPT exports\nweekly to exec leadership]
        P3A --> P3B --> P3E --> P3F
        P3C --> P3D
    end

    P1 ==> P2
    P2 ==> P3

    classDef greenlit fill:#22c55e22,stroke:#22c55e,color:#fff
    classDef proposed fill:#3b82f622,stroke:#3b82f6,color:#fff
    classDef gated    fill:#eab30822,stroke:#eab308,color:#fff
    class P1 greenlit
    class P2 proposed
    class P3 gated
```

## Timeline

```mermaid
gantt
    title MX Connect · M365 Rollout Timeline
    dateFormat  X
    axisFormat  Wk %s
    section Phase 1 · Request → Approval
    Greenlit              :done,    p1,  0, 8
    section Phase 2 · Operations Layer
    Custom connectors     :active,  p2a, 8,  10
    Tables + flows        :         p2b, 10, 12
    Canvas screens        :         p2c, 14, 16
    Time-off + bulletins  :         p2d, 18, 20
    UAT + Prod            :         p2e, 20, 22
    section Phase 3 · Analytics + Live Tracking
    Semantic model        :crit,    p3a, 22, 24
    Static reports        :         p3b, 24, 28
    Streaming + map       :         p3c, 28, 31
    Embed + drill-through :         p3d, 31, 34
    UAT + adoption        :         p3e, 34, 38
```

## How to use

- **GitHub / VS Code:** Mermaid renders inline; just open this file.
- **Lucidchart:** Use the companion `PhaseFlow.lucidchart.csv` instead. 
  Lucidchart's CSV import doesn't accept Mermaid directly.
- **Standalone:** Copy the Mermaid source into
  https://mermaid.live for an interactive editor.
- **In the demo:** This same diagram is rendered as a React component on
  the **Phase Flow** tab of the deployed pitch demo (`src/tabs/PhaseFlow.jsx`).
