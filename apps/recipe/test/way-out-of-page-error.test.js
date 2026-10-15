// @vitest-environment jsdom
// way-out-of-page-error.test.js
// Scenarios for "A saved recipe the page cannot draw has a way out" (scope
// table agreed 2026-10-15, docs/items/way-out-of-page-error.md), named from
// its sentences NW-S1 to NW-S5. When the saved recipe itself makes the page
// fail outside the tabs, the whole-page message offers, beside Reload,
// "Export saved recipe" (the stored document, byte for byte) and "Start a
// new recipe" (asks, then removes only the saved recipe and draws the page
// again, so the load starts a new recipe from the brewery's figures).
//
// The page is drawn as the browser draws it, as error-outside-the-tabs.test.js
// draws it: `main.jsx` itself, run afresh for each draw on an empty `#root`;
// a second draw with storage as it is stands for a reload.
//
// How the saved recipe makes the page fail: the recipe's figures (the
// selectors' `computeRecipe`, worked out before the app draws) throw for a
// recipe named "Cannot be drawn", so a new recipe draws. A part named in
// `parts.throwing` throws whatever the recipe, as in error-outside-the-tabs.
//
// jsdom cannot reload a page: asked to, it reports "Not implemented:
// navigation" on the console, which is how a test sees the reload was asked.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createHash } from 'node:crypto';
import { defaultRecipeState, DEFAULT_DISPLAY, emptyBreweryFigures } from '../src/state.js';
import { exportRecipeDocument, exportBreweryDocument, STORAGE_KEY, BREWERY_KEY, BANNER_KEY } from '../src/persistence.js';
import BEFORE from './error-outside-the-tabs.before.json';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const POISON = 'Cannot be drawn';

