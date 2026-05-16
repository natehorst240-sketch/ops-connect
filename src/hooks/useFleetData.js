import { useState, useEffect } from 'react';
import { useDataverse } from './useDataverse';
import { TABLES } from '../auth/tables';

function pick(row, ...candidates) {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null && row[c] !== '') return row[c];
  }
  return undefined;
}

// Map Dataverse numeric status codes to the strings the UI expects.
// 1 = In Service is the most common — others guess from CSV import order.
const STATUS_MAP = {
  1: 'IN_SERVICE',
  2: 'MAINTENANCE',
  3: 'AOG',
  4: 'SPARE'
};

function mapAircraft(row) {
  // Prefer the formatted (display-name) value, fall back to numeric mapping
  const formattedStatus = row['cr463_operationalstatus@OData.Community.Display.V1.FormattedValue'];
  const rawStatus = row.cr463_operationalstatus;
  const status =
    (formattedStatus && formattedStatus.toUpperCase().replace(/\s+/g, '_')) ??
    STATUS_MAP[rawStatus] ??
    'IN_SERVICE';

  return {
    tail:   pick(row, 'cr463_tailnumber', 'cr463_title'),
    type:   pick(row, 'cr463_helicoptertype'),
    base:   pick(row, 'cr463_baselocation'),
    region: pick(row, 'cr463_operatingregion'),
    status,
    make:   pick(row, 'cr463_manufacturer'),
    model:  pick(row, 'cr463_modelnumber'),
    serial: pick(row, 'cr463_serialnumber'),
    rmm:    pick(row, 'cr463_responsiblemaintenancemanager')
  };
}

function mapPersonnel(row) {
  return {
    id:          row.cr463_personnelmaintenanceid,
    name:        pick(row, 'cr463_employeetitle'),
    firstName:   pick(row, 'cr463_firstname'),
    lastName:    pick(row, 'cr463_lastname'),
    email:       pick(row, 'cr463_emailaddress'),
    phone:       pick(row, 'cr463_phonenumber'),
    role:        pick(row, 'cr463_role'),
    primaryBase: pick(row, 'cr463_primarybaselocation'),
    region:      pick(row, 'cr463_regioncode'),
    leader:      pick(row, 'cr463_leadername'),
    coverageBases: pick(row, 'cr463_coveragebases'),
    isActive:    row.cr463_isactive
  };
}

function mapMxRequest(row) {
  return {
    id:            row.cr463_maintenancerequestid,
    requestNumber: pick(row, 'cr463_requestnumber', 'cr463_requesttitle'),
    title:         pick(row, 'cr463_requesttitle', 'cr463_requestnumber'),
    aircraftTail:  pick(row, 'cr463_aircrafttailnumber'),
    aircraftType:  pick(row, 'cr463_aircraftmodel'),
    type:          pick(row, 'cr463_typeofrequest'),     // for legacy r.type filters
    requestType:   pick(row, 'cr463_typeofrequest'),
    base:          pick(row, 'cr463_baselocation'),
    status:        pick(row, 'cr463_requeststatus@OData.Community.Display.V1.FormattedValue'),
    priority:      pick(row, 'cr463_prioritylevel@OData.Community.Display.V1.FormattedValue'),
    requestedBy:   pick(row, 'cr463_requestedby'),
    approver:      pick(row, 'cr463_approvername'),
    reason:        pick(row, 'cr463_reasonforrequest'),
    routing:       pick(row, 'cr463_routingcode'),
    windowStart:   pick(row, 'cr463_windowstarttime'),
    windowEnd:     pick(row, 'cr463_windowendtime'),
    decidedAt:     pick(row, 'cr463_decisiontimestamp'),
    decisionComment: pick(row, 'cr463_decisioncomments'),
    auditCorrelation: pick(row, 'cr463_auditcorrelationid')
  };
}

function mapScheduleEvent(row) {
  return {
    id:           row[Object.keys(row).find(k => k.endsWith('eventid'))],
    title:        pick(row, 'cr463_scheduleeventtitle', 'cr463_title'),
    eventId:      pick(row, 'cr463_eventid'),
    sourceSystem: pick(row, 'cr463_sourcesystem'),
    sourceEventId:pick(row, 'cr463_sourceeventid'),
    aircraftTail: pick(row, 'cr463_aircrafttail'),
    eventType:    pick(row, 'cr463_eventtype'),
    windowStart:  pick(row, 'cr463_windowstart', 'cr463_windowstarttime'),
    windowEnd:    pick(row, 'cr463_windowend', 'cr463_windowendtime')
  };
}

function mapFleetPosition(row) {
  return {
    id:       row[Object.keys(row).find(k => k.endsWith('positionid'))],
    tail:     pick(row, 'cr463_tail', 'cr463_title'),
    lat:      pick(row, 'cr463_latitude', 'cr463_lat'),
    lon:      pick(row, 'cr463_longitude', 'cr463_lon'),
    altitude: pick(row, 'cr463_altitude'),
    bearing:  pick(row, 'cr463_bearing'),
    speed:    pick(row, 'cr463_speed'),
    inFlight: row.cr463_inflight,
    lastSeen: pick(row, 'cr463_lastpolledat', 'cr463_lastseen'),
    inFlightLabel: pick(row, 'cr463_inflight@OData.Community.Display.V1.FormattedValue')
  };
}

function mapConflict(row) {
  return {
    id:          row[Object.keys(row).find(k => k.endsWith('conflictid'))],
    title:       pick(row, 'cr463_conflicttitle', 'cr463_title'),
    conflictId:  pick(row, 'cr463_conflictid'),
    type:        pick(row, 'cr463_type'),
    severity:    pick(row, 'cr463_severity'),
    detail:      pick(row, 'cr463_detail'),
    suggestion:  pick(row, 'cr463_suggestion'),
    sourceEventId:    pick(row, 'cr463_sourceeventid'),
    actionableSource: pick(row, 'cr463_actionablesource'),
    actionableEventId: pick(row, 'cr463_actionableeventid'),
    acknowledgedAt: pick(row, 'cr463_acknowledgedat')
  };
}

export function useFleetData() {
  const { query } = useDataverse();
  const [state, setState] = useState({
    aircraft: [],
    personnel: [],
    mxRequests: [],
    scheduleEvents: [],
    fleetPositions: [],
    conflicts: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    async function load() {
      try {
        const results = await Promise.allSettled([
          query(TABLES.aircraft),
          query(TABLES.personnel),
          query(TABLES.mxRequest),
          query(TABLES.scheduleEvent),
          query(TABLES.fleetPosition),
          query(TABLES.conflict)
        ]);
        const [aircraft, personnel, mxRequests, scheduleEvents, fleetPositions, conflicts] = results;

        setState({
          aircraft:       aircraft.status === 'fulfilled' ? aircraft.value.map(mapAircraft) : [],
          personnel:      personnel.status === 'fulfilled' ? personnel.value.map(mapPersonnel) : [],
          mxRequests:     mxRequests.status === 'fulfilled' ? mxRequests.value.map(mapMxRequest) : [],
          scheduleEvents: scheduleEvents.status === 'fulfilled' ? scheduleEvents.value.map(mapScheduleEvent) : [],
          fleetPositions: fleetPositions.status === 'fulfilled' ? fleetPositions.value.map(mapFleetPosition) : [],
          conflicts:      conflicts.status === 'fulfilled' ? conflicts.value.map(mapConflict) : [],
          loading:        false,
          error:          null
        });
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e.message }));
      }
    }
    load();
  }, []);

  return state;
}
