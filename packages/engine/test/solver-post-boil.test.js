// solver-post-boil.test.js
// Scenarios for "Solve with volumes measured hot" (scope table agreed
// 2026-10-08, docs/items/solve-volumes-measured-hot.md), the engine's part:
// solveGrist takes the post-boil volume at 60 °F its caller gives (SH-S1),
// and without one it boils the pre-boil volume off as before (SH-S3).
//
// The hand working (CLAUDE.md, Models: the hand-pin rule). The gravity
// conversions are the engine's mandated polynomials (units.js, pinned in
// units.test.js), worked here by hand in decimal arithmetic:
//   sgToPlato(1.050) = -616.868 + 1111.14 x 1.05 - 630.272 x 1.1025
//                      + 135.997 x 1.157625
//                    = -616.868 + 1166.6970 - 694.874880 + 157.433527125
//                    = 12.387647125 °P
// One malt, FGDB 0.8 (46 x 0.8 = 36.8 points per lb per gal), efficiency
// 0.75, pre-boil 16 gal at 60 °F.
// - Given a post-boil volume of 13 gal: pre-boil °P = 12.387647125 x 13 / 16
//   = 10.0649632890625; platoToSg = 1 + 10.0649632890625 / (258.6 -
//   (10.0649632890625 / 258.2) x 227.1) = 1.0403005802565; points = 40.3005802565;
//   weight = 40.3005802565 x 16 / (0.75 x 36.8) = 23.3626552211 lb.
// - With none, the post-boil volume is 16 - 1.5 x 60/60 = 14.5 gal: pre-boil
//   °P = 12.387647125 x 14.5 / 16 = 11.22630520703125; weight = 26.1653617478 lb.

import { describe, it, expect } from 'vitest';
import { solveGrist } from '../src/index.js';

const INPUT = {
  malts: [{ fgdb: 0.8, percent: 1 }],
  targetOG: 1.05,
  efficiency: 0.75,
  preBoilVolGal: 16,
  boilOffRateGalPerHr: 1.5,
  boilTimeMin: 60,
};

describe('solveGrist with the post-boil volume given', () => {
  it('the solver takes the post-boil volume at 60 °F it is given', () => {
    const out = solveGrist({ ...INPUT, postBoilVolGal: 13 });
    expect(out.totalWeightLb).toBeCloseTo(23.3626552211, 8);
    expect(out.weights[0].weightLb).toBeCloseTo(23.3626552211, 8);
    // Two malts share the same total by their percents: 0.9 and 0.1.
    const two = solveGrist({
      ...INPUT,
      malts: [{ fgdb: 0.8, percent: 0.9 }, { fgdb: 0.8, percent: 0.1 }],
      postBoilVolGal: 13,
    });
    expect(two.weights[0].weightLb).toBeCloseTo(0.9 * 23.3626552211, 8);
    expect(two.weights[1].weightLb).toBeCloseTo(0.1 * 23.3626552211, 8);
    // A blank post-boil volume blanks the weights, as any blank figure does.
    expect(solveGrist({ ...INPUT, postBoilVolGal: NaN }).totalWeightLb).toBeNaN();
  });

  it('without one it works as today', () => {
    // The pre-boil volume boiled off: 14.5 gal (above).
    expect(solveGrist(INPUT).totalWeightLb).toBeCloseTo(26.1653617478, 8);
    // Given the same 14.5 gal, the same weight.
    expect(solveGrist({ ...INPUT, postBoilVolGal: 14.5 }).totalWeightLb).toBe(solveGrist(INPUT).totalWeightLb);
    // The golden solve (solver.test.js) unchanged: 29.0128327 lb.
    const golden = solveGrist({
      malts: [
        { fgdb: 0.8, percent: 0.9310345 },
        { fgdb: 0.8, percent: 0.0689655 },
      ],
      targetOG: 1.0688522,
      efficiency: 0.93,
      preBoilVolGal: 16,
      boilOffRateGalPerHr: 1.5,
      boilTimeMin: 60,
      targetMashRvQtPerLb: 1.7931034,
    });
    expect(golden.totalWeightLb).toBeCloseTo(29.0128327, 5);
  });
});
