// persistence.js
// Saves and restores the canonical app state (recipe + display settings) in a
// key-value storage such as window.localStorage. Storage is injected, so this
// module is pure and the suite runs without a DOM.
//
// Decisions (Persistence scope table, 2026-09-20): one key; one JSON document
// carrying a schema version; any other version, unreadable data, or a storage
// that throws yields the defaults and never throws. Last write wins across
// tabs; no sync. Stored state is always canonical units (SPEC.md rules 8, 13).
//
// JSON has no NaN. A cleared field is NaN in state and would be written as
// null; on load, null in the recipe is restored to NaN so a number never
// silently becomes 0 (null * x === 0).
//
// Schema history. Version 1: the recipe without measurement temperatures.
// Version 2 (Options page, 2026-09-21): the recipe gains measurementTempF
// { preBoil, postBoil, ferment } in degF. A version-1 document is read with
// the three at the engine's 60 degF reference — the identity in numbers —
// and the autosave rewrites it as version 2.
// Version 3 (Recipe identity, 2026-09-23): the recipe gains name, style and
// notes, all text. A version-1 or version-2 document is read with the three
// empty, and the autosave rewrites it as version 3.
// Version 4 (Yeast card, 2026-09-23): the yeast gains its strain's name (text)
// and the fermentation temperature (degF). A version-1, 2 or 3 document is
// read with an empty strain and a blank (NaN) temperature, and the autosave
// rewrites it as version 4.
// Version 5 (Water saved with the recipe, 2026-10-02): the recipe gains the
// Water tab's entries, `water`. A version-1 to 4 document is read with the
// built-in water entries — never the brewery's — and the autosave rewrites it
// as version 5. Its amounts that follow the recommendation are saved as null
// and read back as null, not as a blank figure.
// Version 6 (S4b item 1): the water entries carry the typed sparge water in
// place of the water kept in the mash tun; a version-5 document is read with
// the sparge blank, its kept-in-tun figure dropped, and saved back as 6.
// Version 7 (mash pH, item 2): each malt row carries its type for the mash pH
// model and its two lab figures. A version-1 to 6 document is read with each
// malt's type blank ('') and its lab figures blank (MP-Q8: no type the brewer
// did not choose), and saved back as 7.
// Version 8 (S5b item C, AM-Q1 as revised 2026-10-03): the water entries
// carry where the acid goes, with the salts or into the mash. A version-1 to
// 7 document is read with the acid with the salts (AM-S5), and saved back
// as 8.
// Version 9 (°C display toggle, CT-S5): the display settings carry the
// temperature unit, °F or °C, beside Home/Pro and the gravity unit. A
// version-1 to 8 document is read as °F, and saved back as 9. The recipe's
// temperatures are °F in every version.
// Version 10 (Pro unit choices, PU-S5): the display settings carry Pro's
// volume unit (barrels or gallons) and malt weight unit (pounds or 55 lb
// sacks). A version-1 to 9 document is read as barrels and pounds, and saved
// back as 10. The recipe's volumes are gallons and its weights pounds in
// every version.
// Version 11 (cost of a batch, EC-S3): the recipe carries prices — each
// malt's per lb, each kettle and dry hop's per oz, the yeast's per batch —
// and the Cost card's other lines (a name and a cost per batch). A version-1
// to 10 document is read with every price blank and no other lines, and
// saved back as 11.
// Version 12 (the acid aimed at a mash pH, AA-Q4): the water entries carry
// the target mash pH the acid aims at. A version-1 to 11 document is read
// with the engine's default target, 5.4, and saved back as 12.
//
// Recipe file (2026-09-23): export hands the browser the same document the
// autosave writes, as a file; import reads a file with the same reader as
// browser storage. They differ only in failure: storage falls back to the
// defaults silently, a file the brewer picked is refused with a message and
// the recipe on screen is left as it is.
//
// Brewery figures (Brewery defaults, 2026-09-23): the brewery's own figures
// (state.js) are a second document under their own key, with their own
// version (1), apart from the recipe; the recipe's document is unchanged. A
// first visit with nothing saved starts from them. Upgrading an old recipe
// and checking its shape always use the built-in recipe, never the
// brewery's figures, so a recipe loads as it was saved whatever they are.
// Their version 2 (Water saved with the recipe, 2026-10-02) adds their water
// figures; a version-1 document is read with them blank and saved back as
// version 2. Their version 3 (S4b item 1) drops the water kept in the mash
// tun (it is worked out now); a version-1 or 2 document is saved back as 3.
// Their version 4 (°C display toggle, CT-S5) adds the temperature unit; a
// version-1 to 3 document is read with it blank and saved back as 4. Their
// version 5 (Pro unit choices, PU-S5) adds Pro's volume and malt weight
// units; a version-1 to 4 document is read with them blank and saved back
// as 5. Their version 6 (My ingredients, MI-Q8') carries the brewer's own
// malts and hops; a version-1 to 5 document is read with none and saved back
// as 6. A stored brewery that cannot be read is kept aside, as found, under
// its own key before anything overwrites it (K'), as the recipe's is.
//
// Saved rows checked inside (2026-09-23): a document is readable only if its
// every malt, kettle-hop and dry-hop row, and its yeast, carry every field of
// the built-in recipe's rows, each of the same kind (a blank number is a
// number). A saved copy in storage that cannot be read is kept aside, as
// found, under its own key before a new recipe replaces it; a refused file
// is not (it is still on the brewer's disk).

