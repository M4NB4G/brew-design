// VolumesSection.jsx
// Mash thickness and every volume: mash water, the boil rows, and the
// fermentation volume. Volumes are entered in the current display unit (Home
// gal; Pro bbl, or gal by Pro's volume choice, PU-S2) and
// converted to canonical gallons at the boundary. Mash water is the one volume
// the engine wants as entered; it is still entered in display units here and
// converted for storage. Boil time is in minutes. Post-boil volume (already at
// the 60 degF reference), mash Rv, and mash R are read-only from the engine.
// When the post-boil volume is measured at another temperature, the volume as
// it will read there shows above its 60 degF figure (computeRecipe's
// postBoilMeasuredGal and postBoilMeasuredShown).
// Each volume the engine corrects has its measurement temperature under it,
// in the header's unit (°F as stored, or °C converted at the boundary,
// display.js), with the volume at the engine's 60 degF reference as the
// engine receives it (read-only, from computeRecipe's refVolumesGal; nothing
// is computed here). An emptied temperature is a blank one (NaN), never the
// old one: it shows as an empty box and its reference volume as "—", like
// any cleared field.
// Design warnings (computeRecipe's `warnings`) show as an amber line under
// the value they are about: a mash ratio outside the owner's recommended
// range (text from the engine's range constants), and less wort after the
// boil than the fermenter volume. They change no number and block nothing.
// Water back (docs/items/water-back.md, WB-S1 to WB-S3): a check under the
// fermentation volume, off by default. When on
// (docs/items/water-back-in-fermentation-volume.md, WF-S2, WF-S7), the
// fermentation volume box is the wort from kettle, the check under it, then
// the water back's volume box and its measurement temperature; at the bottom
// the fermentation volume, worked out (computeRecipe's fermentGal), its
// measurement temperature and its volume at 60 degF (pitchGal), and the OG
// and IBU of the wort from kettle (knockOut), read-only.
import { MASH_RV_RANGE_QT_PER_LB, MASH_R_RANGE_LB_PER_LB } from '@brew/engine';
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import { colors, tokens } from './shared/styles.js';
import usePhone from './shared/usePhone.js';
import {
  volumeToCanonical,
  volumeFromCanonical,
  volumeUnit,
  volumesInBarrels,
  mashRvUnit,
  mashRUnit,
  tempUnit,
  tempToCanonical,
  tempBoxValue,
  tempReadout,
  referenceTemp,
  resolveGravityUnit,
  gravityFromCanonical,
  gravityUnitLabel,
} from '../display.js';
import { num, gravity } from '../format.js';

// "Should be 1.25–2 qt/lb": a recommended range, as the owner's cell reads it.
function shouldBe({ low, high }, unit) {
  return `Should be ${low}–${high} ${unit}`;
}

function Warning({ children }) {
  return (
    <p role="status" style={tokens.warning}>
      {children}
    </p>
  );
}

// A volume box's change: the entry in the display unit, converted to
// canonical gal. An emptied box is a blank figure (NaN), never the old number.
export const volumeChange = (setField, field, mode, proVolumeUnit) => (e) =>
  setField(field, volumeToCanonical(parseFloat(e.target.value), mode, proVolumeUnit));

// A canonical-gal figure as a volume box shows it: blank shows empty.
// Away from the cursor it shows the printed sheet's precision, gal to 0.01
// and bbl to 0.001; with the cursor in it, the full figure (BA1).
const volumeShown = (gal, mode, proVolumeUnit, digits = 6) =>
  Number.isFinite(gal) ? Number(volumeFromCanonical(gal, mode, proVolumeUnit).toFixed(digits)) : '';
const volumeDigits = (mode, proVolumeUnit) => (volumesInBarrels(mode, proVolumeUnit) ? 3 : 2);

// A measurement temperature box's change: the entry in the header's unit,
// converted to degF; an emptied box is a blank temperature (NaN).
export const temperatureChange = (setMeasurementTemp, kind, temperatureUnit) => (e) =>
  setMeasurementTemp(kind, tempToCanonical(parseFloat(e.target.value), temperatureUnit));

const checkStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.85rem',
  color: colors.textPrimary,
  cursor: 'pointer',
  padding: '0.6rem 0 0.4rem',
};

export default function VolumesSection({
  recipe,
  grist,
  postBoilVolGal,
  postBoilMeasuredGal,
  postBoilMeasuredShown,
  refVolumesGal,
  warnings,
  fermentGal,
  pitchGal,
  knockOut,
  mode,
  proGravityUnit,
  proVolumeUnit,
  temperatureUnit,
  setField,
  setMeasurementTemp,
  setWaterBack,
}) {
  const phone = usePhone();
  const vUnit = volumeUnit(mode, proVolumeUnit);
  const fromGal = (gal) => volumeFromCanonical(gal, mode, proVolumeUnit);
  const tUnit = tempUnit(temperatureUnit);
  const refTemp = referenceTemp(temperatureUnit);
  const gu = resolveGravityUnit(mode, proGravityUnit);
  const waterBack = recipe.waterBack;

  // A volume's measurement temperature box, and that volume at the reference.
  const tempRow = (kind, label) => {
    const tempF = recipe.measurementTempF[kind];
    return (
      <InputRow
        label={`${label} measured at (${tUnit})`}
        value={Number.isFinite(tempF) ? tempBoxValue(tempF, temperatureUnit) : ''}
        onChange={temperatureChange(setMeasurementTemp, kind, temperatureUnit)}
        step={temperatureUnit === 'C' ? 0.1 : 1}
      />
    );
  };
  const refRow = (kind, label) => (
    <InputRow
      label={`${label} at ${refTemp} ${tUnit} (${vUnit})`}
      value={num(fromGal(refVolumesGal[kind]), 3)}
      onChange={() => {}}
      readOnly
    />
  );

  const waterBackCheck = (
    <label style={checkStyle}>
      <input
        type="checkbox"
        checked={waterBack.on}
        onChange={(e) => setWaterBack('on', e.target.checked)}
        style={{ marginRight: '0.4rem', accentColor: colors.accent }}
      />
      Water back
    </label>
  );

  // Convert a canonical-gal state field through the display boundary for InputRow.
  // InputRow passes the native event; we parse and convert the value back.
  const volRow = (field) => ({
    value: volumeShown(recipe[field], mode, proVolumeUnit, volumeDigits(mode, proVolumeUnit)),
    editValue: volumeShown(recipe[field], mode, proVolumeUnit),
    onChange: volumeChange(setField, field, mode, proVolumeUnit),
  });

  return (
    <Card>
      <span style={tokens.cardLabel}>Volumes</span>
      <p style={{ ...tokens.notice, marginTop: 0, marginBottom: '0.5rem' }}>
        Volumes are corrected to the {refTemp} {tUnit} reference from the temperature they were
        measured at; mash water is used as entered.
      </p>

      {/* Phone: one column, Mash then Boil then Ferment */}
      <div style={{ display: 'grid', gridTemplateColumns: phone ? '1fr' : '1fr 1fr', gap: '0 1.5rem' }}>
        <div>
          <span style={{ ...tokens.cardLabel, marginBottom: '0.3rem', fontSize: '0.65rem' }}>Mash</span>
          <InputRow label={`Mash water (${vUnit})`} step={0.1} min={0} {...volRow('mashWaterGal')} />
          <InputRow
            label={`Mash Rv (${mashRvUnit()})`}
            value={Number(grist.mashRv.toFixed(3))}
            onChange={() => {}}
            readOnly
          />
          {warnings.mashRv && <Warning>{shouldBe(MASH_RV_RANGE_QT_PER_LB, mashRvUnit())}</Warning>}
          <InputRow
            label={`Mash R (${mashRUnit()})`}
            value={Number(grist.mashR.toFixed(3))}
            onChange={() => {}}
            readOnly
          />
          {warnings.mashR && <Warning>{shouldBe(MASH_R_RANGE_LB_PER_LB, mashRUnit())}</Warning>}
        </div>

        <div>
          <span style={{ ...tokens.cardLabel, ...(phone && { marginTop: '0.85rem' }), marginBottom: '0.3rem', fontSize: '0.65rem' }}>Boil</span>
          <InputRow label={`Pre-boil volume (${vUnit})`} step={0.1} min={0} {...volRow('preBoilVolGal')} />
          {tempRow('preBoil', 'Pre-boil volume')}
          {refRow('preBoil', 'Pre-boil volume')}
          <InputRow
            label={`Boil-off rate (${vUnit}/hr)`}
            step={0.1}
            min={0}
            {...volRow('boilOffRateGalPerHr')}
          />
          <InputRow
            label="Boil time (min)"
            value={recipe.boilTimeMin}
            onChange={(e) => setField('boilTimeMin', parseFloat(e.target.value))}
            step={1}
            min={0}
          />
          {postBoilMeasuredShown && (
            <InputRow
              label={`Post-boil volume at ${tempReadout(recipe.measurementTempF.postBoil, temperatureUnit)} ${tUnit} (${vUnit})`}
              value={Number(fromGal(postBoilMeasuredGal).toFixed(3))}
              onChange={() => {}}
              readOnly
            />
          )}
          <InputRow
            label={`Post-boil volume at ${refTemp} ${tUnit} (${vUnit})`}
            value={Number(fromGal(postBoilVolGal).toFixed(3))}
            onChange={() => {}}
            readOnly
          />
          {tempRow('postBoil', 'Post-boil volume')}

          <span style={{ ...tokens.cardLabel, marginTop: '0.85rem', marginBottom: '0.3rem', fontSize: '0.65rem' }}>Ferment</span>
          {!waterBack.on ? (
            <>
              <InputRow label={`Fermentation volume (${vUnit})`} step={0.1} min={0} {...volRow('fermentVolGal')} />
              {tempRow('ferment', 'Fermentation volume')}
              {refRow('ferment', 'Fermentation volume')}
              {warnings.postBoilBelowFerment && <Warning>Less wort after the boil than the fermenter volume</Warning>}
              {waterBackCheck}
            </>
          ) : (
            <>
              <InputRow label={`Wort from kettle (${vUnit})`} step={0.1} min={0} {...volRow('fermentVolGal')} />
              {warnings.postBoilBelowFerment && <Warning>Less wort after the boil than the wort from kettle</Warning>}
              {waterBackCheck}
              <InputRow
                label={`Water back (${vUnit})`}
                step={0.1}
                min={0}
                value={volumeShown(waterBack.volumeGal, mode, proVolumeUnit, volumeDigits(mode, proVolumeUnit))}
                editValue={volumeShown(waterBack.volumeGal, mode, proVolumeUnit)}
                onChange={(e) => setWaterBack('volumeGal', volumeToCanonical(parseFloat(e.target.value), mode, proVolumeUnit))}
              />
              <InputRow
                label={`Water back measured at (${tUnit})`}
                value={Number.isFinite(waterBack.tempF) ? tempBoxValue(waterBack.tempF, temperatureUnit) : ''}
                onChange={(e) => setWaterBack('tempF', tempToCanonical(parseFloat(e.target.value), temperatureUnit))}
                step={temperatureUnit === 'C' ? 0.1 : 1}
              />
              <InputRow label={`Fermentation volume (${vUnit})`} value={num(fromGal(fermentGal), 3)} onChange={() => {}} readOnly />
              {tempRow('ferment', 'Fermentation volume')}
              <InputRow
                label={`Fermentation volume at ${refTemp} ${tUnit} (${vUnit})`}
                value={num(fromGal(pitchGal), 3)}
                onChange={() => {}}
                readOnly
              />
              <InputRow
                label={`Wort from kettle OG (${gravityUnitLabel(gu)})`}
                value={gravity(gravityFromCanonical(knockOut?.OG, gu), gu)}
                onChange={() => {}}
                readOnly
              />
              <InputRow label="Wort from kettle IBU" value={num(knockOut?.IBU, 0)} onChange={() => {}} readOnly />
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
