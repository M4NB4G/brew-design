// water-back-from-the-hlt.test.js
// Scenarios for batch S15c item 3, "Water back drawn from the hot-liquor
// tank" (docs/items/water-back-from-the-hlt.md, WD-S1 to WD-S5, WD-Q6): with
// the HLT treated and water back on, the water back is drawn from the tank
// after the sparge, as typed, carrying its share of the tank's salts (and of
// the acid when the acid goes with the salts); with the mash water treated it
// is untreated source water. The Water tab and the printed sheet list what it
// carries; "Total water" stays the mash and sparge water (WD-Q6).
//
// Worked by hand. The built-in recipe (mash water 5 gal) with a water report,
// the HLT treated: 10 gal first fill, topped up to 10, a 4 gal batch sparge,
// gypsum 10 g (the brewer's own) and 2 mL of 88 % lactic acid with the salts.
//   The mash draws 5 of the 10 treated gal: 5/10 of the tank's salts and acid
//   stay. The tank holds 10 gal as the sparge draws 4; 6 gal are left.
//   Water back 1 gal: drawn from the 6, 5 gal left.
//     its share: 5/10 x 1/10 = 0.05; gypsum 10 x 0.05 = 0.5 g; lactic 2 x 0.05 = 0.1 mL
//     left:      5/10 x 5/10 = 0.25; gypsum 10 x 0.25 = 2.5 g
//   Water back 7 gal: draws the 6 gal left, 0 left, the other 1 gal untreated.
//     its share: 5/10 x 6/10 = 0.3; gypsum 10 x 0.3 = 3.0 g; lactic 2 x 0.3 = 0.6 mL

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REFERENCE_TEMP_F } from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import RecipeSheet from '../src/components/RecipeSheet.jsx';
import WaterTab from '../src/components/water/WaterTab.jsx';

const TODAY = new Date(2026, 9, 13);

const recipe = ({ waterBack = { on: true, volumeGal: 1, tempF: REFERENCE_TEMP_F }, water = {} } = {}) => {
  const r = defaultRecipeState();
  return {
    ...r,
    waterBack,
    water: {
      ...r.water,
      source: { Ca: 20, Mg: 5, Na: 10, SO4: 30, Cl: 20, Alkalinity: 80, pH: 7.5 },
      treatment: 'tank',
      acidPlace: 'salts',
      vessels: 3,
      spargeMethod: 'batch',
      spargeGal: 4,
      tankTreatedGal: 10,
      tankTopUpGal: 10,
      saltOverrides: { gypsum: 10 },
      acidAmounts: { lactic_88: 2 },
      ...water,
    },
  };
};

const flat = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
const salts = (r) =>
  flat(
    renderToStaticMarkup(
      createElement(WaterTab, { water: r.water, figures: computeWater(r.water, r), mode: 'home', screen: 'salts', onScreen: () => {}, setWater: () => {} }),
    ),
  );
const sheet = (r) => recipeSheet({ recipe: r, derived: computeRecipe(r), water: computeWater(r.water, r), mode: 'home', proGravityUnit: 'plato', today: TODAY });
const printed = (r) =>
  flat(renderToStaticMarkup(createElement(RecipeSheet, { recipe: r, derived: computeRecipe(r), water: computeWater(r.water, r), mode: 'home', proGravityUnit: 'plato' })));

