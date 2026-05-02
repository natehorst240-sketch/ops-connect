import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, AlertCircle, Info, ExternalLink, RefreshCcw,
  Filter, Calendar as CalIcon, Lock, Database,
} from 'lucide-react';
import { FLUENT } from '../tokens';
import { AIRCRAFT } from '../../data';

// ============================================================================
// RESOURCE SCHEDULER — stock Power Apps, read-only
// ----------------------------------------------------------------------------
// Schedule data lives in CompleteFlight (inspections, training) and ProteanHub
// (missions, MX, AOG, PR). Both expose read-only APIs. Power Automate flows
// poll every 15 min via API key auth, upsert into Dataverse cr_schedule_event,
// and trigger a second flow that detects conflicts + coverage gaps server-side
// and caches results in cr_conflict.
//
// This canvas-app screen is READ-ONLY. To make a change, schedulers click
// "Open in <source>" — the source system makes the edit, the next 15-min
// sync picks it up.
//
// Built entirely with stock Power Apps controls — galleries, containers,
// buttons, labels, conditional formatting in Power Fx. No PCF, no custom code.
// ============================================================================

// Demo data (in production this lives in Dataverse cr_schedule_event,
// populated by Power Automate from CompleteFlight + ProteanHub).
const RAW_EVENTS = [
  { id: 'i1', tail: 'N281HC', type: 'inspection', startDay: 0, duration: 1, label: 'O2 bottle exchange', priority: 'high' },
  { id: 'i2', tail: 'N271HC', type: 'overdue',    startDay: -1, duration: 1, label: '90° gearbox oil — OVERDUE', priority: 'critical' },
  { id: 'i3', tail: 'N531HC', type: 'inspection', startDay: 4, duration: 2, label: 'Port FX 30-day', priority: 'normal' },
  { id: 'i4', tail: 'N251HC', type: 'inspection', startDay: 5, duration: 1, label: 'Fire ext monthly', priority: 'normal' },
  { id: 'i5', tail: 'N261HC', type: 'inspection', startDay: 5, duration: 1, label: 'Scissors exam', priority: 'normal' },
  { id: 'i6', tail: 'N431HC', type: 'inspection', startDay: 5, duration: 1, label: 'Fire ext monthly', priority: 'normal' },
  { id: 'i7', tail: 'N481HC', type: 'inspection', startDay: 5, duration: 1, label: 'LifePort 12-mo', priority: 'normal' },
  { id: 'i8', tail: 'N381HC', type: 'inspection', startDay: 6, duration: 1, label: 'Hydraulic fluid', priority: 'normal' },

  { id: 'mx1', tail: 'N631HC', type: 'mx', startDay: 0, duration: 4, label: 'Scheduled MX', priority: 'normal' },
  { id: 'mx2', tail: 'N431HC', type: 'mx', startDay: 1, duration: 2, label: 'Phase 2 inspection', priority: 'normal', baseId: 'logan' },

  { id: 'aog1', tail: 'N291HC', type: 'aog', startDay: 0, duration: 7, label: 'AOG · awaiting parts', priority: 'critical' },

  { id: 'pr1', tail: 'N281HC', type: 'pr', startDay: 0, duration: 1, label: 'Media flight', priority: 'normal' },
  { id: 'pr2', tail: 'N431HC', type: 'pr', startDay: 2, duration: 1, label: 'Public relations', priority: 'normal' },

  { id: 't1', tail: 'N731HC', type: 'training', startDay: 1, duration: 2, label: 'Pilot recurrent', priority: 'normal' },
  { id: 't2', tail: 'N281HC', type: 'training', startDay: 3, duration: 1, label: 'NVG training', priority: 'normal' },

  { id: 'm1', tail: 'N291HC', type: 'mission', startDay: 1, duration: 1, label: 'IFT scheduled', priority: 'high' },
  { id: 'm2', tail: 'N291HC', type: 'mission', startDay: 2, duration: 1, label: 'IFT scheduled', priority: 'high' },
  { id: 'm3', tail: 'N291HC', type: 'mission', startDay: 3, duration: 1, label: 'IFT scheduled', priority: 'high' },
];

