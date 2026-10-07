// acid-aimed.test.js
// Scenarios for "The acid aimed at a mash pH", batch S9
// (docs/items/acid-aimed-at-mash-ph.md, AA-S1 to AA-S6, AA-Q1 to AA-Q7).
// Every figure is worked out by hand, below, from the engine's own constants
// (acids.js, styles.js, ra.js, units.js) and the mash pH model as
// mash-ph.test.js and acid-in-mash.test.js pin it.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACIDS, solveAdditions, saltTotals, findStyle } from '@brew/engine';
import { defaultRecipeState, DEFAULT_DISPLAY, breweryFiguresFromRecipe, newRecipe } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import {
  defaultWaterState,
  EXAMPLE_SOURCE,
  setMashPhTarget,
  setAcidAmount,
  setSaltAmount,
  setTestResult,
} from '../src/water-state.js';
import { STORAGE_KEY, SCHEMA_VERSION, savePersisted, loadPersisted, BREWERY_VERSION } from '../src/persistence.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import WaterTab from '../src/components/water/WaterTab.jsx';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

const malt = (name, weightLb, colorL, type = 'base') => ({
  name,
  weightLb,
  fgdb: 0.8,
  colorL,
  type,
  distilledWaterPh: NaN,
  acidityMeqPerKg: NaN,
  pricePerLb: NaN,
});
const noAcid = () => Object.fromEntries(Object.keys(ACIDS).map((k) => [k, 0]));

// The owner's West Coast Pilsner (acid-in-mash.test.js): 20 lb of base malt,
// 8 gal of mash water, the example report, Pilsner / Light Lager, the tank
// treated at 14 gal and topped up to 12, fly sparge 10 gal, kettle salts on,
// the salts as recommended, 75 % phosphoric as the acid.
const wcPils = ({ acidPlace = 'salts', treatment = 'tank', target, malts } = {}) => ({
  ...defaultRecipeState(),
  name: 'Home Grown WC Pils',
  malts: malts ?? [malt('Pilsner Northstar', 12, 2), malt('Pilsner Weyermann', 7, 1.8), malt('Carafoam', 1, 2)],
  mashWaterGal: 8,
  water: {
    ...defaultWaterState(),
    source: { ...EXAMPLE_SOURCE },
    styleId: 'pilsner',
    primaryAcid: 'phosphoric_75',
    treatment,
    acidPlace,
    tankTreatedGal: 14,
    tankTopUpGal: 12,
    spargeMethod: 'fly',
    spargeGal: 10,
    kettleSalts: true,
    ...(target === undefined ? {} : { mashPhTarget: target }),
  },
});

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
const sheetOf = (recipe) =>
  recipeSheet({
    recipe,
    derived: computeRecipe(recipe),
    water: computeWater(recipe.water, recipe),
    mode: 'home',
    proGravityUnit: 'plato',
    today: new Date(2026, 9, 7),
  });

