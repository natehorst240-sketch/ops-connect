import { useMemo, useCallback } from 'react';
import { useFleet } from '../contexts/FleetDataContext';
import { PHONE_FALLBACK } from '../data/mxOncallSchedule';

/**
 * Returns a phoneFor(name) lookup function.
 *
 * Resolution order:
 *  1. Live Dataverse personnel record (cr463_phonenumber) — exact name match
 *  2. Live Dataverse — all-parts match (handles middle-name / hyphen variants)
 *  3. PHONE_FALLBACK hardcoded map — exact lowercase match
 *  4. null
 *
 * Must be called inside FleetDataProvider.
 */
export function usePhoneFor() {
  const { personnel } = useFleet();

  // Build a lowercase-name → phone map from live Dataverse data on each
  // personnel update, so lookups are O(1) during render.
  const liveMap = useMemo(() => {
    const map = {};
    for (const p of personnel) {
      if (p.name && p.phone) {
        map[p.name.toLowerCase().trim()] = p.phone;
      }
    }
    return map;
  }, [personnel]);

  // Stable reference — only changes when liveMap changes (i.e. when
  // personnel loads from Dataverse), so memos that depend on phoneFor
  // recompute once after the initial data fetch and never again.
  return useCallback(function phoneFor(name) {
    if (!name) return null;
    const lower = name.toLowerCase().trim();

    if (liveMap[lower]) return liveMap[lower];

    const parts = lower.split(/[\s-]+/).filter(Boolean);
    if (parts.length >= 2) {
      for (const [key, phone] of Object.entries(liveMap)) {
        if (parts.every(p => key.includes(p))) return phone;
      }
    }

    return PHONE_FALLBACK[lower] ?? null;
  }, [liveMap]);
}
