// design-warnings.test.js
// The recommended mash ranges and their check (docs/items/design-warnings.md,
// sentences V1, V2; decisions W1–W3). The ranges are the owner's cells —
// Recipe Designer Rev 3, "Grist and Pitch Calc's" F3 "Rv Should be 1.25-2"
// and F4 "R should be 2.5-4" — so scenario 1 needs no hand working. The
// boundary cases are worked by hand from Rv = 4 x water (gal) / grain (lb)
// and R = Rv x 2.055, written beside each.

import { describe, it, expect } from 'vitest';
import { computeGrist, MASH_RV_RANGE_QT_PER_LB, MASH_R_RANGE_LB_PER_LB, mashRatioWarnings } from '../src/index.js';

// One malt of `grainLb` pounds mashed with `waterGal` gallons, at 60 F.
function mash(waterGal, grainLb) {
  return computeGrist({
    malts: [{ name: 'Pale 2-Row', weightLb: grainLb, fgdb: 0.8, colorL: 2 }],
    preBoilVolGal: 7,
    postBoilVolGal: 5.5,
    mashWaterGal: waterGal,
  });
}

describe('design warnings: mash ranges', () => {
  // W3
  it('the mash ranges are the owner\'s cells: Rv 1.25–2 qt/lb, R 2.5–4 lb/lb', () => {
    expect(MASH_RV_RANGE_QT_PER_LB).toEqual({ low: 1.25, high: 2 });
    expect(MASH_R_RANGE_LB_PER_LB).toEqual({ low: 2.5, high: 4 });
  });

  // V1, W1
  it('Mash Rv warns outside 1.25–2 and not at either end', () => {
    const cases = [
      // 5 gal x 4 / 16 lb = 20 / 16 = 1.25: the low end, inside.
      { water: 5, grain: 16, rv: 1.25, warns: false },
      // 5 gal x 4 / 10 lb = 20 / 10 = 2.0: the high end, inside.
      { water: 5, grain: 10, rv: 2.0, warns: false },
      // 5.5 gal x 4 / 10 lb = 22 / 10 = 2.2: above 2.
      { water: 5.5, grain: 10, rv: 2.2, warns: true },
      // 3 gal x 4 / 10 lb = 12 / 10 = 1.2: below 1.25.
      { water: 3, grain: 10, rv: 1.2, warns: true },
    ];
    for (const c of cases) {
      const g = mash(c.water, c.grain);
      expect(g.mashRv, `${c.water} gal on ${c.grain} lb`).toBeCloseTo(c.rv, 9);
      expect(mashRatioWarnings(g).mashRv, `${c.water} gal on ${c.grain} lb`).toBe(c.warns);
    }
  });

  // V2, W1, W2
  it('Mash R warns outside 2.5–4 and not at either end, each range on its own', () => {
    // 4.95 gal x 4 / 10 lb = 19.8 / 10 = 1.98 qt/lb: inside 1.25–2, no Rv warning;
    // R = 1.98 x 2.055 = 4.0689 lb/lb: above 4, warns.
    const high = mash(4.95, 10);
    expect(high.mashRv).toBeCloseTo(1.98, 9);
    expect(high.mashR).toBeCloseTo(4.0689, 9);
    expect(mashRatioWarnings(high)).toEqual({ mashRv: false, mashR: true });

    // 3.075 gal x 4 / 10 lb = 12.3 / 10 = 1.23 qt/lb: below 1.25, Rv warns;
    // R = 1.23 x 2.055 = 2.52765 lb/lb: inside 2.5–4, no R warning.
    const low = mash(3.075, 10);
    expect(low.mashRv).toBeCloseTo(1.23, 9);
    expect(low.mashR).toBeCloseTo(2.52765, 9);
    expect(mashRatioWarnings(low)).toEqual({ mashRv: true, mashR: false });

    // The ends of R's range are inside: exactly 2.5 and 4 give no warning.
    expect(mashRatioWarnings({ mashRv: 1.5, mashR: 2.5 }).mashR).toBe(false);
    expect(mashRatioWarnings({ mashRv: 1.5, mashR: 4 }).mashR).toBe(false);
    // A blank (not a number) value gives no warning (V4).
    expect(mashRatioWarnings({ mashRv: NaN, mashR: NaN })).toEqual({ mashRv: false, mashR: false });
  });
});
