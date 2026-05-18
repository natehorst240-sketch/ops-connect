import React, { useState } from 'react';
import {
  Plane, Map as MapIcon, Activity,
  Send, Inbox, Megaphone, Clock, BarChart3, Home as HomeIcon, FlaskConical,
  MoreHorizontal, X, Calendar, Wrench,
} from 'lucide-react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import { dataverseScopes } from './auth/config.js';
import { PERSONAS } from './data';

import DirectorHome from './homes/Director';
import RMMHome from './homes/RMM';
import AMTHome from './homes/AMT';
import QAHome from './homes/QA';
import MXSchedulerHome from './homes/MXScheduler';
import CrewSchedulerHome from './homes/CrewScheduler';
import NurseHome from './homes/Nurse';

import MapTab from './tabs/Map';
import Phase2Status from './tabs/Phase2Status';
import SubmitRequest from './tabs/SubmitRequest';
import ApprovalInbox from './tabs/ApprovalInbox';
import Bulletins from './tabs/Bulletins';
import OncallSchedule from './tabs/OncallSchedule';
import Scheduler from './tabs/Scheduler';
import Dashboard from './tabs/Dashboard';
import Inspections from './tabs/Inspections';
import MyHome from './tabs/MyHome';
import OpsSchedule from './tabs/OpsSchedule';
import { FleetDataProvider } from './contexts/FleetDataContext';
import { NavigationProvider } from './contexts/NavigationContext';
import { ViewAsProvider } from './contexts/ViewAsContext';
import { DemoModeProvider, useDemoMode } from './contexts/DemoModeContext';
import { useCurrentUser } from './hooks/useCurrentUser';

const TABS = [
  { id: 'myhome',    label: 'My Home',        Icon: HomeIcon },
  { id: 'submit',    label: 'Submit Request', Icon: Send },
  { id: 'inbox',     label: 'Approval Inbox', Icon: Inbox },
  { id: 'bulletins', label: 'Bulletins',      Icon: Megaphone },
  { id: 'oncall',       label: 'MX On-Call',     Icon: Clock },
  { id: 'ops-schedule', label: 'Ops Schedule',  Icon: Calendar },
  { id: 'scheduler',    label: 'Scheduler',     Icon: Calendar },
  { id: 'dashboard', label: 'Exec Dashboard', Icon: BarChart3 },
  { id: 'map',         label: 'Live Fleet',     Icon: MapIcon },
  { id: 'inspections', label: 'Inspections',   Icon: Wrench },
  { id: 'phase2',      label: 'Phase 2 Ops',   Icon: Activity },
];

// Root is outside MSAL-dependent hooks — DemoModeProvider lives here
// so the login screen can toggle it before providers that use MSAL.
export default function App() {
  return (
    <DemoModeProvider>
      <AppInner />
    </DemoModeProvider>
  );
}

function AppInner() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { demoMode, setDemoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState('myhome');

  if (!isAuthenticated && !demoMode) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-14 h-14 rounded-xl bg-orange-500 flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30">
            <Plane size={28} className="text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-2xl font-semibold text-neutral-100">MX Connect</div>
            <div className="text-sm text-neutral-500 mt-1">IHC Aviation Maintenance Operations</div>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => instance.loginRedirect({ scopes: dataverseScopes })}
              className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg transition-colors"
            >
              Sign in with Microsoft
            </button>
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-neutral-800" />
              <span className="text-xs text-neutral-600">or</span>
              <div className="flex-1 h-px bg-neutral-800" />
            </div>
            <button
              onClick={() => setDemoMode(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 font-medium rounded-lg transition-colors"
            >
              <FlaskConical size={16} className="text-orange-400" />
              Explore Demo — no login required
            </button>
            <p className="text-xs text-neutral-600 max-w-xs">
              Uses sample data · no Dataverse connection · all roles selectable
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FleetDataProvider>
    <ViewAsProvider>
    <NavigationProvider navigate={setActiveTab}>
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="h-[calc(100vh-48px)] flex flex-col rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/60 overflow-hidden relative">
        {demoMode && <DemoBanner onSignIn={() => { setDemoMode(false); instance.loginRedirect({ scopes: dataverseScopes }); }} onExit={() => setDemoMode(false)} />}
        <AppTopNav activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className={`flex-1 min-h-0 ${activeTab === 'map' || activeTab === 'm365' ? 'overflow-hidden' : 'overflow-auto scrollbar'}`}>
          {activeTab === 'myhome'    && <MyHome />}
          {activeTab === 'submit'    && <SubmitRequest />}
          {activeTab === 'inbox'     && <ApprovalInbox />}
          {activeTab === 'bulletins' && <Bulletins />}
          {activeTab === 'oncall'        && <OncallSchedule />}
          {activeTab === 'ops-schedule'  && <OpsSchedule />}
          {activeTab === 'scheduler'     && <Scheduler />}
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'map'         && <MapTab />}
          {activeTab === 'inspections' && <Inspections />}
          {activeTab === 'phase2'      && <Phase2Status />}
        </div>
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
    </NavigationProvider>
    </ViewAsProvider>
    </FleetDataProvider>
  );
}

