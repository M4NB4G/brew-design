// mash-ph.test.js
// Scenarios for "Mash pH from the grain bill", item 1 (docs/items/mash-ph.md):
// the model in the engine (MP-S1, MP-S2 as S5-B12 to B15 settle it, MP-S5).
// The model is Kai Troester's, as his 2009 paper publishes it
// (docs/sources/effect_of_water_and_grist_on_mash_pH.pdf):
//   grist pH  = sum(base pH x share) + 5.7 x sum(specialty share)
//               - 0.14 x sum(specialty acidity x share) / R          (§3.5)
//   mash pH   = grist pH + (0.013 x R + 0.013) x residual alkalinity (§3.6, §3.10)
//   crystal acidity = 14 + 0.13 x EBC mEq/kg (§3.3); roast about 40 (§3.3);
//   EBC = 2.65 x degL - 1.2 (§2)
// with R the mash thickness in L/kg and the residual alkalinity in mEq/L.
// Every figure below is worked out by hand with the working beside it
// (CLAUDE.md, Models: the hand-pin rule); none is copied from the code's
// output. Unit factors are the engine's own: 3.785411784 L per US gal and
// 453.592 g per lb (16 x 28.3495), and 50.04 mg/L as CaCO3 per mEq/L, the
// figure the engine's acid sums use.

import { describe, it, expect } from 'vitest';
import * as engine from '../../src/index.js';

// 10 lb of grain in 4 gal of mash water. By hand: 4 x 3.785411784 =
// 15.141647136 L; 10 x 0.453592 = 4.53592 kg; R = 15.141647136 / 4.53592 =
// 3.33816450378314 L/kg. Soft water (no alkalinity, calcium or magnesium):
// residual alkalinity 0, so the mash pH is the grist's distilled-water pH.
const MASH_GAL = 4;
const NO_MINERALS = { Alk: 0, Ca: 0, Mg: 0 };
const R_10LB_4GAL = 3.33816450378314;

const malt = (type, weightLb, extra = {}) => ({ type, weightLb, colorL: NaN, ...extra });

