// ============================================================================
// MX On-Call Schedule — Phase 1 (static generation)
// ----------------------------------------------------------------------------
// 8 days on / 6 days off, Wednesday-to-Wednesday handoff.
// Schedule is pre-generated for ~1 year from ANCHOR_ISO.
//
// Phase 2: replace getWeeklySchedule() with a CompleteFlight API call.
// The shape of each slot object is the same whether data comes from here or
// the API, so callers need no changes for Phase 2.
//
// Slot math:
//   slotIndex = floor((date − anchor) / 7 days)
//   Slot i covers anchor + i*7 → anchor + (i+1)*7 (Wed–Wed, 8 days inclusive)
//   person = roster[region].persons[(slotIndex + phaseOffset) % 2]
// ============================================================================

// Anchor: Wednesday April 16, 2025
// Slot 53 = Wed Apr 22, 2026 — the current demo week (demo today = Apr 25, 2026)
const ANCHOR_ISO = '2025-04-16';

// Demo "today" — matches the rest of the app
export const DEMO_TODAY_ISO = '2026-04-25';

// ============================================================================
// ON-CALL ROSTER — two AMTs per region rotate on the 8-on/6-off cycle.
// phaseOffset staggers regions so they're never all on the same person at once.
// ============================================================================

export const ONCALL_ROSTER = [
  {
    region: '109 UT',
    label: '109 UT — Intermountain',
    phaseOffset: 0,
    persons: [
      { id: 'ao', name: 'Alec Overton',       initials: 'AO', base: 'Logan IH-15',           phone: '801-660-7640' },
      { id: 'mp', name: 'Mac Paye',            initials: 'MP', base: 'Logan IH-15',           phone: '916-871-6135' },
    ],
  },
  {
    region: 'SLC FW',
    label: 'SLC Fixed Wing',
    phaseOffset: 1,
    persons: [
      { id: 'jpg', name: 'Jean-Paul Guidry',  initials: 'JG', base: 'SLC FW',                phone: '801-738-4919' },
      { id: 'bl',  name: 'Bryce Low',         initials: 'BL', base: 'SLC FW',                phone: '909-744-7878' },
    ],
  },
  {
    region: 'WY/MT',
    label: 'Wyoming / Montana',
    phaseOffset: 0,
    persons: [
      { id: 'na', name: 'Nate Anderson',      initials: 'NA', base: 'Greybull IH-23',         phone: '360-951-3875' },
      { id: 'rg', name: 'Robert Guty',        initials: 'RG', base: 'Greybull IH-23',         phone: '307-272-2616' },
    ],
  },
  {
    region: 'CO/NM',
    label: 'Colorado / New Mexico',
    phaseOffset: 1,
    persons: [
      { id: 'dj', name: 'Derek Jorgensen',    initials: 'DJ', base: 'Glenwood Springs IH-24', phone: '801-707-0318' },
      { id: 'jm', name: 'John Modrow',        initials: 'JM', base: 'Steamboat Springs IH-26',phone: '907-209-9701' },
    ],
  },
  {
    region: 'ID/NV',
    label: 'Idaho / Nevada',
    phaseOffset: 0,
    persons: [
      { id: 'rs', name: 'Rex Schwarz',        initials: 'RS', base: 'Burley IH-08',           phone: '208-969-0844' },
      { id: 'ng', name: 'Nicholas Gonzales',  initials: 'NG', base: 'Elko IH-04',             phone: '337-519-5722' },
    ],
  },
  {
    region: 'UT/AZ',
    label: 'Utah / Arizona',
    phaseOffset: 1,
    persons: [
      { id: 'jh',  name: 'Jon Hankins',       initials: 'JH', base: 'Fort Mohave IH-06',      phone: '702-824-8755' },
      { id: 'bhy', name: 'Brian Hyland',      initials: 'BH', base: 'Richfield IH-12',        phone: '801-842-9086' },
    ],
  },
  {
    region: 'PAGE',
    label: 'Page / Southwest',
    phaseOffset: 0,
    persons: [
      { id: 'fb', name: 'Fred Bistline',      initials: 'FB', base: 'Page IH-17-18',          phone: '435-233-8177' },
      { id: 'ds', name: 'Denton Siebrecht',   initials: 'DS', base: 'Page IH-17-18',          phone: '928-640-1840' },
    ],
  },
];

// ============================================================================
// HELPERS — pure date arithmetic, no timezone dependencies
// ============================================================================

function msFromIso(iso) {
  // Force noon UTC to stay clear of DST transitions
  return new Date(iso + 'T12:00:00Z').getTime();
}

function isoFromMs(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso, n) {
  return isoFromMs(msFromIso(iso) + n * 86_400_000);
}

// Which slot index does a given ISO date fall in?
function slotIndexFor(iso) {
  const diff = msFromIso(iso) - msFromIso(ANCHOR_ISO);
  return Math.floor(diff / (7 * 86_400_000));
}

// Wednesday that opens slot i
function slotStartIso(i) {
  return addDays(ANCHOR_ISO, i * 7);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Returns an array of weekly on-call slots.
 *
 * Each slot: { region, label, person, slotStart, slotEnd, weekIndex, isCurrent }
 *
 * Phase 2: replace this function body with a CompleteFlight API call that
 * returns data in the same shape.
 */
export function getWeeklySchedule(startIso, numWeeks = 8) {
  const startSlot = slotIndexFor(startIso);
  const todaySlot = slotIndexFor(DEMO_TODAY_ISO);

  const weeks = [];
  for (let w = 0; w < numWeeks; w++) {
    const slotIdx = startSlot + w;
    const slotStart = slotStartIso(slotIdx);
    const slotEnd = addDays(slotStart, 7); // 8th day = next Wednesday (inclusive handoff)

    const regions = ONCALL_ROSTER.map(r => {
      const personIdx = (slotIdx + r.phaseOffset) % 2;
      return {
        region: r.region,
        label: r.label,
        person: r.persons[personIdx],
        personIndex: personIdx, // 0 or 1 — drives color coding
      };
    });

    weeks.push({
      slotIndex: slotIdx,
      slotStart,
      slotEnd,
      isCurrent: slotIdx === todaySlot,
      regions,
    });
  }
  return weeks;
}

/**
 * Returns the on-call assignment for every region right now (demo today).
 */
export function getCurrentOncall() {
  const todaySlot = slotIndexFor(DEMO_TODAY_ISO);
  return ONCALL_ROSTER.map(r => {
    const personIdx = (todaySlot + r.phaseOffset) % 2;
    return {
      region: r.region,
      label: r.label,
      person: r.persons[personIdx],
      personIndex: personIdx,
      slotStart: slotStartIso(todaySlot),
      slotEnd: addDays(slotStartIso(todaySlot), 7),
    };
  });
}

/**
 * Returns the on-call person for a specific region on a specific ISO date.
 * Called the same way whether data is local (Phase 1) or from API (Phase 2).
 */
export function getOncallForRegionAndDate(region, iso) {
  const r = ONCALL_ROSTER.find(r => r.region === region);
  if (!r) return null;
  const slotIdx = slotIndexFor(iso);
  const personIdx = (slotIdx + r.phaseOffset) % 2;
  return {
    person: r.persons[personIdx],
    personIndex: personIdx,
    slotStart: slotStartIso(slotIdx),
    slotEnd: addDays(slotStartIso(slotIdx), 7),
  };
}
