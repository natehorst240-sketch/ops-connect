import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import { FLUENT, FLUENT_FONT } from '../tokens';

// ============================================================================
// COST COMPARISON
// Three scenarios so leadership sees the range, not a point estimate.
// All figures are list price unless noted.
// ============================================================================

const SCENARIOS = [
  {
    id: 'e5',
    label: 'IHC on E5',
    sublabel: 'Best case · Power BI Pro included',
    y1: { m365: 260, custom: 485 },
    y2: { m365: 60, custom: 65 },
    crossover: 'Custom never catches up; M365 stays cheaper indefinitely',
    note: 'If IHC is already on M365 E5, much of the Power Platform stack is paid for. Common for hospital systems standardizing on E5 for security/compliance features. VERIFY WITH IT BEFORE PITCH.',
    tone: 'good',
  },
  {
    id: 'e3-mid',
    label: 'IHC on E3 · negotiated',
    sublabel: 'Realistic mid-case',
    y1: { m365: 340, custom: 525 },
    y2: { m365: 130, custom: 70 },
    crossover: 'Custom wins on TCO around Year 4',
    note: 'E3 + Premium Capacity for Power BI + Per-App Power Apps Premium negotiated favorably. Most likely scenario if IHC is not on E5.',
    tone: 'info',
  },
  {
    id: 'e3-list',
    label: 'IHC on E3 · list price',
    sublabel: 'Worst case · no negotiation',
    y1: { m365: 415, custom: 565 },
    y2: { m365: 200, custom: 78 },
    crossover: 'Custom wins on TCO by Year 3',
    note: 'Full list price for Premium Capacity + Per-App Premium with no enterprise negotiation. Unlikely for an org IHC\'s size, but a defensible upper bound.',
    tone: 'warn',
  },
];

const Y1_BREAKDOWN = {
  m365: [
    { label: 'Build / configuration', range: '$200k – $280k', note: 'Smaller team; mostly Power Apps + Power BI configuration + 2 PCF controls' },
    { label: 'Power BI licensing', range: '$0 – $75k', note: '$0 if E5; ~$75k for Premium Capacity if E3' },
    { label: 'Power Apps Premium', range: '$0 – $60k', note: '$0 if E5 includes; ~$60k Per-App at list, often less negotiated' },
    { label: 'Microsoft infrastructure', range: '$0', note: 'Included in M365 tenant' },
    { label: 'Year 1 total', range: '$260k – $415k', note: 'Range reflects E5 vs E3 + list price', total: true },
  ],
  custom: [
    { label: 'Build / development', range: '$480k – $560k', note: '2–3 person team across 28–38 weeks; full custom React + Supabase' },
    { label: 'Licensing', range: '$0', note: 'No per-user platform tax' },
    { label: 'Infrastructure (Supabase + Vercel)', range: '$2k – $3k', note: 'Postgres + auth + edge functions + hosting' },
    { label: 'Microsoft Graph integration', range: '$2k', note: 'One-way sync to Outlook / Teams' },
    { label: 'Year 1 total', range: '$485k – $565k', note: 'Higher upfront; flat from here on', total: true },
  ],
};

const Y2_BREAKDOWN = {
  m365: [
    { label: 'Maintenance dev (0.3–0.5 FTE)', range: '$60k – $90k', note: 'Smaller; can often be absorbed by IHC IT' },
    { label: 'Power BI licensing (recurring)', range: '$0 – $75k/yr', note: 'Same E5 vs E3 question carries forward' },
    { label: 'Power Apps Premium (recurring)', range: '$0 – $60k/yr', note: 'Recurring forever — this is the licensing tax' },
    { label: 'Microsoft infrastructure', range: '$0', note: 'Included' },
    { label: 'Year 2+ total', range: '$60k – $225k/yr', note: 'Recurring; scales with user count', total: true },
  ],
  custom: [
    { label: 'Maintenance dev (1.0 FTE)', range: '$60k – $75k', note: 'One person handles features + ops' },
    { label: 'Licensing', range: '$0', note: 'Still no platform tax' },
    { label: 'Infrastructure', range: '$3k – $4k', note: 'Supabase + Vercel scale tier' },
    { label: 'Year 2+ total', range: '$63k – $79k/yr', note: 'Flat regardless of user count', total: true },
  ],
};

