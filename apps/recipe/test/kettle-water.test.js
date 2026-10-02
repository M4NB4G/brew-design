// kettle-water.test.js
// Scenarios for S4b item 2, "Kettle water at the brewhouse efficiency"
// (docs/items/water-as-brewed.md, agreed 2026-10-02), named from its
// sentences KW-S1 to KW-S7. The worked example (20 lb, 14 gal before the
// boil, 7 gal of mash water, 8.5 gal of sparge; the IPA family, gypsum only,
// 1.2 g/gal recommended) at a brewhouse efficiency of 90 %, by hand:
//   with a sparge, 0.9 x 8.4 g = 7.56 g of the mash's gypsum reaches the
//   kettle; the kettle water, 14 gal, needs 1.2 x 14 = 16.8 g; kettle salts
//   16.8 - 7.56 = 9.24 g. The HLT treated (12 gal, topped up to 12): the
//   sparge carries 4.25 g, of which (14 - 0.9 x 7) / 8.5 = 7.7 / 8.5 reaches
//   the kettle, 3.85 g; kettle salts 16.8 - 7.56 - 3.85 = 5.39 g.
//   Kettle water: 0 + 16.8 g / 14 gal x 61.5 = 73.8 mg/L of calcium;
//   48.12 + 16.8 / 14 x 147.4 = 225 mg/L of sulfate (engine constants
//   61.5 and 147.4 mg/L per g/gal).

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

const exampleRecipe = (patch = {}) => {
  const r = defaultRecipeState();
  return {
    ...r,
    malts: [
      { ...r.malts[0], weightLb: 15 },
      { ...r.malts[1], weightLb: 5 },
    ],
    preBoilVolGal: 14,
    mashWaterGal: 7,
    efficiency: 0.9,
    ...patch,
  };
};
const exampleWater = (patch = {}) => ({
  ...defaultWaterState(),
  source: { Ca: 0, Mg: 0, Na: 0, SO4: 48.12, Cl: 0, Alkalinity: 0, pH: 7 },
  styleId: 'ipa',
  enabledSalts: ['gypsum'],
  spargeGal: 8.5,
  kettleSalts: true,
  ...patch,
});
const hltWater = (patch = {}) => exampleWater({ treatment: 'tank', tankTreatedGal: 12, tankTopUpGal: 12, ...patch });
const render = async (water, recipe, mode = 'home') => {
  const { default: WaterTab } = await import('../src/components/water/WaterTab.jsx');
  return renderToStaticMarkup(
    createElement(WaterTab, { water, figures: computeWater(water, recipe), mode, screen: 'salts', onScreen: () => {}, setWater: () => {} }),
  );
};
const gypsumIn = (f) => f.kettle.salts.find((s) => s.key === 'gypsum').amount;

