// @vitest-environment jsdom
// water-box-keeps-its-figure.test.js
// Scenarios for "A water box keeps its figure until typed in"
// (docs/items/water-box-keeps-its-figure.md, LB-S1 to LB-S4, LB-Q1, LB-Q2;
// Tier B). The app is drawn whole, in jsdom, from a saved West Coast Pilsner
// (west-coast-pils.fixture.js), the acid with the salts in the tank.
//
// Hand figures. The recommended 75 % phosphoric is the fixture's
// 22.6874642283088 mL (the tank's 14 gal, worked there): to 0.1 mL at Home
// it reads 22.7, to whole mL in Pro 23; in full (six decimals, as the volume
// boxes show a figure with the cursor in them, BA1) 22.687464. Gypsum's
// recommendation, 3.720139... g, reads 3.7 to 0.1 g at Home. A dose typed
// 2.45 mL reads 2.5 to 0.1 mL (2.45 is held as 2.4500000000000001776..., so
// it rounds up) and 2.45 in full; in Pro, to whole mL, 2.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import { STORAGE_KEY, savePersisted } from '../src/persistence.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import { wcPils, wcPilsMalts, TANK_REC_ML } from './west-coast-pils.fixture.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ACID = '75% Phosphoric Acid (mL)';
const GYPSUM = 'Gypsum (CaSO₄·2H₂O) (g)';
const FIRST_MALT = `Weight (lb), ${wcPilsMalts()[0].name}`;

let root;
let host;

// Saves the recipe as the app saves it, then draws the app on the Salts &
// Acid screen. The scale question on a Home/Pro switch is answered no, so a
// switch changes units only (SPEC rule 8).
function mount(recipe, mode = 'home') {
  window.localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => false;
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  savePersisted(window.localStorage, {
    recipe,
    mode,
    proGravityUnit: 'plato',
    temperatureUnit: 'F',
    proVolumeUnit: 'bbl',
    proMaltUnit: 'lb',
  });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(App)));
  saltsScreen();
}

afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

