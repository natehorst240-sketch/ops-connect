// Demo personnel data — mirrors what Protean Hub and Dataverse would return
// for each persona. Components check here when live Dataverse is unavailable.
// Keyed by persona.id so lookup is O(1). Extend with new persona IDs as needed.
//
// Production path: useFleet().scheduleEntries / personnel certs / mxRequests
// filtered by persona email or id. This file is the demo fallback only.

import { DEMO_TODAY_ISO, addDays } from './mxOncallSchedule';

const dISO = n => addDays(DEMO_TODAY_ISO, n);
const dShort = n => { const [, m, d] = dISO(n).split('-'); return `${m}/${d}`; };

// Upcoming shifts per persona — mirrors Protean Hub cr463_shiftassignment entity
export const DEMO_SHIFTS = {
  nurse: [
    { date: dISO(3),  time: '09:00-09:00', base: 'Cedar City Hospital', role: 'FN - URBAN' },
    { date: dISO(7),  time: '09:00-09:00', base: 'Cedar City Hospital', role: 'FN - URBAN' },
    { date: dISO(17), time: '09:00-09:00', base: 'Cedar City Hospital', role: 'FN - URBAN' },
  ],
};

// Active certifications per persona — mirrors Veryon / Dataverse cr463_certification entity
// daysLeft is computed at render time from expires; do not add it here.
export const DEMO_CERTS = {
  nurse: [
    { name: 'CCRN',   status: 'valid',    expires: '2027-08-14' },
    { name: 'TNCC',   status: 'valid',    expires: '2026-11-03' },
    { name: 'PALS',   status: 'expiring', expires: '2026-06-12' },
    { name: 'STABLE', status: 'valid',    expires: '2027-02-28' },
    { name: 'ACLS',   status: 'valid',    expires: '2026-12-05' },
  ],
};

// Recent submission history per persona — mirrors cr463_maintenancerequest entity
export const DEMO_SUBMISSIONS = {
  amt: [
    { type: 'MX Schedule',   detail: 'N39KM 100-hr inspection window',    status: 'Pending',     color: 'amber' },
    { type: 'Time Off',      detail: `2 days · ${dShort(28)}–${dShort(29)}`, status: 'Approved', color: 'green' },
    { type: 'Ask Leadership',detail: 'Tooling budget question',            status: 'In progress', color: 'blue'  },
  ],
  amt_mckay: [
    { type: 'Aircraft Status',detail: 'N291HC AOG — tail rotor gearbox chip light', status: 'Open',    color: 'red'   },
    { type: 'MX Schedule',   detail: 'Parts ETA request — N291HC gearbox',         status: 'Pending', color: 'amber' },
    { type: 'Time Off',      detail: `1 day · ${dShort(14)}`,                      status: 'Approved',color: 'green' },
  ],
  _default: [
    { type: 'Ask Leadership', detail: 'General inquiry', status: 'In progress', color: 'blue' },
  ],
};
