import React, { useState, useMemo } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Filter, AlertTriangle } from 'lucide-react';
import { useFleet } from '../contexts/FleetDataContext';

const EVENT_COLORS = {
  inspection: { fill: 'rgba(254, 217, 184, 0.85)', text: '#a3501f', label: 'Inspection' },
  mx:         { fill: 'rgba(222, 236, 249, 0.85)', text: '#1d4480', label: 'MX' },
  aog:        { fill: 'rgba(253, 231, 233, 0.85)', text: '#9c1a1a', label: 'AOG' },
  pr:         { fill: 'rgba(233, 222, 250, 0.85)', text: '#5b2a8c', label: 'PR' },
  training:   { fill: 'rgba(223, 246, 221, 0.85)', text: '#1e6e2c', label: 'Training' },
  mission:    { fill: 'rgba(255, 233, 199, 0.85)', text: '#8b5a08', label: 'Mission' },
  default:    { fill: 'rgba(200, 200, 200, 0.65)', text: '#444', label: 'Event' }
};

const DAYS = 14;

export default function Scheduler() {
  const { aircraft, scheduleEvents, mxRequests, conflicts, loading } = useFleet();
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 1);
    return d;
  });

  const end = useMemo(() => {
    const d = new Date(start);
    d.setDate(d.getDate() + DAYS - 1);
    return d;
  }, [start]);

  const days = useMemo(() => {
    return Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [start]);

  // Merge schedule events + MX requests into one timeline
  const allEvents = useMemo(() => {
    const fromSchedule = scheduleEvents
      .filter((e) => e.windowStart && e.windowEnd)
      .map((e) => ({
        id: e.id || e.eventId,
        tail: e.aircraftTail,
        type: String(e.eventType ?? 'default').toLowerCase(),
        title: e.title || String(e.eventType ?? 'Event'),
        start: new Date(e.windowStart),
        endAt: new Date(e.windowEnd),
        source: e.sourceSystem
      }));
    const fromMx = mxRequests
      .filter((r) => r.windowStart && r.windowEnd && r.status !== 'Denied')
      .map((r) => ({
        id: r.id,
        tail: r.aircraftTail,
        type: r.type === 'AOG' ? 'aog' : 'mx',
        title: `${r.requestNumber} · ${r.type}`,
        start: new Date(r.windowStart),
        endAt: new Date(r.windowEnd),
        source: 'MX Connect'
      }));
    return [...fromSchedule, ...fromMx]
      .filter((e) => e.endAt >= start && e.start <= end);
  }, [scheduleEvents, mxRequests, start, end]);

  // Group by aircraft (rows)
  const rows = useMemo(() => {
    const byTail = new Map();
    aircraft.forEach((a) => byTail.set(a.tail, { aircraft: a, events: [] }));
    allEvents.forEach((e) => {
      if (!e.tail) return;
      if (!byTail.has(e.tail)) byTail.set(e.tail, { aircraft: { tail: e.tail, type: '—' }, events: [] });
      byTail.get(e.tail).events.push(e);
    });
    return Array.from(byTail.values()).filter((r) => r.events.length > 0);
  }, [aircraft, allEvents]);

  const dayWidth = 80;
  const rowHeight = 44;

  function navigate(deltaDays) {
    setStart((s) => {
      const d = new Date(s);
      d.setDate(d.getDate() + deltaDays);
      return d;
    });
  }

  if (loading) {
    return <div className="p-8 text-neutral-400 text-sm">Loading scheduler…</div>;
  }

  return (
    <div className="p-6 text-neutral-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <CalIcon size={22} className="text-orange-400" />
          <div>
            <h1 className="text-xl font-semibold">Resource Scheduler</h1>
            <p className="text-xs text-neutral-500">
              {rows.length} aircraft · {allEvents.length} events · {DAYS} day view
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(-DAYS)} className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => {
            const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 1); setStart(d);
          }} className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs">
            Today
          </button>
          <button onClick={() => navigate(DAYS)} className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/15 border border-red-900/40 flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-400" />
          <span className="text-sm">
            <span className="font-semibold text-red-400">{conflicts.length} conflict{conflicts.length !== 1 && 's'}</span>
            <span className="text-neutral-400 ml-2">— flagged events outlined in red</span>
          </span>
        </div>
      )}

      <div className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-x-auto">
        {/* Date header */}
        <div className="flex sticky top-0 bg-neutral-900 border-b border-neutral-800 z-10">
          <div className="shrink-0 w-32 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-r border-neutral-800">
            Aircraft
          </div>
          {days.map((d) => {
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div
                key={d.toISOString()}
                style={{ width: dayWidth }}
                className={`shrink-0 px-2 py-2 text-center text-[10px] font-semibold border-r border-neutral-800 ${
                  isToday ? 'bg-orange-500/10 text-orange-400' : 'text-neutral-500'
                }`}
              >
                <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-neutral-300">{d.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {rows.length === 0 && (
          <div className="p-12 text-center text-neutral-500 text-sm">
            No scheduled events in this window
          </div>
        )}
        {rows.map(({ aircraft: a, events }) => (
          <div key={a.tail} className="flex border-b border-neutral-900 relative" style={{ height: rowHeight }}>
            <div className="shrink-0 w-32 px-3 py-2 border-r border-neutral-800 bg-neutral-950">
              <div className="text-xs font-semibold">{a.tail}</div>
              <div className="text-[10px] text-neutral-500 truncate">{a.type}</div>
            </div>
            <div className="flex relative" style={{ width: DAYS * dayWidth }}>
              {days.map((d) => (
                <div key={d.toISOString()} style={{ width: dayWidth }} className="shrink-0 border-r border-neutral-900" />
              ))}
              {events.map((e) => {
                const startDay = Math.max(0, Math.floor((e.start - start) / 86_400_000));
                const endDay = Math.min(DAYS, Math.ceil((e.endAt - start) / 86_400_000));
                const left = startDay * dayWidth + 2;
                const width = (endDay - startDay) * dayWidth - 4;
                if (width <= 0) return null;
                const cfg = EVENT_COLORS[e.type] ?? EVENT_COLORS.default;
                return (
                  <div
                    key={e.id}
                    title={`${e.title}\n${e.source ?? ''}`}
                    className="absolute rounded text-[10px] font-semibold px-2 truncate flex items-center"
                    style={{
                      left, width,
                      top: 5, height: rowHeight - 10,
                      background: cfg.fill,
                      color: cfg.text
                    }}
                  >
                    {e.title}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap text-[11px]">
        {Object.entries(EVENT_COLORS).filter(([k]) => k !== 'default').map(([k, c]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ background: c.fill }} />
            <span className="text-neutral-400">{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
