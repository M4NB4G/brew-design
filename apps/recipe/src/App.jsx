// App.jsx
// Owns the single canonical recipe-state object plus the display settings
// (mode, Pro-mode gravity unit) and the active tab (Recipe · Options; not
// persisted). Derives all stats once via computeRecipe and passes plain props
// down to cleanly separated section components. No brewing math and no unit
// conversion live here — those are in selectors.js and display.js
// respectively.
import { useEffect, useMemo, useState } from 'react';
import { defaultRecipeState } from './state.js';
import { computeRecipe } from './selectors.js';
import { loadPersisted, savePersisted, clearPersisted } from './persistence.js';
import Header from './components/Header.jsx';
import TabBar from './components/TabBar.jsx';
import IdentitySection, { NotesSection } from './components/IdentitySection.jsx';
import StatsBar from './components/StatsBar.jsx';
import GristTable from './components/GristTable.jsx';
import VolumesSection from './components/VolumesSection.jsx';
import HopsSection from './components/HopsSection.jsx';
import YeastSection from './components/YeastSection.jsx';
import OptionsSection from './components/OptionsSection.jsx';
import { colors } from './components/shared/styles.js';

// Display-setting defaults; the recipe defaults live in state.js.
const DEFAULT_DISPLAY = { mode: 'home', proGravityUnit: 'plato' };

// window.localStorage itself can throw when storage is blocked; treat that as
// no storage. persistence.js handles a null storage as a no-op.
function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function loadInitialState() {
  return loadPersisted(browserStorage(), { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY });
}

export default function App() {
  // Loaded once (lazy initializer); the three states below seed from it.
  const [initial] = useState(loadInitialState);
  const [recipe, setRecipe] = useState(initial.recipe);
  const [mode, setMode] = useState(initial.mode); // 'home' | 'pro'
  const [proGravityUnit, setProGravityUnit] = useState(initial.proGravityUnit); // Pro: 'plato' | 'sg'
  const [tab, setTab] = useState('recipe'); // 'recipe' | 'options'; every load opens on Recipe

  const derived = useMemo(() => computeRecipe(recipe), [recipe]);

  // Autosave on every change (scope table P6: synchronous, no debounce).
  useEffect(() => {
    savePersisted(browserStorage(), { recipe, mode, proGravityUnit });
  }, [recipe, mode, proGravityUnit]);

  // Reset to defaults (P9): confirm, remove the saved copy, restore defaults.
  const resetToDefaults = () => {
    if (!window.confirm('Reset the recipe and settings to defaults? The saved copy will be removed.')) return;
    clearPersisted(browserStorage());
    setRecipe(defaultRecipeState());
    setMode(DEFAULT_DISPLAY.mode);
    setProGravityUnit(DEFAULT_DISPLAY.proGravityUnit);
  };

  // Top-level scalar field setter.
  const setField = (field, value) => setRecipe((r) => ({ ...r, [field]: value }));

  // Row helpers for the array fields (malts, kettleAdditions, dryHops).
  const setRow = (field, index, key, value) =>
    setRecipe((r) => ({
      ...r,
      [field]: r[field].map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));
  const addRow = (field, row) => setRecipe((r) => ({ ...r, [field]: [...r[field], row] }));
  const removeRow = (field, index) =>
    setRecipe((r) => ({ ...r, [field]: r[field].filter((_, i) => i !== index) }));

  const setYeast = (key, value) =>
    setRecipe((r) => ({ ...r, yeast: { ...r.yeast, [key]: value } }));

  // Measurement temperature (degF, as typed) for one corrected volume kind.
  const setMeasurementTemp = (kind, tempF) =>
    setRecipe((r) => ({ ...r, measurementTempF: { ...r.measurementTempF, [kind]: tempF } }));

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>

      {/* Header with Pro/Home and Pro-gravity toggles */}
      <Header
        mode={mode}
        onMode={setMode}
        proGravityUnit={proGravityUnit}
        onProGravityUnit={setProGravityUnit}
        onReset={resetToDefaults}
      />

      {/* Recipe · Options tabs (Brew Water Chem's row, in its position) */}
      <TabBar tab={tab} onTab={setTab} />

      {/* Persistent stats bar — sticky so it remains visible while editing, on both tabs */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: colors.cardBg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0.65rem 1.25rem' }}>
          <StatsBar derived={derived} mode={mode} proGravityUnit={proGravityUnit} />
        </div>
      </div>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 1.25rem 4rem' }}>
        {tab === 'recipe' && (
          <>
            <IdentitySection name={recipe.name} style={recipe.style} setField={setField} />

            <VolumesSection
              recipe={recipe}
              grist={derived.grist}
              postBoilVolGal={derived.postBoilVolGal}
              mode={mode}
              setField={setField}
            />

            <GristTable
              malts={recipe.malts}
              efficiency={recipe.efficiency}
              apparentAttenuation={recipe.apparentAttenuation}
              grist={derived.grist}
              setRow={setRow}
              addRow={addRow}
              removeRow={removeRow}
              setField={setField}
            />

            <HopsSection
              kettleAdditions={recipe.kettleAdditions}
              dryHops={recipe.dryHops}
              hops={derived.hops}
              mode={mode}
              setRow={setRow}
              addRow={addRow}
              removeRow={removeRow}
            />

            <YeastSection
              yeast={recipe.yeast}
              derived={derived}
              mode={mode}
              setYeast={setYeast}
            />

            <NotesSection notes={recipe.notes} setField={setField} />
          </>
        )}

        {tab === 'options' && (
          <OptionsSection
            measurementTempF={recipe.measurementTempF}
            refVolumesGal={derived.refVolumesGal}
            mode={mode}
            setMeasurementTemp={setMeasurementTemp}
          />
        )}
      </main>

    </div>
  );
}
