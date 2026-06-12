// hops.js
// Tinseth utilization with a Zymurgy whirlpool temperature factor -> IBU.
// Pure functions. Every constant reproduced exactly from the spec.

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
    const tempFactor =
      0.0003858 * a.wortTempF * a.wortTempF - 0.12885802 * a.wortTempF + 10.97839506;

    const adjUtil = utilization * tempFactor;

    // IBU scale: 75 and x100.
    const ibu = a.weightOz * a.alphaAcidFraction * adjUtil * (75 / postBoilVolGal) * 100;

    return {
      name: a.name,
      utilization,
      tempFactor,
      adjUtil,
      ibu,
    };
  });

  const totalIBU = Math.round(additions.reduce((s, a) => s + a.ibu, 0));

  const sumDryHopOz = dryHops.reduce((s, d) => s + d.weightOz, 0);
  const dryHopRatio = sumDryHopOz / fermentVolGal;

  return {
    additions,
    totalIBU,
    dryHopRatio,
  };
}
