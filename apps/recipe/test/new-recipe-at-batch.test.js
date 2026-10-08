// new-recipe-at-batch.test.js
// Scenarios for "A new recipe at the brewery's batch", batch S11 item 1
// (docs/items/new-recipe-at-brewery-batch.md, NB-S1 to NB-S5, decisions NP-Q1
// to NP-Q3). A new recipe — Reset, or a load with no readable saved recipe —
// with My brewery's batch (fermentation) volume set starts from the built-in
// recipe scaled to that batch by the engine's scale, in Pro and in Home; the
// brewery's other set figures then take their places, unscaled. With the
// batch blank nothing changes: Pro at 10 bbl, Home at the built-in 5.5 gal.
//
// The pins are worked by hand from the built-in recipe (5.5 gal in the
// fermenter: 10 lb Pale 2-Row, 1 lb Munich, 1 oz Magnum, 1 oz Cascade, 2 oz
// Citra dry hop, 5 gal mash water, 7 gal pre-boil, 1.5 gal/hr boil-off).
//
// Pro, a brewery batch of 465 gal: ratio = 465 / 5.5 = 930/11 = 84.545454...
//   Pale    10 lb   x 930/11 = 9300/11 = 845.454545... lb
//   Munich   1 lb   x 930/11 =  930/11 =  84.545454... lb
//   Magnum   1 oz   x 930/11 =  930/11 =  84.545454... oz
//   Citra    2 oz   x 930/11 = 1860/11 = 169.090909... oz
//   mash     5 gal  x 930/11 = 4650/11 = 422.727272... gal
//   pre-boil 7 gal  x 930/11 = 6510/11 = 591.818181... gal
//   boil-off 1.5    x 930/11 = 1395/11 = 126.818181... gal/hr
//   In barrels (31 gal/bbl, 465 gal = 15 bbl): pre-boil 6510/11/31 =
//   210/11 = 19.090909... bbl, boil-off 1395/11/31 = 45/11 = 4.090909...
//   bbl/hr; the greyed box shows six decimals: 19.090909 and 4.090909.
//
// Home, a brewery batch of 10 gal: ratio = 10 / 5.5 = 20/11 = 1.818181...
//   Pale    10 lb   x 20/11 = 200/11 = 18.181818... lb
//   mash     5 gal  x 20/11 = 100/11 =  9.090909... gal
//   pre-boil 7 gal  x 20/11 = 140/11 = 12.727272... gal (greyed: 12.727273)
//   boil-off 1.5    x 20/11 =  30/11 =  2.727272... gal/hr (greyed: 2.727273)

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState, emptyBreweryFigures, newRecipe, switchMode } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import {
  exportRecipeDocument,
  loadStartingState,
  savePersisted,
  saveBrewery,
  SCHEMA_VERSION,
} from '../src/persistence.js';

const blank = () => emptyBreweryFigures();
const near = (x, y) => expect(Math.abs(x - y)).toBeLessThan(1e-9 * Math.max(1, Math.abs(y)));

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

// The figures a brewer acts on, through the app's own selector.
function headline(recipe) {
  const d = computeRecipe(recipe);
  return { OG: d.grist.OG, FG: d.grist.FG, ABV: d.grist.ABV, SRM: d.grist.SRM, IBU: d.hops.totalIBU };
}
function expectSameHeadline(a, b) {
  expect(Math.abs(a.OG - b.OG)).toBeLessThan(1e-6);
  expect(Math.abs(a.FG - b.FG)).toBeLessThan(1e-6);
  expect(Math.abs(a.ABV - b.ABV)).toBeLessThan(1e-6);
  expect(Math.abs(a.SRM - b.SRM)).toBeLessThan(1e-4);
  expect(Math.abs(a.IBU - b.IBU)).toBeLessThan(1e-4);
}

// My brewery's boxes, drawn for `brewery` in `mode`, Pro volumes in barrels.
async function breweryBoxes(brewery, mode) {
  const { default: OptionsSection } = await import('../src/components/OptionsSection.jsx');
  const markup = renderToStaticMarkup(
    createElement(OptionsSection, {
      mode,
      proVolumeUnit: 'bbl',
      brewery,
      setBreweryFigure: () => {},
      setBreweryTemp: () => {},
      setBreweryWater: () => {},
      onUseRecipeFigures: () => {},
      onForgetBrewery: () => {},
      onExportBrewery: () => {},
      onImportBreweryFile: () => {},
    }),
  );
  return (label) => {
    const at = markup.indexOf(`>${label}<`);
    expect(at, label).toBeGreaterThan(-1);
    const input = markup.slice(at).match(/<input[^>]*>/)[0];
    return { value: input.match(/value="([^"]*)"/)?.[1], placeholder: input.match(/placeholder="([^"]*)"/)?.[1] };
  };
}

