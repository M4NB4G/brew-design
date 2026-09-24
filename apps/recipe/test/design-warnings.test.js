// design-warnings.test.js
// Scenarios 4–7 of the Design warnings item (scope table agreed 2026-09-23,
// docs/items/design-warnings.md), named from its sentences V1–V4 and
// decisions W4 and W9. The warnings reach the Volumes card through
// computeRecipe's result; their look (W7), Pro mode (W5) and the printed
// sheet (W6) are proved at the far end on the built app. Every expected
// figure is worked by hand beside it.

import { describe, it, expect } from 'vitest';
import {
  computePostBoilVol,
  computeGrist,
  computeHops,
  selectPitchRate,
  computeCellsNeeded,
  solveStarter,
  correctVolumeToRef,
} from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';

const NONE = { mashRv: false, mashR: false, postBoilBelowFerment: false };

// The engine called directly for a recipe measured at 60 F: what every number
// of computeRecipe's result must be, whatever the warnings say. Each volume
// goes through the engine's own correction at 60 F, as the app routes it.
function engineNumbers(s) {
  const preBoilVolGal = correctVolumeToRef(s.preBoilVolGal, 60);
  const postBoilMeasuredGal = computePostBoilVol(s.preBoilVolGal, s.boilOffRateGalPerHr, s.boilTimeMin);
  const postBoilVolGal = correctVolumeToRef(postBoilMeasuredGal, 60);
  const fermentVolGal = correctVolumeToRef(s.fermentVolGal, 60);
  const grist = computeGrist({
    malts: s.malts,
    efficiency: s.efficiency,
    preBoilVolGal,
    postBoilVolGal,
    mashWaterGal: s.mashWaterGal,
    apparentAttenuation: s.apparentAttenuation,
  });
  const hops = computeHops({
    kettleAdditions: s.kettleAdditions,
    preBoilSg: grist.preBoilSg,
    postBoilVolGal,
    dryHops: s.dryHops,
    fermentVolGal,
  });
  const pitchRate = selectPitchRate(s.yeast.type, s.yeast.density);
  const cells = computeCellsNeeded({ pitchRate, postBoilPlato: grist.postBoilPlato, fermentVolGal });
  return {
    postBoilVolGal,
    // Measured at 60 F: the as-measured post-boil volume is not shown beside
    // the 60 F figure (post-boil volume as measured, 2026-09-23).
    postBoilMeasuredGal,
    postBoilMeasuredShown: false,
    refVolumesGal: { preBoil: preBoilVolGal, postBoil: postBoilVolGal, ferment: fermentVolGal },
    grist,
    hops,
    pitchRate,
    cells,
    starter: solveStarter(cells),
  };
}

describe('design warnings', () => {
  // V1–V3, W4
  it('the default recipe shows no warning: Rv 20/11 ≈ 1.818, R ≈ 3.736, post-boil 5.5 equals fermentation 5.5', () => {
    const d = computeRecipe(defaultRecipeState());
    // 5 gal x 4 / 11 lb = 20 / 11 = 1.8182 qt/lb; x 2.055 = 3.7364 lb/lb.
    expect(d.grist.mashRv).toBeCloseTo(1.8182, 4);
    expect(d.grist.mashR).toBeCloseTo(3.7364, 4);
    // Post-boil 7 - 1.5 gal/hr x 1 hr = 5.5 gal; fermentation 5.5 gal.
    expect(d.refVolumesGal.postBoil).toBeCloseTo(5.5, 9);
    expect(d.refVolumesGal.ferment).toBeCloseTo(5.5, 9);
    expect(d.warnings).toEqual(NONE);
  });

  // V3, W4
  it('a fermentation volume above the post-boil volume warns; equal or below does not', () => {
    const at = (fermentVolGal) => computeRecipe({ ...defaultRecipeState(), fermentVolGal }).warnings;
    // Post-boil 5.5 gal (above). 5.6 > 5.5 warns; 5.5 = 5.5 and 5.0 < 5.5 do not.
    expect(at(5.6)).toEqual({ ...NONE, postBoilBelowFerment: true });
    expect(at(5.5)).toEqual(NONE);
    expect(at(5.0)).toEqual(NONE);
  });

  // W4
  it('the volume check compares both volumes at the 60 °F reference', () => {
    // 5.52 gal measured at 100 °F is above the 5.5 gal post-boil volume as a
    // figure, but at 60 °F it is 5.52 x 993.024 / 999.001 (water density,
    // kg/m3, at 100 °F and 60 °F) = 5.52 x 0.994017 = 5.4870 gal: below 5.5.
    const warm = {
      ...defaultRecipeState(),
      fermentVolGal: 5.52,
      measurementTempF: { preBoil: 60, postBoil: 60, ferment: 100 },
    };
    const d = computeRecipe(warm);
    expect(d.refVolumesGal.ferment).toBeCloseTo(5.487, 3);
    expect(d.refVolumesGal.ferment).toBeCloseTo(correctVolumeToRef(5.52, 100), 12);
    expect(d.warnings.postBoilBelowFerment).toBe(false);
    // The same 5.52 gal measured at 60 °F is above 5.5 at the reference, and warns.
    expect(computeRecipe({ ...warm, measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 } }).warnings.postBoilBelowFerment).toBe(true);
  });

  // V4, W9
  it('a warning changes no number, and a blank value gives none', () => {
    // All three warn: 3 gal x 4 / 11 lb = 1.0909 qt/lb (< 1.25), x 2.055 =
    // 2.2418 lb/lb (< 2.5); fermentation 6 gal > post-boil 5.5 gal.
    const warned = { ...defaultRecipeState(), mashWaterGal: 3, fermentVolGal: 6 };
    const { warnings, ...numbers } = computeRecipe(warned);
    expect(warnings).toEqual({ mashRv: true, mashR: true, postBoilBelowFerment: true });
    expect(numbers.grist.mashRv).toBeCloseTo(1.0909, 4);
    expect(numbers.grist.mashR).toBeCloseTo(2.2418, 4);
    // Every number is the engine's, as if there were no warnings at all.
    expect(numbers).toEqual(engineNumbers(warned));
    const quiet = defaultRecipeState();
    const { warnings: none, ...quietNumbers } = computeRecipe(quiet);
    expect(none).toEqual(NONE);
    expect(quietNumbers).toEqual(engineNumbers(quiet));

    // A cleared mash water, fermentation volume or measurement temperature
    // blanks its stat and gives no warning; nothing throws.
    for (const patch of [
      { mashWaterGal: NaN },
      { fermentVolGal: NaN, mashWaterGal: 3 },
      { measurementTempF: { preBoil: 60, postBoil: NaN, ferment: 60 }, fermentVolGal: 6 },
    ]) {
      let d;
      expect(() => {
        d = computeRecipe({ ...defaultRecipeState(), ...patch });
      }).not.toThrow();
      const blank = Object.keys(patch).join(', ');
      if ('mashWaterGal' in patch && Number.isNaN(patch.mashWaterGal)) {
        expect(d.grist.mashRv, blank).toBeNaN();
        expect(d.warnings, blank).toEqual(NONE);
      } else {
        expect(d.warnings.postBoilBelowFerment, blank).toBe(false);
      }
    }
  });
});
