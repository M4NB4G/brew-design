// @vitest-environment jsdom
// grain-bill-edits-return-acid.test.js
// Scenarios for batch S17 item 3, "Grain bill edits return the brewer's own
// acid to the recommendation" (docs/items/grain-bill-edits-return-acid.md,
// GA-S1 to GA-S6, GA-Q1 to GA-Q4, K). The app is drawn whole, in jsdom, and
// driven as the brewer drives it; the recipe is read back as this browser
// saves it.
//
// The recipe: the built-in one with the example water report, the brewer's
// own gypsum (2 g) and 88 % lactic acid (3 mL, every other acid 0). An edit
// the predicted mash pH reads returns the acid to the recommendation (saved
// as no amounts of the brewer's own: null); the salts stay. Any other edit
// leaves both as typed.
//
// No number is introduced. The scale (GA-S5) multiplies the acid by the
// batch over the fermentation volume, by the engine, as before: Home to Pro
// at 10 bbl = 310 gal over 5.5 gal, 3 mL x 310 / 5.5 = 169.0909... mL.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ACIDS } from '@brew/engine';
import App from '../src/App.jsx';
import { defaultRecipeState } from '../src/state.js';
import { STORAGE_KEY, exportRecipeDocument } from '../src/persistence.js';
import { EXAMPLE_SOURCE } from '../src/water-state.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OWN_ACID = { ...Object.fromEntries(Object.keys(ACIDS).map((k) => [k, 0])), lactic_88: 3 };
const OWN_SALTS = { gypsum: 2 };

const recipeWith = (water = {}) => {
  const r = defaultRecipeState();
  return {
    ...r,
    water: { ...r.water, source: { ...EXAMPLE_SOURCE }, saltOverrides: OWN_SALTS, acidAmounts: OWN_ACID, ...water },
  };
};
// With the HLT treated and the acid with the salts: the mash water is not
// the treated volume, so before this item its edit returned nothing.
const HLT = { treatment: 'tank', acidPlace: 'salts', vessels: 3, spargeMethod: 'batch', spargeGal: 4, tankTreatedGal: 10, tankTopUpGal: 10 };

let root;
let host;
function mount(recipe = recipeWith()) {
  window.localStorage.clear();
  window.localStorage.setItem(STORAGE_KEY, exportRecipeDocument({ recipe, mode: 'home', proGravityUnit: 'plato' }));
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(App)));
  // The saved recipe is read: the brewer's own acid and salts.
  expect(saved().water.acidAmounts).toEqual(OWN_ACID);
}
afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = undefined;
  window.localStorage.clear();
});

