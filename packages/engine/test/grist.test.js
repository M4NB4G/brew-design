// grist.test.js
// Each malt's share of the grain bill (docs/items/grist-percent.md).
// The share's rule is arithmetic — the malt's weight over the bill total — so
// its pin is worked out by hand, not copied from the code's output.

import { describe, it, expect } from 'vitest';
import { computeGrist } from '../src/index.js';

// The app's default two-malt bill (apps/recipe/src/state.js), at 60 F.
const volumes = { preBoilVolGal: 7, postBoilVolGal: 5.5, mashWaterGal: 5 };

function bill(malts) {
  return computeGrist({ malts, ...volumes });
}

const reference = [
  { name: 'Pale 2-Row', weightLb: 10, fgdb: 0.8, colorL: 2 },
  { name: 'Munich', weightLb: 1, fgdb: 0.8, colorL: 9 },
];

describe('grain-bill share per malt', () => {
  it("each malt's share is its weight over the bill total, for the reference recipe", () => {
    const { perMalt } = bill(reference);

    // Worked by hand: total = 10 lb + 1 lb = 11 lb.
    //   Pale 2-Row: 10 / 11 = 0.909090909090909... (long division: 100/11 = 9 r1,
    //                                               10/11 = 0 r10, repeating "90")
    //   Munich:      1 / 11 = 0.090909090909090... (repeating "09")
    expect(perMalt).toHaveLength(2);
    expect(perMalt[0].name).toBe('Pale 2-Row');
    expect(perMalt[1].name).toBe('Munich');
    expect(Math.abs(perMalt[0].perMaltWeightFraction - 0.909090909090909)).toBeLessThan(1e-12);
    expect(Math.abs(perMalt[1].perMaltWeightFraction - 0.090909090909091)).toBeLessThan(1e-12);
  });

  it('the shares sum to 1 for a bill with a positive total weight', () => {
    const bills = [
      reference,
      // The golden-master bill: 27 lb + 2 lb.
      [
        { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
        { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
      ],
      // Three malts with fractional weights.
      [
        { name: 'Pilsner', weightLb: 8.3, fgdb: 0.81, colorL: 1.6 },
        { name: 'Vienna', weightLb: 1.7, fgdb: 0.79, colorL: 3.5 },
        { name: 'Crystal 40', weightLb: 0.45, fgdb: 0.74, colorL: 40 },
      ],
      // A single malt.
      [{ name: 'Maris Otter', weightLb: 12, fgdb: 0.81, colorL: 3 }],
    ];
    for (const malts of bills) {
      const sum = bill(malts).perMalt.reduce((s, m) => s + m.perMaltWeightFraction, 0);
      expect(Math.abs(sum - 1)).toBeLessThan(1e-12);
    }
  });

  it('a zero-weight malt is listed with a share of 0', () => {
    const { perMalt } = bill([
      { name: 'Pale 2-Row', weightLb: 10, fgdb: 0.8, colorL: 2 },
      { name: 'Unused', weightLb: 0, fgdb: 0.8, colorL: 60 },
      { name: 'Munich', weightLb: 1, fgdb: 0.8, colorL: 9 },
    ]);

    // Listed in place, not omitted: three malts in, three shares out.
    expect(perMalt.map((m) => m.name)).toEqual(['Pale 2-Row', 'Unused', 'Munich']);
    expect(perMalt[1].perMaltWeightFraction).toBe(0);
  });

  it('an empty bill and a cleared weight yield shares that are not numbers, and nothing throws', () => {
    // Empty bill: every malt at 0 lb, so the total is 0 and each share is 0 / 0.
    const empty = bill([
      { name: 'Pale 2-Row', weightLb: 0, fgdb: 0.8, colorL: 2 },
      { name: 'Munich', weightLb: 0, fgdb: 0.8, colorL: 9 },
    ]);
    expect(empty.perMalt).toHaveLength(2);
    for (const m of empty.perMalt) expect(m.perMaltWeightFraction).toBeNaN();

    // A cleared weight (NaN) makes the total not a number, so every share is too.
    const cleared = bill([
      { name: 'Pale 2-Row', weightLb: NaN, fgdb: 0.8, colorL: 2 },
      { name: 'Munich', weightLb: 1, fgdb: 0.8, colorL: 9 },
    ]);
    expect(cleared.perMalt).toHaveLength(2);
    for (const m of cleared.perMalt) expect(m.perMaltWeightFraction).toBeNaN();

    // No malts at all: nothing throws and there is no share to list.
    expect(() => bill([])).not.toThrow();
    expect(bill([]).perMalt).toEqual([]);
  });
});
