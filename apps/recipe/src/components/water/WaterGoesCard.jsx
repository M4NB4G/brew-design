// WaterGoesCard.jsx
// "Where the Water Goes" (docs/items/water-treatment.md, Q10): on the Salts &
// Acid screen in place of S3's Mash Volume card. The brewery setup the sums
// need — vessels, sparge, the tank's treated volume and top-up level, grain
// absorption, and the sparge water (typed; S4b) — the treatment choice and the
// kettle switch, then the water volumes from the recipe (the water left in
// the mash tun worked out) and, for the tank,
// what the mash draws, what the sparge carries and what is left, not used.
// Every figure comes from computeWater as `figures`; the entries change only
// through water-state.js's setWaterSetup. Nothing here is computed.
import Card from '../shared/Card.jsx';
import InputRow from '../shared/InputRow.jsx';
import { colors, tokens } from '../shared/styles.js';
import {
  volumeToCanonical,
  volumeFromCanonical,
  volumeUnit,
  volumesInBarrels,
  saltUnit,
  mashRvUnit,
  fractionToPercent,
} from '../../display.js';
import { num } from '../../format.js';
import { setWaterSetup } from '../../water-state.js';

export const VESSEL_LABELS = { 1: 'One vessel', 2: 'Two vessels', 3: 'Three vessels' };
export const SPARGE_LABELS = { none: 'No sparge (full volume)', batch: 'Batch sparge', fly: 'Fly sparge' };
// The kettle water readout's label, its caveat and its assumption per sparge
// method (water-as-brewed.md, KW-S3, its wording amended by the owner
// 2026-10-02: the title, then his caveat), on screen and on the printed sheet.
export const KETTLE_LABEL = 'Kettle water before the boil';
export const KETTLE_CAVEAT = 'Consider these estimates until confirmed with lab sampling.';
export const KETTLE_ASSUMPTION = {
  none: 'No sparge, the mash well mixed',
  batch: 'Batch sparge, well mixed',
  fly: 'Fly sparge, plug flow',
};
// The efficiency's known bias (C17), beside the readout on screen and sheet.
export const KETTLE_BIAS_NOTE =
  'The brewhouse efficiency also counts how completely the mash dissolves the extract, so it slightly understates the salts reaching the kettle: the kettle salts come out slightly generous.';
// KS1 (docs/items/kettle-share-limits.md, KS-S2): a share held at its limit.
export const KETTLE_HELD_NOTE =
  "A share was held at its limit: the brewhouse efficiency does not fit these volumes (it also counts the mash's conversion), so the kettle salts are an estimate.";
export const TREATMENT_LABELS = { mash: 'The mash water', tank: 'The Hot Liquor Tank (HLT) first fill' };
// Where the acid goes, with the tank treated (S5b item C, AM-S1).
export const ACID_PLACE_LABELS = { salts: 'With the salts (HLT)', mash: 'Into the mash' };

// The figures the sums need, named as the card names them (WaterTab.jsx's
// line for blank figures).
export const SETUP_LABELS = {
  mashWaterGal: 'Mash water',
  preBoilGal: 'Pre-boil volume',
  malts: 'Malt weights',
  absorptionQtPerLb: 'Grain absorption',
  spargeGal: 'Sparge water',
  tankTreatedGal: 'Treated volume',
  tankTopUpGal: 'Top-up level',
};

// A canonical-gal figure in the screen's volume unit (Home gal; Pro bbl, or
// gal by Pro's volume choice): gal to 0.01, bbl to 0.001.
export const volumeText = (gal, mode, proVolumeUnit) =>
  num(volumeFromCanonical(gal, mode, proVolumeUnit), volumesInBarrels(mode, proVolumeUnit) ? 3 : 2);

// A canonical-gal figure as a number box shows it: blank shows empty.
// Away from the cursor it shows the printed sheet's precision, gal to 0.01
// and bbl to 0.001; with the cursor in it, the full figure (BA1).
const volumeShown = (gal, mode, proVolumeUnit, digits = 6) =>
  Number.isFinite(gal) ? Number(volumeFromCanonical(gal, mode, proVolumeUnit).toFixed(digits)) : '';
