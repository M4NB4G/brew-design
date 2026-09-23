// print-sheet.test.js
// Scenarios for the Printed recipe sheet item (scope table agreed 2026-09-22,
// docs/items/recipe-print-sheet.md), named from its sentences S3, S4, S7 and
// S11. The suite has no DOM, so these test the sheet's data shaping — the text
// the sheet prints — not its appearance; the print-only behaviour, page size
// and layout (S1, S2, S5, S6, S8, S9) are the far end, in print preview.

import { describe, it, expect } from 'vitest';
import { computeRecipe } from '../src/selectors.js';
import {
  resolveGravityUnit,
  gravityFromCanonical,
  cellsFromCanonical,
  fractionToPercent,
  volumeFromCanonical,
  hopWeightFromCanonical,
  dryHopRateFromCanonical,
} from '../src/display.js';
import { num, gravity } from '../src/format.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';

// The smoke test's reference recipe (test/smoke.test.js), in canonical units.
// Its derived numbers are pinned there against the spreadsheet: OG 1.0681297,
// FG 1.0136259, ABV 0.0748883, SRM 4.1236703, mash Rv 1.7931034, IBU 46,
// post-boil 14.5 gal.
const referenceState = () => ({
  name: 'Reference IPA',
  style: '21A American IPA',
  notes: '',
  malts: [
    { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
    { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
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
  yeast: { type: 'ale', density: 'mod' },
  measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
});

const TODAY = new Date(2026, 8, 23); // 23 September 2026, local time

function sheetFor(recipe, mode = 'home', proGravityUnit = 'plato', derived = computeRecipe(recipe)) {
  return recipeSheet({ recipe, derived, mode, proGravityUnit, today: TODAY });
}

const headline = (sheet, label) => sheet.headline.find((h) => h.label === label);
const volume = (sheet, key) => sheet.volumes.rows.find((r) => r.key === key);

describe('printed recipe sheet', () => {
  // S3 (and S10: making the sheet changes neither input)
  it('the sheet renders every recipe value from the derived values it is given, computing nothing', () => {
    const recipe = referenceState();
    const d = computeRecipe(recipe);
    const recipeBefore = JSON.stringify(recipe);
    const derivedBefore = JSON.stringify(d);
    const s = sheetFor(recipe, 'home', 'plato', d);
    expect(JSON.stringify(recipe)).toBe(recipeBefore);
    expect(JSON.stringify(d)).toBe(derivedBefore);

    // The six headline numbers: the derived values through the display boundary.
    const gu = resolveGravityUnit('home', 'plato');
    expect(s.headline.map((h) => h.label)).toEqual(['OG', 'FG', 'ABV', 'SRM', 'IBU', 'Cells']);
    expect(headline(s, 'OG').value).toBe(gravity(gravityFromCanonical(d.grist.OG, gu), gu));
    expect(headline(s, 'FG').value).toBe(gravity(gravityFromCanonical(d.grist.FG, gu), gu));
    expect(headline(s, 'ABV').value).toBe(num(fractionToPercent(d.grist.ABV), 1));
    expect(headline(s, 'SRM').value).toBe(num(d.grist.SRM, 1));
    expect(headline(s, 'IBU').value).toBe(num(d.hops.totalIBU, 0));
    expect(headline(s, 'Cells').value).toBe(num(cellsFromCanonical(d.cells, 'home'), 0));
    // The same values as the smoke test pins them, at print precision:
    // OG 1.0681297 -> "1.068"; FG 1.0136259 -> "1.014"; ABV 0.0748883 x 100 =
    // 7.48883 -> "7.5"; SRM 4.1236703 -> "4.1"; IBU 46 -> "46".
    expect(s.headline.slice(0, 5).map((h) => h.value)).toEqual(['1.068', '1.014', '7.5', '4.1', '46']);
    // Measured-value boxes sit beside OG and FG only (S6).
    expect(s.headline.filter((h) => h.measuredBox).map((h) => h.label)).toEqual(['OG', 'FG']);

    // Grain bill: each malt's share is the engine's, not the sheet's.
    // Hand check: 27 / 29 = 0.931034... -> 93.1 %; 2 / 29 = 0.068965... -> 6.9 %.
    expect(s.grain.rows.map((r) => r.share)).toEqual(['93.1', '6.9']);
    s.grain.rows.forEach((r, i) => {
      expect(r.name).toBe(recipe.malts[i].name);
      expect(r.weight).toBe(num(recipe.malts[i].weightLb, 2));
      expect(r.share).toBe(num(fractionToPercent(d.grist.perMalt[i].perMaltWeightFraction), 1));
      expect(r.yield).toBe(num(fractionToPercent(recipe.malts[i].fgdb), 1));
      expect(r.color).toBe(num(recipe.malts[i].colorL, 1));
    });

    // Volumes and the mash ratio.
    expect(volume(s, 'postBoil').value).toBe(num(volumeFromCanonical(d.postBoilVolGal, 'home'), 2));
    expect(volume(s, 'postBoil').value).toBe('14.50');
    expect(s.volumes.mashRv).toBe(num(d.grist.mashRv, 2));
    expect(s.volumes.mashRv).toBe('1.79'); // 13 gal x 4 qt/gal / 29 lb = 1.7931 qt/lb
    expect(s.volumes.mashR).toBe(num(d.grist.mashR, 2));

    // Kettle hops: each addition's bitterness is the engine's, and the total is
    // the engine's rounded total, not a sum made here.
    s.hops.kettle.forEach((row, i) => {
      expect(row.name).toBe(recipe.kettleAdditions[i].name);
      expect(row.ibu).toBe(num(d.hops.additions[i].ibu, 1));
    });
    expect(s.hops.totalIbu).toBe('46');
    expect(s.hops.dryRate).toBe(num(dryHopRateFromCanonical(d.hops.dryHopRatio, 'home'), 2));
    expect(s.hops.dryRate).toBe('1.25'); // 15 oz / 12 gal = 1.25 oz/gal

    // Yeast and the starter recommendation.
    expect(s.yeast.pitchRate).toBe(num(d.pitchRate, 2));
    expect(s.yeast.cells).toBe(num(cellsFromCanonical(d.cells, 'home'), 0));
    expect(s.yeast.starter).toHaveLength(d.starter.length);
    s.yeast.starter.forEach((row, i) => {
      expect(row.band).toBe(d.starter[i].band);
      expect(row.volume).toBe(num(d.starter[i].volumeL, 2));
      expect(row.dme).toBe(num(d.starter[i].dmeGrams, 0));
    });

    // Given different derived values for the same recipe, the sheet prints
    // those: it reads what it is given and recomputes nothing.
    const other = structuredClone(d);
    other.grist.OG = 1.111;
    other.grist.FG = 1.022;
    other.grist.ABV = 0.0333;
    other.grist.SRM = 12.34;
    other.grist.mashRv = 2.5;
    other.grist.perMalt[0].perMaltWeightFraction = 0.25;
    other.hops.additions[0].ibu = 12.34;
    other.hops.totalIBU = 99;
    other.hops.dryHopRatio = 0.5;
    other.postBoilVolGal = 9.99;
    other.pitchRate = 0.33;
    other.cells = 777;
    other.starter = [];
    const t = sheetFor(recipe, 'home', 'plato', other);
    expect(t.headline.map((h) => h.value)).toEqual(['1.111', '1.022', '3.3', '12.3', '99', '777']);
    expect(t.grain.rows[0].share).toBe('25.0');
    expect(t.volumes.mashRv).toBe('2.50');
    expect(t.hops.kettle[0].ibu).toBe('12.3');
    expect(t.hops.totalIbu).toBe('99');
    expect(t.hops.dryRate).toBe('0.50');
    expect(volume(t, 'postBoil').value).toBe('9.99');
    expect(t.yeast.pitchRate).toBe('0.33');
    expect(t.yeast.starter).toEqual([]);

    // A blank input prints a dash, never "NaN".
    const blank = structuredClone(d);
    blank.grist.OG = NaN;
    blank.hops.totalIBU = NaN;
    blank.hops.additions[0].ibu = NaN;
    const b = sheetFor(recipe, 'home', 'plato', blank);
    expect(headline(b, 'OG').value).toBe('—');
    expect(headline(b, 'IBU').value).toBe('—');
    expect(b.hops.totalIbu).toBe('—');
    expect(b.hops.kettle[0].ibu).toBe('—');
  });

  // S7, first half
  it('an empty notes box produces no notes section', () => {
    const recipe = referenceState();
    expect(sheetFor({ ...recipe, notes: '' }).notes).toBeNull();
    expect(sheetFor({ ...recipe, notes: '  \n\t ' }).notes).toBeNull();
    const notes = 'Mash 152 °F for 60 min.\nWhirlpool 20 min.';
    expect(sheetFor({ ...recipe, notes }).notes).toBe(notes);
  });

  // S7, second half
  it('a recipe with no name prints no title, never an invented one', () => {
    const recipe = referenceState();
    const unnamed = sheetFor({ ...recipe, name: '' });
    expect(unnamed.title).toBeNull();
    expect(sheetFor({ ...recipe, name: '   ' }).title).toBeNull();
    // Nothing else on the line stands in for a name: style, batch volume, date.
    expect(unnamed.meta.map((m) => m.label)).toEqual(['Style', 'Batch volume', 'Date']);
    expect(sheetFor(recipe).title).toBe('Reference IPA');
    // No style prints no style, likewise.
    expect(sheetFor({ ...recipe, style: '' }).meta.map((m) => m.label)).toEqual(['Batch volume', 'Date']);
    expect(unnamed.meta.find((m) => m.label === 'Date').value).toBe('September 23, 2026');
  });

  // S11
  it('a volume measured at the reference temperature prints no temperature note; one measured elsewhere does', () => {
    const recipe = referenceState();
    const atRef = sheetFor(recipe);
    expect(atRef.volumes.rows.map((r) => r.key)).toEqual(['mashWater', 'preBoil', 'postBoil', 'ferment']);
    atRef.volumes.rows.forEach((r) => expect(r.tempNote).toBeNull());
    // Every volume carries a measured-value box (S6).
    atRef.volumes.rows.forEach((r) => expect(r.measuredBox).toBe(true));

    const hotPreBoil = sheetFor({ ...recipe, measurementTempF: { preBoil: 180, postBoil: 60, ferment: 60 } });
    expect(volume(hotPreBoil, 'preBoil').tempNote).toBe('measured at 180 °F');
    expect(volume(hotPreBoil, 'postBoil').tempNote).toBeNull();
    expect(volume(hotPreBoil, 'ferment').tempNote).toBeNull();
    expect(volume(hotPreBoil, 'mashWater').tempNote).toBeNull();

    const others = sheetFor({ ...recipe, measurementTempF: { preBoil: 60, postBoil: 200, ferment: 68.5 } });
    expect(volume(others, 'preBoil').tempNote).toBeNull();
    expect(volume(others, 'postBoil').tempNote).toBe('measured at 200 °F');
    expect(volume(others, 'ferment').tempNote).toBe('measured at 68.5 °F');

    // A cleared temperature is not the reference either: it prints, as a dash.
    const cleared = sheetFor({ ...recipe, measurementTempF: { preBoil: 60, postBoil: 60, ferment: NaN } });
    expect(volume(cleared, 'ferment').tempNote).toBe('measured at — °F');
  });

  // S4
  it("the sheet's numbers follow the display mode: Home and Pro produce different volume and hop-weight text for the same recipe", () => {
    const recipe = referenceState();
    const d = computeRecipe(recipe);
    const home = sheetFor(recipe, 'home', 'plato', d);
    const pro = sheetFor(recipe, 'pro', 'plato', d);
    const proSg = sheetFor(recipe, 'pro', 'sg', d);

    // Volumes: gallons at home, barrels in Pro. 16 gal / 31 gal per bbl = 0.516 bbl.
    expect(home.volumes.unit).toBe('gal');
    expect(pro.volumes.unit).toBe('bbl');
    expect(volume(home, 'preBoil').value).toBe('16.00');
    expect(volume(pro, 'preBoil').value).toBe(num(volumeFromCanonical(16, 'pro'), 3));
    expect(volume(pro, 'preBoil').value).toBe('0.516');
    expect(home.meta.find((m) => m.label === 'Batch volume').value).toBe('12.00 gal');
    expect(pro.meta.find((m) => m.label === 'Batch volume').value).toBe('0.387 bbl'); // 12 / 31

    // Hop weights: ounces at home, pounds in Pro. 2 oz / 16 oz per lb = 0.125 lb.
    expect(home.hops.weightUnit).toBe('oz');
    expect(pro.hops.weightUnit).toBe('lb');
    expect(home.hops.kettle[0].weight).toBe('2.00');
    expect(pro.hops.kettle[0].weight).toBe(num(hopWeightFromCanonical(2, 'pro'), 3));
    expect(pro.hops.kettle[0].weight).toBe('0.125');
    expect(pro.hops.dry[0].weight).toBe('0.125');
    // Dry-hop rate: 1.25 oz/gal x 31 gal/bbl / 16 oz/lb = 2.421875 lb/bbl.
    expect(home.hops.dryRateUnit).toBe('oz/gal');
    expect(pro.hops.dryRateUnit).toBe('lb/bbl');
    expect(pro.hops.dryRate).toBe('2.42');

    // Cells: billion at home, trillion in Pro.
    expect(headline(home, 'Cells').unit).toBe('billion cells');
    expect(headline(pro, 'Cells').unit).toBe('trillion cells');

    // Gravity follows the Pro gravity setting: SG at home, °P or SG in Pro.
    expect(headline(home, 'OG').unit).toBe('SG');
    expect(headline(pro, 'OG').unit).toBe('°P');
    expect(headline(pro, 'OG').value).toBe(num(gravityFromCanonical(d.grist.OG, 'plato'), 2));
    expect(headline(proSg, 'OG').unit).toBe('SG');
    expect(headline(proSg, 'OG').value).toBe('1.068');
  });
});
