import React from 'react';
import { Building2, Sparkles, GitCompare, AlertTriangle } from 'lucide-react';
import { FLUENT } from '../tokens';

// ============================================================================
// CAPABILITY COMPARISON
// 3rd-party developers vs full custom build. For each capability area, list
// the enterprise platforms that can deliver it and the limitations they bring.
// MX Connect — Full Custom Build sits last on every list with no theoretical
// limitations: it's the upper bound the others price themselves against.
// ============================================================================

const CATEGORIES = [
  {
    category: 'Forms & Approvals',
    intro: 'Submission forms (MX, time-off, safety), multi-step approvals, audit trail.',
    vendors: [
      { name: 'Microsoft Power Platform', product: 'Power Apps + Power Automate',
        limitations: [
          'Recurring per-user Premium licensing tax',
          'Custom (non-stock) UI requires PCF components',
          'Coupled to Dataverse / M365 tenant',
        ] },
      { name: 'Salesforce Platform', product: 'Flow Builder + Lightning',
        limitations: [
          'Salesforce-centric data model; aviation objects need custom build',
          'Per-user license cost scales with org growth',
          'Apex governor limits constrain bulk flows',
        ] },
      { name: 'ServiceNow App Engine', product: 'App Engine Studio + Flow Designer',
        limitations: [
          'Premium per-creator / per-fulfiller licensing',
          'Opinionated Now Experience UI is hard to deviate from',
          'Strong for ITSM, less idiomatic for field MX ops',
        ] },
      { name: 'Appian / OutSystems / Mendix', product: 'Low-code app platform',
        limitations: [
          'Runtime + per-user licensing tied to vendor',
          'Vendor lock-in via proprietary runtime',
          'Custom UX still needs platform-specific extensions',
        ] },
    ],
  },
  {
    category: 'Resource Scheduling',
    intro: 'Multi-row Gantt timeline, conflict detection, drag-to-reschedule.',
    vendors: [
      { name: 'Microsoft Power Platform', product: 'Power Apps galleries',
        limitations: [
          'Stock controls cannot render a multi-row Gantt',
          'Drag-to-reschedule + conflict detection require PCF',
          'No native crew duty/rest awareness',
        ] },
      { name: 'Salesforce Field Service', product: 'FSL + Scheduling Optimizer',
        limitations: [
          'Tied to Salesforce data model and per-user FSL licensing',
          'Optimizer tuned for FSM, not aviation crew rules',
          'Customizing the schedule UI requires LWC dev',
        ] },
      { name: 'ServiceNow FSM', product: 'Field Service Management',
        limitations: [
          'Per-license premium pricing',
          'Workforce engine is dispatch-centric, not aviation crew-aware',
          'Limited multi-row Gantt fidelity out of the box',
        ] },
      { name: 'Smartsheet / Quickbase', product: 'Hosted work platforms',
        limitations: [
          'Grid + Gantt hybrid feels like a spreadsheet, not an ops tool',
          'No real-time push; refresh-driven',
          'Per-user licensing scales linearly',
        ] },
    ],
  },
  {
    category: 'Analytics & Dashboards',
    intro: 'KPI tiles, drill-down, slicers, exec-friendly reports.',
    vendors: [
      { name: 'Microsoft Power BI', product: 'Power BI Pro / Premium',
        limitations: [
          'Pro per-user license or Premium Capacity required for E3 customers',
          'Embedding into a custom app pulls in additional licensing',
          'Authoring is best-in-class, but tightly coupled to Microsoft stack',
        ] },
      { name: 'Tableau', product: 'Tableau Cloud / Server (Salesforce)',
        limitations: [
          'Strong viz, but expensive per-user licensing',
          'Separate ecosystem from the operational app',
          'Embedding requires Tableau Embedded Analytics SKU',
        ] },
      { name: 'Looker', product: 'Looker (Google Cloud)',
        limitations: [
          'LookML semantic layer has a learning curve',
          'Per-user licensing; opinionated modeling',
          'Best when warehouse-first; less natural for transactional UX',
        ] },
      { name: 'Qlik / Sisense / ThoughtSpot', product: 'Enterprise BI suites',
        limitations: [
          'Per-user licensing, dashboard-centric tooling',
          'Embedding fidelity varies by SKU',
          'Operational drill-back to source data is limited',
        ] },
    ],
  },
  {
    category: 'Live Fleet & Mapping',
    intro: 'Custom-styled aircraft markers, real-time push updates, weather + status overlays.',
    vendors: [
      { name: 'Microsoft Power Platform', product: 'Power Apps Map control',
        limitations: [
          'Stock Map control too limited for custom markers',
          'Real-time updates are polling, not push',
          'Weather + status overlays require PCF',
        ] },
      { name: 'Esri ArcGIS', product: 'ArcGIS Platform / Online',
        limitations: [
          'Powerful but complex; specialist GIS skill required',
          'Expensive licensing and named-user model',
          'Heavy integration burden to wire to ops data',
        ] },
      { name: 'Mapbox / Google Maps Platform / HERE', product: 'Mapping SDKs',
        limitations: [
          'SDKs only — fleet UX is build-it-yourself',
          'Usage-based pricing scales with traffic',
          'No native ops/aviation data model',
        ] },
      { name: 'ForeFlight / Garmin Pilot', product: 'Aviation EFB apps',
        limitations: [
          'Pilot/cockpit focus, not operations dispatch',
          'Closed UIs, not extensible for ops workflows',
          'Per-pilot subscription model',
        ] },
      { name: 'Spidertracks / Blue Sky Network', product: 'Aviation tracking',
        limitations: [
          'Closed tracking portals, limited customization',
          'Hardware + per-aircraft subscription',
          'Difficult to merge with internal MX data',
        ] },
    ],
  },
  {
    category: 'Integrations',
    intro: 'Outlook, Teams, Veryon, CompleteFlight, SkyRouter, Entra ID SSO.',
    vendors: [
      { name: 'Microsoft Power Automate', product: '1000+ connectors',
        limitations: [
          'Premium Connector tax for non-Microsoft systems',
          'Throttling and per-flow run quotas',
          'Long-running flows require Premium tier',
        ] },
      { name: 'MuleSoft', product: 'Anypoint Platform (Salesforce)',
        limitations: [
          'Enterprise iPaaS — expensive, specialist skillset',
          'Heavy infrastructure for integration alone',
          'License model assumes Salesforce-anchored estate',
        ] },
      { name: 'Boomi', product: 'AtomSphere iPaaS',
        limitations: [
          'Mid-market iPaaS; per-connection pricing',
          'Custom connectors still required for niche aviation APIs',
          'UX of the integration tooling, not the end-user app',
        ] },
      { name: 'Workato', product: 'Modern iPaaS',
        limitations: [
          'Per-recipe pricing scales with automation count',
          'Data-residency and audit caveats for healthcare data',
          'Vendor-side runtime ownership',
        ] },
      { name: 'Zapier', product: 'SMB automation',
        limitations: [
          'Rate limits and no enterprise SLAs',
          'Not appropriate for HIPAA-bearing workflows',
          'Limited governance / audit tooling',
        ] },
    ],
  },
  {
    category: 'Mobile & Offline',
    intro: 'Field-staff mobile app, offline data entry, native push, biometric auth.',
    vendors: [
      { name: 'Microsoft Power Apps Mobile', product: 'Power Apps client',
        limitations: [
          'Per-app or per-user Premium licensing recurs forever',
          'UX is opinionated by Power Apps shell',
          'Custom-styled UI still needs PCF',
        ] },
      { name: 'Salesforce Mobile', product: 'Salesforce Mobile App',
        limitations: [
          'Tied to Salesforce data model',
          'Offline object-set limits and sync conflicts',
          'Per-user licensing',
        ] },
      { name: 'ServiceNow Now Mobile', product: 'Now Mobile + Mobile Studio',
        limitations: [
          'Decent offline, but Now-shaped UX',
          'Per-license cost',
          'Customization requires platform-specific tooling',
        ] },
      { name: 'AppSheet', product: 'Google AppSheet',
        limitations: [
          'Quick to stand up but UX customization is limited',
          'Performance ceilings on larger datasets',
          'Per-user licensing tied to Workspace',
        ] },
      { name: 'ProntoForms / GoCanvas / Mobile Tech Inc', product: 'Vendor FSM apps',
        limitations: [
          'Pre-built FSM apps, not bespoke field UX',
          'Forms-centric — limited operational workflow depth',
          'Per-seat subscription pricing',
        ] },
    ],
  },
  {
    category: 'Governance & Compliance',
    intro: 'DLP, HIPAA posture, tenant-wide audit, IT-managed administration.',
    vendors: [
      { name: 'Microsoft 365', product: 'Purview + Compliance Center',
        limitations: [
          'Best-in-class, but tied to M365 tenant scope',
          'Full feature set requires E5 SKU',
          'App built outside Power Platform sits outside this surface',
        ] },
      { name: 'Salesforce Shield', product: 'Encryption + Event Monitoring',
        limitations: [
          'Significant added cost on top of platform',
          'Limited to Salesforce-resident data',
          'Doesn\'t replace org-wide DLP / Purview',
        ] },
      { name: 'ServiceNow GRC', product: 'Governance, Risk, and Compliance',
        limitations: [
          'Strong for IT GRC, less aligned with field ops controls',
          'Per-license premium pricing',
          'Adds another platform IT must own',
        ] },
      { name: 'AWS / GCP / Azure native compliance', product: 'Cloud platform controls',
        limitations: [
          'Infra-layer compliance only',
          'App-layer controls (audit, DLP, retention) still on you',
          'Doesn\'t centralize policy across SaaS estate',
        ] },
    ],
  },
  {
    category: 'Long-term Flexibility',
    intro: 'Adding unanticipated features, scaling data, vendor portability, licensing tax at scale.',
    vendors: [
      { name: 'Microsoft Power Platform', product: 'Dataverse + Power Apps',
        limitations: [
          'Dataverse row + storage ceilings',
          'SKU-driven feature gating (Premium connectors, Per-App)',
          'Migration off-platform is non-trivial',
        ] },
      { name: 'Salesforce Platform', product: 'Lightning + Apex',
        limitations: [
          'Data-model lock-in via SF object schema',
          'Governor limits constrain heavy customization',
          'Org-wide ripple from local schema changes',
        ] },
      { name: 'ServiceNow', product: 'Now Platform',
        limitations: [
          'Heavy switching cost once invested',
          'Opinionated platform — features must fit Now patterns',
          'Per-license cost grows with adoption',
        ] },
      { name: 'Mendix / OutSystems / Appian / AppSheet', product: 'Low-code platforms',
        limitations: [
          'Proprietary runtime lock-in',
          'Per-user + runtime fees recur forever',
          'Migration requires full rewrite',
        ] },
    ],
  },
];

