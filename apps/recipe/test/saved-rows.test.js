// saved-rows.test.js
// Scenarios for "Saved rows checked inside" (scope table agreed 2026-09-23,
// docs/items/saved-rows-checked.md), named from its sentences V-S1 to V-S4
// and decisions V1 to V3. A saved recipe or recipe file is readable only if
// every malt, kettle-hop and dry-hop row, and the yeast, has all its fields,
// each of the right kind.

import { describe, it, expect } from 'vitest';
import { defaultRecipeState, DEFAULT_DISPLAY } from '../src/state.js';
import {
  loadPersisted,
  loadStartingState,
  savePersisted,
  exportRecipeDocument,
  importRecipeFile,
  STORAGE_KEY,
  UNREADABLE_KEY,
} from '../src/persistence.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      m.set(k, String(v));
    },
    removeItem: (k) => {
      m.delete(k);
    },
    _map: m,
  };
}

const defaults = () => ({ recipe: defaultRecipeState(), ...DEFAULT_DISPLAY });

// A saved document, as plain JSON (blanks as null), for the test to damage.
// Every row kind is present: two malts, two kettle hops, one dry hop.
const savedDoc = () => JSON.parse(exportRecipeDocument(defaults()));

// Readable through the storage path: the saved recipe comes back, not the
// fallback.
function readable(doc) {
  const s = fakeStorage();
  s.setItem(STORAGE_KEY, JSON.stringify(doc));
  const fallback = { fallback: true };
  return loadPersisted(s, defaults(), fallback) !== fallback;
}

// The fields of each row kind, and a value of the wrong kind for each.
const ROWS = {
  malts: { name: 5, weightLb: '10', fgdb: '0.8', colorL: true },
  kettleAdditions: { name: 5, timeMin: '60', wortTempF: '212', weightOz: '1', alphaAcidFraction: {} },
  dryHops: { name: 5, weightOz: '2' },
};
const YEAST_WRONG = { type: 'wine', density: 'medium', name: 5, fermTempF: '66' };