import { PITCH_RATES, SALT_CONTRIBUTIONS_PER_G_GAL, ACIDS, STYLE_FAMILIES, MALT_TYPES, MASH_PH_TARGET } from '@brew/engine';
import {
  defaultRecipeState,
  DEFAULT_DISPLAY,
  emptyBreweryFigures,
  emptyBreweryWater,
  BREWERY_WATER_CHOICES,
  newRecipe,
} from './state.js';
import { TEMPERATURE_UNITS, PRO_VOLUME_UNITS, PRO_MALT_UNITS } from './display.js';
import { myIngredientOf } from './ingredient-search.js';
import { TEST_RESULT_KEYS, TREATMENTS, ACID_PLACES, SPARGE_METHODS, VESSEL_COUNTS } from './water-state.js';

export const STORAGE_KEY = 'brew-design.recipe';
// The latest saved copy that could not be read, kept as found (V3); nothing
// reads it back.
export const UNREADABLE_KEY = 'brew-design.recipe.unreadable';
export const SCHEMA_VERSION = 12;
const READABLE_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, SCHEMA_VERSION];

const MODES = ['home', 'pro'];
const GRAVITY_UNITS = ['plato', 'sg'];

// null -> NaN throughout the recipe subtree (arrays and nested objects).
function reviveNaN(value) {
  if (value === null) return NaN;
  if (Array.isArray(value)) return value.map(reviveNaN);
  if (typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = reviveNaN(value[k]);
    return out;
  }
  return value;
}

// The recipe must carry every top-level key of the default recipe, with the
// same kind of value (array where an array is expected, otherwise the same
// typeof). Element shapes inside arrays are checked by hasRowsOf.
function hasShapeOf(candidate, template) {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false;
  for (const key of Object.keys(template)) {
    const want = template[key];
    const got = candidate[key];
    if (Array.isArray(want)) {
      if (!Array.isArray(got)) return false;
    } else if (typeof got !== typeof want || got === null) {
      return false;
    }
  }
  return true;
}

const isRecord = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

// One row (or the yeast) has every field of its template row, each of the
// template's kind: text is a string; a number is a number, a blank (NaN,
// revived from null) included. Extra fields are ignored.
function hasFieldsOf(row, template) {
  if (!isRecord(row)) return false;
  return Object.keys(template).every((k) => k in row && typeof row[k] === typeof template[k]);
}

