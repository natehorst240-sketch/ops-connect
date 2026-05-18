import React, { useState, useMemo } from 'react';
import { Phone, ChevronLeft, ChevronRight, Calendar as CalIcon, X, Clock, Users } from 'lucide-react';
import { usePhoneFor } from '../hooks/usePhoneFor';
import {
  BASE_META,
  REGIONS,
  ALL_BASES,
  DEMO_TODAY_ISO,
  getOncallForDate,
  getScheduleRange,
  addDays,
} from '../data/mxOncallSchedule';

// ── Colour palette by person slot (0-based index within the day's base list) ─
const SLOT_COLORS = [
  'bg-blue-500/20 text-blue-200 border-blue-500/30',
  'bg-orange-500/20 text-orange-200 border-orange-500/30',
  'bg-purple-500/20 text-purple-200 border-purple-500/30',
  'bg-green-500/20 text-green-200 border-green-500/30',
  'bg-pink-500/20 text-pink-200 border-pink-500/30',
  'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
];

function slotColor(idx) {
  return SLOT_COLORS[idx % SLOT_COLORS.length];
}

function initials(name) {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
}

function typeLabel(type) {
  if (type === 'Maintenance On Call') return 'On Call';
  if (type === '1st Out MX On Call') return '1st Out';
  if (type === '2nd Out MX On Call') return '2nd Out';
  if (type === 'Maintenance Control') return 'MX Ctrl';
  return type;
}

