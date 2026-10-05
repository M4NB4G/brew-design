// App.jsx
// Owns the single canonical recipe-state object plus the display settings
// (mode, Pro-mode gravity unit, temperature unit) and the active tab (Recipe · Water · Options;
// not persisted). The Water tab's entries are the recipe's own (`recipe.water`,
// water-state.js), saved and reset with it (Water saved with the recipe). Derives all stats once via computeRecipe and passes plain props
// down to cleanly separated section components. No brewing math and no unit
// conversion live here — those are in selectors.js and display.js
// respectively.
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  defaultRecipeState,
  DEFAULT_DISPLAY,
  emptyBreweryFigures,
  hasBreweryFigures,
  breweryBannerShown,
  bannerDismissalAfter,
  breweryFiguresFromRecipe,
  newRecipe,
} from './state.js';
import { computeRecipe, computeWater } from './selectors.js';
import { mashWaterChanged } from './water-state.js';
import { emptyFields, emptyFieldsLine } from './empty-fields.js';
import {
  loadStartingState,
  savePersisted,
  clearPersisted,
  exportRecipeDocument,
  recipeFileName,
  importRecipeFile,
  loadBrewery,
  loadBannerDismissed,
  saveBannerDismissed,
  exportBreweryDocument,
  breweryFileName,
  importBreweryFile,
  saveBrewery,
  clearBrewery,
} from './persistence.js';
import Header from './components/Header.jsx';
import TabBar from './components/TabBar.jsx';
import IdentitySection, { NotesSection } from './components/IdentitySection.jsx';
import StatsBar from './components/StatsBar.jsx';
import EmptyFieldsLine from './components/EmptyFieldsLine.jsx';
import GristTable from './components/GristTable.jsx';
import VolumesSection from './components/VolumesSection.jsx';
import HopsSection from './components/HopsSection.jsx';
import YeastCard from './components/YeastCard.jsx';
import YeastSection from './components/YeastSection.jsx';
import OptionsSection from './components/OptionsSection.jsx';
import WaterTab from './components/water/WaterTab.jsx';
import BreweryBanner from './components/BreweryBanner.jsx';
import RecipeSheet from './components/RecipeSheet.jsx';
import Footer from './components/Footer.jsx';
import { colors } from './components/shared/styles.js';

// window.localStorage itself can throw when storage is blocked; treat that as
// no storage. persistence.js handles a null storage as a no-op.
function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

// The saved recipe; with none, a new recipe from the brewery's figures.
function loadInitialState() {
  return loadStartingState(browserStorage());
}

