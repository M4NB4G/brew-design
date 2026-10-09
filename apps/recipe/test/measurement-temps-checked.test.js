// measurement-temps-checked.test.js
// Scenarios for "Measurement temperatures checked inside" (scope table agreed
// 2026-10-08, docs/items/measurement-temps-checked-inside.md), named from its
// sentences MT-S1 to MT-S4. A saved recipe or recipe file of version 2 or
// later is readable only if its pre-boil, post-boil and fermentation
// measurement temperatures are each a number or blank.

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
  SCHEMA_VERSION,
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
const KINDS = ['preBoil', 'postBoil', 'ferment'];
const DAMAGED =
  'Not imported: this file is not a Brew Design recipe, or it is damaged. The recipe on screen is unchanged.';

// A saved document, as plain JSON (blanks as null), with temperatures other
// than the reference so a reading of each one shows.
const savedDoc = () => {
  const doc = JSON.parse(exportRecipeDocument(defaults()));
  doc.recipe.measurementTempF = { preBoil: 150, postBoil: 180, ferment: 68 };
  return doc;
};

// Readable through the storage path: the saved recipe comes back, not the
// fallback.
function readable(doc) {
  const s = fakeStorage();
  s.setItem(STORAGE_KEY, JSON.stringify(doc));
  const fallback = { fallback: true };
  return loadPersisted(s, defaults(), fallback) !== fallback;
}

// MT-S2: a file so damaged is refused with the damaged message, nothing asked
// and the recipe on screen (and storage) untouched; a saved copy so damaged
// starts a new recipe and is kept aside as found.
function expectRefusedAndKeptAside(doc, label) {
  const raw = JSON.stringify(doc);

  const s = fakeStorage();
  const onScreen = { ...defaults(), recipe: { ...defaultRecipeState(), name: 'On screen' } };
  savePersisted(s, onScreen);
  const before = new Map(s._map);
  const asked = [];
  const result = importRecipeFile(raw, defaults(), (st) => asked.push(st));
  expect(result.outcome, label).toBe('refused');
  expect(result.state, label).toBeUndefined();
  expect(result.message, label).toBe(DAMAGED);
  expect(asked, label).toHaveLength(0);
  expect(new Map(s._map), label).toEqual(before);

  const saved = fakeStorage();
  saved.setItem(STORAGE_KEY, raw);
  expect(loadStartingState(saved), label).toEqual(defaults());
  expect(saved.getItem(UNREADABLE_KEY), label).toBe(raw);
}

describe('measurement temperatures checked inside', () => {
  it('a temperature as text makes the document unreadable', () => {
    // The undamaged document reads, so each case below fails on the damage alone.
    expect(readable(savedDoc())).toBe(true);
    // The case the roadmap names: the post-boil temperature as the text "180".
    const post = savedDoc();
    post.recipe.measurementTempF.postBoil = '180';
    expect(readable(post)).toBe(false);
    expectRefusedAndKeptAside(post, 'postBoil "180"');
    // Each of the three, as text, as a list, as true/false or as an object;
    // and the three as a list in place of their object.
    for (const kind of KINDS) {
      for (const wrong of ['180', '', [], [180], true, { f: 180 }]) {
        const d = savedDoc();
        d.recipe.measurementTempF[kind] = wrong;
        expect(readable(d), `${kind} = ${JSON.stringify(wrong)}`).toBe(false);
      }
    }
    const asList = savedDoc();
    asList.recipe.measurementTempF = [150, 180, 68];
    expect(readable(asList)).toBe(false);
    expectRefusedAndKeptAside(asList, 'temperatures as a list');
  });

  it('a missing temperature makes it unreadable', () => {
    for (const kind of KINDS) {
      const d = savedDoc();
      delete d.recipe.measurementTempF[kind];
      expect(readable(d), `without ${kind}`).toBe(false);
      expectRefusedAndKeptAside(d, `without ${kind}`);
    }
    // Every version from 2 on wrote the three; each is checked there too.
    for (let version = 2; version <= SCHEMA_VERSION; version++) {
      const d = savedDoc();
      d.version = version;
      delete d.recipe.measurementTempF.postBoil;
      expect(readable(d), `version ${version} without postBoil`).toBe(false);
    }
  });

  it('version 1 still reads at 60 °F, a blank one as blank, extra fields ignored', () => {
    // Version 1, saved before the temperatures: the three at 60 °F.
    const v1 = savedDoc();
    v1.version = 1;
    delete v1.recipe.measurementTempF;
    const s1 = fakeStorage();
    s1.setItem(STORAGE_KEY, JSON.stringify(v1));
    expect(loadStartingState(s1).recipe.measurementTempF).toEqual({ preBoil: 60, postBoil: 60, ferment: 60 });
    expect(s1.getItem(UNREADABLE_KEY)).toBeNull();

    // A blank temperature (saved as null) reads as blank, each of the three,
    // from storage and from a file.
    for (const kind of KINDS) {
      const d = savedDoc();
      d.recipe.measurementTempF[kind] = null;
      const s = fakeStorage();
      s.setItem(STORAGE_KEY, JSON.stringify(d));
      const loaded = loadStartingState(s);
      expect(loaded.recipe.measurementTempF[kind], `blank ${kind}`).toBeNaN();
      expect(s.getItem(UNREADABLE_KEY), `blank ${kind}`).toBeNull();
      const file = importRecipeFile(JSON.stringify(d), defaults(), () => true);
      expect(file.outcome, `blank ${kind} file`).toBe('replaced');
      expect(file.state.recipe.measurementTempF[kind], `blank ${kind} file`).toBeNaN();
    }

    // An extra field beside the three is ignored: the document reads, and the
    // three are as saved.
    const extra = savedDoc();
    extra.recipe.measurementTempF.mash = 152;
    const s = fakeStorage();
    s.setItem(STORAGE_KEY, JSON.stringify(extra));
    const loaded = loadStartingState(s);
    expect(s.getItem(UNREADABLE_KEY)).toBeNull();
    for (const kind of KINDS) {
      expect(loaded.recipe.measurementTempF[kind]).toBe(extra.recipe.measurementTempF[kind]);
    }
    expect(importRecipeFile(JSON.stringify(extra), defaults(), () => true).outcome).toBe('replaced');
  });

  it('nothing else changes', () => {
    // A readable document at every version from 2 on reads its three
    // temperatures as saved.
    for (let version = 2; version <= SCHEMA_VERSION; version++) {
      const d = savedDoc();
      d.version = version;
      const s = fakeStorage();
      s.setItem(STORAGE_KEY, JSON.stringify(d));
      expect(loadStartingState(s).recipe.measurementTempF, `version ${version}`).toEqual({
        preBoil: 150,
        postBoil: 180,
        ferment: 68,
      });
      expect(s.getItem(UNREADABLE_KEY), `version ${version}`).toBeNull();
    }
    // A current document reads back whole, and is saved back byte for byte
    // as it was read: no saved format changes.
    const state = { ...defaults(), recipe: { ...defaultRecipeState(), measurementTempF: { preBoil: 150, postBoil: NaN, ferment: 68 } } };
    const s = fakeStorage();
    savePersisted(s, state);
    const raw = s.getItem(STORAGE_KEY);
    expect(JSON.parse(raw).version).toBe(SCHEMA_VERSION);
    const loaded = loadPersisted(s, defaults());
    expect(loaded).toEqual(state);
    savePersisted(s, loaded);
    expect(s.getItem(STORAGE_KEY)).toBe(raw);
    expect(exportRecipeDocument(loaded)).toBe(raw);
  });
});
