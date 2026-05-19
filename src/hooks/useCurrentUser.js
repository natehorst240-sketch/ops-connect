import { useMsal } from '@azure/msal-react';
import { useFleet } from '../contexts/FleetDataContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { useDemoMode } from '../contexts/DemoModeContext';
import { PERSONAS } from '../data';
import { personnelBases } from '../shared/baseMatch';

// Resolves the signed-in MSAL user to a Personnel row (or a static PERSONA
// in demo mode). The "view as" override applies in both modes so reviewers
// can walk through every role without switching accounts.
export function useCurrentUser() {
  const { accounts } = useMsal();
  const { personnel, loading } = useFleet();
  const { viewAsId } = useViewAs();
  const { demoMode } = useDemoMode();
  const account = accounts[0];

  // ── Demo mode: no MSAL account required ───────────────────────────────────
  if (demoMode) {
    // viewAsId can be a live personnel id OR a static PERSONA id ('director', 'rmm', …)
    const targetPersona = viewAsId
      ? PERSONAS.find(p => p.id === viewAsId) ?? null
      : null;
    const persona = targetPersona ?? PERSONAS.find(p => p.id === 'director') ?? PERSONAS[0];
    return {
      account: null,
      persona,
      matched: null,
      viewingAs: !!viewAsId,
      loading: false,
      demo: true
    };
  }

  // ── Live mode ─────────────────────────────────────────────────────────────
  if (!account || loading || personnel.length === 0) {
    return { account, persona: null, loading };
  }

  // View-as override: match against live personnel first, then static PERSONAS
  if (viewAsId) {
    const liveTarget = personnel.find(p => p.id === viewAsId);
    if (liveTarget) {
      return { account, matched: liveTarget, persona: personaFrom(liveTarget), viewingAs: true, loading: false };
    }
    const staticTarget = PERSONAS.find(p => p.id === viewAsId);
    if (staticTarget) {
      return { account, matched: null, persona: staticTarget, viewingAs: true, loading: false };
    }
  }

  const email = account.username?.toLowerCase();
  const matched = personnel.find(p => p.email?.toLowerCase() === email);

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

  return { account, matched, persona: personaFrom(matched), loading: false };
}

function personaFrom(p) {
  const bases = personnelBases(p);
  return {
    id:           p.id,
    name:         p.name,
    initials:     initials(p.name),
    role:         mapRole(p.role),
    roleTitle:    p.roleTitle ?? p.role,
    base:         p.primaryBase ?? p.base,
    bases,
    region:       p.region,
    email:        p.email,
    phone:        p.phone,
    onShift:      p.isActive ?? p.onShift ?? true,
    assignedTail: p.assignedTail ?? null,
  };
}

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

function mapRole(role) {
  if (!role) return null;
  const r = role.toUpperCase();
  if (r === 'DIRECTOR' || r === 'DOM') return 'DIRECTOR';
  if (r === 'RMM') return 'RMM';
  if (r === 'AMT' || r === 'AMT(ROVER)') return 'AMT';
  if (r === 'QA' || r === 'ADOM' || r === 'QA MANAGER') return 'QA';
  if (r === 'SCHEDULER' || r === 'MX_SCHEDULER') return 'MX_SCHEDULER';
  if (r === 'CREW_SCHEDULER') return 'CREW_SCHEDULER';
  if (r === 'FLIGHT_NURSE') return 'FLIGHT_NURSE';
  if (r === 'BOM') return 'BOM';
  if (r === 'PILOT' || r === 'CHIEF PILOT') return 'AMT';
  // Unknown role — caller must handle null and show an explicit error screen.
  // Silent fallback to AMT masks org changes and creates invisible access gaps.
  console.warn(`[useCurrentUser] Unrecognized Dataverse role: "${role}". Add it to mapRole() or to Dataverse.`);
  return null;
}
