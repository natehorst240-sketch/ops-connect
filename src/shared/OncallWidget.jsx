import React, { useState, useMemo } from 'react';
import { Phone, Clock, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';
import { usePhoneFor } from '../hooks/usePhoneFor';
import {
  BASE_META,
  REGIONS,
  DEMO_TODAY_ISO,
  getOncallForDate,
} from '../data/mxOncallSchedule';

// ── colours by slot index ─────────────────────────────────────────────────────
// Stronger text (200 instead of 300) so it reads clearly on the tinted bg.
const SLOT_COLORS = [
  'bg-blue-500/20 text-blue-200 border-blue-500/30',
  'bg-orange-500/20 text-orange-200 border-orange-500/30',
  'bg-purple-500/20 text-purple-200 border-purple-500/30',
  'bg-green-500/20 text-green-200 border-green-500/30',
];

function slotColor(idx) {
  return SLOT_COLORS[idx % SLOT_COLORS.length];
}

function initials(name) {
  return name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function typeLabel(type) {
  if (type === '1st Out MX On Call') return '1st Out';
  if (type === '2nd Out MX On Call') return '2nd Out';
  if (type === 'Maintenance Control') return 'MX Ctrl';
  return null;
}

// ── Map persona.base strings → CF base names for the highlight accent ─────────
const BASE_HIGHLIGHT_MAP = {
  'greybull':     'Greybulll',
  'cedar city':   'SGU/CDC',
  'st. george':   'SGU/CDC',
  'cedar':        'SGU/CDC',
  'logan':        'MKY/LGU',
  'mckay':        'MKY/LGU',
  'utah valley':  'UV/ROOS',
  'roosevelt':    'UV/ROOS',
  'imed':         'IMED/Hangar',
  'kslc':         'FW Hangar',
  'woodscross':   'Woodscross',
  'riverton':     'FW Riverton',
  'vernal':       'Vernal',
  'lander':       'Lander',
  'rawlins':      'Rawlins',
  'burley':       'Burley',
  'rexburg':      'Rexburg',
  'elko':         'RW Elko',
  'ely':          'Ely',
  'winnemucca':   'Winnemucca',
  'glenwood':     'Glenwood Springs',
  'steamboat':    'Steamboat Springs',
  'los alamos':   'Los Alamos',
  'cortez':       'Cortez',
  'pagosa':       'Pagosa Springs',
  'fort mohave':  'Fort Mohave',
  'richfield':    'Richfield',
  'moab':         'Moab',
  'page':         'Page',
};

function resolveHighlight(personaBase) {
  if (!personaBase) return undefined;
  const lower = personaBase.toLowerCase();
  for (const [key, cfBase] of Object.entries(BASE_HIGHLIGHT_MAP)) {
    if (lower.includes(key)) return cfBase;
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function OncallWidget({ persona }) {
  const defaultRegion = persona?.region ?? 'ALL';
  const highlightBase = resolveHighlight(persona?.base);
  const navigate = useNavigation();
  const [expanded, setExpanded] = useState(false);
  const showAll = defaultRegion === 'ALL' || expanded;

  const todayByBase = useMemo(() => getOncallForDate(DEMO_TODAY_ISO), []);

  const regionGroups = useMemo(() => {
    const groups = {};
    for (const region of REGIONS) {
      const bases = Object.keys(BASE_META).filter(
        b => BASE_META[b].region === region && todayByBase[b]?.length > 0
      );
      if (bases.length) groups[region] = bases;
    }
    return groups;
  }, [todayByBase]);

  const visibleRegions = useMemo(() => {
    if (showAll) return Object.keys(regionGroups);
    const match = Object.keys(regionGroups).filter(r => r === defaultRegion);
    return match.length ? match : Object.keys(regionGroups);
  }, [showAll, regionGroups, defaultRegion]);

  const hasMore = defaultRegion !== 'ALL' && Object.keys(regionGroups).length > visibleRegions.length;
  const totalBases = visibleRegions.reduce((s, r) => s + (regionGroups[r]?.length ?? 0), 0);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden mt-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/40">
        <div>
          <div className="mono text-[10px] uppercase tracking-widest text-orange-400 font-semibold">
            MX On-Call Today
          </div>
          <div className="mono text-[10px] text-neutral-400 mt-0.5">
            {new Date(DEMO_TODAY_ISO + 'T12:00:00Z').toLocaleDateString('en-US', {
              weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
            })}
            {!showAll && defaultRegion !== 'ALL' && (
              <span className="ml-1">· {defaultRegion}</span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('oncall')}
          className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-orange-400 transition-colors"
        >
          Full Schedule <ExternalLink size={10} className="ml-0.5" />
        </button>
      </div>

      {/* Base cards */}
      <div className="p-3 space-y-3">
        {visibleRegions.map(region => (
          <RegionGroup
            key={region}
            region={region}
            bases={regionGroups[region]}
            todayByBase={todayByBase}
            highlightBase={highlightBase}
            showRegionLabel={showAll || visibleRegions.length > 1}
          />
        ))}

        {totalBases === 0 && (
          <p className="text-xs text-neutral-400 py-2 text-center">
            No on-call data for today.
          </p>
        )}
      </div>

      {/* Expand / collapse */}
      {(hasMore || expanded) && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-neutral-800 text-[11px] text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/30 transition-colors"
        >
          {expanded ? (
            <><ChevronUp size={12} /> Show my region only</>
          ) : (
            <><ChevronDown size={12} /> Show all {Object.keys(regionGroups).length} regions</>
          )}
        </button>
      )}
    </div>
  );
}

// ── Region group ──────────────────────────────────────────────────────────────

function RegionGroup({ region, bases, todayByBase, highlightBase, showRegionLabel }) {
  return (
    <div>
      {showRegionLabel && (
        <div className="mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mb-1.5 px-0.5">
          {region}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-1.5">
        {bases.map(base => (
          <BaseCard
            key={base}
            base={base}
            entries={todayByBase[base] ?? []}
            highlight={base === highlightBase}
          />
        ))}
      </div>
    </div>
  );
}

// ── Base card ─────────────────────────────────────────────────────────────────

function BaseCard({ base, entries, highlight }) {
  const meta = BASE_META[base] ?? { label: base };
  const phoneFor = usePhoneFor();

  return (
    <div className={`rounded-md border p-2.5 ${
      highlight
        ? 'border-orange-500/40 bg-orange-500/5'
        : 'border-neutral-700 bg-neutral-800/50'
    }`}>
      <div className="mono text-[10px] font-medium uppercase tracking-wider text-neutral-300 mb-1.5 leading-tight">
        {meta.label}
        {highlight && <span className="ml-1.5 text-orange-400">★</span>}
      </div>
      <div className="space-y-1">
        {entries.map((entry, idx) => {
          const phone = phoneFor(entry.owner);
          const tag = typeLabel(entry.type);
          return (
            <div key={idx}
              className={`flex items-center gap-1.5 px-1.5 py-1 rounded border text-[11px] ${slotColor(idx)}`}>
              <div className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-[9px] font-bold shrink-0">
                {initials(entry.owner)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold leading-tight truncate">{entry.owner}</div>
                <div className="flex items-center gap-1 text-[9px] opacity-80">
                  <Clock size={8} />
                  <span className="truncate">{entry.hours}</span>
                  {tag && <span className="ml-0.5">· {tag}</span>}
                </div>
              </div>
              {phone && (
                <a href={`tel:${phone}`}
                  className="shrink-0 opacity-80 hover:opacity-100 transition-opacity"
                  title={phone}
                  onClick={e => e.preventDefault()}>
                  <Phone size={11} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
