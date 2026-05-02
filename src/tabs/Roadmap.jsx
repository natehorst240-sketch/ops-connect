import React from 'react';
import { AlertTriangle, Info, ChevronRight, CheckCircle2, Clock, Sparkles, Lock } from 'lucide-react';

// ============================================================================
// ROADMAP — M365/Teams phased rollout
// ----------------------------------------------------------------------------
// Phase 1 (greenlit): Request → Approval workflow on stock Power Apps + Power
//                     Automate + Teams. Ships in 6–8 weeks.
// Phase 2: Operations layer — read-only Scheduler mirror, stock Fleet Map,
//          custom connectors to Veryon / CompleteFlight / ProteanHub /
//          SkyRouter. 10–14 weeks.
// Phase 3 (gated): Analytics + live tracking via Power BI. Ships once IHC's
//                  1000 Power BI Pro licenses arrive. 12–16 weeks.
// ============================================================================

const PHASES = [
  {
    id: 'P1',
    title: 'Request → Approval',
    status: 'greenlit',
    duration: '6–8 weeks',
    team: '1 Power Platform dev + IHC IT liaison',
    scope: [
      'Power Apps canvas form (MX Request)',
      'Power Automate flow with Adaptive Card to Teams',
      'Dataverse cr_mx_request schema + audit trail',
      'Outlook calendar event on approval',
      'DM notification back to requestor on approve / deny',
    ],
    deliverable: 'Production v1.0 — MX Request submitted from phone, approved in Teams in under 2 hours during shift hours.',
    cost: '$60k – $100k',
    stack: ['Power Apps', 'Power Automate', 'Teams (Adaptive Card)', 'Dataverse', 'Outlook'],
  },
  {
    id: 'P2',
    title: 'Operations Layer',
    status: 'proposed',
    duration: '10–14 weeks',
    team: '1–2 Power Platform devs + IT liaison',
    scope: [
      'Resource Scheduler — read-only Gantt mirror of CompleteFlight + ProteanHub',
      'Server-side conflict + coverage gap detection (Power Automate, cached in Dataverse)',
      'Fleet Map — stock Bing Maps with 15-min SkyRouter refresh',
      'Custom connectors: Veryon, CompleteFlight, ProteanHub, SkyRouter (API key auth)',
      'Time-off + open-shift workflows (same pipeline as Phase 1)',
      'Bulletins + safety reports (forms + Teams)',
    ],
    deliverable: 'Operations layer covering daily scheduler + AMT + RMM workflows. Dispatch decisions made in source systems; MX Connect surfaces conflicts and gaps cross-system.',
    cost: '$120k – $180k',
    stack: ['Power Apps', 'Power Automate', 'Dataverse', 'Custom connectors', 'Stock Bing Maps'],
  },
  {
    id: 'P3',
    title: 'Analytics + Live Tracking',
    status: 'gated',
    gate: 'Awaiting 1000 Power BI Pro licenses',
    duration: '12–16 weeks',
    team: '1 Power Platform dev + 1 Power BI dev',
    scope: [
      'Power BI Fleet Operations report (KPIs, regional drill-down, inspection compliance)',
      'Live Fleet view — Power BI map visual + streaming dataset (sub-30s refresh)',
      'Cert dashboards from CompleteFlight',
      'Self-service slicers + filters for end users',
      'Exec-friendly PDF / PowerPoint exports',
    ],
    deliverable: 'Director / RMM analytics + cinematic live fleet tracking. Replaces ad-hoc Excel reporting and the limited Phase 2 fleet map.',
    cost: '$100k – $150k',
    stack: ['Power BI Pro / Premium', 'DirectQuery / streaming dataset', 'ArcGIS or Mapbox visuals'],
  },
];

const STATUS_CONFIG = {
  greenlit: { label: 'Greenlit',                    color: '#107c10', bg: 'rgba(16,124,16,0.1)',  Icon: CheckCircle2 },
  proposed: { label: 'Proposed',                    color: '#0078d4', bg: 'rgba(0,120,212,0.1)',  Icon: Sparkles },
  gated:    { label: 'Gated · license dependent',   color: '#ca5010', bg: 'rgba(202,80,16,0.1)',  Icon: Lock },
};