const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe;
const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const boxes = () => [...host.querySelectorAll('input, select, textarea')];
function box(name) {
  const found = boxes().find((el) => el.getAttribute('aria-label') === name);
  if (!found) throw new Error(`no box named "${name}"`);
  return found;
}
const boxStarting = (start) => {
  const found = boxes().find((el) => (el.getAttribute('aria-label') ?? '').startsWith(start));
  if (!found) throw new Error(`no box starting "${start}"`);
  return found;
};
function type(el, value) {
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
function choose(el, value) {
  act(() => {
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
}
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
function button(label) {
  const found = [...host.querySelectorAll('button')].find((b) => text(b) === label || b.getAttribute('aria-label') === label);
  if (!found) throw new Error(`no button "${label}"`);
  return found;
}

const returned = (what) => {
  expect(saved().water.acidAmounts, what).toBeNull();
  expect(saved().water.saltOverrides, what).toEqual(OWN_SALTS);
};
const kept = (what) => {
  expect(saved().water.acidAmounts, what).toEqual(OWN_ACID);
  expect(saved().water.saltOverrides, what).toEqual(OWN_SALTS);
};

describe("grain bill edits return the brewer's own acid (S17 item 3)", () => {
  it('GA-S1, GA-S4: each edit the predicted mash pH reads returns the acid; the salts stay', () => {
    const edits = [
      ['a weight', () => type(box('Weight (lb), Munich'), 1.5)],
      // K, idempotence: retyping the weight it already has (the box cleared,
      // then 1 typed again; a keystroke that leaves the box's text as it was
      // is no edit at all) still returns it, the weight as it was.
      [
        'the same weight',
        () => {
          type(box('Weight (lb), Munich'), '');
          type(box('Weight (lb), Munich'), 1);
          expect(saved().malts[1].weightLb).toBe(1);
        },
      ],
      ['a type', () => choose(box('Malt type, Munich'), 'crystal')],
      ['a colour', () => type(box('Color (°L), Munich'), 12)],
      ['a malt added', () => click(button('+ Add malt'))],
      ['a malt removed', () => click(host.querySelectorAll('button[aria-label="Remove malt"]')[1])],
      [
        'a pick from the ingredient list (its colour, type and lab figures)',
        () => {
          const name = box('Malt 2 name');
          type(name, 'American Crystal 40');
          const list = document.getElementById(name.getAttribute('aria-controls'));
          click([...list.querySelectorAll('li')].find((li) => text(li).startsWith('American Crystal 40')));
          expect(saved().malts[1].name).toBe('American Crystal 40');
          expect(saved().malts[1].type).toBe('crystal');
        },
      ],
    ];
    for (const [what, edit] of edits) {
      mount();
      edit();
      returned(what);
      act(() => root.unmount());
      host.remove();
      root = undefined;
    }
  });

  it('GA-S1, K: a pick from the ingredient list returns the acid even when it leaves every figure the pH reads as it was', () => {
    // Malt 2 already holds American Crystal 40's type, colour and blank lab
    // figures; the pick changes its name and FGDB only.
    const r = recipeWith();
    const malts = r.malts.map((m, i) => (i === 1 ? { ...m, type: 'crystal', colorL: 40 } : m));
    mount({ ...r, malts });
    const name = box('Malt 2 name');
    type(name, 'American Crystal 40');
    const list = document.getElementById(name.getAttribute('aria-controls'));
    click([...list.querySelectorAll('li')].find((li) => text(li).startsWith('American Crystal 40')));
    expect(saved().malts[1]).toMatchObject({ name: 'American Crystal 40', type: 'crystal', colorL: 40 });
    returned('a pick, pH figures unchanged');
  });

  it('GA-S1: a mash water edit returns the acid with the HLT treated too (before, only with the acid into the mash)', () => {
    mount(recipeWith(HLT));
    type(boxStarting('Mash water'), 5.5);
    returned('mash water, HLT treated, acid with the salts');
  });

  it('GA-Q5: with the mash water treated, a mash water edit returns the salts too (the owner, 2026-10-14)', () => {
    mount(recipeWith({ treatment: 'mash' }));
    type(boxStarting('Mash water'), 5.5);
    expect(saved().water.acidAmounts).toBeNull();
    expect(saved().water.saltOverrides).toEqual({});
  });

  it('GA-S2: an edit the predicted mash pH does not read leaves the acid as typed', () => {
    const edits = [
      ["a malt's name", () => type(box('Malt 2 name'), 'Munich II')],
      ["a malt's FGDB", () => type(boxStarting('FGDB'), 81)],
      ["a malt's price", () => type(boxStarting('Price of Pale 2-Row'), 1.2)],
      ['a kettle hop', () => type(box('Wt (oz), Magnum'), 1.5)],
      ['a dry hop', () => type(box('Wt (oz), Citra'), 3)],
      ['a volume', () => type(boxStarting('Pre-boil volume'), 7.5)],
      ['the yeast', () => type(boxStarting('Apparent attenuation'), 75)],
    ];
    for (const [what, edit] of edits) {
      mount();
      edit();
      kept(what);
      act(() => root.unmount());
      host.remove();
      root = undefined;
    }
  });

  it('GA-S3: Solve returns the acid; Undo solve restores the weights but not the old acid', () => {
    mount();
    const before = saved().malts.map((m) => m.weightLb);
    click(button('Design to target OG'));
    type(boxStarting('Target OG'), 1.06);
    click(button('Solve'));
    expect(saved().malts.map((m) => m.weightLb)).not.toEqual(before);
    returned('Solve');
    click(button('Undo solve'));
    expect(saved().malts.map((m) => m.weightLb)).toEqual(before);
    returned('Undo solve');
  });

  it('GA-S5: the Home/Pro scale multiplies the acid and does not return it', () => {
    mount();
    click(button('Pro'));
    const w = saved().water;
    expect(w.acidAmounts).not.toBeNull();
    expect(w.acidAmounts.lactic_88).toBeCloseTo((3 * 310) / 5.5, 9);
    expect(w.saltOverrides.gypsum).toBeCloseTo((2 * 310) / 5.5, 9);
  });

  it('GA-S6: no saved format changes', () => {
    mount();
    type(box('Weight (lb), Munich'), 1.5);
    const doc = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(doc.version).toBe(13);
    expect(Object.keys(doc.recipe.water).sort()).toEqual(Object.keys(defaultRecipeState().water).sort());
  });
});
