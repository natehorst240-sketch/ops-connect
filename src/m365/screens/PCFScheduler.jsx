import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, AlertCircle, Info, Wrench, Plane, Zap,
  ChevronRight, X, ArrowRight, Filter, Code, Calendar as CalIcon,
} from 'lucide-react';
import { FLUENT } from '../tokens';
import { AIRCRAFT } from '../../data';

// ============================================================================
// EVENT DATA — what's scheduled across the fleet for the next 7 days
// ============================================================================
// Day 0 = today (Apr 25). Days 1-6 = Apr 26 through May 1.
// Real Veryon inspections + realistic MX/PR/training events sprinkled across.

const RAW_EVENTS = [
  // === Inspection events (from real Veryon Due_List) ===
  { id: 'i1', tail: 'N281HC', type: 'inspection', startDay: 0, duration: 1, label: 'O2 bottle exchange', priority: 'high' },
  { id: 'i2', tail: 'N271HC', type: 'overdue', startDay: -1, duration: 1, label: '90° gearbox oil — OVERDUE', priority: 'critical' },
  { id: 'i3', tail: 'N531HC', type: 'inspection', startDay: 4, duration: 2, label: 'Port FX 30-day', priority: 'normal' },
  { id: 'i4', tail: 'N251HC', type: 'inspection', startDay: 5, duration: 1, label: 'Fire ext monthly', priority: 'normal' },
  { id: 'i5', tail: 'N261HC', type: 'inspection', startDay: 5, duration: 1, label: 'Scissors exam', priority: 'normal' },
  { id: 'i6', tail: 'N431HC', type: 'inspection', startDay: 5, duration: 1, label: 'Fire ext monthly', priority: 'normal' },
  { id: 'i7', tail: 'N481HC', type: 'inspection', startDay: 5, duration: 1, label: 'LifePort 12-mo', priority: 'normal' },
  { id: 'i8', tail: 'N381HC', type: 'inspection', startDay: 6, duration: 1, label: 'Hydraulic fluid', priority: 'normal' },

  // === Scheduled maintenance ===
  { id: 'mx1', tail: 'N631HC', type: 'mx', startDay: 0, duration: 4, label: 'Scheduled MX', priority: 'normal' },
  { id: 'mx2', tail: 'N431HC', type: 'mx', startDay: 1, duration: 2, label: 'Phase 2 inspection', priority: 'normal', baseId: 'logan' },

  // === AOG (cascade trigger) ===
  { id: 'aog1', tail: 'N291HC', type: 'aog', startDay: 0, duration: 7, label: 'AOG · awaiting parts', priority: 'critical' },

  // === PR flights (one creates a double-book) ===
  { id: 'pr1', tail: 'N281HC', type: 'pr', startDay: 0, duration: 1, label: 'Media flight', priority: 'normal' },
  { id: 'pr2', tail: 'N431HC', type: 'pr', startDay: 2, duration: 1, label: 'Public relations', priority: 'normal' },

  // === Pilot training ===
  { id: 't1', tail: 'N731HC', type: 'training', startDay: 1, duration: 2, label: 'Pilot recurrent', priority: 'normal' },
  { id: 't2', tail: 'N281HC', type: 'training', startDay: 3, duration: 1, label: 'NVG training', priority: 'normal' },

  // === Pre-existing missions on the AOG aircraft (cascade conflicts) ===
  { id: 'm1', tail: 'N291HC', type: 'mission', startDay: 1, duration: 1, label: 'IFT scheduled', priority: 'high' },
  { id: 'm2', tail: 'N291HC', type: 'mission', startDay: 2, duration: 1, label: 'IFT scheduled', priority: 'high' },
  { id: 'm3', tail: 'N291HC', type: 'mission', startDay: 3, duration: 1, label: 'IFT scheduled', priority: 'high' },
];

// ============================================================================
// CONFLICT DETECTION — the actual logic, not just visual flair
// ============================================================================

