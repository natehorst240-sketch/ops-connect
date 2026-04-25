import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, Calendar as CalIcon,
  AlertTriangle, Wrench, Plane, GraduationCap, Users, Clock,
  Sparkles, Shield, ExternalLink,
} from 'lucide-react';

// ============================================================================
// WeekCalendar — shared scheduling engine component
// ----------------------------------------------------------------------------
// FullCalendar-style week view. Days as columns, events as cards inside each
// day cell. Used as the home-screen focal point for every persona on both
// the MX Connect side and the M365 side. Same visual on both — this is the
// WorksCalendar engine appearing consistently across the demo.
//
// Event types and colors are standardized so the legend reads the same
// regardless of who's looking at it.
// ============================================================================

export const EVENT_TYPES = {
  inspection: { label: 'Inspection',     color: '#eab308', bg: 'rgba(234,179,8,0.12)',  border: '#eab30855', textColor: '#fcd34d', icon: Wrench },
  mx:         { label: 'Scheduled MX',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: '#3b82f655', textColor: '#93c5fd', icon: Wrench },
  aog:        { label: 'AOG',            color: '#ef4444', bg: 'rgba(239,68,68,0.18)',  border: '#ef4444aa', textColor: '#fca5a5', icon: AlertTriangle, pulse: true },
  pr:         { label: 'PR Flight',      color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: '#a855f755', textColor: '#d8b4fe', icon: Plane },
  training:   { label: 'Training',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: '#22c55e55', textColor: '#86efac', icon: GraduationCap },
  crew_shift: { label: 'Crew Shift',     color: '#ff6b1a', bg: 'rgba(255,107,26,0.12)', border: '#ff6b1a55', textColor: '#fdba74', icon: Users },
  open_shift: { label: 'Open Shift',     color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  border: '#06b6d455', textColor: '#67e8f9', icon: Clock },
  cert_exp:   { label: 'Cert Expiry',    color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: '#fbbf2466', textColor: '#fde68a', icon: Shield, dashed: true },
  time_off:   { label: 'Time Off',       color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: '#94a3b855', textColor: '#cbd5e1', icon: CalIcon },
  audit:      { label: 'Audit Event',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', border: '#8b5cf655', textColor: '#c4b5fd', icon: Shield },
  approval:   { label: 'Approval',       color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: '#10b98155', textColor: '#6ee7b7', icon: Sparkles },
  summary:    { label: 'Summary',        color: '#64748b', bg: 'rgba(100,116,139,0.18)', border: '#64748baa', textColor: '#e2e8f0', icon: CalIcon },
};

// ============================================================================
// Date helpers — week starts Monday
// ============================================================================

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // Move to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function fmtISO(date) {
  return date.toISOString().slice(0, 10);
}

