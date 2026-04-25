import React, { useState } from 'react';
import {
  Plane, Users, AlertCircle, Calendar, Wrench, Shield, MessageSquare,
  CheckCircle2, Clock, Activity, ChevronRight, Phone, FileText,
  HeartPulse, Wind, Baby, Stethoscope, Bell, ArrowRight, Search,
} from 'lucide-react';
import { FLUENT } from '../tokens';
import { AIRCRAFT, PERSONAS, PENDING_REQUESTS, INSPECTIONS_DUE, OPEN_SHIFTS, CREW_REQUESTS, BULLETINS } from '../../data';
import WeekCalendar from '../../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../../shared/personaCalendarData';

// ============================================================================
// MAIN: Power Apps home — persona switcher + role-specific screens
// ============================================================================

export default function PowerAppsHome({ persona, setPersonaId }) {
  return (
    <div className="flex h-full" style={{ background: FLUENT.bg }}>
      <PersonaSidebar persona={persona} setPersonaId={setPersonaId} />
      <div className="flex-1 overflow-auto">
        <Home persona={persona} />
      </div>
    </div>
  );
}

function PersonaSidebar({ persona, setPersonaId }) {
  return (
    <div
      className="shrink-0"
      style={{
        width: 200, background: FLUENT.surface, borderRight: `1px solid ${FLUENT.border}`,
        padding: 12, overflowY: 'auto',
      }}
    >
      <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
        Demo: View as
      </div>
      {PERSONAS.map(p => (
        <button
          key={p.id}
          onClick={() => setPersonaId(p.id)}
          className="flex items-center gap-2 w-full mb-1"
          style={{
            padding: '6px 8px',
            background: p.id === persona.id ? FLUENT.brandSoft : 'transparent',
            border: p.id === persona.id ? `1px solid ${FLUENT.brand}` : '1px solid transparent',
            borderRadius: 2,
            fontSize: 11, textAlign: 'left', cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 22, height: 22, borderRadius: 11,
              background: p.id === persona.id ? FLUENT.brand : FLUENT.bgAlt,
              color: p.id === persona.id ? '#fff' : FLUENT.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, flexShrink: 0,
            }}
          >
            {p.initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
            <div style={{ fontSize: 10, color: FLUENT.textSub }}>{p.role}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// SHARED COMPONENTS
// ============================================================================

function PageHeader({ persona, subtitle }) {
  return (
    <div className="mb-4">
      <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 4 }}>
        {persona.roleTitle}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: FLUENT.text }}>
        Welcome back, {persona.name.split(' ')[0]}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: FLUENT.textSub, marginTop: 4 }}>{subtitle}</div>
      )}
    </div>
  );
}

function Card({ title, subtitle, action, children, accent }) {
  return (
    <div
      style={{
        background: FLUENT.surface, border: `1px solid ${FLUENT.border}`,
        borderTop: accent ? `2px solid ${accent}` : `1px solid ${FLUENT.border}`,
        borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column',
      }}
    >
      <div className="flex items-center px-3 py-2.5" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
        <div className="flex-1">
          <div style={{ fontSize: 12, fontWeight: 600 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10, color: FLUENT.textSub, marginTop: 1 }}>{subtitle}</div>}
        </div>
        {action}
      </div>
      <div className="flex-1" style={{ padding: 12 }}>{children}</div>
    </div>
  );
}

function MetricTile({ label, value, sub, color }) {
  return (
    <div style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2, padding: 12, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{label}</div>
      <div className="flex items-baseline gap-2">
        <span style={{ fontSize: 24, fontWeight: 600, color, lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: 11, color: FLUENT.textSub }}>{sub}</span>}
      </div>
    </div>
  );
}

function BulletinBar() {
  const b = BULLETINS[0];   // Just show top alert in Power Apps version
  return (
    <div
      className="flex items-center gap-3 mb-4 px-3 py-2"
      style={{
        background: FLUENT.badSoft, border: `1px solid ${FLUENT.bad}40`,
        borderLeft: `3px solid ${FLUENT.bad}`, borderRadius: 2,
      }}
    >
      <Bell size={14} style={{ color: FLUENT.bad }} />
      <div className="flex-1">
        <div style={{ fontSize: 12, fontWeight: 600, color: FLUENT.bad }}>{b.title}</div>
        <div style={{ fontSize: 11, color: FLUENT.text, marginTop: 1 }}>{b.message}</div>
      </div>
      <span style={{ fontSize: 10, color: FLUENT.textSub, fontWeight: 600 }}>— {b.postedBy}</span>
    </div>
  );
}

