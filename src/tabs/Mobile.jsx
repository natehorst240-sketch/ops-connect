import React from 'react';
import {
  Plane, Wrench, Calendar, Shield, MessageSquare, Users,
  Bell, ChevronRight, AlertCircle, Wifi, BatteryFull, Signal,
} from 'lucide-react';
import { FLUENT, FLUENT_FONT } from '../m365/tokens';

// ============================================================================
// MOBILE — side-by-side comparison of the same AMT field workflow on
// the custom MX Connect build vs the M365 / Power Apps build.
// ============================================================================

export default function MobileTab() {
  return (
    <div className="grid-bg min-h-full overflow-auto scrollbar">
      <div className="px-7 pt-7 pb-4 max-w-[1400px] mx-auto">
        <div className="mono text-[10px] text-neutral-500 uppercase tracking-[0.15em] mb-1.5">
          Mobile · Field View
        </div>
        <div className="text-[20px] font-semibold tracking-tight">Same workflow, two builds</div>
        <div className="text-[12.5px] text-neutral-400 mt-1 max-w-[640px]">
          What the AMT sees on their phone after a 100-hr inspection comes due. The
          custom build is a React PWA installed to the home screen; the M365 build
          is the Power Apps mobile shell loading the same Dataverse tables.
        </div>
      </div>

      <div className="px-7 pb-10 flex items-start justify-center gap-10 flex-wrap">
        <PhoneColumn label="Custom" sub="MX Connect · React PWA">
          <CustomPhone />
        </PhoneColumn>
        <PhoneColumn label="M365" sub="Power Apps mobile">
          <M365Phone />
        </PhoneColumn>
      </div>
    </div>
  );
}

// ============================================================================
// PHONE FRAME
// ============================================================================

function PhoneColumn({ label, sub, children }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-baseline gap-2">
        <div className="mono text-[11px] text-orange-400 uppercase tracking-[0.2em] font-semibold">
          {label}
        </div>
        <div className="mono text-[10px] text-neutral-500">{sub}</div>
      </div>
      <PhoneFrame>{children}</PhoneFrame>
    </div>
  );
}

