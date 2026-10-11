// @vitest-environment jsdom
// saved-ingredient-on-owner-list.test.js
// Scenarios for "A saved ingredient the owner's list later gains"
// (docs/items/saved-ingredient-on-owner-list.md, SI-S1 to SI-S6, decisions
// SI-Q1 to SI-Q3 and K). A malt, hop or strain the brewer saved before the
// owner's list gained its name is kept with its own numbers, still offered
// first and marked as theirs beside the owner's entry, and My brewery says it
// is now also on the owner's list. The scenario cannot change the owner's
// workbook: a stored brewery whose entries carry names on the owner's list
// stands for one saved before the list gained them (the item's notes). The
// app is drawn whole, in jsdom, and driven as the brewer drives it.
//
// No number is introduced: every figure is one the brewer saved, read back as
// saved. The brewer's numbers differ from the owner's on purpose, so a pick
// shows which entry it copied:
//    Golden Promise Pale Malt: owner's FGDB 0.81, colour 2.2; the brewer's 0.78, 2.6
//    Cascade: owner's alpha 0.062; the brewer's 0.071
//    A07 Flagship: owner's lab range 60–72 °F; the brewer's 64–68 °F
// The warning compares the fermentation temperature with the brewer's range
// in °F: 70 > 68 warns (inside the owner's 60–72); 66 does not.

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
  exportBreweryDocument,
  importBreweryFile,
  exportRecipeDocument,
} from '../src/persistence.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// --- The app, drawn whole --------------------------------------------------

let root;
let host;
let asked; // every question window.confirm was asked, in order

