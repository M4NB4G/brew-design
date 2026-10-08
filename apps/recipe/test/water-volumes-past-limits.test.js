// water-volumes-past-limits.test.js
// Scenarios for "Water volumes past their limits" (scope table agreed
// 2026-10-08, docs/items/water-volumes-past-limits.md), the app's part: the
// Water tab warns when the hot-liquor tank's top-up level is below the
// treated water the mash leaves (WV-S2) and shows, as the printed sheet
// does, the held figures (WV-S1, WV-S3, WV-S5). The engine's held shares are
// pinned by hand in packages/engine/test/water/volumes-past-limits.test.js.
//
// The water treatment item's worked example (water-treatment.test.js): the
// IPA family, gypsum the only salt on hand, a test report of no calcium and
// 48.12 mg/L of sulfate: 1.2 g/gal of gypsum, 1.2 x 12 = 14.4 g for the
// HLT's 12 gal first fill.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState } from '../src/water-state.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';

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

const screen = async (r) => {
  const { default: WaterTab } = await import('../src/components/water/WaterTab.jsx');
  return text(
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
};
const sheetVolumes = (r) =>
  Object.fromEntries(
    recipeSheet({
      recipe: r,
      derived: computeRecipe(r),
      water: computeWater(r.water, r),
      mode: 'home',
      proGravityUnit: 'plato',
      today: new Date(2026, 9, 8),
    }).water.volumes.map((v) => [v.label, v.value]),
  );

const WARNING = "The HLT's top-up level (6.00 gal) is below the treated water the mash leaves (7.00 gal): no untreated water is added";

describe('water volumes past their limits', () => {
  it('the Water tab warns when the top-up level is below the treated water left', async () => {
    // WV-S1, WV-S2: 12 gal treated, 5 gal of mash water, topped up to 6 gal,
    // 4 gal of sparge. By hand: 12 - 5 = 7 gal of treated water stay, above
    // the 6 gal level, so the tank holds those 7 gal, 100 % treated; of the
    // 14.4 g of gypsum the mash draws 14.4 x 5/12 = 6.0 g, the sparge
    // carries 14.4 x (7/12)(4/7) = 4.8 g, and 14.4 x (7/12)(3/7) = 3.6 g
    // stay in the 7 - 4 = 3 gal left.
    const r = recipe({ mashWaterGal: 5, tankTopUpGal: 6, spargeGal: 4 });
    const f = computeWater(r.water, r);
    expect(f.warnings.topUpBelowTreated).toBe(true);
    expect(f.tank.mashSalts.gypsum).toBeCloseTo(6, 9);
    expect(f.tank.spargeSalts.gypsum).toBeCloseTo(4.8, 9);
    expect(f.tank.leftSalts.gypsum).toBeCloseTo(3.6, 9);

    const shown = await screen(r);
    expect(shown).toContain(WARNING);
    expect(shown).toMatch(/Treated share of the sparge liquor 100 %/);
    expect(shown).toMatch(/Carried by the sparge 4\.00 gal Gypsum \(CaSO₄·2H₂O\) 4\.8 g/);
    expect(shown).toMatch(/Left in the HLT, not used 3\.00 gal Gypsum \(CaSO₄·2H₂O\) 3\.6 g/);

    // Topped up to the 7 gal it holds, or above: no warning, as today.
    for (const level of [7, 12]) {
      const at = recipe({ mashWaterGal: 5, tankTopUpGal: level, spargeGal: 4 });
      expect(computeWater(at.water, at).warnings.topUpBelowTreated).toBe(false);
      expect(await screen(at)).not.toContain('no untreated water is added');
    }
  });

  it('the mash water more than the treated volume takes every salt', async () => {
    // WV-S3: 12 gal treated, 14 gal of mash water, topped up to 20 gal, 4 gal
    // of sparge. By hand: the mash takes all 14.4 g; 0 % of the sparge liquor
    // is treated; the sparge carries 0 g and 0 g is left. The existing
    // warning stays.
    const r = recipe({ mashWaterGal: 14, tankTopUpGal: 20, spargeGal: 4 });
    const f = computeWater(r.water, r);
    expect(f.tank.mashSalts.gypsum).toBeCloseTo(14.4, 9);
    expect(f.tank.spargeSalts.gypsum).toBe(0);
    expect(f.tank.leftSalts.gypsum).toBe(0);
    const shown = await screen(r);
    expect(shown).toMatch(/Treated share of the sparge liquor 0 %/);
    expect(shown).toMatch(/Into the mash 14\.00 gal Gypsum \(CaSO₄·2H₂O\) 14\.4 g/);
    expect(shown).toContain("The mash water (14.00 gal) is more than the HLT's treated volume (12.00 gal)");
    expect(shown).not.toContain('no untreated water is added');
  });

  it('the sheet shows the held figures', () => {
    // WV-S5: the printed sheet prints what the screen shows. 12 / 5 / 6 / 4:
    // 100 % treated, 3.00 gal left (above); 12 / 14 / 20 / 4: 0 % treated,
    // 20 - 4 = 16.00 gal left, all of it untreated.
    expect(sheetVolumes(recipe({ mashWaterGal: 5, tankTopUpGal: 6, spargeGal: 4 }))).toMatchObject({
      'Treated share of the sparge liquor': '100 %',
      'Left in the HLT, not used': '3.00',
    });
    expect(sheetVolumes(recipe({ mashWaterGal: 14, tankTopUpGal: 20, spargeGal: 4 }))).toMatchObject({
      'Treated share of the sparge liquor': '0 %',
      'Left in the HLT, not used': '16.00',
    });
  });
});
