// print-sheet-legibility.test.js
// Scenarios for "Printed sheet at a glance" (docs/items/print-sheet-legibility.md),
// named from its sentences PL-S3 to PL-S8. The suite has no DOM: these check
// the sheet's data and its rendered markup. Text sizes and page breaks
// (PL-S1, PL-S2) are the far end, in print preview.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as engine from '@brew/engine';
const { ACIDS } = engine;
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState, EXAMPLE_SOURCE } from '../src/water-state.js';
import { cellsUnit } from '../src/display.js';
import { printColors } from '../src/components/shared/styles.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import RecipeSheet from '../src/components/RecipeSheet.jsx';
import WaterTab from '../src/components/water/WaterTab.jsx';

const TODAY = new Date(2026, 8, 23);

// The smoke test's reference recipe (test/smoke.test.js), canonical units:
// 570 billion cells needed, one starter option (the 200B band, no pack note).
const referenceState = () => ({
  ...defaultRecipeState(),
  name: 'Reference IPA',
  style: '21A American IPA',
  notes: '',
  malts: [
    { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2, type: 'base', distilledWaterPh: NaN, acidityMeqPerKg: NaN },
    { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0, type: 'base', distilledWaterPh: NaN, acidityMeqPerKg: NaN },
  ],
  efficiency: 0.93,
  apparentAttenuation: 0.8,
  preBoilVolGal: 16,
  boilOffRateGalPerHr: 1.5,
  boilTimeMin: 60,
  mashWaterGal: 13,
  kettleAdditions: [
    { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 },
    { name: 'Helios', timeMin: 30, wortTempF: 204, weightOz: 1, alphaAcidFraction: 0.19 },
    { name: 'Citra LupoMAX', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.18 },
    { name: 'Hopstiener 9326', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.06 },
    { name: 'Helios', timeMin: 20, wortTempF: 175, weightOz: 1, alphaAcidFraction: 0.19 },
  ],
  dryHops: [
    { name: 'DH1', weightOz: 2 },
    { name: 'DH2', weightOz: 2 },
    { name: 'DH3', weightOz: 2 },
    { name: 'DH4', weightOz: 2 },
    { name: 'DH5', weightOz: 1 },
    { name: 'DH6', weightOz: 1 },
    { name: 'DH7', weightOz: 2 },
    { name: 'DH8', weightOz: 2 },
    { name: 'DH9', weightOz: 1 },
  ],
  fermentVolGal: 12,
  yeast: { type: 'ale', density: 'mod', name: '', fermTempF: NaN },
  measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
});

// 10 lb of a base malt at 2 °L and 1 lb of a crystal malt at 40 °L in 5 gal of
// mash water, the water untreated (the example report, every addition at 0):
// the predicted mash pH is worked out by hand in mash-ph.test.js.
//   pH = 5.6418631 + 0.0623138 x 0.8614957 = 5.6955462
// Shown to one decimal that is 5.7; two decimals would have said 5.70.
const HAND_PH = 5.6955462;
const malt = (name, type, weightLb, colorL) => ({
  name,
  weightLb,
  fgdb: 0.8,
  colorL,
  type,
  distilledWaterPh: NaN,
  acidityMeqPerKg: NaN,
});
const waterRecipe = () => ({
  ...defaultRecipeState(),
  malts: [malt('Pale', 'base', 10, 2), malt('Crystal 40', 'crystal', 1, 40)],
  mashWaterGal: 5,
  water: {
    ...defaultWaterState(),
    source: { ...EXAMPLE_SOURCE },
    saltOverrides: Object.fromEntries(Object.keys(engine.SALT_CONTRIBUTIONS_PER_G_GAL).map((k) => [k, 0])),
    acidAmounts: Object.fromEntries(Object.keys(ACIDS).map((k) => [k, 0])),
  },
});

const sheetData = (recipe, mode = 'home') =>
  recipeSheet({
    recipe,
    derived: computeRecipe(recipe),
    water: computeWater(recipe.water, recipe),
    mode,
    proGravityUnit: 'plato',
    today: TODAY,
  });
const sheetHtml = (recipe, mode = 'home') =>
  renderToStaticMarkup(
    createElement(RecipeSheet, {
      recipe,
      derived: computeRecipe(recipe),
      water: computeWater(recipe.water, recipe),
      mode,
      proGravityUnit: 'plato',
    }),
  );

// The yeast block: the markup from its heading to the next section's.
const yeastBlock = (html) => {
  const from = html.indexOf('Yeast &amp; Starter');
  const to = html.indexOf('<div style="margin-top:6px', from);
  return html.slice(from, to);
};
const tablesOf = (block) => block.match(/<table[\s\S]*?<\/table>/g) ?? [];