// Source-of-truth mapping. Determines which deep-link a conflict resolution opens.
const SOURCE_BY_TYPE = {
  inspection: { name: 'CompleteFlight', color: '#0078d4' },
  overdue:    { name: 'CompleteFlight', color: '#0078d4' },
  training:   { name: 'CompleteFlight', color: '#0078d4' },
  mx:         { name: 'ProteanHub',     color: '#5c2d91' },
  aog:        { name: 'ProteanHub',     color: '#5c2d91' },
  pr:         { name: 'ProteanHub',     color: '#5c2d91' },
  mission:    { name: 'ProteanHub',     color: '#5c2d91' },
};

function sourceForEventIds(events, eventIds) {
  // For multi-event conflicts, return the source that owns the first event.
  const first = events.find(e => eventIds.includes(e.id));
  return first ? SOURCE_BY_TYPE[first.type] : { name: 'source system', color: FLUENT.textSub };
}

// ============================================================================
// CONFLICT DETECTION — runs in Power Automate, cached in cr_conflict.
// Mirrored here for the demo; in production this returns from Dataverse.
// ============================================================================

function detectConflicts(events) {
  const conflicts = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (a.tail !== b.tail) continue;
      if (a.type === 'aog' || b.type === 'aog') continue;
      const aEnd = a.startDay + a.duration;
      const bEnd = b.startDay + b.duration;
      if (a.startDay < bEnd && b.startDay < aEnd) {
        conflicts.push({
          id: `db-${a.id}-${b.id}`,
          type: 'double_booked',
          severity: 'critical',
          eventIds: [a.id, b.id],
          title: `${a.tail} double-booked`,
          detail: `${labelOf(a)} overlaps with ${labelOf(b)}`,
          suggestion: `Move ${labelOf(b)} to next available window`,
        });
      }
    }
  }

  const aogs = events.filter(e => e.type === 'aog');
  for (const aog of aogs) {
    const aogEnd = aog.startDay + aog.duration;
    const affected = events.filter(e =>
      e.tail === aog.tail && e.id !== aog.id &&
      e.startDay < aogEnd && (e.startDay + e.duration) > aog.startDay
    );
    if (affected.length > 0) {
      conflicts.push({
        id: `cascade-${aog.id}`,
        type: 'aog_cascade',
        severity: 'critical',
        eventIds: [aog.id, ...affected.map(e => e.id)],
        title: `${aog.tail} AOG cascade · ${affected.length} mission${affected.length > 1 ? 's' : ''} affected`,
        detail: `${affected.length} scheduled item${affected.length > 1 ? 's need' : ' needs'} reassignment`,
        suggestion: `Reassign to N431HC (Logan) — covers same region`,
      });
    }
  }

  const overdue = events.filter(e => e.type === 'overdue');
  for (const e of overdue) {
    conflicts.push({
      id: `overdue-${e.id}`,
      type: 'overdue',
      severity: 'critical',
      eventIds: [e.id],
      title: `${e.tail} inspection overdue`,
      detail: `${e.label.replace(' — OVERDUE', '')} passed due date`,
      suggestion: `Schedule immediately or ground aircraft`,
    });
  }

  const mxEvents = events.filter(e => e.type === 'mx' && e.baseId);
  for (const e of mxEvents) {
    if (e.baseId === 'logan' && e.tail === 'N431HC') {
      conflicts.push({
        id: `gap-${e.id}`,
        type: 'coverage_gap',
        severity: 'warning',
        eventIds: [e.id],
        title: `Logan region coverage gap`,
        detail: `${e.tail} on MX leaves Logan with 0 available aircraft for ${e.duration} day${e.duration > 1 ? 's' : ''}`,
        suggestion: `Pre-position N251HC from St. George for coverage`,
      });
    }
  }

  conflicts.push({
    id: 'tech-conflict-1',
    type: 'resource_conflict',
    severity: 'warning',
    eventIds: ['i3', 'i4'],
    title: `Mechanic Aaron Quitberg double-assigned`,
    detail: `Logan (N431HC inspection) and St. George (N251HC) same day`,
    suggestion: `Assign Robert Guty to N251HC instead`,
  });

  return conflicts;
}

