import React, { useState } from 'react';
import { Megaphone, AlertCircle, Info, Bell, Plus, Send } from 'lucide-react';
import { useCurrentUser } from '../hooks/useCurrentUser';

// Static seed bulletins — in production these come from cr_operational_bulletin
const SEED_BULLETINS = [
  {
    id: 'b1',
    level: 'ALERT',
    title: 'N291HC AOG — McKay Base',
    body:  'Tail rotor gearbox chip light. Awaiting parts ETA. Regional coverage from N431HC (Logan).',
    postedBy: 'Nate Horstmeier',
    postedAt: '2026-05-15T14:30:00Z',
    audience: 'ALL'
  },
  {
    id: 'b2',
    level: 'ADVISORY',
    title: 'Veryon System Maintenance Window',
    body:  'Veryon unavailable 05/20 02:00–04:00 MT for scheduled updates.',
    postedBy: 'Ryan Taul',
    postedAt: '2026-05-14T10:00:00Z',
    audience: 'ALL'
  },
  {
    id: 'b3',
    level: 'INFO',
    title: 'AW109SP Q2 Inspection Cycle Starts 06/01',
    body:  'Review inspection intervals per aircraft. Coordinate with Carla and Rachel for scheduling.',
    postedBy: 'Ryan Taul',
    postedAt: '2026-05-12T09:15:00Z',
    audience: 'AMT,RMM,Director'
  }
];

export default function Bulletins() {
  const { persona } = useCurrentUser();
  const canPost = persona && ['DIRECTOR', 'QA', 'RMM'].includes(persona.role);
  const [bulletins, setBulletins] = useState(SEED_BULLETINS);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ level: 'INFO', title: '', body: '' });

  function post(e) {
    e.preventDefault();
    setBulletins([
      {
        id: `b${Date.now()}`,
        level: draft.level,
        title: draft.title,
        body: draft.body,
        postedBy: persona?.name ?? 'Unknown',
        postedAt: new Date().toISOString(),
        audience: 'ALL'
      },
      ...bulletins
    ]);
    setDraft({ level: 'INFO', title: '', body: '' });
    setShowForm(false);
  }

  return (
    <div className="p-8 max-w-3xl mx-auto text-neutral-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone size={22} className="text-orange-400" />
          <h1 className="text-2xl font-semibold">Bulletins</h1>
        </div>
        {canPost && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg transition-colors text-sm"
          >
            <Plus size={14} />
            New Bulletin
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={post} className="mb-6 p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {['ALERT', 'ADVISORY', 'INFO'].map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => setDraft({ ...draft, level: lv })}
                className={`px-3 py-2 rounded-md text-xs font-semibold border transition-colors ${
                  draft.level === lv
                    ? lv === 'ALERT' ? 'bg-red-900/40 border-red-700 text-red-400'
                      : lv === 'ADVISORY' ? 'bg-yellow-900/40 border-yellow-700 text-yellow-400'
                      : 'bg-blue-900/40 border-blue-700 text-blue-400'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500'
                }`}
              >
                {lv}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Title"
            required
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-sm focus:outline-none focus:border-orange-500"
          />
          <textarea
            rows={3}
            placeholder="Body"
            required
            value={draft.body}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })}
            className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-md text-sm focus:outline-none focus:border-orange-500"
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200">
              Cancel
            </button>
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg text-sm">
              <Send size={14} />
              Post
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {bulletins.map((b) => <Card key={b.id} bulletin={b} />)}
      </div>
    </div>
  );
}

function Card({ bulletin }) {
  const cfg = {
    ALERT:    { icon: AlertCircle, color: 'red',    label: 'Alert' },
    ADVISORY: { icon: Bell,        color: 'yellow', label: 'Advisory' },
    INFO:     { icon: Info,        color: 'blue',   label: 'Info' }
  }[bulletin.level];
  const Icon = cfg.icon;
  const colorClass = {
    red:    'border-red-900/50 bg-red-900/10',
    yellow: 'border-yellow-900/50 bg-yellow-900/10',
    blue:   'border-blue-900/50 bg-blue-900/10'
  }[cfg.color];
  const accentText = {
    red: 'text-red-400', yellow: 'text-yellow-400', blue: 'text-blue-400'
  }[cfg.color];

  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <div className="flex items-start gap-3">
        <Icon size={18} className={`${accentText} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${accentText}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-neutral-500">
              {new Date(bulletin.postedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          </div>
          <h3 className="text-base font-semibold mb-1">{bulletin.title}</h3>
          <p className="text-sm text-neutral-300">{bulletin.body}</p>
          <p className="text-xs text-neutral-500 mt-2">— {bulletin.postedBy}</p>
        </div>
      </div>
    </div>
  );
}