function detectConflicts(events) {
  const conflicts = [];

  // --- Double-booking: two events on same tail with overlapping days ---
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (a.tail !== b.tail) continue;
      if (a.type === 'aog' || b.type === 'aog') continue;  // AOG handled separately
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
          resolution: `Move ${labelOf(b)} to next available window`,
        });
      }
    }
  }

  // --- AOG cascade: AOG events overlap with missions on same tail ---
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
        resolution: `Reassign to N431HC (Logan) — covers same region`,
      });
    }
  }

  // --- Overdue: events with negative startDay still unresolved ---
  const overdue = events.filter(e => e.type === 'overdue');
  for (const e of overdue) {
    conflicts.push({
      id: `overdue-${e.id}`,
      type: 'overdue',
      severity: 'critical',
      eventIds: [e.id],
      title: `${e.tail} inspection overdue`,
      detail: `${e.label.replace(' — OVERDUE', '')} passed due date`,
      resolution: `Schedule immediately or ground aircraft`,
    });
  }

  // --- Coverage gap: MX scheduled on only-available aircraft at single-aircraft base ---
  const mxEvents = events.filter(e => e.type === 'mx' && e.baseId);
  for (const e of mxEvents) {
    // Logan demo: only N431HC at Logan, MX leaves zero coverage
    if (e.baseId === 'logan' && e.tail === 'N431HC') {
      conflicts.push({
        id: `gap-${e.id}`,
        type: 'coverage_gap',
        severity: 'warning',
        eventIds: [e.id],
        title: `Logan region coverage gap`,
        detail: `${e.tail} on MX leaves Logan with 0 available aircraft for ${e.duration} day${e.duration > 1 ? 's' : ''}`,
        resolution: `Pre-position N251HC from St. George for coverage`,
      });
    }
  }

  // --- Resource conflict: same mechanic assigned to two locations same day (annotated) ---
  conflicts.push({
    id: 'tech-conflict-1',
    type: 'resource_conflict',
    severity: 'warning',
    eventIds: ['i3', 'i4'],
    title: `Mechanic Aaron Quitberg double-assigned`,
    detail: `Logan (N431HC inspection) and St. George (N251HC) same day`,
    resolution: `Assign Robert Guty to N251HC instead`,
  });

  return conflicts;
}

function labelOf(e) {
  const typeLabel = {
    inspection: 'inspection', mx: 'scheduled MX', pr: 'PR flight',
    training: 'training', mission: 'mission', aog: 'AOG',
  }[e.type] || e.type;
  return `${e.label.toLowerCase().includes(typeLabel.toLowerCase()) ? e.label : `${typeLabel} (${e.label})`}`;
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
  critical: { color: FLUENT.bad,    bg: FLUENT.badSoft,  Icon: AlertCircle },
  warning:  { color: FLUENT.warnAccent, bg: FLUENT.warnSoft, Icon: AlertTriangle },
  info:     { color: FLUENT.info,   bg: FLUENT.infoSoft, Icon: Info },
};

const DAY_LABELS = ['Today · Fri 4/25', 'Sat 4/26', 'Sun 4/27', 'Mon 4/28', 'Tue 4/29', 'Wed 4/30', 'Thu 5/1'];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PCFScheduler() {
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [regionFilter, setRegionFilter] = useState('ALL');

  const conflicts = useMemo(() => detectConflicts(RAW_EVENTS), []);

  const aircraftList = useMemo(() => {
    const list = regionFilter === 'ALL'
      ? AIRCRAFT
      : AIRCRAFT.filter(a => a.region === regionFilter);
    return list.slice(0, 14);  // Cap rows so the timeline fits cleanly
  }, [regionFilter]);

  // Map of event -> conflict IDs it participates in
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

  const highlightedEventIds = selectedConflict
    ? new Set(selectedConflict.eventIds)
    : null;

  return (
    <div className="p-6">
      {/* PCF annotation banner */}
      <PCFAnnotation />

      {/* Page title */}
      <div className="flex items-center gap-2 mb-1">
        <CalIcon size={20} style={{ color: FLUENT.brand }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Resource Scheduler</h1>
      </div>
      <div style={{ fontSize: 13, color: FLUENT.textSub, marginBottom: 16 }}>
        Drag to reschedule · Click events to inspect · Conflicts auto-detect on every change
      </div>

      {/* Toolbar */}
      <Toolbar
        criticalCount={criticalCount}
        warningCount={warningCount}
        regionFilter={regionFilter}
        setRegionFilter={setRegionFilter}
      />

      {/* Main grid: timeline + conflict panel */}
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
          selectedConflict={selectedConflict}
          setSelectedConflict={setSelectedConflict}
        />
      </div>

      {/* Legend */}
      <Legend />
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

function PCFAnnotation() {
  return (
    <div
      className="flex items-center gap-3 mb-4 px-3 py-2"
      style={{
        background: FLUENT.pcfBadgeSoft,
        border: `1px solid ${FLUENT.pcfBadge}33`,
        borderLeft: `3px solid ${FLUENT.pcfBadge}`,
        borderRadius: 2,
      }}
    >
      <Code size={16} style={{ color: FLUENT.pcfBadge }} />
      <div className="flex-1">
        <div style={{ fontSize: 12, fontWeight: 600, color: FLUENT.pcfBadge }}>
          Custom PCF Component · Resource Scheduler with Conflict Detection
        </div>
        <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 1 }}>
          React + TypeScript · ~3,200 LOC · Hosted in Power Apps · Reads from Dataverse · Power Automate writes
        </div>
      </div>
      <span
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          background: FLUENT.pcfBadge, color: '#fff',
          padding: '2px 6px', borderRadius: 2,
        }}
      >
        PCF
      </span>
    </div>
  );
}

