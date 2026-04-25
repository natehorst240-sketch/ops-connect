// ============================================================================
// PERSONA CALENDAR DATA
// ----------------------------------------------------------------------------
// Returns the events to display on each persona's calendar, scoped correctly
// to what that role should see. Same source-of-truth events; the function
// just filters and sometimes aggregates depending on the role.
//
// Demo "today" is Saturday April 25, 2026. Events range across the surrounding
// week (Mon Apr 20 → Sun Apr 26) and into the following week.
// ============================================================================

// Master event list — the source of truth before persona scoping
const ALL_EVENTS = [
  // ===== AOG (cascading event) =====
  { id: 'aog-1', date: '2026-04-22', endDate: '2026-04-29', type: 'aog',
    title: 'N291HC AOG', detail: 'Tail rotor gearbox · awaiting parts',
    aircraft: 'N291HC', region: '109 UT', base: 'McKay Dee', priority: 'critical' },

  // ===== Inspections (from real Veryon Due_List_2026-04-24.csv) =====
  { id: 'insp-1', date: '2026-04-25', type: 'inspection',
    title: 'N281HC O2 bottle', detail: 'Monthly oxygen exchange',
    aircraft: 'N281HC', region: '109 UT', base: 'IMED IH-14', priority: 'high' },
  { id: 'insp-2', date: '2026-04-27', type: 'inspection',
    title: 'N271HC gearbox', detail: '90° gearbox oil change',
    aircraft: 'N271HC', region: '109 UT', base: 'Roosevelt IH-19', priority: 'high' },
  { id: 'insp-3', date: '2026-04-29', type: 'inspection',
    title: 'N531HC port FX', detail: 'Port FX 30-day inspection',
    aircraft: 'N531HC', region: '109 UT', base: 'UVRMC IH-16', priority: 'normal' },
  { id: 'insp-4', date: '2026-04-29', type: 'inspection',
    title: 'N581HC landing gear', detail: 'Landing gear inspection',
    aircraft: 'N581HC', region: 'SLC FW', base: 'SLC IH 72-76', priority: 'normal' },
  { id: 'insp-5', date: '2026-04-30', type: 'inspection',
    title: 'N251HC scissors', detail: 'Non-rotating scissors exam',
    aircraft: 'N251HC', region: '109 UT', base: 'St. George IH-09', priority: 'normal' },
  { id: 'insp-6', date: '2026-04-30', type: 'inspection',
    title: 'N261HC scissors', detail: 'Rotating scissors exam',
    aircraft: 'N261HC', region: '109 UT', base: 'Cedar City IH-10', priority: 'normal' },
  { id: 'insp-7', date: '2026-04-30', type: 'inspection',
    title: 'N431HC fire ext', detail: 'Cockpit fire extinguisher monthly',
    aircraft: 'N431HC', region: '109 UT', base: 'Logan IH-15', priority: 'normal' },
  { id: 'insp-8', date: '2026-04-30', type: 'inspection',
    title: 'N481HC LifePort 12-mo', detail: 'AAIP LifePort 12-month inspection',
    aircraft: 'N481HC', region: 'SLC FW', base: 'St. George IH-71', priority: 'normal' },
  { id: 'insp-9', date: '2026-05-01', type: 'inspection',
    title: 'N381HC hydraulic', detail: 'Hydraulic fluid drain & replace',
    aircraft: 'N381HC', region: 'SLC FW', base: 'SLC IH 72-76', priority: 'normal' },

  // ===== Scheduled MX windows =====
  { id: 'mx-1', date: '2026-04-25', endDate: '2026-04-28', type: 'mx',
    title: 'N631HC scheduled MX', detail: 'Phase inspection',
    aircraft: 'N631HC', region: '109 UT', base: 'KSLC Hangar', priority: 'normal' },
  { id: 'mx-2', date: '2026-04-26', endDate: '2026-04-27', type: 'mx',
    title: 'N407CH scheduled MX', detail: 'Phase 2 inspection',
    aircraft: 'N407CH', region: 'PAGE', base: 'Page IH-17-18', priority: 'normal' },
  { id: 'mx-3', date: '2026-04-28', endDate: '2026-04-29', type: 'mx',
    title: 'N39KM 100-hr', detail: '100-hour inspection',
    aircraft: 'N39KM', region: 'WY/MT', base: 'Greybull IH-23', priority: 'normal' },

  // ===== PR flights =====
  { id: 'pr-1', date: '2026-04-27', type: 'pr',
    title: 'N431HC PR flight', detail: 'Public relations media flight',
    aircraft: 'N431HC', region: '109 UT', base: 'Logan IH-15', priority: 'normal' },
  { id: 'pr-2', date: '2026-05-08', type: 'pr',
    title: 'N251HC media flight', detail: 'Public relations media flight',
    aircraft: 'N251HC', region: '109 UT', base: 'St. George IH-09', priority: 'normal' },

  // ===== Pilot training =====
  { id: 'tr-1', date: '2026-04-26', endDate: '2026-04-27', type: 'training',
    title: 'N731HC pilot recurrent', detail: 'Recurrent training',
    aircraft: 'N731HC', region: '109 UT', base: 'KSLC Hangar', priority: 'normal' },
  { id: 'tr-2', date: '2026-04-28', type: 'training',
    title: 'N281HC NVG training', detail: 'Night vision goggle training',
    aircraft: 'N281HC', region: '109 UT', base: 'IMED IH-14', priority: 'normal' },

  // ===== Crew shifts =====
  // Nathan Anderson (AMT, Greybull) — his shifts
  { id: 'cs-na-1', date: '2026-04-25', type: 'crew_shift',
    title: 'My shift · 07:00–19:00', detail: 'Greybull base coverage',
    crew: 'Nathan Anderson', base: 'Greybull IH-23', region: 'WY/MT', priority: 'normal' },
  { id: 'cs-na-2', date: '2026-04-28', type: 'crew_shift',
    title: 'My shift · 07:00–19:00', detail: 'Greybull base coverage',
    crew: 'Nathan Anderson', base: 'Greybull IH-23', region: 'WY/MT', priority: 'normal' },
  { id: 'cs-na-3', date: '2026-04-29', type: 'crew_shift',
    title: 'My shift · 07:00–19:00', detail: 'Greybull base coverage',
    crew: 'Nathan Anderson', base: 'Greybull IH-23', region: 'WY/MT', priority: 'normal' },

  // M. Bryce (Flight Nurse, Cedar City) — her shifts
  { id: 'cs-mb-1', date: '2026-04-25', type: 'crew_shift',
    title: 'My shift · 09:00–09:00', detail: 'FN-URBAN · 24hr',
    crew: 'M. Bryce', base: 'Cedar City Hospital', region: '109 UT', priority: 'normal' },
  { id: 'cs-mb-2', date: '2026-04-28', type: 'crew_shift',
    title: 'My shift · 09:00–09:00', detail: 'FN-URBAN · 24hr',
    crew: 'M. Bryce', base: 'Cedar City Hospital', region: '109 UT', priority: 'normal' },

  // Other regional crew shifts (visible to RMM in WY/MT)
  { id: 'cs-rg-1', date: '2026-04-25', type: 'crew_shift',
    title: 'R. Guty · 07–19', detail: 'Greybull base AMT',
    crew: 'Robert Guty', base: 'Greybull IH-23', region: 'WY/MT', priority: 'normal' },
  { id: 'cs-rg-2', date: '2026-04-26', type: 'crew_shift',
    title: 'A. Quitberg · 07–19', detail: 'Riverton base AMT',
    crew: 'Aaron Quitberg', base: 'Riverton IH-80', region: 'WY/MT', priority: 'normal' },
  { id: 'cs-rg-3', date: '2026-04-27', type: 'crew_shift',
    title: 'R. Guty · 19–07', detail: 'Greybull night coverage',
    crew: 'Robert Guty', base: 'Greybull IH-23', region: 'WY/MT', priority: 'normal' },

  // ===== Open shifts (publishable / claimable) =====
  { id: 'os-1', date: '2026-04-30', type: 'open_shift',
    title: 'OPEN · FN-URBAN 19–07', detail: 'Intermountain Medical Center · $8/hr diff',
    role: 'flight_nurse', region: '109 UT', base: 'Intermountain Medical Center', priority: 'high' },
  { id: 'os-2', date: '2026-05-01', type: 'open_shift',
    title: 'OPEN · RT 19–07', detail: 'McKay Dee · $6/hr diff',
    role: 'respiratory', region: '109 UT', base: 'McKay Dee', priority: 'normal' },
  { id: 'os-3', date: '2026-05-02', type: 'open_shift',
    title: 'OPEN · FN-URBAN 06–18', detail: 'St. George · fatigue warn',
    role: 'flight_nurse', region: '109 UT', base: 'St. George Hospital', priority: 'high' },
  { id: 'os-4', date: '2026-05-03', type: 'open_shift',
    title: 'OPEN · PEDS 19–07', detail: 'PCH · $10/hr · need PALS+PEDS',
    role: 'pediatric', region: '109 UT', base: 'Primary Childrens Hospital', priority: 'high' },

  // ===== Cert expirations =====
  { id: 'cert-1', date: '2026-06-12', type: 'cert_exp',
    title: 'M. Bryce · PALS expires', detail: 'Renewal 49 days out',
    crew: 'M. Bryce', region: '109 UT', priority: 'normal' },
  { id: 'cert-2', date: '2026-05-30', type: 'cert_exp',
    title: 'R. Linsler · PALS expires', detail: 'Renewal 35 days out',
    crew: 'R. Linsler', region: '109 UT', priority: 'high' },

  // ===== Audit / approval events (for QA) =====
  { id: 'ap-1', date: '2026-04-25', type: 'approval',
    title: 'MX approval · N39KM', detail: 'RMM approved',
    region: 'WY/MT', priority: 'normal' },
  { id: 'ap-2', date: '2026-04-25', type: 'approval',
    title: 'PR approved · N251HC', detail: 'Director approved',
    region: '109 UT', priority: 'normal' },
];