// Saved rows checked inside (2026-09-23): every malt, kettle-hop and dry-hop
// row, and the yeast, has all its fields, each of the right kind; ale/lager
// and the yeast character are among the engine's pitch-rate choices; a
// malt's type is blank or one of the mash pH model's. The templates are the
// built-in recipe's own rows.
function hasRowsOf(recipe, template) {
  for (const field of ['malts', 'kettleAdditions', 'dryHops']) {
    if (!recipe[field].every((row) => hasFieldsOf(row, template[field][0]))) return false;
  }
  if (!recipe.malts.every((m) => m.type === '' || MALT_TYPES.includes(m.type))) return false;
  // The Cost card's other lines (EC-S3): a name as text and a cost per batch
  // as a number or blank.
  if (!recipe.otherCosts.every((o) => isRecord(o) && typeof o.name === 'string' && typeof o.costPerBatch === 'number')) {
    return false;
  }
  const { yeast } = recipe;
  return (
    hasFieldsOf(yeast, template.yeast) &&
    Object.keys(PITCH_RATES).includes(yeast.type) &&
    Object.keys(PITCH_RATES[yeast.type]).includes(yeast.density)
  );
}

// Water saved with the recipe (WS-S5): the water entries carry every field,
// each of its kind — a number as a number or blank; a choice among the Water
// tab's own; a salt, an acid or a style the engine knows.
const SALT_KEYS = Object.keys(SALT_CONTRIBUTIONS_PER_G_GAL);
const ACID_KEYS = Object.keys(ACIDS);
const STYLE_IDS = STYLE_FAMILIES.map((s) => s.id);
const isNumber = (v) => typeof v === 'number';
const amountsOf = (o, keys) => isRecord(o) && Object.entries(o).every(([k, v]) => keys.includes(k) && isNumber(v));

function hasWaterOf(water) {
  if (!isRecord(water) || !isRecord(water.source)) return false;
  return (
    TEST_RESULT_KEYS.every((k) => isNumber(water.source[k])) &&
    STYLE_IDS.includes(water.styleId) &&
    ['baking_soda', 'pickling_lime'].includes(water.raiseAlkSource) &&
    Array.isArray(water.enabledSalts) &&
    water.enabledSalts.every((k) => SALT_KEYS.includes(k)) &&
    amountsOf(water.saltOverrides, SALT_KEYS) &&
    (water.acidAmounts === null || amountsOf(water.acidAmounts, ACID_KEYS)) &&
    ACID_KEYS.includes(water.primaryAcid) &&
    typeof water.multiAcid === 'boolean' &&
    TREATMENTS.includes(water.treatment) &&
    ACID_PLACES.includes(water.acidPlace) &&
    typeof water.kettleSalts === 'boolean' &&
    VESSEL_COUNTS.includes(water.vessels) &&
    SPARGE_METHODS.includes(water.spargeMethod) &&
    ['tankTreatedGal', 'tankTopUpGal', 'absorptionQtPerLb', 'spargeGal', 'mashPhTarget'].every((k) => isNumber(water[k]))
  );
}