describe('printed sheet at a glance (docs/items/print-sheet-legibility.md)', () => {
  it('the predicted mash pH reads on two lines at the comma, to one decimal', () => {
    // PL-S3, PL-S4: HAND_PH is the model's figure and is unchanged; only its
    // display drops a decimal.
    const recipe = waterRecipe();
    const figures = computeWater(recipe.water, recipe);
    expect(figures.mashPh.ph).toBeCloseTo(HAND_PH, 6);

    // The sheet's data: 5.6955 -> "5.7".
    const s = sheetData(recipe);
    expect(s.water.mashPhLabel).toBe('Mash pH (cooled sample),');
    expect(s.water.mashPhPredicted).toBe('5.7');

    // The rendered sheet: two lines, broken at the comma, body size and
    // dark body text, beside the measured box.
    const html = sheetHtml(recipe);
    const line = (text) => new RegExp(`<div style="([^"]*)">${text}</div>`);
    const first = html.match(line('Mash pH \\(cooled sample\\),'));
    const second = html.match(line('predicted 5\\.7'));
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(html.indexOf(first[0]) + first[0].length).toBe(html.indexOf(second[0]));
    for (const m of [first, second]) {
      expect(m[1]).toContain('font-size:12px');
      expect(m[1]).toContain(`color:${printColors.body}`);
      expect(m[1]).not.toMatch(/text-transform|letter-spacing/);
    }

    // The Salts & Acid screen shows the same figure to one decimal.
    const screen = renderToStaticMarkup(
      createElement(WaterTab, {
        water: recipe.water,
        figures,
        mode: 'home',
        screen: 'salts',
        onScreen: () => {},
        setWater: () => {},
      }),
    );
    expect(screen).toMatch(/>5\.7<\/div><div[^>]*>Predicted mash pH \(cooled sample\)</);
    expect(screen).not.toContain('5.70');

    // A blank prints "—" on its first line, as before.
    const blank = { ...recipe, malts: [malt('Pale', '', 10, 2)] };
    expect(sheetData(blank).water.mashPhPredicted).toBe('—');
  });

  it('the yeast block shares one grid', () => {
    // PL-S5: a first column of 40 % holding text, left-aligned; the other
    // columns equal and centred, in all three tables, so they line up.
    const tables = tablesOf(yeastBlock(sheetHtml(referenceState())));
    expect(tables).toHaveLength(3);
    for (const table of tables) {
      const widths = [...table.matchAll(/<col style="width:([\d.]+%)"/g)].map((m) => m[1]);
      expect(widths).toEqual(['40%', '20%', '20%', '20%']);
      expect(table).toContain('table-layout:fixed');
      for (const row of table.match(/<tr[\s\S]*?<\/tr>/g)) {
        const cells = [...row.matchAll(/<t[hd] ([^>]*?)(?:\/>|>)/g)].map((m) => m[1]);
        expect(cells[0]).toContain('text-align:left');
        for (const c of cells.slice(1)) expect(c).toContain('text-align:center');
      }
    }
  });

  it('an empty starter note prints blank', () => {
    // PL-S6: the reference recipe's one starter option carries no pack note.
    const s = sheetData(referenceState());
    expect(s.yeast.starter).toHaveLength(1);
    expect(s.yeast.starter[0].note).toBe('');
    const rows = tablesOf(yeastBlock(sheetHtml(referenceState())))[2].match(/<tr[\s\S]*?<\/tr>/g);
    const cells = [...rows[1].matchAll(/<td [^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
    expect(cells).toEqual(['200B', '3.00', '345', '']);

    // A note that exists still prints: 450 billion cells, bands 100B and 200B.
    const big = { ...referenceState(), fermentVolGal: 12 * (450 / 570) };
    expect(sheetData(big).yeast.starter.map((o) => o.note)).toContain('100B starter plus one extra 100B pack');
  });

  it("the sheet's cell counts say their unit once", () => {
    // PL-S7: "Cells (billion)" in the predicted row, "Cells needed (billion)"
    // in the yeast block; Pro says trillion. The screen's labels are unchanged.
    const home = sheetData(referenceState(), 'home');
    const pro = sheetData(referenceState(), 'pro');
    expect(home.headline.find((h) => h.label === 'Cells').unit).toBe('billion');
    expect(pro.headline.find((h) => h.label === 'Cells').unit).toBe('trillion');
    expect(home.yeast.cellsUnit).toBe('billion');
    expect(pro.yeast.cellsUnit).toBe('trillion');

    const homeHtml = sheetHtml(referenceState(), 'home');
    expect(homeHtml).toContain('Cells (billion)');
    expect(homeHtml).toContain('Cells needed (billion)');
    expect(homeHtml).not.toContain('billion cells');
    const proHtml = sheetHtml(referenceState(), 'pro');
    expect(proHtml).toContain('Cells (trillion)');
    expect(proHtml).toContain('Cells needed (trillion)');
    expect(proHtml).not.toContain('trillion cells');

    // The screen's unit (stats bar, Yeast card) is the display file's, untouched.
    expect(cellsUnit('home')).toBe('billion cells');
    expect(cellsUnit('pro')).toBe('trillion cells');
  });

  it('nothing else changes', () => {
    // PL-S8: the reference recipe's sheet, captured from the code before this
    // item, equal after it — every figure, every label — except the three
    // texts the item changes: the predicted row's cells unit, the yeast
    // block's cells unit and the starter's blank note.
    const BEFORE = {"title":"Reference IPA","meta":[{"label":"Style","value":"21A American IPA"},{"label":"Batch volume","value":"12.00 gal"},{"label":"Date","value":"September 23, 2026"}],"headline":[{"label":"OG","value":"1.068","unit":"SG","measuredBox":true},{"label":"FG","value":"1.014","unit":"SG","measuredBox":true},{"label":"ABV","value":"7.5","unit":"%","measuredBox":false},{"label":"SRM","value":"4.1","unit":"","measuredBox":false},{"label":"IBU","value":"46","unit":"","measuredBox":false},{"label":"Cells","value":"570","measuredBox":false}],"grain":{"weightUnit":"lb","rows":[{"name":"Golden Promise","weight":"27.00","share":"93.1","yield":"80.0","color":"2.2"},{"name":"Carafoam","weight":"2.00","share":"6.9","yield":"80.0","color":"2.0"}],"efficiency":"93.0"},"volumes":{"unit":"gal","rows":[{"key":"mashWater","label":"Mash water","value":"13.00","tempNote":null,"measuredBox":true},{"key":"preBoil","label":"Pre-boil volume","value":"16.00","tempNote":null,"measuredBox":true},{"key":"postBoil","label":"Post-boil volume at 60 °F","value":"14.50","tempNote":null,"measuredBox":true},{"key":"ferment","label":"Fermentation volume","value":"12.00","tempNote":null,"measuredBox":true}],"boilTime":"60","boilOff":"1.50","mashRv":"1.79","mashRvUnit":"qt/lb","mashR":"3.68","mashRUnit":"lb/lb"},"hops":{"weightUnit":"oz","tempUnit":"°F","kettle":[{"name":"Bravo","time":"60","temp":"204","weight":"2.00","alpha":"14.7","ibu":"23.5"},{"name":"Helios","time":"30","temp":"204","weight":"1.00","alpha":"19.0","ibu":"11.7"},{"name":"Citra LupoMAX","time":"20","temp":"175","weight":"2.00","alpha":"18.0","ibu":"5.7"},{"name":"Hopstiener 9326","time":"20","temp":"175","weight":"2.00","alpha":"6.0","ibu":"1.9"},{"name":"Helios","time":"20","temp":"175","weight":"1.00","alpha":"19.0","ibu":"3.0"}],"totalIbu":"46","dry":[{"name":"DH1","weight":"2.00"},{"name":"DH2","weight":"2.00"},{"name":"DH3","weight":"2.00"},{"name":"DH4","weight":"2.00"},{"name":"DH5","weight":"1.00"},{"name":"DH6","weight":"1.00"},{"name":"DH7","weight":"2.00"},{"name":"DH8","weight":"2.00"},{"name":"DH9","weight":"1.00"}],"dryRate":"1.25","dryRateUnit":"oz/gal"},"yeast":{"strain":"—","type":"Ale","attenuation":"80.0","fermTemp":"—","tempUnit":"°F","character":"Moderate","pitchRate":"0.75","pitchRateUnit":"billion/L/°P","cells":"570","starterVolumeUnit":"L","starter":[{"band":"200B","volume":"3.00","dme":"345"}]},"water":null,"notes":null};
    const after = JSON.parse(JSON.stringify(sheetData(referenceState())));
    delete after.headline[5].unit;
    delete after.yeast.cellsUnit;
    delete after.yeast.starter[0].note;
    expect(after).toEqual(BEFORE);
  });
});