function formatDate(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

function shortDate(iso) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OncallSchedule() {
  const [weekStart, setWeekStart]     = useState(DEMO_TODAY_ISO);
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [selected, setSelected]       = useState(null); // { base, entry, date }

  const todayByBase = useMemo(() => getOncallForDate(DEMO_TODAY_ISO), []);
  const weekDays    = useMemo(() => getScheduleRange(weekStart, 7), [weekStart]);

  const visibleBases = useMemo(() =>
    regionFilter === 'ALL'
      ? ALL_BASES
      : ALL_BASES.filter(b => BASE_META[b]?.region === regionFilter),
  [regionFilter]);

  // Group today's cards by region
  const todayByRegion = useMemo(() => {
    const map = {};
    for (const base of visibleBases) {
      const entries = todayByBase[base];
      if (!entries?.length) continue;
      const region = BASE_META[base]?.region ?? 'Other';
      if (!map[region]) map[region] = [];
      map[region].push({ base, entries });
    }
    return map;
  }, [todayByBase, visibleBases]);

  function prevWeek() { setWeekStart(d => addDays(d, -7)); }
  function nextWeek() { setWeekStart(d => addDays(d, 7)); }
  function goToday()  { setWeekStart(DEMO_TODAY_ISO); }

  return (
    <div className="p-6 max-w-full text-neutral-100 flex gap-6">
      <div className="flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <CalIcon size={22} className="text-orange-400" />
          <h1 className="text-2xl font-semibold">MX On-Call Schedule</h1>
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          CompleteFlight · May 2026 · 8 days on / 6 days off rotation
        </p>

        {/* Region filter */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {['ALL', ...REGIONS].map(r => (
            <button key={r} onClick={() => setRegionFilter(r)}
              className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                regionFilter === r
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700'
              }`}>
              {r === 'ALL' ? 'All Regions' : r}
            </button>
          ))}
        </div>

        {/* ── On Call Today ── */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
            On Call Today · {formatDate(DEMO_TODAY_ISO)}
          </h2>

          {Object.entries(todayByRegion).map(([region, bases]) => (
            <div key={region} className="mb-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
                {region}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {bases.map(({ base, entries }) => (
                  <TodayCard
                    key={base}
                    base={base}
                    entries={entries}
                    onSelect={entry => setSelected({ base, entry, date: DEMO_TODAY_ISO })}
                  />
                ))}
              </div>
            </div>
          ))}

          {Object.keys(todayByRegion).length === 0 && (
            <p className="text-sm text-neutral-500">No data for selected region today.</p>
          )}
        </section>

        {/* ── Weekly Grid ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Weekly Schedule
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={prevWeek}
                className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700">
                <ChevronLeft size={14} />
              </button>
              <button onClick={goToday}
                className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs">
                Today
              </button>
              <button onClick={nextWeek}
                className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-900">
                  <th className="text-left p-2 text-neutral-500 font-semibold sticky left-0 bg-neutral-900 z-10 min-w-[150px]">
                    Base
                  </th>
                  {weekDays.map(({ date }) => (
                    <th key={date}
                      className={`p-2 text-center font-semibold whitespace-nowrap min-w-[90px] ${
                        date === DEMO_TODAY_ISO
                          ? 'bg-orange-500/10 text-orange-400'
                          : 'text-neutral-500'
                      }`}>
                      {shortDate(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIONS.filter(r => regionFilter === 'ALL' || r === regionFilter).map(region => {
                  const bases = visibleBases.filter(b => BASE_META[b]?.region === region);
                  if (!bases.length) return null;

                  // Check if this region has any data in this week
                  const hasData = bases.some(b => weekDays.some(d => d.byBase[b]?.length > 0));
                  if (!hasData) return null;

                  return (
                    <React.Fragment key={region}>
                      <tr className="border-t-2 border-neutral-700">
                        <td colSpan={8}
                          className="px-2 py-1 bg-neutral-900/50 text-[10px] font-bold uppercase tracking-widest text-neutral-400 sticky left-0">
                          {region}
                        </td>
                      </tr>
                      {bases.map(base => {
                        const hasAny = weekDays.some(d => d.byBase[base]?.length > 0);
                        if (!hasAny) return null;
                        return (
                          <tr key={base} className="border-t border-neutral-800/60">
                            <td className="p-2 sticky left-0 bg-neutral-950 z-10">
                              <div className="font-medium text-neutral-200 leading-tight">
                                {BASE_META[base]?.label ?? base}
                              </div>
                            </td>
                            {weekDays.map(({ date, byBase }) => {
                              const entries = byBase[base] ?? [];
                              const isToday = date === DEMO_TODAY_ISO;
                              return (
                                <td key={date}
                                  className={`p-1 align-top ${isToday ? 'bg-orange-500/5' : ''}`}>
                                  <div className="flex flex-col gap-0.5">
                                    {entries.map((entry, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => setSelected({ base, entry, date })}
                                        className={`w-full px-1.5 py-1 rounded text-center text-[10px] leading-tight border transition-colors hover:opacity-80 ${slotColor(idx)} ${
                                          isToday ? 'ring-1 ring-orange-500/40' : ''
                                        } ${
                                          selected?.entry === entry ? 'ring-2 ring-white' : ''
                                        }`}>
                                        <div className="font-semibold">{initials(entry.owner)}</div>
                                        {entries.length === 1 && entry.type !== 'Maintenance On Call' && (
                                          <div className="text-[9px] opacity-70">{typeLabel(entry.type)}</div>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Detail panel ── */}
      {selected && (
        <DetailPanel
          selected={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Today card ────────────────────────────────────────────────────────────────

function TodayCard({ base, entries, onSelect }) {
  const meta = BASE_META[base] ?? { label: base, region: '' };
  const phoneFor = usePhoneFor();

  return (
    <div className="bg-neutral-800/60 rounded-lg border border-neutral-700 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-300 mb-1.5 leading-tight">
        {meta.label}
      </div>
      <div className="flex flex-col gap-1.5">
        {entries.map((entry, idx) => {
          const phone = phoneFor(entry.owner);
          return (
            <button
              key={idx}
              onClick={() => onSelect(entry)}
              className={`flex items-center gap-2 w-full rounded px-2 py-1.5 text-left border transition-colors hover:brightness-110 ${slotColor(idx)}`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold bg-black/25 shrink-0">
                {initials(entry.owner)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold leading-tight truncate">{entry.owner}</div>
                <div className="text-[10px] opacity-80 flex items-center gap-1">
                  <Clock size={9} />
                  {entry.hours}
                  {entry.type !== 'Maintenance On Call' && (
                    <span className="ml-1">· {typeLabel(entry.type)}</span>
                  )}
                </div>
              </div>
              {phone && <Phone size={11} className="ml-auto shrink-0 opacity-80" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Detail panel ───────────────────────────────────────────────────────────────

function DetailPanel({ selected, onClose }) {
  const { base, entry, date } = selected;
  const meta  = BASE_META[base] ?? { label: base, region: '' };
  const phoneFor = usePhoneFor();
  const phone = phoneFor(entry.owner);
  const isToday = date === DEMO_TODAY_ISO;

  return (
    <div className="w-72 shrink-0 sticky top-6 h-fit">
      <div className="rounded-lg border border-neutral-700 bg-neutral-900/80 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">
              {meta.region} · {meta.label}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
              {isToday ? 'On Call Now' : formatDate(date)}
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            <X size={16} />
          </button>
        </div>

        <h3 className="text-xl font-semibold mb-1">{entry.owner}</h3>
        <div className="text-xs text-neutral-400 mb-4 flex items-center gap-1.5">
          <Clock size={11} />
          {entry.hours} {entry.timezone}
          <span className="ml-1 px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px]">
            {typeLabel(entry.type)}
          </span>
        </div>

        {phone ? (
          <a href={`tel:${phone}`}
            className="flex items-center justify-center gap-2 w-full mb-4 px-3 py-2 bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-700 rounded-md text-sm font-medium transition-colors">
            <Phone size={14} />
            {phone}
          </a>
        ) : (
          <div className="mb-4 text-xs text-neutral-400 flex items-center gap-1.5">
            <Phone size={11} />
            Phone not on file
          </div>
        )}

        <div className="pt-3 border-t border-neutral-800 space-y-1 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <Users size={11} />
            <span>{entry.base}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