function PhoneFrame({ children }) {
  // 375 × 720 viewport — outer bezel ~12px, inner radius ~36px.
  return (
    <div
      className="relative shadow-2xl shadow-black/40"
      style={{
        width: 399,
        height: 744,
        background: '#0f172a',
        borderRadius: 48,
        padding: 12,
      }}
    >
      <div
        className="relative overflow-hidden"
        style={{ width: '100%', height: '100%', borderRadius: 36, background: '#fff' }}
      >
        {/* Notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-30"
          style={{
            top: 8, width: 110, height: 24, background: '#0f172a',
            borderRadius: 14,
          }}
        />
        {children}
      </div>
    </div>
  );
}

function StatusBar({ tint = '#0f172a', bg = 'transparent' }) {
  return (
    <div
      className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-7 pt-2"
      style={{ height: 36, color: tint, background: bg }}
    >
      <div className="mono text-[12px] font-semibold">9:41</div>
      <div className="flex items-center gap-1">
        <Signal size={12} strokeWidth={2.5} />
        <Wifi size={12} strokeWidth={2.5} />
        <BatteryFull size={14} strokeWidth={2.5} />
      </div>
    </div>
  );
}

// ============================================================================
// CUSTOM PHONE — MX Connect mobile (orange accent, modern rounded)
// ============================================================================

function CustomPhone() {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: '#f8fafc', color: '#0f172a' }}
    >
      <StatusBar tint="#0f172a" />

      {/* App header */}
      <div className="px-5 pt-12 pb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: '#ea580c', boxShadow: '0 6px 18px rgba(234,88,12,0.35)' }}
          >
            <Plane size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight leading-none">MX Connect</div>
            <div className="mono text-[9.5px] text-neutral-500 mt-0.5">Aaron Gabel · AMT · GEY</div>
          </div>
        </div>
        <div className="relative">
          <Bell size={18} style={{ color: '#334155' }} />
          <div
            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] font-bold flex items-center justify-center text-white"
            style={{ background: '#ea580c' }}
          >
            3
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-4 pb-20 space-y-3">
        {/* Bulletin */}
        <div
          className="px-3 py-2.5 rounded-xl flex items-start gap-2.5"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 pulse-red"
            style={{ background: '#ef4444' }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-[11.5px] font-semibold" style={{ color: '#b91c1c' }}>
              N291HC AOG · McKay
            </div>
            <div className="text-[10.5px] mt-0.5" style={{ color: '#475569' }}>
              Tail rotor gearbox chip light. N431HC covering.
            </div>
          </div>
        </div>

        {/* Hero card — assigned aircraft */}
        <div
          className="rounded-2xl p-3.5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#f8fafc',
          }}
        >
          <div
            className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-30"
            style={{ background: '#ea580c', filter: 'blur(28px)' }}
          />
          <div className="relative">
            <div className="mono text-[9px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>
              My Aircraft
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <div className="mono text-[20px] font-semibold">N39KM</div>
              <div className="text-[10px]" style={{ color: '#cbd5e1' }}>AW109SP · Greybull</div>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div>
                <div className="mono text-[8.5px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                  Next Due
                </div>
                <div className="mono text-[12px] font-semibold mt-0.5">04/30</div>
              </div>
              <div
                className="self-stretch w-px"
                style={{ background: 'rgba(148,163,184,0.3)' }}
              />
              <div>
                <div className="mono text-[8.5px] uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                  Type
                </div>
                <div className="mono text-[12px] font-semibold mt-0.5">100-hr</div>
              </div>
              <div className="flex-1" />
              <div
                className="px-2 py-1 rounded-md text-[10px] font-semibold"
                style={{ background: '#ea580c', color: '#fff' }}
              >
                6 days
              </div>
            </div>
          </div>
        </div>

        {/* Quick action grid */}
        <div>
          <div className="mono text-[9.5px] uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
            Submit
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'A/C Status', Icon: Plane },
              { label: 'MX Sched', Icon: Wrench },
              { label: 'Time Off', Icon: Calendar },
              { label: 'Safety', Icon: Shield },
              { label: 'Personnel', Icon: Users },
              { label: 'Ask Lead', Icon: MessageSquare },
            ].map(a => (
              <button
                key={a.label}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl"
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(234,88,12,0.1)' }}
                >
                  <a.Icon size={15} style={{ color: '#ea580c' }} strokeWidth={2.2} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: '#0f172a' }}>
                  {a.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent */}
        <div>
          <div className="mono text-[9.5px] uppercase tracking-widest mb-2" style={{ color: '#64748b' }}>
            My Submissions
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#fff', border: '1px solid #e2e8f0' }}
          >
            {[
              { type: 'MX Schedule', detail: 'N39KM 100-hr', status: 'Pending', color: '#ca8a04' },
              { type: 'Time Off', detail: '06/15–06/16', status: 'Approved', color: '#15803d' },
              { type: 'Ask Leadership', detail: 'Tooling budget', status: 'In progress', color: '#ea580c' },
            ].map((s, i, arr) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2.5"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[11.5px] font-semibold truncate">{s.detail}</div>
                  <div className="mono text-[9.5px]" style={{ color: '#94a3b8' }}>
                    {s.type}
                  </div>
                </div>
                <span
                  className="text-[9.5px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: `${s.color}1a`, color: s.color }}
                >
                  {s.status}
                </span>
                <ChevronRight size={13} style={{ color: '#cbd5e1' }} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom tab bar */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-stretch px-5 pt-2 pb-5 gap-1"
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        {[
          { label: 'Home', active: true },
          { label: 'Fleet' },
          { label: 'Schedule' },
          { label: 'Inbox' },
        ].map(t => (
          <div key={t.label} className="flex-1 flex flex-col items-center gap-0.5 py-1">
            <div
              className="w-5 h-5 rounded"
              style={{ background: t.active ? '#ea580c' : '#cbd5e1' }}
            />
            <span
              className="text-[9.5px] font-semibold"
              style={{ color: t.active ? '#ea580c' : '#94a3b8' }}
            >
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// M365 PHONE — Power Apps mobile (Fluent / blue, sharp corners)
// ============================================================================

function M365Phone() {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ background: FLUENT.bg, color: FLUENT.text, fontFamily: FLUENT_FONT }}
    >
      <StatusBar tint={FLUENT.text} />

      {/* Power Apps host chrome */}
      <div
        className="px-4 pt-11 pb-2 flex items-center justify-between shrink-0"
        style={{ background: FLUENT.brand, color: '#fff' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}
          >
            <div
              className="grid grid-cols-2 gap-px"
              style={{ width: 12, height: 12 }}
            >
              <div style={{ background: '#fff' }} />
              <div style={{ background: '#fff' }} />
              <div style={{ background: '#fff' }} />
              <div style={{ background: '#fff' }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>Power Apps</div>
            <div style={{ fontSize: 9.5, opacity: 0.85, marginTop: 2 }}>
              MX Connect · AMT
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, opacity: 0.85 }}>•••</div>
      </div>

      {/* App canvas header */}
      <div
        className="px-4 py-3 shrink-0"
        style={{ background: FLUENT.surface, borderBottom: `1px solid ${FLUENT.border}` }}
      >
        <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Aircraft Maintenance Tech
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>Welcome, Aaron</div>
        <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 2 }}>
          Greybull · On shift
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-3 pt-3 pb-16 space-y-3">
        {/* Bulletin (Adaptive Card style) */}
        <div
          className="flex items-start gap-2 px-3 py-2"
          style={{
            background: FLUENT.badSoft,
            border: `1px solid ${FLUENT.bad}40`,
            borderLeft: `3px solid ${FLUENT.bad}`,
            borderRadius: 2,
          }}
        >
          <Bell size={13} style={{ color: FLUENT.bad, marginTop: 2 }} />
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 11.5, fontWeight: 600, color: FLUENT.bad }}>
              N291HC AOG — McKay Base
            </div>
            <div style={{ fontSize: 10.5, color: FLUENT.text, marginTop: 1 }}>
              Tail rotor gearbox chip light. Awaiting parts ETA.
            </div>
            <div style={{ fontSize: 9, color: FLUENT.textSub, marginTop: 2 }}>
              — Nate Horstmeier
            </div>
          </div>
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Shift', value: 'On', color: FLUENT.good },
            { label: 'Aircraft', value: 'N39KM', color: FLUENT.brand },
            { label: 'Next Due', value: '04/30', color: FLUENT.warnAccent },
          ].map(m => (
            <div
              key={m.label}
              style={{
                background: FLUENT.surface,
                border: `1px solid ${FLUENT.border}`,
                borderRadius: 2,
                padding: 10,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: 2, background: m.color,
                }}
              />
              <div style={{ fontSize: 9, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {m.label}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: m.color, marginTop: 4, lineHeight: 1 }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Submit a Request — Microsoft Forms style */}
        <div
          style={{
            background: FLUENT.surface,
            border: `1px solid ${FLUENT.border}`,
            borderRadius: 2,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${FLUENT.border}`,
              fontSize: 12, fontWeight: 600,
            }}
          >
            Submit a Request
            <div style={{ fontSize: 9.5, color: FLUENT.textSub, fontWeight: 400, marginTop: 1 }}>
              Microsoft Forms · Power Automate
            </div>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1.5">
            {[
              { label: 'Aircraft Status', Icon: Plane },
              { label: 'MX Schedule', Icon: Wrench },
              { label: 'Time Off', Icon: Calendar },
              { label: 'Safety Report', Icon: Shield },
              { label: 'Personnel', Icon: Users },
              { label: 'Ask Leadership', Icon: MessageSquare },
            ].map(a => (
              <button
                key={a.label}
                className="flex items-center gap-2"
                style={{
                  padding: '8px 10px',
                  background: FLUENT.surface,
                  border: `1px solid ${FLUENT.borderStrong}`,
                  borderRadius: 2,
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: FLUENT_FONT,
                  color: FLUENT.text,
                  textAlign: 'left',
                }}
              >
                <a.Icon size={13} style={{ color: FLUENT.brand }} />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* My submissions */}
        <div
          style={{
            background: FLUENT.surface,
            border: `1px solid ${FLUENT.border}`,
            borderRadius: 2,
          }}
        >
          <div
            style={{
              padding: '8px 12px',
              borderBottom: `1px solid ${FLUENT.border}`,
              fontSize: 12, fontWeight: 600,
            }}
          >
            My Submissions
            <div style={{ fontSize: 9.5, color: FLUENT.textSub, fontWeight: 400, marginTop: 1 }}>
              SharePoint List
            </div>
          </div>
          {[
            { type: 'MX Schedule', detail: 'N39KM 100-hr inspection', status: 'Pending', sColor: FLUENT.warnAccent, sBg: FLUENT.warnSoft },
            { type: 'Time Off', detail: '2 days · 06/15–06/16', status: 'Approved', sColor: FLUENT.good, sBg: FLUENT.goodSoft },
            { type: 'Ask Leadership', detail: 'Tooling budget', status: 'In progress', sColor: FLUENT.brand, sBg: FLUENT.brandSoft },
          ].map((s, i, arr) => (
            <div
              key={i}
              className="flex items-center gap-2"
              style={{
                padding: '8px 12px',
                borderBottom: i < arr.length - 1 ? `1px solid ${FLUENT.border}` : 'none',
              }}
            >
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>{s.detail}</div>
                <div style={{ fontSize: 9.5, color: FLUENT.textSub, marginTop: 1 }}>
                  {s.type}
                </div>
              </div>
              <span
                style={{
                  fontSize: 9, fontWeight: 700, padding: '2px 6px',
                  background: s.sBg, color: s.sColor, borderRadius: 2,
                  whiteSpace: 'nowrap',
                }}
              >
                {s.status}
              </span>
            </div>
          ))}
        </div>

        {/* Approval card promo (Teams) */}
        <div
          className="flex items-start gap-2 px-3 py-2.5"
          style={{
            background: FLUENT.brandSoft,
            border: `1px solid ${FLUENT.brandLine}`,
            borderRadius: 2,
          }}
        >
          <AlertCircle size={13} style={{ color: FLUENT.brand, marginTop: 2 }} />
          <div className="flex-1 min-w-0">
            <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.brandDeep }}>
              Approvals open in Teams
            </div>
            <div style={{ fontSize: 10, color: FLUENT.text, marginTop: 1 }}>
              Tap to switch · Adaptive Card flow
            </div>
          </div>
        </div>
      </div>

      {/* Power Apps bottom nav */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-stretch px-2 pt-1.5 pb-5"
        style={{
          background: FLUENT.surface,
          borderTop: `1px solid ${FLUENT.border}`,
        }}
      >
        {[
          { label: 'Home', active: true },
          { label: 'Apps' },
          { label: 'Approvals' },
          { label: 'Notifications' },
        ].map(t => (
          <div key={t.label} className="flex-1 flex flex-col items-center gap-0.5 py-1">
            <div
              style={{
                width: 18, height: 18,
                background: t.active ? FLUENT.brand : FLUENT.textDim,
                borderRadius: 2,
              }}
            />
            <span
              style={{
                fontSize: 9, fontWeight: 600,
                color: t.active ? FLUENT.brand : FLUENT.textSub,
              }}
            >
              {t.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
