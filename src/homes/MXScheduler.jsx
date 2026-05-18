import React, { useState } from 'react';
import { Filter, ArrowRight, Users, ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import OncallWidget from '../shared/OncallWidget';
import { AIRCRAFT as STATIC_AIRCRAFT, INSPECTIONS_DUE, PENDING_REQUESTS as STATIC_REQS } from '../data';
import { useFleet } from '../contexts/FleetDataContext';
import { useNavigation } from '../contexts/NavigationContext';
import { PageHeader, Card, Metric, StatusDot, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import CrewSchedulerHome from './CrewScheduler';
import {
  BASE_META,
  REGIONS,
  DEMO_TODAY_ISO,
  getOncallForDate,
  getScheduleRange,
  addDays,
  phoneFor,
} from '../data/mxOncallSchedule';

export default function MXSchedulerHome({ persona }) {
  const navigate = useNavigation();
  const { aircraft: liveAircraft, mxRequests: liveReqs } = useFleet();
  const AIRCRAFT = liveAircraft.length ? liveAircraft : STATIC_AIRCRAFT;
  const PENDING_REQUESTS = liveReqs.length ? liveReqs : STATIC_REQS;
  const [selectedRegion, setSelectedRegion] = useState('ALL');
  const mxRequests = PENDING_REQUESTS.filter(r => r.type === 'MX Schedule' || r.type === 'PR Movement');

  return (
    <>
      <PageHeader persona={persona} subtitle="Owner of the maintenance schedule. Drag entries on the timeline. Approve MX and PR requests. Full visibility across all regions." />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Metric label="Scheduled This Week" value="14" sub="events" accent="#3b82f6" />
        <Metric label="Pending Approval" value={mxRequests.length} accent="#ff6b1a" />
        <Metric label="Conflicts Detected" value="0" accent="#22c55e" />
        <Metric label="Inspections Due 7d" value={INSPECTIONS_DUE.filter(i => i.days <= 7).length} accent="#eab308" />
      </div>

      <div className="mb-5">
        <Card
          title="Resource Timeline — Next 7 Days"
          noPad
          action={
            <div className="flex items-center gap-2">
              <select
                value={selectedRegion}
                onChange={e => setSelectedRegion(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded text-[11px] px-2 py-1 text-neutral-200"
              >
                <option value="ALL">All Regions</option>
                <option value="109 UT">109 UT</option>
                <option value="SLC FW">SLC FW</option>
                <option value="WY/MT">WY/MT</option>
                <option value="ID/NV">ID/NV</option>
                <option value="CO/NM">CO/NM</option>
                <option value="UT/AZ">UT/AZ</option>
                <option value="PAGE">PAGE</option>
                <option value="NC">NC</option>
              </select>
              <button className="mono text-[11px] px-2 py-1 bg-neutral-800 border border-neutral-700 rounded text-neutral-300 hover:text-orange-400">
                <Filter size={11} className="inline mr-1" /> Filters
              </button>
            </div>
          }
        >
          <ResourceTimeline aircraft={AIRCRAFT} selectedRegion={selectedRegion} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Approval Queue — MX + PR" accent="#ff6b1a">
          <div className="space-y-0">
            {mxRequests.map((r, idx) => (
              <div key={r.id} className={`py-3 ${idx !== mxRequests.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-300">{r.type}</span>
                  <span className="mono text-[10px] text-neutral-500">{r.region}</span>
                  <span className="text-[11px] text-neutral-500">{r.submitted}</span>
                </div>
                <div className="text-[13px] font-medium">{r.detail}</div>
                <div className="text-[11px] text-neutral-500 mt-1 mb-2">— {r.submitter}</div>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => navigate('inbox')} className="px-2.5 py-1 text-[11px] bg-green-600 hover:bg-green-500 text-white rounded font-medium">Approve & Schedule</button>
                  <button onClick={() => navigate('scheduler')} className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">Move to Calendar</button>
                  <button onClick={() => navigate('inbox')} className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-red-900/30 hover:text-red-400 text-neutral-200 rounded">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Inspections Due — Action Required" action="Drag to timeline to schedule">
          <div className="space-y-0.5 max-h-80 overflow-y-auto scrollbar pr-1">
            {INSPECTIONS_DUE.slice(0, 10).map((i, idx) => {
              const color = i.level === 'red' ? 'bg-red-500' : i.level === 'amber' ? 'bg-amber-500' : 'bg-green-500';
              const tc = i.level === 'red' ? 'text-red-400' : i.level === 'amber' ? 'text-amber-400' : 'text-green-400';
              return (
                <div key={idx} className="flex items-center gap-3 py-2 px-2 hover:bg-neutral-800/50 rounded cursor-grab group">
                  <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  <div className="mono text-[12px] font-medium w-[72px]">{i.tail}</div>
                  <div className="text-[12px] text-neutral-300 flex-1 truncate">{i.desc}</div>
                  <div className="mono text-[11px] text-neutral-500">{i.due}</div>
                  <div className={`mono text-[11px] w-12 text-right ${tc}`}>{i.days}d</div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight size={12} className="text-orange-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* === MX On-Call Schedule === */}
      <OncallScheduleBoard persona={persona} />

      {/* === Crew Scheduling section — Carla owns this too === */}
      <div className="mt-10 mb-4 pb-2 border-b border-neutral-800 flex items-center gap-2">
        <Users size={16} className="text-orange-400" />
        <h2 className="text-[18px] font-semibold tracking-tight">Crew Scheduling</h2>
        <span className="mono text-[10px] uppercase tracking-widest text-neutral-500 ml-2">Same desk · open shifts, swaps, certifications</span>
      </div>
      <CrewSchedulerHome persona={{
        ...persona,
        role: 'CREW_SCHEDULER',
        roleTitle: 'Crew Scheduling',
        _embedded: true,
      }} />
    </>
  );
}

// ============================================================================
// ON-CALL SCHEDULE BOARD (embedded in MX Scheduler home)
// ============================================================================

const SLOT_COLORS_BOARD = [
  { bg: 'rgba(59,130,246,0.15)', border: '#3b82f6', text: '#93c5fd' },
  { bg: 'rgba(249,115,22,0.15)', border: '#f97316', text: '#fdba74' },
  { bg: 'rgba(168,85,247,0.15)', border: '#a855f7', text: '#d8b4fe' },
  { bg: 'rgba(34,197,94,0.15)',  border: '#22c55e', text: '#86efac' },
];

function fmtShort(iso) {
  const [, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${parseInt(d, 10)}`;
}

function initBoard(name) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function OncallScheduleBoard({ persona }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const viewStart = addDays(DEMO_TODAY_ISO, weekOffset * 7);
  const days = getScheduleRange(viewStart, 7);

  // Collect all bases that appear in the displayed week
  const activeBases = new Set();
  days.forEach(d => Object.keys(d.byBase).forEach(b => activeBases.add(b)));
  const sortedBases = [...activeBases].sort((a, b) => {
    const ri = REGIONS.indexOf(BASE_META[a]?.region ?? '');
    const rj = REGIONS.indexOf(BASE_META[b]?.region ?? '');
    return ri !== rj ? ri - rj : (BASE_META[a]?.label ?? a).localeCompare(BASE_META[b]?.label ?? b);
  });

  return (
    <div className="space-y-0 mt-5">
      {/* Today — grouped by region/base via shared widget */}
      <OncallWidget persona={persona} />

      {/* 7-day grid */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-neutral-950/50 border-b border-neutral-800">
              <th className="text-left px-3 py-2 text-neutral-500 mono font-semibold w-[160px]">Base</th>
              {days.map(({ date }) => (
                <th key={date} className={`px-1 py-2 text-center mono font-semibold whitespace-nowrap ${
                  date === DEMO_TODAY_ISO ? 'text-orange-400' : 'text-neutral-500'
                }`}>
                  {fmtShort(date)}
                  {date === DEMO_TODAY_ISO && <div className="text-[8px] text-orange-500">Today</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedBases.map(base => (
              <tr key={base} className="border-b border-neutral-800/60 hover:bg-neutral-800/10">
                <td className="px-3 py-2 border-r border-neutral-800">
                  <div className="mono text-[11px] font-medium text-neutral-200 leading-tight">
                    {BASE_META[base]?.label ?? base}
                  </div>
                  <div className="mono text-[9px] text-neutral-600">{BASE_META[base]?.region}</div>
                </td>
                {days.map(({ date, byBase }) => {
                  const entries = byBase[base] ?? [];
                  const isToday = date === DEMO_TODAY_ISO;
                  return (
                    <td key={date} className={`px-1 py-1 border-l border-neutral-800/40 align-top ${isToday ? 'bg-orange-500/5' : ''}`}>
                      {entries.map((e, idx) => {
                        const col = SLOT_COLORS_BOARD[idx % SLOT_COLORS_BOARD.length];
                        return (
                          <div key={idx} className="rounded px-1 py-0.5 mb-0.5 text-center"
                            style={{ background: col.bg, borderLeft: `2px solid ${col.border}` }}
                            title={`${e.owner} · ${e.hours}`}>
                            <div className="mono font-bold leading-tight" style={{ color: col.text }}>
                              {initBoard(e.owner)}
                            </div>
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-3 py-2 border-t border-neutral-800 flex items-center gap-1 bg-neutral-950/30">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="w-6 h-6 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-neutral-400 hover:text-orange-400">
            <ChevronLeft size={12} />
          </button>
          <button onClick={() => setWeekOffset(0)}
            className="mono text-[9px] uppercase tracking-widest px-2 h-6 bg-neutral-800 border border-neutral-700 rounded text-neutral-400 hover:text-orange-400">
            Today
          </button>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="w-6 h-6 bg-neutral-800 border border-neutral-700 rounded flex items-center justify-center text-neutral-400 hover:text-orange-400">
            <ChevronRight size={12} />
          </button>
          <span className="ml-auto mono text-[9px] text-neutral-600">CompleteFlight data · May 2026</span>
        </div>
      </div>
    </div>
  );
}

function ResourceTimeline({ aircraft: AIRCRAFT, selectedRegion }) {
  const filtered = selectedRegion === 'ALL'
    ? AIRCRAFT.slice(0, 12)
    : AIRCRAFT.filter(a => a.region === selectedRegion);

  const days = ['Fri 4/25', 'Sat 4/26', 'Sun 4/27', 'Mon 4/28', 'Tue 4/29', 'Wed 4/30', 'Thu 5/1'];

  const eventsByTail = {
    'N251HC': [{ start: 5, duration: 1, type: 'inspection', label: 'Fire ext' }],
    'N261HC': [{ start: 5, duration: 1, type: 'inspection', label: 'Scissors' }],
    'N271HC': [{ start: 3, duration: 1, type: 'inspection', label: 'Gearbox oil' }],
    'N281HC': [{ start: 0, duration: 1, type: 'inspection', label: 'O2 bottle' }],
    'N291HC': [{ start: 0, duration: 7, type: 'aog', label: 'AOG · awaiting parts' }],
    'N431HC': [{ start: 5, duration: 1, type: 'inspection', label: 'Fire ext' }, { start: 2, duration: 1, type: 'pr', label: 'PR flight' }],
    'N531HC': [{ start: 4, duration: 2, type: 'inspection', label: 'Port FX' }],
    'N631HC': [{ start: 0, duration: 4, type: 'mx', label: 'Scheduled MX' }],
    'N731HC': [{ start: 1, duration: 2, type: 'training', label: 'Pilot training' }],
    'N381HC': [{ start: 6, duration: 1, type: 'inspection', label: 'Hyd fluid' }],
    'N481HC': [{ start: 5, duration: 1, type: 'inspection', label: 'LifePort 12mo' }],
    'N581HC': [{ start: 4, duration: 1, type: 'inspection', label: 'Landing gear' }],
  };

  const eventColors = {
    inspection: { bg: 'rgba(234,179,8,0.8)', border: '#eab308', text: '#000' },
    mx: { bg: 'rgba(59,130,246,0.8)', border: '#3b82f6', text: '#fff' },
    aog: { bg: 'rgba(239,68,68,0.85)', border: '#ef4444', text: '#fff' },
    pr: { bg: 'rgba(168,85,247,0.8)', border: '#a855f7', text: '#fff' },
    training: { bg: 'rgba(34,197,94,0.75)', border: '#22c55e', text: '#000' },
  };

  return (
    <div>
      <div className="flex border-b border-neutral-800 bg-neutral-950/50">
        <div className="w-[180px] shrink-0 px-3 py-2 border-r border-neutral-800">
          <div className="mono text-[10px] text-neutral-500 uppercase tracking-wider">Aircraft</div>
        </div>
        <div className="flex flex-1">
          {days.map((d, i) => {
            const isToday = i === 0;
            return (
              <div key={i} className={`flex-1 px-2 py-2 text-center ${i > 0 ? 'border-l border-neutral-800' : ''} ${isToday ? 'bg-orange-500/5' : ''}`}>
                <div className={`mono text-[11px] ${isToday ? 'text-orange-400 font-semibold' : 'text-neutral-400'}`}>{d}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-h-[380px] overflow-y-auto scrollbar">
        {filtered.map(a => {
          const events = eventsByTail[a.tail] || [];
          return (
            <div key={a.tail} className="flex border-b border-neutral-800/60 hover:bg-neutral-800/20">
              <div className="w-[180px] shrink-0 px-3 py-2.5 border-r border-neutral-800 flex items-center gap-2">
                <StatusDot status={a.status} />
                <div>
                  <div className="mono text-[12px] font-medium">{a.tail}</div>
                  <div className="mono text-[10px] text-neutral-500">{a.type}</div>
                </div>
              </div>
              <div className="flex flex-1 relative" style={{ minHeight: 44 }}>
                {days.map((_, i) => (
                  <div key={i} className={`flex-1 ${i > 0 ? 'border-l border-neutral-800/50' : ''} ${i === 0 ? 'bg-orange-500/[0.02]' : ''}`} />
                ))}
                {events.map((e, idx) => {
                  const c = eventColors[e.type];
                  const leftPct = (e.start / 7) * 100;
                  const widthPct = (e.duration / 7) * 100;
                  return (
                    <div
                      key={idx}
                      className="absolute top-1.5 bottom-1.5 rounded cursor-pointer transition-transform hover:scale-[1.02] hover:z-10"
                      style={{
                        left: `calc(${leftPct}% + 2px)`,
                        width: `calc(${widthPct}% - 4px)`,
                        background: c.bg,
                        borderLeft: `2px solid ${c.border}`,
                        color: c.text,
                      }}
                      title={e.label}
                    >
                      <div className="px-2 py-1 text-[10px] font-medium truncate mono">{e.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-neutral-800 px-3 py-2 flex items-center gap-4 flex-wrap bg-neutral-950/30">
        {[
          { label: 'Inspection', color: '#eab308' },
          { label: 'Scheduled MX', color: '#3b82f6' },
          { label: 'AOG', color: '#ef4444' },
          { label: 'PR Flight', color: '#a855f7' },
          { label: 'Training', color: '#22c55e' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
            <span className="mono text-[10px] text-neutral-400">{l.label}</span>
          </div>
        ))}
        <div className="ml-auto mono text-[10px] text-neutral-500">
          Drag events to reschedule · Click to edit
        </div>
      </div>
    </div>
  );
}
