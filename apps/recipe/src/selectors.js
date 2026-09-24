// selectors.js
// The app's single source of derived values. Every number here comes from
// @brew/engine -- this module does NO brewing math. It only wires canonical
// recipe state into the engine and routes the three boil/ferment volumes
// through the reference-volume boundary at their measurement temperatures.
//
// The UI renders from computeRecipe() via useMemo; the smoke test calls the
// same function with the reference recipe, so the correctness gate exercises
// the exact selector the UI uses.

import {
  computePostBoilVol,
  computeGrist,
  computeHops,
  selectPitchRate,
  computeCellsNeeded,
  solveStarter,
  mashRatioWarnings,
  REFERENCE_TEMP_F,
  SALT_CONTRIBUTIONS_PER_G_GAL,
  ACIDS,
  findStyle,
  solveAdditions,
  predictFinalProfile,
  saltTotals,
  applyAcids,
  acidContribution,
  equivalentAcidDose,
  residualAlkalinity,
  sulfateChlorideRatio,
  ratioCharacter,
  targetMatch,
  residualAlkalinityMatch,
} from '@brew/engine';
import { toReferenceVolume } from './reference-volume.js';
import { TEST_RESULT_KEYS } from './water-state.js';

export function computeRecipe(state) {
  // Boil-off is applied to the measured (hot) pre-boil volume; the resulting
  // pre-/post-boil and ferment volumes are then taken to the 60 degF reference
  // the engine expects, each at its own measurement temperature.
  const temps = state.measurementTempF;
  const preBoilRefGal = toReferenceVolume(state.preBoilVolGal, 'preBoil', temps);
  const postBoilRawGal = computePostBoilVol(
    state.preBoilVolGal,
    state.boilOffRateGalPerHr,
    state.boilTimeMin,
  );
  const postBoilRefGal = toReferenceVolume(postBoilRawGal, 'postBoil', temps);
  const fermentRefGal = toReferenceVolume(state.fermentVolGal, 'ferment', temps);

  const grist = computeGrist({
    malts: state.malts,
    efficiency: state.efficiency,
    preBoilVolGal: preBoilRefGal,
    postBoilVolGal: postBoilRefGal,
    mashWaterGal: state.mashWaterGal, // NOT reference-corrected (engine design)
    apparentAttenuation: state.apparentAttenuation,
  });

  const hops = computeHops({
    kettleAdditions: state.kettleAdditions,
    preBoilSg: grist.preBoilSg,
    postBoilVolGal: postBoilRefGal,
    dryHops: state.dryHops,
    fermentVolGal: fermentRefGal,
  });

  const pitchRate = selectPitchRate(state.yeast.type, state.yeast.density);
  const cells = computeCellsNeeded({
    pitchRate,
    postBoilPlato: grist.postBoilPlato,
    fermentVolGal: fermentRefGal,
  });
  const starter = solveStarter(cells);

  // The post-boil volume as it reads at its measurement temperature (the
  // measured pre-boil volume less the boil-off, before correction), shown
  // beside the 60 degF figure only when the post-boil temperature is a number
  // other than the reference that the correction can use: not when the
  // corrected figure is blank while the measured one is not.
  const postBoilTempF = temps?.postBoil;
  const postBoilMeasuredShown =
    Number.isFinite(postBoilTempF) &&
    postBoilTempF !== REFERENCE_TEMP_F &&
    !(Number.isNaN(postBoilRefGal) && !Number.isNaN(postBoilRawGal));

  return {
    postBoilVolGal: postBoilRefGal,
    postBoilMeasuredGal: postBoilRawGal,
    postBoilMeasuredShown,
    // The three volumes as the engine received them (the Options page shows
    // each beside its measurement temperature).
    refVolumesGal: { preBoil: preBoilRefGal, postBoil: postBoilRefGal, ferment: fermentRefGal },
    grist,
    hops,
    pitchRate,
    cells,
    starter,
    // Design warnings (true = warn), shown on the Volumes card; they change no
    // number. The mash ratios against the engine's recommended ranges; the
    // post-boil volume against the fermentation volume, both at the 60 degF
    // reference. A blank (NaN) volume compares false: no warning.
    warnings: {
      ...mashRatioWarnings(grist),
      postBoilBelowFerment: postBoilRefGal < fermentRefGal,
    },
  };
}

// --- Water tab (docs/items/water-tab.md) ------------------------------------
// Every figure the Water tab shows, from the water entries (water-state.js),
// by Brew Water Chem's own steps: its App.jsx (the style, the recommendation,
// the dose as the acid picked), WaterInTab.jsx (the source water) and
// RecipeTab.jsx (the salt list, the acid totals, the predicted profile and how
// near each figure is to its target). The screens only display (W-S3).
//
// A blank test result (NaN) blanks the figures that need it, never counted as
// 0 as the water app did (W5): the source water's residual alkalinity needs
// calcium, magnesium and alkalinity; its ratio sulfate and chloride; the
// recommendation needs all six ions (each step of the solver reads several),
// and the salt amounts, the acid dose and the predicted profile follow it.
// pH is shown only. With no positive volume there is no recommendation either
// (the water app shows none).

const SALT_KEYS = Object.keys(SALT_CONTRIBUTIONS_PER_G_GAL);
const ACID_KEYS = Object.keys(ACIDS);
const SOLVER_IONS = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'Alkalinity'];
const entered = (v) => Number.isFinite(v);

