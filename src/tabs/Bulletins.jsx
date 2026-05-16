import React, { useState, useMemo } from 'react';
import {
  Megaphone, AlertCircle, Info, Bell, Plus, Send, Search, X,
  ChevronDown, ChevronUp, Pin, Archive, Filter,
} from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';

const CATEGORIES = ['AOG', 'Safety', 'Fleet', 'Scheduling', 'Weather', 'HR', 'Policy', 'Training', 'General'];

const LEVELS = [
  { id: 'ALERT',    label: 'Alert',    color: 'red' },
  { id: 'ADVISORY', label: 'Advisory', color: 'amber' },
  { id: 'INFO',     label: 'Info',     color: 'blue' },
];

// Expanded seed dataset with categories + archive examples
const SEED_BULLETINS = [
  {
    id: 'b1',
    level: 'ALERT',
    category: 'AOG',
    title: 'N291HC AOG — McKay Base',
    body: 'Tail rotor gearbox chip light confirmed. Aircraft grounded pending parts arrival. ETA from Airbus: 48–72h. Regional coverage reassigned to N431HC (Logan). Coordinate with Tevita for any affected missions.',
    postedBy: 'Nate Horstmeier',
    postedAt: '2026-05-15T14:30:00Z',
    audience: 'ALL',
    pinned: true,
  },
  {
    id: 'b2',
    level: 'ADVISORY',
    category: 'Scheduling',
    title: 'Veryon System Maintenance Window',
    body: 'Veryon will be unavailable 05/20 02:00–04:00 MT for scheduled platform updates. Log entries during this window must be completed before or after. No MX sign-offs during the outage window.',
    postedBy: 'Ryan Taul',
    postedAt: '2026-05-14T10:00:00Z',
    audience: 'ALL',
    pinned: false,
  },
  {
    id: 'b3',
    level: 'INFO',
    category: 'Fleet',
    title: 'AW109SP Q2 Inspection Cycle Starts 06/01',
    body: 'Review inspection intervals per aircraft. All 100-hr inspections in the AW109SP fleet are due to cycle in Q2. Coordinate with Carla and Rachel for scheduling windows. Greybull and Cedar City base leads please confirm availability.',
    postedBy: 'Ryan Taul',
    postedAt: '2026-05-12T09:15:00Z',
    audience: 'AMT,RMM,DIRECTOR',
    pinned: false,
  },
  {
    id: 'b4',
    level: 'ADVISORY',
    category: 'Safety',
    title: 'Hydraulic Fluid Handling — Reminder',
    body: 'Following the IH-14 incident report, all AMTs are reminded that hydraulic fluid handling requires double-glove PPE and eye protection per SOP-MX-044. Dispose of used fluid via the approved manifest only. Report any skin contact to base lead immediately.',
    postedBy: 'Billy Ortega',
    postedAt: '2026-05-10T08:00:00Z',
    audience: 'AMT,RMM',
    pinned: false,
  },
  {
    id: 'b5',
    level: 'INFO',
    category: 'Weather',
    title: 'Mountain Wave Turbulence Advisory — WY/MT',
    body: 'NWS is forecasting severe mountain wave turbulence over the Wind River Range and Absaroka Mountains 05/18–05/20. All WY/MT crews should coordinate with dispatch before launch. Bell 407 operations above 8,000 ft MSL should have director approval.',
    postedBy: 'Tevita Silatolu',
    postedAt: '2026-05-09T16:45:00Z',
    audience: 'ALL',
    pinned: false,
  },
  {
    id: 'b6',
    level: 'INFO',
    category: 'Training',
    title: 'Annual Recurrency Training — June Schedule',
    body: 'Annual recurrency training slots are now open in CompleteFlight. All AMTs must complete the airframe-specific module by 06/30. RMMs please ensure your team is enrolled by 06/01. Contact Carla with scheduling conflicts.',
    postedBy: 'Carla Weir',
    postedAt: '2026-05-07T11:00:00Z',
    audience: 'AMT,RMM',
    pinned: false,
  },
  {
    id: 'b7',
    level: 'INFO',
    category: 'HR',
    title: 'Updated PTO Policy Effective June 1',
    body: 'HR has updated the PTO accrual and carry-over policy. Key changes: carry-over cap increases from 80 to 120 hours; same-week PTO requests now require 48h notice instead of 24h. Full policy in SharePoint under HR/Policies.',
    postedBy: 'Billy Ortega',
    postedAt: '2026-05-05T09:00:00Z',
    audience: 'ALL',
    pinned: false,
  },
  {
    id: 'b8',
    level: 'ADVISORY',
    category: 'Policy',
    title: 'FAA Part 135 Drug Testing — Annual Cycle',
    body: 'Annual random drug and alcohol testing cycle begins June 1. All safety-sensitive personnel are in the pool. HR will notify selected individuals directly. Refusal constitutes a positive test under 49 CFR Part 40.',
    postedBy: 'Ryan Taul',
    postedAt: '2026-04-28T13:00:00Z',
    audience: 'ALL',
    pinned: false,
  },
  {
    id: 'b9',
    level: 'INFO',
    category: 'Fleet',
    title: 'N407CH Return to Service — Page Base',
    body: 'N407CH (Bell 407, Page IH-17) has returned to service following 100-hr inspection. All discrepancies resolved. Aircraft available for normal mission profile effective 04/26.',
    postedBy: 'Nate Horstmeier',
    postedAt: '2026-04-26T07:30:00Z',
    audience: 'ALL',
    pinned: false,
  },
];

