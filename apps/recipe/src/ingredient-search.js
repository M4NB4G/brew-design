// ingredient-search.js
// The malt, boil-hop and dry-hop name boxes' search over the owner's
// ingredient list (ingredients.json, SPEC rule 16): which ingredients match
// the typed text, the numbers each suggestion shows, and what a pick writes
// into a row. Pure functions, no DOM. Rows are keyed by the recipe-state
// field they live in: 'malts', 'kettleAdditions', 'dryHops'.
//
// A pick copies the list's numbers into the row (the recipe never refers back
// to the list); typing alone writes the name and nothing else. No brewing
// math and no unit conversion here: percent comes from display.js.
import ingredients from './ingredients.json';
import { fractionToPercent, percentUnit } from './display.js';
import { roundForInput } from './format.js';

// Which list each kind of row searches; both hop rows search the hops.
const LIST = { malts: ingredients.malts, kettleAdditions: ingredients.hops, dryHops: ingredients.hops };

// The numbers a pick copies, per kind of row. A dry hop has only its weight,
// which a pick leaves alone.
const PICKED_KEYS = { malts: ['fgdb', 'colorL'], kettleAdditions: ['alphaAcidFraction'], dryHops: [] };

// A new row: an empty name and today's starting numbers (item B5).
const NEW_ROW = {
  malts: { name: '', weightLb: 1, fgdb: 0.8, colorL: 2 },
  kettleAdditions: { name: '', timeMin: 10, wortTempF: 212, weightOz: 1, alphaAcidFraction: 0.1 },
  dryHops: { name: '', weightOz: 1 },
};

// For matching only: capitals and accents ignored ("Mittelfrüh" ~ "mittelfruh").
function fold(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

// Ingredients whose name contains the typed text, those starting with it
// first, each group in the workbook's order. Blank text suggests nothing.
export function searchIngredients(field, text) {
  const q = fold(text).trim();
  if (q === '') return [];
  const starts = [];
  const contains = [];
  for (const item of LIST[field]) {
    const name = fold(item.name);
    if (name.startsWith(q)) starts.push(item);
    else if (name.includes(q)) contains.push(item);
  }
  return [...starts, ...contains];
}

// The numbers a pick would fill, as the boxes show them (percent in both
// modes, item B7): "77 %, 40 °L" for a malt, "14.4 %" for a boil hop, and
// nothing for a dry hop.
export function suggestionDetail(field, item) {
  const pct = (fraction) => `${roundForInput(fractionToPercent(fraction))} ${percentUnit()}`;
  if (field === 'malts') return `${pct(item.fgdb)}, ${roundForInput(item.colorL)} °L`;
  if (field === 'kettleAdditions') return pct(item.alphaAcidFraction);
  return '';
}

// The row after picking `item`: its name and the list's numbers copied in;
// every other number of the row left as it was.
export function pickIngredient(field, row, item) {
  const picked = { ...row, name: item.name };
  for (const key of PICKED_KEYS[field]) picked[key] = item[key];
  return picked;
}

// The row after typing in its name box: the name alone changes, even when it
// matches a name on the list (item B2).
export function typeName(row, text) {
  return { ...row, name: text };
}

export function newRow(field) {
  return { ...NEW_ROW[field] };
}
