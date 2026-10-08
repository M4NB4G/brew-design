// solver.js
// Inverse grist solver: closed-form, gravity-only, OG target.
// Pure functions. Every constant reproduced exactly from the spec.

import { sgToPlato, platoToSg } from './units.js';
import { computePostBoilVol } from './grist.js';

/**
 * Solve for the grain bill that hits a target OG.
 *
 * input = {
 *   malts: [{ fgdb, percent }],   // percents sum to 1
 *   targetOG,
 *   efficiency,
 *   preBoilVolGal,                // at 60 F reference
 *   boilOffRateGalPerHr,
 *   boilTimeMin,
 *   postBoilVolGal,               // optional, at 60 F reference: the caller's
 *                                 // post-boil volume (the measured pre-boil
 *                                 // boiled off, then corrected); without it,
 *                                 // preBoilVolGal boiled off
 *   targetMashRvQtPerLb,
 * }
 *
 * Returns { totalWeightLb, weights: [{ ...inputMalt, weightLb }], mashWaterGal }.
 * Color is not targeted here.
 */
export function solveGrist(input) {
  const {
    malts,
    targetOG,
    efficiency,
    preBoilVolGal,
    boilOffRateGalPerHr,
    boilTimeMin,
    targetMashRvQtPerLb,
  } = input;

  const postBoilVolGal = input.postBoilVolGal ?? computePostBoilVol(preBoilVolGal, boilOffRateGalPerHr, boilTimeMin);

  // FLAG: sgToPlato (Brewer's Friend cubic) and platoToSg (ASBC) are two
  // independent polynomial approximations and are NOT exact inverses:
  // sgToPlato(platoToSg(p)) - p is about +0.0034 degP near OG ~1.069. The
  // forward grist produces OG via platoToSg; this inverse solver re-enters via
  // sgToPlato(targetOG), so an OG -> grist -> OG round trip carries that
  // residual. On the reference recipe it lands totalWeightLb at ~29.013 lb
  // (target 29.00), i.e. ~0.013 lb / ~0.044% off, slightly beyond the spec's
  // stated 1e-2 round-trip tolerance. This is a property of the mandated
  // constants, not an implementation error; the constants are reproduced as
  // written and left unchanged. See solver.test.js for the pinned residual.
  const targetPostPlato = sgToPlato(targetOG);
  // Invert the forward boil-concentration step (pre-boil / post-boil volume).
  const targetPrePlato = targetPostPlato * (postBoilVolGal / preBoilVolGal);
  const targetPreSg = platoToSg(targetPrePlato);
  const targetPoints = (targetPreSg - 1) * 1000;

  // Weighted extract potential of the blend, points per pound per gallon.
  const blendPotential = malts.reduce((s, m) => s + 46 * m.fgdb * m.percent, 0);

  const totalWeightLb = (targetPoints * preBoilVolGal) / (efficiency * blendPotential);

  const weights = malts.map((m) => ({
    ...m,
    weightLb: m.percent * totalWeightLb,
  }));

  const mashWaterGal = (targetMashRvQtPerLb * totalWeightLb) / 4;

  return { totalWeightLb, weights, mashWaterGal };
}
