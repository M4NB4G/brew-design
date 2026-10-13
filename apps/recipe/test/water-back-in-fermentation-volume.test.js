// @vitest-environment jsdom
// water-back-in-fermentation-volume.test.js
// Scenarios for batch S15c item 1, "Water back as part of the fermentation
// volume" (docs/items/water-back-in-fermentation-volume.md, WF-S1 to WF-S10):
// with water back on, the box that was the fermentation volume is the wort
// from the kettle, and the fermentation volume is worked out at the bottom of
// the card: the wort from kettle plus the water back.
//
// Every figure is worked by hand. The built-in recipe (fermentation volume
// 5.5 gal; post-boil 7 - 1.5 x 1 = 5.5 gal; 10 + 1 lb of malt; OG at knock-out
// 1.056, IBU 47, as water-back.test.js works them) with 1 gal of water back.
//
// Measured hot, by the engine's density table (kg/m^3, linear between rows):
//   60 °F = 15.5556 °C: 999.10 + (0.5556 / 5) x (998.21 - 999.10) = 999.00111
//   68 °F = 20 °C: 998.21 (a row of the table)
//   170 °F = 76.667 °C: 974.84 + (1.6667 / 5) x (971.79 - 974.84) = 973.82333
//   wort from kettle 5.5 gal at 68 °F: 5.5 x 998.21 / 999.00111 = 5.49564454 gal at 60 °F
//   water back 1 gal at 170 °F: 1 x 973.82333 / 999.00111 = 0.97479705 gal at 60 °F
//   fermentation volume at 60 °F: 5.49564454 + 0.97479705 = 6.47044159 gal
//   the dry-hop rate: 2 oz / 6.47044159 gal = 0.30909791 oz/gal
//   the fermentation volume as typed: 5.5 + 1 = 6.5 gal
//
// The Home/Pro scale (WF-S5), 5.5 + 1 = 6.5 gal to 10 bbl = 310 gal:
//   ratio = 310 / 6.5 = 47.6923077
//   wort from kettle 5.5 x 310 / 6.5 = 1705 / 6.5 = 262.3076923 gal
//   water back 1 x 310 / 6.5 = 47.6923077 gal
//   Pale 2-Row 10 lb x 310 / 6.5 = 476.9230769 lb
//   and 262.3076923 + 47.6923077 = 310, the batch.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REFERENCE_TEMP_F } from '@brew/engine';
import { defaultRecipeState, DEFAULT_DISPLAY, breweryFiguresFromRecipe, switchMode } from '../src/state.js';
import { computeRecipe, computeCost } from '../src/selectors.js';
import { STORAGE_KEY, exportRecipeDocument, loadPersisted } from '../src/persistence.js';
import { emptyFields } from '../src/empty-fields.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import RecipeSheet from '../src/components/RecipeSheet.jsx';
import { mount, unmount, page, text } from './page-error.fixture.js';

const TODAY = new Date(2026, 9, 13);

const withWaterBack = (over = {}, r = defaultRecipeState()) => ({
  ...r,
  waterBack: { on: true, volumeGal: 1, tempF: REFERENCE_TEMP_F, ...over },
});
// Wort from kettle 5.5 gal at 68 °F, water back 1 gal at 170 °F (the item's case).
const hot = () => {
  const r = withWaterBack({ tempF: 170 });
  return { ...r, measurementTempF: { ...r.measurementTempF, ferment: 68 } };
};

const flat = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

const stored = (recipe, display = DEFAULT_DISPLAY) => ({ [STORAGE_KEY]: exportRecipeDocument({ recipe, ...display }) });
const box = (name) => [...page().querySelectorAll('input')].find((el) => el.getAttribute('aria-label') === name);
const check = (name) =>
  [...page().querySelectorAll('label')].find((l) => text(l) === name)?.querySelector('input[type=checkbox]');
const card = (label) =>
  [...page().querySelectorAll('span')].find((s) => text(s) === label)?.closest('div[style*="border"]') ?? page();
