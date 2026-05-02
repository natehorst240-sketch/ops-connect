import React, { useState, useMemo } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Database, RefreshCcw, MapPin, Plane, Filter } from 'lucide-react';
import { FLUENT } from '../tokens';
import { BASES, LIVE_FLEET, STATUS_CONFIG } from '../../data/bases';

// ============================================================================
// FLEET MAP — Phase 2 stock Power Apps map
// ----------------------------------------------------------------------------
// Read-only mirror of aircraft positions. Power Automate polls SkyRouter
// every 15 min via API key auth, upserts cr_fleet_position in Dataverse.
// Canvas app reads from Dataverse, renders pins on the stock Map control.
//
// Phase 2 fidelity intentionally LOWER than the Phase 3 / Power BI screen:
// no bearing rotation, no weather halos, no custom basemap, no sub-30s push.
// ============================================================================

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const INITIAL_VIEW = { longitude: -111.5, latitude: 39.5, zoom: 5.2 };

export default function FleetMap() {
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshedAt, setRefreshedAt] = useState(8); // min ago, demo

  const visibleBases = useMemo(() => {
    if (statusFilter === 'ALL') return BASES;
    return BASES.filter(b => b.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="p-6 h-full flex flex-col" style={{ background: FLUENT.bg }}>
      <SourceBanner />

      <div className="flex items-center gap-2 mb-1">
        <MapPin size={20} style={{ color: FLUENT.brand }} />
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Fleet Map</h1>
        <span
          style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase',
            background: FLUENT.bgAlt, color: FLUENT.textSub,
            padding: '2px 8px', borderRadius: 2, marginLeft: 6,
            border: `1px solid ${FLUENT.border}`,
          }}
        >
          Phase 2 · Stock
        </span>
      </div>
      <div style={{ fontSize: 12, color: FLUENT.textSub, marginBottom: 12 }}>
        Aircraft positions from SkyRouter · 15-min refresh · For real-time tracking see Live Fleet (Phase 3)
      </div>

      <Toolbar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        refreshedAt={refreshedAt}
        onRefresh={() => setRefreshedAt(0)}
      />

      <div className="flex flex-1 gap-3 mt-3" style={{ minHeight: 0 }}>
        <div
          className="flex-1 relative"
          style={{ background: '#fff', border: `1px solid ${FLUENT.border}`, borderRadius: 2, overflow: 'hidden' }}
        >
          <Map
            initialViewState={INITIAL_VIEW}
            mapStyle={MAP_STYLE}
            style={{ width: '100%', height: '100%' }}
            attributionControl={false}
          >
            <NavigationControl position="bottom-right" showCompass={false} />

            {visibleBases.map(base => (
              <Marker
                key={base.id}
                longitude={base.coords[0]}
                latitude={base.coords[1]}
                anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); setSelectedBase(base); setSelectedAircraft(null); }}
              >
                <SimpleBasePin base={base} />
              </Marker>
            ))}

            {LIVE_FLEET.map(ac => (
              <Marker
                key={ac.tail}
                longitude={ac.coords[0]}
                latitude={ac.coords[1]}
                anchor="bottom"
                onClick={e => { e.originalEvent.stopPropagation(); setSelectedAircraft(ac); setSelectedBase(null); }}
              >
                <SimpleAircraftPin />
              </Marker>
            ))}

            {selectedBase && (
              <Popup
                longitude={selectedBase.coords[0]}
                latitude={selectedBase.coords[1]}
                anchor="top"
                offset={20}
                closeOnClick={false}
                closeButton={true}
                onClose={() => setSelectedBase(null)}
              >
                <SimpleBasePopup base={selectedBase} />
              </Popup>
            )}

            {selectedAircraft && (
              <Popup
                longitude={selectedAircraft.coords[0]}
                latitude={selectedAircraft.coords[1]}
                anchor="top"
                offset={20}
                closeOnClick={false}
                closeButton={true}
                onClose={() => setSelectedAircraft(null)}
              >
                <SimpleAircraftPopup aircraft={selectedAircraft} />
              </Popup>
            )}
          </Map>
        </div>

        <AircraftListPanel
          selectedAircraft={selectedAircraft}
          onSelect={setSelectedAircraft}
        />
      </div>

      <DataSourcesFooter />

      <style>{`
        .maplibregl-popup-content { background: transparent !important; padding: 0 !important; box-shadow: none !important; }
        .maplibregl-popup-tip { display: none !important; }
        .maplibregl-ctrl-attrib { display: none !important; }
        .maplibregl-ctrl-group { background: ${FLUENT.surface} !important; border: 1px solid ${FLUENT.border} !important; }
      `}</style>
    </div>
  );
}

