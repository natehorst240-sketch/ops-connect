// ============================================================================
// MX On-Call Schedule — driven by CompleteFlight export (May 2026)
// CF_SCHEDULE entries: { date, type, base, hours, timezone, owner }
// types: 'Maintenance On Call' | '1st Out MX On Call' | '2nd Out MX On Call'
//        | 'Maintenance Control'
// ============================================================================

import { CF_SCHEDULE } from './cfSchedule';

export const DEMO_TODAY_ISO = '2026-05-18';

// ── Base metadata: maps CompleteFlight base name → display info ──────────────
export const BASE_META = {
  'Woodscross':       { region: 'SLC RW',  label: 'Woodscross (RW)' },
  'FW Hangar':        { region: 'SLC FW',  label: 'KSLC Hangar IH-72-76' },
  'MT Control':       { region: 'SLC FW',  label: 'Maintenance Control' },
  'SGU/CDC':          { region: '109 UT',  label: 'St. George / Cedar City' },
  'MKY/LGU':          { region: '109 UT',  label: 'McKay-Dee / Logan' },
  'UV/ROOS':          { region: '109 UT',  label: 'Utah Valley / Roosevelt' },
  'IMED/Hangar':      { region: '109 UT',  label: 'IMED IH-14' },
  'Greybulll':        { region: 'WY/MT',   label: 'Greybull IH-23' },
  'FW Riverton':      { region: 'WY/MT',   label: 'Riverton IH-80 (FW)' },
  'Vernal':           { region: 'WY/MT',   label: 'Vernal IH-78' },
  'Lander':           { region: 'WY/MT',   label: 'Lander IH-21' },
  'Rawlins':          { region: 'WY/MT',   label: 'Rawlins IH-25' },
  'RW Elko':          { region: 'ID/NV',   label: 'Elko IH-04/70 (RW)' },
  'Burley':           { region: 'ID/NV',   label: 'Burley IH-08' },
  'Rexburg':          { region: 'ID/NV',   label: 'Rexburg IH-11' },
  'Ely':              { region: 'ID/NV',   label: 'Ely IH-05' },
  'Winnemucca':       { region: 'ID/NV',   label: 'Winnemucca IH-03' },
  'RW Rover':         { region: 'ID/NV',   label: 'RW Rover (Mobile)' },
  'Glenwood Springs': { region: 'CO/NM',   label: 'Glenwood Springs IH-24' },
  'Steamboat Springs':{ region: 'CO/NM',   label: 'Steamboat Springs IH-26' },
  'Los Alamos':       { region: 'CO/NM',   label: 'Los Alamos IH-27-28' },
  'Cortez':           { region: 'CO/NM',   label: 'Cortez IH-22/79' },
  'Pagosa Springs':   { region: 'CO/NM',   label: 'Pagosa Springs IH-81' },
  'Fort Mohave':      { region: 'UT/AZ',   label: 'Fort Mohave IH-06' },
  'Richfield':        { region: 'UT/AZ',   label: 'Richfield IH-12' },
  'Moab':             { region: 'UT/AZ',   label: 'Moab IH-20' },
  'Page':             { region: 'PAGE',    label: 'Page IH-17-18/77' },
};

// Region display order
export const REGIONS = ['SLC RW', 'SLC FW', '109 UT', 'WY/MT', 'ID/NV', 'CO/NM', 'UT/AZ', 'PAGE'];

// Known phone numbers keyed by owner name (partial match — lowercase)
const PHONE_BOOK = {
  'alec overton':       '801-660-7640',
  'mac paye':           '916-871-6135',
  'jean-paul guidry':   '801-738-4919',
  'bryce low':          '909-744-7878',
  'nate anderson':      '360-951-3875',
  'nathan anderson':    '360-951-3875',
  'robert guty':        '307-272-2616',
  'rex schwarz':        '208-969-0844',
  'nicholas gonzales':  '337-519-5722',
  'derek jorgensen':    '801-707-0318',
  'john modrow':        '907-209-9701',
  'jon hankins':        '702-824-8755',
  'brian hyland':       '801-842-9086',
  'fred bistline':      '435-233-8177',
  'denton siebrecht':   '928-640-1840',
};

export function phoneFor(name) {
  return PHONE_BOOK[name?.toLowerCase()] ?? null;
}

// ── Date helpers ─────────────────────────────────────────────────────────────

export function addDays(iso, n) {
  const ms = new Date(iso + 'T12:00:00Z').getTime();
  return new Date(ms + n * 86_400_000).toISOString().slice(0, 10);
}

// ── Query helpers ─────────────────────────────────────────────────────────────

/** All entries for a single date, grouped by base name. */
export function getOncallForDate(dateIso) {
  const entries = CF_SCHEDULE.filter(e => e.date === dateIso);
  const byBase = {};
  for (const e of entries) {
    if (!byBase[e.base]) byBase[e.base] = [];
    byBase[e.base].push(e);
  }
  return byBase;
}

/**
 * Returns an array of day objects covering numDays starting from startIso.
 * Each day: { date, byBase: { [baseName]: entry[] } }
 */
export function getScheduleRange(startIso, numDays = 7) {
  return Array.from({ length: numDays }, (_, i) => {
    const date = addDays(startIso, i);
    return { date, byBase: getOncallForDate(date) };
  });
}

/** Get all bases that appear in the data, sorted by region order then label. */
export const ALL_BASES = Object.keys(BASE_META).sort((a, b) => {
  const ri = REGIONS.indexOf(BASE_META[a]?.region);
  const rj = REGIONS.indexOf(BASE_META[b]?.region);
  if (ri !== rj) return ri - rj;
  return BASE_META[a].label.localeCompare(BASE_META[b].label);
});
