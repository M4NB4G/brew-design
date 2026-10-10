// CostCard.jsx
// The Cost card on the Recipe tab (docs/items/economics.md): each malt,
// kettle hop and dry hop by name, the yeast, and the brewer's other lines (a
// name and a cost per batch), each with a price box — a malt per lb (per sack
// in Pro with sacks), a hop per oz at Home and per lb in Pro, the yeast and
// the other lines per batch (EC-S1). Each line's cost, the batch total and
// the cost per gal (per bbl in Pro's barrels) come from computeCost through
// the display edge, in $ to two decimals (EC-S2); an unpriced line shows "—"
// and the total counts it (EC-Q6). Not on the printed sheet (EC-S5).
// Computes nothing.
import NumberField from './NumberField.jsx';
import Card from './shared/Card.jsx';
import { colors, tokens, radii } from './shared/styles.js';
import {
  maltWeightUnit,
  maltWeightFromCanonical,
  hopWeightUnit,
  hopWeightFromCanonical,
  maltPriceUnit,
  maltPriceFromCanonical,
  maltPriceToCanonical,
  hopPriceUnit,
  hopPriceFromCanonical,
  hopPriceToCanonical,
  batchPriceUnit,
  costPerVolumeFromCanonical,
  volumeUnit,
} from '../display.js';
import { num, dollars } from '../format.js';

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
const TD = { padding: '0.45rem 0.6rem', borderBottom: `1px solid ${colors.rowDivider}`, fontSize: '0.92rem' };
const TD_NUM = { ...TD, textAlign: 'right', fontVariantNumeric: 'tabular-nums' };
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
  marginTop: '0.75rem',
};
const removeStyle = {
  background: 'none',
  border: 'none',
  color: colors.textMuted,
  cursor: 'pointer',
  fontSize: '0.9rem',
  padding: '0.2rem 0.4rem',
  borderRadius: radii.btn,
  lineHeight: 1,
};
const totalStyle = { fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary, margin: '0.75rem 0 0' };

export default function CostCard({ recipe, cost, mode, proVolumeUnit, proMaltUnit, setRow, setYeast, addRow, removeRow }) {
  // How each kind of line shows its quantity and takes its price.
  const kinds = {
    malts: {
      quantity: (q) => `${num(maltWeightFromCanonical(q, mode, proMaltUnit), 2)} ${maltWeightUnit(mode, proMaltUnit)}`,
      unit: maltPriceUnit(mode, proMaltUnit),
      shown: (p) => maltPriceFromCanonical(p, mode, proMaltUnit),
      set: (i, v) => setRow('malts', i, 'pricePerLb', maltPriceToCanonical(v, mode, proMaltUnit)),
    },
    kettleAdditions: {
      quantity: (q) => `${num(hopWeightFromCanonical(q, mode), 2)} ${hopWeightUnit(mode)}`,
      unit: hopPriceUnit(mode),
      shown: (p) => hopPriceFromCanonical(p, mode),
      set: (i, v) => setRow('kettleAdditions', i, 'pricePerOz', hopPriceToCanonical(v, mode)),
    },
    dryHops: {
      quantity: (q) => `${num(hopWeightFromCanonical(q, mode), 2)} ${hopWeightUnit(mode)}`,
      unit: hopPriceUnit(mode),
      shown: (p) => hopPriceFromCanonical(p, mode),
      set: (i, v) => setRow('dryHops', i, 'pricePerOz', hopPriceToCanonical(v, mode)),
    },
    yeast: {
      quantity: () => '1 batch',
      unit: batchPriceUnit(),
      shown: (p) => p,
      set: (i, v) => setYeast('pricePerBatch', v),
    },
    otherCosts: {
      quantity: () => '1 batch',
      unit: batchPriceUnit(),
      shown: (p) => p,
      set: (i, v) => setRow('otherCosts', i, 'costPerBatch', v),
    },
  };

  const unpriced = cost.unpriced > 0 ? ` · ${cost.unpriced} ${cost.unpriced === 1 ? 'line' : 'lines'} unpriced` : '';
  const perUnit = volumeUnit(mode, proVolumeUnit);

  return (
    <Card>
      <span style={tokens.cardLabel}>Cost</span>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
          <thead>
            <tr>
              <th style={{ ...TH, minWidth: '140px' }}>Item</th>
              <th style={{ ...TH, textAlign: 'right' }}>Quantity</th>
              <th style={{ ...TH, width: '130px' }}>Price</th>
              <th style={{ ...TH, textAlign: 'right' }}>Cost</th>
              <th style={{ ...TH, width: '36px', position: 'relative' }}>
                <span style={tokens.visuallyHidden}>Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {cost.lines.map((line, n) => {
              const kind = kinds[line.kind];
              const other = line.kind === 'otherCosts';
              const name = other ? String(line.name ?? '').trim() || `Line ${line.index + 1}` : line.name;
              return (
                <tr key={`${line.kind}-${line.index}`} style={{ background: n % 2 === 1 ? colors.noticeBg : 'transparent' }}>
                  <td style={TD}>
                    {other ? (
                      <input
                        type="text"
                        aria-label={`Line ${line.index + 1} name`}
                        value={recipe.otherCosts[line.index].name}
                        onChange={(e) => setRow('otherCosts', line.index, 'name', e.target.value)}
                        style={{ ...tokens.select, padding: '0.45rem 0.6rem' }}
                      />
                    ) : (
                      name
                    )}
                  </td>
                  <td style={{ ...TD_NUM, color: colors.textSecondary }}>{kind.quantity(line.quantity)}</td>
                  <td style={TD}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <NumberField
                        aria-label={`Price of ${name} (${kind.unit})`}
                        value={kind.shown(line.unitPrice)}
                        step="0.01"
                        min="0"
                        onChange={(v) => kind.set(line.index, v)}
                      />
                      <span style={{ fontSize: '0.78rem', color: colors.textMuted }}>{kind.unit}</span>
                    </span>
                  </td>
                  <td style={TD_NUM}>{dollars(line.cost)}</td>
                  <td style={{ ...TD, textAlign: 'center' }}>
                    {other && (
                      <button type="button" aria-label="Remove line" onClick={() => removeRow('otherCosts', line.index)} style={removeStyle}>
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => addRow('otherCosts', { name: '', costPerBatch: NaN })} style={buttonStyle}>
        + Add line
      </button>
      <p style={totalStyle}>{`Total ${dollars(cost.total)}${unpriced}`}</p>
      <p style={{ ...totalStyle, marginTop: '0.3rem', fontWeight: 500, color: colors.textSecondary }}>
        {`Per ${perUnit} ${dollars(costPerVolumeFromCanonical(cost.perGal, mode, proVolumeUnit))}`}
      </p>
    </Card>
  );
}
