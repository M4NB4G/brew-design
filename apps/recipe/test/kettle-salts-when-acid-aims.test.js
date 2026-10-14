// kettle-salts-when-acid-aims.test.js
// Scenarios for batch S17 item 2, "Kettle salts when the acid drops the
// raising salt" (docs/items/kettle-salts-when-acid-aims.md, KA-S1 to KA-S3,
// KA-Q1, K): with kettle salts on and the acid aiming at the mash pH (the
// mash above the target, so no raising salt in the mash), the kettle gets no
// alkalinity-raising salt; at or below the target the kettle is as before.
//
// The amber ale of acid-aimed.test.js (AA-Q7): 9 lb of 2 degL base, 1 lb of
// 10 degL base, 1 lb of 60 degL crystal in 4 gal of mash water, the example
// water report, the mash water treated, with kettle salts on and a 4 gal
// batch sparge. At a target of 5.4 the mash reads above it without baking
// soda, so the acid aims; at 6.0 it reads below, no acid, and the raising
// salt follows the style.
//
// No number is introduced: the change sets the kettle's raising salt to 0
// while the acid aims. The kettle's figures before the change, recorded from
// the unchanged code (2026-10-14), are the pins for what stays:
//   baking soda in the kettle   0.45550159950416597 g at 5.4 (0.46),
//                               0.2602866282880949 g at 6.0 (0.26)
//   calcium chloride 2.197802197802198 g, Epsom 2.0000000000000004 g,
//   gypsum 1.5875169606512893 g, at both targets.

import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { defaultWaterState, EXAMPLE_SOURCE } from '../src/water-state.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import WaterTab from '../src/components/water/WaterTab.jsx';

const malt = (name, weightLb, colorL, type = 'base') => ({
  name,
  weightLb,
  fgdb: 0.8,
  colorL,
  type,
  distilledWaterPh: NaN,
  acidityMeqPerKg: NaN,
  pricePerLb: NaN,
});

const amberAle = ({ target, ...water } = {}) => ({
  ...defaultRecipeState(),
  malts: [malt('Pale', 9, 2), malt('Munich', 1, 10), malt('Crystal 60', 1, 60, 'crystal')],
  mashWaterGal: 4,
  water: {
    ...defaultWaterState(),
    source: { ...EXAMPLE_SOURCE },
    styleId: 'amber_ale',
    kettleSalts: true,
    spargeMethod: 'batch',
    spargeGal: 4,
    mashPhTarget: target,
    ...water,
  },
});

const kettleSalt = (w, key) => w.kettle.salts.find((s) => s.key === key)?.amount;
const flat = (markup) => markup.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
const salts = (r) =>
  flat(
    renderToStaticMarkup(
      createElement(WaterTab, { water: r.water, figures: computeWater(r.water, r), mode: 'home', screen: 'salts', onScreen: () => {}, setWater: () => {} }),
    ),
  );
const sheet = (r) =>
  recipeSheet({ recipe: r, derived: computeRecipe(r), water: computeWater(r.water, r), mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 9, 14) });
const kettleCard = (t) => t.slice(t.indexOf('Kettle Salts'), t.indexOf('No acid goes in the kettle'));

