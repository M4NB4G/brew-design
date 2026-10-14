// fermenter-sulfate-chloride.test.js
// Scenarios for batch S17 item 1, "The fermenter's sulfate and chloride with
// water back on" (docs/items/fermenter-sulfate-chloride.md, FM-S1 to FM-S10):
// with water back on, the Salts & Acid screen and the printed sheet show the
// fermenter's sulfate, chloride and SO4:Cl ratio from the water and salts
// only, beside the style's targets, and the grams of gypsum and calcium
// chloride to add to the water back when below them.
//
// Worked by hand. The built-in recipe (mash water 5 gal, pre-boil 7 gal,
// boiled 1 h at 1.5 gal/h to 5.5 gal, wort from kettle 5.5 gal, efficiency
// 75 %, every volume at 60 degF) with a water report (sulfate 30, chloride 20
// mg/L), the style IPA (sulfate 225, chloride 75, ratio 3.00), only gypsum
// and calcium chloride on hand, the brewer's own gypsum 10 g and calcium
// chloride 5 g, a 4 gal batch sparge, 1 gal of water back, kettle salts off.
//
// HLT treated, 10 gal, topped up to 10:
//   the mash draws 5/10; 5/10 stays; the sparge carries 5/10 x 4/10 = 0.2,
//   the water back 5/10 x 1/10 = 0.05 of each salt.
//   Kettle shares (batch sparge): mash min(0.75, 7/5) = 0.75; sparge
//   (7 - 0.75 x 5) / 4 = 0.8125.
//   Gypsum to the kettle 10 x 0.5 x 0.75 + 10 x 0.2 x 0.8125 = 3.75 + 1.625 = 5.375 g;
//   calcium chloride 5 x 0.5 x 0.75 + 5 x 0.2 x 0.8125 = 1.875 + 0.8125 = 2.6875 g.
//   Kettle water before the boil: sulfate 30 + 147.4 x 5.375 / 7, chloride
//   20 + 127.4 x 2.6875 / 7; times 7 gal: 210 + 792.275 = 1002.275 and
//   140 + 342.3875 = 482.3875 (mg/L x gal).
//   Boiled to 5.5 gal, all 5.5 to the fermenter: the same mass.
//   The water back carries gypsum 0.5 g and calcium chloride 0.25 g in 1 gal:
//   sulfate 30 + 73.7 = 103.7, chloride 20 + 31.85 = 51.85.
//   Fermenter, 6.5 gal: sulfate (1002.275 + 103.7) / 6.5 = 1105.975 / 6.5 = 170.15 -> 170
//                       chloride (482.3875 + 51.85) / 6.5 = 534.2375 / 6.5 = 82.19 -> 82
//                       ratio 1105.975 / 534.2375 = 2.0702 -> 2.07
//   Below IPA's 225 sulfate: gypsum (225 x 6.5 - 1105.975) / 147.4 = 356.525 / 147.4
//   = 2.4188 g -> 2.4 g; chloride 82 is above 75: nothing.
//   Hazy IPA (sulfate 100, chloride 200): calcium chloride
//   (200 x 6.5 - 534.2375) / 127.4 = 765.7625 / 127.4 = 6.0107 g -> 6.0 g; no gypsum.
//
// Mash water treated: all of both salts in the 5 gal mash water, the sparge
// untreated. To the kettle: gypsum 10 x 0.75 = 7.5 g, calcium chloride 3.75 g;
// times 7 gal: sulfate 210 + 147.4 x 7.5 = 1315.5, chloride 140 + 127.4 x 3.75
// = 617.75. The water back is source water: 30 and 20.
//   Fermenter: sulfate (1315.5 + 30) / 6.5 = 207.0; chloride (617.75 + 20) / 6.5
//   = 98.12 -> 98; ratio 1345.5 / 637.75 = 2.1098 -> 2.11.
//
// Gypsum not on hand (and none added): sulfate is the source water's, (30 x 7
// + 30) / 6.5 = 36.92 -> 37, below 225: the tab names gypsum, and no grams.

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REFERENCE_TEMP_F } from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import RecipeSheet from '../src/components/RecipeSheet.jsx';
import WaterTab from '../src/components/water/WaterTab.jsx';

const TODAY = new Date(2026, 9, 14);
const ON = { on: true, volumeGal: 1, tempF: REFERENCE_TEMP_F };

const recipe = ({ waterBack = ON, water = {}, ...rest } = {}) => {
  const r = defaultRecipeState();
  return {
    ...r,
    ...rest,
    waterBack,
    water: {
      ...r.water,
      source: { Ca: 20, Mg: 5, Na: 10, SO4: 30, Cl: 20, Alkalinity: 80, pH: 7.5 },
      styleId: 'ipa',
      enabledSalts: ['gypsum', 'calcium_chloride'],
      treatment: 'tank',
      acidPlace: 'salts',
      vessels: 3,
      spargeMethod: 'batch',
      spargeGal: 4,
      tankTreatedGal: 10,
      tankTopUpGal: 10,
      saltOverrides: { gypsum: 10, calcium_chloride: 5 },
      ...water,
    },
  };
};

