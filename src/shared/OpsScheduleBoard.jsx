import React, { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, Wrench, Plane, Heart, Radio,
  PhoneCall, Briefcase, X, ExternalLink, Clock, MapPin, Globe,
} from 'lucide-react';
import { useFleet } from '../contexts/FleetDataContext';
import { useNavigation } from '../contexts/NavigationContext';
import { DEMO_SCHEDULE_ENTRIES } from '../data/demoScheduleEntries';
import { BASE_META, REGIONS, DEMO_TODAY_ISO, addDays } from '../data/mxOncallSchedule';
import { useCalendarDate } from '../contexts/CalendarDateContext';
import { useAMCTrips } from '../contexts/AMCTripContext';

// ── Personnel type config ─────────────────────────────────────────────────────

const PT = {
  'MX On-Call':  { label: 'MX On-Call',  icon: Wrench,    source: 'CompleteFlight', chipCls: 'bg-orange-500/25 text-white border-orange-500/40', dotColor: '#f97316' },
  'Pilot':       { label: 'Pilot',       icon: Plane,     source: 'CompleteFlight', chipCls: 'bg-blue-500/25 text-white border-blue-500/40',     dotColor: '#3b82f6' },
  'Clinical':    { label: 'Clinical',    icon: Heart,     source: 'Protean Hub',    chipCls: 'bg-green-500/25 text-white border-green-500/40',    dotColor: '#22c55e' },
  'OCS':             { label: 'OCS',             icon: Radio,     source: 'Protean Hub', chipCls: 'bg-purple-500/25 text-white border-purple-500/40', dotColor: '#a855f7' },
  'CS':              { label: 'CS',              icon: PhoneCall, source: 'Protean Hub', chipCls: 'bg-cyan-500/25 text-white border-cyan-500/40',     dotColor: '#06b6d4' },
  'FOC On-Call':     { label: 'FOC On-Call',     icon: Briefcase, source: 'Manual',      chipCls: 'bg-amber-500/25 text-white border-amber-500/40',   dotColor: '#f59e0b' },
  'AMC Coordinator': { label: 'AMC Coordinator', icon: Globe,     source: 'Manual',      chipCls: 'bg-sky-500/25 text-white border-sky-500/40',         dotColor: '#0ea5e9' },
  'AMC Mission':     { label: 'AMC Mission',     icon: Plane,     source: 'AMC Planner', chipCls: 'bg-sky-600/30 text-white border-sky-400/50',           dotColor: '#38bdf8' },
};

const ALL_TYPES = Object.keys(PT);

// Source badge style
const SRC_STYLE = {
  'CompleteFlight': 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'Protean Hub':    'bg-green-500/15 text-green-300 border-green-500/25',
  'Manual':         'bg-neutral-700 text-neutral-300 border-neutral-600',
  'AMC Planner':    'bg-sky-500/15 text-sky-300 border-sky-500/25',
};

// ── View inference ────────────────────────────────────────────────────────────

function inferView(role) {
  if (role === 'DIRECTOR' || role === 'ADOM' || role === 'MX_SCHEDULER') return 'master';
  if (role === 'RMM') return 'region';
  return 'base';
}

function maxView(role) {
  if (role === 'DIRECTOR' || role === 'ADOM' || role === 'MX_SCHEDULER') return 'master';
  if (role === 'RMM') return 'region';
  return 'base';
}

// ── Persona base → CF base name ───────────────────────────────────────────────

const BASE_RESOLVE = {
  'greybull': 'Greybull', 'lander': 'Lander', 'rawlins': 'Rawlins',
  'vernal': 'Vernal', 'riverton': 'FW Riverton', 'woodscross': 'Woodscross',
  'fw hangar': 'FW Hangar', 'kslc': 'FW Hangar',
  'hangar': 'Hangar', 'cedar': 'SGU/CDC',
  'st. george': 'SGU/CDC', 'mckay': 'MKY/LGU', 'logan': 'MKY/LGU',
  'utah valley': 'Utah Valley', 'uvrmc': 'Utah Valley', 'roosevelt': 'Roosevelt',
  'imed': 'IMED', 'pcmc': 'PCH', 'primary children': 'PCH',
  'rexburg': 'Rexburg', 'burley': 'Burley', 'elko': 'RW Elko',
  'ely': 'Ely', 'winnemucca': 'Winnemucca', 'glenwood': 'Glenwood Springs',
  'steamboat': 'Steamboat Springs', 'los alamos': 'Los Alamos', 'cortez': 'Cortez',
  'pagosa': 'Pagosa Springs', 'fort mohave': 'Fort Mohave', 'richfield': 'Richfield',
  'moab': 'Moab', 'page': 'Page',
};