const Y1_BREAKDOWN = [
  { label: 'Phase 1 build · Request → Approval',                   range: '$60k – $100k',  note: 'Power Apps form, flow, Adaptive Card, Dataverse schema, Outlook event' },
  { label: 'Phase 2 build · Operations layer',                     range: '$120k – $180k', note: 'Scheduler mirror, Fleet Map, custom connectors, time-off + bulletins' },
  { label: 'Power Apps Premium licensing · Phase 2 onward',        range: '$0 – $60k/yr',  note: '~350 active users · Per-App, often negotiated 30–50% off list' },
  { label: 'Microsoft infrastructure',                              range: '$0',            note: 'Included in M365 tenant; Dataverse capacity sufficient at IHC scale' },
  { label: 'Year 1 total (Phase 1 + 2)',                            range: '$180k – $340k', total: true },
];

const Y2_BREAKDOWN = [
  { label: 'Maintenance dev (0.3–0.5 FTE)',                         range: '$60k – $90k',     note: 'Often absorbed by IHC IT once stable' },
  { label: 'Power Apps Premium (recurring)',                        range: '$0 – $60k/yr',    note: 'Same per-user model carries forward' },
  { label: 'Microsoft infrastructure',                              range: '$0',              note: 'Included' },
  { label: 'Year 2+ recurring',                                      range: '$60k – $150k/yr', total: true },
];

const PHASE3_ADDER = [
  { label: 'Phase 3 build · Power BI + Live Fleet',                 range: '$100k – $150k', note: 'Ships only after 1000 Power BI Pro licenses arrive · adds to Y1 if same year, otherwise rolls into Y2/3' },
];

export default function RoadmapTab() {
  return (
    <div className="p-8 max-w-[1200px] mx-auto fade-slide">
      <Header />
      <CostHero />
      <SectionHeader number="1" title="Phased rollout" />
      <PhaseList />
      <SectionHeader number="2" title="Year 1 cost (Phase 1 + 2)" />
      <CostTable rows={Y1_BREAKDOWN} />
      <SectionHeader number="3" title="Year 2+ recurring" />
      <CostTable rows={Y2_BREAKDOWN} />
      <SectionHeader number="4" title="Phase 3 adder · when Power BI Pro arrives" />
      <CostTable rows={PHASE3_ADDER} />
      <SectionHeader number="5" title="Open questions before proceeding" />
      <VerificationCard />
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6">
      <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest mb-1">For Ops Leadership</div>
      <h1 className="text-[28px] font-semibold tracking-tight mb-2">M365 / Teams Rollout · 3 Phases</h1>
      <p className="text-[14px] text-neutral-400 max-w-3xl leading-relaxed">
        Phase 1 has been greenlit and is the entry point for everything that follows. Phase 2 layers operations on top once the audit and approval surface is proven. Phase 3 unlocks analytics and live tracking when IHC&apos;s 1000 Power BI Pro licenses arrive. Each phase ships independently — no big-bang dependency, no PCF, no third-party platforms.
      </p>
    </div>
  );
}

function CostHero() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-2">
      <HeroCard label="Phase 1 (greenlit)"      value="$60–100k"   sub="6–8 weeks · production v1.0"          tone="good" />
      <HeroCard label="Phase 1 + 2 Year 1"       value="$180–340k"  sub="22 weeks · ops layer complete"        tone="info" />
      <HeroCard label="+ Phase 3 (when gated)"   value="+$100–150k" sub="Power BI Pro + analytics + live fleet" tone="warn" />
    </div>
  );
}

function HeroCard({ label, value, sub, tone }) {
  const colors = {
    good: { border: '#107c10' },
    info: { border: '#0078d4' },
    warn: { border: '#ca5010' },
  };
  const c = colors[tone];
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4" style={{ borderTop: `2px solid ${c.border}` }}>
      <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">{label}</div>
      <div className="text-[24px] font-semibold leading-none">{value}</div>
      <div className="text-[11px] text-neutral-400 leading-relaxed mt-2">{sub}</div>
    </div>
  );
}

function SectionHeader({ number, title }) {
  return (
    <div className="flex items-baseline gap-3 mb-3 mt-7">
      <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest">{number}</div>
      <h2 className="text-[16px] font-semibold tracking-tight m-0">{title}</h2>
    </div>
  );
}

function PhaseList() {
  return (
    <div className="space-y-3">
      {PHASES.map(p => <PhaseCard key={p.id} phase={p} />)}
    </div>
  );
}

