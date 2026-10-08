// sparge-in-volumes.test.js
// Scenarios for "Sparge water in the printed sheet's volumes"
// (docs/items/sparge-in-volumes.md, agreed 2026-10-05), named from its
// sentences SV-S1 to SV-S5. The suite has no DOM, so these test the sheet's
// data shaping, the rows and figures the sheet prints; how the row looks is
// the far end, in print preview.
//
// `sparge-in-volumes.before.json` is the sheet's data for these recipes
// captured from the code as it was before the change (2026-10-05), so
// "nothing else changes" compares against bytes the change did not write.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState } from '../src/water-state.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import { sheetWithAimedAcid } from './acid-aim.js';

const TODAY = new Date(2026, 9, 5);
// Since the engine follows Rev 4 (docs/items/engine-corrections.md, EC-Q7),
// the printed sheet's figures it moves are re-pinned in the captured bytes:
// in Pro, OG 10.93 -> 11.04 °P and FG 2.59 -> 2.61 °P; without the water
// argument, OG 1.055 -> 1.056 and ABV 5.7 -> 5.8 %. With the IBU's 7489.1
// (item 3), Magnum's IBU 18.3 -> 18.2 (40.1 -> 40.0 without the water argument).
const BEFORE = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'sparge-in-volumes.before.json'), 'utf8'),
);

// The water item's worked example (docs/items/water-treatment.md): 20 lb of
// grain, 14 gal before the boil, 7 gal of mash water, 8.5 gal of sparge.
const recipeWith = (waterPatch = {}) => {
  const r = defaultRecipeState();
  return {
    ...r,
    malts: [
      { ...r.malts[0], weightLb: 15 },
      { ...r.malts[1], weightLb: 5 },
    ],
    preBoilVolGal: 14,
    mashWaterGal: 7,
    water: {
      ...defaultWaterState(),
      source: { Ca: 0, Mg: 0, Na: 0, SO4: 48.12, Cl: 0, Alkalinity: 0, pH: 7 },
      styleId: 'ipa',
      enabledSalts: ['gypsum'],
      spargeGal: 8.5,
      ...waterPatch,
    },
  };
};
const sheetOf = (recipe, mode = 'home') =>
  recipeSheet({
    recipe,
    derived: computeRecipe(recipe),
    water: computeWater(recipe.water, recipe),
    mode,
    proGravityUnit: 'plato',
    today: TODAY,
  });
const rowKeys = (s) => s.volumes.rows.map((r) => r.key);
const rowOf = (s) => s.volumes.rows.find((r) => r.key === 'spargeWater');

// A sheet without the new volumes row, for comparing against the captured one.
const withoutRow = (s) => {
  const c = JSON.parse(JSON.stringify(s));
  c.volumes.rows = c.volumes.rows.filter((r) => r.key !== 'spargeWater');
  return c;
};

describe('sparge water in the printed sheet\'s volumes', () => {
  // SV-S1
  it('the volumes table has a sparge water row after the mash water', () => {
    for (const method of ['fly', 'batch']) {
      const recipe = recipeWith({ spargeMethod: method });
      const water = computeWater(recipe.water, recipe);

      // Home: the row follows the mash water, and its figure is the Water
      // tab's: 8.5 gal as the sheet prints volumes, 2 decimals.
      const home = sheetOf(recipe);
      expect(rowKeys(home).slice(0, 3)).toEqual(['mashWater', 'spargeWater', 'preBoil']);
      expect(rowOf(home)).toEqual({
        key: 'spargeWater',
        label: 'Sparge water',
        value: '8.50',
        tempNote: null,
        measuredBox: true,
      });
      expect(rowOf(home).value).toBe(water.volumes.spargeGal.toFixed(2));

      // Pro: bbl to 3 decimals. By hand: 8.5 gal / 31 gal per bbl = 0.27419...
      const pro = sheetOf(recipe, 'pro');
      expect(rowKeys(pro).slice(0, 3)).toEqual(['mashWater', 'spargeWater', 'preBoil']);
      expect(rowOf(pro).value).toBe('0.274');
      expect(rowOf(pro).measuredBox).toBe(true);
      expect(pro.volumes.unit).toBe('bbl');
    }
  });

  // SV-S2
  it('with no sparge there is no row', () => {
    // The same recipe has the row with a sparge and loses it with none.
    expect(rowKeys(sheetOf(recipeWith({ spargeMethod: 'fly' })))).toContain('spargeWater');
    const none = sheetOf(recipeWith({ spargeMethod: 'none' }));
    expect(rowKeys(none)).not.toContain('spargeWater');
    expect(rowKeys(none)).toEqual(['mashWater', 'preBoil', 'postBoil', 'ferment']);

    // A sheet given no water has no sparge to show either.
    const r = defaultRecipeState();
    const bare = recipeSheet({ recipe: r, derived: computeRecipe(r), mode: 'home', proGravityUnit: 'plato', today: TODAY });
    expect(rowKeys(bare)).not.toContain('spargeWater');
  });

  // SV-S3
  it('a blank sparge amount prints a dash', () => {
    const s = sheetOf(recipeWith({ spargeMethod: 'batch', spargeGal: NaN }));
    expect(rowKeys(s).slice(0, 3)).toEqual(['mashWater', 'spargeWater', 'preBoil']);
    expect(rowOf(s)).toMatchObject({ label: 'Sparge water', value: '—', measuredBox: true });
  });

  // SV-S4
  it('the Water Treatment line no longer lists the sparge water', () => {
    const fly = sheetOf(recipeWith({ spargeMethod: 'fly' }));
    expect(fly.water.volumes.map((v) => [v.label, v.value])).toEqual([
      ['Mash water', '7.00'],
      ['Water absorbed by the grain', '0.50'],
      ['Water left in the mash tun', '1.00'],
      ['Total water', '15.50'],
    ]);

    // With the hot-liquor tank, only the sparge water goes; the tank's own
    // volumes stay.
    const tank = sheetOf(recipeWith({ treatment: 'tank', tankTreatedGal: 12, tankTopUpGal: 12 }));
    expect(tank.water.volumes.map((v) => v.label)).toEqual([
      'Mash water',
      'Water absorbed by the grain',
      'Water left in the mash tun',
      'Total water',
      'HLT first fill, treated',
      'HLT topped up to',
      'Treated share of the sparge liquor',
      'Left in the HLT, not used',
    ]);
    expect(rowOf(tank).value).toBe('8.50');
  });

  // SV-S5
  it('nothing else changes', () => {
    // Fly and no sparge, Home and Pro: the sheet is the one captured before,
    // but for the new row and the sparge water's entry in the water line
    // (SV-S4), which goes from the captured one.
    for (const method of ['fly', 'none']) {
      for (const mode of ['home', 'pro']) {
        const after = sheetOf(recipeWith({ spargeMethod: method }), mode);
        const before = JSON.parse(JSON.stringify(BEFORE[`${method}-${mode}`]));
        before.water.volumes = before.water.volumes.filter((v) => !v.label.startsWith('Sparge water'));
        // Since the acid aimed at a mash pH: the acid's figures and the target (AA-S1, AA-S5).
        expect(withoutRow(after)).toEqual(sheetWithAimedAcid(before, withoutRow(after)));
      }
    }

    // Given no water, the sheet is exactly what it was.
    const r = defaultRecipeState();
    const bare = recipeSheet({ recipe: r, derived: computeRecipe(r), mode: 'home', proGravityUnit: 'plato', today: TODAY });
    expect(bare).toEqual(BEFORE['no-water-arg']);
  });
});
