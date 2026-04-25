import React from 'react';
import { CheckCircle2, AlertCircle, XCircle, Minus, GitCompare } from 'lucide-react';
import { FLUENT } from '../tokens';

// Honest side-by-side. Some rows favor M365, some favor custom, some are tied.

const ROWS = [
  {
    category: 'Forms & Approvals',
    capabilities: [
      { item: 'Submission forms (MX, Time Off, Safety, etc.)',     m365: 'native',   custom: 'native',   note: 'Microsoft Forms vs custom React forms — both work well' },
      { item: 'Multi-step approval workflows',                     m365: 'native',   custom: 'native',   note: 'Power Automate vs custom Edge Functions' },
      { item: 'Adaptive Card approvals in Teams',                  m365: 'native',   custom: 'caveat',   note: 'M365 wins — native; custom would need Graph webhook integration' },
      { item: 'Audit trail',                                       m365: 'native',   custom: 'native',   note: 'Microsoft Purview vs Postgres audit log' },
    ],
  },
  {
    category: 'Resource Scheduling',
    capabilities: [
      { item: 'Multi-row Gantt timeline',                          m365: 'pcf',      custom: 'native',   note: 'Stock Power Apps cannot — PCF custom component required' },
      { item: 'Auto-detect scheduling conflicts',                  m365: 'pcf',      custom: 'native',   note: 'PCF logic — not stock' },
      { item: 'Drag-to-reschedule events',                         m365: 'pcf',      custom: 'native',   note: 'PCF custom component' },
      { item: 'Region/aircraft filter views',                      m365: 'native',   custom: 'native',   note: 'Stock filtering works in Power Apps galleries' },
    ],
  },
  {
    category: 'Analytics & Dashboards',
    capabilities: [
      { item: 'KPI cards & metric tiles',                          m365: 'native',   custom: 'native',   note: 'Power BI vs custom React — Power BI looks better OOTB' },
      { item: 'Drill-down & cross-filtering',                      m365: 'native',   custom: 'caveat',   note: 'M365 wins — Power BI is best-in-class for this' },
      { item: 'Slicers & report-level filtering',                  m365: 'native',   custom: 'caveat',   note: 'M365 wins — Power BI native; custom build would need significant work' },
      { item: 'Self-service analytics for end-users',              m365: 'native',   custom: 'no',       note: 'M365 wins decisively — Power BI was built for this' },
      { item: 'Exec-friendly reports/exports',                     m365: 'native',   custom: 'caveat',   note: 'M365 wins — Power BI Excel/PDF/PPT export native' },
    ],
  },
  {
    category: 'Live Fleet & Mapping',
    capabilities: [
      { item: 'Map with custom-styled aircraft markers',           m365: 'pcf',      custom: 'native',   note: 'Stock Power Apps Map control too limited; PCF can match custom' },
      { item: 'Real-time push updates (<1s)',                      m365: 'caveat',   custom: 'native',   note: 'M365 polls; custom uses WebSocket via Supabase Realtime' },
      { item: 'SkyRouter API integration',                         m365: 'native',   custom: 'native',   note: 'Both via Power Automate or Edge Function — comparable' },
      { item: 'Weather + status banner overlays',                  m365: 'pcf',      custom: 'native',   note: 'Custom styling not available in stock Power Apps Map' },
    ],
  },
  {
    category: 'Integrations',
    capabilities: [
      { item: 'Microsoft Outlook (calendar sync)',                 m365: 'native',   custom: 'caveat',   note: 'M365 wins — built-in; custom uses Graph API (works fine)' },
      { item: 'Microsoft Teams (channels, DMs)',                   m365: 'native',   custom: 'caveat',   note: 'M365 wins — built-in; custom uses Graph webhooks' },
      { item: 'Veryon (Flightdocs)',                               m365: 'native',   custom: 'native',   note: 'Both via Premium Connector or Edge Function' },
      { item: 'CompleteFlight (cert tracking)',                    m365: 'native',   custom: 'native',   note: 'Both require custom integration work' },
      { item: 'TrooTrax',                                          m365: 'native',   custom: 'native',   note: 'Both via API call layer' },
      { item: 'Entra ID SSO',                                      m365: 'native',   custom: 'native',   note: 'Custom uses Supabase Auth + Entra OIDC' },
    ],
  },
  {
    category: 'Mobile & Offline',
    capabilities: [
      { item: 'Mobile app for field staff',                        m365: 'native',   custom: 'native',   note: 'Power Apps Mobile vs PWA — both work, different UX' },
      { item: 'Offline data entry & sync',                         m365: 'native',   custom: 'caveat',   note: 'M365 wins — native offline in Power Apps; custom needs work' },
      { item: 'Native push notifications',                         m365: 'native',   custom: 'caveat',   note: 'Power Apps Mobile vs PWA — M365 slightly easier' },
      { item: 'Biometric auth on mobile',                          m365: 'native',   custom: 'caveat',   note: 'Power Apps Mobile native; custom PWA via WebAuthn' },
    ],
  },
  {
    category: 'Governance & Compliance',
    capabilities: [
      { item: 'DLP policies & data classification',                m365: 'native',   custom: 'caveat',   note: 'M365 wins — Microsoft Purview native; custom needs implementation' },
      { item: 'HIPAA compliance posture',                          m365: 'native',   custom: 'caveat',   note: 'M365 already certified; custom inherits Supabase HIPAA but needs validation' },
      { item: 'Tenant-wide audit & retention',                     m365: 'native',   custom: 'caveat',   note: 'M365 wins — Compliance Center native' },
      { item: 'IT-managed via existing tenant',                    m365: 'native',   custom: 'no',       note: 'M365 wins — same admin surface IT already uses' },
    ],
  },
  {
    category: 'Long-term Flexibility',
    capabilities: [
      { item: 'Easy to add unanticipated features',                m365: 'caveat',   custom: 'native',   note: 'Custom wins — no platform ceilings' },
      { item: 'Performance with growing data',                     m365: 'caveat',   custom: 'native',   note: 'Custom wins past ~50k rows; SharePoint Lists hit limits' },
      { item: 'Migration path if vendor relationship changes',     m365: 'no',       custom: 'native',   note: 'Custom wins — standard Postgres/React, portable' },
      { item: 'Per-user licensing tax at scale',                   m365: 'caveat',   custom: 'native',   note: 'Custom has none; M365 has Power Apps Premium per-user' },
    ],
  },
];