describe('mash pH from the grain bill — the engine', () => {
  it("each malt family's figures are the published ones", () => {
    const { mashPh } = engine;
    const ph = (malts, water = NO_MINERALS) => mashPh({ malts, mashWaterGal: MASH_GAL, water });

    // Base malt (S5-B16): the trend line of the paper's Figure 5, distilled-
    // water pH = 5.82 - 0.02 x EBC, as the figure prints it. 2.2 degL = 2.65 x
    // 2.2 - 1.2 = 4.63 EBC; 5.82 - 0.02 x 4.63 = 5.82 - 0.0926 = 5.7274.
    // 10 degL = 2.65 x 10 - 1.2 = 25.3 EBC; 5.82 - 0.506 = 5.314.
    expect(ph([malt('base', 10, { colorL: 2.2 })])).toBeCloseTo(5.7274, 12);
    expect(ph([malt('base', 10, { colorL: 10 })])).toBeCloseTo(5.314, 12);
    // Half and half: (5.7274 + 5.314) / 2 = 5.5207.
    expect(ph([malt('base', 5, { colorL: 2.2 }), malt('base', 5, { colorL: 10 })])).toBeCloseTo(5.5207, 12);

    // A measured distilled-water pH replaces the line (S5-B13); on soft water
    // the mash pH is that figure.
    expect(ph([malt('base', 10, { colorL: 2.2, distilledWaterPh: 5.75 })])).toBeCloseTo(5.75, 12);

    // Crystal (S5-B14): 40 degL = 2.65 x 40 - 1.2 = 104.8 EBC; acidity
    // 14 + 0.13 x 104.8 = 27.624 mEq/kg. All crystal: 5.7 - 0.14 x 27.624 / R
    // = 5.7 - 3.86736 / 3.33816450378314 = 4.54147111515411.
    expect(ph([malt('crystal', 10, { colorL: 40 })])).toBeCloseTo(4.54147111515411, 10);

    // Roast (S5-B14): about 40 mEq/kg at any colour. 5.7 - 0.14 x 40 / R =
    // 5.7 - 5.6 / 3.33816450378314 = 4.02243138597468, at 300 degL and at 600.
    expect(ph([malt('roast', 10, { colorL: 300 })])).toBeCloseTo(4.02243138597468, 10);
    expect(ph([malt('roast', 10, { colorL: 600 })])).toBeCloseTo(4.02243138597468, 10);

    // Acidulated (S5-B14): its lactic acid at the Water tab's 2 % by weight:
    // 0.02 x 1000 g/kg / 90.08 g/mol x 1000 = 222.024866785080 mEq/kg.
    // 2 % of the grist (9.8 lb base at 5.76, 0.2 lb acidulated):
    // 5.76 x 0.98 + 5.7 x 0.02 - 0.14 x 222.024866785080 x 0.02 / R
    // = 5.6448 + 0.114 - 0.621669626998224 / 3.33816450378314 = 5.57256902597410.
    expect(
      ph([malt('base', 9.8, { distilledWaterPh: 5.76 }), malt('acidulated', 0.2)]),
    ).toBeCloseTo(5.5725690259741, 10);

    // The water (S5-B15): 100 mg/L alkalinity as CaCO3, no calcium or
    // magnesium: residual alkalinity 100 / 50.04 = 1.99840127897682 mEq/L;
    // slope 0.013 x 3.33816450378314 + 0.013 = 0.0563961385491808;
    // 5.75 + 0.0563961385491808 x 1.99840127897682 = 5.86270211540604.
    expect(
      ph([malt('base', 10, { distilledWaterPh: 5.75 })], { Alk: 100, Ca: 0, Mg: 0 }),
    ).toBeCloseTo(5.86270211540604, 10);
  });

  it('the mash pH balances the grain, the water and the acid', () => {
    const { mashPh, predictFinalProfile } = engine;

    // A worked batch: 9 lb of Pilsner (distilled-water pH 5.76) and 1 lb of
    // 60 degL crystal in 3.5 gal of mash water, the water 60 mg/L alkalinity
    // as CaCO3, 50 mg/L calcium, 10 mg/L magnesium.
    //   R = 3.5 x 3.785411784 / (10 x 0.453592) = 13.248941244 / 4.53592
    //     = 2.92089394081024 L/kg
    //   crystal: 2.65 x 60 - 1.2 = 157.8 EBC; 14 + 0.13 x 157.8 = 34.514 mEq/kg
    //   grist pH = 5.76 x 0.9 + 5.7 x 0.1 - 0.14 x 34.514 x 0.1 / R
    //            = 5.184 + 0.57 - 0.483196 / 2.92089394081024 = 5.58857256244437
    //   residual alkalinity (the Water tab's, Kolbach): 60 - 50/1.4 - 10/1.7
    //            = 60 - 35.7142857142857 - 5.88235294117647 = 18.4033613445378
    //            mg/L as CaCO3 = 18.4033613445378 / 50.04 = 0.367773008483969 mEq/L
    //   slope = 0.013 x 2.92089394081024 + 0.013 = 0.0509716212305332
    //   mash pH = 5.58857256244437 + 0.0509716212305332 x 0.367773008483969
    //           = 5.60731854893163
    const malts = [
      malt('base', 9, { distilledWaterPh: 5.76 }),
      malt('crystal', 1, { colorL: 60 }),
    ];
    const water = { Alk: 60, Ca: 50, Mg: 10 };
    expect(mashPh({ malts, mashWaterGal: 3.5, water })).toBeCloseTo(5.60731854893163, 10);

    // Rice hulls and sugars count as nothing in the mash (S5-B10): neither
    // their weight nor a blank figure of theirs changes the pH.
    const withHulls = [...malts, malt('none', 1), malt('none', NaN)];
    expect(mashPh({ malts: withHulls, mashWaterGal: 3.5, water })).toBeCloseTo(5.60731854893163, 10);

    // The acid is in the water: the treated profile the Water tab predicts
    // (MP-Q6) carries it as lost alkalinity. 10 mL of 10 % phosphoric acid
    // in 10 gal: the engine's acid figures (density 1.054 g/mL, 10 % by
    // weight, 97.99 g/mol, one proton: MP-Q7) give 10 x 1.054 x 0.10 x 1000
    // / 97.99 = 10.7561996122053 mEq; over 37.85411784 L = 0.284148732713020
    // mEq/L, or 0.284148732713020 x 50.04 = 14.2188025849595 mg/L as CaCO3
    // off the alkalinity. The mash pH falls by slope x 0.284148732713020 =
    // 0.0509716212305332 x 0.284148732713020 = 0.0144835215769841.
    const treated = predictFinalProfile({
      source: { Ca: 50, Mg: 10, Alkalinity: 60 },
      additions: {},
      acids: { phosphoric_10: 10 },
      volumeGallons: 10,
    });
    expect(mashPh({ malts, mashWaterGal: 3.5, water: treated })).toBeCloseTo(
      5.60731854893163 - 0.0144835215769841,
      10,
    );
  });

  it("lab figures replace the model's", () => {
    const { mashPh } = engine;
    const ph = (malts) => mashPh({ malts, mashWaterGal: MASH_GAL, water: NO_MINERALS });

    // A crystal malt with a measured acidity of 30 mEq/kg uses it, not the
    // colour rule: 5.7 - 0.14 x 30 / R = 5.7 - 4.2 / 3.33816450378314
    // = 4.44182353948101 (the rule at 40 degL would give 4.54147111515411).
    expect(ph([malt('crystal', 10, { colorL: 40, acidityMeqPerKg: 30 })])).toBeCloseTo(4.44182353948101, 10);

    // 8 lb of base malt measured at 5.6, 1 lb of crystal measured at 30, 1 lb
    // of roast measured at 35: 5.6 x 0.8 + 5.7 x 0.2 - 0.14 x (30 x 0.1 +
    // 35 x 0.1) / R = 4.48 + 1.14 - 0.91 / 3.33816450378314 = 5.34739510022088.
    expect(
      ph([
        malt('base', 8, { distilledWaterPh: 5.6 }),
        malt('crystal', 1, { colorL: 40, acidityMeqPerKg: 30 }),
        malt('roast', 1, { colorL: 500, acidityMeqPerKg: 35 }),
      ]),
    ).toBeCloseTo(5.34739510022088, 10);

    // A measured crystal malt needs no colour.
    expect(ph([malt('crystal', 10, { colorL: NaN, acidityMeqPerKg: 30 })])).toBeCloseTo(4.44182353948101, 10);
    expect(R_10LB_4GAL).toBeCloseTo((4 * 3.785411784) / (10 * 0.453592), 12);
  });

  it('a blank figure blanks the pH', () => {
    const { mashPh } = engine;
    const good = [malt('base', 9, { distilledWaterPh: 5.76 }), malt('crystal', 1, { colorL: 60 })];
    const water = { Alk: 60, Ca: 50, Mg: 10 };
    const ph = (over) => mashPh({ malts: good, mashWaterGal: 3.5, water, ...over });

    expect(ph({})).not.toBeNaN();
    // A base malt with neither a colour nor a measured distilled-water pH.
    expect(ph({ malts: [malt('base', 9, { colorL: NaN }), good[1]] })).toBeNaN();
    expect(ph({ malts: [malt('base', 9, { colorL: 2 }), good[1]] })).not.toBeNaN();
    // A malt with no type, or one the model does not know (MP-S5, MP-Q8).
    expect(ph({ malts: [good[0], malt('', 1, { colorL: 60 })] })).toBeNaN();
    expect(ph({ malts: [good[0], malt('flaked', 1, { colorL: 60 })] })).toBeNaN();
    // A blank weight, or a crystal malt with neither colour nor measured acidity.
    expect(ph({ malts: [malt('base', NaN, { distilledWaterPh: 5.76 }), good[1]] })).toBeNaN();
    expect(ph({ malts: [good[0], malt('crystal', 1, { colorL: NaN })] })).toBeNaN();
    // The mash water, or a test result the water needs.
    expect(ph({ mashWaterGal: NaN })).toBeNaN();
    expect(ph({ water: { ...water, Alk: NaN } })).toBeNaN();
    expect(ph({ water: { ...water, Ca: NaN } })).toBeNaN();
    expect(ph({ water: { ...water, Mg: NaN } })).toBeNaN();
    // No grain in the mash at all.
    expect(ph({ malts: [] })).toBeNaN();
    expect(ph({ malts: [malt('none', 1)] })).toBeNaN();
  });

  it("the owner's logged batches", () => {
    // MP-S4, MP-Q11: each usable batch from the owner's brewing logs (his
    // Data Logs folder, kept out of the repository: S5-B11; each names its log
    // file there), its predicted
    // mash pH pinned by hand beside its measured cooled-sample pH (S5-B7). No
    // pass/fail line is set on the difference: the owner judges it.
    // Each batch's water: its report as S5-B8 picks it (Ca and Mg from the
    // report's hardness by the owner's template, Ca = Ca hardness x 0.4, Mg =
    // Mg hardness x 0.24), the salts and 10 % phosphoric acid dissolved in the
    // 14 gal hot-liquor-tank fill (S5-B9), the mash drawing its logged volume.
    // Salt figures are the engine's (Palmer & Kaminski, per g/gal): gypsum Ca
    // 61.5, calcium chloride Ca 72.0, Epsom Mg 26.0, baking soda HCO3 191.7 x
    // 50.04 / 61.02 as CaCO3; the acid 1.054 x 0.10 x 1000 / 97.99 mEq/mL.
    // Malts by the workbook's colour (degL); base malts by the line (S5-B16);
    // Aromatic and Special Roast as crystal at 14.2 and 25.6 mEq/kg (S5-B19,
    // B20); hulls and dextrose count as nothing (S5-B10).
    const { mashPh, predictFinalProfile } = engine;
    const TANK_GAL = 14;
    for (const b of OWNER_BATCHES) {
      const treated = predictFinalProfile({
        source: b.water,
        additions: b.salts,
        acids: { phosphoric_10: b.acidMl },
        volumeGallons: TANK_GAL,
      });
      const predicted = mashPh({ malts: b.malts, mashWaterGal: b.mashWaterGal, water: treated });
      expect(predicted, b.name).toBeCloseTo(b.predicted, 9);
    }
    expect(OWNER_BATCHES).toHaveLength(15);
  });
});

