import React, { useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Plane, X, Wifi, AlertCircle } from 'lucide-react';

import { BASES, LIVE_FLEET, STATUS_CONFIG, WEATHER_CONFIG } from '../data/bases';
import { AIRCRAFT as STATIC_AIRCRAFT } from '../data';
import { useFleet } from '../contexts/FleetDataContext';

// CARTO Positron — free light vector style, no API key required.
// For production, swap to a self-hosted MapLibre style or Stadia Maps API.
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const INITIAL_VIEW = {
  longitude: -111.5,
  latitude: 39.5,
  zoom: 5.4,
};

export default function MapTab({ persona }) {
  const { aircraft: liveAircraft, fleetPositions } = useFleet();
  const AIRCRAFT = liveAircraft.length ? liveAircraft : STATIC_AIRCRAFT;
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [showLive, setShowLive] = useState(true);

  // Merge live cr463_fleetposition data with static demo positions.
  // Live positions (with lat/lon) take precedence; demo positions fill gaps.
  const mergedFleet = useMemo(() => {
    const livePositions = fleetPositions
      .filter((p) => p.lat != null && p.lon != null && (p.inFlight || p.inFlightLabel === 'Yes'))
      .map((p) => {
        const acRecord = AIRCRAFT.find((a) => a.tail === p.tail);
        return {
          tail:     p.tail,
          type:     acRecord?.type ?? '—',
          coords:   [Number(p.lon), Number(p.lat)],
          bearing:  Number(p.bearing ?? 0),
          speed:    p.speed,
          altitude: p.altitude,
          lastSeen: p.lastSeen,
          isLive:   true
        };
      });
    const liveTails = new Set(livePositions.map((p) => p.tail));
    const fallbackDemo = LIVE_FLEET.filter((a) => !liveTails.has(a.tail));
    return [...livePositions, ...fallbackDemo];
  }, [fleetPositions, AIRCRAFT]);

  // Filter bases by persona region (Director sees all, RMM sees their region, etc.)
  const visibleBases = useMemo(() => {
    if (!persona || persona.region === 'ALL') return BASES;
    return BASES.filter(b => b.region.includes(persona.region));
  }, [persona]);

  const visibleAircraft = useMemo(() => {
    if (!persona || persona.region === 'ALL') return mergedFleet;
    const regionTails = new Set(
      BASES.filter(b => b.region.includes(persona.region)).flatMap(b => b.aircraft)
    );
    return mergedFleet.filter(a => regionTails.has(a.tail));
  }, [persona, mergedFleet]);

  const liveCount = mergedFleet.filter((a) => a.isLive).length;

  // Aggregate stats for the overlay
  const stats = useMemo(() => ({
    total: visibleBases.length,
    available: visibleBases.filter(b => b.status === 'AVAILABLE').length,
    away: visibleBases.filter(b => b.status === 'AWAY_FROM_BASE').length,
    out: visibleBases.filter(b => b.status === 'OUT_OF_SERVICE').length,
    unavailable: visibleBases.filter(b => b.status === 'UNAVAILABLE').length,
    weatherRed: visibleBases.filter(b => b.weather === 'red').length,
    weatherYellow: visibleBases.filter(b => b.weather === 'yellow').length,
    inFlight: visibleAircraft.length,
  }), [visibleBases, visibleAircraft]);

  return (
    <div className="h-full w-full relative bg-neutral-950">
      <Map
        initialViewState={INITIAL_VIEW}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Bases */}
        {visibleBases.map(base => (
          <Marker
            key={base.id}
            longitude={base.coords[0]}
            latitude={base.coords[1]}
            anchor="bottom"
            onClick={e => { e.originalEvent.stopPropagation(); setSelectedBase(base); setSelectedAircraft(null); }}
          >
            <BaseMarker base={base} active={selectedBase?.id === base.id} />
          </Marker>
        ))}

        {/* Aircraft in flight */}
        {showLive && visibleAircraft.map(ac => (
          <Marker
            key={ac.tail}
            longitude={ac.coords[0]}
            latitude={ac.coords[1]}
            anchor="center"
            onClick={e => { e.originalEvent.stopPropagation(); setSelectedAircraft(ac); setSelectedBase(null); }}
          >
            <AircraftMarker aircraft={ac} active={selectedAircraft?.tail === ac.tail} />
          </Marker>
        ))}

        {/* Base popup */}
        {selectedBase && (
          <Popup
            longitude={selectedBase.coords[0]}
            latitude={selectedBase.coords[1]}
            anchor="top"
            offset={20}
            closeOnClick={false}
            closeButton={false}
            onClose={() => setSelectedBase(null)}
            className="mx-popup"
          >
            <BasePopupContent base={selectedBase} onClose={() => setSelectedBase(null)} AIRCRAFT={AIRCRAFT} />
          </Popup>
        )}

        {/* Aircraft popup */}
        {selectedAircraft && (
          <Popup
            longitude={selectedAircraft.coords[0]}
            latitude={selectedAircraft.coords[1]}
            anchor="top"
            offset={20}
            closeOnClick={false}
            closeButton={false}
            onClose={() => setSelectedAircraft(null)}
            className="mx-popup"
          >
            <AircraftPopupContent aircraft={selectedAircraft} onClose={() => setSelectedAircraft(null)} />
          </Popup>
        )}
      </Map>

      {/* Top-left: persona context + stats */}
      <FleetSummary persona={persona} stats={stats} showLive={showLive} setShowLive={setShowLive} liveCount={liveCount} />

      {/* Bottom-left: legend */}
      <Legend />

      {/* Embedded styles for MapLibre popup customization */}
      <style>{`
        .maplibregl-popup-content {
          background: transparent !important;
          padding: 0 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        .maplibregl-popup-tip { display: none !important; }
        .maplibregl-ctrl-group {
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08) !important;
        }
        .maplibregl-ctrl-group button { background: transparent !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>
    </div>
  );
}

// ============================================================================
// BASE MARKER — pill with weather dot + base code, status banner if not available
// ============================================================================

function BaseMarker({ base, active }) {
  const status = STATUS_CONFIG[base.status];
  const weather = WEATHER_CONFIG[base.weather];
  const showBanner = base.status !== 'AVAILABLE';
  const isOOS = base.status === 'OUT_OF_SERVICE';

  return (
    <div className="flex flex-col items-center gap-1 cursor-pointer group">
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-900/95 backdrop-blur transition-all ${
          active ? 'scale-110 ring-2 ring-orange-500' : 'group-hover:scale-105'
        } ${isOOS ? 'pulse-red' : ''}`}
        style={{ border: `1.5px solid ${status.border}` }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: weather.color, boxShadow: `0 0 6px ${weather.color}` }}
        />
        <span className="mono text-[10px] font-semibold text-neutral-100 leading-none whitespace-nowrap">
          {base.codes[0] || base.name}
        </span>
      </div>
      {showBanner && (
        <div
          className="mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded leading-none whitespace-nowrap"
          style={{ background: status.bg, color: status.color, border: `1px solid ${status.border}` }}
        >
          {base.status === 'OUT_OF_SERVICE' ? 'OUT' : base.status === 'AWAY_FROM_BASE' ? 'AWAY' : 'UNAVAIL'}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AIRCRAFT MARKER — plane icon rotated to bearing
// ============================================================================

function AircraftMarker({ aircraft, active }) {
  return (
    <div className="cursor-pointer group flex flex-col items-center">
      <div
        className={`relative transition-all ${active ? 'scale-125' : 'group-hover:scale-110'}`}
        style={{ transform: `rotate(${aircraft.bearing}deg)` }}
      >
        <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-sm" />
        <Plane
          size={20}
          className="relative text-orange-400"
          fill="rgba(255,107,26,0.9)"
          strokeWidth={1.5}
        />
      </div>
      <div
        className="mono text-[9px] mt-0.5 px-1 py-0.5 rounded bg-neutral-950/90 border border-neutral-800 text-orange-300 leading-none whitespace-nowrap"
      >
        {aircraft.tail}
      </div>
    </div>
  );
}

// ============================================================================
// BASE POPUP
// ============================================================================

function BasePopupContent({ base, onClose, AIRCRAFT = [] }) {
  const status = STATUS_CONFIG[base.status];
  const weather = WEATHER_CONFIG[base.weather];

  // Pull aircraft details from main roster
  const aircraftDetails = base.aircraft.map(tail => AIRCRAFT.find(a => a.tail === tail)).filter(Boolean);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl shadow-black/80 overflow-hidden w-[300px]">
      {/* Status banner header */}
      <div
        className="px-4 py-2.5 flex items-center justify-between"
        style={{ background: status.bg, borderBottom: `1px solid ${status.border}` }}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${base.status === 'OUT_OF_SERVICE' ? 'pulse-red' : ''}`}
            style={{ background: status.color }}
          />
          <span className="mono text-[10px] font-bold uppercase tracking-widest" style={{ color: status.color }}>
            {status.label}
          </span>
        </div>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-baseline justify-between mb-1">
          <div className="text-[15px] font-semibold tracking-tight">{base.name}</div>
          <div className="mono text-[10px] text-neutral-500">{base.region}</div>
        </div>
        {base.codes.length > 0 && (
          <div className="mono text-[10px] text-neutral-500 mb-3">{base.codes.join(' · ')}</div>
        )}

        {base.statusReason && (
          <div className="mb-3 p-2 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-neutral-300 flex items-start gap-2">
            <AlertCircle size={12} className="text-amber-400 shrink-0 mt-0.5" />
            <span>{base.statusReason}</span>
          </div>
        )}

        {/* Weather row */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-neutral-950 border border-neutral-800 rounded">
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: weather.color, boxShadow: `0 0 6px ${weather.color}` }}
          />
          <div className="flex-1">
            <div className="mono text-[10px] uppercase tracking-wider" style={{ color: weather.color }}>
              {weather.label}
            </div>
            <div className="mono text-[11px] text-neutral-300">{base.weatherDetail}</div>
          </div>
        </div>

        {/* Aircraft list */}
        <div>
          <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">
            Aircraft Assigned
          </div>
          <div className="space-y-1">
            {aircraftDetails.map(a => (
              <div key={a.tail} className="flex items-center gap-2 py-1 px-2 bg-neutral-950 border border-neutral-800 rounded">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  a.status === 'IN_SERVICE' ? 'bg-green-500' :
                  a.status === 'AOG' ? 'bg-red-500 pulse-red' :
                  'bg-amber-500'
                }`} />
                <span className="mono text-[11px] font-medium flex-1">{a.tail}</span>
                <span className="mono text-[10px] text-neutral-500">{a.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// AIRCRAFT POPUP
// ============================================================================

function AircraftPopupContent({ aircraft, onClose }) {
  const isLive = aircraft.isLive;
  const sourceLabel = isLive ? 'Live · Dataverse' : 'Demo';
  return (
    <div className="bg-neutral-900 border border-orange-500/40 rounded-lg shadow-2xl shadow-black/80 overflow-hidden w-[280px]">
      <div className="px-4 py-2.5 flex items-center justify-between bg-orange-500/10 border-b border-orange-500/30">
        <div className="flex items-center gap-2">
          <Wifi size={11} className={isLive ? 'text-green-400' : 'text-orange-400'} />
          <span className={`mono text-[10px] font-bold uppercase tracking-widest ${isLive ? 'text-green-400' : 'text-orange-400'}`}>
            {sourceLabel}
          </span>
        </div>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-200">
          <X size={14} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-baseline justify-between mb-3">
          <div className="mono text-[18px] font-semibold tracking-tight">{aircraft.tail}</div>
          <div className="mono text-[10px] text-neutral-500">{aircraft.type}</div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <Stat label="Altitude" value={(aircraft.altitude ?? 0).toLocaleString()} unit="ft" />
          <Stat label="Speed" value={aircraft.speed ?? 0} unit="kt" />
          <Stat label="Heading" value={`${aircraft.bearing ?? 0}°`} />
        </div>

        {isLive ? (
          <>
            <div className="p-2 bg-neutral-950 border border-neutral-800 rounded mb-2">
              <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Position</div>
              <div className="mono text-[11px] text-neutral-200">
                {aircraft.coords[1].toFixed(4)}, {aircraft.coords[0].toFixed(4)}
              </div>
            </div>
            {aircraft.lastSeen && (
              <div className="p-2 bg-neutral-950 border border-neutral-800 rounded">
                <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Last Polled</div>
                <div className="text-[11px] text-neutral-300">
                  {new Date(aircraft.lastSeen).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {aircraft.mission && (
              <div className="p-2 bg-neutral-950 border border-neutral-800 rounded mb-2">
                <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Mission</div>
                <div className="text-[12px] text-neutral-200">{aircraft.mission}</div>
                {aircraft.eta && <div className="mono text-[10px] text-orange-400 mt-1">ETA {aircraft.eta}</div>}
              </div>
            )}
            {aircraft.crew && (
              <div className="p-2 bg-neutral-950 border border-neutral-800 rounded">
                <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1">Crew</div>
                <div className="text-[11px] text-neutral-300 leading-relaxed">{aircraft.crew}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded p-2">
      <div className="mono text-[9px] text-neutral-500 uppercase tracking-widest mb-0.5">{label}</div>
      <div className="flex items-baseline gap-0.5">
        <span className="mono text-[14px] font-semibold">{value}</span>
        {unit && <span className="mono text-[9px] text-neutral-500">{unit}</span>}
      </div>
    </div>
  );
}

// ============================================================================
// FLEET SUMMARY OVERLAY (top-left)
// ============================================================================

function FleetSummary({ persona, stats, showLive, setShowLive, liveCount }) {
  return (
    <div className="absolute top-4 left-4 bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-lg p-3 w-[280px] shadow-xl shadow-black/50">
      <div className="flex items-center justify-between mb-2">
        <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest">Live Fleet · {persona?.region || 'ALL'}</div>
        <button
          onClick={() => setShowLive(!showLive)}
          className={`mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded border transition-colors ${
            showLive
              ? 'bg-orange-500/10 border-orange-500/40 text-orange-400'
              : 'bg-neutral-800 border-neutral-700 text-neutral-500'
          }`}
        >
          {showLive ? '● Live' : '○ Off'}
        </button>
      </div>

      {liveCount > 0 && (
        <div className="mb-3 px-2 py-1.5 rounded bg-green-900/20 border border-green-800/40">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="mono text-[10px] uppercase tracking-widest text-green-400">
              {liveCount} live position{liveCount !== 1 && 's'} from Dataverse
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <SummaryStat label="Bases" value={stats.total} />
        <SummaryStat label="In Flight" value={stats.inFlight} accent="#ff6b1a" />
      </div>

      <div className="space-y-1.5">
        <SummaryRow color="#22c55e" label="Available" value={stats.available} />
        {stats.away > 0 && <SummaryRow color="#eab308" label="Away from base" value={stats.away} />}
        {stats.out > 0 && <SummaryRow color="#ef4444" label="Out of service" value={stats.out} pulse />}
        {stats.unavailable > 0 && <SummaryRow color="#a3a3a3" label="Unavailable" value={stats.unavailable} />}
      </div>

      {(stats.weatherRed > 0 || stats.weatherYellow > 0) && (
        <div className="mt-3 pt-3 border-t border-neutral-800">
          <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5">Weather Concerns</div>
          {stats.weatherRed > 0 && <SummaryRow color="#ef4444" label="LIFR / no-go" value={stats.weatherRed} />}
          {stats.weatherYellow > 0 && <SummaryRow color="#eab308" label="MVFR / IFR" value={stats.weatherYellow} />}
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value, accent }) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded p-2">
      <div className="mono text-[9px] text-neutral-500 uppercase tracking-widest mb-0.5">{label}</div>
      <div className="text-[20px] font-semibold leading-none" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function SummaryRow({ color, label, value, pulse }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${pulse ? 'pulse-red' : ''}`} style={{ background: color }} />
      <span className="text-[11px] text-neutral-300 flex-1">{label}</span>
      <span className="mono text-[11px] font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

// ============================================================================
// LEGEND (bottom-left)
// ============================================================================

function Legend() {
  return (
    <div className="absolute bottom-4 left-4 bg-neutral-900/90 backdrop-blur border border-neutral-800 rounded-lg p-3 shadow-xl shadow-black/50">
      <div className="mono text-[10px] text-neutral-500 uppercase tracking-widest mb-2">Legend</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        <LegendItem label="Available" color="#22c55e" type="border" />
        <LegendItem label="Weather VFR" color="#22c55e" type="dot" />
        <LegendItem label="Away from base" color="#eab308" type="border" />
        <LegendItem label="Weather MVFR" color="#eab308" type="dot" />
        <LegendItem label="Out of service" color="#ef4444" type="border" pulse />
        <LegendItem label="Weather LIFR" color="#ef4444" type="dot" />
        <LegendItem label="Unavailable" color="#737373" type="border" />
        <LegendItem label="Aircraft live" color="#ff6b1a" type="plane" />
      </div>
    </div>
  );
}

function LegendItem({ label, color, type, pulse }) {
  return (
    <div className="flex items-center gap-1.5">
      {type === 'border' && (
        <div
          className={`w-3 h-3 rounded-sm bg-neutral-900 ${pulse ? 'pulse-red' : ''}`}
          style={{ border: `1.5px solid ${color}` }}
        />
      )}
      {type === 'dot' && (
        <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      )}
      {type === 'plane' && (
        <Plane size={12} style={{ color }} fill={color} strokeWidth={1.5} />
      )}
      <span className="text-[10px] text-neutral-300">{label}</span>
    </div>
  );
}
