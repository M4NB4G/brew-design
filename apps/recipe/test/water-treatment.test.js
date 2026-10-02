// water-treatment.test.js
// Scenarios for "Water treatment choice" (scope table agreed 2026-10-02,
// docs/items/water-treatment.md), the app's part, named from the item file's
// scenario list and its sentences WT-S1 to WT-S9. The engine's sums are
// pinned by hand in packages/engine/test/water/volumes.test.js; here the
// item file's worked example is typed into the recipe and the Water tab and
// every figure is checked against the same hand-worked numbers. The screens
// are rendered to markup with react-dom/server (as water-tab.test.js does).
//
// The worked example's water: the IPA family (sulfate 225, calcium 120 mg/L),
// gypsum the only salt on hand, and a test report of no calcium and 48.12 mg/L
// of sulfate. The recommendation is then gypsum alone, by hand: sulfate short
// by 225 - 48.12 = 176.88 mg/L, gypsum adds 147.4 mg/L per g/gal (engine
// constant), so 176.88 / 147.4 = 1.2 g/gal; it adds 1.2 x 61.5 = 73.8 mg/L of
// calcium, under the 120 target and over the 50 minimum, so no other step
// adds gypsum; no other salt is on hand and no acid is needed (the
// alkalinity, 0, is below what the target residual alkalinity allows).

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACIDS, solveAdditions, predictFinalProfile, findStyle } from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState } from '../src/water-state.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const steps = () => import('../src/water-state.js');
const text = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');

// The worked example's recipe: 15 + 5 = 20 lb of grain, 14 gal before the
// boil measured at 60 °F, 7 gal of mash water.
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
    ...patch,
  };
};

const IPA_SOURCE = { Ca: 0, Mg: 0, Na: 0, SO4: 48.12, Cl: 0, Alkalinity: 0, pH: 7 };
// The worked example's Water tab: 1 gal kept in the tun.
const exampleWater = (patch = {}) => ({
  ...defaultWaterState(),
  source: { ...IPA_SOURCE },
  styleId: 'ipa',
  enabledSalts: ['gypsum'],
  spargeGal: 8.5,
  ...patch,
});
const tankWater = (patch = {}) =>
  exampleWater({ treatment: 'tank', tankTreatedGal: 12, tankTopUpGal: 12, ...patch });

const render = async (water, recipe, screen = 'salts', mode = 'home') => {
  const { default: WaterTab } = await import('../src/components/water/WaterTab.jsx');
  return renderToStaticMarkup(
    createElement(WaterTab, {
      water,
      figures: computeWater(water, recipe),
      mode,
      screen,
      onScreen: () => {},
      setWater: () => {},
    }),
  );
};
const amountOf = (list, key) => list.find((s) => s.key === key)?.amount;

