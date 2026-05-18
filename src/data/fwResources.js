// Fixed-Wing resource pool for AMC trip planning.
// All names are role-title placeholders — real data comes from Dataverse
// (personnel table) and aircraft records when live.
//
// hoursRemaining: demo value representing hours until next scheduled maintenance.
// intlRated: pilot holds type rating + international qualifications.

export const FW_AIRCRAFT = [
  // ── Bombardier Challenger 604 — unrestricted international ───────────────
  { tail: 'N681HC',  type: 'CL604',          base: 'SLC IH 72-76',  range: 'Unrestricted',  hoursRemaining: 312, status: 'IN_SERVICE' },

  // ── Cessna jets — N/S America capable ───────────────────────────────────
  { tail: 'N301HC',  type: 'Cessna 560XLS',  base: 'SLC IH 72-76',  range: 'N/S America',   hoursRemaining: 89,  status: 'IN_SERVICE' },
  { tail: 'N346CC',  type: 'Cessna 560XLS',  base: 'SLC IH 72-76',  range: 'N/S America',   hoursRemaining: 245, status: 'IN_SERVICE' },
  { tail: 'N581HC',  type: 'Cessna 525C',    base: 'SLC IH 72-76',  range: 'N/S America',   hoursRemaining: 156, status: 'IN_SERVICE' },

  // ── King Air B200 — domestic ─────────────────────────────────────────────
  { tail: 'N381HC',  type: 'King Air B200',  base: 'SLC IH 72-76',      range: 'Domestic',  hoursRemaining: 67,  status: 'IN_SERVICE'  },
  { tail: 'N481HC',  type: 'King Air B200',  base: 'St. George IH-71',   range: 'Domestic',  hoursRemaining: 203, status: 'IN_SERVICE'  },
  { tail: 'N781HC',  type: 'King Air B200',  base: 'SLC IH 72-76',      range: 'Domestic',  hoursRemaining: 178, status: 'IN_SERVICE'  },
  { tail: 'N981HC',  type: 'King Air B200',  base: 'SLC IH 72-76',      range: 'Domestic',  hoursRemaining: 0,   status: 'MAINTENANCE' },

  // ── King Air C90 — domestic (WY/MT regional FW) ──────────────────────────
  { tail: 'N904KS',  type: 'King Air C90',   base: 'Riverton IH-80',    range: 'Domestic',  hoursRemaining: 112, status: 'IN_SERVICE'  },
  { tail: 'N90HG',   type: 'King Air C90',   base: 'Riverton IH-80',    range: 'Domestic',  hoursRemaining: 58,  status: 'IN_SERVICE'  },
];

// dutyHoursToday: current flight hours accumulated since last rest (FAR 135 tracking)
// lastRestHours:  hours since last 10-hr rest period ended
// intlRated:      has international type rating and customs clearance quals
export const FW_PILOT_POOL = [
  { id: 'fwp1', name: 'FW Pilot 1',  cert: 'ATP', base: 'SLC', intlRated: true,  dutyHoursToday: 0.0, lastRestHours: 16 },
  { id: 'fwp2', name: 'FW Pilot 2',  cert: 'ATP', base: 'SLC', intlRated: true,  dutyHoursToday: 2.5, lastRestHours: 10 },
  { id: 'fwp3', name: 'FW Pilot 3',  cert: 'ATP', base: 'SLC', intlRated: true,  dutyHoursToday: 0.0, lastRestHours: 14 },
  { id: 'fwp4', name: 'FW Pilot 4',  cert: 'ATP', base: 'SLC', intlRated: false, dutyHoursToday: 7.5, lastRestHours: 3  },
  { id: 'fwp5', name: 'FW Pilot 5',  cert: 'ATP', base: 'SLC', intlRated: true,  dutyHoursToday: 0.0, lastRestHours: 12 },
  { id: 'fwp6', name: 'FW Pilot 6',  cert: 'ATP', base: 'SGU', intlRated: false, dutyHoursToday: 3.0, lastRestHours: 8  },
];

// AMC clinical crew pool — FW-qualified staff available for multi-day away trips.
// specialties: empty = standard crew only; listed = additional certified capabilities.
export const AMC_CLINICAL_POOL = [
  { id: 'ac1',  name: 'FW Flight Nurse 1',    role: 'Flight RN',  base: 'SLC', specialties: [],             available: true  },
  { id: 'ac2',  name: 'FW Flight Nurse 2',    role: 'Flight RN',  base: 'SLC', specialties: ['NICU RN'],    available: true  },
  { id: 'ac3',  name: 'FW Flight Nurse 3',    role: 'Flight RN',  base: 'SLC', specialties: ['HROB RN'],    available: false },
  { id: 'ac4',  name: 'FW Paramedic 1',       role: 'Paramedic',  base: 'SLC', specialties: [],             available: true  },
  { id: 'ac5',  name: 'FW Paramedic 2',       role: 'Paramedic',  base: 'SLC', specialties: [],             available: true  },
  { id: 'ac6',  name: 'Resp. Therapist 1',    role: 'Specialist', base: 'SLC', specialties: ['Respiratory Therapist'], available: true },
  { id: 'ac7',  name: 'ECMO Specialist 1',    role: 'Specialist', base: 'SLC', specialties: ['MCS/ECMO'],   available: true  },
  { id: 'ac8',  name: 'VAD Specialist 1',     role: 'Specialist', base: 'SLC', specialties: ['VAD'],        available: true  },
  { id: 'ac9',  name: 'Balloon Pump Spec. 1', role: 'Specialist', base: 'SLC', specialties: ['Balloon Pump'], available: false },
];