export default function App() {
  // Loaded once (lazy initializer); the three states below seed from it.
  const [initial] = useState(loadInitialState);
  const [recipe, setRecipe] = useState(initial.recipe);
  const [mode, setMode] = useState(initial.mode); // 'home' | 'pro'
  const [proGravityUnit, setProGravityUnit] = useState(initial.proGravityUnit); // Pro: 'plato' | 'sg'
  const [temperatureUnit, setTemperatureUnit] = useState(initial.temperatureUnit); // 'F' | 'C'
  const [tab, setTab] = useState('recipe'); // 'recipe' | 'water' | 'options'; every load opens on Recipe
  const [fileMessage, setFileMessage] = useState(''); // an import refusal, shown under the header controls
  // The brewery's figures (Options tab, My brewery): kept apart from the
  // recipe, and read only when a new recipe is made.
  const [brewery, setBrewery] = useState(() => loadBrewery(browserStorage()));
  // The Water tab's entries are the recipe's (saved by the autosave below),
  // changed only through water-state.js's steps; its open screen is not saved.
  const water = recipe.water;
  const setWater = (step) => setRecipe((r) => ({ ...r, water: step(r.water) }));
  const [waterScreen, setWaterScreen] = useState('water'); // 'water' | 'style' | 'salts' | 'notes'

  const derived = useMemo(() => computeRecipe(recipe), [recipe]);
  // The empty number boxes, named under the stats bar (null when none).
  const emptyLine = useMemo(() => emptyFieldsLine(emptyFields(recipe, derived)), [recipe, derived]);
  // The water figures read the recipe's grain, mash water and pre-boil volume.
  const waterFigures = useMemo(() => computeWater(recipe.water, recipe), [recipe]);

  // Autosave on every change (scope table P6: synchronous, no debounce).
  useEffect(() => {
    savePersisted(browserStorage(), { recipe, mode, proGravityUnit, temperatureUnit });
  }, [recipe, mode, proGravityUnit, temperatureUnit]);

  // A refusal message lasts until the next action: an edit, or a header action below.
  useEffect(() => {
    setFileMessage('');
  }, [recipe, mode, proGravityUnit, temperatureUnit]);

  // Export (recipe file S1, S2, S7): the saved document, handed to the browser
  // as a download named from the recipe name and today's date. Reads only.
  const exportRecipe = () => {
    setFileMessage('');
    const blob = new Blob([exportRecipeDocument({ recipe, mode, proGravityUnit, temperatureUnit })], {
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
    setTemperatureUnit(result.state.temperatureUnit);
  };

  // Reset to defaults (P9): confirm, remove the saved copy, start a new
  // recipe from the brewery's figures where they are set; the confirm names
  // them once any are (brewery defaults K4).
  const resetToDefaults = () => {
    setFileMessage('');
    const to = hasBreweryFigures(brewery) ? "your brewery's figures" : 'defaults';
    if (!window.confirm(`Reset the recipe and settings to ${to}? The saved copy will be removed.`)) return;
    clearPersisted(browserStorage());
    const fresh = newRecipe(brewery);
    setRecipe(fresh.recipe);
    setMode(fresh.mode);
    setProGravityUnit(fresh.proGravityUnit);
    setTemperatureUnit(fresh.temperatureUnit);
  };

  // The brewery's figures: each change is saved at once, and never touches
  // the recipe on screen or its saved copy (S4).
  // "Not now" on the My brewery banner (S4b item 4): kept in this browser.
  const [bannerDismissed, setBannerDismissed] = useState(() => loadBannerDismissed(browserStorage()));
  const dismissBanner = (dismissed) => {
    setBannerDismissed(dismissed);
    saveBannerDismissed(browserStorage(), dismissed);
  };
  const changeBrewery = (next) => {
    const dismissed = bannerDismissalAfter(next, bannerDismissed);
    if (dismissed !== bannerDismissed) dismissBanner(dismissed);
    setBrewery(next);
    saveBrewery(browserStorage(), next);
  };
  const setBreweryFigure = (key, value) => changeBrewery({ ...brewery, [key]: value });
  const setBreweryTemp = (kind, tempF) =>
    changeBrewery({ ...brewery, measurementTempF: { ...brewery.measurementTempF, [kind]: tempF } });
  const setBreweryWater = (key, value) => changeBrewery({ ...brewery, water: { ...brewery.water, [key]: value } });
  const useRecipeFigures = () =>
    changeBrewery(breweryFiguresFromRecipe(recipe, mode, proGravityUnit, temperatureUnit));
  const forgetBrewery = () => {
    if (!window.confirm("Forget your brewery's figures? A new recipe will start from the built-in figures; the recipe on screen is unchanged.")) return;
    clearBrewery(browserStorage());
    setBrewery(emptyBreweryFigures());
  };

  // The brewery file (S4b item 5): Export hands the browser the brewery's
  // document; Import asks first, then replaces the brewery's figures through
  // the usual brewery change (saved at once) and never the recipe. A refusal
  // is shown on Options until the next brewery-file action.
  const [breweryFileMessage, setBreweryFileMessage] = useState('');
  const exportBrewery = () => {
    setBreweryFileMessage('');
    const blob = new Blob([exportBreweryDocument(brewery)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = breweryFileName(new Date());
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url));
  };
  const importBrewery = async (file) => {
    setBreweryFileMessage('');
    let text;
    try {
      text = await file.text();
    } catch {
      text = ''; // an unreadable file is refused like any other
    }
    const result = importBreweryFile(text, () =>
      window.confirm(`Replace your brewery's figures with those in "${file.name}"? The recipe on screen is unchanged.`),
    );
    if (result.outcome === 'refused') setBreweryFileMessage(result.message);
    if (result.outcome !== 'replaced') return;
    changeBrewery(result.brewery);
  };

  // Top-level scalar field setter.
  // A new mash water, when it is the treated water, returns the brewer's own
  // salt and acid amounts to the recommendation (water treatment K).
  const setField = (field, value) => {
    setRecipe((r) => ({ ...r, [field]: value }));
    if (field === 'mashWaterGal') setWater(mashWaterChanged);
  };

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

  // Measurement temperature (degF; the Volumes card converts a °C entry) for one corrected volume kind.
  const setMeasurementTemp = (kind, tempF) =>
    setRecipe((r) => ({ ...r, measurementTempF: { ...r.measurementTempF, [kind]: tempF } }));

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '4rem' }}>

      {/* Header with the recipe actions (Export, Import, Reset, Print) and the Pro/Home, °F/°C and Pro-gravity toggles */}
      <Header
        mode={mode}
        onMode={setMode}
        proGravityUnit={proGravityUnit}
        onProGravityUnit={setProGravityUnit}
        temperatureUnit={temperatureUnit}
        onTemperatureUnit={setTemperatureUnit}
        onReset={resetToDefaults}
        onExport={exportRecipe}
        onImportFile={importRecipe}
        fileMessage={fileMessage}
      />

      {/* Recipe · Water · Options tabs (Brew Water Chem's row, in its position) */}
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
          <EmptyFieldsLine text={emptyLine} />
        </div>
      </div>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem 1.25rem' }}>
        {/* My brewery banner (S4b item 4): on every tab while every brewery figure is blank */}
        {breweryBannerShown(brewery, bannerDismissed) && (
          <BreweryBanner onSetUp={() => setTab('options')} onNotNow={() => dismissBanner(true)} />
        )}

        {tab === 'recipe' && (
          <>
            <IdentitySection name={recipe.name} style={recipe.style} setField={setField} />

            <VolumesSection
              recipe={recipe}
              grist={derived.grist}
              postBoilVolGal={derived.postBoilVolGal}
              postBoilMeasuredGal={derived.postBoilMeasuredGal}
              postBoilMeasuredShown={derived.postBoilMeasuredShown}
              refVolumesGal={derived.refVolumesGal}
              warnings={derived.warnings}
              mode={mode}
              temperatureUnit={temperatureUnit}
              setField={setField}
              setMeasurementTemp={setMeasurementTemp}
            />

            <GristTable
              malts={recipe.malts}
              efficiency={recipe.efficiency}
              grist={derived.grist}
              setRow={setRow}
              addRow={addRow}
              removeRow={removeRow}
              setField={setField}
            />

            <YeastCard
              yeast={recipe.yeast}
              apparentAttenuation={recipe.apparentAttenuation}
              temperatureUnit={temperatureUnit}
              setYeast={setYeast}
              setField={setField}
            />

            <HopsSection
              kettleAdditions={recipe.kettleAdditions}
              dryHops={recipe.dryHops}
              hops={derived.hops}
              mode={mode}
              temperatureUnit={temperatureUnit}
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

        {tab === 'water' && (
          <WaterTab
            water={water}
            figures={waterFigures}
            mode={mode}
            screen={waterScreen}
            onScreen={setWaterScreen}
            setWater={setWater}
          />
        )}

        {tab === 'options' && (
          <OptionsSection
            mode={mode}
            temperatureUnit={temperatureUnit}
            brewery={brewery}
            setBreweryFigure={setBreweryFigure}
            setBreweryTemp={setBreweryTemp}
            setBreweryWater={setBreweryWater}
            onUseRecipeFigures={useRecipeFigures}
            onForgetBrewery={forgetBrewery}
            onExportBrewery={exportBrewery}
            onImportBreweryFile={importBrewery}
            breweryFileMessage={breweryFileMessage}
          />
        )}
      </main>

      {/* Persyn attribution (Brew Water Chem's footer); on screen only, inside #root */}
      <Footer />

      {/* The print-only recipe sheet, from the same derived values; portaled
          beside the app root so the print rules can hide the root alone. */}
      {createPortal(
        <RecipeSheet
          recipe={recipe}
          derived={derived}
          water={waterFigures}
          mode={mode}
          proGravityUnit={proGravityUnit}
          temperatureUnit={temperatureUnit}
        />,
        document.body,
      )}

    </div>
  );
}
