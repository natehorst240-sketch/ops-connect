import React, { useState, useMemo } from 'react';
import { Phone, ChevronLeft, ChevronRight, Calendar as CalIcon, X, MapPin, Users, ArrowRight } from 'lucide-react';
import {
  ONCALL_ROSTER,
  DEMO_TODAY_ISO,
  getCurrentOncall,
  getWeeklySchedule,
  addDays
} from '../data/mxOncallSchedule';

export default function OncallSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selected, setSelected] = useState(null);

  const currentOncall = useMemo(() => getCurrentOncall(), []);
  const schedule = useMemo(() => {
    const start = addDays(DEMO_TODAY_ISO, weekOffset * 7);
    return getWeeklySchedule(start, 8);
  }, [weekOffset]);

  function selectSlot(regionKey, slotIndex, slotStart, slotEnd, person, personIndex) {
    const regionDef = ONCALL_ROSTER.find((r) => r.region === regionKey);
    const relief = regionDef?.persons[(personIndex + 1) % 2];
    setSelected({
      region: regionKey,
      regionLabel: regionDef?.label,
      slotIndex,
      slotStart,
      slotEnd,
      person,
      personIndex,
      relief,
      isCurrent: slotIndex === schedule.find((w) => w.isCurrent)?.slotIndex
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-neutral-100 flex gap-6">
      <div className="flex-1 min-w-0">
      <div className="flex items-center gap-3 mb-1">
        <CalIcon size={22} className="text-orange-400" />
        <h1 className="text-2xl font-semibold">MX On-Call Schedule</h1>
      </div>
      <p className="text-sm text-neutral-400 mb-6">
        8 days on / 6 days off · Wednesday-to-Wednesday handoff
      </p>

      {/* Current on-call cards */}
      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-3">
          On-Call This Week
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {currentOncall.map((slot) => (
            <CurrentCard
              key={slot.region}
              slot={slot}
              onClick={() => selectSlot(slot.region, schedule.find((w) => w.isCurrent)?.slotIndex, slot.slotStart, slot.slotEnd, slot.person, slot.personIndex)}
            />
          ))}
        </div>
      </section>

      {/* 8-week grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
            8-Week Rotation
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekOffset((w) => w - 8)}
              className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 8)}
              className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-neutral-900">
                <th className="text-left p-2 text-neutral-500 font-semibold sticky left-0 bg-neutral-900 z-10">Region</th>
                {schedule.map((w) => (
                  <th
                    key={w.slotIndex}
                    className={`p-2 text-center font-semibold ${
                      w.isCurrent ? 'bg-orange-500/10 text-orange-400' : 'text-neutral-500'
                    }`}
                  >
                    {new Date(w.slotStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ONCALL_ROSTER.map((reg) => (
                <tr key={reg.region} className="border-t border-neutral-800">
                  <td className="p-2 font-medium sticky left-0 bg-neutral-950 z-10">
                    <div>{reg.region}</div>
                    <div className="text-[10px] text-neutral-500 font-normal">{reg.label}</div>
                  </td>
                  {schedule.map((w) => {
                    const cell = w.regions.find((r) => r.region === reg.region);
                    if (!cell) return <td key={w.slotIndex} />;
                    const bg = cell.personIndex === 0
                      ? 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/30'
                      : 'bg-orange-500/15 text-orange-300 hover:bg-orange-500/30';
                    const border = w.isCurrent ? 'ring-2 ring-orange-500 ring-inset' : '';
                    const isSelected = selected?.region === reg.region && selected?.slotIndex === w.slotIndex;
                    const selectedRing = isSelected ? 'ring-2 ring-white ring-inset' : '';
                    return (
                      <td key={w.slotIndex} className="p-1">
                        <button
                          onClick={() => selectSlot(reg.region, w.slotIndex, w.slotStart, w.slotEnd, cell.person, cell.personIndex)}
                          className={`w-full px-2 py-1.5 rounded ${bg} ${border} ${selectedRing} text-center cursor-pointer transition-colors`}
                        >
                          {cell.person.initials}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
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

function DetailPanel({ selected, onClose }) {
  const handoffDays = Math.ceil(
    (new Date(selected.slotEnd) - new Date(DEMO_TODAY_ISO)) / 86_400_000
  );
  const slotStartDate = new Date(selected.slotStart);
  const slotEndDate = new Date(selected.slotEnd);
  const isPast = slotEndDate < new Date(DEMO_TODAY_ISO);
  const isFuture = slotStartDate > new Date(DEMO_TODAY_ISO);
  const bg = selected.personIndex === 0
    ? 'border-blue-700/40 bg-blue-900/10'
    : 'border-orange-700/40 bg-orange-900/10';

  return (
    <div className="w-80 shrink-0 sticky top-6 h-fit">
      <div className={`rounded-lg border ${bg} p-4`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-0.5">
              {selected.region} · {selected.regionLabel}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
              {selected.isCurrent ? 'On Call Now' : isPast ? 'Past Slot' : isFuture ? 'Upcoming Slot' : 'Slot'}
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
            <X size={16} />
          </button>
        </div>

        <h3 className="text-xl font-semibold mb-1">{selected.person.name}</h3>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4">
          <MapPin size={11} />
          {selected.person.base}
        </div>

        <a
          href={`tel:${selected.person.phone}`}
          className="flex items-center justify-center gap-2 w-full mb-4 px-3 py-2 bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-700 rounded-md text-sm font-medium"
        >
          <Phone size={14} />
          {selected.person.phone}
        </a>

        <div className="space-y-3 pt-3 border-t border-neutral-800">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Slot Window</div>
            <div className="text-sm">
              {slotStartDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              <ArrowRight size={11} className="inline mx-1.5 text-neutral-600" />
              {slotEndDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            <div className="text-[10px] text-neutral-500 mt-0.5">
              {selected.isCurrent
                ? `Handoff in ${handoffDays} days`
                : isPast ? 'Completed'
                : `Starts in ${Math.ceil((slotStartDate - new Date(DEMO_TODAY_ISO)) / 86_400_000)} days`}
            </div>
          </div>

          {selected.relief && (
            <div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Next On-Call (Relief)</div>
              <div className="flex items-center gap-2">
                <Users size={11} className="text-neutral-500" />
                <span className="text-sm">{selected.relief.name}</span>
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                {selected.relief.base} · {selected.relief.phone}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CurrentCard({ slot, onClick }) {
  const handoffDays = Math.ceil(
    (new Date(slot.slotEnd) - new Date(DEMO_TODAY_ISO)) / 86_400_000
  );
  const bg = slot.personIndex === 0 ? 'border-blue-700/40 bg-blue-900/10 hover:bg-blue-900/20' : 'border-orange-700/40 bg-orange-900/10 hover:bg-orange-900/20';
  return (
    <button onClick={onClick} className={`text-left p-3 rounded-lg border ${bg} cursor-pointer transition-colors`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
        {slot.region}
      </div>
      <div className="text-base font-semibold mb-0.5">{slot.person.name}</div>
      <div className="text-xs text-neutral-400 mb-2">{slot.person.base}</div>
      <div className="flex items-center justify-between">
        <a
          href={`tel:${slot.person.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 text-xs"
        >
          <Phone size={11} />
          Call
        </a>
        <span className="text-[10px] text-neutral-500">
          Handoff in {handoffDays}d
        </span>
      </div>
    </button>
  );
}