function SourceBanner() {
  return (
    <div
      className="flex items-center gap-3 mb-3 px-3 py-2"
      style={{
        background: FLUENT.infoSoft,
        border: `1px solid ${FLUENT.info}33`,
        borderLeft: `3px solid ${FLUENT.info}`,
        borderRadius: 2,
      }}
    >
      <Database size={16} style={{ color: FLUENT.info }} />
      <div className="flex-1">
        <div style={{ fontSize: 12, fontWeight: 600, color: FLUENT.info }}>
          Stock Power Apps · 15-min refresh · No PCF, no custom code
        </div>
        <div style={{ fontSize: 11, color: FLUENT.textSub, marginTop: 1 }}>
          Power Automate polls SkyRouter via API key every 15 min · Upserts to <span style={{ fontFamily: 'ui-monospace, monospace' }}>cr_fleet_position</span> · Canvas app reads from Dataverse
        </div>
      </div>
      <span
        style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
          background: FLUENT.info, color: '#fff',
          padding: '2px 6px', borderRadius: 2,
        }}
      >
        STOCK
      </span>
    </div>
  );
}

function Toolbar({ statusFilter, setStatusFilter, refreshedAt, onRefresh }) {
  const fmt = (m) => m === 0 ? 'just now' : m === 1 ? '1 min ago' : `${m} min ago`;
  return (
    <div
      className="flex items-center px-3 py-2"
      style={{
        background: FLUENT.surface,
        border: `1px solid ${FLUENT.border}`,
        borderRadius: 2,
        gap: 12,
      }}
    >
      <button
        onClick={onRefresh}
        style={{
          background: FLUENT.brand, color: '#fff',
          border: 'none', padding: '5px 12px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <RefreshCcw size={12} /> Refresh now
      </button>

      <div className="flex items-center gap-1.5" style={{ fontSize: 10.5, color: FLUENT.textSub }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: FLUENT.brand }} />
        <span>SkyRouter: <strong style={{ color: FLUENT.text, fontWeight: 600 }}>{fmt(refreshedAt)}</strong></span>
      </div>

      <div style={{ width: 1, height: 18, background: FLUENT.border }} />

      <div className="flex items-center gap-2">
        <Filter size={13} style={{ color: FLUENT.textSub }} />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            fontSize: 12, padding: '3px 6px',
            border: `1px solid ${FLUENT.borderStrong}`,
            background: FLUENT.surface, color: FLUENT.text,
            borderRadius: 2,
          }}
        >
          <option value="ALL">All bases</option>
          <option value="AVAILABLE">Available only</option>
          <option value="OUT_OF_SERVICE">Out of service</option>
          <option value="AWAY_FROM_BASE">Away from base</option>
          <option value="UNAVAILABLE">Unavailable</option>
        </select>
      </div>

      <div className="flex-1" />

      <div style={{ fontSize: 11, color: FLUENT.textSub }}>
        {LIVE_FLEET.length} aircraft · {BASES.length} bases
      </div>
    </div>
  );
}

function SimpleBasePin({ base }) {
  const status = STATUS_CONFIG[base.status];
  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 cursor-pointer"
      style={{
        background: FLUENT.surface,
        border: `1.5px solid ${status.border}`,
        borderRadius: 2,
        fontSize: 10, fontWeight: 600,
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: 3, background: status.color }} />
      <span style={{ fontFamily: 'ui-monospace, monospace' }}>{base.codes[0] || base.name}</span>
    </div>
  );
}