// MX Connect — Full Custom Build. The terminal option in every category list.
const CUSTOM = {
  name: 'MX Connect — Full Custom Build',
  product: 'React + Supabase + Microsoft Graph',
  tagline: 'No theoretical limitations',
  detail: 'Standard web stack, IHC-owned. No platform ceilings, no per-user platform tax, no vendor runtime to migrate off of later.',
};

export default function CapabilityComparison() {
  return (
    <div className="p-6">
      <Header />
      {CATEGORIES.map(c => <CategorySection key={c.category} {...c} />)}
      <DecisionFramework />
      <Footnote />
    </div>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="flex items-center gap-2 mb-1">
        <GitCompare size={20} style={{ color: FLUENT.brand }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>
          Capability Comparison · 3rd-Party Dev vs Full Custom Build
        </h1>
      </div>
      <div style={{ fontSize: 12, color: FLUENT.textSub, lineHeight: 1.55, maxWidth: 760 }}>
        Per capability area, the enterprise platforms that can deliver it and the
        limitations they bring. MX Connect — Full Custom Build sits last on every
        list with no theoretical limitations: it&apos;s the upper bound the others
        price themselves against.
      </div>
    </div>
  );
}

function CategorySection({ category, intro, vendors }) {
  return (
    <div style={{
      marginBottom: 16,
      background: FLUENT.surface,
      border: `1px solid ${FLUENT.border}`,
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px', background: FLUENT.bgAlt, borderBottom: `1px solid ${FLUENT.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: FLUENT.text }}>{category}</div>
        <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 2 }}>{intro}</div>
      </div>
      <div>
        {vendors.map((v, i) => <VendorRow key={i} vendor={v} index={i} />)}
        <CustomRow />
      </div>
    </div>
  );
}

function VendorRow({ vendor, index }) {
  return (
    <div style={{
      padding: '12px 14px',
      borderTop: index > 0 ? `1px solid ${FLUENT.border}` : 'none',
    }}>
      <div className="flex items-start gap-3">
        <Building2 size={16} style={{ color: FLUENT.textSub, marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span style={{ fontSize: 13, fontWeight: 600, color: FLUENT.text }}>{vendor.name}</span>
            <span style={{ fontSize: 11, color: FLUENT.textSub }}>· {vendor.product}</span>
          </div>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 11.5, color: FLUENT.text, lineHeight: 1.65 }}>
            {vendor.limitations.map((l, i) => (
              <li key={i} style={{ color: FLUENT.text }}>
                <span style={{ color: FLUENT.warnAccent, marginRight: 4 }}>•</span>
                <span style={{ color: FLUENT.text }}>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CustomRow() {
  return (
    <div style={{
      padding: '14px',
      borderTop: `1px solid ${FLUENT.border}`,
      background: FLUENT.brandSoft,
      borderLeft: `3px solid ${FLUENT.brand}`,
    }}>
      <div className="flex items-start gap-3">
        <Sparkles size={16} style={{ color: FLUENT.brand, marginTop: 2, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span style={{ fontSize: 13, fontWeight: 700, color: FLUENT.brandDeep }}>{CUSTOM.name}</span>
            <span style={{ fontSize: 11, color: FLUENT.textSub }}>· {CUSTOM.product}</span>
          </div>
          <div style={{
            display: 'inline-block',
            marginTop: 6,
            padding: '2px 8px',
            background: FLUENT.good,
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            borderRadius: 2,
          }}>
            {CUSTOM.tagline}
          </div>
          <div style={{ fontSize: 11.5, color: FLUENT.text, marginTop: 6, lineHeight: 1.65 }}>
            {CUSTOM.detail}
          </div>
        </div>
      </div>
    </div>
  );
}

function DecisionFramework() {
  return (
    <div className="mt-6 p-4" style={{
      background: FLUENT.surface,
      border: `1px solid ${FLUENT.border}`,
      borderRadius: 4,
    }}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={14} style={{ color: FLUENT.warnAccent }} />
        <div style={{ fontSize: 13, fontWeight: 600 }}>How to read this list</div>
      </div>
      <div style={{ fontSize: 11.5, color: FLUENT.text, lineHeight: 1.65 }}>
        Every 3rd-party platform listed above can deliver the capability — that&apos;s
        why they&apos;re on the list. The limitations are the trade-offs IHC inherits
        if it adopts that platform: licensing tax, vendor lock-in, UX ceilings, or
        platform-shaped data model. The full custom build has no theoretical
        limitations because there is no platform between IHC and the code. The
        trade-off it carries — higher upfront build cost — is captured separately
        on the Cost Analysis page.
      </div>
    </div>
  );
}

function Footnote() {
  return (
    <div className="mt-4 p-3" style={{
      background: FLUENT.bgAlt,
      borderRadius: 4,
      fontSize: 11, color: FLUENT.textSub, lineHeight: 1.65,
    }}>
      <strong style={{ color: FLUENT.text }}>Limitations are theoretical caps, not deal-breakers.</strong>{' '}
      Most 3rd-party platforms can be pushed past their stock ceilings with custom
      development (PCF for Power Platform, LWC for Salesforce, UI Builder for
      ServiceNow). When that happens, the cost and complexity advantage of the
      platform narrows. The full custom build is what you get if you skip that
      detour entirely.
    </div>
  );
}
