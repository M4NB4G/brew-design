// OptionsSection.jsx
// The Options tab: My brewery (Brewery defaults, 2026-09-23), the brewery's own
// figures, which a new recipe starts from. They are held in the recipe's
// units (state.js) and shown in the current mode's units through display.js;
// an emptied field is a blank figure (null), which a new recipe fills with
// the built-in figure. Editing them never touches the recipe on screen.
// Their Water group (Water saved with the recipe, S7): the usual treatment
// and kettle switch, the water setup, the usual water report and the salts
// on hand. My ingredients (MI-S5'): the brewer's own malts and hops, saved
// from their name boxes, each with a Delete that changes no recipe.
import { useRef } from 'react';
import { SALT_CONTRIBUTIONS_PER_G_GAL } from '@brew/engine';
import Card from './shared/Card.jsx';
import InputRow from './shared/InputRow.jsx';
import { colors, radii, tokens } from './shared/styles.js';
import {
  volumeToCanonical,
  volumeFromCanonical,
  volumeUnit,
  tempUnit,
  tempToCanonical,
  tempBoxValue,
  TEMPERATURE_UNITS,
  PRO_VOLUME_UNITS,
  PRO_MALT_UNITS,
  maltWeightUnit,
  percentUnit,
  fractionToPercent,
  percentToFraction,
  gravityUnitLabel,
  mashRvUnit,
} from '../display.js';
import { roundForInput } from '../format.js';
import { suggestionDetail } from '../ingredient-search.js';
import { DEFAULT_DISPLAY, newRecipe } from '../state.js';
import { defaultWaterState, TEST_RESULT_KEYS } from '../water-state.js';
import { REPORT_LABELS } from './water/WaterInScreen.jsx';
import { VESSEL_LABELS, SPARGE_LABELS, TREATMENT_LABELS } from './water/WaterGoesCard.jsx';

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
// `fromShown` convert through display.js. A blank box names, greyed, the
// built-in figure a new recipe gets in its place (`builtIn`, canonical, shown
// as the box's own value is; none when the built-in figure is itself blank).
function FigureRow({ label, value, onChange, builtIn, toShown = (v) => v, fromShown = (v) => v, step = 0.1 }) {
  return (
    <InputRow
      label={label}
      value={value === null ? '' : roundForInput(toShown(value))}
      placeholder={
        value === null && Number.isFinite(builtIn) ? String(roundForInput(toShown(builtIn))) : undefined
      }
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
        aria-label={label}
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

// My brewery's water (Water saved with the recipe, S7): the usual treatment
// and kettle switch, the water setup, the usual water report and the salts on
// hand, each blank until set — a new recipe then takes the built-in one,
// named in each choice and in the salts' line.
function BreweryWater({ water, setBreweryWater, volume, vUnit }) {
  const built = defaultWaterState();
  const onHand = water.enabledSalts;
  const toggleSalt = (key) => {
    const now = onHand ?? built.enabledSalts;
    setBreweryWater('enabledSalts', now.includes(key) ? now.filter((k) => k !== key) : [...now, key]);
  };
  const yesNo = { true: 'Yes', false: 'No' };
  return (
    <>
      <span style={{ ...tokens.cardLabel, marginTop: '0.85rem', marginBottom: '0.3rem', fontSize: '0.65rem' }}>Water</span>
      <ChoiceRow
        label="Vessels"
        value={water.vessels}
        onChange={(v) => setBreweryWater('vessels', v === null ? null : Number(v))}
        options={Object.entries(VESSEL_LABELS)}
        builtIn={VESSEL_LABELS[built.vessels]}
      />
      <ChoiceRow
        label="Sparge"
        value={water.spargeMethod}
        onChange={(v) => setBreweryWater('spargeMethod', v)}
        options={Object.entries(SPARGE_LABELS)}
        builtIn={SPARGE_LABELS[built.spargeMethod]}
      />
      <ChoiceRow
        label="Treat"
        value={water.treatment}
        onChange={(v) => setBreweryWater('treatment', v)}
        options={Object.entries(TREATMENT_LABELS)}
        builtIn={TREATMENT_LABELS[built.treatment]}
      />
      <ChoiceRow
        label="Salts also go in the kettle"
        value={water.kettleSalts === null ? null : String(water.kettleSalts)}
        onChange={(v) => setBreweryWater('kettleSalts', v === null ? null : v === 'true')}
        options={Object.entries(yesNo)}
        builtIn={yesNo[built.kettleSalts]}
      />
      <FigureRow
        label={`Treated volume (${vUnit})`}
        value={water.tankTreatedGal}
        builtIn={built.tankTreatedGal}
        onChange={(v) => setBreweryWater('tankTreatedGal', v)}
        {...volume}
      />
      <FigureRow
        label={`Top-up level (${vUnit})`}
        value={water.tankTopUpGal}
        builtIn={built.tankTopUpGal}
        onChange={(v) => setBreweryWater('tankTopUpGal', v)}
        {...volume}
      />
      <FigureRow
        label={`Grain absorption (${mashRvUnit()})`}
        value={water.absorptionQtPerLb}
        builtIn={built.absorptionQtPerLb}
        onChange={(v) => setBreweryWater('absorptionQtPerLb', v)}
        step={0.01}
      />
      {TEST_RESULT_KEYS.map((k) => (
        <FigureRow
          key={k}
          label={`${REPORT_LABELS[k]} (${k === 'pH' ? 'SU' : 'ppm'})`}
          value={water.source[k]}
          builtIn={built.source[k]}
          onChange={(v) => setBreweryWater('source', { ...water.source, [k]: v })}
        />
      ))}
      <div style={{ padding: '0.6rem 0', borderBottom: `1px solid ${colors.rowDivider}` }}>
        <span style={{ fontSize: '0.92rem', color: colors.textPrimary, fontWeight: 500 }}>Salts on hand</span>
        {onHand === null && (
          <span style={{ fontSize: '0.78rem', color: colors.textMuted, marginLeft: '0.4rem' }}>Built-in (all)</span>
        )}
        <div style={saltGridStyle}>
          {Object.entries(SALT_CONTRIBUTIONS_PER_G_GAL).map(([key, meta]) => (
            <label key={key} style={saltCheckStyle}>
              <input
                type="checkbox"
                checked={(onHand ?? built.enabledSalts).includes(key)}
                onChange={() => toggleSalt(key)}
                style={{ marginRight: '0.4rem', accentColor: colors.accent }}
              />
              {meta.name}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

// My ingredients (MI-S5'): each malt and hop the brewer saved, with the
// numbers its suggestion shows and a Delete. A recipe keeps its own copy of
// every number, so deleting one changes no recipe.
function MyIngredients({ mine, onDelete }) {
  const groups = [
    ['malts', 'Malts', 'malts'],
    ['hops', 'Hops', 'kettleAdditions'],
  ].filter(([list]) => mine[list].length > 0);
  return (
    <>
      <span style={{ ...tokens.cardLabel, marginTop: '0.85rem', marginBottom: '0.3rem', fontSize: '0.65rem' }}>My ingredients</span>
      {groups.length === 0 && (
        <p style={{ ...tokens.notice, marginTop: 0, marginBottom: '0.3rem' }}>
          None saved yet. Type a malt or boil hop that is not on the ingredient list in its name box, then choose
          “Save to my ingredients”.
        </p>
      )}
      {groups.map(([list, heading, field]) => (
        <div key={list}>
          <span style={{ fontSize: '0.78rem', color: colors.textSecondary, fontWeight: 600 }}>{heading}</span>
          {mine[list].map((item) => (
            <div key={item.name} style={ingredientRowStyle}>
              <span style={{ fontSize: '0.92rem', color: colors.textPrimary, fontWeight: 500 }}>{item.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', color: colors.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
                  {suggestionDetail(field, item)}
                </span>
                <button
                  type="button"
                  aria-label={`Delete ${item.name} from My ingredients`}
                  onClick={() => onDelete(list, item.name)}
                  style={{ ...button, padding: '0.25rem 0.7rem', fontSize: '0.8rem' }}
                >
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

const ingredientRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.4rem 0.75rem',
  padding: '0.45rem 0',
  borderBottom: `1px solid ${colors.rowDivider}`,
};

const saltGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: '0.4rem 1rem',
  marginTop: '0.5rem',
};

const saltCheckStyle = {
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.82rem',
  color: colors.textPrimary,
  cursor: 'pointer',
};

export default function OptionsSection({
  mode,
  proVolumeUnit,
  temperatureUnit,
  brewery,
  setBreweryFigure,
  setBreweryTemp,
  setBreweryWater,
  onDeleteIngredient,
  onUseRecipeFigures,
  onForgetBrewery,
  onExportBrewery,
  onImportBreweryFile,
  breweryFileMessage,
}) {
  const breweryFile = useRef(null); // the brewery file's picker (S4b item 5)
  const vUnit = volumeUnit(mode, proVolumeUnit);
  const tUnit = tempUnit(temperatureUnit);
  const built = newRecipe(brewery).recipe; // the figures a new recipe gets in place of a blank one (scaled to its batch, PD-B2, NB-S4)
  const volume = {
    toShown: (gal) => volumeFromCanonical(gal, mode, proVolumeUnit),
    fromShown: (v) => volumeToCanonical(v, mode, proVolumeUnit),
  };
  const temperature = {
    toShown: (tempF) => tempBoxValue(tempF, temperatureUnit),
    fromShown: (v) => tempToCanonical(v, temperatureUnit),
    step: temperatureUnit === 'C' ? 0.1 : 1,
  };

  return (
    <>
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
        builtIn={built.fermentVolGal}
        onChange={(v) => setBreweryFigure('fermentVolGal', v)}
        {...volume}
      />
      <FigureRow
        label={`Pre-boil volume (${vUnit})`}
        value={brewery.preBoilVolGal}
        builtIn={built.preBoilVolGal}
        onChange={(v) => setBreweryFigure('preBoilVolGal', v)}
        {...volume}
      />
      <FigureRow
        label={`Boil-off rate (${vUnit}/hr)`}
        value={brewery.boilOffRateGalPerHr}
        builtIn={built.boilOffRateGalPerHr}
        onChange={(v) => setBreweryFigure('boilOffRateGalPerHr', v)}
        {...volume}
      />
      <FigureRow
        label="Boil time (min)"
        value={brewery.boilTimeMin}
        builtIn={built.boilTimeMin}
        onChange={(v) => setBreweryFigure('boilTimeMin', v)}
        step={1}
      />
      {KINDS.map(([kind, label]) => (
        <FigureRow
          key={kind}
          label={`${label} (${tUnit})`}
          value={brewery.measurementTempF[kind]}
          builtIn={built.measurementTempF[kind]}
          onChange={(v) => setBreweryTemp(kind, v)}
          {...temperature}
        />
      ))}
      <FigureRow
        label={`Brewhouse efficiency (${percentUnit()})`}
        value={brewery.efficiency}
        builtIn={built.efficiency}
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
      <ChoiceRow
        label="Pro volume unit"
        value={brewery.proVolumeUnit}
        onChange={(v) => setBreweryFigure('proVolumeUnit', v)}
        options={PRO_VOLUME_UNITS.map((u) => [u, volumeUnit('pro', u)])}
        builtIn={volumeUnit('pro', DEFAULT_DISPLAY.proVolumeUnit)}
      />
      <ChoiceRow
        label="Pro malt weight unit"
        value={brewery.proMaltUnit}
        onChange={(v) => setBreweryFigure('proMaltUnit', v)}
        options={PRO_MALT_UNITS.map((u) => [u, maltWeightUnit('pro', u)])}
        builtIn={maltWeightUnit('pro', DEFAULT_DISPLAY.proMaltUnit)}
      />
      <ChoiceRow
        label="Temperature unit"
        value={brewery.temperatureUnit}
        onChange={(v) => setBreweryFigure('temperatureUnit', v)}
        options={TEMPERATURE_UNITS.map((u) => [u, tempUnit(u)])}
        builtIn={tempUnit(DEFAULT_DISPLAY.temperatureUnit)}
      />

      <BreweryWater water={brewery.water} setBreweryWater={setBreweryWater} volume={volume} vUnit={vUnit} />

      <MyIngredients mine={brewery.ingredients} onDelete={onDeleteIngredient} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '0.85rem' }}>
        <button type="button" onClick={onUseRecipeFigures} style={button}>
          Use this recipe's figures
        </button>
        <button type="button" onClick={onForgetBrewery} style={button}>
          Forget my brewery figures
        </button>
        <button type="button" onClick={onExportBrewery} style={button}>
          Export my brewery figures
        </button>
        <button type="button" onClick={() => breweryFile.current.click()} style={button}>
          Import my brewery figures
        </button>
        <input
          ref={breweryFile}
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onImportBreweryFile(file);
          }}
          style={{ display: 'none' }}
        />
      </div>
      {breweryFileMessage && (
        <p role="status" style={{ ...tokens.warning, marginTop: '0.6rem' }}>
          {breweryFileMessage}
        </p>
      )}
    </Card>
    </>
  );
}
