// water-back.test.js
// Scenarios for batch S15b, "Water back" (docs/items/water-back.md, WB-S2,
// WB-S3, WB-S9, WB-Q3): hot-liquor-tank water added to the fermenter after
// knock-out spreads the knock-out's extract, colour and bitterness over the
// volume at pitch. Water back is not in Rev 4, so every figure is worked by
// hand here (CLAUDE.md, Models: the residual risk), not read from the code.
//
// The owner's example: knock out 400 gal, add 78 gal of tank water, 478 gal
// in the fermenter at pitch (both at 60 °F).
//
// The extract balance: the sugar is kept across the dilution. Its mass is
// °P / 100 x SG x the density of water x the volume, so
//   °P_pitch x SG_pitch x V_pitch = °P_ko x SG_ko x V_ko,
// SG from °P by the engine's ASBC formula, SG = 1 + P / (258.6 - (P / 258.2) x 227.1).
// Worked by hand with that formula solved as a quadratic (the code solves it
// another way): with k = 227.1 / 258.2 and K = °P_ko x SG_ko x V_ko / V_pitch,
//   P + P^2 / (258.6 - kP) = K  ->  (1 - k) P^2 + (258.6 + kK) P - 258.6 K = 0,
// the positive root.
//
// Knock-out at 12 °P:
//   258.6 - (12 / 258.2) x 227.1 = 258.6 - 10.55460883 = 248.04539117
//   SG_ko = 1 + 12 / 248.04539117 = 1.04837824216
//   12 x 1.04837824216 = 12.58053890589
//   K = 12.58053890589 x 400 / 478 = 10.52764761999
//   1 - k = 1 - 0.87955073586 = 0.12044926414
//   258.6 + kK = 258.6 + 0.87955073586 x 10.52764761999 = 267.85960021108
//   258.6 K = 2722.44967452924
//   discriminant = 267.85960021108^2 + 4 x 0.12044926414 x 2722.44967452924
//                = 71748.76543 + 1311.66824 = 73060.43366502
//   sqrt = 270.29693609995
//   °P_pitch = (270.29693609995 - 267.85960021108) / (2 x 0.12044926414)
//            = 2.43733588887 / 0.24089852828 = 10.11768692132
//   SG_pitch = 1 + 10.11768692132 / (258.6 - (10.11768692132 / 258.2) x 227.1)
//            = 1 + 10.11768692132 / 249.70098102 = 1.04051921174
//   check: 10.11768692132 x 1.04051921174 = 10.52764762 = K
// The gravity-points balance, (SG - 1) x V kept, would give
// 1 + 0.04837824216 x 400 / 478 = 1.04048388465, 3.5e-5 lower: the exact
// balance is the rule (docs/items/water-back.md, notes).
//
// FG and ABV at pitch, by the engine's own formulas (grist.js) on the OG at
// pitch, attenuation 0.77:
//   FG = 1.04051921174 - 0.77 x 0.04051921174 = 1.00931941870
//   ABV = 76.08 x (1.04051921174 - 1.00931941870) / (1.775 - 1.04051921174)
//         x (1.00931941870 / 0.794) / 100
//       = 76.08 x 0.03119979304 / 0.73448078826 x 1.27118314698 / 100
//       = 0.04108184154
//
// Colour: the malt colour units at knock-out are those of the post-boil
// wort (wort lost after the boil leaves at its own colour), spread over the
// volume at pitch; then Morey's SRM = 1.4922 x MCU^0.6859 (Rev 4, I4).
// Morey is not linear, so the SRM at pitch is not the knock-out SRM times
// the ratio. MCU 10 at knock-out:
//   MCU_pitch = 10 x 400 / 478 = 8.36820083682
//   SRM_pitch = 1.4922 x 8.36820083682^0.6859
//             = 1.4922 x exp(0.6859 x ln 8.36820083682)
//             = 1.4922 x exp(0.6859 x 2.12443891) = 1.4922 x 4.29371638 = 6.40708358
//   (the knock-out SRM, 1.4922 x 10^0.6859 = 7.23980778, times 400 / 478
//   would be 6.05841655: not the rule)
//
// Bitterness: the knock-out IBU (the unrounded sum of the additions) times
// knock-out over pitch volume, then rounded as the engine rounds the total:
//   40.6 x 400 / 478 = 33.97489540 -> 34

import { describe, it, expect } from 'vitest';
import { computeWaterBack, computeGrist, computeHops, platoToSg } from '../src/index.js';

