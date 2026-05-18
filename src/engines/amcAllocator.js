// AMC Resource Allocation & Conflict Engine
//
// Validates an AMC transport request against aircraft hours, pilot duty limits,
// and medical crew constraints per SOP Rev 25-02 and FAR Part 135.
//
// Pure functions — no React, no side effects. Safe to call in useMemo.

// ── FAR Part 135 / SOP constants ─────────────────────────────────────────────

const MAX_FLIGHT_HRS_24   = 8;   // FAR 135 — max flight time in any 24-hour period
const MAX_DUTY_HRS        = 14;  // FAR 135 / SOP — pilot duty day limit
const MIN_REST_HRS        = 10;  // FAR 135 — minimum rest between duty periods

const CREW_SOFT_CAP       = 14;  // SOP 5.5.13 — medical crew soft limit; flag for manager
const CREW_HARD_CAP       = 16;  // SOP 5.5.13 — requires AOC + Clinical Manager approval

// Expected transport timing for duty estimation (SOP 5.5.13)
const BEDSIDE_ADULT_HRS   = 2;   // FW adult: 2 hr bedside + ground per leg
const BEDSIDE_PEDS_HRS    = 3;   // FW peds/neo: 3 hr bedside + ground per leg
const GROUND_BUFFER_HRS   = 1;   // taxi / loading / FBO time per stop

// Hours buffer: warn when trip requires more than this fraction of remaining hours
const LOW_HOURS_THRESHOLD = 0.9;

// ── Aircraft compatibility ────────────────────────────────────────────────────

const RANGE_RANK = { Domestic: 1, 'N/S America': 2, Unrestricted: 3 };

function requiredRange(isInternational, internationalRegion) {
  if (!isInternational) return 'Domestic';
  if (internationalRegion === 'unrestricted') return 'Unrestricted';
  return 'N/S America';
}

export function checkAircraft(aircraft, totalFlightHours, isInternational, internationalRegion) {
  if (!aircraft) return { ok: false, flag: 'NONE_SELECTED' };

  if (aircraft.status === 'MAINTENANCE') {
    return { ok: false, flag: 'IN_MAINTENANCE', hoursRemaining: 0, hoursNeeded: totalFlightHours, margin: -totalFlightHours };
  }

  const needed  = requiredRange(isInternational, internationalRegion);
  const rangeOk = RANGE_RANK[aircraft.range] >= RANGE_RANK[needed];

  const hoursOk  = aircraft.hoursRemaining >= totalFlightHours;
  const margin   = aircraft.hoursRemaining - totalFlightHours;
  const lowHours = hoursOk && aircraft.hoursRemaining < totalFlightHours / LOW_HOURS_THRESHOLD;

  return {
    ok:             rangeOk && hoursOk,
    flag:           !rangeOk ? 'RANGE_INELIGIBLE' : !hoursOk ? 'INSUFFICIENT_HOURS' : lowHours ? 'LOW_HOURS' : null,
    hoursNeeded:    totalFlightHours,
    hoursRemaining: aircraft.hoursRemaining,
    margin,
    rangeOk,
    requiredRange:  needed,
  };
}

// ── Pilot rotation ────────────────────────────────────────────────────────────
//
// Multi-day strategy: 4 pilots in two pairs (A = [0,1], B = [2,3]).
// Pair A flies odd legs (1, 3, 5…), Pair B flies even legs (2, 4, 6…).
// Each pair accumulates flight hours only on their active days;
// the resting pair resets and is available for the next active day.
// A conflict is raised when a single leg exceeds MAX_FLIGHT_HRS_24 — that
// would require splitting the leg into two shorter segments, which is noted
// as a SPLIT_LEG warning rather than a hard block.