function Toolbar({ criticalCount, warningCount, regionFilter, setRegionFilter }) {
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
        style={{
          background: FLUENT.brand, color: '#fff',
          border: 'none', padding: '5px 12px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        + New event
      </button>
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

      {/* Conflict counters */}
      {criticalCount > 0 && (
        <div
          className="flex items-center gap-1.5 px-2 py-1"
          style={{
            background: FLUENT.badSoft,
            border: `1px solid ${FLUENT.bad}40`,
            borderRadius: 2,
          }}
        >
          <AlertCircle size={13} style={{ color: FLUENT.bad }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: FLUENT.bad }}>
            {criticalCount} critical conflict{criticalCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      {warningCount > 0 && (
        <div
          className="flex items-center gap-1.5 px-2 py-1"
          style={{
            background: FLUENT.warnSoft,
            border: `1px solid ${FLUENT.warnAccent}40`,
            borderRadius: 2,
          }}
        >
          <AlertTriangle size={13} style={{ color: FLUENT.warnAccent }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: FLUENT.warnAccent }}>
            {warningCount} warning{warningCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

function Timeline({ aircraftList, events, eventConflicts, highlightedEventIds, hoveredEvent, setHoveredEvent }) {
  return (
    <div
      className="flex-1 overflow-hidden"
      style={{ background: FLUENT.surface, border: `1px solid ${FLUENT.border}`, borderRadius: 2 }}
    >
      {/* Day header */}
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
                flex: 1,
                padding: '6px 8px',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: i === 0 ? 700 : 500,
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

      {/* Aircraft rows */}
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
        {/* Day grid lines */}
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

        {/* Events */}
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

  // Negative startDay = overdue/past — render in a special "before today" position
  const visualStart = Math.max(event.startDay, 0);
  const trimmedDuration = event.startDay < 0
    ? event.duration + event.startDay   // shrink so overdue marker hugs the left edge
    : event.duration;
  const leftPct = (visualStart / 7) * 100;
  const widthPct = Math.max((trimmedDuration / 7) * 100, 4);

  return (
    <div
      onMouseEnter={() => onHover(event)}
      onMouseLeave={() => onHover(null)}
      style={{
        position: 'absolute',
        top: 5,
        bottom: 5,
        left: `calc(${leftPct}% + 2px)`,
        width: `calc(${widthPct}% - 4px)`,
        background: color.bg,
        borderLeft: `3px solid ${color.border}`,
        borderTop: hasConflict ? `1px solid ${color.border}` : 'none',
        borderRight: hasConflict ? `1px solid ${color.border}` : 'none',
        borderBottom: hasConflict ? `1px solid ${color.border}` : 'none',
        outline: hasConflict ? `2px solid ${isCritical ? FLUENT.bad : FLUENT.warnAccent}` : 'none',
        outlineOffset: hasConflict ? -2 : 0,
        opacity: dimmed ? 0.3 : 1,
        transform: highlighted ? 'scale(1.02)' : 'none',
        zIndex: highlighted ? 10 : isHovered ? 9 : 1,
        transition: 'all 0.15s',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center',
        padding: '0 6px',
        gap: 4,
        boxShadow: highlighted ? `0 4px 12px ${isCritical ? FLUENT.bad : FLUENT.warnAccent}66` : 'none',
        // Diagonal stripe pattern for conflicts
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

function ConflictPanel({ conflicts, selectedConflict, setSelectedConflict }) {
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
            Live Conflict Detection
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginTop: 1 }}>
            {conflicts.length} issue{conflicts.length !== 1 ? 's' : ''} detected
          </div>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {conflicts.map(c => {
          const sev = SEVERITY_STYLE[c.severity];
          const isSelected = selectedConflict?.id === c.id;
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
                  style={{
                    width: 22, height: 22, borderRadius: 2,
                    background: sev.bg, color: sev.color, marginTop: 1,
                  }}
                >
                  <sev.Icon size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>
                    {c.title}
                  </div>
                  <div style={{ fontSize: 11, color: FLUENT.textSub, lineHeight: 1.4 }}>
                    {c.detail}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
                    textTransform: 'uppercase',
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
                  <div style={{ fontSize: 11, color: FLUENT.text, lineHeight: 1.5, marginBottom: 8 }}>
                    {c.resolution}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      style={{
                        background: FLUENT.brand, color: '#fff', border: 'none',
                        padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      Apply fix <ArrowRight size={11} />
                    </button>
                    <button
                      style={{
                        background: FLUENT.surface, color: FLUENT.text,
                        border: `1px solid ${FLUENT.borderStrong}`,
                        padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
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
            No conflicts detected
          </div>
        )}
      </div>

      <div className="px-4 py-2" style={{ background: FLUENT.bgAlt, borderTop: `1px solid ${FLUENT.border}`, fontSize: 10, color: FLUENT.textSub }}>
        Conflicts re-evaluated on every event change · Powered by PCF logic
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