// Read one document's text. Returns { state } when it is a readable document
// at SCHEMA_VERSION, at version 3 (read with an empty strain and a blank
// fermentation temperature), at version 2 (read also with an empty name,
// style and notes), or at version 1 (read also with the default measurement
// temperatures);
// { newer: version } when it carries a version later than SCHEMA_VERSION;
// otherwise {}. Throws on text that is not JSON.
function readDocument(raw, defaults) {
  const doc = JSON.parse(raw);
  if (!doc || typeof doc !== 'object') return {};
  if (Number.isInteger(doc.version) && doc.version > SCHEMA_VERSION) return { newer: doc.version };
  if (!READABLE_VERSIONS.includes(doc.version)) return {};
  let recipe = reviveNaN(doc.recipe);
  if (doc.version === 1) {
    // Version-1 code never wrote measurementTempF; the defaults supply it.
    recipe = { ...recipe, measurementTempF: { ...defaults.recipe.measurementTempF } };
  }
  if (doc.version === 1 || doc.version === 2) {
    // Version-1 and version-2 code never wrote name, style or notes.
    recipe = { ...recipe, name: '', style: '', notes: '' };
  }
  const yeast = recipe?.yeast;
  if (doc.version <= 3 && yeast && typeof yeast === 'object' && !Array.isArray(yeast)) {
    // Code before version 4 never wrote a strain or a fermentation temperature.
    recipe = { ...recipe, yeast: { ...yeast, name: '', fermTempF: NaN } };
  }
  if (doc.version <= 4 && isRecord(recipe)) {
    // Code before version 5 never wrote the water entries: the built-in
    // recipe's, never the brewery's figures (WS-S3).
    recipe = { ...recipe, water: structuredClone(defaults.recipe.water) };
  } else if (isRecord(recipe?.water) && Number.isNaN(recipe.water.acidAmounts)) {
    // Amounts that follow the recommendation were saved as null.
    recipe = { ...recipe, water: { ...recipe.water, acidAmounts: null } };
  }
  if (doc.version === 5 && isRecord(recipe?.water)) {
    // Version-5 code kept the water left in the mash tun as a typed figure;
    // the sparge water is typed instead (S4b item 1): blank until typed.
    const { keptInTunGal, ...water } = recipe.water;
    recipe = { ...recipe, water: { ...water, spargeGal: NaN } };
  }
  if (doc.version <= 6 && isRecord(recipe) && Array.isArray(recipe.malts)) {
    // Code before version 7 never wrote a malt's type or lab figures: blank
    // (MP-Q8), never a type the brewer did not choose.
    recipe = {
      ...recipe,
      malts: recipe.malts.map((m) =>
        isRecord(m) ? { ...m, type: '', distilledWaterPh: NaN, acidityMeqPerKg: NaN } : m,
      ),
    };
  }
  if (doc.version <= 7 && isRecord(recipe?.water)) {
    // Code before version 8 never wrote where the acid goes: with the salts,
    // as it always went (AM-S5).
    recipe = { ...recipe, water: { ...recipe.water, acidPlace: 'salts' } };
  }
  if (doc.version <= 10 && isRecord(recipe)) {
    // Code before version 11 never wrote a price or an other line: every
    // price blank, no other lines (EC-S3).
    const priced = (rows, key) => (Array.isArray(rows) ? rows.map((r) => (isRecord(r) ? { ...r, [key]: NaN } : r)) : rows);
    recipe = {
      ...recipe,
      malts: priced(recipe.malts, 'pricePerLb'),
      kettleAdditions: priced(recipe.kettleAdditions, 'pricePerOz'),
      dryHops: priced(recipe.dryHops, 'pricePerOz'),
      yeast: isRecord(recipe.yeast) ? { ...recipe.yeast, pricePerBatch: NaN } : recipe.yeast,
      otherCosts: [],
    };
  }
  if (doc.version <= 11 && isRecord(recipe?.water)) {
    // Code before version 12 never wrote a target mash pH: the default (AA-Q4).
    recipe = { ...recipe, water: { ...recipe.water, mashPhTarget: MASH_PH_TARGET } };
  }
  if (!hasShapeOf(recipe, defaults.recipe) || !hasRowsOf(recipe, defaults.recipe)) return {};
  if (!hasWaterOf(recipe.water)) return {};
  if (!MODES.includes(doc.mode) || !GRAVITY_UNITS.includes(doc.proGravityUnit)) return {};
  // Code before version 9 never wrote the temperature unit: °F, as every
  // temperature was shown (CT-S5).
  const temperatureUnit = doc.version <= 8 ? 'F' : doc.temperatureUnit;
  if (!TEMPERATURE_UNITS.includes(temperatureUnit)) return {};
  // Code before version 10 never wrote Pro's volume and malt weight units:
  // barrels and pounds, as Pro always showed them (PU-S5).
  const proVolumeUnit = doc.version <= 9 ? 'bbl' : doc.proVolumeUnit;
  const proMaltUnit = doc.version <= 9 ? 'lb' : doc.proMaltUnit;
  if (!PRO_VOLUME_UNITS.includes(proVolumeUnit) || !PRO_MALT_UNITS.includes(proMaltUnit)) return {};
  return {
    state: { recipe, mode: doc.mode, proGravityUnit: doc.proGravityUnit, temperatureUnit, proVolumeUnit, proMaltUnit },
  };
}

