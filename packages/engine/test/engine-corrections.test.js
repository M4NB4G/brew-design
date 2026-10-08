// engine-corrections.test.js
// Batch S10a (docs/items/engine-corrections.md): the engine follows the
// owner's Recipe Designer Rev 4 (2026-10-08). Each value is worked by hand,
// the working beside it.

import { describe, it, expect } from 'vitest';
import { computeGrist, solveGrist } from '../src/index.js';

// The engine's reference recipe (the golden master's), at 60 °F.
const reference = {
  malts: [
    { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
    { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
  ],
  efficiency: 0.93,
  preBoilVolGal: 16,
  postBoilVolGal: 14.5,
  mashWaterGal: 13,
  apparentAttenuation: 0.8,
};

describe('EC1: boil concentration without the 1.01', () => {
  it('the original gravity is the pre-boil °P concentrated by the volume ratio alone', () => {
    const g = computeGrist(reference);
    // Pre-boil °P 15.2145679 (Rev 4, Grist and Pitch Calc's!G2, unchanged
    // from Rev 3). Concentrated by pre-boil / post-boil = 16 / 14.5:
    //   15.2145679 x 16 = 243.4330864;  243.4330864 / 14.5 = 16.7884887 °P.
    // With the 1.01 it was 16.7884887 / 1.01 = 16.6222661 °P.
    expect(g.preBoilPlato).toBeCloseTo(15.2145679, 4);
    expect(g.postBoilPlato).toBeCloseTo(16.7884887, 4);

    // No other factor, on any volumes: a 10 gal pre-boil boiled to 8 gal
    // concentrates by exactly 10 / 8 = 1.25.
    const other = computeGrist({ ...reference, preBoilVolGal: 10, postBoilVolGal: 8 });
    expect(other.postBoilPlato / other.preBoilPlato).toBeCloseTo(1.25, 12);
  });

  it('a grain bill solved to a target OG gives that target back', () => {
    // Target: the reference recipe's own OG under Rev 4, 1.0688522
    // (Grist and Pitch Calc's!I3), with its percents 27/29 and 2/29.
    // By hand, the inverse of the forward step: post-boil °P 16.7884887
    // (I2) x 14.5 / 16 = 15.2145679 °P pre-boil = SG 1.062031 (E2), 62.031
    // points; grain = 62.031 x 16 gal / (0.93 x 46 x 0.8 ppg) =
    // 992.496 / 34.224 = 29.000 lb, i.e. 27 and 2 lb back.
    // With the 1.01 left in the inverse alone it would be 1.01 times the
    // points' worth of °P, about 29.3 lb.
    const target = 1.0688522161842589;
    const solved = solveGrist({
      malts: [
        { fgdb: 0.8, percent: 27 / 29 },
        { fgdb: 0.8, percent: 2 / 29 },
      ],
      targetOG: target,
      efficiency: 0.93,
      preBoilVolGal: 16,
      boilOffRateGalPerHr: 1.5,
      boilTimeMin: 60,
      targetMashRvQtPerLb: 1.7931034,
    });
    // The residual the two Plato conversions leave (sgToPlato and platoToSg
    // are not exact inverses, src/solver.js FLAG): SG to °P and back gains
    // about +0.0034 °P at 16.8 °P and +0.0033 °P at 15.2 °P. The solver passes
    // through both: 0.0034 x 14.5 / 16 + 0.0033 = 0.0064 °P on 15.2146 °P,
    // 0.042 % of the grain, 0.012 lb of 29; 2e-2 lb holds it.
    expect(Math.abs(solved.totalWeightLb - 29)).toBeLessThan(2e-2);
    expect(Math.abs(solved.weights[0].weightLb - 27)).toBeLessThan(2e-2);
    expect(Math.abs(solved.weights[1].weightLb - 2)).toBeLessThan(2e-2);

    // The solved bill, run forward, gives the target back. Solver and forward
    // step together pass through at most four such conversions, 4 x 0.0034 =
    // 0.0136 °P, at 0.00435 SG per °P at 16.8 °P (the slope of the ASBC
    // polynomial, 258.6 / (258.6 - 227.1 x 16.8 / 258.2)^2 = 258.6 / 243.8^2):
    // 5.9e-5, so 6e-5 holds it.
    const back = computeGrist({
      ...reference,
      malts: solved.weights.map((m, i) => ({ ...reference.malts[i], weightLb: m.weightLb })),
    });
    expect(Math.abs(back.OG - target)).toBeLessThan(6e-5);
  });
});

describe("EC2: Morey's coefficients", () => {
  it("colour is Morey's 1.4922 and 0.6859", () => {
    // Reference recipe: MCU = (2.2 x 27 + 2.0 x 2) / 14.5 = 63.4 / 14.5 =
    // 4.3724138. ln 4.3724138 = 1.4753152; x 0.6859 = 1.0119187;
    // e^1.0119187 = 2.7508741; x 1.4922 = 4.1048543 SRM (Rev 4, Grist and
    // Pitch Calc's!I4). With 1.49 and 0.69 it was 4.1236703.
    const g = computeGrist(reference);
    expect(g.SRM).toBeCloseTo(4.1048543, 4);

    // A dark beer, MCU 50: 10 lb at 50 °L in 10 gal post-boil.
    // ln 50 = 3.9120230; x 0.6859 = 2.6832566; e^2.6832566 = 14.6326682;
    // x 1.4922 = 21.8348675 SRM. With 1.49 and 0.69 it was 22.1551947.
    const dark = computeGrist({
      ...reference,
      malts: [{ name: 'Dark', weightLb: 10, fgdb: 0.8, colorL: 50 }],
      postBoilVolGal: 10,
    });
    expect(dark.SRM).toBeCloseTo(21.8348675, 4);
  });
});
