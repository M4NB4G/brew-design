// pro-recipe-default.test.js
// Scenarios for batch S6e, "Scale the recipe when switching Home and Pro"
// (docs/items/pro-recipe-default.md, PD-S1 to PD-S6, decisions PD-Q1 to
// PD-Q9, PD-B1 and PD-B2). Switching Home <-> Pro asks whether to scale the
// recipe to that side's batch: My brewery's batch volume when it is set,
// otherwise 10 bbl for Pro and the built-in 5.5 gal for Home. Yes multiplies
// every amount by the batch over the recipe's fermentation volume; No, or no
// question, changes no figure. A new recipe that opens in Pro with the
// brewery's batch blank is the built-in recipe scaled to 10 bbl. The suite
// has no DOM: the switch is the step the header's Pro/Home toggle calls, with
// the question answered by the test; the browser's confirm is checked at the
// far end.
//
// The pins are worked by hand. 10 bbl x 31 gal/bbl = 310 gal. From the
// built-in 5.5 gal: ratio = 310 / 5.5 = 620/11 = 56.363636...; the 10 lb
// Pale malt -> 6200/11 = 563.636363... lb; the 1 oz Magnum -> 620/11 =
// 56.363636... oz; pre-boil 7 gal -> 4340/11 = 394.545454... gal. In barrels,
// pre-boil 7 x 10/5.5 = 70/5.5 = 12.727272... bbl and boil-off 1.5 x 10/5.5 =
// 15/5.5 = 2.727272... bbl/hr; the greyed box shows six decimals: 12.727273
// and 2.727273. A brewery batch of 465 gal is 465 / 31 = 15 bbl.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState, emptyBreweryFigures, newRecipe, switchMode } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import {
  exportRecipeDocument,
  loadStartingState,
  saveBrewery,
  SCHEMA_VERSION,
} from '../src/persistence.js';

// A question-answerer that records each question and answers `yes`.
function answer(yes) {
  const asked = [];
  const ask = (q) => {
    asked.push(q);
    return yes;
  };
  return { ask, asked };
}

const blank = () => emptyBreweryFigures();
const withBatch = (gal) => ({ ...emptyBreweryFigures(), fermentVolGal: gal });

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
  expect(a.IBU).toBe(b.IBU);
}

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

