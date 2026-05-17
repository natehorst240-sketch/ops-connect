import React, { useState, useMemo } from 'react';
import { Wrench, AlertTriangle } from 'lucide-react';
import { useDueList } from '../hooks/useDueList';
import { useFlightHoursHistory } from '../hooks/useFlightHoursHistory';

// ─── Data URLs ──────────────────────────────────────────────────────────────────

const FLEET_URLS = {
  '109SP': {
    due:   'https://raw.githubusercontent.com/natehorst240-sketch/ihc-fleet-dashboard/main/data/Due-List_BIG_WEEKLY_aw109sp.csv',
    hours: 'https://raw.githubusercontent.com/natehorst240-sketch/ihc-fleet-dashboard/main/data/flight_hours_history.json',
  },
  '407': {
    due:   'https://raw.githubusercontent.com/natehorst240-sketch/407-Fleet-Tracker/main/data/407_Due-List_weekly.csv',
    hours: 'https://raw.githubusercontent.com/natehorst240-sketch/407-Fleet-Tracker/main/data/flight_hours_history.json',
  },
};

// ─── Fleet-specific phase interval definitions ──────────────────────────────────

const FLEET_PHASES = {
  '109SP': [
    { key: '50',  label: '50 HR',  intervalHours: 50 },
    { key: '100', label: '100 HR', intervalHours: 100 },
    { key: '200', label: '200 HR', intervalHours: 200 },
    { key: '400', label: '400 HR', intervalHours: 400 },
    { key: '800', label: '800 HR', intervalHours: 800 },
  ],
  '407': [
    { key: '300AF',  label: '300/12M\nAirframe', intervalHours: 300, equipment: 'Airframe' },
    { key: '300ENG', label: '300/12M\nEngine',   intervalHours: 300, equipment: 'Engine' },
    { key: '600ENG', label: '600/12M\nEngine',   intervalHours: 600, equipment: 'Engine' },
  ],
};

function phaseMatch(item, phase) {
  const hrsMatch = Math.round(item.intervalHours) === phase.intervalHours;
  if (!phase.equipment) return hrsMatch;
  const eq = item.trackedByEquipment?.toLowerCase() ?? '';
  return hrsMatch && eq.includes(phase.equipment.toLowerCase());
}

// ─── Color coding ───────────────────────────────────────────────────────────────

function phaseColor(hrs) {
  if (hrs == null) return null;
  if (hrs < 0)  return { bg: '#7f1d1d', text: '#fca5a5' };
  if (hrs < 25) return { bg: '#991b1b', text: '#fca5a5' };
  if (hrs < 50) return { bg: '#78350f', text: '#fcd34d' };
  return        { bg: '#14532d', text: '#86efac' };
}

// ─── Phase grid builder ─────────────────────────────────────────────────────────

