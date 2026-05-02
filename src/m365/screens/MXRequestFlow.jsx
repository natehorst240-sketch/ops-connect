import React, { useState } from 'react';
import {
  CheckCircle2, ArrowRight, MessageSquare, Calendar, FileText,
  Workflow, User, Plane, Clock, AlertCircle, Sparkles,
  Mail, Database, Check, X as XIcon, RefreshCcw, Send,
} from 'lucide-react';
import { FLUENT } from '../tokens';

// ============================================================================
// MX REQUEST FLOW — Phase 1 deliverable hero demo
// ----------------------------------------------------------------------------
// Walks through the complete Request → Approval pipeline:
//   1. AMT submits MX Request via Power Apps form
//   2. Power Automate flow triggers, composes Adaptive Card, posts to Teams
//   3. RMM receives card in Teams, approves/denies
//   4. Dataverse updated, calendar event created, requestor notified
//
// Built entirely with Power Apps + Power Automate + Teams + Dataverse.
// No PCF, no custom code, no third-party dependencies. This IS Phase 1.
// ============================================================================

const STEPS = [
  { id: 'submit', label: 'Submit',  desc: 'Power Apps form',   Icon: FileText },
  { id: 'flow',   label: 'Flow',    desc: 'Power Automate',     Icon: Workflow },
  { id: 'teams',  label: 'Approve', desc: 'Adaptive Card',      Icon: MessageSquare },
  { id: 'result', label: 'Result',  desc: 'Audit + notify',     Icon: CheckCircle2 },
];

const DEFAULT_REQUEST = {
  tail: 'N431HC',
  acType: 'AW109SP',
  type: 'Phase Inspection',
  windowStart: 'Tue, Apr 29 · 0700',
  windowEnd:   'Wed, Apr 30 · 1700',
  base: 'Logan',
  reason: 'Due in 4 days. Coordinating with N251HC pre-positioning to keep Logan covered.',
  priority: 'Normal',
  requestedBy: { name: 'Brent Sandoval', role: 'AMT', initials: 'BS' },
  approver:    { name: 'Steve Taul',     role: 'RMM · Logan region', initials: 'ST' },
};

export default function MXRequestFlow() {
  const [step, setStep] = useState('submit');
  const [decision, setDecision] = useState(null);
  const [request, setRequest] = useState(DEFAULT_REQUEST);

  const restart = () => { setDecision(null); setStep('submit'); };
  const approve = (comment) => { setDecision({ outcome: 'approved', comment, at: 'just now' }); setStep('result'); };
  const deny    = (comment) => { setDecision({ outcome: 'denied',   comment, at: 'just now' }); setStep('result'); };

  return (
    <div className="p-6">
      <Phase1Banner />
      <Header />
      <StepIndicator currentId={step} decision={decision} onClick={setStep} />

      <div style={{ marginTop: 16 }}>
        {step === 'submit' && <SubmitStep request={request} setRequest={setRequest} onNext={() => setStep('flow')} />}
        {step === 'flow'   && <FlowStep request={request} onNext={() => setStep('teams')} />}
        {step === 'teams'  && <TeamsStep request={request} onApprove={approve} onDeny={deny} />}
        {step === 'result' && <ResultStep request={request} decision={decision} onRestart={restart} />}
      </div>

      <Footer />
    </div>
  );
}

// ============================================================================
// CHROME
// ============================================================================

function Phase1Banner() {
  return (
    <div
      className="flex items-center gap-3 mb-3 px-3 py-2"
      style={{
        background: FLUENT.brandSoft,
        border: `1px solid ${FLUENT.brand}33`,
        borderLeft: `3px solid ${FLUENT.brand}`,
        borderRadius: 2,
      }}
    >
      <Sparkles size={16} style={{ color: FLUENT.brand }} />
      <div className="flex-1">
        <div style={{ fontSize: 12, fontWeight: 600, color: FLUENT.brandDeep }}>
          Phase 1 deliverable · Request → Approval · Stock Power Apps + Power Automate + Teams
        </div>
        <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 1 }}>
          The greenlit hero workflow. No PCF, no Power BI, no custom code — entirely native M365.
        </div>
      </div>
      <span
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          background: FLUENT.brand, color: '#fff',
          padding: '2px 6px', borderRadius: 2,
        }}
      >
        PHASE 1
      </span>
    </div>
  );
}