const VERIFICATION_QUESTIONS = [
  {
    q: 'What M365 SKU does IHC currently have for the users in scope?',
    why: 'E5 includes Power BI Pro; E3 does not. This is the single most important variable in the comparison. If E5, the Power BI cost objection evaporates entirely.',
    impact: '~$75k/yr Power BI licensing difference',
  },
  {
    q: 'What negotiated rate could IHC get for Power Apps Premium Per-App?',
    why: 'List is $5/user/mo. Hospital systems often negotiate 30-50% lower. The "$60k/yr" figure could be $30-40k/yr in practice.',
    impact: '~$20-30k/yr Power Apps licensing difference',
  },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CostComparison() {
  const [scenarioId, setScenarioId] = useState('e3-mid');
  const scenario = SCENARIOS.find(s => s.id === scenarioId);

  return (
    <div style={{ padding: 24, fontFamily: FLUENT_FONT, color: FLUENT.text }}>
      <Header />

      <SectionTitle>1. Pick a licensing scenario</SectionTitle>
      <ScenarioPicker
        scenarios={SCENARIOS}
        selectedId={scenarioId}
        onSelect={setScenarioId}
      />

      <ScenarioCallout scenario={scenario} />

      <SectionTitle>2. Year 1 breakdown</SectionTitle>
      <BreakdownTable breakdown={Y1_BREAKDOWN} highlight={scenario.y1} />

      <SectionTitle>3. Year 2+ ongoing</SectionTitle>
      <BreakdownTable breakdown={Y2_BREAKDOWN} highlight={scenario.y2} />

      <SectionTitle>4. 5-year crossover</SectionTitle>
      <CrossoverAnalysis scenario={scenario} />

      <SectionTitle>5. Verify before pitch</SectionTitle>
      <VerificationPanel questions={VERIFICATION_QUESTIONS} />

      <Footnote />
    </div>
  );
}

function Header() {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: FLUENT.brand,
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
      }}>
        Decision Material
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, marginBottom: 8 }}>
        Cost analysis · M365 build vs custom build
      </h1>
      <p style={{ fontSize: 13, color: FLUENT.textSub, margin: 0, maxWidth: 720, lineHeight: 1.55 }}>
        Both options are real. The right answer depends on IHC's existing M365 contract terms.
        This page shows the range, not a single number, so leadership can decide based on facts
        rather than vendor pitches.
      </p>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: 16, fontWeight: 600, margin: 0,
      marginTop: 32, marginBottom: 12,
      color: FLUENT.text,
    }}>
      {children}
    </h2>
  );
}

// ============================================================================
// SCENARIO PICKER
// ============================================================================

