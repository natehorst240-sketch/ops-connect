import React, { useState, useMemo } from 'react';
import { Calendar as CalIcon, ChevronLeft, ChevronRight, AlertTriangle, X, ExternalLink, Plane, Clock } from 'lucide-react';
import { useFleet } from '../contexts/FleetDataContext';
import { useCurrentUser } from '../hooks/useCurrentUser';

const EVENT_COLORS = {
  inspection: { fill: 'rgba(254, 217, 184, 0.85)', text: '#a3501f', label: 'Inspection' },
  mx:         { fill: 'rgba(222, 236, 249, 0.85)', text: '#1d4480', label: 'MX' },
  aog:        { fill: 'rgba(253, 231, 233, 0.85)', text: '#9c1a1a', label: 'AOG' },
  pr:         { fill: 'rgba(233, 222, 250, 0.85)', text: '#5b2a8c', label: 'PR' },
  training:   { fill: 'rgba(223, 246, 221, 0.85)', text: '#1e6e2c', label: 'Training' },
  mission:    { fill: 'rgba(255, 233, 199, 0.85)', text: '#8b5a08', label: 'Mission' },
  default:    { fill: 'rgba(200, 200, 200, 0.65)', text: '#444', label: 'Event' }
};

const DAYS = 21; // 3-week view

