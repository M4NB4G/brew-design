// units.js
// Unit conversion helpers and water-density-based volume correction.
// Pure functions only: no DOM, no I/O, no global state.
//
// Constants are reproduced exactly from the Phase 1 Port Spec / spreadsheet.
// Do not "improve" or round any constant.

// Liters per US gallon (exact conversion).
export const LITERS_PER_GALLON = 3.785411784;

/**
 * Water density vs. temperature, sourced from the IAPWS-95 formulation
 * (Wagner and Pruss, J. Phys. Chem. Ref. Data 31, 387, 2002), the basis of
 * the NIST Chemistry WebBook. Keys are degrees Celsius, values are kg/m^3.
 * Interpolated linearly by waterDensityC().
 */
export const WATER_DENSITY_TABLE_C = Object.freeze({
  0: 999.84,
  4: 999.97,
  10: 999.70,
  15: 999.10,
  20: 998.21,
  25: 997.05,
  30: 995.65,
  35: 994.03,
  40: 992.22,
  45: 990.21,
  50: 988.04,
  55: 985.69,
  60: 983.20,
  65: 980.55,
  70: 977.76,
  75: 974.84,
  80: 971.79,
  85: 968.61,
  90: 965.31,
  95: 961.89,
  100: 958.35,
});

// Sorted [tempC, density] pairs derived once from the table above.
const DENSITY_POINTS = Object.freeze(
  Object.keys(WATER_DENSITY_TABLE_C)
    .map((k) => [Number(k), WATER_DENSITY_TABLE_C[k]])
    .sort((a, b) => a[0] - b[0]),
);

const MIN_TEMP_C = DENSITY_POINTS[0][0];
const MAX_TEMP_C = DENSITY_POINTS[DENSITY_POINTS.length - 1][0];

/** Fahrenheit to Celsius. */
export function fToC(f) {
  return ((f - 32) * 5) / 9;
}

/** US gallons to liters. */
export function galToL(gal) {
  return gal * LITERS_PER_GALLON;
}

/**
 * Specific gravity to degrees Plato (Brewer's Friend cubic).
 * Constants: -616.868, 1111.14, -630.272, 135.997.
 */
export function sgToPlato(sg) {
  return -616.868 + 1111.14 * sg - 630.272 * sg * sg + 135.997 * sg * sg * sg;
}

/**
 * Degrees Plato to specific gravity (ASBC / Brewer's Friend).
 * Constants: 258.6, 258.2, 227.1.
 */
export function platoToSg(p) {
  return 1 + p / (258.6 - (p / 258.2) * 227.1);
}

/**
 * Water density (kg/m^3) at a given Celsius temperature, via linear
 * interpolation of WATER_DENSITY_TABLE_C. Throws outside 0..100 C.
 */
export function waterDensityC(tempC) {
  if (Number.isNaN(tempC)) {
    throw new RangeError('waterDensityC: tempC is NaN');
  }
  if (tempC < MIN_TEMP_C || tempC > MAX_TEMP_C) {
    throw new RangeError(
      `waterDensityC: tempC ${tempC} is outside the table range ${MIN_TEMP_C}..${MAX_TEMP_C} C`,
    );
  }
  // Exact-hit shortcut and linear interpolation between bracketing points.
  for (let i = 0; i < DENSITY_POINTS.length - 1; i++) {
    const [t0, d0] = DENSITY_POINTS[i];
    const [t1, d1] = DENSITY_POINTS[i + 1];
    if (tempC === t0) return d0;
    if (tempC > t0 && tempC <= t1) {
      const frac = (tempC - t0) / (t1 - t0);
      return d0 + frac * (d1 - d0);
    }
  }
  // Only reachable for tempC === MAX_TEMP_C, handled above by the t1 branch,
  // but kept as a defensive fallback.
  return DENSITY_POINTS[DENSITY_POINTS.length - 1][1];
}

/** Water density (kg/m^3) at a given Fahrenheit temperature. */
export function waterDensityF(tempF) {
  return waterDensityC(fToC(tempF));
}

/**
 * Correct a measured volume to its equivalent at a reference temperature
 * (default 60 F) by the ratio of water densities. When tempF === refTempF
 * the factor is exactly 1, so the measured volume is returned unchanged.
 */
export function correctVolumeToRef(volMeasured, tempF, refTempF = 60) {
  return (volMeasured * waterDensityF(tempF)) / waterDensityF(refTempF);
}
