// scale.test.js
// Scenarios for batch S6e, "Scale the recipe when switching Home and Pro"
// (docs/items/pro-recipe-default.md, PD-S4): scaling multiplies every amount
// by the batch over the recipe's fermentation volume; percents, times,
// temperatures, the efficiency, the attenuation and the yeast are unchanged,
// so OG, FG, ABV, SRM and IBU are unchanged. Nothing is rounded.
//
// The pins are worked by hand. 5.5 gal -> 310 gal (10 bbl x 31 gal/bbl):
// ratio = 310 / 5.5 = 3100 / 55 = 620 / 11 = 56.363636...
//   malt   10 lb  x 620/11 = 6200/11 = 563.636363... lb
//   malt    1 lb  x 620/11 =  620/11 =  56.363636... lb
//   hop     1 oz  x 620/11 =  620/11 =  56.363636... oz
//   dry hop 2 oz  x 620/11 = 1240/11 = 112.727272... oz
//   mash water 5 gal x 620/11 = 3100/11 = 281.818181... gal
//   pre-boil   7 gal x 620/11 = 4340/11 = 394.545454... gal
//   boil-off 1.5 gal/hr x 620/11 = 930/11 = 84.545454... gal/hr
//   sparge     4 gal x 620/11 = 2480/11 = 225.454545... gal
//   HLT treated 12 gal x 620/11 = 7440/11 = 676.363636... gal
//   HLT top-up   3 gal x 620/11 = 1860/11 = 169.090909... gal
//   gypsum 2 g x 620/11 = 1240/11 = 112.727272... g
//   lactic 88 % 1.5 mL x 620/11 = 930/11 = 84.545454... mL
//   acidulated malt 30 g x 620/11 = 18600/11 = 1690.909090... g
// and the fermentation volume becomes the batch, 310 gal.

import { describe, it, expect } from 'vitest';
import { scaleRecipe, computeGrist, computeHops, computePostBoilVol } from '../src/index.js';

const recipe = () => ({
  name: 'Pale',
  style: '',
  notes: '',
  malts: [
    { name: 'Pale 2-Row', weightLb: 10, fgdb: 0.8, colorL: 2, type: 'base', distilledWaterPh: NaN, acidityMeqPerKg: NaN },
    { name: 'Munich', weightLb: 1, fgdb: 0.8, colorL: 9, type: 'base', distilledWaterPh: NaN, acidityMeqPerKg: NaN },
  ],
  efficiency: 0.75,
  apparentAttenuation: 0.77,
  preBoilVolGal: 7,
  boilOffRateGalPerHr: 1.5,
  boilTimeMin: 60,
  mashWaterGal: 5,
  kettleAdditions: [
    { name: 'Magnum', timeMin: 60, wortTempF: 212, weightOz: 1, alphaAcidFraction: 0.12 },
    { name: 'Cascade', timeMin: 10, wortTempF: 212, weightOz: 1, alphaAcidFraction: 0.06 },
  ],
  dryHops: [{ name: 'Citra', weightOz: 2 }],
  fermentVolGal: 5.5,
  yeast: { type: 'ale', density: 'mod', name: 'Chico', fermTempF: 66 },
  measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
  water: {
    source: { Ca: 8, Mg: 2, Na: 22, SO4: 0, Cl: 20, Alkalinity: 50, pH: 7.2 },
    styleId: 'hoppy_ale',
    raiseAlkSource: 'baking_soda',
    enabledSalts: ['gypsum', 'calcium_chloride'],
    saltOverrides: { gypsum: 2 },
    acidAmounts: { lactic_88: 1.5, acidulated_malt: 30 },
    primaryAcid: 'lactic_88',
    multiAcid: true,
    treatment: 'tank',
    acidPlace: 'salts',
    kettleSalts: true,
    vessels: 3,
    spargeMethod: 'batch',
    tankTreatedGal: 12,
    tankTopUpGal: 3,
    absorptionQtPerLb: 0.1,
    spargeGal: 4,
  },
});

// The engine's forward calculation at the 60 °F reference (factor 1).
function forward(r) {
  const postBoilVolGal = computePostBoilVol(r.preBoilVolGal, r.boilOffRateGalPerHr, r.boilTimeMin);
  const grist = computeGrist({
    malts: r.malts,
    efficiency: r.efficiency,
    preBoilVolGal: r.preBoilVolGal,
    postBoilVolGal,
    mashWaterGal: r.mashWaterGal,
    apparentAttenuation: r.apparentAttenuation,
  });
  const hops = computeHops({
    kettleAdditions: r.kettleAdditions,
    preBoilSg: grist.preBoilSg,
    postBoilVolGal,
    dryHops: r.dryHops,
    fermentVolGal: r.fermentVolGal,
  });
  return { grist, hops };
}

