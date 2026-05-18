// Demo schedule entries covering the 7-day window around DEMO_TODAY_ISO.
// Covers all personnel types across all regions.
//
// MX On-Call entries come from the real CompleteFlight export (cfSchedule.js) —
// those names are real and must not be altered.
//
// All other names are role-title placeholders so ghost employees cannot
// accidentally appear when real Dataverse data connects.
//
// When Dataverse is live, useFleetData fetches cr_scheduleentries and this
// file becomes unused — all boards fall through to live data first.

import { CF_SCHEDULE } from './cfSchedule';
import { BASE_META, DEMO_TODAY_ISO, addDays } from './mxOncallSchedule';

const WEEK_DATES = Array.from({ length: 7 }, (_, i) => addDays(DEMO_TODAY_ISO, i));

// ── Per-base pilot + clinical crews ──────────────────────────────────────────
// Each RW/FW base has one PIC, one SIC, one Flight RN, one Paramedic.
// PCH has a Peds-designated crew (same roleTypes, Peds-trained).
// Production rows: CompleteFlight (pilots), Protean Hub (clinical).

const BASE_CREWS = {
  'Greybull':          { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Lander':            { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Rawlins':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Vernal':            { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'FW Riverton':       { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Woodscross':        { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'FW Hangar':         { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'SGU/CDC':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'MKY/LGU':           { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  // UV/ROOS and IMED/Hangar are combined MX On-Call bases but 4 separate clinical bases
  'IMED':              { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Hangar':            { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Utah Valley':       { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  'Roosevelt':         { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Flight Nurse 1',  'Paramedic 1'] },
  // PCH — cross-region Peds/Neo team
  'PCH':               { pilots: ['Pilot 1 (PIC)',  'Pilot 2 (SIC)'],  clinical: ['Peds Flight Nurse 1', 'Paramedic 1'] },
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

// OCS (Operational Control Specialists) + CS (Communication Specialists)
// — SOP terminology; centralized at MT Control (Comm Center)
const OCS_STAFF = ['OCS 1', 'OCS 2', 'OCS 3', 'OCS 4'];
const CS_STAFF  = ['CS 1',  'CS 2',  'CS 3',  'CS 4'];

// AMC Coordinators — 24-hr coverage mandate (SOP 7.3.1)
// Stationed at MT Control / Comm Center
const AMC_STAFF = ['AMC Coordinator 1', 'AMC Coordinator 2', 'AMC Coordinator 3'];

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
    base: e.base === 'Greybulll' ? 'Greybull' : e.base,
    region: BASE_META[e.base === 'Greybulll' ? 'Greybull' : e.base]?.region ?? '',
    shiftDate: e.date,
    hours: e.hours,
    timezone: e.timezone,
  });
}

// 2. Pilot + Clinical + FOC per base
const focAdded = new Set();
for (const [base, crew] of Object.entries(BASE_CREWS)) {
  const region = BASE_META[base]?.region ?? '';
  if (!BASE_META[base]) {
    console.warn(`[demoScheduleEntries] Unknown base "${base}" — not in BASE_META, skipping.`);
    continue;
  }
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
      source: 'Protean Hub',
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

// 3. OCS + CS — Comm Center (MT Control) — SOP terms for OCC/Dispatch roles
for (const date of WEEK_DATES) {
  OCS_STAFF.forEach((name, i) => entries.push({
    id: `ocs-${seq++}`,
    source: 'Protean Hub',
    personnelType: 'OCS',
    roleType: i < 2 ? 'Day OCS' : 'Night OCS',
    ownerName: name,
    base: 'MT Control',
    region: 'SLC FW',
    shiftDate: date,
    hours: i < 2 ? '07:00 - 19:00' : '19:00 - 07:00',
    timezone: 'MDT',
  }));

  CS_STAFF.forEach((name, i) => entries.push({
    id: `cs-${seq++}`,
    source: 'Protean Hub',
    personnelType: 'CS',
    roleType: i < 2 ? 'Day CS' : 'Night CS',
    ownerName: name,
    base: 'MT Control',
    region: 'SLC FW',
    shiftDate: date,
    hours: i < 2 ? '07:00 - 19:00' : '19:00 - 07:00',
    timezone: 'MDT',
  }));
}

// 4. AMC Coordinators — 24-hr coverage, MT Control (SOP 7.3.1 Coordinator Schedule)
for (const date of WEEK_DATES) {
  AMC_STAFF.forEach((name, i) => entries.push({
    id: `amc-${seq++}`,
    source: 'Manual',
    personnelType: 'AMC Coordinator',
    roleType: i === 0 ? 'Day AMC' : i === 1 ? 'Night AMC' : 'On-Call AMC',
    ownerName: name,
    base: 'MT Control',
    region: 'SLC FW',
    shiftDate: date,
    hours: i === 0 ? '07:00 - 19:00' : i === 1 ? '19:00 - 07:00' : '24hr',
    timezone: 'MDT',
  }));
}

// ── Level 1 Trauma specialty staff ────────────────────────────────────────────
// Gap patterns for ClinicalStaffingBoard demo.
// days[] indices → WEEK_DATES positions (0=Mon…6=Sun). Omitted = gap.

const SPECIALTY_STAFF = [
  // IMED — Intermountain Medical Center (Level 1 Trauma)
  { base: 'IMED', region: '109 UT', roleType: 'Respiratory Therapist', ownerName: 'Respiratory Therapist 1', days: [0, 1, 2, 4, 5] },
  { base: 'IMED', region: '109 UT', roleType: 'NICU RN',               ownerName: 'NICU RN 1',               days: [0, 1, 3, 4, 5] },
  { base: 'IMED', region: '109 UT', roleType: 'Pediatric RN',           ownerName: 'Pediatric RN 1',          days: [0, 2, 3, 5]     },
  { base: 'IMED', region: '109 UT', roleType: 'HROB RN',                ownerName: 'HROB RN 1',               days: [1, 2, 4, 5]     },
  { base: 'IMED', region: '109 UT', roleType: 'Balloon Pump',           ownerName: 'Balloon Pump Specialist 1', days: [0, 1, 2, 3, 5] },
  { base: 'IMED', region: '109 UT', roleType: 'VAD',                    ownerName: 'VAD Specialist 1',          days: [0, 2, 3, 4, 5] },
  { base: 'IMED', region: '109 UT', roleType: 'MCS/ECMO',               ownerName: 'ECMO Specialist 1',         days: [0, 1, 3, 4]     },

  // Utah Valley — UVRMC IH-16 (Level 1 Trauma)
  { base: 'Utah Valley', region: '109 UT', roleType: 'Respiratory Therapist', ownerName: 'Respiratory Therapist 2', days: [0, 1, 3, 4]     },
  { base: 'Utah Valley', region: '109 UT', roleType: 'NICU RN',               ownerName: 'NICU RN 2',               days: [0, 2, 3, 4]     },
  { base: 'Utah Valley', region: '109 UT', roleType: 'Pediatric RN',           ownerName: 'Pediatric RN 2',          days: [0, 1, 3, 5]     },
  { base: 'Utah Valley', region: '109 UT', roleType: 'HROB RN',                ownerName: 'HROB RN 2',               days: [0, 1, 2, 4]     },
  { base: 'Utah Valley', region: '109 UT', roleType: 'Balloon Pump',           ownerName: 'Balloon Pump Specialist 2', days: [0, 2, 4, 5]   },
  { base: 'Utah Valley', region: '109 UT', roleType: 'VAD',                    ownerName: 'VAD Specialist 2',          days: [1, 2, 3, 5]   },
  { base: 'Utah Valley', region: '109 UT', roleType: 'MCS/ECMO',               ownerName: 'ECMO Specialist 2',         days: [0, 1, 4, 5]   },

  // PCH — Peds/Neo specialty crew
  { base: 'PCH', region: '109 UT', roleType: 'NICU RN',      ownerName: 'NICU RN 3',      days: [0, 1, 2, 3, 4, 5] },
  { base: 'PCH', region: '109 UT', roleType: 'Pediatric RN', ownerName: 'Pediatric RN 3', days: [0, 1, 2, 4, 5]    },
];

for (const spec of SPECIALTY_STAFF) {
  for (const dayIdx of spec.days) {
    entries.push({
      id: `spec-${seq++}`,
      source: 'Protean Hub',
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
