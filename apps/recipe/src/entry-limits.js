// entry-limits.js
// The figures a recipe cannot hold (docs/items/impossible-entries.md): a
// negative weight, volume, time, colour or price; a percent above 100; a
// kettle hop hotter than 213 °F. A Recipe-tab box refuses such an entry
// (IE-S1 to IE-S3); a recipe saved before holds it as saved (IE-S4), and the
// figures that depend on it read it as a blank figure (withinLimits, read by
// selectors.js), the line under the stats bar naming it (empty-fields.js).
//
// The limits are written here once, in the recipe's own units, and read
// everywhere else; nothing here is brewing math.
import { fractionToPercent, percentUnit, tempLimitText } from './display.js';

// Nothing is less than none (definitional).
export const LEAST = 0;
// 100 %, as the recipe holds a percent: a fraction of 1 (definitional, N-6).
export const MOST_FRACTION = 1;
// The hottest a kettle hop's wort is taken to be, °F: wort boils a fraction
// of a degree above water (the owner, 2026-11-10, H-3).
export const HOTTEST_HOP_F = 213;

const AMOUNT = 'amount'; // not below LEAST
const PERCENT = 'percent'; // not below LEAST, not above MOST_FRACTION
const HOP_TEMP = 'hopTemp'; // not above HOTTEST_HOP_F; a negative °C is real (N-2)

// The figures IE-S1 to IE-S3 limit, by where the recipe holds them: a row's
// key in its list, a key of the yeast or the water back, or a key of the
// recipe itself (`recipe`). Every other figure has no limit here (IE-S5).
const LIMITED = {
  recipe: {
    mashWaterGal: AMOUNT,
    preBoilVolGal: AMOUNT,
    boilOffRateGalPerHr: AMOUNT,
    boilTimeMin: AMOUNT,
    fermentVolGal: AMOUNT,
    efficiency: PERCENT,
    apparentAttenuation: PERCENT,
  },
  waterBack: { volumeGal: AMOUNT },
  malts: { weightLb: AMOUNT, fgdb: PERCENT, colorL: AMOUNT, pricePerLb: AMOUNT },
  kettleAdditions: { timeMin: AMOUNT, wortTempF: HOP_TEMP, weightOz: AMOUNT, alphaAcidFraction: PERCENT, pricePerOz: AMOUNT },
  dryHops: { weightOz: AMOUNT, pricePerOz: AMOUNT },
  yeast: { pricePerBatch: AMOUNT },
  otherCosts: { costPerBatch: AMOUNT },
};
const ROWS = ['malts', 'kettleAdditions', 'dryHops', 'otherCosts'];
const PARTS = ['waterBack', 'yeast'];

/**
 * The limit `value` crosses, held at `part` (null for the recipe itself) and
 * `key`: 'negative', 'above100' or 'aboveHopTemp', or null when it crosses
 * none. A blank figure (NaN) crosses none: it is a blank, named as one.
 */
export function limitCrossed(part, key, value) {
  const kind = LIMITED[part ?? 'recipe']?.[key];
  if (!kind || !Number.isFinite(value)) return null;
  if (kind === HOP_TEMP) return value > HOTTEST_HOP_F ? 'aboveHopTemp' : null;
  if (value < LEAST) return 'negative';
  if (kind === PERCENT && value > MOST_FRACTION) return 'above100';
  return null;
}

/**
 * The limit as the brewer reads it, in the header's temperature unit:
 * "Negative", "Above 100 %", "Above 213 °F" or "Above 100.56 °C" (IE-S4,
 * IE-S6).
 */
export function limitText(limit, temperatureUnit) {
  if (limit === 'negative') return 'Negative';
  if (limit === 'above100') return `Above ${fractionToPercent(MOST_FRACTION)} ${percentUnit()}`;
  return `Above ${tempLimitText(HOTTEST_HOP_F, temperatureUnit)}`;
}

/** The line under a box that refuses `value`, or null when it takes it. */
export function entryRefusal(part, key, value, temperatureUnit) {
  const limit = limitCrossed(part, key, value);
  return limit ? `${limitText(limit, temperatureUnit)}: nothing is saved.` : null;
}

// FLAG: only a typed figure is refused. A pick from the ingredient list
// copies its figures as before: one of My ingredients saved with an FGDB or
// alpha above 100 % reaches the recipe and is then named as a saved one
// (IE-S4), as a brewery figure outside the limits reaches a new recipe (K).
// The sentences refuse entries in boxes; a pick is not typed in one.
/**
 * A figure typed in a Recipe-tab box (IE-S1 to IE-S3): handed to `set` when
 * it is inside its limits; otherwise nothing is set. Returns the line under
 * the box (the refusal), or null when the figure was set.
 */
export function typed(part, key, value, set, temperatureUnit) {
  const line = entryRefusal(part, key, value, temperatureUnit);
  if (line === null) set(value);
  return line;
}

/**
 * The recipe as its figures are read (IE-S4): each figure outside its limits
 * a blank figure (NaN), so every figure that depends on it reads "—", as for
 * an empty box. Every other figure, and the recipe as saved, is unchanged.
 */
export function withinLimits(recipe) {
  const within = (part, row) => {
    if (!row) return row;
    let out = row;
    for (const key of Object.keys(LIMITED[part])) {
      if (limitCrossed(part, key, row[key])) out = { ...out, [key]: NaN };
    }
    return out;
  };
  const next = within('recipe', recipe);
  const parts = {};
  for (const part of PARTS) if (part in recipe) parts[part] = within(part, recipe[part]);
  for (const part of ROWS) if (Array.isArray(recipe[part])) parts[part] = recipe[part].map((row) => within(part, row));
  return { ...next, ...parts };
}
