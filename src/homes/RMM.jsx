import React, { useMemo } from 'react';
import { Phone, MessageSquare, Bell, Shield, Users } from 'lucide-react';
import { AIRCRAFT as STATIC_AIRCRAFT, PENDING_REQUESTS as STATIC_REQS } from '../data';
import { PageHeader, Card, Metric, StatusDot, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import { useFleet } from '../contexts/FleetDataContext';
import { useNavigation } from '../contexts/NavigationContext';
import OncallWidget from '../shared/OncallWidget';
import { usePhoneFor } from '../hooks/usePhoneFor';
import { getOncallForDate, BASE_META, DEMO_TODAY_ISO } from '../data/mxOncallSchedule';

export default function RMMHome({ persona }) {
  const navigate = useNavigation();
  const { aircraft: liveAircraft, mxRequests: liveReqs } = useFleet();
  const AIRCRAFT = liveAircraft.length ? liveAircraft : STATIC_AIRCRAFT;
  const PENDING_REQUESTS = liveReqs.length ? liveReqs : STATIC_REQS;
  const regionAircraft = AIRCRAFT.filter(a => a.region === persona.region);
  const regionRequests = PENDING_REQUESTS.filter(r => r.region === persona.region);

  const phoneFor = usePhoneFor();

  // Today's on-call mechanics for this RMM's region
  const regionOnCall = useMemo(() => {
    const byBase = getOncallForDate(DEMO_TODAY_ISO);
    const results = [];
    for (const [base, entries] of Object.entries(byBase)) {
      if (BASE_META[base]?.region === persona.region) {
        entries.forEach(e => results.push({
          name: e.owner,
          base: BASE_META[base]?.label ?? base,
          phone: phoneFor(e.owner),
          hours: e.hours,
        }));
      }
    }
    return results;
  }, [persona.region]);

  return (
    <>
      <PageHeader persona={persona} subtitle={`Regional view — ${persona.region}. You manage approvals, coverage, and escalations for your region.`} />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Metric label={`${persona.region} Aircraft`} value={regionAircraft.length} accent="#22c55e" />
        <Metric label="Pending My Approval" value={regionRequests.length} accent="#ff6b1a" />
        <Metric label="Techs On Shift" value={8} sub="of 12" accent="#3b82f6" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  <button onClick={() => navigate('inbox')} className="px-2.5 py-1 text-[11px] bg-green-600 hover:bg-green-500 text-white rounded font-medium">Approve</button>
                  <button onClick={() => navigate('inbox')} className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">More Info</button>
                  <button onClick={() => navigate('inbox')} className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">Escalate</button>
                  <button onClick={() => navigate('inbox')} className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-red-900/30 hover:text-red-400 text-neutral-200 rounded">Deny</button>
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

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="My Team — On Call Now" action={<span className="mono text-[11px] text-neutral-300">{persona.region} Region</span>}>
          {regionOnCall.length === 0 ? (
            <p className="text-sm text-neutral-400 py-2">No on-call data for today.</p>
          ) : (
            regionOnCall.map((m, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2.5 border-b border-neutral-800 last:border-0">
                <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-semibold text-neutral-200">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{m.name}</div>
                  <div className="text-[10px] text-neutral-400 truncate">{m.base} · {m.hours}</div>
                </div>
                {m.phone ? (
                  <a href={`tel:${m.phone}`}
                    onClick={e => e.preventDefault()}
                    className="w-7 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-orange-400"
                    title={m.phone}>
                    <Phone size={12} />
                  </a>
                ) : (
                  <div className="w-7 h-7 rounded bg-neutral-800/50 border border-neutral-800 flex items-center justify-center text-neutral-700">
                    <Phone size={12} />
                  </div>
                )}
                <button className="w-7 h-7 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-400 hover:text-orange-400">
                  <MessageSquare size={12} />
                </button>
              </div>
            ))
          )}
        </Card>
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Post Bulletin', icon: Bell, tab: 'bulletins' },
              { label: 'Submit Safety', icon: Shield, tab: 'submit' },
              { label: 'Ask Director', icon: MessageSquare, tab: 'submit' },
              { label: 'Reassign Tech', icon: Users, tab: 'inbox' },
            ].map((a, idx) => {
              const Icon = a.icon;
              return (
                <button key={idx} onClick={() => navigate(a.tab)} className="flex items-center gap-2 p-3 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[12px] font-medium text-left">
                  <Icon size={14} className="text-orange-400" />
                  {a.label}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      <OncallWidget persona={persona} />
    </>
  );
}