const flat = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');
const salts = (r, mode = 'home') =>
  flat(
    renderToStaticMarkup(
      createElement(WaterTab, { water: r.water, figures: computeWater(r.water, r), mode, screen: 'salts', onScreen: () => {}, setWater: () => {} }),
    ),
  );
const sheet = (r) => recipeSheet({ recipe: r, derived: computeRecipe(r), water: computeWater(r.water, r), mode: 'home', proGravityUnit: 'plato', today: TODAY });
const printed = (r) =>
  flat(renderToStaticMarkup(createElement(RecipeSheet, { recipe: r, derived: computeRecipe(r), water: computeWater(r.water, r), mode: 'home', proGravityUnit: 'plato' })));
const row = (s, label) => s.water.fermenter.rows.find((x) => x.label === label);
const LABEL = 'Water and salts only; the style targets do not count the malt either.';

describe("the fermenter's sulfate and chloride with water back on (S17 item 1)", () => {
  it('FM-S1, FM-S2, FM-S5 to FM-S7: the Salts & Acid screen and the sheet show the three figures, their targets and the grams', () => {
    const r = recipe();
    const f = computeWater(r.water, r).fermenter;
    expect(f.SO4).toBeCloseTo(1105.975 / 6.5, 9);
    expect(f.Cl).toBeCloseTo(534.2375 / 6.5, 9);
    expect(f.ratio).toBeCloseTo(1105.975 / 534.2375, 9);
    expect(f.match).toEqual({ SO4: 'off', Cl: 'near', ratio: 'off' });
    expect(f.add).toEqual([{ key: 'gypsum', name: 'Gypsum (CaSO₄·2H₂O)', grams: expect.closeTo(356.525 / 147.4, 9) }]);
    expect(f.notOnHand).toEqual([]);

    const t = salts(r);
    const card = t.slice(t.indexOf('Fermenter, with the water back'));
    expect(card).toContain(LABEL);
    expect(card).toMatch(/170 Sulfate tgt 225 82 Chloride tgt 75 2\.07 SO₄:Cl Ratio tgt 3\.00/);
    expect(card).toContain('Add to the water back: Gypsum (CaSO₄·2H₂O) 2.4 g');
    expect(card).not.toContain('Calcium Chloride (CaCl₂·2H₂O) 0');
    // In Pro, whole grams (FM-S7 keeps the salts' screen precision).
    expect(salts(r, 'pro')).toContain('Add to the water back: Gypsum (CaSO₄·2H₂O) 2 g');

    const s = sheet(r);
    expect(s.water.fermenter.note).toContain(LABEL);
    expect(row(s, 'Sulfate')).toEqual({ label: 'Sulfate', predicted: '170', target: '225' });
    expect(row(s, 'Chloride')).toEqual({ label: 'Chloride', predicted: '82', target: '75' });
    expect(row(s, 'SO₄:Cl ratio')).toEqual({ label: 'SO₄:Cl ratio', predicted: '2.07', target: '3.00' });
    expect(s.water.additions).toContainEqual({ place: 'Water back', name: 'Gypsum (CaSO₄·2H₂O)', amount: '2.4', unit: 'g' });
    const p = printed(r);
    expect(p).toContain('Fermenter, with the water back');
    expect(p).toMatch(/Water back Gypsum \(CaSO₄·2H₂O\) 2\.4 g/);

    // Chloride short instead (Hazy IPA): calcium chloride, no gypsum.
    const hazy = recipe({ water: { styleId: 'hazy_ipa' } });
    const fh = computeWater(hazy.water, hazy).fermenter;
    expect(fh.add).toEqual([
      { key: 'calcium_chloride', name: 'Calcium Chloride (CaCl₂·2H₂O)', grams: expect.closeTo(765.7625 / 127.4, 9) },
    ]);
    expect(salts(hazy)).toContain('Add to the water back: Calcium Chloride (CaCl₂·2H₂O) 6.0 g');
    expect(salts(hazy)).not.toContain('Add to the water back: Gypsum');
  });

  it('K: the figures read the same draws, kettle sums and corrected volumes as the Water tab and the stats bar', () => {
    // Measured hot: the wort from kettle at 68 degF and the water back at 170 degF.
    const r = recipe({
      waterBack: { on: true, volumeGal: 1, tempF: 170 },
      measurementTempF: { ...defaultRecipeState().measurementTempF, ferment: 68 },
    });
    const w = computeWater(r.water, r);
    expect(w.fermenter.pitchGal).toBeCloseTo(computeRecipe(r).pitchGal, 12);
    // The water back's share of the tank's salts is what it carries.
    expect(w.waterBack.salts.gypsum).toBeCloseTo(0.5, 12);
    // Kettle salts on: the fermenter is the kettle water readout's, boiled,
    // then mixed with the water back's own (103.7 sulfate, 51.85 chloride,
    // over the water back at 60 degF).
    const on = recipe({ water: { kettleSalts: true } });
    const wo = computeWater(on.water, on);
    const k = wo.kettle.profile.ions;
    expect(wo.fermenter.SO4).toBeCloseTo((k.SO4 * 7 + 103.7) / 6.5, 9);
    expect(wo.fermenter.Cl).toBeCloseTo((k.Cl * 7 + 51.85) / 6.5, 9);
  });

  it('FM-S3: the water back from the HLT carries its salts; from the mash water treated, none', () => {
    const m = recipe({ water: { treatment: 'mash' } });
    const f = computeWater(m.water, m).fermenter;
    expect(f.SO4).toBeCloseTo(1345.5 / 6.5, 9); // 207.0
    expect(f.Cl).toBeCloseTo(637.75 / 6.5, 9); // 98.12
    expect(f.ratio).toBeCloseTo(1345.5 / 637.75, 9);
    expect(salts(m)).toMatch(/207 Sulfate tgt 225 98 Chloride tgt 75 2\.11 SO₄:Cl Ratio tgt 3\.00/);
  });

  it('FM-S4: with kettle salts off the figures still show; no other kettle or beer mineral figure', () => {
    const r = recipe();
    const w = computeWater(r.water, r);
    expect(w.setup.kettleSalts).toBe(false);
    expect(w.kettle).toBeNull();
    expect(Object.keys(w.fermenter).filter((k) => ['Ca', 'Mg', 'Na', 'Alk'].includes(k))).toEqual([]);
    const t = salts(r);
    expect(t).toContain('Fermenter, with the water back');
    expect(t).not.toContain('Kettle Water');
  });

  it('FM-S5: a salt not on hand is named, with no grams', () => {
    const r = recipe({ water: { enabledSalts: ['calcium_chloride'], saltOverrides: { calcium_chloride: 5 } } });
    const f = computeWater(r.water, r).fermenter;
    expect(f.SO4).toBeCloseTo(240 / 6.5, 9); // 36.92
    expect(f.add).toEqual([]);
    expect(f.notOnHand).toEqual([{ key: 'gypsum', name: 'Gypsum (CaSO₄·2H₂O)', ion: 'Sulfate' }]);
    const t = salts(r);
    expect(t).toContain('Sulfate is below the target and needs Gypsum (CaSO₄·2H₂O), which is not on hand.');
    expect(t).not.toContain('Add to the water back');
    expect(sheet(r).water.additions.filter((a) => a.place === 'Water back')).toEqual([]);
  });

  it('FM-S8: a blank figure the sums need blanks them, and the tab names it', () => {
    for (const [change, label] of [
      [{ efficiency: NaN }, 'Brewhouse efficiency'],
      [{ boilTimeMin: NaN }, 'Boil time'],
      [{ boilOffRateGalPerHr: NaN }, 'Boil-off rate'],
      [{ fermentVolGal: NaN }, 'Wort from kettle'],
      [{ waterBack: { ...ON, volumeGal: NaN } }, 'Water back'],
    ]) {
      const r = recipe({ ...change, water: { treatment: 'mash' } });
      const f = computeWater(r.water, r).fermenter;
      expect(f.SO4, label).toBeNaN();
      expect(f.Cl, label).toBeNaN();
      expect(f.add, label).toEqual([]);
      const t = salts(r);
      expect(t, label).toMatch(new RegExp(`Blank figures the water sums need: [^.]*${label}`));
      expect(t.slice(t.indexOf('Fermenter, with the water back')), label).toMatch(/— Sulfate tgt 225 — Chloride tgt 75 — SO₄:Cl Ratio/);
      expect(row(sheet(r), 'Sulfate').predicted, label).toBe('—');
    }
    // A blank test result blanks them too (named by the tab's own line).
    const noReport = recipe({ water: { source: { Ca: 20, Mg: 5, Na: 10, SO4: NaN, Cl: 20, Alkalinity: 80, pH: 7.5 } } });
    expect(computeWater(noReport.water, noReport).fermenter.SO4).toBeNaN();
  });

  it('FM-S9, FM-S10: with water back off none of this shows, and every figure is as today', () => {
    const off = recipe({ waterBack: { on: false, volumeGal: 1, tempF: REFERENCE_TEMP_F }, efficiency: NaN });
    const w = computeWater(off.water, off);
    expect(w.fermenter).toBeNull();
    expect(w.blank).toEqual([]);
    const t = salts(off);
    expect(t).not.toContain('Fermenter');
    expect(t).not.toContain('Add to the water back');
    const s = sheet(off);
    expect(s.water.fermenter).toBeUndefined();
    expect(s.water.additions.filter((a) => a.place === 'Water back')).toEqual([]);
    expect(printed(off)).not.toContain('Fermenter');
    // On, the note no longer says no mineral figure for the beer is worked out.
    expect(salts(recipe())).not.toContain('no mineral figure for the beer is worked out');
  });
});
