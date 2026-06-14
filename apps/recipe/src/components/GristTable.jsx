// GristTable.jsx
// Editable malt bill (add/remove rows) plus the two grist-level parameters
// (efficiency, apparent attenuation). Malt weight is lb in both modes; fgdb,
// color (degL), efficiency, and attenuation are unitless/fixed. Per-malt
// extract points shown read-only from the engine.
import NumberField from './NumberField.jsx';
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import { colors, tokens, radii } from './shared/styles.js';
import { maltWeightUnit } from '../display.js';
import { num } from '../format.js';

const EMPTY_MALT = { name: 'New malt', weightLb: 1, fgdb: 0.8, colorL: 2 };

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
  apparentAttenuation,
  grist,
  setRow,
  addRow,
  removeRow,
  setField,
}) {
  return (
    <Card>
      <span style={tokens.cardLabel}>Grist</span>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.75rem', minWidth: '520px' }}>
          <thead>
            <tr>
              <th style={{ ...TH, minWidth: '120px' }}>Malt</th>
              <th style={{ ...TH, width: '95px' }}>Weight ({maltWeightUnit()})</th>
              <th style={{ ...TH, width: '80px' }}>FGDB (%)</th>
              <th style={{ ...TH, width: '80px' }}>Color (°L)</th>
              <th style={{ ...TH, width: '80px', textAlign: 'right' }}>Points</th>
              <th style={{ ...TH, width: '36px' }} />
            </tr>
          </thead>
          <tbody>
            {malts.map((m, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? colors.noticeBg : 'transparent' }}>
                <td style={TD}>
                  <input
                    value={m.name}
                    onChange={(e) => setRow('malts', i, 'name', e.target.value)}
                    style={{
                      width: '100%',
                      border: `1px solid ${colors.inputBorder}`,
                      borderRadius: radii.input,
                      padding: '0.4rem 0.55rem',
                      fontSize: '0.92rem',
                      fontFamily: 'inherit',
                      color: colors.textPrimary,
                      background: colors.inputBg,
                    }}
                  />
                </td>
                <td style={TD_NUM}>
                  <NumberField
                    value={m.weightLb}
                    step="0.1"
                    min="0"
                    onChange={(v) => setRow('malts', i, 'weightLb', v)}
                  />
                </td>
                <td style={TD_NUM}>
                  <NumberField
                    value={m.fgdb * 100}
                    step="1"
                    min="0"
                    max="100"
                    onChange={(v) => setRow('malts', i, 'fgdb', v / 100)}
                  />
                </td>
                <td style={TD_NUM}>
                  <NumberField
                    value={m.colorL}
                    step="0.1"
                    min="0"
                    onChange={(v) => setRow('malts', i, 'colorL', v)}
                  />
                </td>
                <td style={{ ...TD_NUM, color: colors.textSecondary, fontSize: '0.9rem' }}>
                  {num(grist.perMalt[i]?.perMaltPoints, 2)}
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => addRow('malts', { ...EMPTY_MALT })}
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

      {/* Grist parameters */}
      <div>
        <InputRow
          label="Brewhouse efficiency"
          unit="%"
          value={Number((efficiency * 100).toFixed(4))}
          onChange={(e) => setField('efficiency', parseFloat(e.target.value) / 100)}
          step={1}
          min={0}
          max={100}
        />
        <InputRow
          label="Yeast Apparent Attenuation"
          unit="%"
          value={Number((apparentAttenuation * 100).toFixed(4))}
          onChange={(e) => setField('apparentAttenuation', parseFloat(e.target.value) / 100)}
          step={1}
          min={0}
          max={100}
        />
      </div>
    </Card>
  );
}
