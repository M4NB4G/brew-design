// whirlpool-hop-range.test.js
// "The Hops card and the printed hop schedule name a hop below 176 °F, and no
// other" (docs/items/whirlpool-hop-range.md, WH-S4, WH-S5 and WH-S7; Tier A).
// Through the UI's own selectors (computeRecipe) and the card's and the
// printed sheet's own markup, in °F and in °C: the built-in recipe with hops
// added at 150, 170, 175.9, 176, 180 °F and a blank temperature, and Rev 4's
// reference recipe, whose three whirlpool hops stand at 175 °F.
//
// In °C the limit reads (176 − 32) × 5 / 9 = 144 × 5 / 9 = 80 °C.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import HopsSection from '../src/components/HopsSection.jsx';
import RecipeSheet from '../src/components/RecipeSheet.jsx';

const hop = (name, timeMin, wortTempF) => ({ name, timeMin, wortTempF, weightOz: 1, alphaAcidFraction: 0.1, pricePerOz: NaN });

// The built-in recipe (Magnum and Cascade at 212 °F) with six hops added.
const mixed = () => ({
  ...defaultRecipeState(),
  kettleAdditions: [
    ...defaultRecipeState().kettleAdditions,
    hop('Citra', 20, 150),
    hop('Mosaic', 20, 180),
    hop('', 15, 170), // unnamed: the card calls it "Kettle hop 5"
    hop('Amarillo', 20, 176),
    hop('Simcoe', 20, NaN),
    hop('Nelson', 30, 175.9),
  ],
});

// Rev 4's reference recipe's hops (Hops!A3:F7) on the built-in recipe.
const reference = () => ({
  ...defaultRecipeState(),
  kettleAdditions: [
    { ...hop('Bravo', 60, 204), weightOz: 2, alphaAcidFraction: 0.147 },
    { ...hop('Helios', 30, 204), alphaAcidFraction: 0.19 },
    { ...hop('Citra LupoMAX', 20, 175), weightOz: 2, alphaAcidFraction: 0.18 },
    { ...hop('Hopstiener 9326', 20, 175), weightOz: 2, alphaAcidFraction: 0.06 },
    { ...hop('Helios', 20, 175), alphaAcidFraction: 0.19 },
  ],
});

const card = (recipe, temperatureUnit) =>
  renderToStaticMarkup(
    createElement(HopsSection, {
      kettleAdditions: recipe.kettleAdditions,
      dryHops: recipe.dryHops,
      hops: computeRecipe(recipe).hops,
      waterBackOn: false,
      mode: 'home',
      temperatureUnit,
      setRow: () => {},
      addRow: () => {},
      removeRow: () => {},
    }),
  );
const args = (recipe, temperatureUnit) => ({
  recipe,
  derived: computeRecipe(recipe),
  water: computeWater(recipe.water, recipe),
  mode: 'home',
  proGravityUnit: 'plato',
  temperatureUnit,
  proVolumeUnit: 'bbl',
  proMaltUnit: 'lb',
});
const sheetHtml = (recipe, temperatureUnit) => renderToStaticMarkup(createElement(RecipeSheet, args(recipe, temperatureUnit)));
const sheetData = (recipe, temperatureUnit) => recipeSheet({ ...args(recipe, temperatureUnit), today: new Date(2026, 10, 10) });

// Every line of the markup that says a hop's bitterness is held, as text.
const heldLines = (html) =>
  [...html.matchAll(/<p\b[^>]*>(.*?)<\/p>/gs)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&#x27;/g, "'").replace(/&amp;/g, '&'))
    .filter((t) => /bitterness is held/.test(t));

const F = (name) => `${name}: below 176 °F, its bitterness is held at the 176 °F figure.`;
const C = (name) => `${name}: below 80 °C, its bitterness is held at the 80 °C figure.`;

describe('the Hops card and the printed hop schedule name a hop below 176 °F, and no other', () => {
  it('names the hops at 150, 170 and 175.9 °F, in °F and in °C; not those at 176, 180 or 212 °F, nor a blank temperature (WH-S4, WH-S5)', () => {
    const r = mixed();
    const expectedF = [F('Citra, 20 min'), F('Kettle hop 5, 15 min'), F('Nelson, 30 min')];
    const expectedC = [C('Citra, 20 min'), C('Kettle hop 5, 15 min'), C('Nelson, 30 min')];

    expect(heldLines(card(r, 'F'))).toEqual(expectedF);
    expect(heldLines(card(r, 'C'))).toEqual(expectedC);
    expect(sheetData(r, 'F').hops.heldNotes).toEqual(expectedF);
    expect(sheetData(r, 'C').hops.heldNotes).toEqual(expectedC);
    expect(heldLines(sheetHtml(r, 'F'))).toEqual(expectedF);
    expect(heldLines(sheetHtml(r, 'C'))).toEqual(expectedC);

    // A blank temperature is a blank figure, as today (WH-S5): no factor, no
    // bitterness, no note.
    const simcoe = computeRecipe(r).hops.additions[6];
    expect(simcoe.tempFactor).toBeNaN();
    expect(simcoe.ibu).toBeNaN();
  });

  it('the built-in recipe, every hop at 212 °F, carries no note', () => {
    const r = defaultRecipeState();
    expect(heldLines(card(r, 'F'))).toEqual([]);
    expect(heldLines(card(r, 'C'))).toEqual([]);
    expect(sheetData(r, 'F').hops.heldNotes).toBeUndefined();
    expect(heldLines(sheetHtml(r, 'F'))).toEqual([]);
  });

  it("Rev 4's reference recipe names its three whirlpool hops at 175 °F, shows them at the 176 °F figure, and totals 46 (WH-S7)", () => {
    const r = reference();
    const expectedF = [F('Citra LupoMAX, 20 min'), F('Hopstiener 9326, 20 min'), F('Helios, 20 min')];
    expect(heldLines(card(r, 'F'))).toEqual(expectedF);
    expect(heldLines(sheetHtml(r, 'F'))).toEqual(expectedF);
    expect(heldLines(card(r, 'C'))).toEqual([C('Citra LupoMAX, 20 min'), C('Hopstiener 9326, 20 min'), C('Helios, 20 min')]);

    // Rev 4's own volumes (16 gal pre-boil, 14.5 post-boil) and grist give the
    // golden master's figures: by hand there, each hop's bitterness is Rev 4's
    // times 0.24992434 / 0.24336656 = 1.02694610: 5.67336256 -> 5.82623756,
    // 1.89112085 -> 1.94207918, 2.99427468 -> 3.07495871 (Rev 4, Hops!J5:J7).
    // Printed to 0.1: 5.8, 1.9 and 3.1 (Rev 4's: 5.7, 1.9 and 3.0).
    const rev4 = {
      ...r,
      malts: [
        { ...r.malts[0], name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
        { ...r.malts[1], name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
      ],
      efficiency: 0.93,
      preBoilVolGal: 16,
      mashWaterGal: 13,
      fermentVolGal: 12,
    };
    const d = computeRecipe(rev4);
    expect(d.hops.additions.slice(2).map((a) => a.ibu)).toEqual([
      expect.closeTo(5.82623756, 4),
      expect.closeTo(1.94207918, 4),
      expect.closeTo(3.07495871, 4),
    ]);
    expect(d.stats.IBU).toBe(46);
    expect(sheetData(rev4, 'F').hops.kettle.map((k) => k.ibu)).toEqual(['23.5', '11.7', '5.8', '1.9', '3.1']);
  });
});
