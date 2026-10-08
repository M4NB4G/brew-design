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
  acidForMashPh,
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
  waterVolumes,
  tankDraws,
  shareOfSalts,
  kettleSalts,
  kettleShares,
  sumSalts,
  MALT_TYPES,
  mashPh,
  mashPhOutsideRange,
  mashPhTestedRange,
  scaleRecipe,
  solveGrist,
  rollupCost,
  costPerUnit,
} from '@brew/engine';
import { toReferenceVolume } from './reference-volume.js';
import { fractionToPercent } from './display.js';
import { num } from './format.js';
import { TEST_RESULT_KEYS, effectiveSetup } from './water-state.js';

// Scale the recipe when switching Home and Pro (docs/items/pro-recipe-default.md):
// the recipe with every amount multiplied by the batch over its fermentation
// volume, by the engine (PD-S4).
export function scaleRecipeTo(recipe, batchGal) {
  return scaleRecipe(recipe, batchGal);
}

// The % boxes' total, in percent: the shares' sum (blank while one is).
export function percentTotal(shares) {
  return fractionToPercent(shares.reduce((s, p) => s + p, 0));
}

// Design to a target OG (docs/items/inverse-solver-ui.md): every malt's
// weight from a target OG (SG), one share per malt (a fraction, as typed in
// its % box) and the recipe's brewhouse efficiency, pre-boil volume at 60 degF,
// boil-off rate and boil time, by the engine's solveGrist (IS-S3). The mash
// water is not touched: the solver's own mash water for a target Rv is unused.
// Refused, with no weights, when the shares do not total 100 % as shown to
// one decimal (IS-Q7), or when a figure it needs is blank (IS-S4), each named
// in the card's order. -> { ok: true, weightsLb } | { ok: false, totalPercent, blank }
// The boil is worked as computeRecipe works it (docs/items/solve-volumes-
// measured-hot.md, SH-S1): the measured pre-boil volume boiled off, the
// post-boil volume then corrected at its own measurement temperature and the
// pre-boil volume at its own; a temperature the correction cannot use
// refuses Solve and is named (SH-S4).
export function solveTargetOG(recipe, targetOG, shares) {
  const preBoilRefGal = toReferenceVolume(recipe.preBoilVolGal, 'preBoil', recipe.measurementTempF);
  const postBoilRawGal = computePostBoilVol(recipe.preBoilVolGal, recipe.boilOffRateGalPerHr, recipe.boilTimeMin);
  const postBoilRefGal = toReferenceVolume(postBoilRawGal, 'postBoil', recipe.measurementTempF);
  const maltName = (m, i) => String(m.name ?? '').trim() || `Malt ${i + 1}`;
  const blank = [];
  if (!entered(targetOG)) blank.push({ field: 'targetOG' });
  shares.forEach((p, i) => {
    if (!entered(p)) blank.push({ field: 'percent', malt: maltName(recipe.malts[i], i) });
  });
  recipe.malts.forEach((m, i) => {
    if (!entered(m.fgdb)) blank.push({ field: 'fgdb', malt: maltName(m, i) });
  });
  if (!entered(recipe.efficiency)) blank.push({ field: 'efficiency' });
  if (!entered(recipe.preBoilVolGal)) blank.push({ field: 'preBoilVolGal' });
  else if (!entered(preBoilRefGal)) blank.push({ field: 'preBoilTemp' });
  if (!entered(recipe.boilOffRateGalPerHr)) blank.push({ field: 'boilOffRateGalPerHr' });
  if (!entered(recipe.boilTimeMin)) blank.push({ field: 'boilTimeMin' });
  if (entered(postBoilRawGal) && !entered(postBoilRefGal)) blank.push({ field: 'postBoilTemp' });

  // The boxes total 100 when their total, shown to one decimal, reads 100.0
  // (IS-Q7); blank while a box is.
  const totalPercent = percentTotal(shares);
  const totalOff = num(totalPercent, 1) !== num(100, 1);
  if (blank.length > 0 || totalOff) return { ok: false, totalPercent, totalOff, blank };

  const { weights } = solveGrist({
    malts: recipe.malts.map((m, i) => ({ fgdb: m.fgdb, percent: shares[i] })),
    targetOG,
    efficiency: recipe.efficiency,
    preBoilVolGal: preBoilRefGal,
    boilOffRateGalPerHr: recipe.boilOffRateGalPerHr,
    boilTimeMin: recipe.boilTimeMin,
    postBoilVolGal: postBoilRefGal,
  });
  const weightsLb = weights.map((w) => w.weightLb);
  // FLAG: figures that are entered but give no usable bill (a zero efficiency
  // or FGDB, a boil that leaves no wort, a negative %) give weights that are
  // not numbers or are below zero; the sentences do not say, so Solve changes
  // nothing then, as for a blank (IS-S4's rule: nothing the brewer did not enter).
  if (!weightsLb.every((w) => entered(w) && w >= 0)) return { ok: false, totalPercent, totalOff, blank, unusable: true };
  return { ok: true, weightsLb };
}

