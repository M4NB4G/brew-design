// acid-in-mash.test.js
// Scenarios for "acid into the mash", batch S5b item C
// (docs/items/mash-ph-acid.md, AM-S1 to AM-S6; AM-Q1 as the owner revised it
// on 2026-10-03: recipe format 8). Every figure is worked out by hand,
// below, from the engine's own constants (acids.js, styles.js, ra.js) and
// the mash pH model as items 1 and A pin it.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACIDS } from '@brew/engine';
import { defaultRecipeState, DEFAULT_DISPLAY, breweryFiguresFromRecipe, newRecipe } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState, EXAMPLE_SOURCE, setWaterSetup } from '../src/water-state.js';
import { STORAGE_KEY, SCHEMA_VERSION, savePersisted, loadPersisted } from '../src/persistence.js';
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

const malt = (name, weightLb, colorL) => ({
  name,
  weightLb,
  fgdb: 0.8,
  colorL,
  type: 'base',
  distilledWaterPh: NaN,
  acidityMeqPerKg: NaN,
});
const noAcid = () => Object.fromEntries(Object.keys(ACIDS).map((k) => [k, 0]));

// The owner's West Coast Pilsner (the item file's case): 20 lb of base malt,
// 8 gal of mash water, the example report, Pilsner / Light Lager, the tank
// treated at 14 gal and topped up to 12, fly sparge 10 gal, kettle salts on,
// the salts as recommended, 75 % phosphoric as the acid.
const wcPils = ({ acidPlace, acidMl = null, treatment = 'tank' } = {}) => ({
  ...defaultRecipeState(),
  name: 'Home Grown WC Pils',
  malts: [malt('Pilsner Northstar', 12, 2), malt('Pilsner Weyermann', 7, 1.8), malt('Carafoam', 1, 2)],
  mashWaterGal: 8,
  water: {
    ...defaultWaterState(),
    source: { ...EXAMPLE_SOURCE },
    styleId: 'pilsner',
    primaryAcid: 'phosphoric_75',
    treatment,
    tankTreatedGal: 14,
    tankTopUpGal: 12,
    spargeMethod: 'fly',
    spargeGal: 10,
    kettleSalts: true,
    ...(acidPlace === undefined ? {} : { acidPlace }),
    acidAmounts: acidMl === null ? null : { ...noAcid(), phosphoric_75: acidMl },
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
    today: new Date(2026, 9, 3),
  });

// By hand. The style's target residual alkalinity is -40 mg/L as CaCO3
// (Pilsner / Light Lager); the salts bring calcium and magnesium to 50 and
// 10, so the alkalinity the acid aims at is -40 + 50 / 1.4 + 10 / 1.7
// = -40 + 35.7142857142857 + 5.88235294117647 = 1.59663865546218 mg/L, from
// the report's 50: 48.4033613445378 mg/L to take out, or 48.4033613445378 /
// 50.04 = 0.967293392976375 mEq/L.
// 75 % phosphoric: 1.579 g/mL x 0.75 x 1000 / 97.99 = 12.0854168792734 mEq/mL.
//   Into the mash, for the 8 gal of mash water (8 x 3.785411784 =
//   30.283294272 L): 0.967293392976375 x 30.283294272 = 29.2928304426576
//   mEq = 29.2928304426576 / 12.0854168792734 = 2.42381630152081 mL.
//   With the salts, for the tank's 14 gal (52.995764976 L):
//   51.2624532746509 mEq = 4.24167852766142 mL.
const MASH_REC_MEQ = 29.2928304426576;
const MASH_REC_ML = 2.42381630152081;
const TANK_REC_MEQ = 51.2624532746509;
const TANK_REC_ML = 4.24167852766142;
// The water the mash draws at the recommendation: alkalinity
// 1.59663865546218 mg/L, the residual alkalinity -40 mg/L, either way.
// Mash pH (items 1 and A): grist 5.74171 (12 x 5.738 + 7 x 5.7486 + 5.738,
// over 20); R 3.33816450378314 L/kg; slope 0.0563961385491808; acid slope
// 0.0706253181215894; residual alkalinity -40 / 50.04 = -0.799360511590727
// mEq/L: 5.74171 - 0.0563961385491808 x 0.799360511590727 = 5.69662915383759.
const REC_ALK = 1.59663865546218;
const REC_PH = 5.69662915383759;
// 3 mL into the mash: 3 x 12.0854168792734 = 36.2562506378202 mEq over
// 30.283294272 L = 1.19723... mEq/L = 59.9096903269864 mg/L as CaCO3;
// alkalinity 50 - 59.9096903269864 = -9.9096903269864 mg/L (acid past
// neutral: item A). Calcium and magnesium 41.5966386554622 mg/L =
// 0.831267758902122 mEq/L.
//   pH = 5.74171 - 0.0563961385491808 x 0.831267758902122
//        + 0.0706253181215894 x (-9.9096903269864 / 50.04) = 5.68084339671016.
const ML3_ALK = -9.9096903269864;
const ML3_PH = 5.68084339671016;

describe('acid into the mash (S5b item C)', () => {
  it('the acid can go into the mash', () => {
    // AM-S1: with the tank treated, the choice is offered; with the mash
    // water treated it is not (they are the same water), and is not used.
    const salts = wcPils();
    expect(computeWater(salts.water, salts).setup.offered.acidPlaces).toEqual(['salts', 'mash']);
    expect(tab(salts)).toContain('>With the salts (HLT)</option>');
    expect(tab(salts)).toContain('>Into the mash</option>');
    const mashTreated = wcPils({ treatment: 'mash', acidPlace: 'mash' });
    const mf = computeWater(mashTreated.water, mashTreated);
    expect(mf.setup.offered.acidPlaces).toEqual(['salts']);
    expect(mf.setup.acidPlace).toBe('salts');
    expect(tab(mashTreated)).not.toContain('>With the salts (HLT)</option>');

    // AM-S2: into the mash, the recommendation is dosed for the mash water.
    const recipe = wcPils({ acidPlace: 'mash' });
    const f = computeWater(recipe.water, recipe);
    expect(f.setup.acidPlace).toBe('mash');
    expect(f.acid.recommendedMeq).toBeCloseTo(MASH_REC_MEQ, 6);
    expect(f.acid.recommended).toBeCloseTo(MASH_REC_ML, 6);
    expect(f.acid.amounts.phosphoric_75).toBeCloseTo(MASH_REC_ML, 6);
    // The salts stay in the tank as today: the same amounts, the same draws.
    const sf = computeWater(salts.water, salts);
    expect(f.salts).toEqual(sf.salts);
    expect(f.tank).toEqual(sf.tank);
    expect(f.kettle).toEqual(sf.kettle);

    // AM-S3: the predicted profile is the water the mash draws, and the
    // mash pH reads it.
    expect(f.final.ions.Ca).toBeCloseTo(50, 6);
    expect(f.final.ions.Mg).toBeCloseTo(10, 6);
    expect(f.final.ions.Alk).toBeCloseTo(REC_ALK, 6);
    expect(f.mashPh.ph).toBeCloseTo(REC_PH, 6);
    const three = wcPils({ acidPlace: 'mash', acidMl: 3 });
    const tf = computeWater(three.water, three);
    expect(tf.final.ions.Alk).toBeCloseTo(ML3_ALK, 6);
    expect(tf.mashPh.ph).toBeCloseTo(ML3_PH, 6);
    // The sparge and the tank's leftover carry no acid, and the screen says so.
    const html = tab(three);
    expect(html).toContain('The acid goes into the mash; the sparge and the water left in the HLT carry none.');
    expect(html).not.toContain('The acid goes in the HLT with the salts, so the sparge liquor');
    expect(html).toContain('The water the mash draws (the treated HLT water with the acid)');
    // A blank mash water blanks the acid's dose and the profile; the tab names it.
    const blank = { ...recipe, mashWaterGal: NaN };
    const bf = computeWater(blank.water, blank);
    expect(bf.acid.recommended).toBeNaN();
    expect(bf.final).toBeNull();
    expect(bf.mashPh.ph).toBeNaN();
    expect(bf.blank).toContain('mashWaterGal');

    // Choosing where the acid goes returns the acid to the recommendation;
    // the brewer's own salts stay.
    const own = { ...three.water, saltOverrides: { gypsum: 2 } };
    const moved = setWaterSetup(own, 'acidPlace', 'salts');
    expect(moved.acidAmounts).toBeNull();
    expect(moved.saltOverrides).toEqual({ gypsum: 2 });
  });

  it('with the salts nothing changes', () => {
    // AM-S6, AM-Q3: the default is with the salts, today's behaviour.
    expect(defaultWaterState().acidPlace).toBe('salts');
    expect(defaultRecipeState().water.acidPlace).toBe('salts');
    const recipe = wcPils();
    const f = computeWater(recipe.water, recipe);
    expect(f.setup.acidPlace).toBe('salts');
    expect(f.acid.recommendedMeq).toBeCloseTo(TANK_REC_MEQ, 6);
    expect(f.acid.recommended).toBeCloseTo(TANK_REC_ML, 6);
    expect(f.final.ions.Alk).toBeCloseTo(REC_ALK, 6);
    expect(f.mashPh.ph).toBeCloseTo(REC_PH, 6);
    expect(tab(recipe)).toContain('The acid goes in the HLT with the salts, so the sparge liquor');
    expect(tab(recipe)).toContain('The treated HLT water (first fill)');
    // The mash water treated: the choice changes nothing.
    const a = wcPils({ treatment: 'mash' });
    const b = wcPils({ treatment: 'mash', acidPlace: 'mash' });
    const { setup: sa, ...fa } = computeWater(a.water, a);
    const { setup: sb, ...fb } = computeWater(b.water, b);
    expect(fb).toEqual(fa);
  });

  it('a recipe saved without the choice reads with the acid with the salts', () => {
    // AM-S5, AM-Q1 (revised 2026-10-03): recipe format 8.
    expect(SCHEMA_VERSION).toBe(9);
    const s = fakeStorage();
    const recipe = wcPils({ acidPlace: 'mash' });
    savePersisted(s, { recipe, ...DEFAULT_DISPLAY });
    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(9);
    expect(doc.recipe.water.acidPlace).toBe('mash');
    const defaults = { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY };
    expect(loadPersisted(s, defaults).recipe.water.acidPlace).toBe('mash');

    // A version-7 document (the live site's, before the choice) reads with the
    // acid with the salts, and is saved back as 8.
    const { acidPlace, ...v7water } = doc.recipe.water;
    s.setItem(STORAGE_KEY, JSON.stringify({ ...doc, version: 7, recipe: { ...doc.recipe, water: v7water } }));
    const read = loadPersisted(s, defaults);
    expect(read).not.toBe(defaults);
    expect(read.recipe.water.acidPlace).toBe('salts');
    expect(read.recipe.mashWaterGal).toBe(8);
    savePersisted(s, read);
    expect(JSON.parse(s._map.get(STORAGE_KEY)).version).toBe(9);
    // A version-4 document (before the water entries) reads with the built-in ones.
    const { water, ...v4recipe } = doc.recipe;
    s.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...doc,
        version: 4,
        recipe: { ...v4recipe, malts: v4recipe.malts.map(({ type, distilledWaterPh, acidityMeqPerKg, ...m }) => m) },
      }),
    );
    expect(loadPersisted(s, defaults).recipe.water.acidPlace).toBe('salts');
    // A version-8 document without it, or with a place the tab does not
    // offer, is not a recipe: a new one is opened.
    s.setItem(STORAGE_KEY, JSON.stringify({ ...doc, recipe: { ...doc.recipe, water: v7water } }));
    expect(loadPersisted(s, defaults)).toBe(defaults);
    s.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...doc, recipe: { ...doc.recipe, water: { ...doc.recipe.water, acidPlace: 'kettle' } } }),
    );
    expect(loadPersisted(s, defaults)).toBe(defaults);

    // Not a brewery figure (AM-Q2): the brewery takes none from the recipe,
    // and a new recipe has the acid with the salts.
    const brewery = breweryFiguresFromRecipe(recipe, 'home', 'plato');
    expect(brewery.water).not.toHaveProperty('acidPlace');
    expect(newRecipe(brewery).recipe.water.acidPlace).toBe('salts');
  });

  it('the printed sheet names the place', () => {
    // AM-S4.
    const place = (recipe) =>
      sheetOf(recipe).water.additions.find((a) => a.name === '75% Phosphoric Acid')?.place;
    expect(place(wcPils({ acidPlace: 'mash' }))).toBe('Mash');
    expect(place(wcPils())).toBe('HLT');
    expect(place(wcPils({ treatment: 'mash' }))).toBe('Mash');
    // The salts stay in the HLT.
    const salts = sheetOf(wcPils({ acidPlace: 'mash' })).water.additions.filter((a) => a.name.startsWith('Gypsum'));
    expect(salts.map((a) => a.place)).toEqual(['HLT', 'Kettle']);
    // The dose printed is the mash water's: 2 mL (2.42 to whole mL).
    expect(sheetOf(wcPils({ acidPlace: 'mash' })).water.additions.find((a) => a.place === 'Mash').amount).toBe('2');
  });
});