// ============================================================================
// PER-PERSONA SCOPING
// ============================================================================

export function getEventsForPersona(persona) {
  switch (persona.role) {
    case 'DIRECTOR':         return scopeDirector(persona);
    case 'RMM':              return scopeRMM(persona);
    case 'AMT':              return scopeAMT(persona);
    case 'QA':               return scopeQA(persona);
    case 'MX_SCHEDULER':     return scopeMXScheduler(persona);
    case 'CREW_SCHEDULER':   return scopeCrewScheduler(persona);
    case 'FLIGHT_NURSE':     return scopeNurse(persona);
    default: return [];
  }
}

export function getCalendarConfigForPersona(persona) {
  switch (persona.role) {
    case 'DIRECTOR':       return { title: 'Fleet at a Glance · This Week',     subtitle: 'Condensed view across all regions and aircraft',  scopeLabel: 'ALL REGIONS',         density: 'condensed' };
    case 'RMM':            return { title: `${persona.region} · This Week`,     subtitle: 'Aircraft, crew, and approvals in your region',     scopeLabel: persona.region,        density: 'normal' };
    case 'AMT':            return { title: `My Week · ${persona.base}`,         subtitle: 'My shifts and aircraft at my base',                scopeLabel: persona.base,          density: 'normal' };
    case 'QA':             return { title: 'Compliance · This Week',            subtitle: 'All-region oversight with audit overlay',          scopeLabel: 'ALL REGIONS · QA',    density: 'condensed' };
    case 'MX_SCHEDULER':   return { title: 'Maintenance Schedule · This Week',  subtitle: 'All aircraft events · drag to reschedule',         scopeLabel: 'FLEET-WIDE',          density: 'normal' };
    case 'CREW_SCHEDULER': return { title: 'Crew Schedule · This Week',         subtitle: 'Shifts, open shifts, and cert expirations',        scopeLabel: 'ALL CREW',            density: 'normal' };
    case 'FLIGHT_NURSE':   return { title: 'My Schedule',                       subtitle: 'My shifts and shifts I can claim',                 scopeLabel: persona.base,          density: 'normal' };
    default:               return { title: 'My Week',                           subtitle: '',                                                 scopeLabel: '',                    density: 'normal' };
  }
}

