// whirlpool-hop-range.test.js
// "A hop below 176 °F is held at the 176 °F factor, and one above 212 °F at
// the 212 °F factor" (docs/items/whirlpool-hop-range.md, WH-S1 to WH-S3 and
// WH-S5; Tier A; SPEC rule 2). The whirlpool temperature factor is Rev 4's
// quadratic (Hops!H3:H9), used from 176 to 212 °F, the range its own table
// ties it to (Hops!M10:O12: 80, 90 and 100 °C at 0.25, 0.5 and 1; decision
// H-1), and held at its own figure at each end outside it (H-2, H-3).
//
// The figures are worked by hand from the quadratic's three constants, the
// working beside each:
//   f(176) = 0.0003858 × 30976 − 0.12885802 × 176 + 10.97839506
//          = 11.9505408 − 22.67901152 + 10.97839506 = 0.24992434
//   f(194) = 0.0003858 × 37636 − 0.12885802 × 194 + 10.97839506
//          = 14.5199688 − 24.99845588 + 10.97839506 = 0.49990798
//   f(212) = 0.0003858 × 44944 − 0.12885802 × 212 + 10.97839506
//          = 17.3393952 − 27.31790024 + 10.97839506 = 0.99989002
// Before the change, f(150) = 0.3302, f(122) = 1.0000, f(170) = 0.2280,
// f(213) = 1.0360 and f(220) = 1.3011: the curve's own figures past its range.

import { describe, it, expect } from 'vitest';
import { computeHops, WHIRLPOOL_RANGE_F } from '../src/index.js';

const F176 = 0.24992434; // by hand, above
const F194 = 0.49990798; // by hand, above
const F212 = 0.99989002; // by hand, above

// One addition at each temperature, all else alike: 20 min, 1 oz at 10 %
// alpha, 6 gal post-boil, 1.050 pre-boil.
const at = (temps) =>
  computeHops({
    kettleAdditions: temps.map((wortTempF, i) => ({
      name: `Hop ${i + 1}`,
      timeMin: 20,
      wortTempF,
      weightOz: 1,
      alphaAcidFraction: 0.1,
    })),
    preBoilSg: 1.05,
    postBoilVolGal: 6,
    dryHops: [],
    fermentVolGal: 5.5,
  }).additions;

describe('a hop below 176 °F is held at the 176 °F factor, and one above 212 °F at the 212 °F factor', () => {
  it('the range is 176 to 212 °F (H-1)', () => {
    expect(WHIRLPOOL_RANGE_F).toEqual({ low: 176, high: 212 });
  });

  it('150, 122 and 170 °F give the 176 °F figure, and the same bitterness as 176 °F (WH-S2)', () => {
    const [h150, h122, h170, h176] = at([150, 122, 170, 176]);
    for (const h of [h150, h122, h170]) {
      expect(h.tempFactor).toBeCloseTo(F176, 8);
      expect(h.ibu).toBe(h176.ibu);
    }
  });

  it('213 and 220 °F give the 212 °F figure, and the same bitterness as 212 °F (WH-S3)', () => {
    const [h213, h220, h212] = at([213, 220, 212]);
    for (const h of [h213, h220]) {
      expect(h.tempFactor).toBeCloseTo(F212, 8);
      expect(h.ibu).toBe(h212.ibu);
    }
  });

  it('176, 194 and 212 °F are as before, and every temperature in the range is the quadratic (WH-S1)', () => {
    const [h176, h194, h212] = at([176, 194, 212]);
    expect(h176.tempFactor).toBeCloseTo(F176, 8);
    expect(h194.tempFactor).toBeCloseTo(F194, 8);
    expect(h212.tempFactor).toBeCloseTo(F212, 8);
    // Rev 4's quadratic, its constants as Hops!H3 writes them, at every tenth
    // of a degree from 176 to 212 °F.
    const temps = Array.from({ length: 361 }, (_, i) => 176 + i / 10);
    at(temps).forEach((h, i) => {
      const T = temps[i];
      expect(h.tempFactor).toBeCloseTo(0.0003858 * T * T - 0.12885802 * T + 10.97839506, 12);
    });
  });

  it('the factor never rises as the wort gets cooler, and never passes the boil’s (WH-S2, WH-S3)', () => {
    const temps = Array.from({ length: 1401 }, (_, i) => 100 + i / 10); // 100 to 240 °F
    const factors = at(temps).map((h) => h.tempFactor);
    for (let i = 1; i < factors.length; i++) expect(factors[i]).toBeGreaterThanOrEqual(factors[i - 1]);
    for (const f of factors) expect(f).toBeLessThanOrEqual(F212 + 1e-12);
  });

  it('only a hop below 176 °F is marked as held at the low end', () => {
    const below = at([150, 175.9, 176, 194, 212, 220, NaN]).map((h) => h.belowRange);
    expect(below).toEqual([true, true, false, false, false, false, false]);
  });

  it('a blank hop temperature is a blank figure, as today (WH-S5)', () => {
    const [h] = at([NaN]);
    expect(Number.isNaN(h.tempFactor)).toBe(true);
    expect(Number.isNaN(h.ibu)).toBe(true);
  });
});
