// sparge-typed.test.js
// Scenarios for S4b item 1, "Sparge water typed" (docs/items/water-as-brewed.md,
// agreed 2026-10-02), named from its sentences SW-S1 to SW-S7. The worked
// example of docs/items/water-treatment.md, with its 1 gal kept in the mash
// tun now coming out of a typed 8.5 gal sparge: 7 + 8.5 - 0.5 - 14 = 1.0 gal.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState, DEFAULT_DISPLAY, emptyBreweryFigures, newRecipe } from '../src/state.js';
import { computeWater } from '../src/selectors.js';
import { defaultWaterState } from '../src/water-state.js';
import {
  STORAGE_KEY,
  BREWERY_KEY,
  loadPersisted,
  savePersisted,
  loadBrewery,
  importRecipeFile,
} from '../src/persistence.js';

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}
const text = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');

const exampleRecipe = (patch = {}) => {
  const r = defaultRecipeState();
  return {
    ...r,
    malts: [
      { ...r.malts[0], weightLb: 15 },
      { ...r.malts[1], weightLb: 5 },
    ],
    preBoilVolGal: 14,
    mashWaterGal: 7,
    ...patch,
  };
};
const exampleWater = (patch = {}) => ({
  ...defaultWaterState(),
  source: { Ca: 0, Mg: 0, Na: 0, SO4: 48.12, Cl: 0, Alkalinity: 0, pH: 7 },
  styleId: 'ipa',
  enabledSalts: ['gypsum'],
  spargeGal: 8.5,
  ...patch,
});
const render = async (water, recipe, mode = 'home', screen = 'salts') => {
  const { default: WaterTab } = await import('../src/components/water/WaterTab.jsx');
  return renderToStaticMarkup(
    createElement(WaterTab, { water, figures: computeWater(water, recipe), mode, screen, onScreen: () => {}, setWater: () => {} }),
  );
};
const renderOptions = async (brewery) => {
  const { default: OptionsSection } = await import('../src/components/OptionsSection.jsx');
  const r = defaultRecipeState();
  return renderToStaticMarkup(
    createElement(OptionsSection, {
      measurementTempF: r.measurementTempF,
      refVolumesGal: { preBoil: 7, postBoil: 5.5, ferment: 5.5 },
      mode: 'home',
      setMeasurementTemp: () => {},
      brewery,
      setBreweryFigure: () => {},
      setBreweryTemp: () => {},
      setBreweryWater: () => {},
      onUseRecipeFigures: () => {},
      onForgetBrewery: () => {},
    }),
  );
};

