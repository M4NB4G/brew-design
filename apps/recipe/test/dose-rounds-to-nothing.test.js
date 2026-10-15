// dose-rounds-to-nothing.test.js
// Scenarios for "A dose too small to show is left off the printed sheet"
// (docs/items/dose-rounds-to-nothing.md, DZ-S1 to DZ-S4, Tier C): an addition
// whose amount shows as zero at its printed precision is left off the sheet;
// one that shows a figure prints as before; the Water tab keeps showing the
// small dose; with every addition left off the sheet prints what it prints
// when nothing is added.
//
// The small doses are the Water tab's own recommendations, worked by hand.
// Source water at the IPA family's targets but for calcium (target 120 mg/L,
// source 119.5) and sulfate 100, chloride 75: gypsum brings 61.5 mg/L of
// calcium per g/gal (the engine's contribution table), so the shortfall of
// 0.5 mg/L over 5 gal of mash water is 0.5 / 61.5 x 5 = 0.04065 g, which
// prints "0.0" at Home (0.1 g) and "0" in Pro (1 g). At 1 mg/L short
// (calcium 119) it is 1 / 61.5 x 5 = 0.0813 g, "0.1" at Home. The acid is the
// recommendation to a mash pH of 5.589, a hair under what the water gives
// with none (5.5906): 0.0405 mL of 88 % lactic acid, "0.0" at Home and "0" in
// Pro; to 5.57 it is 0.4548 mL, "0.5" at Home and still "0" in Pro (under
// 0.5 mL). The kettle's and the water back's salts are handed to the sheet as
// the derived values (a sheet prints the figures it is given): 0.04 g shows
// as nothing at Home, 0.4 g in Pro; 0.06 g shows "0.1" at Home, 0.6 g "1" in Pro.

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REFERENCE_TEMP_F } from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import RecipeSheet from '../src/components/RecipeSheet.jsx';
import WaterTab from '../src/components/water/WaterTab.jsx';

const TODAY = new Date(2026, 9, 15);
const GYPSUM = 'Gypsum (CaSO₄·2H₂O)';
const LACTIC = '88% Lactic Acid';

const recipe = ({ calcium = 119.5, ph = 5.589, water = {} } = {}) => {
  const r = defaultRecipeState();
  return {
    ...r,
    waterBack: { on: true, volumeGal: 1, tempF: REFERENCE_TEMP_F },
    water: {
      ...r.water,
      source: { Ca: calcium, Mg: 18, Na: 15, SO4: 100, Cl: 75, Alkalinity: 5, pH: 7 },
      styleId: 'ipa',
      enabledSalts: ['gypsum', 'calcium_chloride'],
      spargeGal: 4,
      kettleSalts: true,
      mashPhTarget: ph,
      ...water,
    },
  };
};

// The Water tab's figures, the kettle's and the water back's gypsum handed
// over as given (grams; a null water back grams adds nothing there).
const figures = (r, kettleG, backG) => {
  const w = computeWater(r.water, r);
  return {
    ...w,
    kettle: { ...w.kettle, salts: [{ key: 'gypsum', name: GYPSUM, amount: kettleG }] },
    fermenter: { ...w.fermenter, add: backG === null ? [] : [{ key: 'gypsum', name: GYPSUM, grams: backG }] },
  };
};
const sheetOf = (r, mode, kettleG, backG) =>
  recipeSheet({ recipe: r, derived: computeRecipe(r), water: figures(r, kettleG, backG), mode, proGravityUnit: 'plato', today: TODAY });
const printed = (r, mode, kettleG, backG) =>
  renderToStaticMarkup(createElement(RecipeSheet, { recipe: r, derived: computeRecipe(r), water: figures(r, kettleG, backG), mode, proGravityUnit: 'plato' }));
const rows = (s) => s.water.additions.map((a) => [a.place, a.name, a.amount, a.unit]);
const flat = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

