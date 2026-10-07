// @vitest-environment jsdom
// my-ingredients.test.js
// Scenarios for "My ingredients" (docs/items/my-ingredients.md, MI-S1 to
// MI-S8, decisions MI-Q1 to MI-Q14 and K'). A brewer saves a malt or a hop
// that is not on the owner's list from its name box; it is offered again in
// this browser, kept with My brewery's figures (brewery format 6) and carried
// by the brewery file. The app is drawn whole, in jsdom, and driven as the
// brewer drives it: typing in the name and number boxes, choosing from the
// suggestions, the Options tab's buttons. The stored documents are read as
// this browser keeps them.
//
// No number is introduced: every figure saved is one the brewer typed or
// picked (79 % typed is the fraction 79 / 100 = 0.79, display.js's
// definitional percent factor), and 6 is the brewery document's format tag.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import ingredients from '../src/ingredients.json';
import { emptyBreweryFigures, newRecipe } from '../src/state.js';
import {
  STORAGE_KEY,
  BREWERY_KEY,
  BREWERY_VERSION,
  BREWERY_UNREADABLE_KEY,
  loadBrewery,
  saveBrewery,
  clearBrewery,
  exportBreweryDocument,
  importBreweryFile,
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

afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
  restoreStorage();
  window.localStorage.clear();
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const boxes = () => [...host.querySelectorAll('input, select, textarea')];

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

// The lines under a name box, as text: its suggestions and any save line.
function lines(name) {
  const id = box(name).getAttribute('aria-controls');
  const list = id ? document.getElementById(id) : null;
  return list ? [...list.querySelectorAll('li')].map(text) : [];
}

function line(name, startsWith) {
  const id = box(name).getAttribute('aria-controls');
  const list = id ? document.getElementById(id) : null;
  const found = list && [...list.querySelectorAll('li')].find((li) => text(li).startsWith(startsWith));
  if (!found) throw new Error(`no line "${startsWith}" under "${name}"`);
  return found;
}

const saveLine = (name) => lines(name).find((l) => l.startsWith('Save to my ingredients'));

// What this browser keeps.
const storedRecipe = () => window.localStorage.getItem(STORAGE_KEY);
const storedBrewery = () => JSON.parse(window.localStorage.getItem(BREWERY_KEY));
const storedMine = () => storedBrewery()?.brewery.ingredients;

// A brewery whose only change from blank is the brewer's own ingredients.
const HOUSE_PALE = { name: 'House Pale', fgdb: 0.79, colorL: 3, type: 'base', distilledWaterPh: null, acidityMeqPerKg: null };
const FARM_CASCADE = { name: 'Farm Cascade', alphaAcidFraction: 0.062 };
const withMine = (mine) => ({ ...emptyBreweryFigures(), ingredients: { malts: [], hops: [], ...mine } });
const breweryDoc = (mine) => exportBreweryDocument(withMine(mine));

// Type a malt in row 1 by hand: FGDB 79 %, colour 3 °L (Pale 2-Row's row,
// type Base), then its name.
function typeHousePale() {
  type('FGDB (%), Pale 2-Row', 79);
  type('Color (°L), Pale 2-Row', 3);
  type('Malt 1 name', 'House Pale');
}

describe('My ingredients', () => {
  // MI-S1, MI-Q2
  it('the save line is offered for a malt or boil-hop name on neither list, with the numbers it would keep, and never on a dry-hop row', () => {
    mount();
    typeHousePale();
    const malt = saveLine('Malt 1 name');
    expect(malt).toBeDefined();
    // Its FGDB, colour, malt type and the two lab figures (blank here).
    expect(malt).toContain('79 %');
    expect(malt).toContain('3 °L');
    expect(malt).toContain('Base');
    expect(malt).toMatch(/distilled-water pH —/);
    expect(malt).toMatch(/acidity —/);
    leave('Malt 1 name');

    // A boil hop: its alpha.
    type('Alpha (%), Magnum', 6.2);
    type('Kettle hop 1 name', 'Farm Cascade');
    expect(saveLine('Kettle hop 1 name')).toContain('6.2 %');
    leave('Kettle hop 1 name');

    // A dry hop has no figure to keep: never a save line.
    type('Dry hop 1 name', 'Farm Cascade');
    expect(saveLine('Dry hop 1 name')).toBeUndefined();
    // A blank name has none either.
    type('Malt 1 name', '');
    expect(saveLine('Malt 1 name')).toBeUndefined();
  });

  // MI-S2
  it('saving a malt keeps its name, FGDB, colour, type and lab figures, and the recipe does not change', () => {
    mount();
    typeHousePale();
    const recipeBefore = storedRecipe();
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(storedMine().malts).toEqual([HOUSE_PALE]);
    expect(storedMine().hops).toEqual([]);
    expect(storedRecipe()).toBe(recipeBefore);
    expect(box('Malt 1 name').value).toBe('House Pale');
    expect(host.textContent).toContain('Saved to My ingredients');

    // A lab figure picked with an owner's malt is kept with it.
    const aromatic = ingredients.malts.find((m) => m.name === 'Aromatic Malt');
    expect(aromatic.acidityMeqPerKg).toBe(14.2);
    type('Malt 2 name', 'Aromatic');
    click(line('Malt 2 name', 'Aromatic Malt'));
    type('Malt 2 name', 'Aromatic (lot 7)');
    expect(saveLine('Malt 2 name')).toMatch(/acidity 14\.2/);
    click(line('Malt 2 name', 'Save to my ingredients'));
    expect(storedMine().malts).toEqual([HOUSE_PALE, { ...aromatic, name: 'Aromatic (lot 7)' }]);
  });

  // MI-S3, MI-Q11
  it('a saved malt is offered in malt boxes and a saved hop in boil-hop and dry-hop boxes, marked as yours, ahead of the owner\'s list', () => {
    mount({ stored: { [BREWERY_KEY]: breweryDoc({ malts: [HOUSE_PALE], hops: [FARM_CASCADE] }) } });
    // "pale": House Pale only contains it, yet comes ahead of the owner's
    // malts that start with it.
    type('Malt 1 name', 'pale');
    const malts = lines('Malt 1 name');
    expect(malts[0]).toMatch(/^House Pale.*yours/);
    expect(malts.slice(1).some((l) => /yours/.test(l))).toBe(false);
    expect(malts.length).toBeGreaterThan(1);
    expect(malts.some((l) => l.startsWith('Farm Cascade'))).toBe(false);
    leave('Malt 1 name');

    for (const name of ['Kettle hop 1 name', 'Dry hop 1 name']) {
      type(name, 'cas');
      const hops = lines(name);
      expect(hops[0], name).toMatch(/^Farm Cascade.*yours/);
      expect(hops.some((l) => l.startsWith('Cascade')), name).toBe(true);
      expect(hops.some((l) => l.startsWith('House Pale')), name).toBe(false);
      leave(name);
    }
  });

  // MI-S3
  it('picking a saved ingredient fills the row as a pick from the owner\'s list does, leaving weight, time, temperature and price', () => {
    mount({ stored: { [BREWERY_KEY]: breweryDoc({ malts: [HOUSE_PALE], hops: [FARM_CASCADE] }) } });
    type('Price of Pale 2-Row ($/lb)', 1.25);
    type('Price of Magnum ($/oz)', 2.5);
    type('Malt 1 name', 'house');
    click(line('Malt 1 name', 'House Pale'));
    type('Kettle hop 1 name', 'farm');
    click(line('Kettle hop 1 name', 'Farm Cascade'));
    type('Dry hop 1 name', 'farm');
    click(line('Dry hop 1 name', 'Farm Cascade'));
    const { recipe } = JSON.parse(storedRecipe());
    // The malt's name, FGDB, colour, type and lab figures (blank, as JSON
    // keeps a blank); its weight and price as they were.
    expect(recipe.malts[0]).toEqual({ ...HOUSE_PALE, weightLb: 10, pricePerLb: 1.25 });
    // The boil hop's name and alpha; its time, temperature, weight and price as they were.
    expect(recipe.kettleAdditions[0]).toEqual({
      name: 'Farm Cascade',
      timeMin: 60,
      wortTempF: 212,
      weightOz: 1,
      alphaAcidFraction: 0.062,
      pricePerOz: 2.5,
    });
    // The dry hop: its name only.
    expect(recipe.dryHops[0]).toEqual({ name: 'Farm Cascade', weightOz: 2, pricePerOz: null });
  });

  // MI-S4, MI-Q4
  it('a name on the owner\'s list cannot be saved, capitals and accents ignored', () => {
    mount();
    for (const [name, typed] of [
      ['Kettle hop 1 name', 'Bravo'],
      ['Kettle hop 1 name', ' bravo '],
      ['Kettle hop 1 name', 'HALLERTAU MITTELFRUH'],
      ['Malt 1 name', '2-row brewers malt'],
    ]) {
      type(name, typed);
      expect(saveLine(name), typed).toBeUndefined();
      expect(lines(name).some((l) => /already on the ingredient list/i.test(l)), typed).toBe(true);
      click(line(name, 'Already on the ingredient list'));
      leave(name);
    }
    expect(window.localStorage.getItem(BREWERY_KEY)).toBeNull();
  });

  // MI-S4, K' (idempotence)
  it('saving a name already saved replaces it, and saving the same ingredient twice equals saving it once', () => {
    mount();
    typeHousePale();
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(asked).toEqual([]);
    const once = window.localStorage.getItem(BREWERY_KEY);

    // The same ingredient again (the name typed again opens its lines):
    // asked, and the same document as saving it once.
    type('Malt 1 name', 'House Pal');
    type('Malt 1 name', 'House Pale');
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(asked.length).toBe(1);
    expect(asked[0]).toMatch(/House Pale/);
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(once);

    // A new FGDB under the same name, capitals aside: asked; declined, kept as it was.
    type('FGDB (%), House Pale', 80);
    type('Malt 1 name', 'house pale');
    answer = false;
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(asked.length).toBe(2);
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(once);
    // Confirmed: replaced, in its place, one entry.
    answer = true;
    type('Malt 1 name', 'house pal');
    type('Malt 1 name', 'house pale');
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(asked.length).toBe(3);
    expect(storedMine().malts).toEqual([{ ...HOUSE_PALE, name: 'house pale', fgdb: 0.8 }]);
  });

  // MI-Q3
  it('a blank FGDB, colour or alpha refuses the save; a blank type or lab figure is kept blank', () => {
    for (const [box_, label] of [
      ['FGDB (%), Pale 2-Row', 'FGDB'],
      ['Color (°L), Pale 2-Row', 'colour'],
    ]) {
      mount();
      type(box_, '');
      type('Malt 1 name', 'House Pale');
      expect(saveLine('Malt 1 name'), label).toBeUndefined();
      const refusal = lines('Malt 1 name').find((l) => /can't save/i.test(l));
      expect(refusal, label).toMatch(new RegExp(label, 'i'));
      click(line('Malt 1 name', refusal));
      expect(window.localStorage.getItem(BREWERY_KEY), label).toBeNull();
      act(() => root.unmount());
      host.remove();
    }
    mount();
    type('Alpha (%), Magnum', '');
    type('Kettle hop 1 name', 'Farm Cascade');
    expect(saveLine('Kettle hop 1 name')).toBeUndefined();
    expect(lines('Kettle hop 1 name').some((l) => /can't save.*alpha/i.test(l))).toBe(true);
    leave('Kettle hop 1 name');

    // A blank type (and so no lab figures) is kept blank.
    choose('Malt type, Pale 2-Row', '');
    type('FGDB (%), Pale 2-Row', 79);
    type('Color (°L), Pale 2-Row', 3);
    type('Malt 1 name', 'House Pale');
    expect(saveLine('Malt 1 name')).toMatch(/type —/);
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(storedMine().malts).toEqual([{ ...HOUSE_PALE, type: '' }]);
  });

  // MI-S5', MI-S6
  it('deleting a saved ingredient changes no recipe', () => {
    mount({ stored: { [BREWERY_KEY]: breweryDoc({ malts: [HOUSE_PALE], hops: [FARM_CASCADE] }) } });
    type('Malt 1 name', 'house');
    click(line('Malt 1 name', 'House Pale'));
    const recipeBefore = storedRecipe();
    click(button('Options'));
    expect(host.textContent).toContain('My ingredients');
    click(button('Delete House Pale from My ingredients'));
    expect(asked).toEqual([]);
    expect(storedMine()).toEqual({ malts: [], hops: [FARM_CASCADE] });
    expect(storedRecipe()).toBe(recipeBefore);
    expect(() => button('Delete House Pale from My ingredients')).toThrow();
    expect(() => button('Delete Farm Cascade from My ingredients')).not.toThrow();
    // The row picked from it keeps its own copy.
    expect(JSON.parse(storedRecipe()).recipe.malts[0]).toMatchObject({ name: 'House Pale', fgdb: 0.79, colorL: 3 });
    click(button('Recipe'));
    type('Malt 2 name', 'house');
    expect(lines('Malt 2 name').some((l) => l.startsWith('House Pale'))).toBe(false);
  });

  // MI-Q8', K' (format)
  it('the brewery document carries My ingredients at version 6; a version 1 to 5 document loads with none and is saved back as 6', () => {
    expect(BREWERY_VERSION).toBe(6);
    const s = window.localStorage;
    s.clear();
    const mine = withMine({ malts: [HOUSE_PALE], hops: [FARM_CASCADE] });
    saveBrewery(s, mine);
    const doc = JSON.parse(s.getItem(BREWERY_KEY));
    expect(doc.version).toBe(6);
    expect(doc.brewery.ingredients).toEqual({ malts: [HOUSE_PALE], hops: [FARM_CASCADE] });
    expect(loadBrewery(s)).toEqual(mine);

    // Versions 1 to 5, each in its own shape: read with no ingredients and
    // the figures as they were; saved back as 6.
    const { ingredients: _none, ...v5 } = { ...emptyBreweryFigures(), fermentVolGal: 12 };
    const { proVolumeUnit, proMaltUnit, ...v4 } = v5;
    const { temperatureUnit, ...v3 } = v4;
    const { water, ...v1 } = v3;
    const v2 = { ...v3, water: { ...water, keptInTunGal: null } };
    for (const [version, brewery] of [[1, v1], [2, v2], [3, v3], [4, v4], [5, v5]]) {
      s.clear();
      s.setItem(BREWERY_KEY, JSON.stringify({ version, brewery }));
      const loaded = loadBrewery(s);
      expect(loaded.ingredients, `version ${version}`).toEqual({ malts: [], hops: [] });
      expect(loaded.fermentVolGal, `version ${version}`).toBe(12);
      const back = JSON.parse(s.getItem(BREWERY_KEY));
      expect(back.version, `version ${version}`).toBe(6);
      expect(back.brewery.ingredients, `version ${version}`).toEqual({ malts: [], hops: [] });
    }

    // A damaged entry makes the document unreadable, as a damaged row does a recipe.
    for (const [why, damaged] of [
      ['FGDB as text', { malts: [{ ...HOUSE_PALE, fgdb: '79' }], hops: [] }],
      ['FGDB missing', { malts: [{ ...HOUSE_PALE, fgdb: null }], hops: [] }],
      ['a type the model does not know', { malts: [{ ...HOUSE_PALE, type: 'smoked' }], hops: [] }],
      ['acidity on a base malt', { malts: [{ ...HOUSE_PALE, acidityMeqPerKg: 14.2 }], hops: [] }],
      ['distilled-water pH on a crystal malt', { malts: [{ ...HOUSE_PALE, type: 'crystal', distilledWaterPh: 5.7 }], hops: [] }],
      ['an alpha missing', { malts: [], hops: [{ name: 'Farm Cascade' }] }],
      ['a blank name', { malts: [], hops: [{ ...FARM_CASCADE, name: ' ' }] }],
      ['no hops list', { malts: [] }],
    ]) {
      s.clear();
      s.setItem(BREWERY_KEY, JSON.stringify({ version: 6, brewery: { ...emptyBreweryFigures(), fermentVolGal: 12, ingredients: damaged } }));
      expect(loadBrewery(s), why).toEqual(emptyBreweryFigures());
    }
    // A version-6 document without the list is not one.
    s.clear();
    const { ingredients: _gone, ...noList } = emptyBreweryFigures();
    s.setItem(BREWERY_KEY, JSON.stringify({ version: 6, brewery: { ...noList, fermentVolGal: 12 } }));
    expect(loadBrewery(s)).toEqual(emptyBreweryFigures());
  });

  // MI-S7', MI-Q13
  it('the brewery file carries them; importing one replaces them, and an older file empties the list with the question naming how many go', async () => {
    const theirs = withMine({ malts: [{ ...HOUSE_PALE, name: 'Their Pale' }], hops: [] });
    const file = exportBreweryDocument(theirs);
    expect(JSON.parse(file).brewery.ingredients).toEqual(theirs.ingredients);
    expect(importBreweryFile(file, () => true).brewery).toEqual(theirs);

    // In the app: the import's one question, then the file's list in place of ours.
    const importFile = async (name, contents) => {
      // The brewery file's picker: the last on the page (the header's is the recipe's).
      const picker = [...host.querySelectorAll('input[type=file]')].at(-1);
      const f = new File([contents], name, { type: 'application/json' });
      Object.defineProperty(picker, 'files', { configurable: true, value: [f] });
      await act(async () => {
        picker.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));
      });
    };
    mount({ stored: { [BREWERY_KEY]: breweryDoc({ malts: [HOUSE_PALE], hops: [FARM_CASCADE] }) } });
    click(button('Options'));
    const recipeBefore = storedRecipe();
    await importFile('theirs.json', file);
    expect(asked.length).toBe(1);
    expect(asked[0]).toMatch(/My ingredients/);
    expect(asked[0]).toMatch(/2 saved ingredients/);
    expect(storedMine()).toEqual(theirs.ingredients);
    expect(storedRecipe()).toBe(recipeBefore);
    expect(() => button('Delete Their Pale from My ingredients')).not.toThrow();

    // Declined: nothing changes.
    answer = false;
    await importFile('again.json', breweryDoc({ malts: [], hops: [FARM_CASCADE] }));
    expect(asked.length).toBe(2);
    expect(storedMine()).toEqual(theirs.ingredients);

    // An older file (version 5, no ingredients): the question names how many
    // go; confirmed, the list is empty.
    answer = true;
    const { ingredients: _none, ...v5 } = { ...emptyBreweryFigures(), fermentVolGal: 12 };
    await importFile('old.json', JSON.stringify({ version: 5, brewery: v5 }));
    expect(asked.length).toBe(3);
    expect(asked[2]).toMatch(/1 saved ingredient\b/);
    expect(asked[2]).toMatch(/will go/);
    expect(storedMine()).toEqual({ malts: [], hops: [] });
    expect(storedBrewery().brewery.fermentVolGal).toBe(12);
  });

  // K' (unreadable)
  it('an unreadable brewery copy is set aside under its own key before anything overwrites it', () => {
    for (const unreadable of [
      '{not json',
      JSON.stringify({ version: 7, brewery: withMine({ malts: [HOUSE_PALE] }) }),
      JSON.stringify({ version: 6, brewery: { ...withMine({}), fermentVolGal: 'twelve' } }),
    ]) {
      const s = window.localStorage;
      s.clear();
      s.setItem(BREWERY_KEY, unreadable);
      expect(loadBrewery(s)).toEqual(emptyBreweryFigures());
      expect(s.getItem(BREWERY_UNREADABLE_KEY)).toBe(unreadable);
      expect(BREWERY_UNREADABLE_KEY).not.toBe(BREWERY_KEY);
    }
    // In the app: kept aside at load; a brewery figure set then writes a new
    // document and leaves the kept copy as found.
    mount({ stored: { [BREWERY_KEY]: '{not json' } });
    expect(window.localStorage.getItem(BREWERY_UNREADABLE_KEY)).toBe('{not json');
    click(button('Options'));
    type('Boil time (min)', 75);
    expect(storedBrewery().brewery.boilTimeMin).toBe(75);
    expect(window.localStorage.getItem(BREWERY_UNREADABLE_KEY)).toBe('{not json');
    // Keeping it never stops a load.
    const blocked = {
      getItem: (k) => (k === BREWERY_KEY ? '{not json' : null),
      setItem: () => {
        throw new Error('full');
      },
      removeItem: () => {},
    };
    expect(loadBrewery(blocked)).toEqual(emptyBreweryFigures());
  });

  // K' (multi-tab)
  it('a save re-reads the stored brewery first, so an ingredient saved in another tab is kept', () => {
    mount();
    // Another tab saves an ingredient and a figure after this one loaded.
    window.localStorage.setItem(BREWERY_KEY, breweryDoc({ hops: [FARM_CASCADE] }));
    typeHousePale();
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(storedMine()).toEqual({ malts: [HOUSE_PALE], hops: [FARM_CASCADE] });

    // A brewery figure set here keeps an ingredient another tab saved.
    window.localStorage.setItem(
      BREWERY_KEY,
      breweryDoc({ malts: [HOUSE_PALE, { ...HOUSE_PALE, name: 'Other Tab Pale' }], hops: [FARM_CASCADE] }),
    );
    click(button('Options'));
    type('Boil time (min)', 75);
    expect(storedBrewery().brewery.boilTimeMin).toBe(75);
    expect(storedMine().malts.map((m) => m.name)).toEqual(['House Pale', 'Other Tab Pale']);
    // A delete here keeps the rest, the other tab's included.
    click(button('Delete House Pale from My ingredients'));
    expect(storedMine()).toEqual({ malts: [{ ...HOUSE_PALE, name: 'Other Tab Pale' }], hops: [FARM_CASCADE] });
  });

  // MI-S8
  it('with storage off or an unreadable brewery, the boxes offer the owner\'s list only, nothing throws, and saving says it could not keep it', async () => {
    // Storage off.
    expect(() => mount({ storageOff: true })).not.toThrow();
    type('Malt 1 name', 'pale');
    expect(lines('Malt 1 name').some((l) => /yours/.test(l))).toBe(false);
    expect(lines('Malt 1 name').length).toBeGreaterThan(0);
    type('FGDB (%), pale', 79);
    type('Malt 1 name', 'House Pale');
    expect(() => click(line('Malt 1 name', 'Save to my ingredients'))).not.toThrow();
    expect(host.textContent).toMatch(/House Pale could not be kept/);
    type('Malt 2 name', 'house');
    expect(lines('Malt 2 name').some((l) => /yours/.test(l))).toBe(false);
    act(() => root.unmount());
    host.remove();

    // Storage off, a brewery file with ingredients imported: its figures on
    // screen for the session as before, its ingredients not offered, and the
    // import says they could not be kept.
    expect(() => mount({ storageOff: true })).not.toThrow();
    click(button('Options'));
    const picker = [...host.querySelectorAll('input[type=file]')].at(-1);
    const f = new File([breweryDoc({ malts: [HOUSE_PALE], hops: [FARM_CASCADE] })], 'mine.json', { type: 'application/json' });
    Object.defineProperty(picker, 'files', { configurable: true, value: [f] });
    await act(async () => {
      picker.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(asked.length).toBe(1);
    expect(host.textContent).toMatch(/2 saved ingredients could not be kept/);
    expect(() => button('Delete House Pale from My ingredients')).toThrow();
    click(button('Recipe'));
    type('Malt 1 name', 'house');
    expect(lines('Malt 1 name').some((l) => /yours/.test(l))).toBe(false);
    type('Kettle hop 1 name', 'farm');
    expect(lines('Kettle hop 1 name').some((l) => /yours/.test(l))).toBe(false);
    act(() => root.unmount());
    host.remove();

    // A stored brewery that cannot be read: the owner's list only, nothing
    // throws, and saving says it could not be kept, the stored copy left as found.
    const damaged = JSON.stringify({ version: 6, brewery: 'damaged' });
    expect(() => mount({ stored: { [BREWERY_KEY]: damaged } })).not.toThrow();
    type('Malt 1 name', 'pale');
    expect(lines('Malt 1 name').some((l) => /yours/.test(l))).toBe(false);
    expect(lines('Malt 1 name').length).toBeGreaterThan(0);
    type('FGDB (%), pale', 79);
    type('Malt 1 name', 'House Pale');
    expect(() => click(line('Malt 1 name', 'Save to my ingredients'))).not.toThrow();
    expect(host.textContent).toMatch(/House Pale could not be kept/);
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(damaged);
    type('Malt 2 name', 'house');
    expect(lines('Malt 2 name').some((l) => /yours/.test(l))).toBe(false);
  });

  // MI-Q12, MI-Q14
  it('saving an ingredient does not end the banner, and "Forget my brewery figures" keeps the ingredients', () => {
    mount();
    const banner = () => host.textContent.includes('Set up My brewery so new recipes start from your equipment');
    expect(banner()).toBe(true);
    typeHousePale();
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(storedMine().malts).toEqual([HOUSE_PALE]);
    expect(banner()).toBe(true);

    // "Use this recipe's figures" rewrites the figures and keeps the ingredients.
    click(button('Options'));
    click(button("Use this recipe's figures"));
    expect(storedBrewery().brewery.fermentVolGal).toBe(5.5);
    expect(storedMine().malts).toEqual([HOUSE_PALE]);

    // Forget: its question says the ingredients stay; the figures clear, the ingredients stay.
    click(button('Forget my brewery figures'));
    expect(asked.at(-1)).toMatch(/My ingredients are kept/);
    expect(storedBrewery().brewery).toEqual(withMine({ malts: [HOUSE_PALE] }));
    expect(() => button('Delete House Pale from My ingredients')).not.toThrow();
    expect(banner()).toBe(true);

    // With no ingredients, Forget removes the document as before.
    const s = { m: new Map() };
    const storage = { getItem: (k) => s.m.get(k) ?? null, setItem: (k, v) => s.m.set(k, v), removeItem: (k) => s.m.delete(k) };
    saveBrewery(storage, { ...emptyBreweryFigures(), fermentVolGal: 12 });
    clearBrewery(storage);
    expect(storage.getItem(BREWERY_KEY)).toBeNull();
  });

  // MI-S6
  it('nothing else changes: the recipe document, the recipe file, the printed sheet and a new recipe are as before', () => {
    mount();
    const sheet = () => text(document.body.querySelector('.print-sheet'));
    const read = () => JSON.parse(storedRecipe());
    // A first visit: this browser's brewery, and no saved recipe.
    const firstVisit = () =>
      loadStartingState({
        getItem: (k) => (k === BREWERY_KEY ? window.localStorage.getItem(k) : null),
        setItem: () => {},
        removeItem: () => {},
      });
    const fresh = newRecipe(loadBrewery(window.localStorage));
    const starting = firstVisit();

    typeHousePale();
    const typedDoc = storedRecipe();
    const typedFile = exportRecipeDocument(read());
    const typedSheet = sheet();
    expect(typedSheet).toContain('House Pale');
    click(line('Malt 1 name', 'Save to my ingredients'));
    expect(storedMine().malts).toEqual([HOUSE_PALE]);
    // The recipe document and the recipe file, byte for byte; the printed sheet, word for word.
    expect(storedRecipe()).toBe(typedDoc);
    expect(exportRecipeDocument(read())).toBe(typedFile);
    expect(typedFile).toBe(typedDoc);
    expect(sheet()).toBe(typedSheet);
    expect(JSON.parse(typedDoc).recipe).not.toHaveProperty('ingredients');
    // A new recipe (Reset, or a first visit) is as it was.
    expect(newRecipe(loadBrewery(window.localStorage))).toEqual(fresh);
    expect(firstVisit()).toEqual(starting);
  });
});
