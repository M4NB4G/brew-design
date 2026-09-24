// recipe-file.test.js
// Scenarios for the Recipe file item (scope table agreed 2026-09-22,
// docs/items/recipe-file-export-import.md), named from its sentences S1, S2,
// S4, S5, S6 and S7. The browser's download and file picker (S1's download,
// S3) and the autosave that makes an imported recipe the working copy are
// proved at the far end, in the browser.

import { describe, it, expect } from 'vitest';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import {
  loadPersisted,
  savePersisted,
  exportRecipeDocument,
  recipeFileName,
  importRecipeFile,
  STORAGE_KEY,
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

const defaults = () => ({ recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' });

// The recipe on screen before an import: edited away from the defaults, with
// a cleared field, so "untouched" is distinguishable from "reset".
function onScreen() {
  const recipe = { ...defaultRecipeState(), name: 'On screen', preBoilVolGal: 9, efficiency: NaN };
  return { recipe, mode: 'home', proGravityUnit: 'plato' };
}

// A second recipe, as it would sit in a file: different numbers, a name,
// notes, and the other display settings.
function inFile() {
  const recipe = {
    ...defaultRecipeState(),
    name: 'Hazy IPA',
    style: '21C Hazy IPA',
    notes: 'Mash 152 °F.\nDry hop day 3.',
    preBoilVolGal: 16,
    malts: [{ name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 }],
    measurementTempF: { preBoil: 150, postBoil: 190, ferment: 66 },
  };
  return { recipe, mode: 'pro', proGravityUnit: 'sg' };
}

// Storage holding the working copy of what is on screen.
function storageWithWorkingCopy() {
  const s = fakeStorage();
  savePersisted(s, onScreen());
  return s;
}

// A confirm that records whether it was asked, and answers `answer`.
function confirmer(answer) {
  const asked = [];
  const fn = (state) => {
    asked.push(state);
    return answer;
  };
  fn.asked = asked;
  return fn;
}

const REFUSED = /not a Brew Design recipe, or it is damaged/;

// An import that is refused must not ask to replace, must hand back no
// recipe to apply, must say why on screen, and must leave the working copy
// byte-for-byte as it was.
function expectRefused(text, messagePattern) {
  const s = storageWithWorkingCopy();
  const before = s._map.get(STORAGE_KEY);
  const confirm = confirmer(true);
  const result = importRecipeFile(text, defaults(), confirm);
  expect(result.outcome, text).toBe('refused');
  expect(result.state, text).toBeUndefined();
  expect(result.message, text).toMatch(messagePattern);
  expect(result.message, text).toMatch(/The recipe on screen is unchanged/);
  expect(confirm.asked, text).toHaveLength(0);
  expect(s._map.get(STORAGE_KEY), text).toBe(before);
  expect(loadPersisted(s, defaults()).recipe.name, text).toBe('On screen');
  return result;
}

describe('recipe file', () => {
  // S1
  it('export produces the same document the app saves, at the current version', () => {
    for (const state of [onScreen(), inFile(), defaults()]) {
      const s = fakeStorage();
      savePersisted(s, state);
      const file = exportRecipeDocument(state);
      // Byte-for-byte the document in browser storage.
      expect(file).toBe(s._map.get(STORAGE_KEY));
      const doc = JSON.parse(file);
      expect(doc.version).toBe(SCHEMA_VERSION);
      expect(doc.version).toBe(4);
      expect(doc.mode).toBe(state.mode);
      expect(doc.proGravityUnit).toBe(state.proGravityUnit);
      expect(doc.recipe.name).toBe(state.recipe.name);
    }
  });

  // S2 — E2: name cleaned of characters a file system rejects, plus today's
  // date (the brewer's local date), ".json"; no usable name -> the fallback.
  it('the file name is the recipe name plus today\'s date; an unnamed recipe uses the fallback', () => {
    const sept22 = new Date(2026, 8, 22, 23, 59); // local time, late evening
    expect(recipeFileName('Hazy IPA', sept22)).toBe('Hazy IPA 2026-09-22.json');
    expect(recipeFileName('', sept22)).toBe('Brew Design recipe 2026-09-22.json');

    // Month and day are two digits.
    expect(recipeFileName('Hazy IPA', new Date(2026, 0, 5))).toBe('Hazy IPA 2026-01-05.json');

    // Characters Windows rejects in a file name (< > : " / \ | ? *) and
    // control characters become spaces; runs of spaces collapse; ends trimmed.
    expect(recipeFileName('Hazy: Take 2/3?', sept22)).toBe('Hazy Take 2 3 2026-09-22.json');
    expect(recipeFileName('A<B>C"D\\E|F*G', sept22)).toBe('A B C D E F G 2026-09-22.json');
    expect(recipeFileName('  Brew\tDay\n ', sept22)).toBe('Brew Day 2026-09-22.json');
    // Characters a file system accepts are kept as typed.
    expect(recipeFileName("Brewer's Best — 1.060 (v2)", sept22)).toBe(
      "Brewer's Best — 1.060 (v2) 2026-09-22.json",
    );

    // A name with nothing left after cleaning is no name.
    expect(recipeFileName('   ', sept22)).toBe('Brew Design recipe 2026-09-22.json');
    expect(recipeFileName('???', sept22)).toBe('Brew Design recipe 2026-09-22.json');
  });

  // S4 — S3's confirmation is asked once, with the file's recipe, before
  // anything is replaced.
  it('importing a valid file replaces the recipe and the display settings, and becomes the working copy', () => {
    const file = exportRecipeDocument(inFile());

    // Declined: nothing to apply, the working copy untouched.
    const s1 = storageWithWorkingCopy();
    const before = s1._map.get(STORAGE_KEY);
    const no = confirmer(false);
    const declined = importRecipeFile(file, defaults(), no);
    expect(no.asked).toHaveLength(1);
    expect(declined.outcome).toBe('declined');
    expect(declined.state).toBeUndefined();
    expect(s1._map.get(STORAGE_KEY)).toBe(before);

    // Confirmed: the file's recipe and display settings, whole.
    const yes = confirmer(true);
    const replaced = importRecipeFile(file, defaults(), yes);
    expect(yes.asked).toHaveLength(1);
    expect(yes.asked[0].recipe.name).toBe('Hazy IPA');
    expect(replaced.outcome).toBe('replaced');
    expect(replaced.state).toEqual(inFile());

    // Every derived number is the file's recipe's.
    expect(computeRecipe(replaced.state.recipe)).toEqual(computeRecipe(inFile().recipe));

    // The working copy: the same save the autosave makes, then a reload.
    const s2 = storageWithWorkingCopy();
    savePersisted(s2, replaced.state);
    expect(loadPersisted(s2, defaults())).toEqual(inFile());

    // A cleared field in the file comes back as a cleared field, not 0.
    const cleared = exportRecipeDocument(onScreen());
    const back = importRecipeFile(cleared, defaults(), confirmer(true));
    expect(Number.isNaN(back.state.recipe.efficiency)).toBe(true);

    // A file saved before the name existed (version 2) is still a recipe:
    // read with an empty name, style and notes, as browser storage reads it.
    const { name, style, notes, ...v2Recipe } = inFile().recipe;
    const v2 = JSON.stringify({ version: 2, recipe: v2Recipe, mode: 'pro', proGravityUnit: 'sg' });
    const fromV2 = importRecipeFile(v2, defaults(), confirmer(true));
    expect(fromV2.outcome).toBe('replaced');
    expect(fromV2.state.recipe).toEqual({ ...v2Recipe, name: '', style: '', notes: '' });
  });

  // S5
  it('importing a file that is not a Brew Design recipe is refused and leaves the current recipe untouched', () => {
    const foreign = [
      'Shopping list: 11 lb pale malt, 2 oz Citra',
      '',
      '<html><body>recipe</body></html>',
      JSON.stringify({ name: 'some-package', version: '1.0.0', dependencies: {} }),
      JSON.stringify([1, 2, 3]),
      JSON.stringify('a string'),
      '42',
      'null',
      JSON.stringify({ recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' }), // no version
    ];
    for (const text of foreign) expectRefused(text, REFUSED);
  });

  // S5
  it('importing a damaged file is refused and leaves the current recipe untouched', () => {
    const good = exportRecipeDocument(inFile());
    const doc = JSON.parse(good);
    const damaged = [
      good.slice(0, Math.floor(good.length / 2)), // cut off part-way
      good.slice(0, -1), // last brace lost
      JSON.stringify({ ...doc, recipe: { ...doc.recipe, malts: 5 } }),
      JSON.stringify({ ...doc, recipe: { ...doc.recipe, preBoilVolGal: '16' } }),
      JSON.stringify({ ...doc, recipe: { name: 'Hazy IPA' } }),
      JSON.stringify({ ...doc, recipe: null }),
      JSON.stringify({ ...doc, mode: 'banana' }),
      JSON.stringify({ ...doc, proGravityUnit: 'brix' }),
      JSON.stringify({ ...doc, version: 0 }),
    ];
    for (const text of damaged) expectRefused(text, REFUSED);
  });

  // S6
  it('importing a file with a newer version is refused, naming that reason', () => {
    const doc = JSON.parse(exportRecipeDocument(inFile()));
    const newer = { ...doc, version: SCHEMA_VERSION + 1 };
    const result = expectRefused(JSON.stringify(newer), /newer version of Brew Design/);
    expect(result.message).toMatch(/file version 5/);
    expect(result.message).toMatch(/reads up to version 4/);
    // Newer is its own reason, not "damaged": a newer file whose recipe
    // this version cannot read is still reported as newer.
    const newerOddShape = { version: SCHEMA_VERSION + 2, recipe: { hopsV5: [] }, mode: 'x' };
    const odd = expectRefused(JSON.stringify(newerOddShape), /newer version of Brew Design/);
    expect(odd.message).not.toMatch(REFUSED);
  });

  // S7
  it('exporting changes no recipe value and no derived number', () => {
    const state = onScreen();
    const s = fakeStorage();
    savePersisted(s, state);
    const storedBefore = s._map.get(STORAGE_KEY);
    const snapshot = structuredClone(state); // keeps NaN as NaN
    const derivedBefore = computeRecipe(state.recipe);

    // Frozen all the way down: an export that wrote to the recipe would throw.
    const deepFreeze = (o) => {
      if (o && typeof o === 'object') {
        Object.values(o).forEach(deepFreeze);
        Object.freeze(o);
      }
      return o;
    };
    deepFreeze(state);

    exportRecipeDocument(state);
    recipeFileName(state.recipe.name, new Date(2026, 8, 22));
    exportRecipeDocument(state); // twice: nothing accumulates

    expect(state).toEqual(snapshot);
    expect(Number.isNaN(state.recipe.efficiency)).toBe(true);
    expect(s._map.get(STORAGE_KEY)).toBe(storedBefore);
    expect(computeRecipe(state.recipe)).toEqual(derivedBefore);
  });
});
