// Clinical staffing capability definitions per base.
// Drives gap detection in ClinicalStaffingBoard — a "gap" is a required
// specialty with no schedule entry on a given day.
//
// Tier assignment and specialty lists come from the SOP (Rev 25-02) clinical
// program model. Update as bases change capability tier or specialty pools.

// ── Specialty definitions ─────────────────────────────────────────────────────

export const SPECIALTIES = {
  // Standard crew — all bases
  'Flight RN':             { label: 'Flight RN',        abbr: 'RN',   chipCls: 'bg-blue-500/20 text-blue-200 border-blue-500/30',   gapCls: 'bg-red-500/15 text-red-300 border-red-500/30',   dotColor: '#3b82f6' },
  'Paramedic':             { label: 'Paramedic',         abbr: 'Para', chipCls: 'bg-blue-500/20 text-blue-200 border-blue-500/30',   gapCls: 'bg-red-500/15 text-red-300 border-red-500/30',   dotColor: '#3b82f6' },
  // Level 1 Trauma specialty pool
  'Respiratory Therapist': { label: 'Resp. Therapist',   abbr: 'RT',   chipCls: 'bg-purple-500/20 text-purple-200 border-purple-500/30', gapCls: 'bg-red-500/15 text-red-300 border-red-500/30', dotColor: '#a855f7' },
  'NICU RN':               { label: 'NICU RN',           abbr: 'NICU', chipCls: 'bg-green-500/20 text-green-200 border-green-500/30', gapCls: 'bg-red-500/15 text-red-300 border-red-500/30',  dotColor: '#22c55e' },
  'Pediatric RN':          { label: 'Pediatric RN',      abbr: 'PEDS', chipCls: 'bg-green-500/20 text-green-200 border-green-500/30', gapCls: 'bg-red-500/15 text-red-300 border-red-500/30',  dotColor: '#22c55e' },
  'HROB RN':               { label: 'High Risk OB RN',   abbr: 'HROB', chipCls: 'bg-pink-500/20 text-pink-200 border-pink-500/30',   gapCls: 'bg-red-500/15 text-red-300 border-red-500/30',   dotColor: '#ec4899' },
  // Advanced cardiac / hemodynamic support (SOP 5.5 specialty team members)
  // Day = IMC, Night = nearest of MCK/UV to referrer
  'Balloon Pump':          { label: 'Balloon Pump',      abbr: 'IABP', chipCls: 'bg-rose-500/20 text-rose-200 border-rose-500/30',   gapCls: 'bg-red-500/15 text-red-300 border-red-500/30',   dotColor: '#f43f5e' },
  'VAD':                   { label: 'VAD',                abbr: 'VAD',  chipCls: 'bg-rose-500/20 text-rose-200 border-rose-500/30',   gapCls: 'bg-red-500/15 text-red-300 border-red-500/30',   dotColor: '#f43f5e' },
  'MCS/ECMO':              { label: 'MCS / ECMO',         abbr: 'ECMO', chipCls: 'bg-rose-500/20 text-rose-200 border-rose-500/30',   gapCls: 'bg-red-500/15 text-red-300 border-red-500/30',   dotColor: '#f43f5e' },
};

// ── Capability tiers ──────────────────────────────────────────────────────────

export const TIERS = {
  'Level 1 Trauma': {
    label:        'Level 1 Trauma',
    description:  'Full specialty pool — HROB, RT, NICU, PEDS, IABP, VAD, ECMO + standard crew',
    dotColor:     '#ef4444',
    headerCls:    'bg-red-500/10 border-red-500/20 text-red-300',
  },
  'Pediatric / Neonatal': {
    label:        'Pediatric / Neonatal',
    description:  'PCH cross-region Peds/Neo transport team',
    dotColor:     '#f59e0b',
    headerCls:    'bg-amber-500/10 border-amber-500/20 text-amber-300',
  },
  'Standard RW': {
    label:        'Standard Rotary Wing',
    description:  'Flight RN + Paramedic',
    dotColor:     '#3b82f6',
    headerCls:    'bg-blue-500/10 border-blue-500/20 text-blue-300',
  },
  'Fixed Wing': {
    label:        'Fixed Wing',
    description:  'Fixed-wing inter-facility transport crew',
    dotColor:     '#a855f7',
    headerCls:    'bg-purple-500/10 border-purple-500/20 text-purple-300',
  },
};