function FluentButton({ primary, danger, children, icon: Icon }) {
  const style = primary
    ? { background: FLUENT.brand, color: '#fff', border: `1px solid ${FLUENT.brand}` }
    : danger
    ? { background: FLUENT.surface, color: FLUENT.bad, border: `1px solid ${FLUENT.borderStrong}` }
    : { background: FLUENT.surface, color: FLUENT.text, border: `1px solid ${FLUENT.borderStrong}` };
  return (
    <button
      style={{
        ...style, padding: '4px 10px', fontSize: 11, fontWeight: 600,
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
        borderRadius: 2,
      }}
    >
      {Icon && <Icon size={11} />}
      {children}
    </button>
  );
}

function StatusDot({ status }) {
  const c = status === 'IN_SERVICE' ? FLUENT.good : status === 'AOG' ? FLUENT.bad : FLUENT.warnAccent;
  return <div style={{ width: 6, height: 6, borderRadius: 3, background: c, flexShrink: 0 }} />;
}

// ============================================================================
// HOME SCREEN ROUTER
// ============================================================================

function Home({ persona }) {
  switch (persona.role) {
    case 'DIRECTOR':       return <DirectorHome persona={persona} />;
    case 'RMM':            return <RMMHome persona={persona} />;
    case 'AMT':            return <AMTHome persona={persona} />;
    case 'QA':             return <QAHome persona={persona} />;
    case 'MX_SCHEDULER':   return <MXSchedulerHome persona={persona} />;
    case 'CREW_SCHEDULER': return <CrewSchedulerHome persona={persona} />;
    case 'FLIGHT_NURSE':   return <NurseHome persona={persona} />;
    default: return null;
  }
}

// ============================================================================
// DIRECTOR
// ============================================================================

