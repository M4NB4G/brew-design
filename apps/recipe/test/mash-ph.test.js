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
    expect(html).toMatch(/>5\.7<\/div><div[^>]*>Predicted mash pH \(cooled sample\)</); // one decimal (PL-S4)
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
    expect(tab(recipe)).toMatch(/>5\.7<\/div><div[^>]*>Predicted mash pH \(cooled sample\)</);
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

    // Saved back at the current version, carrying the blank types.
    expect(SCHEMA_VERSION).toBe(10);
    savePersisted(s, loaded);
    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(10);
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
    expect(sheet.water.mashPhLabel).toBe('Mash pH (cooled sample),');
    expect(sheet.water.mashPhPredicted).toBe('5.7');
    const html = renderToStaticMarkup(
      createElement(RecipeSheet, { recipe, derived, water, mode: 'home', proGravityUnit: 'plato' }),
    );
    expect(html).toMatch(/Mash pH \(cooled sample\),[\s\S]*?predicted 5\.7</);
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

// S5b item B (docs/items/mash-ph-acid.md, TR-S1 to TR-S3): the range the
// model was tested on — residual alkalinity from -5.61 to +14.3 mEq/L
// (Troester 2009, Table 3) and mash thickness from 2 to 5 L/kg (Tables 15
// and 16), the ends inside.
const RA_LOW = -5.61;
const RA_HIGH = 14.3;
const R_LOW = 2;
const R_HIGH = 5;

// The owner's West Coast Pilsner (the item file's case): Pilsner Northstar
// 12 lb (2 °L), Pilsner Weyermann 7 lb (1.8 °L), Carafoam 1 lb (2 °L), all
// base; 8 gal of mash water; the example report; Pilsner / Light Lager; the
// tank treated at 14 gal, topped up to 12; fly sparge 10 gal; kettle salts
// on; the salts as recommended; 75 % phosphoric as the acid.
const wcPils = (acidMl = null, mashWaterGal = 8) => ({
  ...defaultRecipeState(),
  name: 'Home Grown WC Pils',
  malts: [
    malt('Pilsner Northstar', 'base', 12, 2),
    malt('Pilsner Weyermann', 'base', 7, 1.8),
    malt('Carafoam', 'base', 1, 2),
  ],
  mashWaterGal,
  water: {
    ...defaultWaterState(),
    source: { ...EXAMPLE_SOURCE },
    styleId: 'pilsner',
    primaryAcid: 'phosphoric_75',
    treatment: 'tank',
    tankTreatedGal: 14,
    tankTopUpGal: 12,
    spargeMethod: 'fly',
    spargeGal: 10,
    kettleSalts: true,
    acidAmounts:
      acidMl === null ? null : { ...Object.fromEntries(Object.keys(ACIDS).map((k) => [k, 0])), phosphoric_75: acidMl },
  },
});

const NOTE_START = 'Beyond the range the model was tested on (Troester 2009): ';
const NOTE_END = '; this prediction is unreliable.';

