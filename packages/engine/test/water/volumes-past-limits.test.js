// volumes-past-limits.test.js
// Scenarios for "Water volumes past their limits" (scope table agreed
// 2026-10-08, docs/items/water-volumes-past-limits.md), the engine's part:
// the hot-liquor tank's draws when the top-up level is below the treated
// water the mash leaves (WV-S1, WV-Q1) and when the mash water is more than
// the treated volume (WV-S3, WV-Q2), every share held between 0 and 1 (WV-S4)
// and nothing changed within the limits (WV-S5). Every figure is worked out
// by hand with the working beside it (CLAUDE.md, Models: the hand-pin rule).

import { describe, it, expect } from 'vitest';
import { tankDraws } from '../../src/index.js';

describe('water volumes past their limits', () => {
  it('a top-up level below the treated water left adds no untreated water', () => {
    // WV-S1: 12 gal treated, 5 gal of mash water, top-up level 6 gal, 4 gal of
    // sparge. By hand: the mash leaves 12 - 5 = 7 gal of treated water, above
    // the 6 gal top-up level, so no untreated water goes in: the tank holds
    // 7 gal, all treated, and the sparge liquor is 7/7 = 100 % treated.
    // Of the tank's salts: the mash draws 5/12; 7/12 stay; the sparge draws
    // 4 of the 7 gal, carrying (7/12)(4/7) = 4/12 = 1/3; the 7 - 4 = 3 gal
    // left keep (7/12)(3/7) = 3/12 = 1/4.
    const t = tankDraws({ treatedGal: 12, topUpGal: 6, mashWaterGal: 5, spargeGal: 4 });
    expect(t.treatedShare).toBeCloseTo(1, 12);
    expect(t.toMash).toBeCloseTo(5 / 12, 12);
    expect(t.toSparge).toBeCloseTo(1 / 3, 12);
    expect(t.left).toBeCloseTo(1 / 4, 12);
    expect(t.leftGal).toBeCloseTo(3, 12);
    expect(t.remainingGal).toBeCloseTo(7, 12);
    // WV-S2: the engine says so, and nothing else is warned.
    expect(t.topUpBelowTreated).toBe(true);
    expect(t.mashOverTreated).toBe(false);
    expect(t.spargeOverTopUp).toBe(false);
    // Equal is not below: topped up to the 7 gal it holds, nothing is warned.
    expect(tankDraws({ treatedGal: 12, topUpGal: 7, mashWaterGal: 5, spargeGal: 4 }).topUpBelowTreated).toBe(false);
  });

  it('mash water more than the treated volume takes every salt', () => {
    // WV-S3: 12 gal treated, 14 gal of mash water, top-up level 20 gal, 4 gal
    // of sparge. By hand: the mash takes all 12 gal of treated water and so
    // every salt (12/12 = 100 %); no treated water is left (0 gal), so the
    // tank is topped up to 20 gal with untreated water: 0/20 = 0 % treated;
    // the sparge carries 0 and nothing is left from the treated fill (0).
    const t = tankDraws({ treatedGal: 12, topUpGal: 20, mashWaterGal: 14, spargeGal: 4 });
    expect(t.toMash).toBe(1);
    expect(t.treatedShare).toBe(0);
    expect(t.toSparge).toBe(0);
    expect(t.left).toBe(0);
    expect(t.remainingGal).toBe(0);
    // The existing warning stays; the top-up is not below what the tank holds.
    expect(t.mashOverTreated).toBe(true);
    expect(t.topUpBelowTreated).toBe(false);
  });

  it('the shares always add to one and stay between 0 and 1', () => {
    // WV-S4: across tanks inside and past every limit (the two above, the
    // item's worked examples, and a sparge more than the tank holds), each
    // share is between 0 and 1 and mash + sparge + left = 1 (conservation:
    // every salt put in the tank is somewhere).
    const cases = [
      { treatedGal: 12, topUpGal: 12, mashWaterGal: 7, spargeGal: 8.5 },
      { treatedGal: 14, topUpGal: 10, mashWaterGal: 8, spargeGal: 9 },
      { treatedGal: 12, topUpGal: 6, mashWaterGal: 5, spargeGal: 4 },
      { treatedGal: 12, topUpGal: 20, mashWaterGal: 14, spargeGal: 4 },
      { treatedGal: 12, topUpGal: 8, mashWaterGal: 7, spargeGal: 8.5 }, // sparge past the top-up level
      { treatedGal: 12, topUpGal: 6, mashWaterGal: 5, spargeGal: 9 }, // sparge past the 7 gal held
      { treatedGal: 12, topUpGal: 2, mashWaterGal: 14, spargeGal: 4 }, // both past
    ];
    for (const c of cases) {
      const t = tankDraws(c);
      const label = JSON.stringify(c);
      for (const k of ['treatedShare', 'toMash', 'toSparge', 'left']) {
        expect(t[k], `${label} ${k}`).toBeGreaterThanOrEqual(0);
        expect(t[k], `${label} ${k}`).toBeLessThanOrEqual(1);
      }
      expect(t.toMash + t.toSparge + t.left, label).toBeCloseTo(1, 12);
    }
    // The sparge past the 7 gal held (12 / 6 / 5 / 9), by hand: it draws all
    // the tank holds, so it carries all 7/12 that stayed and nothing is left.
    const over = tankDraws({ treatedGal: 12, topUpGal: 6, mashWaterGal: 5, spargeGal: 9 });
    expect(over.toSparge).toBeCloseTo(7 / 12, 12);
    expect(over.left).toBe(0);
    expect(over.spargeOverTopUp).toBe(true);
  });

  it('within the limits nothing changes', () => {
    // WV-S5: the water treatment item's worked example (volumes.test.js), by
    // hand: 12 gal treated, topped up to 12, 7 gal of mash water, 8.5 gal of
    // sparge: 5 gal stay, 5/12 treated; the sparge carries 5/12 x 8.5/12 =
    // 42.5/144; 5/12 x 3.5/12 = 17.5/144 is left in 3.5 gal. The owner's
    // system: treat 14, mash 8, top up to 10: 6/10 = 60 %.
    const t = tankDraws({ treatedGal: 12, topUpGal: 12, mashWaterGal: 7, spargeGal: 8.5 });
    expect(t.remainingGal).toBeCloseTo(5, 12);
    expect(t.treatedShare).toBeCloseTo(5 / 12, 12);
    expect(t.toMash).toBeCloseTo(7 / 12, 12);
    expect(t.toSparge).toBeCloseTo(42.5 / 144, 12);
    expect(t.left).toBeCloseTo(17.5 / 144, 12);
    expect(t.leftGal).toBeCloseTo(3.5, 12);
    expect(t.topUpBelowTreated).toBe(false);
    expect(tankDraws({ treatedGal: 14, topUpGal: 10, mashWaterGal: 8, spargeGal: 9 }).treatedShare).toBeCloseTo(0.6, 12);
    // A blank treated volume or top-up level blanks what needs it and warns of
    // nothing (WT-S9), as before.
    const noTreated = tankDraws({ treatedGal: NaN, topUpGal: 12, mashWaterGal: 7, spargeGal: 8.5 });
    expect(noTreated.treatedShare).toBeNaN();
    expect(noTreated.toMash).toBeNaN();
    expect(noTreated.leftGal).toBeCloseTo(3.5, 12);
    expect(noTreated.topUpBelowTreated).toBe(false);
    const noTopUp = tankDraws({ treatedGal: 12, topUpGal: NaN, mashWaterGal: 7, spargeGal: 8.5 });
    expect(noTopUp.treatedShare).toBeNaN();
    expect(noTopUp.leftGal).toBeNaN();
    expect(noTopUp.toSparge).toBeNaN();
    expect(noTopUp.left).toBeNaN();
    expect(noTopUp.topUpBelowTreated).toBe(false);
  });
});
