// @vitest-environment jsdom
// page-error.test.js
// Scenarios for "Page keeps working after an error" (scope table agreed
// 2026-10-08, docs/items/page-keeps-working-after-error.md), named from its
// sentences PE-S1 to PE-S5 and decisions PE-Q1, PE-Q2 and K. An error while a
// tab is drawn shows a short message in place of that tab's content, with a
// Reload button and a line on Export and Reset; the header stays usable and
// storage is untouched.
//
// How a card is made to throw: one drawn part of each place is replaced, for
// this file only, by a wrapper that draws the real part unless the test has
// named it in `parts.throwing`, when it throws while drawn. The Cost card also
// throws for a recipe named "Boom", standing for a saved recipe that itself
// causes the error (PE-Q2's rule).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defaultRecipeState, DEFAULT_DISPLAY, emptyBreweryFigures } from '../src/state.js';
import { exportRecipeDocument, exportBreweryDocument, STORAGE_KEY, BREWERY_KEY, BANNER_KEY } from '../src/persistence.js';
import { mount, unmount, page, text, click, button, pageDigests } from './page-error.fixture.js';
import BEFORE from './page-error.before.json';

const parts = vi.hoisted(() => ({
  throwing: new Set(),
  // The module's own exports, its default drawn by a wrapper that throws when
  // its part is named, or when `alsoWhen` holds for its props.
  async wrap(name, importOriginal, alsoWhen = () => false) {
    const { createElement } = await import('react');
    const real = await importOriginal();
    const Wrapped = (props) => {
      if (parts.throwing.has(name) || alsoWhen(props)) throw new Error(`${name} could not be drawn`);
      return createElement(real.default, props);
    };
    return { ...real, default: Wrapped };
  },
}));

vi.mock('../src/components/CostCard.jsx', (io) => parts.wrap('CostCard', io, (p) => p.recipe?.name === 'Boom'));
vi.mock('../src/components/water/WaterTab.jsx', (io) => parts.wrap('WaterTab', io));
vi.mock('../src/components/OptionsSection.jsx', (io) => parts.wrap('OptionsSection', io));
vi.mock('../src/components/NotesPage.jsx', (io) => parts.wrap('NotesPage', io));

const MESSAGE = 'Something went wrong drawing this page. Your saved recipe is kept as it was.';
const EXPORT_RESET = 'Export in the header saves a copy, and Reset to defaults starts a new recipe.';

// The places PE-S1 names, each with the part made to throw and how it is reached.
const PLACES = [
  { place: 'the Recipe tab', part: 'CostCard', open: () => click(button('Recipe')) },
  { place: 'the Water tab', part: 'WaterTab', open: () => click(button('Water')) },
  { place: 'the Options tab', part: 'OptionsSection', open: () => click(button('Options')) },
  { place: 'the References page', part: 'NotesPage', open: () => click(button('References')) },
];

// Every key storage holds, and its text.
const stored = () => Object.fromEntries(Object.keys(window.localStorage).map((k) => [k, window.localStorage.getItem(k)]));

// A saved recipe with a name and a figure of its own, and the brewery's
// figures with two set, so a change to either would show.
function savedRecipe(name) {
  return exportRecipeDocument({ ...DEFAULT_DISPLAY, recipe: { ...defaultRecipeState(), name, preBoilVolGal: 9 } });
}
const savedBrewery = () => exportBreweryDocument({ ...emptyBreweryFigures(), boilTimeMin: 75, efficiency: 0.72 });

// The file Export hands to the browser: its text, and what it was named.
function exportedFile() {
  // jsdom has no object URLs; these stand in for the browser's.
  const blobs = [];
  URL.createObjectURL = (b) => {
    blobs.push(b);
    return 'blob:recipe';
  };
  URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  click(button('Export'));
  expect(blobs).toHaveLength(1);
  return blobs[0].text();
}

const shown = () => text(page()).includes(MESSAGE);