describe('scale the recipe to a batch', () => {
  it('a recipe scales to a batch', () => {
    const before = recipe();
    const scaled = scaleRecipe(before, 310);

    // Every amount, by the hand-worked ratio 620/11 (header).
    expect(scaled.fermentVolGal).toBe(310);
    expect(scaled.malts[0].weightLb).toBeCloseTo(563.636363636, 8);
    expect(scaled.malts[1].weightLb).toBeCloseTo(56.363636364, 8);
    expect(scaled.kettleAdditions[0].weightOz).toBeCloseTo(56.363636364, 8);
    expect(scaled.kettleAdditions[1].weightOz).toBeCloseTo(56.363636364, 8);
    expect(scaled.dryHops[0].weightOz).toBeCloseTo(112.727272727, 8);
    expect(scaled.mashWaterGal).toBeCloseTo(281.818181818, 8);
    expect(scaled.preBoilVolGal).toBeCloseTo(394.545454545, 8);
    expect(scaled.boilOffRateGalPerHr).toBeCloseTo(84.545454545, 8);
    expect(scaled.water.spargeGal).toBeCloseTo(225.454545455, 8);
    expect(scaled.water.tankTreatedGal).toBeCloseTo(676.363636364, 8);
    expect(scaled.water.tankTopUpGal).toBeCloseTo(169.090909091, 8);
    expect(scaled.water.saltOverrides.gypsum).toBeCloseTo(112.727272727, 8);
    expect(scaled.water.acidAmounts.lactic_88).toBeCloseTo(84.545454545, 8);
    expect(scaled.water.acidAmounts.acidulated_malt).toBeCloseTo(1690.909090909, 8);

    // Percents, times, temperatures, efficiency, attenuation, the yeast and
    // every other entry are unchanged.
    expect(scaled.efficiency).toBe(0.75);
    expect(scaled.apparentAttenuation).toBe(0.77);
    expect(scaled.boilTimeMin).toBe(60);
    expect(scaled.malts.map((m) => [m.name, m.fgdb, m.colorL, m.type])).toEqual(
      before.malts.map((m) => [m.name, m.fgdb, m.colorL, m.type]),
    );
    expect(scaled.kettleAdditions.map((a) => [a.name, a.timeMin, a.wortTempF, a.alphaAcidFraction])).toEqual(
      before.kettleAdditions.map((a) => [a.name, a.timeMin, a.wortTempF, a.alphaAcidFraction]),
    );
    expect(scaled.yeast).toEqual(before.yeast);
    expect(scaled.measurementTempF).toEqual(before.measurementTempF);
    expect(scaled.water.source).toEqual(before.water.source);
    expect(scaled.water.absorptionQtPerLb).toBe(0.1);
    expect([scaled.name, scaled.water.styleId, scaled.water.treatment, scaled.water.spargeMethod]).toEqual([
      'Pale',
      'hoppy_ale',
      'tank',
      'batch',
    ]);

    // The recipe it was given is unchanged.
    expect(before).toEqual(recipe());

    // OG, FG, ABV, SRM and IBU unchanged through the engine's forward
    // calculation (SPEC rule 4's tolerances: SG 1e-6, SRM / IBU 1e-4).
    const a = forward(before);
    const b = forward(scaled);
    expect(Math.abs(b.grist.OG - a.grist.OG)).toBeLessThan(1e-6);
    expect(Math.abs(b.grist.FG - a.grist.FG)).toBeLessThan(1e-6);
    expect(Math.abs(b.grist.ABV - a.grist.ABV)).toBeLessThan(1e-6);
    expect(Math.abs(b.grist.SRM - a.grist.SRM)).toBeLessThan(1e-4);
    expect(b.hops.totalIBU).toBe(a.hops.totalIBU);
    b.hops.additions.forEach((x, i) => expect(Math.abs(x.ibu - a.hops.additions[i].ibu)).toBeLessThan(1e-4));
    expect(Math.abs(b.hops.dryHopRatio - a.hops.dryHopRatio)).toBeLessThan(1e-9);
  });

  it('scaling back returns the recipe', () => {
    const before = recipe();
    const back = scaleRecipe(scaleRecipe(before, 310), 5.5);
    expect(back.fermentVolGal).toBe(5.5);
    const near = (x, y) => expect(Math.abs(x - y)).toBeLessThan(1e-12 * Math.max(1, Math.abs(y)));
    back.malts.forEach((m, i) => near(m.weightLb, before.malts[i].weightLb));
    back.kettleAdditions.forEach((h, i) => near(h.weightOz, before.kettleAdditions[i].weightOz));
    back.dryHops.forEach((h, i) => near(h.weightOz, before.dryHops[i].weightOz));
    for (const k of ['mashWaterGal', 'preBoilVolGal', 'boilOffRateGalPerHr']) near(back[k], before[k]);
    for (const k of ['spargeGal', 'tankTreatedGal', 'tankTopUpGal']) near(back.water[k], before.water[k]);
    near(back.water.saltOverrides.gypsum, 2);
    near(back.water.acidAmounts.lactic_88, 1.5);
    near(back.water.acidAmounts.acidulated_malt, 30);
  });

  it('a blank amount stays blank, and amounts that follow the recommendation stay so', () => {
    const r = recipe();
    r.malts[1].weightLb = NaN;
    r.water.spargeGal = NaN;
    r.water.acidAmounts = null;
    r.water.saltOverrides = {};
    const scaled = scaleRecipe(r, 310);
    expect(scaled.malts[1].weightLb).toBeNaN();
    expect(scaled.water.spargeGal).toBeNaN();
    expect(scaled.water.acidAmounts).toBeNull();
    expect(scaled.water.saltOverrides).toEqual({});
  });
});
