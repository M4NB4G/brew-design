// OptionsSection.jsx
// The Options tab: the temperature (degF) each volume was measured at, one
// editable field per corrected kind, each followed by the volume at the
// engine's 60 degF reference as the engine receives it (read-only, from
// computeRecipe's refVolumesGal — nothing is computed here). A temperature is
// stored in degF as typed: canonical and display unit are the same. A
// non-finite entry is not written to state; a non-finite state value shows as
// an empty field, and its reference volume as "—", like any cleared field.
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import { tokens } from './shared/styles.js';
import { volumeFromCanonical, volumeUnit, tempUnit } from '../display.js';
import { num } from '../format.js';

const KINDS = [
  ['preBoil', 'Pre-boil volume measured at'],
  ['postBoil', 'Post-boil volume measured at'],
  ['ferment', 'Fermentation volume measured at'],
];

export default function OptionsSection({ measurementTempF, refVolumesGal, mode, setMeasurementTemp }) {
  const vUnit = volumeUnit(mode);
  const tUnit = tempUnit();

  return (
    <Card>
      <span style={tokens.cardLabel}>Measurement temperatures</span>
      <p style={{ ...tokens.notice, marginTop: 0, marginBottom: '0.5rem' }}>
        Volumes are corrected to the 60 {tUnit} reference from the temperature they were
        measured at; mash water is used as entered.
      </p>

      {KINDS.map(([kind, label]) => {
        const tempF = measurementTempF[kind];
        return (
          <div key={kind}>
            <InputRow
              label={`${label} (${tUnit})`}
              value={Number.isFinite(tempF) ? tempF : ''}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (Number.isFinite(v)) setMeasurementTemp(kind, v);
              }}
              step={1}
            />
            <InputRow
              label={`at 60 ${tUnit} (${vUnit})`}
              value={num(volumeFromCanonical(refVolumesGal[kind], mode), 3)}
              onChange={() => {}}
              readOnly
            />
          </div>
        );
      })}
    </Card>
  );
}
