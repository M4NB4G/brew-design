// scale.js
// Scaling a recipe to another batch (docs/items/pro-recipe-default.md, PD-S4).
// Pure function: no DOM, no I/O, no global state.
//
// Every amount is multiplied by one ratio, the batch over the recipe's
// fermentation volume (both US gal, as entered): each malt weight, each kettle
// and dry hop weight, the mash water, the pre-boil and sparge volumes, the
// boil-off rate, the hot-liquor tank's treated volume and top-up level, and
// the brewer's own salt and acid amounts. Percents, times, temperatures, the
// efficiency, the attenuation and the yeast are unchanged, so OG, FG, ABV, SRM
// and IBU are unchanged. Nothing is rounded; a blank amount (NaN) stays blank,
// and salt and acid amounts that follow the recommendation (none stored) stay so.

/**
 * The recipe scaled to `batchGal` in the fermenter. The recipe is the
 * canonical recipe state (US gal, lb, oz; its `water` in gal, g and mL); a new
 * recipe is returned and the one given is unchanged. The fermentation volume
 * becomes the batch itself (fermentVolGal x batch / fermentVolGal), so a
 * scaled recipe sits exactly at its batch.
 */
export function scaleRecipe(recipe, batchGal) {
  const ratio = batchGal / recipe.fermentVolGal;
  const by = (v) => v * ratio;
  const each = (amounts) => Object.fromEntries(Object.entries(amounts).map(([k, v]) => [k, by(v)]));
  const w = recipe.water;
  return {
    ...recipe,
    malts: recipe.malts.map((m) => ({ ...m, weightLb: by(m.weightLb) })),
    kettleAdditions: recipe.kettleAdditions.map((a) => ({ ...a, weightOz: by(a.weightOz) })),
    dryHops: recipe.dryHops.map((d) => ({ ...d, weightOz: by(d.weightOz) })),
    mashWaterGal: by(recipe.mashWaterGal),
    preBoilVolGal: by(recipe.preBoilVolGal),
    boilOffRateGalPerHr: by(recipe.boilOffRateGalPerHr),
    fermentVolGal: batchGal,
    water: {
      ...w,
      spargeGal: by(w.spargeGal),
      tankTreatedGal: by(w.tankTreatedGal),
      tankTopUpGal: by(w.tankTopUpGal),
      saltOverrides: each(w.saltOverrides),
      acidAmounts: w.acidAmounts === null ? null : each(w.acidAmounts),
    },
  };
}
