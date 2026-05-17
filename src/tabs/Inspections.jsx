import React, { useState, useRef } from 'react';
import { Wrench, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useDueList } from '../hooks/useDueList';
import { useFlightHoursHistory } from '../hooks/useFlightHoursHistory';

// ─── Layout helpers (copied from Dashboard.jsx pattern) ────────────────────────

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
    <div
      className={`col-span-${cols} rounded-lg bg-neutral-900 border border-neutral-800 overflow-hidden`}
      style={{ gridColumn: `span ${cols} / span ${cols}` }}
    >
      <div className="px-4 py-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold">{title}</h2>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Bar color helpers ──────────────────────────────────────────────────────────

function dueDayColor(days) {
  if (days < 0) return '#7f1d1d';      // dark-red — overdue
  if (days < 14) return '#ef4444';     // red — due within 14 days
  if (days <= 30) return '#f59e0b';    // amber — due within 15–30 days
  return '#22c55e';                    // green — ok
}

function statusColor(status) {
  const s = (status ?? '').toLowerCase();
  if (s === 'overdue') return { bg: '#ef4444', text: '#fff' };
  if (s.includes('soon')) return { bg: '#f59e0b', text: '#000' };
  return { bg: '#22c55e', text: '#000' };
}

// ─── Next Due by Aircraft — vertical bar chart ─────────────────────────────────

const DISPLAY_CAP = 180; // max positive days to display