// Where each of `labels` first appears in `t`, in order; -1 when it does not.
const at = (t, labels) => labels.map((l) => t.indexOf(l));

afterEach(() => unmount());

describe('water back as part of the fermentation volume (S15c item 1)', () => {
  it('WF-S1: with water back off the card is as today', () => {
    mount();
    const t = text(page());
    expect(box('Fermentation volume (gal)')).toBeTruthy();
    expect(box('Fermentation volume measured at (°F)')).toBeTruthy();
    expect(t).toContain(`Fermentation volume at ${REFERENCE_TEMP_F} °F (gal)5.500`);
    expect(t).not.toContain('Wort from kettle');
    expect(check('Water back').checked).toBe(false);
  });

  it('WF-S2: on, wort from kettle, water back and its temperature, then the fermentation volume and its temperature at the bottom', () => {
    mount(stored(hot()));
    expect(box('Wort from kettle (gal)').value).toBe('5.5');
    expect(box('Fermentation volume (gal)'), 'the total is worked out, not a box').toBeUndefined();
    expect(box('Water back (gal)').value).toBe('1');
    expect(box('Water back measured at (°F)').value).toBe('170');
    expect(box('Fermentation volume measured at (°F)').value).toBe('68');
    const t = text(page());
    // The fermentation volume as typed, 5.5 + 1, and at 60 °F, 6.47044159 (header).
    expect(t).toContain('Fermentation volume (gal)6.500');
    expect(t).toContain(`Fermentation volume at ${REFERENCE_TEMP_F} °F (gal)6.470`);
    // In that order down the card.
    const where = at(t, [
      'Wort from kettle (gal)',
      'Water back (gal)',
      'Water back measured at (°F)',
      'Fermentation volume (gal)',
      'Fermentation volume measured at (°F)',
      `Fermentation volume at ${REFERENCE_TEMP_F} °F (gal)`,
    ]);
    expect(where.every((i) => i >= 0), where.join(' ')).toBe(true);
    expect([...where].sort((a, b) => a - b)).toEqual(where);
    expect(t).not.toContain('Volume at pitch');

    // Typing the wort from kettle changes the total.
    const el = box('Wort from kettle (gal)');
    act(() => el.focus());
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    act(() => {
      set.call(el, '6');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    act(() => el.blur());
    expect(text(page())).toContain('Fermentation volume (gal)7.000');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe.fermentVolGal).toBe(6);
  });

  it('WF-S3: the wort from kettle is corrected at the fermentation volume\'s temperature, the water back at its own; the two added', () => {
    const d = computeRecipe(hot());
    expect(d.refVolumesGal.ferment).toBeCloseTo(5.49564454, 7);
    expect(d.refVolumesGal.waterBack).toBeCloseTo(0.97479705, 7);
    expect(d.pitchGal).toBeCloseTo(6.47044159, 7);
    // The fermentation volume as typed: 5.5 + 1.
    expect(d.fermentGal).toBe(6.5);
    // Off, it is the box itself.
    expect(computeRecipe(defaultRecipeState()).fermentGal).toBe(5.5);
  });

  it('WF-S4: the stats, cells, dry-hop rate and cost read the fermentation volume, the total', () => {
    const d = computeRecipe(hot());
    expect(d.hops.dryHopRatio).toBeCloseTo(0.30909791, 7);
    const priced = { ...hot(), malts: hot().malts.map((m, i) => ({ ...m, pricePerLb: [1.5, 2][i] })) };
    // (15 + 2) / 6.47044159 = 2.62733227
    expect(computeCost(priced).perGal).toBeCloseTo(2.62733227, 7);
    // The OG at pitch is below the OG from the kettle.
    expect(d.stats.OG).toBeLessThan(d.knockOut.OG);
  });

  it('WF-S5: the scale and the brewery\'s batch read the total', () => {
    const r = withWaterBack();
    let asked = null;
    const out = switchMode({ recipe: r, mode: 'home', proVolumeUnit: 'bbl' }, 'pro', null, (q) => {
      asked = q;
      return true;
    });
    expect(asked).toContain('10 bbl');
    expect(out.recipe.fermentVolGal).toBeCloseTo(262.3076923, 7);
    expect(out.recipe.waterBack.volumeGal).toBeCloseTo(47.6923077, 7);
    expect(out.recipe.malts[0].weightLb).toBeCloseTo(476.9230769, 7);
    // The scaled recipe is at its batch: switching back with that batch asks nothing.
    expect(out.recipe.fermentVolGal + out.recipe.waterBack.volumeGal).toBe(310);
    const brewery310 = { ...breweryFiguresFromRecipe(out.recipe, 'pro', 'plato'), mode: 'pro' };
    expect(brewery310.fermentVolGal).toBe(310);
    let again = false;
    switchMode({ recipe: out.recipe, mode: 'pro', proVolumeUnit: 'bbl' }, 'home', brewery310, () => {
      again = true;
      return true;
    });
    expect(again, 'already at the batch').toBe(false);

    // The brewery's batch from this recipe is the total, 5.5 + 1.
    expect(breweryFiguresFromRecipe(r, 'home', 'plato').fermentVolGal).toBe(6.5);
    // A recipe of 5.5 + 1 at a batch of 6.5 is already at it.
    let asked65 = false;
    switchMode({ recipe: r, mode: 'home', proVolumeUnit: 'bbl' }, 'pro', { fermentVolGal: 6.5 }, () => {
      asked65 = true;
      return true;
    });
    expect(asked65).toBe(false);
    // A blank water back leaves no ratio: the switch changes units only.
    const blank = withWaterBack({ volumeGal: NaN });
    let askedBlank = false;
    const same = switchMode({ recipe: blank, mode: 'home', proVolumeUnit: 'bbl' }, 'pro', null, () => {
      askedBlank = true;
      return true;
    });
    expect(askedBlank).toBe(false);
    expect(same.recipe).toBe(blank);
  });

  it('WF-S6: the post-boil warning compares the wort from kettle', () => {
    // Post-boil 5.5 gal; wort from kettle 5.5 + water back 1: no warning,
    // though the fermentation volume, 6.5, is more than the post-boil volume.
    expect(computeRecipe(withWaterBack()).warnings.postBoilBelowFerment).toBe(false);
    // Wort from kettle 6: the warning, naming the wort from kettle.
    const more = { ...withWaterBack(), fermentVolGal: 6 };
    expect(computeRecipe(more).warnings.postBoilBelowFerment).toBe(true);
    mount(stored(more));
    expect(text(page())).toContain('Less wort after the boil than the wort from kettle');
    unmount();
    mount(stored({ ...defaultRecipeState(), fermentVolGal: 6 }));
    expect(text(page())).toContain('Less wort after the boil than the fermenter volume');
  });

  it('WF-S7, WF-S8: the labels and the printed sheet', () => {
    mount(stored(withWaterBack()));
    const t = text(page());
    expect(t).toContain('Wort from kettle OG (SG)1.056');
    expect(t).toContain('Wort from kettle IBU47');
    expect(t).not.toContain('Knock-out');
    expect(text(card('Kettle'))).toContain('47 IBU from kettle');
    unmount();
    mount();
    expect(text(card('Kettle'))).toContain('47 IBU');
    expect(text(card('Kettle'))).not.toContain('from kettle');

    const r = hot();
    const d = computeRecipe(r);
    const s = recipeSheet({ recipe: r, derived: d, mode: 'home', proGravityUnit: 'plato', today: TODAY });
    const rows = s.volumes.rows.filter((v) => ['ferment', 'waterBack', 'fermentTotal', 'pitch'].includes(v.key));
    expect(rows.map((v) => [v.label, v.value, v.tempNote])).toEqual([
      ['Wort from kettle', '5.50', null],
      ['Water back', '1.00', 'measured at 170 °F'],
      ['Fermentation volume', '6.50', 'measured at 68 °F'],
    ]);
    expect(s.meta.find((m) => m.label === 'Batch volume').value).toBe('6.50 gal');
    const printed = flat(renderToStaticMarkup(createElement(RecipeSheet, { recipe: r, derived: d, mode: 'home', proGravityUnit: 'plato' })));
    expect(printed).toContain('OG from kettle 1.056 (SG) · OG at pitch');
    expect(printed).not.toContain('Knock-out');
    expect(printed).toContain('Total IBU from kettle');

    const off = defaultRecipeState();
    const so = flat(renderToStaticMarkup(createElement(RecipeSheet, { recipe: off, derived: computeRecipe(off), mode: 'home', proGravityUnit: 'plato' })));
    expect(so).toContain('Total IBU — the rounded total');
    expect(so).not.toContain('from kettle');
  });

  it('WF-S9: a recipe saved by S15b reads the same figures, its fermentation volume as the wort from kettle', () => {
    const r = withWaterBack({ tempF: 170 });
    const doc = exportRecipeDocument({ recipe: r, ...DEFAULT_DISPLAY });
    expect(JSON.parse(doc).version).toBe(13);
    const fake = { getItem: (k) => (k === STORAGE_KEY ? doc : null), setItem: () => {}, removeItem: () => {} };
    const read = loadPersisted(fake, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY });
    expect(read.recipe.fermentVolGal).toBe(5.5);
    expect(read.recipe.waterBack).toEqual({ on: true, volumeGal: 1, tempF: 170 });
    expect(computeRecipe(read.recipe).stats).toEqual(computeRecipe(r).stats);
    mount(stored(r));
    expect(box('Wort from kettle (gal)').value).toBe('5.5');
  });

  it('K: a blank wort from kettle or water back blanks the fermentation volume and what reads it, and is named', () => {
    for (const [r, name] of [
      [{ ...withWaterBack(), fermentVolGal: NaN }, 'Wort from kettle'],
      [withWaterBack({ volumeGal: NaN }), 'Water back'],
    ]) {
      const d = computeRecipe(r);
      expect(d.fermentGal).toBeNaN();
      expect(d.pitchGal).toBeNaN();
      expect(d.stats.OG).toBeNaN();
      expect(emptyFields(r, d)).toEqual([name]);
    }
    // In screen order: the wort from kettle, the water back and its
    // temperature, then the fermentation volume's temperature.
    const all = {
      ...withWaterBack({ volumeGal: NaN, tempF: NaN }),
      fermentVolGal: NaN,
      measurementTempF: { ...defaultRecipeState().measurementTempF, ferment: NaN },
    };
    expect(emptyFields(all, computeRecipe(all))).toEqual([
      'Wort from kettle',
      'Water back',
      'Water back measurement temperature',
      'Fermentation measurement temperature',
    ]);
  });

  it('WF-S10: with water back off every figure is as today', () => {
    const today = defaultRecipeState();
    const typed = { ...today, waterBack: { on: false, volumeGal: 1, tempF: 170 } };
    for (const r of [today, typed]) {
      const d = computeRecipe(r);
      expect(d.fermentGal).toBe(5.5);
      expect(d.pitchGal).toBe(5.5);
      expect(d.knockOut).toBeNull();
      expect(emptyFields({ ...r, fermentVolGal: NaN }, computeRecipe({ ...r, fermentVolGal: NaN }))).toEqual(['Fermentation volume']);
      expect(breweryFiguresFromRecipe(r, 'home', 'plato').fermentVolGal).toBe(5.5);
      const s = recipeSheet({ recipe: r, derived: d, mode: 'home', proGravityUnit: 'plato', today: TODAY });
      expect(s.volumes.rows.find((v) => v.key === 'ferment').label).toBe('Fermentation volume');
      expect(s.volumes.rows.map((v) => v.key)).not.toContain('waterBack');
    }
    // Scaled with it off, the fermentation volume becomes the batch, 310.
    const out = switchMode({ recipe: typed, mode: 'home', proVolumeUnit: 'bbl' }, 'pro', null, () => true);
    expect(out.recipe.fermentVolGal).toBe(310);
    expect(out.recipe.malts[0].weightLb).toBeCloseTo(6200 / 11, 9);
  });
});
