// fermenter-sulfate-chloride.test.js
// Scenarios for batch S17 item 1, "The fermenter's sulfate and chloride with
// water back on" (docs/items/fermenter-sulfate-chloride.md, FM-S2, FM-S3,
// FM-S5, K): the kettle water before the boil, concentrated by the boil
// (pre-boil over post-boil volume), then mixed with the water back at the wort
// from kettle's and the water back's volumes; and the grams of gypsum and
// calcium chloride to add to the water back when the fermenter is below the
// style's target. Water back is not in Rev 4: every figure is worked by hand.
//
// The item's table: the built-in recipe, pre-boil 7 gal, post-boil 5.5 gal,
// the wort from kettle 5.5 gal, kettle water at 150 mg/L sulfate (and here
// 100 mg/L chloride), untreated water back with none of either:
//   none        150 x 7 / 5.5 = 190.909 mg/L   (chloride 100 x 7 / 5.5 = 127.273)
//   1 gal       150 x 7 / 6.5 = 161.538 mg/L   (100 x 7 / 6.5 = 107.692)
//   1.5 gal     150 x 7 / 7.0 = 150.000 mg/L   (the boil-off: 100.000)
//   3 gal       150 x 7 / 8.5 = 123.529 mg/L   (100 x 7 / 8.5 =  82.353), short
// The ratio stays 150 / 100 = 1.5: both ions are diluted alike.
//
// The grams to bring the fermenter to target, from the engine's salt table
// (1 g in 1 US gal: gypsum 147.4 mg/L sulfate, calcium chloride 127.4 mg/L
// chloride), over the fermentation volume at 60 degF, 3 gal of water back,
// targets 150 and 100:
//   gypsum            (150 - 1050/8.5) x 8.5 / 147.4 = (1275 - 1050) / 147.4 = 225 / 147.4 = 1.52645862 g
//   calcium chloride  (100 -  700/8.5) x 8.5 / 127.4 = ( 850 -  700) / 127.4 = 150 / 127.4 = 1.17739403 g

import { describe, it, expect } from 'vitest';
import { fermenterSulfateChloride, waterBackSaltsToTarget } from '../../src/index.js';

const KETTLE = { SO4: 150, Cl: 100 };
const NONE = { SO4: 0, Cl: 0 };
const BUILT_IN = { kettle: KETTLE, preBoilGal: 7, postBoilGal: 5.5, wortGal: 5.5, waterBack: NONE };

