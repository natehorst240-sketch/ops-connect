import React from 'react';
import { AIRCRAFT as STATIC_AIRCRAFT, PENDING_REQUESTS as STATIC_REQS } from '../data';
import { PageHeader, Card, Metric, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import { useFleet } from '../contexts/FleetDataContext';

const AUDIT_EVENTS = [
  { when: '14:32', who: 'Tevita Silatolu', action: 'Approved MX Schedule', target: 'N39KM · 100-hr inspection' },
  { when: '14:18', who: 'Nate Horstmeier', action: 'Posted ALERT Bulletin', target: 'N291HC AOG — McKay' },
  { when: '13:47', who: 'Dwight Brooks', action: 'Reassigned Technician', target: 'Jon Hankins → Fort Mohave' },
  { when: '13:22', who: 'Carla Weir', action: 'Moved MX Entry', target: 'N251HC inspection 04/30 → 05/02' },
  { when: '12:55', who: 'Billy Ortega', action: 'Approved PR Movement', target: 'N251HC · 05/08 media flight' },
  { when: '12:01', who: 'System', action: 'Auto-escalated', target: 'Safety Report · 6h no response' },
];

export default function QAHome({ persona }) {
  const { aircraft: liveAircraft, mxRequests: liveReqs } = useFleet();
  const AIRCRAFT = liveAircraft.length ? liveAircraft : STATIC_AIRCRAFT;
  const PENDING_REQUESTS = liveReqs.length ? liveReqs : STATIC_REQS;
  const inService = AIRCRAFT.filter(a => a.status === 'IN_SERVICE').length;
  const aog = AIRCRAFT.filter(a => a.status === 'AOG').length;

  return (
    <>
      <PageHeader persona={persona} subtitle="Oversight view — all regions, all departments. You approve schedules, PR movements, pilot training. Asst Director escalations go direct to Director." />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <Metric label="Fleet Health" value={`${Math.round((inService / AIRCRAFT.length) * 100)}%`} sub={`${inService}/${AIRCRAFT.length}`} accent="#22c55e" />
        <Metric label="AOG" value={aog} accent="#ef4444" pulse={aog > 0} />
        <Metric label="Pending Review" value={PENDING_REQUESTS.length} accent="#ff6b1a" />
        <Metric label="Compliance Score" value="98.2%" sub="past 30d" accent="#3b82f6" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <Card title="All-Region Approval Queue" accent="#ff6b1a">
          <div className="space-y-0">
            {PENDING_REQUESTS.map((r, idx) => (
              <div key={r.id} className={`py-3 ${idx !== PENDING_REQUESTS.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-300">{r.type}</span>
                  <span className="mono text-[10px] text-neutral-500 uppercase tracking-wider">{r.region}</span>
                  <span className="text-[11px] text-neutral-500">{r.submitted}</span>
                </div>
                <div className="text-[13px] font-medium">{r.detail}</div>
                <div className="text-[11px] text-neutral-500 mt-1 mb-2">— {r.submitter}</div>
                <div className="flex gap-1.5">
                  <button className="px-2.5 py-1 text-[11px] bg-green-600 hover:bg-green-500 text-white rounded font-medium">Approve</button>
                  <button className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">More Info</button>
                  <button className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-red-900/30 hover:text-red-400 text-neutral-200 rounded">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Audit Trail — Today" action="Live feed" accent="#3b82f6">
          <div className="space-y-0">
            {AUDIT_EVENTS.map((e, idx) => (
              <div key={idx} className={`flex items-start gap-3 py-2.5 ${idx !== AUDIT_EVENTS.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                <div className="mono text-[11px] text-neutral-500 w-10 shrink-0 mt-0.5">{e.when}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px]">
                    <span className="font-medium">{e.who}</span>{' '}
                    <span className="text-neutral-400">{e.action}</span>
                  </div>
                  <div className="mono text-[11px] text-neutral-500 mt-0.5 truncate">{e.target}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Cross-Region Fleet Overview" action={<span className="mono text-[11px]">{AIRCRAFT.length} aircraft · 10 regions</span>}>
        <RegionBreakdown />
      </Card>
    </>
  );
}

function RegionBreakdown() {
  const regions = [...new Set(AIRCRAFT.map(a => a.region))];
  return (
    <div className="grid grid-cols-5 gap-2">
      {regions.map(r => {
        const list = AIRCRAFT.filter(a => a.region === r);
        const aog = list.filter(a => a.status === 'AOG').length;
        const mx = list.filter(a => a.status === 'MAINTENANCE').length;
        return (
          <div key={r} className="bg-neutral-900 border border-neutral-800 rounded-md p-3">
            <div className="mono text-[10px] text-neutral-500 uppercase tracking-wider mb-2">{r}</div>
            <div className="flex items-baseline gap-1.5">
              <div className="text-[20px] font-semibold leading-none">{list.length}</div>
              <div className="text-[10px] text-neutral-500">aircraft</div>
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              {aog > 0 && (
                <span className="mono text-[10px] text-red-400 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />AOG {aog}
                </span>
              )}
              {mx > 0 && (
                <span className="mono text-[10px] text-amber-400 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />MX {mx}
                </span>
              )}
              {aog === 0 && mx === 0 && (
                <span className="mono text-[10px] text-green-400 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />All GO
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
