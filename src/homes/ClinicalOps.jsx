import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Users, Calendar, Send, Megaphone } from 'lucide-react';
import { PageHeader, Card, BulletinBanner } from '../ui';
import { useFleet } from '../contexts/FleetDataContext';
import { useNavigation } from '../contexts/NavigationContext';
import WeekCalendar from '../shared/WeekCalendar';
import { getEventsForPersona, getCalendarConfigForPersona } from '../shared/personaCalendarData';
import ClinicalStaffingBoard from '../shared/ClinicalStaffingBoard';
import OncallWidget from '../shared/OncallWidget';
import { DEMO_SCHEDULE_ENTRIES } from '../data/demoScheduleEntries';
import { BASE_CAPABILITIES, normalizeRole } from '../data/baseCapabilities';
import { BASE_META, DEMO_TODAY_ISO } from '../data/mxOncallSchedule';

export default function ClinicalOpsHome({ persona }) {
  const navigate = useNavigation();
  const { scheduleEntries: live } = useFleet();
  const allEntries = live?.length ? live : DEMO_SCHEDULE_ENTRIES;

  // Bases this BOM owns
  const myBases = useMemo(() =>
    Object.keys(BASE_CAPABILITIES).filter(b =>
      BASE_META[b]?.region === persona.region
    ), [persona.region]);

  // Today's gaps
  const todayGaps = useMemo(() => {
    const gaps = [];
    for (const base of myBases) {
      const caps = BASE_CAPABILITIES[base];
      if (!caps) continue;
      for (const spec of caps.specialties) {
        const filled = allEntries.some(e =>
          e.base === base &&
          e.personnelType === 'Clinical' &&
          normalizeRole(e.roleType) === spec &&
          e.shiftDate === DEMO_TODAY_ISO
        );
        if (!filled) gaps.push({ base, spec });
      }
    }
    return gaps;
  }, [allEntries, myBases]);

  // Fully-staffed base count today
  const fullStrength = useMemo(() => {
    const gapBases = new Set(todayGaps.map(g => g.base));
    return myBases.filter(b => !gapBases.has(b)).length;
  }, [myBases, todayGaps]);

  const criticalGaps = todayGaps.filter(g =>
    ['HROB RN', 'NICU RN', 'Balloon Pump', 'VAD', 'MCS/ECMO'].includes(g.spec)
  );

  return (
    <>
      <PageHeader
        persona={persona}
        subtitle={`Clinical staffing — ${persona.region}. Monitor specialty coverage, gaps, and open shifts across your bases.`}
      />
      <BulletinBanner />

      <WeekCalendar
        events={getEventsForPersona(persona)}
        {...getCalendarConfigForPersona(persona)}
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <SummaryCard
          label="Today's Gaps"
          value={todayGaps.length}
          sub={`across ${myBases.length} bases`}
          alert={todayGaps.length > 0}
          onClick={() => {}}
        />
        <SummaryCard
          label="Full Strength"
          value={`${fullStrength}/${myBases.length}`}
          sub="bases fully staffed"
          good={fullStrength === myBases.length}
        />
        <SummaryCard
          label="Critical Gaps"
          value={criticalGaps.length}
          sub="HROB · NICU · IABP · VAD · ECMO"
          alert={criticalGaps.length > 0}
        />
        <SummaryCard
          label="Your Bases"
          value={myBases.length}
          sub={`in ${persona.region}`}
        />
      </div>

      {/* Critical gap alert banner */}
      {criticalGaps.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 mb-5 rounded-lg bg-red-500/10 border border-red-500/25">
          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-red-300 mb-1">
              Critical specialty gaps today — immediate action required
            </div>
            <div className="flex flex-wrap gap-2">
              {criticalGaps.map((g, i) => (
                <span key={i} className="mono text-[10px] px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25 text-red-300">
                  {BASE_META[g.base]?.label ?? g.base} · {g.spec}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate('submit')}
            className="shrink-0 px-3 py-1.5 mono text-[10px] uppercase tracking-widest font-semibold bg-red-500 hover:bg-red-400 text-white rounded"
          >
            Post Shift
          </button>
        </div>
      )}

      {/* Full clinical staffing board */}
      <ClinicalStaffingBoard persona={persona} />

      {/* Quick actions */}
      <div className="mt-5">
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Post Open Shift',   icon: Send,        tab: 'submit' },
              { label: 'Ops Schedule',      icon: Calendar,    tab: 'ops-schedule' },
              { label: 'Post Bulletin',     icon: Megaphone,   tab: 'bulletins' },
              { label: 'Full On-Call',      icon: Users,       tab: 'oncall' },
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(a.tab)}
                  className="flex items-center gap-2 p-3 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-800 rounded-md text-[12px] font-medium text-left"
                >
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

function SummaryCard({ label, value, sub, alert, good, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 rounded-lg border bg-neutral-900 ${
        alert ? 'border-red-500/30 bg-red-500/5' : good ? 'border-green-500/20' : 'border-neutral-800'
      } ${onClick ? 'cursor-pointer hover:bg-neutral-800/80' : ''}`}
    >
      <div className={`text-[24px] font-semibold leading-none ${alert ? 'text-red-400' : good ? 'text-green-400' : 'text-neutral-100'}`}>
        {value}
      </div>
      <div className="mono text-[9px] uppercase tracking-widest text-neutral-500 mt-1">{label}</div>
      <div className="text-[10px] text-neutral-600 mt-0.5">{sub}</div>
    </div>
  );
}