const owner = (over = {}) => ({
  knockOutGal: 400,
  waterBackGal: 78,
  plato: 12,
  mcu: 10,
  ibu: 40.6,
  apparentAttenuation: 0.77,
  ...over,
});

describe('water back — the engine (WB-S2, WB-S3)', () => {
  it('the extract at knock-out is spread over the volume at pitch', () => {
    const p = computeWaterBack(owner());
    expect(p.pitchGal).toBe(478);
    // The knock-out OG from the stated 12 °P, by hand above.
    expect(platoToSg(12)).toBeCloseTo(1.04837824216, 9);
    expect(p.plato).toBeCloseTo(10.11768692132, 8);
    expect(p.OG).toBeCloseTo(1.04051921174, 9);
    expect(p.FG).toBeCloseTo(1.0093194187, 9);
    expect(p.ABV).toBeCloseTo(0.04108184154, 9);
    // Not the gravity-points balance.
    expect(Math.abs(p.OG - 1.04048388465)).toBeGreaterThan(1e-6);
  });

  it("colour is Morey's of the malt colour units over the volume at pitch", () => {
    const p = computeWaterBack(owner());
    expect(p.mcu).toBeCloseTo(8.36820083682, 9);
    expect(p.SRM).toBeCloseTo(6.40708358, 6);
    expect(Math.abs(p.SRM - 6.05841655)).toBeGreaterThan(1e-4);
  });

  it('bitterness is the knock-out IBU times knock-out over pitch volume', () => {
    const p = computeWaterBack(owner());
    expect(p.ibu).toBeCloseTo(33.9748954, 6);
    expect(p.totalIBU).toBe(34);
  });

  it('a blank water back or knock-out volume blanks every figure at pitch (WB-S10)', () => {
    for (const over of [{ waterBackGal: NaN }, { knockOutGal: NaN }]) {
      const p = computeWaterBack(owner(over));
      for (const k of ['pitchGal', 'plato', 'OG', 'FG', 'ABV', 'mcu', 'SRM', 'ibu', 'totalIBU']) {
        expect(Number.isNaN(p[k]), k).toBe(true);
      }
    }
  });
});

// The golden master's recipe (golden-master.test.js), knocked out at 12 gal.
describe('water back — no water back changes nothing (WB-S9)', () => {
  const grist = computeGrist({
    malts: [
      { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
      { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
    ],
    efficiency: 0.93,
    preBoilVolGal: 16,
    postBoilVolGal: 14.5,
    mashWaterGal: 13,
    apparentAttenuation: 0.8,
  });
  const hops = computeHops({
    kettleAdditions: [
      { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 },
      { name: 'Helios', timeMin: 30, wortTempF: 204, weightOz: 1, alphaAcidFraction: 0.19 },
      { name: 'Citra LupoMAX', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.18 },
      { name: 'Hopstiener 9326', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.06 },
      { name: 'Helios', timeMin: 20, wortTempF: 175, weightOz: 1, alphaAcidFraction: 0.19 },
    ],
    preBoilSg: grist.preBoilSg,
    postBoilVolGal: 14.5,
    dryHops: [{ weightOz: 15 }],
    fermentVolGal: 12,
  });

  it("the golden master's figures with water back 0", () => {
    const p = computeWaterBack({
      knockOutGal: 12,
      waterBackGal: 0,
      plato: grist.postBoilPlato,
      mcu: grist.sumMcu,
      ibu: hops.sumIBU,
      apparentAttenuation: 0.8,
    });
    expect(p.pitchGal).toBe(12);
    // Rev 4's cells, at the golden master's tolerances (SPEC 4).
    expect(p.plato).toBeCloseTo(16.7884887, 4);
    expect(p.OG).toBeCloseTo(1.0688522, 6);
    expect(p.FG).toBeCloseTo(1.0137704, 6);
    expect(p.ABV).toBeCloseTo(0.0757708, 4);
    expect(p.SRM).toBeCloseTo(4.1048543, 4);
    expect(p.totalIBU).toBe(46);
    // And the knock-out's own, as the engine gives them.
    expect(p.SRM).toBe(grist.SRM);
    expect(p.totalIBU).toBe(hops.totalIBU);
    expect(p.OG).toBeCloseTo(grist.OG, 12);
  });

  it("with water back off, the knock-out figures are the golden master's", () => {
    expect(grist.OG).toBeCloseTo(1.0688522, 6);
    expect(grist.SRM).toBeCloseTo(4.1048543, 4);
    expect(hops.totalIBU).toBe(46);
    expect(hops.dryHopRatio).toBeCloseTo(1.25, 6);
  });
});