describe("the fermenter's sulfate and chloride with water back on", () => {
  it('the boil and the water back (FM-S2, the item table)', () => {
    const at = (waterBackGal) => fermenterSulfateChloride({ ...BUILT_IN, waterBackGal });
    expect(at(0).SO4).toBeCloseTo(1050 / 5.5, 10); // 190.909
    expect(at(1).SO4).toBeCloseTo(1050 / 6.5, 10); // 161.538
    expect(at(1.5).SO4).toBeCloseTo(150, 10);
    expect(at(3).SO4).toBeCloseTo(1050 / 8.5, 10); // 123.529
    expect(at(1).Cl).toBeCloseTo(700 / 6.5, 10); // 107.692
    expect(at(3).Cl).toBeCloseTo(700 / 8.5, 10); // 82.353
    for (const g of [0, 1, 1.5, 3]) expect(at(g).ratio).toBeCloseTo(1.5, 10);
    expect(at(3).pitchGal).toBe(8.5);

    // Less wort from kettle than the post-boil volume (left in the kettle):
    // the boiled water at 1050 / 5.5 mg/L, 5 gal of it with 1 gal of water
    // back: 1050 / 5.5 x 5 / 6 = 159.0909 mg/L.
    expect(fermenterSulfateChloride({ ...BUILT_IN, wortGal: 5, waterBackGal: 1 }).SO4).toBeCloseTo(
      ((1050 / 5.5) * 5) / 6,
      10,
    );
  });

  it("the water back's own sulfate and chloride are mixed in (FM-S3)", () => {
    // Water back at 30 mg/L sulfate and 20 chloride, 1 gal:
    // (150 x 7 + 30 x 1) / 6.5 = 1080 / 6.5 = 166.1538; (700 + 20) / 6.5 = 110.7692.
    const f = fermenterSulfateChloride({ ...BUILT_IN, waterBack: { SO4: 30, Cl: 20 }, waterBackGal: 1 });
    expect(f.SO4).toBeCloseTo(1080 / 6.5, 10);
    expect(f.Cl).toBeCloseTo(720 / 6.5, 10);
    expect(f.ratio).toBeCloseTo(1080 / 720, 10);
  });

  it('K: what is in the fermenter is what went in the kettle and the water back, by mass', () => {
    for (const waterBackGal of [0, 0.5, 1, 2.25, 7]) {
      for (const [pre, post, wort] of [
        [7, 5.5, 5.5],
        [8, 6.2, 5.9],
        [420, 400, 390],
      ]) {
        const wb = { SO4: 42, Cl: 17 };
        const f = fermenterSulfateChloride({ kettle: KETTLE, preBoilGal: pre, postBoilGal: post, wortGal: wort, waterBack: wb, waterBackGal });
        // mg/L x gal: the kettle's mass over the post-boil volume, the share drawn to the fermenter.
        const so4In = ((KETTLE.SO4 * pre) / post) * wort + wb.SO4 * waterBackGal;
        expect(f.SO4 * (wort + waterBackGal)).toBeCloseTo(so4In, 9);
      }
    }
  });

  it('a blank figure blanks them (FM-S8)', () => {
    for (const blank of [
      { preBoilGal: NaN },
      { postBoilGal: NaN },
      { wortGal: NaN },
      { waterBackGal: NaN },
      { kettle: { SO4: NaN, Cl: NaN } },
      { waterBack: { SO4: NaN, Cl: NaN } },
    ]) {
      const f = fermenterSulfateChloride({ ...BUILT_IN, waterBackGal: 1, ...blank });
      expect(f.SO4, JSON.stringify(blank)).toBeNaN();
      expect(f.Cl, JSON.stringify(blank)).toBeNaN();
      expect(f.ratio, JSON.stringify(blank)).toBeNaN();
    }
  });

  it('the grams to bring the fermenter to target (FM-S5)', () => {
    const f = fermenterSulfateChloride({ ...BUILT_IN, waterBackGal: 3 });
    const add = waterBackSaltsToTarget({ fermenter: f, target: { SO4: 150, Cl: 100 }, pitchGal: f.pitchGal });
    expect(add.gypsum).toBeCloseTo(225 / 147.4, 10); // 1.52645862 g
    expect(add.calcium_chloride).toBeCloseTo(150 / 127.4, 10); // 1.17739403 g
    // Each brings its ion to the target: 1050/8.5 + 147.4 x 1.52645862 / 8.5 = 1275 / 8.5 = 150.
    expect(f.SO4 + (147.4 * add.gypsum) / f.pitchGal).toBeCloseTo(150, 10);
    expect(f.Cl + (127.4 * add.calcium_chloride) / f.pitchGal).toBeCloseTo(100, 10);
  });

  it('nothing at or above target (FM-S5, FM-Q9)', () => {
    const target = { SO4: 150, Cl: 100 };
    for (const waterBackGal of [0, 1, 1.5]) {
      const f = fermenterSulfateChloride({ ...BUILT_IN, waterBackGal });
      expect(waterBackSaltsToTarget({ fermenter: f, target, pitchGal: f.pitchGal }), String(waterBackGal)).toEqual({
        gypsum: 0,
        calcium_chloride: 0,
      });
    }
    // One short, one not: sulfate 123.5 against 120 is above, chloride 82.4 against 100 short.
    const f = fermenterSulfateChloride({ ...BUILT_IN, waterBackGal: 3 });
    const add = waterBackSaltsToTarget({ fermenter: f, target: { SO4: 120, Cl: 100 }, pitchGal: f.pitchGal });
    expect(add.gypsum).toBe(0);
    expect(add.calcium_chloride).toBeCloseTo(150 / 127.4, 10);
    // A blank fermenter figure blanks its grams.
    const blank = waterBackSaltsToTarget({ fermenter: { SO4: NaN, Cl: 50 }, target, pitchGal: 8.5 });
    expect(blank.gypsum).toBeNaN();
    expect(blank.calcium_chloride).toBeCloseTo(((100 - 50) * 8.5) / 127.4, 10);
  });
});
