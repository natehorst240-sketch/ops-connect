import React from 'react';
import { AIRCRAFT as STATIC_AIRCRAFT, PENDING_REQUESTS as STATIC_REQS, INSPECTIONS_DUE } from '../data';
import { PageHeader, Card, Metric, StatusDot, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import { useFleet } from '../contexts/FleetDataContext';
import { useNavigation } from '../contexts/NavigationContext';

export default function DirectorHome({ persona }) {
  const navigate = useNavigation();
  const { aircraft: liveAircraft, mxRequests: liveReqs } = useFleet();
  const AIRCRAFT = liveAircraft.length ? liveAircraft : STATIC_AIRCRAFT;
  const PENDING_REQUESTS = liveReqs.length ? liveReqs : STATIC_REQS;
  const inService = AIRCRAFT.filter(a => a.status === 'IN_SERVICE').length;
  const aog = AIRCRAFT.filter(a => a.status === 'AOG').length;
  const maint = AIRCRAFT.filter(a => a.status === 'MAINTENANCE').length;
  const escalations = PENDING_REQUESTS.filter(r => r.type === 'Safety Report' || r.type === 'Ask Leadership');

  return (
    <>
      <PageHeader persona={persona} subtitle="Executive view across all regions and all departments." />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Metric label="Fleet In Service" value={inService} sub={`of ${AIRCRAFT.length}`} accent="#22c55e" />
        <Metric label="AOG" value={aog} accent="#ef4444" pulse={aog > 0} />
        <Metric label="Scheduled MX" value={maint} accent="#eab308" />
        <Metric label="Pending Escalations" value={escalations.length} accent="#ff6b1a" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Fleet Status — All Regions" action={<span className="mono text-[11px]">{AIRCRAFT.length} aircraft</span>}>
          <div className="space-y-1.5 max-h-96 overflow-y-auto scrollbar pr-1">
            {AIRCRAFT.slice(0, 18).map(a => (
              <div key={a.tail} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-neutral-800/50 transition-colors">
                <StatusDot status={a.status} />
                <div className="mono text-[12px] font-medium w-[72px]">{a.tail}</div>
                <div className="text-[11px] text-neutral-400 w-[100px] truncate">{a.type}</div>
                <div className="text-[11px] text-neutral-500 flex-1 truncate">{a.base}</div>
                <div className="mono text-[10px] text-neutral-600">{a.region}</div>
              </div>
            ))}
            <div className="text-center text-[11px] text-neutral-600 mt-2 py-2 border-t border-neutral-800">
              + {AIRCRAFT.length - 18} more aircraft
            </div>
          </div>
        </Card>

        <Card title="Escalations Feed" accent="#ff6b1a" action="Director attention">
          <div className="space-y-0">
            {escalations.map((e, idx) => (
              <div key={e.id} className={`flex items-center gap-3 py-2.5 ${idx !== escalations.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                <div className={`w-1 h-9 rounded-sm ${e.type === 'Safety Report' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium">{e.type}: {e.detail}</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">{e.submitter} · {e.region} · {e.submitted}</div>
                </div>
                <button onClick={() => navigate('inbox')} className="px-3 py-1.5 text-[11px] font-medium bg-neutral-800 border border-neutral-700 rounded text-neutral-200 hover:bg-neutral-700">
                  Review
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Card title="Inspections Due — Next 7 Days" action={<span className="text-[11px]"><span className="text-red-400">● &lt; 24h</span> · <span className="text-amber-400">● &lt; 7d</span> · <span className="text-green-400">● &gt; 7d</span></span>}>
          <div className="space-y-0.5">
            {INSPECTIONS_DUE.slice(0, 10).map((i, idx) => {
              const color = i.level === 'red' ? 'bg-red-500' : i.level === 'amber' ? 'bg-amber-500' : 'bg-green-500';
              const tc = i.level === 'red' ? 'text-red-400' : i.level === 'amber' ? 'text-amber-400' : 'text-green-400';
              return (
                <div key={idx} className="flex items-center gap-3 py-2 px-2 hover:bg-neutral-800/50 rounded">
                  <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                  <div className="mono text-[12px] font-medium w-[72px]">{i.tail}</div>
                  <div className="text-[12px] text-neutral-300 flex-1 truncate">{i.desc}</div>
                  <div className="mono text-[11px] text-neutral-500">{i.due}</div>
                  <div className={`mono text-[11px] w-16 text-right ${tc}`}>{i.days}d</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
