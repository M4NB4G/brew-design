// blank-prices.js
// Cost of a batch (docs/items/economics.md, EC-S3) gave every malt, kettle
// hop, dry hop and the yeast a price, and the recipe its other lines (recipe
// format 11). A recipe built by hand before then, or read from an older
// document, carries them blank: these put them in, as the reader does, so
// the earlier scenarios compare like with like. Prices are read by no figure.

const blank = (rows, key, value) => rows.map((r) => (key in r ? r : { ...r, [key]: value }));

// A canonical recipe with each missing price blank (NaN) and no other lines.
export function withBlankPrices(recipe, value = NaN) {
  return {
    ...recipe,
    malts: blank(recipe.malts, 'pricePerLb', value),
    kettleAdditions: blank(recipe.kettleAdditions, 'pricePerOz', value),
    dryHops: blank(recipe.dryHops, 'pricePerOz', value),
    yeast: 'pricePerBatch' in recipe.yeast ? recipe.yeast : { ...recipe.yeast, pricePerBatch: value },
    otherCosts: recipe.otherCosts ?? [],
  };
}

// The same for a recipe as a saved document holds it (a blank is null).
export function docWithBlankPrices(recipe) {
  return withBlankPrices(recipe, null);
}
