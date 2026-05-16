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
  const firstName = pick(row, 'cr463_firstname');
  const lastName  = pick(row, 'cr463_lastname');
  return {
    id:        row[`${TABLES.personnel.slice(0, -1)}id`] || row.id,
    name:      pick(row, 'cr463_personnelmaintenancetitle', 'cr463_title') ?? `${firstName ?? ''} ${lastName ?? ''}`.trim(),
    firstName,
    lastName,
    email:     pick(row, 'cr463_email'),
    phone:     pick(row, 'cr463_phone'),
    role:      pick(row, 'cr463_role'),
    primaryBase: pick(row, 'cr463_primarybase'),
    region:    pick(row, 'cr463_region')
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

export function useFleetData() {
  const { query } = useDataverse();
  const [state, setState] = useState({
    aircraft: [],
    personnel: [],
    mxRequests: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    async function load() {
      try {
        const [aircraft, personnel, mxRequests] = await Promise.all([
          query(TABLES.aircraft),
          query(TABLES.personnel),
          query(TABLES.mxRequest)
        ]);

        setState({
          aircraft:   aircraft.map(mapAircraft),
          personnel:  personnel.map(mapPersonnel),
          mxRequests: mxRequests.map(mapMxRequest),
          loading:    false,
          error:      null
        });
      } catch (e) {
        setState((s) => ({ ...s, loading: false, error: e.message }));
      }
    }
    load();
  }, []);

  return state;
}