function fmtMonthDay(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDayShort(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function fmtDayNum(date) {
  return date.getDate();
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

// Returns true if the event spans the given day (inclusive of date and endDate)
function eventOnDay(event, day) {
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : start;
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return day >= start && day <= end;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WeekCalendar({
  events = [],
  title,
  subtitle,
  scopeLabel,
  density = 'normal',     // 'normal' | 'condensed'
  showLegend = true,
  onEventClick,
  initialDate = '2026-04-25',  // Saturday Apr 25 — today in demo
}) {
  const [anchorDate, setAnchorDate] = useState(new Date(initialDate));
  const [view, setView] = useState('week'); // 'week' | 'month'

  const weekStart = startOfWeek(anchorDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date('2026-04-25');

  // Group events by day
  const eventsByDay = days.map(d => ({
    day: d,
    events: events.filter(e => eventOnDay(e, d)),
  }));

  // Active event types in this week (for legend filtering)
  const activeTypes = new Set();
  events.forEach(e => {
    if (eventsByDay.some(({ events: dayEvts }) => dayEvts.includes(e))) {
      activeTypes.add(e.type);
    }
  });

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden mb-5"
         style={{ borderTop: '2px solid #ff6b1a' }}>
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-neutral-800 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-orange-400" />
            <span className="mono text-[10px] uppercase tracking-widest text-orange-400 font-semibold">
              WorksCalendar
            </span>
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight">
              {title || 'My Week'}
            </div>
            {(subtitle || scopeLabel) && (
              <div className="text-[11px] text-neutral-400 mt-0.5">
                {scopeLabel && <span className="mono">{scopeLabel}</span>}
                {scopeLabel && subtitle && <span className="text-neutral-600 mx-1.5">·</span>}
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mono text-[11px] text-neutral-400 px-2">
            {fmtMonthDay(weekStart)} – {fmtMonthDay(addDays(weekStart, 6))}
          </div>
          <div className="flex gap-0.5">
            <NavBtn icon={ChevronLeft}  onClick={() => setAnchorDate(addDays(anchorDate, -7))} />
            <button
              onClick={() => setAnchorDate(today)}
              className="mono text-[10px] uppercase tracking-widest font-semibold px-2.5 h-7 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:bg-neutral-700"
            >
              Today
            </button>
            <NavBtn icon={ChevronRight} onClick={() => setAnchorDate(addDays(anchorDate, 7))} />
          </div>

          <div className="flex bg-neutral-800 border border-neutral-700 rounded overflow-hidden">
            {['week', 'month'].map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`mono text-[10px] uppercase tracking-widest font-semibold px-2.5 h-7 ${
                  view === v
                    ? 'bg-orange-500 text-black'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      {view === 'week' ? (
        <WeekGrid eventsByDay={eventsByDay} today={today} density={density} onEventClick={onEventClick} />
      ) : (
        <MonthView anchorDate={anchorDate} events={events} today={today} onEventClick={onEventClick} />
      )}

      {/* Legend */}
      {showLegend && activeTypes.size > 0 && (
        <div className="px-5 py-2.5 border-t border-neutral-800 flex items-center gap-3 flex-wrap bg-neutral-950/40">
          {[...activeTypes].map(t => {
            const cfg = EVENT_TYPES[t];
            if (!cfg) return null;
            return (
              <div key={t} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: cfg.color }} />
                <span className="mono text-[10px] uppercase tracking-wider text-neutral-400">
                  {cfg.label}
                </span>
              </div>
            );
          })}
          <div className="ml-auto mono text-[10px] text-neutral-600">
            Powered by WorksCalendar engine
          </div>
        </div>
      )}
    </div>
  );
}

function NavBtn({ icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-7 h-7 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-neutral-400 hover:text-orange-400 hover:bg-neutral-700"
    >
      <Icon size={14} />
    </button>
  );
}

// ============================================================================
// WEEK GRID — days as columns, events as cards
// ============================================================================

function WeekGrid({ eventsByDay, today, density, onEventClick }) {
  const cellMinHeight = density === 'condensed' ? 100 : 160;

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-neutral-950 border-b border-neutral-800">
        {eventsByDay.map(({ day }, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={i} className={`px-2 py-2 text-center ${i > 0 ? 'border-l border-neutral-800' : ''} ${isToday ? 'bg-orange-500/[0.08]' : ''}`}>
              <div className={`mono text-[10px] tracking-wider ${isToday ? 'text-orange-400 font-semibold' : 'text-neutral-500'}`}>
                {fmtDayShort(day)}
              </div>
              <div className={`text-[16px] font-semibold mt-0.5 ${isToday ? 'text-orange-400' : 'text-neutral-200'}`}>
                {fmtDayNum(day)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7" style={{ minHeight: cellMinHeight }}>
        {eventsByDay.map(({ day, events }, i) => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={`p-1.5 space-y-1 ${i > 0 ? 'border-l border-neutral-800' : ''} ${isToday ? 'bg-orange-500/[0.025]' : ''}`}
              style={{ minHeight: cellMinHeight }}
            >
              {events.length === 0 && (
                <div className="text-[10px] text-neutral-700 text-center py-3 mono">—</div>
              )}
              {events.map(evt => (
                <EventCard
                  key={`${evt.id}-${i}`}
                  event={evt}
                  density={density}
                  onClick={() => onEventClick && onEventClick(evt)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// EVENT CARD
// ============================================================================

function EventCard({ event, density, onClick }) {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.summary;
  const Icon = cfg.icon;

  return (
    <div
      onClick={onClick}
      className={`rounded px-1.5 py-1 cursor-pointer hover:opacity-90 transition-opacity ${cfg.pulse ? 'pulse-red' : ''}`}
      style={{
        background: cfg.bg,
        borderLeft: `2px ${cfg.dashed ? 'dashed' : 'solid'} ${cfg.color}`,
        color: cfg.textColor,
      }}
      title={event.detail || event.title}
    >
      <div className="flex items-start gap-1">
        <Icon size={9} className="mt-[2px] shrink-0" style={{ color: cfg.color }} />
        <div className="min-w-0 flex-1">
          <div className="mono text-[10px] font-semibold leading-tight truncate">
            {event.title}
          </div>
          {density === 'normal' && event.detail && (
            <div className="text-[9px] leading-tight mt-0.5 opacity-75 truncate">
              {event.detail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MONTH VIEW — simpler aggregate, click drills back to week
// ============================================================================

function MonthView({ anchorDate, events, today, onEventClick }) {
  const monthStart = new Date(anchorDate);
  monthStart.setDate(1);
  const calStart = startOfWeek(monthStart);

  // Show 5-6 weeks to cover the month
  const cells = Array.from({ length: 42 }, (_, i) => addDays(calStart, i));

  // Trim to last day with events or end-of-month
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
  const visibleCells = cells.slice(0, Math.ceil((monthEnd - calStart) / (1000 * 60 * 60 * 24) + 1) <= 35 ? 35 : 42);

  return (
    <div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 bg-neutral-950 border-b border-neutral-800">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
          <div key={d} className={`px-2 py-1.5 text-center ${i > 0 ? 'border-l border-neutral-800' : ''}`}>
            <span className="mono text-[10px] uppercase tracking-wider text-neutral-500">{d}</span>
          </div>
        ))}
      </div>

      {/* Month cells */}
      <div className="grid grid-cols-7">
        {visibleCells.map((day, i) => {
          const inMonth = day.getMonth() === monthStart.getMonth();
          const isToday = isSameDay(day, today);
          const dayEvents = events.filter(e => eventOnDay(e, day));
          const counts = {};
          dayEvents.forEach(e => { counts[e.type] = (counts[e.type] || 0) + 1; });

          return (
            <div
              key={i}
              className={`p-1.5 ${i % 7 > 0 ? 'border-l border-neutral-800' : ''} ${i >= 7 ? 'border-t border-neutral-800' : ''} ${isToday ? 'bg-orange-500/[0.05]' : ''}`}
              style={{ minHeight: 70 }}
            >
              <div className={`text-[11px] font-medium mb-1 ${
                isToday ? 'text-orange-400' : inMonth ? 'text-neutral-300' : 'text-neutral-600'
              }`}>
                {fmtDayNum(day)}
              </div>
              <div className="flex flex-wrap gap-0.5">
                {Object.entries(counts).map(([type, n]) => {
                  const cfg = EVENT_TYPES[type];
                  if (!cfg) return null;
                  return (
                    <div
                      key={type}
                      className="mono text-[9px] px-1 py-0.5 rounded font-semibold"
                      style={{ background: cfg.bg, color: cfg.textColor, border: `1px solid ${cfg.border}` }}
                      title={`${n} ${cfg.label}${n > 1 ? 's' : ''}`}
                    >
                      {n}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
