import React, { useState } from 'react';
import {
  Plane, Users, AlertTriangle, Calendar, Wrench, Radio, TrendingUp, Layers,
  Map as MapIcon, Grid3x3, Smartphone, GitBranch,
} from 'lucide-react';
import { PERSONAS, FLOWS } from './data';

import DirectorHome from './homes/Director';
import RMMHome from './homes/RMM';
import AMTHome from './homes/AMT';
import QAHome from './homes/QA';
import MXSchedulerHome from './homes/MXScheduler';
import CrewSchedulerHome from './homes/CrewScheduler';
import NurseHome from './homes/Nurse';

import FlowTab from './tabs/Flow';
import ArchitectureTab from './tabs/Architecture';
import RoadmapTab from './tabs/Roadmap';
import PhaseFlowTab from './tabs/PhaseFlow';
import MapTab from './tabs/Map';
import MobileTab from './tabs/Mobile';
import M365Build from './m365/M365Build';

const TABS = [
  { id: 'm365', label: 'M365 Build', Icon: Grid3x3 },
  { id: 'phaseFlow', label: 'Phase Flow', Icon: GitBranch },
  { id: 'app', label: 'The App', Icon: Radio },
  { id: 'map', label: 'Live Fleet', Icon: MapIcon },
  { id: 'flowA', label: 'Flow A · MX Request', Icon: Wrench },
  { id: 'flowB', label: 'Flow B · Open Shift', Icon: Users },
  { id: 'flowC', label: 'Flow C · AOG Cascade', Icon: AlertTriangle },
  { id: 'flowD', label: 'Flow D · Time Off', Icon: Calendar },
  { id: 'architecture', label: 'Architecture', Icon: Layers },
  { id: 'mobile', label: 'Mobile · See How It Looks on a Phone', Icon: Smartphone },
  { id: 'roadmap', label: 'Roadmap', Icon: TrendingUp },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('m365');
  const [personaId, setPersonaId] = useState('director');
  const persona = PERSONAS.find(p => p.id === personaId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6">
      <div className="h-[calc(100vh-48px)] flex flex-col rounded-xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/60 overflow-hidden">
        <AppTopNav activeTab={activeTab} setActiveTab={setActiveTab} persona={persona} />
        <div className={`flex-1 ${activeTab === 'map' || activeTab === 'm365' ? 'overflow-hidden' : 'overflow-auto scrollbar'}`}>
          {activeTab === 'app' && <AppHome persona={persona} />}
          {activeTab === 'map' && <MapTab persona={persona} />}
          {activeTab === 'flowA' && <FlowTab flow={FLOWS.flowA} />}
          {activeTab === 'flowB' && <FlowTab flow={FLOWS.flowB} />}
          {activeTab === 'flowC' && <FlowTab flow={FLOWS.flowC} />}
          {activeTab === 'flowD' && <FlowTab flow={FLOWS.flowD} />}
          {activeTab === 'architecture' && <ArchitectureTab />}
          {activeTab === 'phaseFlow' && <PhaseFlowTab />}
          {activeTab === 'm365' && <M365Build persona={persona} setPersonaId={setPersonaId} />}
          {activeTab === 'mobile' && <MobileTab persona={persona} />}
          {activeTab === 'roadmap' && <RoadmapTab />}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// APP TOP NAV — INSIDE the app frame (this is part of the real product)
// ============================================================================

function AppTopNav({ activeTab, setActiveTab, persona }) {
  return (
    <div className="bg-neutral-900 border-b border-neutral-800 shrink-0">
      <div className="flex items-center px-5 gap-5">
        <div className="flex items-center gap-2.5 py-3.5 shrink-0">
          <div className="w-7 h-7 rounded-md bg-orange-500 flex items-center justify-center shadow-md shadow-orange-500/30">
            <Plane size={15} className="text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-[14px] font-semibold tracking-tight leading-tight">MX Connect</div>
            <div className="mono text-[9px] text-neutral-500 tracking-widest leading-tight">v0.1 · Pitch Demo</div>
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

        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-neutral-800 border border-neutral-700 shrink-0">
          <div className="w-6 h-6 rounded-full bg-orange-600 flex items-center justify-center text-[10px] font-semibold text-black">
            {persona.initials}
          </div>
          <div className="text-[11.5px]">
            <div className="font-medium leading-tight">{persona.name}</div>
            <div className="mono text-neutral-500 text-[9px] leading-tight">{persona.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// APP HOME — renders the role-specific home (legacy custom-build tab)
// ============================================================================

function AppHome({ persona }) {
  return (
    <div className="grid-bg min-h-full">
      <div className="fade-slide p-7 max-w-[1400px] mx-auto" key={persona.id}>
        <Home persona={persona} />
      </div>
    </div>
  );
}

function Home({ persona }) {
  switch (persona.role) {
    case 'DIRECTOR': return <DirectorHome persona={persona} />;
    case 'RMM': return <RMMHome persona={persona} />;
    case 'AMT': return <AMTHome persona={persona} />;
    case 'QA': return <QAHome persona={persona} />;
    case 'MX_SCHEDULER': return <MXSchedulerHome persona={persona} />;
    case 'CREW_SCHEDULER': return <CrewSchedulerHome persona={persona} />;
    case 'FLIGHT_NURSE': return <NurseHome persona={persona} />;
    default: return null;
  }
}