function labelOf(e) {
  const typeLabel = {
    inspection: 'inspection', mx: 'scheduled MX', pr: 'PR flight',
    training: 'training', mission: 'mission', aog: 'AOG',
  }[e.type] || e.type;
  return e.label.toLowerCase().includes(typeLabel.toLowerCase()) ? e.label : `${typeLabel} (${e.label})`;
}

// ============================================================================
// VISUAL CONSTANTS
// ============================================================================

const EVENT_COLORS = {
  inspection: { bg: '#fed9b8', border: '#ca5010', text: '#492c0c' },
  mx:         { bg: '#deecf9', border: '#0078d4', text: '#003566' },
  aog:        { bg: '#fde7e9', border: '#a4262c', text: '#6e0e13' },
  pr:         { bg: '#e9defa', border: '#5c2d91', text: '#2e1748' },
  training:   { bg: '#dff6dd', border: '#107c10', text: '#0a3a08' },
  mission:    { bg: '#ffe9c7', border: '#797673', text: '#3a3a3a' },
  overdue:    { bg: '#fde7e9', border: '#a4262c', text: '#6e0e13' },
};

const SEVERITY_STYLE = {
  critical: { color: FLUENT.bad,        bg: FLUENT.badSoft,  Icon: AlertCircle },
  warning:  { color: FLUENT.warnAccent, bg: FLUENT.warnSoft, Icon: AlertTriangle },
  info:     { color: FLUENT.info,       bg: FLUENT.infoSoft, Icon: Info },
};

const DAY_LABELS = ['Today · Fri 4/25', 'Sat 4/26', 'Sun 4/27', 'Mon 4/28', 'Tue 4/29', 'Wed 4/30', 'Thu 5/1'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PCFScheduler() {
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [acknowledged, setAcknowledged] = useState(new Set());
  const [refreshedAt, setRefreshedAt] = useState({ cf: 8, ph: 12 }); // minutes ago, for demo

  const allConflicts = useMemo(() => detectConflicts(RAW_EVENTS), []);
  const conflicts = useMemo(
    () => allConflicts.filter(c => !acknowledged.has(c.id)),
    [allConflicts, acknowledged]
  );

  const aircraftList = useMemo(() => {
    const list = regionFilter === 'ALL' ? AIRCRAFT : AIRCRAFT.filter(a => a.region === regionFilter);
    return list.slice(0, 14);
  }, [regionFilter]);

  const eventConflicts = useMemo(() => {
    const m = {};
    conflicts.forEach(c => c.eventIds.forEach(eid => {
      m[eid] = m[eid] || [];
      m[eid].push(c);
    }));
    return m;
  }, [conflicts]);

  const criticalCount = conflicts.filter(c => c.severity === 'critical').length;
  const warningCount = conflicts.filter(c => c.severity === 'warning').length;
  const highlightedEventIds = selectedConflict ? new Set(selectedConflict.eventIds) : null;

  const handleRefresh = () => setRefreshedAt({ cf: 0, ph: 0 });
  const handleAcknowledge = (id) => {
    setAcknowledged(prev => new Set(prev).add(id));
    setSelectedConflict(null);
  };

  return (
    <div className="p-6">
      <SourceAnnotation />

      <div className="flex items-center gap-2 mb-1">
        <CalIcon size={20} style={{ color: FLUENT.brand }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Resource Scheduler</h1>
        <span
          className="flex items-center gap-1"
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
            background: FLUENT.bgAlt, color: FLUENT.textSub,
            padding: '2px 8px', borderRadius: 2, marginLeft: 6,
            border: `1px solid ${FLUENT.border}`,
          }}
        >
          <Lock size={10} /> Read-only
        </span>
      </div>
      <div style={{ fontSize: 13, color: FLUENT.textSub, marginBottom: 16 }}>
        Mirrors schedules from CompleteFlight + ProteanHub · Edits made at source · 15-min refresh
      </div>

      <Toolbar
        criticalCount={criticalCount}
        warningCount={warningCount}
        regionFilter={regionFilter}
        setRegionFilter={setRegionFilter}
        refreshedAt={refreshedAt}
        onRefresh={handleRefresh}
      />

      <div className="flex gap-4 mt-3">
        <Timeline
          aircraftList={aircraftList}
          events={RAW_EVENTS}
          eventConflicts={eventConflicts}
          highlightedEventIds={highlightedEventIds}
          hoveredEvent={hoveredEvent}
          setHoveredEvent={setHoveredEvent}
        />
        <ConflictPanel
          conflicts={conflicts}
          allEvents={RAW_EVENTS}
          selectedConflict={selectedConflict}
          setSelectedConflict={setSelectedConflict}
          onAcknowledge={handleAcknowledge}
        />
      </div>

      <Legend />
      <DataSourcesFooter />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function SourceAnnotation() {
  return (
    <div
      className="flex items-center gap-3 mb-4 px-3 py-2"
      style={{
        background: FLUENT.infoSoft,
        border: `1px solid ${FLUENT.info}33`,
        borderLeft: `3px solid ${FLUENT.info}`,
        borderRadius: 2,
      }}
    >
      <Database size={16} style={{ color: FLUENT.info }} />
      <div className="flex-1">
        <div style={{ fontSize: 12, fontWeight: 600, color: FLUENT.info }}>
          Stock Power Apps · Read-only mirror · No PCF, no custom code
        </div>
        <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 1 }}>
          Power Automate polls CompleteFlight + ProteanHub via API key every 15 min · Conflict detection runs server-side and caches to <span style={{ fontFamily: 'ui-monospace, monospace' }}>cr_conflict</span> · Canvas app reads only
        </div>
      </div>
      <span
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          background: FLUENT.info, color: '#fff',
          padding: '2px 6px', borderRadius: 2,
        }}
      >
        STOCK
      </span>
    </div>
  );
}

