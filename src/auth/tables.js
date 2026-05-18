// Dataverse entity set names (OData endpoint plurals).
// All names are derived from PREFIX in schema.js — change that one constant
// to migrate the entire app to a different Dataverse tenant.

import { PREFIX as P } from './schema';

export const TABLES = {
  region:        `${P}regionfields`,
  base:          `${P}airportlocations`,
  aircraftType:  `${P}aircrafttypes`,
  aircraft:      `${P}aircrafts`,
  personnel:     `${P}personnelmaintenances`,
  mxRequest:     `${P}maintenancerequests`,
  audit:         `${P}auditlogs`,
  scheduleEvent: `${P}scheduleevents`,
  fleetPosition: `${P}fleetpositions`,
  conflict:      `${P}conflicts`,
  personnelCrew: `${P}personnelcrews`,
};
