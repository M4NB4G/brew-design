// OptionsSection.jsx
// The Options tab: the temperature (degF) each volume was measured at, one
// editable field per corrected kind, each followed by the volume at the
// engine's 60 degF reference as the engine receives it (read-only, from
// computeRecipe's refVolumesGal — nothing is computed here). A temperature is
// stored in degF as typed: canonical and display unit are the same. A
// non-finite entry is not written to state; a non-finite state value shows as
// an empty field, and its reference volume as "—", like any cleared field.
//
// Below them, My brewery (Brewery defaults, 2026-09-23): the brewery's own
// figures, which a new recipe starts from. They are held in the recipe's
// units (state.js) and shown in the current mode's units through display.js;
// an emptied field is a blank figure (null), which a new recipe fills with
// the built-in figure. Editing them never touches the recipe on screen.
import { REFERENCE_TEMP_F } from '@brew/engine';
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import { colors, radii, tokens } from './shared/styles.js';
import {
  volumeToCanonical,
  volumeFromCanonical,
  volumeUnit,
  tempUnit,
  percentUnit,
  fractionToPercent,
  percentToFraction,
  gravityUnitLabel,
} from '../display.js';
import { num, roundForInput } from '../format.js';
import { DEFAULT_DISPLAY } from '../state.js';

const KINDS = [
  ['preBoil', 'Pre-boil volume measured at'],
  ['postBoil', 'Post-boil volume measured at'],
  ['ferment', 'Fermentation volume measured at'],
];

const MODE_LABELS = { home: 'Home', pro: 'Pro' };

// Outlined button, as "+ Add malt".
const button = {
  padding: '0.38rem 0.9rem',
  background: 'transparent',
  border: `1px solid ${colors.inputBorder}`,
  borderRadius: radii.btn,
  color: colors.textSecondary,
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

// A brewery figure's field: blank shows empty; emptying the field blanks the
// figure (null); an entry that is not a number is ignored. `toShown` and
// `fromShown` convert through display.js.
function FigureRow({ label, value, onChange, toShown = (v) => v, fromShown = (v) => v, step = 0.1 }) {
  return (
    <InputRow
      label={label}
      value={value === null ? '' : roundForInput(toShown(value))}
      onChange={(e) => {
        if (e.target.value === '') return onChange(null);
        const v = parseFloat(e.target.value);
        if (Number.isFinite(v)) onChange(fromShown(v));
      }}
      step={step}
      min={0}
    />
  );
}

// A choice with a blank option that names the built-in one.
function ChoiceRow({ label, value, onChange, options, builtIn }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.6rem 0',
        borderBottom: `1px solid ${colors.rowDivider}`,
        gap: '0.75rem',
      }}
    >
      <span style={{ fontSize: '0.92rem', color: colors.textPrimary, fontWeight: 500 }}>{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
        style={{ ...tokens.select, width: 'auto', padding: '0.4rem 0.55rem', fontSize: '0.92rem' }}
      >
        <option value="">Built-in ({builtIn})</option>
        {options.map(([id, text]) => (
          <option key={id} value={id}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function OptionsSection({
  measurementTempF,
  refVolumesGal,
  mode,
  setMeasurementTemp,
  brewery,
  setBreweryFigure,
  setBreweryTemp,
  onUseRecipeFigures,
  onForgetBrewery,
}) {
  const vUnit = volumeUnit(mode);
  const tUnit = tempUnit();
  const volume = {
    toShown: (gal) => volumeFromCanonical(gal, mode),
    fromShown: (v) => volumeToCanonical(v, mode),
  };

  return (
    <>
    <Card>
      <span style={tokens.cardLabel}>This recipe — measurement temperatures</span>
      <p style={{ ...tokens.notice, marginTop: 0, marginBottom: '0.5rem' }}>
        Volumes are corrected to the {REFERENCE_TEMP_F} {tUnit} reference from the temperature they were
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
              label={`at ${REFERENCE_TEMP_F} ${tUnit} (${vUnit})`}
              value={num(volumeFromCanonical(refVolumesGal[kind], mode), 3)}
              onChange={() => {}}
              readOnly
            />
          </div>
        );
      })}
    </Card>

    <Card>
      <span style={tokens.cardLabel}>My brewery</span>
      <p style={{ ...tokens.notice, marginTop: 0, marginBottom: '0.5rem' }}>
        Your brewery's figures, kept in this browser. A new recipe — Reset to defaults, or a
        first visit — starts from them; a blank one uses the built-in figure. Changing these
        does not change the recipe above, a saved recipe or a recipe file.
      </p>

      <span style={{ ...tokens.cardLabel, marginBottom: '0.3rem', fontSize: '0.65rem' }}>New recipes start from</span>

      <FigureRow
        label={`Batch (fermentation) volume (${vUnit})`}
        value={brewery.fermentVolGal}
        onChange={(v) => setBreweryFigure('fermentVolGal', v)}
        {...volume}
      />
      <FigureRow
        label={`Pre-boil volume (${vUnit})`}
        value={brewery.preBoilVolGal}
        onChange={(v) => setBreweryFigure('preBoilVolGal', v)}
        {...volume}
      />
      <FigureRow
        label={`Boil-off rate (${vUnit}/hr)`}
        value={brewery.boilOffRateGalPerHr}
        onChange={(v) => setBreweryFigure('boilOffRateGalPerHr', v)}
        {...volume}
      />
      <FigureRow
        label="Boil time (min)"
        value={brewery.boilTimeMin}
        onChange={(v) => setBreweryFigure('boilTimeMin', v)}
        step={1}
      />
      {KINDS.map(([kind, label]) => (
        <FigureRow
          key={kind}
          label={`${label} (${tUnit})`}
          value={brewery.measurementTempF[kind]}
          onChange={(v) => setBreweryTemp(kind, v)}
          step={1}
        />
      ))}
      <FigureRow
        label={`Brewhouse efficiency (${percentUnit()})`}
        value={brewery.efficiency}
        onChange={(v) => setBreweryFigure('efficiency', v)}
        toShown={(f) => Number(fractionToPercent(f).toFixed(4))}
        fromShown={percentToFraction}
        step={1}
      />
      <ChoiceRow
        label="Home / Pro"
        value={brewery.mode}
        onChange={(v) => setBreweryFigure('mode', v)}
        options={Object.entries(MODE_LABELS)}
        builtIn={MODE_LABELS[DEFAULT_DISPLAY.mode]}
      />
      <ChoiceRow
        label="Pro gravity unit"
        value={brewery.proGravityUnit}
        onChange={(v) => setBreweryFigure('proGravityUnit', v)}
        options={['plato', 'sg'].map((u) => [u, gravityUnitLabel(u)])}
        builtIn={gravityUnitLabel(DEFAULT_DISPLAY.proGravityUnit)}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.85rem' }}>
        <button type="button" onClick={onUseRecipeFigures} style={button}>
          Use this recipe's figures
        </button>
        <button type="button" onClick={onForgetBrewery} style={button}>
          Forget my brewery figures
        </button>
      </div>
    </Card>
    </>
  );
}
