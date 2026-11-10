// hops.js
// Tinseth utilization with a Zymurgy whirlpool temperature factor -> IBU.
// Pure functions. Every constant reproduced exactly from the spec.

// The range the whirlpool temperature factor is used on, degF: the three
// points of Rev 4's own temperature factor table (Hops!M10:O12: 100, 90 and
// 80 degC at 1, 0.5 and 0.25), which the quadratic passes through. Below it
// the factor is held at the curve's own figure at 176 F, so a cooler stand
// never shows more bitterness than a hotter one; above it at the curve's own
// figure at 212 F, so no hop counts for more than at the boil. The owner's
// decision, 2026-11-10 (docs/items/whirlpool-hop-range.md, H-1 to H-3).
export const WHIRLPOOL_RANGE_F = { low: 176, high: 212 };

/**
 * Compute IBU contributions and dry-hop ratio.
 *
 * input = {
 *   kettleAdditions: [{ name, timeMin, wortTempF, weightOz, alphaAcidFraction }],
 *   preBoilSg,        // gravity fed to the Tinseth model (Grist!E2 choice)
 *   postBoilVolGal,
 *   dryHops: [{ weightOz }],
 *   fermentVolGal,
 * }
 */
export function computeHops(input) {
  const { kettleAdditions, preBoilSg, postBoilVolGal, dryHops = [], fermentVolGal } = input;

  const additions = kettleAdditions.map((a) => {
    // Tinseth: 1.65, 0.000125, 0.04, 4.15.
    const utilization =
      1.65 * Math.pow(0.000125, preBoilSg - 1) * ((1 - Math.exp(-0.04 * a.timeMin)) / 4.15);

    // Zymurgy May/Jun 2022 whirlpool temperature factor (quadratic fit).
    // 212 F -> 1.0, so full-boil additions are unaffected.
    // Used on WHIRLPOOL_RANGE_F only: a temperature outside it takes the
    // curve's figure at the nearer end. A blank temperature stays blank.
    // FLAG: Rev 4's reference recipe whirlpools three hops at 175 F
    // (Hops!B5:B7), one degree below the range; they take the 176 F factor,
    // 0.24992434 in place of Rev 4's 0.24336656 (H5:H7), 0.28 IBU more
    // together, the total still 46. Kept: the owner's decision H-5
    // (2026-11-10), recorded in SPEC rule 2.
    const tempF = Math.min(Math.max(a.wortTempF, WHIRLPOOL_RANGE_F.low), WHIRLPOOL_RANGE_F.high);
    const tempFactor = 0.0003858 * tempF * tempF - 0.12885802 * tempF + 10.97839506;

    const adjUtil = utilization * tempFactor;

    // IBU scale: oz/gal to mg/L by 7489.1 (Rev 4, Hops!J3, in place of Rev 3's
    // 75 and x100).
    const ibu = a.weightOz * a.alphaAcidFraction * adjUtil * (7489.1 / postBoilVolGal);

    return {
      name: a.name,
      utilization,
      tempFactor,
      // Below the range: the factor is held at its low end, and the Hops card
      // and the printed hop schedule name the hop (WH-S4).
      belowRange: a.wortTempF < WHIRLPOOL_RANGE_F.low,
      adjUtil,
      ibu,
    };
  });

  // The unrounded sum, kept for the figures at pitch (water-back.js).
  const sumIBU = additions.reduce((s, a) => s + a.ibu, 0);
  const totalIBU = Math.round(sumIBU);

  const sumDryHopOz = dryHops.reduce((s, d) => s + d.weightOz, 0);
  const dryHopRatio = sumDryHopOz / fermentVolGal;

  return {
    additions,
    sumIBU,
    totalIBU,
    dryHopRatio,
  };
}