function buildPhaseGrid(items, phases) {
  const byTail = {};
  items.forEach(item => {
    const tail = item.registrationNumber;
    if (!tail) return;
    phases.forEach(phase => {
      if (!phaseMatch(item, phase)) return;
      if (!byTail[tail]) byTail[tail] = { tail, airframeHours: 0, phases: {} };
      const existing = byTail[tail].phases[phase.key];
      if (!existing || item.remainingHours < existing.remainingHours) {
        byTail[tail].phases[phase.key] = item;
      }
      if (item.airframeHours > byTail[tail].airframeHours) {
        byTail[tail].airframeHours = item.airframeHours;
      }
    });
  });

  return Object.values(byTail).sort((a, b) => {
    const aMin = Math.min(...Object.values(a.phases).map(p => p.remainingHours), Infinity);
    const bMin = Math.min(...Object.values(b.phases).map(p => p.remainingHours), Infinity);
    return aMin - bMin;
  });
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function Inspections() {
  const [fleet, setFleet]           = useState('109SP');
  const [barPhaseKey, setBarPhaseKey] = useState(null);

  const { items: items109, loading: l109 } = useDueList(FLEET_URLS['109SP'].due);
  const { items: items407, loading: l407 } = useDueList(FLEET_URLS['407'].due);
  const { weeklyData: weekly109, loading: lh109 } = useFlightHoursHistory(FLEET_URLS['109SP'].hours);
  const { weeklyData: weekly407, loading: lh407 } = useFlightHoursHistory(FLEET_URLS['407'].hours);

  const loading      = fleet === '407' ? l407   : l109;
  const hoursLoading = fleet === '407' ? lh407  : lh109;
  const items        = fleet === '407' ? items407 : items109;
  const weeklyData   = fleet === '407' ? weekly407 : weekly109;
  const phases       = FLEET_PHASES[fleet];

  // Default bar to first phase when fleet changes
  const activeBarKey = barPhaseKey && phases.find(p => p.key === barPhaseKey)
    ? barPhaseKey
    : phases[0]?.key;

  const phaseGrid = useMemo(() => buildPhaseGrid(items, phases), [items, phases]);

  const barData = useMemo(() => {
    const phase = phases.find(p => p.key === activeBarKey);
    if (!phase) return [];
    return phaseGrid
      .map(row => ({ tail: row.tail, hrs: row.phases[phase.key]?.remainingHours ?? null }))
      .filter(d => d.hrs !== null)
      .sort((a, b) => a.hrs - b.hrs);
  }, [phaseGrid, phases, activeBarKey]);

  const criticalItems = useMemo(() =>
    phaseGrid.flatMap(row =>
      phases
        .filter(p => row.phases[p.key] && row.phases[p.key].remainingHours < 25)
        .map(p => ({ tail: row.tail, phase: p, item: row.phases[p.key] }))
    ).sort((a, b) => a.item.remainingHours - b.item.remainingHours),
  [phaseGrid, phases]);

  return (
    <div className="p-6 text-neutral-100 bg-neutral-950 min-h-full space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Wrench size={20} className="text-orange-400" />
          <div>
            <h1 className="text-lg font-semibold leading-tight">Phase Inspections</h1>
            <p className="text-[11px] text-neutral-500">
              {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {['109SP', '407'].map(f => (
            <button key={f} onClick={() => { setFleet(f); setBarPhaseKey(null); }}
              className={`px-3 py-1.5 rounded-md text-xs border transition-colors ${
                fleet === f
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-neutral-500">Loading due list…</div>
      ) : (
        <>
          {/* Critical alerts strip */}
          {criticalItems.length > 0 && (
            <div className="rounded-lg border border-red-900/60 bg-red-950/30 p-4">
              <div className="flex items-center gap-2 mb-3 text-red-400">
                <AlertTriangle size={14} />
                <span className="text-xs font-semibold uppercase tracking-widest">
                  {criticalItems.filter(c => c.item.remainingHours < 0).length} Overdue ·{' '}
                  {criticalItems.filter(c => c.item.remainingHours >= 0).length} Due &lt;25 hrs
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {criticalItems.map(({ tail, phase, item }) => {
                  const c = phaseColor(item.remainingHours);
                  return (
                    <div key={`${tail}-${phase.key}`}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs"
                      style={{ background: c.bg, color: c.text }}>
                      <span className="font-mono font-semibold">{tail}</span>
                      <span className="opacity-60">·</span>
                      <span>{phase.label.replace('\n', ' ')}</span>
                      <span className="font-semibold">
                        {item.remainingHours < 0
                          ? `${Math.abs(item.remainingHours).toFixed(1)} OVER`
                          : `${item.remainingHours.toFixed(1)} rem`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Phase inspection grid */}
          <div className="rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800">
              <h2 className="text-sm font-semibold">Scheduled Phase Inspections — Hours Remaining</h2>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Soonest due item per aircraft · red &lt;25 hr · amber &lt;50 hr · green ≥50 hr
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800">
                    <th className="text-left py-2.5 px-4 text-neutral-500 font-medium mono text-[10px] uppercase tracking-widest">
                      Aircraft
                    </th>
                    <th className="text-right py-2.5 px-3 text-neutral-500 font-medium mono text-[10px] uppercase tracking-widest">
                      TT
                    </th>
                    {phases.map(p => (
                      <th key={p.key} className="text-center py-2 px-2 text-neutral-500 font-medium mono text-[10px] uppercase tracking-widest leading-tight">
                        {p.label.split('\n').map((line, i) => (
                          <span key={i} className="block">{line}</span>
                        ))}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {phaseGrid.map(row => (
                    <tr key={row.tail} className="border-b border-neutral-800/50 last:border-0 hover:bg-neutral-800/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <span className="font-mono font-semibold text-orange-300">{row.tail}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-500 tabular-nums text-[11px]">
                        {row.airframeHours.toFixed(1)}
                      </td>
                      {phases.map(p => {
                        const phase = row.phases[p.key];
                        if (!phase) return (
                          <td key={p.key} className="py-2.5 px-2 text-center text-neutral-700">—</td>
                        );
                        const c = phaseColor(phase.remainingHours);
                        return (
                          <td key={p.key} className="py-2 px-2 text-center"
                            title={`${phase.description}\nDue: ${phase.nextDueDate}`}>
                            <span className="inline-block px-2 py-1 rounded font-semibold tabular-nums text-[11px]"
                              style={{ background: c.bg, color: c.text, minWidth: 52 }}>
                              {phase.remainingHours < 0
                                ? `−${Math.abs(phase.remainingHours).toFixed(1)}`
                                : phase.remainingHours.toFixed(1)}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {phaseGrid.length === 0 && (
                    <tr>
                      <td colSpan={phases.length + 2} className="py-10 text-center text-neutral-600 text-sm">
                        No phase inspection data found for {fleet}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar chart */}
          <div className="rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-semibold">
                  {phases.find(p => p.key === activeBarKey)?.label.replace('\n', ' ')} — Hours Remaining per Aircraft
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">Sorted soonest due first</p>
              </div>
              <div className="flex gap-1 flex-wrap">
                {phases.map(p => (
                  <button key={p.key} onClick={() => setBarPhaseKey(p.key)}
                    className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                      activeBarKey === p.key
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                    }`}>
                    {p.label.replace('\n', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              {barData.length === 0
                ? <p className="text-sm text-neutral-600 text-center py-6">No data for this interval</p>
                : <HoursBarChart data={barData} />
              }
            </div>
          </div>

          {/* Weekly flight hours */}
          {!hoursLoading && weeklyData.length > 0 && (
            <div className="rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-800">
                <h2 className="text-sm font-semibold">Weekly Flight Hours</h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Fleet-wide hours by week — drives inspection interval burn rate
                </p>
              </div>
              <div className="p-4">
                <WeeklyHoursChart data={weeklyData} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Bar chart ──────────────────────────────────────────────────────────────────

function HoursBarChart({ data }) {
  const maxHrs = Math.max(...data.map(d => Math.max(0, d.hrs)), 1);

  return (
    <div className="space-y-2">
      {data.map(({ tail, hrs }) => {
        const c = phaseColor(hrs);
        const pct = hrs <= 0 ? 2 : Math.min(100, (hrs / maxHrs) * 100);
        return (
          <div key={tail} className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-orange-300 w-20 shrink-0">{tail}</span>
            <div className="flex-1 h-7 bg-neutral-950 rounded overflow-hidden relative">
              <div className="h-full rounded" style={{ width: `${pct}%`, background: c.bg }} />
              <span className="absolute inset-0 flex items-center px-2 text-[11px] font-semibold"
                style={{ color: c.text }}>
                {hrs < 0
                  ? `${Math.abs(hrs).toFixed(1)} OVERDUE`
                  : `${hrs.toFixed(1)} hrs`}
              </span>
            </div>
          </div>
        );
      })}
      <div className="flex justify-between mt-1 text-[9px] text-neutral-700">
        <span>0</span>
        <span>{Math.round(maxHrs / 2)} hrs</span>
        <span>{Math.round(maxHrs)} hrs</span>
      </div>
    </div>
  );
}

// ─── Weekly hours sparkline ─────────────────────────────────────────────────────

function WeeklyHoursChart({ data }) {
  const visible = data.slice(-16);
  const maxVal  = Math.max(...visible.map(d => d.total), 1);

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 80 }}>
        {visible.map(w => (
          <div key={w.weekStart} className="flex-1 rounded-t"
            style={{ height: `${(w.total / maxVal) * 100}%`, background: '#3b82f6', opacity: 0.8 }}
            title={`Week of ${w.weekStart}: ${w.total.toFixed(1)}h`} />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-neutral-700">
        {[0, Math.floor(visible.length / 2), visible.length - 1].map(i =>
          visible[i] ? (
            <span key={i}>
              {new Date(visible[i].weekStart + 'T00:00:00Z')
                .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
            </span>
          ) : null
        )}
      </div>
    </div>
  );
}
