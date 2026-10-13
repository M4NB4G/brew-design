// scale.js
// Scaling a recipe to another batch (docs/items/pro-recipe-default.md, PD-S4).
// Pure function: no DOM, no I/O, no global state.

import { volumeAtPitch } from './water-back.js';
//
// Every amount is multiplied by one ratio, the batch over the recipe's
// fermentation volume (both US gal, as entered; with water back on, the wort
// from kettle plus the water back, docs/items/water-back-in-fermentation-
// volume.md, WF-S5): each malt weight, each kettle
// and dry hop weight, the mash water, the pre-boil and sparge volumes, the
// boil-off rate, the hot-liquor tank's treated volume and top-up level, the
// brewer's own salt and acid amounts, and the water back (its temperature
// stays; docs/items/water-back.md, WB-S6). Percents, times, temperatures, the
// efficiency, the attenuation and the yeast are unchanged, so OG, FG, ABV, SRM
// and IBU are unchanged. Nothing is rounded; a blank amount (NaN) stays blank,
// and salt and acid amounts that follow the recommendation (none stored) stay so.

/**
 * The recipe scaled to `batchGal` in the fermenter. The recipe is the
 * canonical recipe state (US gal, lb, oz; its `water` in gal, g and mL); a new
 * recipe is returned and the one given is unchanged. The fermentation volume
 * becomes the batch itself (fermentVolGal x batch / fermentVolGal), so a
 * scaled recipe sits exactly at its batch. With water back on, the recipe's
 * fermentVolGal is the wort from kettle: the water back is multiplied, and the
 * wort from kettle is the batch less it, the same figure as fermentVolGal x
 * ratio but adding back to the batch exactly.
 */
export function scaleRecipe(recipe, batchGal) {
  const wb = recipe.waterBack;
  const waterBackOn = wb?.on === true;
  const fermentGal = waterBackOn ? volumeAtPitch(recipe.fermentVolGal, wb.volumeGal) : recipe.fermentVolGal;
  const ratio = batchGal / fermentGal;
  const by = (v) => v * ratio;
  const waterBackGal = wb ? by(wb.volumeGal) : NaN;
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
    fermentVolGal: waterBackOn ? batchGal - waterBackGal : batchGal,
    ...(wb && { waterBack: { ...wb, volumeGal: waterBackGal } }),
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
