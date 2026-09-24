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
//
// Saved rows checked inside (2026-09-23): a document is readable only if its
// every malt, kettle-hop and dry-hop row, and its yeast, carry every field of
// the built-in recipe's rows, each of the same kind (a blank number is a
// number). A saved copy in storage that cannot be read is kept aside, as
// found, under its own key before a new recipe replaces it; a refused file
// is not (it is still on the brewer's disk).

import { PITCH_RATES } from '@brew/engine';
import { defaultRecipeState, DEFAULT_DISPLAY, emptyBreweryFigures, newRecipe } from './state.js';

export const STORAGE_KEY = 'brew-design.recipe';
// The latest saved copy that could not be read, kept as found (V3); nothing
// reads it back.
export const UNREADABLE_KEY = 'brew-design.recipe.unreadable';
export const SCHEMA_VERSION = 4;
const READABLE_VERSIONS = [1, 2, 3, SCHEMA_VERSION];

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
// and the yeast character are among the engine's pitch-rate choices. The
// templates are the built-in recipe's own rows.
function hasRowsOf(recipe, template) {
  for (const field of ['malts', 'kettleAdditions', 'dryHops']) {
    if (!recipe[field].every((row) => hasFieldsOf(row, template[field][0]))) return false;
  }
  const { yeast } = recipe;
  return (
    hasFieldsOf(yeast, template.yeast) &&
    Object.keys(PITCH_RATES).includes(yeast.type) &&
    Object.keys(PITCH_RATES[yeast.type]).includes(yeast.density)
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
  if (!hasShapeOf(recipe, defaults.recipe) || !hasRowsOf(recipe, defaults.recipe)) return {};
  if (!MODES.includes(doc.mode) || !GRAVITY_UNITS.includes(doc.proGravityUnit)) return {};
  return { state: { recipe, mode: doc.mode, proGravityUnit: doc.proGravityUnit } };
}

/**
 * Read the persisted document. Returns { recipe, mode, proGravityUnit } when
 * storage holds a readable document at SCHEMA_VERSION or at version 3, 2 or 1
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
 * The document for { recipe, mode, proGravityUnit }, as text: what the
 * autosave writes to storage and what an export writes to a file.
 */
export function exportRecipeDocument({ recipe, mode, proGravityUnit }) {
  return JSON.stringify({ version: SCHEMA_VERSION, recipe, mode, proGravityUnit });
}

/**
 * Write { recipe, mode, proGravityUnit } as one JSON document under one key.
 * Never throws: quota, disabled storage, and private mode all degrade to a
 * no-op.
 */
export function savePersisted(storage, { recipe, mode, proGravityUnit }) {
  try {
    storage.setItem(STORAGE_KEY, exportRecipeDocument({ recipe, mode, proGravityUnit }));
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
export const BREWERY_VERSION = 1;

// A saved figure: a finite number, or null (blank).
const isFigure = (v) => v === null || Number.isFinite(v);

// The brewery figures in a document, or null when one is missing or is not
// a figure: every key of the blank figures, each blank or of its kind.
function readBrewery(b) {
  const isObject = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
  if (!isObject(b) || !isObject(b.measurementTempF)) return null;
  const out = emptyBreweryFigures();
  for (const k of Object.keys(out)) {
    if (k === 'measurementTempF') continue;
    if (!(k in b)) return null;
    out[k] = b[k];
  }
  for (const k of Object.keys(out.measurementTempF)) {
    if (!isFigure(b.measurementTempF[k])) return null;
    out.measurementTempF[k] = b.measurementTempF[k];
  }
  const { mode, proGravityUnit, measurementTempF, ...numbers } = out;
  if (!Object.values(numbers).every(isFigure)) return null;
  if (mode !== null && !MODES.includes(mode)) return null;
  if (proGravityUnit !== null && !GRAVITY_UNITS.includes(proGravityUnit)) return null;
  return out;
}

/**
 * Read the brewery's figures. Nothing saved, unreadable data, any version
 * but BREWERY_VERSION, or unavailable storage yields every figure blank (the
 * built-in figures). Never throws.
 */
export function loadBrewery(storage) {
  try {
    const raw = storage.getItem(BREWERY_KEY);
    if (raw === null || raw === undefined) return emptyBreweryFigures();
    const doc = JSON.parse(raw);
    if (!doc || typeof doc !== 'object' || doc.version !== BREWERY_VERSION) return emptyBreweryFigures();
    return readBrewery(doc.brewery) ?? emptyBreweryFigures();
  } catch {
    return emptyBreweryFigures();
  }
}

/**
 * Write the brewery's figures as their own document under their own key; a
 * blank figure is written as null. The recipe's document is not touched.
 * Never throws.
 */
export function saveBrewery(storage, brewery) {
  try {
    storage.setItem(BREWERY_KEY, JSON.stringify({ version: BREWERY_VERSION, brewery }));
  } catch {
    // Storage unavailable: behave as if there is none.
  }
}

/** "Forget my brewery figures": remove their document. Never throws. */
export function clearBrewery(storage) {
  try {
    storage.removeItem(BREWERY_KEY);
  } catch {
    // Storage unavailable: nothing to clear.
  }
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
