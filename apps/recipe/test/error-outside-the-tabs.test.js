// @vitest-environment jsdom
// error-outside-the-tabs.test.js
// Scenarios for "An error outside the tabs shows a message" (scope table
// agreed 2026-10-14, docs/items/error-outside-the-tabs.md), named from its
// sentences EO-S1 to EO-S5. An error in the stats bar, the line under it, the
// header, the footer or the printed sheet, or in the figures the app works
// out before drawing (the recipe's, the water's, the Cost card's), shows in
// place of the whole page the message and a Reload button; the line on Export
// and Reset is left out, the header being gone. An error in a tab is caught
// below the header as before (SPEC rule 18).
//
// The page is drawn as the browser draws it: `main.jsx` itself, run afresh
// for each draw on an empty `#root` (the app's modules loaded anew, React
// shared). The roots it makes are kept here so each can be taken down after
// its test.
//
// How a part is made to throw: as page-error.test.js does, each part named
// below is drawn by a wrapper that draws the real part unless the test has
// named it in `parts.throwing`, when it throws. The three figures are the
// selectors' own functions, wrapped the same way.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createHash } from 'node:crypto';
import { defaultRecipeState, DEFAULT_DISPLAY, emptyBreweryFigures } from '../src/state.js';
import { exportRecipeDocument, exportBreweryDocument, STORAGE_KEY, BREWERY_KEY, BANNER_KEY } from '../src/persistence.js';
import BEFORE from './error-outside-the-tabs.before.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const parts = vi.hoisted(() => ({
  throwing: new Set(),
  roots: [],
  // A component module, its default drawn by a wrapper that throws when named.
  async wrap(name, importOriginal) {
    const { createElement } = await import('react');
    const real = await importOriginal();
    const Wrapped = (props) => {
      if (parts.throwing.has(name)) throw new Error(`${name} could not be drawn`);
      return createElement(real.default, props);
    };
    return { ...real, default: Wrapped };
  },
}));

vi.mock('../src/components/StatsBar.jsx', (io) => parts.wrap('StatsBar', io));
vi.mock('../src/components/EmptyFieldsLine.jsx', (io) => parts.wrap('EmptyFieldsLine', io));
vi.mock('../src/components/Header.jsx', (io) => parts.wrap('Header', io));
vi.mock('../src/components/Footer.jsx', (io) => parts.wrap('Footer', io));
vi.mock('../src/components/RecipeSheet.jsx', (io) => parts.wrap('RecipeSheet', io));
vi.mock('../src/components/CostCard.jsx', (io) => parts.wrap('CostCard', io));
vi.mock('../src/selectors.js', async (importOriginal) => {
  const real = await importOriginal();
  const figure = (name) => (...args) => {
    if (parts.throwing.has(name)) throw new Error(`${name} could not be worked out`);
    return real[name](...args);
  };
  return { ...real, computeRecipe: figure('computeRecipe'), computeWater: figure('computeWater'), computeCost: figure('computeCost') };
});
// The roots main.jsx makes, kept so each test can take its page down.
vi.mock('react-dom/client', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    createRoot: (...args) => {
      const root = real.createRoot(...args);
      parts.roots.push(root);
      return root;
    },
  };
});

const MESSAGE = 'Something went wrong drawing this page. Your saved recipe is kept as it was.';
const EXPORT_RESET = 'Export in the header saves a copy, and Reset to defaults starts a new recipe.';

// EO-S1's places outside the tabs, each with the part made to throw.
const PLACES = [
  { place: 'the stats bar', part: 'StatsBar' },
  { place: 'the line under the stats bar', part: 'EmptyFieldsLine' },
  { place: 'the header', part: 'Header' },
  { place: 'the footer', part: 'Footer' },
  { place: 'the printed sheet', part: 'RecipeSheet' },
  { place: "the recipe's figures", part: 'computeRecipe' },
  { place: "the water's figures", part: 'computeWater' },
  { place: "the Cost card's figures", part: 'computeCost' },
];

// The page as the browser draws it, with `stored` in storage first: main.jsx
// run on an empty #root. A second draw with storage as it is stands for a reload.
async function draw(stored) {
  if (stored) {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(stored)) window.localStorage.setItem(key, value);
  }
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  takeDown();
  document.body.innerHTML = '<div id="root"></div>';
  vi.resetModules();
  // An error no catch takes leaves the page blank; React then hands it on
  // here, and the page is read as it was left.
  try {
    await act(async () => {
      await import('../src/main.jsx');
    });
  } catch {
    // the page, blank, is what the test reads
  }
}

function takeDown() {
  for (const root of parts.roots.splice(0)) act(() => root.unmount());
  document.body.innerHTML = '';
}

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const pageText = () => text(document.body);
const buttons = () => [...document.body.querySelectorAll('button')].map(text);