function SimpleAircraftPin() {
  return (
    <div
      className="cursor-pointer"
      style={{
        background: FLUENT.brand,
        border: '2px solid #fff',
        borderRadius: '50%',
        width: 18, height: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <Plane size={10} style={{ color: '#fff' }} fill="#fff" />
    </div>
  );
}

function SimpleBasePopup({ base }) {
  const status = STATUS_CONFIG[base.status];
  return (
    <div
      style={{
        background: FLUENT.surface, border: `1px solid ${FLUENT.border}`,
        borderRadius: 2, width: 220, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${FLUENT.border}`, background: status.color, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          {status.label}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2 }}>{base.name}</div>
      </div>
      <div className="px-3 py-2">
        <div style={{ fontSize: 10, color: FLUENT.textSub, fontFamily: 'ui-monospace, monospace' }}>{base.codes.join(' · ')}</div>
        {base.statusReason && (
          <div className="p-2 mt-2" style={{ background: FLUENT.bgAlt, fontSize: 11, borderRadius: 2 }}>
            {base.statusReason}
          </div>
        )}
      </div>
    </div>
  );
}

function SimpleAircraftPopup({ aircraft }) {
  return (
    <div
      style={{
        background: FLUENT.surface, border: `1px solid ${FLUENT.border}`,
        borderRadius: 2, width: 220, boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      }}
    >
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${FLUENT.border}`, background: FLUENT.brand, color: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Aircraft
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>{aircraft.tail}</div>
      </div>
      <div className="px-3 py-2">
        <Field label="Type" value={aircraft.type} />
        <Field label="Bearing" value={`${aircraft.bearing}°`} />
        <Field label="Last seen" value="~ 8 min ago (SkyRouter)" />
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between py-0.5" style={{ fontSize: 11 }}>
      <span style={{ color: FLUENT.textSub }}>{label}</span>
      <span style={{ color: FLUENT.text, fontFamily: 'ui-monospace, monospace' }}>{value}</span>
    </div>
  );
}

function AircraftListPanel({ selectedAircraft, onSelect }) {
  return (
    <div
      style={{
        width: 240, background: FLUENT.surface,
        border: `1px solid ${FLUENT.border}`, borderRadius: 2,
        display: 'flex', flexDirection: 'column', minHeight: 0,
      }}
    >
      <div className="px-3 py-2" style={{ borderBottom: `1px solid ${FLUENT.border}`, background: FLUENT.bgAlt }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          In flight
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>
          {LIVE_FLEET.length} aircraft tracked
        </div>
      </div>
      <div className="overflow-y-auto flex-1">
        {LIVE_FLEET.map(ac => {
          const isSelected = selectedAircraft?.tail === ac.tail;
          return (
            <button
              key={ac.tail}
              onClick={() => onSelect(ac)}
              style={{
                width: '100%', textAlign: 'left',
                padding: '8px 12px', cursor: 'pointer',
                background: isSelected ? FLUENT.brandSoft : 'transparent',
                border: 'none',
                borderBottom: `1px solid ${FLUENT.border}`,
                borderLeft: isSelected ? `3px solid ${FLUENT.brand}` : '3px solid transparent',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = FLUENT.surfaceAlt; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                style={{
                  background: FLUENT.brand,
                  borderRadius: '50%',
                  width: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Plane size={8} style={{ color: '#fff' }} fill="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>
                  {ac.tail}
                </div>
                <div style={{ fontSize: 10, color: FLUENT.textSub }}>
                  {ac.type} · {ac.bearing}°
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DataSourcesFooter() {
  return (
    <div
      className="mt-3 px-3 py-2 flex items-center gap-3 flex-wrap"
      style={{
        background: FLUENT.bgAlt,
        border: `1px solid ${FLUENT.border}`,
        borderRadius: 2,
        fontSize: 10.5, color: FLUENT.textSub,
      }}
    >
      <strong style={{ color: FLUENT.text, fontWeight: 600 }}>Data source:</strong>
      <span>SkyRouter (Iridium fleet tracking) via API key</span>
      <span style={{ color: FLUENT.textDim }}>·</span>
      <span>Refresh: every 15 min via Power Automate</span>
      <span style={{ color: FLUENT.textDim }}>·</span>
      <span>Phase 3 upgrade: Power BI map visual + streaming dataset (when 1000 Pro licenses available)</span>
    </div>
  );
}
