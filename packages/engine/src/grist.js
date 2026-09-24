// grist.js
// Grain bill -> gravity, attenuation, ABV, color, and mash thickness.
// Pure functions. Every constant reproduced exactly from the spec.

import { sgToPlato, platoToSg } from './units.js';

// Recommended mash ranges, the owner's Recipe Designer Rev 3, "Grist and Pitch
// Calc's": F3 "Rv Should be 1.25-2" (beside E3, Estimated Mash Rv, qt/lb) and
// F4 "R should be 2.5-4" (beside E4, Estimated Mash R, lb/lb). Both ends are
// inside the range.
// FLAG: the two cells do not agree. R = Rv x 2.055, so R 2.5-4 lb/lb is Rv
// 2.5/2.055 = 1.2165 to 4/2.055 = 1.9465 qt/lb. An Rv from 1.2165 up to 1.25
// warns on Rv alone, and one above 1.9465 up to 2 warns on R alone. Kept as
// the owner's cells, each checked against its own (docs/items/design-warnings.md
// W2); changed only if the owner gives new figures.
export const MASH_RV_RANGE_QT_PER_LB = { low: 1.25, high: 2 };
export const MASH_R_RANGE_LB_PER_LB = { low: 2.5, high: 4 };

/**
 * Which mash ratios lie outside their recommended range.
 * mashRatioWarnings({ mashRv, mashR }) -> { mashRv: boolean, mashR: boolean }
 * true = outside. A value that is not a number (a cleared input) gives false.
 */
export function mashRatioWarnings({ mashRv, mashR }) {
  const outside = (v, { low, high }) => v < low || v > high; // NaN compares false
  return { mashRv: outside(mashRv, MASH_RV_RANGE_QT_PER_LB), mashR: outside(mashR, MASH_R_RANGE_LB_PER_LB) };
}

/**
 * Post-boil volume from a pre-boil volume and a boil-off rate.
 * postBoilVolGal = preBoilVolGal - boilOffRateGalPerHr * (boilTimeMin / 60)
 */
export function computePostBoilVol(preBoilVolGal, boilOffRateGalPerHr, boilTimeMin) {
  return preBoilVolGal - boilOffRateGalPerHr * (boilTimeMin / 60);
}

/**
 * Compute the full grist chain.
 *
 * input = {
 *   malts: [{ name, weightLb, fgdb, colorL }],
 *   efficiency,            // brewhouse (into-kettle) efficiency
 *   preBoilVolGal,         // at 60 F reference (caller corrects first)
 *   postBoilVolGal,        // at 60 F reference (caller corrects first)
 *   mashWaterGal,          // used as entered, NOT temperature-corrected
 *   apparentAttenuation,
 * }
 *
 * preBoilVolGal and postBoilVolGal are already at the 60 F reference; the
 * caller applies correctVolumeToRef() before calling this. mashWaterGal is
 * used as entered because the 2.055 qt->lb constant already embeds a density
 * assumption.
 *
 * Defaults live at this input-assembly boundary (efficiency 0.75, apparent
 * attenuation 0.77), not hardcoded inside the math.
 */
export function computeGrist(input) {
  const {
    malts,
    efficiency = 0.75,
    preBoilVolGal,
    postBoilVolGal,
    mashWaterGal,
    apparentAttenuation = 0.77,
  } = input;

  const sumWeightLb = malts.reduce((s, m) => s + m.weightLb, 0);

  // Per-malt extract points contributed at the pre-boil volume, and each
  // malt's share of the total grain weight (a fraction; not a number when the
  // total is zero or not a number).
  const perMalt = malts.map((m) => {
    const perMaltMaxPpg = 46 * m.fgdb; // 46 PPG = sucrose extract potential
    const perMaltBhPpg = perMaltMaxPpg * efficiency;
    const perMaltPoints = perMaltBhPpg * (m.weightLb / preBoilVolGal);
    const perMaltMcu = (m.colorL * m.weightLb) / postBoilVolGal;
    const perMaltWeightFraction = m.weightLb / sumWeightLb;
    return {
      name: m.name,
      perMaltMaxPpg,
      perMaltBhPpg,
      perMaltPoints,
      perMaltMcu,
      perMaltWeightFraction,
    };
  });

  const sumPoints = perMalt.reduce((s, m) => s + m.perMaltPoints, 0);
  const preBoilSg = 1 + sumPoints / 1000;
  const preBoilPlato = sgToPlato(preBoilSg);

  // 1.01 = empirical boil-concentration correction.
  const postBoilPlato = preBoilPlato / ((1.01 * postBoilVolGal) / preBoilVolGal);
  const OG = platoToSg(postBoilPlato);
  const FG = OG - apparentAttenuation * (OG - 1);

  // Standard advanced ABV (76.08, 1.775, 0.794). Returned as a fraction.
  const ABV = ((76.08 * (OG - FG)) / (1.775 - OG)) * (FG / 0.794) / 100;

  // Morey color: SRM = 1.49 * (sum MCU)^0.69.
  const sumMcu = perMalt.reduce((s, m) => s + m.perMaltMcu, 0);
  const SRM = 1.49 * Math.pow(sumMcu, 0.69);

  const mashRv = (mashWaterGal * 4) / sumWeightLb; // qt / lb
  const mashR = mashRv * 2.055; // lb / lb (2.055 qt->lb water constant)

  return {
    preBoilSg,
    preBoilPlato,
    postBoilPlato,
    OG,
    FG,
    ABV,
    SRM,
    mashRv,
    mashR,
    perMalt,
  };
}
