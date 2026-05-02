import React, { useState } from 'react';
import {
  Plane, Users, AlertTriangle, Calendar, Wrench, Radio, TrendingUp, Layers,
  Map as MapIcon, Grid3x3, Smartphone,
} from 'lucide-react';
import { PERSONAS, AIRCRAFT, FLOWS } from './data';

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
import MapTab from './tabs/Map';
import MobileTab from './tabs/Mobile';
import M365Build from './m365/M365Build';

const TABS = [
  { id: 'm365', label: 'M365 Build', Icon: Grid3x3 },
  { id: 'app', label: 'The App', Icon: Radio },
  { id: 'map', label: 'Live Fleet', Icon: MapIcon },
  { id: 'flowA', label: 'Flow A · MX Request', Icon: Wrench },
  { id: 'flowB', label: 'Flow B · Open Shift', Icon: Users },
  { id: 'flowC', label: 'Flow C · AOG Cascade', Icon: AlertTriangle },
  { id: 'flowD', label: 'Flow D · Time Off', Icon: Calendar },
  { id: 'architecture', label: 'Architecture', Icon: Layers },
  { id: 'mobile', label: 'Mobile · Side-by-side', Icon: Smartphone },
  { id: 'roadmap', label: 'Roadmap', Icon: TrendingUp },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('m365');
  const [personaId, setPersonaId] = useState('director');
  const persona = PERSONAS.find(p => p.id === personaId);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {/* ============================================================
          DEMO CHROME — outside the app frame, on the left
          ============================================================ */}
      <DemoSidebar
        persona={persona}
        setPersonaId={setPersonaId}
        activeTab={activeTab}
      />

      {/* ============================================================
          APP FRAME — this is the actual product surface
          ============================================================ */}
      <div className="flex-1 p-6 min-w-0">
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
            {activeTab === 'm365' && <M365Build persona={persona} setPersonaId={setPersonaId} />}
            {activeTab === 'mobile' && <MobileTab persona={persona} />}
            {activeTab === 'roadmap' && <RoadmapTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEMO SIDEBAR — lives OUTSIDE the app frame
// ============================================================================

function DemoSidebar({ persona, setPersonaId, activeTab }) {
  const showPersonaSwitcher = activeTab === 'app' || activeTab === 'map' || activeTab === 'm365' || activeTab === 'mobile';
  return (
    <div className="w-64 shrink-0 bg-neutral-900/40 border-r border-neutral-800/50 flex flex-col h-screen sticky top-0">
      {/* Demo branding */}
      <div className="p-5 border-b border-neutral-800/50">
        <div className="mono text-[10px] text-neutral-500 uppercase tracking-[0.15em] mb-1.5">
          Demo Environment
        </div>
        <div className="text-[16px] font-semibold tracking-tight">MX Connect</div>
        <div className="mono text-[11px] text-neutral-500 mt-1">v0.1 · Pitch Demo</div>
      </div>

      {/* Persona switcher (App + Map tabs) or current-tab info (other tabs) */}
      <div className="p-4 flex-1 overflow-y-auto scrollbar">
        {showPersonaSwitcher ? (
          <>
            <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-3">
              View as Persona
            </div>
            <div className="flex flex-col gap-1">
              {PERSONAS.map(p => (
                <PersonaCard
                  key={p.id}
                  persona={p}
                  active={p.id === persona.id}
                  onClick={() => setPersonaId(p.id)}
                />
              ))}
            </div>

            <div className="mt-6 p-3 bg-neutral-900 border border-neutral-800 rounded-md">
              <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
                Demo note
              </div>
              <div className="text-[11px] text-neutral-400 leading-relaxed">
                {activeTab === 'map'
                  ? 'Switch personas to filter the map by region. Director sees all; RMM sees just their region.'
                  : activeTab === 'm365'
                  ? 'Phase 1 deliverable starts here — MX Request → Approval. Switch personas to see what each role experiences. No PCF, no Power BI, no third-party.'
                  : activeTab === 'mobile'
                  ? 'Switch personas to see what each role sees on their phone. Same workflow, two builds — Custom React PWA vs Power Apps mobile.'
                  : 'Switch personas to see role-specific home screens. Each role has different views, actions, and approvals.'}
              </div>
              <div className="mono text-[10px] text-neutral-600 mt-2">
                {AIRCRAFT.length} aircraft · {PERSONAS.length} personas · real roster
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-3">
              Currently Viewing
            </div>
            <CurrentTabInfo activeTab={activeTab} />

            <div className="mt-6 p-3 bg-neutral-900 border border-neutral-800 rounded-md">
              <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
                Demo note
              </div>
              <div className="text-[11px] text-neutral-400 leading-relaxed">
                Return to <span className="text-orange-400">M365 Build</span> for the Phase 1 hero, or <span className="text-orange-400">The App</span> to explore role views.
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800/50">
        <div className="mono text-[9px] text-neutral-600 uppercase tracking-widest leading-relaxed">
          IHC Life Flight<br />
          Pitch Proposal · April 2026
        </div>
      </div>
    </div>
  );
}

function CurrentTabInfo({ activeTab }) {
  const info = {
    flowA: { title: 'Flow A', subtitle: 'MX Request → Approval → Teams', text: 'Walks through how an AMT submits a maintenance window and how it ends up on the Outlook calendar and Teams channel.' },
    flowB: { title: 'Flow B', subtitle: 'Open Shift Claim', text: 'Shows the crew scheduling loop — publish, claim, sync to payroll.' },
    flowC: { title: 'Flow C', subtitle: 'AOG Cascade', text: 'Demonstrates downstream effects when an aircraft goes AOG.' },
    flowD: { title: 'Flow D', subtitle: 'Time Off → Coverage Gap', text: 'Pilot off-duty becomes an open shift automatically.' },
    architecture: { title: 'Architecture', subtitle: 'For Company IT', text: '5-layer M365 stack: Power Apps + Power Automate + Dataverse + Microsoft Graph + external systems. Inherits tenant DLP, Purview, Entra ID.' },
    mobile: { title: 'Mobile', subtitle: 'Custom vs M365 · Side-by-side', text: 'Same AMT field workflow on the custom React PWA and the Power Apps mobile shell.' },
    roadmap: { title: 'Roadmap', subtitle: 'For Ops Leadership', text: '3-phase M365 rollout. Phase 1 (greenlit) ships in 6–8 weeks; Phase 3 gated on 1000 Power BI Pro licenses.' },
  }[activeTab];

  if (!info) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-md p-3">
      <div className="mono text-[10px] text-orange-400 uppercase tracking-widest mb-1">
        {info.title}
      </div>
      <div className="text-[13px] font-semibold mb-2">{info.subtitle}</div>
      <div className="text-[11px] text-neutral-400 leading-relaxed">{info.text}</div>
    </div>
  );
}

function PersonaCard({ persona, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 p-2.5 rounded-md text-left transition-all border ${
        active
          ? 'bg-neutral-800 border-orange-500'
          : 'bg-transparent border-transparent hover:bg-neutral-800/50'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ${
          active
            ? 'bg-orange-500 text-black'
            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
        }`}
      >
        {persona.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{persona.name}</div>
        <div className="mono text-[10px] text-neutral-500 truncate">
          {persona.role} · {persona.region}
        </div>
      </div>
    </button>
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
          <div className="text-[14px] font-semibold tracking-tight">MX Connect</div>
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
// APP HOME — renders the role-specific home
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
