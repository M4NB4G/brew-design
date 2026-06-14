// HopsSection.jsx
// Kettle additions (with per-addition IBU shown read-only) and the dry-hop
// list. Hop weight is oz in Home and lb in Pro, converted at the boundary;
// time (min), wort temp (degF), and alpha acid (fraction) are fixed-unit.
// Total IBU and the dry-hop rate come from the engine.
import NumberField from './NumberField.jsx';
import Card from './shared/Card.jsx';
import { colors, tokens, radii } from './shared/styles.js';
import {
  hopWeightToCanonical,
  hopWeightFromCanonical,
  hopWeightUnit,
  dryHopRateFromCanonical,
  dryHopRateUnit,
  tempUnit,
} from '../display.js';
import { num } from '../format.js';

const EMPTY_KETTLE = {
  name: 'New hop',
  timeMin: 10,
  wortTempF: 212,
  weightOz: 1,
  alphaAcidFraction: 0.1,
};
const EMPTY_DRYHOP = { name: 'New dry hop', weightOz: 1 };

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

function AddBtn({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
      }}
    >
      {children}
    </button>
  );
}

function RemoveBtn({ onClick }) {
  return (
    <button
      type="button"
      aria-label="Remove"
      onClick={onClick}
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
}

// Small IBU badge — per-addition, shown inline in the table.
function IbuBadge({ ibu }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: colors.statBoxBg,
        color: colors.textPrimary,
        borderRadius: radii.pill,
        fontSize: '0.8rem',
        fontWeight: 700,
        padding: '0.15rem 0.55rem',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
      }}
    >
      {num(ibu, 1)}
    </span>
  );
}

export default function HopsSection({ kettleAdditions, dryHops, hops, mode, setRow, addRow, removeRow }) {
  const wUnit = hopWeightUnit(mode);

  return (
    <Card>
      <span style={tokens.cardLabel}>Hops</span>

      {/* Kettle additions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            color: colors.textSecondary,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Kettle
        </span>
        <span
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: colors.textPrimary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {hops.totalIBU} IBU
        </span>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '560px' }}>
          <thead>
            <tr>
              <th style={{ ...TH, minWidth: '110px' }}>Hop</th>
              <th style={{ ...TH, width: '72px' }}>Time (min)</th>
              <th style={{ ...TH, width: '88px' }}>Temp ({tempUnit()})</th>
              <th style={{ ...TH, width: '90px' }}>Wt ({wUnit})</th>
              <th style={{ ...TH, width: '76px' }}>Alpha (%)</th>
              <th style={{ ...TH, width: '68px', textAlign: 'right' }}>IBU</th>
              <th style={{ ...TH, width: '36px' }} />
            </tr>
          </thead>
          <tbody>
            {kettleAdditions.map((a, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? colors.noticeBg : 'transparent' }}>
                <td style={TD}>
                  <input
                    value={a.name}
                    onChange={(e) => setRow('kettleAdditions', i, 'name', e.target.value)}
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
                    value={a.timeMin}
                    step="1"
                    min="0"
                    onChange={(v) => setRow('kettleAdditions', i, 'timeMin', v)}
                  />
                </td>
                <td style={TD_NUM}>
                  <NumberField
                    value={a.wortTempF}
                    step="1"
                    onChange={(v) => setRow('kettleAdditions', i, 'wortTempF', v)}
                  />
                </td>
                <td style={TD_NUM}>
                  <NumberField
                    value={hopWeightFromCanonical(a.weightOz, mode)}
                    step="0.1"
                    min="0"
                    onChange={(v) => setRow('kettleAdditions', i, 'weightOz', hopWeightToCanonical(v, mode))}
                  />
                </td>
                <td style={TD_NUM}>
                  <NumberField
                    value={a.alphaAcidFraction * 100}
                    step="0.1"
                    min="0"
                    max="100"
                    onChange={(v) => setRow('kettleAdditions', i, 'alphaAcidFraction', v / 100)}
                  />
                </td>
                <td style={{ ...TD, textAlign: 'right' }}>
                  <IbuBadge ibu={hops.additions[i]?.ibu} />
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>
                  <RemoveBtn onClick={() => removeRow('kettleAdditions', i)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddBtn onClick={() => addRow('kettleAdditions', { ...EMPTY_KETTLE })}>
        + Add kettle hop
      </AddBtn>

      {/* Divider */}
      <div style={{ height: '1px', background: colors.border, margin: '1.1rem 0 0.85rem' }} />

      {/* Dry hops */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '0.5rem',
        }}
      >
        <span
          style={{
            fontSize: '0.8rem',
            color: colors.textSecondary,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Dry hops
        </span>
        <span
          style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: colors.textPrimary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {num(dryHopRateFromCanonical(hops.dryHopRatio, mode), 2)} {dryHopRateUnit(mode)}
        </span>
      </div>

      <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '280px' }}>
          <thead>
            <tr>
              <th style={TH}>Hop</th>
              <th style={{ ...TH, width: '100px' }}>Wt ({wUnit})</th>
              <th style={{ ...TH, width: '36px' }} />
            </tr>
          </thead>
          <tbody>
            {dryHops.map((d, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? colors.noticeBg : 'transparent' }}>
                <td style={TD}>
                  <input
                    value={d.name}
                    onChange={(e) => setRow('dryHops', i, 'name', e.target.value)}
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
                    value={hopWeightFromCanonical(d.weightOz, mode)}
                    step="0.1"
                    min="0"
                    onChange={(v) => setRow('dryHops', i, 'weightOz', hopWeightToCanonical(v, mode))}
                  />
                </td>
                <td style={{ ...TD, textAlign: 'center' }}>
                  <RemoveBtn onClick={() => removeRow('dryHops', i)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddBtn onClick={() => addRow('dryHops', { ...EMPTY_DRYHOP })}>
        + Add dry hop
      </AddBtn>
    </Card>
  );
}