/**
 * Read the persisted document. Returns { recipe, mode, proGravityUnit,
 * temperatureUnit, proVolumeUnit, proMaltUnit } when storage holds a readable
 * document at SCHEMA_VERSION or at version 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 or 1
 * (read as readDocument describes, against `defaults`); otherwise
 * `fallback`, which is `defaults` unless given. A saved copy that cannot be
 * read is first kept aside, as found, under UNREADABLE_KEY, replacing any
 * copy kept before; keeping it is best-effort.
 * Never throws.
 */
export function loadPersisted(storage, defaults, fallback = defaults) {
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return fallback;
  }
  if (raw === null || raw === undefined) return fallback;
  let state;
  try {
    state = readDocument(raw, defaults).state;
  } catch {
    state = undefined; // not JSON
  }
  if (state) return state;
  try {
    storage.setItem(UNREADABLE_KEY, raw);
  } catch {
    // Storage unavailable: the copy cannot be kept; loading goes on.
  }
  return fallback;
}

/**
 * The state the app opens on: the saved recipe, read against the built-in
 * recipe; or, with none readable, a new recipe from the brewery's figures.
 * Never throws.
 */
export function loadStartingState(storage) {
  return loadPersisted(
    storage,
    { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY },
    newRecipe(loadBrewery(storage)),
  );
}

/**
 * The document for { recipe, mode, proGravityUnit, temperatureUnit,
 * proVolumeUnit, proMaltUnit }, as text: what the autosave writes to storage
 * and what an export writes to a file. A caller that names no temperature
 * unit writes °F, and none of Pro's units barrels and pounds: the units shown
 * before the choices.
 */
export function exportRecipeDocument({
  recipe,
  mode,
  proGravityUnit,
  temperatureUnit = DEFAULT_DISPLAY.temperatureUnit,
  proVolumeUnit = DEFAULT_DISPLAY.proVolumeUnit,
  proMaltUnit = DEFAULT_DISPLAY.proMaltUnit,
}) {
  return JSON.stringify({ version: SCHEMA_VERSION, recipe, mode, proGravityUnit, temperatureUnit, proVolumeUnit, proMaltUnit });
}

/**
 * Write the recipe and its display settings as one JSON document under one
 * key (exportRecipeDocument). Never throws: quota, disabled storage, and
 * private mode all degrade to a no-op.
 */
export function savePersisted(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, exportRecipeDocument(state));
  } catch {
    // Storage unavailable: behave as if there is none.
  }
}

