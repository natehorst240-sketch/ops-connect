# Architecture Tracks

This repo carries **two parallel implementation tracks** for MX Connect. They
share data (Dataverse) and intent (the request → approval → audit pipeline)
but nothing else. Code, build steps, deployment, and licensing differ.
Keep them separated. Do not cross-import.

---

## Track A — Native Power Platform

**Stack:** Power Apps (canvas) + Power Automate + Dataverse + Teams Adaptive
Cards + Power BI.

**Lives in:** `m365-solution/`

**Authoritative artifacts:**
- `m365-solution/Phase1/` — request/approval flow (active build)
- `m365-solution/Phase2/` — operations layer
- `m365-solution/Phase3/` — Power BI
- `m365-solution/NoOutsideHelp/` — self-hosted ADS-B variant
- `m365-solution/sharepoint-lists/` — seed CSVs

**Build surface:** Power Apps Studio, Power Automate Studio, Dataverse Studio,
Teams admin center. No Node, no bundler, no JS code path.

**Auth:** Implicit via M365 sign-in to Power Apps / Teams. No app registration
to manage.

**When to choose this track:** Default. Lowest IT lift, no hosting, uses
existing M365 licenses, governed by Power Platform DLP.

---

## Track B — React + Entra → Dataverse

**Stack:** React (Vite) + MSAL.js / Entra ID app registration + Dataverse Web
API (OData) + Microsoft Graph where needed.

**Lives in:** `src/` plus `index.html`, `vite.config.js`, `middleware.js`,
`tailwind.config.js`, `postcss.config.js`, `package.json`.

**Authoritative artifacts:**
- `src/auth/` — Entra config, Dataverse table schema bindings, table clients
- `src/m365/` — M365-shell screens that talk to Dataverse via Web API
- `src/engines/`, `src/data/`, `src/shared/` — app logic and view models

**Build surface:** Node + Vite. Deploys as a static SPA (e.g., Azure Static
Web Apps, App Service, or any static host) behind an Entra app registration.

**Auth:** Entra ID app registration with delegated Dataverse permissions.
Tokens acquired via MSAL; calls go directly to
`https://{org}.crm.dynamics.com/api/data/v9.2/`.

**When to choose this track:** Custom UX that Power Apps canvas can't deliver,
non-M365-licensed external users (B2B guest scenarios), tighter brand control,
or a roadmap that needs web framework primitives.

---

## Separation rules

1. **No shared source files between `m365-solution/` and `src/`.** Schema
   docs in `m365-solution/Phase1/tables/` are the source of truth for Dataverse
   tables; `src/auth/schema.js` and `src/auth/tables.js` are the React track's
   typed mirror. When a table changes, update both — do not symlink or import
   across.
2. **Dataverse is the shared substrate.** Both tracks write to the same
   tables. Schema, column names, choice values, and security roles live in
   Dataverse and are documented under `m365-solution/Phase1/tables/`. Neither
   track owns its own copy of the schema.
3. **Flows belong to Track A.** Power Automate flows in
   `m365-solution/Phase1/flows/` run regardless of which track originated
   the row. The React app should not reimplement flow logic — it writes the
   row, the flow fires.
4. **Adaptive Cards belong to Track A.** Teams approval cards in
   `m365-solution/Phase1/cards/` are dispatched by Power Automate, not by the
   React app.
5. **No Node tooling under `m365-solution/`.** No `package.json`, no build
   step, no JS imports. Everything there must be hand-importable into Power
   Apps / Power Automate / Dataverse.
6. **No Power Fx, `.msapp`, or flow JSON under `src/`.** The React app does
   not host Power Platform artifacts.
7. **Cross-track docs live in `docs/`.** Anything that applies to both tracks
   (this file, the Teams consolidation plan, governance, naming conventions)
   goes here, not inside either track's folder.

---

## Decision matrix

| Concern | Track A (Native) | Track B (React + Entra) |
|---|---|---|
| IT lift | Lowest | Medium (hosting + app reg) |
| Licensing cost | Included in M365 | Included + hosting |
| UX flexibility | Canvas-constrained | Full web |
| Mobile | Power Apps mobile app | Responsive web / PWA |
| External users | Guests via M365 B2B | B2B or B2C via Entra |
| Time to first deploy | Days | Weeks |
| Long-term maintenance | Citizen-dev friendly | Requires JS skills |
| Offline | Limited (canvas offline) | Service worker / custom |

---

## Status

- **Track A — Phase 1:** Active build. See `m365-solution/Phase1/runbook.md`.
- **Track B:** Parallel implementation. See `src/` and `src/auth/config.js`
  for Entra wiring.

Both tracks target the same Dataverse environment and the same canonical
tables.