function ScenarioPicker({ scenarios, selectedId, onSelect }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {scenarios.map(s => {
        const selected = s.id === selectedId;
        const accentColor = s.tone === 'good' ? FLUENT.good
          : s.tone === 'warn' ? FLUENT.warnAccent
          : FLUENT.brand;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            style={{
              textAlign: 'left',
              padding: 14,
              background: selected ? FLUENT.brandSoft : FLUENT.surface,
              border: `2px solid ${selected ? accentColor : FLUENT.border}`,
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: FLUENT_FONT,
              transition: 'all 0.12s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: FLUENT.text, marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 11, color: FLUENT.textSub, marginBottom: 10 }}>
              {s.sublabel}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Stat label="Y1" m365={s.y1.m365} custom={s.y1.custom} accent={accentColor} />
              <Stat label="Y2+/yr" m365={s.y2.m365} custom={s.y2.custom} accent={accentColor} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Stat({ label, m365, custom, accent }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: FLUENT.textDim, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: FLUENT.text }}>
        <span style={{ fontWeight: 600, color: accent }}>${m365}k</span>
        <span style={{ color: FLUENT.textDim, margin: '0 4px' }}>vs</span>
        <span style={{ fontWeight: 600 }}>${custom}k</span>
      </div>
    </div>
  );
}

// ============================================================================
// SCENARIO CALLOUT
// ============================================================================

function ScenarioCallout({ scenario }) {
  const accentColor = scenario.tone === 'good' ? FLUENT.good
    : scenario.tone === 'warn' ? FLUENT.warnAccent
    : FLUENT.brand;
  const bgColor = scenario.tone === 'good' ? FLUENT.goodSoft
    : scenario.tone === 'warn' ? FLUENT.warnSoft
    : FLUENT.infoSoft;

  return (
    <div style={{
      marginTop: 12, padding: 14,
      background: bgColor,
      borderLeft: `3px solid ${accentColor}`,
      borderRadius: 2,
      display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <Info size={16} style={{ color: accentColor, marginTop: 1, flexShrink: 0 }} />
      <div style={{ fontSize: 12, color: FLUENT.text, lineHeight: 1.55 }}>
        {scenario.note}
      </div>
    </div>
  );
}

// ============================================================================
// BREAKDOWN TABLE
// ============================================================================

function BreakdownTable({ breakdown, highlight }) {
  return (
    <div style={{
      background: FLUENT.surface,
      border: `1px solid ${FLUENT.border}`,
      borderRadius: 4,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        background: FLUENT.bgAlt,
        borderBottom: `1px solid ${FLUENT.border}`,
      }}>
        <ColumnHeader label="M365 build" sublabel="Power Apps + Power BI + 2 PCF controls" total={highlight.m365} accent={FLUENT.brand} />
        <ColumnHeader label="Custom build" sublabel="React + Supabase + Microsoft Graph sync" total={highlight.custom} accent={FLUENT.text} divider />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        <BreakdownColumn rows={breakdown.m365} />
        <BreakdownColumn rows={breakdown.custom} divider />
      </div>
    </div>
  );
}

function ColumnHeader({ label, sublabel, total, accent, divider }) {
  return (
    <div style={{
      padding: '12px 16px',
      borderLeft: divider ? `1px solid ${FLUENT.border}` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: FLUENT.text }}>{label}</div>
          <div style={{ fontSize: 10, color: FLUENT.textSub, marginTop: 2 }}>{sublabel}</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 600, color: accent }}>
          ${total}k
        </div>
      </div>
    </div>
  );
}

function BreakdownColumn({ rows, divider }) {
  return (
    <div style={{
      borderLeft: divider ? `1px solid ${FLUENT.border}` : 'none',
    }}>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            padding: '10px 16px',
            borderTop: i > 0 ? `1px solid ${FLUENT.border}` : 'none',
            background: r.total ? FLUENT.bgAlt : 'transparent',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{
              fontSize: 12, fontWeight: r.total ? 600 : 400,
              color: FLUENT.text,
            }}>
              {r.label}
            </div>
            <div style={{
              fontSize: 12, fontWeight: 600,
              fontFamily: 'Consolas, Monaco, monospace',
              color: r.total ? FLUENT.brand : FLUENT.text,
            }}>
              {r.range}
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: FLUENT.textSub, marginTop: 3, lineHeight: 1.5 }}>
            {r.note}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// CROSSOVER ANALYSIS
// ============================================================================

function CrossoverAnalysis({ scenario }) {
  const m365Y1 = scenario.y1.m365;
  const m365Yn = scenario.y2.m365;
  const customY1 = scenario.y1.custom;
  const customYn = scenario.y2.custom;

  const years = [1, 2, 3, 4, 5];
  const cumulative = years.map(y => {
    const m365 = m365Y1 + m365Yn * (y - 1);
    const custom = customY1 + customYn * (y - 1);
    return { year: y, m365, custom };
  });

  return (
    <div style={{
      background: FLUENT.surface,
      border: `1px solid ${FLUENT.border}`,
      borderRadius: 4,
      padding: 16,
    }}>
      <div style={{
        fontSize: 11, color: FLUENT.textSub, marginBottom: 14,
      }}>
        Cumulative cost (midpoints, $k)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 16 }}>
        {cumulative.map(c => {
          const customWins = c.custom < c.m365;
          return (
            <div key={c.year} style={{
              padding: 10,
              background: FLUENT.bgAlt,
              borderRadius: 3,
              borderLeft: `3px solid ${customWins ? FLUENT.good : FLUENT.brand}`,
            }}>
              <div style={{ fontSize: 10, color: FLUENT.textSub, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Year {c.year}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11 }}>
                <span style={{ color: FLUENT.textSub }}>M365</span>
                <span style={{ fontWeight: 600, fontFamily: 'Consolas, Monaco, monospace' }}>${c.m365}k</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: 11 }}>
                <span style={{ color: FLUENT.textSub }}>Custom</span>
                <span style={{ fontWeight: 600, fontFamily: 'Consolas, Monaco, monospace' }}>${c.custom}k</span>
              </div>
              <div style={{
                marginTop: 6, paddingTop: 6,
                borderTop: `1px solid ${FLUENT.border}`,
                fontSize: 10,
                color: customWins ? FLUENT.good : FLUENT.brand,
                fontWeight: 600,
              }}>
                {customWins ? 'Custom ahead' : 'M365 ahead'}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        padding: 12,
        background: FLUENT.brandSoft,
        borderLeft: `3px solid ${FLUENT.brand}`,
        borderRadius: 2,
        fontSize: 12,
        color: FLUENT.text,
        lineHeight: 1.55,
      }}>
        <strong>Crossover:</strong> {scenario.crossover}.
      </div>
    </div>
  );
}