function Toolbar({ criticalCount, warningCount, regionFilter, setRegionFilter, refreshedAt, onRefresh }) {
  return (
    <div
      className="flex items-center px-3 py-2"
      style={{
        background: FLUENT.surface,
        border: `1px solid ${FLUENT.border}`,
        borderRadius: 2,
        gap: 12,
      }}
    >
      <button
        onClick={onRefresh}
        style={{
          background: FLUENT.brand, color: '#fff',
          border: 'none', padding: '5px 12px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <RefreshCcw size={12} /> Refresh now
      </button>

      <FreshnessIndicator refreshedAt={refreshedAt} />

      <div style={{ width: 1, height: 18, background: FLUENT.border }} />

      <div className="flex items-center gap-2">
        <Filter size={13} style={{ color: FLUENT.textSub }} />
        <select
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
          style={{
            fontSize: 12, padding: '3px 6px',
            border: `1px solid ${FLUENT.borderStrong}`,
            background: FLUENT.surface, color: FLUENT.text,
            borderRadius: 2,
          }}
        >
          <option value="ALL">All Regions</option>
          <option value="109 UT">109 UT</option>
          <option value="SLC FW">SLC FW</option>
          <option value="WY/MT">WY/MT</option>
          <option value="ID/NV">ID/NV</option>
          <option value="CO/NM">CO/NM</option>
          <option value="UT/AZ">UT/AZ</option>
        </select>
      </div>

      <div className="flex-1" />

      {criticalCount > 0 && (
        <div
          className="flex items-center gap-1.5 px-2 py-1"
          style={{ background: FLUENT.badSoft, border: `1px solid ${FLUENT.bad}40`, borderRadius: 2 }}
        >
          <AlertCircle size={13} style={{ color: FLUENT.bad }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: FLUENT.bad }}>
            {criticalCount} critical
          </span>
        </div>
      )}
      {warningCount > 0 && (
        <div
          className="flex items-center gap-1.5 px-2 py-1"
          style={{ background: FLUENT.warnSoft, border: `1px solid ${FLUENT.warnAccent}40`, borderRadius: 2 }}
        >
          <AlertTriangle size={13} style={{ color: FLUENT.warnAccent }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: FLUENT.warnAccent }}>
            {warningCount} warning
          </span>
        </div>
      )}
    </div>
  );
}

