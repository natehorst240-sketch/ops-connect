import { useMsal } from '@azure/msal-react';
import { useFleet } from '../contexts/FleetDataContext';

// Resolves the signed-in MSAL user against the Personnel Maintenance
// table by email. Returns the matched personnel row plus a derived
// persona shape compatible with the existing UI.
export function useCurrentUser() {
  const { accounts } = useMsal();
  const { personnel, loading } = useFleet();
  const account = accounts[0];

  if (!account || loading || personnel.length === 0) {
    return { account, persona: null, loading };
  }

  const email = account.username?.toLowerCase();
  const matched = personnel.find(
    (p) => p.email?.toLowerCase() === email
  );

  if (!matched) {
    // Fallback: build a minimal persona from the MSAL account
    return {
      account,
      persona: {
        id: 'self',
        name: account.name ?? email,
        initials: initials(account.name ?? email),
        role: 'AMT',
        roleTitle: 'Unmatched user',
        base: '—',
        region: 'ALL',
        onShift: true
      },
      matched: null,
      loading: false
    };
  }

  return {
    account,
    matched,
    persona: {
      id:        matched.id,
      name:      matched.name,
      initials:  initials(matched.name),
      role:      mapRole(matched.role),
      roleTitle: matched.role,
      base:      matched.primaryBase,
      region:    matched.region,
      email:     matched.email,
      phone:     matched.phone,
      onShift:   matched.isActive ?? true
    },
    loading: false
  };
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

// Map the role string from Dataverse to the role enum the home screens use.
function mapRole(role) {
  if (!role) return 'AMT';
  const r = role.toUpperCase();
  if (r === 'DIRECTOR' || r === 'DOM') return 'DIRECTOR';
  if (r === 'RMM') return 'RMM';
  if (r === 'AMT' || r === 'AMT(ROVER)') return 'AMT';
  if (r === 'QA' || r === 'ADOM' || r === 'QA MANAGER') return 'QA';
  if (r === 'SCHEDULER') return 'MX_SCHEDULER';
  if (r === 'PILOT' || r === 'CHIEF PILOT') return 'AMT'; // no pilot home yet
  return 'AMT';
}
