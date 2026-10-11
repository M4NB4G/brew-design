// @vitest-environment jsdom
// my-yeast-strains.test.js
// Scenarios for "My yeast strains" (docs/items/my-yeast-strains.md, YS-S1 to
// YS-S9, decisions YS-Q1 to YS-Q5 and K). A brewer saves a house strain that
// is not on the owner's list from the Yeast card's strain box, with ale or
// lager and, optionally, its lab attenuation and lab temperature range; it is
// offered again, kept with My brewery's figures (brewery format 7) and carried
// by the brewery file. The app is drawn whole, in jsdom, and driven as the
// brewer drives it. The stored documents are read as this browser keeps them.
//
// No number is introduced. Every figure saved is one the brewer typed: 76 %
// typed is the fraction 76 / 100 = 0.76 (display.js's definitional percent
// factor); a range typed in °F is stored as typed. A range typed in °C is
// stored by the engine's cToF, F = C × 9/5 + 32, worked by hand:
//    18 °C: 18 × 9 = 162, / 5 = 32.4, + 32 = 64.4 °F
//    22 °C: 22 × 9 = 198, / 5 = 39.6, + 32 = 71.6 °F
// The warning compares the fermentation temperature with the saved range in
// °F: 75 > 72 warns, 64 ≤ 68 ≤ 72 does not. 7 is the brewery document's
// format tag.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import ingredients from '../src/ingredients.json';
import { emptyBreweryFigures, newRecipe } from '../src/state.js';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  BREWERY_KEY,
  BREWERY_VERSION,
  loadBrewery,
  saveBrewery,
  exportBreweryDocument,
  importBreweryFile,
  breweryImportQuestion,
  exportRecipeDocument,
  loadStartingState,
} from '../src/persistence.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// --- The app, drawn whole --------------------------------------------------

let root;
let host;
let asked; // every question window.confirm was asked, in order
let answer; // what the brewer answers

// jsdom keeps localStorage on the window or its prototype; storage is turned
// off by a getter that throws, as a browser with storage blocked does.
const realStorage = Object.getOwnPropertyDescriptor(window, 'localStorage');
function restoreStorage() {
  if (realStorage) Object.defineProperty(window, 'localStorage', realStorage);
  else delete window.localStorage;
}

function mount({ stored, storageOff = false } = {}) {
  if (storageOff) {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('storage is off');
      },
    });
  } else {
    restoreStorage();
    window.localStorage.clear();
    if (stored) for (const [key, value] of Object.entries(stored)) window.localStorage.setItem(key, value);
  }
  asked = [];
  answer = true;
  window.scrollTo = () => {};
  window.confirm = (q) => {
    asked.push(q);
    return answer;
  };
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(App)));
}

function unmount() {
  act(() => root.unmount());
  host.remove();
  root = undefined;
  host = undefined;
}

