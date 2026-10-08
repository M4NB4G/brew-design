// @vitest-environment jsdom
// reference-typed-in-celsius.test.js
// Scenarios for "15.6 °C typed is the reference", batch S11 item 2
// (docs/items/reference-typed-in-celsius.md, RT-S1 to RT-S4, decisions RT-Q1
// and RT-Q2). In °C, a temperature typed as the reference shows it (15.6, the
// 60 °F reference's °C to one decimal) is stored as the reference, 60 °F
// exactly; every other °C entry is stored as the engine's conversion, as
// before; this holds for every temperature box. The app is drawn whole, in
// jsdom, and each box is typed into as a keystroke does; what is stored is
// read back from the saved copy the autosave writes.
//
// Hand pins (F = C x 9/5 + 32):
//   15.6 °C -> 15.6 x 1.8 = 28.08, + 32 = 60.08 °F (the conversion; not the
//              reference, which is the engine's REFERENCE_TEMP_F, 60 °F)
//   15.5 °C -> 15.5 x 1.8 = 27.9,  + 32 = 59.9 °F
//   15.7 °C -> 15.7 x 1.8 = 28.26, + 32 = 60.26 °F
//   15.56 °C -> 15.56 x 1.8 = 28.008, + 32 = 60.008 °F
//   16 °C   -> 16 x 1.8 = 28.8, + 32 = 60.8 °F
//   82.2 °C -> 82.2 x 1.8 = 147.96, + 32 = 179.96 °F
// The starting recipe's 180 °F post-boil shows as 148 x 5/9 = 82.22 -> 82.2.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { REFERENCE_TEMP_F } from '@brew/engine';
import App from '../src/App.jsx';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import { tempToCanonical } from '../src/display.js';
import {
  BREWERY_KEY,
  exportRecipeDocument,
  SCHEMA_VERSION,
  STORAGE_KEY,
} from '../src/persistence.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let host;

// A recipe measured hot, its fermentation temperature typed, shown in °C.
function startingRecipe() {
  const r = defaultRecipeState();
  return {
    ...r,
    measurementTempF: { preBoil: 150, postBoil: 180, ferment: 68 },
    yeast: { ...r.yeast, fermTempF: 68 },
  };
}

