// VolumesSection.jsx
// Mash thickness and every volume: mash water, the boil rows, and the
// fermentation volume. Volumes are entered in the current display unit and
// converted to canonical gallons at the boundary. Mash water is the one volume
// the engine wants as entered; it is still entered in display units here and
// converted for storage. Boil time is in minutes. Post-boil volume (already at
// the 60 degF reference), mash Rv, and mash R are read-only from the engine.
// When the post-boil volume is measured at another temperature, the volume as
// it will read there shows above its 60 degF figure (computeRecipe's
// postBoilMeasuredGal and postBoilMeasuredShown).
// Design warnings (computeRecipe's `warnings`) show as an amber line under
// the value they are about: a mash ratio outside the owner's recommended
// range (text from the engine's range constants), and less wort after the
// boil than the fermenter volume. They change no number and block nothing.
import { MASH_RV_RANGE_QT_PER_LB, MASH_R_RANGE_LB_PER_LB, REFERENCE_TEMP_F } from '@brew/engine';
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import { tokens } from './shared/styles.js';
import usePhone from './shared/usePhone.js';
import {
  volumeToCanonical,
  volumeFromCanonical,
  volumeUnit,
  mashRvUnit,
  mashRUnit,
  tempUnit,
} from '../display.js';
import { num } from '../format.js';

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
export const volumeChange = (setField, field, mode) => (e) =>
  setField(field, volumeToCanonical(parseFloat(e.target.value), mode));

// A canonical-gal figure as a volume box shows it: blank shows empty.
const volumeShown = (gal, mode) =>
  Number.isFinite(gal) ? Number(volumeFromCanonical(gal, mode).toFixed(6)) : '';

// A temperature as typed: whole degrees as whole, otherwise one decimal.
const temperature = (tempF) => num(tempF, Number.isInteger(tempF) ? 0 : 1);

export default function VolumesSection({
  recipe,
  grist,
  postBoilVolGal,
  postBoilMeasuredGal,
  postBoilMeasuredShown,
  warnings,
  mode,
  setField,
}) {
  const phone = usePhone();
  const vUnit = volumeUnit(mode);

  // Convert a canonical-gal state field through the display boundary for InputRow.
  // InputRow passes the native event; we parse and convert the value back.
  const volRow = (field) => ({
    value: volumeShown(recipe[field], mode),
    onChange: volumeChange(setField, field, mode),
  });

  return (
    <Card>
      <span style={tokens.cardLabel}>Volumes</span>

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
              label={`Post-boil volume at ${temperature(recipe.measurementTempF.postBoil)} ${tempUnit()} (${vUnit})`}
              value={Number(volumeFromCanonical(postBoilMeasuredGal, mode).toFixed(3))}
              onChange={() => {}}
              readOnly
            />
          )}
          <InputRow
            label={`Post-boil volume at ${REFERENCE_TEMP_F} ${tempUnit()} (${vUnit})`}
            value={Number(volumeFromCanonical(postBoilVolGal, mode).toFixed(3))}
            onChange={() => {}}
            readOnly
          />

          <span style={{ ...tokens.cardLabel, marginTop: '0.85rem', marginBottom: '0.3rem', fontSize: '0.65rem' }}>Ferment</span>
          <InputRow label={`Fermentation volume (${vUnit})`} step={0.1} min={0} {...volRow('fermentVolGal')} />
          {warnings.postBoilBelowFerment && <Warning>Less wort after the boil than the fermenter volume</Warning>}
        </div>
      </div>
    </Card>
  );
}
