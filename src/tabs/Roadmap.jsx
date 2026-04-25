import React, { useState } from 'react';
import { AlertTriangle, Info, ChevronRight } from 'lucide-react';

// ============================================================================
// ROADMAP — M365 vs MX Connect side-by-side comparison
// ----------------------------------------------------------------------------
// Comprehensive view: phase-by-phase breakdown, total time, total cost.
// Cost data lifted from the previous M365 CostComparison so the M365 tab can
// stay focused on the "what does it look like" demo, while this tab carries
// the "what's the actual investment" decision.
// ============================================================================

const PHASES = [
  {
    phase: 'P0', title: 'Demo / Proof of Concept',
    m365:   { duration: '—', team: '1 dev', scope: 'Power Apps mockup + Power BI report', deliverable: 'Pitch artifact', current: true },
    custom: { duration: '—', team: '1 dev', scope: 'Interactive React demo (this app)',  deliverable: 'Pitch artifact', current: true },
  },
  {
    phase: 'P1', title: 'MVP — Core Platform',
    m365:   { duration: '6–8 wks',  team: '2 devs + IT',          scope: 'Power Apps canvas, Dataverse model, Power BI dashboards, Teams approvals, 1–2 PCF controls', deliverable: 'Pilot to one region' },
    custom: { duration: '8–12 wks', team: '2 devs + PM + ops SME', scope: 'Auth + RLS, all submission flows, WorksCalendar engine, dashboards, document library',     deliverable: 'Pilot to one region' },
  },
  {
    phase: 'P2', title: 'External Integrations',
    m365:   { duration: '3–5 wks', team: '2 devs',               scope: 'Power Automate flows, Veryon connector, CompleteFlight via custom connector', deliverable: 'Integrated with IHC systems' },
    custom: { duration: '4–6 wks', team: '2 devs + IT liaison',  scope: 'Microsoft Graph, Veryon, CompleteFlight, TrooTrax, Entra ID SSO',             deliverable: 'Integrated with IHC systems' },
  },
  {
    phase: 'P3', title: 'Crew Scheduling + Analytics',
    m365:   { duration: '8–12 wks', team: '2 devs + ops SME', scope: 'Custom PCF for resource scheduler, Power BI cert dashboards, Power Automate fatigue logic',  deliverable: 'Replaces Protean' },
    custom: { duration: '6–8 wks',  team: '2 devs + ops SME', scope: 'Configure WorksCalendar for crew, integrate fatigue from duty log, mobile PWA polish',     deliverable: 'Replaces Protean' },
  },
  {
    phase: 'P4', title: 'Production Hardening + Rollout',
    m365:   { duration: '4–6 wks', team: '2 devs + QA', scope: 'UAT, governance review, environment promotion, training, runbook',   deliverable: 'Org-wide v1.0' },
    custom: { duration: '4–6 wks', team: '2 devs + QA', scope: 'UAT, accessibility (WCAG AA), load testing, staged regional rollout', deliverable: 'Org-wide v1.0' },
  },
];

const SCENARIOS = [
  { id: 'e5',      label: 'IHC on E5',                  sub: 'Best case · Power BI Pro included',          y1: { m365: 260, custom: 485 }, y2: { m365: 60,  custom: 65 }, cross: 'Custom never catches up; M365 stays cheaper indefinitely',     tone: 'good' },
  { id: 'e3-mid',  label: 'IHC on E3 · negotiated',     sub: 'Realistic mid-case',                         y1: { m365: 340, custom: 525 }, y2: { m365: 130, custom: 70 }, cross: 'Custom wins on TCO around Year 4',                              tone: 'info' },
  { id: 'e3-list', label: 'IHC on E3 · list price',     sub: 'Worst case · no enterprise negotiation',     y1: { m365: 415, custom: 565 }, y2: { m365: 200, custom: 78 }, cross: 'Custom wins on TCO by Year 3',                                  tone: 'warn' },
];

const Y1_BREAKDOWN = {
  m365: [
    { label: 'Build / configuration',     range: '$200k–$280k', note: 'Smaller team; Power Apps + Power BI config + 2 PCF controls' },
    { label: 'Power BI licensing',         range: '$0 – $75k',   note: '$0 if E5; ~$75k Premium Capacity if E3' },
    { label: 'Power Apps Premium',         range: '$0 – $60k',   note: '$0 if E5; ~$60k Per-App at list' },
    { label: 'Microsoft infrastructure',   range: '$0',          note: 'Included in M365 tenant' },
    { label: 'Year 1 total',               range: '$260k – $415k', total: true },
  ],
  custom: [
    { label: 'Build / development',         range: '$480k – $560k', note: '2–3 person team · 28–38 weeks · full custom React + Supabase' },
    { label: 'Licensing',                   range: '$0',            note: 'No per-user platform tax' },
    { label: 'Infrastructure',              range: '$2k – $3k',     note: 'Supabase + Vercel + edge functions' },
    { label: 'Microsoft Graph integration', range: '$2k',           note: 'One-way sync to Outlook / Teams' },
    { label: 'Year 1 total',                range: '$485k – $565k', total: true },
  ],
};