describe("a new recipe at the brewery's batch", () => {
  // NB-S1, NP-Q1 (Pro)
  it("a new Pro recipe starts at the brewery's batch", () => {
    const built = defaultRecipeState();
    const { recipe, mode } = newRecipe({ ...blank(), mode: 'pro', fermentVolGal: 465 });
    expect(mode).toBe('pro');
    expect(recipe.fermentVolGal).toBe(465);
    near(recipe.malts[0].weightLb, 9300 / 11); // 845.4545...
    near(recipe.malts[1].weightLb, 930 / 11); // 84.5454...
    near(recipe.kettleAdditions[0].weightOz, 930 / 11);
    near(recipe.dryHops[0].weightOz, 1860 / 11); // 169.0909...
    near(recipe.mashWaterGal, 4650 / 11); // 422.7272...
    near(recipe.preBoilVolGal, 6510 / 11); // 591.8181...
    near(recipe.boilOffRateGalPerHr, 1395 / 11); // 126.8181...
    // Percents, times, temperatures, efficiency, attenuation and yeast stay,
    // so the figures a brewer acts on stay.
    expect(recipe.efficiency).toBe(built.efficiency);
    expect(recipe.boilTimeMin).toBe(built.boilTimeMin);
    expect(recipe.yeast).toEqual(built.yeast);
    expectSameHeadline(headline(recipe), headline(built));

    // A first visit with no saved recipe is a new recipe too.
    const storage = memoryStorage();
    saveBrewery(storage, { ...blank(), mode: 'pro', fermentVolGal: 465 });
    const first = loadStartingState(storage);
    expect(first.recipe.fermentVolGal).toBe(465);
    near(first.recipe.malts[0].weightLb, 9300 / 11);
  });

  // NB-S1, NP-Q1 (Home)
  it("a new Home recipe starts at the brewery's batch", () => {
    const built = defaultRecipeState();
    for (const b of [{ ...blank(), fermentVolGal: 10 }, { ...blank(), mode: 'home', fermentVolGal: 10 }]) {
      const { recipe, mode } = newRecipe(b);
      expect(mode).toBe('home');
      expect(recipe.fermentVolGal).toBe(10);
      near(recipe.malts[0].weightLb, 200 / 11); // 18.1818...
      near(recipe.mashWaterGal, 100 / 11); // 9.0909...
      near(recipe.preBoilVolGal, 140 / 11); // 12.7272...
      near(recipe.boilOffRateGalPerHr, 30 / 11); // 2.7272...
      expectSameHeadline(headline(recipe), headline(built));
    }
  });

  // NB-S2, NP-Q2, K (ordering)
  it("the brewery's set figures take their places unscaled", () => {
    const brewery = {
      ...blank(),
      mode: 'pro',
      fermentVolGal: 465,
      preBoilVolGal: 520,
      boilOffRateGalPerHr: 40,
      boilTimeMin: 90,
      efficiency: 0.8,
      measurementTempF: { preBoil: 150, postBoil: null, ferment: 68 },
    };
    const { recipe } = newRecipe(brewery);
    expect(recipe.fermentVolGal).toBe(465);
    expect(recipe.preBoilVolGal).toBe(520);
    expect(recipe.boilOffRateGalPerHr).toBe(40);
    expect(recipe.boilTimeMin).toBe(90);
    expect(recipe.efficiency).toBe(0.8);
    expect(recipe.measurementTempF.preBoil).toBe(150);
    expect(recipe.measurementTempF.ferment).toBe(68);
    // The amounts the brewery does not set are scaled to its batch.
    near(recipe.malts[0].weightLb, 9300 / 11);
    near(recipe.mashWaterGal, 4650 / 11);

    // A blank figure never reaches the recipe: NaN and null are blank.
    const withBlanks = newRecipe({ ...brewery, preBoilVolGal: NaN, efficiency: null }).recipe;
    near(withBlanks.preBoilVolGal, 6510 / 11);
    expect(withBlanks.efficiency).toBe(defaultRecipeState().efficiency);

    // K (idempotence): the same brewery gives the same new recipe each time.
    expect(newRecipe(brewery)).toEqual(newRecipe(brewery));
  });

  // NB-S3
  it('with the batch blank nothing changes', () => {
    const built = defaultRecipeState();
    // Pro: 10 bbl = 310 gal, ratio 310 / 5.5 = 620/11; Pale 6200/11 lb.
    const pro = newRecipe({ ...blank(), mode: 'pro' });
    expect(pro.recipe.fermentVolGal).toBe(310);
    near(pro.recipe.malts[0].weightLb, 6200 / 11);
    // Home: the built-in recipe, 5.5 gal.
    expect(newRecipe(blank()).recipe).toEqual(built);
    expect(newRecipe({ ...blank(), mode: 'home' }).recipe).toEqual(built);
    expect(newRecipe({ ...blank(), mode: 'home', preBoilVolGal: 8 }).recipe).toEqual({ ...built, preBoilVolGal: 8 });
    // A batch of zero gives no ratio, as on the Home/Pro switch (rule 8): the
    // built-in amounts, with the batch in its place as before (builder's note).
    expect(newRecipe({ ...blank(), mode: 'pro', fermentVolGal: 0 }).recipe).toEqual({ ...built, fermentVolGal: 0 });
  });

  // NB-S4, NP-Q3
  it('the greyed figures follow', async () => {
    const pro = await breweryBoxes({ ...blank(), mode: 'pro', fermentVolGal: 465 }, 'pro');
    expect(pro('Batch (fermentation) volume (bbl)')).toEqual({ value: '15', placeholder: undefined });
    expect(pro('Pre-boil volume (bbl)').placeholder).toBe('19.090909');
    expect(pro('Boil-off rate (bbl/hr)').placeholder).toBe('4.090909');
    expect(pro('Boil time (min)').placeholder).toBe('60');
    expect(pro('Brewhouse efficiency (%)').placeholder).toBe('75');

    const home = await breweryBoxes({ ...blank(), fermentVolGal: 10 }, 'home');
    expect(home('Batch (fermentation) volume (gal)')).toEqual({ value: '10', placeholder: undefined });
    expect(home('Pre-boil volume (gal)').placeholder).toBe('12.727273');
    expect(home('Boil-off rate (gal/hr)').placeholder).toBe('2.727273');
  });

  // NB-S5
  it('nothing else changes', () => {
    // The saved format: the same version and fields as the built-in recipe's.
    const fresh = newRecipe({ ...blank(), mode: 'pro', fermentVolGal: 465 });
    const doc = JSON.parse(exportRecipeDocument(fresh));
    const was = JSON.parse(exportRecipeDocument({ recipe: defaultRecipeState(), ...newRecipe(blank()), mode: 'pro' }));
    expect(doc.version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(12);
    expect(Object.keys(doc)).toEqual(Object.keys(was));
    expect(Object.keys(doc.recipe)).toEqual(Object.keys(was.recipe));
    expect(Object.keys(doc.recipe.water)).toEqual(Object.keys(was.recipe.water));

    // A saved recipe is loaded as it was saved, never rescaled.
    const storage = memoryStorage();
    const saved = { ...defaultRecipeState(), name: 'Saved' };
    savePersisted(storage, { recipe: saved, mode: 'pro', proGravityUnit: 'plato', temperatureUnit: 'F', proVolumeUnit: 'bbl', proMaltUnit: 'lb' });
    saveBrewery(storage, { ...blank(), mode: 'pro', fermentVolGal: 465 });
    const loaded = loadStartingState(storage);
    expect(loaded.recipe).toEqual(saved);

    // Switching Home and Pro asks as today: a new recipe already at the
    // brewery's batch is asked nothing; one at another batch is asked.
    const asked = [];
    const ask = (q) => (asked.push(q), false);
    switchMode({ ...fresh, mode: 'pro' }, 'home', { ...blank(), fermentVolGal: 465 }, ask);
    expect(asked).toHaveLength(0);
    switchMode({ recipe: saved, mode: 'pro', proVolumeUnit: 'bbl' }, 'home', { ...blank(), fermentVolGal: 465 }, ask);
    expect(asked).toHaveLength(1);
  });
});
