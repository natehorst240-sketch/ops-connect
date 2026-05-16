import React, { useMemo } from 'react';
import {
  AlertCircle, MapPin, Briefcase, ChevronDown, Eye, RotateCcw,
  Send, Inbox, Megaphone, Clock, Calendar, BarChart3, Activity, Map as MapIcon,
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useFleet } from '../contexts/FleetDataContext';
import { useNavigation } from '../contexts/NavigationContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { useDemoMode } from '../contexts/DemoModeContext';
import { PERSONAS } from '../data';
import DirectorHome from '../homes/Director';
import RMMHome from '../homes/RMM';
import AMTHome from '../homes/AMT';
import QAHome from '../homes/QA';
import MXSchedulerHome from '../homes/MXScheduler';
import CrewSchedulerHome from '../homes/CrewScheduler';
import NurseHome from '../homes/Nurse';

const HOMES = {
  DIRECTOR:       DirectorHome,
  RMM:            RMMHome,
  AMT:            AMTHome,
  QA:             QAHome,
  MX_SCHEDULER:   MXSchedulerHome,
  CREW_SCHEDULER: CrewSchedulerHome,
  FLIGHT_NURSE:   NurseHome,
};

export default function MyHome() {
  const { account, persona, matched, viewingAs, loading, demo } = useCurrentUser();
  const { personnel, mxRequests, aircraft } = useFleet();
  const { demoMode } = useDemoMode();
  const navigate = useNavigation();
  const { viewAsId, setViewAsId } = useViewAs();

  const pendingApprovals = useMemo(
    () => mxRequests.filter(r => r.status === 'Submitted' || r.status === 'Escalated').length,
    [mxRequests]
  );
  const aogCount = useMemo(
    () => aircraft.filter(a => a.status === 'AOG').length,
    [aircraft]
  );

  if (loading) {
    return <div className="p-8 text-neutral-400 text-sm">Resolving your profile…</div>;
  }
  if (!account && !demoMode) {
    return <div className="p-8 text-neutral-400 text-sm">Not signed in.</div>;
  }

  const Home = HOMES[persona?.role] ?? AMTHome;

  const navTiles = [
    { id: 'submit',     label: 'Submit Request', Icon: Send,      sub: 'New MX / Safety / Time-off',          accent: 'orange' },
    { id: 'inbox',      label: 'Approval Inbox', Icon: Inbox,     sub: `${pendingApprovals} pending`,         accent: pendingApprovals ? 'red' : 'neutral' },
    { id: 'scheduler',  label: 'Scheduler',      Icon: Calendar,  sub: '21-day Gantt',                        accent: 'blue' },
    { id: 'bulletins',  label: 'Bulletins',      Icon: Megaphone, sub: 'Alerts & advisories',                 accent: 'amber' },
    { id: 'oncall',     label: 'On-Call',        Icon: Clock,     sub: '8-week rotation',                     accent: 'neutral' },
    { id: 'dashboard',  label: 'Exec Dashboard', Icon: BarChart3, sub: 'KPIs & audit',                        accent: 'blue' },
    { id: 'map',        label: 'Live Fleet',     Icon: MapIcon,   sub: `${aogCount} AOG · live positions`,    accent: aogCount ? 'red' : 'green' },
    { id: 'phase2',     label: 'Phase 2 Ops',    Icon: Activity,  sub: 'Conflicts & positions',               accent: 'neutral' },
  ];

  return (
    <div className="grid-bg min-h-full">
      <div className="px-4 sm:px-7 pt-4 sm:pt-6 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-between p-4 mb-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-neutral-900 border border-orange-500/20 gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-black font-semibold shrink-0">
              {persona.initials}
            </div>
            <div className="min-w-0">
              <div className="text-base font-semibold truncate">
                Welcome, {persona.name?.split(' ')[0] ?? 'there'}
              </div>
              <div className="text-xs text-neutral-400 flex items-center gap-3 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1"><Briefcase size={11} /> {persona.roleTitle}</span>
                {persona.region && persona.region !== 'ALL' && (
                  <span className="flex items-center gap-1"><MapPin size={11} /> {persona.region}</span>
                )}
                {persona.base && persona.base !== '—' && (
                  <span className="text-neutral-500">· {persona.base}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {viewingAs && (
              <button
                onClick={() => setViewAsId(null)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-orange-900/30 border border-orange-700/50 text-xs text-orange-300 hover:bg-orange-900/50"
                title="Return to your own view"
              >
                <RotateCcw size={11} />
                Back to me
              </button>
            )}
            <ViewAsPicker
              personnel={personnel}
              viewAsId={viewAsId}
              onPick={setViewAsId}
              viewingAs={viewingAs}
            />
          </div>
        </div>

        {!matched && !viewingAs && (
          <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-md bg-yellow-900/30 border border-yellow-700/40">
            <AlertCircle size={12} className="text-yellow-400" />
            <span className="text-xs text-yellow-400">
              Not in personnel directory — using default AMT view. Use "View as" to inspect a real role.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          {navTiles.map(t => (
            <NavTile key={t.id} {...t} onClick={() => navigate(t.id)} />
          ))}
        </div>
      </div>

      <div className="fade-slide px-4 sm:px-7 pb-7 max-w-[1400px] mx-auto" key={persona.id}>
        <Home persona={persona} />
      </div>
    </div>
  );
}

function ViewAsPicker({ personnel, viewAsId, onPick, viewingAs }) {
  const { demoMode } = useDemoMode();

  // In demo mode (no live Dataverse), show the static PERSONAS list so
  // reviewers can walk through every role without a Microsoft account.
  const grouped = useMemo(() => {
    if (demoMode || personnel.length === 0) {
      return [['— Demo Roles —', PERSONAS]];
    }
    const byRegion = new Map();
    [...personnel]
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
      .forEach(p => {
        const r = p.region || '—';
        if (!byRegion.has(r)) byRegion.set(r, []);
        byRegion.get(r).push(p);
      });
    return [...byRegion.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [personnel, demoMode]);

  return (
    <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-neutral-900 border border-neutral-700 text-xs cursor-pointer hover:border-neutral-600">
      <Eye size={12} className={viewingAs ? 'text-orange-400' : 'text-neutral-400'} />
      <span className="text-neutral-400">View as</span>
      <select
        value={viewAsId ?? ''}
        onChange={(e) => onPick(e.target.value || null)}
        className="bg-transparent text-neutral-200 text-xs outline-none cursor-pointer pr-1 max-w-[200px]"
      >
        <option value="">{demoMode ? '— Director (default) —' : '— Me —'}</option>
        {grouped.map(([region, list]) => (
          <optgroup key={region} label={demoMode ? region : `${region} (${list.length})`}>
            {list.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.roleTitle ?? p.role ?? '—'}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown size={11} className="text-neutral-500" />
    </label>
  );
}

function NavTile({ label, sub, Icon, accent, onClick }) {
  const accents = {
    orange:  { ring: 'hover:border-orange-500/50', icon: 'text-orange-400' },
    red:     { ring: 'hover:border-red-500/50',    icon: 'text-red-400' },
    amber:   { ring: 'hover:border-amber-500/50',  icon: 'text-amber-400' },
    blue:    { ring: 'hover:border-blue-500/50',   icon: 'text-blue-400' },
    green:   { ring: 'hover:border-green-500/50',  icon: 'text-green-400' },
    neutral: { ring: 'hover:border-neutral-600',   icon: 'text-neutral-300' },
  }[accent] ?? { ring: 'hover:border-neutral-600', icon: 'text-neutral-300' };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-left transition-colors ${accents.ring}`}
    >
      <div className={`w-9 h-9 rounded-md bg-neutral-800 flex items-center justify-center shrink-0 ${accents.icon}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold leading-tight truncate">{label}</div>
        <div className="text-[11px] text-neutral-500 leading-tight mt-0.5 truncate">{sub}</div>
      </div>
    </button>
  );
}
