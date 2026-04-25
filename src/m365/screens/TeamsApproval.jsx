import React, { useState } from 'react';
import {
  MessageSquare, CheckCircle2, ArrowRight, Send, Clock,
  Phone, Video, MoreHorizontal, Smile, Paperclip, Hash,
} from 'lucide-react';
import { FLUENT } from '../tokens';

// Teams Adaptive Card approval flow — visualizes how M365 lets approvals happen
// inside Teams without leaving the conversation. This is a genuine M365 strength.

export default function TeamsApproval() {
  const [approvalState, setApprovalState] = useState('pending');  // pending | approved | denied

  return (
    <div className="p-6 h-full" style={{ background: FLUENT.bg }}>
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare size={20} style={{ color: '#5059c9' }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Teams Approvals</h1>
      </div>
      <div style={{ fontSize: 12, color: FLUENT.textSub, marginBottom: 16 }}>
        Adaptive Cards posted to Teams channels · Approve in-line without leaving Teams · Native to M365
      </div>

      <div
        className="flex items-start gap-3 mb-4 p-3"
        style={{ background: FLUENT.goodSoft, border: `1px solid ${FLUENT.good}33`, borderLeft: `3px solid ${FLUENT.good}`, borderRadius: 2 }}
      >
        <CheckCircle2 size={16} style={{ color: FLUENT.good, marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: FLUENT.text, lineHeight: 1.5 }}>
          <strong>This is genuinely better in M365.</strong> Adaptive Cards make approvals first-class in the platform people already have open. No app to learn, no second tool to check. The custom build can replicate this via Microsoft Graph webhooks but the M365 path is more native.
        </div>
      </div>

      {/* Mock Teams interface */}
      <TeamsWindow approvalState={approvalState} setApprovalState={setApprovalState} />
    </div>
  );
}

function TeamsWindow({ approvalState, setApprovalState }) {
  return (
    <div
      style={{
        background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 4,
        overflow: 'hidden', maxWidth: 900, margin: '0 auto',
      }}
    >
      {/* Teams chrome */}
      <div className="flex items-center gap-3 px-4 py-3" style={{ background: '#f5f5f5', borderBottom: `1px solid ${FLUENT.border}` }}>
        <Hash size={16} style={{ color: FLUENT.textSub }} />
        <div className="flex-1">
          <div style={{ fontSize: 14, fontWeight: 600 }}>mx-ops-wymt</div>
          <div style={{ fontSize: 11, color: FLUENT.textSub }}>Posts · Files · Wiki</div>
        </div>
        <Phone size={16} style={{ color: FLUENT.textSub }} />
        <Video size={16} style={{ color: FLUENT.textSub }} />
        <MoreHorizontal size={16} style={{ color: FLUENT.textSub }} />
      </div>

      <div className="p-4 space-y-4" style={{ background: '#fff', minHeight: 400 }}>
        {/* Earlier message */}
        <UserMessage
          name="Nathan Anderson"
          time="14:18"
          avatar="NA"
          color="#0078d4"
        >
          Hey team, putting in the 100-hr on N39KM for next Thursday. Submitting through MX Connect now.
        </UserMessage>

        {/* The approval card */}
        <AdaptiveCard approvalState={approvalState} setApprovalState={setApprovalState} />

        {/* Tevita's response */}
        {approvalState !== 'pending' && (
          <UserMessage name="Tevita Silatolu" time="14:34" avatar="TS" color="#107c10">
            {approvalState === 'approved'
              ? "Approved. Make sure to coordinate with Carla on the timeline — she's already got two events that week."
              : "Denied — let's discuss in our 1:1 tomorrow. There's a coverage issue I want to walk through."}
          </UserMessage>
        )}

        {/* System confirmation */}
        {approvalState === 'approved' && (
          <SystemMessage>
            <strong>MX Connect bot:</strong> Approval recorded. Event added to MX Schedule shared calendar (Outlook). N39KM 100-hr inspection 05/02–05/03 · Greybull. Notification sent to Nathan Anderson.
          </SystemMessage>
        )}
      </div>

      {/* Compose */}
      <div className="px-4 py-2 flex items-center gap-2" style={{ borderTop: `1px solid ${FLUENT.border}`, background: '#fafafa' }}>
        <Smile size={14} style={{ color: FLUENT.textSub }} />
        <Paperclip size={14} style={{ color: FLUENT.textSub }} />
        <input
          placeholder="Type a new message"
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 12,
            background: 'transparent', padding: '4px 0',
          }}
        />
        <Send size={14} style={{ color: FLUENT.brand }} />
      </div>
    </div>
  );
}

