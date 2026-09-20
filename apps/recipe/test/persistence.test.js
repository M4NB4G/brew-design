// persistence.test.js
// Scenarios for the Persistence item (scope table agreed 2026-09-20), named
// from its sentences S1–S7. Storage is a Map-backed fake so the suite stays
// DOM-free. S8 (autosave wiring) is proven at the far end, in the browser.

import { describe, it, expect } from 'vitest';
import {
  loadPersisted,
  savePersisted,
  clearPersisted,
  STORAGE_KEY,
  SCHEMA_VERSION,
} from '../src/persistence.js';
import { defaultRecipeState } from '../src/state.js';

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

function throwingStorage() {
  const boom = () => {
    throw new Error('storage unavailable');
  };
  return { getItem: boom, setItem: boom, removeItem: boom };
}

const defaults = () => ({ recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' });

describe('persistence', () => {
  // S1, S7
  it('a saved recipe is restored on load, in canonical units, under one versioned key', () => {
    const s = fakeStorage();
    const edited = {
      ...defaultRecipeState(),
      preBoilVolGal: 16,
      malts: [{ name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 }],
    };
    savePersisted(s, { recipe: edited, mode: 'home', proGravityUnit: 'plato' });

    // one key, one JSON document, carrying the schema version
    expect([...s._map.keys()]).toEqual([STORAGE_KEY]);
    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(SCHEMA_VERSION);
    // canonical field names and units — gallons and pounds, not bbl or display values
    expect(doc.recipe.preBoilVolGal).toBe(16);
    expect(doc.recipe.malts[0].weightLb).toBe(27);

    expect(loadPersisted(s, defaults()).recipe).toEqual(edited);
  });

  // S1 — a cleared field is NaN in state; JSON has no NaN, so it must come back as NaN,
  // never as 0 (null * x === 0 would silently change a number) and never as null.
  it('a cleared field round-trips as NaN, never as 0 or null', () => {
    const s = fakeStorage();
    const edited = { ...defaultRecipeState(), efficiency: NaN };
    edited.malts = [{ ...edited.malts[0], weightLb: NaN }, edited.malts[1]];
    savePersisted(s, { recipe: edited, mode: 'home', proGravityUnit: 'plato' });
    const loaded = loadPersisted(s, defaults());
    expect(Number.isNaN(loaded.recipe.efficiency)).toBe(true);
    expect(Number.isNaN(loaded.recipe.malts[0].weightLb)).toBe(true);
  });

  // S2
  it('display settings are restored on load', () => {
    const s = fakeStorage();
    savePersisted(s, { recipe: defaultRecipeState(), mode: 'pro', proGravityUnit: 'sg' });
    const loaded = loadPersisted(s, defaults());
    expect(loaded.mode).toBe('pro');
    expect(loaded.proGravityUnit).toBe('sg');
  });

  // S3
  it('reset removes the saved copy and load returns the defaults', () => {
    const s = fakeStorage();
    savePersisted(s, {
      recipe: { ...defaultRecipeState(), preBoilVolGal: 99 },
      mode: 'pro',
      proGravityUnit: 'sg',
    });
    clearPersisted(s);
    expect(s._map.size).toBe(0);
    expect(loadPersisted(s, defaults())).toEqual(defaults());
  });

  // S4
  it('nothing saved yields the defaults', () => {
    expect(loadPersisted(fakeStorage(), defaults())).toEqual(defaults());
  });

  // S5 — not JSON, not an object, a different schema version, a recipe missing its
  // shape, or a display setting outside its enum: the whole document is unreadable.
  it('unreadable saved data yields the defaults', () => {
    const good = defaultRecipeState();
    const cases = [
      '{not json',
      '"a string"',
      '42',
      'null',
      JSON.stringify({ version: SCHEMA_VERSION + 1, recipe: good, mode: 'pro', proGravityUnit: 'sg' }),
      JSON.stringify({ version: SCHEMA_VERSION, recipe: {}, mode: 'home', proGravityUnit: 'plato' }),
      JSON.stringify({ version: SCHEMA_VERSION, recipe: { ...good, malts: 5 }, mode: 'home', proGravityUnit: 'plato' }),
      JSON.stringify({ version: SCHEMA_VERSION, recipe: good, mode: 'banana', proGravityUnit: 'plato' }),
      JSON.stringify({ version: SCHEMA_VERSION, recipe: good, mode: 'home', proGravityUnit: 'brix' }),
    ];
    for (const raw of cases) {
      const s = fakeStorage();
      s.setItem(STORAGE_KEY, raw);
      expect(loadPersisted(s, defaults()), raw).toEqual(defaults());
    }
  });

  // S6 — a storage that throws, and a null storage (window.localStorage access refused)
  it('unavailable storage is a no-op: load yields defaults, save and clear do not throw', () => {
    for (const s of [throwingStorage(), null, undefined]) {
      expect(loadPersisted(s, defaults())).toEqual(defaults());
      expect(() => savePersisted(s, defaults())).not.toThrow();
      expect(() => clearPersisted(s)).not.toThrow();
    }
  });
});
