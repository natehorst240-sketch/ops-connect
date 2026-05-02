import React, { useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BarChart3, Plane, MapPin, Info, Sparkles } from 'lucide-react';
import { FLUENT } from '../tokens';
import { BASES, LIVE_FLEET, STATUS_CONFIG, WEATHER_CONFIG } from '../../data/bases';

// ============================================================================
// LIVE FLEET — Phase 3 future preview (Power BI live view)
// ----------------------------------------------------------------------------
// This is the cinematic future state, not the Phase 2 deliverable. Renders
// what real-time fleet tracking will look like once IHC's 1000 Power BI Pro
// licenses arrive: Power BI map visual + streaming dataset (or DirectQuery
// auto-refresh) + custom basemap + bearing-rotated aircraft markers + weather
// halos + per-base status overlays.
//
// For the Phase 2 reality (stock Power Apps map, 15-min refresh, basic pins)
// see the "Fleet Map" screen.
// ============================================================================

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const INITIAL_VIEW = { longitude: -111.5, latitude: 39.5, zoom: 5.2 };

export default function PCFMap() {
  const [selectedBase, setSelectedBase] = useState(null);

  const stats = useMemo(() => ({
    total: BASES.length,
    out: BASES.filter(b => b.status === 'OUT_OF_SERVICE').length,
    away: BASES.filter(b => b.status === 'AWAY_FROM_BASE').length,
    unavailable: BASES.filter(b => b.status === 'UNAVAILABLE').length,
    weatherRed: BASES.filter(b => b.weather === 'red').length,
  }), []);

  return (
    <div className="p-6 h-full flex flex-col" style={{ background: FLUENT.bg }}>
      <Phase3Banner />

      <div className="flex items-center gap-2 mb-1">
        <MapPin size={20} style={{ color: FLUENT.brand }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Live Fleet</h1>
        <span
          className="flex items-center gap-1"
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
            background: '#f2c81120', color: '#7a6500',
            padding: '2px 8px', borderRadius: 2, marginLeft: 6,
            border: '1px solid #f2c81160',
          }}
        >
          <Sparkles size={10} /> Phase 3 · Power BI
        </span>
      </div>
      <div style={{ fontSize: 12, color: FLUENT.textSub, marginBottom: 12 }}>
        Real-time aircraft tracking from SkyRouter · Power BI map visual + streaming dataset · Sub-30s update cadence
      </div>

      <Phase3Callout />

      <div
        className="flex-1 relative"
        style={{ background: '#fff', border: `1px solid ${FLUENT.border}`, borderRadius: 2, overflow: 'hidden', minHeight: 400 }}
      >
        <Map
          initialViewState={INITIAL_VIEW}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          {BASES.map(base => (
            <Marker
              key={base.id}
              longitude={base.coords[0]}
              latitude={base.coords[1]}
              anchor="bottom"
              onClick={e => { e.originalEvent.stopPropagation(); setSelectedBase(base); }}
            >
              <BaseMarker base={base} />
            </Marker>
          ))}

          {LIVE_FLEET.map(ac => (
            <Marker
              key={ac.tail}
              longitude={ac.coords[0]}
              latitude={ac.coords[1]}
              anchor="center"
            >
              <AircraftMarker aircraft={ac} />
            </Marker>
          ))}

          {selectedBase && (
            <Popup
              longitude={selectedBase.coords[0]}
              latitude={selectedBase.coords[1]}
              anchor="top"
              offset={20}
              closeOnClick={false}
              closeButton={false}
              onClose={() => setSelectedBase(null)}
            >
              <BasePopup base={selectedBase} />
            </Popup>
          )}
        </Map>

        <div
          className="absolute top-3 left-3 p-3"
          style={{
            background: FLUENT.surface, border: `1px solid ${FLUENT.border}`,
            borderRadius: 2, width: 240,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Fleet Summary
          </div>
          <StatRow label="Bases" value={stats.total} />
          <StatRow label="Out of Service" value={stats.out} color={FLUENT.bad} />
          <StatRow label="Away from base" value={stats.away} color={FLUENT.warnAccent} />
          <StatRow label="Unavailable" value={stats.unavailable} color={FLUENT.textSub} />
          <StatRow label="Weather LIFR" value={stats.weatherRed} color={FLUENT.bad} />
          <StatRow label="In flight" value={LIVE_FLEET.length} color={FLUENT.brand} />
        </div>
      </div>

      <style>{`
        .maplibregl-popup-content { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
        .maplibregl-popup-tip { display: none !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
        .maplibregl-ctrl-group { background: ${FLUENT.surface} !important; border: 1px solid ${FLUENT.border} !important; }
      `}</style>
    </div>
  );
}

function Phase3Banner() {
  return (
    <div
      className="flex items-center gap-3 mb-3 px-3 py-2"
      style={{
        background: '#f2c81115', border: '1px solid #f2c81144',
        borderLeft: '3px solid #f2c811', borderRadius: 2,
      }}
    >
      <BarChart3 size={16} style={{ color: '#7a6500' }} />
      <div className="flex-1">
        <div style={{ fontSize: 12, fontWeight: 600, color: '#7a6500' }}>
          Phase 3 future preview · Power BI live tracking
        </div>
        <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 1 }}>
          Ships when IHC's 1000 Power BI Pro licenses arrive · Streaming dataset + ArcGIS / Mapbox map visual · Sub-30s auto-refresh
        </div>
      </div>
      <span
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          background: '#f2c811', color: '#3a2f00',
          padding: '2px 6px', borderRadius: 2,
        }}
      >
        FUTURE
      </span>
    </div>
  );
}