const parts = vi.hoisted(() => ({
  throwing: new Set(),
  roots: [],
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

vi.mock('../src/components/CostCard.jsx', (io) => parts.wrap('CostCard', io));
vi.mock('../src/selectors.js', async (importOriginal) => {
  const real = await importOriginal();
  return {
    ...real,
    computeRecipe: (state, ...rest) => {
      if (parts.throwing.has('computeRecipe') || state?.name === 'Cannot be drawn') {
        throw new Error('the recipe could not be worked out');
      }
      return real.computeRecipe(state, ...rest);
    },
  };
});
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
const WAY_OUT = 'Export saved recipe keeps a copy; Start a new recipe replaces it.';
const EXPORT_RESET = 'Export in the header saves a copy, and Reset to defaults starts a new recipe.';

async function draw(stored) {
  if (stored) {
    window.localStorage.clear();
    for (const [key, value] of Object.entries(stored)) window.localStorage.setItem(key, value);
  }
  window.scrollTo = () => {};
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  takeDown();
  document.body.innerHTML = '<div id="root"></div>';
  vi.resetModules();
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

const stored = () => Object.fromEntries(Object.keys(window.localStorage).map((k) => [k, window.localStorage.getItem(k)]));

// The reloads the page asked the browser for, as jsdom reports them.
const reloadsAsked = () => console.error.mock.calls.filter(([e]) => String(e?.message ?? e).includes('Not implemented: navigation')).length;

// The file a click hands the browser: its text and its name.
async function download(label) {
  const files = [];
  URL.createObjectURL = (blob) => {
    files.push({ blob });
    return `blob:${files.length}`;
  };
  URL.revokeObjectURL = () => {};
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
    files.at(-1).name = this.download;
  });
  click(label);
  expect(files).toHaveLength(1);
  return { text: await files[0].blob.text(), name: files[0].name };
}

// A saved recipe with a figure of its own, the brewery's figures with two set
// and one saved malt, and the banner's "Not now", so a change to any shows.
const HOUSE_PALE = { name: 'House Pale', fgdb: 0.79, colorL: 3, type: 'base', distilledWaterPh: null, acidityMeqPerKg: null };
const recipeDoc = (name) => exportRecipeDocument({ ...DEFAULT_DISPLAY, recipe: { ...defaultRecipeState(), name, preBoilVolGal: 9 } });
const saved = (name) => ({
  [STORAGE_KEY]: recipeDoc(name),
  [BREWERY_KEY]: exportBreweryDocument({
    ...emptyBreweryFigures(),
    boilTimeMin: 75,
    efficiency: 0.72,
    ingredients: { malts: [HOUSE_PALE], hops: [], yeasts: [] },
  }),
  [BANNER_KEY]: 'true',
});

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
  window.confirm = () => true;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15));
  // React reports each error it catches on the console, and jsdom each reload asked.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  takeDown();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('a saved recipe the page cannot draw has a way out', () => {
  it('the whole-page message offers Export saved recipe and Start a new recipe, with their line', async () => {
    // NW-S1: the saved recipe makes the page fail; the message offers the two
    // ways out beside Reload, with their line, and not the tab's Export/Reset line.
    await draw(saved(POISON));
    expect(pageText()).toContain(MESSAGE);
    expect(pageText()).toContain(WAY_OUT);
    expect(pageText()).not.toContain(EXPORT_RESET);
    expect(buttons()).toEqual(['Reload', 'Export saved recipe', 'Start a new recipe']);
    // Every Reload of the same saved recipe shows the message again, with the way out.
    await draw();
    expect(pageText()).toContain(MESSAGE);
    expect(buttons()).toEqual(['Reload', 'Export saved recipe', 'Start a new recipe']);
  });

  it('Export saved recipe downloads the stored document byte for byte, an unreadable one too, and changes nothing', async () => {
    // NW-S2, readable: the stored text exactly, named from the saved recipe's name.
    await draw(saved(POISON));
    let before = stored();
    let file = await download('Export saved recipe');
    expect(file.text).toBe(before[STORAGE_KEY]);
    expect(file.name).toBe('Cannot be drawn 2026-10-15.json');
    expect(stored()).toEqual(before);
    expect(pageText()).toContain(MESSAGE);
    expect(reloadsAsked()).toBe(0);

    // NW-S2, unreadable (K): a stored copy no reader takes, exported as found,
    // with the name a nameless recipe gets. The page fails on its own here.
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const broken = '{"version": 13, "recipe": {"name": "Half a recipe", "malts": [';
    parts.throwing.add('computeRecipe');
    await draw({ ...saved('My IPA'), [STORAGE_KEY]: broken });
    expect(pageText()).toContain(MESSAGE);
    before = stored();
    expect(before[STORAGE_KEY]).toBe(broken);
    file = await download('Export saved recipe');
    expect(file.text).toBe(broken);
    expect(file.name).toBe('Brew Design recipe 2026-10-15.json');
    expect(stored()).toEqual(before);
    expect(reloadsAsked()).toBe(0);
  });

  it("Start a new recipe asks, then removes only the saved recipe and draws a new recipe from the brewery's figures; no changes nothing", async () => {
    const before = saved(POISON);
    await draw(before);
    expect(pageText()).toContain(MESSAGE);
    const questions = [];

    // NW-S3, no: nothing changes, the message stays, no reload is asked.
    window.confirm = (q) => {
      questions.push(q);
      return false;
    };
    click('Start a new recipe');
    expect(questions).toHaveLength(1);
    expect(stored()).toEqual(before);
    expect(pageText()).toContain(MESSAGE);
    expect(reloadsAsked()).toBe(0);

    // NW-S3, yes: only the saved recipe is removed, then the page is drawn again.
    window.confirm = (q) => {
      questions.push(q);
      return true;
    };
    click('Start a new recipe');
    expect(questions).toHaveLength(2);
    const { [STORAGE_KEY]: removed, ...kept } = before;
    expect(removed).toBeDefined();
    expect(stored()).toEqual(kept);
    expect(reloadsAsked()).toBe(1);

    // The reload: a new recipe from the brewery's figures that are set, as
    // Reset to defaults gives; the brewery, My ingredients and "Not now" kept.
    await draw();
    expect(pageText()).not.toContain(MESSAGE);
    const now = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(now.recipe.name).toBe('');
    expect(now.recipe.boilTimeMin).toBe(75);
    expect(now.recipe.efficiency).toBe(0.72);
    expect(now.recipe.preBoilVolGal).toBe(defaultRecipeState().preBoilVolGal);
    expect(window.localStorage.getItem(BREWERY_KEY)).toBe(before[BREWERY_KEY]);
    expect(window.localStorage.getItem(BANNER_KEY)).toBe(before[BANNER_KEY]);
    expect(JSON.parse(window.localStorage.getItem(BREWERY_KEY)).brewery.ingredients.malts).toEqual([HOUSE_PALE]);

    // K, idempotence: with nothing saved, a second Start a new recipe removes nothing.
    parts.throwing.add('computeRecipe');
    window.localStorage.removeItem(STORAGE_KEY);
    await draw();
    const nothingSaved = stored();
    click('Start a new recipe');
    expect(stored()).toEqual(nothingSaved);
  });

  it('with no saved recipe, Export saved recipe is not offered', async () => {
    // NW-S4, none stored: the page fails on its own; Reload and Start a new recipe only.
    parts.throwing.add('computeRecipe');
    const { [STORAGE_KEY]: _, ...noRecipe } = saved('My IPA');
    await draw(noRecipe);
    window.localStorage.removeItem(STORAGE_KEY); // the failed draw saved nothing; made sure
    await draw();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(pageText()).toContain(MESSAGE);
    expect(buttons()).toEqual(['Reload', 'Start a new recipe']);

    // NW-S4, storage unavailable (K): no Export; Start a new recipe removes
    // nothing, never throws, and draws the page again.
    window.localStorage.clear();
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('storage is blocked');
    });
    await draw();
    expect(pageText()).toContain(MESSAGE);
    expect(buttons()).toEqual(['Reload', 'Start a new recipe']);
    const asked = reloadsAsked();
    click('Start a new recipe');
    expect(reloadsAsked()).toBe(asked + 1);
  });

  it('an error in a tab is caught as before, and with no error nothing changes', async () => {
    // NW-S5, a tab: the Cost card fails; the header stays, the tab's message
    // carries its line on Export and Reset, and no way-out buttons.
    const before = saved('My IPA');
    parts.throwing.add('CostCard');
    await draw(before);
    expect(pageText()).toContain(MESSAGE);
    expect(pageText()).toContain(EXPORT_RESET);
    expect(pageText()).not.toContain(WAY_OUT);
    expect(buttons()).toContain('Reset to defaults');
    expect(buttons()).not.toContain('Export saved recipe');
    expect(buttons()).not.toContain('Start a new recipe');
    expect(stored()).toEqual(before);

    // NW-S5, no error: every tab, in Home and in Pro, and the References page,
    // byte for byte as before the change (error-outside-the-tabs.before.json,
    // drawn from that file's saved documents: no saved ingredient).
    parts.throwing.clear();
    vi.restoreAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const asCaptured = {
      ...before,
      [BREWERY_KEY]: exportBreweryDocument({ ...emptyBreweryFigures(), boilTimeMin: 75, efficiency: 0.72 }),
    };
    await draw(asCaptured);
    expect(stored()).toEqual(asCaptured);
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