// ============================================================================
// VERIFICATION PANEL
// ============================================================================

function VerificationPanel({ questions }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {questions.map((q, i) => (
        <div key={i} style={{
          background: FLUENT.surface,
          border: `1px solid ${FLUENT.border}`,
          borderLeft: `3px solid ${FLUENT.warnAccent}`,
          borderRadius: 4,
          padding: 14,
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <HelpCircle size={16} style={{ color: FLUENT.warnAccent, marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: FLUENT.text, marginBottom: 4 }}>
                {q.q}
              </div>
              <div style={{ fontSize: 11.5, color: FLUENT.textSub, lineHeight: 1.55, marginBottom: 6 }}>
                {q.why}
              </div>
              <div style={{
                display: 'inline-block',
                padding: '3px 8px',
                background: FLUENT.warnSoft,
                color: FLUENT.warnAccent,
                fontSize: 10.5,
                fontWeight: 600,
                borderRadius: 2,
              }}>
                Impact: {q.impact}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Footnote() {
  return (
    <div style={{
      marginTop: 32, padding: 14,
      background: FLUENT.bgAlt,
      borderRadius: 4,
      fontSize: 11, color: FLUENT.textSub, lineHeight: 1.6,
    }}>
      <strong style={{ color: FLUENT.text }}>Notes on the headline figure.</strong>{' '}
      Numbers reflect 1000 licensed users — the upper bound of IHC's licensing exposure
      across the combined org post-acquisitions. Realistic active app users (mechanics,
      schedulers, ops staff who actually open the app daily) is closer to 350-400, which
      reduces Power Apps Premium licensing cost by roughly 60% under the Per-App plan.
      Worth modeling with the Microsoft licensing rep before the final pitch.
      <br /><br />
      <strong style={{ color: FLUENT.text }}>Numbers are list price unless noted.</strong>{' '}
      Hospital systems IHC's size routinely negotiate 30-50% off list for enterprise
      Microsoft contracts. Treat these as defensible upper bounds.
    </div>
  );
}
