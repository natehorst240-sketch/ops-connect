import React, { useMemo } from 'react';
import { Plane, UserCircle, Wrench, MessageSquare, Shield, Calendar } from 'lucide-react';
import { AIRCRAFT as STATIC_AIRCRAFT, INSPECTIONS_DUE } from '../data';
import { useFleet } from '../contexts/FleetDataContext';
import { useNavigation } from '../contexts/NavigationContext';
import { PageHeader, Card, Metric, StatusDot, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import OncallWidget from '../shared/OncallWidget';
import OpsScheduleBoard from '../shared/OpsScheduleBoard';

export default function AMTHome({ persona }) {
  const { aircraft: live } = useFleet();
  const navigate = useNavigation();
  const AIRCRAFT = live.length ? live : STATIC_AIRCRAFT;

  const baseAircraft = useMemo(
    () => AIRCRAFT.filter(a => a.base === persona.base),
    [AIRCRAFT, persona.base]
  );

  const myAircraft = baseAircraft[0] ?? null;

  // Next inspection due for any aircraft at this base
  const baseTails = useMemo(() => new Set(baseAircraft.map(a => a.tail)), [baseAircraft]);
  const nextInspection = useMemo(
    () => INSPECTIONS_DUE.find(i => baseTails.has(i.tail)) ?? INSPECTIONS_DUE[0],
    [baseTails]
  );

  const submissions = useMemo(() => [
    { type: 'MX Schedule', detail: `${myAircraft?.tail ?? 'Aircraft'} 100-hr inspection window`, status: 'Pending', color: 'amber' },
    { type: 'Time Off', detail: '2 days · 06/15–06/16', status: 'Approved', color: 'green' },
    { type: 'Ask Leadership', detail: 'Tooling budget question', status: 'In progress', color: 'blue' },
  ], [myAircraft]);

  return (
    <>
      <PageHeader persona={persona} subtitle="Frontline view — submit requests, view schedule, stay updated." />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Shift Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${persona.onShift ? 'bg-green-500' : 'bg-neutral-600'}`} />
              <div className="text-[20px] font-semibold">{persona.onShift ? 'On Shift' : 'Off Shift'}</div>
            </div>
          </div>
          <button className={`px-3 py-1.5 text-[11px] rounded border ${persona.onShift ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-orange-500 border-orange-500 text-black font-medium'}`}>
            {persona.onShift ? 'Go Off Shift' : 'Go On Shift'}
          </button>
        </div>
        <Metric
          label="My Aircraft"
          value={myAircraft?.tail ?? '—'}
          sub={myAircraft ? myAircraft.base : 'No aircraft assigned'}
          accent="#22c55e"
        />
        <Metric
          label="Next Due"
          value={nextInspection ? nextInspection.due.slice(0, 5) : '—'}
          sub={nextInspection ? `${nextInspection.days}d · ${nextInspection.tail}` : 'No items'}
          accent="#eab308"
        />
      </div>

      {/* Base fleet */}
      <div className="mb-5">
        <Card
          title={`Fleet at a Glance — ${persona.base}`}
          action={<span className="mono text-[11px] text-neutral-400">{baseAircraft.length} aircraft</span>}
        >
          {baseAircraft.length === 0 ? (
            <p className="text-sm text-neutral-400 py-1">No aircraft assigned to this base.</p>
          ) : (
            <div className="space-y-1">
              {baseAircraft.map(a => {
                const statusLabel = a.status === 'IN_SERVICE' ? 'In Service' : a.status === 'AOG' ? 'AOG' : 'Scheduled MX';
                const statusCls = a.status === 'IN_SERVICE' ? 'text-green-400' : a.status === 'AOG' ? 'text-red-400' : 'text-amber-400';
                return (
                  <div key={a.tail} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-neutral-800/50">
                    <StatusDot status={a.status} />
                    <div className="mono text-[13px] font-semibold text-neutral-100">{a.tail}</div>
                    <div className="text-[12px] text-neutral-400 flex-1">{a.type}</div>
                    <div className={`mono text-[11px] font-medium ${statusCls}`}>{statusLabel}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Submit a Request">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Aircraft Status', icon: Plane },
              { label: 'Personnel Status', icon: UserCircle },
              { label: 'MX Schedule', icon: Wrench },
              { label: 'Ask Leadership', icon: MessageSquare },
              { label: 'Safety Report', icon: Shield },
              { label: 'Time Off', icon: Calendar },
            ].map((a, idx) => {
              const Icon = a.icon;
              return (
                <button key={idx} onClick={() => navigate('submit')} className="flex items-center gap-2.5 p-3 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[12px] font-medium text-left transition-colors">
                  <Icon size={15} className="text-orange-400" />
                  {a.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card title="My Submissions" action={<span className="text-[11px] text-neutral-500">Last 30 days</span>}>
          <div className="space-y-0">
            {submissions.map((s, idx) => (
              <div key={idx} className={`flex items-center gap-3 py-2.5 ${idx !== submissions.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate">{s.detail}</div>
                  <div className="mono text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">{s.type}</div>
                </div>
                <div className={`mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${
                  s.color === 'green' ? 'bg-green-500/10 text-green-400' :
                  s.color === 'amber' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>{s.status}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Card title={`Inspections Due — ${persona.region} Region`} action="Items at your base highlighted">
          <div className="space-y-0.5">
            {INSPECTIONS_DUE.slice(0, 6).map((i, idx) => {
              const isMyBase = baseTails.has(i.tail);
              const color = i.level === 'red' ? 'bg-red-500' : i.level === 'amber' ? 'bg-amber-500' : 'bg-green-500';
              const tc = i.level === 'red' ? 'text-red-400' : i.level === 'amber' ? 'text-amber-400' : 'text-green-400';
              return (
                <div key={idx} className={`py-2 px-2 rounded ${isMyBase ? 'bg-orange-500/5 border border-orange-500/20' : 'hover:bg-neutral-800/50'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${color}`} />
                    <div className={`mono text-[12px] font-semibold ${isMyBase ? 'text-orange-300' : 'text-neutral-100'}`}>{i.tail}</div>
                    {isMyBase && <span className="mono text-[9px] text-orange-400 uppercase tracking-wider">my base</span>}
                    <div className="flex-1" />
                    <div className={`mono text-[11px] font-semibold ${tc}`}>{i.days}d</div>
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5 pl-[18px]">{i.desc}</div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <OncallWidget persona={persona} />
      <OpsScheduleBoard persona={persona} compact />
    </>
  );
}