describe('kettle salts when the acid drops the raising salt (S17 item 2)', () => {
  it('KA-S1: at 5.4 the acid aims and the kettle has no baking soda (0 g, against 0.46 g before)', () => {
    const r = amberAle({ target: 5.4 });
    const w = computeWater(r.water, r);
    // The acid aims: no raising salt in the mash (AA-Q7).
    expect(w.acid.aimedAt).toBe('target');
    expect(w.acid.recommended).toBeGreaterThan(0);
    expect(w.raiseSalt.recommended).toBe(0);
    expect(kettleSalt(w, 'baking_soda')).toBe(0);
    expect(kettleCard(salts(r))).toContain('Baking Soda (NaHCO₃) 0.0 g');
    expect(sheet(r).water.additions.filter((a) => a.place === 'Kettle').map((a) => a.name)).not.toContain('Baking Soda (NaHCO₃)');
  });

  it('KA-S2: at 6.0 no acid, the raising salt follows the style, and the kettle is as before (0.26 g)', () => {
    const r = amberAle({ target: 6.0 });
    const w = computeWater(r.water, r);
    expect(w.raiseSalt.recommended).toBeGreaterThan(0);
    expect(kettleSalt(w, 'baking_soda')).toBeCloseTo(0.2602866282880949, 12);
    expect(kettleCard(salts(r))).toContain('Baking Soda (NaHCO₃) 0.3 g');
    expect(sheet(r).water.additions).toContainEqual({ place: 'Kettle', name: 'Baking Soda (NaHCO₃)', amount: '0.3', unit: 'g' });
  });

  it('KA-S3: the other kettle salts are as before, at both targets, in the same order', () => {
    for (const target of [5.4, 6.0]) {
      const w = computeWater(amberAle({ target }).water, amberAle({ target }));
      expect(w.kettle.salts.map((s) => s.key), String(target)).toEqual(['calcium_chloride', 'epsom', 'gypsum', 'baking_soda']);
      expect(kettleSalt(w, 'calcium_chloride'), String(target)).toBeCloseTo(2.197802197802198, 12);
      expect(kettleSalt(w, 'epsom'), String(target)).toBeCloseTo(2.0000000000000004, 12);
      expect(kettleSalt(w, 'gypsum'), String(target)).toBeCloseTo(1.5875169606512893, 12);
      expect(w.kettle.overTarget, String(target)).toEqual([]);
    }
  });

  it('KA-S1, KA-S2: with pickling lime as the raising salt, none in the kettle while the acid aims, as before at 6.0', () => {
    // Before the change (recorded 2026-10-14): 0.2003000560408912 g of lime in
    // the kettle at 5.4, 0.11445717488050927 g at 6.0; the other three as above.
    const at = (target) => {
      const r = amberAle({ target, raiseAlkSource: 'pickling_lime' });
      return computeWater(r.water, r);
    };
    const aims = at(5.4);
    expect(aims.acid.aimedAt).toBe('target');
    expect(kettleSalt(aims, 'pickling_lime')).toBe(0);
    expect(kettleSalt(at(6.0), 'pickling_lime')).toBeCloseTo(0.11445717488050927, 12);
    for (const w of [aims, at(6.0)]) {
      expect(w.kettle.salts.map((s) => s.key)).toEqual(['calcium_chloride', 'epsom', 'gypsum', 'pickling_lime']);
      expect(kettleSalt(w, 'calcium_chloride')).toBeCloseTo(2.197802197802198, 12);
      expect(kettleSalt(w, 'epsom')).toBeCloseTo(2.0000000000000004, 12);
      expect(kettleSalt(w, 'gypsum')).toBeCloseTo(1.5875169606512893, 12);
    }
  });

  it('K: the kettle reads the same "acid aims" condition as the salts and the acid card', () => {
    // The brewer's own raising salt in the mash, while the acid aims: the
    // kettle still gets none of its own.
    const own = amberAle({ target: 5.4, saltOverrides: { baking_soda: 0.1 } });
    const w = computeWater(own.water, own);
    expect(w.acid.aimedAt).toBe('target');
    expect(kettleSalt(w, 'baking_soda')).toBe(0);
    // A blank target: no acid recommendation, nothing aims, the raising salt
    // follows the style in the mash, and the kettle is as before (as at 6.0).
    const blank = amberAle({ target: NaN });
    const wb = computeWater(blank.water, blank);
    expect(wb.acid.aimedAt).toBeNull();
    expect(wb.raiseSalt.recommended).toBeGreaterThan(0);
    expect(kettleSalt(wb, 'baking_soda')).toBeCloseTo(0.2602866282880949, 12);
  });

  it('off: with kettle salts off there is no kettle, and the mash figures are as with them on', () => {
    for (const target of [5.4, 6.0]) {
      const on = amberAle({ target });
      const off = amberAle({ target, kettleSalts: false });
      const wOn = computeWater(on.water, on);
      const wOff = computeWater(off.water, off);
      expect(wOff.kettle).toBeNull();
      for (const k of ['recommendation', 'salts', 'raiseSalt', 'acid', 'final', 'mashPh', 'volumes']) {
        expect(wOn[k], `${target} ${k}`).toEqual(wOff[k]);
      }
    }
  });
});