describe('scale the recipe when switching Home and Pro', () => {
  // PD-S1, PD-S3
  it('switching to Pro offers the Pro batch', () => {
    const home = { recipe: defaultRecipeState(), mode: 'home', proVolumeUnit: 'bbl' };

    // No brewery batch: 10 bbl, in the Pro volume unit on screen.
    let q = answer(false);
    expect(switchMode(home, 'pro', blank(), q.ask).mode).toBe('pro');
    expect(q.asked).toHaveLength(1);
    expect(q.asked[0]).toMatch(/^Scale this recipe to the Pro batch, 10 bbl\?/);

    q = answer(false);
    switchMode({ ...home, proVolumeUnit: 'gal' }, 'pro', blank(), q.ask);
    expect(q.asked[0]).toMatch(/^Scale this recipe to the Pro batch, 310 gal\?/);

    // The brewery's batch when it is set.
    q = answer(false);
    switchMode(home, 'pro', withBatch(465), q.ask);
    expect(q.asked[0]).toMatch(/^Scale this recipe to the Pro batch, 15 bbl\?/);

    // Already at the batch: nothing is asked, and the switch is made.
    q = answer(true);
    const at310 = { ...home, recipe: { ...defaultRecipeState(), fermentVolGal: 310 } };
    let out = switchMode(at310, 'pro', blank(), q.ask);
    expect(q.asked).toHaveLength(0);
    expect(out.mode).toBe('pro');
    expect(out.recipe).toBe(at310.recipe);

    q = answer(true);
    const at465 = { ...home, recipe: { ...defaultRecipeState(), fermentVolGal: 465 } };
    out = switchMode(at465, 'pro', withBatch(465), q.ask);
    expect(q.asked).toHaveLength(0);
    expect(out.recipe).toBe(at465.recipe);

    // Choosing the mode already on screen asks nothing and changes nothing.
    q = answer(true);
    out = switchMode(home, 'home', blank(), q.ask);
    expect(q.asked).toHaveLength(0);
    expect(out).toEqual({ recipe: home.recipe, mode: 'home' });
  });

  // PD-S1, PD-S4, PD-Q1, PD-Q5
  it('yes scales, no changes nothing', () => {
    const home = { recipe: defaultRecipeState(), mode: 'home', proVolumeUnit: 'bbl' };
    const before = headline(home.recipe);

    // Yes: every amount by 620/11 (header); OG, FG, ABV, SRM and IBU stay.
    const yes = switchMode(home, 'pro', blank(), answer(true).ask);
    expect(yes.mode).toBe('pro');
    expect(yes.recipe.fermentVolGal).toBe(310);
    expect(yes.recipe.malts[0].weightLb).toBeCloseTo(563.636363636, 8);
    expect(yes.recipe.kettleAdditions[0].weightOz).toBeCloseTo(56.363636364, 8);
    expect(yes.recipe.preBoilVolGal).toBeCloseTo(394.545454545, 8);
    expect(yes.recipe.efficiency).toBe(home.recipe.efficiency);
    expect(yes.recipe.boilTimeMin).toBe(home.recipe.boilTimeMin);
    expect(yes.recipe.yeast).toEqual(home.recipe.yeast);
    expectSameHeadline(headline(yes.recipe), before);

    // No: the same recipe, shown in Pro's units.
    const no = switchMode(home, 'pro', blank(), answer(false).ask);
    expect(no.mode).toBe('pro');
    expect(no.recipe).toBe(home.recipe);
    expect(no.recipe).toEqual(defaultRecipeState());
  });

  // PD-S2, PD-S3, PD-Q6, K (idempotence)
  it('switching to Home offers the Home batch', () => {
    const pro = switchMode(
      { recipe: defaultRecipeState(), mode: 'home', proVolumeUnit: 'bbl' },
      'pro',
      blank(),
      answer(true).ask,
    );

    // No brewery batch: the built-in 5.5 gal.
    const q = answer(true);
    const home = switchMode({ ...pro, proVolumeUnit: 'bbl' }, 'home', blank(), q.ask);
    expect(q.asked).toHaveLength(1);
    expect(q.asked[0]).toMatch(/^Scale this recipe to the Home batch, 5\.5 gal\?/);
    expect(home.mode).toBe('home');

    // Home -> Pro -> Home with yes both ways returns the same amounts.
    const built = defaultRecipeState();
    expect(home.recipe.fermentVolGal).toBe(5.5);
    const near = (x, y) => expect(Math.abs(x - y)).toBeLessThan(1e-12 * Math.max(1, Math.abs(y)));
    home.recipe.malts.forEach((m, i) => near(m.weightLb, built.malts[i].weightLb));
    home.recipe.kettleAdditions.forEach((h, i) => near(h.weightOz, built.kettleAdditions[i].weightOz));
    home.recipe.dryHops.forEach((h, i) => near(h.weightOz, built.dryHops[i].weightOz));
    for (const k of ['mashWaterGal', 'preBoilVolGal', 'boilOffRateGalPerHr']) near(home.recipe[k], built[k]);

    // The brewery's batch, when set, is the Home batch too (PD-Q2'').
    const q2 = answer(false);
    switchMode({ ...pro, proVolumeUnit: 'bbl' }, 'home', withBatch(465), q2.ask);
    expect(q2.asked[0]).toMatch(/^Scale this recipe to the Home batch, 465 gal\?/);

    // No: the Pro-sized recipe, shown in Home's units.
    const no = switchMode({ ...pro, proVolumeUnit: 'bbl' }, 'home', blank(), answer(false).ask);
    expect(no).toEqual({ recipe: pro.recipe, mode: 'home' });
  });

  // PD-S5, PD-Q7, PD-B1, PD-B2
  it('Reset in Pro starts at 10 bbl', async () => {
    const built = defaultRecipeState();

    // A new recipe that opens in Pro, the brewery's batch blank: 10 bbl.
    const pro = newRecipe({ ...blank(), mode: 'pro' });
    expect(pro.mode).toBe('pro');
    expect(pro.recipe.fermentVolGal).toBe(310);
    expect(pro.recipe.malts[0].weightLb).toBeCloseTo(563.636363636, 8);
    expect(pro.recipe.preBoilVolGal).toBeCloseTo(394.545454545, 8);
    expectSameHeadline(headline(pro.recipe), headline(built));

    // A brewery figure that is set still takes the built-in one's place.
    const set = newRecipe({ ...blank(), mode: 'pro', preBoilVolGal: 360, efficiency: 0.8 });
    expect(set.recipe.fermentVolGal).toBe(310);
    expect(set.recipe.preBoilVolGal).toBe(360);
    expect(set.recipe.efficiency).toBe(0.8);
    expect(set.recipe.malts[0].weightLb).toBeCloseTo(563.636363636, 8);

    // A first visit with no saved recipe is a new recipe too.
    const storage = memoryStorage();
    saveBrewery(storage, { ...blank(), mode: 'pro' });
    const first = loadStartingState(storage);
    expect(first.mode).toBe('pro');
    expect(first.recipe.fermentVolGal).toBe(310);

    // In Home, or with My brewery's Home/Pro blank (Reset lands in Home), the
    // built-in 5.5 gal recipe as before (PD-B1).
    expect(newRecipe(blank())).toEqual({ ...newRecipe(blank()), mode: 'home', recipe: built });
    expect(newRecipe({ ...blank(), mode: 'home' }).recipe).toEqual(built);

    // My brewery's greyed boxes name the figures this new recipe gets (PD-B2).
    const { default: OptionsSection } = await import('../src/components/OptionsSection.jsx');
    const markup = renderToStaticMarkup(
      createElement(OptionsSection, {
        mode: 'pro',
        proVolumeUnit: 'bbl',
        brewery: { ...blank(), mode: 'pro' },
        setBreweryFigure: () => {},
        setBreweryTemp: () => {},
        setBreweryWater: () => {},
        onUseRecipeFigures: () => {},
        onForgetBrewery: () => {},
        onExportBrewery: () => {},
        onImportBreweryFile: () => {},
      }),
    );
    const placeholder = (label) => {
      const at = markup.indexOf(`>${label}<`);
      expect(at, label).toBeGreaterThan(-1);
      return markup.slice(at).match(/<input[^>]*>/)[0].match(/placeholder="([^"]*)"/)?.[1];
    };
    expect(placeholder('Batch (fermentation) volume (bbl)')).toBe('10');
    expect(placeholder('Pre-boil volume (bbl)')).toBe('12.727273');
    expect(placeholder('Boil-off rate (bbl/hr)')).toBe('2.727273');
    expect(placeholder('Boil time (min)')).toBe('60');
    expect(placeholder('Brewhouse efficiency (%)')).toBe('75');
  });

  // PD-S6, PD-Q8, K (atomicity)
  it('nothing else changes', () => {
    const state = { recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato', temperatureUnit: 'F', proVolumeUnit: 'bbl', proMaltUnit: 'lb' };
    const before = exportRecipeDocument(state);

    // Declined: the saved document is byte for byte the same but for the mode.
    const no = switchMode(state, 'pro', blank(), answer(false).ask);
    expect(exportRecipeDocument({ ...state, ...no })).toBe(exportRecipeDocument({ ...state, mode: 'pro' }));
    expect(exportRecipeDocument({ ...state, ...no, mode: 'home' })).toBe(before);

    // Scaled: the same format, version and fields; only amounts differ.
    const yes = switchMode(state, 'pro', blank(), answer(true).ask);
    const doc = JSON.parse(exportRecipeDocument({ ...state, ...yes }));
    const was = JSON.parse(before);
    expect(doc.version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(12);
    expect(Object.keys(doc)).toEqual(Object.keys(was));
    expect(Object.keys(doc.recipe)).toEqual(Object.keys(was.recipe));
    expect(Object.keys(doc.recipe.water)).toEqual(Object.keys(was.recipe.water));

    // A blank fermentation volume gives no ratio: nothing is asked, and the
    // switch changes units only.
    const q = answer(true);
    const blankFerment = { ...state, recipe: { ...defaultRecipeState(), fermentVolGal: NaN } };
    const out = switchMode(blankFerment, 'pro', blank(), q.ask);
    expect(q.asked).toHaveLength(0);
    expect(out).toEqual({ recipe: blankFerment.recipe, mode: 'pro' });
  });
});
