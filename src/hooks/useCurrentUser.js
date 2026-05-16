import { useMsal } from '@azure/msal-react';
import { useFleet } from '../contexts/FleetDataContext';
import { useViewAs } from '../contexts/ViewAsContext';

// Resolves the signed-in MSAL user against the Personnel Maintenance
// table by email, or — if a "view as" override is set — synthesizes
// a persona from that personnel row instead. Lets us inspect every
// role's view without re-signing-in.
export function useCurrentUser() {
  const { accounts } = useMsal();
  const { personnel, loading } = useFleet();
  const { viewAsId } = useViewAs();
  const account = accounts[0];

  if (!account || loading || personnel.length === 0) {
    return { account, persona: null, loading };
  }

  // View-as override wins
  if (viewAsId) {
    const target = personnel.find((p) => p.id === viewAsId);
    if (target) {
      return {
        account,
        matched: target,
        persona: personaFrom(target),
        viewingAs: true,
        loading: false
      };
    }
  }

  const email = account.username?.toLowerCase();
  const matched = personnel.find(
    (p) => p.email?.toLowerCase() === email
  );

  if (!matched) {
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
    persona: personaFrom(matched),
    loading: false
  };
}

function personaFrom(p) {
  return {
    id:        p.id,
    name:      p.name,
    initials:  initials(p.name),
    role:      mapRole(p.role),
    roleTitle: p.role,
    base:      p.primaryBase,
    region:    p.region,
    email:     p.email,
    phone:     p.phone,
    onShift:   p.isActive ?? true
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
  if (r === 'PILOT' || r === 'CHIEF PILOT') return 'AMT';
  return 'AMT';
}