function Phase3Callout() {
  return (
    <div
      className="p-3 mb-3 flex items-start gap-3"
      style={{ background: FLUENT.infoSoft, border: `1px solid ${FLUENT.info}33`, borderRadius: 2 }}
    >
      <Info size={14} style={{ color: FLUENT.info, marginTop: 2, flexShrink: 0 }} />
      <div style={{ fontSize: 11, color: FLUENT.text, lineHeight: 1.5 }}>
        <strong>Phase 2 reality vs Phase 3 destination.</strong> The Phase 2 deliverable is a stock Power Apps map with 15-min refresh, basic pins, click-for-detail — see the <strong>Fleet Map</strong> screen. This screen is the cinematic Phase 3 destination: live position updates, bearing-rotated icons, custom basemap, weather halos. It only ships once 1000 Power BI Pro licenses are available; until then, schedulers use the Fleet Map.
      </div>
    </div>
  );
}

function StatRow({ label, value, color }) {
  return (
    <div className="flex items-center justify-between py-1" style={{ fontSize: 12 }}>
      <span style={{ color: FLUENT.textSub }}>{label}</span>
      <span style={{ fontWeight: 600, color: color || FLUENT.text, fontFamily: 'ui-monospace, monospace' }}>{value}</span>
    </div>
  );
}

function BaseMarker({ base }) {
  const status = STATUS_CONFIG[base.status];
  const weather = WEATHER_CONFIG[base.weather];
  const showBanner = base.status !== 'AVAILABLE';
  return (
    <div className="flex flex-col items-center gap-0.5 cursor-pointer">
      <div
        className="flex items-center gap-1.5 px-1.5 py-0.5"
        style={{
          background: FLUENT.surface, border: `1.5px solid ${status.border}`,
          borderRadius: 2, fontSize: 10, fontWeight: 600,
        }}
      >
        <div style={{ width: 6, height: 6, borderRadius: 3, background: weather.color }} />
        <span style={{ fontFamily: 'ui-monospace, monospace' }}>{base.codes[0] || base.name}</span>
      </div>
      {showBanner && (
        <span
          style={{
            fontSize: 8, fontWeight: 700, letterSpacing: 0.4,
            padding: '1px 4px', background: status.color, color: '#fff', borderRadius: 1,
          }}
        >
          {base.status === 'OUT_OF_SERVICE' ? 'OUT' : base.status === 'AWAY_FROM_BASE' ? 'AWAY' : 'UNAVAIL'}
        </span>
      )}
    </div>
  );
}

function AircraftMarker({ aircraft }) {
  return (
    <div className="cursor-pointer flex flex-col items-center">
      <div style={{ transform: `rotate(${aircraft.bearing}deg)` }}>
        <Plane size={16} style={{ color: FLUENT.brand }} fill={FLUENT.brand} />
      </div>
      <span style={{
        fontSize: 9, fontFamily: 'ui-monospace, monospace', fontWeight: 600,
        background: FLUENT.surface, padding: '0 3px', border: `1px solid ${FLUENT.border}`,
        marginTop: 1,
      }}>
        {aircraft.tail}
      </span>
    </div>
  );
}

function BasePopup({ base }) {
  const status = STATUS_CONFIG[base.status];
  const weather = WEATHER_CONFIG[base.weather];
  return (
    <div
      style={{
        background: FLUENT.surface, border: `1px solid ${FLUENT.border}`,
        borderRadius: 2, width: 240, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${FLUENT.border}`, background: status.color, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {status.label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{base.name}</div>
      </div>
      <div className="px-3 py-2">
        <div style={{ fontSize: 10, color: FLUENT.textSub }}>{base.codes.join(' · ')}</div>
        <div className="flex items-center gap-2 mt-2 mb-2">
          <div style={{ width: 8, height: 8, borderRadius: 4, background: weather.color }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: weather.color }}>{weather.label}</span>
          <span style={{ fontSize: 11, color: FLUENT.textSub, fontFamily: 'ui-monospace, monospace' }}>{base.weatherDetail}</span>
        </div>
        {base.statusReason && (
          <div className="p-2 mt-1" style={{ background: FLUENT.bgAlt, fontSize: 11, borderRadius: 2 }}>
            {base.statusReason}
          </div>
        )}
      </div>
    </div>
  );
}