describe('sparge water typed', () => {
  it('the sparge water is typed and the water left in the mash tun is worked out', async () => {
    // SW-S1, SW-S2, SW-S7: by hand, 7 + 8.5 - 0.5 - 14 = 1.0 gal left; total 15.5 gal.
    expect(defaultWaterState().spargeGal).toBeNaN();
    expect('keptInTunGal' in defaultWaterState()).toBe(false);
    const f = computeWater(exampleWater(), exampleRecipe());
    expect(f.volumes.spargeGal).toBe(8.5);
    expect(f.volumes.totalGal).toBeCloseTo(15.5, 12);
    expect(f.volumes.mashTunLeftGal).toBeCloseTo(1, 12);
    const shown = text(await render(exampleWater(), exampleRecipe()));
    expect(shown).toMatch(/Water left in the mash tun gal 1\.00/);
    expect(shown).toMatch(/Total water gal 15\.50/);
    expect(shown).not.toContain('Water kept in the mash tun');
    const markup = await render(exampleWater(), exampleRecipe());
    expect(markup).toMatch(/Sparge water[\s\S]*?value="8\.5"/);
    // Bbl in Pro: 8.5 / 31 = 0.274194 bbl in the box.
    expect(await render(exampleWater(), exampleRecipe(), 'pro')).toMatch(/value="0\.274194"/);

    // A blank sparge: named, and what needs it shows "—".
    const blank = computeWater(exampleWater({ spargeGal: NaN }), exampleRecipe());
    expect(blank.blank).toEqual(['spargeGal']);
    expect(blank.volumes.mashTunLeftGal).toBeNaN();
    const shownBlank = text(await render(exampleWater({ spargeGal: NaN }), exampleRecipe()));
    expect(shownBlank).toContain('Blank figures the water sums need: Sparge water');
    expect(shownBlank).toMatch(/Water left in the mash tun gal —/);
  });

  it('a kettle that will be short warns', async () => {
    // SW-S2: 7 gal of sparge, 7 + 7 - 0.5 - 14 = -0.5: short by 0.50 gal.
    const f = computeWater(exampleWater({ spargeGal: 7 }), exampleRecipe());
    expect(f.warnings.kettleShortGal).toBeCloseTo(0.5, 12);
    expect(text(await render(exampleWater({ spargeGal: 7 }), exampleRecipe()))).toContain(
      'The kettle will be short by 0.50 gal',
    );
    expect(text(await render(exampleWater(), exampleRecipe()))).not.toContain('will be short');
    // Exactly full, through the 60 °F pre-boil correction: 7 + 7.5 - 0.5 - 14
    // = 0 by hand; round-off in the sums is not a short kettle.
    expect(computeWater(exampleWater({ spargeGal: 7.5 }), exampleRecipe()).warnings.kettleShortGal).toBe(0);
    expect(text(await render(exampleWater({ spargeGal: 7.5 }), exampleRecipe()))).not.toContain('will be short');
  });

  it('with no sparge there is no sparge box', async () => {
    // SW-S3: 15.5 gal of mash water, 15.5 - 0.5 - 14 = 1.0 gal left.
    const none = exampleWater({ spargeMethod: 'none' });
    const recipe = exampleRecipe({ mashWaterGal: 15.5 });
    const f = computeWater(none, recipe);
    expect(f.volumes.spargeGal).toBe(0);
    expect(f.volumes.mashTunLeftGal).toBeCloseTo(1, 12);
    expect(f.blank).toEqual([]);
    const markup = await render(none, recipe);
    expect(markup).not.toMatch(/Sparge water[^<]*<\/span>[\s\S]{0,400}<input/);
    expect(text(markup)).toMatch(/Water left in the mash tun gal 1\.00/);
  });

  it('the HLT draws use the typed sparge water', () => {
    // SW-S4, SW-S7: 12 gal treated, topped up to 12; 8.5 gal of sparge leaves
    // 12 - 8.5 = 3.5 gal; 10 gal leaves 2.0 gal; 13 gal warns.
    const hlt = (spargeGal) =>
      computeWater(exampleWater({ treatment: 'tank', tankTreatedGal: 12, tankTopUpGal: 12, spargeGal }), exampleRecipe());
    expect(hlt(8.5).tank.leftGal).toBeCloseTo(3.5, 12);
    expect(hlt(10).tank.leftGal).toBeCloseTo(2, 12);
    expect(hlt(13).warnings.spargeOverTopUp).toBe(true);
    // Mash water treated: no HLT figure.
    expect(computeWater(exampleWater(), exampleRecipe()).tank).toBeNull();
  });

  it('older recipes and brewery figures load without the water kept in the mash tun', async () => {
    // SW-S5, SW-S6: a format-5 recipe carrying 1 gal kept in the mash tun.
    const recipe = exampleRecipe({ water: exampleWater() });
    const { spargeGal, ...v5Water } = { ...recipe.water, keptInTunGal: 1 };
    const v5 = JSON.parse(JSON.stringify({ version: 5, recipe: { ...recipe, water: v5Water }, mode: 'home', proGravityUnit: 'plato' }));
    const s = fakeStorage();
    s.setItem(STORAGE_KEY, JSON.stringify(v5));
    const loaded = loadPersisted(s, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY });
    expect(loaded.recipe.water.spargeGal).toBeNaN();
    expect('keptInTunGal' in loaded.recipe.water).toBe(false);
    expect(loaded.recipe.water.styleId).toBe('ipa');
    savePersisted(s, loaded);
    expect(JSON.parse(s._map.get(STORAGE_KEY)).version).toBe(11);
    expect(importRecipeFile(JSON.stringify(v5), { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }, () => true).outcome).toBe(
      'replaced',
    );

    // Brewery figures at format 2 with 2 gal kept in the mash tun.
    const v2Water = { ...emptyBreweryFigures().water, vessels: 2, keptInTunGal: 2 };
    const b = fakeStorage();
    b.setItem(BREWERY_KEY, JSON.stringify({ version: 2, brewery: { ...emptyBreweryFigures(), water: v2Water } }));
    const brewery = loadBrewery(b);
    expect(brewery.water.vessels).toBe(2);
    expect('keptInTunGal' in brewery.water).toBe(false);
    expect('spargeGal' in brewery.water).toBe(false);
    expect(JSON.parse(b._map.get(BREWERY_KEY)).version).toBe(5);
    expect(newRecipe(brewery).recipe.water.spargeGal).toBeNaN();

    // My brewery no longer asks for it.
    expect(text(await renderOptions(emptyBreweryFigures()))).not.toContain('Water kept in the mash tun');
  });
});
