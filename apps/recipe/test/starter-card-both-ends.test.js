// starter-card-both-ends.test.js
// The starter card always says what to do (docs/items/starter-card-both-ends.md,
// SB-S1 to SB-S7; Tier A). Through the UI's own selectors (computeRecipe) and
// the card's and the printed sheet's own markup: the built-in recipe, at 210
// billion cells, a small batch at 80 billion, a Pro batch in thousands of
// billions, and a blank cell count.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState, emptyBreweryFigures, newRecipe } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import YeastSection from '../src/components/YeastSection.jsx';
import RecipeSheet from '../src/components/RecipeSheet.jsx';

const ABOVE =
  'No single starter of 5 L or less reaches this count. Pitch more packs, or build the starter in steps.';
const BLANK = 'No usable starter band for this cell count.';

const card = (recipe, mode) =>
  renderToStaticMarkup(
    createElement(YeastSection, { yeast: recipe.yeast, derived: computeRecipe(recipe), mode, setYeast: () => {} }),
  );
const sheetHtml = (recipe, mode) =>
  renderToStaticMarkup(
    createElement(RecipeSheet, {
      recipe,
      derived: computeRecipe(recipe),
      water: computeWater(recipe.water, recipe),
      mode,
      proGravityUnit: 'plato',
      temperatureUnit: 'F',
      proVolumeUnit: 'bbl',
      proMaltUnit: 'lb',
    }),
  );
const sheet = (recipe, mode) =>
  recipeSheet({
    recipe,
    derived: computeRecipe(recipe),
    water: computeWater(recipe.water, recipe),
    mode,
    proGravityUnit: 'plato',
    temperatureUnit: 'F',
    proVolumeUnit: 'bbl',
    proMaltUnit: 'lb',
    today: new Date(2026, 10, 10),
  });
// The card's starter table rows, as text: band, volume, DME, note.
const cardRows = (html) =>
  [...html.matchAll(/<tr[^>]*><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><td[^>]*>([^<]*)<\/td><\/tr>/g)].map(
    (m) => m.slice(1),
  );
// The printed sheet's Yeast & Starter section, to the next section.
const yeastBlock = (html) => {
  const from = html.indexOf('Yeast &amp; Starter');
  return html.slice(from);
};

describe('the starter card at both ends', () => {
  it('the Yeast card and the printed sheet say what to do at 210 billion and above 1,270 billion', () => {
    // SB-S6: the built-in recipe, a new visitor's first, needs 210 billion
    // cells (0.75 x 13.752 °P x 3.785411784 L/gal x 5.5 gal = 214.7, to the
    // nearest 10), and is offered one 100B pack in 0.50 L with 57.5 g of
    // extract (100 / 200 = 0.50 L, the pack's smallest starter; 0.50 x 115 =
    // 57.5 g), shown at the card's and the sheet's whole grams as 58.
    // Before this item (S-4): no option; the card and the sheet read "No
    // usable starter band for this cell count."
    const builtIn = defaultRecipeState();
    const d = computeRecipe(builtIn);
    expect(d.cells).toBe(210);
    expect(d.starter).toHaveLength(1);
    expect(d.starter[0].band).toBe('100B');
    expect(d.starter[0].volumeL).toBeCloseTo(0.5, 6);
    expect(d.starter[0].dmeGrams).toBeCloseTo(57.5, 4);
    const home = card(builtIn, 'home');
    expect(cardRows(home)).toEqual([['100B', '0.50', '58', '—']]);
    expect(home).not.toContain(BLANK);
    expect(home).not.toContain(ABOVE);
    expect(sheet(builtIn, 'home').yeast.starter).toEqual([{ band: '100B', volume: '0.50', dme: '58', note: '' }]);
    const printed = yeastBlock(sheetHtml(builtIn, 'home'));
    expect(printed).toContain('<td');
    expect(printed).not.toContain(BLANK);
    expect(printed).not.toContain(ABOVE);

    // A fresh visit opens the built-in recipe, as above.
    const fresh = newRecipe(emptyBreweryFigures()).recipe;
    expect(computeRecipe(fresh).starter).toEqual(d.starter);

    // SB-S1 and SB-S2: a small batch at 80 billion (2 gal of the built-in
    // wort: 214.7 x 2 / 5.5 = 78.1, to the nearest 10) — either pack, no starter.
    const small = { ...defaultRecipeState(), fermentVolGal: 2 };
    expect(computeRecipe(small).cells).toBe(80);
    expect(cardRows(card(small, 'home'))).toEqual([
      ['100B', '0.00', '0', 'One 100B pack, no starter'],
      ['200B', '0.00', '0', 'One 200B pack, no starter'],
    ]);
    expect(sheet(small, 'home').yeast.starter.map((r) => r.note)).toEqual([
      'One 100B pack, no starter',
      'One 200B pack, no starter',
    ]);

    // SB-S5: a Pro batch, the built-in recipe at 10 bbl, needs thousands of
    // billions (214.7 x 310 / 5.5 = 12,100), above every single starter: the
    // card and the printed sheet say what to do, not the old sentence.
    const pro = newRecipe({ ...emptyBreweryFigures(), mode: 'pro' }).recipe;
    expect(computeRecipe(pro).cells).toBeGreaterThan(1270);
    const proCard = card(pro, 'pro');
    expect(proCard).toContain(ABOVE);
    expect(proCard).not.toContain(BLANK);
    const proPrinted = yeastBlock(sheetHtml(pro, 'pro'));
    expect(proPrinted).toContain(ABOVE);
    expect(proPrinted).not.toContain(BLANK);

    // At Home too, above 1,270 billion: 40 gal of the built-in wort
    // (214.7 x 40 / 5.5 = 1,561.7 -> 1,560).
    const big = { ...defaultRecipeState(), fermentVolGal: 40 };
    expect(computeRecipe(big).cells).toBe(1560);
    expect(card(big, 'home')).toContain(ABOVE);
    expect(yeastBlock(sheetHtml(big, 'home'))).toContain(ABOVE);

    // A zero batch, 0 billion cells needed, has no option and reads as before
    // (N-4): the old sentence, not SB-S5's.
    const zero = { ...defaultRecipeState(), fermentVolGal: 0 };
    expect(computeRecipe(zero).cells).toBe(0);
    expect(computeRecipe(zero).starter).toEqual([]);
    expect(card(zero, 'home')).toContain(BLANK);
    expect(card(zero, 'home')).not.toContain(ABOVE);
    expect(yeastBlock(sheetHtml(zero, 'home'))).toContain(BLANK);

    // The old sentence stays only where the cell count itself is blank.
    const blank = { ...defaultRecipeState(), fermentVolGal: NaN };
    expect(computeRecipe(blank).cells).toBeNaN();
    const blankCard = card(blank, 'home');
    expect(blankCard).toContain(BLANK);
    expect(blankCard).not.toContain(ABOVE);
    const blankPrinted = yeastBlock(sheetHtml(blank, 'home'));
    expect(blankPrinted).toContain(BLANK);
    expect(blankPrinted).not.toContain(ABOVE);
  });
});
