// brewery-banner.test.js
// Scenarios for S4b item 4, "My brewery banner" (docs/items/water-as-brewed.md,
// BB-S1 to BB-S3; decision B1; K: the dismissal is its own key in this
// browser, best-effort, never read by a recipe). The suite has no DOM: the
// banner is rendered to markup, its rule and its stored dismissal are tested
// directly, and App's wiring is read from its source; the banner on every
// tab, the button and a real reload are the far end.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultRecipeState, emptyBreweryFigures } from '../src/state.js';
import { STORAGE_KEY, BREWERY_KEY, savePersisted, saveBrewery } from '../src/persistence.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const text = (markup) => markup.replace(/<[^>]*>/g, ' ').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}
const throwingStorage = () => {
  const boom = () => {
    throw new Error('blocked');
  };
  return { getItem: boom, setItem: boom, removeItem: boom };
};

// One brewery figure of each kind set.
const withFigure = () => {
  const e = emptyBreweryFigures();
  return [
    { ...e, fermentVolGal: 12 },
    { ...e, measurementTempF: { ...e.measurementTempF, ferment: 68 } },
    { ...e, mode: 'pro' },
    { ...e, water: { ...e.water, vessels: 2 } },
    { ...e, water: { ...e.water, source: { ...e.water.source, Ca: 40 } } },
  ];
};

describe('My brewery banner', () => {
  it('a banner recommends setting up My brewery while every figure is blank', async () => {
    const { breweryBannerShown } = await import('../src/state.js');
    // BB-S1: every figure blank, not dismissed: shown.
    expect(breweryBannerShown(emptyBreweryFigures(), false)).toBe(true);
    const { default: BreweryBanner } = await import('../src/components/BreweryBanner.jsx');
    const shown = text(renderToStaticMarkup(createElement(BreweryBanner, { onSetUp: () => {}, onNotNow: () => {} })));
    expect(shown).toContain('Set up My brewery so new recipes start from your equipment');
    expect(shown).toContain('Set up My brewery');
    expect(shown).toContain('Not now');
    // App shows it above the tabs' content, on every tab, and its button opens Options.
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
    expect(app).toMatch(/breweryBannerShown\(brewery, bannerDismissed\) && \(\s*<BreweryBanner/);
    expect(app).toMatch(/onSetUp=\{\(\) => setTab\('options'\)\}/);
  });

  it('"Not now" hides it in this browser until a figure is set and cleared again', async () => {
    const { breweryBannerShown, bannerDismissalAfter } = await import('../src/state.js');
    const { BANNER_KEY, loadBannerDismissed, saveBannerDismissed } = await import('../src/persistence.js');
    // BB-S2: dismissed, still blank: hidden.
    expect(breweryBannerShown(emptyBreweryFigures(), true)).toBe(false);
    // Kept in this browser under its own key, apart from the recipe and the brewery.
    const s = fakeStorage();
    savePersisted(s, { recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' });
    saveBrewery(s, emptyBreweryFigures());
    const recipeBytes = s._map.get(STORAGE_KEY);
    const breweryBytes = s._map.get(BREWERY_KEY);
    expect(loadBannerDismissed(s)).toBe(false);
    saveBannerDismissed(s, true);
    expect(loadBannerDismissed(s)).toBe(true);
    expect([BANNER_KEY, STORAGE_KEY, BREWERY_KEY].every((k) => s._map.has(k))).toBe(true);
    expect(new Set([BANNER_KEY, STORAGE_KEY, BREWERY_KEY]).size).toBe(3);
    expect(s._map.get(STORAGE_KEY)).toBe(recipeBytes);
    expect(s._map.get(BREWERY_KEY)).toBe(breweryBytes);
    saveBannerDismissed(s, false);
    expect(loadBannerDismissed(s)).toBe(false);
    // Best-effort: blocked storage reads as not dismissed and never throws.
    expect(loadBannerDismissed(throwingStorage())).toBe(false);
    expect(() => saveBannerDismissed(throwingStorage(), true)).not.toThrow();

    // Setting a figure ends the dismissal, so clearing the figures again
    // brings the banner back; while all stay blank the dismissal stands.
    for (const b of withFigure()) expect(bannerDismissalAfter(b, true)).toBe(false);
    expect(bannerDismissalAfter(emptyBreweryFigures(), true)).toBe(true);
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
    expect(app).toMatch(/bannerDismissalAfter\(next, bannerDismissed\)/);
  });

  it('setting any brewery figure hides the banner, and nothing else changes', () => {
    // BB-S3: each kind of figure.
    return import('../src/state.js').then(({ breweryBannerShown }) => {
      for (const b of withFigure()) expect(breweryBannerShown(b, false)).toBe(false);
      // The banner reads the brewery's figures and the dismissal only: no
      // recipe value goes into it, and it changes no recipe value.
      const banner = readFileSync(join(SRC, 'components', 'BreweryBanner.jsx'), 'utf8');
      expect(banner).not.toMatch(/setRecipe|setField|setWater|\brecipe\s*[,}.)=]/);
    });
  });
});
