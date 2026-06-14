// App.jsx
// Owns the single canonical recipe-state object plus the display settings
// (mode, Pro-mode gravity unit). Derives all stats once via computeRecipe and
// passes plain props down to cleanly separated section components. No brewing
// math and no unit conversion live here — those are in selectors.js and
// display.js respectively.
import { useMemo, useState } from 'react';
import { defaultRecipeState } from './state.js';
import { computeRecipe } from './selectors.js';
import Header from './components/Header.jsx';
import StatsBar from './components/StatsBar.jsx';
import GristTable from './components/GristTable.jsx';
import MashSection from './components/MashSection.jsx';
import HopsSection from './components/HopsSection.jsx';
import YeastSection from './components/YeastSection.jsx';
import { colors } from './components/shared/styles.js';

export default function App() {
  const [recipe, setRecipe] = useState(defaultRecipeState);
  const [mode, setMode] = useState('home'); // 'home' | 'pro'
  const [proGravityUnit, setProGravityUnit] = useState('plato'); // Pro: 'plato' | 'sg'

  const derived = useMemo(() => computeRecipe(recipe), [recipe]);

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