describe('saved rows checked inside', () => {
  it('a malt, kettle-hop or dry-hop row missing a field, or holding the wrong kind of value, makes the recipe unreadable', () => {
    // The undamaged document is readable, and a blank number in a row is a
    // number (blank), so the cases below fail on the damage alone.
    expect(readable(savedDoc())).toBe(true);
    const blank = savedDoc();
    blank.recipe.malts[0].weightLb = null;
    expect(readable(blank)).toBe(true);

    for (const [field, wrong] of Object.entries(ROWS)) {
      for (const key of Object.keys(wrong)) {
        const missing = savedDoc();
        delete missing.recipe[field][0][key];
        expect(readable(missing), `${field} row without ${key}`).toBe(false);

        const wrongKind = savedDoc();
        wrongKind.recipe[field][0][key] = wrong[key];
        expect(readable(wrongKind), `${field} ${key} = ${JSON.stringify(wrong[key])}`).toBe(false);
      }
      // A row that is not an object: text, a blank, a list, a number.
      for (const notARow of ['Pale 2-Row', null, [], 3]) {
        const d = savedDoc();
        d.recipe[field][0] = notARow;
        expect(readable(d), `${field} row = ${JSON.stringify(notARow)}`).toBe(false);
      }
      // A later row is checked as well as the first.
      const later = savedDoc();
      delete later.recipe[field][later.recipe[field].length - 1].name;
      expect(readable(later), `${field}: last row without name`).toBe(false);
    }
  });

  it('a yeast missing a field, or with a type or character outside its choices, makes the recipe unreadable', () => {
    for (const key of Object.keys(YEAST_WRONG)) {
      const missing = savedDoc();
      delete missing.recipe.yeast[key];
      expect(readable(missing), `yeast without ${key}`).toBe(false);

      const wrongKind = savedDoc();
      wrongKind.recipe.yeast[key] = YEAST_WRONG[key];
      expect(readable(wrongKind), `yeast ${key} = ${JSON.stringify(YEAST_WRONG[key])}`).toBe(false);
    }
    // Every choice of type and character is readable; a blank temperature too.
    for (const type of ['ale', 'lager']) {
      for (const density of ['high', 'mod', 'low']) {
        const d = savedDoc();
        d.recipe.yeast = { ...d.recipe.yeast, type, density, fermTempF: null };
        expect(readable(d), `${type} ${density}`).toBe(true);
      }
    }
  });

  it('a damaged recipe file is refused with the damaged message and changes nothing on screen', () => {
    const s = fakeStorage();
    const onScreen = { ...defaults(), recipe: { ...defaultRecipeState(), name: 'On screen', preBoilVolGal: 9 } };
    savePersisted(s, onScreen);
    const before = new Map(s._map);

    const damaged = savedDoc();
    delete damaged.recipe.malts[0].name;
    const asked = [];
    const result = importRecipeFile(JSON.stringify(damaged), defaults(), (st) => asked.push(st));
    expect(result.outcome).toBe('refused');
    expect(result.state).toBeUndefined();
    expect(result.message).toBe(
      'Not imported: this file is not a Brew Design recipe, or it is damaged. The recipe on screen is unchanged.',
    );
    expect(asked).toHaveLength(0);
    // Storage holds exactly what it held: the working copy, and nothing kept aside.
    expect(new Map(s._map)).toEqual(before);
    expect(loadPersisted(s, defaults()).recipe.name).toBe('On screen');
  });

  it('a damaged saved copy starts a new recipe, and the damaged copy is kept aside, as it was', () => {
    const damaged = savedDoc();
    damaged.recipe.name = 'My damaged IPA';
    delete damaged.recipe.kettleAdditions[1].name;
    const raw = JSON.stringify(damaged);

    const s = fakeStorage();
    s.setItem(STORAGE_KEY, raw);
    const started = loadStartingState(s);
    // A new recipe (no brewery figures: the built-in one).
    expect(started).toEqual(defaults());
    // The damaged text, byte for byte, under its own key.
    expect(s.getItem(UNREADABLE_KEY)).toBe(raw);

    // The autosave writes the new recipe over the saved copy; the kept copy stays.
    savePersisted(s, started);
    expect(s.getItem(UNREADABLE_KEY)).toBe(raw);
    // A second load reads the new recipe and keeps the one copy as it was.
    expect(loadStartingState(s)).toEqual(defaults());
    expect(s.getItem(UNREADABLE_KEY)).toBe(raw);
    expect([...s._map.keys()].sort()).toEqual([STORAGE_KEY, UNREADABLE_KEY].sort());

    // Loading the same damaged copy twice (no autosave between) keeps one copy.
    const twice = fakeStorage();
    twice.setItem(STORAGE_KEY, raw);
    loadStartingState(twice);
    loadStartingState(twice);
    expect(twice.getItem(UNREADABLE_KEY)).toBe(raw);
    expect(twice._map.size).toBe(2);

    // Text that is not JSON, and a newer version's document, are kept as found;
    // the next unreadable copy replaces the one kept before.
    for (const text of ['{"version":4,"recipe":', JSON.stringify({ ...damaged, version: 9 })]) {
      s.setItem(STORAGE_KEY, text);
      expect(loadStartingState(s)).toEqual(defaults());
      expect(s.getItem(UNREADABLE_KEY)).toBe(text);
    }

    // Blocked storage: reading throws, or writing throws. A new recipe, and
    // nothing throws.
    const blocked = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadStartingState(blocked)).toEqual(defaults());
    expect(loadStartingState(null)).toEqual(defaults());
    const readOnly = { ...fakeStorage(), setItem: blocked.setItem };
    readOnly.getItem = (k) => (k === STORAGE_KEY ? raw : null);
    expect(loadStartingState(readOnly)).toEqual(defaults());
  });

  it('every earlier version\'s saved recipe still loads, blanks as blanks, and unknown extra fields are ignored (the guard)', () => {
    // A recipe with a blank in every number of every row, as each version wrote it.
    const blanked = () => {
      const r = savedDoc().recipe;
      for (const field of Object.keys(ROWS)) {
        r[field] = r[field].map((row) => {
          const out = { ...row };
          for (const k of Object.keys(out)) if (k !== 'name') out[k] = null;
          return out;
        });
      }
      return r;
    };
    const asVersion = (version) => {
      const r = blanked();
      if (version <= 3) r.yeast = { type: r.yeast.type, density: r.yeast.density };
      if (version <= 2) {
        delete r.name;
        delete r.style;
        delete r.notes;
      }
      if (version === 1) delete r.measurementTempF;
      return { version, recipe: r, mode: 'pro', proGravityUnit: 'sg' };
    };

    for (const version of [1, 2, 3, 4]) {
      const doc = asVersion(version);
      // Unknown extra fields in a row, the yeast and the recipe feed nothing.
      doc.recipe.malts[0].supplier = 'Simpsons';
      doc.recipe.kettleAdditions[0].form = 'pellet';
      doc.recipe.dryHops[0].day = 3;
      doc.recipe.yeast.lab = 'Fermentis';
      doc.recipe.brewer = 'M.P.';

      const s = fakeStorage();
      s.setItem(STORAGE_KEY, JSON.stringify(doc));
      const loaded = loadStartingState(s);
      expect(loaded.mode, `version ${version}`).toBe('pro');
      for (const field of Object.keys(ROWS)) {
        loaded.recipe[field].forEach((row, i) => {
          expect(row.name, `version ${version} ${field} ${i}`).toBe(doc.recipe[field][i].name);
          for (const k of Object.keys(ROWS[field]).filter((k) => k !== 'name')) {
            expect(row[k], `version ${version} ${field} ${i} ${k}`).toBeNaN();
          }
        });
      }
      expect(loaded.recipe.yeast.fermTempF, `version ${version}`).toBeNaN();
      expect(s.getItem(UNREADABLE_KEY), `version ${version}`).toBeNull();

      // A file of the same document is imported, not refused.
      expect(importRecipeFile(JSON.stringify(doc), defaults(), () => true).outcome).toBe('replaced');
    }
  });
});
