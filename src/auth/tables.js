// Dataverse entity set names (OData endpoint plurals)
//
// These are the table names in Nathan's personal dev tenant where the
// reference build lives. Some don't match the canonical IHC schema
// because the Power Apps AI auto-named them during CSV import.
//
// When rebuilding in IHC's tenant the dev team should swap these for
// the canonical names (likely cr_region, cr_base, cr_mx_request, etc.)
// per m365-solution/Phase1/tables/README.md.

export const TABLES = {
  region:       'cr463_regionfields',       // canonical: cr_region
  base:         'cr463_airportlocations',   // canonical: cr_base
  aircraftType: 'cr463_aircrafttypes',      // canonical: cr_aircraft_type
  aircraft:     'cr463_aircrafts',          // canonical: cr_aircraft
  personnel:    'cr463_personnelmaintenances', // canonical: cr_personnel_maintenance
  mxRequest:    'cr463_maintenancerequests',// canonical: cr_mx_request
  audit:        'cr463_auditlogs',          // canonical: cr_audit
  scheduleEvent:'cr463_scheduleevents',     // canonical: cr_schedule_event
  fleetPosition:'cr463_fleetpositions',     // canonical: cr_fleet_position
  conflict:     'cr463_conflicts',          // canonical: cr_conflict
  personnelCrew:'cr463_personnelcrews'      // canonical: cr_personnel_crew
};
