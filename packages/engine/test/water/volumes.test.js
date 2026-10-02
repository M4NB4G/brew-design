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
// malts, 14 gal before the boil at 60 °F, 7 gal of mash water, the built-in
// absorption. S4 worked the 8.5 gal of sparge out from 1 gal kept in the
// mash tun; since S4b item 1 the sparge is typed and the 1 gal left in the
// mash tun is worked out (the "sparge water typed" scenarios below).
const MALTS = [
  { name: 'Pale', weightLb: 15, fgdb: 0.8, colorL: 2 },
  { name: 'Munich', weightLb: 5, fgdb: 0.8, colorL: 9 },
];
const EXAMPLE = {
  malts: MALTS,
  absorptionQtPerLb: 0.1,
  preBoilGal: 14,
  mashWaterGal: 7,
  spargeGal: 8.5,
  spargeMethod: 'batch',
};

describe('water treatment choice — the engine', () => {
  it('the water volumes come from the recipe', () => {
    const { waterVolumes, GRAIN_ABSORPTION_QT_PER_LB, QT_PER_GAL } = engine;

    // Q3: the owner's figure, 0.1 qt of water per pound of grain; a quart is
    // a quarter of a gallon by definition, so 0.1 / 4 = 0.025 gal per pound.
    expect(GRAIN_ABSORPTION_QT_PER_LB).toBe(0.1);
    expect(QT_PER_GAL).toBe(4);

    // By hand: grain 15 + 5 = 20 lb; absorption 20 x 0.1 / 4 = 0.5 gal;
    // total 7 + 8.5 = 15.5 gal.
    const v = waterVolumes(EXAMPLE);
    expect(v.grainLb).toBe(20);
    expect(v.absorptionGal).toBeCloseTo(0.5, 12);
    expect(v.spargeGal).toBeCloseTo(8.5, 12);
    expect(v.totalGal).toBeCloseTo(15.5, 12);

    // The owner's own bill (water program notes): 29 lb at 0.1 qt/lb absorbs
    // 29 x 0.1 / 4 = 0.725 gal.
    expect(waterVolumes({ ...EXAMPLE, malts: [{ ...MALTS[0], weightLb: 29 }] }).absorptionGal).toBeCloseTo(0.725, 12);

    // Q6: no sparge (full volume): no sparge water; the mash water is all the water.
    const none = waterVolumes({ ...EXAMPLE, spargeMethod: 'none' });
    expect(none.spargeGal).toBe(0);
    expect(none.totalGal).toBe(7);

    // WT-S9: a blank figure blanks what needs it, never counted as 0.
    const blankWeight = waterVolumes({ ...EXAMPLE, malts: [MALTS[0], { ...MALTS[1], weightLb: NaN }] });
    expect(blankWeight.grainLb).toBeNaN();
    expect(blankWeight.absorptionGal).toBeNaN();
    expect(blankWeight.mashTunLeftGal).toBeNaN();
    const blankMash = waterVolumes({ ...EXAMPLE, mashWaterGal: NaN });
    expect(blankMash.absorptionGal).toBeCloseTo(0.5, 12);
    expect(blankMash.totalGal).toBeNaN();
    expect(blankMash.mashTunLeftGal).toBeNaN();
    for (const k of ['absorptionQtPerLb', 'preBoilGal']) {
      expect(waterVolumes({ ...EXAMPLE, [k]: NaN }).mashTunLeftGal, k).toBeNaN();
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

// Sparge water typed (S4b item 1, docs/items/water-as-brewed.md, SW-S1–S3,
// SW-S7): the brewer types the sparge water; the water left in the mash tun
// is worked out. The worked example again, by hand.
describe('sparge water typed — the engine', () => {
  const TYPED = {
    malts: MALTS,
    absorptionQtPerLb: 0.1,
    preBoilGal: 14,
    mashWaterGal: 7,
    spargeGal: 8.5,
    spargeMethod: 'batch',
  };

  it('the water left in the mash tun is worked out from the typed sparge water', () => {
    const { waterVolumes } = engine;
    // 20 x 0.1 / 4 = 0.5 gal absorbed; total 7 + 8.5 = 15.5 gal; left in the
    // mash tun 7 + 8.5 - 0.5 - 14 = 1.0 gal.
    const v = waterVolumes(TYPED);
    expect(v.absorptionGal).toBeCloseTo(0.5, 12);
    expect(v.spargeGal).toBe(8.5);
    expect(v.totalGal).toBeCloseTo(15.5, 12);
    expect(v.mashTunLeftGal).toBeCloseTo(1, 12);
    expect(v.kettleShortGal).toBe(0);
    // 8 gal of sparge: 7 + 8 - 0.5 - 14 = 0.5 gal left.
    expect(waterVolumes({ ...TYPED, spargeGal: 8 }).mashTunLeftGal).toBeCloseTo(0.5, 12);
    // 7 gal of sparge: 7 + 7 - 0.5 - 14 = -0.5 gal — the kettle is short by 0.5 gal.
    const short = waterVolumes({ ...TYPED, spargeGal: 7 });
    expect(short.mashTunLeftGal).toBeCloseTo(-0.5, 12);
    expect(short.kettleShortGal).toBeCloseTo(0.5, 12);
    // Exactly full, by hand: 7 + 7.5 - 0.5 - 14 = 0; 12 lb at 0.12 qt/lb is
    // 0.36 gal, 4.3 + 2.96 - 0.36 - 6.9 = 0. Round-off in the sums (they come
    // to about -1.8e-15) is not a short kettle.
    expect(waterVolumes({ ...TYPED, spargeGal: 7.5 }).kettleShortGal).toBe(0);
    expect(
      waterVolumes({
        malts: [{ ...MALTS[0], weightLb: 12 }],
        absorptionQtPerLb: 0.12,
        preBoilGal: 6.9,
        mashWaterGal: 4.3,
        spargeGal: 2.96,
        spargeMethod: 'fly',
      }).kettleShortGal,
    ).toBe(0);
    // Fly sparging runs the same sums.
    expect(waterVolumes({ ...TYPED, spargeMethod: 'fly' })).toEqual(v);
  });

  it('with no sparge the mash water is all the water', () => {
    const { waterVolumes } = engine;
    // 15.5 gal of mash water: 15.5 - 0.5 - 14 = 1.0 gal left in the mash
    // tun; a typed sparge is not used.
    const none = waterVolumes({ ...TYPED, spargeMethod: 'none', mashWaterGal: 15.5 });
    expect(none.spargeGal).toBe(0);
    expect(none.totalGal).toBe(15.5);
    expect(none.mashTunLeftGal).toBeCloseTo(1, 12);
    // 14 gal: 14 - 0.5 - 14 = -0.5 gal: short by 0.5 gal.
    expect(waterVolumes({ ...TYPED, spargeMethod: 'none', mashWaterGal: 14 }).kettleShortGal).toBeCloseTo(0.5, 12);
    // A blank sparge does not matter with no sparge.
    expect(waterVolumes({ ...TYPED, spargeMethod: 'none', mashWaterGal: 15.5, spargeGal: NaN }).mashTunLeftGal).toBeCloseTo(1, 12);
  });

  it('a blank typed sparge blanks what needs it', () => {
    const { waterVolumes } = engine;
    const b = waterVolumes({ ...TYPED, spargeGal: NaN });
    expect(b.spargeGal).toBeNaN();
    expect(b.totalGal).toBeNaN();
    expect(b.mashTunLeftGal).toBeNaN();
    expect(b.kettleShortGal).toBeNaN();
    expect(b.absorptionGal).toBeCloseTo(0.5, 12);
  });
});

// Kettle water at the brewhouse efficiency (S4b item 2,
// docs/items/water-as-brewed.md, KW-S1, KW-S2): the share of the mash's and
// the sparge's salts that reach the kettle. The worked example by hand, at a
// brewhouse efficiency of 90 %: 7 gal of mash water, 8.5 gal of sparge, 14
// gal before the boil.
describe('kettle water at the brewhouse efficiency — the engine', () => {
  const SHARES = { efficiency: 0.9, mashWaterGal: 7, spargeGal: 8.5, preBoilGal: 14, spargeMethod: 'batch' };

  it('the mash salts reach the kettle at the brewhouse efficiency', () => {
    const { kettleShares, kettleSalts, shareOfSalts } = engine;
    // With a sparge: 90 % of the mash's salts; the kettle holds 0.9 x 7 =
    // 6.3 gal-worth of mash liquor, so 14 - 6.3 = 7.7 of the 8.5 gal of sparge
    // reach it: 7.7 / 8.5 = 0.905882.
    const s = kettleShares(SHARES);
    expect(s.mash).toBeCloseTo(0.9, 12);
    expect(s.sparge).toBeCloseTo(7.7 / 8.5, 12);
    expect(kettleShares({ ...SHARES, spargeMethod: 'fly' })).toEqual(s);

    // Mash water treated, 1.2 g/gal of gypsum: 8.4 g in the mash, 7.56 g of it
    // reaches the kettle; the kettle water, 14 gal, needs 1.2 x 14 = 16.8 g:
    // 16.8 - 7.56 = 9.24 g in the kettle.
    const fromMash = shareOfSalts({ gypsum: 8.4 }, s.mash);
    expect(fromMash.gypsum).toBeCloseTo(7.56, 12);
    expect(kettleSalts({ needed: { gypsum: 16.8 }, fromMash, fromSparge: {} }).gypsum).toBeCloseTo(9.24, 12);

    // The HLT treated (12 gal, topped up to 12): the sparge carries 4.25 g
    // (S4's worked example); 7.7 / 8.5 of it, 0.5 g/gal x 7.7 = 3.85 g,
    // reaches the kettle: 16.8 - 7.56 - 3.85 = 5.39 g in the kettle.
    const fromSparge = shareOfSalts({ gypsum: 4.25 }, s.sparge);
    expect(fromSparge.gypsum).toBeCloseTo(3.85, 12);
    expect(kettleSalts({ needed: { gypsum: 16.8 }, fromMash, fromSparge }).gypsum).toBeCloseTo(5.39, 12);
  });

  it('with no sparge the mash is well mixed', () => {
    const { kettleShares } = engine;
    // 15.5 gal of mash water, 14 gal before the boil: 14 / 15.5 of the mash's
    // salts reach the kettle, whatever the efficiency (C11).
    const s = kettleShares({ ...SHARES, spargeMethod: 'none', mashWaterGal: 15.5 });
    expect(s.mash).toBeCloseTo(14 / 15.5, 12);
    expect(s.sparge).toBe(0);
    // 1.2 g/gal x 15.5 = 18.6 g in the mash; 18.6 x 14 / 15.5 = 16.8 g reach
    // the 14 gal kettle: exactly its need, 1.2 x 14 — no kettle salts.
    expect(18.6 * s.mash).toBeCloseTo(16.8, 12);
  });

  it('a share past the whole is held at its limit', () => {
    const { kettleShares } = engine;
    // KS1 (docs/items/kettle-share-limits.md, KS-S1), by hand:
    // at 75 %, 0.75 x 7 = 5.25 gal-worth of mash liquor leaves 14 - 5.25 =
    // 8.75 gal for the 8.5 gal of sparge: 8.75 / 8.5 = 1.029 is held at 1.
    const low = kettleShares({ ...SHARES, efficiency: 0.75 });
    expect(low.mash).toBe(0.75);
    expect(low.sparge).toBe(1);
    expect(low.held).toBe(true);
    // At 95 % with 16 gal of mash water, 0.95 x 16 = 15.2 gal-worth for a
    // 14 gal kettle: the mash share is held at the kettle's, 14 / 16 =
    // 0.875, which leaves 14 - 0.875 x 16 = 0 for the sparge: 0.
    const big = kettleShares({ ...SHARES, efficiency: 0.95, mashWaterGal: 16 });
    expect(big.mash).toBeCloseTo(14 / 16, 12);
    expect(big.sparge).toBeCloseTo(0, 12);
    expect(big.held).toBe(true);
    // No sparge with a short kettle: 7 gal of mash water for 14 gal before
    // the boil, 14 / 7 = 2, is held at 1.
    const shortNone = kettleShares({ ...SHARES, spargeMethod: 'none' });
    expect(shortNone.mash).toBe(1);
    expect(shortNone.held).toBe(true);
    // KS-S3: within the limits, nothing is held (90 %: 0.9 and 7.7 / 8.5).
    const within = kettleShares(SHARES);
    expect(within.held).toBe(false);
    expect(within.sparge).toBeCloseTo(7.7 / 8.5, 12);
    expect(kettleShares({ ...SHARES, spargeMethod: 'none', mashWaterGal: 15.5 }).held).toBe(false);
    // An exact fit is not held, whatever the round-off: 11 gal of mash water,
    // 1 gal of sparge, 8.5 gal before the boil, efficiency 7.5 / 11: by hand
    // 8.5 - 7.5 = 1 gal of sparge reaches the kettle, all of it; the sums come
    // to 1.0000000000000009, which is not a held share.
    const exact = kettleShares({ efficiency: 7.5 / 11, mashWaterGal: 11, spargeGal: 1, preBoilGal: 8.5, spargeMethod: 'batch' });
    expect(exact.sparge).toBe(1);
    expect(exact.held).toBe(false);
  });

  it('a blank figure blanks the shares', () => {
    const { kettleShares } = engine;
    for (const k of ['efficiency', 'mashWaterGal', 'spargeGal', 'preBoilGal']) {
      const s = kettleShares({ ...SHARES, [k]: NaN });
      expect(Number.isNaN(s.mash) || Number.isNaN(s.sparge), k).toBe(true);
    }
  });
});

describe('kettle water at the brewhouse efficiency — the salts in the kettle', () => {
  it('the salts in the kettle add up', () => {
    const { sumSalts } = engine;
    // 7.56 g from the mash + 3.85 g from the sparge + 5.39 g in the kettle =
    // 16.8 g of gypsum, the kettle water's need; a salt in one list only
    // keeps its amount.
    const s = sumSalts({ gypsum: 7.56 }, { gypsum: 3.85 }, { gypsum: 5.39, epsom: 1 });
    expect(s.gypsum).toBeCloseTo(16.8, 12);
    expect(s.epsom).toBe(1);
    expect(sumSalts({ gypsum: NaN }, { gypsum: 1 }).gypsum).toBeNaN();
  });
});
