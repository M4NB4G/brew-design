// @vitest-environment jsdom
// water-back.test.js
// Scenarios for batch S15b, "Water back" (docs/items/water-back.md, WB-S1 to
// WB-S10): an option, off unless turned on, for adding hot-liquor-tank water
// to the fermenter after knock-out. The fermentation volume stays the volume
// at knock-out; the volume at pitch is the knock-out volume plus the water
// back, each at 60 °F, and the figures that depend on what is in the
// fermenter read it.
//
// Water back is not in Rev 4: every figure here is worked by hand, from the
// built-in recipe (10 lb Pale 2-Row and 1 lb Munich, FGDB 0.8, 2 and 9 °L;
// efficiency 0.75; pre-boil 7 gal, boil-off 1.5 gal/hr for 60 min, so 5.5 gal
// after the boil; fermentation 5.5 gal; Magnum 1 oz 12 % at 60 min and Cascade
// 1 oz 6 % at 10 min, both at 212 °F; Citra 2 oz dry; ale, moderate;
// attenuation 0.77; every volume measured at 60 °F) with 1 gal of water back
// at 60 °F, so 6.5 gal at pitch.
//
// Knock-out (the engine's formulas, worked by hand):
//   pre-boil SG = 1 + 46 x 0.8 x 0.75 x 11 lb / 7 gal / 1000 = 1.04337142857
//   pre-boil °P = -616.868 + 1111.14 SG - 630.272 SG^2 + 135.997 SG^3 = 10.80525441
//   knock-out °P = 10.80525441 x 7 / 5.5 = 13.75214198
//   knock-out OG = 1 + 13.75214198 / (258.6 - (13.75214198 / 258.2) x 227.1) = 1.05578865
//   colour units = (2 x 10 + 9 x 1) / 5.5 = 5.27272727; SRM = 1.4922 x 5.27272727^0.6859 = 4.6673574
//   IBU: temperature factor at 212 °F = 0.0003858 x 212^2 - 0.12885802 x 212 + 10.97839506 = 0.99989002
//     utilization = 1.65 x 0.000125^0.04337142857 x (1 - e^(-0.04 t)) / 4.15
//       = 0.24482281 at 60 min, 0.08876583 at 10 min
//     Magnum 1 x 0.12 x 0.24482281 x 0.99989002 x 7489.1 / 5.5 = 39.99929115
//     Cascade 1 x 0.06 x 0.08876583 x 0.99989002 x 7489.1 / 5.5 = 7.25130586
//     sum 47.25059701 -> 47
// At pitch, 6.5 gal (the sugar kept: °P x SG x volume, as the engine test
// works it; with k = 227.1 / 258.2 the °P at pitch is the positive root of
// (1 - k) P^2 + (258.6 + kK) P - 258.6 K = 0):
//   K = 13.75214198 x 1.05578865 x 5.5 / 6.5 = 12.28560844
//   °P at pitch = 11.73130462; OG = 1.04724997
//   FG = 1.04724997 - 0.77 x 0.04724997 = 1.01086749
//   ABV = 76.08 x (1.04724997 - 1.01086749) / (1.775 - 1.04724997) x (1.01086749 / 0.794) / 100 = 0.04842329
//   colour units = 29 / 6.5 = 4.46153846; SRM = 1.4922 x 4.46153846^0.6859 = 4.1620621
//   IBU = 47.25059701 x 5.5 / 6.5 = 39.98127439 -> 40
//   cells = 0.75 x 11.73130462 x 3.785411784 x 6.5 = 216.488 -> 220 (at knock-out
//     0.75 x 13.75214198 x 3.785411784 x 5.5 = 214.737 -> 210)
//   dry-hop rate = 2 oz / 6.5 gal = 0.30769231 oz/gal (at knock-out 2 / 5.5 = 0.36363636)
//   cost per gal, malts at $1.50 and $2.00 per lb: (15 + 2) / 6.5 = $2.6153846
// Water back measured at 170 °F (76.667 °C), by the engine's density table:
//   at 76.667 °C: 974.84 + (1.6667 / 5) x (971.79 - 974.84) = 973.82333
//   at 60 °F (15.556 °C): 999.10 + (0.5556 / 5) x (998.21 - 999.10) = 999.00111
//   1 gal x 973.82333 / 999.00111 = 0.97479705 gal; at pitch 5.5 + 0.97479705 = 6.47479705 gal

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REFERENCE_TEMP_F } from '@brew/engine';
import { defaultRecipeState, DEFAULT_DISPLAY, breweryFiguresFromRecipe, newRecipe, switchMode } from '../src/state.js';
import { computeRecipe, computeWater, computeCost } from '../src/selectors.js';
import {
  SCHEMA_VERSION,
  STORAGE_KEY,
  savePersisted,
  loadPersisted,
  exportRecipeDocument,
  importRecipeFile,
} from '../src/persistence.js';
import { emptyFields } from '../src/empty-fields.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import RecipeSheet from '../src/components/RecipeSheet.jsx';
import WaterTab from '../src/components/water/WaterTab.jsx';
import { mount, unmount, page, text, click, button } from './page-error.fixture.js';

