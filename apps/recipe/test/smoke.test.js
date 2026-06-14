// smoke.test.js
// Correctness gate for the Phase 3a scaffold.
//
// Part 1 (parity): drive the canonical state model with the REFERENCE recipe
// (not the app defaults) and assert the derived stats *through computeRecipe* --
// the exact selector the UI renders from -- match the engine/spreadsheet golden
// values. Tolerances are the engine's and are NOT loosened.
//
// Part 2 (unit boundary): round-trip checks on the display layer the UI uses.

import { describe, it, expect } from 'vitest';
import { sgToPlato } from '@brew/engine';
import { computeRecipe } from '../src/selectors.js';
import { volumeToCanonical, gravityFromCanonical, cellsFromCanonical } from '../src/display.js';

// Reference recipe expressed in canonical units (US gal, lb, oz, degF, SG).
// preBoil 16 with boil-off 1.5 gal/hr for 60 min -> postBoil 14.5 gal.
// Dry hops total 15 oz across nine entries.
const referenceState = {
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
};

describe('parity through the UI selector (computeRecipe)', () => {
  const d = computeRecipe(referenceState);

  it('post-boil volume = 14.5 gal', () => {
    expect(d.postBoilVolGal).toBeCloseTo(14.5, 6);
  });
  it('preBoilSg', () => {
    expect(d.grist.preBoilSg).toBeCloseTo(1.062031, 6);
  });
  it('OG', () => {
    expect(d.grist.OG).toBeCloseTo(1.0681297, 6);
  });
  it('FG', () => {
    expect(d.grist.FG).toBeCloseTo(1.0136259, 6);
  });
  it('ABV (fraction)', () => {
    expect(d.grist.ABV).toBeCloseTo(0.0748883, 4);
  });
  it('SRM', () => {
    expect(d.grist.SRM).toBeCloseTo(4.1236703, 4);
  });
  it('mashRv (qt/lb)', () => {
    expect(d.grist.mashRv).toBeCloseTo(1.7931034, 4);
  });
  it('totalIBU = 46 (exact)', () => {
    expect(d.hops.totalIBU).toBe(46);
  });
  it('cells needed = 570 billion (exact)', () => {
    expect(d.cells).toBe(570);
  });
  it('first starter option volume ~ 3.00 L', () => {
    expect(d.starter[0].volumeL).toBeCloseTo(3.0, 2);
  });
});

describe('unit-conversion boundary round-trips', () => {
  it('16 gal (Home) and 16/31 bbl (Pro) parse to the same canonical 16 gal', () => {
    const home = volumeToCanonical(16, 'home');
    const pro = volumeToCanonical(16 / 31, 'pro');
    expect(home).toBeCloseTo(16, 9);
    expect(pro).toBeCloseTo(16, 9);
    expect(home).toBeCloseTo(pro, 9);
  });

  it('a canonical SG formats consistently to SG and Plato displays', () => {
    const sg = 1.0681297;
    // SG display is the canonical value unchanged.
    expect(gravityFromCanonical(sg, 'sg')).toBe(sg);
    // Plato display routes through the engine's sgToPlato (no app-side formula).
    expect(gravityFromCanonical(sg, 'plato')).toBeCloseTo(sgToPlato(sg), 12);
  });

  it('570 billion cells shows as 570 in Home and 0.57 trillion in Pro', () => {
    expect(cellsFromCanonical(570, 'home')).toBe(570);
    expect(cellsFromCanonical(570, 'pro')).toBeCloseTo(0.57, 12);
  });
});
