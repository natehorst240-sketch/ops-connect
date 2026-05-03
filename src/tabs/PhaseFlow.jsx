import React from 'react';
import { ExternalLink } from 'lucide-react';
import phaseFlowSvg from '../assets/phase-flow.svg';

// ============================================================================
// PHASE FLOW — Lucidchart export embedded in the demo
// ----------------------------------------------------------------------------
// The diagram is authored in Lucidchart and exported as SVG (transparent
// background). Re-export and replace `src/assets/phase-flow.svg` to refresh.
// Source markdown + CSV alternates live in m365-solution/PhaseFlow.*.
// ============================================================================

export default function PhaseFlow() {
  return (
    <div className="p-8 max-w-[1400px] mx-auto fade-slide">
      <Header />
      <DiagramFrame />
      <Totals />
      <SourceFooter />
    </div>
  );
}

function Header() {
  return (
    <div className="mb-6">
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

function DiagramFrame() {
  return (
    <div className="bg-white rounded-lg border border-neutral-800 p-4 overflow-x-auto">
      <img
        src={phaseFlowSvg}
        alt="Phase Flow diagram — three swim lanes (Phase 1 / 2 / 3) with deliverable cards and a 40-week timeline."
        className="w-full h-auto"
        style={{ minWidth: 1100 }}
      />
    </div>
  );
}

function Totals() {
  return (
    <div className="mt-8 grid grid-cols-3 gap-4">
      <TotalCard
        label="Phase 1 (greenlit)"
        value="$60–100k"
        sub="6–8 wks · production v1.0"
        tone="good"
      />
      <TotalCard
        label="Phase 1 + 2 Year 1"
        value="$180–340k"
        sub="22 wks · ops layer complete"
        tone="info"
      />
      <TotalCard
        label="+ Phase 3 (when gated)"
        value="+$100–150k"
        sub="Power BI Pro + analytics + live fleet"
        tone="warn"
      />
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

function SourceFooter() {
  return (
    <div className="mt-6 px-4 py-3 bg-neutral-900 border border-neutral-800 rounded-lg flex items-center justify-between flex-wrap gap-3">
      <div className="text-[11px] text-neutral-400 leading-relaxed">
        Source diagram authored in Lucidchart and exported as SVG. Mirrored as Mermaid + Lucidchart CSV under <code className="mono text-neutral-300">m365-solution/PhaseFlow.*</code> in the repo.
      </div>
      <a
        href="https://lucid.app/lucidchart/7ce4af7c-6a1d-4d76-a2f4-7d6987001f14/edit"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-400 hover:text-orange-300"
      >
        Edit in Lucidchart <ExternalLink size={12} />
      </a>
    </div>
  );
}
