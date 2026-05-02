import React, { useState } from 'react';
import M365Shell from './M365Shell';
import PowerAppsHome from './screens/PowerAppsHome';
import PowerBIDashboard from './screens/PowerBIDashboard';
import PCFScheduler from './screens/PCFScheduler';
import PCFMap from './screens/PCFMap';
import TeamsApproval from './screens/TeamsApproval';

// ============================================================================
// M365 BUILD — orchestrator
// ----------------------------------------------------------------------------
// Renders the M365 Power Platform shell with internal navigation between the
// 5 screens that make up the M365 build of MX Connect.
// ============================================================================

export default function M365Build({ persona, setPersonaId }) {
  const [activeScreen, setActiveScreen] = useState('apps');

  return (
    <M365Shell
      activeScreen={activeScreen}
      setActiveScreen={setActiveScreen}
      persona={persona}
    >
      {activeScreen === 'apps' && (
        <PowerAppsHome persona={persona} setPersonaId={setPersonaId} />
      )}
      {activeScreen === 'powerbi' && <PowerBIDashboard />}
      {activeScreen === 'scheduler' && <PCFScheduler />}
      {activeScreen === 'map' && <PCFMap />}
      {activeScreen === 'teams' && <TeamsApproval />}
    </M365Shell>
  );
}