describe('kettle water at the brewhouse efficiency', () => {
  it('kettle salts bring the kettle water before the boil to the target', () => {
    // KW-S1, KW-S2, by hand (header): 9.24 g with the mash water treated,
    // 5.39 g with the HLT.
    expect(gypsumIn(computeWater(exampleWater(), exampleRecipe()))).toBeCloseTo(9.24, 9);
    expect(gypsumIn(computeWater(hltWater(), exampleRecipe()))).toBeCloseTo(5.39, 9);
    // Fly sparge: the same efficiency, the same salts.
    expect(gypsumIn(computeWater(exampleWater({ spargeMethod: 'fly' }), exampleRecipe()))).toBeCloseTo(9.24, 9);
    // No sparge (C11): the mash well mixed — 15.5 gal of mash water, 14 gal
    // before the boil; the brewer's own 15 g of gypsum: 15 x 14 / 15.5 =
    // 13.548 g reach the kettle; 16.8 - 13.548 = 3.2516 g in the kettle,
    // whatever the efficiency.
    const none = (eff) =>
      gypsumIn(
        computeWater(
          exampleWater({ spargeMethod: 'none', saltOverrides: { gypsum: 15 } }),
          exampleRecipe({ mashWaterGal: 15.5, efficiency: eff }),
        ),
      );
    expect(none(0.9)).toBeCloseTo(16.8 - (15 * 14) / 15.5, 9);
    expect(none(0.7)).toBeCloseTo(16.8 - (15 * 14) / 15.5, 9);
    // No acid in the kettle.
    for (const s of computeWater(exampleWater(), exampleRecipe()).kettle.salts) expect(s.key).not.toMatch(/acid|lactic|phosphoric/);
  });

  it('the Water tab shows the kettle water before the boil', async () => {
    // KW-S3: by hand, calcium 73.8 → "74" against 120; sulfate 225 against
    // 225; no chloride, an endless ratio.
    const f = computeWater(exampleWater(), exampleRecipe());
    expect(f.kettle.profile.ions.Ca).toBeCloseTo(73.8, 9);
    expect(f.kettle.profile.ions.SO4).toBeCloseTo(225, 9);
    expect(f.kettle.profile.ratio).toBe(Infinity);
    const shown = text(await render(exampleWater(), exampleRecipe()));
    // The label, in the owner's words (2026-10-02, amending KW-S3).
    expect(shown).toContain('Kettle Water Kettle water before the boil Consider these estimates until confirmed with lab sampling.');
    expect(shown).not.toContain("not the wort's minerals");
    expect(shown).toContain('Batch sparge, well mixed');
    expect(shown).toMatch(/74 Calcium tgt 120/);
    expect(shown).toMatch(/225 Sulfate tgt 225/);
    expect(shown).toContain('The boil concentrates each figure by the pre-boil ÷ post-boil volume.');
    expect(shown).toContain('A kettle sample may read lower in calcium and higher in magnesium');
    // C17: the efficiency's known bias, beside the readout with a sparge.
    const bias =
      'The brewhouse efficiency also counts how completely the mash dissolves the extract, so it slightly understates the salts reaching the kettle: the kettle salts come out slightly generous.';
    expect(shown).toContain(bias);
    expect(
      text(await render(exampleWater({ spargeMethod: 'none' }), exampleRecipe({ mashWaterGal: 15.5 }))),
    ).not.toContain(bias);
    // No alkalinity or residual alkalinity in the kettle readout (C9): the
    // only "Residual Alk" and "Total Alkalinity" on the screen are the
    // treated water's.
    expect(shown.match(/Residual Alk/g)).toHaveLength(1);
    expect(shown.match(/Total Alkalinity/g)).toHaveLength(1);
    // The assumption follows the sparge method.
    expect(text(await render(exampleWater({ spargeMethod: 'fly' }), exampleRecipe()))).toContain('Fly sparge, plug flow');
    expect(
      text(await render(exampleWater({ spargeMethod: 'none' }), exampleRecipe({ mashWaterGal: 15.5 }))),
    ).toContain('No sparge, the mash well mixed');
    // KW-S5: only while kettle salts are on; the treated-water profile stays.
    const off = text(await render(exampleWater({ kettleSalts: false }), exampleRecipe()));
    expect(off).not.toContain('Kettle water before the boil');
    expect(off).toContain('Predicted Final Profile');
  });

  it('the kettle salts card says they bring the kettle water to the target', async () => {
    // KW-S4: the line, with the kettle water's 14.00 gal.
    expect(text(await render(exampleWater(), exampleRecipe()))).toContain(
      'These bring the kettle water (14.00 gal) to the IPA (American/English) target.',
    );
    // A salt already over target from the mash: the brewer's own 20 g, 0.9 x
    // 20 = 18 g reach the kettle, over its 16.8 g: none in the kettle, named.
    const over = exampleWater({ saltOverrides: { gypsum: 20 } });
    expect(gypsumIn(computeWater(over, exampleRecipe()))).toBe(0);
    expect(computeWater(over, exampleRecipe()).kettle.overTarget).toEqual(['gypsum']);
    expect(text(await render(over, exampleRecipe()))).toContain(
      'Already over the target from the mash: Gypsum (CaSO₄·2H₂O)',
    );
  });

  it('the printed sheet prints the kettle water', () => {
    // KW-S6: the same figures, the same label, beside the treated water.
    const recipe = { ...exampleRecipe(), water: exampleWater() };
    const derived = computeRecipe(recipe);
    const water = computeWater(recipe.water, recipe);
    const s = recipeSheet({ recipe, derived, water, mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 9, 2) });
    expect(s.water.kettle.label).toBe('Kettle water before the boil');
    expect(s.water.kettle.caveat).toBe('Consider these estimates until confirmed with lab sampling.');
    expect(s.water.kettle.assumption).toBe('Batch sparge, well mixed');
    expect(s.water.kettle.biasNote).toContain('the kettle salts come out slightly generous');
    const rows = Object.fromEntries(s.water.kettle.rows.map((r) => [r.label, [r.predicted, r.target]]));
    expect(Object.keys(rows)).toEqual(['Calcium', 'Magnesium', 'Sodium', 'Sulfate', 'Chloride', 'SO₄:Cl ratio']);
    expect(rows.Calcium).toEqual(['74', '120']);
    expect(rows.Sulfate).toEqual(['225', '225']);
    expect(rows['SO₄:Cl ratio']).toEqual(['∞', '3.00']);
    // Off: no kettle readout on the sheet.
    const offRecipe = { ...recipe, water: exampleWater({ kettleSalts: false }) };
    expect(
      recipeSheet({ recipe: offRecipe, derived, water: computeWater(offRecipe.water, offRecipe), mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 9, 2) })
        .water.kettle,
    ).toBeNull();
  });

  it('a share held at its limit is said so', async () => {
    // KS1 (docs/items/kettle-share-limits.md, KS-S1, KS-S2), by hand: at
    // 75 %, the HLT's sparge share 8.75 / 8.5 is held at 1, so all 4.25 g it
    // carries reach the kettle: 16.8 - 0.75 x 8.4 - 4.25 = 16.8 - 6.3 - 4.25
    // = 6.25 g in the kettle.
    const note =
      "A share was held at its limit: the brewhouse efficiency does not fit these volumes (it also counts the mash's conversion), so the kettle salts are an estimate.";
    const held = computeWater(hltWater(), exampleRecipe({ efficiency: 0.75 }));
    expect(gypsumIn(held)).toBeCloseTo(6.25, 9);
    expect(held.kettle.held).toBe(true);
    expect(text(await render(hltWater(), exampleRecipe({ efficiency: 0.75 })))).toContain(note);
    const recipe = { ...exampleRecipe({ efficiency: 0.75 }), water: hltWater() };
    const s = recipeSheet({ recipe, derived: computeRecipe(recipe), water: computeWater(recipe.water, recipe), mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 9, 2) });
    expect(s.water.kettle.heldNote).toBe(note);
    // KS-S3: within the limits (90 %), no note and S4b's figures.
    const within = computeWater(hltWater(), exampleRecipe());
    expect(within.kettle.held).toBe(false);
    expect(gypsumIn(within)).toBeCloseTo(5.39, 9);
    expect(text(await render(hltWater(), exampleRecipe()))).not.toContain('A share was held at its limit');
  });

  it('a blank figure the readout needs blanks it', async () => {
    // KW-S7: a blank efficiency, pre-boil volume or sparge water.
    for (const [w, r] of [
      [exampleWater(), exampleRecipe({ efficiency: NaN })],
      [exampleWater(), exampleRecipe({ preBoilVolGal: NaN })],
      [exampleWater({ spargeGal: NaN }), exampleRecipe()],
    ]) {
      const f = computeWater(w, r);
      expect(gypsumIn(f)).toBeNaN();
      expect(f.kettle.profile).toBeNull();
      expect(text(await render(w, r))).toMatch(/— Calcium tgt 120/);
    }
  });
});
