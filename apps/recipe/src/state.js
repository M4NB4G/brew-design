// state.js
// The single canonical recipe-state object. It is held in the engine's
// canonical units everywhere in the app: US gal, lb, oz, degF, SG, billion
// cells, L. Display conversion happens ONLY at the edges (see display.js); the
// state object never holds display units.
//
// These defaults are a realistic starting recipe, NOT a parity claim against
// the reference spreadsheet. The parity recipe lives in test/smoke.test.js.

import { REFERENCE_TEMP_F } from '@brew/engine';
import { defaultWaterState, TEST_RESULT_KEYS, TREATMENTS, SPARGE_METHODS, VESSEL_COUNTS } from './water-state.js';
import { TEMPERATURE_UNITS } from './display.js';

export function defaultRecipeState() {
  return {
    // Identity: free text, empty on a new recipe (the app never invents a
    // name), and never read by any calculation.
    name: '',
    style: '',
    notes: '',

    // Grist (malt weights in lb; fgdb fraction; color in degL). Each malt's
    // type for the mash pH model — base, crystal, roast, acidulated, none, or
    // '' (blank) — and its lab figures, the distilled-water mash pH and the
    // acidity in mEq/kg (NaN = blank), as picked from the ingredient list or
    // chosen (mash pH, MP-S3). Pale and Munich are base malts (MP-Q2).
    malts: [
      { name: 'Pale 2-Row', weightLb: 10, fgdb: 0.8, colorL: 2, type: 'base', distilledWaterPh: NaN, acidityMeqPerKg: NaN },
      { name: 'Munich', weightLb: 1, fgdb: 0.8, colorL: 9, type: 'base', distilledWaterPh: NaN, acidityMeqPerKg: NaN },
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
    // reference-volume.js corrects (mash water is used as entered). A new
    // recipe starts at the engine's reference: the factor is 1, so its
    // numbers are the uncorrected ones.
    measurementTempF: { preBoil: REFERENCE_TEMP_F, postBoil: REFERENCE_TEMP_F, ferment: REFERENCE_TEMP_F },

    // The Water tab's entries (water-state.js): part of the recipe, saved and
    // reset with it (Water saved with the recipe, WS-S1). No recipe figure
    // reads them; the Water tab's figures do (computeWater).
    water: defaultWaterState(),
  };
}

// Display-setting defaults: Home, °P as the Pro gravity unit, and °F.
export const DEFAULT_DISPLAY = { mode: 'home', proGravityUnit: 'plato', temperatureUnit: 'F' };

// --- The brewery's figures (Brewery defaults, 2026-09-23) --------------------
// The brewery's own figures, kept apart from any recipe: a new recipe starts
// from them. Held in the recipe's own units (gal, degF, fraction) plus the
// three display settings (the temperature unit: °C display toggle, CT-S5). null is a blank figure: the new recipe takes the built-in
// one. They are copied into a recipe only when it is created; a recipe never
// refers back to them.
//
// Their water (Water saved with the recipe, S1, WS-S2): the brewery's usual
// water report (mg/L; pH in SU), the salts it keeps on hand, its usual
// treatment choice and kettle switch, and its water setup (vessels, sparge,
// the tank's treated volume and top-up level in gal, grain absorption in
// qt/lb) — each blank (null) until set. The sparge water is the recipe's alone.
// The style and the brewer's own amounts are the recipe's alone (S2, S3).
const BREWERY_NUMBERS = ['fermentVolGal', 'preBoilVolGal', 'boilOffRateGalPerHr', 'boilTimeMin', 'efficiency'];
const MEASUREMENT_KINDS = ['preBoil', 'postBoil', 'ferment'];
const MODES = ['home', 'pro'];
const GRAVITY_UNITS = ['plato', 'sg'];
const WATER_NUMBERS = ['tankTreatedGal', 'tankTopUpGal', 'absorptionQtPerLb'];

/** Every brewery water figure blank. */
export function emptyBreweryWater() {
  return {
    source: Object.fromEntries(TEST_RESULT_KEYS.map((k) => [k, null])),
    enabledSalts: null,
    treatment: null,
    kettleSalts: null,
    vessels: null,
    spargeMethod: null,
    tankTreatedGal: null,
    tankTopUpGal: null,
    absorptionQtPerLb: null,
  };
}

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
    temperatureUnit: null,
    water: emptyBreweryWater(),
  };
}

