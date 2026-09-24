// identity.test.js
// Scenarios for the Recipe identity item (scope table agreed 2026-09-22,
// docs/items/recipe-identity.md), named from its sentences S1, S3 and S4.
// The version-1 and version-2 migrations (S5) are the rewritten scenarios in
// options.test.js; the smoke test's reference state carries the three fields
// empty (S6); S2 is layout, proved at the far end in the browser.

import { describe, it, expect } from 'vitest';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import { loadPersisted, savePersisted, STORAGE_KEY } from '../src/persistence.js';

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

const defaults = () => ({ recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' });

// Filled identity text, including text that looks like a number, a line
// break, and a non-ASCII character: none of it may reach a calculation or
// come back as anything but the same text.
const FILLED = {
  name: '1.060',
  style: '21A American IPA',
  notes: 'Mash 152 °F for 60 min.\nWater: 100 ppm Ca, SO4:Cl 3:1.\nLast time: stuck at 1.020.',
};

describe('recipe identity', () => {
  // S1
  it('a new recipe has an empty name, style and notes', () => {
    const s = defaultRecipeState();
    expect(s.name).toBe('');
    expect(s.style).toBe('');
    expect(s.notes).toBe('');
  });

  // S3
  it('the three fields reach no calculation: every derived number is identical with them empty and filled', () => {
    const empty = defaultRecipeState();
    // The fields must exist on a new recipe, or "no number moves" tests nothing.
    expect(empty).toHaveProperty('name', '');
    expect(empty).toHaveProperty('style', '');
    expect(empty).toHaveProperty('notes', '');

    const filled = { ...empty, ...FILLED };
    // Deep equality over everything computeRecipe derives (NaN equals NaN here).
    expect(computeRecipe(filled)).toEqual(computeRecipe(empty));
  });

  // S4
  it('name, style and notes round-trip through save and load at version 4', () => {
    const s = fakeStorage();
    const recipe = { ...defaultRecipeState(), ...FILLED };
    savePersisted(s, { recipe, mode: 'pro', proGravityUnit: 'sg' });

    // One key, one document, at version 4, carrying the three as text.
    expect([...s._map.keys()]).toEqual([STORAGE_KEY]);
    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(4);
    expect(doc.recipe.name).toBe('1.060');
    expect(doc.recipe.style).toBe('21A American IPA');
    expect(doc.recipe.notes).toBe(FILLED.notes);

    const loaded = loadPersisted(s, defaults());
    expect(loaded.recipe).toEqual(recipe);
    expect(typeof loaded.recipe.name).toBe('string');
    expect(loaded.mode).toBe('pro');
    expect(loaded.proGravityUnit).toBe('sg');
  });
});