const volumeDigits = (mode, proVolumeUnit) => (volumesInBarrels(mode, proVolumeUnit) ? 3 : 2);

function Warning({ children }) {
  return (
    <p role="status" style={tokens.warning}>
      {children}
    </p>
  );
}

// A read-only figure: label, unit, value, and an optional word after it.
function ReadRow({ label, unit, value, note }) {
  return (
    <div style={readRowStyle}>
      <div>
        <span style={readLabelStyle}>{label}</span>
        {unit && <span style={unitStyle}>{unit}</span>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={readValueStyle}>{value}</span>
        {note && <span style={{ ...unitStyle, display: 'block' }}>{note}</span>}
      </div>
    </div>
  );
}

function Choice({ label, value, options, labels, onChange }) {
  return (
    <label style={choiceStyle}>
      <span style={{ ...tokens.cardLabel, marginBottom: '0.3rem' }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={tokens.select}>
        {options.map((o) => (
          <option key={o} value={o}>
            {labels[o]}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function WaterGoesCard({ water, figures, mode, proVolumeUnit, setWater }) {
  const { setup, volumes, tank, warnings } = figures;
  const unit = volumeUnit(mode, proVolumeUnit);
  const set = (key, value) => setWater((w) => setWaterSetup(w, key, value));
  const volumeRow = (key, label, hint) => (
    <InputRow
      label={label}
      unit={unit}
      value={volumeShown(water[key], mode, proVolumeUnit, volumeDigits(mode, proVolumeUnit))}
      editValue={volumeShown(water[key], mode, proVolumeUnit)}
      onChange={(e) => set(key, volumeToCanonical(parseFloat(e.target.value), mode, proVolumeUnit))}
      step={0.1}
      min={0}
      hint={hint}
    />
  );
  const v = (gal) => volumeText(gal, mode, proVolumeUnit);
  const tankTreated = setup.treatment === 'tank';

  // One line per salt in a share of the tank: "Gypsum (CaSO₄·2H₂O) 8.4 g".
  const gramDigits = mode === 'pro' ? 0 : 1;
  const saltsLine = (salts) =>
    Object.keys(salts).length === 0
      ? null
      : Object.keys(salts).map((k) => (
          <div key={k} style={drawSaltStyle}>
            {figures.salts.concat(figures.raiseSalt).find((r) => r.key === k)?.name ?? k}{' '}
            {num(salts[k], gramDigits)} {saltUnit(mode)}
          </div>
        ));
  const draw = (label, gal, salts) => (
    <div style={drawRowStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
        <span style={readLabelStyle}>{label}</span>
        <span style={readValueStyle}>
          {v(gal)} {unit}
        </span>
      </div>
      {saltsLine(salts)}
    </div>
  );

  return (
    <Card>
      <div style={tokens.cardLabel}>Where the Water Goes</div>
      <div style={{ fontSize: '0.78rem', color: colors.textMuted, marginBottom: '0.5rem' }}>HLT = Hot Liquor Tank</div>

      <div style={choiceGridStyle}>
        <Choice
          label="Vessels"
          value={setup.vessels}
          options={[1, 2, 3]}
          labels={VESSEL_LABELS}
          onChange={(value) => set('vessels', Number(value))}
        />
        <Choice
          label="Sparge"
          value={setup.spargeMethod}
          options={setup.offered.spargeMethods}
          labels={SPARGE_LABELS}
          onChange={(value) => set('spargeMethod', value)}
        />
        <Choice
          label="Treat"
          value={setup.treatment}
          options={setup.offered.treatments}
          labels={TREATMENT_LABELS}
          onChange={(value) => set('treatment', value)}
        />
        {tankTreated && (
          <Choice
            label="Acid"
            value={setup.acidPlace}
            options={setup.offered.acidPlaces}
            labels={ACID_PLACE_LABELS}
            onChange={(value) => set('acidPlace', value)}
          />
        )}
      </div>
      <label style={checkStyle}>
        <input
          type="checkbox"
          checked={setup.kettleSalts}
          onChange={(e) => {
            const on = e.target.checked;
            set('kettleSalts', on);
          }}
          style={{ marginRight: '0.4rem', accentColor: colors.accent }}
        />
        Salts also go in the kettle
      </label>

      {tankTreated && volumeRow('tankTreatedGal', 'Treated volume')}
      {tankTreated && volumeRow('tankTopUpGal', 'Top-up level')}
      <InputRow
        label="Grain absorption"
        unit={mashRvUnit()}
        value={Number.isFinite(water.absorptionQtPerLb) ? water.absorptionQtPerLb : ''}
        onChange={(e) => set('absorptionQtPerLb', parseFloat(e.target.value))}
        step={0.01}
        min={0}
      />
      {setup.spargeMethod !== 'none' && volumeRow('spargeGal', 'Sparge water', tankTreated ? 'from the HLT' : 'untreated')}

      <ReadRow label="Mash water (from the recipe)" unit={unit} value={v(volumes.mashWaterGal)} />
      <ReadRow label="Water absorbed by the grain" unit={unit} value={v(volumes.absorptionGal)} />
      <ReadRow label="Water left in the mash tun" unit={unit} value={v(volumes.mashTunLeftGal)} />
      <ReadRow label="Total water" unit={unit} value={v(volumes.totalGal)} />

      {warnings.kettleShortGal > 0 && (
        <Warning>
          The kettle will be short by {v(warnings.kettleShortGal)} {unit}: the mash and sparge water, less what the grain
          absorbs, is less than the pre-boil volume
        </Warning>
      )}

      {tank && (
        <>
          <ReadRow
            label="Treated share of the sparge liquor"
            value={Number.isFinite(tank.treatedShare) ? `${num(fractionToPercent(tank.treatedShare), 0)} %` : '—'}
          />
          {draw('Into the mash', volumes.mashWaterGal, tank.mashSalts)}
          {draw('Carried by the sparge', volumes.spargeGal, tank.spargeSalts)}
          {draw('Left in the HLT, not used', tank.leftGal, tank.leftSalts)}
          {warnings.mashOverTreated && (
            <Warning>
              The mash water ({v(volumes.mashWaterGal)} {unit}) is more than the HLT's treated volume (
              {v(volumes.treatedGal)} {unit})
            </Warning>
          )}
          {warnings.spargeOverTopUp && (
            <Warning>
              The sparge water ({v(volumes.spargeGal)} {unit}) is more than the HLT's top-up level ({v(tank.topUpGal)}{' '}
              {unit})
            </Warning>
          )}
          {warnings.topUpBelowTreated && (
            <Warning>
              The HLT's top-up level ({v(tank.topUpGal)} {unit}) is below the treated water the mash leaves (
              {v(tank.remainingGal)} {unit}): no untreated water is added
            </Warning>
          )}
        </>
      )}
    </Card>
  );
}

const choiceGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '0.6rem 1rem',
  marginBottom: '0.6rem',
};

const choiceStyle = { display: 'flex', flexDirection: 'column', minWidth: 0 };

const checkStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.85rem',
  color: colors.textPrimary,
  cursor: 'pointer',
  padding: '0.3rem 0 0.4rem',
};

const readRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: '0.6rem 0',
  borderBottom: `1px solid ${colors.rowDivider}`,
  gap: '0.75rem',
};

const readLabelStyle = { fontSize: '0.92rem', color: colors.textPrimary, fontWeight: 500 };

const unitStyle = { fontSize: '0.78rem', color: colors.textMuted, marginLeft: '0.4rem' };

const readValueStyle = {
  fontSize: '0.95rem',
  fontWeight: 600,
  color: colors.textSecondary,
  fontVariantNumeric: 'tabular-nums',
};

const drawRowStyle = { padding: '0.5rem 0', borderBottom: `1px solid ${colors.rowDivider}` };

const drawSaltStyle = { fontSize: '0.8rem', color: colors.textMuted, marginTop: '0.2rem' };
