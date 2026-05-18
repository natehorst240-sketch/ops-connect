import React from 'react';
import { CheckCircle2, Timer, ArrowRight, Calendar, Zap, Shield, MessageSquare, Clock } from 'lucide-react';
import { OPEN_SHIFTS } from '../data';
import { PageHeader, Card, Metric, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import OncallWidget from '../shared/OncallWidget';

const MY_SHIFTS = [
  { date: '2026-04-25', time: '09:00-09:00', base: 'Cedar City Hospital', role: 'FN - URBAN' },
  { date: '2026-04-28', time: '09:00-09:00', base: 'Cedar City Hospital', role: 'FN - URBAN' },
  { date: '2026-05-05', time: '09:00-09:00', base: 'Cedar City Hospital', role: 'FN - URBAN' },
];

const MY_CERTS = [
  { name: 'CCRN', status: 'valid', expires: '2027-08-14', daysLeft: 477 },
  { name: 'TNCC', status: 'valid', expires: '2026-11-03', daysLeft: 193 },
  { name: 'PALS', status: 'expiring', expires: '2026-06-12', daysLeft: 49 },
  { name: 'STABLE', status: 'valid', expires: '2027-02-28', daysLeft: 310 },
  { name: 'ACLS', status: 'valid', expires: '2026-12-05', daysLeft: 225 },
];

export default function NurseHome({ persona }) {
  const eligible = OPEN_SHIFTS.filter(s => s.specialty === 'flight_nurse');

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
        <Metric label="Shifts This Month" value="7" sub="84 hours" accent="#3b82f6" />
        <Metric label="Claimable Open Shifts" value={eligible.length} accent="#ff6b1a" />
        <Metric label="Certs Expiring 60d" value="1" sub="PALS 06/12" accent="#eab308" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <Card title="My Upcoming Shifts">
          <div className="space-y-0">
            {MY_SHIFTS.map((s, idx) => {
              const date = new Date(s.date);
              const day = date.toLocaleDateString('en-US', { weekday: 'short' });
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              return (
                <div key={idx} className={`flex items-center gap-4 py-3 ${idx !== MY_SHIFTS.length - 1 ? 'border-b border-neutral-800' : ''}`}>
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

      <div className="grid grid-cols-2 gap-5">
        <Card title="My Certifications" action={<span className="mono text-[11px]">From CompleteFlight</span>}>
          <div className="space-y-0.5">
            {MY_CERTS.map(c => {
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