describe('water treatment choice', () => {
  it('the water volumes come from the recipe', async () => {
    // Q3, Q4: the built-in absorption is the owner's 0.1 qt/lb; nothing is
    // assumed kept in the tun.
    const fresh = defaultWaterState();
    expect(fresh.absorptionQtPerLb).toBe(0.1);
    expect(fresh.spargeGal).toBeNaN(); // S4b: the sparge is typed, blank until typed

    // By hand: 20 x 0.1 / 4 = 0.5 gal absorbed; sparge 14 + 0.5 + 1 - 7 =
    // 8.5 gal; total 7 + 8.5 = 15.5 gal.
    const f = computeWater(exampleWater(), exampleRecipe());
    expect(f.volumes.mashWaterGal).toBe(7);
    expect(f.volumes.absorptionGal).toBeCloseTo(0.5, 12);
    expect(f.volumes.spargeGal).toBeCloseTo(8.5, 12);
    expect(f.volumes.totalGal).toBeCloseTo(15.5, 12);

    // Q2: the sums take the pre-boil volume at 60 °F, the engine's one
    // reference. Measured hot, it is smaller at 60 °F; the water left in the mash
    // tun follows the corrected figure, not the typed one (S4b: the sparge is typed).
    const hot = exampleRecipe({ measurementTempF: { preBoil: 200, postBoil: 60, ferment: 60 } });
    const preBoilAt60 = computeRecipe(hot).refVolumesGal.preBoil;
    expect(preBoilAt60).toBeLessThan(14);
    expect(computeWater(exampleWater(), hot).volumes.mashTunLeftGal).toBeCloseTo(7 + 8.5 - 0.5 - preBoilAt60, 12);

    // The Water tab shows them (Home gal; Pro bbl, 15.5 / 31 = 0.5 bbl).
    const home = text(await render(exampleWater(), exampleRecipe()));
    expect(home).toMatch(/Water absorbed by the grain gal 0\.50/);
    expect(home).toMatch(/Water left in the mash tun gal 1\.00/);
    expect(home).toMatch(/Total water gal 15\.50/);
    expect(home).toMatch(/Mash water \(from the recipe\) gal 7\.00/);
    const pro = text(await render(exampleWater(), exampleRecipe(), 'salts', 'pro'));
    expect(pro).toMatch(/Total water bbl 0\.500/);
  });

  it('treating the mash water treats the recipe\'s mash water', async () => {
    // WT-S3: the additions are S3's for a typed volume equal to the recipe's
    // mash water — the solver and the predicted profile at 7 gal.
    const water = exampleWater({ enabledSalts: defaultWaterState().enabledSalts, styleId: 'hoppy_ale' });
    water.source = { Ca: 8, Mg: 2, Na: 22, SO4: 0, Cl: 20, Alkalinity: 50, pH: 7.2 };
    const f = computeWater(water, exampleRecipe());
    const s3 = solveAdditions({
      source: water.source,
      target: { ...findStyle('hoppy_ale').profile },
      volumeGallons: 7,
      raiseAlkSource: 'baking_soda',
      enabledSalts: new Set(water.enabledSalts),
    });
    expect(f.recommendation).toEqual(s3);
    const salts = Object.fromEntries([...f.salts, f.raiseSalt].map((s) => [s.key, s.amount]));
    expect(f.final.ions).toEqual(
      predictFinalProfile({ source: water.source, additions: salts, acids: f.acid.amounts, volumeGallons: 7 }),
    );
    // A tank volume typed but not chosen changes nothing.
    expect(computeWater({ ...water, tankTreatedGal: 12, tankTopUpGal: 12 }, exampleRecipe())).toEqual(f);

    // The worked example: 1.2 g/gal x 7 gal = 8.4 g of gypsum in the mash.
    expect(amountOf(computeWater(exampleWater(), exampleRecipe()).salts, 'gypsum')).toBeCloseTo(8.4, 9);

    // The screen says where they go and that the sparge is untreated.
    const shown = text(await render(exampleWater(), exampleRecipe()));
    expect(shown).toContain('Into the mash water (7.00 gal)');
    expect(shown).toMatch(/Sparge water gal untreated/);
  });

  it('the hot-liquor tank treats its first fill, and the sparge draws only what it needs', async () => {
    // WT-S4: the salts are for the typed 12 gal: 1.2 x 12 = 14.4 g.
    const f = computeWater(tankWater(), exampleRecipe());
    expect(f.recommendation).not.toBeNull();
    expect(amountOf(f.salts, 'gypsum')).toBeCloseTo(14.4, 9);
    // By hand: the mash draws 14.4 x 7/12 = 8.4 g; 5 gal stay, topped up to
    // 12 gal: 5/12 = 41.7 % treated; the sparge draws 8.5 gal carrying
    // 14.4 x 5/12 x 8.5/12 = 4.25 g; 12 - 8.5 = 3.5 gal and 14.4 x 5/12 x
    // 3.5/12 = 1.75 g are left in the tank, not used.
    expect(f.tank.treatedShare).toBeCloseTo(5 / 12, 12);
    expect(f.tank.mashSalts.gypsum).toBeCloseTo(8.4, 9);
    expect(f.tank.spargeSalts.gypsum).toBeCloseTo(4.25, 9);
    expect(f.tank.leftGal).toBeCloseTo(3.5, 12);
    expect(f.tank.leftSalts.gypsum).toBeCloseTo(1.75, 9);
    expect(f.warnings.mashOverTreated).toBe(false);
    expect(f.warnings.spargeOverTopUp).toBe(false);

    const shown = text(await render(tankWater(), exampleRecipe()));
    expect(shown).toContain("Into the HLT's first fill (12.00 gal)");
    expect(shown).toMatch(/Treated share of the sparge liquor 42 %/);
    expect(shown).toMatch(/Left in the HLT, not used 3\.50 gal/);
    // Q8: the acid goes in the tank too, and a note says so.
    expect(shown).toContain("The acid goes in the HLT with the salts, so the sparge liquor's treated share carries acid too.");

    // The two warnings: 13 gal of mash water from a 12 gal fill; 8.5 gal of
    // sparge from a tank topped up to 8 gal.
    const short = computeWater(tankWater(), exampleRecipe({ mashWaterGal: 13 }));
    expect(short.warnings.mashOverTreated).toBe(true);
    expect(text(await render(tankWater(), exampleRecipe({ mashWaterGal: 13 })))).toContain(
      "The mash water (13.00 gal) is more than the HLT's treated volume (12.00 gal)",
    );
    const low = tankWater({ tankTopUpGal: 8 });
    expect(computeWater(low, exampleRecipe()).warnings.spargeOverTopUp).toBe(true);
    expect(text(await render(low, exampleRecipe()))).toContain(
      "The sparge water (8.50 gal) is more than the HLT's top-up level (8.00 gal)",
    );
  });

  it('salts in the kettle bring the whole water to the target', async () => {
    // WT-S5, Q7, A — since S4b item 2 (C7) the kettle salts bring the kettle
    // water (14 gal before the boil, needing 1.2 x 14 = 16.8 g) to the target,
    // the mash's salts reaching it at the recipe's brewhouse efficiency (the
    // built-in 75 %): 0.75 x 8.4 = 6.3 g. Mash water treated: 16.8 - 6.3 =
    // 10.5 g of gypsum in the kettle.
    const mash = computeWater(exampleWater({ kettleSalts: true }), exampleRecipe());
    expect(amountOf(mash.kettle.salts, 'gypsum')).toBeCloseTo(10.5, 9);
    // The tank treated: the kettle holds 0.75 x 7 = 5.25 gal-worth of mash
    // liquor, leaving 14 - 5.25 = 8.75 gal for the 8.5 gal of sparge, which
    // carries 4.25 g; the share, 8.75 / 8.5, is held at all of it (KS1,
    // docs/items/kettle-share-limits.md): 16.8 - 6.3 - 4.25 = 6.25 g in the
    // kettle.
    const tank = computeWater(tankWater({ kettleSalts: true }), exampleRecipe());
    expect(amountOf(tank.kettle.salts, 'gypsum')).toBeCloseTo(6.25, 9);

    // Never below zero: the brewer's own 25 g in the mash, 0.75 x 25 =
    // 18.75 g reaching the kettle, covers its 16.8 g.
    const own = computeWater(exampleWater({ kettleSalts: true, saltOverrides: { gypsum: 25 } }), exampleRecipe());
    expect(amountOf(own.kettle.salts, 'gypsum')).toBe(0);

    // No acid goes in the kettle, even when the treated water takes acid.
    const hard = exampleWater({ kettleSalts: true, source: { ...IPA_SOURCE, Alkalinity: 200 } });
    const fh = computeWater(hard, exampleRecipe());
    expect(fh.acid.recommendedMeq).toBeGreaterThan(0);
    for (const s of fh.kettle.salts) expect(Object.keys(ACIDS)).not.toContain(s.key);
    const shown = text(await render(hard, exampleRecipe()));
    expect(shown).toContain('Kettle Salts');
    expect(shown).toContain('No acid goes in the kettle.');

    // The switch off: no kettle salts.
    expect(computeWater(exampleWater(), exampleRecipe()).kettle).toBeNull();
    expect(text(await render(exampleWater(), exampleRecipe()))).not.toContain('Kettle Salts');
  });

  it('no choice shows a wort mineral figure; the kettle water only with kettle salts', async () => {
    // WT-S6: every choice, with and without kettle salts, shows one treated
    // profile, labelled as the treated water. Since S4b item 2 (C8′, KW-S3,
    // KW-S5) the kettle water before the boil shows with kettle salts on,
    // labelled as the water and its salts, never the wort's minerals.
    for (const water of [
      exampleWater(),
      exampleWater({ kettleSalts: true }),
      tankWater(),
      tankWater({ kettleSalts: true }),
    ]) {
      const f = computeWater(water, exampleRecipe());
      expect(Object.keys(f.kettle ?? {})).not.toContain('ions');
      const shown = text(await render(water, exampleRecipe()));
      expect(shown.includes('Kettle water before the boil')).toBe(water.kettleSalts);
      if (water.kettleSalts) expect(shown).toContain('Consider these estimates until confirmed with lab sampling.');
      expect(shown).toMatch(/Predicted Final Profile The treated (mash water|HLT water \(first fill\))/);
      expect(shown).toContain('This is the water as treated, not the wort in the kettle.');
      expect(shown).not.toMatch(/kettle profile|wort profile|in the kettle (Calcium|Sulfate)/i);
      expect(shown.match(/Predicted Final Profile/g)).toHaveLength(1);
    }
  });

  it('the setup limits the choices', async () => {
    const s = await steps();
    // Q9: the built-in choice and setup.
    const fresh = defaultWaterState();
    expect(fresh.treatment).toBe('mash');
    expect(fresh.kettleSalts).toBe(false);
    expect(fresh.vessels).toBe(3);
    expect(fresh.spargeMethod).toBe('batch');
    expect(fresh.tankTreatedGal).toBeNaN();
    expect(fresh.tankTopUpGal).toBeNaN();

    // Q5, D: two or three vessels offer both treatments and every sparge, in
    // Home and in Pro alike.
    for (const vessels of [2, 3]) {
      const f = computeWater({ ...exampleWater(), vessels }, exampleRecipe());
      expect(f.setup.offered.treatments).toEqual(['mash', 'tank']);
      expect(f.setup.offered.spargeMethods).toEqual(['none', 'batch', 'fly']);
    }
    for (const mode of ['home', 'pro']) {
      const shown = await render(tankWater(), exampleRecipe(), 'salts', mode);
      expect(text(shown)).toContain('The Hot Liquor Tank (HLT) first fill');
    }

    // One vessel: no sparge, the mash water the only treatment; a tank choice
    // made before is not used.
    const one = s.setWaterSetup(tankWater(), 'vessels', 1);
    const f1 = computeWater(one, exampleRecipe());
    expect(f1.setup.offered.treatments).toEqual(['mash']);
    expect(f1.setup.offered.spargeMethods).toEqual(['none']);
    expect(f1.setup.treatment).toBe('mash');
    expect(f1.setup.spargeMethod).toBe('none');
    expect(f1.tank).toBeNull();
    expect(amountOf(f1.salts, 'gypsum')).toBeCloseTo(8.4, 9);
    const shown1 = text(await render(one, exampleRecipe()));
    expect(shown1).not.toContain('The Hot Liquor Tank (HLT) first fill');
    expect(shown1).not.toContain('Batch sparge');

    // Q6, no sparge: the mash water is all the water; since S4b a kettle that
    // will be short warns: 7 - 0.5 - 14 = -7.5 gal, short by 7.50 gal.
    const none = computeWater(exampleWater({ spargeMethod: 'none' }), exampleRecipe());
    expect(none.volumes.spargeGal).toBe(0);
    expect(none.volumes.totalGal).toBe(7);
    expect(none.warnings.kettleShortGal).toBeCloseTo(7.5, 12);
    expect(text(await render(exampleWater({ spargeMethod: 'none' }), exampleRecipe()))).toContain(
      'The kettle will be short by 7.50 gal',
    );
    expect(
      computeWater(exampleWater({ spargeMethod: 'none' }), exampleRecipe({ mashWaterGal: 15.5 })).warnings
        .kettleShortGal,
    ).toBe(0);
    // Kettle salts then make up only the shortfall of the brewer's own mash
    // amount (since S4b item 2, the mash well mixed, C11): 15.5 gal of mash
    // water at 1.2 g/gal would be 18.6 g; the brewer put in 15 g; 14 / 15.5
    // of the mash reaches the 14 gal kettle, so (18.6 - 15) x 14 / 15.5 =
    // 3.2516 g go in the kettle.
    const shortfall = computeWater(
      exampleWater({ spargeMethod: 'none', kettleSalts: true, saltOverrides: { gypsum: 15 } }),
      exampleRecipe({ mashWaterGal: 15.5 }),
    );
    expect(amountOf(shortfall.kettle.salts, 'gypsum')).toBeCloseTo((3.6 * 14) / 15.5, 9);

    // K, ordering: changing the treatment, the vessels or the tank's treated
    // volume returns the brewer's own amounts to the recommendation; the
    // other figures keep them; so does the recipe's mash water when the mash
    // water is treated.
    const own = exampleWater({ saltOverrides: { gypsum: 9 }, acidAmounts: { lactic_88: 2 } });
    for (const [key, value] of [['treatment', 'tank'], ['vessels', 2], ['tankTreatedGal', 10]]) {
      const w = s.setWaterSetup(own, key, value);
      expect(w.saltOverrides, key).toEqual({});
      expect(w.acidAmounts, key).toBeNull();
    }
    for (const [key, value] of [
      ['kettleSalts', true],
      ['spargeMethod', 'fly'],
      ['tankTopUpGal', 10],
      ['absorptionQtPerLb', 0.2],
      ['spargeGal', 9],
    ]) {
      const w = s.setWaterSetup(own, key, value);
      expect(w[key], key).toBe(value);
      expect(w.saltOverrides, key).toEqual({ gypsum: 9 });
    }
    expect(s.mashWaterChanged(own).saltOverrides).toEqual({});
    const ownTank = { ...own, treatment: 'tank' };
    expect(s.mashWaterChanged(ownTank).saltOverrides).toEqual({ gypsum: 9 });
    // A recipe replaced by Import or Reset brings its own water entries,
    // their amounts made for its own mash water (Water saved with the
    // recipe, WS-S1, superseding the reset this item first did there): the
    // Water tab's entries are the recipe's.
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
    expect(app).toMatch(/const water = recipe\.water;/);
  });

  it('a blank figure the sums need blanks what needs it and is named', async () => {
    // WT-S9, Q9: the tank chosen with its volumes blank names both; no
    // additions until the treated volume is set.
    const blankTank = exampleWater({ treatment: 'tank' });
    const f = computeWater(blankTank, exampleRecipe());
    expect(f.blank).toEqual(['tankTreatedGal', 'tankTopUpGal']);
    expect(f.recommendation).toBeNull();
    expect(f.tank.treatedShare).toBeNaN();
    expect(f.tank.leftGal).toBeNaN();
    const shown = text(await render(blankTank, exampleRecipe()));
    expect(shown).toContain('Blank figures the water sums need: Treated volume, Top-up level');
    expect(shown).toMatch(/Treated share of the sparge liquor —/);

    // A blank mash water blanks the sparge, the total and the mash additions.
    const noMash = computeWater(exampleWater(), exampleRecipe({ mashWaterGal: NaN }));
    expect(noMash.blank).toEqual(['mashWaterGal']);
    expect(noMash.volumes.mashTunLeftGal).toBeNaN();
    expect(noMash.volumes.totalGal).toBeNaN();
    expect(noMash.volumes.absorptionGal).toBeCloseTo(0.5, 12);
    expect(noMash.recommendation).toBeNull();
    const shownMash = text(await render(exampleWater(), exampleRecipe({ mashWaterGal: NaN })));
    expect(shownMash).toContain('Blank figures the water sums need: Mash water');
    expect(shownMash).toMatch(/Water left in the mash tun gal —/);
    expect(shownMash).toMatch(/Total water gal —/);

    // A blank absorption rate, a blank malt weight, a blank amount kept in
    // the tun (since S4b, a blank sparge water), a blank pre-boil volume: each
    // named; the water left in the mash tun blank;
    // blank; the mash additions stand (they need only the mash water).
    const r = exampleRecipe();
    const cases = [
      [exampleWater({ absorptionQtPerLb: NaN }), r, 'absorptionQtPerLb', 'Grain absorption'],
      [exampleWater({ spargeGal: NaN }), r, 'spargeGal', 'Sparge water'],
      [exampleWater(), { ...r, malts: [r.malts[0], { ...r.malts[1], weightLb: NaN }] }, 'malts', 'Malt weights'],
      [exampleWater(), { ...r, preBoilVolGal: NaN }, 'preBoilGal', 'Pre-boil volume'],
    ];
    for (const [w, rec, key, label] of cases) {
      const g = computeWater(w, rec);
      expect(g.blank, key).toEqual([key]);
      expect(g.volumes.mashTunLeftGal, key).toBeNaN();
      // Since S4b the total is mash + typed sparge: blank only with the sparge.
      if (key === 'spargeGal') expect(g.volumes.totalGal, key).toBeNaN();
      expect(amountOf(g.salts, 'gypsum'), key).toBeCloseTo(8.4, 9);
      expect(text(await render(w, rec)), key).toContain(`Blank figures the water sums need: ${label}`);
    }
    // Kettle salts need the total: blank with it.
    const noTotal = computeWater(exampleWater({ kettleSalts: true, spargeGal: NaN }), exampleRecipe());
    expect(amountOf(noTotal.kettle.salts, 'gypsum')).toBeNaN();

    // Nothing blank: no line.
    expect(computeWater(tankWater(), exampleRecipe()).blank).toEqual([]);
    expect(text(await render(tankWater(), exampleRecipe()))).not.toContain('Blank figures');

    // WT-S8: the typed water volume is gone.
    expect('volumeGal' in defaultWaterState()).toBe(false);
    expect(text(await render(exampleWater(), exampleRecipe()))).not.toContain('Mash Volume');
  });
});
