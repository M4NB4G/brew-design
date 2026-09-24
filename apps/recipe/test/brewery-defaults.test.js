// brewery-defaults.test.js
// Scenarios for the Brewery defaults item (scope table agreed 2026-09-23,
// docs/items/brewery-defaults.md), named from its sentences S1–S6 and
// decisions K2–K6. Storage is a Map-backed fake so the suite stays DOM-free.
// The My brewery section's place and units on the Options tab (S1, S2) and
// the Reset confirm (K4) are proved at the far end, in the browser.
//
// No number is introduced: the built-in figures are defaultRecipeState()'s
// and today's display settings (Home, °P), read here, never retyped.

import { describe, it, expect } from 'vitest';
import {
  defaultRecipeState,
  emptyBreweryFigures,
  breweryFiguresFromRecipe,
  newRecipe,
} from '../src/state.js';
import {
  STORAGE_KEY,
  savePersisted,
  exportRecipeDocument,
  importRecipeFile,
  BREWERY_KEY,
  BREWERY_VERSION,
  loadBrewery,
  saveBrewery,
  clearBrewery,
  loadStartingState,
} from '../src/persistence.js';
import { computeRecipe } from '../src/selectors.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      m.set(k, String(v));
    },
    removeItem: (k) => {
      m.delete(k);
    },
    _map: m,
  };
}

function throwingStorage() {
  const boom = () => {
    throw new Error('storage unavailable');
  };
  return { getItem: boom, setItem: boom, removeItem: boom };
}

