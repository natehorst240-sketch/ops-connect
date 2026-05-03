import React from 'react';
import {
  Plane, Wrench, Calendar, Shield, MessageSquare, Users,
  Bell, ChevronRight, AlertCircle, Wifi, BatteryFull, Signal,
} from 'lucide-react';
import { FLUENT, FLUENT_FONT } from '../m365/tokens';

// ============================================================================
// MOBILE — demo of just M365 no mx-connect pwa / Power Apps build, driven by persona.
// ============================================================================


function getMobileSpec(persona) {
  const role = persona?.role;
  const first = persona?.name?.split(' ')[0] || '';

  const aogBulletin = {
    title: 'N291HC AOG · McKay',
    message: 'Tail rotor gearbox chip light. N431HC covering.',
    severity: 'bad',
  };

  const shiftBulletin = {
    title: 'Shift open · Cedar City',
    message: '04/30 · 19:00–07:00 · $8/hr differential.',
    severity: 'warn',
  };

  switch (role) {
    case 'DIRECTOR':
      return {
        topLabel: 'Director · MX Operations',
        greeting: first,
        subtitle: 'Executive view · All regions',
        bulletin: aogBulletin,
        metrics: [
          { label: 'In Service', value: '47', sub: 'of 50', tone: 'good' },
          { label: 'AOG', value: '1', tone: 'bad' },
          { label: 'Escalations', value: '3', tone: 'brand' },
        ],
        primary: {
          title: 'Escalations',
          subtitle: 'Need Director attention',
          items: [
            { primary: 'Safety Report · Hard landing', secondary: 'A. Gabel · WY/MT · 2h', tag: 'Review', tagTone: 'bad' },
            { primary: 'Ask Leadership · Tooling budget', secondary: 'D. Brooks · 109 UT · 6h', tag: 'Review', tagTone: 'brand' },
            { primary: 'PR Movement · N431HC ferry', secondary: 'C. Weir · ALL · 12h', tag: 'Review', tagTone: 'warn' },
          ],
        },
        secondary: {
          title: 'Fleet by Region',
          subtitle: 'Live · Live Fleet feed',
          items: [
            { primary: '109 UT', secondary: '24 aircraft · 1 AOG', tag: '23/24', tagTone: 'warn' },
            { primary: 'WY/MT', secondary: '14 aircraft', tag: '14/14', tagTone: 'good' },
            { primary: 'NV/UT South', secondary: '12 aircraft', tag: '10/12', tagTone: 'warn' },
          ],
        },
        nav: ['Home', 'Fleet', 'Approvals', 'Inbox'],
      };

    case 'RMM':
      return {
        topLabel: `RMM · ${persona.region}`,
        greeting: first,
        subtitle: `${persona.base} · On shift`,
        bulletin: aogBulletin,
        metrics: [
          { label: 'Region A/C', value: '14', tone: 'good' },
          { label: 'Pending', value: '2', tone: 'brand' },
          { label: 'Techs', value: '8/12', tone: 'warn' },
        ],
        primary: {
          title: 'Approval Queue',
          subtitle: 'Approve · Deny · More info',
          actions: ['Approve', 'Deny'],
          items: [
            { primary: 'MX Schedule · N39KM 100-hr', secondary: 'A. Gabel · 4h ago' },
            { primary: 'Time Off · 06/15–06/16', secondary: 'D. Brooks · 1d ago' },
          ],
        },
        secondary: {
          title: `${persona.region} Fleet`,
          subtitle: '14 aircraft',
          items: [
            { primary: 'N39KM', secondary: 'AW109SP · Greybull', tag: 'In Service', tagTone: 'good' },
            { primary: 'N431HC', secondary: 'AW109SP · Logan', tag: 'In Service', tagTone: 'good' },
            { primary: 'N281HC', secondary: 'AW109SP · Salt Lake', tag: 'MX', tagTone: 'warn' },
          ],
        },
        nav: ['Home', 'Approvals', 'Fleet', 'Inbox'],
      };

    case 'AMT':
      return {
        topLabel: 'Aviation Maintenance Tech',
        greeting: first,
        subtitle: `${persona.base} · On shift`,
        bulletin: aogBulletin,
        hero: {
          label: 'My Aircraft',
          tail: 'N39KM',
          type: 'AW109SP · Greybull',
          stats: [{ k: 'Next Due', v: '04/30' }, { k: 'Type', v: '100-hr' }],
          chip: '6 days',
        },
        primary: {
          kind: 'tiles',
          title: 'Submit',
          subtitle: 'Forms route via approval',
          tiles: [
            { label: 'A/C Status', Icon: Plane },
            { label: 'MX Sched', Icon: Wrench },
            { label: 'Time Off', Icon: Calendar },
            { label: 'Safety', Icon: Shield },
            { label: 'Personnel', Icon: Users },
            { label: 'Ask Lead', Icon: MessageSquare },
          ],
        },
        secondary: {
          title: 'My Submissions',
          subtitle: 'Last 30 days',
          items: [
            { primary: 'N39KM 100-hr', secondary: 'MX Schedule', tag: 'Pending', tagTone: 'warn' },
            { primary: '06/15–06/16', secondary: 'Time Off', tag: 'Approved', tagTone: 'good' },
            { primary: 'Tooling budget', secondary: 'Ask Leadership', tag: 'In progress', tagTone: 'brand' },
          ],
        },
        nav: ['Home', 'Fleet', 'Schedule', 'Inbox'],
      };

    case 'QA':
      return {
        topLabel: 'Asst. Director · QA',
        greeting: first,
        subtitle: 'Cross-region oversight',
        bulletin: aogBulletin,
        metrics: [
          { label: 'Compliance', value: '98.2%', sub: '30d', tone: 'good' },
          { label: 'AOG', value: '1', tone: 'bad' },
          { label: 'Pending', value: '4', tone: 'brand' },
        ],
        primary: {
          title: 'Cross-Region Queue',
          subtitle: 'All regions',
          actions: ['Approve', 'Deny'],
          items: [
            { primary: 'Safety Report · Hard landing', secondary: 'A. Gabel · WY/MT' },
            { primary: 'MX Schedule · N251HC', secondary: 'C. Weir · ALL' },
          ],
        },
        secondary: {
          title: 'Audit Trail · Live',
          subtitle: 'Immutable log',
          items: [
            { primary: 'T. Silatolu approved MX Sched', secondary: 'N39KM', tag: '14:32', tagTone: 'sub' },
            { primary: 'N. Horstmeier posted ALERT', secondary: 'N291HC AOG', tag: '14:18', tagTone: 'sub' },
            { primary: 'D. Brooks reassigned tech', secondary: 'Fort Mohave', tag: '13:47', tagTone: 'sub' },
          ],
        },
        nav: ['Home', 'Audit', 'Approvals', 'Inbox'],
      };

    case 'MX_SCHEDULER':
      return {
        topLabel: 'Maintenance Scheduler',
        greeting: first,
        subtitle: 'SLC · Owns MX calendar',
        bulletin: aogBulletin,
        metrics: [
          { label: 'This Week', value: '14', tone: 'brand' },
          { label: 'Conflicts', value: '5', tone: 'bad' },
          { label: 'Due 7d', value: '11', tone: 'warn' },
        ],
        primary: {
          title: 'Pending Approvals',
          subtitle: 'MX + PR · ready to schedule',
          actions: ['Approve', 'Move'],
          items: [
            { primary: 'N39KM 100-hr inspection', secondary: 'A. Gabel · WY/MT' },
            { primary: 'N251HC AAIP block', secondary: 'D. Brooks · 109 UT' },
          ],
        },
        secondary: {
          title: 'Inspections Due',
          subtitle: 'Drag to timeline (PCF)',
          items: [
            { primary: 'N407FC · 50-hr', secondary: 'Due 04/28', tag: '4d', tagTone: 'bad' },
            { primary: 'N39KM · 100-hr', secondary: 'Due 04/30', tag: '6d', tagTone: 'warn' },
            { primary: 'N281HC · AAIP', secondary: 'Due 05/04', tag: '10d', tagTone: 'good' },
          ],
        },
        nav: ['Home', 'Calendar', 'Approvals', 'Inbox'],
      };

    case 'FLIGHT_NURSE':
      return {
        topLabel: 'Flight Nurse — Urban',
        greeting: first,
        subtitle: 'Cedar City Hospital · Off shift',
        bulletin: shiftBulletin,
        metrics: [
          { label: 'Shifts Mo', value: '7', sub: '84 hrs', tone: 'brand' },
          { label: 'Open Elig.', value: '3', tone: 'warn' },
          { label: 'Certs 60d', value: '1', sub: 'PALS', tone: 'warn' },
        ],
        primary: {
          title: 'Eligible Open Shifts',
          subtitle: 'Filtered by your certs',
          actions: ['Claim'],
          items: [
            { primary: 'Intermountain Med Ctr', secondary: '04/30 · 19:00–07:00', tag: '$8/hr', tagTone: 'good' },
            { primary: 'St. George Hospital', secondary: '05/02 · 06:00–18:00', tag: '$8/hr', tagTone: 'good' },
            { primary: 'Cedar City Hospital', secondary: '05/05 · 24hr', tag: '$12/hr', tagTone: 'good' },
          ],
        },
        secondary: {
          title: 'My Certifications',
          subtitle: 'From CompleteFlight',
          items: [
            { primary: 'PALS', secondary: 'Expires 06/12', tag: '49d', tagTone: 'warn' },
            { primary: 'TNCC', secondary: 'Expires 11/03', tag: '193d', tagTone: 'good' },
            { primary: 'CCRN', secondary: 'Expires 08/14/27', tag: '477d', tagTone: 'good' },
          ],
        },
        nav: ['Home', 'Shifts', 'Schedule', 'Inbox'],
      };

    default:
      return null;
  }
}