export function computeWater(water) {
  const style = findStyle(water.styleId);
  const target = { ...style.profile };
  const s = water.source;
  const vol = water.volumeGal;
  const overrides = water.saltOverrides;
  const primary = water.primaryAcid;

  // Water In: the source water's status.
  const sourceRatio = entered(s.SO4) && entered(s.Cl) ? sulfateChlorideRatio(s.SO4, s.Cl) : NaN;
  const source = {
    hasValues: TEST_RESULT_KEYS.some((k) => entered(s[k]) && s[k] !== 0),
    residualAlkalinity: residualAlkalinity(s.Alkalinity, s.Ca, s.Mg),
    ratio: sourceRatio,
    character: Number.isNaN(sourceRatio) ? null : ratioCharacter(sourceRatio),
    alkalinity: s.Alkalinity,
    pH: s.pH,
  };

  const hasVolume = entered(vol) && vol > 0;
  const complete = SOLVER_IONS.every((k) => entered(s[k]));
  const recommendation =
    hasVolume && complete
      ? solveAdditions({
          source: s,
          target,
          volumeGallons: vol,
          raiseAlkSource: water.raiseAlkSource,
          enabledSalts: new Set(water.enabledSalts),
        })
      : null;

  // Salts: the recommendation per salt, the brewer's own amounts over it.
  const recommendedSalts = recommendation ? saltTotals(recommendation.additions) : {};
  const effectiveSalts = { ...recommendedSalts, ...overrides };
  const recommendedOf = (k) => (recommendation ? recommendedSalts[k] ?? 0 : NaN);
  const saltRow = (k) => ({
    key: k,
    name: SALT_CONTRIBUTIONS_PER_G_GAL[k].name,
    recommended: recommendedOf(k),
    amount: overrides[k] ?? recommendedOf(k),
    overridden: overrides[k] !== undefined,
  });
  // The recommended salts first, then the brewer's own, then the rest on
  // hand; the alkalinity-raising salt has its own card.
  const salts = [...Object.keys(effectiveSalts), ...SALT_KEYS]
    .filter((k, i, arr) => k !== water.raiseAlkSource && arr.indexOf(k) === i && water.enabledSalts.includes(k))
    .map((k) => ({
      ...saltRow(k),
      reason: recommendation
        ? recommendation.additions.find((a) => a.salt === k)?.reason ?? 'User-added salt'
        : null,
    }));
  const raiseSalt = saltRow(water.raiseAlkSource);

  // Acid: the solver's dose (88 % lactic) as the acid picked, same mEq.
  const recommendedMeq = recommendation ? applyAcids(recommendation.acids, vol).total_meq : NaN;
  const equivalent = recommendation ? equivalentAcidDose(recommendation.acids, primary) : NaN;
  const expected = { ...Object.fromEntries(ACID_KEYS.map((k) => [k, 0])), [primary]: equivalent };
  const amounts = water.acidAmounts ?? expected;
  const meqOf = (k, amount) => (Number.isNaN(amount) ? NaN : acidContribution(k, amount));
  const acid = {
    primary,
    multi: water.multiAcid,
    amounts,
    recommendedMeq,
    recommended: equivalent,
    totals: recommendation ? applyAcids(amounts, vol) : { total_meq: NaN, ppm_alk_reduced: NaN },
    rows: ACID_KEYS.map((k) => {
      const amount = amounts[k] ?? 0;
      const recommended = k === primary ? equivalent : 0;
      return {
        key: k,
        name: ACIDS[k].name,
        solid: !!ACIDS[k].is_solid,
        amount,
        meq: meqOf(k, amount),
        recommended,
        recommendedMeq: meqOf(k, recommended),
      };
    }),
  };

  // Reset to recommended shows once any salt or acid amount is the brewer's own.
  const customized =
    Object.keys(overrides).length > 0 ||
    ACID_KEYS.some((k) => Math.abs((amounts[k] ?? 0) - expected[k]) > 1e-6);

  let final = null;
  if (recommendation) {
    const ions = predictFinalProfile({ source: s, additions: effectiveSalts, acids: amounts, volumeGallons: vol });
    const ra = residualAlkalinity(ions.Alk, ions.Ca, ions.Mg);
    const ratio = sulfateChlorideRatio(ions.SO4, ions.Cl);
    final = {
      ions,
      residualAlkalinity: ra,
      ratio,
      match: {
        Ca: targetMatch(ions.Ca, target.Ca),
        Mg: targetMatch(ions.Mg, target.Mg),
        Na: targetMatch(ions.Na, target.Na),
        SO4: targetMatch(ions.SO4, target.SO4),
        Cl: targetMatch(ions.Cl, target.Cl),
        Alk: targetMatch(ions.Alk, target.Alk),
        residualAlkalinity: residualAlkalinityMatch(ra, target.RA),
        ratio: targetMatch(ratio, style.so4_cl_target),
      },
    };
  }

  return {
    style,
    target,
    missing: TEST_RESULT_KEYS.filter((k) => !entered(s[k])),
    source,
    hasVolume,
    complete,
    recommendation,
    salts,
    raiseSalt,
    acid,
    customized,
    final,
  };
}
