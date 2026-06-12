// units.test.js
// Unit conversions and water-density volume correction.

import { describe, it, expect } from 'vitest';
import {
  fToC,
  galToL,
  sgToPlato,
  platoToSg,
  waterDensityC,
  waterDensityF,
  correctVolumeToRef,
} from '../src/index.js';

describe('basic conversions', () => {
  it('fToC', () => {
    expect(fToC(32)).toBeCloseTo(0, 12);
    expect(fToC(212)).toBeCloseTo(100, 12);
    expect(fToC(60)).toBeCloseTo(15.5555556, 6);
  });
  it('galToL', () => {
    expect(galToL(1)).toBeCloseTo(3.785411784, 12);
    expect(galToL(5)).toBeCloseTo(18.92705892, 8);
  });
  it('sgToPlato matches the spec golden values', () => {
    expect(sgToPlato(1.062031)).toBeCloseTo(15.2145679, 4);
  });
  it('platoToSg matches the spec golden values', () => {
    expect(platoToSg(16.6222661)).toBeCloseTo(1.0681297, 6);
  });
  it('the two gravity polynomials are deliberately NOT exact inverses', () => {
    // sgToPlato (cubic) and platoToSg (ASBC) are independent fits; their
    // round-trip residual is real and is the source of the solver.js FLAG.
    const p = 16.6222661;
    expect(sgToPlato(platoToSg(p)) - p).toBeCloseTo(0.0034347, 5);
  });
});

describe('water density table', () => {
  it('exact table hits', () => {
    expect(waterDensityC(20)).toBeCloseTo(998.21, 10);
    expect(waterDensityC(60)).toBeCloseTo(983.2, 10);
    expect(waterDensityC(0)).toBeCloseTo(999.84, 10);
    expect(waterDensityC(100)).toBeCloseTo(958.35, 10);
  });
  it('linear interpolation between points', () => {
    // Midpoint between 20 (998.21) and 25 (997.05) = 997.63.
    expect(waterDensityC(22.5)).toBeCloseTo((998.21 + 997.05) / 2, 10);
  });
  it('throws outside 0..100 C', () => {
    expect(() => waterDensityC(-1)).toThrow();
    expect(() => waterDensityC(101)).toThrow();
  });
  it('waterDensityF delegates through fToC', () => {
    expect(waterDensityF(60)).toBeCloseTo(waterDensityC(fToC(60)), 12);
  });
});

describe('correctVolumeToRef', () => {
  it('factor is exactly 1 at the reference temperature', () => {
    expect(correctVolumeToRef(16, 60)).toBe(16);
  });
  it('~3.2% shrink from 190 F to 60 F', () => {
    // Spec tolerance is 2e-2.
    expect(Math.abs(correctVolumeToRef(16, 190) - 15.48)).toBeLessThan(2e-2);
  });
});
