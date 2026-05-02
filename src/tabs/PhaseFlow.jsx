import React from 'react';
import {
  Workflow, CheckCircle2, Sparkles, Lock, ChevronRight, FileText,
  MessageSquare, Database, Calendar, Map as MapIcon, BarChart3,
  Wifi, Shield, Mail,
} from 'lucide-react';

// ============================================================================
// PHASE FLOW — visual rendering of the 3-phase M365 rollout plan
// ----------------------------------------------------------------------------
// Source-of-truth diagram for the pitch. Mirrors the Mermaid + Lucidchart
// versions in m365-solution/PhaseFlow.* so anywhere the diagram appears
// (this demo, GitHub, Lucidchart) it tells the same story.
// ============================================================================

const PHASES = [
  {
    id: 'P1',
    title: 'Request → Approval',
    status: 'greenlit',
    duration: '6–8 weeks',
    cost: '$60–100k',
    summary: 'Phase 1 hero. AMT submits from phone, RMM approves in Teams, Dataverse + Outlook + DM auto-update.',
    deliverables: [
      { Icon: FileText,      label: 'Power Apps form (mobile)',           detail: 'AMT submits MX Request from phone' },
      { Icon: Database,      label: 'Dataverse cr_mx_request + cr_audit', detail: '16-column schema + 3 security roles' },
      { Icon: Workflow,      label: 'Power Automate flow',                 detail: 'mxr-approval-flow-v2 · trigger → compose → switch' },
      { Icon: MessageSquare, label: 'Adaptive Card in Teams',              detail: 'RMM approves / denies w/ comment' },
      { Icon: Calendar,      label: 'Outlook calendar event',              detail: 'Created on approval, attendees auto-set' },
      { Icon: Mail,          label: 'DM + audit log entry',                detail: 'Requestor notified, full audit chain' },
    ],
  },
  {
    id: 'P2',
    title: 'Operations Layer',
    status: 'proposed',
    duration: '10–14 weeks',
    cost: '$120–180k',
    summary: 'Source-system mirrors. Schedules from CompleteFlight + ProteanHub. Positions from SkyRouter. Read-only from MX Connect.',
    deliverables: [
      { Icon: Database,      label: '4 custom connectors',                 detail: 'Veryon · CompleteFlight · ProteanHub · SkyRouter' },
      { Icon: Calendar,      label: 'Read-only Scheduler',                 detail: '7-day Gantt mirror with conflict side panel' },
      { Icon: MapIcon,       label: 'Stock Fleet Map',                     detail: 'Bing pins · 15-min refresh · region filter' },
      { Icon: Workflow,      label: 'Conflict + gap detection',            detail: 'Server-side, cached in cr_conflict' },
      { Icon: FileText,      label: 'Time-off + open-shift workflows',     detail: 'Reuses Phase 1 pipeline' },
      { Icon: MessageSquare, label: 'Bulletins + safety reports',          detail: 'Lightweight forms + Teams broadcast' },
    ],
  },
  {
    id: 'P3',
    title: 'Analytics + Live Tracking',
    status: 'gated',
    gate: '1000 Power BI Pro licenses',
    duration: '12–16 weeks',
    cost: '$100–150k',
    summary: 'Cinematic exec analytics + sub-30s live fleet tracking. Unlocks once Pro licenses arrive.',
    deliverables: [
      { Icon: BarChart3,     label: 'Power BI semantic model',             detail: 'DirectQuery + imported aggregations + DAX' },
      { Icon: BarChart3,     label: '4 static reports',                    detail: 'Fleet · Inspections · Utilization · Compliance' },
      { Icon: Wifi,          label: 'Streaming dataset',                   detail: 'SkyRouter → Azure Function → Power BI push' },
      { Icon: MapIcon,       label: 'Live Fleet map (sub-30s)',            detail: 'ArcGIS or Mapbox · bearing-rotated icons' },
      { Icon: Shield,        label: 'Self-service slicers',                detail: 'RLS by region · RMMs answer their own questions' },
      { Icon: ChevronRight,  label: 'PDF / PowerPoint exports',            detail: 'Scheduled weekly to exec leadership' },
    ],
  },
];

const STATUS = {
  greenlit: { label: 'Greenlit',                  color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  Icon: CheckCircle2 },
  proposed: { label: 'Proposed',                  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', Icon: Sparkles },
  gated:    { label: 'Gated · license dependent', color: '#eab308', bg: 'rgba(234,179,8,0.12)',  Icon: Lock },
};

export default function PhaseFlow() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto fade-slide">
      <Header />
      <PhaseGrid />
      <Timeline />
      <Totals />
    </div>
  );
}

function Header() {
  return (
    <div className="mb-8">
      <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest mb-1">
        Project Plan
      </div>
      <h1 className="text-[28px] font-semibold tracking-tight mb-2">
        Phase Flow · M365 / Teams Rollout
      </h1>
      <p className="text-[14px] text-neutral-400 max-w-3xl leading-relaxed">
        Three phases shipping independently. Phase 1 is greenlit and in active build. Phase 2 starts after Phase 1 acceptance criteria are met. Phase 3 unlocks when IHC&apos;s 1000 Power BI Pro licenses arrive. No PCF, no third-party platforms, no infrastructure for IHC IT to own beyond the existing M365 tenant.
      </p>
    </div>
  );
}