function click(label) {
  const found = [...document.body.querySelectorAll('button')].find((b) => text(b) === label);
  if (!found) throw new Error(`no button "${label}"`);
  act(() => found.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

// Every key storage holds, and its text.
const stored = () => Object.fromEntries(Object.keys(window.localStorage).map((k) => [k, window.localStorage.getItem(k)]));

// A saved recipe with a name and a figure of its own, and the brewery's
// figures with two set, so a change to either would show.
function savedRecipe(name) {
  return exportRecipeDocument({ ...DEFAULT_DISPLAY, recipe: { ...defaultRecipeState(), name, preBoilVolGal: 9 } });
}
const saved = () => ({
  [STORAGE_KEY]: savedRecipe('My IPA'),
  [BREWERY_KEY]: exportBreweryDocument({ ...emptyBreweryFigures(), boilTimeMin: 75, efficiency: 0.72 }),
  [BANNER_KEY]: 'true',
});

// The whole page's HTML, the app and the printed sheet beside it, as its
// SHA-256 digest. React numbers the ids it makes in the order parts are first
// drawn, so they are renumbered in the order they appear on the page.
function digest() {
  const ids = new Map();
  const html = document.body.innerHTML.replace(/_r_[0-9a-z]+_/g, (id) => {
    if (!ids.has(id)) ids.set(id, `_id${ids.size}_`);
    return ids.get(id);
  });
  return createHash('sha256').update(html).digest('hex');
}

beforeEach(() => {
  parts.throwing.clear();
  // React reports each error it catches on the console; nothing else is read from it.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  takeDown();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('an error outside the tabs shows a message', () => {
  for (const { place, part } of PLACES) {
    it(`an error outside the tabs shows the message and Reload, not a blank page: ${place}`, async () => {
      const before = saved();
      parts.throwing.add(part);
      await draw(before);

      // EO-S1: the message and its Reload button, in place of the whole page;
      // the line on Export and Reset is left out, the header being gone.
      expect(pageText(), place).toContain(MESSAGE);
      expect(pageText(), place).not.toContain(EXPORT_RESET);
      expect(buttons(), place).toEqual(['Reload']);
      expect(document.body.querySelector('[role=alert]'), place).not.toBeNull();

      // EO-S2: no saved document changed, byte for byte.
      expect(stored(), place).toEqual(before);
    });
  }

  it('an error outside the tabs after the page is drawn changes no saved document', async () => {
    // EO-S1, EO-S2: the page drawn, then the stats bar fails on the next step.
    const before = saved();
    await draw(before);
    expect(pageText()).not.toContain(MESSAGE);
    expect(stored()).toEqual(before);
    parts.throwing.add('StatsBar');
    click('Water');
    expect(pageText()).toContain(MESSAGE);
    expect(buttons()).toEqual(['Reload']);
    expect(stored()).toEqual(before);
  });

  it('Reload draws the page again from what is saved', async () => {
    // EO-S4: the reload of a page whose error has gone draws the saved recipe.
    const before = saved();
    parts.throwing.add('StatsBar');
    await draw(before);
    expect(pageText()).toContain(MESSAGE);
    parts.throwing.clear();
    await draw();
    expect(pageText()).not.toContain(MESSAGE);
    expect(document.body.querySelector('input[type=text]').value).toBe('My IPA');
    expect(stored()).toEqual(before);
  });

  it('an error in a tab is still caught below the header, with the Export and Reset line', async () => {
    // EO-S3: the Recipe tab's Cost card fails; the header stays, and the
    // message, with the line on Export and Reset, shows once.
    const before = saved();
    parts.throwing.add('CostCard');
    await draw(before);
    expect(pageText()).toContain(MESSAGE);
    expect(pageText()).toContain(EXPORT_RESET);
    expect(pageText().split(MESSAGE)).toHaveLength(2);
    for (const label of ['Export', 'Import', 'Reset to defaults', 'Print recipe', 'Recipe', 'Water', 'Options', 'Reload']) {
      expect(buttons(), label).toContain(label);
    }
    expect(stored()).toEqual(before);
  });

  it('with no error, nothing changes', async () => {
    // EO-S5: every tab, in Home and in Pro, and the References page, drawn as
    // main.jsx drew them before the change, byte for byte
    // (error-outside-the-tabs.before.json, captured 2026-10-15 before it).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 15));
    const before = saved();
    await draw(before);
    expect(stored()).toEqual(before);
    const out = {};
    for (const mode of ['Home', 'Pro']) {
      click(mode);
      for (const tab of ['Recipe', 'Water', 'Options']) {
        click(tab);
        out[`${mode} ${tab}`] = digest();
      }
    }
    click('References');
    out.References = digest();
    expect(out).toEqual(BEFORE);
    expect(console.error).not.toHaveBeenCalled();
  });
});
