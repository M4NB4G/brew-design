// App.jsx
// Owns the single canonical recipe-state object plus the display settings
// (mode, Pro-mode gravity unit) and the active tab (Recipe · Options; not
// persisted). Derives all stats once via computeRecipe and passes plain props
// down to cleanly separated section components. No brewing math and no unit
// conversion live here — those are in selectors.js and display.js
// respectively.
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { defaultRecipeState } from './state.js';
import { computeRecipe } from './selectors.js';
import {
  loadPersisted,
  savePersisted,
  clearPersisted,
  exportRecipeDocument,
  recipeFileName,
  importRecipeFile,
} from './persistence.js';
import Header from './components/Header.jsx';
import TabBar from './components/TabBar.jsx';
import IdentitySection, { NotesSection } from './components/IdentitySection.jsx';
import StatsBar from './components/StatsBar.jsx';
import GristTable from './components/GristTable.jsx';
import VolumesSection from './components/VolumesSection.jsx';
import HopsSection from './components/HopsSection.jsx';
import YeastSection from './components/YeastSection.jsx';
import OptionsSection from './components/OptionsSection.jsx';
import RecipeSheet from './components/RecipeSheet.jsx';
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
  const [fileMessage, setFileMessage] = useState(''); // an import refusal, shown under the header controls

  const derived = useMemo(() => computeRecipe(recipe), [recipe]);

  // Autosave on every change (scope table P6: synchronous, no debounce).
  useEffect(() => {
    savePersisted(browserStorage(), { recipe, mode, proGravityUnit });
  }, [recipe, mode, proGravityUnit]);

  // A refusal message lasts until the next action: an edit, or a header action below.
  useEffect(() => {
    setFileMessage('');
  }, [recipe, mode, proGravityUnit]);

  // Export (recipe file S1, S2, S7): the saved document, handed to the browser
  // as a download named from the recipe name and today's date. Reads only.
  const exportRecipe = () => {
    setFileMessage('');
    const blob = new Blob([exportRecipeDocument({ recipe, mode, proGravityUnit })], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = recipeFileName(recipe.name, new Date());
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url));
  };

  // Import (S3–S6): read the chosen file; a refusal is shown and nothing
  // changes; a readable file is confirmed, then replaces recipe and display
  // settings, and the autosave above makes it the working copy.
  const importRecipe = async (file) => {
    setFileMessage('');
    let text;
    try {
      text = await file.text();
    } catch {
      text = ''; // an unreadable file is refused like any other non-recipe
    }
    const result = importRecipeFile(text, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }, () =>
      window.confirm(
        `Replace the recipe and settings on screen with the recipe in "${file.name}"? The saved copy will be replaced.`,
      ),
    );
    if (result.outcome === 'refused') setFileMessage(result.message);
    if (result.outcome !== 'replaced') return;
    setRecipe(result.state.recipe);
    setMode(result.state.mode);
    setProGravityUnit(result.state.proGravityUnit);
  };

  // Reset to defaults (P9): confirm, remove the saved copy, restore defaults.
  const resetToDefaults = () => {
    setFileMessage('');
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

      {/* Header with the recipe actions (Export, Import, Reset, Print) and the Pro/Home and Pro-gravity toggles */}
      <Header
        mode={mode}
        onMode={setMode}
        proGravityUnit={proGravityUnit}
        onProGravityUnit={setProGravityUnit}
        onReset={resetToDefaults}
        onExport={exportRecipe}
        onImportFile={importRecipe}
        fileMessage={fileMessage}
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

      {/* The print-only recipe sheet, from the same derived values; portaled
          beside the app root so the print rules can hide the root alone. */}
      {createPortal(
        <RecipeSheet recipe={recipe} derived={derived} mode={mode} proGravityUnit={proGravityUnit} />,
        document.body,
      )}

    </div>
  );
}
