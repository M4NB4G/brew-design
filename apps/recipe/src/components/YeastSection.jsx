// YeastSection.jsx
// The Pitch & Starter card: the desired yeast character, plus the read-only
// pitch rate, cells needed, and starter options from the engine. Ale/lager is
// chosen on the Yeast card (YeastCard.jsx) and selects the pitch rate here. The fermentation volume is entered on
// the Volumes card and feeds both the dry-hop rate (Hops) and the cell count
// (here) via shared canonical state.
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import StatBox from './shared/StatBox.jsx';
import { colors, tokens } from './shared/styles.js';
import usePhone from './shared/usePhone.js';
import {
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

export default function YeastSection({ yeast, derived, mode, setYeast }) {
  const phone = usePhone();
  // Phone: tighter starter-table cells, so the note column has room to read.
  const th = phone ? { ...TH, padding: '0.45rem 0.35rem', letterSpacing: '0.04em' } : TH;
  const td = phone ? { ...TD, padding: '0.45rem 0.35rem' } : TD;
  const { pitchRate, cells, starter } = derived;

  return (
    <Card>
      <span style={tokens.cardLabel}>Pitch &amp; Starter</span>

      {/* Selectors (phone: one column, as are the tiles below) */}
      <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <Select label="Desired Yeast Character" value={yeast.density} onChange={(v) => setYeast('density', v)}>
          <option value="high">High</option>
          <option value="mod">Moderate</option>
          <option value="low">Low</option>
        </Select>
      </div>

      {/* Pitch rate + cells stat tiles */}
      <div style={{ ...tokens.statGrid, marginTop: '0.85rem', marginBottom: '0.85rem', ...(phone && { gridTemplateColumns: '1fr' }) }}>
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
          {/* Phone: no minimum width; the columns share the card's width */}
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: phone ? 0 : '340px' }}>
            <thead>
              <tr>
                <th style={th}>Beginning cell count</th>
                <th style={{ ...th, width: phone ? undefined : '80px' }}>Volume ({starterVolumeUnit()})</th>
                <th style={{ ...th, width: phone ? undefined : '72px' }}>DME (g)</th>
                <th style={th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {starter.map((o, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? colors.noticeBg : 'transparent' }}>
                  <td style={{ ...td, fontWeight: 700, color: colors.textPrimary }}>{o.band}</td>
                  <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{num(o.volumeL, 2)}</td>
                  <td style={{ ...td, fontVariantNumeric: 'tabular-nums' }}>{num(o.dmeGrams, 0)}</td>
                  <td style={{ ...td, color: colors.textSecondary, fontSize: '0.85rem' }}>
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
