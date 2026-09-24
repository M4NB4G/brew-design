// GristTable.jsx
// Editable malt bill (add/remove rows; the name box searches the owner's
// ingredient list, IngredientSearch) plus the brewhouse efficiency. Malt
// weight is lb in both modes; fgdb, color (degL) and efficiency are
// unitless/fixed. Apparent attenuation is entered on the Yeast card. Per-malt
// extract points shown read-only from the engine. On a phone each malt is a
// block (IngredientBlock) holding the same boxes instead of a table row.
import NumberField from './NumberField.jsx';
import IngredientSearch from './IngredientSearch.jsx';
import Card from './shared/Card.jsx';
import IngredientBlock from './shared/IngredientBlock.jsx';
import InputRow from './shared/InputRow.jsx';
import usePhone from './shared/usePhone.js';
import { colors, tokens, radii } from './shared/styles.js';
import { maltWeightUnit, percentUnit, fractionToPercent, percentToFraction } from '../display.js';
import { num } from '../format.js';
import { newRow } from '../ingredient-search.js';

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

export default function GristTable({
  malts,
  efficiency,
  grist,
  setRow,
  addRow,
  removeRow,
  setField,
}) {
  const phone = usePhone();

  // A malt's number boxes, shared by the table's cells and the phone's blocks.
  const maltInputs = (m, i) => [
    {
      label: `Weight (${maltWeightUnit()})`,
      input: (
        <NumberField
          value={m.weightLb}
          step="0.1"
          min="0"
          onChange={(v) => setRow('malts', i, 'weightLb', v)}
        />
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
              name={<IngredientSearch field="malts" row={m} index={i} setRow={setRow} />}
              fields={maltInputs(m, i)}
              resultLabel="Points"
              result={
                <span style={{ color: colors.textSecondary, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>
                  {num(grist.perMalt[i]?.perMaltPoints, 2)}
                </span>
              }
              remove={removeButton(i)}
            />
          ))}
        </div>
      ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem', minWidth: '520px' }}>
          <thead>
            <tr>
              <th style={{ ...TH, minWidth: '120px' }}>Malt</th>
              <th style={{ ...TH, width: '95px' }}>Weight ({maltWeightUnit()})</th>
              <th style={{ ...TH, width: '80px' }}>FGDB ({percentUnit()})</th>
              <th style={{ ...TH, width: '80px' }}>Color (°L)</th>
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
                {maltInputs(m, i).map(({ label, input }) => (
                  <td key={label} style={TD_NUM}>
                    {input}
                  </td>
                ))}
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
    </Card>
  );
}
