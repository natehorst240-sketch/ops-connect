import React, { useState, useMemo } from 'react';
import { Phone, ChevronLeft, ChevronRight, Calendar as CalIcon, X, MapPin, Users, ArrowRight } from 'lucide-react';
import {
  ONCALL_ROSTER,
  DEMO_TODAY_ISO,
  getCurrentOncall,
  getWeeklySchedule,
  addDays
} from '../data/mxOncallSchedule';

const REGIONS = [...new Set(ONCALL_ROSTER.map(b => b.region))];

export default function OncallSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [regionFilter, setRegionFilter] = useState('ALL');

  const currentOncall = useMemo(() => getCurrentOncall(), []);
  const schedule = useMemo(() => {
    const start = addDays(DEMO_TODAY_ISO, weekOffset * 7);
    return getWeeklySchedule(start, 8);
  }, [weekOffset]);

  const visibleRoster = useMemo(() =>
    regionFilter === 'ALL'
      ? ONCALL_ROSTER
      : ONCALL_ROSTER.filter(b => b.region === regionFilter),
  [regionFilter]);

  function selectSlot(baseId, slotIndex, slotStart, slotEnd, person, personIndex) {
    const base = ONCALL_ROSTER.find(b => b.baseId === baseId);
    const nextIdx = (personIndex + 1) % base.persons.length;
    const relief  = base.persons.length > 1 ? base.persons[nextIdx] : null;
    setSelected({ baseId, baseLabel: base.baseLabel, region: base.region, slotIndex, slotStart, slotEnd, person, personIndex, relief });
  }

  // Group current on-call by region for the header cards
  const byRegion = useMemo(() => {
    const map = {};
    currentOncall
      .filter(s => regionFilter === 'ALL' || s.region === regionFilter)
      .forEach(s => {
        if (!map[s.region]) map[s.region] = [];
        map[s.region].push(s);
      });
    return map;
  }, [currentOncall, regionFilter]);

  const todaySlot = schedule.find(w => w.isCurrent);

  return (
    <div className="p-6 max-w-full text-neutral-100 flex gap-6">
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <CalIcon size={22} className="text-orange-400" />
          <h1 className="text-2xl font-semibold">MX On-Call Schedule</h1>
        </div>
        <p className="text-sm text-neutral-400 mb-4">
          8 days on / 6 days off · Wednesday-to-Wednesday handoff
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

        {/* Current on-call — one card per BASE, grouped by region */}
        <section className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
            On-Call Now
          </h2>
          {Object.entries(byRegion).map(([region, slots]) => (
            <div key={region} className="mb-4">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600 mb-2">
                {region}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {slots.map(slot => (
                  <CurrentCard
                    key={slot.baseId}
                    slot={slot}
                    onClick={() => selectSlot(slot.baseId, todaySlot?.slotIndex, slot.slotStart, slot.slotEnd, slot.person, slot.personIndex)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* 8-week rotation grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              8-Week Rotation
            </h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setWeekOffset(w => w - 8)}
                className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setWeekOffset(0)}
                className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs">
                Today
              </button>
              <button onClick={() => setWeekOffset(w => w + 8)}
                className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-neutral-900">
                  <th className="text-left p-2 text-neutral-500 font-semibold sticky left-0 bg-neutral-900 z-10 min-w-[140px]">
                    Base
                  </th>
                  {schedule.map(w => (
                    <th key={w.slotIndex}
                      className={`p-2 text-center font-semibold whitespace-nowrap ${
                        w.isCurrent ? 'bg-orange-500/10 text-orange-400' : 'text-neutral-500'
                      }`}>
                      {new Date(w.slotStart + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Region divider rows + base rows */}
                {REGIONS.filter(r => regionFilter === 'ALL' || r === regionFilter).map(region => {
                  const bases = visibleRoster.filter(b => b.region === region);
                  if (!bases.length) return null;
                  return (
                    <React.Fragment key={region}>
                      <tr className="border-t-2 border-neutral-700">
                        <td colSpan={schedule.length + 1}
                          className="px-2 py-1 bg-neutral-900/50 text-[10px] font-bold uppercase tracking-widest text-neutral-500 sticky left-0">
                          {region}
                        </td>
                      </tr>
                      {bases.map(base => (
                        <tr key={base.baseId} className="border-t border-neutral-800/60">
                          <td className="p-2 sticky left-0 bg-neutral-950 z-10">
                            <div className="font-medium text-neutral-200">{base.baseLabel}</div>
                          </td>
                          {schedule.map(w => {
                            const cell = w.bases.find(b => b.baseId === base.baseId);
                            if (!cell) return <td key={w.slotIndex} />;
                            const isTbd = cell.person.name === '[TBD]';
                            const colors = [
                              'bg-blue-500/15 text-blue-300 hover:bg-blue-500/30',
                              'bg-orange-500/15 text-orange-300 hover:bg-orange-500/30',
                              'bg-purple-500/15 text-purple-300 hover:bg-purple-500/30',
                              'bg-green-500/15 text-green-300 hover:bg-green-500/30',
                            ];
                            const bg = isTbd
                              ? 'bg-neutral-800/40 text-neutral-600 cursor-default'
                              : colors[cell.personIndex % colors.length];
                            const currentRing = w.isCurrent ? 'ring-2 ring-orange-500 ring-inset' : '';
                            const selectedRing = selected?.baseId === base.baseId && selected?.slotIndex === w.slotIndex
                              ? 'ring-2 ring-white ring-inset' : '';
                            return (
                              <td key={w.slotIndex} className="p-1">
                                <button
                                  disabled={isTbd}
                                  onClick={() => !isTbd && selectSlot(base.baseId, w.slotIndex, w.slotStart, w.slotEnd, cell.person, cell.personIndex)}
                                  className={`w-full px-2 py-1.5 rounded text-center transition-colors ${bg} ${currentRing} ${selectedRing}`}>
                                  {cell.person.initials}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Detail panel */}
      {selected && <DetailPanel selected={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ selected, onClose }) {
  const handoffDays = Math.ceil(
    (new Date(selected.slotEnd) - new Date(DEMO_TODAY_ISO)) / 86_400_000
  );
  const slotStartDate = new Date(selected.slotStart + 'T12:00:00Z');
  const slotEndDate   = new Date(selected.slotEnd   + 'T12:00:00Z');
  const today         = new Date(DEMO_TODAY_ISO      + 'T12:00:00Z');
  const isPast   = slotEndDate   < today;
  const isFuture = slotStartDate > today;
  const isCurrent = !isPast && !isFuture;

  const colorIdx = selected.personIndex % 4;
  const borders = [
    'border-blue-700/40 bg-blue-900/10',
    'border-orange-700/40 bg-orange-900/10',
    'border-purple-700/40 bg-purple-900/10',
    'border-green-700/40 bg-green-900/10',
  ];

  return (
    <div className="w-72 shrink-0 sticky top-6 h-fit">
      <div className={`rounded-lg border ${borders[colorIdx]} p-4`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">
              {selected.region} · {selected.baseLabel}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
              {isCurrent ? 'On Call Now' : isPast ? 'Past Slot' : 'Upcoming Slot'}
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            <X size={16} />
          </button>
        </div>

        <h3 className="text-xl font-semibold mb-4">{selected.person.name}</h3>

        {selected.person.phone && (
          <a href={`tel:${selected.person.phone}`}
            className="flex items-center justify-center gap-2 w-full mb-4 px-3 py-2 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-700 rounded-md text-sm font-medium">
            <Phone size={14} />
            {selected.person.phone}
          </a>
        )}

        <div className="space-y-3 pt-3 border-t border-neutral-800">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Slot Window</div>
            <div className="text-sm">
              {slotStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
              <ArrowRight size={11} className="inline mx-1.5 text-neutral-600" />
              {slotEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {isCurrent
                ? `Handoff in ${handoffDays} days`
                : isPast ? 'Completed'
                : `Starts in ${Math.ceil((slotStartDate - today) / 86_400_000)} days`}
            </div>
          </div>

          {selected.relief && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Next On-Call</div>
              <div className="flex items-center gap-2">
                <Users size={11} className="text-neutral-500" />
                <span className="text-sm">{selected.relief.name}</span>
              </div>
              {selected.relief.phone && (
                <div className="text-[10px] text-neutral-500 mt-0.5">{selected.relief.phone}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Current card ───────────────────────────────────────────────────────────────

function CurrentCard({ slot, onClick }) {
  const handoffDays = Math.ceil(
    (new Date(slot.slotEnd) - new Date(DEMO_TODAY_ISO)) / 86_400_000
  );
  const isTbd = slot.person.name === '[TBD]';
  const borders = [
    'border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20',
    'border-orange-700/40 bg-orange-900/10 hover:bg-orange-900/20',
    'border-purple-700/40 bg-purple-900/10 hover:bg-purple-900/20',
    'border-green-700/40 bg-green-900/10 hover:bg-green-900/20',
  ];
  const bg = isTbd
    ? 'border-neutral-800 bg-neutral-900/40'
    : borders[slot.personIndex % borders.length];

  return (
    <button onClick={isTbd ? undefined : onClick}
      disabled={isTbd}
      className={`text-left p-3 rounded-lg border ${bg} transition-colors ${isTbd ? 'cursor-default' : 'cursor-pointer'}`}>
      <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1 truncate">
        {slot.baseLabel}
      </div>
      <div className={`text-sm font-semibold mb-0.5 ${isTbd ? 'text-neutral-600 italic' : ''}`}>
        {slot.person.name}
      </div>
      {!isTbd && (
        <div className="flex items-center justify-between mt-2">
          <a href={`tel:${slot.person.phone}`} onClick={e => e.stopPropagation()}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 text-xs">
            <Phone size={11} />
            Call
          </a>
          <span className="text-[10px] text-neutral-500">
            {handoffDays}d left
          </span>
        </div>
      )}
    </button>
  );
}
