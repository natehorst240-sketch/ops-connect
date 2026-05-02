import React, { useState } from 'react';
import {
  RefreshCcw, Share2, Download, Filter, Bookmark, ChevronDown,
  Sparkles, Pin, Eye, BarChart3, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { FLUENT } from '../tokens';
import { AIRCRAFT } from '../../data';

// ============================================================================
// POWER BI REPORT — Director's home, but as a proper report
// ============================================================================

export default function PowerBIDashboard() {
  const [activePage, setActivePage] = useState('overview');

  return (
    <div style={{ background: '#f3f2f1', minHeight: '100%' }}>
      {/* Power BI Ribbon */}
      <Ribbon />

      {/* Page tabs */}
      <PageTabs activePage={activePage} setActivePage={setActivePage} />

      {/* Main report layout: canvas + right filter pane */}
      <div className="flex" style={{ height: 'calc(100% - 84px)' }}>
        <ReportCanvas />
        <FilterPane />
      </div>
    </div>
  );
}

function Ribbon() {
  return (
    <div
      className="flex items-center px-4"
      style={{
        height: 40,
        background: FLUENT.surface,
        borderBottom: `1px solid ${FLUENT.border}`,
        gap: 16,
      }}
    >
      <div className="flex items-center gap-2">
        <BarChart3 size={16} style={{ color: '#f2c811' }} />
        <span style={{ fontSize: 13, fontWeight: 600 }}>IHC Fleet Operations · Executive Report</span>
        <span style={{ fontSize: 11, color: FLUENT.textSub, marginLeft: 6 }}>
          Refreshed 14 min ago
        </span>
      </div>

      <div className="flex-1" />

      <RibbonButton Icon={RefreshCcw} label="Refresh" />
      <RibbonButton Icon={Filter} label="Filters" />
      <RibbonButton Icon={Bookmark} label="Bookmarks" />
      <RibbonButton Icon={Sparkles} label="Q&A" />
      <RibbonButton Icon={Pin} label="Pin to dashboard" />
      <RibbonButton Icon={Share2} label="Share" />
      <RibbonButton Icon={Download} label="Export" />
    </div>
  );
}

function RibbonButton({ Icon, label }) {
  return (
    <button
      className="flex items-center gap-1.5 px-2"
      style={{
        height: 28, background: 'transparent', border: 'none',
        fontSize: 12, color: FLUENT.text, cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = FLUENT.bgAlt}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}

function PageTabs({ activePage, setActivePage }) {
  const pages = [
    { id: 'overview', label: 'Fleet Overview' },
    { id: 'inspections', label: 'Inspections' },
    { id: 'utilization', label: 'Utilization' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'cost', label: 'Cost Analysis' },
  ];

  return (
    <div
      className="flex items-end px-4"
      style={{
        height: 40,
        background: FLUENT.bgAlt,
        borderBottom: `1px solid ${FLUENT.border}`,
        gap: 0,
      }}
    >
      {pages.map(p => {
        const active = p.id === activePage;
        return (
          <button
            key={p.id}
            onClick={() => setActivePage(p.id)}
            style={{
              padding: '8px 14px', height: 32,
              background: active ? FLUENT.surface : 'transparent',
              border: active ? `1px solid ${FLUENT.border}` : '1px solid transparent',
              borderBottom: active ? `1px solid ${FLUENT.surface}` : '1px solid transparent',
              fontSize: 12, fontWeight: active ? 600 : 400,
              color: active ? FLUENT.brand : FLUENT.text,
              cursor: 'pointer',
              marginBottom: -1,
              borderRadius: '2px 2px 0 0',
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

function ReportCanvas() {
  const inService = AIRCRAFT.filter(a => a.status === 'IN_SERVICE').length;
  const aog = AIRCRAFT.filter(a => a.status === 'AOG').length;
  const mx = AIRCRAFT.filter(a => a.status === 'MAINTENANCE').length;
  const utilization = Math.round((inService / AIRCRAFT.length) * 100);

  return (
    <div className="flex-1 overflow-auto p-4" style={{ background: '#f3f2f1' }}>
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(12, 1fr)', gridAutoRows: 'minmax(60px, auto)' }}>

        {/* Row 1: KPI cards */}
        <div className="col-span-3"><KpiCard label="Fleet Available" value={`${utilization}%`} sub={`${inService} of ${AIRCRAFT.length}`} trend="up" trendValue="+2.4%" color={FLUENT.good} /></div>
        <div className="col-span-3"><KpiCard label="AOG Count" value={aog} sub="1 critical" trend="flat" trendValue="0 this wk" color={FLUENT.bad} pulse /></div>
        <div className="col-span-3"><KpiCard label="In Maintenance" value={mx} sub="scheduled" trend="down" trendValue="-1 vs avg" color={FLUENT.warnAccent} /></div>
        <div className="col-span-3"><KpiCard label="MX Compliance" value="98.2%" sub="past 30 days" trend="up" trendValue="+0.8%" color={FLUENT.brand} /></div>

        {/* Row 2: Big visual cards */}
        <div className="col-span-7"><FleetByRegionCard /></div>
        <div className="col-span-5"><StatusDonutCard inService={inService} aog={aog} mx={mx} /></div>

        {/* Row 3 */}
        <div className="col-span-7"><AvailabilityTrendCard /></div>
        <div className="col-span-5"><InspectionsTableCard /></div>

        {/* Row 4 */}
        <div className="col-span-12"><RegionMatrixCard /></div>
      </div>

      <div className="mt-4 flex items-center gap-3" style={{ fontSize: 11, color: FLUENT.textSub }}>
        <span>Data sources: Veryon, CompleteFlight, SkyRouter, Dataverse</span>
        <span>·</span>
        <span>Refresh schedule: every 15 min</span>
        <span>·</span>
        <span>Owner: Ryan Taul (Asst Director)</span>
      </div>
    </div>
  );
}

// ----- Visual cards -----

function VisualCard({ title, subtitle, action, children }) {
  return (
    <div style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center px-3 py-2" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10, color: FLUENT.textSub, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {action || <ChevronDown size={12} style={{ color: FLUENT.textSub, cursor: 'pointer' }} />}
      </div>
      <div className="flex-1" style={{ padding: 12, minHeight: 0 }}>
        {children}
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, trend, trendValue, color, pulse }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  return (
    <div style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2, padding: 14, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color }} />
      <div style={{ fontSize: 11, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div style={{ fontSize: 32, fontWeight: 600, lineHeight: 1, color, animation: pulse ? 'none' : undefined }}>
          {value}
        </div>
        <div style={{ fontSize: 11, color: FLUENT.textSub }}>{sub}</div>
      </div>
      <div className="flex items-center gap-1 mt-2" style={{ fontSize: 11 }}>
        <TrendIcon size={11} style={{ color: trend === 'up' ? FLUENT.good : trend === 'down' ? FLUENT.warnAccent : FLUENT.textSub }} />
        <span style={{ color: trend === 'up' ? FLUENT.good : trend === 'down' ? FLUENT.warnAccent : FLUENT.textSub, fontWeight: 600 }}>{trendValue}</span>
        <span style={{ color: FLUENT.textSub }}>vs last period</span>
      </div>
    </div>
  );
}

function FleetByRegionCard() {
  const regions = ['109 UT', 'WY/MT', 'ID/NV', 'CO/NM', 'UT/AZ', 'PAGE', 'SLC FW', 'NC'];
  const data = regions.map(r => {
    const list = AIRCRAFT.filter(a => a.region === r);
    return { region: r, total: list.length, available: list.filter(a => a.status === 'IN_SERVICE').length };
  });
  const maxVal = Math.max(...data.map(d => d.total));

  return (
    <VisualCard title="Aircraft Available by Region" subtitle="Available / Total · Drill: Region → Base → Tail">
      <div className="h-full flex flex-col">
        <div className="flex-1 flex items-end gap-2 pb-4 pt-2">
          {data.map(d => {
            const totalH = (d.total / maxVal) * 100;
            const availH = (d.available / maxVal) * 100;
            return (
              <div key={d.region} className="flex-1 flex flex-col items-center justify-end" style={{ minWidth: 0 }}>
                <div style={{ fontSize: 10, color: FLUENT.textSub, marginBottom: 2 }}>{d.available}/{d.total}</div>
                <div className="w-full relative" style={{ height: '85%' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${totalH}%`, background: FLUENT.borderStrong, borderRadius: '2px 2px 0 0' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${availH}%`, background: FLUENT.brand, borderRadius: '2px 2px 0 0' }} />
                </div>
                <div style={{ fontSize: 10, color: FLUENT.text, marginTop: 4, fontWeight: 500 }}>{d.region}</div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4" style={{ fontSize: 10, color: FLUENT.textSub, paddingTop: 6, borderTop: `1px solid ${FLUENT.border}` }}>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, background: FLUENT.brand, borderRadius: 1 }} />
            Available
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, background: FLUENT.borderStrong, borderRadius: 1 }} />
            Total fleet
          </div>
        </div>
      </div>
    </VisualCard>
  );
}

function StatusDonutCard({ inService, aog, mx }) {
  const total = inService + aog + mx;
  const segments = [
    { label: 'In Service', value: inService, color: FLUENT.good },
    { label: 'AOG', value: aog, color: FLUENT.bad },
    { label: 'Maintenance', value: mx, color: FLUENT.warnAccent },
  ];

  const radius = 50, stroke = 18, circ = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <VisualCard title="Fleet Status Mix" subtitle="Click segment to filter all visuals">
      <div className="flex items-center justify-center gap-6 h-full">
        <svg width="150" height="150" viewBox="0 0 150 150">
          <circle cx="75" cy="75" r={radius} fill="none" stroke={FLUENT.border} strokeWidth={stroke} />
          {segments.map((s, i) => {
            const len = (s.value / total) * circ;
            const offset = circ - cumulative;
            cumulative += len;
            return (
              <circle
                key={i} cx="75" cy="75" r={radius} fill="none" stroke={s.color}
                strokeWidth={stroke} strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={offset} transform="rotate(-90 75 75)"
              />
            );
          })}
          <text x="75" y="72" textAnchor="middle" style={{ fontSize: 22, fontWeight: 600, fill: FLUENT.text }}>{total}</text>
          <text x="75" y="90" textAnchor="middle" style={{ fontSize: 10, fill: FLUENT.textSub }}>aircraft</text>
        </svg>
        <div className="space-y-2">
          {segments.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div style={{ width: 10, height: 10, background: s.color, borderRadius: 1 }} />
              <span style={{ fontSize: 11, color: FLUENT.text }}>{s.label}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: FLUENT.text, marginLeft: 8 }}>{s.value}</span>
              <span style={{ fontSize: 10, color: FLUENT.textSub }}>({Math.round(s.value/total*100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </VisualCard>
  );
}

function AvailabilityTrendCard() {
  const days = 30;
  const points = Array.from({ length: days }, (_, i) => {
    const base = 92;
    const variance = Math.sin(i * 0.4) * 3 + Math.cos(i * 0.7) * 2;
    return Math.round(base + variance + (i > 25 ? -3 : 0));
  });
  const min = Math.min(...points) - 2;
  const max = Math.max(...points) + 2;

  const pointsAttr = points.map((p, i) => {
    const x = (i / (days - 1)) * 100;
    const y = 100 - ((p - min) / (max - min)) * 100;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `M0,100 L ${pointsAttr.split(' ').map(pt => pt.replace(',', ' ')).join(' L ')} L 100,100 Z`;

  return (
    <VisualCard title="Fleet Availability — 30 Day Trend" subtitle="% in service · Daily measurement">
      <div className="h-full flex flex-col">
        <div className="flex-1 relative" style={{ minHeight: 140 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <linearGradient id="trend-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={FLUENT.brand} stopOpacity="0.4" />
                <stop offset="100%" stopColor={FLUENT.brand} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#trend-grad)" />
            <polyline points={pointsAttr} fill="none" stroke={FLUENT.brand} strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
          </svg>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 28, fontSize: 9, color: FLUENT.textSub }}>
            <div style={{ position: 'absolute', top: 0 }}>{max}%</div>
            <div style={{ position: 'absolute', bottom: 0 }}>{min}%</div>
          </div>
        </div>
        <div className="flex items-center justify-between" style={{ fontSize: 10, color: FLUENT.textSub, paddingTop: 4, borderTop: `1px solid ${FLUENT.border}`, marginTop: 6 }}>
          <span>Mar 26</span>
          <span>Apr 10</span>
          <span style={{ color: FLUENT.brand, fontWeight: 600 }}>Today</span>
        </div>
      </div>
    </VisualCard>
  );
}

function InspectionsTableCard() {
  const rows = [
    { tail: 'N281HC', desc: 'O2 bottle exchange', due: '4/25', days: 1, level: 'critical' },
    { tail: 'N271HC', desc: 'Gearbox oil change', due: '4/28', days: 4, level: 'warning' },
    { tail: 'N531HC', desc: 'Port FX 30-day', due: '4/29', days: 5, level: 'warning' },
    { tail: 'N251HC', desc: 'Fire ext monthly', due: '4/30', days: 6, level: 'warning' },
    { tail: 'N431HC', desc: 'Fire ext monthly', due: '4/30', days: 6, level: 'warning' },
    { tail: 'N381HC', desc: 'Hydraulic fluid', due: '5/1', days: 7, level: 'warning' },
  ];
  return (
    <VisualCard title="Inspections Due — Next 7 Days" subtitle="Conditional formatting on days remaining">
      <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: FLUENT.bgAlt }}>
              <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 600, fontSize: 10, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>Tail</th>
              <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 600, fontSize: 10, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>Inspection</th>
              <th style={{ textAlign: 'left', padding: '5px 8px', fontWeight: 600, fontSize: 10, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>Due</th>
              <th style={{ textAlign: 'right', padding: '5px 8px', fontWeight: 600, fontSize: 10, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>Days</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
                <td style={{ padding: '6px 8px', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{r.tail}</td>
                <td style={{ padding: '6px 8px' }}>{r.desc}</td>
                <td style={{ padding: '6px 8px', color: FLUENT.textSub }}>{r.due}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-block', minWidth: 36, textAlign: 'center',
                      padding: '2px 8px', borderRadius: 2,
                      background: r.level === 'critical' ? FLUENT.badSoft : FLUENT.warnSoft,
                      color: r.level === 'critical' ? FLUENT.bad : FLUENT.warnAccent,
                      fontWeight: 600,
                    }}
                  >
                    {r.days}d
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VisualCard>
  );
}

function RegionMatrixCard() {
  const regions = ['109 UT', 'WY/MT', 'ID/NV', 'CO/NM', 'UT/AZ', 'PAGE', 'SLC FW', 'NC'];
  const metrics = [
    { label: 'Aircraft', getter: r => AIRCRAFT.filter(a => a.region === r).length },
    { label: 'Available', getter: r => AIRCRAFT.filter(a => a.region === r && a.status === 'IN_SERVICE').length },
    { label: 'AOG', getter: r => AIRCRAFT.filter(a => a.region === r && a.status === 'AOG').length },
    { label: 'Avail %', getter: r => {
      const list = AIRCRAFT.filter(a => a.region === r);
      const inS = list.filter(a => a.status === 'IN_SERVICE').length;
      return list.length ? Math.round((inS / list.length) * 100) + '%' : '—';
    }},
  ];
  return (
    <VisualCard title="Regional Performance Matrix" subtitle="Cross-tab with conditional heatmap · Right-click to drill through">
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: FLUENT.bgAlt }}>
              <th style={{ textAlign: 'left', padding: '6px 10px', fontWeight: 600, fontSize: 10, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>Metric</th>
              {regions.map(r => (
                <th key={r} style={{ textAlign: 'center', padding: '6px 10px', fontWeight: 600, fontSize: 10, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((m, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
                <td style={{ padding: '7px 10px', fontWeight: 600 }}>{m.label}</td>
                {regions.map(r => {
                  const v = m.getter(r);
                  let bg = 'transparent';
                  if (m.label === 'AOG' && typeof v === 'number' && v > 0) bg = FLUENT.badSoft;
                  if (m.label === 'Avail %' && typeof v === 'string') {
                    const pct = parseInt(v);
                    if (pct === 100) bg = FLUENT.goodSoft;
                    else if (pct < 80) bg = FLUENT.warnSoft;
                  }
                  return (
                    <td key={r} style={{ padding: '7px 10px', textAlign: 'center', background: bg, fontFamily: 'ui-monospace, monospace' }}>
                      {v}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VisualCard>
  );
}

function FilterPane() {
  return (
    <div style={{ width: 220, background: FLUENT.surface, borderLeft: `1px solid ${FLUENT.border}`, padding: 12, overflowY: 'auto' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 }}>
        Filters
      </div>

      <Slicer label="Region" options={['All', '109 UT ✓', 'WY/MT', 'ID/NV', 'CO/NM', 'UT/AZ', 'PAGE', 'NC', 'SLC FW']} />
      <Slicer label="Aircraft Type" options={['All', 'AW109SP ✓', 'Bell 407 ✓', 'EC135P3H', 'KingAir B200', 'Cessna jets']} />
      <Slicer label="Status" options={['All ✓']} />
      <DateSlicer />

      <div style={{ marginTop: 16, padding: 10, background: FLUENT.bgAlt, borderRadius: 2, fontSize: 10, color: FLUENT.textSub }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Filters applied to all visuals</div>
        Selected filters propagate across the entire report unless visual-level filters override them.
      </div>
    </div>
  );
}

function Slicer({ label, options }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
        <ChevronDown size={11} style={{ color: FLUENT.textSub }} />
      </div>
      <div style={{ border: `1px solid ${FLUENT.border}`, borderRadius: 2, maxHeight: 100, overflowY: 'auto' }}>
        {options.map((o, i) => {
          const checked = o.includes('✓');
          const cleanLabel = o.replace(' ✓', '');
          return (
            <div key={i} className="flex items-center gap-2 px-2 py-1" style={{ fontSize: 11, borderBottom: i < options.length - 1 ? `1px solid ${FLUENT.border}` : 'none' }}>
              <div
                style={{
                  width: 12, height: 12, border: `1px solid ${FLUENT.borderStrong}`,
                  background: checked ? FLUENT.brand : FLUENT.surface, borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {checked && <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ color: checked ? FLUENT.text : FLUENT.textSub }}>{cleanLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateSlicer() {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <span style={{ fontSize: 11, fontWeight: 600 }}>Date Range</span>
      </div>
      <div style={{ border: `1px solid ${FLUENT.border}`, borderRadius: 2, padding: 8 }}>
        <div style={{ fontSize: 10, color: FLUENT.textSub, marginBottom: 4 }}>Last 30 days</div>
        <div style={{ height: 20, background: FLUENT.bgAlt, borderRadius: 2, position: 'relative' }}>
          <div style={{ position: 'absolute', left: '5%', right: '5%', top: 8, height: 4, background: FLUENT.brand, borderRadius: 2 }} />
          <div style={{ position: 'absolute', left: '5%', top: 4, width: 12, height: 12, background: FLUENT.brand, borderRadius: 6 }} />
          <div style={{ position: 'absolute', left: '95%', top: 4, width: 12, height: 12, background: FLUENT.brand, borderRadius: 6, transform: 'translateX(-100%)' }} />
        </div>
        <div className="flex items-center justify-between mt-1" style={{ fontSize: 10, color: FLUENT.textSub }}>
          <span>3/26</span>
          <span>4/24</span>
        </div>
      </div>
    </div>
  );
}
