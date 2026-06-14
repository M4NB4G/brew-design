// state.js
// The single canonical recipe-state object. It is held in the engine's
// canonical units everywhere in the app: US gal, lb, oz, degF, SG, billion
// cells, L. Display conversion happens ONLY at the edges (see display.js); the
// state object never holds display units.
//
// These defaults are a realistic starting recipe, NOT a parity claim against
// the reference spreadsheet. The parity recipe lives in test/smoke.test.js.

export function defaultRecipeState() {
  return {
    // Grist (malt weights in lb; fgdb fraction; color in degL).
    malts: [
      { name: 'Pale 2-Row', weightLb: 10, fgdb: 0.8, colorL: 2 },
      { name: 'Munich', weightLb: 1, fgdb: 0.8, colorL: 9 },
    ],
    efficiency: 0.75, // documented brewhouse (into-kettle) default
    apparentAttenuation: 0.77,

    // Wort-production volumes (US gal) and boil parameters.
    preBoilVolGal: 7,
    boilOffRateGalPerHr: 1.5,
    boilTimeMin: 60,
    mashWaterGal: 5,

    // Hops (weights in oz; time in min; wort temp in degF; alpha as a fraction).
    kettleAdditions: [
      { name: 'Magnum', timeMin: 60, wortTempF: 212, weightOz: 1, alphaAcidFraction: 0.12 },
      { name: 'Cascade', timeMin: 10, wortTempF: 212, weightOz: 1, alphaAcidFraction: 0.06 },
    ],
    dryHops: [{ name: 'Citra', weightOz: 2 }],

    // Fermentation volume (US gal) — feeds both the dry-hop rate and cell count.
    fermentVolGal: 5.5,

    // Yeast: type 'ale' | 'lager'; density 'high' | 'mod' | 'low'.
    yeast: { type: 'ale', density: 'mod' },
  };
}