// Bulletins older than 30 days relative to demo date are "archived"
const DEMO_NOW = new Date('2026-05-16T00:00:00Z');
const ARCHIVE_CUTOFF_DAYS = 30;

function isArchived(b) {
  const age = (DEMO_NOW - new Date(b.postedAt)) / 86_400_000;
  return age > ARCHIVE_CUTOFF_DAYS;
}

const LEVEL_CFG = {
  ALERT:    { icon: AlertCircle, label: 'Alert',    border: 'border-red-900/50',    bg: 'bg-red-900/10',    text: 'text-red-400',    badge: 'bg-red-900/30 border-red-800 text-red-400' },
  ADVISORY: { icon: Bell,        label: 'Advisory', border: 'border-amber-900/50',  bg: 'bg-amber-900/10',  text: 'text-amber-400',  badge: 'bg-amber-900/30 border-amber-800 text-amber-400' },
  INFO:     { icon: Info,        label: 'Info',     border: 'border-blue-900/50',   bg: 'bg-blue-900/10',   text: 'text-blue-400',   badge: 'bg-blue-900/30 border-blue-800 text-blue-400' },
};

function fmtDate(iso) {
  const d = new Date(iso);
  const age = (DEMO_NOW - d) / 86_400_000;
  if (age < 1) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (age < 7) return `${Math.floor(age)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Bulletins() {
  const { persona } = useCurrentUser();
  const canPost = persona && ['DIRECTOR', 'QA', 'RMM'].includes(persona.role);

  const [bulletins, setBulletins] = useState(SEED_BULLETINS);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(new Set(['b1'])); // pinned open by default
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [audienceFilter, setAudienceFilter] = useState(
    persona && !['DIRECTOR', 'QA'].includes(persona.role) ? 'mine' : 'all'
  );
  const [view, setView] = useState('active'); // 'active' | 'archive'

  const [draft, setDraft] = useState({
    level: 'INFO', category: 'General', title: '', body: '', audience: 'ALL'
  });

  function toggleExpand(id) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function post(e) {
    e.preventDefault();
    setBulletins([
      {
        id: `b${Date.now()}`,
        level: draft.level,
        category: draft.category,
        title: draft.title,
        body: draft.body,
        postedBy: persona?.name ?? 'Unknown',
        postedAt: new Date().toISOString(),
        audience: draft.audience,
        pinned: draft.level === 'ALERT',
      },
      ...bulletins,
    ]);
    setDraft({ level: 'INFO', category: 'General', title: '', body: '', audience: 'ALL' });
    setShowForm(false);
    setView('active');
  }

  const filtered = useMemo(() => {
    return bulletins
      .filter(b => view === 'archive' ? isArchived(b) : !isArchived(b))
      .filter(b => {
        if (audienceFilter === 'mine' && persona) {
          if (b.audience === 'ALL') return true;
          return b.audience.split(',').some(a => {
            const t = a.trim().toUpperCase();
            return t === persona.role || t === (persona.roleTitle ?? '').toUpperCase();
          });
        }
        return true;
      })
      .filter(b => catFilter === 'ALL' || b.category === catFilter)
      .filter(b => levelFilter === 'ALL' || b.level === levelFilter)
      .filter(b => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return b.title.toLowerCase().includes(q) || b.body.toLowerCase().includes(q) || (b.category ?? '').toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.postedAt) - new Date(a.postedAt);
      });
  }, [bulletins, view, audienceFilter, catFilter, levelFilter, search, persona]);

  const activeCount  = bulletins.filter(b => !isArchived(b)).length;
  const archiveCount = bulletins.filter(b =>  isArchived(b)).length;

  return (
    <div className="flex flex-col h-full text-neutral-100">
      {/* ── Top toolbar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-neutral-800 bg-neutral-900/60 px-4 sm:px-6 py-3 space-y-3 shrink-0">
        {/* Row 1: title + new button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Megaphone size={19} className="text-orange-400 shrink-0" />
            <h1 className="text-[17px] font-semibold">Bulletins</h1>
            <div className="flex rounded-md border border-neutral-800 overflow-hidden text-[11px] ml-2">
              <button onClick={() => setView('active')}
                className={`px-3 py-1 transition-colors ${view === 'active' ? 'bg-orange-500/15 text-orange-300' : 'bg-neutral-950 text-neutral-500 hover:text-neutral-200'}`}>
                Active <span className="text-neutral-600 ml-0.5">({activeCount})</span>
              </button>
              <button onClick={() => setView('archive')}
                className={`px-3 py-1 border-l border-neutral-800 transition-colors ${view === 'archive' ? 'bg-orange-500/15 text-orange-300' : 'bg-neutral-950 text-neutral-500 hover:text-neutral-200'}`}>
                Archive <span className="text-neutral-600 ml-0.5">({archiveCount})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Audience toggle */}
            <div className="hidden sm:flex rounded-md border border-neutral-800 overflow-hidden text-[11px]">
              <button onClick={() => setAudienceFilter('mine')}
                className={`px-3 py-1 transition-colors ${audienceFilter === 'mine' ? 'bg-orange-500/15 text-orange-300' : 'bg-neutral-950 text-neutral-500 hover:text-neutral-200'}`}>
                For me
              </button>
              <button onClick={() => setAudienceFilter('all')}
                className={`px-3 py-1 border-l border-neutral-800 transition-colors ${audienceFilter === 'all' ? 'bg-orange-500/15 text-orange-300' : 'bg-neutral-950 text-neutral-500 hover:text-neutral-200'}`}>
                All
              </button>
            </div>

            {canPost && (
              <button onClick={() => setShowForm(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${showForm ? 'bg-neutral-800 text-neutral-300' : 'bg-orange-500 hover:bg-orange-400 text-black'}`}>
                {showForm ? <X size={13} /> : <Plus size={13} />}
                {showForm ? 'Cancel' : 'New Bulletin'}
              </button>
            )}
          </div>
        </div>

        {/* Row 2: search + category + level */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search bulletins…"
              className="w-full pl-8 pr-8 py-1.5 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-orange-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-1 flex-wrap">
            <button onClick={() => setCatFilter('ALL')}
              className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${catFilter === 'ALL' ? 'bg-neutral-700 border-neutral-600 text-neutral-200' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}>
              All
            </button>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c === catFilter ? 'ALL' : c)}
                className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${catFilter === c ? 'bg-neutral-700 border-neutral-600 text-neutral-200' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Level filter */}
          <div className="flex gap-1 shrink-0">
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => setLevelFilter(levelFilter === l.id ? 'ALL' : l.id)}
                className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                  levelFilter === l.id
                    ? l.color === 'red'   ? 'bg-red-900/40 border-red-800 text-red-400'
                    : l.color === 'amber' ? 'bg-amber-900/40 border-amber-800 text-amber-400'
                    : 'bg-blue-900/40 border-blue-800 text-blue-400'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                }`}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Compose form ─────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="border-b border-neutral-800 bg-neutral-900/80 px-4 sm:px-6 py-4 shrink-0">
          <form onSubmit={post} className="max-w-2xl space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">New Bulletin</div>

            {/* Level */}
            <div className="flex gap-2">
              {LEVELS.map(l => (
                <button key={l.id} type="button" onClick={() => setDraft(d => ({ ...d, level: l.id }))}
                  className={`flex-1 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                    draft.level === l.id
                      ? l.color === 'red'   ? 'bg-red-900/40 border-red-700 text-red-400'
                      : l.color === 'amber' ? 'bg-amber-900/40 border-amber-700 text-amber-400'
                      : 'bg-blue-900/40 border-blue-700 text-blue-400'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                  }`}>
                  {l.label}
                </button>
              ))}
            </div>

            {/* Category + Audience */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Category</div>
                <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-neutral-100 focus:outline-none focus:border-orange-500">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Audience</div>
                <select value={draft.audience} onChange={e => setDraft(d => ({ ...d, audience: e.target.value }))}
                  className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-md text-xs text-neutral-100 focus:outline-none focus:border-orange-500">
                  <option value="ALL">Everyone</option>
                  <option value="AMT">AMTs only</option>
                  <option value="RMM">RMMs only</option>
                  <option value="AMT,RMM">AMTs + RMMs</option>
                  <option value="DIRECTOR,QA">Leadership only</option>
                </select>
              </div>
            </div>

            <input type="text" required placeholder="Title"
              value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-sm text-neutral-100 focus:outline-none focus:border-orange-500 placeholder:text-neutral-600" />

            <textarea rows={3} required placeholder="Body — what does the team need to know?"
              value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-sm text-neutral-100 focus:outline-none focus:border-orange-500 placeholder:text-neutral-600" />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 text-xs text-neutral-400 hover:text-neutral-200">Cancel</button>
              <button type="submit" className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg text-xs">
                <Send size={12} /> Post Bulletin
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Results count ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 py-2 text-[11px] text-neutral-600 shrink-0 border-b border-neutral-800/50">
        {filtered.length} bulletin{filtered.length !== 1 ? 's' : ''}
        {search && <span> matching "<span className="text-neutral-400">{search}</span>"</span>}
        {catFilter !== 'ALL' && <span> · {catFilter}</span>}
        {levelFilter !== 'ALL' && <span> · {LEVELS.find(l => l.id === levelFilter)?.label}</span>}
      </div>

      {/* ── Bulletin list ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto scrollbar">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 space-y-2">
          {filtered.length === 0 && (
            <div className="py-16 text-center text-neutral-600">
              <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
              <div className="text-sm">No bulletins match your filters</div>
              {(search || catFilter !== 'ALL' || levelFilter !== 'ALL') && (
                <button onClick={() => { setSearch(''); setCatFilter('ALL'); setLevelFilter('ALL'); }}
                  className="mt-3 text-xs text-orange-400 hover:text-orange-300">
                  Clear filters
                </button>
              )}
            </div>
          )}

          {filtered.map(b => (
            <BulletinCard
              key={b.id}
              bulletin={b}
              expanded={expanded.has(b.id)}
              onToggle={() => toggleExpand(b.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function BulletinCard({ bulletin: b, expanded, onToggle }) {
  const cfg = LEVEL_CFG[b.level] ?? LEVEL_CFG.INFO;
  const Icon = cfg.icon;
  const BODY_PREVIEW = 120;
  const needsTruncate = b.body.length > BODY_PREVIEW;

  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} overflow-hidden transition-all`}>
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        <Icon size={15} className={`${cfg.text} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.text}`}>{cfg.label}</span>
            {b.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-neutral-700">
                {b.category}
              </span>
            )}
            {b.pinned && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-900/40 text-orange-400 border border-orange-800/40 flex items-center gap-1">
                <Pin size={9} /> Pinned
              </span>
            )}
            <span className="text-[10px] text-neutral-500 ml-auto">{fmtDate(b.postedAt)}</span>
          </div>
          <div className="text-[13px] font-semibold leading-tight">{b.title}</div>
          {!expanded && needsTruncate && (
            <div className="text-[12px] text-neutral-400 mt-1 leading-relaxed">
              {b.body.slice(0, BODY_PREVIEW)}…
            </div>
          )}
        </div>
        <div className={`shrink-0 mt-0.5 ${cfg.text} opacity-60`}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="px-4 pb-4 pl-[42px]">
          <p className="text-[13px] text-neutral-300 leading-relaxed mb-3">{b.body}</p>
          <div className="text-[11px] text-neutral-500">
            Posted by <span className="text-neutral-400">{b.postedBy}</span>
            <span className="mx-1.5">·</span>
            {new Date(b.postedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            {b.audience !== 'ALL' && (
              <span className="ml-2 text-neutral-600">· Audience: {b.audience}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
