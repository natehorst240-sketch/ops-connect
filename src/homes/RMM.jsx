import React from 'react';
import { Phone, MessageSquare, Bell, Shield, Users } from 'lucide-react';
import { AIRCRAFT as STATIC_AIRCRAFT, PENDING_REQUESTS as STATIC_REQS } from '../data';
import { PageHeader, Card, Metric, StatusDot, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import { useFleet } from '../contexts/FleetDataContext';

export default function RMMHome({ persona }) {
  const { aircraft: liveAircraft, mxRequests: liveReqs } = useFleet();
  const AIRCRAFT = liveAircraft.length ? liveAircraft : STATIC_AIRCRAFT;
  const PENDING_REQUESTS = liveReqs.length ? liveReqs : STATIC_REQS;
  const regionAircraft = AIRCRAFT.filter(a => a.region === persona.region);
  const regionRequests = PENDING_REQUESTS.filter(r => r.region === persona.region);

  return (
    <>
      <PageHeader persona={persona} subtitle={`Regional view — ${persona.region}. You manage approvals, coverage, and escalations for your region.`} />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <Metric label={`${persona.region} Aircraft`} value={regionAircraft.length} accent="#22c55e" />
        <Metric label="Pending My Approval" value={regionRequests.length} accent="#ff6b1a" />
        <Metric label="Techs On Shift" value={8} sub="of 12" accent="#3b82f6" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card title="Approval Queue" accent="#ff6b1a">
          <div className="space-y-0">
            {regionRequests.map((r, idx) => (
              <div key={r.id} className={`py-3 ${idx !== regionRequests.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-300">{r.type}</span>
                  <span className="text-[11px] text-neutral-500">{r.submitted}</span>
                </div>
                <div className="text-[13px] font-medium">{r.detail}</div>
                <div className="text-[11px] text-neutral-500 mt-1 mb-2">— {r.submitter}</div>
                <div className="flex gap-1.5">
                  <button className="px-2.5 py-1 text-[11px] bg-green-600 hover:bg-green-500 text-white rounded font-medium">Approve</button>
                  <button className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">More Info</button>
                  <button className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">Escalate</button>
                  <button className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-red-900/30 hover:text-red-400 text-neutral-200 rounded">Deny</button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={`${persona.region} Fleet`} action={<span className="mono text-[11px]">{regionAircraft.length} aircraft</span>}>
          <div className="space-y-1.5">
            {regionAircraft.map(a => (
              <div key={a.tail} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-neutral-800/50">
                <StatusDot status={a.status} />
                <div className="mono text-[12px] font-medium w-[72px]">{a.tail}</div>
                <div className="text-[11px] text-neutral-400 w-[100px] truncate">{a.type}</div>
                <div className="text-[11px] text-neutral-500 flex-1 truncate">{a.base}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5">
        <Card title="My Team — On Call Now" action="WY/MT Region">
          {['Nate Anderson · Greybull', 'Robert Guty · Greybull', 'Aaron Quitberg · Riverton'].map((name, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2.5 border-b border-neutral-800 last:border-0">
              <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-semibold">
                {name.split('·')[0].trim().split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex-1 text-[13px]">{name}</div>
              <button className="w-7 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-orange-400"><Phone size={12} /></button>
              <button className="w-7 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-orange-400"><MessageSquare size={12} /></button>
            </div>
          ))}
        </Card>
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Post Bulletin', icon: Bell },
              { label: 'Submit Safety', icon: Shield },
              { label: 'Ask Director', icon: MessageSquare },
              { label: 'Reassign Tech', icon: Users },
            ].map((a, idx) => {
              const Icon = a.icon;
              return (
                <button key={idx} className="flex items-center gap-2 p-3 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[12px] font-medium text-left">
                  <Icon size={14} className="text-orange-400" />
                  {a.label}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
