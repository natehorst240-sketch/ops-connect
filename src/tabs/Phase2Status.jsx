import React from 'react';
import { Calendar, MapPin, AlertTriangle, Plane, Activity, Clock } from 'lucide-react';
import { useFleet } from '../contexts/FleetDataContext';
import { PREFIX } from '../auth/schema';

export default function Phase2Status() {
  const { scheduleEvents, fleetPositions, conflicts, loading } = useFleet();

  if (loading) {
    return (
      <div className="p-8 text-neutral-400 text-sm">Loading Phase 2 data…</div>
    );
  }

  const inFlight = fleetPositions.filter(p => p.inFlight === true || p.inFlightLabel === 'Yes').length;
  const aog = conflicts.filter(c => c.type === 'aog_cascade' || c.severity === 'critical').length;
  const warnings = conflicts.filter(c => c.severity === 'warning').length;

  return (
    <div className="p-8 max-w-6xl mx-auto text-neutral-100 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-1">Phase 2 — Operations Layer</h1>
        <p className="text-sm text-neutral-400">
          Live data from <code className="font-mono text-xs">{PREFIX}scheduleevents</code>,{' '}
          <code className="font-mono text-xs">{PREFIX}fleetpositions</code>,{' '}
          <code className="font-mono text-xs">{PREFIX}conflicts</code>
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Kpi icon={Calendar} label="Schedule Events" value={scheduleEvents.length} sub="next 7 days" accent="#3b82f6" />
        <Kpi icon={MapPin}   label="Positions Tracked" value={fleetPositions.length} sub={`${inFlight} in flight`} accent="#22c55e" />
        <Kpi icon={AlertTriangle} label="Active Conflicts" value={conflicts.length} sub={`${aog} critical, ${warnings} warn`} accent={aog > 0 ? '#ef4444' : '#eab308'} />
        <Kpi icon={Activity} label="Sources" value={new Set(scheduleEvents.map(e => e.sourceSystem)).size} sub="CompleteFlight, ProteanHub" accent="#a855f7" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Panel title="Schedule Events" icon={Calendar}>
          {scheduleEvents.length === 0 && <Empty>No events</Empty>}
          {scheduleEvents.map(e => (
            <Row
              key={e.id || e.eventId}
              title={e.title || e.eventId}
              meta={`${e.aircraftTail ?? '—'} · ${e.eventType ?? 'event'}`}
              right={e.sourceSystem}
              accent="#3b82f6"
            />
          ))}
        </Panel>

        <Panel title="Active Conflicts" icon={AlertTriangle}>
          {conflicts.length === 0 && <Empty>No conflicts</Empty>}
          {conflicts.map(c => (
            <Row
              key={c.id || c.conflictId}
              title={c.title || c.detail}
              meta={c.suggestion}
              right={c.severity}
              accent={c.severity === 'critical' ? '#ef4444' : '#eab308'}
            />
          ))}
        </Panel>
      </div>

      <Panel title="Fleet Positions" icon={MapPin}>
        {fleetPositions.length === 0 && <Empty>No live positions</Empty>}
        <div className="grid grid-cols-2 gap-2">
          {fleetPositions.map(p => (
            <div
              key={p.id || p.tail}
              className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              <Plane size={16} className={p.inFlight || p.inFlightLabel === 'Yes' ? 'text-green-500' : 'text-neutral-500'} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold">{p.tail}</div>
                <div className="text-xs text-neutral-500 font-mono">
                  {p.lat?.toFixed?.(3) ?? p.lat}, {p.lon?.toFixed?.(3) ?? p.lon}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-neutral-300">{p.speed ?? 0} kt</div>
                <div className="text-xs text-neutral-500">{p.altitude ?? 0} ft</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: accent }} />
        <span className="mono text-[10px] text-neutral-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{sub}</div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="rounded-lg bg-neutral-900 border border-neutral-800">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
        <Icon size={14} className="text-neutral-400" />
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-3 space-y-2">{children}</div>
    </div>
  );
}

function Row({ title, meta, right, accent }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-neutral-950 border border-neutral-800">
      <div className="w-1 h-8 rounded-full" style={{ background: accent }} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {meta && <div className="text-xs text-neutral-500 truncate">{meta}</div>}
      </div>
      {right && <div className="text-xs text-neutral-400 font-mono">{right}</div>}
    </div>
  );
}

function Empty({ children }) {
  return <div className="text-xs text-neutral-500 italic p-3">{children}</div>;
}