// Cost of a batch (docs/items/economics.md): one line per malt, kettle hop
// and dry hop, the yeast and each other line, in the card's order, each its
// quantity (lb, oz, or 1 batch) times its price, by the engine's rollupCost
// (EC-S2). The total adds the priced lines only and counts the rest (EC-Q6);
// with no line priced it is blank, not a $0.00 nobody entered (CC-S1); a
// priced line whose quantity is blank blanks the total, as any blank figure
// blanks what needs it. The cost per gal is the total over the fermentation
// volume at 60 degF (SPEC 11), by the engine's costPerUnit: blank for a zero,
// negative or blank volume (EC-S4), or a blank total.
// -> { lines: [{ kind, index, name, quantity, unitPrice, cost }], total, unpriced, perGal }
export function computeCost(recipe) {
  const line = (kind, index, name, quantity, unitPrice) => ({ kind, index, name, label: name, quantity, unitPrice });
  const named = (row, kind, i) => String(row.name ?? '').trim() || `${kind} ${i + 1}`;
  const lineItems = [
    ...recipe.malts.map((m, i) => line('malts', i, named(m, 'Malt', i), m.weightLb, m.pricePerLb)),
    ...recipe.kettleAdditions.map((a, i) => line('kettleAdditions', i, named(a, 'Kettle hop', i), a.weightOz, a.pricePerOz)),
    ...recipe.dryHops.map((d, i) => line('dryHops', i, named(d, 'Dry hop', i), d.weightOz, d.pricePerOz)),
    line('yeast', 0, String(recipe.yeast.name ?? '').trim() || 'Yeast', 1, recipe.yeast.pricePerBatch),
    ...recipe.otherCosts.map((o, i) => line('otherCosts', i, o.name, 1, o.costPerBatch)),
  ];
  const { items } = rollupCost(lineItems);
  const priced = lineItems.filter((li) => entered(li.unitPrice));
  const total = priced.length > 0 ? rollupCost(priced).total : NaN;
  const fermentRefGal = toReferenceVolume(recipe.fermentVolGal, 'ferment', recipe.measurementTempF);
  return {
    lines: items.map(({ label, ...li }) => li),
    total,
    unpriced: lineItems.length - priced.length,
    perGal: costPerUnit(total, fermentRefGal),
  };
}

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
    // The three volumes as the engine received them (the Volumes card shows
    // each under its measurement temperature).
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
// pH is shown only. With no positive treated volume there is no
// recommendation either (the water app shows none).
//
// Where the water is treated (docs/items/water-treatment.md): the treated
// volume is the recipe's mash water, or the hot-liquor tank's typed first
// fill. The water volumes come from the recipe — its grain, its mash water and
// its pre-boil volume at 60 degF (Q2) — by the engine's sums; so do the tank's
// draws and the kettle salts. No wort mineral figure is worked out; beside the
// treated water's predicted profile, with kettle salts on, the kettle water
// before the boil (S4b item 2).
//
// Mash pH from the grain bill (docs/items/mash-ph.md, item 2): the predicted
// mash pH of a cooled sample, by the engine's model, from the recipe's malts
// and mash water as entered and the treated mash water as predicted here
// (MP-Q6); blank until there is a predicted profile. With it, whether it lies
// outside the range a cooled sample is checked against (MP-Q10), whether
// acidulated malt is counted twice (MP-Q5), and each malt figure it needs
// that is blank (MP-S5) — the test results and the mash water are named by
// the tab's own lines.

