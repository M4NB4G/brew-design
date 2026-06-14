// YeastSection.jsx
// Yeast type/density selection and the fermentation volume, plus the read-only
// pitch rate, cells needed, and starter options from the engine. Fermentation
// volume is entered in the current display unit and feeds both the dry-hop rate
// (Hops) and the cell count (here) via shared canonical state.
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import StatBox from './shared/StatBox.jsx';
import { colors, tokens, radii } from './shared/styles.js';
import {
  volumeToCanonical,
  volumeFromCanonical,
  volumeUnit,
  pitchRateUnit,
  cellsFromCanonical,
  cellsUnit,
  starterVolumeUnit,
} from '../display.js';
import { num } from '../format.js';

// Styled select that matches the token pattern without requiring a full InputRow.
function Select({ label, value, onChange, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.78rem', color: colors.textMuted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...tokens.select }}
      >
        {children}
      </select>
    </div>
  );
}

const TH = {
  padding: '0.45rem 0.6rem',
  background: colors.statBoxBg,
  color: colors.textSecondary,
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${colors.border}`,
  textAlign: 'left',
};
const TD = { padding: '0.45rem 0.6rem', borderBottom: `1px solid ${colors.rowDivider}`, fontSize: '0.92rem' };

export default function YeastSection({ yeast, fermentVolGal, derived, mode, setField, setYeast }) {
  const { pitchRate, cells, starter } = derived;
  const vUnit = volumeUnit(mode);

  return (
    <Card>
      <span style={tokens.cardLabel}>Yeast &amp; Starter</span>

      {/* Selectors + fermentation volume */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <Select label="Type" value={yeast.type} onChange={(v) => setYeast('type', v)}>
          <option value="ale">Ale</option>
          <option value="lager">Lager</option>
        </Select>
        <Select label="Desired Yeast Character" value={yeast.density} onChange={(v) => setYeast('density', v)}>
          <option value="high">High</option>
          <option value="mod">Moderate</option>
          <option value="low">Low</option>
        </Select>
      </div>

      <InputRow
        label={`Fermentation volume (${vUnit})`}
        value={Number(volumeFromCanonical(fermentVolGal, mode).toFixed(6))}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) setField('fermentVolGal', volumeToCanonical(v, mode));
        }}
        step={0.1}
        min={0}
      />

      {/* Pitch rate + cells stat tiles */}
      <div style={{ ...tokens.statGrid, marginTop: '0.85rem', marginBottom: '0.85rem' }}>
        <StatBox
          value={num(pitchRate, 2)}
          label={`Pitch rate / ${pitchRateUnit()}`}
        />
        <StatBox
          value={num(cellsFromCanonical(cells, mode), mode === 'pro' ? 2 : 0)}
          label={`Cells needed / ${cellsUnit(mode)}`}
        />
      </div>

      {/* Starter options */}
      <span style={{ ...tokens.cardLabel, fontSize: '0.65rem', marginBottom: '0.5rem' }}>
        Starter options
      </span>

      {starter.length === 0 ? (
        <p style={tokens.notice}>No usable starter band for this cell count.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '340px' }}>
            <thead>
              <tr>
                <th style={TH}>Beginning cell count</th>
                <th style={{ ...TH, width: '80px' }}>Volume ({starterVolumeUnit()})</th>
                <th style={{ ...TH, width: '72px' }}>DME (g)</th>
                <th style={TH}>Note</th>
              </tr>
            </thead>
            <tbody>
              {starter.map((o, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? colors.noticeBg : 'transparent' }}>
                  <td style={{ ...TD, fontWeight: 700, color: colors.textPrimary }}>{o.band}</td>
                  <td style={{ ...TD, fontVariantNumeric: 'tabular-nums' }}>{num(o.volumeL, 2)}</td>
                  <td style={{ ...TD, fontVariantNumeric: 'tabular-nums' }}>{num(o.dmeGrams, 0)}</td>
                  <td style={{ ...TD, color: colors.textSecondary, fontSize: '0.85rem' }}>
                    {o.packNote || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
