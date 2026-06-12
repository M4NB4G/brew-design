// yeast.js
// Pitch-rate selection and cell-count requirement.
// Pure functions. Every constant reproduced exactly from the spec.

import { LITERS_PER_GALLON } from './units.js';

/**
 * Pitch-rate table, billion cells / L / degP (White / Zainasheff).
 * ale:   { high: 0.5,  mod: 0.75, low: 1.0 }
 * lager: { high: 1.25, mod: 1.5,  low: 1.75 }
 */
export const PITCH_RATES = Object.freeze({
  ale: Object.freeze({ high: 0.5, mod: 0.75, low: 1.0 }),
  lager: Object.freeze({ high: 1.25, mod: 1.5, low: 1.75 }),
});

/**
 * Select a pitch rate (billion cells / L / degP) by yeast type and density.
 * type: "ale" | "lager"; density: "high" | "mod" | "low".
 */
export function selectPitchRate(type, density) {
  const byType = PITCH_RATES[type];
  if (!byType) {
    throw new RangeError(`selectPitchRate: unknown type "${type}"`);
  }
  const rate = byType[density];
  if (rate === undefined) {
    throw new RangeError(`selectPitchRate: unknown density "${density}" for type "${type}"`);
  }
  return rate;
}

/**
 * Cells needed (billions), rounded to the nearest 10.
 * raw = pitchRate * postBoilPlato * 3.785411784 * fermentVolGal
 */
export function computeCellsNeeded({ pitchRate, postBoilPlato, fermentVolGal }) {
  const raw = pitchRate * postBoilPlato * LITERS_PER_GALLON * fermentVolGal;
  return Math.round(raw / 10) * 10;
}