function PhaseCard({ phase }) {
  const status = STATUS_CONFIG[phase.status];
  return (
    <div
      className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden"
      style={{ borderLeft: `3px solid ${status.color}` }}
    >
      <div className="px-5 py-3 flex items-center gap-3" style={{ borderBottom: '1px solid #262626', background: 'rgba(0,0,0,0.2)' }}>
        <div className="mono text-[12px] font-semibold text-orange-400">{phase.id}</div>
        <div className="text-[16px] font-semibold flex-1">{phase.title}</div>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded"
          style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 600 }}
        >
          <status.Icon size={11} />
          {status.label}
        </div>
      </div>

      <div className="px-5 py-3 grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <FactRow label="Duration"     value={phase.duration} />
          <FactRow label="Team"         value={phase.team} />
          <FactRow label="Cost"         value={phase.cost} mono />
          {phase.gate && <FactRow label="Gate" value={phase.gate} warn />}
        </div>
        <div>
          <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Stack</div>
          <div className="flex flex-wrap gap-1.5">
            {phase.stack.map(s => (
              <span key={s} className="mono text-[11px] px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-3" style={{ borderTop: '1px solid #262626' }}>
        <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Scope</div>
        <ul className="space-y-1.5 mb-3">
          {phase.scope.map(s => (
            <li key={s} className="flex items-start gap-2 text-[12px] text-neutral-300">
              <ChevronRight size={12} className="text-orange-400 mt-0.5 shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <div
          className="rounded p-3"
          style={{ background: 'rgba(255,107,26,0.05)', border: '1px solid rgba(255,107,26,0.2)' }}
        >
          <div className="mono text-[10px] text-orange-400 uppercase tracking-widest mb-1">Deliverable</div>
          <div className="text-[12px] text-neutral-200 leading-relaxed">{phase.deliverable}</div>
        </div>
      </div>
    </div>
  );
}

function FactRow({ label, value, mono, warn }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="mono text-[10px] text-neutral-500 uppercase tracking-widest">{label}</span>
      <span className={`text-[12px] ${mono ? 'mono font-semibold text-orange-400' : warn ? 'text-amber-400' : 'text-neutral-200'}`}>{value}</span>
    </div>
  );
}

function CostTable({ rows }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      {rows.map((r, i) => (
        <div
          key={i}
          className={`px-4 py-3 ${r.total ? 'bg-neutral-950/50 border-t border-neutral-800' : i < rows.length - 1 ? 'border-b border-neutral-800/60' : ''}`}
        >
          <div className="flex items-baseline justify-between gap-3 mb-0.5">
            <span className={`text-[12px] ${r.total ? 'font-semibold text-neutral-100' : 'text-neutral-300'}`}>{r.label}</span>
            <span className={`mono text-[12px] font-semibold ${r.total ? 'text-orange-400' : 'text-neutral-200'}`}>{r.range}</span>
          </div>
          {r.note && !r.total && <div className="text-[11px] text-neutral-500 leading-snug">{r.note}</div>}
        </div>
      ))}
    </div>
  );
}

function VerificationCard() {
  const items = [
    { q: 'What M365 SKU does IHC currently have for the users in scope?',                 why: 'E5 includes Power BI Pro and Premium connector entitlements; E3 does not. Affects Phase 3 timing and Phase 2 connector cost.', impact: 'Drives whether Phase 3 ships in Year 1 or rolls forward' },
    { q: 'Negotiated rate for Power Apps Premium Per-App at ~350 active users?',          why: 'List is $5/user/mo. Hospital systems typically negotiate 30–50% lower.', impact: 'Y2+ recurring band: $0–$60k/yr' },
    { q: 'Who owns the IHC IT relationship for environment promotion + DLP review?',       why: 'Phase 1 needs a sandbox + a UAT environment in IHC’s Power Platform tenant; the Phase 1 timeline assumes IT can stand these up in week 1.', impact: 'Slips Phase 1 by 1–2 weeks if the relationship isn’t in place' },
    { q: 'Are CompleteFlight + ProteanHub + SkyRouter API keys available now?',           why: 'Phase 2 starts integration in week 1 of Phase 2. Procurement of API keys can be 2–4 weeks at the source vendors.', impact: 'Phase 2 entry point is gated on these keys' },
  ];
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      {items.map((item, i) => (
        <div key={i} className={`px-4 py-3 ${i < items.length - 1 ? 'border-b border-neutral-800' : ''}`}>
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-[13px] font-semibold mb-1">{item.q}</div>
              <div className="text-[11px] text-neutral-400 leading-relaxed mb-1">{item.why}</div>
              <div className="mono text-[10px] uppercase tracking-widest text-orange-400">{item.impact}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
