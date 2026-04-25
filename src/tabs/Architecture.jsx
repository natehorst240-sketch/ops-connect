import React from 'react';
import { Database, Shield, Cloud } from 'lucide-react';

export default function ArchitectureTab() {
  return (
    <div className="p-8 max-w-[1200px] mx-auto fade-slide">
      <div className="mb-6">
        <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest mb-1">For Company IT</div>
        <h1 className="text-[28px] font-semibold tracking-tight mb-2">System Architecture</h1>
        <p className="text-[14px] text-neutral-400 max-w-3xl leading-relaxed">
          Custom React SPA built on the WorksCalendar engine, backed by Supabase. Microsoft 365 retained at the boundary — approved events sync one-way to Outlook and Teams via Graph API. No Power Apps runtime dependency, no per-user M365 licensing beyond what IHC already has.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <ArchLayer
          title="Presentation"
          color="#3b82f6"
          items={['React 18 + Vite + TypeScript', 'WorksCalendar (in-house engine)', 'Tailwind CSS', 'Responsive PWA']}
          note="Hosted on Vercel or internal static hosting"
        />
        <Divider />
        <ArchLayer
          title="API & Realtime"
          color="#22c55e"
          items={['Supabase Auth (SSO-ready)', 'PostgREST API', 'Realtime subscriptions', 'Row-Level Security (RLS)']}
          note="RLS enforces capability matrix at DB layer"
        />
        <Divider />
        <ArchLayer
          title="Data"
          color="#eab308"
          items={['Postgres 15', '14 tables (aircraft, crew, schedules, approvals, bulletins, threads...)', 'Supabase Storage', 'Audit log']}
          note="Single source of truth for all operations data"
        />
        <Divider />
        <ArchLayer
          title="Integration (Edge Functions)"
          color="#ff6b1a"
          items={['Microsoft Graph (Outlook + Teams)', 'Veryon sync', 'CompleteFlight sync (cert tracking)', 'TrooTrax sync', 'Email (Resend or Graph sendMail)']}
          note="Triggered on row changes — approvals, bulletins, AOG events"
        />
        <Divider />
        <ArchLayer
          title="External Systems"
          color="#a3a3a3"
          items={['Microsoft 365 (Outlook, Teams)', 'Veryon (Flightdocs)', 'CompleteFlight', 'TrooTrax', 'IHC Entra ID (SSO)']}
          note="One-way push for approved events; scheduled pull for inspection/cert data"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Database, title: 'Single source of truth', text: 'All operations data lives in Postgres. Microsoft side is a mirror, not an input.' },
          { icon: Shield, title: 'RLS-enforced roles', text: 'The capability matrix is a database constraint, not just UI gating. Zero trust in the client.' },
          { icon: Cloud, title: 'Integration at the edge', text: "External system sync is isolated in Edge Functions. Failure in Graph doesn't break the app." },
        ].map((p, idx) => {
          const Icon = p.icon;
          return (
            <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
              <Icon size={18} className="text-orange-400 mb-3" />
              <div className="text-[13px] font-semibold mb-1.5">{p.title}</div>
              <div className="text-[12px] text-neutral-400 leading-relaxed">{p.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ArchLayer({ title, color, items, note }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      <div className="flex">
        <div className="w-1" style={{ background: color }} />
        <div className="flex-1 p-4">
          <div className="flex items-baseline gap-3 mb-2 flex-wrap">
            <div className="mono text-[11px] uppercase tracking-widest font-semibold" style={{ color }}>{title}</div>
            <div className="text-[11px] text-neutral-500">{note}</div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {items.map(it => (
              <span key={it} className="mono text-[11px] px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">{it}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return <div className="flex justify-center"><div className="w-px h-5 bg-neutral-700" /></div>;
}