// The water choices a brewery figure may hold, each checked against the
// Water tab's own list.
export const BREWERY_WATER_CHOICES = {
  treatment: (v) => TREATMENTS.includes(v),
  kettleSalts: (v) => typeof v === 'boolean',
  vessels: (v) => VESSEL_COUNTS.includes(v),
  spargeMethod: (v) => SPARGE_METHODS.includes(v),
};

/** True when any brewery figure is set. */
export function hasBreweryFigures(brewery) {
  const b = brewery ?? {};
  const w = b.water ?? {};
  return (
    BREWERY_NUMBERS.some((k) => b[k] != null) ||
    MEASUREMENT_KINDS.some((k) => b.measurementTempF?.[k] != null) ||
    b.mode != null ||
    b.proGravityUnit != null ||
    b.temperatureUnit != null ||
    TEST_RESULT_KEYS.some((k) => w.source?.[k] != null) ||
    w.enabledSalts != null ||
    Object.keys(BREWERY_WATER_CHOICES).some((k) => w[k] != null) ||
    WATER_NUMBERS.some((k) => w[k] != null)
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
export function breweryFiguresFromRecipe(recipe, mode, proGravityUnit, temperatureUnit) {
  const out = emptyBreweryFigures();
  for (const k of BREWERY_NUMBERS) out[k] = figure(recipe[k]);
  for (const k of MEASUREMENT_KINDS) out.measurementTempF[k] = figure(recipe.measurementTempF?.[k]);
  out.mode = MODES.includes(mode) ? mode : null;
  out.proGravityUnit = GRAVITY_UNITS.includes(proGravityUnit) ? proGravityUnit : null;
  out.temperatureUnit = TEMPERATURE_UNITS.includes(temperatureUnit) ? temperatureUnit : null;
  const w = recipe.water;
  if (w) {
    for (const k of TEST_RESULT_KEYS) out.water.source[k] = figure(w.source?.[k]);
    out.water.enabledSalts = Array.isArray(w.enabledSalts) ? [...w.enabledSalts] : null;
    for (const [k, ok] of Object.entries(BREWERY_WATER_CHOICES)) out.water[k] = ok(w[k]) ? w[k] : null;
    for (const k of WATER_NUMBERS) out.water[k] = figure(w[k]);
  }
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
  const w = b.water ?? {};
  for (const k of TEST_RESULT_KEYS) {
    const v = w.source?.[k];
    if (figure(v) !== null) recipe.water.source[k] = v;
  }
  if (Array.isArray(w.enabledSalts)) recipe.water.enabledSalts = [...w.enabledSalts];
  for (const [k, ok] of Object.entries(BREWERY_WATER_CHOICES)) {
    if (ok(w[k])) recipe.water[k] = w[k];
  }
  for (const k of WATER_NUMBERS) {
    if (figure(w[k]) !== null) recipe.water[k] = w[k];
  }
  return {
    recipe,
    mode: MODES.includes(b.mode) ? b.mode : DEFAULT_DISPLAY.mode,
    proGravityUnit: GRAVITY_UNITS.includes(b.proGravityUnit) ? b.proGravityUnit : DEFAULT_DISPLAY.proGravityUnit,
    temperatureUnit: TEMPERATURE_UNITS.includes(b.temperatureUnit) ? b.temperatureUnit : DEFAULT_DISPLAY.temperatureUnit,
  };
}

// --- My brewery banner (S4b item 4) -------------------------------------------
// While every brewery figure is blank, a banner recommends setting them up,
// unless the brewer said "Not now" in this browser (BB-S1, BB-S2).
export function breweryBannerShown(brewery, dismissed) {
  return !hasBreweryFigures(brewery) && !dismissed;
}

// Setting a figure ends a "Not now", so clearing the figures again brings the
// banner back; while every figure stays blank, it stands (BB-S2).
export function bannerDismissalAfter(brewery, dismissed) {
  return hasBreweryFigures(brewery) ? false : dismissed;
}
