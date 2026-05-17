import React, { useMemo, useState } from 'react';
import { BarChart3, Plane, AlertTriangle, Activity, TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useFleet } from '../contexts/FleetDataContext';
import { useCurrentUser } from '../hooks/useCurrentUser';

const STATUS_COLORS = {
  IN_SERVICE:  '#22c55e',
  MAINTENANCE: '#eab308',
  AOG:         '#ef4444',
  SPARE:       '#a3a3a3',
  UNKNOWN:     '#525252'
};

const REQ_STATUS_COLORS = {
  Submitted: '#f97316',
  Approved:  '#22c55e',
  Denied:    '#ef4444',
  Escalated: '#a855f7',
  Returned:  '#eab308'
};

export default function Dashboard() {
  const { aircraft: allAircraft, mxRequests: allRequests, conflicts, scheduleEvents, fleetPositions, loading } = useFleet();
  const { persona } = useCurrentUser();

  const defaultRegion = (persona?.role === 'RMM') && persona?.region && persona.region !== 'ALL'
    ? persona.region : 'ALL';
  const [regionFilter, setRegionFilter] = useState(defaultRegion);

  const regions = useMemo(() => ['ALL', ...[...new Set(allAircraft.map(a => a.region).filter(Boolean))].sort()], [allAircraft]);

  const aircraft  = regionFilter === 'ALL' ? allAircraft   : allAircraft.filter(a => a.region === regionFilter);
  const mxRequests = regionFilter === 'ALL' ? allRequests  : allRequests.filter(r => {
    const ac = allAircraft.find(a => a.tail === r.aircraftTail);
    return ac?.region === regionFilter;
  });

  const stats = useMemo(() => {
    const byStatus = aircraft.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] ?? 0) + 1;
      return acc;
    }, {});
    const byRegion = aircraft.reduce((acc, a) => {
      const r = a.region ?? 'Unassigned';
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {});
    const byReqStatus = mxRequests.reduce((acc, r) => {
      const s = r.status ?? 'Submitted';
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});
    const byReqType = mxRequests.reduce((acc, r) => {
      const t = r.type ?? 'Other';
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});

    const inFlight = fleetPositions.filter(p => p.inFlight === true || p.inFlightLabel === 'Yes').length;
    const aog = byStatus.AOG ?? 0;
    const inService = byStatus.IN_SERVICE ?? 0;
    const availability = aircraft.length > 0
      ? Math.round((inService / aircraft.length) * 100)
      : 0;

    const pending = (byReqStatus.Submitted ?? 0) + (byReqStatus.Escalated ?? 0);
    const decided = (byReqStatus.Approved ?? 0) + (byReqStatus.Denied ?? 0);
    const approvalRate = decided > 0
      ? Math.round(((byReqStatus.Approved ?? 0) / decided) * 100)
      : 0;

    return {
      byStatus, byRegion, byReqStatus, byReqType,
      inFlight, aog, inService, availability,
      pending, decided, approvalRate,
      totalAircraft: aircraft.length,
      totalRequests: mxRequests.length,
      activeConflicts: conflicts.length,
      criticalConflicts: conflicts.filter(c => c.severity === 'critical').length,
      scheduledEvents: scheduleEvents.length
    };
  }, [aircraft, mxRequests, conflicts, scheduleEvents, fleetPositions]);

  if (loading) {
    return <div className="p-8 text-neutral-400 text-sm">Loading executive dashboard…</div>;
  }

  return (
    <div className="p-8 text-neutral-100 bg-neutral-950 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 size={22} className="text-orange-400" />
            <h1 className="text-xl sm:text-2xl font-semibold">Fleet Operations Dashboard</h1>
          </div>
          <p className="text-xs text-neutral-500">
            {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            {regionFilter !== 'ALL' && <span className="text-orange-400 ml-2">· {regionFilter} region</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {regions.slice(0, 10).map(r => (
            <button key={r} onClick={() => setRegionFilter(r)}
              className={`px-2.5 py-1 rounded-md text-xs border transition-colors ${
                regionFilter === r
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700'
              }`}>
              {r === 'ALL' ? 'All regions' : r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <Kpi
          icon={Plane}
          label="Fleet Availability"
          value={`${stats.availability}%`}
          sub={`${stats.inService} of ${stats.totalAircraft} aircraft`}
          accent={stats.availability >= 85 ? '#22c55e' : stats.availability >= 70 ? '#eab308' : '#ef4444'}
        />
        <Kpi
          icon={AlertTriangle}
          label="AOG Aircraft"
          value={stats.aog}
          sub={stats.aog === 0 ? 'All flying' : 'Coverage required'}
          accent={stats.aog === 0 ? '#22c55e' : '#ef4444'}
        />
        <Kpi
          icon={Activity}
          label="In Flight Now"
          value={stats.inFlight}
          sub={`${stats.scheduledEvents} scheduled today+`}
          accent="#3b82f6"
        />
        <Kpi
          icon={Clock}
          label="Pending Requests"
          value={stats.pending}
          sub={`${stats.decided} decided this cycle`}
          accent={stats.pending > 5 ? '#eab308' : '#a3a3a3'}
        />
        <Kpi
          icon={CheckCircle2}
          label="Approval Rate"
          value={stats.decided > 0 ? `${stats.approvalRate}%` : '—'}
          sub={`${stats.decided} decisions`}
          accent="#22c55e"
        />
        <Kpi
          icon={XCircle}
          label="Active Conflicts"
          value={stats.activeConflicts}
          sub={`${stats.criticalConflicts} critical`}
          accent={stats.criticalConflicts > 0 ? '#ef4444' : stats.activeConflicts > 0 ? '#eab308' : '#22c55e'}
        />
      </div>

      {/* Main charts row */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        {/* Fleet status donut */}
        <Panel title="Fleet Status" subtitle={`${stats.totalAircraft} total aircraft`} cols={5}>
          <Donut
            segments={Object.entries(stats.byStatus).map(([k, v]) => ({
              label: k.replace('_', ' '),
              value: v,
              color: STATUS_COLORS[k] ?? STATUS_COLORS.UNKNOWN
            }))}
            total={stats.totalAircraft}
            centerLabel="Fleet"
          />
        </Panel>

        {/* Regional breakdown bars */}
        <Panel title="Aircraft by Region" subtitle="Distribution across IHC footprint" cols={7}>
          <HorizontalBars
            data={Object.entries(stats.byRegion)
              .sort(([, a], [, b]) => b - a)
              .map(([k, v]) => ({ label: k, value: v }))}
            color="#3b82f6"
            total={stats.totalAircraft}
          />
        </Panel>
      </div>

      {/* MX Request analytics row */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <Panel title="MX Requests by Status" subtitle={`${stats.totalRequests} total submitted`} cols={6}>
          <StackedBar
            data={Object.entries(stats.byReqStatus).map(([k, v]) => ({
              label: k,
              value: v,
              color: REQ_STATUS_COLORS[k] ?? '#525252'
            }))}
            total={stats.totalRequests}
          />
        </Panel>

        <Panel title="MX Requests by Type" subtitle="What's being submitted" cols={6}>
          <HorizontalBars
            data={Object.entries(stats.byReqType)
              .sort(([, a], [, b]) => b - a)
              .map(([k, v]) => ({ label: k, value: v }))}
            color="#f97316"
            total={stats.totalRequests}
          />
        </Panel>
      </div>

      {/* Audit feed */}
      <Panel title="Recent Activity" subtitle="Last decisions and submissions" cols={12}>
        <AuditFeed requests={mxRequests} />
      </Panel>

      <div className="mt-6 text-xs text-neutral-500 italic">
        Phase 3 production replaces this React preview with a Power BI report sourced from the
        same Dataverse model. Replace each visual here with its DAX equivalent per
        <code className="text-neutral-400 mx-1">m365-solution/Phase3/powerbi-spec.md</code>.
      </div>
    </div>
  );
}

// ─── Layout helpers ────────────────────────────────────────────────

function Kpi({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} style={{ color: accent }} />
        <span className="mono text-[10px] text-neutral-500 uppercase tracking-widest">{label}</span>
      </div>
      <div className="text-3xl font-semibold" style={{ color: accent }}>{value}</div>
      <div className="text-xs text-neutral-500 mt-1">{sub}</div>
    </div>
  );
}

function Panel({ title, subtitle, children, cols = 12 }) {
  return (
    <div className={`col-span-${cols} rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden`}
         style={{ gridColumn: `span ${cols} / span ${cols}` }}>
      <div className="px-4 py-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Charts (SVG) ──────────────────────────────────────────────────

function Donut({ segments, total, centerLabel }) {
  const size = 200;
  const stroke = 32;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262626" strokeWidth={stroke} />
        {segments.map((s) => {
          const len = (s.value / total) * c;
          const dash = `${len} ${c - len}`;
          const seg = (
            <circle
              key={s.label}
              cx={size / 2} cy={size / 2} r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return seg;
        })}
        <text x={size / 2} y={size / 2 - 8} textAnchor="middle" fill="#e5e5e5" fontSize="28" fontWeight="600" transform={`rotate(90 ${size / 2} ${size / 2})`}>
          {total}
        </text>
        <text x={size / 2} y={size / 2 + 18} textAnchor="middle" fill="#737373" fontSize="11" textTransform="uppercase" transform={`rotate(90 ${size / 2} ${size / 2})`}>
          {centerLabel}
        </text>
      </svg>
      <div className="flex-1 space-y-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-3 h-3 rounded shrink-0" style={{ background: s.color }} />
            <span className="text-xs text-neutral-300 flex-1">{s.label}</span>
            <span className="text-sm font-semibold">{s.value}</span>
            <span className="text-xs text-neutral-500 w-10 text-right">
              {Math.round((s.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBars({ data, color, total }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-xs text-neutral-300 w-28 truncate" title={d.label}>{d.label}</span>
          <div className="flex-1 h-6 bg-neutral-950 rounded overflow-hidden">
            <div
              className="h-full rounded"
              style={{ width: `${(d.value / max) * 100}%`, background: color }}
            />
          </div>
          <span className="text-xs font-semibold w-8 text-right">{d.value}</span>
          <span className="text-[10px] text-neutral-500 w-10 text-right">
            {Math.round((d.value / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function StackedBar({ data, total }) {
  return (
    <div>
      <div className="flex h-10 rounded overflow-hidden border border-neutral-800 mb-3">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-center text-xs font-semibold text-white"
            style={{ width: `${(d.value / total) * 100}%`, background: d.color, minWidth: d.value > 0 ? 30 : 0 }}
            title={`${d.label}: ${d.value}`}
          >
            {d.value > 0 && d.value}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: d.color }} />
            <span className="text-xs text-neutral-300 flex-1">{d.label}</span>
            <span className="text-xs font-semibold">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AuditFeed({ requests }) {
  const recent = [...requests]
    .filter((r) => r.requestNumber)
    .sort((a, b) => {
      const at = a.decidedAt ?? a.windowStart ?? '';
      const bt = b.decidedAt ?? b.windowStart ?? '';
      return bt.localeCompare(at);
    })
    .slice(0, 8);

  if (recent.length === 0) {
    return <div className="text-sm text-neutral-500 text-center py-6">No activity yet</div>;
  }

  return (
    <div className="space-y-2">
      {recent.map((r) => {
        const color = REQ_STATUS_COLORS[r.status] ?? '#525252';
        return (
          <div key={r.id} className="flex items-center gap-3 py-2 border-b border-neutral-800/50 last:border-0">
            <div className="w-1 h-8 rounded-full shrink-0" style={{ background: color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-neutral-400">{r.requestNumber}</span>
                <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ background: `${color}20`, color }}>
                  {r.status}
                </span>
                {r.priority && r.priority !== 'Normal' && (
                  <span className="text-xs px-1.5 py-0.5 rounded font-semibold bg-red-900/30 text-red-400">
                    {r.priority}
                  </span>
                )}
              </div>
              <div className="text-sm text-neutral-200 truncate">
                {r.aircraftTail} · {r.type} · {r.requestedBy}
              </div>
            </div>
            <div className="text-xs text-neutral-500 shrink-0 text-right">
              {r.decidedAt
                ? new Date(r.decidedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Pending'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