function NextDueChart({ data }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, item }
  const svgRef = useRef(null);

  if (!data || data.length === 0) {
    return <div className="text-xs text-neutral-500 text-center py-8">No data</div>;
  }

  const chartW = 340;
  const chartH = 200;
  const padLeft = 36;
  const padRight = 8;
  const padTop = 12;
  const padBottom = 40;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  // We map remainingDays to bar height.
  // Negative = overdue → bar grows downward from baseline.
  // Positive (capped at DISPLAY_CAP) → bar grows upward.
  const baseline = plotH; // y-pixel of "0 days" line within plot area

  // Determine y-extent: positives go up, negatives go down
  const maxPos = Math.min(DISPLAY_CAP, Math.max(...data.map(d => d.remainingDays), 1));
  const minNeg = Math.min(...data.map(d => d.remainingDays), 0);

  // Total vertical range in days
  const totalRange = maxPos + Math.abs(minNeg);

  // pixels per day (positive portion = plotH * maxPos/totalRange, negative portion = plotH * |minNeg|/totalRange)
  const pixPerDay = plotH / (totalRange || 1);
  const zeroY = padTop + pixPerDay * Math.abs(minNeg); // y-pixel of zero line

  const barW = Math.max(8, Math.min(30, (plotW / data.length) - 4));
  const barStep = plotW / data.length;

  // Y-axis reference lines (days)
  const refLines = [0];
  if (maxPos >= 30) refLines.push(30);
  if (maxPos >= 60) refLines.push(60);
  if (maxPos >= 90) refLines.push(90);
  if (maxPos >= 180) refLines.push(180);
  if (minNeg < 0) refLines.push(minNeg < -30 ? -30 : minNeg);

  function handleMouseMove(e, item) {
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top - 10,
      item,
    });
  }

  return (
    <div className="relative select-none">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${chartW} ${chartH}`}
        width="100%"
        style={{ overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Y-axis reference lines */}
        {refLines.map(d => {
          const yPx = zeroY - d * pixPerDay;
          if (yPx < padTop - 2 || yPx > padTop + plotH + 2) return null;
          return (
            <g key={d}>
              <line
                x1={padLeft} y1={yPx} x2={chartW - padRight} y2={yPx}
                stroke={d === 0 ? '#525252' : '#262626'}
                strokeWidth={d === 0 ? 1.5 : 1}
                strokeDasharray={d === 0 ? undefined : '3 3'}
              />
              <text x={padLeft - 4} y={yPx + 4} textAnchor="end" fill="#737373" fontSize="8">
                {d}d
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, i) => {
          const days = item.remainingDays;
          const cappedDays = Math.max(-9999, Math.min(DISPLAY_CAP, days));
          const barHeight = Math.abs(cappedDays) * pixPerDay;
          const barX = padLeft + i * barStep + (barStep - barW) / 2;
          const barY = days >= 0 ? zeroY - barHeight : zeroY;
          const color = dueDayColor(days);

          return (
            <g key={item.registrationNumber}>
              <rect
                x={barX} y={barY}
                width={barW} height={Math.max(2, barHeight)}
                fill={color}
                rx={2}
                style={{ cursor: 'pointer' }}
                onMouseMove={e => handleMouseMove(e, item)}
                onMouseLeave={() => setTooltip(null)}
              />
              {/* Tail label */}
              <text
                x={barX + barW / 2}
                y={padTop + plotH + padBottom - 4}
                textAnchor="middle"
                fill="#a3a3a3"
                fontSize="7"
                transform={`rotate(-45, ${barX + barW / 2}, ${padTop + plotH + 12})`}
              >
                {item.registrationNumber.replace(/^N/, '')}
              </text>
            </g>
          );
        })}

        {/* Zero line on top of bars */}
        <line
          x1={padLeft} y1={zeroY} x2={chartW - padRight} y2={zeroY}
          stroke="#525252" strokeWidth={1.5}
        />
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs shadow-xl max-w-[200px]"
          style={{ left: tooltip.x + 8, top: tooltip.y - 60 }}
        >
          <div className="font-semibold text-neutral-100 mb-1">{tooltip.item.registrationNumber}</div>
          <div className="text-neutral-400 mb-1 leading-snug">{tooltip.item.description}</div>
          <div className="flex gap-3">
            <span style={{ color: dueDayColor(tooltip.item.remainingDays) }}>
              {tooltip.item.remainingDays < 0
                ? `${Math.abs(tooltip.item.remainingDays)}d overdue`
                : `${tooltip.item.remainingDays}d remaining`}
            </span>
          </div>
          {tooltip.item.remainingHours !== 0 && (
            <div className="text-neutral-500 mt-0.5">{tooltip.item.remainingHours.toFixed(1)} hrs</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Fleet Flight Hours — vertical bar chart ────────────────────────────────────

function FlightHoursChart({ dailyData, weeklyData }) {
  const [view, setView] = useState('daily');
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const rawData = view === 'daily'
    ? dailyData.slice(-30)
    : weeklyData;

  const chartW = 480;
  const chartH = 220;
  const padLeft = 42;
  const padRight = 8;
  const padTop = 12;
  const padBottom = 48;
  const plotW = chartW - padLeft - padRight;
  const plotH = chartH - padTop - padBottom;

  const maxVal = Math.max(...rawData.map(d => d.total), 1);
  // Round up to a nice number
  const yMax = Math.ceil(maxVal / 10) * 10 || 10;

  // Y reference lines
  const refCount = 4;
  const refLines = Array.from({ length: refCount + 1 }, (_, i) => Math.round((yMax / refCount) * i));

  const barStep = plotW / (rawData.length || 1);
  const barW = Math.max(4, Math.min(28, barStep - 3));

  function getLabel(d) {
    if (view === 'daily') {
      const dt = new Date(d.date + 'T00:00:00Z');
      return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
    }
    const dt = new Date(d.weekStart + 'T00:00:00Z');
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  }

  function handleMouseMove(e, d) {
    const rect = svgRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      d,
    });
  }

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1.5 mb-3">
        {['daily', 'weekly'].map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
              view === v
                ? 'bg-orange-500/15 border-orange-500/40 text-orange-400'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            {v === 'daily' ? 'Daily (last 30 days)' : 'Weekly'}
          </button>
        ))}
      </div>

      <div className="relative select-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${chartW} ${chartH}`}
          width="100%"
          style={{ overflow: 'visible' }}
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Y reference lines */}
          {refLines.map(val => {
            const yPx = padTop + plotH - (val / yMax) * plotH;
            return (
              <g key={val}>
                <line
                  x1={padLeft} y1={yPx} x2={chartW - padRight} y2={yPx}
                  stroke={val === 0 ? '#525252' : '#262626'}
                  strokeWidth={val === 0 ? 1.5 : 1}
                  strokeDasharray={val === 0 ? undefined : '3 3'}
                />
                <text x={padLeft - 4} y={yPx + 4} textAnchor="end" fill="#737373" fontSize="8">
                  {val}h
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {rawData.map((d, i) => {
            const barH = Math.max(2, (d.total / yMax) * plotH);
            const barX = padLeft + i * barStep + (barStep - barW) / 2;
            const barY = padTop + plotH - barH;

            // Determine label frequency to avoid clutter
            const showLabel = rawData.length <= 15 || i % Math.ceil(rawData.length / 15) === 0;

            return (
              <g key={view === 'daily' ? d.date : d.weekStart}>
                <rect
                  x={barX} y={barY}
                  width={barW} height={barH}
                  fill="#3b82f6"
                  rx={2}
                  style={{ cursor: 'pointer', opacity: 0.85 }}
                  onMouseMove={e => handleMouseMove(e, d)}
                  onMouseLeave={() => setTooltip(null)}
                />
                {showLabel && (
                  <text
                    x={barX + barW / 2}
                    y={padTop + plotH + 14}
                    textAnchor="end"
                    fill="#737373"
                    fontSize="7"
                    transform={`rotate(-45, ${barX + barW / 2}, ${padTop + plotH + 14})`}
                  >
                    {getLabel(d)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={padLeft} y1={padTop + plotH} x2={chartW - padRight} y2={padTop + plotH}
            stroke="#525252" strokeWidth={1.5}
          />
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-800 text-xs shadow-xl"
            style={{ left: tooltip.x + 8, top: tooltip.y - 70 }}
          >
            <div className="font-semibold text-neutral-100 mb-1">
              {view === 'daily' ? tooltip.d.date : `Week of ${tooltip.d.weekStart}`}
            </div>
            <div className="text-blue-400">{tooltip.d.total.toFixed(1)} fleet hrs</div>
            <div className="text-neutral-500 mt-0.5">Avg {tooltip.d.avg.toFixed(1)} hrs/tail</div>
            {view === 'daily' && (
              <div className="text-neutral-500">{tooltip.d.activeTails} active tail{tooltip.d.activeTails !== 1 ? 's' : ''}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Due List Table ─────────────────────────────────────────────────────────────

function DueListTable({ items }) {
  const sorted = [...items].sort((a, b) => a.remainingDays - b.remainingDays).slice(0, 30);

  function rowBg(item) {
    if (item.remainingDays < 0) return 'bg-red-500/10';
    if (item.remainingDays <= 14) return 'bg-amber-500/10';
    return '';
  }

  function daysBadge(days) {
    if (days < 0) return <span className="text-red-400 font-semibold">{days}d (overdue)</span>;
    if (days <= 14) return <span className="text-amber-400 font-semibold">{days}d</span>;
    return <span className="text-neutral-300">{days}d</span>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-neutral-800">
            {['Tail', 'Description', 'ATA', 'Next Due Date', 'Days Remaining', 'Hours Remaining', 'Status'].map(col => (
              <th key={col} className="text-left py-2 px-3 mono text-[10px] uppercase tracking-widest text-neutral-500 font-medium whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((item, idx) => {
            const sc = statusColor(item.nextDueStatus);
            return (
              <tr
                key={`${item.registrationNumber}-${item.ataAndCode}-${idx}`}
                className={`border-b border-neutral-800/50 last:border-0 ${rowBg(item)}`}
              >
                <td className="py-2 px-3 font-mono font-semibold text-neutral-200 whitespace-nowrap">
                  {item.registrationNumber}
                </td>
                <td className="py-2 px-3 text-neutral-300 max-w-[240px] truncate" title={item.description}>
                  {item.description}
                </td>
                <td className="py-2 px-3 mono text-neutral-500 whitespace-nowrap">
                  {item.ataAndCode}
                </td>
                <td className="py-2 px-3 text-neutral-300 whitespace-nowrap">
                  {item.nextDueDate}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  {daysBadge(item.remainingDays)}
                </td>
                <td className="py-2 px-3 text-neutral-400 whitespace-nowrap">
                  {item.remainingHours !== 0 ? `${item.remainingHours.toFixed(1)} hrs` : '—'}
                </td>
                <td className="py-2 px-3 whitespace-nowrap">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{ background: `${sc.bg}25`, color: sc.bg, border: `1px solid ${sc.bg}50` }}
                  >
                    {item.nextDueStatus || 'OK'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Inspections tab ───────────────────────────────────────────────────────

export default function Inspections() {
  const { items, nextDueByAircraft, loading: dueLoading, error: dueError } = useDueList();
  const { dailyData, weeklyData, loading: hoursLoading, error: hoursError } = useFlightHoursHistory();

  if (dueLoading || hoursLoading) {
    return <div className="p-8 text-neutral-400 text-sm">Loading…</div>;
  }

  if (dueError || hoursError) {
    return (
      <div className="p-8 text-red-400 text-sm">
        Error loading data: {dueError || hoursError}
      </div>
    );
  }

  // KPI calculations
  const total = items.length;
  const dueSoon14 = items.filter(i => i.remainingDays >= 0 && i.remainingDays <= 14).length;
  const dueSoon30 = items.filter(i => i.remainingDays > 14 && i.remainingDays <= 30).length;
  const overdue = items.filter(i => i.remainingDays < 0).length;

  return (
    <div className="p-8 text-neutral-100 bg-neutral-950 min-h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Wrench size={22} className="text-orange-400" />
            <h1 className="text-xl sm:text-2xl font-semibold">109SP Inspections</h1>
          </div>
          <p className="text-xs text-neutral-500">
            {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            <span className="text-neutral-600 ml-2">· AW109SP Due List</span>
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Kpi
          icon={CheckCircle2}
          label="Total Items"
          value={total}
          sub="Non-optional inspection tasks"
          accent="#a3a3a3"
        />
        <Kpi
          icon={AlertTriangle}
          label="Due ≤ 14 Days"
          value={dueSoon14}
          sub="Immediate attention needed"
          accent={dueSoon14 > 0 ? '#ef4444' : '#22c55e'}
        />
        <Kpi
          icon={Clock}
          label="Due 15–30 Days"
          value={dueSoon30}
          sub="Plan ahead"
          accent={dueSoon30 > 0 ? '#f59e0b' : '#22c55e'}
        />
        <Kpi
          icon={XCircle}
          label="Overdue"
          value={overdue}
          sub={overdue === 0 ? 'All current' : 'Past due date'}
          accent={overdue > 0 ? '#ef4444' : '#22c55e'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <Panel
          title="Next Due by Aircraft"
          subtitle="Soonest upcoming inspection per tail — capped at 180 days"
          cols={5}
        >
          <NextDueChart data={nextDueByAircraft} />
        </Panel>

        <Panel
          title="Fleet Flight Hours"
          subtitle="Cumulative hours flown across all tails"
          cols={7}
        >
          <FlightHoursChart dailyData={dailyData} weeklyData={weeklyData} />
        </Panel>
      </div>

      {/* Due List table */}
      <Panel
        title="Inspection Due List"
        subtitle={`Top 30 items sorted by days remaining · overdue first`}
        cols={12}
      >
        {items.length === 0
          ? <div className="text-sm text-neutral-500 text-center py-6">No items loaded</div>
          : <DueListTable items={items} />
        }
      </Panel>
    </div>
  );
}