const Y2_BREAKDOWN = {
  m365: [
    { label: 'Maintenance dev (0.3–0.5 FTE)', range: '$60k – $90k',   note: 'Often absorbed by IHC IT' },
    { label: 'Power BI licensing',             range: '$0 – $75k/yr', note: 'Same E5 vs E3 question carries forward' },
    { label: 'Power Apps Premium',             range: '$0 – $60k/yr', note: 'Recurring forever — the licensing tax' },
    { label: 'Microsoft infrastructure',       range: '$0',            note: 'Included' },
    { label: 'Year 2+ recurring',              range: '$60k – $225k/yr', note: 'Scales with user count', total: true },
  ],
  custom: [
    { label: 'Maintenance dev (1.0 FTE)', range: '$60k – $75k',   note: 'One person handles features + ops' },
    { label: 'Licensing',                  range: '$0',            note: 'Still no platform tax' },
    { label: 'Infrastructure',             range: '$3k – $4k',     note: 'Scales sub-linearly with user count' },
    { label: 'Year 2+ recurring',          range: '$63k – $79k/yr', note: 'Flat regardless of user count', total: true },
  ],
};

const TONE_COLORS = {
  good: { border: '#22c55e', bg: 'rgba(34,197,94,0.05)',  text: 'text-green-400' },
  info: { border: '#3b82f6', bg: 'rgba(59,130,246,0.05)', text: 'text-blue-400' },
  warn: { border: '#eab308', bg: 'rgba(234,179,8,0.05)',  text: 'text-amber-400' },
};

export default function RoadmapTab() {
  const [scenarioId, setScenarioId] = useState('e3-mid');
  const scenario = SCENARIOS.find(s => s.id === scenarioId);

  return (
    <div className="p-8 max-w-[1400px] mx-auto fade-slide">
      <div className="mb-6">
        <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest mb-1">For Ops Leadership</div>
        <h1 className="text-[28px] font-semibold tracking-tight mb-2">Roadmap & Cost — Side by Side</h1>
        <p className="text-[14px] text-neutral-400 max-w-3xl leading-relaxed">
          Both paths get IHC to the same operational outcome. They differ in time, team, ongoing cost, and platform risk. This page lays out the actual investment decision rather than a sales pitch in either direction.
        </p>
      </div>

      <SectionHeader number="1" title="Phase-by-phase comparison" />
      <PhaseTable />

      <SectionHeader number="2" title="Total timeline" />
      <TotalsRow />

      <SectionHeader number="3" title="Cost scenarios — pick the licensing context that fits IHC" />
      <ScenarioPicker scenarios={SCENARIOS} selectedId={scenarioId} onSelect={setScenarioId} />
      <ScenarioCallout scenario={scenario} />

      <SectionHeader number="4" title="Year 1 cost breakdown" />
      <CostTable breakdown={Y1_BREAKDOWN} />

      <SectionHeader number="5" title="Year 2+ recurring cost" />
      <CostTable breakdown={Y2_BREAKDOWN} />

      <SectionHeader number="6" title="Verify with IT before pitch" />
      <VerificationCard />
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

function PhaseTable() {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="grid grid-cols-[100px_1fr_1fr] border-b border-neutral-800 bg-neutral-950/50">
        <div className="px-4 py-3 mono text-[10px] text-neutral-500 uppercase tracking-widest">Phase</div>
        <div className="px-4 py-3 border-l border-neutral-800 flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center"><span className="text-white font-bold text-[10px]">M</span></div>
          <span className="text-[12px] font-semibold">M365 + Power Apps Build</span>
        </div>
        <div className="px-4 py-3 border-l border-neutral-800 flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded-sm flex items-center justify-center"><span className="text-black font-bold text-[10px]">M</span></div>
          <span className="text-[12px] font-semibold">MX Connect Custom Build</span>
        </div>
      </div>
      {PHASES.map((p, i) => (
        <PhaseRow key={p.phase} phase={p} last={i === PHASES.length - 1} />
      ))}
    </div>
  );
}

function PhaseRow({ phase, last }) {
  return (
    <div className={`grid grid-cols-[100px_1fr_1fr] ${last ? '' : 'border-b border-neutral-800'}`}>
      <div className="px-4 py-3 flex flex-col gap-0.5 bg-neutral-950/30">
        <div className="mono text-[11px] font-semibold text-orange-400">{phase.phase}</div>
        <div className="text-[12px] text-neutral-300 leading-tight">{phase.title}</div>
      </div>
      <PhaseCell d={phase.m365} />
      <PhaseCell d={phase.custom} />
    </div>
  );
}

function PhaseCell({ d }) {
  return (
    <div className="px-4 py-3 border-l border-neutral-800">
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className="mono text-[11px] font-semibold text-neutral-200">{d.duration}</span>
        <span className="mono text-[10px] text-neutral-500">·</span>
        <span className="mono text-[10px] text-neutral-500">{d.team}</span>
        {d.current && (
          <span className="mono text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded">Current</span>
        )}
      </div>
      <div className="text-[11px] text-neutral-400 leading-snug mb-1.5">{d.scope}</div>
      <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
        <ChevronRight size={11} />
        <span>{d.deliverable}</span>
      </div>
    </div>
  );
}

function TotalsRow() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <TotalCard side="M365 path"   duration="21–31 weeks" team="2–3 ppl peak" sub="Smaller team, faster MVP, but PCF dev for the scheduling engine drags Phase 3" color="#3b82f6" />
      <TotalCard side="Custom path" duration="22–32 weeks" team="2–3 ppl peak" sub="Slower MVP because there's more upfront build, but Phase 3 is much faster (engine already exists)" color="#ff6b1a" />
    </div>
  );
}

