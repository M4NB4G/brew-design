// format.js
// Number -> string presentation helpers. No unit conversion and no brewing math
// here; callers pass an already-converted display value (see display.js).

export function num(value, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return Number(value).toFixed(digits);
}

// Gravity is shown to 3 decimals as SG (1.062) and 2 as Plato (15.21).
export function gravity(value, gravityUnit) {
  return gravityUnit === 'plato' ? num(value, 2) : num(value, 3);
}

// Round a canonical-derived value for use as a controlled input's display value,
// so Pro-mode conversions (e.g. gal -> bbl) don't surface 17-digit floats. This
// is display-only; canonical state remains exact.
export function roundForInput(value, digits = 6) {
  if (!Number.isFinite(value)) return value;
  return Number(value.toFixed(digits));
}
