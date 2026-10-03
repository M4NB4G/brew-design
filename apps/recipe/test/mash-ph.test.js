// mash-ph.test.js
// Scenarios for mash pH from the grain bill, item 2 (docs/items/mash-ph.md):
// the malt types in the recipe, the predicted mash pH on the Water tab and
// the printed sheet, and the saved format. Named from the item file's
// scenario list; the sentences are MP-S1, S3, S5, S6, S7 and S8, with the
// decisions MP-Q5 (acidulated malt counted twice), MP-Q8 (an older recipe's
// malts), MP-Q10 (the range warning) and MP-Q12 (where the figure shows).
// The model itself is pinned in the engine (packages/engine/test/water/
// mash-ph.test.js); here every pH is worked out by hand, below.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as engine from '@brew/engine';
const { SALT_CONTRIBUTIONS_PER_G_GAL, ACIDS } = engine;
import ingredients from '../src/ingredients.json';
import * as search from '../src/ingredient-search.js';
const { pickIngredient, typeName, newRow } = search;
const chooseMaltType = (...args) => search.chooseMaltType(...args);
import { defaultRecipeState, DEFAULT_DISPLAY } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState, EXAMPLE_SOURCE, RO_SOURCE } from '../src/water-state.js';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  savePersisted,
  loadPersisted,
  importRecipeFile,
} from '../src/persistence.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import WaterTab from '../src/components/water/WaterTab.jsx';
import RecipeSheet from '../src/components/RecipeSheet.jsx';
import GristTable from '../src/components/GristTable.jsx';

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
const listMalt = (name) => ingredients.malts.find((m) => m.name === name);

// The water untreated: the example report, every salt and acid at 0, so the
// treated mash water is the report itself (Alk 50, Ca 8, Mg 2 mg/L).
const untreated = (source = EXAMPLE_SOURCE) => ({
  ...defaultWaterState(),
  source: { ...source },
  saltOverrides: Object.fromEntries(Object.keys(SALT_CONTRIBUTIONS_PER_G_GAL).map((k) => [k, 0])),
  acidAmounts: Object.fromEntries(Object.keys(ACIDS).map((k) => [k, 0])),
});

// 10 lb of a base malt at 2 °L and 1 lb of a crystal malt at 40 °L in 5 gal
// of mash water.
const malt = (name, type, weightLb, colorL) => ({
  name,
  weightLb,
  fgdb: 0.8,
  colorL,
  type,
  distilledWaterPh: NaN,
  acidityMeqPerKg: NaN,
});
const handRecipe = (source) => ({
  ...defaultRecipeState(),
  malts: [malt('Pale', 'base', 10, 2), malt('Crystal 40', 'crystal', 1, 40)],
  mashWaterGal: 5,
  water: untreated(source),
});

// Worked by hand (Troester 2009 as the item file's S5 decisions read it):
//   mash water 5 gal x 3.785411784 L/gal = 18.92705892 L
//   grain 11 lb x 0.453592 kg/lb = 4.989512 kg
//   mash thickness R = 18.92705892 / 4.989512 = 3.7933688 L/kg
//   base malt: 2 °L x 2.65 - 1.2 = 4.1 EBC; 5.82 - 0.02 x 4.1 = 5.738
//   crystal: 40 °L x 2.65 - 1.2 = 104.8 EBC; 14 + 0.13 x 104.8 = 27.624 mEq/kg
//   grist pH = 5.738 x 10/11 + 5.7 x 1/11 - 0.14 x 27.624 x (1/11) / 3.7933688
//            = 5.2163636 + 0.5181818 - 0.0926823 = 5.6418631
//   residual alkalinity (Kolbach, the Water tab's): 50 - (8/1.4 + 2/1.7)
//            = 50 - 5.7142857 - 1.1764706 = 43.1092437 mg/L as CaCO3
//            / 50.04 = 0.8614957 mEq/L
//   slope = 0.013 x 3.7933688 + 0.013 = 0.0623138
//   pH = 5.6418631 + 0.0623138 x 0.8614957 = 5.6955462
const HAND_PH = 5.6955462;
// The same grist with RO water (Alk 5, Ca 1, Mg 1):
//   RA = 5 - (1/1.4 + 1/1.7) = 5 - 0.7142857 - 0.5882353 = 3.6974790 mg/L
//      / 50.04 = 0.0738905 mEq/L
//   pH = 5.6418631 + 0.0623138 x 0.0738905 = 5.6464675
const HAND_PH_RO = 5.6464675;
// The range a cooled sample is checked against (MP-Q10, Palmer & Kaminski):
// 5.2 to 5.6, the ends inside.
const RANGE_LOW = 5.2;
const RANGE_HIGH = 5.6;