describe('water back drawn from the hot-liquor tank (S15c item 3)', () => {
  it('WD-S1, WD-S4: the water back is drawn from the HLT after the sparge, and the tab and the sheet list what it carries', () => {
    const r = recipe();
    const w = computeWater(r.water, r);
    expect(w.tank.toWaterBackGal).toBe(1);
    expect(w.tank.leftGal).toBe(5);
    expect(w.waterBack.salts.gypsum).toBeCloseTo(0.5, 12);
    expect(w.waterBack.acids).toEqual({ lactic_88: expect.closeTo(0.1, 12) });
    expect(w.tank.leftSalts.gypsum).toBeCloseTo(2.5, 12);
    // Every salt's shares add to what went in the tank.
    for (const k of Object.keys(w.tank.mashSalts)) {
      expect(w.tank.mashSalts[k] + w.tank.spargeSalts[k] + w.waterBack.salts[k] + w.tank.leftSalts[k]).toBeCloseTo(
        w.tank.mashSalts[k] / (5 / 10),
        9,
      );
    }

    const t = salts(r);
    // In the tank's order: the sparge, the water back (every salt, gypsum
    // among them, then the acid), what is left.
    const at = (label) => t.indexOf(label);
    expect(at('Carried by the sparge 4.00 gal')).toBeGreaterThan(-1);
    expect(at('Water back, to the fermenter 1.00 gal')).toBeGreaterThan(at('Carried by the sparge'));
    expect(at('Left in the HLT, not used 5.00 gal')).toBeGreaterThan(at('Water back, to the fermenter'));
    const carried = t.slice(at('Water back, to the fermenter'), at('Left in the HLT'));
    expect(carried).toMatch(/Gypsum \(CaSO₄·2H₂O\) 0\.5 g/);
    expect(carried).toMatch(/88% Lactic Acid 0\.1 mL $/);
    expect(t.slice(at('Left in the HLT'))).toMatch(/Gypsum \(CaSO₄·2H₂O\) 2\.5 g/);
    // Total water stays the mash and sparge water (WD-Q6).
    expect(t).toContain('Total water gal 9.00');
    expect(t).toContain('Water back is drawn from the HLT after the sparge');
    expect(t).not.toContain('Water back is not in the water figures');

    const s = sheet(r);
    expect(s.water.volumes.find((v) => v.label === 'Total water').value).toBe('9.00');
    expect(s.water.volumes.find((v) => v.label === 'Water back, to the fermenter').value).toBe('1.00');
    expect(s.water.volumes.find((v) => v.label === 'Left in the HLT, not used').value).toBe('5.00');
    const p = printed(r);
    const carries = p.slice(p.indexOf('Water back carries'), p.indexOf('Water back is drawn from the HLT after the sparge'));
    expect(carries).toMatch(/Gypsum \(CaSO₄·2H₂O\) 0\.5 g, /);
    expect(carries).toMatch(/, 88% Lactic Acid 0\.1 mL\. $/);

    // With the acid into the mash, the water back carries no acid.
    const intoMash = recipe({ water: { acidPlace: 'mash' } });
    const wm = computeWater(intoMash.water, intoMash);
    expect(wm.waterBack.acids).toEqual({});
    expect(wm.waterBack.salts.gypsum).toBeCloseTo(0.5, 12);
  });

  it('WD-S2: a water back more than the HLT holds after the sparge draws what is left, and the rest is untreated', () => {
    const r = recipe({ waterBack: { on: true, volumeGal: 7, tempF: REFERENCE_TEMP_F } });
    const w = computeWater(r.water, r);
    expect(w.tank.toWaterBackGal).toBe(6);
    expect(w.tank.leftGal).toBe(0);
    expect(w.waterBack.salts.gypsum).toBeCloseTo(3, 12);
    expect(w.waterBack.acids.lactic_88).toBeCloseTo(0.6, 12);
    expect(w.warnings.waterBackOverTank).toBe(true);
    const t = salts(r);
    expect(t).toContain(
      'The water back (7.00 gal) is more than the HLT holds after the sparge (6.00 gal): the other 1.00 gal is untreated water and carries no salts',
    );
    expect(t).toMatch(/Left in the HLT, not used 0\.00 gal/);
    // Within it, no warning.
    expect(salts(recipe())).not.toContain('is more than the HLT holds after the sparge');
  });

  it('WD-S3: with the mash water treated the water back is untreated source water and carries no salts', () => {
    const r = recipe({ water: { treatment: 'mash' } });
    const w = computeWater(r.water, r);
    expect(w.waterBack.salts).toEqual({});
    expect(w.waterBack.acids).toEqual({});
    const t = salts(r);
    expect(t).toMatch(/Water back, to the fermenter gal 1\.00 untreated, no salts/);
    expect(t).toContain('Water back is untreated source water and carries no salts');
    expect(sheet(r).water.volumes.find((v) => v.label === 'Water back, to the fermenter').value).toBe('1.00');
    expect(printed(r)).toContain('Water back is untreated source water and carries no salts');
  });

  it('K: a blank water back blanks what it draws and is named on the Water tab', () => {
    const r = recipe({ waterBack: { on: true, volumeGal: NaN, tempF: REFERENCE_TEMP_F } });
    const w = computeWater(r.water, r);
    expect(w.tank.leftGal).toBeNaN();
    expect(w.blank).toContain('waterBackGal');
    expect(salts(r)).toContain('Water back');
  });

  it('WD-S5: with water back off every figure is as today', () => {
    const off = recipe({ waterBack: { on: false, volumeGal: 1, tempF: 170 } });
    const w = computeWater(off.water, off);
    expect(w.waterBack).toBeNull();
    expect(w.tank.leftGal).toBe(6);
    expect(w.tank.leftSalts.gypsum).toBeCloseTo(10 * (5 / 10) * (6 / 10), 12);
    expect(w.blank).toEqual([]);
    const t = salts(off);
    expect(t).not.toContain('Water back');
    expect(sheet(off).water.volumes.map((v) => v.label)).not.toContain('Water back, to the fermenter');
    expect(sheet(off).water.waterBackNote).toBeNull();
  });
});