const SALT_KEYS = Object.keys(SALT_CONTRIBUTIONS_PER_G_GAL);
const ACID_KEYS = Object.keys(ACIDS);
const SOLVER_IONS = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'Alkalinity'];
const entered = (v) => Number.isFinite(v);

export function computeWater(water, recipe) {
  const style = findStyle(water.styleId);
  const target = { ...style.profile };
  const s = water.source;
  const setup = effectiveSetup(water);
  const tankTreated = setup.treatment === 'tank';

  // The water volumes from the recipe (WT-S2).
  const preBoilGal = toReferenceVolume(recipe.preBoilVolGal, 'preBoil', recipe.measurementTempF);
  const mashWaterGal = recipe.mashWaterGal;
  const sums = waterVolumes({
    malts: recipe.malts,
    absorptionQtPerLb: water.absorptionQtPerLb,
    preBoilGal,
    mashWaterGal,
    spargeGal: water.spargeGal,
    spargeMethod: setup.spargeMethod,
  });
  const vol = tankTreated ? water.tankTreatedGal : mashWaterGal;
  const volumes = { mashWaterGal, treatedGal: vol, ...sums };

  // The blank figures the sums need, in the order the card shows them (WT-S9).
  const needed = [
    ['mashWaterGal', mashWaterGal],
    ['preBoilGal', preBoilGal],
    ['malts', sums.grainLb],
    ['absorptionQtPerLb', water.absorptionQtPerLb],
    ...(setup.spargeMethod !== 'none' ? [['spargeGal', water.spargeGal]] : []),
    ...(tankTreated
      ? [
          ['tankTreatedGal', water.tankTreatedGal],
          ['tankTopUpGal', water.tankTopUpGal],
        ]
      : []),
  ];
  const blank = needed.filter(([, v]) => !entered(v)).map(([k]) => k);

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

  // Where the acid goes and the water it is dosed for (S5b item C, AM-S2):
  // into the mash, the recipe's mash water; with the salts, the treated
  // water. The mash draws the same concentration either way.
  const acidInMash = setup.acidPlace === 'mash';
  const acidGal = acidInMash ? mashWaterGal : vol;
  const acidDosable = !!recommendation && entered(acidGal) && acidGal > 0;

  // The malt figures the predicted mash pH needs (MP-S5), named on the tab.
  const mashPhNeeds = [];
  recipe.malts.forEach((m, i) => {
    if (m.type === 'none') return;
    const malt = String(m.name ?? '').trim() || `Malt ${i + 1}`;
    if (!MALT_TYPES.includes(m.type)) mashPhNeeds.push({ malt, field: 'type' });
    if (!entered(m.weightLb)) mashPhNeeds.push({ malt, field: 'weightLb' });
    // A base or crystal malt's colour, unless a measured figure stands in for
    // its type's rule; roast and acidulated malts do not read it.
    const colourRead =
      (m.type === 'base' && !entered(m.distilledWaterPh)) || (m.type === 'crystal' && !entered(m.acidityMeqPerKg));
    if (colourRead && !entered(m.colorL)) mashPhNeeds.push({ malt, field: 'colorL' });
  });

  // The acid aimed at the recipe's target mash pH
  // (docs/items/acid-aimed-at-mash-ph.md): the engine's dose that brings the
  // predicted mash pH to the target (AA-S1), for the water the mash draws
  // before the acid — the salts on screen, less the alkalinity-raising salt
  // the style's alkalinity recommends — dosed where the acid goes. Above the
  // target without it, the acid aims and no raising salt is recommended
  // (AA-Q7); at or below, no acid, and the raising salt follows the style
  // (AA-Q3). A blank target blanks the acid (AA-S2).
  const solverSalts = recommendation ? saltTotals(recommendation.additions) : {};
  const withoutRaise = Object.fromEntries(Object.entries(solverSalts).filter(([k]) => k !== water.raiseAlkSource));
  const targetPh = water.mashPhTarget;
  const targetBlank = !entered(targetPh);
  const aimed =
    acidDosable && !targetBlank
      ? acidForMashPh({
          malts: recipe.malts,
          mashWaterGal,
          water: predictFinalProfile({
            source: s,
            additions: { ...withoutRaise, ...overrides },
            acids: {},
            volumeGallons: vol,
          }),
          targetPh,
          volumeGallons: acidGal,
        })
      : null;
  // AA-Q1: the mash pH cannot be predicted: the solver's acid for the
  // style's alkalinity, as before; into the mash, for the mash water (AM-S2).
  const styleAcid =
    !acidDosable || targetBlank || aimed
      ? null
      : acidInMash
        ? solveAdditions({
            source: s,
            target,
            volumeGallons: mashWaterGal,
            raiseAlkSource: water.raiseAlkSource,
            enabledSalts: new Set(water.enabledSalts),
          })
        : recommendation;
  const acidAcids = aimed ? aimed.acids : styleAcid ? styleAcid.acids : null;

  // Salts: the recommendation per salt, the brewer's own amounts over it.
  const recommendedSalts = aimed && Object.keys(aimed.acids).length > 0 ? withoutRaise : solverSalts;
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

  // Acid: the dose (88 % lactic) as the acid picked, same mEq.
  const recommendedMeq = acidAcids ? applyAcids(acidAcids, acidGal).total_meq : NaN;
  const equivalent = acidAcids ? equivalentAcidDose(acidAcids, primary) : NaN;
  const expected = { ...Object.fromEntries(ACID_KEYS.map((k) => [k, 0])), [primary]: equivalent };
  const amounts = water.acidAmounts ?? expected;
  // The acid in the water is known: the brewer's own, or a recommendation
  // that is not blank (AA-S2).
  const acidKnown = acidDosable && (water.acidAmounts !== null || acidAcids !== null);
  const meqOf = (k, amount) => (Number.isNaN(amount) ? NaN : acidContribution(k, amount));
  const acid = {
    primary,
    multi: water.multiAcid,
    amounts,
    recommendedMeq,
    recommended: equivalent,
    // What the recommendation aims at: 'target' (the recipe's target mash
    // pH), 'style' (the style's alkalinity, the pH not predicted: AA-Q1), or
    // null while there is none.
    aimedAt: aimed ? 'target' : styleAcid ? 'style' : null,
    target: targetPh,
    targetBlank,
    // AA-Q1: the figures the predicted mash pH needs, named with the style's aim.
    styleBecause: styleAcid
      ? [...mashPhNeeds, ...(entered(mashWaterGal) ? [] : [{ malt: null, field: 'mashWaterGal' }])]
      : [],
    totals: acidKnown ? applyAcids(amounts, acidGal) : { total_meq: NaN, ppm_alk_reduced: NaN },
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

  // The predicted profile: the treated water; into the mash (AM-S3), the
  // water the mash draws — the tank's water with its salts, then the acid
  // over the mash water. None without a volume to dose the acid for.
  let final = null;
  if (recommendation && acidKnown) {
    let ions;
    if (acidInMash) {
      const tankIons = predictFinalProfile({ source: s, additions: effectiveSalts, acids: {}, volumeGallons: vol });
      ions = predictFinalProfile({
        source: { ...tankIons, Alkalinity: tankIons.Alk },
        additions: {},
        acids: amounts,
        volumeGallons: mashWaterGal,
      });
    } else {
      ions = predictFinalProfile({ source: s, additions: effectiveSalts, acids: amounts, volumeGallons: vol });
    }
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

  const predictedMashPh = final ? mashPh({ malts: recipe.malts, mashWaterGal, water: final.ions }) : NaN;
  const mashPhFigures = {
    ph: predictedMashPh,
    outsideRange: mashPhOutsideRange(predictedMashPh),
    // TR-S1: the limits of the range the model was tested on that the
    // water the mash draws or the mash thickness crosses; none while the
    // pH is blank.
    testedRange: Number.isFinite(predictedMashPh)
      ? mashPhTestedRange({ malts: recipe.malts, mashWaterGal, water: final.ions })
      : [],
    countedTwice: recipe.malts.some((m) => m.type === 'acidulated') && (amounts.acidulated_malt ?? 0) > 0,
    needs: mashPhNeeds,
  };

  // The salts that go in the treated water, as the screen shows them (the
  // brewer's own over the recommendation); none until there is one.
  const added = recommendation
    ? Object.fromEntries(Object.entries(effectiveSalts).filter(([, g]) => g > 0))
    : {};

  // The hot-liquor tank (WT-S4): what the mash draws, what the sparge
  // carries, and what is left in the tank, not used.
  let tank = null;
  if (tankTreated) {
    const draws = tankDraws({
      treatedGal: water.tankTreatedGal,
      topUpGal: water.tankTopUpGal,
      mashWaterGal,
      spargeGal: sums.spargeGal,
    });
    tank = {
      ...draws,
      topUpGal: water.tankTopUpGal,
      mashSalts: shareOfSalts(added, draws.toMash),
      spargeSalts: shareOfSalts(added, draws.toSparge),
      leftSalts: shareOfSalts(added, draws.left),
    };
  }

  // Salts in the kettle (S4b item 2, KW-S1–S2, replacing S4's balance over
  // the mash plus sparge water): the kettle water before the boil (the
  // pre-boil volume at 60 degF) brought to the target — the solver for that
  // volume of source water — less the mash's salts at the recipe's
  // brewhouse efficiency (no sparge: the mash well mixed) and the share of
  // the sparge's that reaches it. No acid. The kettle water's figures are the
  // source water's plus every salt in the kettle over its volume.
  let kettle = null;
  if (setup.kettleSalts) {
    const kettleGal = preBoilGal;
    const shares = kettleShares({
      efficiency: recipe.efficiency,
      mashWaterGal,
      spargeGal: sums.spargeGal,
      preBoilGal: kettleGal,
      spargeMethod: setup.spargeMethod,
    });
    const fromMash = shareOfSalts(tank ? tank.mashSalts : added, shares.mash);
    const fromSparge = shareOfSalts(tank ? tank.spargeSalts : {}, shares.sparge);
    const fromLauter = sumSalts(fromMash, fromSparge);
    const whole =
      complete && entered(kettleGal) && kettleGal > 0 && entered(shares.mash) && entered(shares.sparge)
        ? saltTotals(
            solveAdditions({
              source: s,
              target,
              volumeGallons: kettleGal,
              raiseAlkSource: water.raiseAlkSource,
              enabledSalts: new Set(water.enabledSalts),
            }).additions,
          )
        : null;
    const balance = whole
      ? kettleSalts({ needed: whole, fromMash, fromSparge })
      : Object.fromEntries(Object.keys(fromLauter).map((k) => [k, NaN]));
    const inKettle = sumSalts(fromLauter, balance);
    let profile = null;
    if (whole && Object.values(inKettle).every(entered)) {
      const ions = predictFinalProfile({ source: s, additions: inKettle, acids: {}, volumeGallons: kettleGal });
      const ratio = sulfateChlorideRatio(ions.SO4, ions.Cl);
      profile = {
        ions,
        ratio,
        match: {
          Ca: targetMatch(ions.Ca, target.Ca),
          Mg: targetMatch(ions.Mg, target.Mg),
          Na: targetMatch(ions.Na, target.Na),
          SO4: targetMatch(ions.SO4, target.SO4),
          Cl: targetMatch(ions.Cl, target.Cl),
          ratio: targetMatch(ratio, style.so4_cl_target),
        },
      };
    }
    kettle = {
      volumeGal: kettleGal,
      // KS1: a share held at its limit (docs/items/kettle-share-limits.md).
      held: whole ? shares.held : false,
      salts: Object.entries(balance).map(([k, amount]) => ({
        key: k,
        name: SALT_CONTRIBUTIONS_PER_G_GAL[k].name,
        amount,
      })),
      // A salt the mash (and sparge) already bring past the kettle's need.
      overTarget: whole ? Object.keys(fromLauter).filter((k) => fromLauter[k] > (whole[k] ?? 0)) : [],
      profile,
    };
  }

  return {
    style,
    target,
    missing: TEST_RESULT_KEYS.filter((k) => !entered(s[k])),
    source,
    setup,
    volumes,
    blank,
    hasVolume,
    complete,
    recommendation,
    salts,
    raiseSalt,
    acid,
    customized,
    final,
    mashPh: mashPhFigures,
    tank,
    kettle,
    warnings: {
      mashOverTreated: tank?.mashOverTreated ?? false,
      spargeOverTopUp: tank?.spargeOverTopUp ?? false,
      topUpBelowTreated: tank?.topUpBelowTreated ?? false,
      kettleShortGal: sums.kettleShortGal,
    },
  };
}
