// YeastCard.jsx
// The recipe's yeast: the strain, searched from the owner's ingredient list
// by name, lab or product code (the same search box as the malt and hop
// rows, IngredientSearch), ale/lager, and the brewer's own apparent
// attenuation and fermentation temperature. A strain on the list shows its
// lab figures as plain text; they are information only and never copied into
// a box. Picking a strain sets ale/lager and nothing else; typing sets the
// name alone. A fermentation temperature outside the strain's lab range shows
// a warning, which changes no number and blocks nothing.
import IngredientSearch from './IngredientSearch.jsx';
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import { colors, tokens } from './shared/styles.js';
import usePhone from './shared/usePhone.js';
import { percentUnit, fractionToPercent, percentToFraction, tempUnit } from '../display.js';
import { strainInfo, fermTempWarning } from '../ingredient-search.js';

const LABEL = {
  fontSize: '0.78rem',
  color: colors.textMuted,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
};

export default function YeastCard({ yeast, apparentAttenuation, setYeast, setField }) {
  const phone = usePhone();
  const info = strainInfo(yeast.name);
  const named = String(yeast.name ?? '').trim() !== '';
  const warning = fermTempWarning(yeast.name, yeast.fermTempF);

  return (
    <Card>
      <span style={tokens.cardLabel}>Yeast</span>

      {/* Phone: the strain, then ale/lager under it */}
      <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '2fr 1fr', gap: '0.75rem', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', minWidth: 0 }}>
          <span style={LABEL}>Strain</span>
          {/* The yeast is the search box's row: its name is the strain. */}
          <IngredientSearch
            field="yeasts"
            row={yeast}
            index={0}
            setRow={(field, index, key, value) => setYeast(key, value)}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <label style={LABEL}>Type</label>
          <select
            value={yeast.type}
            onChange={(e) => setYeast('type', e.target.value)}
            style={{ ...tokens.select, padding: '0.4rem 0.55rem', fontSize: '0.92rem' }}
          >
            <option value="ale">Ale</option>
            <option value="lager">Lager</option>
          </select>
        </div>
      </div>

      {/* The list's figures for the strain, as information */}
      {info && (
        <p style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', color: colors.textSecondary, lineHeight: 1.5 }}>
          {info.lab} · {info.productCode} · {info.type}
          {info.labRange && <> · lab range {info.labRange}</>} · attenuation {info.attenuation}
        </p>
      )}
      {!info && named && (
        <p style={{ ...tokens.notice, margin: '0 0 0.4rem' }}>Not on your list: no lab figures to show.</p>
      )}

      <div>
        <InputRow
          label="Apparent attenuation"
          unit={percentUnit()}
          value={Number(fractionToPercent(apparentAttenuation).toFixed(4))}
          onChange={(e) => setField('apparentAttenuation', percentToFraction(parseFloat(e.target.value)))}
          step={1}
          min={0}
          max={100}
        />
        <InputRow
          label="Fermentation temperature"
          unit={tempUnit()}
          value={Number.isFinite(yeast.fermTempF) ? yeast.fermTempF : ''}
          onChange={(e) => setYeast('fermTempF', parseFloat(e.target.value))}
          step={1}
        />
        {warning && (
          <p role="status" style={tokens.warning}>
            {warning}
          </p>
        )}
      </div>
    </Card>
  );
}
