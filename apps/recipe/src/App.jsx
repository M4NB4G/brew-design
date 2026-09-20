// App.jsx
// Owns the single canonical recipe-state object plus the display settings
// (mode, Pro-mode gravity unit). Derives all stats once via computeRecipe and
// passes plain props down to cleanly separated section components. No brewing
// math and no unit conversion live here — those are in selectors.js and
// display.js respectively.
import { useEffect, useMemo, useState } from 'react';
import { defaultRecipeState } from './state.js';
import { computeRecipe } from './selectors.js';
import { loadPersisted, savePersisted, clearPersisted } from './persistence.js';
import Header from './components/Header.jsx';
import StatsBar from './components/StatsBar.jsx';
import GristTable from './components/GristTable.jsx';
import MashSection from './components/MashSection.jsx';
import HopsSection from './components/HopsSection.jsx';
import YeastSection from './components/YeastSection.jsx';
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

      {/* Persistent stats bar — sticky so it remains visible while editing */}
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

        <MashSection
          recipe={recipe}
          grist={derived.grist}
          postBoilVolGal={derived.postBoilVolGal}
          mode={mode}
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
          fermentVolGal={recipe.fermentVolGal}
          derived={derived}
          mode={mode}
          setField={setField}
          setYeast={setYeast}
        />
      </main>

    </div>
  );
}