function FreshnessIndicator({ refreshedAt }) {
  const fmt = (m) => m === 0 ? 'just now' : m === 1 ? '1 min ago' : `${m} min ago`;
  return (
    <div className="flex items-center gap-3" style={{ fontSize: 10.5, color: FLUENT.textSub }}>
      <div className="flex items-center gap-1.5">
        <div style={{ width: 6, height: 6, borderRadius: 3, background: '#0078d4' }} />
        <span>CompleteFlight: <strong style={{ color: FLUENT.text, fontWeight: 600 }}>{fmt(refreshedAt.cf)}</strong></span>
      </div>
      <div className="flex items-center gap-1.5">
        <div style={{ width: 6, height: 6, borderRadius: 3, background: '#5c2d91' }} />
        <span>ProteanHub: <strong style={{ color: FLUENT.text, fontWeight: 600 }}>{fmt(refreshedAt.ph)}</strong></span>
      </div>
    </div>
  );
}

function Timeline({ aircraftList, events, eventConflicts, highlightedEventIds, hoveredEvent, setHoveredEvent }) {
  return (
    <div
      className="flex-1 overflow-hidden"
      style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2 }}
    >
      <div className="flex" style={{ borderBottom: `1px solid ${FLUENT.border}`, background: FLUENT.bgAlt }}>
        <div
          className="shrink-0 px-3 py-2"
          style={{ width: 160, borderRight: `1px solid ${FLUENT.border}`, fontSize: 11, fontWeight: 600, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          Aircraft
        </div>
        <div className="flex flex-1">
          {DAY_LABELS.map((d, i) => (
            <div
              key={i}
              style={{
                flex: 1, padding: '6px 8px', textAlign: 'center',
                fontSize: 11, fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? FLUENT.brand : FLUENT.textSub,
                borderLeft: i > 0 ? `1px solid ${FLUENT.border}` : 'none',
                background: i === 0 ? FLUENT.brandSoft : 'transparent',
              }}
            >
              {d}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxHeight: 460, overflowY: 'auto' }}>
        {aircraftList.map(ac => {
          const acEvents = events.filter(e => e.tail === ac.tail);
          return (
            <AircraftRow
              key={ac.tail}
              aircraft={ac}
              events={acEvents}
              eventConflicts={eventConflicts}
              highlightedEventIds={highlightedEventIds}
              hoveredEvent={hoveredEvent}
              setHoveredEvent={setHoveredEvent}
            />
          );
        })}
      </div>
    </div>
  );
}

function AircraftRow({ aircraft, events, eventConflicts, highlightedEventIds, hoveredEvent, setHoveredEvent }) {
  return (
    <div className="flex" style={{ borderBottom: `1px solid ${FLUENT.border}`, minHeight: 46 }}>
      <div
        className="shrink-0 flex items-center gap-2 px-3"
        style={{ width: 160, borderRight: `1px solid ${FLUENT.border}` }}
      >
        <div
          style={{
            width: 6, height: 6, borderRadius: 3,
            background: aircraft.status === 'IN_SERVICE' ? FLUENT.good
                       : aircraft.status === 'AOG' ? FLUENT.bad
                       : FLUENT.warnAccent,
          }}
        />
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>{aircraft.tail}</div>
          <div style={{ fontSize: 10, color: FLUENT.textSub, fontFamily: 'ui-monospace, monospace' }}>{aircraft.type}</div>
        </div>
      </div>
      <div className="flex flex-1 relative">
        {DAY_LABELS.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              borderLeft: i > 0 ? `1px solid ${FLUENT.border}` : 'none',
              background: i === 0 ? FLUENT.brandSoft + '40' : 'transparent',
            }}
          />
        ))}

        {events.map(e => (
          <EventBar
            key={e.id}
            event={e}
            conflicts={eventConflicts[e.id] || []}
            highlighted={highlightedEventIds?.has(e.id)}
            dimmed={highlightedEventIds && !highlightedEventIds.has(e.id)}
            onHover={setHoveredEvent}
            isHovered={hoveredEvent?.id === e.id}
          />
        ))}
      </div>
    </div>
  );
}

