import React, { useState } from 'react';
import M365Shell from './M365Shell';
import PowerAppsHome from './screens/PowerAppsHome';
import PowerBIDashboard from './screens/PowerBIDashboard';
import PCFScheduler from './screens/PCFScheduler';
import PCFMap from './screens/PCFMap';
import FleetMap from './screens/FleetMap';
import TeamsApproval from './screens/TeamsApproval';
import MXRequestFlow from './screens/MXRequestFlow';

// ============================================================================
// M365 BUILD — orchestrator
// ----------------------------------------------------------------------------
// Renders the M365 Power Platform shell with internal navigation across the
// 7 screens that make up the M365 build of MX Connect.
//
// Default landing: MX Request — the Phase 1 deliverable hero.
// ============================================================================

export default function M365Build({ persona, setPersonaId }) {
  const [activeScreen, setActiveScreen] = useState('mxRequest');

  return (
    <M365Shell
      activeScreen={activeScreen}
      setActiveScreen={setActiveScreen}
      persona={persona}
    >
      {activeScreen === 'mxRequest' && <MXRequestFlow />}
      {activeScreen === 'apps' && (
        <PowerAppsHome persona={persona} setPersonaId={setPersonaId} />
      )}
      {activeScreen === 'teams' && <TeamsApproval />}
      {activeScreen === 'scheduler' && <PCFScheduler />}
      {activeScreen === 'fleetMap' && <FleetMap />}
      {activeScreen === 'liveFleet' && <PCFMap />}
      {activeScreen === 'powerbi' && <PowerBIDashboard />}
    </M365Shell>
  );
}
