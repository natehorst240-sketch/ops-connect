// Demo schedule entries covering the 7-day window around DEMO_TODAY_ISO.
// Covers all six personnel types across all regions.
//
// MX On-Call entries come from the real CompleteFlight export (cfSchedule.js) —
// those names are real and must not be altered.
//
// All other names are role-title placeholders so ghost employees cannot
// accidentally appear when real Dataverse data connects.
//
// When Dataverse is live, useFleetData fetches cr_scheduleentries and this
// file becomes unused — OpsScheduleBoard falls through to live data first.

import { CF_SCHEDULE } from './cfSchedule';
import { BASE_META, DEMO_TODAY_ISO, addDays } from './mxOncallSchedule';

const WEEK_DATES = Array.from({ length: 7 }, (_, i) => addDays(DEMO_TODAY_ISO, i));

// ── Per-base pilot + clinical crews ──────────────────────────────────────────
// Each base has one PIC, one SIC, one Flight RN, one Paramedic.
// In production these rows come from CompleteFlight (pilots) and Protean (clinical).

const BASE_CREWS = {
  'Greybulll':         { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Lander':            { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Rawlins':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Vernal':            { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'FW Riverton':       { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Woodscross':        { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'FW Hangar':         { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'SGU/CDC':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'MKY/LGU':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'UV/ROOS':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'IMED/Hangar':       { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Rexburg':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Burley':            { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'RW Elko':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Ely':               { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Winnemucca':        { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Glenwood Springs':  { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Steamboat Springs': { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Los Alamos':        { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Cortez':            { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Pagosa Springs':    { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Fort Mohave':       { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Richfield':         { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Moab':              { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Page':              { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
};

// Field ops manager on-call — one per region, manual entry
const FOC_BY_REGION = {
  'SLC RW':  'Field Ops Mgr — SLC RW',
  'SLC FW':  'Field Ops Mgr — SLC FW',
  '109 UT':  'Field Ops Mgr — 109 UT',
  'WY/MT':   'Field Ops Mgr — WY/MT',
  'ID/NV':   'Field Ops Mgr — ID/NV',
  'CO/NM':   'Field Ops Mgr — CO/NM',
  'UT/AZ':   'Field Ops Mgr — UT/AZ',
  'PAGE':    'Field Ops Mgr — Page',
};

// OCC + Dispatch are centralized at Maintenance Control (SLC FW)
const OCC_STAFF      = ['OCC Specialist 1', 'OCC Specialist 2', 'OCC Specialist 3', 'OCC Specialist 4'];
const DISPATCH_STAFF = ['Dispatcher 1',     'Dispatcher 2',     'Dispatcher 3',     'Dispatcher 4'];

// ── Build entries ─────────────────────────────────────────────────────────────

const entries = [];
let seq = 1;

// 1. MX On-Call — real CF export data (names kept as-is)
for (const e of CF_SCHEDULE) {
  if (!WEEK_DATES.includes(e.date)) continue;
  entries.push({
    id: `mx-${seq++}`,
    source: 'CompleteFlight',
    personnelType: 'MX On-Call',
    roleType: e.type,
    ownerName: e.owner,
    base: e.base,
    region: BASE_META[e.base]?.region ?? '',
    shiftDate: e.date,
    hours: e.hours,
    timezone: e.timezone,
  });
}

// 2. Pilot + Clinical + FOC per base
const focAdded = new Set();
for (const [base, crew] of Object.entries(BASE_CREWS)) {
  const region = BASE_META[base]?.region ?? '';
  for (const date of WEEK_DATES) {
    crew.pilots.forEach((name, i) => entries.push({
      id: `pilot-${seq++}`,
      source: 'CompleteFlight',
      personnelType: 'Pilot',
      roleType: i === 0 ? 'PIC' : 'SIC',
      ownerName: name,
      base, region,
      shiftDate: date,
      hours: '07:00 - 19:00',
      timezone: 'MDT',
    }));

    crew.clinical.forEach((name, i) => entries.push({
      id: `clin-${seq++}`,
      source: 'Protean',
      personnelType: 'Clinical',
      roleType: i === 0 ? 'Flight RN' : 'Paramedic',
      ownerName: name,
      base, region,
      shiftDate: date,
      hours: '07:00 - 19:00',
      timezone: 'MDT',
    }));
  }

  // FOC: one entry per region (attached to first base encountered for that region)
  if (region && !focAdded.has(region) && FOC_BY_REGION[region]) {
    focAdded.add(region);
    for (const date of WEEK_DATES) {
      entries.push({
        id: `foc-${seq++}`,
        source: 'Manual',
        personnelType: 'FOC On-Call',
        roleType: 'Field Ops Manager',
        ownerName: FOC_BY_REGION[region],
        base, region,
        shiftDate: date,
        hours: '24hr',
        timezone: 'MDT',
      });
    }
  }
}

// 3. OCC + Dispatch — centralized at MT Control
for (const date of WEEK_DATES) {
  OCC_STAFF.forEach((name, i) => entries.push({
    id: `occ-${seq++}`,
    source: 'Protean',
    personnelType: 'OCC',
    roleType: i < 2 ? 'Day OCC' : 'Night OCC',
    ownerName: name,
    base: 'MT Control',
    region: 'SLC FW',
    shiftDate: date,
    hours: i < 2 ? '07:00 - 19:00' : '19:00 - 07:00',
    timezone: 'MDT',
  }));

  DISPATCH_STAFF.forEach((name, i) => entries.push({
    id: `dsp-${seq++}`,
    source: 'Protean',
    personnelType: 'Dispatch',
    roleType: i < 2 ? 'Day Dispatch' : 'Night Dispatch',
    ownerName: name,
    base: 'MT Control',
    region: 'SLC FW',
    shiftDate: date,
    hours: i < 2 ? '07:00 - 19:00' : '19:00 - 07:00',
    timezone: 'MDT',
  }));
}

// ── Level 1 Trauma specialty staff ────────────────────────────────────────────
// These generate realistic gap patterns for ClinicalStaffingBoard demo.
// days[] indices correspond to WEEK_DATES positions (0=Mon, 1=Tue, ... 6=Sun).
// Omitted day indices = staffing gaps shown in red on the board.

const LEVEL1_SPECIALISTS = [
  // IMED/Hangar — Intermountain Medical Center
  { base: 'IMED/Hangar', region: '109 UT', roleType: 'Respiratory Therapist', ownerName: 'Respiratory Therapist 1', days: [0, 1, 2, 4, 5] },
  { base: 'IMED/Hangar', region: '109 UT', roleType: 'NICU RN',               ownerName: 'NICU RN 1',               days: [0, 1, 3, 4, 5] },
  { base: 'IMED/Hangar', region: '109 UT', roleType: 'Pediatric RN',           ownerName: 'Pediatric RN 1',          days: [0, 2, 3, 5]     },
  { base: 'IMED/Hangar', region: '109 UT', roleType: 'HROB RN',                ownerName: 'HROB RN 1',               days: [1, 2, 4, 5]     },

  // UV/ROOS — Utah Valley / Roosevelt
  { base: 'UV/ROOS', region: '109 UT', roleType: 'Respiratory Therapist', ownerName: 'Respiratory Therapist 2', days: [0, 1, 3, 4]     },
  { base: 'UV/ROOS', region: '109 UT', roleType: 'NICU RN',               ownerName: 'NICU RN 2',               days: [0, 2, 3, 4]     },
  { base: 'UV/ROOS', region: '109 UT', roleType: 'Pediatric RN',           ownerName: 'Pediatric RN 2',          days: [0, 1, 3, 5]     },
  { base: 'UV/ROOS', region: '109 UT', roleType: 'HROB RN',                ownerName: 'HROB RN 2',               days: [0, 1, 2, 4]     },

  // MKY/LGU — McKay-Dee / Logan
  { base: 'MKY/LGU', region: '109 UT', roleType: 'Respiratory Therapist', ownerName: 'Respiratory Therapist 3', days: [0, 1, 2, 5]     },
  { base: 'MKY/LGU', region: '109 UT', roleType: 'NICU RN',               ownerName: 'NICU RN 3',               days: [0, 3, 4, 5]     },
  { base: 'MKY/LGU', region: '109 UT', roleType: 'Pediatric RN',           ownerName: 'Pediatric RN 3',          days: [1, 2, 3, 4]     },
  { base: 'MKY/LGU', region: '109 UT', roleType: 'HROB RN',                ownerName: 'HROB RN 3',               days: [0, 2, 4, 5]     },
];

for (const spec of LEVEL1_SPECIALISTS) {
  for (const dayIdx of spec.days) {
    entries.push({
      id: `l1-${seq++}`,
      source: 'Protean',
      personnelType: 'Clinical',
      roleType: spec.roleType,
      ownerName: spec.ownerName,
      base: spec.base,
      region: spec.region,
      shiftDate: WEEK_DATES[dayIdx],
      hours: '07:00 - 19:00',
      timezone: 'MDT',
    });
  }
}

export const DEMO_SCHEDULE_ENTRIES = entries;
