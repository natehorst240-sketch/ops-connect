import React, { useState } from 'react';
import M365Shell from './M365Shell';
import PowerAppsHome from './screens/PowerAppsHome';
import PowerBIDashboard from './screens/PowerBIDashboard';
import PCFScheduler from './screens/PCFScheduler';
import PCFMap from './screens/PCFMap';
import TeamsApproval from './screens/TeamsApproval';
import CapabilityComparison from './screens/CapabilityComparison';
import CostComparison from './screens/CostComparison';

// ============================================================================
// M365 BUILD — orchestrator
// ----------------------------------------------------------------------------
// Renders the M365 Power Platform shell with internal navigation between the
// 7 screens that make up the M365 version of MX Connect. This is the "if we
// built this in Microsoft" demo, which sits alongside the custom React build.
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
      {activeScreen === 'compare' && <CapabilityComparison />}
      {activeScreen === 'cost' && <CostComparison />}
    </M365Shell>
  );
}