export default function MobileTab({ persona }) {
  const spec = getMobileSpec(persona);

  return (
    <div className="grid-bg min-h-full overflow-auto scrollbar">
      <div className="px-7 pt-7 pb-4 max-w-[1400px] mx-auto">
        <div className="mono text-[10px] text-neutral-500 uppercase tracking-[0.15em] mb-1.5">
          Mobile · {persona?.roleTitle || 'Field View'}
        </div>
        <div className="text-[20px] font-semibold tracking-tight">
          Same workflow in mobile
        </div>
        <div className="text-[12.5px] text-neutral-400 mt-1 max-w-[640px]">
          What {persona?.name?.split(' ')[0] || 'this role'} sees on their phone.
          the M365
          build is the Power Apps mobile shell loading the same Dataverse tables.
          Switch personas in the left rail to see other roles.
        </div>
      </div>

      <div className="px-7 pb-10 flex items-start justify-center gap-10 flex-wrap">
        <PhoneColumn label="M365" sub="Power Apps mobile">
          <M365Phone spec={spec} persona={persona} />
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
// M365 PHONE — Power Apps mobile (Fluent / blue, sharp corners)
// ============================================================================

// Tone palette for the Fluent (M365) phone.
function fluentTone(tone) {
  switch (tone) {
    case 'bad':   return { fg: FLUENT.bad,        bg: FLUENT.badSoft  };
    case 'warn':  return { fg: FLUENT.warnAccent, bg: FLUENT.warnSoft };
    case 'good':  return { fg: FLUENT.good,       bg: FLUENT.goodSoft };
    case 'brand': return { fg: FLUENT.brand,      bg: FLUENT.brandSoft };
    case 'sub':   return { fg: FLUENT.textSub,    bg: FLUENT.bgAlt    };
    default:      return { fg: FLUENT.text,       bg: FLUENT.bgAlt    };
  }
}

function M365Phone({ spec, persona }) {
  if (!spec) return null;
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
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-6 h-6 flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}
          >
            <div className="grid grid-cols-2 gap-px" style={{ width: 12, height: 12 }}>
              <div style={{ background: '#fff' }} />
              <div style={{ background: '#fff' }} />
              <div style={{ background: '#fff' }} />
              <div style={{ background: '#fff' }} />
            </div>
          </div>
          <div className="min-w-0">
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1 }}>Power Apps</div>
            <div style={{ fontSize: 9.5, opacity: 0.85, marginTop: 2 }}>
              MX Connect · {persona?.role?.replace('_', ' ') || ''}
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
          {spec.topLabel}
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, marginTop: 2 }}>
          Welcome, {spec.greeting}
        </div>
        <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 2 }}>
          {spec.subtitle}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-3 pt-3 pb-16 space-y-3">
        {spec.bulletin && <FluentBulletin bulletin={spec.bulletin} />}

        {spec.hero && <FluentHero hero={spec.hero} />}

        {spec.metrics && (
          <div className="grid grid-cols-3 gap-2">
            {spec.metrics.map(m => {
              const t = fluentTone(m.tone);
              return (
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
                      height: 2, background: t.fg,
                    }}
                  />
                  <div style={{ fontSize: 9, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: t.fg, marginTop: 4, lineHeight: 1 }}>
                    {m.value}
                  </div>
                  {m.sub && (
                    <div style={{ fontSize: 9, color: FLUENT.textSub, marginTop: 2 }}>{m.sub}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <FluentCard card={spec.primary} />
        <FluentCard card={spec.secondary} />

        {/* Teams handoff promo — present on every persona since approvals
            in M365 always route through Teams adaptive cards. */}
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
        style={{ background: FLUENT.surface, borderTop: `1px solid ${FLUENT.border}` }}
      >
        {spec.nav.map((label, i) => {
          const active = i === 0;
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-0.5 py-1">
              <div
                style={{
                  width: 18, height: 18,
                  background: active ? FLUENT.brand : FLUENT.textDim,
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontSize: 9, fontWeight: 600,
                  color: active ? FLUENT.brand : FLUENT.textSub,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FluentBulletin({ bulletin }) {
  const t = fluentTone(bulletin.severity);
  return (
    <div
      className="flex items-start gap-2 px-3 py-2"
      style={{
        background: t.bg,
        border: `1px solid ${t.fg}40`,
        borderLeft: `3px solid ${t.fg}`,
        borderRadius: 2,
      }}
    >
      <Bell size={13} style={{ color: t.fg, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 11.5, fontWeight: 600, color: t.fg }}>
          {bulletin.title}
        </div>
        <div style={{ fontSize: 10.5, color: FLUENT.text, marginTop: 1 }}>
          {bulletin.message}
        </div>
      </div>
    </div>
  );
}

function FluentHero({ hero }) {
  return (
    <div
      style={{
        background: FLUENT.surface,
        border: `1px solid ${FLUENT.border}`,
        borderTop: `2px solid ${FLUENT.brand}`,
        borderRadius: 2,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 9, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {hero.label}
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
          {hero.tail}
        </div>
        <div style={{ fontSize: 10.5, color: FLUENT.textSub }}>{hero.type}</div>
      </div>
      <div className="mt-2 flex items-center gap-3">
        {hero.stats.map((s, i) => (
          <React.Fragment key={s.k}>
            {i > 0 && (
              <div className="self-stretch w-px" style={{ background: FLUENT.border }} />
            )}
            <div>
              <div style={{ fontSize: 9, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {s.k}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
            </div>
          </React.Fragment>
        ))}
        <div className="flex-1" />
        {hero.chip && (
          <div
            style={{
              padding: '2px 8px',
              background: FLUENT.warnSoft,
              color: FLUENT.warnAccent,
              fontSize: 10,
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            {hero.chip}
          </div>
        )}
      </div>
    </div>
  );
}

function FluentCard({ card }) {
  if (!card) return null;
  return (
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
        {card.title}
        {card.subtitle && (
          <div style={{ fontSize: 9.5, color: FLUENT.textSub, fontWeight: 400, marginTop: 1 }}>
            {card.subtitle}
          </div>
        )}
      </div>

      {card.kind === 'tiles' ? (
        <div className="p-2 grid grid-cols-2 gap-1.5">
          {card.tiles.map(a => (
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
      ) : (
        card.items.map((it, i, arr) => {
          const tone = fluentTone(it.tagTone);
          return (
            <div
              key={i}
              style={{
                padding: '8px 12px',
                borderBottom: i < arr.length - 1 ? `1px solid ${FLUENT.border}` : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 11.5, fontWeight: 600 }}>{it.primary}</div>
                  {it.secondary && (
                    <div style={{ fontSize: 9.5, color: FLUENT.textSub, marginTop: 1 }}>
                      {it.secondary}
                    </div>
                  )}
                </div>
                {it.tag && (
                  <span
                    style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px',
                      background: tone.bg, color: tone.fg, borderRadius: 2,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {it.tag}
                  </span>
                )}
              </div>
              {card.actions && (
                <div className="flex gap-1.5 mt-2">
                  {card.actions.map(a => {
                    const isPrimary = a === 'Approve' || a === 'Claim' || a === 'Move';
                    const isDanger = a === 'Deny';
                    return (
                      <button
                        key={a}
                        style={{
                          fontSize: 10.5, fontWeight: 600,
                          padding: '3px 10px',
                          fontFamily: FLUENT_FONT,
                          borderRadius: 2,
                          background: isPrimary ? FLUENT.brand : FLUENT.surface,
                          color: isPrimary ? '#fff' : isDanger ? FLUENT.bad : FLUENT.text,
                          border: isPrimary
                            ? `1px solid ${FLUENT.brand}`
                            : `1px solid ${FLUENT.borderStrong}`,
                        }}
                      >
                        {a}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
