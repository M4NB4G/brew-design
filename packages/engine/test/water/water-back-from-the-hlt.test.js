// water-back-from-the-hlt.test.js
// Scenarios for batch S15c item 3, "Water back drawn from the hot-liquor
// tank" (docs/items/water-back-from-the-hlt.md, WD-S1, WD-S2, WD-S5, K): with
// the HLT treated and water back on, the water back is drawn from the tank
// after the sparge, as typed, and carries its share of what was put in the
// tank. Water back is not in Rev 4: every share is worked by hand.
//
// A worked tank: 12 gal treated, the mash draws 5, so 7 gal of treated water
// stay (7/12 of the salts and acid); topped up to 8 gal (the tank holds 8);
// the sparge draws 4 gal, leaving 4 gal; the water back draws 1 gal of it,
// leaving 3 gal.
//   to the mash        5 / 12                    = 40/96
//   to the sparge      7/12 x 4/8 = 28/96        = 7/24
//   to the water back  7/12 x 1/8 =  7/96
//   left               7/12 x 3/8 = 21/96        = 7/32
//   40 + 28 + 7 + 21 = 96: the shares add to 1.
// A water back of 5 gal is more than the 4 gal left after the sparge: it
// draws the 4, 7/12 x 4/8 = 7/24 of the salts, 0 gal and 0 are left, and the
// other 1 gal is untreated water.

import { describe, it, expect } from 'vitest';
import { tankDraws } from '../../src/index.js';

const TANK = { treatedGal: 12, topUpGal: 8, mashWaterGal: 5, spargeGal: 4 };

describe('water back drawn from the hot-liquor tank', () => {
  it('the water back is drawn after the sparge (WD-S1)', () => {
    const t = tankDraws({ ...TANK, waterBackGal: 1 });
    expect(t.toWaterBackGal).toBe(1);
    expect(t.leftGal).toBe(3);
    expect(t.toMash).toBeCloseTo(40 / 96, 12);
    expect(t.toSparge).toBeCloseTo(28 / 96, 12);
    expect(t.toWaterBack).toBeCloseTo(7 / 96, 12);
    expect(t.left).toBeCloseTo(21 / 96, 12);
    expect(t.waterBackOverTank).toBe(false);
    expect(t.waterBackUntreatedGal).toBe(0);
  });

  it('more than is left draws what is left (WD-S2)', () => {
    const t = tankDraws({ ...TANK, waterBackGal: 5 });
    expect(t.toWaterBackGal).toBe(4);
    expect(t.leftGal).toBe(0);
    expect(t.toWaterBack).toBeCloseTo(7 / 24, 12);
    expect(t.left).toBe(0);
    expect(t.waterBackOverTank).toBe(true);
    expect(t.waterBackUntreatedGal).toBe(1);
    // Exactly what is left is not more.
    expect(tankDraws({ ...TANK, waterBackGal: 4 }).waterBackOverTank).toBe(false);
    // A sparge past the tank leaves nothing for the water back: all of it untreated.
    const dry = tankDraws({ ...TANK, spargeGal: 9, waterBackGal: 1 });
    expect(dry.toWaterBackGal).toBe(0);
    expect(dry.toWaterBack).toBe(0);
    expect(dry.waterBackUntreatedGal).toBe(1);
    expect(dry.waterBackOverTank).toBe(true);
  });

  it('the shares add to one (K)', () => {
    for (const waterBackGal of [0, 1, 2.5, 4, 5, 20]) {
      for (const c of [TANK, { ...TANK, topUpGal: 12 }, { ...TANK, topUpGal: 5 }, { ...TANK, spargeGal: 9 }, { ...TANK, mashWaterGal: 14 }]) {
        const t = tankDraws({ ...c, waterBackGal });
        expect(t.toMash + t.toSparge + t.toWaterBack + t.left, JSON.stringify({ ...c, waterBackGal })).toBeCloseTo(1, 12);
      }
    }
  });

  it('without water back nothing changes (WD-S5)', () => {
    for (const c of [TANK, { ...TANK, spargeGal: 9 }, { ...TANK, topUpGal: NaN }, { ...TANK, spargeGal: NaN }]) {
      const before = tankDraws(c);
      const zero = tankDraws({ ...c, waterBackGal: 0 });
      for (const k of ['remainingGal', 'tankGal', 'treatedShare', 'leftGal', 'toMash', 'toSparge', 'left', 'mashOverTreated', 'spargeOverTank', 'topUpBelowTreated']) {
        expect(zero[k], k).toEqual(before[k]);
      }
      expect(zero.waterBackOverTank).toBe(false);
    }
    const t = tankDraws(TANK);
    expect(t.leftGal).toBe(4);
    expect(t.left).toBeCloseTo((7 / 12) * (4 / 8), 12);
    expect(t.toWaterBackGal).toBe(0);
    expect(t.toWaterBack).toBe(0);
  });
});
