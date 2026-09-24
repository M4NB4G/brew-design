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
    // Identity: free text, empty on a new recipe (the app never invents a
    // name), and never read by any calculation.
    name: '',
    style: '',
    notes: '',

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

    // Yeast: type 'ale' | 'lager'; density 'high' | 'mod' | 'low'; the strain's
    // name as typed or picked (empty on a new recipe: the app never invents a
    // strain); the brewer's fermentation temperature in degF (NaN = blank).
    // Neither the name nor the temperature is read by any calculation.
    yeast: { type: 'ale', density: 'mod', name: '', fermTempF: NaN },

    // Temperature (degF) each volume was measured at, keyed by the kind
    // reference-volume.js corrects (mash water is used as entered). 60 is the
    // engine's reference (correctVolumeToRef's refTempF): the factor is 1, so
    // a new recipe's numbers are the uncorrected ones.
    measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
  };
}

// Display-setting defaults: Home, and °P as the Pro gravity unit.
export const DEFAULT_DISPLAY = { mode: 'home', proGravityUnit: 'plato' };

// --- The brewery's figures (Brewery defaults, 2026-09-23) --------------------
// The brewery's own figures, kept apart from any recipe: a new recipe starts
// from them. Held in the recipe's own units (gal, degF, fraction) plus the two
// display settings. null is a blank figure: the new recipe takes the built-in
// one. They are copied into a recipe only when it is created; a recipe never
// refers back to them.
const BREWERY_NUMBERS = ['fermentVolGal', 'preBoilVolGal', 'boilOffRateGalPerHr', 'boilTimeMin', 'efficiency'];
const MEASUREMENT_KINDS = ['preBoil', 'postBoil', 'ferment'];
const MODES = ['home', 'pro'];
const GRAVITY_UNITS = ['plato', 'sg'];

/** Every brewery figure blank. */
export function emptyBreweryFigures() {
  return {
    fermentVolGal: null,
    preBoilVolGal: null,
    boilOffRateGalPerHr: null,
    boilTimeMin: null,
    measurementTempF: { preBoil: null, postBoil: null, ferment: null },
    efficiency: null,
    mode: null,
    proGravityUnit: null,
  };
}

/** True when any brewery figure is set. */
export function hasBreweryFigures(brewery) {
  const b = brewery ?? {};
  return (
    BREWERY_NUMBERS.some((k) => b[k] != null) ||
    MEASUREMENT_KINDS.some((k) => b.measurementTempF?.[k] != null) ||
    b.mode != null ||
    b.proGravityUnit != null
  );
}

// A number that can reach a recipe, or null (blank): NaN, null and anything
// not a finite number are blank.
const figure = (v) => (Number.isFinite(v) ? v : null);

/**
 * "Use this recipe's figures": the brewery's figures taken from the recipe
 * and display settings on screen, and nothing else. A cleared field is taken
 * as a blank figure.
 */
export function breweryFiguresFromRecipe(recipe, mode, proGravityUnit) {
  const out = emptyBreweryFigures();
  for (const k of BREWERY_NUMBERS) out[k] = figure(recipe[k]);
  for (const k of MEASUREMENT_KINDS) out.measurementTempF[k] = figure(recipe.measurementTempF?.[k]);
  out.mode = MODES.includes(mode) ? mode : null;
  out.proGravityUnit = GRAVITY_UNITS.includes(proGravityUnit) ? proGravityUnit : null;
  return out;
}

/**
 * A new recipe, with its display settings: the built-in recipe and display
 * settings, with every brewery figure that is set in place of the built-in
 * one. A blank figure — null, NaN, or one that is not a figure at all — never
 * reaches the recipe; the built-in one stays.
 */
export function newRecipe(brewery) {
  const b = brewery ?? {};
  const recipe = defaultRecipeState();
  for (const k of BREWERY_NUMBERS) {
    if (figure(b[k]) !== null) recipe[k] = b[k];
  }
  for (const k of MEASUREMENT_KINDS) {
    const t = b.measurementTempF?.[k];
    if (figure(t) !== null) recipe.measurementTempF[k] = t;
  }
  return {
    recipe,
    mode: MODES.includes(b.mode) ? b.mode : DEFAULT_DISPLAY.mode,
    proGravityUnit: GRAVITY_UNITS.includes(b.proGravityUnit) ? b.proGravityUnit : DEFAULT_DISPLAY.proGravityUnit,
  };
}
