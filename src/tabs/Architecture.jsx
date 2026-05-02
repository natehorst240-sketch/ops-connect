import React from 'react';
import { Database, Shield, Cloud } from 'lucide-react';

export default function ArchitectureTab() {
  return (
    <div className="p-8 max-w-[1200px] mx-auto fade-slide">
      <div className="mb-6">
        <div className="mono text-[11px] text-neutral-500 uppercase tracking-widest mb-1">For Company IT</div>
        <h1 className="text-[28px] font-semibold tracking-tight mb-2">System Architecture</h1>
        <p className="text-[14px] text-neutral-400 max-w-3xl leading-relaxed">
          Stock M365 / Power Platform stack. Power Apps canvas at the surface, Power Automate for workflow, Dataverse for state, Microsoft Graph for integration. No PCF, no Power BI in Phase 1–2, no third-party platforms. Everything runs inside IHC&apos;s existing M365 tenant — no new infrastructure for IT to own, no per-user licensing beyond Power Apps Premium.
        </p>
      </div>

      <div className="space-y-3 mb-8">
        <ArchLayer
          title="Presentation"
          color="#3b82f6"
          items={['Power Apps Canvas (web + mobile)', 'Microsoft Teams (Adaptive Cards)', 'Outlook (calendar surface)', 'Power Apps Mobile (offline-capable)']}
          note="Native M365 surfaces · no web app to host, no PWA to maintain"
        />
        <Divider />
        <ArchLayer
          title="Workflow"
          color="#22c55e"
          items={['Power Automate (cloud flows)', 'Adaptive Card actions (approve / deny)', 'Scheduled flows (polling)', 'Conflict detection flow (server-side)']}
          note="All approval, integration, and detection logic runs server-side"
        />
        <Divider />
        <ArchLayer
          title="Data"
          color="#eab308"
          items={['Dataverse tables (cr_mx_request, cr_schedule_event, cr_aircraft, cr_conflict, cr_audit...)', 'Microsoft Purview (audit + retention)', 'SharePoint document library (attachments)', 'Dataverse security roles (capability matrix)']}
          note="Single source of truth · M365 compliance posture inherited"
        />
        <Divider />
        <ArchLayer
          title="Integration"
          color="#ff6b1a"
          items={['Microsoft Graph (Outlook calendar, Teams DM)', 'Custom connector · Veryon (Flightdocs)', 'Custom connector · CompleteFlight (cert + training)', 'Custom connector · ProteanHub (missions + MX + AOG)', 'Custom connector · SkyRouter (Iridium tracking)']}
          note="Custom connectors live in the Power Platform tenant · API keys in connector definition, not in the canvas app"
        />
        <Divider />
        <ArchLayer
          title="External Systems"
          color="#a3a3a3"
          items={['IHC Entra ID (SSO)', 'Veryon (Flightdocs)', 'CompleteFlight', 'ProteanHub', 'SkyRouter (Iridium tracking)']}
          note="Read-only mirrors · edits made at source · 15-min sync cadence"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Shield, title: 'Tenant inheritance', text: 'DLP, Purview audit, retention, conditional access, MFA — all inherited from IHC’s existing M365 tenant. Nothing app-layer to build or audit separately.' },
          { icon: Database, title: 'Security roles, not UI gating', text: 'The capability matrix lives in Dataverse security roles — same surface IHC IT already manages for other Power Platform apps. Zero trust in the canvas client.' },
          { icon: Cloud, title: 'Integration is isolated', text: 'External-system polling lives in Power Automate flows. Failure at CompleteFlight, ProteanHub, or SkyRouter degrades freshness; the canvas app keeps working off the last cached pull.' },
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
