// post-boil-measured.test.js
// Scenarios for "Post-boil volume as measured" (scope table agreed
// 2026-09-23, docs/items/post-boil-as-measured.md), named from its sentences
// P-S1 to P-S4 and decision P1. The suite has no DOM: the recipe's figures
// (computeRecipe, which the Volumes card renders from) and the printed
// sheet's text are checked here; the card itself at the far end.

import { describe, it, expect } from 'vitest';
import {
  REFERENCE_TEMP_F,
  correctVolumeToRef,
  computeGrist,
  computeHops,
  selectPitchRate,
  computeCellsNeeded,
  solveStarter,
} from '@brew/engine';
import { computeRecipe } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';

// The smoke test's reference recipe (test/smoke.test.js), in canonical units:
// pre-boil 16 gal, boil-off 1.5 gal/hr for 60 min.
const referenceState = (measurementTempF = { preBoil: 60, postBoil: 60, ferment: 60 }) => ({
  name: '',
  style: '',
  notes: '',
  malts: [
    { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
    { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
  ],
  efficiency: 0.93,
  apparentAttenuation: 0.8,
  preBoilVolGal: 16,
  boilOffRateGalPerHr: 1.5,
  boilTimeMin: 60,
  mashWaterGal: 13,
  kettleAdditions: [
    { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 },
    { name: 'Helios', timeMin: 30, wortTempF: 204, weightOz: 1, alphaAcidFraction: 0.19 },
    { name: 'Citra LupoMAX', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.18 },
    { name: 'Hopstiener 9326', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.06 },
    { name: 'Helios', timeMin: 20, wortTempF: 175, weightOz: 1, alphaAcidFraction: 0.19 },
  ],
  dryHops: [
    { name: 'DH1', weightOz: 2 },
    { name: 'DH2', weightOz: 2 },
    { name: 'DH3', weightOz: 2 },
    { name: 'DH4', weightOz: 2 },
    { name: 'DH5', weightOz: 1 },
    { name: 'DH6', weightOz: 1 },
    { name: 'DH7', weightOz: 2 },
    { name: 'DH8', weightOz: 2 },
    { name: 'DH9', weightOz: 1 },
  ],
  fermentVolGal: 12,
  yeast: { type: 'ale', density: 'mod', name: '', fermTempF: NaN },
  measurementTempF,
});

// Hand pin: 16 gal less 1.5 gal/hr x 60 min / 60 min per hr = 16 - 1.5 = 14.5 gal.
const POST_BOIL_AS_MEASURED_GAL = 14.5;

const temps = (postBoil) => ({ preBoil: 60, postBoil, ferment: 60 });
const sheetFor = (state, mode = 'home') =>
  recipeSheet({ recipe: state, derived: computeRecipe(state), mode, proGravityUnit: 'plato', today: new Date(2026, 8, 23) });
const postBoilRow = (sheet) => sheet.volumes.rows.find((r) => r.key === 'postBoil');

describe('post-boil volume as measured', () => {
  it("the recipe's figures include the post-boil volume at its measurement temperature: the pre-boil volume as measured less the boil-off", () => {
    for (const t of [60, 180, 212, 100, NaN, 250]) {
      const d = computeRecipe(referenceState(temps(t)));
      // Whatever the post-boil temperature, the as-measured figure is 14.5 gal.
      expect(d.postBoilMeasuredGal, `at ${t}`).toBeCloseTo(POST_BOIL_AS_MEASURED_GAL, 12);
    }
    // The 60 °F figure is the engine's correction of 14.5 gal at that temperature.
    const hot = computeRecipe(referenceState(temps(180)));
    expect(hot.postBoilVolGal).toBe(correctVolumeToRef(POST_BOIL_AS_MEASURED_GAL, 180));
    // The pre-boil volume is taken as measured, whatever its own temperature.
    const hotPre = computeRecipe(referenceState({ preBoil: 150, postBoil: 180, ferment: 60 }));
    expect(hotPre.postBoilMeasuredGal).toBeCloseTo(POST_BOIL_AS_MEASURED_GAL, 12);
  });

  it('at a post-boil temperature other than 60 °F the printed post-boil row reads the measured figure at that temperature and the 60 °F figure', () => {
    const state = referenceState(temps(180));
    const at60 = correctVolumeToRef(POST_BOIL_AS_MEASURED_GAL, 180);
    expect(at60).toBeLessThan(POST_BOIL_AS_MEASURED_GAL); // hot wort shrinks as it cools

    // Home: "Post-boil volume, measured at 180 °F: 14.50 gal (x at 60 °F)", with the measured box.
    const home = postBoilRow(sheetFor(state));
    expect(home.label).toBe('Post-boil volume');
    expect(home.tempNote).toBe('measured at 180 °F');
    expect(home.value).toBe(`14.50 (${at60.toFixed(2)} at ${REFERENCE_TEMP_F} °F)`);
    expect(home.measuredBox).toBe(true);

    // Pro, in bbl: 14.5 gal / 31 gal per bbl = 0.4677... -> 0.468.
    const pro = postBoilRow(sheetFor(state, 'pro'));
    expect(pro.value).toBe(`0.468 (${(at60 / 31).toFixed(3)} at ${REFERENCE_TEMP_F} °F)`);

    // The Volumes card shows the pair (it renders from these figures).
    expect(computeRecipe(state).postBoilMeasuredShown).toBe(true);
  });

  it('at 60 °F the printed row is today\'s, one figure', () => {
    const state = referenceState(temps(60));
    const d = computeRecipe(state);
    // Measured at the reference, the two figures are the same one.
    expect(d.postBoilMeasuredGal).toBe(d.postBoilVolGal);
    expect(d.postBoilMeasuredShown).toBe(false);
    const row = postBoilRow(sheetFor(state));
    expect(row.label).toBe('Post-boil volume at 60 °F');
    expect(row.tempNote).toBeNull();
    expect(row.value).toBe('14.50');

    // A blank post-boil temperature, or one outside the correction's range:
    // today's single row, its 60 °F figure blank.
    for (const t of [NaN, 250]) {
      const blank = referenceState(temps(t));
      expect(computeRecipe(blank).postBoilMeasuredShown, `at ${t}`).toBe(false);
      const r = postBoilRow(sheetFor(blank));
      expect(r.label, `at ${t}`).toBe('Post-boil volume at 60 °F');
      expect(r.value, `at ${t}`).toBe('—');
    }
  });

  it('every other derived number is unchanged (the guard)', () => {
    // At 150/180/68 °F, every figure computeRecipe gave before equals the
    // engine called directly with the volumes corrected at their temperatures.
    const state = referenceState({ preBoil: 150, postBoil: 180, ferment: 68 });
    const d = computeRecipe(state);
    const preBoilVolGal = correctVolumeToRef(16, 150);
    const postBoilVolGal = correctVolumeToRef(POST_BOIL_AS_MEASURED_GAL, 180);
    const fermentVolGal = correctVolumeToRef(12, 68);
    const grist = computeGrist({
      malts: state.malts,
      efficiency: state.efficiency,
      preBoilVolGal,
      postBoilVolGal,
      mashWaterGal: state.mashWaterGal,
      apparentAttenuation: state.apparentAttenuation,
    });
    const hops = computeHops({ kettleAdditions: state.kettleAdditions, preBoilSg: grist.preBoilSg, postBoilVolGal, dryHops: state.dryHops, fermentVolGal });
    const pitchRate = selectPitchRate('ale', 'mod');
    const cells = computeCellsNeeded({ pitchRate, postBoilPlato: grist.postBoilPlato, fermentVolGal });
    expect(d.postBoilVolGal).toBe(postBoilVolGal);
    expect(d.refVolumesGal).toEqual({ preBoil: preBoilVolGal, postBoil: postBoilVolGal, ferment: fermentVolGal });
    expect(d.grist).toEqual(grist);
    expect(d.hops).toEqual(hops);
    expect(d.pitchRate).toBe(pitchRate);
    expect(d.cells).toBe(cells);
    expect(d.starter).toEqual(solveStarter(cells));
    expect(d.warnings.postBoilBelowFerment).toBe(postBoilVolGal < fermentVolGal);
  });
});