const STATE = {
  native:  { Icon: CheckCircle2, color: FLUENT.good,        bg: FLUENT.goodSoft,  label: 'Native' },
  pcf:     { Icon: AlertCircle,  color: FLUENT.pcfBadge,    bg: FLUENT.pcfBadgeSoft, label: 'PCF needed' },
  caveat:  { Icon: AlertCircle,  color: FLUENT.warnAccent,  bg: FLUENT.warnSoft,  label: 'With caveats' },
  no:      { Icon: XCircle,      color: FLUENT.bad,         bg: FLUENT.badSoft,   label: 'Not really' },
  tied:    { Icon: Minus,        color: FLUENT.textSub,     bg: FLUENT.bgAlt,     label: 'Tied' },
};

export default function CapabilityComparison() {
  // Tally
  let m365Wins = 0, customWins = 0, ties = 0;
  ROWS.forEach(c => c.capabilities.forEach(cap => {
    const m = STATE[cap.m365], c2 = STATE[cap.custom];
    const score = (s) => s === 'native' ? 3 : s === 'pcf' ? 2 : s === 'caveat' ? 1 : 0;
    const ms = score(cap.m365), cs = score(cap.custom);
    if (ms > cs) m365Wins++;
    else if (cs > ms) customWins++;
    else ties++;
  }));

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <GitCompare size={20} style={{ color: FLUENT.brand }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Capability Comparison</h1>
      </div>
      <div style={{ fontSize: 12, color: FLUENT.textSub, marginBottom: 16 }}>
        Honest side-by-side. Both approaches solve the operational problem. The right choice depends on which trade-offs match IHC's constraints.
      </div>

      {/* Tally summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3" style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2 }}>
          <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>M365 advantages</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: FLUENT.brand, marginTop: 4 }}>{m365Wins} <span style={{ fontSize: 12, color: FLUENT.textSub, fontWeight: 400 }}>capabilities</span></div>
          <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 4 }}>Strongest in: analytics, governance, native MS integration</div>
        </div>
        <div className="p-3" style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2 }}>
          <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Custom advantages</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: FLUENT.brand, marginTop: 4 }}>{customWins} <span style={{ fontSize: 12, color: FLUENT.textSub, fontWeight: 400 }}>capabilities</span></div>
          <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 4 }}>Strongest in: real-time, flexibility, no licensing tax</div>
        </div>
        <div className="p-3" style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2 }}>
          <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Comparable</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: FLUENT.brand, marginTop: 4 }}>{ties} <span style={{ fontSize: 12, color: FLUENT.textSub, fontWeight: 400 }}>capabilities</span></div>
          <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 4 }}>Both approaches work fine</div>
        </div>
      </div>

      {/* Categories */}
      {ROWS.map(category => (
        <div key={category.category} className="mb-4" style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2, overflow: 'hidden' }}>
          <div className="px-3 py-2" style={{ background: FLUENT.bgAlt, borderBottom: `1px solid ${FLUENT.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{category.category}</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
                <th style={{ padding: '6px 12px', fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', width: '40%' }}>Capability</th>
                <th style={{ padding: '6px 12px', fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', width: '15%' }}>M365 Build</th>
                <th style={{ padding: '6px 12px', fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', width: '15%' }}>Custom (MX Connect)</th>
                <th style={{ padding: '6px 12px', fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'left', width: '30%' }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {category.capabilities.map((cap, i) => (
                <tr key={i} style={{ borderBottom: i < category.capabilities.length - 1 ? `1px solid ${FLUENT.border}` : 'none' }}>
                  <td style={{ padding: '8px 12px', fontSize: 12 }}>{cap.item}</td>
                  <td style={{ padding: '8px 12px' }}><StateChip state={cap.m365} /></td>
                  <td style={{ padding: '8px 12px' }}><StateChip state={cap.custom} /></td>
                  <td style={{ padding: '8px 12px', fontSize: 11, color: FLUENT.textSub }}>{cap.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {/* Decision framework */}
      <div className="mt-6 p-4" style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Decision framework</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: FLUENT.brand, marginBottom: 6 }}>Pick M365 if...</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, lineHeight: 1.7, color: FLUENT.text }}>
              <li>IHC IT prefers consolidating on Microsoft</li>
              <li>Analytics is the highest-priority outcome (Power BI is best-in-class)</li>
              <li>Hiring an internal Senior FS Lead in Utah is a problem you don't want to solve</li>
              <li>Per-user Premium licensing fits operational budget</li>
              <li>Governance/compliance maturity matters more than flexibility</li>
            </ul>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: FLUENT.brand, marginBottom: 6 }}>Pick Custom if...</div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, lineHeight: 1.7, color: FLUENT.text }}>
              <li>Real-time fleet visibility is mission-critical, not nice-to-have</li>
              <li>Resource Scheduler UX is core to daily MX scheduling work</li>
              <li>Significant feature evolution expected (drone, predictive MX, ML)</li>
              <li>Long-term TCO matters more than time-to-first-deploy</li>
              <li>Vendor portability matters (no Microsoft lock-in)</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${FLUENT.border}`, fontSize: 11, color: FLUENT.textSub, lineHeight: 1.6 }}>
          <strong>Both options solve the operational problem.</strong> The choice should be made on IHC's specific constraints — IT preferences, hiring environment, existing M365 contract terms, governance posture — not on which has more checkmarks above.
        </div>
      </div>
    </div>
  );
}

function StateChip({ state }) {
  const s = STATE[state];
  const Icon = s.Icon;
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ background: s.bg, color: s.color, padding: '2px 7px', borderRadius: 2, fontSize: 11, fontWeight: 600 }}
    >
      <Icon size={11} />
      {s.label}
    </span>
  );
}