beforeEach(() => {
  parts.throwing.clear();
  // React reports each error it catches on the console; nothing else is read from it.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  unmount();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('page keeps working after an error', () => {
  it('an error in a tab shows the message and keeps the header', async () => {
    for (const { place, part, open } of PLACES) {
      mount({ [STORAGE_KEY]: savedRecipe('My IPA') });
      expect(shown(), `${place}: before the error`).toBe(false);
      parts.throwing.add(part);
      // Reached from another place, so the part is drawn afresh.
      click(button(part === 'WaterTab' ? 'Options' : 'Water'));
      open();

      // PE-S1, PE-S2: the message, its Reload button and the Export/Reset line.
      const pageText = text(page());
      expect(pageText, place).toContain(MESSAGE);
      expect(pageText, place).toContain(EXPORT_RESET);
      expect(button('Reload').type, place).toBe('button');
      // In place of that place's content: the part's neighbours are not drawn either.
      if (part === 'CostCard') expect(pageText, place).not.toContain('Grist');
      if (part === 'NotesPage') expect(pageText, place).not.toContain('Back to the recipe');

      // PE-S3: the header's actions and choices are there and work.
      for (const label of ['Export', 'Import', 'Reset to defaults', 'Print recipe', '°F', '°C', 'Pro', 'Home']) {
        expect(() => button(label), `${place}: ${label}`).not.toThrow();
      }
      expect(page().querySelector('input[type=file]'), `${place}: Import's file box`).not.toBeNull();
      const print = vi.spyOn(window, 'print').mockImplementation(() => {});
      click(button('Print recipe'));
      expect(print, `${place}: Print`).toHaveBeenCalledTimes(1);
      expect(await exportedFile(), `${place}: Export`).toBe(window.localStorage.getItem(STORAGE_KEY));
      click(button('°C'));
      expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).temperatureUnit, `${place}: °C`).toBe('C');
      click(button('°F'));

      // The tab choices: another tab draws (on the References page there are
      // none, as before; Reload leaves it).
      if (part !== 'NotesPage') {
        parts.throwing.clear();
        click(button(part === 'OptionsSection' ? 'Recipe' : 'Options'));
        expect(shown(), `${place}: another tab chosen`).toBe(false);
      }
      vi.restoreAllMocks();
      vi.spyOn(console, 'error').mockImplementation(() => {});
      parts.throwing.clear();
      unmount();
    }
  });

  it('the saved recipe is kept', () => {
    const before = {
      [STORAGE_KEY]: savedRecipe('My IPA'),
      [BREWERY_KEY]: savedBrewery(),
      [BANNER_KEY]: 'true',
    };
    // An error while the page is open: storage byte for byte as it was.
    mount(before);
    expect(stored()).toEqual(before);
    parts.throwing.add('CostCard');
    click(button('Water'));
    click(button('Recipe'));
    expect(shown()).toBe(true);
    expect(stored()).toEqual(before);
    unmount();

    // A reload of the same page, still failing: the same message, storage the same.
    mount(before);
    expect(shown()).toBe(true);
    expect(stored()).toEqual(before);
    unmount();

    // A saved recipe that itself causes the error, from the first draw.
    const boom = { ...before, [STORAGE_KEY]: savedRecipe('Boom') };
    parts.throwing.clear();
    mount(boom);
    expect(shown()).toBe(true);
    expect(stored()).toEqual(boom);
  });

  it('Reset after the error starts a new recipe', async () => {
    // The saved recipe causes the error each time the Recipe tab is drawn.
    const boom = savedRecipe('Boom');
    mount({ [STORAGE_KEY]: boom });
    expect(shown()).toBe(true);
    // Choosing another tab clears the message; the Recipe tab shows it again.
    click(button('Water'));
    expect(shown()).toBe(false);
    expect(text(page())).toContain('Load Example');
    click(button('Recipe'));
    expect(shown()).toBe(true);
    // Export keeps a copy of the recipe that fails: the saved document itself.
    expect(await exportedFile()).toBe(boom);
    // Reset starts a new recipe: the message goes and the Recipe tab draws.
    let asked = 0;
    window.confirm = () => {
      asked += 1;
      return true;
    };
    click(button('Reset to defaults'));
    expect(asked).toBe(1);
    expect(shown()).toBe(false);
    expect(text(page())).toContain('Grist');
    expect(text(page())).toContain('Cost');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe.name).toBe('');
  });

  it('nothing else changes when nothing goes wrong', () => {
    // Every tab, in Home and in Pro, and the References page, drawn as
    // before the change, byte for byte (page-error.before.json).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 9));
    expect(pageDigests()).toEqual(BEFORE);
    mount();
    for (const tab of ['Recipe', 'Water', 'Options']) {
      click(button(tab));
      expect(shown(), tab).toBe(false);
    }
    expect(console.error).not.toHaveBeenCalled();
  });
});
