// volumes.test.js
// Scenarios for "Water treatment choice" (scope table agreed 2026-10-02,
// docs/items/water-treatment.md), the engine's part: the water volumes from
// the recipe (WT-S2, Q2–Q4), the hot-liquor tank's draws (WT-S4, B, C, Q8)
// and the kettle salt balance (WT-S5, Q7). Every figure is the item file's
// worked example, worked out by hand with the working beside it (CLAUDE.md,
// Models: the hand-pin rule); none is copied from the code's output.

import { describe, it, expect } from 'vitest';
import * as engine from '../../src/index.js';

// A made-up brewery (the item file's worked example): 20 lb of grain in two
// malts, 14 gal before the boil at 60 °F, 7 gal of mash water, 1 gal kept in
// the mash tun, the built-in absorption.
const MALTS = [
  { name: 'Pale', weightLb: 15, fgdb: 0.8, colorL: 2 },
  { name: 'Munich', weightLb: 5, fgdb: 0.8, colorL: 9 },
];
const EXAMPLE = {
  malts: MALTS,
  absorptionQtPerLb: 0.1,
  preBoilGal: 14,
  mashWaterGal: 7,
  keptInTunGal: 1,
  spargeMethod: 'batch',
};

describe('water treatment choice — the engine', () => {
  it('the water volumes come from the recipe', () => {
    const { waterVolumes, GRAIN_ABSORPTION_QT_PER_LB, QT_PER_GAL } = engine;

    // Q3: the owner's figure, 0.1 qt of water per pound of grain; a quart is
    // a quarter of a gallon by definition, so 0.1 / 4 = 0.025 gal per pound.
    expect(GRAIN_ABSORPTION_QT_PER_LB).toBe(0.1);
    expect(QT_PER_GAL).toBe(4);

    // By hand: grain 15 + 5 = 20 lb; absorption 20 x 0.1 / 4 = 0.5 gal; the
    // kettle needs 14 + 0.5 + 1 = 15.5 gal; sparge 15.5 - 7 = 8.5 gal; total
    // 7 + 8.5 = 15.5 gal.
    const v = waterVolumes(EXAMPLE);
    expect(v.grainLb).toBe(20);
    expect(v.absorptionGal).toBeCloseTo(0.5, 12);
    expect(v.neededGal).toBeCloseTo(15.5, 12);
    expect(v.spargeGal).toBeCloseTo(8.5, 12);
    expect(v.totalGal).toBeCloseTo(15.5, 12);

    // Fly sparging runs the same sums (Q6).
    expect(waterVolumes({ ...EXAMPLE, spargeMethod: 'fly' })).toEqual(v);

    // Q4: nothing kept in the tun: 14 + 0.5 + 0 - 7 = 7.5 gal of sparge.
    expect(waterVolumes({ ...EXAMPLE, keptInTunGal: 0 }).spargeGal).toBeCloseTo(7.5, 12);

    // The owner's own bill (water program notes): 29 lb at 0.1 qt/lb absorbs
    // 29 x 0.1 / 4 = 0.725 gal.
    expect(waterVolumes({ ...EXAMPLE, malts: [{ ...MALTS[0], weightLb: 29 }] }).absorptionGal).toBeCloseTo(0.725, 12);

    // Q6: no sparge (full volume): no sparge water; the mash water is all the
    // water; what the kettle needs, 15.5 gal, is still worked out (the
    // warning when the mash water differs from it).
    const none = waterVolumes({ ...EXAMPLE, spargeMethod: 'none' });
    expect(none.spargeGal).toBe(0);
    expect(none.totalGal).toBe(7);
    expect(none.neededGal).toBeCloseTo(15.5, 12);
    // The mash water differs from what the kettle needs: 7 gal against 15.5.
    expect(none.mashDiffersFromNeeded).toBe(true);
    expect(waterVolumes({ ...EXAMPLE, spargeMethod: 'none', mashWaterGal: 15.5 }).mashDiffersFromNeeded).toBe(false);
    // 29 lb: 14 + 0.725 + 1 = 15.725 gal; typed as 15.725 it is the same
    // figure, whatever the last binary digit of the sum.
    expect(
      waterVolumes({ ...EXAMPLE, malts: [{ ...MALTS[0], weightLb: 29 }], spargeMethod: 'none', mashWaterGal: 15.725 })
        .mashDiffersFromNeeded,
    ).toBe(false);
    // With a sparge the question does not arise.
    expect(v.mashDiffersFromNeeded).toBe(false);

    // WT-S9: a blank figure blanks what needs it, never counted as 0.
    const blankWeight = waterVolumes({ ...EXAMPLE, malts: [MALTS[0], { ...MALTS[1], weightLb: NaN }] });
    expect(blankWeight.grainLb).toBeNaN();
    expect(blankWeight.absorptionGal).toBeNaN();
    expect(blankWeight.spargeGal).toBeNaN();
    expect(blankWeight.totalGal).toBeNaN();
    const blankMash = waterVolumes({ ...EXAMPLE, mashWaterGal: NaN });
    expect(blankMash.absorptionGal).toBeCloseTo(0.5, 12);
    expect(blankMash.neededGal).toBeCloseTo(15.5, 12);
    expect(blankMash.spargeGal).toBeNaN();
    expect(blankMash.totalGal).toBeNaN();
    for (const k of ['absorptionQtPerLb', 'preBoilGal', 'keptInTunGal']) {
      const v2 = waterVolumes({ ...EXAMPLE, [k]: NaN });
      expect(v2.spargeGal, k).toBeNaN();
      expect(v2.totalGal, k).toBeNaN();
    }
  });

  it('the hot-liquor tank treats its first fill, and the sparge draws only what it needs', () => {
    const { tankDraws, shareOfSalts } = engine;

    // The worked example: 12 gal treated, topped up to 12 gal, 7 gal of mash
    // water, 8.5 gal of sparge. By hand: 12 - 7 = 5 gal of treated water stay
    // after the mash; topped up to 12 gal, the sparge liquor is 5/12 treated
    // (41.67 %); the sparge draws 8.5 gal; 12 - 8.5 = 3.5 gal are left.
    const t = tankDraws({ treatedGal: 12, topUpGal: 12, mashWaterGal: 7, spargeGal: 8.5 });
    expect(t.remainingGal).toBeCloseTo(5, 12);
    expect(t.treatedShare).toBeCloseTo(5 / 12, 12);
    expect(t.leftGal).toBeCloseTo(3.5, 12);
    // Of everything put in the tank: the mash draws 7/12; the sparge carries
    // 5/12 x 8.5/12 = 42.5/144; 5/12 x 3.5/12 = 17.5/144 is left, not used.
    expect(t.toMash).toBeCloseTo(7 / 12, 12);
    expect(t.toSparge).toBeCloseTo(42.5 / 144, 12);
    expect(t.left).toBeCloseTo(17.5 / 144, 12);
    expect(t.mashOverTreated).toBe(false);
    expect(t.spargeOverTopUp).toBe(false);

    // 1.2 g/gal of gypsum in 12 gal is 14.4 g; by hand the mash draws
    // 14.4 x 7/12 = 8.4 g; the sparge carries 14.4 x 42.5/144 = 4.25 g; 14.4 x
    // 17.5/144 = 1.75 g is left in the tank. The acid is shared the same way
    // (Q8): 3 mL of lactic in the tank gives 3 x 7/12 = 1.75 mL to the mash.
    const tank = { gypsum: 14.4, lactic_88: 3 };
    expect(shareOfSalts(tank, t.toMash).gypsum).toBeCloseTo(8.4, 12);
    expect(shareOfSalts(tank, t.toSparge).gypsum).toBeCloseTo(4.25, 12);
    expect(shareOfSalts(tank, t.left).gypsum).toBeCloseTo(1.75, 12);
    expect(shareOfSalts(tank, t.toMash).lactic_88).toBeCloseTo(1.75, 12);
    // Everything put in the tank is somewhere: 8.4 + 4.25 + 1.75 = 14.4 g.
    expect(t.toMash + t.toSparge + t.left).toBeCloseTo(1, 12);

    // The owner's system (water program WP6b): treat 14 gal, mash in with 8,
    // top up to 10: 6/10 = 60 % of the sparge liquor is treated.
    expect(tankDraws({ treatedGal: 14, topUpGal: 10, mashWaterGal: 8, spargeGal: 9 }).treatedShare).toBeCloseTo(0.6, 12);

    // The two warnings: more mash water than the tank treats; more sparge
    // water than the top-up level. Equal is not more.
    expect(tankDraws({ treatedGal: 12, topUpGal: 12, mashWaterGal: 13, spargeGal: 8.5 }).mashOverTreated).toBe(true);
    expect(tankDraws({ treatedGal: 12, topUpGal: 12, mashWaterGal: 12, spargeGal: 8.5 }).mashOverTreated).toBe(false);
    expect(tankDraws({ treatedGal: 12, topUpGal: 8, mashWaterGal: 7, spargeGal: 8.5 }).spargeOverTopUp).toBe(true);
    expect(tankDraws({ treatedGal: 12, topUpGal: 8.5, mashWaterGal: 7, spargeGal: 8.5 }).spargeOverTopUp).toBe(false);

    // WT-S9: a blank treated volume or top-up level blanks what needs it and
    // warns of nothing.
    const noTreated = tankDraws({ treatedGal: NaN, topUpGal: 12, mashWaterGal: 7, spargeGal: 8.5 });
    expect(noTreated.treatedShare).toBeNaN();
    expect(noTreated.toMash).toBeNaN();
    expect(noTreated.leftGal).toBeCloseTo(3.5, 12);
    expect(noTreated.mashOverTreated).toBe(false);
    const noTopUp = tankDraws({ treatedGal: 12, topUpGal: NaN, mashWaterGal: 7, spargeGal: 8.5 });
    expect(noTopUp.treatedShare).toBeNaN();
    expect(noTopUp.leftGal).toBeNaN();
    expect(noTopUp.toSparge).toBeNaN();
    expect(noTopUp.toMash).toBeCloseTo(7 / 12, 12);
    expect(noTopUp.spargeOverTopUp).toBe(false);
  });

  it('salts in the kettle bring the whole water to the target', () => {
    const { kettleSalts } = engine;

    // The whole water, 15.5 gal at 1.2 g/gal of gypsum, needs 18.6 g.
    // Mash water treated: 1.2 x 7 = 8.4 g reaches the kettle from the mash;
    // the sparge is untreated: 18.6 - 8.4 - 0 = 10.2 g in the kettle.
    expect(kettleSalts({ needed: { gypsum: 18.6 }, fromMash: { gypsum: 8.4 }, fromSparge: {} }).gypsum).toBeCloseTo(10.2, 12);
    // The tank treated: 8.4 g from the mash and 4.25 g carried by the sparge:
    // 18.6 - 8.4 - 4.25 = 5.95 g in the kettle.
    expect(
      kettleSalts({ needed: { gypsum: 18.6 }, fromMash: { gypsum: 8.4 }, fromSparge: { gypsum: 4.25 } }).gypsum,
    ).toBeCloseTo(5.95, 12);

    // Never below zero: the brewer put 20 g in the mash, more than the 18.6 g
    // the whole water needs; a salt in the mash that the whole water does not
    // need is 0 in the kettle.
    const over = kettleSalts({
      needed: { gypsum: 18.6, calcium_chloride: 5 },
      fromMash: { gypsum: 20, epsom: 1 },
      fromSparge: {},
    });
    expect(over.gypsum).toBe(0);
    expect(over.calcium_chloride).toBe(5);
    expect(over.epsom).toBe(0);

    // No acid goes in the kettle (WT-S5): only salts are balanced.
    const withAcid = kettleSalts({
      needed: { gypsum: 18.6, lactic_88: 4 },
      fromMash: { gypsum: 8.4, lactic_88: 2 },
      fromSparge: {},
    });
    expect(Object.keys(withAcid)).toEqual(['gypsum']);

    // A blank figure blanks the kettle amount, never 0.
    expect(kettleSalts({ needed: { gypsum: NaN }, fromMash: { gypsum: 8.4 }, fromSparge: {} }).gypsum).toBeNaN();
    expect(kettleSalts({ needed: { gypsum: 18.6 }, fromMash: { gypsum: 8.4 }, fromSparge: { gypsum: NaN } }).gypsum).toBeNaN();
  });
});