describe('the tested range', () => {
  it('beyond the tested range the predicted pH warns', () => {
    // 35 mL of 75 % phosphoric in the tank's 14 gal, by hand: the engine's
    // acid figures, 1.579 g/mL x 0.75 x 1000 / 97.99 = 12.0854168792734
    // mEq/mL; 35 mL = 422.989590774569 mEq; over 14 x 3.785411784 =
    // 52.995764976 L = 7.98157345150365 mEq/L = 399.397935513243 mg/L as CaCO3.
    // Alkalinity 50 - 399.397935513243 = -349.397935513243 mg/L. The salts
    // bring calcium and magnesium to the style's 50 and 10:
    // 50 / 1.4 + 10 / 1.7 = 41.5966386554622 mg/L. Residual alkalinity
    // -349.397935513243 - 41.5966386554622 = -390.994574168705 mg/L
    // = -7.81364057091737 mEq/L: below -5.61.
    // The pH still shows. Grist: 1.8 °L = 3.57 EBC -> 5.82 - 0.0714 = 5.7486;
    // 2 °L = 4.1 EBC -> 5.738; (12 x 5.738 + 7 x 5.7486 + 1 x 5.738) / 20
    // = 114.8342 / 20 = 5.74171. R = 8 x 3.785411784 / (20 x 0.453592)
    // = 3.33816450378314 L/kg (inside 2-5); slope 0.0563961385491808; acid
    // slope 0.0814 x 0.0563961385491808 / 0.065 = 0.0706253181215894.
    // pH = 5.74171 - 0.0563961385491808 x 0.831267758902122
    //      + 0.0706253181215894 x -6.98237281201525 = 5.20169740720538.
    const recipe = wcPils(35);
    const figures = computeWater(recipe.water, recipe);
    expect(figures.final.ions.Ca).toBeCloseTo(50, 6);
    expect(figures.final.ions.Mg).toBeCloseTo(10, 6);
    expect(figures.final.ions.Alk).toBeCloseTo(-349.397935513243, 6);
    expect(figures.mashPh.ph).toBeCloseTo(5.20169740720538, 6);
    expect(figures.mashPh.testedRange).toEqual([{ figure: 'residualAlkalinity', side: 'below', limit: RA_LOW }]);
    const html = tab(recipe);
    expect(html).toMatch(/>5\.2<\/div><div[^>]*>Predicted mash pH \(cooled sample\)</);
    expect(html).toContain(`${NOTE_START}residual alkalinity below −5.61 mEq/L${NOTE_END}`);

    // At the recommendation the water is inside: no note.
    const rec = wcPils();
    const recFigures = computeWater(rec.water, rec);
    expect(recFigures.mashPh.testedRange).toEqual([]);
    expect(tab(rec)).not.toContain(NOTE_START);

    // The mash thickness: 20 lb = 9.07184 kg; 1.9 L/kg is 1.9 x 9.07184 /
    // 3.785411784 = 4.55340052378302 gal of mash water, 5.1 L/kg is
    // 12.2222856164702 gal.
    const thin = wcPils(null, 12.2222856164702);
    expect(computeWater(thin.water, thin).mashPh.testedRange).toEqual([
      { figure: 'thickness', side: 'above', limit: R_HIGH },
    ]);
    expect(tab(thin)).toContain(`${NOTE_START}mash thickness above 5 L/kg${NOTE_END}`);
    const thick = wcPils(35, 4.55340052378302);
    expect(computeWater(thick.water, thick).mashPh.testedRange).toEqual([
      { figure: 'residualAlkalinity', side: 'below', limit: RA_LOW },
      { figure: 'thickness', side: 'below', limit: R_LOW },
    ]);
    expect(tab(thick)).toContain(
      `${NOTE_START}residual alkalinity below −5.61 mEq/L, mash thickness below 2 L/kg${NOTE_END}`,
    );

    // Each edge is inside; just past it is not; a blank warns of nothing.
    const crossed = (ra, r) => engine.mashPhTestedRangeCrossed?.({ residualAlkalinityMeq: ra, thicknessLPerKg: r });
    expect(engine.MASH_PH_TESTED_RANGE).toEqual({
      residualAlkalinityMeq: { low: RA_LOW, high: RA_HIGH },
      thicknessLPerKg: { low: R_LOW, high: R_HIGH },
    });
    expect(crossed(RA_LOW, 3)).toEqual([]);
    expect(crossed(RA_HIGH, 3)).toEqual([]);
    expect(crossed(0, R_LOW)).toEqual([]);
    expect(crossed(0, R_HIGH)).toEqual([]);
    expect(crossed(-5.62, 3)).toEqual([{ figure: 'residualAlkalinity', side: 'below', limit: RA_LOW }]);
    expect(crossed(14.31, 3)).toEqual([{ figure: 'residualAlkalinity', side: 'above', limit: RA_HIGH }]);
    expect(crossed(0, 1.99)).toEqual([{ figure: 'thickness', side: 'below', limit: R_LOW }]);
    expect(crossed(0, 5.01)).toEqual([{ figure: 'thickness', side: 'above', limit: R_HIGH }]);
    expect(crossed(NaN, NaN)).toEqual([]);
    expect(tab(rec)).not.toContain('above 14.3');
    // A blank pH carries no note.
    const blank = { ...recipe, malts: [malt('Pale', '', 10, 2)] };
    expect(computeWater(blank.water, blank).mashPh.testedRange).toEqual([]);
  });

  it('the printed sheet carries the note', () => {
    // TR-S2.
    const sheetOf = (recipe) => {
      const water = computeWater(recipe.water, recipe);
      const derived = computeRecipe(recipe);
      return {
        data: recipeSheet({ recipe, derived, water, mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 9, 3) }),
        html: renderToStaticMarkup(
          createElement(RecipeSheet, { recipe, derived, water, mode: 'home', proGravityUnit: 'plato' }),
        ),
      };
    };
    const note = `${NOTE_START}residual alkalinity below −5.61 mEq/L${NOTE_END}`;
    const beyond = sheetOf(wcPils(35));
    expect(beyond.data.water.mashPhPredicted).toBe('5.2');
    expect(beyond.data.water.mashPhNote).toBe(note);
    expect(beyond.html).toMatch(/predicted 5\.2<[\s\S]*?Beyond the range the model was tested on/);
    expect(beyond.html).toContain(note);
    const inside = sheetOf(wcPils());
    expect(inside.data.water.mashPhNote).toBeNull();
    expect(inside.html).not.toContain(NOTE_START);
  });

  it('nothing else changes', () => {
    // TR-S3: a warning; no figure moves. The predicted pH is the engine's
    // model on the treated profile, as before; the water figures carry the
    // note's crossings and nothing else new.
    for (const recipe of [wcPils(35), wcPils(), handRecipe()]) {
      const figures = computeWater(recipe.water, recipe);
      expect(figures.mashPh.ph).toBe(
        engine.mashPh({ malts: recipe.malts, mashWaterGal: recipe.mashWaterGal, water: figures.final.ions }),
      );
      expect(Object.keys(figures.mashPh).sort()).toEqual(['countedTwice', 'needs', 'outsideRange', 'ph', 'testedRange']);
    }
  });
});
