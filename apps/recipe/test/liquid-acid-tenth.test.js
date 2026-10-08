// liquid-acid-tenth.test.js
// Scenarios for the roadmap item "Acid shown to the tenth of a mL" (S10
// item 2, Tier C; decided 2026-10-07 by the owner: liquid acid shows and
// prints to 0.1 mL). Liquid acid used to show and print to whole mL, so a
// small dose read well off (a 2.42 mL dose showed "2", and a brewer typing
// what was shown dosed 2). Only how the dose reads changes: every dose is the
// engine's, and salts and acidulated malt keep their precision.
//
// The doses are the owner's West Coast Pilsner of acid-in-mash.test.js, whose
// working by hand is there: 75 % phosphoric is 12.0854168792734 mEq/mL
// (1.579 g/mL x 0.75 x 1000 / 97.99); the acid aimed at mash pH 5.4 is
// 156.678550361551 mEq into the 8 gal (30.283294272 L) of mash water =
// 12.9642652733193 mL, and 274.187463132714 mEq into the tank's 14 gal =
// 22.6874642283088 mL. To 0.1 mL those read 13.0 and 22.7 (12.96 rounds up to
// 13.0; 22.687 to 22.7). A dose the brewer types, 2.4 mL, reads 2.4.
// Rendered to markup with react-dom/server, as acid-in-mash.test.js does.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACIDS } from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState, EXAMPLE_SOURCE } from '../src/water-state.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import WaterTab from '../src/components/water/WaterTab.jsx';

const MASH_REC_ML = 12.9642652733193;
const TANK_REC_ML = 22.6874642283088;

const malt = (name, weightLb, colorL) => ({
  name,
  weightLb,
  fgdb: 0.8,
  colorL,
  type: 'base',
  distilledWaterPh: NaN,
  acidityMeqPerKg: NaN,
  pricePerLb: NaN,
});
const noAcid = () => Object.fromEntries(Object.keys(ACIDS).map((k) => [k, 0]));

// The West Coast Pilsner: 20 lb of base malt, 8 gal of mash water, the
// example report, the tank treated at 14 gal topped up to 12, 75 %
// phosphoric as the acid, in the mash or with the salts; `acidMl` is the
// brewer's own dose (null follows the recommendation).
const wcPils = ({ acidPlace, acidMl = null } = {}) => ({
  ...defaultRecipeState(),
  malts: [malt('Pilsner Northstar', 12, 2), malt('Pilsner Weyermann', 7, 1.8), malt('Carafoam', 1, 2)],
  mashWaterGal: 8,
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
    acidPlace,
    acidAmounts: acidMl === null ? null : { ...noAcid(), phosphoric_75: acidMl },
  },
});

const tab = (recipe, mode = 'home') =>
  renderToStaticMarkup(
    createElement(WaterTab, {
      water: recipe.water,
      figures: computeWater(recipe.water, recipe),
      mode,
      proVolumeUnit: 'bbl',
      screen: 'salts',
      onScreen: () => {},
      setWater: () => {},
    }),
  );
const text = (html) =>
  html
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ');
// The value in the amount box labelled `label`.
const boxValue = (html, label) => {
  const input = html.match(new RegExp(`<input[^>]*aria-label="${label.replace(/[()]/g, '\\$&')}"[^>]*>`));
  return input?.[0].match(/value="([^"]*)"/)?.[1];
};
const sheetOf = (recipe, mode = 'home') =>
  recipeSheet({
    recipe,
    derived: computeRecipe(recipe),
    water: computeWater(recipe.water, recipe),
    mode,
    proGravityUnit: 'plato',
    today: new Date(2026, 9, 8),
  });
const acidOnSheet = (recipe, mode) => sheetOf(recipe, mode).water.additions.find((a) => a.name === '75% Phosphoric Acid');

describe('liquid acid to the tenth of a mL (S10 item 2)', () => {
  it('the Salts & Acid screen shows a liquid acid dose and its recommendation to 0.1 mL, at Home and in Pro', () => {
    const LABEL = '75% Phosphoric Acid (mL)';
    // The recommendations are the hand figures above.
    const mash = wcPils({ acidPlace: 'mash' });
    const tank = wcPils({ acidPlace: 'salts' });
    expect(computeWater(mash.water, mash).acid.recommended).toBeCloseTo(MASH_REC_ML, 9);
    expect(computeWater(tank.water, tank).acid.recommended).toBeCloseTo(TANK_REC_ML, 9);

    for (const mode of ['home', 'pro']) {
      // Following the recommendation: the box and the "rec" hint read 13.0 / 22.7.
      expect(boxValue(tab(mash, mode), LABEL), `${mode} mash box`).toBe('13.0');
      expect(text(tab(mash, mode)), `${mode} mash hint`).toContain('rec 13.0 mL');
      expect(boxValue(tab(tank, mode), LABEL), `${mode} tank box`).toBe('22.7');
      expect(text(tab(tank, mode)), `${mode} tank hint`).toContain('rec 22.7 mL');
      // The brewer's own dose reads as typed, to the tenth, beside the same recommendation.
      const own = wcPils({ acidPlace: 'mash', acidMl: 2.4 });
      expect(boxValue(tab(own, mode), LABEL), `${mode} own box`).toBe('2.4');
      expect(text(tab(own, mode)), `${mode} own hint`).toContain('rec 13.0 mL');
    }
  });

  it('the printed sheet prints a liquid acid dose to 0.1 mL, and salts and acidulated malt keep their precision', () => {
    for (const mode of ['home', 'pro']) {
      expect(acidOnSheet(wcPils({ acidPlace: 'mash' }), mode), mode).toMatchObject({ place: 'Mash', amount: '13.0', unit: 'mL' });
      expect(acidOnSheet(wcPils({ acidPlace: 'salts' }), mode), mode).toMatchObject({ place: 'HLT', amount: '22.7', unit: 'mL' });
      expect(acidOnSheet(wcPils({ acidPlace: 'mash', acidMl: 2.4 }), mode), mode).toMatchObject({ amount: '2.4', unit: 'mL' });
    }
    // Unchanged: salts at 0.1 g in Home and 1 g in Pro, as the sheet printed them.
    const gypsum = (mode) => sheetOf(wcPils({ acidPlace: 'mash' }), mode).water.additions.find((a) => a.name.startsWith('Gypsum'));
    expect(gypsum('home').amount).toMatch(/^\d+\.\d$/);
    expect(gypsum('pro').amount).toMatch(/^\d+$/);
    // Acidulated malt stays at 0.01 oz (Home) and 0.01 lb (Pro).
    const malted = { ...wcPils({ acidPlace: 'mash' }) };
    malted.water = { ...malted.water, primaryAcid: 'acidulated_malt', acidAmounts: null };
    const maltRow = (mode) => sheetOf(malted, mode).water.additions.find((a) => a.name.startsWith('Acidulated'));
    expect(maltRow('home').amount).toMatch(/^\d+\.\d\d$/);
    expect(maltRow('pro').amount).toMatch(/^\d+\.\d\d$/);
  });
});