function TotalCard({ side, duration, team, sub, color }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4" style={{ borderTop: `2px solid ${color}` }}>
      <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">{side}</div>
      <div className="flex items-baseline gap-3 mb-1">
        <div className="text-[24px] font-semibold leading-none">{duration}</div>
        <div className="mono text-[11px] text-neutral-500">{team}</div>
      </div>
      <div className="text-[12px] text-neutral-400 leading-relaxed mt-2">{sub}</div>
    </div>
  );
}

function ScenarioPicker({ scenarios, selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-3">
      {scenarios.map(s => {
        const tone = TONE_COLORS[s.tone];
        const active = s.id === selectedId;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`text-left bg-neutral-900 border rounded-lg p-3 transition-colors ${
              active ? 'border-orange-500' : 'border-neutral-800 hover:border-neutral-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: tone.border }} />
              <div className="text-[13px] font-semibold">{s.label}</div>
            </div>
            <div className="text-[11px] text-neutral-500 mb-2">{s.sub}</div>
            <div className="grid grid-cols-2 gap-2 mono text-[11px]">
              <Stat label="Y1 M365"       value={`$${s.y1.m365}k`} />
              <Stat label="Y1 Custom"     value={`$${s.y1.custom}k`} />
              <Stat label="Y2+ M365/yr"   value={`$${s.y2.m365}k`} />
              <Stat label="Y2+ Custom/yr" value={`$${s.y2.custom}k`} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-neutral-600 uppercase text-[9px] tracking-widest">{label}</div>
      <div className="text-neutral-200 font-semibold">{value}</div>
    </div>
  );
}

function ScenarioCallout({ scenario }) {
  const tone = TONE_COLORS[scenario.tone];
  return (
    <div className="rounded-lg p-4 mb-2" style={{ background: tone.bg, border: `1px solid ${tone.border}55`, borderLeft: `3px solid ${tone.border}` }}>
      <div className="flex items-center gap-2 mb-1">
        <Info size={14} style={{ color: tone.border }} />
        <span className={`text-[12px] font-semibold ${tone.text}`}>{scenario.cross}</span>
      </div>
      <div className="text-[12px] text-neutral-400 leading-relaxed">
        Selected scenario: <strong className="text-neutral-200">{scenario.label}</strong>. Year 1 favors M365 by <strong className="text-neutral-200">${scenario.y1.custom - scenario.y1.m365}k</strong>; ongoing recurring favors {scenario.y2.custom < scenario.y2.m365 ? 'custom' : 'M365'} by <strong className="text-neutral-200">${Math.abs(scenario.y2.m365 - scenario.y2.custom)}k/yr</strong>.
      </div>
    </div>
  );
}

function CostTable({ breakdown }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <CostColumn title="M365 path"   color="#3b82f6" rows={breakdown.m365} />
      <CostColumn title="Custom path" color="#ff6b1a" rows={breakdown.custom} />
    </div>
  );
}

function CostColumn({ title, color, rows }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden" style={{ borderTop: `2px solid ${color}` }}>
      <div className="px-4 py-2.5 border-b border-neutral-800 mono text-[11px] uppercase tracking-widest font-semibold" style={{ color }}>
        {title}
      </div>
      {rows.map((r, i) => (
        <div key={i} className={`px-4 py-2.5 ${r.total ? 'bg-neutral-950/50 border-t border-neutral-800' : i < rows.length - 1 ? 'border-b border-neutral-800/60' : ''}`}>
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
    { q: 'What M365 SKU does IHC currently have for the users in scope?',                       why: 'E5 includes Power BI Pro; E3 does not. Most important variable in the comparison.', impact: '~$75k/yr Power BI difference' },
    { q: 'What negotiated rate could IHC get for Power Apps Premium Per-App?',                  why: 'List is $5/user/mo. Hospital systems often negotiate 30–50% lower.',                impact: '~$20–30k/yr Power Apps difference' },
    { q: 'Does IHC have an in-house React + Postgres engineering team available, or contract?', why: 'Custom path needs ongoing dev capacity. Affects feasibility, not just cost.',       impact: 'Determines whether custom path is realistic at all' },
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
