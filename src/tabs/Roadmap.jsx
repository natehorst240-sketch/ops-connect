import React from 'react';

const PHASES = [
  {
    phase: 'Phase 0', title: 'Demo / Proof of Concept', status: 'CURRENT',
    duration: '—', team: '1 developer',
    scope: ['Interactive demo (this app)', 'Real IHC data loaded', 'Scripted flow walkthroughs', 'Architecture & roadmap docs'],
    deliverable: 'Stakeholder-ready pitch artifact',
  },
  {
    phase: 'Phase 1', title: 'MVP — Core Platform', status: 'NEXT',
    duration: '8–12 weeks', team: '2 devs + PM + ops SME',
    scope: ['Auth + RLS for all 10+ roles', 'All submission forms + approval flows', 'Resource timeline (WorksCalendar extended)', 'Dashboards + bulletins', 'Document library'],
    deliverable: 'Deployable to one pilot region',
  },
  {
    phase: 'Phase 2', title: 'External Integrations', status: 'FUTURE',
    duration: '4–6 weeks', team: '2 devs + IT liaison',
    scope: ['Microsoft Graph (Outlook + Teams sync)', 'Veryon inspection feed', 'CompleteFlight cert tracking', 'TrooTrax', 'AOG watcher', 'Entra ID SSO'],
    deliverable: 'Integrated with existing IHC systems',
  },
  {
    phase: 'Phase 3', title: 'Crew Scheduling + Analytics', status: 'FUTURE',
    duration: '6–8 weeks', team: '2 devs + ops SME',
    scope: ['Full crew scheduling (pilots, nurses, paramedics)', 'Open shift marketplace', 'Fatigue warnings (display only)', 'Analytics dashboards', 'Mobile PWA polish'],
    deliverable: 'Replaces Protean Connect workflow',
  },
  {
    phase: 'Phase 4', title: 'Production Hardening + Rollout', status: 'FUTURE',
    duration: '4–6 weeks', team: '2 devs + QA',
    scope: ['UAT across all roles', 'Accessibility (WCAG AA)', 'Load testing', 'Staged rollout by region', 'User training', 'Admin runbook'],
    deliverable: 'Production v1.0 across organization',
  },
];

const statusColors = {
  CURRENT: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  NEXT: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  FUTURE: { bg: 'bg-neutral-800', text: 'text-neutral-500', border: 'border-neutral-700' },
};

export default function RoadmapTab() {
  return (
    <div className="p-8 max-w-[1200px] mx-auto fade-slide">
      <div className="mb-6">
        <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest mb-1">For Ops Leadership</div>
        <h1 className="text-[28px] font-semibold tracking-tight mb-2">Roadmap to Reality</h1>
        <p className="text-[14px] text-neutral-400 max-w-3xl leading-relaxed">
          Five phases. ~28–38 weeks end-to-end with a small dedicated team. The demo you're looking at is Phase 0 — scoped to prove the concept without committing significant engineering resources.
        </p>
      </div>

      <div className="relative">
        <div className="absolute left-[23px] top-3 bottom-3 w-px bg-neutral-800" />
        <div className="space-y-3">
          {PHASES.map((p, idx) => {
            const s = statusColors[p.status];
            return (
              <div key={idx} className="flex gap-4 relative">
                <div className={`w-12 h-12 rounded-full ${s.bg} ${s.border} border-2 flex items-center justify-center shrink-0 z-10 bg-neutral-950`}>
                  <div className={`mono text-[11px] font-semibold ${s.text}`}>P{idx}</div>
                </div>
                <div className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest">{p.phase}</div>
                    <div className="text-[16px] font-semibold">{p.title}</div>
                    <div className={`mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${s.bg} ${s.text}`}>{p.status}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3 text-[12px]">
                    <div>
                      <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Duration</div>
                      <div className="text-neutral-200">{p.duration}</div>
                    </div>
                    <div>
                      <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Team</div>
                      <div className="text-neutral-200">{p.team}</div>
                    </div>
                    <div>
                      <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Deliverable</div>
                      <div className="text-neutral-200">{p.deliverable}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.scope.map(x => (
                      <span key={x} className="mono text-[11px] px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">{x}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Est. Total Timeline</div>
          <div className="text-[24px] font-semibold tracking-tight">28–38 weeks</div>
          <div className="text-[11px] text-neutral-500 mt-1">From approval to production v1.0</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Peak Team Size</div>
          <div className="text-[24px] font-semibold tracking-tight">2–3 people</div>
          <div className="text-[11px] text-neutral-500 mt-1">Devs + ops SME + IT liaison</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Infra Cost (Est.)</div>
          <div className="text-[24px] font-semibold tracking-tight">~$200/mo</div>
          <div className="text-[11px] text-neutral-500 mt-1">Supabase Pro + Vercel + Resend</div>
        </div>
      </div>
    </div>
  );
}
