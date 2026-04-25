import React from 'react';
import { HeartPulse, Activity, Wind, Baby, Stethoscope, Timer } from 'lucide-react';
import { OPEN_SHIFTS, CREW_REQUESTS } from '../data';
import { PageHeader, Card, Metric, BulletinBanner } from '../ui';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';

export default function CrewSchedulerHome({ persona }) {
  return (
    <>
      <PageHeader persona={persona} subtitle="Crew scheduling — flight nurses, paramedics, RTs, pilots. Open shifts, swaps, certifications. Integrated with CompleteFlight for cert currency." />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      <div className="grid grid-cols-4 gap-3 mb-5">
        <Metric label="Open Shifts" value={OPEN_SHIFTS.length} accent="#ff6b1a" />
        <Metric label="Pending Requests" value={CREW_REQUESTS.length} accent="#3b82f6" />
        <Metric label="Certs Expiring 30d" value="3" accent="#eab308" />
        <Metric label="Coverage Health" value="94%" sub="next 14d" accent="#22c55e" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <Card title="Open Shift Board" accent="#ff6b1a" action={<span className="mono text-[11px]">Publishes to eligible crew</span>}>
          <div className="space-y-2">
            {OPEN_SHIFTS.map(s => <OpenShiftCard key={s.id} shift={s} />)}
            <button className="w-full mt-2 py-2 border border-dashed border-neutral-700 rounded text-[12px] text-neutral-400 hover:text-orange-400 hover:border-orange-500/50">
              + Publish New Open Shift
            </button>
          </div>
        </Card>

        <Card title="Crew Requests" accent="#3b82f6">
          <div className="space-y-0">
            {CREW_REQUESTS.map((r, idx) => (
              <div key={r.id} className={`py-3 ${idx !== CREW_REQUESTS.length - 1 ? 'border-b border-neutral-800' : ''}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    r.type === 'Cert Renewal' ? 'bg-amber-500/10 text-amber-400' : 'bg-neutral-800 text-neutral-300'
                  }`}>{r.type}</span>
                  <span className="text-[11px] text-neutral-500">{r.submitted}</span>
                </div>
                <div className="text-[13px] font-medium">{r.detail}</div>
                <div className="text-[11px] text-neutral-500 mt-1 mb-2">— {r.submitter}</div>
                <div className="flex gap-1.5">
                  {r.type === 'Cert Renewal' ? (
                    <>
                      <button className="px-2.5 py-1 text-[11px] bg-orange-500 hover:bg-orange-400 text-black rounded font-medium">Schedule Training</button>
                      <button className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">Notify Crew</button>
                    </>
                  ) : (
                    <>
                      <button className="px-2.5 py-1 text-[11px] bg-green-600 hover:bg-green-500 text-white rounded font-medium">Approve</button>
                      <button className="px-2.5 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">Review</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Coverage Health — Next 14 Days" action="Bases needing attention">
        <CoverageBar />
      </Card>
    </>
  );
}

function OpenShiftCard({ shift }) {
  const IconMap = {
    flight_nurse: HeartPulse,
    flight_paramedic: Activity,
    respiratory: Wind,
    pediatric: Baby,
    neonatal: Baby,
  };
  const Icon = IconMap[shift.specialty] || Stethoscope;

  return (
    <div className="border border-neutral-800 hover:border-orange-500/50 rounded-md p-3 transition-colors bg-neutral-900">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-md bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
          <Icon size={14} className="text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="mono text-[11px] font-semibold">{shift.role}</span>
            {shift.fatigueRisk && (
              <span className="mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded flex items-center gap-1">
                <Timer size={9} /> Fatigue warn
              </span>
            )}
          </div>
          <div className="text-[11px] text-neutral-400 truncate">{shift.base}</div>
        </div>
        <div className="text-right">
          <div className="mono text-[12px] font-medium">{shift.time}</div>
          <div className="mono text-[10px] text-neutral-500">
            {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })} · {shift.differential}
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 pt-2 border-t border-neutral-800">
        <button className="flex-1 px-2 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">View Eligible Crew</button>
        <button className="px-2 py-1 text-[11px] bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded">Edit</button>
      </div>
    </div>
  );
}

function CoverageBar() {
  const bases = [
    { name: 'Intermountain Medical Center', coverage: 100, color: 'green' },
    { name: 'Primary Childrens Hospital', coverage: 92, color: 'green' },
    { name: 'McKay Dee', coverage: 78, color: 'amber' },
    { name: 'St. George Hospital', coverage: 88, color: 'green' },
    { name: 'Utah Valley Hospital', coverage: 100, color: 'green' },
    { name: 'Cedar City Hospital', coverage: 85, color: 'amber' },
    { name: 'Logan', coverage: 65, color: 'red' },
    { name: 'Roosevelt', coverage: 72, color: 'amber' },
  ];
  const colorMap = {
    green: { bar: '#22c55e', text: 'text-green-400' },
    amber: { bar: '#eab308', text: 'text-amber-400' },
    red: { bar: '#ef4444', text: 'text-red-400' },
  };
  return (
    <div className="space-y-2">
      {bases.map(b => {
        const c = colorMap[b.color];
        return (
          <div key={b.name} className="flex items-center gap-3">
            <div className="w-56 text-[12px] text-neutral-300 truncate">{b.name}</div>
            <div className="flex-1 h-6 bg-neutral-800 rounded-sm overflow-hidden relative">
              <div className="h-full transition-all" style={{ width: `${b.coverage}%`, background: c.bar }} />
              <div className="absolute inset-0 flex items-center px-2">
                <span className={`mono text-[10px] font-medium ${c.text}`}>{b.coverage}% filled</span>
              </div>
            </div>
            {b.coverage < 80 && (
              <button className="mono text-[10px] px-2 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded hover:bg-orange-500/20">
                Post Open Shift
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
