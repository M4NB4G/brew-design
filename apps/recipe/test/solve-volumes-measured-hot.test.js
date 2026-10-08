// solve-volumes-measured-hot.test.js
// Scenarios for "Solve with volumes measured hot" (scope table agreed
// 2026-10-08, docs/items/solve-volumes-measured-hot.md, SH-S1 to SH-S5,
// SH-Q1), the app's part: "Design to target OG" works the boil as the recipe
// does, so the weights it writes give the target OG through the recipe's own
// calculation whatever the measurement temperatures.
//
// The hand working (CLAUDE.md, Models: the hand-pin rule). The built-in
// recipe: 7 gal before the boil, 1.5 gal/hr for 60 min, so 5.5 gal measured
// after it. The target 1.050: sgToPlato(1.050) = P = 12.387647125 °P (worked
// in packages/engine/test/solver-post-boil.test.js). Solve gives the pre-boil
// gravity platoToSg(x), x = P x post / pre (both at 60 °F); the recipe then
// reads sgToPlato(platoToSg(x)) = x + r, r the two conversions' mismatch
// (solver.js's FLAG), and OG = platoToSg((x + r) x pre / post) =
// platoToSg(P + r x pre / post). Worked in decimal arithmetic:
// - Pre- and post-boil measured at the same temperature, any: the two share
//   one density factor, so pre / post = 7 / 5.5; x = 9.7331513125,
//   r = 0.00094135528, OG = 1.0500148408. (Before: 1.0494 at 212 °F.)
// - Pre-boil at 212 °F (100 °C, 958.35 kg/m³), post-boil at 60 °F (15.556 °C,
//   999.10 + (0.5556 / 5)(998.21 - 999.10) = 999.0011111 kg/m³): pre =
//   7 x 958.35 / 999.0011111 = 6.7151577 gal, post 5.5; x = 10.1460103,
//   r = 0.00117514, OG = 1.0500158383.
// - Pre-boil at 60 °F, post-boil at 212 °F: pre 7, post = 5.5 x 958.35 /
//   999.0011111 = 5.2761953 gal; x = 9.3370923, r = 0.00071335,
//   OG = 1.0500137800.

import { describe, it, expect } from 'vitest';
import { solveGrist, correctVolumeToRef } from '@brew/engine';
import { defaultRecipeState, withMaltWeights } from '../src/state.js';
import { computeRecipe, solveTargetOG } from '../src/selectors.js';
import { SCHEMA_VERSION } from '../src/persistence.js';

const solveTargetOGText = async (result) => (await import('../src/components/TargetOgSolver.jsx')).solveRefusalText(result);

const at = (preBoil, postBoil, ferment = 60) => ({
  ...defaultRecipeState(),
  measurementTempF: { preBoil, postBoil, ferment },
});
// The % boxes as filled from the recipe's shares: 10/11 and 1/11.
const SHARES = [10 / 11, 1 / 11];
const solvedOG = (r, target = 1.05) => {
  const out = solveTargetOG(r, target, SHARES);
  expect(out.ok).toBe(true);
  return computeRecipe(withMaltWeights(r, out.weightsLb)).grist.OG;
};

// The smoke test's reference recipe (16 gal pre-boil, exact at 60 °F).
const reference = () => ({
  ...defaultRecipeState(),
  malts: [
    { ...defaultRecipeState().malts[0], name: 'Golden Promise', weightLb: 27, colorL: 2.2 },
    { ...defaultRecipeState().malts[1], name: 'Carafoam', weightLb: 2, colorL: 2 },
  ],
  efficiency: 0.93,
  preBoilVolGal: 16,
  mashWaterGal: 13,
});

describe('solve with volumes measured hot', () => {
  it('Solve hits the target with the volumes measured hot', () => {
    // SH-S1, SH-S2: both at 212 °F, both at 150 °F: 1.0500148 (by hand).
    expect(solvedOG(at(212, 212))).toBeCloseTo(1.0500148408, 9);
    expect(solvedOG(at(150, 150))).toBeCloseTo(1.0500148408, 9);
    // Each at its own temperature (by hand).
    expect(solvedOG(at(212, 60))).toBeCloseTo(1.0500158383, 9);
    expect(solvedOG(at(60, 212))).toBeCloseTo(1.0500137800, 9);
  });

  it('at the reference nothing changes', () => {
    // SH-S3: at 60 °F every solved weight is the one the engine gave before,
    // the pre-boil volume at 60 °F boiled off (the reference recipe, whose
    // 16 gal and 14.5 gal are exact at 60 °F).
    const r = reference();
    const before = solveGrist({
      malts: [{ fgdb: 0.8, percent: 0.931 }, { fgdb: 0.8, percent: 0.069 }],
      targetOG: 1.0688522,
      efficiency: 0.93,
      preBoilVolGal: correctVolumeToRef(16, 60),
      boilOffRateGalPerHr: 1.5,
      boilTimeMin: 60,
    }).weights.map((w) => w.weightLb);
    expect(solveTargetOG(r, 1.0688522, [0.931, 0.069]).weightsLb).toEqual(before);
    // The built-in recipe at 60 °F lands as before too: 1.0500148 (by hand).
    expect(solvedOG(at(60, 60))).toBeCloseTo(1.0500148408, 9);
  });

  it('an unusable post-boil temperature refuses Solve and names it', async () => {
    // SH-S4: blank, above 100 °C (250 °F) or below 0 °C (20 °F).
    for (const t of [NaN, 250, 20]) {
      const out = solveTargetOG(at(60, t), 1.05, SHARES);
      expect(out.ok, String(t)).toBe(false);
      expect(out.weightsLb).toBeUndefined();
      expect(await solveTargetOGText(out)).toBe(
        'The post-boil volume cannot be corrected at its measurement temperature. Nothing changed.',
      );
    }
    // With the pre-boil one too, both are named, in the card's order.
    expect(await solveTargetOGText(solveTargetOG(at(NaN, NaN), 1.05, SHARES))).toBe(
      'The pre-boil volume cannot be corrected at its measurement temperature. ' +
        'The post-boil volume cannot be corrected at its measurement temperature. Nothing changed.',
    );
    // A blank pre-boil volume is named as before, and the post-boil
    // temperature is not blamed for it.
    expect(await solveTargetOGText(solveTargetOG({ ...at(60, NaN), preBoilVolGal: NaN }, 1.05, SHARES))).toBe(
      'Blank: the pre-boil volume. Nothing changed.',
    );
  });

  it('nothing else changes', () => {
    // SH-S5, K: the mash water is not touched; Solve twice for the same
    // target writes the same weights; the fermentation temperature is not
    // read; the saved format is as before.
    const r = at(212, 212);
    const out = solveTargetOG(r, 1.05, SHARES);
    const solved = withMaltWeights(r, out.weightsLb);
    expect(solved.mashWaterGal).toBe(r.mashWaterGal);
    expect(solveTargetOG(solved, 1.05, SHARES).weightsLb).toEqual(out.weightsLb);
    expect(solveTargetOG(at(212, 212, NaN), 1.05, SHARES).weightsLb).toEqual(out.weightsLb);
    expect(SCHEMA_VERSION).toBe(12);
  });
});
