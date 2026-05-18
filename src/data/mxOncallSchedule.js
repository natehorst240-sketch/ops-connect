// ============================================================================
// MX On-Call Schedule — per-base roster, 8-on / 6-off rotation
// ----------------------------------------------------------------------------
// Each base entry has its own persons array.  The schedule engine picks
// persons[(slotIndex + phaseOffset) % persons.length] for each slot so
// rotations are staggered across bases.
//
// Phase 2: replace getWeeklySchedule() with a CompleteFlight / Dataverse
// API call that returns the same slot shape.
// ============================================================================

// Anchor: Wednesday April 16, 2025
const ANCHOR_ISO = '2025-04-16';

// Demo "today" — matches the rest of the app
export const DEMO_TODAY_ISO = '2026-05-18';

// ============================================================================
// PER-BASE ON-CALL ROSTER
// phaseOffset staggers slots so bases don't all hand off on the same cycle.
// persons[] — list every mechanic who rotates at this base.
// ============================================================================

export const ONCALL_ROSTER = [
  // ── 109 UT ────────────────────────────────────────────────────────────────
  {
    baseId: 'st-george',    baseLabel: 'St. George IH-09/71', region: '109 UT', phaseOffset: 0,
    persons: [
      { id: 'sg1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'cedar-city',   baseLabel: 'Cedar City IH-10',    region: '109 UT', phaseOffset: 1,
    persons: [
      { id: 'cc1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'roosevelt',    baseLabel: 'Roosevelt IH-19',      region: '109 UT', phaseOffset: 2,
    persons: [
      { id: 'rv1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'imed',         baseLabel: 'IMED IH-14',           region: '109 UT', phaseOffset: 3,
    persons: [
      { id: 'im1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'mckay',        baseLabel: 'McKay-Dee IH-13',      region: '109 UT', phaseOffset: 4,
    persons: [
      { id: 'mk1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'logan',        baseLabel: 'Logan IH-15',          region: '109 UT', phaseOffset: 5,
    persons: [
      { id: 'ao',  name: 'Alec Overton',   initials: 'AO', phone: '801-660-7640' },
      { id: 'mp',  name: 'Mac Paye',       initials: 'MP', phone: '916-871-6135' },
    ],
  },
  {
    baseId: 'uvrmc',        baseLabel: 'Utah Valley IH-16',    region: '109 UT', phaseOffset: 0,
    persons: [
      { id: 'uv1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  // ── SLC FW ────────────────────────────────────────────────────────────────
  {
    baseId: 'kslc',         baseLabel: 'KSLC Hangar IH-72-76', region: 'SLC FW', phaseOffset: 1,
    persons: [
      { id: 'jpg', name: 'Jean-Paul Guidry', initials: 'JG', phone: '801-738-4919' },
      { id: 'bl',  name: 'Bryce Low',        initials: 'BL', phone: '909-744-7878' },
    ],
  },
  // ── WY/MT ─────────────────────────────────────────────────────────────────
  {
    baseId: 'riverton',     baseLabel: 'Riverton IH-80',        region: 'WY/MT', phaseOffset: 2,
    persons: [
      { id: 'ri1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'greybull',     baseLabel: 'Greybull IH-23',        region: 'WY/MT', phaseOffset: 3,
    persons: [
      { id: 'na', name: 'Nate Anderson', initials: 'NA', phone: '360-951-3875' },
      { id: 'rg', name: 'Robert Guty',   initials: 'RG', phone: '307-272-2616' },
    ],
  },
  {
    baseId: 'vernal',       baseLabel: 'Vernal IH-78',          region: 'WY/MT', phaseOffset: 4,
    persons: [
      { id: 've1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'lander',       baseLabel: 'Lander IH-21',          region: 'WY/MT', phaseOffset: 5,
    persons: [
      { id: 'la1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'rawlins',      baseLabel: 'Rawlins IH-25',         region: 'WY/MT', phaseOffset: 0,
    persons: [
      { id: 'rw1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  // ── ID/NV ─────────────────────────────────────────────────────────────────
  {
    baseId: 'burley',       baseLabel: 'Burley IH-08',          region: 'ID/NV', phaseOffset: 1,
    persons: [
      { id: 'rs', name: 'Rex Schwarz', initials: 'RS', phone: '208-969-0844' },
    ],
  },
  {
    baseId: 'rexburg',      baseLabel: 'Rexburg IH-11',         region: 'ID/NV', phaseOffset: 2,
    persons: [
      { id: 'rb1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'ely',          baseLabel: 'Ely IH-05',             region: 'ID/NV', phaseOffset: 3,
    persons: [
      { id: 'ey1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'winnemucca',   baseLabel: 'Winnemucca IH-03',      region: 'ID/NV', phaseOffset: 4,
    persons: [
      { id: 'wn1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'elko',         baseLabel: 'Elko IH-04/70',         region: 'ID/NV', phaseOffset: 5,
    persons: [
      { id: 'ng', name: 'Nicholas Gonzales', initials: 'NG', phone: '337-519-5722' },
    ],
  },
  // ── CO/NM ─────────────────────────────────────────────────────────────────
  {
    baseId: 'glenwood',     baseLabel: 'Glenwood Springs IH-24', region: 'CO/NM', phaseOffset: 0,
    persons: [
      { id: 'dj', name: 'Derek Jorgensen', initials: 'DJ', phone: '801-707-0318' },
    ],
  },
  {
    baseId: 'steamboat',    baseLabel: 'Steamboat Springs IH-26', region: 'CO/NM', phaseOffset: 1,
    persons: [
      { id: 'jm', name: 'John Modrow', initials: 'JM', phone: '907-209-9701' },
    ],
  },
  {
    baseId: 'los-alamos',   baseLabel: 'Los Alamos IH-27-28',   region: 'CO/NM', phaseOffset: 2,
    persons: [
      { id: 'la1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'cortez',       baseLabel: 'Cortez IH-22/79',       region: 'CO/NM', phaseOffset: 3,
    persons: [
      { id: 'co1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'pagosa',       baseLabel: 'Pagosa Springs IH-81',  region: 'CO/NM', phaseOffset: 4,
    persons: [
      { id: 'pg1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  // ── UT/AZ ─────────────────────────────────────────────────────────────────
  {
    baseId: 'fort-mohave',  baseLabel: 'Fort Mohave IH-06',     region: 'UT/AZ', phaseOffset: 5,
    persons: [
      { id: 'jh', name: 'Jon Hankins', initials: 'JH', phone: '702-824-8755' },
    ],
  },
  {
    baseId: 'kingman',      baseLabel: 'Kingman IH-07',         region: 'UT/AZ', phaseOffset: 0,
    persons: [
      { id: 'km1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  {
    baseId: 'richfield',    baseLabel: 'Richfield IH-12',       region: 'UT/AZ', phaseOffset: 1,
    persons: [
      { id: 'bhy', name: 'Brian Hyland', initials: 'BH', phone: '801-842-9086' },
    ],
  },
  {
    baseId: 'moab',         baseLabel: 'Moab IH-20',            region: 'UT/AZ', phaseOffset: 2,
    persons: [
      { id: 'mo1', name: '[TBD]', initials: '??', phone: '' },
    ],
  },
  // ── PAGE ──────────────────────────────────────────────────────────────────
  {
    baseId: 'page',         baseLabel: 'Page IH-17-18/77',      region: 'PAGE',  phaseOffset: 3,
    persons: [
      { id: 'fb', name: 'Fred Bistline',    initials: 'FB', phone: '435-233-8177' },
      { id: 'ds', name: 'Denton Siebrecht', initials: 'DS', phone: '928-640-1840' },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function msFromIso(iso) {
  return new Date(iso + 'T12:00:00Z').getTime();
}

function isoFromMs(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  return isoFromMs(msFromIso(iso) + n * 86_400_000);
}

function slotIndexFor(iso) {
  const diff = msFromIso(iso) - msFromIso(ANCHOR_ISO);
  return Math.floor(diff / (7 * 86_400_000));
}

function slotStartIso(i) {
  return addDays(ANCHOR_ISO, i * 7);
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function getWeeklySchedule(startIso, numWeeks = 8) {
  const startSlot = slotIndexFor(startIso);
  const todaySlot = slotIndexFor(DEMO_TODAY_ISO);

  return Array.from({ length: numWeeks }, (_, w) => {
    const slotIdx  = startSlot + w;
    const slotStart = slotStartIso(slotIdx);
    const slotEnd   = addDays(slotStart, 7);

    const bases = ONCALL_ROSTER.map(b => {
      const personIdx = (slotIdx + b.phaseOffset) % b.persons.length;
      return {
        baseId:      b.baseId,
        baseLabel:   b.baseLabel,
        region:      b.region,
        person:      b.persons[personIdx],
        personIndex: personIdx,
      };
    });

    return { slotIndex: slotIdx, slotStart, slotEnd, isCurrent: slotIdx === todaySlot, bases };
  });
}

export function getCurrentOncall() {
  const todaySlot = slotIndexFor(DEMO_TODAY_ISO);
  return ONCALL_ROSTER.map(b => {
    const personIdx = (todaySlot + b.phaseOffset) % b.persons.length;
    return {
      baseId:      b.baseId,
      baseLabel:   b.baseLabel,
      region:      b.region,
      person:      b.persons[personIdx],
      personIndex: personIdx,
      slotStart:   slotStartIso(todaySlot),
      slotEnd:     addDays(slotStartIso(todaySlot), 7),
    };
  });
}

export function getOncallForBaseAndDate(baseId, iso) {
  const b = ONCALL_ROSTER.find(b => b.baseId === baseId);
  if (!b) return null;
  const slotIdx   = slotIndexFor(iso);
  const personIdx = (slotIdx + b.phaseOffset) % b.persons.length;
  return {
    person:      b.persons[personIdx],
    personIndex: personIdx,
    slotStart:   slotStartIso(slotIdx),
    slotEnd:     addDays(slotStartIso(slotIdx), 7),
  };
}
