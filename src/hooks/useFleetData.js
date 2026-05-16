import { useState, useEffect } from 'react';
import { useDataverse } from './useDataverse';
import { TABLES } from '../auth/tables';

function pick(row, ...candidates) {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null && row[c] !== '') return row[c];
  }
  return undefined;
}

function mapAircraft(row) {
  return {
    tail:   pick(row, 'cr463_tail', 'cr463_aircrafttitle', 'title'),
    type:   pick(row, 'cr463_type', 'cr463_aircrafttype'),
    base:   pick(row, 'cr463_base'),
    region: pick(row, 'cr463_region'),
    status: pick(row, 'cr463_status') ?? 'IN_SERVICE',
    intl:   pick(row, 'cr463_intl', 'cr463_international')
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
    requestNumber: pick(row, 'cr463_requestnumber'),
    title:         pick(row, 'cr463_maintenancerequesttitle', 'cr463_title'),
    aircraftTail:  pick(row, 'cr463_aircrafttail'),
    aircraftType:  pick(row, 'cr463_aircrafttype'),
    requestType:   pick(row, 'cr463_requesttype'),
    base:          pick(row, 'cr463_base'),
    status:        pick(row, 'cr463_status'),
    priority:      pick(row, 'cr463_priority'),
    requestedBy:   pick(row, 'cr463_requestedby'),
    reason:        pick(row, 'cr463_reason'),
    windowStart:   pick(row, 'cr463_windowstart'),
    windowEnd:     pick(row, 'cr463_windowend')
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
