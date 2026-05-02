import React from 'react';
import {
  Home, BarChart3, Calendar, Map as MapIcon, MessageSquare,
  Search, Bell, HelpCircle, Settings, Grid3x3,
} from 'lucide-react';
import { FLUENT, FLUENT_FONT } from './tokens';

const NAV_ITEMS = [
  { id: 'apps',      label: 'Power Apps',         Icon: Home,          section: 'apps' },
  { id: 'teams',     label: 'Teams Approvals',    Icon: MessageSquare, section: 'apps' },
  { id: 'scheduler', label: 'Resource Scheduler', Icon: Calendar,      section: 'apps' },
  { id: 'map',       label: 'Live Fleet',         Icon: MapIcon,       section: 'apps' },
  { id: 'powerbi',   label: 'Power BI Report',    Icon: BarChart3,     section: 'analytics' },
];

export default function M365Shell({ activeScreen, setActiveScreen, persona, children }) {
  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ background: FLUENT.bg, fontFamily: FLUENT_FONT, color: FLUENT.text }}
    >
      <TopBar persona={persona} />
      <div className="flex-1 flex min-h-0">
        <LeftRail activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
        <main className="flex-1 overflow-auto" style={{ background: FLUENT.bg }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function TopBar({ persona }) {
  return (
    <div
      className="flex items-center px-4 shrink-0"
      style={{
        height: 48,
        background: FLUENT.brand,
        borderBottom: `1px solid ${FLUENT.brandDeep}`,
        color: '#fff',
      }}
    >
      <div className="flex items-center gap-3 mr-6">
        <Grid3x3 size={18} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>Microsoft Power Platform</span>
      </div>

      <div className="flex items-center gap-1" style={{ fontSize: 13 }}>
        <span style={{ opacity: 0.85 }}>IHC Health Services</span>
        <span style={{ opacity: 0.5 }}>›</span>
        <span style={{ fontWeight: 600 }}>MX Connect (M365)</span>
      </div>

      <div className="flex-1 flex justify-center max-w-xl mx-8">
        <div
          className="flex items-center gap-2 px-3 w-full"
          style={{
            height: 28, background: 'rgba(255,255,255,0.18)', borderRadius: 2,
            color: '#fff', fontSize: 13,
          }}
        >
          <Search size={13} />
          <span style={{ opacity: 0.7 }}>Search apps, reports, and flows</span>
        </div>
      </div>

      <div className="flex items-center gap-3" style={{ fontSize: 13 }}>
        <Bell size={16} style={{ opacity: 0.85 }} />
        <HelpCircle size={16} style={{ opacity: 0.85 }} />
        <Settings size={16} style={{ opacity: 0.85 }} />
        <div
          className="flex items-center gap-2 ml-2 px-2 py-1"
          style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 2 }}
        >
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              width: 22, height: 22, background: '#fff',
              color: FLUENT.brand, fontSize: 10, fontWeight: 700,
            }}
          >
            {persona.initials}
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.2 }}>
            <div style={{ fontWeight: 600 }}>{persona.name}</div>
            <div style={{ opacity: 0.8, fontSize: 10 }}>{persona.roleTitle}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeftRail({ activeScreen, setActiveScreen }) {
  return (
    <nav
      className="shrink-0 flex flex-col"
      style={{
        width: 240,
        background: FLUENT.bgAlt,
        borderRight: `1px solid ${FLUENT.border}`,
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${FLUENT.border}` }}>
        <div style={{ fontSize: 11, color: FLUENT.textSub, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          IHC Production Environment
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>MX Connect</div>
      </div>

      <RailGroup label="Apps">
        {NAV_ITEMS.filter(i => i.section === 'apps').map(item => (
          <RailItem
            key={item.id} item={item}
            active={activeScreen === item.id}
            onClick={() => setActiveScreen(item.id)}
          />
        ))}
      </RailGroup>

      <RailGroup label="Analytics">
        {NAV_ITEMS.filter(i => i.section === 'analytics').map(item => (
          <RailItem
            key={item.id} item={item}
            active={activeScreen === item.id}
            onClick={() => setActiveScreen(item.id)}
          />
        ))}
      </RailGroup>

      <div className="mt-auto px-4 py-3" style={{ borderTop: `1px solid ${FLUENT.border}` }}>
        <div className="flex items-center gap-2 mb-1">
          <div style={{ width: 6, height: 6, borderRadius: 3, background: FLUENT.good }} />
          <span style={{ fontSize: 11, color: FLUENT.textSub, fontWeight: 600 }}>
            Environment healthy
          </span>
        </div>
        <div style={{ fontSize: 10, color: FLUENT.textDim }}>
          Last published 2 hr ago · v 1.0.18
        </div>
      </div>
    </nav>
  );
}

function RailGroup({ label, children }) {
  return (
    <div className="py-2">
      <div
        className="px-4 mb-1"
        style={{
          fontSize: 10, color: FLUENT.textSub, fontWeight: 600,
          letterSpacing: 0.5, textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function RailItem({ item, active, onClick }) {
  const { Icon } = item;
  return (
    <button
      onClick={onClick}
      className="flex items-center w-full text-left transition-colors"
      style={{
        gap: 10,
        padding: '7px 16px',
        background: active ? FLUENT.brandSoft : 'transparent',
        borderLeft: active ? `3px solid ${FLUENT.brand}` : '3px solid transparent',
        color: active ? FLUENT.brandDeep : FLUENT.text,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        cursor: 'pointer',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = FLUENT.surfaceAlt; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={15} style={{ opacity: active ? 1 : 0.75 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
    </button>
  );
}
