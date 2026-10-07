// acid-aimed.test.js
// Scenarios for "The acid aimed at a mash pH", the engine
// (docs/items/acid-aimed-at-mash-ph.md, AA-S1, AA-Q3, RA-2). The dose is the
// mash pH model (mash-ph.test.js pins it) solved for the target: the
// alkalinity the mash water needs, on whichever side of zero alkalinity the
// target falls, then the acid that takes the water there, as the solver's
// own acid step works it (88 % lactic, mEq over the volume dosed).
// Every figure is worked out by hand with the working beside it (CLAUDE.md,
// Models: the hand-pin rule). Unit factors are the engine's own:
// 3.785411784 L per US gal, 453.592 g per lb, 50.04 mg/L as CaCO3 per mEq/L.

import { describe, it, expect } from 'vitest';
import * as engine from '../../src/index.js';

// 10 lb of 2.2 degL base malt in 4 gal of mash water (mash-ph.test.js):
// grist pH 5.82 - 0.02 x (2.65 x 2.2 - 1.2) = 5.7274; R = 15.141647136 L /
// 4.53592 kg = 3.33816450378314 L/kg; the alkalinity slope 0.013 x R + 0.013
// = 0.0563961385491808; the acid side's 0.0814 x 0.0563961385491808 /
// (0.013 x 4 + 0.013) = 0.0706253181215894.
// The water: calcium 50, magnesium 10, alkalinity 50 mg/L. Its hardness,
// -(50 / 1.4 + 10 / 1.7) = -41.5966386554622 mg/L = -0.831267758902122 mEq/L.
// At zero alkalinity the mash reads 5.7274 - 0.0563961385491808 x
// 0.831267758902122 = 5.68051970829749; with the water's 50 mg/L, 5.7274 +
// 0.0563961385491808 x (50 - 41.5966386554622) / 50.04 = 5.73687076600051.
const MALTS = [{ type: 'base', weightLb: 10, colorL: 2.2 }];
const MASH_GAL = 4;
const WATER = { Ca: 50, Mg: 10, Alk: 50 };
const PH_AT_ZERO_ALK = 5.68051970829749;
const PH_UNTREATED = 5.73687076600051;

// Target 5.4, below 5.68051970829749: acid past neutral, by the acid side's
// slope: (5.4 - 5.68051970829749) / 0.0706253181215894 x 50.04
// = -198.756006720419 mg/L. To take out: 50 + 198.756006720419 =
// 248.756006720419 mg/L = 4.97114321184690 mEq/L; over 15.141647136 L,
// 75.2713... mEq; 88 % lactic carries 1.209 x 0.88 x 1000 / 90.08 =
// 11.8108348134991 mEq/mL: 6.37307164868583 mL.
const ALK_54 = -198.756006720419;
const ML_54 = 6.37307164868583;
// Target 5.7, above it: the published slope, (5.7 - 5.68051970829749) /
// 0.0563961385491808 x 50.04 = 17.2847613661272 mg/L; to take out
// 32.7152386338728 mg/L over 15.141647136 L: 0.838156885400796 mL.
const ALK_57 = 17.2847613661272;
const ML_57 = 0.838156885400796;

describe('the acid aimed at a mash pH — the engine', () => {
  it('the default target is the middle of the cooled-sample range', () => {
    // RA-2: (5.2 + 5.6) / 2 = 5.4.
    expect(engine.MASH_PH_TARGET).toBe(5.4);
  });

  it('the alkalinity the mash water needs for the target, on either side of zero', () => {
    const { alkalinityForMashPh, mashPh } = engine;
    const alk = (targetPh) => alkalinityForMashPh({ malts: MALTS, mashWaterGal: MASH_GAL, water: WATER, targetPh });
    expect(mashPh({ malts: MALTS, mashWaterGal: MASH_GAL, water: { ...WATER, Alk: 0 } })).toBeCloseTo(PH_AT_ZERO_ALK, 12);
    expect(alk(5.4)).toBeCloseTo(ALK_54, 9);
    expect(alk(5.7)).toBeCloseTo(ALK_57, 9);
    // The model at that alkalinity reads the target: the closed form inverts it.
    for (const t of [5.2, 5.4, 5.6, 5.68051970829749, 5.7, 5.9]) {
      expect(mashPh({ malts: MALTS, mashWaterGal: MASH_GAL, water: { ...WATER, Alk: alk(t) } })).toBeCloseTo(t, 12);
    }
    // A figure the model needs blank: no alkalinity (NaN).
    expect(alk(NaN)).toBeNaN();
    expect(alkalinityForMashPh({ malts: [{ ...MALTS[0], type: '' }], mashWaterGal: MASH_GAL, water: WATER, targetPh: 5.4 })).toBeNaN();
    expect(alkalinityForMashPh({ malts: MALTS, mashWaterGal: NaN, water: WATER, targetPh: 5.4 })).toBeNaN();
  });

  it('AA-S1: the acid recommendation is the dose that brings the predicted mash pH to the target', () => {
    const { acidForMashPh } = engine;
    const dose = (targetPh, volumeGallons = MASH_GAL) =>
      acidForMashPh({ malts: MALTS, mashWaterGal: MASH_GAL, water: WATER, targetPh, volumeGallons });
    expect(dose(5.4).acids.lactic_88).toBeCloseTo(ML_54, 9);
    expect(dose(5.7).acids.lactic_88).toBeCloseTo(ML_57, 9);
    // Dosed over a larger volume (the tank's first fill, 14 gal) the same
    // mash water needs the same concentration: 6.37307164868583 x 14 / 4.
    expect(dose(5.4, 14).acids.lactic_88).toBeCloseTo(22.3057507704004, 9);
    // AA-Q3: at or below the target without acid, no acid.
    expect(dose(PH_UNTREATED + 0.1).acids).toEqual({});
    expect(dose(6).acids).toEqual({});
    // The pH cannot be predicted, or no target: no dose at all (null).
    expect(dose(NaN)).toBeNull();
    expect(acidForMashPh({ malts: [{ ...MALTS[0], type: '' }], mashWaterGal: MASH_GAL, water: WATER, targetPh: 5.4, volumeGallons: 4 })).toBeNull();
  });
});
