# MX Connect — M365 Solution Starter Kit

Deployable artifacts for building MX Connect in IHC's M365 / Power Platform
tenant. Everything in this folder is text — no compiled binaries, no `.msapp`
files. You import the artifacts into your Dev environment, then refine in
Power Apps Studio / Power Automate Studio.

## What's here

```
m365-solution/
├─ Phase1/                Request → Approval (greenlit)
│  ├─ runbook.md          Week-by-week deployment guide — START HERE
│  ├─ tables/             Dataverse table schemas (markdown specs)
│  ├─ flows/              Power Automate flow definitions (JSON)
│  ├─ cards/              Adaptive Card payloads for Teams (JSON)
│  └─ powerfx/            Canvas app specs + Power Fx formulas
├─ Phase2/                Operations layer (forthcoming)
└─ Phase3/                Power BI + live tracking (forthcoming)
```

## How to use this

1. **Read `Phase1/runbook.md` start to finish before clicking anything.** It
   walks the deployment week-by-week and tells you which artifact in this
   folder belongs at each step.
2. **Stand up a Dev environment** in IHC's Power Platform tenant. Don't build
   straight in default — you want clean isolation.
3. **Follow the runbook in order.** Each section references files here.
4. **When in doubt, the JSON is authoritative.** Adaptive Cards and flow
   definitions are byte-exact. Markdown specs (tables, Power Fx) are
   intended to be read by a human and translated to clicks in Power Apps
   Studio / Dataverse Studio.

## What this kit can't do for you

- **Build the canvas app UI.** Canvas apps live in `.msapp` files. Their
  source-control format (`.fx.yaml` per screen) exists but is brittle to
  hand-edit. The kit gives you the screen-by-screen spec and every Power
  Fx formula; you do the drag-and-drop in Power Apps Studio.
- **Test against your tenant before import.** Validate flows via Power
  Automate's run history; preview the canvas app inside Power Apps Studio.
- **Read your current SKU / DLP / connector entitlements.** Run
  `pac admin list` against your tenant to inventory what you've got.

## Conventions used in this kit

- **Publisher prefix:** `cr_` (placeholder). Replace with your tenant's
  actual prefix everywhere it appears (likely `ihc_` or similar).
- **Schema names:** snake_case in this folder; Power Apps will display
  them as PascalCase once imported.
- **Environment variables:** referenced as `@{environment('var-name')}`.
  Defined in the runbook's pre-flight checklist.
- **Solution name:** `MXConnect` (no spaces). Display name `MX Connect`.

## Phase order is not optional

Phase 2 builds on Phase 1's `cr_mx_request` table and audit pattern. Phase 3
reads from Phases 1 and 2's Dataverse data. Don't skip ahead — each phase
completes a vertical slice that the next phase reuses.