export default function Scheduler() {
  const { aircraft, scheduleEvents, mxRequests, conflicts, loading } = useFleet();
  const { persona } = useCurrentUser();
  const [showConflicts, setShowConflicts] = useState(false);
  const [selected, setSelected] = useState(null);

  // Region filter: default to own region for AMT/RMM, ALL for leadership
  const defaultRegion = (persona?.role === 'AMT' || persona?.role === 'RMM') && persona?.region && persona.region !== 'ALL'
    ? persona.region : 'ALL';
  const [regionFilter, setRegionFilter] = useState(defaultRegion);

  const regions = useMemo(() => ['ALL', ...[...new Set(aircraft.map(a => a.region).filter(Boolean))].sort()], [aircraft]);

  // Default window: anchor on earliest event in the dataset, or today - 7
  const [start, setStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - 7);
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
        id: `evt-${e.id || e.eventId}`,
        tail: e.aircraftTail,
        type: String(e.eventType ?? 'default').toLowerCase(),
        title: e.title || String(e.eventType ?? 'Event'),
        start: new Date(e.windowStart),
        endAt: new Date(e.windowEnd),
        source: e.sourceSystem,
        sourceEventId: e.sourceEventId,
        category: 'schedule'
      }));
    const fromMx = mxRequests
      .filter((r) => r.windowStart && r.windowEnd && r.status !== 'Denied')
      .map((r) => ({
        id: `mxr-${r.id}`,
        tail: r.aircraftTail,
        type: r.type === 'AOG' ? 'aog' : 'mx',
        title: `${r.requestNumber} · ${r.type}`,
        start: new Date(r.windowStart),
        endAt: new Date(r.windowEnd),
        source: 'MX Connect',
        status: r.status,
        priority: r.priority,
        reason: r.reason,
        requestedBy: r.requestedBy,
        category: 'mx'
      }));
    return [...fromSchedule, ...fromMx]
      .filter((e) => e.endAt >= start && e.start <= end);
  }, [scheduleEvents, mxRequests, start, end]);

  // Group by aircraft (rows) — filter by region, show rows with events first
  const rows = useMemo(() => {
    const src = regionFilter === 'ALL' ? aircraft : aircraft.filter(a => a.region === regionFilter);
    const byTail = new Map();
    src.forEach((a) => byTail.set(a.tail, { aircraft: a, events: [] }));
    allEvents.forEach((e) => {
      if (!e.tail) return;
      if (!byTail.has(e.tail)) {
        if (regionFilter !== 'ALL') return; // skip events for filtered-out aircraft
        byTail.set(e.tail, { aircraft: { tail: e.tail, type: '—', region: '—' }, events: [] });
      }
      byTail.get(e.tail).events.push(e);
    });
    return Array.from(byTail.values()).sort((a, b) => {
      if (a.events.length && !b.events.length) return -1;
      if (!a.events.length && b.events.length) return 1;
      return (a.aircraft.tail ?? '').localeCompare(b.aircraft.tail ?? '');
    });
  }, [aircraft, allEvents, regionFilter]);

  const dayWidth = 70;
  const rowHeight = 40;

  function navigate(deltaDays) {
    setStart((s) => {
      const d = new Date(s);
      d.setDate(d.getDate() + deltaDays);
      return d;
    });
    setSelected(null);
  }

  function jumpToEarliest() {
    if (allEvents.length === 0 && scheduleEvents.length === 0) return;
    const all = [...scheduleEvents, ...mxRequests]
      .filter((e) => e.windowStart)
      .map((e) => new Date(e.windowStart));
    if (all.length === 0) return;
    const earliest = new Date(Math.min(...all.map((d) => d.getTime())));
    earliest.setDate(earliest.getDate() - 2);
    earliest.setHours(0, 0, 0, 0);
    setStart(earliest);
    setSelected(null);
  }

  if (loading) {
    return <div className="p-8 text-neutral-400 text-sm">Loading scheduler…</div>;
  }

  return (
    <div className="p-6 text-neutral-100 flex gap-4 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CalIcon size={22} className="text-orange-400" />
            <div>
              <h1 className="text-xl font-semibold">Resource Scheduler</h1>
              <p className="text-xs text-neutral-500">
                {aircraft.length} aircraft · {allEvents.length} events in window · {DAYS} day view
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {/* Region chips */}
            {regions.slice(0, 8).map(r => (
              <button key={r} onClick={() => setRegionFilter(r)}
                className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                  regionFilter === r
                    ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700'
                }`}>
                {r === 'ALL' ? 'All' : r}
              </button>
            ))}
            <div className="w-px h-5 bg-neutral-800 mx-1" />
            <button onClick={() => navigate(-DAYS)} className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700" title="Previous">
              <ChevronLeft size={14} />
            </button>
            <button onClick={() => {
              const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - 7); setStart(d); setSelected(null);
            }} className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs">
              Today
            </button>
            <button onClick={jumpToEarliest} className="px-3 py-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-xs">
              Jump to data
            </button>
            <button onClick={() => navigate(DAYS)} className="p-1.5 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700" title="Next">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {conflicts.length > 0 && (
          <button
            onClick={() => setShowConflicts(!showConflicts)}
            className="w-full mb-4 p-3 rounded-lg bg-red-900/15 border border-red-900/40 flex items-center gap-3 hover:bg-red-900/25 transition-colors text-left"
          >
            <AlertTriangle size={16} className="text-red-400 shrink-0" />
            <span className="text-sm flex-1">
              <span className="font-semibold text-red-400">{conflicts.length} conflict{conflicts.length !== 1 && 's'}</span>
              <span className="text-neutral-400 ml-2">— click to {showConflicts ? 'hide' : 'view'}</span>
            </span>
          </button>
        )}

        {showConflicts && (
          <div className="mb-4 space-y-2">
            {conflicts.map((c) => (
              <div key={c.id || c.conflictId} className="p-3 rounded-lg bg-red-900/10 border border-red-900/30">
                <div className="text-sm font-semibold text-red-300 mb-1">{c.title || c.detail}</div>
                {c.suggestion && <div className="text-xs text-neutral-400">→ {c.suggestion}</div>}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-neutral-800 bg-neutral-950 overflow-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {/* Date header */}
          <div className="flex sticky top-0 bg-neutral-900 border-b border-neutral-800 z-10">
            <div className="shrink-0 w-32 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border-r border-neutral-800 sticky left-0 bg-neutral-900 z-20">
              Aircraft
            </div>
            {days.map((d) => {
              const isToday = d.toDateString() === new Date().toDateString();
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
              return (
                <div
                  key={d.toISOString()}
                  style={{ width: dayWidth }}
                  className={`shrink-0 px-2 py-2 text-center text-[10px] font-semibold border-r border-neutral-800 ${
                    isToday ? 'bg-orange-500/15 text-orange-400'
                    : isWeekend ? 'bg-neutral-900/60 text-neutral-600'
                    : 'text-neutral-500'
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
              No aircraft loaded
            </div>
          )}
          {rows.map(({ aircraft: a, events }) => (
            <div key={a.tail} className="flex border-b border-neutral-900/50 relative hover:bg-neutral-900/30" style={{ height: rowHeight }}>
              <div className="shrink-0 w-32 px-3 py-2 border-r border-neutral-800 bg-neutral-950 sticky left-0 z-10">
                <div className="text-xs font-semibold">{a.tail}</div>
                <div className="text-[10px] text-neutral-500 truncate">{a.type}</div>
              </div>
              <div className="flex relative" style={{ width: DAYS * dayWidth }}>
                {days.map((d) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={d.toISOString()} style={{ width: dayWidth }}
                         className={`shrink-0 border-r ${isWeekend ? 'border-neutral-900 bg-neutral-900/30' : 'border-neutral-900/50'}`} />
                  );
                })}
                {events.map((e) => {
                  const startDay = Math.max(0, (e.start - start) / 86_400_000);
                  const endDay = Math.min(DAYS, (e.endAt - start) / 86_400_000);
                  const left = startDay * dayWidth + 2;
                  const width = (endDay - startDay) * dayWidth - 4;
                  if (width <= 0) return null;
                  const cfg = EVENT_COLORS[e.type] ?? EVENT_COLORS.default;
                  const isSelected = selected?.id === e.id;
                  return (
                    <button
                      key={e.id}
                      onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}
                      title={e.title}
                      className="absolute rounded text-[10px] font-semibold px-2 truncate flex items-center hover:brightness-110 cursor-pointer transition-all"
                      style={{
                        left, width,
                        top: 5, height: rowHeight - 10,
                        background: cfg.fill,
                        color: cfg.text,
                        boxShadow: isSelected ? '0 0 0 2px #f97316' : 'none'
                      }}
                    >
                      {e.title}
                    </button>
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

      {/* Detail panel */}
      {selected && (
        <div className="w-80 shrink-0 rounded-lg border border-neutral-800 bg-neutral-900 p-4 h-fit sticky top-6">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">
                {EVENT_COLORS[selected.type]?.label ?? 'Event'}
              </div>
              <h3 className="text-base font-semibold leading-tight">{selected.title}</h3>
            </div>
            <button onClick={() => setSelected(null)} className="text-neutral-500 hover:text-neutral-200">
              <X size={16} />
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <DetailRow icon={Plane} label="Aircraft" value={selected.tail} />
            <DetailRow icon={Clock} label="Start" value={selected.start.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} />
            <DetailRow icon={Clock} label="End" value={selected.endAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })} />
            {selected.source && <DetailRow icon={ExternalLink} label="Source" value={selected.source} />}
            {selected.sourceEventId && <DetailRow label="Source ID" value={selected.sourceEventId} mono />}
            {selected.status && <DetailRow label="Status" value={selected.status} />}
            {selected.priority && <DetailRow label="Priority" value={selected.priority} />}
            {selected.requestedBy && <DetailRow label="Requested by" value={selected.requestedBy} />}
            {selected.reason && (
              <div className="pt-2 border-t border-neutral-800">
                <div className="text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Reason</div>
                <p className="text-xs text-neutral-300">{selected.reason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon size={12} className="text-neutral-500 mt-0.5 shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-neutral-500">{label}</div>
        <div className={`text-xs text-neutral-200 ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    </div>
  );
}