// === Director: condensed all-region view ===
// Show every aircraft event, but the calendar's condensed density makes
// it scan like an executive summary.
function scopeDirector() {
  return ALL_EVENTS.filter(e =>
    e.type === 'aog' ||
    e.type === 'inspection' ||
    e.type === 'mx' ||
    e.type === 'pr' ||
    e.type === 'training'
  );
}

// === RMM: their region's aircraft + crew ===
function scopeRMM(persona) {
  return ALL_EVENTS.filter(e => e.region === persona.region);
}

// === AMT: their base's aircraft + their own shifts ===
function scopeAMT(persona) {
  return ALL_EVENTS.filter(e => {
    if (e.crew === persona.name) return true;          // their shifts
    if (e.base === persona.base) return true;          // their base's aircraft
    return false;
  });
}

// === QA: all events with audit/approval overlay highlighted ===
function scopeQA() {
  return ALL_EVENTS.filter(e =>
    e.type === 'approval' ||
    e.type === 'audit' ||
    e.type === 'aog' ||
    e.type === 'inspection' ||
    e.type === 'mx' ||
    e.type === 'pr'
  );
}

// === MX Scheduler: all aircraft events ===
function scopeMXScheduler() {
  return ALL_EVENTS.filter(e =>
    ['inspection', 'mx', 'aog', 'pr', 'training'].includes(e.type)
  );
}

// === Crew Scheduler: shifts, open shifts, cert expirations ===
function scopeCrewScheduler() {
  return ALL_EVENTS.filter(e =>
    ['crew_shift', 'open_shift', 'cert_exp', 'time_off'].includes(e.type)
  );
}

// === Flight Nurse: her shifts + claimable open shifts in region + her cert exp ===
function scopeNurse(persona) {
  return ALL_EVENTS.filter(e => {
    if (e.crew === persona.name) return true;                                    // her shifts and certs
    if (e.type === 'open_shift' && e.region === persona.region) return true;     // claimable in region
    return false;
  });
}
