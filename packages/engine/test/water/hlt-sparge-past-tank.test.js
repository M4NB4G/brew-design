// hlt-sparge-past-tank.test.js
// Scenarios for "The HLT's figures when the sparge is more than the tank
// holds" (docs/items/hlt-sparge-past-tank.md, HT-S1 to HT-S3, HT-Q1, HT-Q2;
// Tier A + B), the engine's part: the water left in the tank after the
// sparge is never below 0, and the warning that the sparge is more than the
// tank holds compares it with the water the tank holds, the top-up level or
// the treated water the mash leaves when that is larger.
//
// By hand. The tank's first fill is treated; the mash draws its water; the
// treated water left is the first fill less the mash water; the tank is
// topped up to the top-up level, never below that treated water.
//   12 gal treated, 7 mash, top-up 8: 12 - 7 = 5 left, below 8, so the tank
//     holds 8; a sparge of 8.5 is more than 8 (warned) and 8 - 8.5 = -0.5,
//     held at 0.
//   12 gal treated, 5 mash, top-up 6: 12 - 5 = 7 left, above 6, so the tank
//     holds 7; a sparge of 6.5 is less than 7 (no warning), 7 - 6.5 = 0.5
//     left; 7.5 is more than 7 (warned), 7 - 7.5 = -0.5, held at 0.
//   12 gal treated, 7 mash, top-up 12, sparge 8.5 (within the limits): the
//     tank holds 12, 12 - 8.5 = 3.5 left, no warning; the shares of the
//     salts: 7/12 to the mash, 5/12 x 8.5/12 = 42.5/144 carried by the
//     sparge, 5/12 x 3.5/12 = 17.5/144 left, adding to (84 + 42.5 + 17.5) /
//     144 = 1.

import { describe, it, expect } from 'vitest';
import { tankDraws } from '../../src/index.js';

describe("the HLT's figures when the sparge is more than the tank holds", () => {
  it('the water left is never below 0 (HT-S1)', () => {
    const t = tankDraws({ treatedGal: 12, topUpGal: 8, mashWaterGal: 7, spargeGal: 8.5 });
    expect(t.leftGal).toBe(0);
    expect(t.spargeOverTank).toBe(true);
    const over = tankDraws({ treatedGal: 12, topUpGal: 6, mashWaterGal: 5, spargeGal: 7.5 });
    expect(over.leftGal).toBe(0);
    // Every share still held, and the shares still add to 1 (row K):
    // 5/12 to the mash, the 7/12 the mash leaves all carried by the sparge.
    expect(over.toMash).toBeCloseTo(5 / 12, 12);
    expect(over.toSparge).toBeCloseTo(7 / 12, 12);
    expect(over.left).toBe(0);
    expect(over.toMash + over.toSparge + over.left).toBeCloseTo(1, 12);
  });

  it('the sparge warning reads the water the tank holds (HT-S2)', () => {
    const holds = (spargeGal) => tankDraws({ treatedGal: 12, topUpGal: 6, mashWaterGal: 5, spargeGal });
    expect(holds(6.5).tankGal).toBeCloseTo(7, 12);
    expect(holds(6.5).spargeOverTank, '6.5 into a tank holding 7').toBe(false);
    expect(holds(6.5).leftGal).toBeCloseTo(0.5, 12);
    expect(holds(7.5).spargeOverTank, '7.5 into a tank holding 7').toBe(true);
    const topUp = tankDraws({ treatedGal: 12, topUpGal: 8, mashWaterGal: 7, spargeGal: 8.5 });
    expect(topUp.tankGal).toBe(8);
    expect(topUp.spargeOverTank, '8.5 into a tank topped up to 8').toBe(true);
    expect(tankDraws({ treatedGal: 12, topUpGal: 8, mashWaterGal: 7, spargeGal: 8 }).spargeOverTank).toBe(false);
    // A sparge of exactly the treated water left does not warn: 5 - 3.2 =
    // 1.8 gal by hand, though the sum comes to 1.7999999999999998 in
    // floating point; nothing is left.
    const exact = tankDraws({ treatedGal: 5, topUpGal: 1, mashWaterGal: 3.2, spargeGal: 1.8 });
    expect(exact.spargeOverTank).toBe(false);
    expect(exact.leftGal).toBe(0);
  });

  it('within the limits nothing changes (HT-S3)', () => {
    const t = tankDraws({ treatedGal: 12, topUpGal: 12, mashWaterGal: 7, spargeGal: 8.5 });
    expect(t.tankGal).toBe(12);
    expect(t.leftGal).toBeCloseTo(3.5, 12);
    expect(t.spargeOverTank).toBe(false);
    expect(t.toMash).toBeCloseTo(7 / 12, 12);
    expect(t.toSparge).toBeCloseTo(42.5 / 144, 12);
    expect(t.left).toBeCloseTo(17.5 / 144, 12);
    expect(t.toMash + t.toSparge + t.left).toBeCloseTo(1, 12);
    // A blank top-up level or sparge still blanks the water left, and warns
    // of nothing, as before.
    expect(tankDraws({ treatedGal: 12, topUpGal: NaN, mashWaterGal: 7, spargeGal: 8.5 }).leftGal).toBeNaN();
    expect(tankDraws({ treatedGal: 12, topUpGal: NaN, mashWaterGal: 7, spargeGal: 8.5 }).spargeOverTank).toBe(false);
    expect(tankDraws({ treatedGal: 12, topUpGal: 12, mashWaterGal: 7, spargeGal: NaN }).leftGal).toBeNaN();
  });
});
