// Normalize and compare base-location strings across data sources.
//
// Aircraft rows use base strings like "Logan IH-15", "McKay IH-13".
// Personnel rows use "Logan, UT", "McKay Dee, UT".
// Coverage bases come as semicolon-separated strings: "Logan, UT; McKay Dee, UT".
// We compare on the first whitespace-delimited token after stripping IH codes
// and trailing state suffixes — "page" never matches "pagosa", "logan" matches
// "logan", "mckay" matches "mckay" (covers "McKay Dee, UT" too).

export function baseStem(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\bih-?\d+(?:[/\-]\d+)*\b/g, ' ')
    .replace(/,\s*[a-z]{2}\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function baseToken(s) {
  return baseStem(s).split(' ')[0] ?? '';
}

export function basesMatch(a, b) {
  const ta = baseToken(a);
  const tb = baseToken(b);
  return !!ta && ta === tb;
}

// Parse "Logan, UT; McKay Dee, UT" → ["Logan, UT", "McKay Dee, UT"].
// Also accepts arrays (passes through) and falsy values (→ []).
export function parseCoverageBases(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return String(value)
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

// Combine primary base + coverage into a deduped list of base strings.
export function personnelBases({ primaryBase, base, coverageBases }) {
  const primary = primaryBase ?? base;
  const all = [primary, ...parseCoverageBases(coverageBases)].filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const b of all) {
    const key = baseStem(b);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(b);
  }
  return out;
}
