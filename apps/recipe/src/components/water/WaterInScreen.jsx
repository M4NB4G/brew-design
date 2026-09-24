// WaterInScreen.jsx
// "Water In": the source water's test results, Brew Water Chem's WaterInTab
// in its wording. Inputs match the Persyn Chemical Engineering test report row
// order: Ca, Mg, Na, SO4, Cl, Total Alkalinity (as CaCO3), pH. A result box
// emptied is a blank result (NaN), shown empty, never 0 (W5); the status
// figures that need it show "—". The figures come from computeWater.
import Card from '../shared/Card.jsx';
import StatBox from '../shared/StatBox.jsx';
import InputRow from '../shared/InputRow.jsx';
import { colors, radii, tokens } from '../shared/styles.js';
import { num } from '../../format.js';
import { EXAMPLE_SOURCE, RO_SOURCE, setTestResult, fillTestResults } from '../../water-state.js';

const REPORT_ROWS = [
  ['Ca', 'Calcium Ion', 'ppm'],
  ['Mg', 'Magnesium Ion', 'ppm'],
  ['Na', 'Sodium Ion', 'ppm'],
  ['SO4', 'Sulfate Ion (SO₄²⁻)', 'ppm'],
  ['Cl', 'Chloride Ion', 'ppm'],
  ['Alkalinity', 'Total Alkalinity', 'ppm as CaCO₃'],
  ['pH', 'pH', 'SU'],
];

// The row labels, for the line naming blank results (WaterTab.jsx).
export const REPORT_LABELS = Object.fromEntries(REPORT_ROWS.map(([key, label]) => [key, label]));

// A ratio: "—" blank, "∞" with no chloride.
const ratioText = (r) => (Number.isNaN(r) ? '—' : Number.isFinite(r) ? num(r, 2) : '∞');

export default function WaterInScreen({ source, figures, setWater }) {
  const status = figures.source;

  return (
    <>
      <div
        style={{
          background: colors.noticeBg,
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: '10px',
          padding: '0.75rem 0.9rem',
          fontSize: '0.82rem',
          color: colors.textNotice,
          lineHeight: 1.5,
          marginBottom: '1rem',
        }}
      >
        <strong>Enter values directly from your water test report.</strong>{' '}
        Inputs match the bottom rows of the Persyn Chemical Engineering test
        results table (ion concentrations, not Hardness as CaCO₃). Total
        Alkalinity is the only value reported as CaCO₃.
      </div>

      <Card>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.4rem',
            gap: '0.5rem',
          }}
        >
          <span style={{ ...tokens.cardLabel, marginBottom: 0 }}>Source Water Test Results</span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setWater((w) => fillTestResults(w, EXAMPLE_SOURCE))}
              style={demoButtonStyle}
              title="Load Bristlecone Brewing 10/22/2025 example values"
            >
              Load Example
            </button>
            <button
              type="button"
              onClick={() => setWater((w) => fillTestResults(w, RO_SOURCE))}
              style={demoButtonStyle}
              title="Load realistic reverse-osmosis water profile"
            >
              RO Water
            </button>
          </div>
        </div>
        <div>
          {REPORT_ROWS.map(([key, label, unit]) => (
            <InputRow
              key={key}
              label={label}
              unit={unit}
              value={Number.isFinite(source[key]) ? source[key] : ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setWater((w) => setTestResult(w, key, value));
              }}
              step={0.1}
            />
          ))}
        </div>
        <p style={tokens.notice}>
          Hardness values from the test report (Total Hardness, Calcium Hardness,
          Magnesium Hardness) are not required — the calculator uses ion
          concentrations directly.
        </p>
      </Card>

      {status.hasValues && (
        <Card>
          <div style={tokens.cardLabel}>Current Status</div>
          <div style={tokens.cardTitle}>Source Water</div>
          <div style={tokens.accentBar} />
          <div style={{ ...tokens.statGrid, marginTop: '0.75rem' }}>
            <StatBox value={num(status.residualAlkalinity, 0)} label="Residual Alk (CaCO₃)" />
            <StatBox value={ratioText(status.ratio)} label="SO₄ : Cl ratio" />
            <StatBox value={num(status.alkalinity, 0)} label="Alkalinity" />
            <StatBox value={num(status.pH, 1)} label="pH" />
          </div>
          <p style={tokens.notice}>
            Character: {status.character ?? '—'}. RA per Kolbach (1953):
            TotalAlk − (Ca/1.4 + Mg/1.7).
          </p>
        </Card>
      )}
    </>
  );
}

const demoButtonStyle = {
  background: 'transparent',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  padding: '0.5rem 0.85rem',
  borderRadius: radii.btn,
  fontSize: '0.78rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  cursor: 'pointer',
  fontFamily: 'inherit',
};