export function buildPilotRotation(pilotPool, legs, isInternational) {
  const eligible = pilotPool.filter(p => {
    if (p.lastRestHours < MIN_REST_HRS) return false;
    if (isInternational && !p.intlRated) return false;
    return true;
  });

  const conflicts = [];

  if (eligible.length < 2) {
    conflicts.push({
      severity: 'critical',
      type:     'PILOT_SHORTAGE',
      message:  `Need at least 2 qualified pilots — only ${eligible.length} available${isInternational ? ' with international rating' : ''} and rested.`,
    });
    return { ok: false, conflicts, rotation: [], selected: [] };
  }

  const needFour = legs.length > 1;

  if (needFour && eligible.length < 4) {
    conflicts.push({
      severity: 'warning',
      type:     'PILOT_SHORTAGE',
      message:  `Multi-leg trip prefers 4 pilots for rotation — only ${eligible.length} eligible. Pilots may approach duty limits on extended legs.`,
    });
  }

  // Select up to 4, prioritise those with most rest
  const selected = [...eligible]
    .sort((a, b) => b.lastRestHours - a.lastRestHours)
    .slice(0, Math.min(4, eligible.length));

  const pairA = selected.slice(0, 2);
  const pairB = selected.length >= 4 ? selected.slice(2, 4) : pairA; // fallback: same pair re-flies

  const rotation = legs.map((leg, idx) => {
    const isOdd     = idx % 2 === 0;
    const active    = isOdd ? pairA : pairB;
    const resting   = isOdd ? pairB : pairA;
    const legConflicts = [];

    // Each pilot in the active pair accumulates leg flight hours on top of today's hours
    active.forEach(p => {
      const projectedFlight = (idx === 0 ? p.dutyHoursToday : 0) + leg.flightHours;
      if (projectedFlight > MAX_FLIGHT_HRS_24) {
        legConflicts.push({
          severity: 'warning',
          type:     'PILOT_FLIGHT_HOURS',
          message:  `${p.name}: Leg ${idx + 1} projects ${projectedFlight.toFixed(1)} flight hrs — exceeds ${MAX_FLIGHT_HRS_24}-hr FAR 135 limit. Consider splitting this leg.`,
        });
      }
      const projectedDuty = (idx === 0 ? p.dutyHoursToday : 0) + leg.flightHours + 2;
      if (projectedDuty > MAX_DUTY_HRS) {
        legConflicts.push({
          severity: 'critical',
          type:     'PILOT_DUTY',
          message:  `${p.name}: Estimated ${projectedDuty.toFixed(1)} hr duty on Leg ${idx + 1} exceeds ${MAX_DUTY_HRS}-hr limit.`,
        });
      }
    });

    return {
      legNumber:    idx + 1,
      destination:  leg.destination || `Leg ${idx + 1}`,
      flightHours:  leg.flightHours,
      activePilots: active,
      restPilots:   pairB === pairA ? [] : resting,
      conflicts:    legConflicts,
    };
  });

  const allRotConflicts = rotation.flatMap(r => r.conflicts);
  return {
    ok:       allRotConflicts.filter(c => c.severity === 'critical').length === 0,
    selected,
    rotation,
    conflicts: [...conflicts, ...allRotConflicts],
  };
}

// ── Medical crew duty estimation ──────────────────────────────────────────────

export function estimateCrewDuty(legs, patientType) {
  const bedsidePerLeg = patientType === 'peds' || patientType === 'neo'
    ? BEDSIDE_PEDS_HRS
    : BEDSIDE_ADULT_HRS;

  // First leg includes patient loading time; subsequent legs include unload/reload
  return legs.reduce((total, leg, i) => {
    return total + leg.flightHours + (i === 0 ? bedsidePerLeg : GROUND_BUFFER_HRS + bedsidePerLeg);
  }, 0);
}

// ── Clinical crew selection ───────────────────────────────────────────────────

export function selectClinicalCrew(clinicalPool, specialtyNeeds) {
  const assigned   = [];
  const unmet      = [];
  const conflicts  = [];

  // Always need one Flight RN and one Paramedic
  const rn   = clinicalPool.find(m => m.role === 'Flight RN'  && m.available);
  const para = clinicalPool.find(m => m.role === 'Paramedic'  && m.available);

  if (rn)   assigned.push({ ...rn,   assignedRole: 'Flight RN'  });
  else      conflicts.push({ severity: 'critical', type: 'NO_FLIGHT_RN',   message: 'No available FW-qualified Flight RN in clinical pool.' });

  if (para) assigned.push({ ...para, assignedRole: 'Paramedic' });
  else      conflicts.push({ severity: 'critical', type: 'NO_PARAMEDIC',   message: 'No available FW-qualified Paramedic in clinical pool.' });

  // Specialty members
  for (const need of specialtyNeeds) {
    const specialist = clinicalPool.find(m =>
      m.role === 'Specialist' &&
      m.specialties.includes(need) &&
      m.available &&
      !assigned.find(a => a.id === m.id)
    );
    if (specialist) {
      assigned.push({ ...specialist, assignedRole: need });
    } else {
      unmet.push(need);
      conflicts.push({
        severity: 'critical',
        type:     'SPECIALIST_UNAVAILABLE',
        message:  `No available ${need} specialist in FW clinical pool.`,
      });
    }
  }

  return { assigned, unmet, conflicts };
}

// ── Approval requirements ─────────────────────────────────────────────────────

