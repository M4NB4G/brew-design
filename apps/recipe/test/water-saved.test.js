// water-saved.test.js
// Scenarios for "Water saved with the recipe" (scope table agreed
// 2026-10-02, docs/items/water-saved.md), named from its scenario list and
// its sentences WS-S1 to WS-S6 and decisions S1–S7 and K. Storage is a
// Map-backed fake so the suite stays DOM-free; the Water tab is rendered to
// markup with react-dom/server. A real reload, an export and import in the
// browser, and documents saved by the live site are the far end.
//
// No number is introduced: the built-in water entries are
// defaultWaterState()'s, read here, never retyped.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultRecipeState, DEFAULT_DISPLAY, emptyBreweryFigures, newRecipe, hasBreweryFigures, breweryFiguresFromRecipe } from '../src/state.js';
import {
  STORAGE_KEY,
  UNREADABLE_KEY,
  BREWERY_KEY,
  savePersisted,
  loadPersisted,
  loadStartingState,
  exportRecipeDocument,
  importRecipeFile,
  saveBrewery,
  loadBrewery,
} from '../src/persistence.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState, EXAMPLE_SOURCE } from '../src/water-state.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

const defaults = () => ({ recipe: defaultRecipeState(), ...DEFAULT_DISPLAY });
const yes = () => true;

// A recipe with the Water tab filled in: the example report with its pH
// blank, the IPA family, the tank treated with its top-up level blank, salts
// in the kettle, two salts off, the brewer's own gypsum and acid.
const waterEntries = () => ({
  ...defaultWaterState(),
  source: { ...EXAMPLE_SOURCE, pH: NaN },
  styleId: 'ipa',
  raiseAlkSource: 'pickling_lime',
  enabledSalts: ['gypsum', 'calcium_chloride', 'epsom', 'table_salt', 'pickling_lime'],
  saltOverrides: { gypsum: 9 },
  acidAmounts: { phosphoric_10: 0, phosphoric_75: 0, phosphoric_85: 0, lactic_88: 2.5, acidulated_malt: 30 },
  primaryAcid: 'lactic_88',
  multiAcid: true,
  treatment: 'tank',
  kettleSalts: true,
  vessels: 2,
  spargeMethod: 'fly',
  tankTreatedGal: 12,
  tankTopUpGal: NaN,
  absorptionQtPerLb: 0.12,
  spargeGal: 9,
});
const withWater = (water) => ({ ...defaultRecipeState(), mashWaterGal: 7, preBoilVolGal: 14, water });

// The brewery's water figures, every one set (S1, WS-S2).
const BREWERY_WATER = {
  source: { Ca: 40, Mg: 6, Na: 12, SO4: 30, Cl: 25, Alkalinity: 80, pH: 7.6 },
  enabledSalts: ['gypsum', 'calcium_chloride'],
  treatment: 'tank',
  kettleSalts: true,
  vessels: 2,
  spargeMethod: 'fly',
  tankTreatedGal: 14,
  tankTopUpGal: 10,
  absorptionQtPerLb: 0.12,
};

// A document saved before the water (version 4): the recipe without it.
const v4Doc = () => {
  const { water, ...recipe } = { ...defaultRecipeState(), mashWaterGal: 6, name: 'Old Pale' };
  return JSON.stringify({ version: 4, recipe: JSON.parse(JSON.stringify(recipe)), mode: 'pro', proGravityUnit: 'sg' });
};

const renderWater = async (recipe, screen) => {
  const { default: WaterTab } = await import('../src/components/water/WaterTab.jsx');
  return renderToStaticMarkup(
    createElement(WaterTab, {
      water: recipe.water,
      figures: computeWater(recipe.water, recipe),
      mode: 'home',
      screen,
      onScreen: () => {},
      setWater: () => {},
    }),
  );
};

