// hlt-sparge-past-tank.test.js
// Scenarios for "The HLT's figures when the sparge is more than the tank
// holds" (docs/items/hlt-sparge-past-tank.md, HT-S1 to HT-S3, HT-Q1, HT-Q2;
// Tier A + B), the app's part: the Water tab and the printed sheet show the
// water left in the HLT held at 0, and the sparge warning follows the water
// the tank holds. The engine's figures are pinned by hand in
// packages/engine/test/water/hlt-sparge-past-tank.test.js.
//
// The water treatment item's worked example (water-treatment.test.js): the
// IPA family, gypsum the only salt on hand, a test report of no calcium and
// 48.12 mg/L of sulfate: 1.2 g/gal of gypsum, 1.2 x 12 = 14.4 g for the
// HLT's 12 gal first fill. By hand:
//   12 treated, 7 mash, top-up 8, sparge 8.5: the mash draws 14.4 x 7/12 =
//     8.4 g; the 5 gal left are topped up to 8, and the sparge, more than
//     the 8 gal, draws them all: 14.4 x 5/12 = 6.0 g; 8 - 8.5 is held at
//     0.00 gal left, 0.0 g.
//   12 treated, 5 mash, top-up 6: 7 gal of treated water left, above 6, so
//     the tank holds 7. A sparge of 6.5 is less: no sparge warning, 7 - 6.5
//     = 0.50 gal left. A sparge of 7.5 is more: warned against the 7 gal,
//     the sparge carries 14.4 x 7/12 = 8.4 g, 0.00 gal and 0.0 g left.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState } from '../src/water-state.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import WaterTab from '../src/components/water/WaterTab.jsx';

const text = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');

// 20 lb of grain, 14 gal before the boil at 60 °F; the mash water, the
// top-up level and the sparge as each case types them.
const recipe = ({ mashWaterGal, tankTopUpGal, spargeGal }) => {
  const r = defaultRecipeState();
  return {
    ...r,
    malts: [
      { ...r.malts[0], weightLb: 15 },
      { ...r.malts[1], weightLb: 5 },
    ],
    preBoilVolGal: 14,
    mashWaterGal,
    water: {
      ...defaultWaterState(),
      source: { Ca: 0, Mg: 0, Na: 0, SO4: 48.12, Cl: 0, Alkalinity: 0, pH: 7 },
      styleId: 'ipa',
      enabledSalts: ['gypsum'],
      spargeGal,
      treatment: 'tank',
      tankTreatedGal: 12,
      tankTopUpGal,
    },
  };
};

const screen = (r) =>
  text(
    renderToStaticMarkup(
      createElement(WaterTab, {
        water: r.water,
        figures: computeWater(r.water, r),
        mode: 'home',
        screen: 'salts',
        onScreen: () => {},
        setWater: () => {},
      }),
    ),
  );
const sheetVolumes = (r) =>
  Object.fromEntries(
    recipeSheet({
      recipe: r,
      derived: computeRecipe(r),
      water: computeWater(r.water, r),
      mode: 'home',
      proGravityUnit: 'plato',
      today: new Date(2026, 9, 13),
    }).water.volumes.map((v) => [v.label, v.value]),
  );

const GYPSUM = 'Gypsum \\(CaSO₄·2H₂O\\)';
const OVER = 'is more than the';

describe("the HLT's figures when the sparge is more than the tank holds", () => {
  it('the Water tab and the sheet show 0.00 left (HT-S1)', () => {
    const r = recipe({ mashWaterGal: 7, tankTopUpGal: 8, spargeGal: 8.5 });
    const shown = screen(r);
    expect(shown).toMatch(new RegExp(`Carried by the sparge 8\\.50 gal ${GYPSUM} 6\\.0 g`));
    expect(shown).toMatch(new RegExp(`Left in the HLT, not used 0\\.00 gal ${GYPSUM} 0\\.0 g`));
    expect(shown).not.toContain('-0.50');
    // The existing warning stays, against the top-up level the tank holds.
    expect(shown).toContain("The sparge water (8.50 gal) is more than the HLT's top-up level (8.00 gal)");
    expect(sheetVolumes(r)).toMatchObject({ 'Left in the HLT, not used': '0.00' });
  });

  it('the warning follows the tank (HT-S2)', () => {
    const under = recipe({ mashWaterGal: 5, tankTopUpGal: 6, spargeGal: 6.5 });
    expect(computeWater(under.water, under).warnings.spargeOverTank).toBe(false);
    const shownUnder = screen(under);
    expect(shownUnder).not.toContain(`The sparge water (6.50 gal) ${OVER}`);
    expect(shownUnder).toMatch(/Left in the HLT, not used 0\.50 gal/);
    expect(sheetVolumes(under)).toMatchObject({ 'Left in the HLT, not used': '0.50' });

    const over = recipe({ mashWaterGal: 5, tankTopUpGal: 6, spargeGal: 7.5 });
    expect(computeWater(over.water, over).warnings.spargeOverTank).toBe(true);
    const shownOver = screen(over);
    expect(shownOver).toContain('The sparge water (7.50 gal) is more than the treated water the HLT holds (7.00 gal)');
    expect(shownOver).toMatch(new RegExp(`Carried by the sparge 7\\.50 gal ${GYPSUM} 8\\.4 g`));
    expect(shownOver).toMatch(new RegExp(`Left in the HLT, not used 0\\.00 gal ${GYPSUM} 0\\.0 g`));
    expect(sheetVolumes(over)).toMatchObject({ 'Left in the HLT, not used': '0.00' });
  });
});
