// Dataverse entity set names (OData endpoint plurals).
//
// IMPORTANT — prefix assumption:
//   Every name here is PREFIX + <suffix>, where PREFIX comes from schema.js.
//   This works only if the production tables were created with the same suffix
//   as the dev tables (just a different publisher prefix).
//   Verify each suffix against the actual Dataverse schema before switching
//   PREFIX to 'cr_'. The five tables marked FETCHED must be correct; the rest
//   are unused placeholders reserved for future features.

import { PREFIX as P } from './schema';

export const TABLES = {
  // ── Actively fetched by useFleetData ─────────────────────────────────────
  aircraft:      `${P}aircrafts`,           // FETCHED — verify suffix in schema
  personnel:     `${P}personnelmaintenances`, // FETCHED
  mxRequest:     `${P}maintenancerequests`,   // FETCHED
  scheduleEvent: `${P}scheduleevents`,        // FETCHED (falls back to [] on 404)
  fleetPosition: `${P}fleetpositions`,        // FETCHED (falls back to [] on 404)
  conflict:      `${P}conflicts`,             // FETCHED (falls back to [] on 404)
  scheduleEntry: `${P}scheduleentries`,       // FETCHED — unified schedule table

  // ── Reserved / not yet implemented ───────────────────────────────────────
  // Confirm actual table names in Dataverse before using these.
  audit:         `${P}auditlogs`,
  personnelCrew: `${P}personnelcrews`,
};
