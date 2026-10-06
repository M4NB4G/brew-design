// GristTable.jsx
// Editable malt bill (add/remove rows; the name box searches the owner's
// ingredient list, IngredientSearch) plus the brewhouse efficiency. Malt
// weight is lb, or in Pro 55 lb sacks by Pro's malt choice (PU-S3: entered as
// decimal sacks, stored in lb, whole sacks and pounds shown beside the box);
// fgdb, color (degL) and efficiency are
// unitless/fixed. Apparent attenuation is entered on the Yeast card. Per-malt
// extract points shown read-only from the engine. On a phone each malt is a
// block (IngredientBlock) holding the same boxes instead of a table row.
// Each malt's type for the mash pH model is a choice (mash pH, MP-S3): a pick
// from the list sets it; choosing it by hand clears the malt's lab figures.
// Each malt's % of total grain weight is always shown, read from the engine's
// share, and "Design to target OG" sits at the card's foot (design to a target
// OG, IS-S1, IS-S2).
import NumberField from './NumberField.jsx';
import IngredientSearch from './IngredientSearch.jsx';
import TargetOgSolver from './TargetOgSolver.jsx';
import Card from './shared/Card.jsx';
import IngredientBlock from './shared/IngredientBlock.jsx';
import InputRow from './shared/InputRow.jsx';
import usePhone from './shared/usePhone.js';
import { MALT_TYPES } from '@brew/engine';
import { colors, tokens, radii } from './shared/styles.js';
import {
  maltWeightUnit,
  maltInSacks,
  maltWeightBoxValue,
  maltWeightToCanonical,
  sackSplitText,
  percentUnit,
  fractionToPercent,
  percentToFraction,
} from '../display.js';
import { num, roundForInput } from '../format.js';
import { newRow, chooseMaltType } from '../ingredient-search.js';

// The mash pH model's malt types, as the choice names them; blank until set.
const MALT_TYPE_LABELS = {
  base: 'Base',
  crystal: 'Crystal',
  roast: 'Roast',
  acidulated: 'Acidulated',
  none: 'None (not in the mash)',
};