// ============================================================================
// DEMO BANNER
// ============================================================================

function DemoBanner({ onSignIn, onExit }) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 bg-orange-950/60 border-b border-orange-900/60 shrink-0">
      <div className="flex items-center gap-2 text-xs text-orange-300">
        <FlaskConical size={12} />
        <span className="font-medium">Demo mode</span>
        <span className="text-orange-500">·</span>
        <span className="text-orange-400/70">Sample data only · no writes to Dataverse · use "View as" to switch roles</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSignIn}
          className="text-xs px-2.5 py-1 rounded bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 font-medium"
        >
          Sign in for live data
        </button>
        <button
          onClick={onExit}
          className="text-xs px-2 py-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300"
        >
          Exit demo
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// APP TOP NAV — INSIDE the app frame (this is part of the real product)
// ============================================================================

function AppTopNav({ activeTab, setActiveTab }) {
  const { persona: displayPersona } = useCurrentUser();
  const { demoMode } = useDemoMode();
  return (
    <div className="bg-neutral-900 border-b border-neutral-800 shrink-0">
      <div className="flex items-center px-5 gap-5">
        <div className="flex items-center gap-2.5 py-3.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
            <Plane size={15} className="text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[14px] font-semibold tracking-tight leading-tight">MX Connect</div>
            <div className="mono text-[9px] text-neutral-500 tracking-widest leading-tight">
              {demoMode ? 'Demo · Sample Data' : 'v0.1 · Pitch Demo'}
            </div>
          </div>
        </div>

        <div className="flex gap-0.5 flex-1 overflow-x-auto scrollbar">
          {TABS.map(t => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-3 py-3 text-[12.5px] font-medium whitespace-nowrap border-t-2 transition-colors ${
                  active
                    ? 'bg-neutral-800 text-neutral-100 border-orange-500'
                    : 'text-neutral-400 border-transparent hover:text-neutral-200'
                }`}
              >
                <t.Icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-neutral-800 border border-neutral-700 shrink-0" title={demoMode ? 'Demo persona' : 'Signed in'}>
          <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-semibold text-black">
            {displayPersona?.initials ?? '?'}
          </div>
          <div className="text-[11.5px]">
            <div className="font-medium leading-tight">{displayPersona?.name ?? '—'}</div>
            <div className="mono text-neutral-500 text-[9px] leading-tight">
              {displayPersona?.role}{displayPersona?.region && displayPersona.region !== 'ALL' ? ` · ${displayPersona.region}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// BOTTOM NAV — always visible, replaces the need to scroll the top tab strip
// ============================================================================

const BOTTOM_TABS = [
  { id: 'myhome',       label: 'Home',     Icon: HomeIcon },
  { id: 'submit',       label: 'Submit',   Icon: Send },
  { id: 'inbox',        label: 'Inbox',    Icon: Inbox },
  { id: 'ops-schedule', label: 'Schedule', Icon: Calendar },
  { id: 'bulletins',    label: 'Bulletins',Icon: Megaphone },
];

// All other tabs shown in the "More" drawer
const MORE_TABS = TABS.filter(t => !BOTTOM_TABS.find(b => b.id === t.id));

function BottomNav({ activeTab, setActiveTab }) {
  const [showMore, setShowMore] = useState(false);
  const inMore = !BOTTOM_TABS.find(b => b.id === activeTab);

  function pick(id) {
    setActiveTab(id);
    setShowMore(false);
  }

  return (
    <>
      {/* More drawer overlay */}
      {showMore && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end" style={{ bottom: 0 }}>
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
          <div className="relative bg-neutral-900 border-t border-neutral-700 rounded-t-xl p-4 pb-24">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-neutral-400">All screens</span>
              <button onClick={() => setShowMore(false)} className="text-neutral-500 hover:text-neutral-200">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE_TABS.map(t => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => pick(t.id)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors text-center ${
                      active
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                        : 'bg-neutral-800/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    <t.Icon size={18} />
                    <span className="text-[11px] font-medium leading-tight">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bar */}
      <div className="shrink-0 border-t border-neutral-800 bg-neutral-900 flex items-stretch safe-area-inset-bottom">
        {BOTTOM_TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                active ? 'text-orange-400' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <t.Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{t.label}</span>
              {active && <div className="absolute bottom-0 w-8 h-0.5 bg-orange-500 rounded-t" />}
            </button>
          );
        })}
        <button
          onClick={() => setShowMore(v => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors relative ${
            showMore || inMore ? 'text-orange-400' : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          <MoreHorizontal size={20} strokeWidth={showMore || inMore ? 2.5 : 1.8} />
          <span className="text-[10px] font-medium">More</span>
          {inMore && !showMore && <div className="absolute bottom-0 w-8 h-0.5 bg-orange-500 rounded-t" />}
        </button>
      </div>
    </>
  );
}