// The owner's logged batches (S5-B1 to B21), oldest first.
const OWNER_BATCHES = [
    {
      // 2022-06-11 Holy Hefe. Measured 5.30 (cooled sample).
      // Water: the log's own report, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 57.0428571428571, Mg 8.06428571428571, alkalinity 29.5311373179439 after 30 mL acid;
      // RA -15.9574581202314 = -0.318894047166895 mEq/L.
      // R = 11.334 x 3.785411784 / (20 x 0.453592) = 4.72934456073476; slope 0.0744814792895518.
      // NorthStar 8 lb base 2 L = 4.1 EBC -> 5.738.
      // WhiteWheat 12 lb base 3 L = 6.75 EBC -> 5.685.
      // Grist 5.7062 + 0.0744814792895518 x -0.318894047166895 = 5.68244829963038.
      name: "2022-06-11 Holy Hefe",
      log: "Hefeweizen/20220611 Holy Hefe/20220611 Hefe Brew and Ferment Logs.xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 2.4 },
      salts: { gypsum: 2, calcium_chloride: 7.05, epsom: 3.05 },
      acidMl: 30,
      mashWaterGal: 11.334,
      malts: [
        { name: "Pilsner, Northstar", type: 'base', weightLb: 8, colorL: 2 },
        { name: "White Wheat Malt", type: 'base', weightLb: 12, colorL: 3 },
        { name: "Rice Hulls", type: 'none', weightLb: 1, colorL: 0 },
      ],
      measured: 5.3,
      predicted: 5.68244829963038,
    },
    {
      // 2022-09-05 Marple Hill Wet Hop IPA. Measured 5.40 (cooled sample).
      // Water: the log's own report, alkalinity 70 as CaCO3, Ca 30 x 0.4 = 12, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 67.0960714285714, Mg 6.11428571428571, alkalinity 60.8593411953832 after 9 mL acid;
      // RA 9.33693723379853 = 0.186589473097493 mEq/L.
      // R = 11.5 x 3.785411784 / (22.1 x 0.453592) = 4.34263481826992; slope 0.0694542526375089.
      // TwoRow 13.6 lb base 2.2 L = 4.63 EBC -> 5.7274.
      // MunichT1 8.5 lb base 6.9 L = 17.085 EBC -> 5.4783.
      // Grist 5.63159230769231 + 0.0694542526375089 x 0.186589473097493 = 5.64455174009632.
      name: "2022-09-05 Marple Hill Wet Hop IPA",
      log: "IPA/20220905 Marple Hill Wet Hop IPA/20220905 Wet Hop IPA Brew and Ferment Logs.xlsx",
      water: { Alkalinity: 70, Ca: 12, Mg: 2.4 },
      salts: { gypsum: 9.03, calcium_chloride: 3, epsom: 2 },
      acidMl: 9,
      mashWaterGal: 11.5,
      malts: [
        { name: "2-Row Brewers Malt", type: 'base', weightLb: 13.6, colorL: 2.2 },
        { name: "Munich Type 1", type: 'base', weightLb: 8.5, colorL: 6.9 },
      ],
      measured: 5.4,
      predicted: 5.64455174009632,
    },
    {
      // 2022-09-27 Holy Hefe. Measured 5.78 (cooled sample).
      // Water: the log's own report, alkalinity 50 as CaCO3, Ca 20 x 0.4 = 8, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 52.7857142857143, Mg 7.97142857142857, alkalinity 26.6405386104236 after 23 mL acid;
      // RA -15.7526186524815 = -0.314800532623532 mEq/L.
      // R = 11 x 3.785411784 / (20 x 0.453592) = 4.58997619270181; slope 0.0726696905051235.
      // NorthStar 8 lb base 2 L = 4.1 EBC -> 5.738.
      // WhiteWheat 12 lb base 3 L = 6.75 EBC -> 5.685.
      // Grist 5.7062 + 0.0726696905051235 x -0.314800532623532 = 5.6833235427234.
      name: "2022-09-27 Holy Hefe",
      log: "Hefeweizen/20220927 Holy Hefe/20220927 Hefe Brew and Ferment Logs.xlsx",
      water: { Alkalinity: 50, Ca: 8, Mg: 2.4 },
      salts: { gypsum: 2, calcium_chloride: 7, epsom: 3 },
      acidMl: 23,
      mashWaterGal: 11,
      malts: [
        { name: "Pilsner, Northstar", type: 'base', weightLb: 8, colorL: 2 },
        { name: "White Wheat Malt", type: 'base', weightLb: 12, colorL: 3 },
        { name: "Rice Hulls", type: 'none', weightLb: 1, colorL: 0 },
      ],
      measured: 5.78,
      predicted: 5.6833235427234,
    },
    {
      // 2022-10-17 Orange Grenade JPA. Measured 5.78 (cooled sample).
      // Water: Home 2022-09-23, alkalinity 50 as CaCO3, Ca 20 x 0.4 = 8, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 63.0714285714286, Mg 7.97142857142857, alkalinity 24.6092810982866 after 25 mL acid;
      // RA -25.1308149401288 = -0.502214527180832 mEq/L.
      // R = 11 x 3.785411784 / (21.2 x 0.453592) = 4.33016621953001; slope 0.0692921608538901.
      // GP 21.2 lb base 2.2 L = 4.63 EBC -> 5.7274.
      // Grist 5.7274 + 0.0692921608538901 x -0.502214527180832 = 5.69260047019943.
      name: "2022-10-17 Orange Grenade JPA",
      log: "Juicy Pale Ale/20221017 Orange Grenade JPA/20221017 JPA Brew and Ferment Logs.xlsx",
      water: { Alkalinity: 50, Ca: 8, Mg: 2.4 },
      salts: { gypsum: 2, calcium_chloride: 9, epsom: 3 },
      acidMl: 25,
      mashWaterGal: 11,
      malts: [
        { name: "Golden Promise Pale Malt", type: 'base', weightLb: 21.2, colorL: 2.2 },
      ],
      measured: 5.78,
      predicted: 5.69260047019943,
    },
    {
      // 2022-12-10 Night is Darkest B-IPA. Measured 6.05 (cooled sample).
      // Water: Home 2022-09-23, alkalinity 50 as CaCO3, Ca 20 x 0.4 = 8, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 65.2142857142857, Mg 7.97142857142857, alkalinity 128.602654867257 after 0 mL acid;
      // RA 77.3319465839433 = 1.54540260959119 mEq/L.
      // R = 12 x 3.785411784 / (26.2 x 0.453592) = 3.82232576769061; slope 0.062690234979978.
      // GP 25 lb base 2.2 L = 4.63 EBC -> 5.7274.
      // MidnightWheat 1.2 lb roast acidity 40 mEq/kg.
      // Grist 5.65904229360693 + 0.062690234979978 x 1.54540260959119 = 5.75592394634087.
      name: "2022-12-10 Night is Darkest B-IPA",
      log: "IPA/20221209 Night is Darkest B-IPA/20221210 BIPA Brewing Data Log.xlsx",
      water: { Alkalinity: 50, Ca: 8, Mg: 2.4 },
      salts: { gypsum: 6, calcium_chloride: 6, epsom: 3, baking_soda: 7 },
      acidMl: 0,
      mashWaterGal: 12,
      malts: [
        { name: "Golden Promise Pale Malt", type: 'base', weightLb: 25, colorL: 2.2 },
        { name: "Midnight Wheat", type: 'roast', weightLb: 1.2, colorL: 550 },
      ],
      measured: 6.05,
      predicted: 5.75592394634087,
    },
    {
      // 2023-01-21 O'Neill Kolsch. Measured 5.95 (cooled sample).
      // Water: Home 2022-12-31, alkalinity 70 as CaCO3, Ca 30 x 0.4 = 12, Mg 20 x 0.24 = 4.8.
      // Treated in 14 gal: Ca 50.8928571428571, Mg 8.51428571428571, alkalinity 16.1716759283675 after 53 mL acid;
      // RA -25.1887682493036 = -0.503372666852589 mEq/L.
      // R = 11 x 3.785411784 / (17.5 x 0.453592) = 5.2456870773735; slope 0.0811939320058555.
      // NorthStar 16 lb base 2 L = 4.1 EBC -> 5.738.
      // MunichT1 1 lb base 6.9 L = 17.085 EBC -> 5.4783.
      // Carafoam 0.5 lb crystal acidity 14.533 mEq/kg.
      // Grist 5.71099241995627 + 0.0811939320058555 x -0.503372666852589 = 5.67012161387024.
      name: "2023-01-21 O'Neill Kolsch",
      log: "Lagers & Hybrids/20230121 O'Neill Kolsch/20230121 Kolsch Brewing Log.xlsx",
      water: { Alkalinity: 70, Ca: 12, Mg: 4.8 },
      salts: { gypsum: 3, calcium_chloride: 5, epsom: 2 },
      acidMl: 53,
      mashWaterGal: 11,
      malts: [
        { name: "Pilsner, Northstar", type: 'base', weightLb: 16, colorL: 2 },
        { name: "Munich Type 1", type: 'base', weightLb: 1, colorL: 6.9 },
        { name: "Carafoam", type: 'crystal', weightLb: 0.5, colorL: 2 },
      ],
      measured: 5.95,
      predicted: 5.67012161387024,
    },
    {
      // 2023-03-15 Best Bitter. Measured 5.87 (cooled sample).
      // Water: Home 2022-12-31, alkalinity 70 as CaCO3, Ca 30 x 0.4 = 12, Mg 20 x 0.24 = 4.8.
      // Treated in 14 gal: Ca 62.5714285714286, Mg 10.3714285714286, alkalinity 81.2289506953224 after 0 mL acid;
      // RA 30.4342328081675 = 0.608198097685202 mEq/L.
      // R = 9 x 3.785411784 / (18 x 0.453592) = 4.17270562972892; slope 0.0672451731864759.
      // GP 16 lb base 2.2 L = 4.63 EBC -> 5.7274.
      // Aromatic 0.8 lb crystal acidity 14.2 mEq/kg.
      // C120 0.8 lb crystal acidity 55.184 mEq/kg.
      // SpecialRoast 0.4 lb crystal acidity 25.6 mEq/kg.
      // Grist 5.60180506757773 + 0.0672451731864759 x 0.608198097685202 = 5.64270345398826.
      name: "2023-03-15 Best Bitter",
      log: "English Ale/20230315 Best Bitter/20230315 Best Bitter.xlsx",
      water: { Alkalinity: 70, Ca: 12, Mg: 4.8 },
      salts: { gypsum: 8, calcium_chloride: 3, epsom: 3, baking_soda: 1 },
      acidMl: 0,
      mashWaterGal: 9,
      malts: [
        { name: "Golden Promise Pale Malt", type: 'base', weightLb: 16, colorL: 2.2 },
        { name: "Aromatic Malt", type: 'crystal', weightLb: 0.8, colorL: 20, acidityMeqPerKg: 14.2 },
        { name: "American Crystal 120", type: 'crystal', weightLb: 0.8, colorL: 120 },
        { name: "Special Roast Malt", type: 'crystal', weightLb: 0.4, colorL: 40, acidityMeqPerKg: 25.6 },
      ],
      measured: 5.87,
      predicted: 5.64270345398826,
    },
    {
      // 2023-06-17 Hop Rapids. Measured 5.60 (cooled sample).
      // Water: Home 2023-06-17, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 71.3571428571429, Mg 7.97142857142857, alkalinity 60 after 0 mL acid;
      // RA 4.34153661464585 = 0.0867613232343296 mEq/L.
      // R = 10 x 3.785411784 / (26 x 0.453592) = 3.20977356132994; slope 0.0547270562972892.
      // GP 21 lb base 2.2 L = 4.63 EBC -> 5.7274.
      // Bonlander 3.5 lb base 10 L = 25.3 EBC -> 5.314.
      // C40 1 lb crystal acidity 27.624 mEq/kg.
      // C80 0.5 lb crystal acidity 41.404 mEq/kg.
      // Grist 5.58909904992784 + 0.0547270562972892 x 0.0867613232343296 = 5.59384724174892.
      name: "2023-06-17 Hop Rapids",
      log: "IPA/20230617 Hop Rapids Data Log/20230615 Hop Rapids Data Log .xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 2.4 },
      salts: { gypsum: 10, calcium_chloride: 3, epsom: 3 },
      acidMl: 0,
      mashWaterGal: 10,
      malts: [
        { name: "Golden Promise Pale Malt", type: 'base', weightLb: 21, colorL: 2.2 },
        { name: "Bonlander Munich", type: 'base', weightLb: 3.5, colorL: 10 },
        { name: "American Crystal 40", type: 'crystal', weightLb: 1, colorL: 40 },
        { name: "American Crystal 80", type: 'crystal', weightLb: 0.5, colorL: 80 },
      ],
      measured: 5.6,
      predicted: 5.59384724174892,
    },
    {
      // 2023-07-08 Belgian Single. Measured 5.79 (cooled sample).
      // Water: Home 2023-06-17, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 55.2857142857143, Mg 7.97142857142857, alkalinity 18.35922100119 after 41 mL acid;
      // RA -25.8196505474295 = -0.515980226767176 mEq/L.
      // R = 9 x 3.785411784 / (20.5 x 0.453592) = 3.66383908951808; slope 0.060629908163735.
      // Dingemans 20 lb base 2.5 L = 5.425 EBC -> 5.7115.
      // Aromatic 0.5 lb crystal acidity 14.2 mEq/kg.
      // Grist 5.69798535979559 + 0.060629908163735 x -0.515980226767176 = 5.66670152603239.
      name: "2023-07-08 Belgian Single",
      log: "Belgian and Saison Ale/20230708 Belgian Single/20230708 Trappist Single Data Log .xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 2.4 },
      salts: { gypsum: 4, calcium_chloride: 5, epsom: 3 },
      acidMl: 41,
      mashWaterGal: 9,
      malts: [
        { name: "Pilsner, Dingeman Belgian", type: 'base', weightLb: 20, colorL: 2.5 },
        { name: "Aromatic Malt", type: 'crystal', weightLb: 0.5, colorL: 20, acidityMeqPerKg: 14.2 },
      ],
      measured: 5.79,
      predicted: 5.66670152603239,
    },
    {
      // 2023-08-03 Oktoberfest. Measured 5.80 (cooled sample).
      // Water: Home 2023-06-17, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 55.2857142857143, Mg 6.11428571428571, alkalinity 52.8905987075202 after 7 mL acid;
      // RA 9.80416413369069 = 0.195926541440661 mEq/L.
      // R = 10 x 3.785411784 / (23.8 x 0.453592) = 3.50647531909993; slope 0.0585841791482991.
      // MunichT1 23.8 lb base 6.9 L = 17.085 EBC -> 5.4783.
      // Grist 5.4783 + 0.0585841791482991 x 0.195926541440661 = 5.48977819560367.
      name: "2023-08-03 Oktoberfest",
      log: "Lagers & Hybrids/20230803 Oktoberfest/20230803 Oktoberfest Data Log .xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 2.4 },
      salts: { gypsum: 4, calcium_chloride: 5, epsom: 2 },
      acidMl: 7,
      mashWaterGal: 10,
      malts: [
        { name: "Munich Type 1", type: 'base', weightLb: 23.8, colorL: 6.9 },
      ],
      measured: 5.8,
      predicted: 5.48977819560367,
    },
    {
      // 2023-11-03 Bob's Your Uncle ESB. Measured 5.70 (cooled sample).
      // Water: Home 2023-11-03, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 67.7142857142857, Mg 9.82857142857143, alkalinity 41.7186823907663 after 18 mL acid;
      // RA -12.4301771530512 = -0.24840481920566 mEq/L.
      // R = 9 x 3.785411784 / (21.7 x 0.453592) = 3.46123047627284; slope 0.0579959961915469.
      // GP 20 lb base 2.2 L = 4.63 EBC -> 5.7274.
      // Aromatic 0.5 lb crystal acidity 14.2 mEq/kg.
      // C120 0.8 lb crystal acidity 55.184 mEq/kg.
      // SpecialRoast 0.4 lb crystal acidity 25.6 mEq/kg.
      // Grist 5.61064345968309 + 0.0579959961915469 x -0.24840481920566 = 5.59623697473448.
      name: "2023-11-03 Bob's Your Uncle ESB",
      log: "English Ale/20231104 Bob's Your Uncle ESB/20231103 Bob's Your Uncle ESB Data Log .xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 2.4 },
      salts: { gypsum: 8, calcium_chloride: 4, epsom: 4 },
      acidMl: 18,
      mashWaterGal: 9,
      malts: [
        { name: "Golden Promise Pale Malt", type: 'base', weightLb: 20, colorL: 2.2 },
        { name: "Aromatic Malt", type: 'crystal', weightLb: 0.5, colorL: 20, acidityMeqPerKg: 14.2 },
        { name: "American Crystal 120", type: 'crystal', weightLb: 0.8, colorL: 120 },
        { name: "Special Roast Malt", type: 'crystal', weightLb: 0.4, colorL: 40, acidityMeqPerKg: 25.6 },
      ],
      measured: 5.7,
      predicted: 5.59623697473448,
    },
    {
      // 2023-12-02 Time Warp DIPA. Measured 5.60 (cooled sample).
      // Water: Home 2023-11-03, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 10 x 0.24 = 2.4.
      // Treated in 14 gal: Ca 62.5714285714286, Mg 7.97142857142857, alkalinity 29.5311373179439 after 30 mL acid;
      // RA -19.8518158633287 = -0.396718942112883 mEq/L.
      // R = 13 x 3.785411784 / (33.5 x 0.453592) = 3.23851780217767; slope 0.0551007314283097.
      // GP 29 lb base 2.2 L = 4.63 EBC -> 5.7274.
      // Bonlander 2.5 lb base 10 L = 25.3 EBC -> 5.314.
      // C40 0.5 lb crystal acidity 27.624 mEq/kg.
      // Carafoam 1.5 lb crystal acidity 14.533 mEq/kg.
      // Grist 5.64895902152939 + 0.0551007314283097 x -0.396718942112883 = 5.6270995176475.
      name: "2023-12-02 Time Warp DIPA",
      log: "IPA/20231202 Time Warp DIPA/20231202 DIPA Data Log .xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 2.4 },
      salts: { gypsum: 8, calcium_chloride: 3, epsom: 3 },
      acidMl: 30,
      mashWaterGal: 13,
      malts: [
        { name: "Golden Promise Pale Malt", type: 'base', weightLb: 29, colorL: 2.2 },
        { name: "Bonlander Munich", type: 'base', weightLb: 2.5, colorL: 10 },
        { name: "American Crystal 40", type: 'crystal', weightLb: 0.5, colorL: 40 },
        { name: "Carafoam", type: 'crystal', weightLb: 1.5, colorL: 2 },
        { name: "Dextrose", type: 'none', weightLb: 3, colorL: 0 },
      ],
      measured: 5.6,
      predicted: 5.6270995176475,
    },
    {
      // 2024-03-23 Holy Hefe. Measured 5.65 (cooled sample).
      // Water: Home 2024-03-20, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 20 x 0.24 = 4.8.
      // Treated in 14 gal: Ca 51.6428571428571, Mg 8.51428571428571, alkalinity 21.4061072693956 after 38 mL acid;
      // RA -20.4900511939898 = -0.409473445123697 mEq/L.
      // R = 9 x 3.785411784 / (23 x 0.453592) = 3.26559571022263; slope 0.0554527442328942.
      // NorthStar 9 lb base 2 L = 4.1 EBC -> 5.738.
      // WhiteWheat 14 lb base 3 L = 6.75 EBC -> 5.685.
      // Grist 5.70573913043478 + 0.0554527442328942 x -0.409473445123697 = 5.68303270421218.
      name: "2024-03-23 Holy Hefe",
      log: "Hefeweizen/20240320 Holy Hefe!/20240323 Hefe Data Log .xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 4.8 },
      salts: { gypsum: 2, calcium_chloride: 6, epsom: 2 },
      acidMl: 38,
      mashWaterGal: 9,
      malts: [
        { name: "Pilsner, Northstar", type: 'base', weightLb: 9, colorL: 2 },
        { name: "White Wheat Malt", type: 'base', weightLb: 14, colorL: 3 },
        { name: "Rice Hulls", type: 'none', weightLb: 0.7, colorL: 0 },
      ],
      measured: 5.65,
      predicted: 5.68303270421218,
    },
    {
      // 2024-09-17 Experiments Are Fun WCIPA. Measured 5.36 (cooled sample).
      // Water: Home 2024-03-20, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 20 x 0.24 = 4.8.
      // Treated in 14 gal: Ca 62.5714285714286, Mg 10.3714285714286, alkalinity 20.390478513327 after 39 mL acid;
      // RA -30.4042393738278 = -0.607598708509749 mEq/L.
      // R = 13 x 3.785411784 / (29 x 0.453592) = 3.74104642665351; slope 0.0616336035464957.
      // GP 27 lb base 2.2 L = 4.63 EBC -> 5.7274.
      // Carafoam 2 lb crystal acidity 14.533 mEq/kg.
      // Grist 5.68800249149277 + 0.0616336035464957 x -0.607598708509749 = 5.65055399357712.
      name: "2024-09-17 Experiments Are Fun WCIPA",
      log: "IPA/20240917 Exp are Fun WCIPA/20240917 WCIPA Data Log .xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 4.8 },
      salts: { gypsum: 8, calcium_chloride: 3, epsom: 3 },
      acidMl: 39,
      mashWaterGal: 13,
      malts: [
        { name: "Golden Promise Pale Malt", type: 'base', weightLb: 27, colorL: 2.2 },
        { name: "Carafoam", type: 'crystal', weightLb: 2, colorL: 2 },
      ],
      measured: 5.36,
      predicted: 5.65055399357712,
    },
    {
      // 2025-03-22 Nordic Saison. Measured 5.54 (cooled sample).
      // Water: Home 2024-03-20, alkalinity 60 as CaCO3, Ca 30 x 0.4 = 12, Mg 20 x 0.24 = 4.8.
      // Treated in 14 gal: Ca 55.2857142857143, Mg 10.3714285714286, alkalinity 18.35922100119 after 41 mL acid;
      // RA -27.2314152533119 = -0.544192950705673 mEq/L.
      // R = 9 x 3.785411784 / (21.5 x 0.453592) = 3.49342796907537; slope 0.0584145635979799.
      // WeyPils 21.5 lb base 1.8 L = 3.57 EBC -> 5.7486.
      // Grist 5.7486 + 0.0584145635979799 x -0.544192950705673 = 5.71681120627143.
      name: "2025-03-22 Nordic Saison",
      log: "Belgian and Saison Ale/20250322 Nordic Saison/20250322 Kveik Saison Data Log .xlsx",
      water: { Alkalinity: 60, Ca: 12, Mg: 4.8 },
      salts: { gypsum: 4, calcium_chloride: 5, epsom: 3 },
      acidMl: 41,
      mashWaterGal: 9,
      malts: [
        { name: "Pilsner, Weyermann", type: 'base', weightLb: 21.5, colorL: 1.8 },
      ],
      measured: 5.54,
      predicted: 5.71681120627143,
    },
];