function resolveBase(personaBase) {
  if (!personaBase) return null;
  const lower = personaBase.toLowerCase();
  for (const [key, cf] of Object.entries(BASE_RESOLVE)) {
    if (lower.includes(key)) return cf;
  }
  return null;
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function fmtWeekday(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }).toUpperCase();
}

function fmtMonthDay(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

const REAL_TODAY = new Date().toISOString().split('T')[0];

function isToday(iso) { return iso === REAL_TODAY; }

// ── Main component ────────────────────────────────────────────────────────────

// Convert allocated AMC trips into OpsScheduleBoard-compatible entries
function amcTripsToEntries(trips) {
  const entries = [];
  for (const trip of trips) {
    const start = new Date(trip.startDate + 'T12:00:00Z');
    const endDate = trip.endDate ?? trip.startDate;
    const end = new Date(endDate + 'T12:00:00Z');
    const base = 'FW Hangar';
    // Generate one entry per day per crew member
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const shiftDate = d.toISOString().slice(0, 10);
      const dests = trip.legs.map(l => l.destination || '?').filter(Boolean).join('→') || trip.aircraft?.type;
      entries.push({
        id: `${trip.id}-${shiftDate}-ac`,
        base,
        personnelType: 'AMC Mission',
        shiftDate,
        ownerName: `${trip.aircraft?.tail ?? 'FW'}: ${dests}`,
        hours: '06:00–22:00',
        roleType: 'Aircraft',
        source: 'AMC Planner',
      });
      for (const p of trip.pilots ?? []) {
        entries.push({
          id: `${trip.id}-${shiftDate}-${p.id}`,
          base,
          personnelType: 'AMC Mission',
          shiftDate,
          ownerName: p.name,
          hours: '06:00–22:00',
          roleType: 'AMC Pilot',
          source: 'AMC Planner',
        });
      }
      for (const m of trip.medical ?? []) {
        entries.push({
          id: `${trip.id}-${shiftDate}-${m.id}`,
          base,
          personnelType: 'AMC Mission',
          shiftDate,
          ownerName: m.name,
          hours: '06:00–22:00',
          roleType: m.assignedRole ?? m.role,
          source: 'AMC Planner',
        });
      }
    }
  }
  return entries;
}