// By hand, the West Coast Pilsner. The salts bring calcium and magnesium to
// 50 and 10 mg/L and add no alkalinity, so the water before the acid has the
// report's 50 mg/L (acid-in-mash.test.js).
// Grist pH (5.82 - 0.02 x EBC; 2 degL = 4.1 EBC, 5.738; 1.8 degL = 3.57 EBC,
// 5.7486): (12 x 5.738 + 7 x 5.7486 + 5.738) / 20 = 5.74171.
// R = 8 x 3.785411784 / (20 x 0.453592) = 30.283294272 / 9.07184
//   = 3.33816450378314 L/kg; slope 0.013 x R + 0.013 = 0.0563961385491808;
//   acid side 0.0814 x 0.0563961385491808 / 0.065 = 0.0706253181215894.
// Hardness -(50 / 1.4 + 10 / 1.7) / 50.04 = -0.831267758902122 mEq/L.
// At zero alkalinity: 5.74171 - 0.0563961385491808 x 0.831267758902122
//   = 5.69482970829749. Before the acid (50 mg/L): 5.74171 +
//   0.0563961385491808 x (50 - 41.5966386554622) / 50.04 = 5.75118076600051.
// Target 5.4, below 5.6948...: the acid side, (5.4 - 5.69482970829749) /
//   0.0706253181215894 x 50.04 = -208.895039280488 mg/L; to take out
//   258.895039280488 mg/L = 5.17376177618880 mEq/L.
// 75 % phosphoric: 1.579 x 0.75 x 1000 / 97.99 = 12.0854168792734 mEq/mL.
//   Into the mash (8 gal, 30.283294272 L): 156.678550361551 mEq
//   = 12.9642652733193 mL.
//   With the salts (the tank's 14 gal, 52.995764976 L): 274.187463132714
//   mEq = 22.6874642283088 mL.
const PH_BEFORE_ACID = 5.75118076600051;
const MASH_MEQ = 156.678550361551;
const MASH_ML = 12.9642652733193;
const TANK_MEQ = 274.187463132714;
const TANK_ML = 22.6874642283088;
const ALK_AT_54 = -208.895039280488;
// Target 5.7, above 5.6948...: the published slope, (5.7 - 5.69482970829749)
//   / 0.0563961385491808 x 50.04 = 4.58757289859510 mg/L; to take out
//   45.4124271014049 mg/L = 0.907522524009690 mEq/L; into the mash
//   27.4827716530294 mEq = 2.27404415814258 mL.
const MASH_ML_57 = 2.27404415814258;
// The style's alkalinity (acid-in-mash.test.js, before this item): -40 +
//   50 / 1.4 + 10 / 1.7 = 1.59663865546218 mg/L, into the mash
//   2.42381630152081 mL.
const STYLE_MASH_ML = 2.42381630152081;
// 3 mL into the mash (acid-in-mash.test.js): mash pH 5.68084339671016.
const ML3_PH = 5.68084339671016;

