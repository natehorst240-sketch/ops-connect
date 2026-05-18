import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, X, MapPin, Clock, User } from 'lucide-react';
import { useFleet } from '../contexts/FleetDataContext';
import { useNavigation } from '../contexts/NavigationContext';
import { DEMO_SCHEDULE_ENTRIES } from '../data/demoScheduleEntries';
import { BASE_META, REGIONS, DEMO_TODAY_ISO, addDays } from '../data/mxOncallSchedule';
import { useCalendarDate } from '../contexts/CalendarDateContext';
import {
  BASE_CAPABILITIES, SPECIALTIES, TIERS, TIER_ORDER, normalizeRole,
} from '../data/baseCapabilities';

// ── Date helpers ──────────────────────────────────────────────────────────────

function fmtDay(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
}
function fmtNum(iso) {
  return new Date(iso + 'T12:00:00Z').getDate();
}
function fmtRange(days) {
  const opts = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  return `${new Date(days[0] + 'T12:00:00Z').toLocaleDateString('en-US', opts)} – ${new Date(days[days.length - 1] + 'T12:00:00Z').toLocaleDateString('en-US', opts)}`;
}
const REAL_TODAY = new Date().toISOString().split('T')[0];

function isToday(iso) { return iso === REAL_TODAY; }

// Short name: "Emily Torres" → "E. Torres"
function shortName(full) {
  if (!full) return '—';
  const p = full.trim().split(/\s+/);
  return p.length >= 2 ? `${p[0][0]}. ${p.slice(1).join(' ')}` : full;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClinicalStaffingBoard({ persona, compact = false }) {
  const navigate = useNavigation();
  const { anchorDate: weekStart, setAnchorDate: setWeekStart } = useCalendarDate();
  const [selected, setSelected] = useState(null);        // { base, specialty, date, entries }
  const [hiddenTiers, setHiddenTiers] = useState(new Set()); // collapsed tiers

  const { scheduleEntries: live } = useFleet();
  const allEntries = live?.length ? live : DEMO_SCHEDULE_ENTRIES;

  const days = useMemo(
    () => Array.from({ length: compact ? 3 : 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart, compact]
  );

  // Bases visible to this persona (filter by region if not ALL)
  const visibleBases = useMemo(() => {
    const region = persona?.region;
    return Object.keys(BASE_CAPABILITIES).filter(b => {
      if (!BASE_META[b]) return false; // must be in schedule system
      if (region && region !== 'ALL') return BASE_META[b]?.region === region;
      return true;
    });
  }, [persona]);

  // Build clinical index: base → normalizedRole → date → entries[]
  const clinIndex = useMemo(() => {
    const idx = {};
    for (const e of allEntries) {
      if (e.personnelType !== 'Clinical') continue;
      if (!visibleBases.includes(e.base)) continue;
      if (!days.includes(e.shiftDate)) continue;
      const role = normalizeRole(e.roleType);
      if (!role) continue;
      const b = (idx[e.base] ??= {});
      const r = (b[role] ??= {});
      (r[e.shiftDate] ??= []).push(e);
    }
    return idx;
  }, [allEntries, visibleBases, days]);

  // Summary metrics
  const metrics = useMemo(() => {
    let totalSlots = 0, filledSlots = 0, criticalGaps = 0;
    const gapsByBase = {};
    const CRITICAL = ['HROB RN', 'NICU RN'];

    for (const base of visibleBases) {
      const caps = BASE_CAPABILITIES[base];
      if (!caps) continue;
      gapsByBase[base] = 0;
      for (const spec of caps.specialties) {
        for (const day of days) {
          totalSlots++;
          const filled = clinIndex[base]?.[spec]?.[day]?.length > 0;
          if (filled) {
            filledSlots++;
          } else {
            gapsByBase[base]++;
            if (CRITICAL.includes(spec)) criticalGaps++;
          }
        }
      }
    }

    const totalGaps = totalSlots - filledSlots;
    const fullStrengthBases = visibleBases.filter(b => (gapsByBase[b] ?? 0) === 0).length;
    return { totalGaps, filledSlots, totalSlots, fullStrengthBases, criticalGaps, gapsByBase };
  }, [clinIndex, visibleBases, days]);

  // Group bases by tier, sorted by tier priority then label
  const basesByTier = useMemo(() => {
    const groups = {};
    for (const base of visibleBases) {
      const tier = BASE_CAPABILITIES[base]?.tier;
      if (!tier) continue;
      (groups[tier] ??= []).push(base);
    }
    // Sort each tier's bases by label
    for (const tier of Object.keys(groups)) {
      groups[tier].sort((a, b) =>
        (BASE_META[a]?.label ?? a).localeCompare(BASE_META[b]?.label ?? b));
    }
    return groups;
  }, [visibleBases]);

  const visibleTiers = TIER_ORDER.filter(t => basesByTier[t]?.length);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden mt-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/40 flex-wrap gap-2">
        <div>
          <div className="mono text-[10px] uppercase tracking-widest text-orange-400 font-semibold">
            Clinical Staffing
          </div>
          <div className="mono text-[10px] text-neutral-400 mt-0.5">
            {fmtRange(days)}
            {persona?.region && persona.region !== 'ALL' && (
              <span className="ml-1.5">· {persona.region}</span>
            )}
          </div>
        </div>

        {!compact && (
          <div className="flex gap-0.5">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="w-7 h-7 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-neutral-400 hover:text-orange-400"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setWeekStart(DEMO_TODAY_ISO)}
              className="mono text-[10px] uppercase tracking-widest font-semibold px-2.5 h-7 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:bg-neutral-700"
            >
              Today
            </button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="w-7 h-7 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-neutral-400 hover:text-orange-400"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Summary metrics ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-neutral-800 border-b border-neutral-800">
        <MetricCell
          label="Staffing gaps"
          value={metrics.totalGaps}
          sub={`${metrics.filledSlots} of ${metrics.totalSlots} filled`}
          alert={metrics.totalGaps > 0}
        />
        <MetricCell
          label="Full strength"
          value={`${metrics.fullStrengthBases}/${visibleBases.length}`}
          sub="bases fully staffed"
          good={metrics.fullStrengthBases === visibleBases.length}
        />
        <MetricCell
          label="Critical gaps"
          value={metrics.criticalGaps}
          sub="HROB / NICU unfilled"
          alert={metrics.criticalGaps > 0}
        />
        <MetricCell
          label="Source"
          value="Protean"
          sub={live?.length ? 'Live · Dataverse' : 'Demo data'}
        />
      </div>

      {/* ── Tier sections ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        {visibleTiers.map(tier => {
          const tierCfg = TIERS[tier];
          const bases = basesByTier[tier] ?? [];
          const collapsed = hiddenTiers.has(tier);
          const tierGaps = bases.reduce((s, b) => s + (metrics.gapsByBase[b] ?? 0), 0);

          return (
            <div key={tier}>
              {/* Tier header */}
              <button
                className={`w-full flex items-center gap-2 px-4 py-2 border-b border-t border-neutral-800 text-left ${tierCfg.headerCls}`}
                onClick={() => setHiddenTiers(prev => {
                  const next = new Set(prev);
                  if (next.has(tier)) next.delete(tier); else next.add(tier);
                  return next;
                })}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tierCfg.dotColor }} />
                <span className="mono text-[10px] uppercase tracking-widest font-semibold flex-1">
                  {tierCfg.label}
                  <span className="ml-2 text-[9px] opacity-60">
                    {bases.length} base{bases.length !== 1 ? 's' : ''}
                  </span>
                </span>
                {tierGaps > 0 && (
                  <span className="flex items-center gap-1 text-[9px] text-red-300 font-semibold">
                    <AlertTriangle size={9} />
                    {tierGaps} gap{tierGaps !== 1 ? 's' : ''}
                  </span>
                )}
                <span className="mono text-[9px] opacity-50">{collapsed ? '▸' : '▾'}</span>
              </button>

              {!collapsed && bases.map(base => (
                <BaseBlock
                  key={base}
                  base={base}
                  days={days}
                  clinIndex={clinIndex}
                  gapCount={metrics.gapsByBase[base] ?? 0}
                  onSelect={setSelected}
                  compact={compact}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* ── Legend ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-neutral-800 bg-neutral-950/30 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-500/20 border border-blue-500/30" />
          <span className="mono text-[9px] text-neutral-400">Filled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500/15 border border-red-500/30" />
          <span className="mono text-[9px] text-neutral-400">Gap — click to post open shift</span>
        </div>
        <span className="mono text-[9px] text-neutral-600 ml-auto">
          Via Protean · {compact ? 'today–' + days[days.length - 1].slice(5) : '7-day view'}
        </span>
      </div>

      {/* ── Detail / action panel ────────────────────────────────────────────── */}
      {selected && (
        <SlotDetail
          slot={selected}
          onClose={() => setSelected(null)}
          onPostShift={() => { navigate('submit'); setSelected(null); }}
        />
      )}
    </div>
  );
}

// ── Metric summary cell ───────────────────────────────────────────────────────

function MetricCell({ label, value, sub, alert, good }) {
  return (
    <div className="px-4 py-3">
      <div className={`text-[22px] font-semibold leading-none ${alert ? 'text-red-400' : good ? 'text-green-400' : 'text-neutral-100'}`}>
        {value}
      </div>
      <div className="mono text-[9px] uppercase tracking-widest text-neutral-500 mt-1">{label}</div>
      <div className="text-[10px] text-neutral-600 mt-0.5">{sub}</div>
    </div>
  );
}

// ── Base block ────────────────────────────────────────────────────────────────

function BaseBlock({ base, days, clinIndex, gapCount, onSelect, compact }) {
  const baseMeta = BASE_META[base] ?? { label: base };
  const caps = BASE_CAPABILITIES[base];
  if (!caps) return null;

  return (
    <div className="border-b border-neutral-800/60 last:border-0">
      {/* Base header */}
      <div className="flex items-center gap-2 px-4 py-1.5 bg-neutral-950/20 border-b border-neutral-800/40">
        <MapPin size={9} className="text-neutral-500 shrink-0" />
        <span className="mono text-[11px] font-semibold text-neutral-200">{baseMeta.label}</span>
        {gapCount > 0 ? (
          <span className="flex items-center gap-0.5 ml-auto text-[9px] text-red-400 font-semibold">
            <AlertTriangle size={8} />
            {gapCount} gap{gapCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="flex items-center gap-0.5 ml-auto text-[9px] text-green-400">
            <CheckCircle2 size={8} />
            Full strength
          </span>
        )}
      </div>

      {/* Grid: specialties × days */}
      <div className="min-w-[500px]">
        {/* Day headers */}
        <div className="grid border-b border-neutral-800/40"
          style={{ gridTemplateColumns: `130px repeat(${days.length}, 1fr)` }}>
          <div className="px-2 py-1" />
          {days.map(d => (
            <div key={d} className={`px-1 py-1 text-center border-l border-neutral-800/40 ${isToday(d) ? 'bg-orange-500/[0.06]' : ''}`}>
              <div className={`mono text-[9px] ${isToday(d) ? 'text-orange-400 font-semibold' : 'text-neutral-500'}`}>
                {fmtDay(d)}
              </div>
              <div className={`text-[10px] font-semibold ${isToday(d) ? 'text-orange-400' : 'text-neutral-500'}`}>
                {fmtNum(d)}
              </div>
            </div>
          ))}
        </div>

        {/* Specialty rows */}
        {caps.specialties.map((spec, si) => {
          const cfg = SPECIALTIES[spec];
          if (!cfg) return null;

          return (
            <div
              key={spec}
              className={`grid ${si > 0 ? 'border-t border-neutral-800/30' : ''}`}
              style={{ gridTemplateColumns: `130px repeat(${days.length}, 1fr)` }}
            >
              {/* Specialty label */}
              <div className="flex items-center gap-1.5 px-2 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dotColor }} />
                <span className="mono text-[10px] text-neutral-300 font-medium leading-tight">
                  {cfg.abbr}
                </span>
                {!compact && (
                  <span className="mono text-[9px] text-neutral-600 truncate">{cfg.label}</span>
                )}
              </div>

              {/* Day cells */}
              {days.map(d => {
                const entries = clinIndex[base]?.[spec]?.[d] ?? [];
                const filled = entries.length > 0;
                const entry = entries[0];

                return (
                  <button
                    key={d}
                    onClick={() => onSelect({ base, specialty: spec, date: d, entries, filled })}
                    className={`px-1 py-1.5 border-l border-neutral-800/40 text-left hover:opacity-80 transition-opacity ${isToday(d) ? 'bg-orange-500/[0.03]' : ''}`}
                  >
                    {filled ? (
                      <span className={`block px-1 py-0.5 rounded border text-[9px] mono font-semibold truncate ${cfg.chipCls}`}>
                        {shortName(entry.ownerName)}
                      </span>
                    ) : (
                      <span className={`block px-1 py-0.5 rounded border text-[9px] mono font-semibold text-center ${cfg.gapCls}`}>
                        GAP
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Slot detail / action panel ────────────────────────────────────────────────

function SlotDetail({ slot, onClose, onPostShift }) {
  const { base, specialty, date, entries, filled } = slot;
  const baseMeta = BASE_META[base] ?? { label: base };
  const cfg = SPECIALTIES[specialty];
  const dateLabel = new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC',
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-sm w-full overflow-hidden"
        style={{ borderTop: `3px solid ${filled ? cfg?.dotColor : '#ef4444'}` }}
      >
        <div className="px-5 py-4 flex items-start justify-between border-b border-neutral-800">
          <div>
            <div className={`mono text-[10px] uppercase tracking-widest font-semibold mb-1 ${filled ? 'text-green-400' : 'text-red-400'}`}>
              {filled ? 'Shift Filled' : 'Staffing Gap'}
            </div>
            <div className="text-[15px] font-semibold text-neutral-100">
              {cfg?.label ?? specialty}
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-neutral-200">
            <X size={14} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <Row icon={MapPin} label="Base"   value={baseMeta.label} />
          <Row icon={Clock}  label="Date"   value={dateLabel} />
          {filled ? (
            entries.map((e, i) => (
              <Row key={i} icon={User} label={i === 0 ? 'Assigned' : ''} value={`${e.ownerName} · ${e.hours}`} />
            ))
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={12} className="text-red-400 shrink-0" />
              <span className="text-[12px] text-red-300">
                No {cfg?.label ?? specialty} assigned for this shift.
              </span>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/40 flex items-center gap-2">
          {!filled && (
            <button
              onClick={onPostShift}
              className="flex-1 py-1.5 mono text-[10px] uppercase tracking-widest font-semibold bg-orange-500 hover:bg-orange-400 text-black rounded"
            >
              Post Open Shift
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 mono text-[10px] uppercase tracking-widest font-semibold bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-300 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mono text-[10px] uppercase tracking-widest text-neutral-500 w-16 shrink-0 pt-0.5 flex items-center gap-1">
        {Icon && <Icon size={9} />} {label}
      </span>
      <span className="text-[12px] text-neutral-200 flex-1">{value}</span>
    </div>
  );
}
