// Demo schedule entries covering the 7-day window around DEMO_TODAY_ISO.
// Covers all six personnel types across all regions.
//
// MX On-Call entries come from the real CompleteFlight export (cfSchedule.js).
// Pilot entries are CompleteFlight format (same API, different type).
// Clinical, OCC, Dispatch entries are Protean format.
// FOC On-Call entries are manually maintained.
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
  'Greybulll':         { pilots: ['Jake Morrison',    'Sarah Chen'],        clinical: ['Emily Torres',    'Kevin Sato']      },
  'Lander':            { pilots: ['Tyler Burke',       'Dana Rivers'],       clinical: ['Chris Hall',      'Maria Vega']      },
  'Rawlins':           { pilots: ['Brian Foster',      'Megan Tran'],        clinical: ['Taylor Moore',    'Sam Evans']       },
  'Vernal':            { pilots: ['Scott Larson',      'Amy Nguyen'],        clinical: ['Jordan Pierce',   'Riley Chen']      },
  'FW Riverton':       { pilots: ['Cole Hudson',       'Rachel Park'],       clinical: ['Alex Castro',     'Morgan Webb']     },
  'Woodscross':        { pilots: ['Tom Bradley',       'Maria Santos'],      clinical: ['Jordan Lee',      'Casey Kim']       },
  'FW Hangar':         { pilots: ['Chris Williams',    'Ashley Park'],       clinical: ['Melissa Grant',   'Alex Rivera']     },
  'SGU/CDC':           { pilots: ['Nathan Brooks',     'Lisa Torres'],       clinical: ['Chris Yamoto',    'Dana Pierce']     },
  'MKY/LGU':           { pilots: ['David Nguyen',      'Rachel Kim'],        clinical: ['Sam Patel',       'Jenna Walsh']     },
  'UV/ROOS':           { pilots: ['Andrew Mills',      'Jen Carson'],        clinical: ['Monica Lee',      'Derek Chang']     },
  'IMED/Hangar':       { pilots: ['Travis Bell',       'Nicole Ramos'],      clinical: ['Brianna Moss',    'Eric Tanaka']     },
  'Rexburg':           { pilots: ['Michael Torres',    'Jen Walsh'],         clinical: ['Ryan Okafor',     'Kelly Chen']      },
  'Burley':            { pilots: ['Blake Porter',      'Amy Davis'],         clinical: ['Taylor Ellis',    'Sam Nguyen']      },
  'RW Elko':           { pilots: ['Jordan Hughes',     'Megan Price'],       clinical: ['Alex Kim',        'Dana Torres']     },
  'Ely':               { pilots: ['Nathan Webb',       'Cassie Moore'],      clinical: ['Morgan Hill',     'Tyler Evans']     },
  'Winnemucca':        { pilots: ['Kyle Ross',         'Amber Chen'],        clinical: ['Jamie Patel',     'Riley Webb']      },
  'Glenwood Springs':  { pilots: ["Patrick O'Brien",   'Amanda Chu'],        clinical: ['Morgan Hill',     'Tyler Moss']      },
  'Steamboat Springs': { pilots: ['Drew Sullivan',     'Kate Marsh'],        clinical: ['Jamie Rivera',    'Alex Webb']       },
  'Los Alamos':        { pilots: ['Carlos Rivera',     'Heather Park'],      clinical: ['Sam Torres',      'Dana Ellis']      },
  'Cortez':            { pilots: ['Travis Knox',       'Brianna Scott'],     clinical: ['Jordan Pham',     'Casey Torres']    },
  'Pagosa Springs':    { pilots: ['Dylan Reyes',       'Sarah Knight'],      clinical: ['Monica Webb',     'Derek Ellis']     },
  'Fort Mohave':       { pilots: ['Ryan Cooper',       'Kaitlyn Murphy'],    clinical: ['Jamie Torres',    'Alex Webb']       },
  'Richfield':         { pilots: ['Jordan Hughes',     'Megan Tran'],        clinical: ['Casey Pham',      'Riley Evans']     },
  'Moab':              { pilots: ['Marcus Bell',       'Victoria Chen'],     clinical: ['Steph Liu',       'James Thompson']  },
  'Page':              { pilots: ['Brandon Lee',       'Tiffany Ross'],      clinical: ['Marcus Thompson', 'Steph Liu']       },
};

// Field ops manager on-call — one per region, manual entry
const FOC_BY_REGION = {
  'SLC RW':  'Derek Jorgensen',
  'SLC FW':  'Brian Hyland',
  '109 UT':  'Fred Bistline',
  'WY/MT':   'Robert Guty',
  'ID/NV':   'Rex Schwarz',
  'CO/NM':   'Bryce Low',
  'UT/AZ':   'Denton Siebrecht',
  'PAGE':    'Jon Hankins',
};

// OCC + Dispatch are centralized at Maintenance Control (SLC FW)
const OCC_STAFF    = ['Victoria Harmon', 'Marcus Webb',      'Stephanie Liu',  'James Okafor'];
const DISPATCH_STAFF = ['Casey Thompson', 'Jordan Ellis',    'Morgan Pierce',  'Taylor Nguyen'];

// ── Build entries ─────────────────────────────────────────────────────────────

const entries = [];
let seq = 1;

// 1. MX On-Call — real CF export data
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

export const DEMO_SCHEDULE_ENTRIES = entries;
