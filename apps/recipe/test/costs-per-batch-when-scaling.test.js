// costs-per-batch-when-scaling.test.js
// Scenarios for "Costs per batch when the recipe scales" (scope table agreed
// 2026-10-08, docs/items/costs-per-batch-when-scaling.md, CS-S1 to CS-S4,
// CS-Q1). Scaling the recipe to a batch (the Home/Pro switch, SPEC rule 8)
// leaves the yeast's price and the other cost lines as typed, each a cost per
// batch; when any of them is priced, the scale question says so. The suite
// has no DOM: the switch is the step the header's Pro/Home toggle calls, with
// the question answered by the test (as pro-recipe-default.test.js does).
//
// The pins are worked by hand. 10 bbl x 31 gal/bbl = 310 gal; from the
// built-in 5.5 gal the ratio is 310 / 5.5 = 620/11; the 10 lb of Pale ->
// 6200/11 = 563.636... lb; at $1.20/lb it costs 6200/11 x 1.20 = 7440/11 =
// $676.3636...

import { describe, it, expect } from 'vitest';
import { defaultRecipeState, emptyBreweryFigures, switchMode } from '../src/state.js';
import { computeCost } from '../src/selectors.js';

function answer(yes) {
  const asked = [];
  const ask = (q) => {
    asked.push(q);
    return yes;
  };
  return { ask, asked };
}

const SENTENCE = 'The yeast\'s price and the other cost lines are per batch and stay as typed.';
// Today's question, byte for byte (pro-recipe-default.md, PD-S1).
const TODAYS_PRO =
  'Scale this recipe to the Pro batch, 10 bbl?\n\n' +
  'OK multiplies every amount by the same ratio, so OG, FG, ABV, color and bitterness stay as they are. ' +
  'Cancel switches to Pro with the recipe as it is.';

const home = (patch = {}) => ({ recipe: { ...defaultRecipeState(), ...patch }, mode: 'home', proVolumeUnit: 'bbl' });
const withYeastPrice = (price) => {
  const r = defaultRecipeState();
  return { yeast: { ...r.yeast, pricePerBatch: price } };
};
const CO2 = { name: 'CO2', costPerBatch: 3.7 };

function questionFor(state) {
  const q = answer(false);
  switchMode(state, 'pro', emptyBreweryFigures(), q.ask);
  expect(q.asked).toHaveLength(1);
  return q.asked[0];
}

describe('costs per batch when the recipe scales', () => {
  it('the question names the per-batch costs when one is priced', () => {
    // CS-S2: the yeast at $8; an other line at $3.70 alone; the yeast priced
    // at $0 (a price that is a number is priced, EC-Q6).
    expect(questionFor(home(withYeastPrice(8)))).toContain(SENTENCE);
    expect(questionFor(home({ otherCosts: [CO2] }))).toContain(SENTENCE);
    expect(questionFor(home(withYeastPrice(0)))).toContain(SENTENCE);
    // Switching back to Home asks it too.
    const pro = { recipe: { ...defaultRecipeState(), ...withYeastPrice(8), fermentVolGal: 310 }, mode: 'pro', proVolumeUnit: 'bbl' };
    const q = answer(false);
    switchMode(pro, 'home', emptyBreweryFigures(), q.ask);
    expect(q.asked[0]).toMatch(/^Scale this recipe to the Home batch, 5\.5 gal\?/);
    expect(q.asked[0]).toContain(SENTENCE);
  });

  it('the question is as today when none is priced', () => {
    // CS-S3: the built-in recipe (no yeast price, no other lines), and an
    // other line with no cost: today's question, byte for byte.
    expect(questionFor(home())).toBe(TODAYS_PRO);
    expect(questionFor(home({ otherCosts: [{ name: 'CO2', costPerBatch: NaN }] }))).toBe(TODAYS_PRO);
    // A malt or hop price is per lb or per oz, not per batch: as today.
    const r = defaultRecipeState();
    expect(questionFor(home({ malts: r.malts.map((m) => ({ ...m, pricePerLb: 1.2 })) }))).toBe(TODAYS_PRO);
  });

  it('scaling leaves them as typed', () => {
    // CS-S1, CS-S4: 5.5 gal -> 10 bbl with yes: the yeast still $8, CO2 still
    // $3.70; Pale at $1.20/lb on 6200/11 lb costs 7440/11 = $676.36 (by hand).
    const r = defaultRecipeState();
    const state = home({
      ...withYeastPrice(8),
      otherCosts: [CO2],
      malts: r.malts.map((m, i) => (i === 0 ? { ...m, pricePerLb: 1.2 } : m)),
    });
    const out = switchMode(state, 'pro', emptyBreweryFigures(), answer(true).ask);
    expect(out.recipe.yeast.pricePerBatch).toBe(8);
    expect(out.recipe.otherCosts).toEqual([CO2]);
    expect(out.recipe.malts[0].pricePerLb).toBe(1.2);
    expect(out.recipe.malts[0].weightLb).toBeCloseTo(6200 / 11, 9);
    const cost = computeCost(out.recipe);
    expect(cost.lines.find((l) => l.kind === 'malts' && l.index === 0).cost).toBeCloseTo(7440 / 11, 9);
    expect(cost.lines.find((l) => l.kind === 'yeast').cost).toBe(8);
    expect(cost.lines.find((l) => l.kind === 'otherCosts').cost).toBeCloseTo(3.7, 12);
  });

  it('nothing else changes', () => {
    // CS-S4: with the per-batch lines priced, yes scales exactly what it
    // scales without them; no leaves the recipe as it was; a recipe already
    // at the batch is not asked.
    const priced = home({ ...withYeastPrice(8), otherCosts: [CO2] });
    const plain = home();
    const scaled = switchMode(priced, 'pro', emptyBreweryFigures(), answer(true).ask).recipe;
    const scaledPlain = switchMode(plain, 'pro', emptyBreweryFigures(), answer(true).ask).recipe;
    expect({ ...scaled, yeast: { ...scaled.yeast, pricePerBatch: NaN }, otherCosts: [] }).toEqual(scaledPlain);

    const kept = switchMode(priced, 'pro', emptyBreweryFigures(), answer(false).ask);
    expect(kept.recipe).toBe(priced.recipe);
    expect(kept.mode).toBe('pro');

    const atBatch = { ...priced, recipe: { ...priced.recipe, fermentVolGal: 310 } };
    const q = answer(true);
    expect(switchMode(atBatch, 'pro', emptyBreweryFigures(), q.ask).recipe).toBe(atBatch.recipe);
    expect(q.asked).toHaveLength(0);
  });
});