// Today's new recipe: the built-in recipe, Home, °P (App.jsx before this item).
const builtIn = () => ({ recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' });

// A brewery with every figure set, in the recipe's own units (gal, °F,
// fraction): the reference brewery of the far end, Pro and °P.
const BREWERY = {
  fermentVolGal: 12,
  preBoilVolGal: 16,
  boilOffRateGalPerHr: 1.25,
  boilTimeMin: 90,
  measurementTempF: { preBoil: 150, postBoil: 180, ferment: 68 },
  efficiency: 0.93,
  mode: 'pro',
  proGravityUnit: 'plato',
};

describe('brewery defaults', () => {
  // S3, K3
  it('with no brewery figures, a new recipe is today\'s built-in recipe', () => {
    expect(newRecipe(emptyBreweryFigures())).toEqual(builtIn());
    // A first visit with nothing saved at all.
    expect(loadStartingState(fakeStorage())).toEqual(builtIn());
    // Blocked storage: the same, and nothing throws.
    expect(loadStartingState(throwingStorage())).toEqual(builtIn());
  });

  // S1, S3, K2
  it('brewery figures fill a new recipe\'s batch volume, pre-boil volume, boil-off rate, boil time, measurement temperatures and efficiency, and its Home/Pro and gravity unit; every other field is the built-in one', () => {
    const expected = {
      recipe: {
        ...defaultRecipeState(),
        fermentVolGal: 12,
        preBoilVolGal: 16,
        boilOffRateGalPerHr: 1.25,
        boilTimeMin: 90,
        measurementTempF: { preBoil: 150, postBoil: 180, ferment: 68 },
        efficiency: 0.93,
      },
      mode: 'pro',
      proGravityUnit: 'plato',
    };
    expect(newRecipe(BREWERY)).toEqual(expected);

    // Malts, hops, yeast, attenuation, mash water and identity are the built-in ones.
    const r = newRecipe(BREWERY).recipe;
    const d = defaultRecipeState();
    for (const key of ['malts', 'kettleAdditions', 'dryHops', 'yeast', 'apparentAttenuation', 'mashWaterGal', 'name', 'style', 'notes']) {
      expect(r[key]).toEqual(d[key]);
    }

    // SG as the Pro gravity unit, Home as the mode.
    expect(newRecipe({ ...BREWERY, mode: 'home', proGravityUnit: 'sg' })).toMatchObject({
      mode: 'home',
      proGravityUnit: 'sg',
    });

    // A first visit with nothing saved but the brewery's figures.
    const s = fakeStorage();
    saveBrewery(s, BREWERY);
    expect(loadStartingState(s)).toEqual(expected);
  });

  // K3
  it('a brewery figure left blank gives the built-in figure', () => {
    const d = defaultRecipeState();
    const partial = {
      ...BREWERY,
      preBoilVolGal: null,
      measurementTempF: { preBoil: null, postBoil: 180, ferment: 68 },
      mode: null,
      proGravityUnit: null,
    };
    const { recipe, mode, proGravityUnit } = newRecipe(partial);
    expect(recipe.preBoilVolGal).toBe(d.preBoilVolGal);
    expect(recipe.measurementTempF).toEqual({ preBoil: d.measurementTempF.preBoil, postBoil: 180, ferment: 68 });
    expect(mode).toBe('home');
    expect(proGravityUnit).toBe('plato');
    // The figures that were set still apply.
    expect(recipe.fermentVolGal).toBe(12);
    expect(recipe.efficiency).toBe(0.93);

    // A blank never reaches a new recipe as a blank: NaN is a blank too.
    const withNaN = newRecipe({ ...BREWERY, boilTimeMin: NaN, efficiency: NaN }).recipe;
    expect(withNaN.boilTimeMin).toBe(d.boilTimeMin);
    expect(withNaN.efficiency).toBe(d.efficiency);

    // Every figure blank: the built-in recipe.
    expect(newRecipe(emptyBreweryFigures())).toEqual(builtIn());
  });

  // S2
  it('"use this recipe\'s figures" takes exactly those figures from the recipe on screen, and nothing else', () => {
    const onScreen = {
      ...defaultRecipeState(),
      name: 'House IPA',
      malts: [{ name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 }],
      mashWaterGal: 13,
      apparentAttenuation: 0.8,
      fermentVolGal: 12,
      preBoilVolGal: 16,
      boilOffRateGalPerHr: 1.25,
      boilTimeMin: 90,
      measurementTempF: { preBoil: 150, postBoil: 180, ferment: 68 },
      efficiency: 0.93,
    };
    expect(breweryFiguresFromRecipe(onScreen, 'pro', 'plato')).toEqual(BREWERY);

    // Exactly the brewery's figures: the same keys as a blank brewery.
    const taken = breweryFiguresFromRecipe(onScreen, 'home', 'sg');
    expect(Object.keys(taken).sort()).toEqual(Object.keys(emptyBreweryFigures()).sort());
    expect(Object.keys(taken.measurementTempF).sort()).toEqual(['ferment', 'postBoil', 'preBoil']);
    expect(taken.mode).toBe('home');
    expect(taken.proGravityUnit).toBe('sg');

    // A cleared field on screen is taken as a blank brewery figure, not NaN.
    const cleared = breweryFiguresFromRecipe(
      { ...onScreen, preBoilVolGal: NaN, measurementTempF: { ...onScreen.measurementTempF, ferment: NaN } },
      'pro',
      'plato',
    );
    expect(cleared.preBoilVolGal).toBeNull();
    expect(cleared.measurementTempF.ferment).toBeNull();

    // Taking them changes nothing on screen.
    const before = JSON.stringify(onScreen);
    breweryFiguresFromRecipe(onScreen, 'pro', 'plato');
    expect(JSON.stringify(onScreen)).toBe(before);
  });

  // S5, K6
  it('the brewery figures round-trip through their own saved document at version 1; unreadable, another version or blocked storage gives the built-in figures and nothing throws', () => {
    const s = fakeStorage();
    const withBlank = { ...BREWERY, boilTimeMin: null, measurementTempF: { ...BREWERY.measurementTempF, postBoil: null } };
    saveBrewery(s, withBlank);

    // Their own key, apart from the recipe, in one document carrying version 1.
    expect(BREWERY_KEY).not.toBe(STORAGE_KEY);
    expect(BREWERY_VERSION).toBe(1);
    expect([...s._map.keys()]).toEqual([BREWERY_KEY]);
    const doc = JSON.parse(s._map.get(BREWERY_KEY));
    expect(doc.version).toBe(1);
    expect(doc.brewery.preBoilVolGal).toBe(16); // gallons, not bbl

    // A reload reads them back, blanks as blanks.
    expect(loadBrewery(s)).toEqual(withBlank);

    // Nothing saved, unreadable text, another version, a damaged figure, blocked storage.
    expect(loadBrewery(fakeStorage())).toEqual(emptyBreweryFigures());
    const bad = (text) => {
      const b = fakeStorage();
      b.setItem(BREWERY_KEY, text);
      return loadBrewery(b);
    };
    expect(bad('{not json')).toEqual(emptyBreweryFigures());
    expect(bad(JSON.stringify({ version: 2, brewery: BREWERY }))).toEqual(emptyBreweryFigures());
    expect(bad(JSON.stringify({ version: 1, brewery: { ...BREWERY, efficiency: '93' } }))).toEqual(emptyBreweryFigures());
    expect(bad(JSON.stringify({ version: 1, brewery: { ...BREWERY, mode: 'metric' } }))).toEqual(emptyBreweryFigures());
    expect(bad(JSON.stringify({ version: 1 }))).toEqual(emptyBreweryFigures());
    expect(() => loadBrewery(throwingStorage())).not.toThrow();
    expect(loadBrewery(throwingStorage())).toEqual(emptyBreweryFigures());
    expect(() => saveBrewery(throwingStorage(), BREWERY)).not.toThrow();
    expect(() => clearBrewery(throwingStorage())).not.toThrow();
  });

  // S4, K5, K6
  it('saving brewery figures changes neither the saved recipe nor its document, and a recipe loads as it was saved whatever the brewery figures', () => {
    const s = fakeStorage();
    const saved = {
      recipe: { ...defaultRecipeState(), name: 'Saved', preBoilVolGal: 8, fermentVolGal: 5 },
      mode: 'home',
      proGravityUnit: 'sg',
    };
    savePersisted(s, saved);
    const docBefore = s.getItem(STORAGE_KEY);
    const fileBefore = exportRecipeDocument(saved);

    saveBrewery(s, BREWERY);
    expect(s.getItem(STORAGE_KEY)).toBe(docBefore);
    expect(exportRecipeDocument(saved)).toBe(fileBefore);
    expect(loadStartingState(s)).toEqual(saved);

    // An old recipe keeps the built-in temperatures, not the brewery's (150 °F).
    const old = fakeStorage();
    saveBrewery(old, BREWERY);
    const v1 = JSON.parse(docBefore);
    delete v1.recipe.measurementTempF;
    old.setItem(STORAGE_KEY, JSON.stringify({ ...v1, version: 1 }));
    const loaded = loadStartingState(old);
    expect(loaded.recipe.measurementTempF).toEqual(defaultRecipeState().measurementTempF);
    expect(loaded.recipe.preBoilVolGal).toBe(8);
    expect(loaded.recipe.fermentVolGal).toBe(5);
    expect(loaded.mode).toBe('home');

    // A recipe file brings its own figures (K5).
    const imported = importRecipeFile(fileBefore, builtIn(), () => true);
    expect(imported.state).toEqual(saved);
  });

  // S5
  it('forgetting the brewery figures returns a new recipe to the built-in one', () => {
    const s = fakeStorage();
    saveBrewery(s, BREWERY);
    expect(loadStartingState(s)).not.toEqual(builtIn());

    clearBrewery(s);
    expect(s.getItem(BREWERY_KEY)).toBeNull();
    expect(loadBrewery(s)).toEqual(emptyBreweryFigures());
    expect(loadStartingState(s)).toEqual(builtIn());
    expect(newRecipe(loadBrewery(s))).toEqual(builtIn());
  });

  // S6
  it('a recipe from brewery figures gives the same stats as the same recipe typed by hand', () => {
    const fromBrewery = newRecipe(BREWERY).recipe;
    const typed = {
      ...defaultRecipeState(),
      fermentVolGal: 12,
      preBoilVolGal: 16,
      boilOffRateGalPerHr: 1.25,
      boilTimeMin: 90,
      measurementTempF: { preBoil: 150, postBoil: 180, ferment: 68 },
      efficiency: 0.93,
    };
    expect(computeRecipe(fromBrewery)).toEqual(computeRecipe(typed));
    // The same brewery figures move the stats off the built-in recipe's.
    expect(computeRecipe(fromBrewery).grist.OG).not.toBe(computeRecipe(defaultRecipeState()).grist.OG);
  });
});