function PhaseGrid() {
  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-3">
        {PHASES.map((p, idx) => (
          <PhaseColumn key={p.id} phase={p} />
        ))}
      </div>
      <PhaseArrow leftPct={32.4} />
      <PhaseArrow leftPct={65.8} />
    </div>
  );
}

function PhaseArrow({ leftPct }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: `${leftPct}%`, top: 80, transform: 'translateX(-50%)' }}
    >
      <div className="flex items-center gap-1">
        <div style={{ width: 14, height: 2, background: '#737373' }} />
        <ChevronRight size={14} className="text-neutral-500" />
      </div>
    </div>
  );
}

function PhaseColumn({ phase }) {
  const status = STATUS[phase.status];
  return (
    <div
      className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col"
      style={{ borderTop: `3px solid ${status.color}` }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid #262626' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="mono text-[12px] font-bold text-orange-400">{phase.id}</span>
          <span
            className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded"
            style={{ background: status.bg, color: status.color }}
          >
            <status.Icon size={9} />
            {status.label}
          </span>
        </div>
        <div className="text-[15px] font-semibold leading-tight mb-2">{phase.title}</div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="mono text-[13px] font-semibold text-orange-400">{phase.cost}</span>
          <span className="mono text-[11px] text-neutral-500">· {phase.duration}</span>
        </div>
        {phase.gate && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400 mt-1.5">
            <Lock size={10} />
            {phase.gate}
          </div>
        )}
        <div className="text-[11px] text-neutral-400 leading-relaxed mt-2">{phase.summary}</div>
      </div>
      <div className="p-2 flex-1">
        {phase.deliverables.map((d, i) => <DeliverableCard key={i} {...d} />)}
      </div>
    </div>
  );
}

function DeliverableCard({ Icon, label, detail }) {
  return (
    <div className="px-3 py-2 rounded transition-colors hover:bg-neutral-800/40">
      <div className="flex items-start gap-2">
        <Icon size={14} className="text-orange-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium leading-tight">{label}</div>
          <div className="text-[10px] text-neutral-500 leading-snug mt-0.5">{detail}</div>
        </div>
      </div>
    </div>
  );
}

function Timeline() {
  // 40-week timeline; Phase 1 weeks 1-8, Phase 2 weeks 9-22, Phase 3 weeks 23-38
  const totalWeeks = 40;
  const weekToPct = (w) => (w / totalWeeks) * 100;
  const phaseRanges = [
    { phase: 'Phase 1', start: 0,  end: 8,  status: 'greenlit', label: 'Phase 1 · 6–8 wks' },
    { phase: 'Phase 2', start: 8,  end: 22, status: 'proposed', label: 'Phase 2 · 10–14 wks' },
    { phase: 'Phase 3', start: 22, end: 38, status: 'gated',    label: 'Phase 3 · 12–16 wks (gated)' },
  ];
  return (
    <div className="mt-10">
      <div className="flex items-baseline gap-3 mb-3">
        <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest">2</div>
        <h2 className="text-[16px] font-semibold tracking-tight m-0">Timeline · weeks 1–40</h2>
      </div>
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
        <div className="relative" style={{ height: 96 }}>
          {/* week markers */}
          <div className="absolute inset-0 flex items-end" style={{ height: 16 }}>
            {[0, 8, 16, 24, 32, 40].map(w => (
              <div
                key={w}
                className="absolute mono text-[10px] text-neutral-500"
                style={{ left: `${weekToPct(w)}%`, transform: 'translateX(-50%)' }}
              >
                wk {w}
              </div>
            ))}
          </div>
          {/* phase bars */}
          {phaseRanges.map((r, idx) => {
            const status = STATUS[r.status];
            const left = weekToPct(r.start);
            const width = weekToPct(r.end - r.start);
            return (
              <div
                key={r.phase}
                className="absolute rounded flex items-center px-2"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  top: idx * 22 + 18,
                  height: 18,
                  background: status.color,
                  color: idx === 2 ? '#000' : '#fff',
                }}
              >
                <span className="text-[10px] font-bold tracking-wide truncate">{r.label}</span>
              </div>
            );
          })}
          {/* baseline */}
          <div
            className="absolute"
            style={{ bottom: 16, left: 0, right: 0, height: 1, background: '#404040' }}
          />
        </div>
      </div>
    </div>
  );
}

function Totals() {
  return (
    <div className="mt-8 grid grid-cols-3 gap-4">
      <TotalCard label="Phase 1 (greenlit)"     value="$60–100k"  sub="6–8 wks · production v1.0"             tone="good" />
      <TotalCard label="Phase 1 + 2 Year 1"      value="$180–340k" sub="22 wks · ops layer complete"           tone="info" />
      <TotalCard label="+ Phase 3 (when gated)"  value="+$100–150k" sub="Power BI Pro + analytics + live fleet" tone="warn" />
    </div>
  );
}

function TotalCard({ label, value, sub, tone }) {
  const colors = {
    good: { border: '#22c55e' },
    info: { border: '#3b82f6' },
    warn: { border: '#eab308' },
  };
  const c = colors[tone];
  return (
    <div
      className="bg-neutral-900 border border-neutral-800 rounded-lg p-4"
      style={{ borderTop: `2px solid ${c.border}` }}
    >
      <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">{label}</div>
      <div className="text-[24px] font-semibold leading-none">{value}</div>
      <div className="text-[11px] text-neutral-400 leading-relaxed mt-2">{sub}</div>
    </div>
  );
}
