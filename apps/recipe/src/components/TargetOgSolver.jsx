// TargetOgSolver.jsx
// "Design to target OG" on the Grist card (docs/items/inverse-solver-ui.md):
// a target OG box in the screen's gravity unit and one % box per malt, filled
// from the malt's share of the grain weight (blank where its weight is blank),
// each editable; Solve hands them to the page, which sets every weight through
// the selector in one step, or changes nothing and the card says why (IS-S2,
// IS-S4). After a solve, until the next edit, the predicted OG shows beside
// the target with one line on why they differ slightly, and "Undo solve"
// (IS-S5, IS-S6). The target and the boxes are this card's alone: never saved.
// Computes nothing: the shares and the predicted OG come from the engine
// through computeRecipe, the boxes' total from the selector.
import { useState } from 'react';
import NumberField from './NumberField.jsx';
import InputRow from './shared/InputRow.jsx';
import { colors, tokens, radii } from './shared/styles.js';
import {
  resolveGravityUnit,
  gravityUnitLabel,
  gravityFromCanonical,
  gravityToCanonical,
  percentUnit,
  fractionToPercent,
  percentToFraction,
} from '../display.js';
import { num, roundForInput } from '../format.js';
import { percentTotal } from '../selectors.js';

// The name each blank figure goes by in the refusal (IS-S4).
const BLANK_NAMES = {
  targetOG: () => 'the target OG',
  percent: (b) => `the % for ${b.malt}`,
  fgdb: (b) => `the FGDB of ${b.malt}`,
  efficiency: () => 'the brewhouse efficiency',
  preBoilVolGal: () => 'the pre-boil volume',
  boilOffRateGalPerHr: () => 'the boil-off rate',
  boilTimeMin: () => 'the boil time',
};

// Why Solve changed nothing, as the card says it: the total when the boxes
// do not total 100 %, then each blank figure (IS-S4).
export function solveRefusalText(result) {
  const parts = [];
  const blanks = result.blank ?? [];
  const named = blanks.filter((b) => BLANK_NAMES[b.field]);
  if (result.totalOff && !blanks.some((b) => b.field === 'percent')) {
    parts.push(`The percents total ${num(result.totalPercent, 1)} ${percentUnit()}, not 100 ${percentUnit()}.`);
  }
  if (named.length > 0) parts.push(`Blank: ${named.map((b) => BLANK_NAMES[b.field](b)).join(', ')}.`);
  if (blanks.some((b) => b.field === 'preBoilTemp')) {
    parts.push('The pre-boil volume cannot be corrected at its measurement temperature.');
  }
  if (result.unusable && parts.length === 0) parts.push('These figures give no usable weights.');
  parts.push('Nothing changed.');
  return parts.join(' ');
}

const buttonStyle = {
  padding: '0.38rem 0.9rem',
  background: 'transparent',
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radii.btn,
  color: colors.textSecondary,
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};
const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.35rem 0',
  borderBottom: `1px solid ${colors.rowDivider}`,
};
const lineStyle = { fontSize: '0.88rem', color: colors.textPrimary, margin: '0.5rem 0 0' };

export default function TargetOgSolver({ malts, grist, mode, proGravityUnit, solved, onSolve, onUndoSolve, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [target, setTarget] = useState(''); // the box's text, in the screen's gravity unit, as typed
  // Each % box the brewer typed in, by row; a box not typed in holds the
  // malt's exact share (IS-Q7). Cleared when the rows change or the card closes.
  const [typed, setTyped] = useState({});
  const [typedFor, setTypedFor] = useState(malts.length);
  const [message, setMessage] = useState('');
  if (typedFor !== malts.length) {
    setTypedFor(malts.length);
    setTyped({});
  }

  const unit = resolveGravityUnit(mode, proGravityUnit);
  // FLAG: the engine's share is each weight over the bill's total, so one
  // blank weight blanks every share: every % of total reads "—" and every box
  // opens blank, not only the blank malt's. Kept as IS-S1 reads it ("read from
  // the engine's share"); Solve works once each % is typed (IS-Q2').
  const shares = malts.map((_, i) =>
    i in typed ? percentToFraction(typed[i]) : grist.perMalt[i]?.perMaltWeightFraction ?? NaN,
  );

  const solve = () => {
    const typedTarget = target === '' ? NaN : Number(target);
    const result = onSolve(gravityToCanonical(typedTarget, unit), shares, { target, unit });
    setMessage(result.ok ? '' : solveRefusalText(result));
  };

  // The prediction, in the unit the target was typed in.
  const solvedUnit = solved?.unit ?? unit;
  const predicted = solved
    ? num(gravityFromCanonical(grist.OG, solvedUnit), solvedUnit === 'plato' ? 3 : 4)
    : null;
  const solvedLabel = solvedUnit === 'plato' ? ` ${gravityUnitLabel(solvedUnit)}` : '';

  return (
    <section aria-label="Design to target OG" style={{ marginTop: '1rem' }}>
      <button
        type="button"
        onClick={() => {
          if (open) setTyped({});
          setOpen(!open);
          setMessage('');
        }}
        style={buttonStyle}
      >
        Design to target OG
      </button>

      {open && (
        <div style={{ marginTop: '0.5rem' }}>
          <InputRow
            label="Target OG"
            unit={gravityUnitLabel(unit)}
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setMessage('');
            }}
            step={unit === 'plato' ? 0.1 : 0.001}
            min={0}
          />
          {malts.map((m, i) => {
            const name = String(m.name ?? '').trim() || `Malt ${i + 1}`;
            return (
              <div key={i} style={rowStyle}>
                <span style={{ fontSize: '0.92rem', color: colors.textPrimary }}>{name}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <NumberField
                    aria-label={`% ${name}`}
                    value={i in typed ? typed[i] : roundForInput(fractionToPercent(shares[i]), 1)}
                    step="0.1"
                    min="0"
                    max="100"
                    onChange={(v) => {
                      setTyped({ ...typed, [i]: v });
                      setMessage('');
                    }}
                  />
                  <span style={{ fontSize: '0.78rem', color: colors.textMuted }}>{percentUnit()}</span>
                </span>
              </div>
            );
          })}
          <p style={{ ...lineStyle, color: colors.textSecondary }}>
            {`Total ${num(percentTotal(shares), 1)} ${percentUnit()}`}
          </p>
          <button type="button" onClick={solve} style={{ ...buttonStyle, marginTop: '0.5rem' }}>
            Solve
          </button>
          {message && <p style={tokens.warning}>{message}</p>}
        </div>
      )}

      {solved && (
        <div>
          <p style={lineStyle}>
            {`Predicted OG ${predicted}${solvedLabel} for a target of ${solved.target}${solvedLabel}`}
          </p>
          <p style={{ ...tokens.notice, marginTop: '0.2rem' }}>
            Solve and the forward calculation use two gravity conversions (SG to °P and back) that are not exact
            inverses, so the predicted OG can differ slightly from the target.
          </p>
          <button type="button" onClick={onUndoSolve} style={buttonStyle}>
            Undo solve
          </button>
        </div>
      )}
    </section>
  );
}
