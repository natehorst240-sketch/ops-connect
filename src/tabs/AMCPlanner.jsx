import React, { useState, useMemo } from 'react';
import {
  Globe, Plus, Trash2, AlertTriangle, CheckCircle2, Info,
  AlertCircle, ChevronDown, ChevronUp, Plane, Users,
  Clock, FileText, Shield,
} from 'lucide-react';
import { allocateAMCTrip } from '../engines/amcAllocator';
import { FW_AIRCRAFT, FW_PILOT_POOL, AMC_CLINICAL_POOL } from '../data/fwResources';
import { useCalendarDate } from '../contexts/CalendarDateContext';
import { useAMCTrips } from '../contexts/AMCTripContext';

const SPECIALTIES = [
  'Respiratory Therapist', 'NICU RN', 'Pediatric RN',
  'HROB RN', 'Balloon Pump', 'VAD', 'MCS/ECMO',
];

const SEVERITY_STYLE = {
  critical: 'bg-red-500/10 border-red-500/25 text-red-300',
  warning:  'bg-amber-500/10 border-amber-500/25 text-amber-300',
  info:     'bg-blue-500/10 border-blue-500/20 text-blue-300',
};
const SEVERITY_ICON = {
  critical: <AlertCircle   size={13} className="shrink-0 mt-0.5" />,
  warning:  <AlertTriangle size={13} className="shrink-0 mt-0.5" />,
  info:     <Info          size={13} className="shrink-0 mt-0.5" />,
};

const APPROVAL_STYLE = {
  AOC:              'bg-red-500/10 border-red-500/25 text-red-300',
  CLINICAL_MANAGER: 'bg-pink-500/10 border-pink-500/25 text-pink-300',
  MANAGER:          'bg-amber-500/10 border-amber-500/25 text-amber-300',
  BILLING:          'bg-orange-500/10 border-orange-500/25 text-orange-300',
  OPERATIONS:       'bg-blue-500/10 border-blue-500/20 text-blue-300',
  COORDINATOR:      'bg-sky-500/10 border-sky-500/20 text-sky-300',
};

let legSeq = 1;
function newLeg() { return { id: legSeq++, destination: '', flightHours: 3.0 }; }

