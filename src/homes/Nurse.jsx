import React, { useMemo } from 'react';
import { CheckCircle2, Timer, ArrowRight, Calendar, Zap, Shield, MessageSquare, Clock } from 'lucide-react';
import { OPEN_SHIFTS, AIRCRAFT as STATIC_AIRCRAFT } from '../data';
import { DEMO_TODAY_ISO } from '../data/mxOncallSchedule';
import { DEMO_SHIFTS, DEMO_CERTS } from '../data/demoPersonnelData';
import { useFleet } from '../contexts/FleetDataContext';
import { PageHeader, Card, Metric, StatusDot, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import OncallWidget from '../shared/OncallWidget';

const MS_PER_DAY = 86400000;
const DEMO_NOW = new Date(DEMO_TODAY_ISO + 'T12:00:00Z').getTime();
const daysUntil = iso => Math.ceil((new Date(iso + 'T12:00:00Z').getTime() - DEMO_NOW) / MS_PER_DAY);

// "Cedar City Hospital" → "Cedar City", "IMED IH-14" → "IMED"
function cityFromBase(base) {
  return base.replace(/\s*(Hospital|Medical Center|Health|IH-\d+.*)/i, '').trim();
}

export default function NurseHome({ persona }) {
  const { aircraft: live } = useFleet();
  const AIRCRAFT = live.length ? live : STATIC_AIRCRAFT;
  const eligible = OPEN_SHIFTS.filter(s => s.specialty === 'flight_nurse');

  // Shifts and certs from data layer — production reads from Protean Hub / Dataverse
  const myShifts = DEMO_SHIFTS[persona.id] ?? [];
  const myCerts = useMemo(
    () => (DEMO_CERTS[persona.id] ?? []).map(c => ({ ...c, daysLeft: daysUntil(c.expires) })),
    [persona.id]
  );
  const certsExpiring60d = useMemo(() => myCerts.filter(c => c.daysLeft <= 60).length, [myCerts]);
  const soonestExpiring = useMemo(
    () => myCerts.filter(c => c.daysLeft <= 60).sort((a, b) => a.daysLeft - b.daysLeft)[0],
    [myCerts]
  );

  // Aircraft serving this base: exact match first, then city-prefix match, then region
  const baseAircraft = useMemo(() => {
    const exact = AIRCRAFT.filter(a => a.base === persona.base);
    if (exact.length) return exact;
    const city = cityFromBase(persona.base).toLowerCase();
    const partial = AIRCRAFT.filter(a => a.base.toLowerCase().startsWith(city));
    if (partial.length) return partial;
    return AIRCRAFT.filter(a => a.region === persona.region);
  }, [AIRCRAFT, persona.base, persona.region]);

  return (
    <>
      <PageHeader persona={persona} subtitle="Your schedule, open shifts you can claim, and certification status." />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Shift Status</div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${persona.onShift ? 'bg-green-500' : 'bg-neutral-600'}`} />
              <div className="text-[20px] font-semibold">{persona.onShift ? 'On Shift' : 'Off Shift'}</div>
            </div>
          </div>
          <button className={`px-3 py-1.5 text-[11px] rounded border ${persona.onShift ? 'bg-neutral-800 border-neutral-700 text-neutral-300' : 'bg-orange-500 border-orange-500 text-black font-medium'}`}>
            {persona.onShift ? 'Go Off' : 'Go On'}
          </button>
        </div>
        <Metric label="Shifts This Month" value={myShifts.length} sub={`${myShifts.length * 12}h scheduled`} accent="#3b82f6" />
        <Metric label="Claimable Open Shifts" value={eligible.length} accent="#ff6b1a" />
        <Metric label="Certs Expiring 60d" value={certsExpiring60d} sub={soonestExpiring ? `${soonestExpiring.name} ${soonestExpiring.expires.slice(5).replace('-','/')}` : 'None'} accent="#eab308" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <Card title="My Upcoming Shifts">
          <div className="space-y-0">
            {myShifts.map((s, idx) => {
              const date = new Date(s.date + 'T12:00:00Z');
              const day = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
              return (
                <div key={idx} className={`flex items-center gap-4 py-3 ${idx !== myShifts.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                  <div className="w-14 text-center">
                    <div className="mono text-[10px] text-neutral-500 uppercase">{day}</div>
                    <div className="mono text-[16px] font-semibold">{dateStr}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] font-medium">{s.base}</div>
                    <div className="mono text-[11px] text-neutral-500">{s.role} · {s.time}</div>
                  </div>
                  <button className="mono text-[11px] px-2 py-1 bg-neutral-800 border border-neutral-700 text-neutral-300 rounded hover:text-orange-400">
                    Request Swap
                  </button>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Open Shifts · Eligible for You" accent="#ff6b1a" action={<span className="text-[11px]">Filtered by cert + region</span>}>
          <div className="space-y-2">
            {eligible.map(s => (
              <div key={s.id} className="border border-neutral-800 hover:border-orange-500/50 rounded-md p-3 bg-neutral-900 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate">{s.base}</div>
                    <div className="mono text-[11px] text-neutral-500 mt-0.5">
                      {new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {s.time}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="mono text-[11px] text-green-400 font-medium">{s.differential}</div>
                    {s.fatigueRisk && (
                      <div className="mono text-[9px] uppercase tracking-wider text-amber-400 mt-0.5">
                        <Timer size={9} className="inline mr-0.5" /> fatigue
                      </div>
                    )}
                  </div>
                </div>
                <button className="w-full py-1.5 text-[12px] bg-orange-500 hover:bg-orange-400 text-black font-medium rounded">
                  Claim Shift
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Base aircraft fleet */}
      <div className="mb-5">
        <Card
          title={`Fleet at a Glance — ${cityFromBase(persona.base)}`}
          action={<span className="mono text-[11px] text-neutral-400">{baseAircraft.length} aircraft</span>}
        >
          {baseAircraft.length === 0 ? (
            <p className="text-sm text-neutral-400 py-1">No aircraft data for this base.</p>
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
                    <div className="text-[11px] text-neutral-500 truncate max-w-[140px]">{a.base}</div>
                    <div className={`mono text-[11px] font-medium shrink-0 ${statusCls}`}>{statusLabel}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card title="My Certifications" action={<span className="mono text-[11px]">From CompleteFlight</span>}>
          <div className="space-y-0.5">
            {myCerts.map(c => {
              const expiring = c.status === 'expiring';
              return (
                <div key={c.name} className="flex items-center gap-3 py-2 px-2 hover:bg-neutral-800/30 rounded">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    expiring ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-green-500/10 border border-green-500/30'
                  }`}>
                    <CheckCircle2 size={14} className={expiring ? 'text-amber-400' : 'text-green-400'} />
                  </div>
                  <div className="flex-1">
                    <div className="mono text-[12px] font-medium">{c.name}</div>
                    <div className="mono text-[10px] text-neutral-500">Expires {c.expires}</div>
                  </div>
                  <div className={`mono text-[11px] text-right ${expiring ? 'text-amber-400' : 'text-neutral-500'}`}>
                    {c.daysLeft}d left
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Submit a Request">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Shift Swap', icon: ArrowRight },
              { label: 'Time Off', icon: Calendar },
              { label: 'Training Request', icon: Zap },
              { label: 'Safety Report', icon: Shield },
              { label: 'Ask Leadership', icon: MessageSquare },
              { label: 'Pickup Shift', icon: Clock },
            ].map((a, idx) => {
              const Icon = a.icon;
              return (
                <button key={idx} className="flex items-center gap-2.5 p-3 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[12px] font-medium text-left transition-colors">
                  <Icon size={15} className="text-orange-400" />
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