export function deriveApprovals(params) {
  const { estimatedDutyHours, patientType, isInternational, tripDays, crewSeparated } = params;
  const approvals = [];

  if (estimatedDutyHours > CREW_HARD_CAP) {
    approvals.push({
      level: 'AOC',
      reason: `Medical crew estimated duty ${estimatedDutyHours.toFixed(1)} hrs exceeds ${CREW_HARD_CAP}-hr hard cap (SOP 5.5.13). AOC (financial) + Clinical Manager (team/equipment) + Pilot (flight planning) all required.`,
    });
    if (patientType === 'peds' || patientType === 'neo') {
      approvals.push({
        level: 'CLINICAL_MANAGER',
        reason: 'Peds/Neo transport exceeding 16-hr crew duty requires Clinical Manager sign-off.',
      });
    }
  } else if (estimatedDutyHours > CREW_SOFT_CAP) {
    approvals.push({
      level: 'MANAGER',
      reason: `Medical crew estimated duty ${estimatedDutyHours.toFixed(1)} hrs exceeds ${CREW_SOFT_CAP}-hr soft cap. Manager involvement required (SOP 5.5.13).`,
    });
  }

  if (isInternational) {
    approvals.push({
      level: 'BILLING',
      reason: 'Out-of-service-area international transport: requires conference call — Director of Nursing, Director of Operations, Billing Manager — before any progress (SOP 7.8.1).',
    });
    approvals.push({
      level: 'OPERATIONS',
      reason: 'International: Universal Weather feasibility check, customs/APIS (carrier 17L), landing/overflight permits, fuel, crew passports, Intermountain Translation Services 801-507-6300 (SOP 7.4).',
    });
  }

  if (crewSeparated && estimatedDutyHours > CREW_SOFT_CAP) {
    approvals.push({
      level: 'AOC',
      reason: `Crew separated from base outside SL Valley with >14 hr duty and return within 12 hr — AOC approval required (SOP RW Shuttle 5.5.22).`,
    });
  }

  if (tripDays > 1) {
    approvals.push({
      level: 'COORDINATOR',
      reason: `Multi-day trip (${tripDays} day${tripDays > 1 ? 's' : ''}): AMC Coordinator must build Flight Vector ticket, add itinerary to scheduled board, and confirm FBO + ambulance rendezvous for each leg (SOP 7.8.1).`,
    });
  }

  return approvals;
}

// ── Master allocator ──────────────────────────────────────────────────────────

export function allocateAMCTrip({
  aircraft,
  legs,
  startDate,
  patientType,
  isInternational,
  internationalRegion,
  specialtyNeeds,
  pilotPool,
  clinicalPool,
}) {
  const totalFlightHours  = legs.reduce((sum, l) => sum + (l.flightHours || 0), 0);
  const tripDays          = legs.length;

  const aircraftResult    = checkAircraft(aircraft, totalFlightHours, isInternational, internationalRegion);
  const pilotResult       = buildPilotRotation(pilotPool, legs, isInternational);
  const clinicalResult    = selectClinicalCrew(clinicalPool, specialtyNeeds);
  const estimatedDutyHrs  = estimateCrewDuty(legs, patientType);
  const crewSeparated     = tripDays > 1;

  const approvals = deriveApprovals({
    estimatedDutyHours: estimatedDutyHrs,
    patientType,
    isInternational,
    tripDays,
    crewSeparated,
  });

  const dutyFlag =
    estimatedDutyHrs > CREW_HARD_CAP ? 'EXCEEDS_16HR' :
    estimatedDutyHrs > CREW_SOFT_CAP ? 'EXCEEDS_14HR' : null;

  const allConflicts = [
    ...(aircraftResult.ok ? [] : [{
      severity: aircraftResult.flag === 'IN_MAINTENANCE' || aircraftResult.flag === 'RANGE_INELIGIBLE' ? 'critical' : 'warning',
      type:     'AIRCRAFT',
      message:  aircraftResult.flag === 'NONE_SELECTED'       ? 'No aircraft selected.'
              : aircraftResult.flag === 'IN_MAINTENANCE'      ? `${aircraft.tail} is currently in maintenance.`
              : aircraftResult.flag === 'RANGE_INELIGIBLE'    ? `${aircraft.tail} (${aircraft.range}) not eligible for this route — need ${aircraftResult.requiredRange}.`
              : aircraftResult.flag === 'INSUFFICIENT_HOURS'  ? `${aircraft.tail}: ${aircraft.hoursRemaining} hrs remaining, trip needs ${totalFlightHours.toFixed(1)} hrs.`
              : aircraftResult.flag === 'LOW_HOURS'           ? `${aircraft.tail}: only ${aircraftResult.margin.toFixed(1)} hr margin above trip requirement — consider scheduling maintenance before departure.`
              : 'Aircraft check failed.',
    }]),
    ...pilotResult.conflicts,
    ...clinicalResult.conflicts,
  ];

  const criticalCount = allConflicts.filter(c => c.severity === 'critical').length;

  return {
    ok:                  criticalCount === 0 && aircraft != null,
    totalFlightHours,
    tripDays,
    aircraftResult,
    pilotResult,
    clinicalResult,
    estimatedDutyHrs,
    dutyFlag,
    approvals,
    conflicts:           allConflicts,
    criticalCount,
    warningCount:        allConflicts.filter(c => c.severity === 'warning').length,
  };
}