describe('water saved with the recipe', () => {
  it('the water entries round-trip with the recipe through storage and the recipe file', async () => {
    // WS-S1: the entries are the recipe's; a new recipe carries the built-in ones.
    expect(defaultRecipeState().water).toEqual(defaultWaterState());

    const recipe = withWater(waterEntries());
    const s = fakeStorage();
    savePersisted(s, { recipe, mode: 'home', proGravityUnit: 'plato' });
    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(7);
    expect(doc.recipe.water.styleId).toBe('ipa');
    // One key: nothing else is written.
    expect([...s._map.keys()]).toEqual([STORAGE_KEY]);

    const loaded = loadPersisted(s, defaults());
    expect(loaded.recipe).toEqual(recipe);
    // A blank result and a blank top-up level come back blank, never 0 or null.
    expect(loaded.recipe.water.source.pH).toBeNaN();
    expect(loaded.recipe.water.tankTopUpGal).toBeNaN();
    // Amounts that follow the recommendation stay that way.
    const followS = fakeStorage();
    savePersisted(followS, defaults());
    expect(loadPersisted(followS, defaults()).recipe.water.acidAmounts).toBeNull();
    expect(loadPersisted(followS, defaults()).recipe.water).toEqual(defaultWaterState());

    // S5: the recipe file is the same document, read by the same reader.
    const text = exportRecipeDocument({ recipe, mode: 'home', proGravityUnit: 'plato' });
    expect(text).toBe(s._map.get(STORAGE_KEY));
    const imported = importRecipeFile(text, defaults(), yes);
    expect(imported.outcome).toBe('replaced');
    expect(imported.state.recipe).toEqual(recipe);

    // Reset: a new recipe carries the built-in water (no brewery figures).
    expect(newRecipe(emptyBreweryFigures()).recipe.water).toEqual(defaultWaterState());

    // The app holds the water in the recipe: no second state, and the
    // "Not saved yet" line is gone from every screen.
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
    expect(app).not.toMatch(/useState\(defaultWaterState\)/);
    expect(app).toMatch(/recipe\.water/);
    for (const screen of ['water', 'style', 'salts', 'notes']) {
      expect(await renderWater(recipe, screen)).not.toContain('Not saved yet');
    }
  });

  it('a new recipe starts from the brewery\'s water figures; a blank one is the built-in', () => {
    // WS-S2, S1: the brewery's report, salts on hand, setup and usual choice.
    const brewery = { ...emptyBreweryFigures(), water: { ...BREWERY_WATER } };
    expect(hasBreweryFigures(brewery)).toBe(true);
    const w = newRecipe(brewery).recipe.water;
    expect(w).toEqual({ ...defaultWaterState(), ...BREWERY_WATER, source: { ...BREWERY_WATER.source } });
    // S2, S3: the style and the brewer's own amounts are never the brewery's.
    expect(w.styleId).toBe(defaultWaterState().styleId);
    expect(w.saltOverrides).toEqual({});
    expect(w.acidAmounts).toBeNull();

    // A blank figure is the built-in one: a blank pH, a blank top-up level,
    // salts on hand not set, the kettle switch not set.
    const some = {
      ...emptyBreweryFigures(),
      water: {
        ...emptyBreweryFigures().water,
        source: { ...BREWERY_WATER.source, pH: null },
        vessels: 1,
        tankTreatedGal: 14,
      },
    };
    const ws = newRecipe(some).recipe.water;
    const built = defaultWaterState();
    expect(ws.source.pH).toBeNaN();
    expect(ws.source.Ca).toBe(40);
    expect(ws.vessels).toBe(1);
    expect(ws.tankTreatedGal).toBe(14);
    expect(ws.tankTopUpGal).toBeNaN();
    expect(ws.enabledSalts).toEqual(built.enabledSalts);
    expect(ws.kettleSalts).toBe(built.kettleSalts);
    expect(ws.treatment).toBe(built.treatment);
    expect(ws.absorptionQtPerLb).toBe(built.absorptionQtPerLb);
    // Nothing set: no brewery figures, the built-in water.
    expect(hasBreweryFigures(emptyBreweryFigures())).toBe(false);
    expect(newRecipe(emptyBreweryFigures()).recipe.water).toEqual(built);

    // "Use this recipe's figures" takes the water report, the salts on hand,
    // the setup and the choice — not the style or the brewer's amounts; a
    // blank result is a blank figure.
    const taken = breweryFiguresFromRecipe(withWater(waterEntries()), 'home', 'plato').water;
    expect(taken).toEqual({
      source: { ...EXAMPLE_SOURCE, pH: null },
      enabledSalts: ['gypsum', 'calcium_chloride', 'epsom', 'table_salt', 'pickling_lime'],
      treatment: 'tank',
      kettleSalts: true,
      vessels: 2,
      spargeMethod: 'fly',
      tankTreatedGal: 12,
      tankTopUpGal: null,
      absorptionQtPerLb: 0.12,
    });

    // Saved with the brewery's figures (version 3), read back as saved.
    const s = fakeStorage();
    saveBrewery(s, brewery);
    expect(JSON.parse(s._map.get(BREWERY_KEY)).version).toBe(3);
    expect(loadBrewery(s)).toEqual(brewery);
    // A first visit starts from them.
    expect(loadStartingState(s).recipe.water).toEqual(w);
  });

  it('an older recipe loads with the built-in water, whatever the brewery\'s figures', () => {
    // WS-S3, S4: a version-4 document with the brewery's water set.
    const s = fakeStorage();
    saveBrewery(s, { ...emptyBreweryFigures(), water: { ...BREWERY_WATER } });
    s.setItem(STORAGE_KEY, v4Doc());
    const loaded = loadStartingState(s);
    expect(loaded.recipe.water).toEqual(defaultWaterState());
    expect(loaded.recipe.name).toBe('Old Pale');
    expect(loaded.recipe.mashWaterGal).toBe(6);
    expect(loaded.mode).toBe('pro');
    // Every number as before: the recipe's figures equal those of the same
    // recipe with the water left out.
    const { water, ...rest } = loaded.recipe;
    expect(computeRecipe(loaded.recipe)).toEqual(computeRecipe(rest));
    // Saved back as version 7.
    savePersisted(s, loaded);
    expect(JSON.parse(s._map.get(STORAGE_KEY)).version).toBe(7);
    expect(loadStartingState(s)).toEqual(loaded);

    // A version-4 recipe file is read the same way.
    const imported = importRecipeFile(v4Doc(), defaults(), yes);
    expect(imported.outcome).toBe('replaced');
    expect(imported.state.recipe.water).toEqual(defaultWaterState());

    // Versions 1, 2 and 3 too.
    for (const version of [1, 2, 3]) {
      const doc = JSON.parse(v4Doc());
      doc.version = version;
      const r = importRecipeFile(JSON.stringify(doc), defaults(), yes);
      expect(r.outcome, `version ${version}`).toBe('replaced');
      expect(r.state.recipe.water, `version ${version}`).toEqual(defaultWaterState());
    }
  });

  it('older brewery figures load with the water setup blank', () => {
    // WS-S4: brewery figures saved at version 1, before the water setup.
    const { water, ...v1 } = { ...emptyBreweryFigures(), fermentVolGal: 12, efficiency: 0.9, mode: 'pro' };
    const s = fakeStorage();
    s.setItem(BREWERY_KEY, JSON.stringify({ version: 1, brewery: v1 }));
    const loaded = loadBrewery(s);
    expect(loaded).toEqual({ ...v1, water: emptyBreweryFigures().water });
    // Saved back as version 3, the same figures.
    const doc = JSON.parse(s._map.get(BREWERY_KEY));
    expect(doc.version).toBe(3);
    expect(loadBrewery(s)).toEqual(loaded);
    // A new recipe from them has the built-in water.
    expect(newRecipe(loaded).recipe.water).toEqual(defaultWaterState());

    // A version-1 document that is damaged, or a version this app does not
    // know, is no brewery figures, as before.
    const bad = (text) => {
      const b = fakeStorage();
      b.setItem(BREWERY_KEY, text);
      return loadBrewery(b);
    };
    expect(bad(JSON.stringify({ version: 1, brewery: { ...v1, efficiency: '90' } }))).toEqual(emptyBreweryFigures());
    expect(bad(JSON.stringify({ version: 4, brewery: { ...v1, water: BREWERY_WATER } }))).toEqual(emptyBreweryFigures());
  });

  it('damaged water entries make a recipe unreadable', () => {
    // WS-S5: each damage, through storage and through a file.
    const good = () => JSON.parse(exportRecipeDocument({ ...defaults(), recipe: withWater(waterEntries()) }));
    const damages = {
      'no water': (w) => undefined,
      'water not an object': () => 'water',
      'a test result missing': (w) => ({ ...w, source: { ...w.source, Ca: undefined } }),
      'a test result as text': (w) => ({ ...w, source: { ...w.source, Mg: '2' } }),
      'an unknown style': (w) => ({ ...w, styleId: 'mead' }),
      'an unknown alkalinity salt': (w) => ({ ...w, raiseAlkSource: 'chalk' }),
      'salts on hand not a list': (w) => ({ ...w, enabledSalts: 'gypsum' }),
      'an unknown salt on hand': (w) => ({ ...w, enabledSalts: ['gypsum', 'sugar'] }),
      'a salt amount as text': (w) => ({ ...w, saltOverrides: { gypsum: '9' } }),
      'an unknown salt amount': (w) => ({ ...w, saltOverrides: { sugar: 9 } }),
      'acid amounts not an object': (w) => ({ ...w, acidAmounts: 3 }),
      'an acid amount as text': (w) => ({ ...w, acidAmounts: { ...w.acidAmounts, lactic_88: '2' } }),
      'an unknown primary acid': (w) => ({ ...w, primaryAcid: 'vinegar' }),
      'several acids not yes or no': (w) => ({ ...w, multiAcid: 'yes' }),
      'an unknown treatment': (w) => ({ ...w, treatment: 'kettle' }),
      'the kettle switch not yes or no': (w) => ({ ...w, kettleSalts: 1 }),
      'an unknown number of vessels': (w) => ({ ...w, vessels: 4 }),
      'an unknown sparge': (w) => ({ ...w, spargeMethod: 'drip' }),
      'a treated volume as text': (w) => ({ ...w, tankTreatedGal: '12' }),
      'a top-up level missing': (w) => ({ ...w, tankTopUpGal: undefined }),
      'the absorption as text': (w) => ({ ...w, absorptionQtPerLb: '0.1' }),
      'the sparge water missing': (w) => ({ ...w, spargeGal: undefined }),
    };
    for (const [name, damage] of Object.entries(damages)) {
      const doc = good();
      doc.recipe.water = damage(doc.recipe.water);
      const text = JSON.stringify(doc);

      const s = fakeStorage();
      s.setItem(STORAGE_KEY, text);
      expect(loadStartingState(s), name).toEqual(newRecipe(emptyBreweryFigures()));
      expect(s._map.get(UNREADABLE_KEY), name).toBe(text);

      const r = importRecipeFile(text, defaults(), yes);
      expect(r.outcome, name).toBe('refused');
      expect(r.message, name).toMatch(/not a Brew Design recipe, or it is damaged/);
    }
    // The undamaged document reads.
    expect(importRecipeFile(JSON.stringify(good()), defaults(), yes).outcome).toBe('replaced');

    // The brewery's water figures damaged: no brewery figures.
    const bad = (water) => {
      const b = fakeStorage();
      b.setItem(BREWERY_KEY, JSON.stringify({ version: 3, brewery: { ...emptyBreweryFigures(), water } }));
      return loadBrewery(b);
    };
    expect(bad({ ...BREWERY_WATER })).toEqual({ ...emptyBreweryFigures(), water: BREWERY_WATER });
    for (const water of [
      undefined,
      { ...BREWERY_WATER, source: { ...BREWERY_WATER.source, Ca: '40' } },
      { ...BREWERY_WATER, enabledSalts: ['sugar'] },
      { ...BREWERY_WATER, treatment: 'kettle' },
      { ...BREWERY_WATER, kettleSalts: 'yes' },
      { ...BREWERY_WATER, vessels: 0 },
      { ...BREWERY_WATER, spargeMethod: 'drip' },
      { ...BREWERY_WATER, tankTopUpGal: '10' },
      { ...BREWERY_WATER, absorptionQtPerLb: undefined },
    ]) {
      expect(bad(water)).toEqual(emptyBreweryFigures());
    }
  });

  it('the same entries give the same figures, saved or typed', () => {
    // WS-S6, K idempotence.
    const cases = [
      withWater(waterEntries()),
      withWater({ ...waterEntries(), treatment: 'mash', multiAcid: false, acidAmounts: null }),
      withWater(defaultWaterState()),
      withWater({ ...defaultWaterState(), source: { ...EXAMPLE_SOURCE } }),
    ];
    for (const recipe of cases) {
      const s = fakeStorage();
      savePersisted(s, { recipe, mode: 'pro', proGravityUnit: 'sg' });
      const bytes = s._map.get(STORAGE_KEY);
      const loaded = loadPersisted(s, defaults()).recipe;
      expect(computeWater(loaded.water, loaded)).toEqual(computeWater(recipe.water, recipe));
      expect(computeRecipe(loaded)).toEqual(computeRecipe(recipe));
      // Load, save, load: the same bytes.
      savePersisted(s, { recipe: loaded, mode: 'pro', proGravityUnit: 'sg' });
      expect(s._map.get(STORAGE_KEY)).toBe(bytes);
    }
  });
});