describe('the acid aimed at a mash pH (S9)', () => {
  it('AA-S1: the acid recommendation is the dose that brings the predicted mash pH to the target, for where the acid goes', () => {
    // Into the mash: dosed for the mash water.
    const mash = wcPils({ acidPlace: 'mash' });
    const mf = computeWater(mash.water, mash);
    expect(mf.acid.recommendedMeq).toBeCloseTo(MASH_MEQ, 6);
    expect(mf.acid.recommended).toBeCloseTo(MASH_ML, 6);
    expect(mf.acid.amounts.phosphoric_75).toBeCloseTo(MASH_ML, 6);
    expect(mf.final.ions.Alk).toBeCloseTo(ALK_AT_54, 6);
    expect(mf.mashPh.ph).toBeCloseTo(5.4, 9);
    // Without the acid, the mash reads above the target.
    const none = { ...mash, water: { ...mash.water, acidAmounts: noAcid() } };
    expect(computeWater(none.water, none).mashPh.ph).toBeCloseTo(PH_BEFORE_ACID, 9);
    // With the salts, the tank treated: dosed for the tank's 14 gal; the mash
    // draws the same water.
    const tank = wcPils();
    const tf = computeWater(tank.water, tank);
    expect(tf.acid.recommendedMeq).toBeCloseTo(TANK_MEQ, 6);
    expect(tf.acid.recommended).toBeCloseTo(TANK_ML, 6);
    expect(tf.mashPh.ph).toBeCloseTo(5.4, 9);
    // The mash water treated: dosed for the mash water, as into the mash.
    const treated = wcPils({ treatment: 'mash' });
    const df = computeWater(treated.water, treated);
    expect(df.acid.recommended).toBeCloseTo(MASH_ML, 6);
    expect(df.mashPh.ph).toBeCloseTo(5.4, 9);
    // A target above zero alkalinity's pH: the published slope.
    const high = wcPils({ acidPlace: 'mash', target: 5.7 });
    const hf = computeWater(high.water, high);
    expect(hf.acid.recommended).toBeCloseTo(MASH_ML_57, 6);
    expect(hf.mashPh.ph).toBeCloseTo(5.7, 9);
    // The tab says what the dose aims at.
    expect(tab(mash)).toContain('To a mash pH of 5.4');
    // AA-Q2: a target past the tested range is dosed, with the warning, no cap.
    const low = wcPils({ acidPlace: 'mash', target: 5.0 });
    const lf = computeWater(low.water, low);
    expect(lf.mashPh.ph).toBeCloseTo(5.0, 9);
    expect(lf.mashPh.testedRange.map((c) => c.figure)).toContain('residualAlkalinity');
  });

  it('AA-S2: the recipe carries a target mash pH, 5.4 by default, entered on the Water tab; a blank target is named and blanks the acid recommendation', () => {
    expect(defaultWaterState().mashPhTarget).toBe(5.4);
    expect(defaultRecipeState().water.mashPhTarget).toBe(5.4);
    const recipe = wcPils({ acidPlace: 'mash' });
    expect(tab(recipe)).toContain('aria-label="Target mash pH (cooled sample)"');
    const blank = wcPils({ acidPlace: 'mash', target: NaN });
    const f = computeWater(blank.water, blank);
    expect(f.acid.recommended).toBeNaN();
    expect(f.acid.recommendedMeq).toBeNaN();
    expect(f.acid.amounts.phosphoric_75).toBeNaN();
    expect(f.final).toBeNull();
    expect(f.mashPh.ph).toBeNaN();
    // The salts stay as recommended.
    expect(f.salts).toEqual(computeWater(recipe.water, recipe).salts);
    expect(tab(blank)).toContain('Blank figure the acid recommendation needs: Target mash pH');
    expect(tab(recipe)).not.toContain('Blank figure the acid recommendation needs');
    // The brewer's own acid still gives a profile and a pH.
    const own = { ...blank, water: { ...blank.water, acidAmounts: { ...noAcid(), phosphoric_75: 3 } } };
    expect(computeWater(own.water, own).mashPh.ph).toBeCloseTo(ML3_PH, 9);
  });

  it("AA-S3: the salts still follow the style's mineral targets; the style's alkalinity and residual alkalinity show as information and no longer set the acid", () => {
    const recipe = wcPils({ acidPlace: 'mash' });
    const f = computeWater(recipe.water, recipe);
    // The salts are the solver's for the style, unchanged.
    const solved = saltTotals(
      solveAdditions({
        source: EXAMPLE_SOURCE,
        target: findStyle('pilsner').profile,
        volumeGallons: 14,
        raiseAlkSource: 'baking_soda',
        enabledSalts: new Set(defaultWaterState().enabledSalts),
      }).additions,
    );
    expect(Object.fromEntries(f.salts.filter((r) => r.recommended > 0).map((r) => [r.key, r.recommended]))).toEqual(solved);
    // The style's figures are still the targets shown beside the profile.
    expect(f.target.Alk).toBe(2);
    expect(f.target.RA).toBe(-40);
    const html = tab(recipe);
    expect(html).toContain('tgt -40');
    expect(html).toContain('tgt 2');
    // The acid no longer brings the water to them: the residual alkalinity
    // is far below the style's -40.
    expect(f.final.residualAlkalinity).toBeCloseTo(ALK_AT_54 - 41.5966386554622, 6);
  });

  it('AA-S4: changing the target returns the brewer\'s own acid amounts to the recommendation', () => {
    const recipe = wcPils({ acidPlace: 'mash' });
    let w = setAcidAmount(recipe.water, computeWater(recipe.water, recipe).acid.amounts, 'phosphoric_75', 3);
    w = setSaltAmount(w, 'gypsum', 2);
    const next = setMashPhTarget(w, 5.7);
    expect(next.mashPhTarget).toBe(5.7);
    expect(next.acidAmounts).toBeNull();
    // The brewer's own salts stay.
    expect(next.saltOverrides).toEqual({ gypsum: 2 });
    const own = { ...next, saltOverrides: {} };
    const f = computeWater(own, { ...recipe, water: own });
    expect(f.acid.amounts.phosphoric_75).toBeCloseTo(MASH_ML_57, 6);
    // A blank target too.
    expect(setMashPhTarget(w, NaN).acidAmounts).toBeNull();
  });

  it('AA-S5: the printed sheet prints the target beside the predicted and the measured mash pH', () => {
    const sheet = sheetOf(wcPils({ acidPlace: 'mash' }));
    expect(sheet.water.mashPhTarget).toBe('5.4');
    expect(sheet.water.mashPhPredicted).toBe('5.4');
    expect(sheetOf(wcPils({ acidPlace: 'mash', target: 5.35 })).water.mashPhTarget).toBe('5.35');
    expect(sheetOf(wcPils({ acidPlace: 'mash', target: NaN })).water.mashPhTarget).toBe('—');
  });

  it('AA-S6: nothing else changes: the salts, every recipe figure, and the predicted pH for the same entries', () => {
    // The same acid gives the same pH as before this item (acid-in-mash.test.js).
    const recipe = wcPils({ acidPlace: 'mash' });
    const three = { ...recipe, water: { ...recipe.water, acidAmounts: { ...noAcid(), phosphoric_75: 3 } } };
    expect(computeWater(three.water, three).mashPh.ph).toBeCloseTo(ML3_PH, 9);
    // The target is read by no recipe figure.
    expect(computeRecipe({ ...recipe, water: { ...recipe.water, mashPhTarget: 5.7 } })).toEqual(computeRecipe(recipe));
  });

  it("AA-Q1: when the mash pH cannot be predicted, the acid falls back to the style's alkalinity, with a note naming why", () => {
    const untyped = wcPils({
      acidPlace: 'mash',
      malts: [malt('Pilsner Northstar', 12, 2), malt('Pilsner Weyermann', 7, 1.8), malt('Carafoam', 1, 2, '')],
    });
    const f = computeWater(untyped.water, untyped);
    expect(f.mashPh.ph).toBeNaN();
    expect(f.acid.aimedAt).toBe('style');
    expect(f.acid.recommended).toBeCloseTo(STYLE_MASH_ML, 6);
    expect(tab(untyped)).toContain("Aimed at the style&#x27;s alkalinity: the predicted mash pH needs Malt type (Carafoam)");
    // Predicted, it aims at the target and says nothing of the style.
    const typed = wcPils({ acidPlace: 'mash' });
    expect(computeWater(typed.water, typed).acid.aimedAt).toBe('target');
    expect(tab(typed)).not.toContain('Aimed at the style');
  });

  it('AA-Q3: already at or below the target without acid, no acid; the alkalinity-raising salt follows the style', () => {
    // A stout: 8 lb of 2 degL base, 1.5 lb of roast, 1 lb of 120 degL
    // crystal in 4 gal, the mash water treated. By hand, roughly: base pH
    // 5.738 x 8 / 10.5 = 4.3718; specialty 5.7 x 2.5 / 10.5 = 1.3571; acidity
    // 40 x 1.5 / 10.5 + (14 + 0.13 x (2.65 x 120 - 1.2)) x 1 / 10.5 = 5.714
    // + 5.255 = 10.969 mEq/kg, R = 15.1416 / 4.7627 = 3.179 L/kg, so -0.14 x
    // 10.969 / 3.179 = -0.483; grist pH 5.246, and the stout's calcium and
    // magnesium take the water's residual alkalinity below zero: about 5.21,
    // under 5.4.
    const recipe = {
      ...defaultRecipeState(),
      malts: [malt('Pale', 8, 2), malt('Roast barley', 1.5, 500, 'roast'), malt('Crystal 120', 1, 120, 'crystal')],
      mashWaterGal: 4,
      water: { ...defaultWaterState(), source: { ...EXAMPLE_SOURCE }, styleId: 'stout' },
    };
    const f = computeWater(recipe.water, recipe);
    expect(f.acid.recommended).toBe(0);
    const solved = saltTotals(
      solveAdditions({
        source: EXAMPLE_SOURCE,
        target: findStyle('stout').profile,
        volumeGallons: 4,
        raiseAlkSource: 'baking_soda',
        enabledSalts: new Set(defaultWaterState().enabledSalts),
      }).additions,
    );
    expect(solved.baking_soda).toBeGreaterThan(0);
    expect(f.raiseSalt.recommended).toBeCloseTo(solved.baking_soda, 9);
    expect(tab(recipe)).toContain('No acid: the predicted mash pH is at or below 5.4 without it');
  });

  it('AA-Q7: when the mash is above the target without the alkalinity-raising salt, the acid aims at the target and no raising salt is recommended', () => {
    // An amber ale: 9 lb of 2 degL base, 1 lb of 10 degL base, 1 lb of 60 degL
    // crystal in 4 gal, the mash water treated. The style's alkalinity (73
    // mg/L) calls for baking soda on the report's 50; the mash without it
    // reads about 5.54 (grist 5.692 - 0.14 x 3.45 / 2.83 = 5.52, plus the
    // water's), above 5.4.
    const recipe = {
      ...defaultRecipeState(),
      malts: [malt('Pale', 9, 2), malt('Munich', 1, 10), malt('Crystal 60', 1, 60, 'crystal')],
      mashWaterGal: 4,
      water: { ...defaultWaterState(), source: { ...EXAMPLE_SOURCE }, styleId: 'amber_ale' },
    };
    const solved = saltTotals(
      solveAdditions({
        source: EXAMPLE_SOURCE,
        target: findStyle('amber_ale').profile,
        volumeGallons: 4,
        raiseAlkSource: 'baking_soda',
        enabledSalts: new Set(defaultWaterState().enabledSalts),
      }).additions,
    );
    expect(solved.baking_soda).toBeGreaterThan(0);
    const f = computeWater(recipe.water, recipe);
    expect(f.raiseSalt.recommended).toBe(0);
    expect(f.acid.recommended).toBeGreaterThan(0);
    expect(f.mashPh.ph).toBeCloseTo(5.4, 9);
    // The other salts are the style's, as solved.
    const { baking_soda, ...others } = solved;
    expect(Object.fromEntries(f.salts.filter((r) => r.recommended > 0).map((r) => [r.key, r.recommended]))).toEqual(others);
  });

  it('AA-Q4, AA-Q5: recipe format 12, every earlier format read with the target 5.4; not a brewery figure', () => {
    expect(SCHEMA_VERSION).toBe(12);
    expect(BREWERY_VERSION).toBe(6);
    const s = fakeStorage();
    const recipe = wcPils({ acidPlace: 'mash', target: 5.5 });
    savePersisted(s, { recipe, ...DEFAULT_DISPLAY });
    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(12);
    const defaults = { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY };
    expect(loadPersisted(s, defaults).recipe.water.mashPhTarget).toBe(5.5);
    // Blank round-trips as blank.
    savePersisted(s, { recipe: wcPils({ target: NaN }), ...DEFAULT_DISPLAY });
    expect(loadPersisted(s, defaults).recipe.water.mashPhTarget).toBeNaN();
    // A version-11 document reads with 5.4 and is saved back as 12.
    const { mashPhTarget, ...v11water } = doc.recipe.water;
    s.setItem(STORAGE_KEY, JSON.stringify({ ...doc, version: 11, recipe: { ...doc.recipe, water: v11water } }));
    const read = loadPersisted(s, defaults);
    expect(read).not.toBe(defaults);
    expect(read.recipe.water.mashPhTarget).toBe(5.4);
    savePersisted(s, read);
    expect(JSON.parse(s._map.get(STORAGE_KEY)).version).toBe(12);
    // A version-12 document without it, or with text, is not a recipe.
    s.setItem(STORAGE_KEY, JSON.stringify({ ...doc, recipe: { ...doc.recipe, water: v11water } }));
    expect(loadPersisted(s, defaults)).toBe(defaults);
    s.setItem(STORAGE_KEY, JSON.stringify({ ...doc, recipe: { ...doc.recipe, water: { ...v11water, mashPhTarget: '5.4' } } }));
    expect(loadPersisted(s, defaults)).toBe(defaults);
    // Not a brewery figure: the brewery takes none, a new recipe has 5.4.
    const brewery = breweryFiguresFromRecipe(recipe, 'home', 'plato');
    expect(brewery.water).not.toHaveProperty('mashPhTarget');
    expect(newRecipe(brewery).recipe.water.mashPhTarget).toBe(5.4);
    // A new test result returns the acid to the recommendation, as before.
    expect(setTestResult({ ...recipe.water, acidAmounts: noAcid() }, 'Ca', 9).acidAmounts).toBeNull();
  });
});