function mount(stored) {
  window.localStorage.clear();
  if (stored) for (const [key, value] of Object.entries(stored)) window.localStorage.setItem(key, value);
  asked = [];
  window.scrollTo = () => {};
  window.confirm = (q) => {
    asked.push(q);
    return true;
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
  window.localStorage.clear();
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const boxes = () => [...host.querySelectorAll('input, select, textarea')];

function box(name) {
  const found = boxes().find((el) => el.getAttribute('aria-label') === name);
  if (!found) throw new Error(`no box named "${name}"`);
  return found;
}

function type(name, value) {
  const el = box(name);
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// Type a name afresh, so its suggestions open even when the box holds it already.
function search(name, value) {
  type(name, value.slice(0, -1));
  type(name, value);
}

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

// The suggestions under a name box, each as its <li>.
function options(name) {
  const id = box(name).getAttribute('aria-controls');
  const list = id ? document.getElementById(id) : null;
  return list ? [...list.querySelectorAll('li')] : [];
}
const lines = (name) => options(name).map(text);

// My brewery's row for a saved ingredient, as text: its name, numbers, Delete
// and any line under it.
function myRow(name) {
  const del = button(`Delete ${name} from My ingredients`);
  let row = del;
  while (row && !text(row).startsWith(name.trim())) row = row.parentElement;
  if (!row) throw new Error(`no row for ${name}`);
  return text(row);
}

const storedRecipe = () => window.localStorage.getItem(STORAGE_KEY);
const storedMine = () => JSON.parse(window.localStorage.getItem(BREWERY_KEY)).brewery.ingredients;

const owners = {
  malt: ingredients.malts.find((m) => m.name === 'Golden Promise Pale Malt'),
  hop: ingredients.hops.find((h) => h.name === 'Cascade'),
  strain: ingredients.yeasts.find((y) => y.name === 'A07 Flagship'),
};
// Saved before the owner's list gained these names: capitals and a trailing
// space differ, the numbers are the brewer's own.
const MY_GOLDEN = { name: 'golden promise pale malt ', fgdb: 0.78, colorL: 2.6, type: 'base', distilledWaterPh: null, acidityMeqPerKg: null };
const MY_CASCADE = { name: 'CASCADE', alphaAcidFraction: 0.071 };
const MY_FLAGSHIP = { name: 'a07 flagship', lab: '', productCode: '', type: 'ale', apparentAttenuation: 0.74, labTempLowF: 64, labTempHighF: 68 };
// Saved and on no list.
const HOUSE_PALE = { name: 'House Pale', fgdb: 0.79, colorL: 3, type: 'base', distilledWaterPh: null, acidityMeqPerKg: null };
const MINE = { malts: [MY_GOLDEN, HOUSE_PALE], hops: [MY_CASCADE], yeasts: [MY_FLAGSHIP] };
const breweryDoc = (mine = MINE) => exportBreweryDocument({ ...emptyBreweryFigures(), ingredients: mine });

describe('A saved ingredient the owner\'s list later gains', () => {
  // SI-S1, SI-Q1, SI-Q2
  it('a saved malt, hop and strain whose name is on the owner\'s list is kept and offered first, marked yours', () => {
    expect(owners.malt).toMatchObject({ fgdb: 0.81, colorL: 2.2 });
    expect(owners.hop.alphaAcidFraction).toBe(0.062);
    expect(owners.strain).toMatchObject({ labTempLowF: 60, labTempHighF: 72 });
    mount({ [BREWERY_KEY]: breweryDoc() });
    expect(loadBrewery(window.localStorage).ingredients).toEqual(MINE);

    // Both offered, the brewer's first and marked yours, the owner's beside it.
    for (const [name, typed, mine, owner] of [
      ['Malt 1 name', 'golden promise', MY_GOLDEN, owners.malt],
      ['Kettle hop 1 name', 'cascade', MY_CASCADE, owners.hop],
      ['Dry hop 1 name', 'cascade', MY_CASCADE, owners.hop],
      ['Strain', 'a07', MY_FLAGSHIP, owners.strain],
    ]) {
      type(name, typed);
      const found = lines(name);
      expect(found[0], name).toMatch(new RegExp(`^${mine.name.trim()}.*yours`));
      expect(found.slice(1).some((l) => l.startsWith(owner.name) && !/yours/.test(l)), name).toBe(true);
      leave(name);
    }

    // A pick of the brewer's copies the brewer's numbers; of the owner's, the owner's.
    search('Malt 1 name', 'golden promise');
    click(options('Malt 1 name')[0]);
    expect(JSON.parse(storedRecipe()).recipe.malts[0]).toMatchObject({ name: MY_GOLDEN.name, fgdb: 0.78, colorL: 2.6 });
    search('Malt 2 name', 'golden promise');
    click(options('Malt 2 name').find((li) => text(li).startsWith(owners.malt.name) && !/yours/.test(text(li))));
    expect(JSON.parse(storedRecipe()).recipe.malts[1]).toMatchObject({ name: owners.malt.name, fgdb: 0.81, colorL: 2.2 });
    search('Kettle hop 1 name', 'cascade');
    click(options('Kettle hop 1 name')[0]);
    expect(JSON.parse(storedRecipe()).recipe.kettleAdditions[0]).toMatchObject({ name: 'CASCADE', alphaAcidFraction: 0.071 });
    search('Kettle hop 2 name', 'cascade');
    click(options('Kettle hop 2 name').find((li) => text(li).startsWith('Cascade') && !/yours/.test(text(li))));
    expect(JSON.parse(storedRecipe()).recipe.kettleAdditions[1]).toMatchObject({ name: 'Cascade', alphaAcidFraction: 0.062 });
  });

  // SI-S2, K (ordering)
  it('My brewery says it is now also on the owner\'s list', () => {
    mount({ [BREWERY_KEY]: breweryDoc() });
    click(button('Options'));
    const line = "Now also on the owner's list, with its own numbers.";
    for (const name of [MY_GOLDEN.name, MY_CASCADE.name, MY_FLAGSHIP.name]) {
      expect(myRow(name), name).toContain(line);
    }
    expect(myRow('House Pale')).not.toContain(line);
    // Worked out each time My brewery is drawn, never stored.
    expect(window.localStorage.getItem(BREWERY_KEY)).not.toContain('owner');
  });

  // SI-S3, SI-S4
  it('it goes only when the brewer deletes it', async () => {
    const stored = breweryDoc();
    mount({ [BREWERY_KEY]: stored });
    expect(storedMine()).toEqual(MINE);
    unmount();
    // Reloaded: still there, the document as it was.
    mount({ [BREWERY_KEY]: window.localStorage.getItem(BREWERY_KEY) ?? stored });
    expect(storedMine()).toEqual(MINE);
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(stored);
    // The brewery file carries them and its import reads them.
    expect(importBreweryFile(stored, () => true).brewery.ingredients).toEqual(MINE);
    click(button('Options'));
    const picker = [...host.querySelectorAll('input[type=file]')].at(-1);
    Object.defineProperty(picker, 'files', { configurable: true, value: [new File([stored], 'mine.json', { type: 'application/json' })] });
    await act(async () => {
      picker.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(storedMine()).toEqual(MINE);
    // The brewer's Delete takes it away.
    click(button(`Delete ${MY_CASCADE.name} from My ingredients`));
    expect(storedMine()).toEqual({ ...MINE, hops: [] });
  });

  // SI-S5, SI-Q3, YS-Q5
  it('a strain in both lists: the information line and the warning read the brewer\'s', () => {
    mount({ [BREWERY_KEY]: breweryDoc() });
    type('Strain', 'A07 Flagship');
    leave('Strain');
    const card = [...host.querySelectorAll('span')].find((s) => text(s) === 'Yeast').parentElement;
    expect(text(card)).toMatch(/Yours · Ale · lab range 64–68 °F · attenuation 74 %/);
    type('Fermentation temperature °F', 70);
    expect(text(card)).toContain("Outside this strain's lab range, 64–68 °F");
    type('Fermentation temperature °F', 66);
    expect(text(card)).not.toContain('Outside this strain');
  });

  // SI-S4, MI-Q4
  it('saving the name again is refused', () => {
    mount({ [BREWERY_KEY]: breweryDoc() });
    const before = window.localStorage.getItem(BREWERY_KEY);
    for (const [name, typed] of [
      ['Malt 1 name', 'Golden Promise Pale Malt'],
      ['Kettle hop 1 name', 'Cascade'],
      ['Strain', 'A07 Flagship'],
    ]) {
      type(name, typed);
      expect(lines(name).some((l) => /^Save to my ingredients/.test(l)), name).toBe(false);
      expect(lines(name).some((l) => /already on the ingredient list/i.test(l)), name).toBe(true);
      leave(name);
    }
    expect(host.querySelector('[role=group][aria-label^="Save "]')).toBeNull();
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(before);
  });

  // SI-S6
  it('nothing else changes', () => {
    mount();
    const sheet = () => text(document.body.querySelector('.print-sheet'));
    const recipe = storedRecipe();
    const file = exportRecipeDocument(JSON.parse(recipe));
    const printed = sheet();
    const fresh = newRecipe(loadBrewery(window.localStorage));
    unmount();
    mount({ [BREWERY_KEY]: breweryDoc(), [STORAGE_KEY]: recipe });
    click(button('Options'));
    expect(storedRecipe()).toBe(recipe);
    expect(JSON.parse(recipe).version).toBe(SCHEMA_VERSION);
    expect(exportRecipeDocument(JSON.parse(storedRecipe()))).toBe(file);
    expect(sheet()).toBe(printed);
    expect(BREWERY_VERSION).toBe(7);
    expect(JSON.parse(window.localStorage.getItem(BREWERY_KEY)).version).toBe(7);
    expect(newRecipe(loadBrewery(window.localStorage))).toEqual({ ...fresh });
    expect(asked).toEqual([]);
  });
});