afterEach(() => {
  if (root) unmount();
  restoreStorage();
  window.localStorage.clear();
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const boxes = () => [...host.querySelectorAll('input, select, textarea')];
const hasBox = (name) => boxes().some((el) => el.getAttribute('aria-label') === name);

function box(name) {
  const found = boxes().find((el) => el.getAttribute('aria-label') === name);
  if (!found) throw new Error(`no box named "${name}"`);
  return found;
}

// Type into a box, as a keystroke does.
function type(name, value) {
  const el = typeof name === 'string' ? box(name) : name;
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// Leave a box (the suggestions close).
function leave(name) {
  act(() => box(name).dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
}

function click(el) {
  act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

function button(label) {
  const found = [...host.querySelectorAll('button')].find(
    (b) => text(b) === label || b.getAttribute('aria-label') === label,
  );
  if (!found) throw new Error(`no button "${label}"`);
  return found;
}

function choose(name, value) {
  const el = box(name);
  act(() => {
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

// The suggestions under the strain box, as text.
function lines() {
  const id = box('Strain').getAttribute('aria-controls');
  const list = id ? document.getElementById(id) : null;
  return list ? [...list.querySelectorAll('li')].map(text) : [];
}

function line(startsWith) {
  const id = box('Strain').getAttribute('aria-controls');
  const list = id ? document.getElementById(id) : null;
  const found = list && [...list.querySelectorAll('li')].find((li) => text(li).startsWith(startsWith));
  if (!found) throw new Error(`no line "${startsWith}" under the strain box`);
  return found;
}

// The save line under the strain's suggestions, or undefined: the group of
// "Save to my ingredients" with its boxes and its Save button.
const saveGroup = () =>
  [...host.querySelectorAll('[role=group]')].find((g) => text(g).startsWith('Save to my ingredients'));
const saveButton = () => [...saveGroup().querySelectorAll('button')].find((b) => text(b) === 'Save');

// The Yeast card's information line and warning, as the page shows them.
const yeastCard = () => [...host.querySelectorAll('span')].find((s) => text(s) === 'Yeast').parentElement;
const cardText = () => text(yeastCard());
const warning = () => {
  const w = [...yeastCard().querySelectorAll('[role=status]')].find((el) => /lab range/.test(text(el)));
  return w ? text(w) : null;
};

// What this browser keeps.
const storedRecipe = () => window.localStorage.getItem(STORAGE_KEY);
const storedBrewery = () => JSON.parse(window.localStorage.getItem(BREWERY_KEY));
const storedMine = () => storedBrewery()?.brewery.ingredients;

// A saved strain carries the owner's list's keys, its lab and product code empty.
const strain = (fields) => ({ lab: '', productCode: '', type: 'ale', apparentAttenuation: null, labTempLowF: null, labTempHighF: null, ...fields });
const HOUSE_ALE = strain({ name: 'House Ale', apparentAttenuation: 0.76, labTempLowF: 64, labTempHighF: 72 });
const BARN_LAGER = strain({ name: 'Barn Lager', type: 'lager' });
const HOUSE_PALE = { name: 'House Pale', fgdb: 0.79, colorL: 3, type: 'base', distilledWaterPh: null, acidityMeqPerKg: null };
const withMine = (mine) => ({ ...emptyBreweryFigures(), ingredients: { malts: [], hops: [], yeasts: [], ...mine } });
const breweryDoc = (mine) => exportBreweryDocument(withMine(mine));

describe('My yeast strains', () => {
  // YS-S1, YS-S2, YS-Q1
  it('a strain on neither list offers to save it', () => {
    mount();
    // A blank name offers nothing.
    type('Strain', ' ');
    expect(saveGroup()).toBeUndefined();

    type('Strain', 'House Ale');
    const group = saveGroup();
    expect(group).toBeDefined();
    // Ale or lager, the card's choice, and three boxes, each blank.
    expect(text(group)).toMatch(/^Save to my ingredients · Ale/);
    // One save line: none among the suggestions.
    expect(lines().some((l) => /save to my ingredients/i.test(l))).toBe(false);
    for (const name of ['Lab attenuation (%)', 'Lab range low (°F)', 'Lab range high (°F)']) {
      expect(box(name).value, name).toBe('');
    }
    choose('Type', 'lager');
    type('Strain', 'House Lager');
    expect(text(saveGroup())).toMatch(/^Save to my ingredients · Lager/);

    // A range with one end is refused, and the line says so; nothing is kept.
    type('Lab range low (°F)', 50);
    expect(text(saveGroup())).toMatch(/both ends or neither/i);
    click(saveButton());
    expect(window.localStorage.getItem(BREWERY_KEY)).toBeNull();
    type('Lab range low (°F)', '');
    type('Lab range high (°F)', 55);
    expect(text(saveGroup())).toMatch(/both ends or neither/i);
    click(saveButton());
    expect(window.localStorage.getItem(BREWERY_KEY)).toBeNull();

    // Both ends: kept. The recipe on screen does not change (YS-S2).
    type('Lab range low (°F)', 50);
    type('Lab attenuation (%)', 76);
    const recipeBefore = storedRecipe();
    click(saveButton());
    expect(storedMine().yeasts).toEqual([
      strain({ name: 'House Lager', type: 'lager', apparentAttenuation: 0.76, labTempLowF: 50, labTempHighF: 55 }),
    ]);
    expect(storedRecipe()).toBe(recipeBefore);
    expect(box('Strain').value).toBe('House Lager');
    expect(host.textContent).toContain('Saved to My ingredients');

    // None of the three: kept with each blank.
    type('Strain', 'Bare Lager');
    click(saveButton());
    expect(storedMine().yeasts[1]).toEqual(strain({ name: 'Bare Lager', type: 'lager' }));
  });

  // YS-S1 (temperatures in the header's unit, stored in °F)
  it('a range typed in °C is kept in °F', () => {
    mount();
    click(button('°C'));
    type('Strain', 'House Ale');
    type('Lab range low (°C)', 18);
    type('Lab range high (°C)', 22);
    click(saveButton());
    const [saved] = storedMine().yeasts;
    expect(saved.labTempLowF).toBeCloseTo(64.4, 10); // 18 × 9/5 + 32
    expect(saved.labTempHighF).toBeCloseTo(71.6, 10); // 22 × 9/5 + 32
  });

  // YS-S3, MI-Q11
  it('a saved strain is offered first, marked yours, and a pick sets ale or lager only', () => {
    mount({ stored: { [BREWERY_KEY]: breweryDoc({ yeasts: [HOUSE_ALE, BARN_LAGER] }) } });
    // "ale": House Ale only contains it, yet comes ahead of the owner's strains.
    type('Strain', 'ale');
    const found = lines();
    expect(found[0]).toMatch(/^House Ale.*yours/);
    expect(found.slice(1).some((l) => /yours/.test(l))).toBe(false);
    expect(found.some((l) => l.startsWith('1318 London Ale III'))).toBe(true);
    leave('Strain');

    // The brewer's own attenuation, fermentation temperature and price; lager.
    choose('Type', 'lager');
    type('Apparent attenuation %', 80);
    type('Fermentation temperature °F', 68);
    // The yeast's price box, the first priced per batch (named after the strain, here blank).
    type(boxes().find((el) => /^Price of .*\(\$\/batch\)$/.test(el.getAttribute('aria-label') ?? '')), 9.5);
    const before = JSON.parse(storedRecipe()).recipe;
    expect(before.yeast).toMatchObject({ type: 'lager', fermTempF: 68, pricePerBatch: 9.5 });
    type('Strain', 'house');
    click(line('House Ale'));
    const { recipe } = JSON.parse(storedRecipe());
    // The name and ale; the rest of the yeast, and the attenuation box, as they were.
    expect(recipe.yeast).toEqual({ ...before.yeast, name: 'House Ale', type: 'ale' });
    expect(recipe.apparentAttenuation).toBe(0.8);

    // A lager pick sets lager.
    type('Strain', 'barn');
    click(line('Barn Lager'));
    expect(JSON.parse(storedRecipe()).recipe.yeast.type).toBe('lager');
  });

  // YS-S4, YS-Q5
  it('the information line and the warning read the saved strain', () => {
    const owners = ingredients.yeasts[0];
    const ownersCopy = strain({ name: owners.name.toUpperCase(), apparentAttenuation: 0.5, labTempLowF: 40, labTempHighF: 45 });
    mount({ stored: { [BREWERY_KEY]: breweryDoc({ yeasts: [HOUSE_ALE, BARN_LAGER, ownersCopy] }) } });
    type('Strain', 'House Ale');
    leave('Strain');
    // What was saved: yours, ale, the range and the attenuation.
    expect(cardText()).toMatch(/Yours · Ale · lab range 64–72 °F · attenuation 76 %/);
    expect(cardText()).not.toMatch(/Not on your list/);
    type('Fermentation temperature °F', 75);
    expect(warning()).toBe("Outside this strain's lab range, 64–72 °F");
    type('Fermentation temperature °F', 68);
    expect(warning()).toBeNull();
    // Never stored in the recipe.
    expect(JSON.parse(storedRecipe()).recipe.yeast).not.toHaveProperty('labTempLowF');

    // No range saved: no warning, and no range or attenuation shown.
    type('Strain', 'Barn Lager');
    leave('Strain');
    type('Fermentation temperature °F', 75);
    expect(warning()).toBeNull();
    expect(cardText()).toMatch(/Yours · Lager/);
    expect(cardText()).not.toMatch(/lab range|attenuation \d/);

    // A name in both lists reads the brewer's entry (YS-Q5).
    type('Strain', owners.name);
    leave('Strain');
    type('Fermentation temperature °F', owners.labTempLowF);
    expect(warning()).toBe("Outside this strain's lab range, 40–45 °F");
    expect(cardText()).toMatch(/Yours · Ale · lab range 40–45 °F · attenuation 50 %/);
  });

  // YS-S5, YS-Q3, K (idempotence)
  it('a name on the owner\'s list is refused, a saved name asks then replaces', () => {
    mount({ stored: { [BREWERY_KEY]: breweryDoc({ yeasts: [HOUSE_ALE, BARN_LAGER] }) } });
    const owners = ingredients.yeasts[0].name;
    for (const typed of [owners, ` ${owners.toLowerCase()} `]) {
      type('Strain', typed);
      expect(saveGroup(), typed).toBeUndefined();
      expect(lines().some((l) => /already on the ingredient list/i.test(l)), typed).toBe(true);
      leave('Strain');
    }
    const once = window.localStorage.getItem(BREWERY_KEY);

    // A saved name, capitals aside: asked; declined, kept as it was.
    type('Strain', 'house ale');
    type('Lab attenuation (%)', 80);
    answer = false;
    click(saveButton());
    expect(asked.length).toBe(1);
    expect(asked[0]).toMatch(/house ale/);
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(once);
    // Confirmed: replaced in its place, one entry.
    answer = true;
    type('Strain', 'house al');
    type('Strain', 'house ale');
    type('Lab attenuation (%)', 80);
    click(saveButton());
    expect(asked.length).toBe(2);
    expect(storedMine().yeasts).toEqual([strain({ name: 'house ale', apparentAttenuation: 0.8 }), BARN_LAGER]);
    // The same again: asked, and the same document.
    const twice = window.localStorage.getItem(BREWERY_KEY);
    type('Strain', 'house al');
    type('Strain', 'house ale');
    type('Lab attenuation (%)', 80);
    click(saveButton());
    expect(asked.length).toBe(3);
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(twice);
  });

  // YS-S6
  it('My brewery lists and deletes saved strains, and no recipe changes', () => {
    mount({ stored: { [BREWERY_KEY]: breweryDoc({ malts: [HOUSE_PALE], yeasts: [HOUSE_ALE, BARN_LAGER] }) } });
    type('Strain', 'house');
    click(line('House Ale'));
    const recipeBefore = storedRecipe();
    click(button('Options'));
    expect(host.textContent).toContain('Yeast strains');
    click(button('Delete House Ale from My ingredients'));
    expect(asked).toEqual([]);
    expect(storedMine()).toEqual({ malts: [HOUSE_PALE], hops: [], yeasts: [BARN_LAGER] });
    expect(storedRecipe()).toBe(recipeBefore);
    expect(() => button('Delete House Ale from My ingredients')).toThrow();
    expect(() => button('Delete Barn Lager from My ingredients')).not.toThrow();
    // The recipe keeps its strain's name; the card no longer finds it.
    click(button('Recipe'));
    expect(box('Strain').value).toBe('House Ale');
    expect(cardText()).toMatch(/Not on your list/);
    type('Strain', 'house');
    expect(lines().some((l) => l.startsWith('House Ale'))).toBe(false);
  });

  // YS-S6, YS-Q4
  it('the brewery file carries them and the import question counts them', async () => {
    const theirs = withMine({ yeasts: [{ ...HOUSE_ALE, name: 'Their Ale' }] });
    const file = exportBreweryDocument(theirs);
    expect(JSON.parse(file).brewery.ingredients.yeasts).toEqual(theirs.ingredients.yeasts);
    expect(importBreweryFile(file, () => true).brewery).toEqual(theirs);
    // A malt and a strain saved, the file's one strain: 2 go, 1 comes.
    const ours = withMine({ malts: [HOUSE_PALE], yeasts: [HOUSE_ALE] });
    expect(breweryImportQuestion('theirs.json', ours, theirs)).toMatch(/Your 2 saved ingredients will be replaced by the file's 1\./);
    expect(breweryImportQuestion('theirs.json', withMine({ yeasts: [HOUSE_ALE] }), withMine({}))).toMatch(/your 1 saved ingredient will go/);

    mount({ stored: { [BREWERY_KEY]: exportBreweryDocument(ours) } });
    click(button('Options'));
    const picker = [...host.querySelectorAll('input[type=file]')].at(-1);
    Object.defineProperty(picker, 'files', { configurable: true, value: [new File([file], 'theirs.json', { type: 'application/json' })] });
    await act(async () => {
      picker.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(asked.length).toBe(1);
    expect(asked[0]).toMatch(/2 saved ingredients/);
    expect(storedMine()).toEqual(theirs.ingredients);
    expect(() => button('Delete Their Ale from My ingredients')).not.toThrow();
  });

  // YS-S7, K (format)
  it('a version-6 brewery loads with no saved strains and is saved back as 7; a damaged strain entry makes it unreadable', () => {
    expect(BREWERY_VERSION).toBe(7);
    const s = window.localStorage;
    s.clear();
    const mine = withMine({ malts: [HOUSE_PALE], yeasts: [HOUSE_ALE, BARN_LAGER] });
    saveBrewery(s, mine);
    expect(JSON.parse(s.getItem(BREWERY_KEY)).version).toBe(7);
    expect(loadBrewery(s)).toEqual(mine);

    // Version 6: its malts and hops as saved, no strains; saved back as 7.
    s.clear();
    const { yeasts: _none, ...v6Mine } = mine.ingredients;
    s.setItem(BREWERY_KEY, JSON.stringify({ version: 6, brewery: { ...mine, fermentVolGal: 12, ingredients: v6Mine } }));
    const loaded = loadBrewery(s);
    expect(loaded.ingredients).toEqual({ malts: [HOUSE_PALE], hops: [], yeasts: [] });
    expect(loaded.fermentVolGal).toBe(12);
    const back = JSON.parse(s.getItem(BREWERY_KEY));
    expect(back.version).toBe(7);
    expect(back.brewery.ingredients.yeasts).toEqual([]);

    // Version 5 (before My ingredients): none of any kind.
    s.clear();
    const { ingredients: _gone, ...v5 } = { ...emptyBreweryFigures(), fermentVolGal: 12 };
    s.setItem(BREWERY_KEY, JSON.stringify({ version: 5, brewery: v5 }));
    expect(loadBrewery(s).ingredients).toEqual({ malts: [], hops: [], yeasts: [] });
    expect(JSON.parse(s.getItem(BREWERY_KEY)).version).toBe(7);

    // A damaged strain entry makes the document unreadable.
    for (const [why, yeasts] of [
      ['a type that is neither ale nor lager', [{ ...HOUSE_ALE, type: 'wheat' }]],
      ['no type', [{ ...HOUSE_ALE, type: undefined }]],
      ['a blank name', [{ ...HOUSE_ALE, name: ' ' }]],
      ['attenuation above 100 %', [{ ...HOUSE_ALE, apparentAttenuation: 1.2 }]],
      ['attenuation below 0', [{ ...HOUSE_ALE, apparentAttenuation: -0.1 }]],
      ['attenuation as text', [{ ...HOUSE_ALE, apparentAttenuation: '0.76' }]],
      ['a range with one end', [{ ...HOUSE_ALE, labTempHighF: null }]],
      ['a range low above high', [{ ...HOUSE_ALE, labTempLowF: 72, labTempHighF: 64 }]],
      ['a range end as text', [{ ...HOUSE_ALE, labTempLowF: '64' }]],
      ['not a list', 'House Ale'],
    ]) {
      s.clear();
      s.setItem(BREWERY_KEY, JSON.stringify({ version: 7, brewery: { ...mine, fermentVolGal: 12, ingredients: { ...mine.ingredients, yeasts } } }));
      expect(loadBrewery(s), why).toEqual(emptyBreweryFigures());
    }
    // A version-7 document without the strains is not one.
    s.clear();
    s.setItem(BREWERY_KEY, JSON.stringify({ version: 7, brewery: { ...mine, fermentVolGal: 12, ingredients: v6Mine } }));
    expect(loadBrewery(s)).toEqual(emptyBreweryFigures());
  });

  // YS-S8
  it('storage off', () => {
    expect(() => mount({ storageOff: true })).not.toThrow();
    type('Strain', 'House Ale');
    expect(() => click(saveButton())).not.toThrow();
    expect(host.textContent).toMatch(/House Ale could not be kept/);
    type('Strain', 'house');
    expect(lines().some((l) => /yours/.test(l))).toBe(false);
    unmount();

    // A stored brewery that cannot be read: the owner's list only, and the
    // save says it could not be kept, the stored copy left as found.
    const damaged = JSON.stringify({ version: 7, brewery: 'damaged' });
    expect(() => mount({ stored: { [BREWERY_KEY]: damaged } })).not.toThrow();
    type('Strain', 'House Ale');
    expect(() => click(saveButton())).not.toThrow();
    expect(host.textContent).toMatch(/House Ale could not be kept/);
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(damaged);
    type('Strain', 'house');
    expect(lines().some((l) => /yours/.test(l))).toBe(false);
  });

  // YS-S9
  it('nothing else changes', () => {
    mount();
    const sheet = () => text(document.body.querySelector('.print-sheet'));
    const read = () => JSON.parse(storedRecipe());
    const firstVisit = () =>
      loadStartingState({
        getItem: (k) => (k === BREWERY_KEY ? window.localStorage.getItem(k) : null),
        setItem: () => {},
        removeItem: () => {},
      });
    const fresh = newRecipe(loadBrewery(window.localStorage));
    const starting = firstVisit();

    type('Strain', 'House Ale');
    type('Fermentation temperature °F', 75);
    const typedDoc = storedRecipe();
    const typedFile = exportRecipeDocument(read());
    const typedSheet = sheet();
    expect(typedSheet).toContain('House Ale');
    type('Lab range low (°F)', 64);
    type('Lab range high (°F)', 72);
    type('Lab attenuation (%)', 76);
    click(saveButton());
    expect(storedMine().yeasts).toEqual([HOUSE_ALE]);
    // The recipe document (format 12) and the recipe file, byte for byte; the sheet, word for word.
    expect(SCHEMA_VERSION).toBe(12);
    expect(read().version).toBe(12);
    expect(storedRecipe()).toBe(typedDoc);
    expect(exportRecipeDocument(read())).toBe(typedFile);
    expect(sheet()).toBe(typedSheet);
    // A new recipe (Reset, or a first visit) is as it was.
    expect(newRecipe(loadBrewery(window.localStorage))).toEqual(fresh);
    expect(firstVisit()).toEqual(starting);
    expect(hasBox('Lab range low (°F)')).toBe(false);
  });
});