function UserMessage({ name, time, avatar, color, children }) {
  return (
    <div className="flex gap-2.5">
      <div
        style={{
          width: 32, height: 32, borderRadius: 16, background: color,
          color: '#fff', fontSize: 12, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        {avatar}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
          <span style={{ fontSize: 11, color: FLUENT.textSub }}>{time}</span>
        </div>
        <div style={{ fontSize: 13, color: FLUENT.text }}>{children}</div>
      </div>
    </div>
  );
}

function SystemMessage({ children }) {
  return (
    <div
      className="px-3 py-2 ml-10"
      style={{
        background: FLUENT.bgAlt, borderLeft: `3px solid ${FLUENT.brand}`,
        fontSize: 11, color: FLUENT.text, borderRadius: 2,
      }}
    >
      {children}
    </div>
  );
}

function AdaptiveCard({ approvalState, setApprovalState }) {
  return (
    <div className="flex gap-2.5">
      <div
        style={{
          width: 32, height: 32, borderRadius: 16, background: '#5059c9',
          color: '#fff', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}
      >
        MX
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2 mb-1">
          <span style={{ fontSize: 13, fontWeight: 600 }}>MX Connect bot</span>
          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', background: '#deecf9', color: '#003566', borderRadius: 2, letterSpacing: 0.4 }}>
            APP
          </span>
          <span style={{ fontSize: 11, color: FLUENT.textSub }}>14:22</span>
        </div>

        <div
          style={{
            background: FLUENT.surface, border: `1px solid ${FLUENT.borderStrong}`,
            borderRadius: 4, maxWidth: 520, overflow: 'hidden',
          }}
        >
          {/* Card header */}
          <div className="px-4 py-3" style={{ background: FLUENT.brand, color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
              MX Schedule · Approval Required
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>
              N39KM · 100-hr Inspection
            </div>
          </div>

          {/* Card body */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Field label="Submitted by" value="Nathan Anderson" />
              <Field label="Region" value="WY/MT" />
              <Field label="Aircraft" value="N39KM · Bell 407" />
              <Field label="Base" value="Greybull IH-23" />
              <Field label="Window" value="05/02 08:00 → 05/03 17:00" />
              <Field label="Duration" value="2 days" />
            </div>

            <div className="p-2.5 mb-3" style={{ background: FLUENT.bgAlt, borderRadius: 2, fontSize: 11 }}>
              <div style={{ color: FLUENT.textSub, fontWeight: 600, marginBottom: 3 }}>Conflict check</div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={11} style={{ color: FLUENT.good }} />
                <span style={{ color: FLUENT.text }}>No conflicts detected · WY/MT region maintains coverage with N407CN, N407FC, N407TK</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11, color: FLUENT.textSub }}>Comment:</span>
              <input
                placeholder="Optional note for Nathan..."
                style={{
                  flex: 1, padding: '4px 8px', fontSize: 11,
                  border: `1px solid ${FLUENT.borderStrong}`, borderRadius: 2,
                  background: approvalState === 'pending' ? FLUENT.surface : FLUENT.bgAlt,
                  color: FLUENT.text, outline: 'none',
                }}
                disabled={approvalState !== 'pending'}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="px-4 py-3 flex items-center gap-2" style={{ background: FLUENT.bgAlt, borderTop: `1px solid ${FLUENT.border}` }}>
            {approvalState === 'pending' ? (
              <>
                <button
                  onClick={() => setApprovalState('approved')}
                  style={{
                    background: FLUENT.good, color: '#fff', border: 'none',
                    padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, borderRadius: 2,
                  }}
                >
                  <CheckCircle2 size={13} /> Approve
                </button>
                <button
                  style={{
                    background: FLUENT.surface, color: FLUENT.text,
                    border: `1px solid ${FLUENT.borderStrong}`,
                    padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    borderRadius: 2,
                  }}
                >
                  Request more info
                </button>
                <button
                  onClick={() => setApprovalState('denied')}
                  style={{
                    background: FLUENT.surface, color: FLUENT.bad,
                    border: `1px solid ${FLUENT.borderStrong}`,
                    padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    borderRadius: 2,
                  }}
                >
                  Deny
                </button>
                <span className="ml-auto" style={{ fontSize: 11, color: FLUENT.textSub, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} /> Awaiting Tevita Silatolu
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    fontSize: 12, fontWeight: 600,
                    color: approvalState === 'approved' ? FLUENT.good : FLUENT.bad,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  <CheckCircle2 size={13} />
                  {approvalState === 'approved' ? 'Approved by Tevita Silatolu' : 'Denied by Tevita Silatolu'}
                  <span style={{ fontWeight: 400, color: FLUENT.textSub, marginLeft: 4 }}>· 14:34</span>
                </span>
                <button
                  onClick={() => setApprovalState('pending')}
                  className="ml-auto"
                  style={{
                    background: 'transparent', border: 'none',
                    padding: '4px 8px', fontSize: 11, color: FLUENT.brand,
                    cursor: 'pointer', textDecoration: 'underline',
                  }}
                >
                  Reset demo
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, marginTop: 1, fontFamily: label.includes('Window') || label.includes('Aircraft') || label.includes('Base') ? 'ui-monospace, monospace' : undefined }}>
        {value}
      </div>
    </div>
  );
}
