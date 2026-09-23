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

export const STORAGE_KEY = 'brew-design.recipe';
export const SCHEMA_VERSION = 3;
const READABLE_VERSIONS = [1, 2, SCHEMA_VERSION];

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
// typeof). Element shapes inside arrays are not checked.
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

/**
 * Read the persisted document. Returns { recipe, mode, proGravityUnit } when
 * storage holds a readable document at SCHEMA_VERSION, at version 2 (read
 * with an empty name, style and notes), or at version 1 (read also with the
 * default measurement temperatures); otherwise `defaults`.
 * Never throws.
 */
export function loadPersisted(storage, defaults) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null || raw === undefined) return defaults;
    const doc = JSON.parse(raw);
    if (!doc || typeof doc !== 'object' || !READABLE_VERSIONS.includes(doc.version)) return defaults;
    let recipe = reviveNaN(doc.recipe);
    if (doc.version === 1) {
      // Version-1 code never wrote measurementTempF; the defaults supply it.
      recipe = { ...recipe, measurementTempF: { ...defaults.recipe.measurementTempF } };
    }
    if (doc.version === 1 || doc.version === 2) {
      // Version-1 and version-2 code never wrote name, style or notes.
      recipe = { ...recipe, name: '', style: '', notes: '' };
    }
    if (!hasShapeOf(recipe, defaults.recipe)) return defaults;
    if (!MODES.includes(doc.mode) || !GRAVITY_UNITS.includes(doc.proGravityUnit)) return defaults;
    return { recipe, mode: doc.mode, proGravityUnit: doc.proGravityUnit };
  } catch {
    return defaults;
  }
}

/**
 * Write { recipe, mode, proGravityUnit } as one JSON document under one key.
 * Never throws: quota, disabled storage, and private mode all degrade to a
 * no-op.
 */
export function savePersisted(storage, { recipe, mode, proGravityUnit }) {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, recipe, mode, proGravityUnit }),
    );
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