function EventBar({ event, conflicts, highlighted, dimmed, onHover, isHovered }) {
  const color = EVENT_COLORS[event.type] || EVENT_COLORS.mission;
  const hasConflict = conflicts.length > 0;
  const isCritical = conflicts.some(c => c.severity === 'critical');

  const visualStart = Math.max(event.startDay, 0);
  const trimmedDuration = event.startDay < 0 ? event.duration + event.startDay : event.duration;
  const leftPct = (visualStart / 7) * 100;
  const widthPct = Math.max((trimmedDuration / 7) * 100, 4);

  return (
    <div
      onMouseEnter={() => onHover(event)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: 'absolute',
        top: 5, bottom: 5,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: color.bg,
        borderLeft: `3px solid ${color.border}`,
        outline: hasConflict ? `2px solid ${isCritical ? FLUENT.bad : FLUENT.warnAccent}` : 'none',
        outlineOffset: hasConflict ? -2 : 0,
        opacity: dimmed ? 0.3 : 1,
        zIndex: highlighted ? 10 : isHovered ? 9 : 1,
        transition: 'opacity 0.15s, outline 0.15s',
        cursor: 'default',
        display: 'flex', alignItems: 'center',
        padding: '0 6px', gap: 4,
        backgroundImage: hasConflict
          ? `repeating-linear-gradient(45deg, transparent, transparent 4px, ${color.border}22 4px, ${color.border}22 8px), linear-gradient(${color.bg}, ${color.bg})`
          : undefined,
      }}
    >
      {hasConflict && (
        <AlertCircle size={11} style={{ color: isCritical ? FLUENT.bad : FLUENT.warnAccent, flexShrink: 0 }} />
      )}
      <span style={{
        fontSize: 11, fontWeight: 600, color: color.text,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {event.label}
      </span>
    </div>
  );
}

function ConflictPanel({ conflicts, allEvents, selectedConflict, setSelectedConflict, onAcknowledge }) {
  return (
    <div
      style={{
        width: 360,
        background: FLUENT.surface,
        border: `1px solid ${FLUENT.border}`,
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 538,
      }}
    >
      <div className="px-4 py-3 flex items-center" style={{ borderBottom: `1px solid ${FLUENT.border}`, background: FLUENT.bgAlt }}>
        <div className="flex-1">
          <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Detected Conflicts & Gaps
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>
            {conflicts.length} issue{conflicts.length !== 1 ? 's' : ''} flagged
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {conflicts.map(c => {
          const sev = SEVERITY_STYLE[c.severity];
          const isSelected = selectedConflict?.id === c.id;
          const source = sourceForEventIds(allEvents, c.eventIds);
          return (
            <div
              key={c.id}
              onClick={() => setSelectedConflict(isSelected ? null : c)}
              style={{
                padding: '12px 14px',
                borderBottom: `1px solid ${FLUENT.border}`,
                background: isSelected ? FLUENT.brandSoft : 'transparent',
                borderLeft: isSelected ? `3px solid ${FLUENT.brand}` : `3px solid transparent`,
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = FLUENT.surfaceAlt; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 22, height: 22, borderRadius: 2, background: sev.bg, color: sev.color, marginTop: 1 }}
                >
                  <sev.Icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: FLUENT.textSub, lineHeight: 1.4 }}>{c.detail}</div>
                </div>
                <span
                  style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
                    background: sev.bg, color: sev.color,
                    padding: '2px 5px', borderRadius: 2, flexShrink: 0,
                  }}
                >
                  {c.severity}
                </span>
              </div>

              {isSelected && (
                <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${FLUENT.border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>
                    Suggested Resolution
                  </div>
                  <div style={{ fontSize: 11, color: FLUENT.text, lineHeight: 1.5, marginBottom: 10 }}>
                    {c.suggestion}
                  </div>
                  <div style={{ fontSize: 10, color: FLUENT.textSub, lineHeight: 1.5, marginBottom: 8, fontStyle: 'italic' }}>
                    Edits made in {source.name}, not here. Next sync (≤15 min) will reflect the change.
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href="#"
                      onClick={e => e.preventDefault()}
                      style={{
                        background: source.color, color: '#fff', textDecoration: 'none',
                        padding: '4px 10px', fontSize: 11, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 4, borderRadius: 2,
                      }}
                    >
                      <ExternalLink size={11} /> Open in {source.name}
                    </a>
                    <button
                      onClick={e => { e.stopPropagation(); onAcknowledge(c.id); }}
                      style={{
                        background: FLUENT.surface, color: FLUENT.text,
                        border: `1px solid ${FLUENT.borderStrong}`,
                        padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        borderRadius: 2,
                      }}
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {conflicts.length === 0 && (
          <div className="p-4 text-center" style={{ fontSize: 12, color: FLUENT.textSub }}>
            No conflicts detected · clear board
          </div>
        )}
      </div>

      <div className="px-4 py-2" style={{ background: FLUENT.bgAlt, borderTop: `1px solid ${FLUENT.border}`, fontSize: 10, color: FLUENT.textSub }}>
        Acknowledgements stored locally in <span style={{ fontFamily: 'ui-monospace, monospace' }}>cr_conflict_ack</span> · do not propagate to source
      </div>
    </div>
  );
}

function Legend() {
  const items = [
    { label: 'Inspection',     color: EVENT_COLORS.inspection.border },
    { label: 'Scheduled MX',   color: EVENT_COLORS.mx.border },
    { label: 'AOG',            color: EVENT_COLORS.aog.border },
    { label: 'PR Flight',      color: EVENT_COLORS.pr.border },
    { label: 'Training',       color: EVENT_COLORS.training.border },
    { label: 'Active Mission', color: EVENT_COLORS.mission.border },
  ];
  return (
    <div
      className="flex items-center gap-4 mt-3 px-3 py-2 flex-wrap"
      style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2 }}
    >
      {items.map(it => (
        <div key={it.label} className="flex items-center gap-1.5">
          <div style={{ width: 12, height: 12, background: it.color, borderRadius: 2 }} />
          <span style={{ fontSize: 11, color: FLUENT.textSub }}>{it.label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 ml-auto">
        <div style={{ width: 12, height: 12, background: '#fff', border: `2px solid ${FLUENT.bad}`, borderRadius: 2 }} />
        <span style={{ fontSize: 11, color: FLUENT.textSub }}>Outlined = conflict</span>
      </div>
    </div>
  );
}

function DataSourcesFooter() {
  return (
    <div
      className="mt-3 px-3 py-2 flex items-center gap-3 flex-wrap"
      style={{
        background: FLUENT.bgAlt,
        border: `1px solid ${FLUENT.border}`,
        borderRadius: 2,
        fontSize: 10.5, color: FLUENT.textSub,
      }}
    >
      <strong style={{ color: FLUENT.text, fontWeight: 600 }}>Data sources:</strong>
      <div className="flex items-center gap-1.5">
        <div style={{ width: 6, height: 6, borderRadius: 3, background: '#0078d4' }} />
        CompleteFlight (inspections, training)
      </div>
      <div className="flex items-center gap-1.5">
        <div style={{ width: 6, height: 6, borderRadius: 3, background: '#5c2d91' }} />
        ProteanHub (missions, MX, AOG, PR)
      </div>
      <span style={{ color: FLUENT.textDim }}>·</span>
      <span>Refresh: every 15 min via Power Automate · API key auth</span>
      <span style={{ color: FLUENT.textDim }}>·</span>
      <span>Conflict detection: server-side · cached in <span style={{ fontFamily: 'ui-monospace, monospace' }}>cr_conflict</span></span>
    </div>
  );
}
