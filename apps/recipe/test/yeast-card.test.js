// yeast-card.test.js
// Scenarios for the Yeast card item (scope table agreed 2026-09-23,
// docs/items/yeast-card.md), named from its sentences Y2–Y8 and decisions
// Q2, Q4, Q7 and Q9. The card's place between Grist and Hops (Y1), the
// attenuation box leaving Grist, and the "Pitch & Starter" name (Q3) are
// layout, proved at the far end on the built app. Every figure the card shows
// is a workbook cell (SPEC rule 16), read here from the app's copy of the
// list and checked against the workbook by ingredients.test.js.

import { describe, it, expect } from 'vitest';
import ingredients from '../src/ingredients.json';
import { selectPitchRate } from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import {
  loadPersisted,
  savePersisted,
  exportRecipeDocument,
  importRecipeFile,
  STORAGE_KEY,
  SCHEMA_VERSION,
} from '../src/persistence.js';
import {
  searchIngredients,
  suggestionDetail,
  pickIngredient,
  typeName,
  strainInfo,
  fermTempWarning,
} from '../src/ingredient-search.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';

const names = (list) => list.map((i) => i.name);
const strain = (name) => ingredients.yeasts.find((y) => y.name === name);

// The smoke test's reference recipe (canonical units), its yeast carrying an
// empty strain and a blank fermentation temperature, as a new recipe does.
function referenceState() {
  return {
    name: '',
    style: '',
    notes: '',
    malts: [
      { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
      { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
    ],
    efficiency: 0.93,
    apparentAttenuation: 0.8,
    preBoilVolGal: 16,
    boilOffRateGalPerHr: 1.5,
    boilTimeMin: 60,
    mashWaterGal: 13,
    kettleAdditions: [
      { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 },
      { name: 'Helios', timeMin: 30, wortTempF: 204, weightOz: 1, alphaAcidFraction: 0.19 },
      { name: 'Citra LupoMAX', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.18 },
      { name: 'Hopstiener 9326', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.06 },
      { name: 'Helios', timeMin: 20, wortTempF: 175, weightOz: 1, alphaAcidFraction: 0.19 },
    ],
    dryHops: [
      { name: 'DH1', weightOz: 2 },
      { name: 'DH2', weightOz: 2 },
      { name: 'DH3', weightOz: 2 },
      { name: 'DH4', weightOz: 2 },
      { name: 'DH5', weightOz: 1 },
      { name: 'DH6', weightOz: 1 },
      { name: 'DH7', weightOz: 2 },
      { name: 'DH8', weightOz: 2 },
      { name: 'DH9', weightOz: 1 },
    ],
    fermentVolGal: 12,
    yeast: { type: 'ale', density: 'mod', name: '', fermTempF: NaN },
    measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
  };
}

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

const defaults = () => ({ recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' });

describe('yeast card', () => {
  // Y2, Q2, Y4
  it('picking a strain names it and sets ale or lager, and changes no other number', () => {
    const recipe = { ...referenceState(), yeast: { type: 'ale', density: 'mod', name: '', fermTempF: 67 } };
    const w3470 = strain('SafLager W-34/70');
    // The list's attenuation differs from the recipe's, so "unchanged" is seen.
    expect(w3470.apparentAttenuation).toBe(0.82);

    const picked = { ...recipe, yeast: pickIngredient('yeasts', recipe.yeast, w3470) };
    expect(picked.yeast).toEqual({ type: 'lager', density: 'mod', name: 'SafLager W-34/70', fermTempF: 67 });
    expect(picked.apparentAttenuation).toBe(0.8);
    // Nothing else in the recipe moved.
    expect({ ...picked, yeast: recipe.yeast }).toEqual(recipe);

    // Typing alone writes the strain and nothing else, even a list name (the
    // lager stays ale until picked), and keeps accents and capitals exactly.
    expect(typeName(recipe.yeast, 'SafLager W-34/70')).toEqual({ ...recipe.yeast, name: 'SafLager W-34/70' });
    expect(typeName(recipe.yeast, 'Hausstamm Kölner ÄLE').name).toBe('Hausstamm Kölner ÄLE');
  });

  // Y2
  it('the strain search finds a strain by name, lab or product code', () => {
    expect(names(searchIngredients('yeasts', 'us-05'))).toEqual(['SafAle US-05']);
    expect(names(searchIngredients('yeasts', 'WLP001'))).toEqual(['WLP001 California Ale']);
    // The Fermentis strains, in the list's order.
    const fermentis = ['SafLager W-34/70', 'SafAle S-04', 'SafAle US-05', 'SafAle K-97'];
    expect(names(searchIngredients('yeasts', 'fermentis'))).toEqual(fermentis);
    expect(names(ingredients.yeasts.filter((y) => y.lab === 'Fermentis'))).toEqual(fermentis);
    // Accents ignored when matching.
    expect(names(searchIngredients('yeasts', 'kolsch'))).toEqual(['WLP4061 Rhine Kölsch Ale']);
    // A strain not on the list suggests nothing, and can still be typed (scenario 1).
    expect(searchIngredients('yeasts', 'House strain')).toEqual([]);
    // Each suggestion names its lab and whether it is an ale or a lager: the
    // one thing a pick sets.
    expect(suggestionDetail('yeasts', strain('SafLager W-34/70'))).toBe('Fermentis, Lager');
    expect(suggestionDetail('yeasts', strain('A07 Flagship'))).toBe('Imperial, Ale');
  });

  // Y3, Q4
  it('a strain on the list shows its lab, product code, ale/lager, lab range and attenuation as information; one not on the list shows none', () => {
    // A07 Flagship's cells: Imperial, A07, Ale, 60 and 72 °F, 0.8 (x 100 = 80 %).
    const a07 = { lab: 'Imperial', productCode: 'A07', type: 'Ale', labRange: '60–72 °F', attenuation: '80 %' };
    expect(strainInfo('A07 Flagship')).toEqual(a07);
    // "On the list": the name equals a list name, capitals and surrounding spaces ignored.
    expect(strainInfo('  a07 FLAGSHIP ')).toEqual(a07);
    // SafAle US-05: Fermentis, US-05, Ale, 64 and 79 °F, 0.8.
    expect(strainInfo('SafAle US-05')).toEqual({
      lab: 'Fermentis',
      productCode: 'US-05',
      type: 'Ale',
      labRange: '64–79 °F',
      attenuation: '80 %',
    });
    // Not on the list, part of a name, a product code alone, or blank: nothing.
    expect(strainInfo('House strain')).toBeNull();
    expect(strainInfo('A07')).toBeNull();
    expect(strainInfo('')).toBeNull();
  });

  // Y8
  it('a fermentation temperature outside the strain\'s lab range warns; inside, at either end, blank, or with a strain not on the list, it does not', () => {
    // A07 Flagship's lab range is 60–72 °F.
    for (const t of [59, 73]) {
      expect(fermTempWarning('A07 Flagship', t), `${t} °F`).toMatch(/60–72 °F/);
    }
    for (const t of [60, 67, 72, NaN]) {
      expect(fermTempWarning('A07 Flagship', t), `${t} °F`).toBeNull();
    }
    expect(fermTempWarning('House strain', 90)).toBeNull();
    // SafLager W-34/70, 54–64 °F: 50 warns naming its range, 54 does not.
    expect(fermTempWarning('SafLager W-34/70', 50)).toMatch(/54–64 °F/);
    expect(fermTempWarning('SafLager W-34/70', 54)).toBeNull();
  });

  // Y7
  it('moving the yeast changes no stat: the same attenuation and ale/lager give the same FG, ABV, pitch rate, cells and starter', () => {
    const ref = referenceState();
    const withStrain = {
      ...ref,
      yeast: { ...pickIngredient('yeasts', ref.yeast, strain('A07 Flagship')), fermTempF: 67 },
    };
    expect(withStrain.yeast).toEqual({ type: 'ale', density: 'mod', name: 'A07 Flagship', fermTempF: 67 });

    // Field for field, the recipe with a strain and a temperature equals the
    // recipe without them, and the recipe as it was before the Yeast card.
    const { name, fermTempF, ...yeastBefore } = ref.yeast;
    expect(computeRecipe(withStrain)).toEqual(computeRecipe(ref));
    expect(computeRecipe(withStrain)).toEqual(computeRecipe({ ...ref, yeast: yeastBefore }));

    // The smoke test's pinned values hold (attenuation 0.8, ale, moderate).
    const d = computeRecipe(withStrain);
    expect(d.grist.FG).toBeCloseTo(1.0136259, 6);
    expect(d.grist.ABV).toBeCloseTo(0.0748883, 4);
    expect(d.pitchRate).toBe(selectPitchRate('ale', 'mod'));
    expect(d.cells).toBe(570);
    expect(d.starter[0].volumeL).toBeCloseTo(3.0, 2);

    // A lager pick gives exactly the numbers of the same recipe set to lager by hand.
    const lager = { ...ref, yeast: pickIngredient('yeasts', ref.yeast, strain('SafLager W-34/70')) };
    expect(computeRecipe(lager)).toEqual(computeRecipe({ ...ref, yeast: { ...ref.yeast, type: 'lager' } }));
  });

  // Y5, Q9
  it('the saved document carries version 4 with the strain and the fermentation temperature; a blank temperature round-trips as blank', () => {
    const s = fakeStorage();
    const recipe = {
      ...defaultRecipeState(),
      yeast: { type: 'lager', density: 'high', name: 'Hausstamm Kölner ÄLE', fermTempF: 52.5 },
    };
    const state = { recipe, mode: 'pro', proGravityUnit: 'sg' };
    savePersisted(s, state);

    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(SCHEMA_VERSION).toBe(4);
    expect(doc.version).toBe(4);
    expect(doc.recipe.yeast).toEqual({ type: 'lager', density: 'high', name: 'Hausstamm Kölner ÄLE', fermTempF: 52.5 });
    expect(loadPersisted(s, defaults())).toEqual(state);
    // The recipe file is the same document, and imports as the same recipe.
    expect(exportRecipeDocument(state)).toBe(s._map.get(STORAGE_KEY));
    expect(importRecipeFile(exportRecipeDocument(state), defaults(), () => true).state).toEqual(state);

    // Blank: NaN in state, null in the document, NaN again on load.
    const t = fakeStorage();
    savePersisted(t, defaults());
    const blankDoc = JSON.parse(t._map.get(STORAGE_KEY));
    expect(blankDoc.recipe.yeast.name).toBe('');
    expect(blankDoc.recipe.yeast.fermTempF).toBeNull();
    const loaded = loadPersisted(t, defaults());
    expect(loaded.recipe.yeast.name).toBe('');
    expect(loaded.recipe.yeast.fermTempF).toBeNaN();
  });

  // Y5
  it('a version 1, 2 or 3 document loads with an empty strain and a blank fermentation temperature, every number as before, and is saved back as version 4', () => {
    // What version-3 code saved: the yeast without a strain or a temperature.
    const v3Recipe = {
      ...referenceState(),
      name: 'Old lager',
      yeast: { type: 'lager', density: 'low' },
      measurementTempF: { preBoil: 150, postBoil: 60, ferment: 60 },
    };
    const { name, style, notes, ...v2Recipe } = v3Recipe;
    const { measurementTempF, ...v1Recipe } = v2Recipe;
    const loadedYeast = { type: 'lager', density: 'low', name: '', fermTempF: NaN };

    const cases = [
      { version: 3, recipe: v3Recipe, expected: { ...v3Recipe, yeast: loadedYeast } },
      { version: 2, recipe: v2Recipe, expected: { ...v3Recipe, name: '', yeast: loadedYeast } },
      {
        version: 1,
        recipe: v1Recipe,
        expected: {
          ...v3Recipe,
          name: '',
          yeast: loadedYeast,
          measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
        },
      },
    ];
    for (const { version, recipe, expected } of cases) {
      const text = JSON.stringify({ version, recipe, mode: 'pro', proGravityUnit: 'sg' });
      const s = fakeStorage();
      s.setItem(STORAGE_KEY, text);

      const loaded = loadPersisted(s, defaults());
      expect(loaded.recipe, `version ${version}`).toEqual(expected);
      expect(loaded.recipe.yeast.name, `version ${version}`).toBe('');
      expect(loaded.recipe.yeast.fermTempF, `version ${version}`).toBeNaN();
      // Every number as before: the same stats as the recipe as it was saved.
      const before = { ...expected, yeast: recipe.yeast };
      expect(computeRecipe(loaded.recipe), `version ${version}`).toEqual(computeRecipe(before));

      // A file at that version imports the same way.
      expect(importRecipeFile(text, defaults(), () => true).state.recipe, `version ${version}`).toEqual(expected);

      savePersisted(s, loaded);
      expect(JSON.parse(s._map.get(STORAGE_KEY)).version, `version ${version}`).toBe(4);
    }
  });

  // Y6
  it('the printed sheet shows the strain, ale/lager, attenuation and fermentation temperature; a blank prints a dash', () => {
    const today = new Date(2026, 8, 23);
    const sheet = (recipe) => recipeSheet({ recipe, derived: computeRecipe(recipe), mode: 'home', proGravityUnit: 'plato', today });

    const recipe = { ...referenceState(), yeast: { type: 'lager', density: 'mod', name: 'SafLager W-34/70', fermTempF: 52 } };
    const s = sheet(recipe);
    expect(s.yeast.strain).toBe('SafLager W-34/70');
    expect(s.yeast.type).toBe('Lager');
    // 0.8 x 100 = 80, printed to one decimal as every sheet percent.
    expect(s.yeast.attenuation).toBe('80.0');
    expect(s.yeast.fermTemp).toBe('52');
    expect(s.yeast.tempUnit).toBe('°F');
    expect(sheet({ ...recipe, yeast: { ...recipe.yeast, fermTempF: 66.5 } }).yeast.fermTemp).toBe('66.5');

    const blank = sheet(referenceState());
    expect(blank.yeast.strain).toBe('—');
    expect(blank.yeast.type).toBe('Ale');
    expect(blank.yeast.fermTemp).toBe('—');
    expect(sheet({ ...recipe, yeast: { ...recipe.yeast, name: '   ' } }).yeast.strain).toBe('—');
  });

  // Q7
  it('a new recipe has an empty strain, a blank fermentation temperature and attenuation 77 %', () => {
    const s = defaultRecipeState();
    expect(s.yeast.name).toBe('');
    expect(s.yeast.fermTempF).toBeNaN();
    expect(s.yeast.type).toBe('ale');
    expect(s.yeast.density).toBe('mod');
    expect(s.apparentAttenuation).toBe(0.77);
  });
});