function click(el) {
  act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

function button(label) {
  const found = [...host.querySelectorAll('button')].find((b) => text(b) === label);
  if (!found) throw new Error(`no button "${label}"`);
  return found;
}

function saltsScreen() {
  click(button('Water'));
  click(button('Salts & Acid'));
}

function box(name) {
  const found = [...host.querySelectorAll('input')].find((el) => el.getAttribute('aria-label') === name);
  if (!found) throw new Error(`no box named "${name}"`);
  return found;
}

const shown = (name) => box(name).value;
const focus = (name) => act(() => box(name).focus());
const blur = (name) => act(() => box(name).blur());

// Sets a box's text as typing does, without moving the cursor.
function setText(el, value) {
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// Types into a box as the brewer does: the cursor is in it.
function type(name, value) {
  focus(name);
  setText(box(name), value);
}

const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe;
const savedWater = () => saved().water;
// The saved recipe as the app reads it back (NaN for a blank).
const savedRecipe = () => {
  const doc = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  return JSON.parse(JSON.stringify(doc.recipe), (k, v) => (v === null && k !== 'acidAmounts' ? NaN : v));
};

describe('leaving a salt or acid box without typing changes nothing (LB-S1)', () => {
  it('leaving a box without typing keeps the recommendation', () => {
    mount(wcPils({ acidPlace: 'salts' }));
    expect(shown(ACID)).toBe('22.7');
    expect(savedWater().acidAmounts).toBeNull(); // following the recommendation

    focus(ACID);
    blur(ACID);
    expect(savedWater().acidAmounts, 'the acid still follows the recommendation').toBeNull();
    expect(shown(ACID)).toBe('22.7');

    // A later edit that moves the recommendation moves the dose: 14 lb of
    // the first malt in place of 12 changes the predicted mash pH, and the
    // box follows the recommendation the engine works for it.
    click(button('Recipe'));
    type(FIRST_MALT, '14');
    blur(FIRST_MALT);
    const moved = savedRecipe();
    const rec = computeWater(moved.water, moved).acid.recommended;
    expect(Math.abs(rec - TANK_REC_ML)).toBeGreaterThan(0.1);
    expect(savedWater().acidAmounts).toBeNull();
    saltsScreen();
    expect(shown(ACID)).toBe(rec.toFixed(1));
  });

  it('leaving a salt box without typing keeps the recommendation', () => {
    mount(wcPils({ acidPlace: 'salts' }));
    expect(shown(GYPSUM)).toBe('3.7');
    focus(GYPSUM);
    blur(GYPSUM);
    expect(savedWater().saltOverrides, 'no salt amount of the brewer’s own').toEqual({});
    expect(shown(GYPSUM)).toBe('3.7');
  });

  it('focusing and leaving any number of times changes nothing (idempotence)', () => {
    mount(wcPils({ acidPlace: 'salts' }));
    const before = window.localStorage.getItem(STORAGE_KEY);
    for (let i = 0; i < 3; i++) {
      focus(ACID);
      blur(ACID);
      focus(GYPSUM);
      blur(GYPSUM);
    }
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(before);
  });

  it('a saved dose stays as saved', () => {
    // 2.45 mL saved; Pro shows 2, Home 2.5; leaving the box in each keeps 2.45.
    mount(wcPils({ acidPlace: 'salts', acidMl: 2.45 }), 'pro');
    expect(shown(ACID)).toBe('2');
    focus(ACID);
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(2.45);

    click(button('Home'));
    saltsScreen();
    expect(shown(ACID)).toBe('2.5');
    focus(ACID);
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(2.45);
  });

  it('a recommendation that moves while the cursor is in an untouched box moves the box with it (ordering)', () => {
    mount(wcPils({ acidPlace: 'salts' }));
    focus(ACID);
    expect(shown(ACID)).toBe('22.687464'); // the full figure with the cursor in it
    // The target mash pH changes while the cursor stays in the acid box.
    setText(box('Target mash pH (cooled sample)'), '5.5');
    expect(document.activeElement).toBe(box(ACID));
    const now = savedRecipe();
    const rec = computeWater(now.water, now).acid.recommended;
    expect(Math.abs(rec - TANK_REC_ML)).toBeGreaterThan(1);
    expect(shown(ACID)).toBe(String(Number(rec.toFixed(6))));
    blur(ACID);
    expect(savedWater().acidAmounts).toBeNull();
    expect(shown(ACID)).toBe(rec.toFixed(1));
  });
});

describe('a typed dose is kept as typed (LB-S2)', () => {
  it('a typed dose keeps every digit', () => {
    mount(wcPils({ acidPlace: 'salts' }));
    type(ACID, '2.45');
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(2.45);
    expect(shown(ACID), 'away from the cursor, 0.1 mL at Home').toBe('2.5');
    focus(ACID);
    expect(shown(ACID), 'with the cursor in it, the full figure').toBe('2.45');
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(2.45);
  });

  it('a typed salt amount keeps every digit', () => {
    mount(wcPils({ acidPlace: 'salts' }));
    type(GYPSUM, '3.75');
    blur(GYPSUM);
    expect(savedWater().saltOverrides.gypsum).toBe(3.75);
    expect(shown(GYPSUM)).toBe('3.8'); // 3.75 is exact in binary; toFixed(1) rounds it up
    focus(GYPSUM);
    expect(shown(GYPSUM)).toBe('3.75');
  });
});

describe('an emptied box is as today (LB-S3)', () => {
  it('an emptied acid or salt box reads 0 once left', () => {
    mount(wcPils({ acidPlace: 'salts' }));
    type(ACID, '');
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(0);
    expect(shown(ACID)).toBe('0.0');
    type(GYPSUM, '');
    blur(GYPSUM);
    expect(savedWater().saltOverrides.gypsum).toBe(0);
    expect(shown(GYPSUM)).toBe('0.0');
  });
});

describe('nothing else changes (LB-S4)', () => {
  it('the screen, the water figures, the printed sheet and the saved recipe are the same after leaving every box untouched', () => {
    mount(wcPils({ acidPlace: 'salts' }));
    const doc = window.localStorage.getItem(STORAGE_KEY);
    const screen = host.innerHTML;
    const before = savedRecipe();
    const figures = computeWater(before.water, before);
    const sheet = recipeSheet({
      recipe: before,
      derived: computeRecipe(before),
      water: figures,
      mode: 'home',
      proGravityUnit: 'plato',
      today: new Date(2026, 9, 13),
    });
    for (const el of host.querySelectorAll('input[type="text"]')) {
      act(() => el.focus());
      act(() => el.blur());
    }
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(doc);
    expect(JSON.parse(doc).version).toBe(13);
    expect(host.innerHTML).toBe(screen);
    const after = savedRecipe();
    expect(computeWater(after.water, after)).toEqual(figures);
    expect(
      recipeSheet({
        recipe: after,
        derived: computeRecipe(after),
        water: computeWater(after.water, after),
        mode: 'home',
        proGravityUnit: 'plato',
        today: new Date(2026, 9, 13),
      }),
    ).toEqual(sheet);
  });
});
