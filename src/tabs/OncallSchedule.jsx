import React, { useState, useMemo } from 'react';
import { Phone, ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';
import {
  ONCALL_ROSTER,
  DEMO_TODAY_ISO,
  getCurrentOncall,
  getWeeklySchedule,
  addDays
} from '../data/mxOncallSchedule';

export default function OncallSchedule() {
  const [weekOffset, setWeekOffset] = useState(0);

  const currentOncall = useMemo(() => getCurrentOncall(), []);
  const schedule = useMemo(() => {
    const start = addDays(DEMO_TODAY_ISO, weekOffset * 7);
    return getWeeklySchedule(start, 8);
  }, [weekOffset]);

  return (
    <div className="p-8 max-w-6xl mx-auto text-neutral-100">
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
            <CurrentCard key={slot.region} slot={slot} />
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
                      ? 'bg-blue-500/15 text-blue-300'
                      : 'bg-orange-500/15 text-orange-300';
                    const border = w.isCurrent ? 'ring-2 ring-orange-500 ring-inset' : '';
                    return (
                      <td key={w.slotIndex} className="p-1">
                        <div className={`px-2 py-1.5 rounded ${bg} ${border} text-center`}>
                          {cell.person.initials}
                        </div>
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
  );
}

function CurrentCard({ slot }) {
  const handoffDays = Math.ceil(
    (new Date(slot.slotEnd) - new Date(DEMO_TODAY_ISO)) / 86_400_000
  );
  const bg = slot.personIndex === 0 ? 'border-blue-700/40 bg-blue-900/10' : 'border-orange-700/40 bg-orange-900/10';
  return (
    <div className={`p-3 rounded-lg border ${bg}`}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
        {slot.region}
      </div>
      <div className="text-base font-semibold mb-0.5">{slot.person.name}</div>
      <div className="text-xs text-neutral-400 mb-2">{slot.person.base}</div>
      <div className="flex items-center justify-between">
        <a
          href={`tel:${slot.person.phone}`}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-800/60 hover:bg-neutral-800 text-xs"
        >
          <Phone size={11} />
          Call
        </a>
        <span className="text-[10px] text-neutral-500">
          Handoff in {handoffDays}d
        </span>
      </div>
    </div>
  );
}