export const TIER_ORDER = ['Level 1 Trauma', 'Pediatric / Neonatal', 'Standard RW', 'Fixed Wing'];

const L1   = ['Flight RN', 'Paramedic', 'Respiratory Therapist', 'NICU RN', 'Pediatric RN', 'HROB RN', 'Balloon Pump', 'VAD', 'MCS/ECMO'];
const PEDS = ['Flight RN', 'Paramedic', 'NICU RN', 'Pediatric RN'];
const RW   = ['Flight RN', 'Paramedic'];
const FW   = ['Flight RN', 'Paramedic'];

// ── Per-base capability map ───────────────────────────────────────────────────
// Keyed by the base name used in demo/Dataverse schedule entries.
// MX On-Call uses combined CF names (IMED/Hangar, UV/ROOS) — clinical bases
// are tracked individually since each has its own on-site crew.

export const BASE_CAPABILITIES = {
  // ── Level 1 Trauma (full specialty pool) ─────────────────────────────────
  'IMED':              { tier: 'Level 1 Trauma',       specialties: L1   },
  'Utah Valley':       { tier: 'Level 1 Trauma',       specialties: L1   },

  // ── Pediatric / Neonatal ─────────────────────────────────────────────────
  'PCH':               { tier: 'Pediatric / Neonatal', specialties: PEDS },

  // ── Standard Rotary Wing ──────────────────────────────────────────────────
  'Hangar':            { tier: 'Standard RW', specialties: RW },
  'Roosevelt':         { tier: 'Standard RW', specialties: RW },
  'MKY/LGU':          { tier: 'Standard RW', specialties: RW },
  'SGU/CDC':           { tier: 'Standard RW', specialties: RW },
  'Greybulll':         { tier: 'Standard RW', specialties: RW },
  'Lander':            { tier: 'Standard RW', specialties: RW },
  'Rawlins':           { tier: 'Standard RW', specialties: RW },
  'Vernal':            { tier: 'Standard RW', specialties: RW },
  'Woodscross':        { tier: 'Standard RW', specialties: RW },
  'Rexburg':           { tier: 'Standard RW', specialties: RW },
  'Burley':            { tier: 'Standard RW', specialties: RW },
  'RW Elko':           { tier: 'Standard RW', specialties: RW },
  'Ely':               { tier: 'Standard RW', specialties: RW },
  'Winnemucca':        { tier: 'Standard RW', specialties: RW },
  'Glenwood Springs':  { tier: 'Standard RW', specialties: RW },
  'Steamboat Springs': { tier: 'Standard RW', specialties: RW },
  'Los Alamos':        { tier: 'Standard RW', specialties: RW },
  'Cortez':            { tier: 'Standard RW', specialties: RW },
  'Pagosa Springs':    { tier: 'Standard RW', specialties: RW },
  'Fort Mohave':       { tier: 'Standard RW', specialties: RW },
  'Richfield':         { tier: 'Standard RW', specialties: RW },
  'Moab':              { tier: 'Standard RW', specialties: RW },
  'Page':              { tier: 'Standard RW', specialties: RW },

  // ── Fixed Wing ────────────────────────────────────────────────────────────
  'FW Hangar':         { tier: 'Fixed Wing', specialties: FW },
  'FW Riverton':       { tier: 'Fixed Wing', specialties: FW },
};

// ── Role normalization ────────────────────────────────────────────────────────
// Maps roleType strings from CF/Protean Hub to canonical specialty keys above.

export function normalizeRole(roleType) {
  if (!roleType) return null;
  const r = roleType.toLowerCase().trim();
  if (r.includes('flight rn') || (r.includes('rn') && r.includes('flight'))) return 'Flight RN';
  if (r === 'rn' || r === 'registered nurse') return 'Flight RN';
  if (r.includes('paramedic')) return 'Paramedic';
  if (r.includes('respiratory') || r === 'rt') return 'Respiratory Therapist';
  if (r.includes('nicu') || r.includes('neonatal')) return 'NICU RN';
  if (r.includes('peds') || r.includes('pediatric')) return 'Pediatric RN';
  if (r.includes('hrob') || r.includes('high risk ob') || r.includes('obstetric')) return 'HROB RN';
  if (r.includes('balloon') || r.includes('iabp')) return 'Balloon Pump';
  if (r === 'vad' || r.includes('ventricular assist')) return 'VAD';
  if (r.includes('ecmo') || r.includes('mcs') || r.includes('extracorporeal')) return 'MCS/ECMO';
  return roleType;
}