function Header() {
  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <Workflow size={20} style={{ color: FLUENT.brand }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>MX Request</h1>
      </div>
      <div style={{ fontSize: 13, color: FLUENT.textSub, marginBottom: 16 }}>
        Walk through the full pipeline — click through each stage to see what the AMT, the flow engine, the RMM, and the audit trail each see.
      </div>
    </>
  );
}

function StepIndicator({ currentId, decision, onClick }) {
  const currentIdx = STEPS.findIndex(s => s.id === currentId);
  return (
    <div className="flex items-center" style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2, padding: 10 }}>
      {STEPS.map((s, i) => {
        const done = i < currentIdx || (s.id === 'result' && decision);
        const active = s.id === currentId;
        const failed = s.id === 'result' && decision?.outcome === 'denied';
        const color = failed ? FLUENT.bad : done || active ? FLUENT.brand : FLUENT.textSub;
        return (
          <React.Fragment key={s.id}>
            <button
              onClick={() => onClick(s.id)}
              className="flex items-center gap-2 px-3 py-1.5"
              style={{
                background: active ? FLUENT.brandSoft : 'transparent',
                border: active ? `1px solid ${FLUENT.brand}` : '1px solid transparent',
                borderRadius: 2, cursor: 'pointer',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 24, height: 24, borderRadius: 12,
                  background: done && !failed ? FLUENT.brand : failed ? FLUENT.bad : 'transparent',
                  border: !done && !active ? `1.5px solid ${FLUENT.borderStrong}` : 'none',
                  color: done || active ? (failed ? '#fff' : '#fff') : FLUENT.textSub,
                  fontSize: 11, fontWeight: 700,
                }}
              >
                {done && !failed ? <Check size={13} /> : failed ? <XIcon size={13} /> : i + 1}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color }}>{s.label}</div>
                <div style={{ fontSize: 10, color: FLUENT.textSub }}>{s.desc}</div>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <ArrowRight size={14} style={{ color: FLUENT.textDim, margin: '0 4px' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// STEP 1 — SUBMIT (Power Apps form)
// ============================================================================

function SubmitStep({ request, setRequest, onNext }) {
  return (
    <SurfaceCard
      label="As Brent (AMT) on his phone · Power Apps Mobile"
      title="Submit MX Request"
      icon={<FileText size={14} />}
    >
      <div style={{ background: FLUENT.bg, padding: 16, border: `1px solid ${FLUENT.border}`, borderRadius: 4 }}>
        <FormField label="Aircraft">
          <SelectMock value={`${request.tail} · ${request.acType}`} />
        </FormField>
        <FormField label="MX Type">
          <SelectMock value={request.type} />
        </FormField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormField label="Window start">
            <InputMock value={request.windowStart} />
          </FormField>
          <FormField label="Window end">
            <InputMock value={request.windowEnd} />
          </FormField>
        </div>
        <FormField label="Base">
          <SelectMock value={request.base} />
        </FormField>
        <FormField label="Reason / notes">
          <textarea
            value={request.reason}
            onChange={e => setRequest({ ...request, reason: e.target.value })}
            rows={3}
            style={{
              width: '100%', padding: 8, fontSize: 12,
              border: `1px solid ${FLUENT.borderStrong}`, borderRadius: 2,
              fontFamily: 'inherit', resize: 'vertical', background: FLUENT.surface,
            }}
          />
        </FormField>
        <FormField label="Priority">
          <RadioGroup
            options={['Normal', 'High', 'AOG']}
            value={request.priority}
            onChange={v => setRequest({ ...request, priority: v })}
          />
        </FormField>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div style={{ fontSize: 11, color: FLUENT.textSub }}>
          Submitting writes one row to <span style={{ fontFamily: 'ui-monospace, monospace' }}>cr_mx_request</span> in Dataverse.
        </div>
        <button onClick={onNext} style={primaryBtn}>
          Submit · Trigger flow <ArrowRight size={12} />
        </button>
      </div>
    </SurfaceCard>
  );
}

// ============================================================================
// STEP 2 — FLOW (Power Automate)
// ============================================================================

function FlowStep({ request, onNext }) {
  const flowSteps = [
    { Icon: Database, title: 'Trigger', sub: `When a row is added to cr_mx_request` },
    { Icon: Database, title: 'Get aircraft', sub: `Lookup ${request.tail} in cr_aircraft · fetch region + RMM` },
    { Icon: Workflow, title: 'Compose Adaptive Card', sub: `Tail, type, window, requestor, reason, priority · Approve / Deny actions` },
    { Icon: MessageSquare, title: 'Post to Teams', sub: `Channel: Logan RMM · Mention: ${request.approver.name}` },
    { Icon: Clock, title: 'Wait for response', sub: `Timeout: 24h · SLA escalation if no decision` },
    { Icon: Mail, title: 'On approve', sub: `Update status → Approved · Create Outlook event · DM requestor` },
    { Icon: Mail, title: 'On deny', sub: `Update status → Denied · DM requestor with reason` },
  ];
  return (
    <SurfaceCard
      label="Power Automate · mxr-approval-flow-v2"
      title="Flow runs server-side"
      icon={<Workflow size={14} />}
    >
      <div style={{ background: FLUENT.bg, padding: 16, border: `1px solid ${FLUENT.border}`, borderRadius: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {flowSteps.map((s, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3"
              style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2 }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: 28, height: 28, borderRadius: 4, background: FLUENT.brandSoft, color: FLUENT.brand }}
              >
                <s.Icon size={14} />
              </div>
              <div className="flex-1">
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 11, color: FLUENT.textSub, lineHeight: 1.45 }}>
                  {s.sub}
                </div>
              </div>
              <div style={{ fontSize: 10, color: FLUENT.good, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                OK
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div style={{ fontSize: 11, color: FLUENT.textSub }}>
          End-to-end flow run: <strong>~ 1.4 s</strong>. Adaptive Card posts to Teams channel.
        </div>
        <button onClick={onNext} style={primaryBtn}>
          See the Teams card <ArrowRight size={12} />
        </button>
      </div>
    </SurfaceCard>
  );
}

// ============================================================================
// STEP 3 — TEAMS (Adaptive Card)
// ============================================================================

function TeamsStep({ request, onApprove, onDeny }) {
  const [comment, setComment] = useState('');
  return (
    <SurfaceCard
      label={`As ${request.approver.name} (${request.approver.role}) in Microsoft Teams`}
      title="Adaptive Card in the Logan RMM channel"
      icon={<MessageSquare size={14} />}
    >
      <div style={{ background: '#f5f5f5', padding: 16, border: `1px solid ${FLUENT.border}`, borderRadius: 4 }}>
        <div className="flex items-start gap-2 mb-2">
          <div
            className="flex items-center justify-center shrink-0"
            style={{ width: 28, height: 28, borderRadius: 14, background: '#6264a7', color: '#fff', fontSize: 11, fontWeight: 700 }}
          >
            BS
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{request.requestedBy.name}</div>
            <div style={{ fontSize: 10, color: FLUENT.textSub }}>via MX Connect bot · just now</div>
          </div>
        </div>

        <div
          style={{
            background: '#fff',
            border: `1px solid ${FLUENT.border}`,
            borderTop: `3px solid ${FLUENT.brand}`,
            borderRadius: 4,
            overflow: 'hidden',
          }}
        >
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.brand, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
              MX Request · Approval needed
            </div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {request.tail} · {request.type}
            </div>
          </div>

          <div className="px-4 py-3" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: 12 }}>
            <CardField label="Aircraft" value={`${request.tail} · ${request.acType}`} />
            <CardField label="Window" value={`${request.windowStart} → ${request.windowEnd}`} />
            <CardField label="Base" value={request.base} />
            <CardField label="Priority" value={request.priority} />
            <CardField label="Requestor" value={`${request.requestedBy.name} (${request.requestedBy.role})`} />
            <CardField label="Reason" value={request.reason} />
          </div>

          <div className="px-4 py-3" style={{ borderTop: `1px solid ${FLUENT.border}`, background: '#fafafa' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.text, marginBottom: 4 }}>
              Comment (optional, attached to audit log)
            </div>
            <input
              type="text"
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Add a note before deciding…"
              style={{
                width: '100%', padding: '6px 8px', fontSize: 12,
                border: `1px solid ${FLUENT.borderStrong}`, borderRadius: 2,
                background: '#fff',
              }}
            />
          </div>

          <div className="px-4 py-3 flex gap-2" style={{ borderTop: `1px solid ${FLUENT.border}`, background: '#fafafa' }}>
            <button
              onClick={() => onApprove(comment)}
              style={{
                background: FLUENT.brand, color: '#fff',
                border: 'none', padding: '6px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                borderRadius: 2, display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Check size={13} /> Approve
            </button>
            <button
              onClick={() => onDeny(comment)}
              style={{
                background: '#fff', color: FLUENT.bad,
                border: `1px solid ${FLUENT.bad}80`, padding: '6px 14px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                borderRadius: 2, display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <XIcon size={13} /> Deny
            </button>
            <div className="flex-1" />
            <button
              style={{
                background: 'transparent', color: FLUENT.textSub,
                border: 'none', padding: '6px 8px',
                fontSize: 12, cursor: 'pointer',
              }}
            >
              Open in MX Connect →
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3" style={{ fontSize: 11, color: FLUENT.textSub }}>
        Card actions are wired to the parent flow via the Teams “Wait for response” step. The flow resumes the moment a button is clicked.
      </div>
    </SurfaceCard>
  );
}

// ============================================================================
// STEP 4 — RESULT (audit + notify)
// ============================================================================

function ResultStep({ request, decision, onRestart }) {
  const approved = decision?.outcome === 'approved';
  const accent = approved ? FLUENT.good : FLUENT.bad;
  const accentSoft = approved ? FLUENT.goodSoft : FLUENT.badSoft;
  return (
    <SurfaceCard
      label="Server-side outcome"
      title={approved ? 'Approved' : 'Denied'}
      icon={approved ? <Check size={14} /> : <XIcon size={14} />}
      accent={accent}
    >
      <div
        style={{
          background: accentSoft, border: `1px solid ${accent}40`,
          borderLeft: `3px solid ${accent}`, borderRadius: 2,
          padding: 12, marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
          {approved ? 'Approved' : 'Denied'} by {request.approver.name}
        </div>
        <div style={{ fontSize: 11, color: FLUENT.text, lineHeight: 1.5 }}>
          Decision recorded {decision?.at}.{decision?.comment ? ` Comment: “${decision.comment}”` : ''}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <ResultPanel
          icon={<Database size={14} />}
          title="Dataverse update"
          rows={[
            { label: 'Table', value: 'cr_mx_request' },
            { label: 'Status', value: approved ? 'Approved' : 'Denied' },
            { label: 'Approver', value: request.approver.name },
            { label: 'Decided at', value: decision?.at || '—' },
          ]}
        />
        {approved ? (
          <ResultPanel
            icon={<Calendar size={14} />}
            title="Outlook calendar"
            rows={[
              { label: 'Event', value: `${request.tail} · ${request.type}` },
              { label: 'Window', value: request.windowStart },
              { label: 'Calendar', value: 'Logan MX Calendar' },
              { label: 'Attendees', value: 'AMT pool, Logan' },
            ]}
          />
        ) : (
          <ResultPanel
            icon={<Mail size={14} />}
            title="Requestor notified"
            rows={[
              { label: 'To', value: `${request.requestedBy.name} (DM)` },
              { label: 'Channel', value: 'Microsoft Teams' },
              { label: 'Body', value: 'Your MX request was denied. See comment.' },
            ]}
          />
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <ResultPanel
          icon={<FileText size={14} />}
          title="Audit log entry"
          rows={[
            { label: 'Event', value: `mx_request.${approved ? 'approved' : 'denied'}` },
            { label: 'Actor', value: `${request.approver.name} · ${request.approver.role}` },
            { label: 'Subject', value: `${request.tail} — ${request.type}` },
            { label: 'When', value: decision?.at || '—' },
            { label: 'Retention', value: 'Per Microsoft Purview policy · 7 yr' },
          ]}
          full
        />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div style={{ fontSize: 11, color: FLUENT.textSub }}>
          Total wall-clock: <strong>request to decision</strong> usually under 2 hours during shift hours, vs days under the current paper/email process.
        </div>
        <button onClick={onRestart} style={primaryBtn}>
          <RefreshCcw size={12} /> Run again
        </button>
      </div>
    </SurfaceCard>
  );
}

function ResultPanel({ icon, title, rows, full }) {
  return (
    <div
      style={{
        gridColumn: full ? '1 / -1' : 'auto',
        background: FLUENT.surface, border: `1px solid ${FLUENT.border}`,
        borderRadius: 2, padding: 12,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div style={{ color: FLUENT.brand }}>{icon}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {title}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 12 }}>
        {rows.map((r, i) => (
          <React.Fragment key={i}>
            <div style={{ color: FLUENT.textSub }}>{r.label}</div>
            <div style={{ color: FLUENT.text, fontWeight: 500 }}>{r.value}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SHARED PRIMITIVES
// ============================================================================

function SurfaceCard({ label, title, icon, accent, children }) {
  return (
    <div
      style={{
        background: FLUENT.surface, border: `1px solid ${FLUENT.border}`,
        borderTop: `3px solid ${accent || FLUENT.brand}`,
        borderRadius: 2, padding: 14,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="flex items-center justify-center"
          style={{ width: 22, height: 22, borderRadius: 4, background: accent ? `${accent}20` : FLUENT.brandSoft, color: accent || FLUENT.brand }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {label}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.text, marginBottom: 4 }}>{label}</div>
      {children}
    </div>
  );
}

function InputMock({ value }) {
  return (
    <div
      style={{
        padding: '6px 10px', fontSize: 12,
        border: `1px solid ${FLUENT.borderStrong}`,
        background: FLUENT.surface,
        borderRadius: 2, color: FLUENT.text,
      }}
    >
      {value}
    </div>
  );
}

function SelectMock({ value }) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: '6px 10px', fontSize: 12,
        border: `1px solid ${FLUENT.borderStrong}`,
        background: FLUENT.surface,
        borderRadius: 2, color: FLUENT.text,
      }}
    >
      <span>{value}</span>
      <span style={{ color: FLUENT.textSub, fontSize: 10 }}>▾</span>
    </div>
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-2">
      {options.map(opt => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            style={{
              padding: '5px 12px', fontSize: 12, fontWeight: active ? 600 : 400,
              background: active ? FLUENT.brandSoft : FLUENT.surface,
              color: active ? FLUENT.brandDeep : FLUENT.text,
              border: `1px solid ${active ? FLUENT.brand : FLUENT.borderStrong}`,
              borderRadius: 2, cursor: 'pointer',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function CardField({ label, value }) {
  return (
    <>
      <div style={{ color: FLUENT.textSub, fontWeight: 600 }}>{label}</div>
      <div style={{ color: FLUENT.text }}>{value}</div>
    </>
  );
}

const primaryBtn = {
  background: FLUENT.brand, color: '#fff',
  border: 'none', padding: '6px 14px',
  fontSize: 12, fontWeight: 600, cursor: 'pointer',
  borderRadius: 2, display: 'flex', alignItems: 'center', gap: 6,
};

function Footer() {
  return (
    <div
      className="mt-4 px-3 py-2 flex items-center gap-3 flex-wrap"
      style={{
        background: FLUENT.bgAlt,
        border: `1px solid ${FLUENT.border}`,
        borderRadius: 2,
        fontSize: 10.5, color: FLUENT.textSub,
      }}
    >
      <strong style={{ color: FLUENT.text, fontWeight: 600 }}>Phase 1 stack:</strong>
      <span>Power Apps (canvas)</span>
      <span style={{ color: FLUENT.textDim }}>+</span>
      <span>Power Automate</span>
      <span style={{ color: FLUENT.textDim }}>+</span>
      <span>Teams (Adaptive Card)</span>
      <span style={{ color: FLUENT.textDim }}>+</span>
      <span>Dataverse (state + audit)</span>
      <span style={{ color: FLUENT.textDim }}>+</span>
      <span>Outlook (calendar)</span>
      <span style={{ color: FLUENT.textDim }}>·</span>
      <span>No PCF · No Power BI · No third-party</span>
    </div>
  );
}
