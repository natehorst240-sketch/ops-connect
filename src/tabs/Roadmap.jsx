import React from 'react';
import { AlertTriangle, ChevronRight, CheckCircle2, Sparkles, Lock } from 'lucide-react';

// ============================================================================
// ROADMAP — M365/Teams phased rollout
// ----------------------------------------------------------------------------
// Phase 1 (greenlit): Request → Approval workflow on stock Power Apps + Power
//                     Automate + Teams.
// Phase 2: Operations layer — read-only Scheduler mirror, stock Fleet Map,
//          custom connectors to Veryon / CompleteFlight / ProteanHub /
//          SkyRouter.
// Phase 3 (gated): Analytics + live tracking via Power BI. Ships once IHC's
//                  1000 Power BI Pro licenses arrive.
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
    stack: ['Power BI Pro / Premium', 'DirectQuery / streaming dataset', 'ArcGIS or Mapbox visuals'],
  },
];

const STATUS_CONFIG = {
  greenlit: { label: 'Greenlit',                    color: '#107c10', bg: 'rgba(16,124,16,0.1)',  Icon: CheckCircle2 },
  proposed: { label: 'Proposed',                    color: '#0078d4', bg: 'rgba(0,120,212,0.1)',  Icon: Sparkles },
  gated:    { label: 'Gated · license dependent',   color: '#ca5010', bg: 'rgba(202,80,16,0.1)',  Icon: Lock },
};

export default function RoadmapTab() {
  return (
    <div className="p-8 max-w-[1200px] mx-auto fade-slide">
      <Header />
      <SectionHeader number="1" title="Phased rollout" />
      <PhaseList />
      <SectionHeader number="2" title="Open questions before proceeding" />
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

function FactRow({ label, value, warn }) {
  return (
    <div className="flex items-baseline justify-between mb-1.5">
      <span className="mono text-[10px] text-neutral-500 uppercase tracking-widest">{label}</span>
      <span className={`text-[12px] ${warn ? 'text-amber-400' : 'text-neutral-200'}`}>{value}</span>
    </div>
  );
}

function VerificationCard() {
  const items = [
    {
      q: 'Who owns the IHC IT relationship for environment promotion + DLP review?',
      why: 'Phase 1 needs a sandbox + a UAT environment in IHC&rsquo;s Power Platform tenant; the Phase 1 timeline assumes IT can stand these up in week 1.',
      impact: 'Slips Phase 1 by 1–2 weeks if the relationship isn&rsquo;t in place',
    },
    {
      q: 'Are CompleteFlight + ProteanHub + SkyRouter API keys available now?',
      why: 'Phase 2 starts integration in week 1 of Phase 2. Procurement of API keys can be 2–4 weeks at the source vendors.',
      impact: 'Phase 2 entry point is gated on these keys',
    },
    {
      q: 'Which region pilots Phase 1 first, and who is the named approver?',
      why: 'Phase 1 ships to one region for UAT before org-wide rollout. Logan is the default per the demo personas.',
      impact: 'Affects channel ID / approver mapping in flow env vars',
    },
    {
      q: 'When are the 1000 Power BI Pro licenses expected to arrive?',
      why: 'Phase 3 is the only phase blocked by license availability. Knowing the ETA lets us schedule the Power BI dev and the report build window.',
      impact: 'Drives whether Phase 3 ships in Year 1 or rolls forward',
    },
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