// Days to span for a trip based on total flight hours (rough crew scheduling estimate)
function tripEndDate(startDate, totalFlightHours) {
  const offset = Math.max(0, Math.floor(totalFlightHours / 8));
  const d = new Date(startDate + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function AMCPlanner() {
  // Departure date is the shared calendar anchor — bidirectional sync
  const { anchorDate: startDate, setAnchorDate: setStartDate } = useCalendarDate();
  const { addTrip } = useAMCTrips();

  const [tripType,   setTripType]   = useState('domestic');
  const [intlRegion, setIntlRegion] = useState('ns_america');
  const [patientType, setPatient]   = useState('adult');
  const [legs,       setLegs]       = useState([newLeg()]);
  const [needs,      setNeeds]      = useState(new Set());
  const [aircraft,   setAircraft]   = useState(null);
  const [showPilotDetail, setShowPilotDetail] = useState(false);
  const [allocated,  setAllocated]  = useState(false);

  const toggleNeed  = n => setNeeds(prev => { const s = new Set(prev); s.has(n) ? s.delete(n) : s.add(n); return s; });
  const addLeg      = ()  => setLegs(prev => [...prev, newLeg()]);
  const removeLeg   = id  => setLegs(prev => prev.filter(l => l.id !== id));
  const updateLeg   = (id, field, val) =>
    setLegs(prev => prev.map(l => l.id === id ? { ...l, [field]: field === 'flightHours' ? Math.max(0.5, parseFloat(val) || 0.5) : val } : l));

  const selectedAC  = FW_AIRCRAFT.find(a => a.tail === aircraft) ?? null;
  const isIntl      = tripType === 'international';

  function handleAllocate() {
    if (!result.ok || !selectedAC) return;
    const endDate = tripEndDate(startDate, result.totalFlightHours);
    addTrip({
      id: `amc-${Date.now()}`,
      startDate,
      endDate,
      aircraft: selectedAC,
      pilots: result.pilotResult.selected,
      medical: result.clinicalResult.assigned,
      legs: legs.map(l => ({ ...l })),
      totalFlightHours: result.totalFlightHours,
      patientType,
      isIntl,
    });
    setAllocated(true);
  }

  function handleNewTrip() {
    setAllocated(false);
    setAircraft(null);
    setLegs([newLeg()]);
    setNeeds(new Set());
    setTripType('domestic');
    setPatient('adult');
  }

  const result = useMemo(() => allocateAMCTrip({
    aircraft:           selectedAC,
    legs,
    startDate,
    patientType,
    isInternational:    isIntl,
    internationalRegion: intlRegion === 'unrestricted' ? 'unrestricted' : 'ns',
    specialtyNeeds:     [...needs],
    pilotPool:          FW_PILOT_POOL,
    clinicalPool:       AMC_CLINICAL_POOL,
  }), [selectedAC, legs, startDate, patientType, isIntl, intlRegion, needs]);

  return (
    <div className="px-4 sm:px-7 pt-4 pb-8 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-md bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
          <Globe size={16} className="text-sky-400" />
        </div>
        <div>
          <div className="text-[15px] font-semibold">AMC Trip Planner</div>
          <div className="text-[11px] text-neutral-500">Air Medical Charter — resource allocation &amp; conflict check</div>
        </div>
        {result.criticalCount > 0 && (
          <span className="ml-auto mono text-[10px] px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-300">
            {result.criticalCount} conflict{result.criticalCount !== 1 ? 's' : ''}
          </span>
        )}
        {result.criticalCount === 0 && selectedAC && (
          <span className="ml-auto mono text-[10px] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">
            Clear to allocate
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-4">

        {/* ── LEFT: Trip Setup ────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Transport type + patient */}
          <Section title="Trip Parameters">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Transport Type">
                <SegControl
                  value={tripType}
                  onChange={setTripType}
                  options={[
                    { value: 'domestic',      label: 'Domestic' },
                    { value: 'international', label: 'International' },
                  ]}
                />
                {isIntl && (
                  <select
                    value={intlRegion}
                    onChange={e => setIntlRegion(e.target.value)}
                    className="mt-2 w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-[12px] text-neutral-200 outline-none"
                  >
                    <option value="ns_america">N/S America</option>
                    <option value="unrestricted">Unrestricted (CL604 only)</option>
                  </select>
                )}
              </Field>

              <Field label="Patient Type">
                <SegControl
                  value={patientType}
                  onChange={setPatient}
                  options={[
                    { value: 'adult', label: 'Adult' },
                    { value: 'peds',  label: 'Peds' },
                    { value: 'neo',   label: 'Neo' },
                  ]}
                />
              </Field>

              <Field label="Departure Date">
                <input
                  type="date"
                  value={startDate}
                  onChange={e => { setStartDate(e.target.value); setAllocated(false); }}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1.5 text-[12px] text-neutral-200 outline-none focus:border-sky-500/50"
                />
                <div className="mt-1 text-[9px] text-sky-500/70 mono">Synced · all calendar views</div>
              </Field>
            </div>
          </Section>

          {/* Flight legs */}
          <Section
            title={`Flight Legs — ${legs.length} leg${legs.length !== 1 ? 's' : ''} · ${result.totalFlightHours.toFixed(1)} total flight hrs`}
            action={<button onClick={addLeg} className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300"><Plus size={12} />Add Leg</button>}
          >
            <div className="space-y-2">
              {legs.map((leg, idx) => (
                <div key={leg.id} className="flex items-center gap-2 bg-neutral-800/50 border border-neutral-800 rounded-md px-3 py-2">
                  <span className="mono text-[10px] text-neutral-500 w-5 shrink-0">L{idx + 1}</span>
                  <input
                    placeholder="Destination (city / ICAO)"
                    value={leg.destination}
                    onChange={e => updateLeg(leg.id, 'destination', e.target.value)}
                    className="flex-1 bg-transparent text-[12px] text-neutral-200 placeholder-neutral-600 outline-none min-w-0"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="number"
                      min="0.5"
                      max="14"
                      step="0.5"
                      value={leg.flightHours}
                      onChange={e => updateLeg(leg.id, 'flightHours', e.target.value)}
                      className="w-14 bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-[12px] text-neutral-200 outline-none text-right"
                    />
                    <span className="text-[10px] text-neutral-500">hrs</span>
                  </div>
                  {legs.length > 1 && (
                    <button onClick={() => removeLeg(leg.id)} className="text-neutral-600 hover:text-red-400 shrink-0">
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-neutral-600">
              Estimated medical crew duty: <span className={`font-semibold ${result.dutyFlag === 'EXCEEDS_16HR' ? 'text-red-400' : result.dutyFlag === 'EXCEEDS_14HR' ? 'text-amber-400' : 'text-neutral-300'}`}>{result.estimatedDutyHrs.toFixed(1)} hrs</span>
              {result.dutyFlag === 'EXCEEDS_16HR' && <span className="text-red-400"> — exceeds 16-hr hard cap</span>}
              {result.dutyFlag === 'EXCEEDS_14HR' && <span className="text-amber-400"> — exceeds 14-hr soft cap</span>}
              {!result.dutyFlag && <span className="text-neutral-500"> (SOP: 2 hr bedside/leg adult, 3 hr peds/neo)</span>}
            </div>
          </Section>

          {/* Specialty needs */}
          <Section title="Specialty Crew Requirements">
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleNeed(s)}
                  className={`px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${needs.has(s) ? 'bg-sky-500/20 border-sky-500/40 text-sky-200' : 'bg-neutral-800/50 border-neutral-700 text-neutral-400 hover:border-neutral-600'}`}
                >
                  {s}
                </button>
              ))}
            </div>
            {needs.size > 0 && (
              <div className="mt-2 text-[10px] text-neutral-500">
                Day transport: specialty team at IMED. Night transport: nearest of McKay/Utah Valley to referrer (SOP 5.5).
              </div>
            )}
          </Section>

          {/* Aircraft selection */}
          <Section title="Aircraft" action={<span className="text-[10px] text-neutral-500">Select for this trip</span>}>
            <div className="space-y-1.5">
              {FW_AIRCRAFT.map(ac => {
                const check  = allocateAMCTrip({ aircraft: ac, legs, startDate, patientType, isInternational: isIntl, internationalRegion: intlRegion === 'unrestricted' ? 'unrestricted' : 'ns', specialtyNeeds: [], pilotPool: [], clinicalPool: [] }).aircraftResult;
                const sel    = aircraft === ac.tail;
                const inMx   = ac.status === 'MAINTENANCE';
                const rangeOk = check.rangeOk !== false;
                const color   = inMx ? 'text-neutral-600' : !rangeOk ? 'text-neutral-500' : check.flag === 'INSUFFICIENT_HOURS' ? 'text-red-400' : check.flag === 'LOW_HOURS' ? 'text-amber-400' : 'text-green-400';

                return (
                  <button
                    key={ac.tail}
                    disabled={inMx}
                    onClick={() => setAircraft(sel ? null : ac.tail)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md border text-left transition-colors ${sel ? 'bg-sky-500/10 border-sky-500/30' : 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700'} ${inMx ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sel ? 'bg-sky-400' : 'bg-neutral-700'}`} />
                    <span className="mono text-[11px] text-neutral-300 w-16 shrink-0">{ac.tail}</span>
                    <span className="text-[12px] text-neutral-200 flex-1">{ac.type}</span>
                    <span className="text-[10px] text-neutral-500 w-20 shrink-0 text-right">{ac.range}</span>
                    <span className={`text-[11px] font-semibold w-20 shrink-0 text-right ${color}`}>
                      {inMx ? 'MX' : `${ac.hoursRemaining} hrs`}
                    </span>
                    {!inMx && (
                      <span className={`mono text-[9px] px-1.5 py-0.5 rounded border ${
                        !rangeOk                          ? 'bg-neutral-800 border-neutral-700 text-neutral-500' :
                        check.flag === 'INSUFFICIENT_HOURS' ? 'bg-red-500/15 border-red-500/25 text-red-300' :
                        check.flag === 'LOW_HOURS'          ? 'bg-amber-500/15 border-amber-500/25 text-amber-300' :
                        'bg-green-500/10 border-green-500/20 text-green-400'
                      }`}>
                        {!rangeOk ? 'INELIG' : check.flag === 'INSUFFICIENT_HOURS' ? 'LOW' : check.flag === 'LOW_HOURS' ? 'MARGIN' : 'OK'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>

        {/* ── RIGHT: Allocation Results ────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Pilot rotation */}
          <Section
            title="Pilot Rotation"
            action={
              <button onClick={() => setShowPilotDetail(v => !v)} className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-neutral-300">
                {showPilotDetail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                {showPilotDetail ? 'Less' : 'Detail'}
              </button>
            }
          >
            {result.pilotResult.selected.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-neutral-800">
                        <th className="text-left text-neutral-500 font-normal py-1.5 pr-3">Pilot</th>
                        {result.pilotResult.rotation.map(r => (
                          <th key={r.legNumber} className="text-center text-neutral-500 font-normal py-1.5 px-1 min-w-[52px]">
                            <div>L{r.legNumber}</div>
                            <div className="text-neutral-600 text-[9px]">{r.flightHours}h</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.pilotResult.selected.map(pilot => (
                        <tr key={pilot.id} className="border-b border-neutral-800/50">
                          <td className="py-1.5 pr-3">
                            <div className="text-neutral-200 truncate max-w-[120px]">{pilot.name}</div>
                            {showPilotDetail && (
                              <div className="text-[10px] text-neutral-600">{pilot.intlRated ? 'Intl rated' : 'Domestic'} · {pilot.lastRestHours}hr rest</div>
                            )}
                          </td>
                          {result.pilotResult.rotation.map(r => {
                            const active = r.activePilots.find(p => p.id === pilot.id);
                            const hasConflict = active && r.conflicts.some(c => c.message?.includes(pilot.name));
                            return (
                              <td key={r.legNumber} className="text-center py-1.5 px-1">
                                {active ? (
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${hasConflict ? 'bg-red-500/20 text-red-300' : 'bg-green-500/15 text-green-300'}`}>
                                    FLY
                                  </span>
                                ) : (
                                  <span className="inline-block px-1.5 py-0.5 rounded text-[9px] text-neutral-600 bg-neutral-800/50">
                                    REST
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {showPilotDetail && (
                  <div className="mt-2 text-[10px] text-neutral-600">
                    Pairs rotate per leg · FAR 135: {`≤8 hr flight / ≤14 hr duty / ≥10 hr rest`}
                  </div>
                )}
              </>
            ) : (
              <div className="text-[12px] text-neutral-500">No eligible pilots available.</div>
            )}
          </Section>

          {/* Medical crew */}
          <Section title="Medical Crew">
            <div className="space-y-1.5">
              {result.clinicalResult.assigned.map(m => (
                <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-neutral-800/40 border border-neutral-800 rounded-md">
                  <CheckCircle2 size={11} className="text-green-400 shrink-0" />
                  <span className="flex-1 text-[12px] text-neutral-200 truncate">{m.name}</span>
                  <span className="text-[10px] text-neutral-500 shrink-0">{m.assignedRole}</span>
                  <span className="mono text-[9px] text-neutral-600 shrink-0">{m.base}</span>
                </div>
              ))}
              {result.clinicalResult.unmet.map(s => (
                <div key={s} className="flex items-center gap-2 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-md">
                  <AlertCircle size={11} className="text-red-400 shrink-0" />
                  <span className="flex-1 text-[12px] text-red-300">{s}</span>
                  <span className="mono text-[9px] text-red-500/70 shrink-0">UNFILLED</span>
                </div>
              ))}
            </div>
            <div className={`mt-2.5 flex items-center gap-2 px-3 py-2 rounded-md border text-[11px] ${
              result.dutyFlag === 'EXCEEDS_16HR' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
              result.dutyFlag === 'EXCEEDS_14HR' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
              'bg-neutral-800/50 border-neutral-800 text-neutral-400'
            }`}>
              <Clock size={11} className="shrink-0" />
              Estimated crew duty: <span className="font-semibold ml-1">{result.estimatedDutyHrs.toFixed(1)} hrs</span>
              <span className="ml-1">
                {result.dutyFlag === 'EXCEEDS_16HR' ? '— hard cap exceeded' :
                 result.dutyFlag === 'EXCEEDS_14HR' ? '— soft cap exceeded' :
                 '— within limits'}
              </span>
            </div>
          </Section>

          {/* Conflicts */}
          {result.conflicts.length > 0 && (
            <Section title={`Conflicts (${result.conflicts.length})`}>
              <div className="space-y-1.5">
                {result.conflicts.map((c, i) => (
                  <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-md border text-[11px] ${SEVERITY_STYLE[c.severity] ?? SEVERITY_STYLE.info}`}>
                    {SEVERITY_ICON[c.severity] ?? SEVERITY_ICON.info}
                    <span>{c.message}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Approvals */}
          {result.approvals.length > 0 && (
            <Section title={`Required Approvals (${result.approvals.length})`}>
              <div className="space-y-1.5">
                {result.approvals.map((a, i) => (
                  <div key={i} className={`px-3 py-2 rounded-md border text-[11px] ${APPROVAL_STYLE[a.level] ?? APPROVAL_STYLE.COORDINATOR}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Shield size={10} className="shrink-0" />
                      <span className="mono font-semibold text-[9px] uppercase tracking-wider">{a.level}</span>
                    </div>
                    <div className="text-[10px] leading-relaxed opacity-90">{a.reason}</div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Action */}
          {allocated ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-green-500/10 border border-green-500/25 text-green-300">
                <CheckCircle2 size={14} className="shrink-0" />
                <div className="flex-1 text-[11px]">
                  <div className="font-semibold">Trip allocated · resources locked</div>
                  <div className="text-[10px] opacity-75 mt-0.5">
                    {selectedAC?.tail} · {startDate} · Ops Schedule &amp; calendar updated
                  </div>
                </div>
              </div>
              <button
                onClick={handleNewTrip}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md border border-neutral-700 text-[12px] text-neutral-300 hover:border-sky-500/40 hover:text-sky-300 transition-colors"
              >
                <Plus size={13} />
                Plan New Trip
              </button>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              <button
                disabled={!result.ok}
                onClick={handleAllocate}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-[12px] font-semibold transition-colors ${result.ok ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-neutral-700'}`}
              >
                <Plane size={13} />
                Allocate Resources
              </button>
              <button className="px-4 py-2.5 rounded-md border border-neutral-700 text-[12px] text-neutral-400 hover:border-neutral-600 hover:text-neutral-200 transition-colors flex items-center gap-1.5">
                <FileText size={12} />
                Save Draft
              </button>
            </div>
          )}
          {result.ok && !allocated && (
            <div className="text-[10px] text-neutral-600 text-center">
              Allocating locks these resources and pushes the trip to the Ops Schedule, WeekCalendar, and Scheduler.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Small reusable components ─────────────────────────────────────────────────

function Section({ title, action, children }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function SegControl({ value, onChange, options }) {
  return (
    <div className="flex rounded-md overflow-hidden border border-neutral-700">
      {options.map((o, i) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-1.5 text-[11px] font-medium transition-colors ${value === o.value ? 'bg-sky-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'} ${i > 0 ? 'border-l border-neutral-700' : ''}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