const TODAY = new Date(2026, 9, 12);

const withWaterBack = (over = {}, r = defaultRecipeState()) => ({
  ...r,
  waterBack: { on: true, volumeGal: 1, tempF: REFERENCE_TEMP_F, ...over },
});

// A water report and a sparge, so the Water tab has figures and the HLT draws.
const withWater = (r) => ({
  ...r,
  water: {
    ...r.water,
    source: { Ca: 20, Mg: 5, Na: 10, SO4: 30, Cl: 20, Alkalinity: 80, pH: 7.5 },
    treatment: 'tank',
    vessels: 3,
    spargeMethod: 'batch',
    spargeGal: 4,
    tankTreatedGal: 10,
    tankTopUpGal: 10,
  },
});

function fakeStorage() {
  const m = new Map();
  return {
    _map: m,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

const flat = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

// In the app drawn whole (jsdom).
const box = (name) => [...page().querySelectorAll('input')].find((el) => el.getAttribute('aria-label') === name);
const check = (name) =>
  [...page().querySelectorAll('label')].find((l) => text(l) === name)?.querySelector('input[type=checkbox]');
const statsBar = () => text(page().querySelector('[aria-label="Recipe figures"]'));
function type(name, value) {
  const el = box(name);
  act(() => el.focus());
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => el.blur());
}
const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe;
const stored = (recipe, display = DEFAULT_DISPLAY) => ({ [STORAGE_KEY]: exportRecipeDocument({ recipe, ...display }) });

afterEach(() => unmount());

describe('water back (S15b)', () => {
  it('WB-S1: the Volumes card has a "Water back" check, off by default; on, a volume box and its measurement temperature', () => {
    mount();
    const wb = check('Water back');
    expect(wb, 'the check').toBeTruthy();
    expect(wb.checked).toBe(false);
    expect(box('Water back (gal)')).toBeUndefined();
    expect(defaultRecipeState().waterBack).toEqual({ on: false, volumeGal: NaN, tempF: REFERENCE_TEMP_F });

    click(wb);
    expect(check('Water back').checked).toBe(true);
    expect(box('Water back (gal)').value).toBe('');
    // Its temperature beside it, the reference by default, in the header's unit.
    expect(box('Water back measured at (°F)').value).toBe(String(REFERENCE_TEMP_F));
    type('Water back (gal)', '1');
    type('Water back measured at (°F)', '170');
    expect(saved().waterBack).toEqual({ on: true, volumeGal: 1, tempF: 170 });

    click(button('°C'));
    expect(box('Water back measured at (°C)').value).toBe('76.7');
    // Pro: barrels, or gallons by Pro's choice (the switch scales the
    // fermentation volume, 5.5 + 1 gal since S15c item 1, WF-S5, to 310 gal).
    click(button('Pro'));
    const bbl = Number(box('Water back (bbl)').value);
    expect(bbl).toBeCloseTo((1 * 310) / 6.5 / 31, 3);
    click(button('gal'));
    expect(Number(box('Water back (gal)').value)).toBeCloseTo(310 / 6.5, 2);

    click(check('Water back'));
    expect(box('Water back (gal)')).toBeUndefined();
    expect(saved().waterBack.on).toBe(false);
  });

  it('WB-S2, WB-S3: the stats bar shows the figures at pitch, the Volumes card the volume at pitch and the knock-out OG and IBU', () => {
    const r = withWaterBack();
    const d = computeRecipe(r);
    expect(d.pitchGal).toBeCloseTo(6.5, 12);
    // The fermentation volume stays the knock-out volume.
    expect(d.refVolumesGal.ferment).toBe(5.5);
    expect(d.stats.OG).toBeCloseTo(1.04724997, 8);
    expect(d.stats.FG).toBeCloseTo(1.01086749, 8);
    expect(d.stats.ABV).toBeCloseTo(0.04842329, 8);
    expect(d.stats.SRM).toBeCloseTo(4.1620621, 6);
    expect(d.stats.IBU).toBe(40);
    expect(d.knockOut.OG).toBeCloseTo(1.05578865, 8);
    expect(d.knockOut.IBU).toBe(47);

    // Measured hot, the water back is corrected to 60 °F at its own temperature.
    expect(computeRecipe(withWaterBack({ tempF: 170 })).pitchGal).toBeCloseTo(6.47479705, 7);

    mount(stored(r));
    expect(statsBar()).toContain('1.047OG');
    expect(statsBar()).toContain('1.011FG');
    expect(statsBar()).toContain('4.8%ABV');
    expect(statsBar()).toContain('4.2SRM');
    expect(statsBar()).toContain('40IBU');
    // Named since S15c item 1 (WF-S2, WF-S7): the fermentation volume at
    // 60 °F, and the wort from kettle's OG and IBU.
    const card = text(page());
    expect(card).toContain(`Fermentation volume at ${REFERENCE_TEMP_F} °F (gal)6.500`);
    expect(card).toContain('Wort from kettle OG (SG)1.056');
    expect(card).toContain('Wort from kettle IBU47');
  });

  it('WB-S4: cells needed, the dry-hop rate and the cost per gal read the volume at pitch', () => {
    const priced = (r) => ({
      ...r,
      malts: r.malts.map((m, i) => ({ ...m, pricePerLb: [1.5, 2][i] })),
    });
    const on = computeRecipe(withWaterBack());
    expect(on.cells).toBe(220);
    expect(on.hops.dryHopRatio).toBeCloseTo(0.30769231, 8);
    expect(computeCost(priced(withWaterBack())).perGal).toBeCloseTo(2.6153846, 7);
    // At knock-out without it.
    const off = computeRecipe(defaultRecipeState());
    expect(off.cells).toBe(210);
    expect(off.hops.dryHopRatio).toBeCloseTo(0.36363636, 8);
    expect(computeCost(priced(defaultRecipeState())).perGal).toBeCloseTo(17 / 5.5, 12);
  });

  it('WB-S5: no mineral figure changes; the Water tab and the sheet say water back is not in the water figures', () => {
    const off = withWater(defaultRecipeState());
    const on = withWaterBack({}, off);
    const figuresOff = computeWater(off.water, off);
    const figuresOn = computeWater(on.water, on);
    // Every water figure, the HLT's draws included, as without water back.
    const { waterBack, ...rest } = figuresOn;
    expect(waterBack).toBe(true);
    const { waterBack: offFlag, ...restOff } = figuresOff;
    expect(offFlag).toBe(false);
    expect(rest).toEqual(restOff);

    const tab = (r, figures) =>
      flat(
        renderToStaticMarkup(
          createElement(WaterTab, { water: r.water, figures, mode: 'home', screen: 'water', onScreen: () => {}, setWater: () => {} }),
        ),
      );
    const NOTE = 'Water back is not in the water figures';
    expect(tab(on, figuresOn)).toContain(NOTE);
    expect(tab(off, figuresOff)).not.toContain(NOTE);
    const sheetOn = recipeSheet({ recipe: on, derived: computeRecipe(on), water: figuresOn, mode: 'home', proGravityUnit: 'plato', today: TODAY });
    expect(sheetOn.water.waterBackNote).toContain(NOTE);
    const sheetOff = recipeSheet({ recipe: off, derived: computeRecipe(off), water: figuresOff, mode: 'home', proGravityUnit: 'plato', today: TODAY });
    expect(sheetOff.water.waterBackNote).toBeNull();
  });

  it('WB-S6: switching Home and Pro, the scale multiplies the water back with the other amounts; its temperature stays', () => {
    const r = withWaterBack({ tempF: 170 });
    const out = switchMode({ recipe: r, mode: 'home', proVolumeUnit: 'bbl' }, 'pro', null, () => true);
    // 5.5 + 1 = 6.5 gal -> 310 gal (S15c item 1, WF-S5): 1 gal x 310 / 6.5 = 47.6923... gal.
    expect(out.recipe.waterBack.volumeGal).toBeCloseTo(310 / 6.5, 12);
    expect(out.recipe.waterBack.tempF).toBe(170);
    expect(out.recipe.waterBack.on).toBe(true);
    // The figures at pitch stay.
    const before = computeRecipe(r).stats;
    const after = computeRecipe(out.recipe).stats;
    for (const k of ['OG', 'FG', 'ABV', 'SRM']) expect(after[k]).toBeCloseTo(before[k], 10);
    expect(after.IBU).toBe(before.IBU);
    // A blank water back stays blank.
    const blank = switchMode({ recipe: withWaterBack({ volumeGal: NaN }), mode: 'home', proVolumeUnit: 'bbl' }, 'pro', null, () => true);
    expect(blank.recipe.waterBack.volumeGal).toBeNaN();
  });

  it('WB-S7: recipe format 13; a version-1 to 12 document loads with water back off, its volume blank and its temperature at the reference', () => {
    expect(SCHEMA_VERSION).toBe(13);
    const s = fakeStorage();
    const defaults = { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY };
    savePersisted(s, { recipe: withWaterBack({ volumeGal: NaN, tempF: 170 }), ...DEFAULT_DISPLAY });
    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(13);
    expect(doc.recipe.waterBack).toEqual({ on: true, volumeGal: null, tempF: 170 });
    expect(loadPersisted(s, defaults).recipe.waterBack).toEqual({ on: true, volumeGal: NaN, tempF: 170 });

    const { waterBack, ...v12recipe } = doc.recipe;
    for (const version of [1, 5, 12]) {
      s.setItem(STORAGE_KEY, JSON.stringify({ ...doc, version, recipe: v12recipe }));
      const read = loadPersisted(s, defaults);
      expect(read, `version ${version}`).not.toBe(defaults);
      expect(read.recipe.waterBack).toEqual({ on: false, volumeGal: NaN, tempF: REFERENCE_TEMP_F });
    }
    savePersisted(s, loadPersisted(s, defaults));
    expect(JSON.parse(s._map.get(STORAGE_KEY)).version).toBe(13);
    // The recipe file reads it the same.
    const file = importRecipeFile(JSON.stringify({ ...doc, version: 12, recipe: v12recipe }), defaults, () => true);
    expect(file.outcome).toBe('replaced');
    expect(file.state.recipe.waterBack.on).toBe(false);

    // A version-13 document without it, or with a field of the wrong kind, is not a recipe.
    s.setItem(STORAGE_KEY, JSON.stringify({ ...doc, recipe: v12recipe }));
    expect(loadPersisted(s, defaults)).toBe(defaults);
    for (const bad of [{ on: 'yes' }, { volumeGal: '1' }, { tempF: '60' }]) {
      s.setItem(STORAGE_KEY, JSON.stringify({ ...doc, recipe: { ...doc.recipe, waterBack: { ...doc.recipe.waterBack, ...bad } } }));
      expect(loadPersisted(s, defaults)).toBe(defaults);
    }

    // Not a brewery figure: the brewery takes none, a new recipe has it off.
    const brewery = breweryFiguresFromRecipe(withWaterBack(), 'home', 'plato');
    expect(JSON.stringify(brewery)).not.toContain('waterBack');
    expect(newRecipe(brewery).recipe.waterBack.on).toBe(false);
  });

  it('WB-S8: the printed sheet prints the water back volume, the knock-out OG and the OG at pitch', () => {
    const r = withWaterBack({ tempF: 170 });
    const d = computeRecipe(r);
    const s = recipeSheet({ recipe: r, derived: d, mode: 'home', proGravityUnit: 'plato', today: TODAY });
    const row = s.volumes.rows.find((v) => v.key === 'waterBack');
    expect(row.label).toBe('Water back');
    expect(row.value).toBe('1.00');
    expect(row.tempNote).toBe('measured at 170 °F');
    // Since S15c item 1 (WF-S8): the fermentation volume, 5.5 + 1.
    expect(s.volumes.rows.find((v) => v.key === 'fermentTotal').value).toBe('6.50');
    expect(s.volumes.knockOutOG).toBe('1.056');
    expect(s.volumes.pitchOG).toBe('1.047');
    const printed = flat(renderToStaticMarkup(createElement(RecipeSheet, { recipe: r, derived: d, mode: 'home', proGravityUnit: 'plato' })));
    expect(printed).toContain('Water back measured at 170 °F 1.00');
    expect(printed).toContain('OG from kettle 1.056 (SG) · OG at pitch 1.047 (SG)');
    // Without water back the sheet has neither.
    const off = recipeSheet({ recipe: defaultRecipeState(), derived: computeRecipe(defaultRecipeState()), mode: 'home', proGravityUnit: 'plato', today: TODAY });
    expect(off.volumes.rows.map((v) => v.key)).not.toContain('waterBack');
    expect(off.volumes.knockOutOG).toBeNull();
  });

  it('WB-S10: a blank or uncorrectable water back blanks the figures at pitch, and the line under the stats bar names the box', () => {
    for (const [over, name] of [
      [{ volumeGal: NaN }, 'Water back'],
      [{ tempF: NaN }, 'Water back measurement temperature'],
      [{ tempF: 250 }, "Water back measurement temperature (outside the correction's range)"],
    ]) {
      const r = withWaterBack(over);
      const d = computeRecipe(r);
      for (const k of ['OG', 'FG', 'ABV', 'SRM', 'IBU']) expect(Number.isNaN(d.stats[k]), `${name}: ${k}`).toBe(true);
      expect(d.pitchGal).toBeNaN();
      expect(d.cells).toBeNaN();
      expect(d.hops.dryHopRatio).toBeNaN();
      // The knock-out figures stay.
      expect(d.knockOut.OG).toBeCloseTo(1.05578865, 8);
      expect(emptyFields(r, d)).toEqual([name]);
    }
    // Named only while water back is on.
    const off = { ...defaultRecipeState(), waterBack: { on: false, volumeGal: NaN, tempF: NaN } };
    expect(emptyFields(off, computeRecipe(off))).toEqual([]);

    mount(stored(withWaterBack({ volumeGal: NaN })));
    expect(statsBar()).toContain('—OG');
    expect(statsBar()).toContain('Empty: Water back — figures that depend on it show —');
  });

  it('WB-S9: with water back off every figure is as today', () => {
    const today = defaultRecipeState();
    const { waterBack, ...before } = today;
    // Off, with or without a volume typed, the figures are the knock-out's.
    for (const r of [today, { ...today, waterBack: { on: false, volumeGal: 1, tempF: 170 } }]) {
      const d = computeRecipe(r);
      expect(d.stats).toEqual({ OG: d.grist.OG, FG: d.grist.FG, ABV: d.grist.ABV, SRM: d.grist.SRM, IBU: d.hops.totalIBU });
      expect(d.knockOut).toBeNull();
      expect(d.pitchGal).toBe(d.refVolumesGal.ferment);
      expect(d.cells).toBe(210);
      expect(d.hops.dryHopRatio).toBeCloseTo(2 / 5.5, 12);
      expect(d.grist.OG).toBeCloseTo(1.05578865, 8);
      expect(d.hops.totalIBU).toBe(47);
      expect(computeCost(r)).toEqual(computeCost(today));
      expect(emptyFields(r, d)).toEqual([]);
    }
    expect(Object.keys(before)).not.toContain('waterBack');
  });
});