const tab = (recipe, screen = 'salts') =>
  renderToStaticMarkup(
    createElement(WaterTab, {
      water: recipe.water,
      figures: computeWater(recipe.water, recipe),
      mode: 'home',
      screen,
      onScreen: () => {},
      setWater: () => {},
    }),
  );

describe('mash pH from the grain bill (item 2)', () => {
  it('picking a malt copies its type and lab figures', () => {
    // MP-S3: the workbook's type and lab figures are carried by the list.
    const victory = listMalt('Victory');
    expect(victory.type).toBe('crystal');
    expect(victory.acidityMeqPerKg).toBe(20.2);
    expect(victory.distilledWaterPh).toBe(null);
    expect(listMalt('Honey Malt').type).toBe('crystal');
    expect(listMalt('Honey Malt').acidityMeqPerKg).toBe(null);
    expect(listMalt('Rice, Cereal Cooked').type).toBe('base');
    expect(listMalt('Rice Hulls').type).toBe('none');

    // A new row's type is blank and its lab figures blank (NaN).
    const row = newRow('malts');
    expect(row.type).toBe('');
    expect(row.distilledWaterPh).toBeNaN();
    expect(row.acidityMeqPerKg).toBeNaN();

    // Picking copies the type and both lab figures, a blank one as NaN.
    const picked = pickIngredient('malts', row, victory);
    expect(picked.type).toBe('crystal');
    expect(picked.acidityMeqPerKg).toBe(20.2);
    expect(picked.distilledWaterPh).toBeNaN();

    // Picking another malt replaces all three: no figure of Victory's stays.
    const honey = pickIngredient('malts', picked, listMalt('Honey Malt'));
    expect(honey.type).toBe('crystal');
    expect(honey.acidityMeqPerKg).toBeNaN();
    expect(honey.distilledWaterPh).toBeNaN();

    // Choosing the type by hand clears the lab figures: Victory's 20.2 is
    // not a roast malt's.
    const chosen = chooseMaltType(picked, 'roast');
    expect(chosen.type).toBe('roast');
    expect(chosen.acidityMeqPerKg).toBeNaN();
    expect(chosen.distilledWaterPh).toBeNaN();

    // Typing a name changes the name alone, as for the other figures.
    const typed = typeName(picked, 'My biscuit');
    expect(typed.type).toBe('crystal');
    expect(typed.acidityMeqPerKg).toBe(20.2);

    // The grain bill offers the type for a malt typed by hand.
    const html = renderToStaticMarkup(
      createElement(GristTable, {
        malts: [row],
        efficiency: 0.75,
        grist: computeRecipe({ ...defaultRecipeState(), malts: [row] }).grist,
        setRow: () => {},
        addRow: () => {},
        removeRow: () => {},
        setField: () => {},
      }),
    );
    expect(html).toContain('Type');
    for (const t of ['base', 'crystal', 'roast', 'acidulated', 'none']) expect(html).toContain(`value="${t}"`);
  });

  it('the Water tab shows the predicted mash pH', () => {
    const recipe = handRecipe();
    const figures = computeWater(recipe.water, recipe);
    // The treated water is the report itself (nothing added).
    expect(figures.final.ions.Alk).toBeCloseTo(50, 9);
    expect(figures.final.ions.Ca).toBeCloseTo(8, 9);
    expect(figures.final.ions.Mg).toBeCloseTo(2, 9);

    // MP-S1: the predicted mash pH, against the hand-worked figure.
    expect(figures.mashPh.ph).toBeCloseTo(HAND_PH, 6);
    expect(figures.mashPh.needs).toEqual([]);

    // MP-Q12: at the top of the predicted profile card, labelled, cited.
    const html = tab(recipe);
    expect(html).toContain('Predicted mash pH (cooled sample)');
    expect(html).toContain('5.70');
    expect(html).toContain('Troester');
    const at = html.indexOf('Predicted mash pH (cooled sample)');
    expect(at).toBeGreaterThan(html.indexOf('Predicted Final Profile'));
    expect(at).toBeLessThan(html.indexOf('Mash Chemistry'));

    // MP-Q10: outside 5.2–5.6 for a cooled sample, a warning citing the
    // range; inside, none. The ends count as inside.
    expect(figures.mashPh.outsideRange).toBe(true); // 5.6955 > 5.6
    expect(html).toContain('5.2–5.6');
    expect(html).toContain('Palmer');
    const ro = handRecipe(RO_SOURCE);
    expect(computeWater(ro.water, ro).mashPh.ph).toBeCloseTo(HAND_PH_RO, 6);
    // More crystal malt brings it inside: 10 lb base + 3 lb crystal 40 °L.
    //   R = 18.92705892 / (13 x 0.453592) = 18.92705892 / 5.896696 = 3.2097736
    //   grist pH = 5.738 x 10/13 + 5.7 x 3/13 - 0.14 x 27.624 x (3/13) / 3.2097736
    //            = 4.4138462 + 1.3153846 - 0.2780469 = 5.4511838
    //   slope = 0.013 x 3.2097736 + 0.013 = 0.0547271
    //   pH = 5.4511838 + 0.0547271 x 0.8614957 = 5.4983310
    const inside = { ...recipe, malts: [malt('Pale', 'base', 10, 2), malt('Crystal 40', 'crystal', 3, 40)] };
    const insideFigures = computeWater(inside.water, inside);
    expect(insideFigures.mashPh.ph).toBeCloseTo(5.498331, 6);
    expect(insideFigures.mashPh.outsideRange).toBe(false);
    expect(tab(inside)).not.toContain('5.2–5.6');
    // The range itself, and its ends counted inside.
    expect(engine.MASH_PH_RANGE).toEqual({ low: RANGE_LOW, high: RANGE_HIGH });
    expect(engine.mashPhOutsideRange?.(RANGE_LOW)).toBe(false);
    expect(engine.mashPhOutsideRange?.(RANGE_HIGH)).toBe(false);
    expect(engine.mashPhOutsideRange?.(5.19)).toBe(true);
    expect(engine.mashPhOutsideRange?.(5.61)).toBe(true);
    expect(engine.mashPhOutsideRange?.(NaN)).toBe(false);

    // MP-Q5: an acidulated malt in the grain bill and acidulated malt as the
    // Water tab's acid is counted twice, and the Water tab says so.
    const twice = {
      ...recipe,
      malts: [...recipe.malts, malt('Acidulated', 'acidulated', 0.2, 2)],
      water: { ...recipe.water, acidAmounts: { ...recipe.water.acidAmounts, acidulated_malt: 50 } },
    };
    expect(computeWater(twice.water, twice).mashPh.countedTwice).toBe(true);
    expect(tab(twice)).toContain('counted twice');
    expect(computeWater(recipe.water, recipe).mashPh.countedTwice).toBe(false);
    expect(tab(recipe)).not.toContain('counted twice');

    // MP-S5: a blank figure the model needs blanks the pH, shows "—" and is
    // named — a malt's type, weight or colour (no measured figure in its place).
    const blanks = {
      ...recipe,
      malts: [
        { ...malt('Pale', '', 10, 2) },
        { ...malt('Crystal 40', 'crystal', NaN, 40) },
        { ...malt('', 'base', 1, NaN) },
      ],
    };
    const bf = computeWater(blanks.water, blanks);
    expect(bf.mashPh.ph).toBeNaN();
    expect(bf.mashPh.needs).toEqual([
      { malt: 'Pale', field: 'type' },
      { malt: 'Crystal 40', field: 'weightLb' },
      { malt: 'Malt 3', field: 'colorL' },
    ]);
    const blankHtml = tab(blanks, 'water');
    expect(blankHtml).toContain('Blank figures the predicted mash pH needs: Malt type (Pale), Weight (Crystal 40), Color (Malt 3)');
    // The tile shows "—" as its figure (the figure above its label).
    expect(tab(blanks)).toMatch(/>—<\/div><div[^>]*>Predicted mash pH \(cooled sample\)</);
    expect(tab(recipe)).toMatch(/>5\.70<\/div><div[^>]*>Predicted mash pH \(cooled sample\)</);
    // A measured figure stands in for the colour: nothing named.
    const measured = { ...blanks, malts: [{ ...malt('Pale', 'base', 10, NaN), distilledWaterPh: 5.7 }] };
    expect(computeWater(measured.water, measured).mashPh.needs).toEqual([]);
    // A blank test result blanks it too (named by the tab's own line).
    const noReport = { ...recipe, water: { ...recipe.water, source: { ...recipe.water.source, Ca: NaN } } };
    expect(computeWater(noReport.water, noReport).mashPh.ph).toBeNaN();
    expect(tab(noReport, 'water')).toContain('Blank test results: Calcium');
  });

  it('an older recipe loads with its malt types blank and named', () => {
    // MP-S7, MP-Q8: a version-6 document, saved before malt types.
    const old = defaultRecipeState();
    old.malts = old.malts.map(({ name, weightLb, fgdb, colorL }) => ({ name, weightLb, fgdb, colorL }));
    old.water = { ...untreated(), saltOverrides: {}, acidAmounts: null };
    const s = fakeStorage();
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 6, recipe: old, ...DEFAULT_DISPLAY }));
    const loaded = loadPersisted(s, defaults());
    expect(loaded).not.toBe(defaults());
    expect(loaded.recipe.malts.map((m) => m.name)).toEqual(old.malts.map((m) => m.name));
    for (const m of loaded.recipe.malts) {
      expect(m.type).toBe('');
      expect(m.distilledWaterPh).toBeNaN();
      expect(m.acidityMeqPerKg).toBeNaN();
    }
    // The same recipe: every recipe figure as before.
    expect(computeRecipe(loaded.recipe).grist).toEqual(computeRecipe(old).grist);
    // Named on the Water tab, and the pH blank.
    const figures = computeWater(loaded.recipe.water, loaded.recipe);
    expect(figures.mashPh.ph).toBeNaN();
    expect(figures.mashPh.needs.map((n) => n.field)).toEqual(old.malts.map(() => 'type'));
    expect(tab(loaded.recipe, 'water')).toContain(`Malt type (${old.malts[0].name})`);

    // Saved back at the next version, carrying the blank types.
    expect(SCHEMA_VERSION).toBe(7);
    savePersisted(s, loaded);
    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(7);
    expect(doc.recipe.malts[0].type).toBe('');
    expect(loadPersisted(s, defaults()).recipe.malts[0].type).toBe('');

    // The recipe file reads it the same way.
    const imported = importRecipeFile(JSON.stringify({ version: 6, recipe: old, ...DEFAULT_DISPLAY }), defaults(), () => true);
    expect(imported.outcome).toBe('replaced');
    expect(imported.state.recipe.malts[0].type).toBe('');

    // A version-7 document is readable only with a type the model knows.
    const bad = { ...loaded.recipe, malts: [{ ...loaded.recipe.malts[0], type: 'smoked' }] };
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 7, recipe: bad, ...DEFAULT_DISPLAY }));
    expect(loadPersisted(s, defaults())).toEqual(defaults());
    const noType = { ...loaded.recipe, malts: [{ name: 'Pale', weightLb: 10, fgdb: 0.8, colorL: 2 }] };
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 7, recipe: noType, ...DEFAULT_DISPLAY }));
    expect(loadPersisted(s, defaults())).toEqual(defaults());
  });

  it('the printed sheet prints the predicted pH beside the measured box', () => {
    // MP-S6.
    const recipe = handRecipe();
    const water = computeWater(recipe.water, recipe);
    const derived = computeRecipe(recipe);
    const sheet = recipeSheet({ recipe, derived, water, mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 9, 2) });
    expect(sheet.water.mashPhLabel).toBe('Mash pH (cooled sample)');
    expect(sheet.water.mashPhPredicted).toBe('5.70');
    const html = renderToStaticMarkup(
      createElement(RecipeSheet, { recipe, derived, water, mode: 'home', proGravityUnit: 'plato' }),
    );
    expect(html).toMatch(/Mash pH \(cooled sample\)[\s\S]*?predicted 5\.70/);
    // A blank prints "—".
    const blank = { ...recipe, malts: [malt('Pale', '', 10, 2)] };
    const blankSheet = recipeSheet({
      recipe: blank,
      derived: computeRecipe(blank),
      water: computeWater(blank.water, blank),
      mode: 'home',
      proGravityUnit: 'plato',
      today: new Date(2026, 9, 2),
    });
    expect(blankSheet.water.mashPhPredicted).toBe('—');
  });

  it('nothing else changes', () => {
    // MP-S8: the types and lab figures move no other figure.
    const typed = handRecipe();
    const untyped = {
      ...typed,
      malts: typed.malts.map((m) => ({ ...m, type: '', distilledWaterPh: 5.5, acidityMeqPerKg: 99 })),
    };
    expect(computeRecipe(untyped)).toEqual(computeRecipe(typed));
    const { mashPh: a, ...restTyped } = computeWater(typed.water, typed);
    const { mashPh: b, ...restUntyped } = computeWater(untyped.water, untyped);
    expect(restUntyped).toEqual(restTyped);
    expect(a.ph).not.toBe(b.ph);

    // The built-in recipe's malts are base malts (MP-Q2 names pale and
    // Munich), with no lab figures.
    for (const m of defaultRecipeState().malts) {
      expect(m.type).toBe('base');
      expect(m.distilledWaterPh).toBeNaN();
      expect(m.acidityMeqPerKg).toBeNaN();
    }
  });
});