const TH = {
  padding: '0.45rem 0.6rem',
  background: colors.statBoxBg,
  color: colors.textSecondary,
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${colors.border}`,
  whiteSpace: 'nowrap',
  textAlign: 'left',
};
const TD = { padding: '0.45rem 0.6rem', borderBottom: `1px solid ${colors.rowDivider}` };
const TD_NUM = { ...TD, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
const phoneTypeStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.45rem' };
const phoneTypeLabelStyle = { fontSize: '0.75rem', color: colors.textSecondary, fontWeight: 600 };
const sackSplitStyle = { fontSize: '0.72rem', color: colors.textMuted, marginTop: '0.2rem', whiteSpace: 'nowrap' };

export default function GristTable({
  malts,
  efficiency,
  grist,
  setRow,
  addRow,
  removeRow,
  setField,
  mode,
  proMaltUnit,
  proGravityUnit,
  solved,
  onSolve,
  onUndoSolve,
}) {
  const phone = usePhone();
  // A malt's share of the grain weight, in percent to one decimal; "—" where blank.
  const shareText = (i) => num(fractionToPercent(grist.perMalt[i]?.perMaltWeightFraction), 1);
  const sacks = maltInSacks(mode, proMaltUnit);
  const wUnit = maltWeightUnit(mode, proMaltUnit);

  // A malt's number boxes, shared by the table's cells and the phone's blocks.
  const maltInputs = (m, i) => [
    {
      label: `Weight (${wUnit})`,
      input: (
        <>
          <NumberField
            value={maltWeightBoxValue(m.weightLb, mode, proMaltUnit)}
            step={sacks ? '0.01' : '0.1'}
            min="0"
            onChange={(v) => setRow('malts', i, 'weightLb', maltWeightToCanonical(v, mode, proMaltUnit))}
          />
          {sacks && Number.isFinite(m.weightLb) && (
            <div style={sackSplitStyle}>{sackSplitText(m.weightLb, (lb) => roundForInput(lb))}</div>
          )}
        </>
      ),
    },
    {
      label: `FGDB (${percentUnit()})`,
      input: (
        <NumberField
          value={fractionToPercent(m.fgdb)}
          step="1"
          min="0"
          max="100"
          onChange={(v) => setRow('malts', i, 'fgdb', percentToFraction(v))}
        />
      ),
    },
    {
      label: 'Color (°L)',
      input: (
        <NumberField
          value={m.colorL}
          step="0.1"
          min="0"
          onChange={(v) => setRow('malts', i, 'colorL', v)}
        />
      ),
    },
  ];

  // A malt's type for the mash pH model: a column of the table; on a phone,
  // its own line under the name, so the number boxes keep their width.
  const typeInput = (m, i) => (
    <select
      aria-label="Malt type"
      value={m.type}
      onChange={(e) => {
        const next = chooseMaltType(m, e.target.value);
        for (const key of ['type', 'distilledWaterPh', 'acidityMeqPerKg']) {
          if (!Object.is(next[key], m[key])) setRow('malts', i, key, next[key]);
        }
      }}
      style={tokens.select}
    >
      <option value="">—</option>
      {MALT_TYPES.map((t) => (
        <option key={t} value={t}>
          {MALT_TYPE_LABELS[t]}
        </option>
      ))}
    </select>
  );

  const removeButton = (i) => (
    <button
      type="button"
      aria-label="Remove malt"
      onClick={() => removeRow('malts', i)}
      style={{
        background: 'none',
        border: 'none',
        color: colors.textMuted,
        cursor: 'pointer',
        fontSize: '0.9rem',
        padding: '0.2rem 0.4rem',
        borderRadius: radii.btn,
        lineHeight: 1,
      }}
    >
      ✕
    </button>
  );

  return (
    <Card>
      <span style={tokens.cardLabel}>Grist</span>

      {phone ? (
        <div style={{ marginBottom: '0.75rem' }}>
          {malts.map((m, i) => (
            <IngredientBlock
              key={i}
              striped={i % 2 === 1}
              name={
                <>
                  <IngredientSearch field="malts" row={m} index={i} setRow={setRow} />
                  <label style={phoneTypeStyle}>
                    <span style={phoneTypeLabelStyle}>Type</span>
                    {typeInput(m, i)}
                  </label>
                </>
              }
              fields={maltInputs(m, i)}
              resultLabel="% of total"
              result={
                <span style={{ color: colors.textSecondary, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>
                  {shareText(i)} · Points {num(grist.perMalt[i]?.perMaltPoints, 2)}
                </span>
              }
              remove={removeButton(i)}
            />
          ))}
        </div>
      ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem', minWidth: '660px' }}>
          <thead>
            <tr>
              <th style={{ ...TH, minWidth: '120px' }}>Malt</th>
              <th style={{ ...TH, width: '95px' }}>Weight ({wUnit})</th>
              <th style={{ ...TH, width: '80px', textAlign: 'right' }}>% of total</th>
              <th style={{ ...TH, width: '80px' }}>FGDB ({percentUnit()})</th>
              <th style={{ ...TH, width: '80px' }}>Color (°L)</th>
              <th style={{ ...TH, width: '140px' }}>Type</th>
              <th style={{ ...TH, width: '80px', textAlign: 'right' }}>Points</th>
              <th style={{ ...TH, width: '36px' }} />
            </tr>
          </thead>
          <tbody>
            {malts.map((m, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? colors.noticeBg : 'transparent' }}>
                <td style={TD}>
                  <IngredientSearch field="malts" row={m} index={i} setRow={setRow} />
                </td>
                {maltInputs(m, i).map(({ label, input }, k) => [
                  <td key={label} style={TD_NUM}>
                    {input}
                  </td>,
                  k === 0 && (
                    <td key="share" data-share="" style={{ ...TD_NUM, color: colors.textSecondary, fontSize: '0.9rem' }}>
                      {shareText(i)}
                    </td>
                  ),
                ])}
                <td style={TD}>{typeInput(m, i)}</td>
                <td style={{ ...TD_NUM, color: colors.textSecondary, fontSize: '0.9rem' }}>
                  {num(grist.perMalt[i]?.perMaltPoints, 2)}
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>{removeButton(i)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      <button
        type="button"
        onClick={() => addRow('malts', newRow('malts'))}
        style={{
          padding: '0.38rem 0.9rem',
          background: 'transparent',
          border: `1px solid ${colors.inputBorder}`,
          borderRadius: radii.btn,
          color: colors.textSecondary,
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          marginBottom: '1rem',
        }}
      >
        + Add malt
      </button>

      {/* Grist parameter */}
      <div>
        <InputRow
          label="Brewhouse efficiency"
          unit={percentUnit()}
          value={Number(fractionToPercent(efficiency).toFixed(4))}
          onChange={(e) => setField('efficiency', percentToFraction(parseFloat(e.target.value)))}
          step={1}
          min={0}
          max={100}
        />
      </div>

      <TargetOgSolver
        malts={malts}
        grist={grist}
        mode={mode}
        proGravityUnit={proGravityUnit}
        solved={solved}
        onSolve={onSolve}
        onUndoSolve={onUndoSolve}
      />
    </Card>
  );
}