export default function OpsScheduleBoard({ persona, compact = false }) {
  const navigate = useNavigation();
  const { anchorDate: weekStart, setAnchorDate: setWeekStart } = useCalendarDate();
  const { trips: amcTrips } = useAMCTrips();
  const defaultView = inferView(persona?.role);
  const [view, setView] = useState(defaultView);
  const [activeTypes, setActiveTypes] = useState(new Set(ALL_TYPES));
  const [selected, setSelected] = useState(null);

  const { scheduleEntries: live } = useFleet();
  const baseEntries = live?.length ? live : DEMO_SCHEDULE_ENTRIES;
  const allEntries = useMemo(
    () => [...baseEntries, ...amcTripsToEntries(amcTrips)],
    [baseEntries, amcTrips]
  );

  const days = useMemo(
    () => Array.from({ length: compact ? 2 : 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart, compact]
  );

  // Bases to show for current view
  const visibleBases = useMemo(() => {
    if (view === 'base') {
      const b = resolveBase(persona?.base);
      return b ? [b] : [];
    }
    if (view === 'region') {
      return Object.keys(BASE_META).filter(b => BASE_META[b].region === persona?.region);
    }
    return [...new Set(allEntries.map(e => e.base))];
  }, [view, persona, allEntries]);

  // Filter + group: base → personnelType → date → entries[]
  const grouped = useMemo(() => {
    const out = {};
    for (const e of allEntries) {
      if (!visibleBases.includes(e.base)) continue;
      if (!activeTypes.has(e.personnelType)) continue;
      if (!days.includes(e.shiftDate)) continue;
      const b = (out[e.base] ??= {});
      const t = (b[e.personnelType] ??= {});
      (t[e.shiftDate] ??= []).push(e);
    }
    return out;
  }, [allEntries, visibleBases, activeTypes, days]);

  // Sort bases by region order → label
  const sortedBases = useMemo(() =>
    Object.keys(grouped).sort((a, b) => {
      const ri = REGIONS.indexOf(BASE_META[a]?.region);
      const rj = REGIONS.indexOf(BASE_META[b]?.region);
      if (ri !== rj) return ri - rj;
      return (BASE_META[a]?.label ?? a).localeCompare(BASE_META[b]?.label ?? b);
    }), [grouped]);

  const weekLabel = compact
    ? fmtMonthDay(days[0])
    : `${fmtMonthDay(days[0])} – ${fmtMonthDay(days[days.length - 1])}`;

  const totalShown = sortedBases.reduce((sum, b) =>
    sum + Object.values(grouped[b] ?? {}).reduce((s, byDate) =>
      s + Object.values(byDate).reduce((n, arr) => n + arr.length, 0), 0), 0);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden mt-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/40 flex-wrap gap-2">
        <div>
          <div className="mono text-[10px] uppercase tracking-widest text-orange-400 font-semibold">
            Ops Schedule
          </div>
          <div className="mono text-[10px] text-neutral-400 mt-0.5">
            {weekLabel}
            {totalShown > 0 && <span className="ml-1.5 text-neutral-500">· {totalShown} shifts</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* View selector */}
          {!compact && (
            <div className="flex bg-neutral-800 border border-neutral-700 rounded overflow-hidden">
              {[
                { id: 'base', label: 'Base' },
                { id: 'region', label: 'Region' },
                { id: 'master', label: 'All' },
              ].filter(v => ['base','region','master'].indexOf(v.id) <= ['base','region','master'].indexOf(maxView(persona?.role))).map(v => (
                <button
                  key={v.id}
                  onClick={() => { if (['base','region','master'].indexOf(v.id) <= ['base','region','master'].indexOf(maxView(persona?.role))) setView(v.id); }}
                  className={`mono text-[10px] uppercase tracking-widest font-semibold px-2.5 h-7 transition-colors ${
                    view === v.id ? 'bg-orange-500 text-black' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Week nav */}
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

          <button
            onClick={() => navigate('ops-schedule')}
            className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-orange-400 transition-colors"
          >
            Full Schedule <ExternalLink size={10} className="ml-0.5" />
          </button>
        </div>
      </div>

      {/* ── Type filter pills ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-neutral-800 flex-wrap">
        {ALL_TYPES.map(type => {
          const cfg = PT[type];
          const Icon = cfg.icon;
          const on = activeTypes.has(type);
          return (
            <button
              key={type}
              onClick={() => setActiveTypes(prev => {
                const next = new Set(prev);
                if (next.has(type)) next.delete(type); else next.add(type);
                return next;
              })}
              className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] mono font-semibold transition-colors ${
                on ? cfg.chipCls : 'bg-neutral-800/50 text-neutral-500 border-neutral-700 opacity-50'
              }`}
            >
              <Icon size={9} />
              {cfg.label}
              <span className="ml-0.5 text-[8px] opacity-70">{cfg.source}</span>
            </button>
          );
        })}
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        {sortedBases.length === 0 ? (
          <p className="text-xs text-neutral-500 text-center py-6">No schedule data for this view and filter.</p>
        ) : (
          <div className="min-w-[600px]">
            {sortedBases.map((base, baseIdx) => {
              const baseMeta = BASE_META[base] ?? { label: base };
              const baseData = grouped[base] ?? {};
              const activeTypesForBase = ALL_TYPES.filter(t => baseData[t]);

              // Region label — show when view is master and region changes
              const prevBase = sortedBases[baseIdx - 1];
              const regionChanged = view === 'master' &&
                (baseIdx === 0 || BASE_META[prevBase]?.region !== baseMeta.region);

              return (
                <div key={base}>
                  {/* Region header (master view only) */}
                  {regionChanged && (
                    <div className="px-4 py-1.5 bg-neutral-950/60 border-b border-neutral-800">
                      <span className="mono text-[9px] uppercase tracking-widest font-semibold text-neutral-400">
                        {baseMeta.region}
                      </span>
                    </div>
                  )}

                  {/* Base header */}
                  <div className={`flex items-center gap-2 px-4 py-2 bg-neutral-950/30 border-b border-neutral-800 ${baseIdx > 0 && !regionChanged ? 'border-t border-neutral-800/60' : ''}`}>
                    <MapPin size={10} className="text-neutral-500 shrink-0" />
                    <span className="mono text-[11px] font-semibold text-neutral-200 tracking-wide">
                      {baseMeta.label}
                    </span>
                    {view !== 'base' && (
                      <span className="mono text-[9px] text-neutral-500 ml-1">
                        {baseMeta.region}
                      </span>
                    )}
                  </div>

                  {/* Day column headers */}
                  <div className="grid border-b border-neutral-800"
                    style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}>
                    <div className="px-2 py-1 text-[9px] mono text-neutral-600 uppercase tracking-widest">Type</div>
                    {days.map(d => (
                      <div key={d} className={`px-1.5 py-1 text-center border-l border-neutral-800 ${isToday(d) ? 'bg-orange-500/[0.06]' : ''}`}>
                        <div className={`mono text-[9px] tracking-wider ${isToday(d) ? 'text-orange-400 font-semibold' : 'text-neutral-500'}`}>
                          {fmtWeekday(d)}
                        </div>
                        <div className={`text-[11px] font-semibold ${isToday(d) ? 'text-orange-400' : 'text-neutral-400'}`}>
                          {new Date(d + 'T12:00:00Z').getDate()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Type rows */}
                  {activeTypesForBase.length === 0 ? (
                    <div className="px-4 py-2 text-[10px] text-neutral-600 italic">No schedule data</div>
                  ) : (
                    activeTypesForBase.map((type, typeIdx) => {
                      const cfg = PT[type];
                      const Icon = cfg.icon;
                      const byDate = baseData[type] ?? {};

                      return (
                        <div
                          key={type}
                          className={`grid ${typeIdx > 0 ? 'border-t border-neutral-800/50' : ''}`}
                          style={{ gridTemplateColumns: `120px repeat(${days.length}, 1fr)` }}
                        >
                          {/* Type label */}
                          <div className="flex items-center gap-1.5 px-2 py-2">
                            <Icon size={10} style={{ color: cfg.dotColor }} className="shrink-0" />
                            <span className="mono text-[10px] font-semibold text-neutral-300 truncate">
                              {cfg.label}
                            </span>
                          </div>

                          {/* Day cells */}
                          {days.map(d => {
                            const cellEntries = byDate[d] ?? [];
                            return (
                              <div
                                key={d}
                                className={`p-1 space-y-0.5 border-l border-neutral-800 ${isToday(d) ? 'bg-orange-500/[0.03]' : ''}`}
                                style={{ minHeight: 36 }}
                              >
                                {cellEntries.map(e => (
                                  <ShiftChip key={e.id} entry={e} cfg={cfg} onClick={setSelected} compact={compact} />
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Source legend ───────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t border-neutral-800 bg-neutral-950/30 flex items-center gap-3 flex-wrap">
        {Object.entries(SRC_STYLE).map(([src, cls]) => (
          <div key={src} className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] mono ${cls}`}>
            {src}
          </div>
        ))}
        <span className="mono text-[9px] text-neutral-600 ml-auto">
          {live?.length ? 'Live · Dataverse' : 'Demo data'}
        </span>
      </div>

      {/* ── Detail panel ────────────────────────────────────────────────────── */}
      {selected && <ShiftDetail entry={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Shift chip ────────────────────────────────────────────────────────────────

function ShiftChip({ entry, cfg, onClick, compact }) {
  const parts = entry.ownerName?.split(' ') ?? [];
  const short = compact
    ? parts.map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : parts.length >= 2
      ? `${parts[0][0]}. ${parts.slice(1).join(' ')}`
      : entry.ownerName;

  return (
    <button
      onClick={() => onClick(entry)}
      title={`${entry.ownerName} · ${entry.roleType} · ${entry.hours}`}
      className={`w-full flex items-center gap-1 px-1 py-0.5 rounded border text-left text-[10px] hover:opacity-80 transition-opacity ${cfg.chipCls}`}
    >
      <span className="font-semibold truncate leading-tight">{short}</span>
      {!compact && entry.roleType && (
        <span className="shrink-0 mono text-[8px] opacity-70 truncate">{entry.roleType}</span>
      )}
    </button>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function ShiftDetail({ entry, onClose }) {
  const cfg = PT[entry.personnelType] ?? PT['MX On-Call'];
  const Icon = cfg.icon;
  const baseMeta = BASE_META[entry.base] ?? { label: entry.base };
  const srcCls = SRC_STYLE[entry.source] ?? SRC_STYLE['Manual'];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-sm w-full overflow-hidden"
        style={{ borderTop: `3px solid ${cfg.dotColor}` }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-start gap-3 border-b border-neutral-800">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
            style={{ background: `${cfg.dotColor}20`, border: `1px solid ${cfg.dotColor}40` }}
          >
            <Icon size={16} style={{ color: cfg.dotColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] mono mb-1 ${srcCls}`}>
              {entry.source}
            </div>
            <div className="text-[15px] font-semibold text-neutral-100 leading-tight">
              {entry.ownerName}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-neutral-200 shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <DetailRow label="Type"   value={`${entry.personnelType} — ${entry.roleType}`} />
          <DetailRow label="Base"   value={baseMeta.label} icon={MapPin} />
          <DetailRow label="Region" value={entry.region} />
          <DetailRow label="Date"   value={new Date(entry.shiftDate + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })} />
          <DetailRow label="Shift"  value={`${entry.hours} ${entry.timezone ?? ''}`} icon={Clock} />
        </div>

        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-between">
          <span className="mono text-[9px] text-neutral-600">Click outside to close</span>
          <span className={`px-1.5 py-0.5 rounded border text-[9px] mono ${srcCls}`}>{entry.source}</span>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mono text-[10px] uppercase tracking-widest text-neutral-500 w-14 shrink-0 pt-0.5">{label}</span>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        {Icon && <Icon size={10} className="text-neutral-500 shrink-0" />}
        <span className="text-[12px] text-neutral-200">{value}</span>
      </div>
    </div>
  );
}
