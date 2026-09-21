// VolumesSection.jsx
// Mash thickness and every volume: mash water, the boil rows, and the
// fermentation volume. Volumes are entered in the current display unit and
// converted to canonical gallons at the boundary. Mash water is the one volume
// the engine wants as entered; it is still entered in display units here and
// converted for storage. Boil time is in minutes. Post-boil volume (already at
// the 60 degF reference), mash Rv, and mash R are read-only from the engine.
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import StatBox from './shared/StatBox.jsx';
import { colors, tokens } from './shared/styles.js';
import {
  volumeToCanonical,
  volumeFromCanonical,
  volumeUnit,
  mashRvUnit,
  mashRUnit,
  tempUnit,
} from '../display.js';
import { num } from '../format.js';

export default function VolumesSection({ recipe, grist, postBoilVolGal, mode, setField }) {
  const vUnit = volumeUnit(mode);

  // Convert a canonical-gal state field through the display boundary for InputRow.
  // InputRow passes the native event; we parse and convert the value back.
  const volRow = (field) => ({
    value: Number(volumeFromCanonical(recipe[field], mode).toFixed(6)),
    onChange: (e) => {
      const v = parseFloat(e.target.value);
      if (Number.isFinite(v)) setField(field, volumeToCanonical(v, mode));
    },
  });

  return (
    <Card>
      <span style={tokens.cardLabel}>Volumes</span>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
        <div>
          <span style={{ ...tokens.cardLabel, marginBottom: '0.3rem', fontSize: '0.65rem' }}>Mash</span>
          <InputRow label={`Mash water (${vUnit})`} step={0.1} min={0} {...volRow('mashWaterGal')} />
          <InputRow
            label={`Mash Rv (${mashRvUnit()})`}
            value={Number(grist.mashRv.toFixed(3))}
            onChange={() => {}}
            readOnly
          />
          <InputRow
            label={`Mash R (${mashRUnit()})`}
            value={Number(grist.mashR.toFixed(3))}
            onChange={() => {}}
            readOnly
          />
        </div>

        <div>
          <span style={{ ...tokens.cardLabel, marginBottom: '0.3rem', fontSize: '0.65rem' }}>Boil</span>
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
          <InputRow
            label={`Post-boil volume at 60 ${tempUnit()} (${vUnit})`}
            value={Number(volumeFromCanonical(postBoilVolGal, mode).toFixed(3))}
            onChange={() => {}}
            readOnly
          />

          <span style={{ ...tokens.cardLabel, marginTop: '0.85rem', marginBottom: '0.3rem', fontSize: '0.65rem' }}>Ferment</span>
          <InputRow
            label={`Fermentation volume (${vUnit})`}
            value={Number(volumeFromCanonical(recipe.fermentVolGal, mode).toFixed(6))}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (Number.isFinite(v)) setField('fermentVolGal', volumeToCanonical(v, mode));
            }}
            step={0.1}
            min={0}
          />
        </div>
      </div>
    </Card>
  );
}