/** Remove the persisted document. Never throws. */
export function clearPersisted(storage) {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

export const BREWERY_KEY = 'brew-design.brewery';
// The latest stored brewery that could not be read, kept as found (K');
// nothing reads it back.
export const BREWERY_UNREADABLE_KEY = 'brew-design.brewery.unreadable';
export const BREWERY_VERSION = 6;

// A saved figure: a finite number, or null (blank).
const isFigure = (v) => v === null || Number.isFinite(v);

// The brewery's water figures in a document, or null when one is missing or
// is not a figure: each test result blank or a number; the salts on hand
// blank or a list of the engine's salts; each choice blank or one the Water
// tab offers; each setup figure blank or a number.
function readBreweryWater(w) {
  if (!isRecord(w) || !isRecord(w.source)) return null;
  const out = emptyBreweryWater();
  for (const k of TEST_RESULT_KEYS) {
    if (!isFigure(w.source[k])) return null;
    out.source[k] = w.source[k];
  }
  const salts = w.enabledSalts;
  if (salts !== null && !(Array.isArray(salts) && salts.every((k) => SALT_KEYS.includes(k)))) return null;
  out.enabledSalts = salts === null ? null : [...salts];
  for (const [k, ok] of Object.entries(BREWERY_WATER_CHOICES)) {
    if (w[k] !== null && !ok(w[k])) return null;
    out[k] = w[k];
  }
  for (const k of ['tankTreatedGal', 'tankTopUpGal', 'absorptionQtPerLb']) {
    if (!isFigure(w[k])) return null;
    out[k] = w[k];
  }
  return out;
}

// My ingredients in a document, or null when the two lists are not there or
// an entry is damaged (MI-Q8'): each entry checked as the owner's list is.
function readMyIngredients(mine) {
  if (!isRecord(mine) || !Array.isArray(mine.malts) || !Array.isArray(mine.hops)) return null;
  const malts = mine.malts.map((m) => myIngredientOf('malts', m));
  const hops = mine.hops.map((h) => myIngredientOf('hops', h));
  return [...malts, ...hops].includes(null) ? null : { malts, hops };
}

// The brewery figures in a document, or null when one is missing or is not
// a figure: every key of the blank figures, each blank or of its kind. A
// version-1 document, saved before the water setup, has every water figure
// blank (WS-S4); a version-1 to 3 document, saved before the temperature
// unit, has it blank (CT-S5); a version-1 to 4 document, saved before Pro's
// volume and malt weight units, has them blank (PU-S5); a version-1 to 5
// document, saved before My ingredients, has none.
function readBrewery(b, version) {
  const isObject = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  if (!isObject(b) || !isObject(b.measurementTempF)) return null;
  const out = emptyBreweryFigures();
  for (const k of Object.keys(out)) {
    if (k === 'measurementTempF' || k === 'water' || k === 'ingredients') continue;
    if (k === 'temperatureUnit' && version < 4) continue;
    if ((k === 'proVolumeUnit' || k === 'proMaltUnit') && version < 5) continue;
    if (!(k in b)) return null;
    out[k] = b[k];
  }
  for (const k of Object.keys(out.measurementTempF)) {
    if (!isFigure(b.measurementTempF[k])) return null;
    out.measurementTempF[k] = b.measurementTempF[k];
  }
  const { mode, proGravityUnit, temperatureUnit, proVolumeUnit, proMaltUnit, measurementTempF, water, ingredients, ...numbers } = out;
  if (!Object.values(numbers).every(isFigure)) return null;
  if (mode !== null && !MODES.includes(mode)) return null;
  if (proGravityUnit !== null && !GRAVITY_UNITS.includes(proGravityUnit)) return null;
  if (temperatureUnit !== null && !TEMPERATURE_UNITS.includes(temperatureUnit)) return null;
  if (proVolumeUnit !== null && !PRO_VOLUME_UNITS.includes(proVolumeUnit)) return null;
  if (proMaltUnit !== null && !PRO_MALT_UNITS.includes(proMaltUnit)) return null;
  if (version > 1) {
    out.water = readBreweryWater(b.water);
    if (out.water === null) return null;
  }
  if (version > 5) {
    out.ingredients = readMyIngredients(b.ingredients);
    if (out.ingredients === null) return null;
  }
  return out;
}

/**
 * Read the brewery's figures. Nothing saved, unreadable data, a version
 * other than 1 to 5 or BREWERY_VERSION, or unavailable storage yields
 * `fallback`: every figure blank (the built-in figures) and no saved
 * ingredients, unless given — a save re-reads the stored brewery with the
 * copy on screen as its fallback (K'). A readable version-1 document is read
 * with the water figures blank, a version-2 one without the water kept in
 * the mash tun, a version-1 to 3 one with the temperature unit blank, a
 * version-1 to 4 one with Pro's volume and malt weight units blank, a
 * version-1 to 5 one with no saved ingredients; each is saved back at
 * BREWERY_VERSION (best-effort). A stored copy that cannot be read is first
 * kept aside, as found, under BREWERY_UNREADABLE_KEY, replacing any copy
 * kept before; keeping it is best-effort.
 * Never throws.
 */
export function loadBrewery(storage, fallback) {
  return readStoredBrewery(storage).brewery ?? fallback ?? emptyBreweryFigures();
}

/**
 * The stored brewery and what became of reading it: { status: 'read',
 * brewery } (upgraded and saved back as loadBrewery says), { status: 'none' }
 * with nothing stored, { status: 'unreadable' } for a stored copy that cannot
 * be read — kept aside first, as loadBrewery says — or { status:
 * 'unavailable' } when storage cannot be read at all. A save of one of My
 * ingredients is kept only over a readable brewery or none (MI-S8).
 * Never throws.
 */
export function readStoredBrewery(storage) {
  let raw;
  try {
    raw = storage.getItem(BREWERY_KEY);
  } catch {
    return { status: 'unavailable' };
  }
  if (raw === null || raw === undefined) return { status: 'none' };
  let read;
  try {
    read = readBreweryDocument(raw);
  } catch {
    read = {}; // not JSON
  }
  if (read.brewery) {
    if (read.version !== BREWERY_VERSION) saveBrewery(storage, read.brewery);
    return { status: 'read', brewery: read.brewery };
  }
  try {
    storage.setItem(BREWERY_UNREADABLE_KEY, raw);
  } catch {
    // Storage unavailable: the copy cannot be kept; loading goes on.
  }
  return { status: 'unreadable' };
}

// One brewery document's text, read as storage and the brewery file both
// read it (S4b item 5, K): { brewery, version } when readable at version 1
// to 5 or BREWERY_VERSION (upgraded as loadBrewery says); { newer: version } for a
// later version; otherwise {}. Throws on text that is not JSON.
function readBreweryDocument(raw) {
  const doc = JSON.parse(raw);
  // A document without the brewery's figures (a recipe file, say) is not one.
  if (!doc || typeof doc !== 'object' || !('brewery' in doc)) return {};
  if (Number.isInteger(doc.version) && doc.version > BREWERY_VERSION) return { newer: doc.version };
  if (![1, 2, 3, 4, 5, BREWERY_VERSION].includes(doc.version)) return {};
  const brewery = readBrewery(doc.brewery, doc.version);
  return brewery ? { brewery, version: doc.version } : {};
}

/**
 * Write the brewery's figures as their own document under their own key; a
 * blank figure is written as null. The recipe's document is not touched.
 * Returns whether it was kept (MI-S8). Never throws.
 */
export function saveBrewery(storage, brewery) {
  try {
    storage.setItem(BREWERY_KEY, exportBreweryDocument(brewery));
    return true;
  } catch {
    // Storage unavailable: behave as if there is none.
    return false;
  }
}

/**
 * "Forget my brewery figures": every figure blank, and My ingredients kept
 * (MI-Q14), read from the stored brewery (`onScreen` where none can be read).
 * With no saved ingredients the document is removed. Returns the brewery
 * after. Never throws.
 */
export function clearBrewery(storage, onScreen) {
  const { ingredients } = loadBrewery(storage, onScreen);
  const cleared = { ...emptyBreweryFigures(), ingredients };
  if (ingredients.malts.length + ingredients.hops.length > 0) {
    saveBrewery(storage, cleared);
    return cleared;
  }
  try {
    storage.removeItem(BREWERY_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
  return cleared;
}

// Characters Windows rejects in a file name, and control characters.
const REJECTED_IN_FILE_NAME = /[<>:"/\\|?*\u0000-\u001f\u007f]/g;
const FALLBACK_FILE_NAME = 'Brew Design recipe';

/**
 * The exported file's name: the recipe name with the characters a file
 * system rejects turned to spaces, runs of spaces collapsed and the ends
 * trimmed, then the local date as YYYY-MM-DD and ".json". A name with
 * nothing left uses "Brew Design recipe".
 */
export function recipeFileName(name, date) {
  const cleaned = String(name ?? '').replace(REJECTED_IN_FILE_NAME, ' ').replace(/\s+/g, ' ').trim();
  const pad = (n) => String(n).padStart(2, '0');
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${cleaned || FALLBACK_FILE_NAME} ${day}.json`;
}

const UNCHANGED = 'The recipe on screen is unchanged.';

/**
 * Import a recipe file's text. A readable document is offered to
 * `confirmReplace(state)` before anything is replaced; the caller applies the
 * returned state, and the autosave makes it the working copy. Returns
 *   { outcome: 'replaced', state }  confirmed
 *   { outcome: 'declined' }         not confirmed
 *   { outcome: 'refused', message } not a recipe, damaged, or newer than
 *                                   this version reads; nothing is asked.
 * Never throws for any text.
 */
export function importRecipeFile(text, defaults, confirmReplace) {
  let read;
  try {
    read = readDocument(text, defaults);
  } catch {
    read = {};
  }
  if (read.newer !== undefined) {
    return {
      outcome: 'refused',
      message:
        'Not imported: this recipe file was saved by a newer version of Brew Design ' +
        `(file version ${read.newer}; this app reads up to version ${SCHEMA_VERSION}). ${UNCHANGED}`,
    };
  }
  if (!read.state) {
    return {
      outcome: 'refused',
      message: `Not imported: this file is not a Brew Design recipe, or it is damaged. ${UNCHANGED}`,
    };
  }
  if (!confirmReplace(read.state)) return { outcome: 'declined' };
  return { outcome: 'replaced', state: read.state };
}

// My brewery banner (S4b item 4): "Not now" is kept in this browser under its
// own key, apart from the recipe and the brewery's figures; nothing else reads
// it. Best-effort: unavailable storage reads as not dismissed; never throws.
export const BANNER_KEY = 'brew-design.banner.brewery-not-now';

export function loadBannerDismissed(storage) {
  try {
    return storage.getItem(BANNER_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveBannerDismissed(storage, dismissed) {
  try {
    if (dismissed) storage.setItem(BANNER_KEY, 'true');
    else storage.removeItem(BANNER_KEY);
  } catch {
    // Storage unavailable: the banner comes back next visit.
  }
}

// --- Brewery file (S4b item 5) -------------------------------------------------
// The brewery's figures as a file, to move them between sites and devices:
// byte for byte the document this browser keeps (BF-S1), read back by the
// same reader, versions and upgrades included (BF-S3). Import asks before it
// replaces the brewery's figures and never touches the recipe (BF-S2).

/** The brewery document, as text: what storage keeps and the file carries. */
export function exportBreweryDocument(brewery) {
  return JSON.stringify({ version: BREWERY_VERSION, brewery });
}

/** The brewery file's name: "Brew Design brewery" and the local date. */
export function breweryFileName(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `Brew Design brewery ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`;
}

const BREWERY_UNCHANGED = 'Your brewery figures are unchanged.';

const savedCount = (brewery) => (brewery?.ingredients?.malts.length ?? 0) + (brewery?.ingredients?.hops.length ?? 0);
const savedText = (n) => `${n} saved ingredient${n === 1 ? '' : 's'}`;

/**
 * The brewery import's one question (MI-S7', MI-Q13): it replaces the
 * figures and My ingredients, and names how many of the brewer's saved
 * ingredients go — all of them when the file has none (one saved before My
 * ingredients, say).
 */
export function breweryImportQuestion(fileName, current, incoming) {
  const question = `Replace your brewery's figures and My ingredients with those in "${fileName}"? The recipe on screen is unchanged.`;
  const going = savedCount(current);
  if (going === 0) return question;
  const coming = savedCount(incoming);
  return coming === 0
    ? `${question} The file has none in My ingredients: your ${savedText(going)} will go.`
    : `${question} Your ${savedText(going)} will be replaced by the file's ${coming}.`;
}

/**
 * Import a brewery file's text. Returns { outcome: 'replaced', brewery } when
 * readable and confirmed by `confirmReplace(brewery)`, which is shown the
 * file's brewery; { outcome: 'declined' } when not confirmed, or
 * { outcome: 'refused', message } — not a brewery file, damaged, or newer —
 * without asking. Never throws for any text.
 */
export function importBreweryFile(text, confirmReplace) {
  let read;
  try {
    read = readBreweryDocument(text);
  } catch {
    read = {};
  }
  if (read.newer !== undefined) {
    return {
      outcome: 'refused',
      message:
        'Not imported: this brewery file was saved by a newer version of Brew Design ' +
        `(file version ${read.newer}; this app reads up to version ${BREWERY_VERSION}). ${BREWERY_UNCHANGED}`,
    };
  }
  if (!read.brewery) {
    return {
      outcome: 'refused',
      message: `Not imported: this file is not a Brew Design brewery file, or it is damaged. ${BREWERY_UNCHANGED}`,
    };
  }
  if (!confirmReplace(read.brewery)) return { outcome: 'declined' };
  return { outcome: 'replaced', brewery: read.brewery };
}
