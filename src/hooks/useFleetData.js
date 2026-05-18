import { useState, useEffect } from 'react';
import { useDataverse } from './useDataverse';
import { TABLES } from '../auth/tables';
import { PREFIX } from '../auth/schema';

// Field-name helper — PREFIX is the only thing that changes between tenants.
const f = n => `${PREFIX}${n}`;
const fv = n => `${f(n)}@OData.Community.Display.V1.FormattedValue`;

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
  const formattedStatus = row[fv('operationalstatus')];
  const rawStatus = row[f('operationalstatus')];
  const status =
    (formattedStatus && formattedStatus.toUpperCase().replace(/\s+/g, '_')) ??
    STATUS_MAP[rawStatus] ??
    'IN_SERVICE';

  return {
    tail:   pick(row, f('tailnumber'), f('title')),
    type:   pick(row, f('helicoptertype')),
    base:   pick(row, f('baselocation')),
    region: pick(row, f('operatingregion')),
    status,
    make:   pick(row, f('manufacturer')),
    model:  pick(row, f('modelnumber')),
    serial: pick(row, f('serialnumber')),
    rmm:    pick(row, f('responsiblemaintenancemanager'))
  };
}

function mapPersonnel(row) {
  return {
    id:            row[f('personnelmaintenanceid')],
    name:          pick(row, f('employeetitle')),
    firstName:     pick(row, f('firstname')),
    lastName:      pick(row, f('lastname')),
    email:         pick(row, f('emailaddress')),
    phone:         pick(row, f('phonenumber')),
    role:          pick(row, f('role')),
    primaryBase:   pick(row, f('primarybaselocation')),
    region:        pick(row, f('regioncode')),
    leader:        pick(row, f('leadername')),
    coverageBases: pick(row, f('coveragebases')),
    isActive:      row[f('isactive')]
  };
}

function mapMxRequest(row) {
  return {
    id:               row[f('maintenancerequestid')],
    requestNumber:    pick(row, f('requestnumber'), f('requesttitle')),
    title:            pick(row, f('requesttitle'), f('requestnumber')),
    aircraftTail:     pick(row, f('aircrafttailnumber')),
    aircraftType:     pick(row, f('aircraftmodel')),
    type:             pick(row, f('typeofrequest')),
    requestType:      pick(row, f('typeofrequest')),
    base:             pick(row, f('baselocation')),
    status:           pick(row, fv('requeststatus')),
    priority:         pick(row, fv('prioritylevel')),
    requestedBy:      pick(row, f('requestedby')),
    approver:         pick(row, f('approvername')),
    reason:           pick(row, f('reasonforrequest')),
    routing:          pick(row, f('routingcode')),
    windowStart:      pick(row, f('windowstarttime')),
    windowEnd:        pick(row, f('windowendtime')),
    decidedAt:        pick(row, f('decisiontimestamp')),
    decisionComment:  pick(row, f('decisioncomments')),
    auditCorrelation: pick(row, f('auditcorrelationid'))
  };
}

function mapScheduleEvent(row) {
  const eventTypeFormatted = row[fv('eventtype')];
  return {
    id:            row[Object.keys(row).find(k => k.endsWith('eventid'))],
    title:         pick(row, f('scheduleeventtitle'), f('title')),
    eventId:       pick(row, f('eventid')),
    sourceSystem:  pick(row, f('sourcesystem')),
    sourceEventId: pick(row, f('sourceeventid')),
    aircraftTail:  pick(row, f('aircrafttail')),
    eventType:     eventTypeFormatted ?? String(pick(row, f('eventtype')) ?? 'default'),
    windowStart:   pick(row, f('windowstart'), f('windowstarttime')),
    windowEnd:     pick(row, f('windowend'), f('windowendtime'))
  };
}

function mapFleetPosition(row) {
  return {
    id:            row[Object.keys(row).find(k => k.endsWith('positionid'))],
    tail:          pick(row, f('tail'), f('title')),
    lat:           pick(row, f('latitude'), f('lat')),
    lon:           pick(row, f('longitude'), f('lon')),
    altitude:      pick(row, f('altitude')),
    bearing:       pick(row, f('bearing')),
    speed:         pick(row, f('speed')),
    inFlight:      row[f('inflight')],
    lastSeen:      pick(row, f('lastpolledat'), f('lastseen')),
    inFlightLabel: pick(row, fv('inflight'))
  };
}

function mapScheduleEntry(row) {
  return {
    id:            row[f('scheduleentryid')],
    source:        pick(row, f('sourcesystem')),
    sourceRowId:   pick(row, f('sourcerowid')),
    personnelType: pick(row, fv('personneltype')) ?? pick(row, f('personneltype')),
    roleType:      pick(row, f('roletype')),
    ownerName:     pick(row, f('ownername')),
    base:          pick(row, f('base')),
    region:        pick(row, f('region')),
    shiftDate:     pick(row, f('shiftdate')),
    hours:         pick(row, f('hours')),
    timezone:      pick(row, f('timezone')),
    notes:         pick(row, f('notes')),
  };
}

function mapConflict(row) {
  return {
    id:                row[Object.keys(row).find(k => k.endsWith('conflictid'))],
    title:             pick(row, f('conflicttitle'), f('title')),
    conflictId:        pick(row, f('conflictid')),
    type:              pick(row, f('type')),
    severity:          pick(row, f('severity')),
    detail:            pick(row, f('detail')),
    suggestion:        pick(row, f('suggestion')),
    sourceEventId:     pick(row, f('sourceeventid')),
    actionableSource:  pick(row, f('actionablesource')),
    actionableEventId: pick(row, f('actionableeventid')),
    acknowledgedAt:    pick(row, f('acknowledgedat'))
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
    scheduleEntries: [],
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
          query(TABLES.conflict),
          query(TABLES.scheduleEntry),
        ]);
        const [aircraft, personnel, mxRequests, scheduleEvents, fleetPositions, conflicts, scheduleEntries] = results;

        setState({
          aircraft:        aircraft.status === 'fulfilled' ? aircraft.value.map(mapAircraft) : [],
          personnel:       personnel.status === 'fulfilled' ? personnel.value.map(mapPersonnel) : [],
          mxRequests:      mxRequests.status === 'fulfilled' ? mxRequests.value.map(mapMxRequest) : [],
          scheduleEvents:  scheduleEvents.status === 'fulfilled' ? scheduleEvents.value.map(mapScheduleEvent) : [],
          fleetPositions:  fleetPositions.status === 'fulfilled' ? fleetPositions.value.map(mapFleetPosition) : [],
          conflicts:       conflicts.status === 'fulfilled' ? conflicts.value.map(mapConflict) : [],
          scheduleEntries: scheduleEntries.status === 'fulfilled' ? scheduleEntries.value.map(mapScheduleEntry) : [],
          loading:         false,
          error:           null
        });
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e.message }));
      }
    }
    load();
  }, []);

  return state;
}