describe('a dose too small to show is left off the printed sheet', () => {
  it('a dose that shows as zero is left off the sheet, at Home and in Pro', () => {
    // DZ-S1: the mash salt, the liquid acid, the kettle salt and the water
    // back's salt, each real and above zero, each printing as nothing.
    const r = recipe();
    const w = computeWater(r.water, r);
    expect(w.salts.find((x) => x.key === 'gypsum').amount).toBeCloseTo(0.5 / 61.5 * 5, 6);
    expect(w.acid.rows.find((x) => x.key === 'lactic_88').amount).toBeCloseTo(0.0405, 4);
    const home = sheetOf(r, 'home', 0.04, 0.04);
    expect(rows(home)).toEqual([]);
    const pro = sheetOf(r, 'pro', 0.4, 0.4);
    expect(rows(pro)).toEqual([]);

    // The acidulated malt (oz at Home, lb in Pro, two places) is left off too.
    const malt = recipe({ ph: 5.5905, water: { primaryAcid: 'acidulated_malt' } });
    const g = computeWater(malt.water, malt).acid.rows.find((x) => x.key === 'acidulated_malt').amount;
    expect(g).toBeGreaterThan(0);
    expect(g).toBeLessThan(0.14); // under 0.005 oz (0.005 x 28.35 = 0.1417 g)
    expect(rows(sheetOf(malt, 'home', 0.04, 0.04))).toEqual([]);
    expect(rows(sheetOf(malt, 'pro', 0.4, 0.4))).toEqual([]);
  });

  it('a dose that shows a figure prints as before', () => {
    // DZ-S2: on one sheet, the doses that show a figure print to the same
    // digits and the ones that show nothing are left off beside them. Home:
    // gypsum 0.0813 g "0.1" (calcium 119, by hand above), lactic to 5.57
    // 0.4548 mL "0.5", kettle 0.06 g "0.1", water back 0.06 g "0.1".
    const r = recipe({ calcium: 119, ph: 5.57 });
    expect(rows(sheetOf(r, 'home', 0.06, 0.06))).toEqual([
      ['Mash', GYPSUM, '0.1', 'g'],
      ['Mash', LACTIC, '0.5', 'mL'],
      ['Kettle', GYPSUM, '0.1', 'g'],
      ['Water back', GYPSUM, '0.1', 'g'],
    ]);
    // Mixed: the gypsum shows 0.1, the acid (0.0405 mL) shows nothing.
    const mixed = recipe({ calcium: 119 });
    expect(rows(sheetOf(mixed, 'home', 0.04, 0.06))).toEqual([
      ['Mash', GYPSUM, '0.1', 'g'],
      ['Water back', GYPSUM, '0.1', 'g'],
    ]);
    // Pro: whole grams and whole mL. Gypsum 0.0813 g "0" and lactic 0.4548 mL
    // "0" are left off; the kettle's 0.6 g prints "1", the water back's 0.4 g
    // nothing.
    expect(rows(sheetOf(r, 'pro', 0.6, 0.4))).toEqual([['Kettle', GYPSUM, '1', 'g']]);
    // Lactic to 5.5: 1.8923 mL prints "2" in Pro.
    const more = recipe({ ph: 5.5 });
    expect(rows(sheetOf(more, 'pro', 0.4, 0.4))).toEqual([['Mash', LACTIC, '2', 'mL']]);
  });

  it('the Water tab still shows the small dose', () => {
    // DZ-S3: the boxes and the "rec" hints show the dose as today.
    const r = recipe();
    const w = computeWater(r.water, r);
    const tab = (mode) =>
      flat(renderToStaticMarkup(createElement(WaterTab, { water: r.water, figures: w, mode, screen: 'salts', onScreen: () => {}, setWater: () => {} })));
    const home = tab('home');
    expect(home).toMatch(/Gypsum \(CaSO₄·2H₂O\) Top up .*? g rec 0\.0 g/);
    expect(home).toMatch(/mL rec 0\.0 mL/);
    const pro = tab('pro');
    expect(pro).toMatch(/Gypsum \(CaSO₄·2H₂O\) Top up .*? g rec 0 g/);
    expect(pro).toMatch(/mL rec 0 mL/);
  });

  it('with every addition left off the sheet prints what it prints when nothing is added', () => {
    // DZ-S4: a recipe whose water needs nothing (calcium at the target, the
    // acid aim above the water's own pH) has no additions; the same recipe
    // with every dose too small to show prints the same additions table.
    const none = recipe({ calcium: 120, ph: 5.6 });
    const wn = computeWater(none.water, none);
    expect(wn.salts.every((x) => x.amount === 0)).toBe(true);
    expect(wn.acid.rows.every((x) => x.amount === 0)).toBe(true);
    const empty = printed(none, 'home', 0, null);
    expect(rows(sheetOf(none, 'home', 0, null))).toEqual([]);
    const small = printed(recipe(), 'home', 0.04, 0.04);
    const table = (markup) => markup.slice(markup.indexOf('Where'), markup.indexOf('Mash pH'));
    expect(table(small)).toBe(table(empty));
    expect(table(small)).toContain('<tbody></tbody>');
  });
});