function mount(temperatureUnit = 'C') {
  window.localStorage.clear();
  window.localStorage.setItem(
    STORAGE_KEY,
    exportRecipeDocument({ recipe: startingRecipe(), mode: 'home', proGravityUnit: 'plato', temperatureUnit, proVolumeUnit: 'bbl', proMaltUnit: 'lb' }),
  );
  window.scrollTo = () => {};
  window.confirm = () => true;
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
  window.localStorage.clear();
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

function box(name) {
  const found = [...host.querySelectorAll('input')].find((el) => el.getAttribute('aria-label') === name);
  if (!found) throw new Error(`no box named "${name}"`);
  return found;
}

// Type into a box, as a keystroke does.
function type(name, value) {
  const el = box(name);
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function tab(label) {
  const found = [...host.querySelectorAll('button')].find((b) => text(b) === label);
  if (!found) throw new Error(`no tab "${label}"`);
  act(() => found.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

// What the autosave stored, read as the app reads it.
const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe;
const savedBrewery = () => JSON.parse(window.localStorage.getItem(BREWERY_KEY)).brewery;

const near = (x, y) => expect(Math.abs(x - y)).toBeLessThan(1e-9);

// The printed sheet's measurement-temperature notes, for a stored recipe.
function sheetNotes(storedRecipe) {
  const r = { ...defaultRecipeState(), ...storedRecipe };
  const sheet = recipeSheet({
    recipe: r,
    derived: computeRecipe(r),
    water: computeWater(r.water, r),
    mode: 'home',
    proGravityUnit: 'plato',
    temperatureUnit: 'C',
    today: new Date(2026, 9, 8),
  });
  return JSON.stringify(sheet).match(/measured at [^"]*/g) ?? [];
}

const RECIPE_BOXES = [
  ['Pre-boil volume measured at (°C)', (r) => r.measurementTempF.preBoil],
  ['Post-boil volume measured at (°C)', (r) => r.measurementTempF.postBoil],
  ['Fermentation volume measured at (°C)', (r) => r.measurementTempF.ferment],
  ['Fermentation temperature °C', (r) => r.yeast.fermTempF],
  ['Temp (°C), Magnum', (r) => r.kettleAdditions[0].wortTempF],
  ['Temp (°C), Cascade', (r) => r.kettleAdditions[1].wortTempF],
];
const BREWERY_BOXES = [
  ['Pre-boil volume measured at (°C)', (b) => b.measurementTempF.preBoil],
  ['Post-boil volume measured at (°C)', (b) => b.measurementTempF.postBoil],
  ['Fermentation volume measured at (°C)', (b) => b.measurementTempF.ferment],
];

describe('15.6 °C typed is the reference', () => {
  // RT-S1, RT-Q1, K (idempotence)
  it('15.6 °C typed is the reference', () => {
    mount();
    // Before: measured hot, the post-boil volume has its own row.
    expect(text(host)).toMatch(/Post-boil volume at 82 °C/);
    expect(box('Post-boil volume measured at (°C)').value).toBe('82.2');

    type('Post-boil volume measured at (°C)', '15.6');
    expect(saved().measurementTempF.postBoil).toBe(REFERENCE_TEMP_F); // 60 °F exactly
    // It shows back as typed, and as the reference: no second row, no note.
    expect(box('Post-boil volume measured at (°C)').value).toBe('15.6');
    expect(text(host)).not.toMatch(/Post-boil volume at 16 °C/);
    expect(text(host)).not.toMatch(/Post-boil volume at \d+ °C/);
    expect(sheetNotes(saved()).filter((n) => /16 °C/.test(n))).toEqual([]);

    // All three at the reference: the sheet notes no measurement temperature,
    // and every volume is the uncorrected one.
    type('Pre-boil volume measured at (°C)', '15.6');
    type('Fermentation volume measured at (°C)', '15.6');
    expect(saved().measurementTempF).toEqual({ preBoil: REFERENCE_TEMP_F, postBoil: REFERENCE_TEMP_F, ferment: REFERENCE_TEMP_F });
    expect(sheetNotes(saved())).toEqual([]);
    const atRef = computeRecipe({ ...startingRecipe(), measurementTempF: saved().measurementTempF });
    const built = computeRecipe(defaultRecipeState());
    expect(atRef.refVolumesGal).toEqual(built.refVolumesGal);

    // A round trip changes nothing: typing the shown 15.6 again keeps 60.
    type('Post-boil volume measured at (°C)', box('Post-boil volume measured at (°C)').value);
    expect(saved().measurementTempF.postBoil).toBe(REFERENCE_TEMP_F);
  });

  // RT-S2
  it('other °C entries convert as before', () => {
    mount();
    const cases = [
      ['15.5', 59.9],
      ['15.7', 60.26],
      ['15.56', 60.008],
      ['16', 60.8],
      ['82.2', 179.96],
    ];
    for (const [typed, tempF] of cases) {
      type('Post-boil volume measured at (°C)', typed);
      near(saved().measurementTempF.postBoil, tempF);
    }
    // 16 °C is not the reference: the second row and the sheet's note show.
    type('Post-boil volume measured at (°C)', '16');
    expect(text(host)).toMatch(/Post-boil volume at 16 °C/);
    expect(sheetNotes(saved())).toContain('measured at 16 °C');
    // An emptied box is a blank temperature, as before.
    type('Post-boil volume measured at (°C)', '');
    expect(saved().measurementTempF.postBoil).toBeNull();
  });

  // RT-S3, RT-Q2
  it('every temperature box', () => {
    mount();
    // Each box's stored figure for 15.6 typed, gathered so every box is named.
    const stored = {};
    const expected = {};
    for (const [name, read] of RECIPE_BOXES) {
      type(name, '15.6');
      stored[name] = read(saved());
      expected[name] = REFERENCE_TEMP_F;
      type(name, '15.5');
      near(read(saved()), 59.9);
    }
    tab('Options');
    for (const [name, read] of BREWERY_BOXES) {
      type(name, '15.6');
      stored[`My brewery: ${name}`] = read(savedBrewery());
      expected[`My brewery: ${name}`] = REFERENCE_TEMP_F;
      type(name, '15.7');
      near(read(savedBrewery()), 60.26);
    }
    expect(stored).toEqual(expected);
  });

  // RT-S4
  it('nothing else changes', () => {
    // °F entries are stored as typed.
    mount('F');
    type('Post-boil volume measured at (°F)', '60');
    expect(saved().measurementTempF.postBoil).toBe(60);
    type('Post-boil volume measured at (°F)', '15.6');
    expect(saved().measurementTempF.postBoil).toBe(15.6);
    type('Temp (°F), Magnum', '60.08');
    expect(saved().kettleAdditions[0].wortTempF).toBe(60.08);
    expect(tempToCanonical(15.6, 'F')).toBe(15.6);
    expect(tempToCanonical(NaN, 'C')).toBeNaN();

    // Every other stored figure is as it was, and the saved format is the same.
    const before = startingRecipe();
    const after = saved();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(12);
    expect(Object.keys(after)).toEqual(Object.keys(JSON.parse(exportRecipeDocument({ recipe: before, mode: 'home', proGravityUnit: 'plato', temperatureUnit: 'F', proVolumeUnit: 'bbl', proMaltUnit: 'lb' })).recipe));
    expect(after.measurementTempF.preBoil).toBe(150);
    expect(after.measurementTempF.ferment).toBe(68);
    expect(after.yeast.fermTempF).toBe(68);
    expect(after.malts.map((m) => m.weightLb)).toEqual(before.malts.map((m) => m.weightLb));
  });
});