function DirectorHome({ persona }) {
  const inService = AIRCRAFT.filter(a => a.status === 'IN_SERVICE').length;
  const aog = AIRCRAFT.filter(a => a.status === 'AOG').length;
  const mx = AIRCRAFT.filter(a => a.status === 'MAINTENANCE').length;
  const escalations = PENDING_REQUESTS.filter(r => r.type === 'Safety Report' || r.type === 'Ask Leadership');

  return (
    <div className="p-6">
      <PageHeader persona={persona} subtitle="Executive view · For deep analytics, see Power BI Report tab" />
      <BulletinBar />
      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricTile label="Fleet In Service" value={inService} sub={`of ${AIRCRAFT.length}`} color={FLUENT.good} />
        <MetricTile label="AOG" value={aog} color={FLUENT.bad} />
        <MetricTile label="In Maintenance" value={mx} color={FLUENT.warnAccent} />
        <MetricTile label="Escalations" value={escalations.length} color={FLUENT.brand} />
      </div>
      <div className="grid grid-cols-2 gap-3" style={{ height: 360 }}>
        <Card
          title="Fleet Status — All Regions"
          subtitle="SharePoint List view · Sorted by status"
          action={<FluentButton icon={ChevronRight}>Open in SharePoint</FluentButton>}
        >
          <div className="overflow-y-auto h-full" style={{ marginRight: -8, paddingRight: 8 }}>
            <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: FLUENT.bgAlt, position: 'sticky', top: 0 }}>
                  <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, color: FLUENT.textSub, fontWeight: 600 }}>Tail</th>
                  <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, color: FLUENT.textSub, fontWeight: 600 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, color: FLUENT.textSub, fontWeight: 600 }}>Base</th>
                  <th style={{ textAlign: 'left', padding: '5px 8px', fontSize: 10, color: FLUENT.textSub, fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {AIRCRAFT.slice(0, 18).map(a => (
                  <tr key={a.tail} style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
                    <td style={{ padding: '5px 8px', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{a.tail}</td>
                    <td style={{ padding: '5px 8px', color: FLUENT.textSub }}>{a.type}</td>
                    <td style={{ padding: '5px 8px', color: FLUENT.textSub }}>{a.base}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <span className="inline-flex items-center gap-1.5">
                        <StatusDot status={a.status} />
                        <span style={{ fontSize: 10, fontWeight: 500 }}>{a.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Escalations" subtitle="Items requiring Director attention" accent={FLUENT.warnAccent}>
          {escalations.map(e => (
            <div key={e.id} className="flex items-start gap-2 py-2" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
              <div style={{ width: 3, alignSelf: 'stretch', background: e.type === 'Safety Report' ? FLUENT.bad : FLUENT.warnAccent, borderRadius: 1 }} />
              <div className="flex-1">
                <div style={{ fontSize: 12, fontWeight: 600 }}>{e.type}: {e.detail}</div>
                <div style={{ fontSize: 10, color: FLUENT.textSub, marginTop: 1 }}>{e.submitter} · {e.region} · {e.submitted}</div>
              </div>
              <FluentButton>Review</FluentButton>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// RMM
// ============================================================================

function RMMHome({ persona }) {
  const regionAircraft = AIRCRAFT.filter(a => a.region === persona.region);
  const regionRequests = PENDING_REQUESTS.filter(r => r.region === persona.region);

  return (
    <div className="p-6">
      <PageHeader persona={persona} subtitle={`Regional view · ${persona.region}`} />
      <BulletinBar />
      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricTile label={`${persona.region} Aircraft`} value={regionAircraft.length} color={FLUENT.good} />
        <MetricTile label="Pending Approval" value={regionRequests.length} color={FLUENT.brand} />
        <MetricTile label="Techs On Shift" value="8" sub="of 12" color={FLUENT.warnAccent} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card title="Approval Queue" subtitle="Power Automate · Adaptive Card approvals">
          {regionRequests.map((r, i) => (
            <div key={r.id} className="py-2" style={{ borderBottom: i < regionRequests.length - 1 ? `1px solid ${FLUENT.border}` : 'none' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', background: FLUENT.bgAlt, borderRadius: 2, color: FLUENT.textSub, letterSpacing: 0.5 }}>{r.type.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: FLUENT.textSub }}>{r.submitted}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{r.detail}</div>
              <div style={{ fontSize: 10, color: FLUENT.textSub, marginBottom: 6 }}>— {r.submitter}</div>
              <div className="flex gap-1.5">
                <FluentButton primary>Approve</FluentButton>
                <FluentButton>More info</FluentButton>
                <FluentButton danger>Deny</FluentButton>
              </div>
            </div>
          ))}
        </Card>

        <Card title={`${persona.region} Fleet`} subtitle="Filtered SharePoint List view">
          <div className="space-y-1">
            {regionAircraft.map(a => (
              <div key={a.tail} className="flex items-center gap-2 py-1.5 px-1" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
                <StatusDot status={a.status} />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, fontWeight: 600, width: 64 }}>{a.tail}</span>
                <span style={{ fontSize: 10, color: FLUENT.textSub, width: 80 }}>{a.type}</span>
                <span style={{ fontSize: 10, color: FLUENT.textSub, flex: 1 }}>{a.base}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// AMT
// ============================================================================

function AMTHome({ persona }) {
  return (
    <div className="p-6">
      <PageHeader persona={persona} subtitle="Submit requests, view schedule, track inspections" />
      <BulletinBar />
      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricTile label="Shift Status" value="On Shift" color={FLUENT.good} />
        <MetricTile label="My Aircraft" value="N39KM" sub="Greybull" color={FLUENT.brand} />
        <MetricTile label="Next Due" value="04/30" sub="6 days" color={FLUENT.warnAccent} />
      </div>
      <div className="grid grid-cols-2 gap-3" style={{ minHeight: 300 }}>
        <Card title="Submit a Request" subtitle="Microsoft Forms · Routes via Power Automate">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Aircraft Status', icon: Plane },
              { label: 'Personnel Status', icon: Users },
              { label: 'MX Schedule', icon: Wrench },
              { label: 'Ask Leadership', icon: MessageSquare },
              { label: 'Safety Report', icon: Shield },
              { label: 'Time Off', icon: Calendar },
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <button
                  key={i}
                  className="flex items-center gap-2 p-2.5 text-left"
                  style={{
                    background: FLUENT.surface, border: `1px solid ${FLUENT.borderStrong}`,
                    borderRadius: 2, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <Icon size={14} style={{ color: FLUENT.brand }} />
                  {a.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="My Submissions" subtitle="Last 30 days">
          {[
            { type: 'MX Schedule', detail: 'N39KM 100-hr inspection', status: 'Pending', sColor: FLUENT.warnAccent, sBg: FLUENT.warnSoft },
            { type: 'Time Off', detail: '2 days · 06/15–06/16', status: 'Approved', sColor: FLUENT.good, sBg: FLUENT.goodSoft },
            { type: 'Ask Leadership', detail: 'Tooling budget', status: 'In progress', sColor: FLUENT.brand, sBg: FLUENT.brandSoft },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2 py-2" style={{ borderBottom: i < 2 ? `1px solid ${FLUENT.border}` : 'none' }}>
              <div className="flex-1">
                <div style={{ fontSize: 12, fontWeight: 600 }}>{s.detail}</div>
                <div style={{ fontSize: 10, color: FLUENT.textSub }}>{s.type}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', background: s.sBg, color: s.sColor, borderRadius: 2 }}>
                {s.status}
              </span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// QA
// ============================================================================

function QAHome({ persona }) {
  return (
    <div className="p-6">
      <PageHeader persona={persona} subtitle="Cross-region oversight · For analytics, see Power BI Report tab" />
      <BulletinBar />
      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricTile label="Compliance" value="98.2%" sub="30d" color={FLUENT.good} />
        <MetricTile label="AOG" value="1" color={FLUENT.bad} />
        <MetricTile label="Pending Review" value={PENDING_REQUESTS.length} color={FLUENT.brand} />
        <MetricTile label="Audit Events" value="247" sub="today" color={FLUENT.warnAccent} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card title="Cross-Region Approval Queue">
          {PENDING_REQUESTS.slice(0, 4).map(r => (
            <div key={r.id} className="py-2" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', background: FLUENT.bgAlt, borderRadius: 2, color: FLUENT.textSub, letterSpacing: 0.5 }}>{r.type.toUpperCase()}</span>
                <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 5px', background: FLUENT.brandSoft, color: FLUENT.brandDeep, borderRadius: 2 }}>{r.region}</span>
                <span style={{ fontSize: 10, color: FLUENT.textSub }}>{r.submitted}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{r.detail}</div>
              <div className="flex gap-1.5 mt-1">
                <FluentButton primary>Approve</FluentButton>
                <FluentButton danger>Deny</FluentButton>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Audit Trail · Live" subtitle="Microsoft Purview · Immutable log">
          {[
            { who: 'Tevita Silatolu', action: 'Approved MX Schedule', target: 'N39KM', time: '14:32' },
            { who: 'Nate Horstmeier', action: 'Posted ALERT', target: 'N291HC AOG', time: '14:18' },
            { who: 'Dwight Brooks', action: 'Reassigned tech', target: 'Fort Mohave', time: '13:47' },
            { who: 'Carla Weir', action: 'Moved MX entry', target: 'N251HC', time: '13:22' },
            { who: 'System', action: 'Auto-escalated', target: 'Safety Report 6h', time: '12:01' },
          ].map((e, i) => (
            <div key={i} className="flex items-start gap-3 py-2" style={{ borderBottom: i < 4 ? `1px solid ${FLUENT.border}` : 'none', fontSize: 11 }}>
              <span style={{ color: FLUENT.textSub, fontFamily: 'ui-monospace, monospace', width: 36 }}>{e.time}</span>
              <div className="flex-1">
                <div><span style={{ fontWeight: 600 }}>{e.who}</span> <span style={{ color: FLUENT.textSub }}>{e.action}</span></div>
                <div style={{ color: FLUENT.textSub, fontSize: 10, fontFamily: 'ui-monospace, monospace' }}>{e.target}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// MX SCHEDULER (preview — directs to PCF for the timeline)
// ============================================================================

function MXSchedulerHome({ persona }) {
  return (
    <div className="p-6">
      <PageHeader persona={persona} subtitle="Maintenance schedule owner · For full timeline, open Resource Scheduler PCF" />
      <BulletinBar />
      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricTile label="This Week" value="14" sub="events" color={FLUENT.brand} />
        <MetricTile label="Pending" value="3" color={FLUENT.warnAccent} />
        <MetricTile label="Conflicts" value="5" color={FLUENT.bad} />
        <MetricTile label="Due 7d" value="11" color={FLUENT.warnAccent} />
      </div>

      <div
        className="mb-4 p-4 flex items-center gap-4"
        style={{
          background: FLUENT.pcfBadgeSoft, border: `1px solid ${FLUENT.pcfBadge}33`,
          borderLeft: `3px solid ${FLUENT.pcfBadge}`, borderRadius: 2,
        }}
      >
        <Calendar size={32} style={{ color: FLUENT.pcfBadge }} />
        <div className="flex-1">
          <div style={{ fontSize: 13, fontWeight: 600, color: FLUENT.pcfBadge }}>
            Resource Scheduler with Conflict Detection
          </div>
          <div style={{ fontSize: 11, color: FLUENT.text, marginTop: 2 }}>
            Stock Power Apps cannot render a multi-row Gantt timeline with auto-detect conflict logic. The Resource Scheduler PCF (custom React/TypeScript component embedded in this app) provides this. Open the dedicated tab to use it.
          </div>
        </div>
        <FluentButton primary icon={ArrowRight}>Open PCF</FluentButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Pending Approvals" subtitle="MX + PR requests">
          {PENDING_REQUESTS.filter(r => r.type === 'MX Schedule' || r.type === 'PR Movement').map(r => (
            <div key={r.id} className="py-2" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{r.detail}</div>
              <div style={{ fontSize: 10, color: FLUENT.textSub, marginBottom: 4 }}>{r.region} · {r.submitter}</div>
              <div className="flex gap-1.5">
                <FluentButton primary>Approve & schedule</FluentButton>
                <FluentButton>Move to calendar</FluentButton>
              </div>
            </div>
          ))}
        </Card>

        <Card title="Inspections Due — Drag to schedule" subtitle="Drag items to timeline (in PCF)">
          {INSPECTIONS_DUE.slice(0, 6).map((i, idx) => {
            const c = i.level === 'red' ? FLUENT.bad : i.level === 'amber' ? FLUENT.warnAccent : FLUENT.good;
            return (
              <div key={idx} className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${FLUENT.border}`, fontSize: 11 }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: c }} />
                <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 600, width: 64 }}>{i.tail}</span>
                <span style={{ flex: 1, color: FLUENT.text }}>{i.desc}</span>
                <span style={{ color: FLUENT.textSub, fontFamily: 'ui-monospace, monospace' }}>{i.due}</span>
                <span style={{ color: c, fontWeight: 600, fontFamily: 'ui-monospace, monospace', width: 32, textAlign: 'right' }}>{i.days}d</span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* === Crew Scheduling section — Carla owns this too === */}
      <div className="mt-8 mb-3 pb-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
        <Users size={16} style={{ color: FLUENT.brand }} />
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Crew Scheduling</h2>
        <span style={{ fontSize: 10, color: FLUENT.textSub, marginLeft: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Same desk · open shifts, swaps, certifications
        </span>
      </div>
      <CrewSchedulerHome persona={{
        ...persona,
        role: 'CREW_SCHEDULER',
        roleTitle: 'Crew Scheduling',
        _embedded: true,
      }} />
    </div>
  );
}

// ============================================================================
// CREW SCHEDULER
// ============================================================================

function CrewSchedulerHome({ persona }) {
  const embedded = persona._embedded;
  return (
    <div className={embedded ? '' : 'p-6'}>
      {!embedded && <PageHeader persona={persona} subtitle="Crew scheduling · CompleteFlight integration via Power Automate" />}
      {!embedded && <BulletinBar />}
      {!embedded && (
        <WeekCalendar
          events={getEventsForPersona(persona)}
          {...getCalendarConfigForPersona(persona)}
        />
      )}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricTile label="Open Shifts" value={OPEN_SHIFTS.length} color={FLUENT.brand} />
        <MetricTile label="Requests" value={CREW_REQUESTS.length} color={FLUENT.warnAccent} />
        <MetricTile label="Certs Expiring" value="3" sub="30d" color={FLUENT.warnAccent} />
        <MetricTile label="Coverage" value="94%" sub="14d" color={FLUENT.good} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Open Shift Board" subtitle="Adaptive Cards posted to crew Teams channel">
          {OPEN_SHIFTS.slice(0, 5).map(s => {
            const IconMap = { flight_nurse: HeartPulse, flight_paramedic: Activity, respiratory: Wind, pediatric: Baby, neonatal: Baby };
            const Icon = IconMap[s.specialty] || Stethoscope;
            return (
              <div key={s.id} className="flex items-center gap-2 py-2" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 2, background: FLUENT.brandSoft,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={13} style={{ color: FLUENT.brand }} />
                </div>
                <div className="flex-1">
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.role} · {s.base}</div>
                  <div style={{ fontSize: 10, color: FLUENT.textSub }}>{s.date} · {s.time}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: FLUENT.good }}>{s.differential}</span>
                <FluentButton primary>Publish</FluentButton>
              </div>
            );
          })}
        </Card>

        <Card title="Coverage Health · 14 days">
          {[
            { name: 'Intermountain Medical Ctr', pct: 100, color: FLUENT.good },
            { name: 'Primary Childrens', pct: 92, color: FLUENT.good },
            { name: 'McKay Dee', pct: 78, color: FLUENT.warnAccent },
            { name: 'St. George', pct: 88, color: FLUENT.good },
            { name: 'Cedar City', pct: 85, color: FLUENT.warnAccent },
            { name: 'Logan', pct: 65, color: FLUENT.bad },
          ].map(b => (
            <div key={b.name} className="flex items-center gap-2 py-1.5" style={{ fontSize: 11 }}>
              <span style={{ flex: 1 }}>{b.name}</span>
              <div style={{ width: 100, height: 14, background: FLUENT.bgAlt, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: `${b.pct}%`, height: '100%', background: b.color }} />
              </div>
              <span style={{ width: 32, textAlign: 'right', fontWeight: 600, color: b.color, fontFamily: 'ui-monospace, monospace' }}>{b.pct}%</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// FLIGHT NURSE
// ============================================================================

function NurseHome({ persona }) {
  const eligible = OPEN_SHIFTS.filter(s => s.specialty === 'flight_nurse');
  return (
    <div className="p-6">
      <PageHeader persona={persona} subtitle="Personal schedule · Open shifts · Cert tracking" />
      <BulletinBar />
      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricTile label="Shifts This Mo" value="7" sub="84 hrs" color={FLUENT.brand} />
        <MetricTile label="Open Shifts" value={eligible.length} sub="eligible" color={FLUENT.warnAccent} />
        <MetricTile label="Certs Exp 60d" value="1" sub="PALS 06/12" color={FLUENT.warnAccent} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Eligible Open Shifts" subtitle="Filtered by your certs">
          {eligible.map(s => (
            <div key={s.id} className="py-2" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
              <div className="flex items-baseline justify-between mb-1">
                <span style={{ fontSize: 12, fontWeight: 600 }}>{s.base}</span>
                <span style={{ fontSize: 10, color: FLUENT.good, fontWeight: 600 }}>{s.differential}</span>
              </div>
              <div style={{ fontSize: 10, color: FLUENT.textSub, marginBottom: 5 }}>{s.date} · {s.time}</div>
              <FluentButton primary>Claim shift</FluentButton>
            </div>
          ))}
        </Card>

        <Card title="My Certifications" subtitle="From CompleteFlight">
          {[
            { name: 'CCRN', exp: '2027-08-14', days: 477 },
            { name: 'TNCC', exp: '2026-11-03', days: 193 },
            { name: 'PALS', exp: '2026-06-12', days: 49, expiring: true },
            { name: 'STABLE', exp: '2027-02-28', days: 310 },
            { name: 'ACLS', exp: '2026-12-05', days: 225 },
          ].map(c => (
            <div key={c.name} className="flex items-center gap-2 py-1.5" style={{ borderBottom: `1px solid ${FLUENT.border}`, fontSize: 11 }}>
              <CheckCircle2 size={13} style={{ color: c.expiring ? FLUENT.warnAccent : FLUENT.good }} />
              <span style={{ fontWeight: 600, fontFamily: 'ui-monospace, monospace', width: 56 }}>{c.name}</span>
              <span style={{ flex: 1, color: FLUENT.textSub }}>Expires {c.exp}</span>
              <span style={{ color: c.expiring ? FLUENT.warnAccent : FLUENT.textSub, fontWeight: 600 }}>{c.days}d</span>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
