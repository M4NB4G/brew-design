// ingredient-search.js
// The malt, boil-hop, dry-hop and yeast-strain name boxes' search over the
// owner's ingredient list (ingredients.json, SPEC rule 16): which ingredients
// match the typed text, the numbers each suggestion shows, and what a pick
// writes into a row. Pure functions, no DOM. Rows are keyed by the
// recipe-state field they live in: 'malts', 'kettleAdditions', 'dryHops',
// and 'yeasts' for the recipe's one yeast, whose name is its strain.
//
// A pick copies the list's numbers into the row (the recipe never refers back
// to the list); typing alone writes the name and nothing else. A strain pick
// copies only ale/lager: the Yeast card shows the strain's lab figures as
// information (strainInfo), looked up by name each time it is drawn, and never
// writes them into the recipe. No brewing math and no unit conversion here:
// percent comes from display.js.
import ingredients from './ingredients.json';
import { fractionToPercent, percentUnit, tempUnit } from './display.js';
import { roundForInput } from './format.js';

// Which list each kind of row searches; both hop rows search the hops.
const LIST = {
  malts: ingredients.malts,
  kettleAdditions: ingredients.hops,
  dryHops: ingredients.hops,
  yeasts: ingredients.yeasts,
};

// Which of an ingredient's texts the typed text is matched against: a strain
// is found by its name, its lab or its product code ("US-05", "Fermentis").
const SEARCHED = {
  malts: ['name'],
  kettleAdditions: ['name'],
  dryHops: ['name'],
  yeasts: ['name', 'lab', 'productCode'],
};

// The numbers a pick copies, per kind of row. A dry hop has only its weight,
// which a pick leaves alone. A strain sets ale/lager (item Q2), which selects
// the pitch rate; its attenuation and lab range are never copied (Y3, Y4).
const PICKED_KEYS = {
  malts: ['fgdb', 'colorL'],
  kettleAdditions: ['alphaAcidFraction'],
  dryHops: [],
  yeasts: ['type'],
};

const YEAST_TYPE = { ale: 'Ale', lager: 'Lager' };

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

// Ingredients whose name (for a strain: name, lab or product code) contains
// the typed text, those starting with it first, each group in the workbook's
// order. Blank text suggests nothing.
export function searchIngredients(field, text) {
  const q = fold(text).trim();
  if (q === '') return [];
  const starts = [];
  const contains = [];
  for (const item of LIST[field]) {
    const texts = SEARCHED[field].map((key) => fold(String(item[key])));
    if (texts.some((t) => t.startsWith(q))) starts.push(item);
    else if (texts.some((t) => t.includes(q))) contains.push(item);
  }
  return [...starts, ...contains];
}

const pct = (fraction) => `${roundForInput(fractionToPercent(fraction))} ${percentUnit()}`;

// The numbers a pick would fill, as the boxes show them (percent in both
// modes, item B7): "77 %, 40 °L" for a malt, "14.4 %" for a boil hop, and
// nothing for a dry hop. A strain shows its lab and what a pick sets:
// "Fermentis, Lager".
export function suggestionDetail(field, item) {
  if (field === 'malts') return `${pct(item.fgdb)}, ${roundForInput(item.colorL)} °L`;
  if (field === 'kettleAdditions') return pct(item.alphaAcidFraction);
  if (field === 'yeasts') return `${item.lab}, ${YEAST_TYPE[item.type]}`;
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

// The list's strain named `name`: the same name, capitals and surrounding
// spaces ignored; undefined when there is none.
function findStrain(name) {
  const wanted = String(name ?? '').trim().toLowerCase();
  if (wanted === '') return undefined;
  return ingredients.yeasts.find((y) => y.name.trim().toLowerCase() === wanted);
}

// A strain's lab range as text, "60–72 °F"; null when the list gives none.
function labRange(item) {
  if (!Number.isFinite(item.labTempLowF) || !Number.isFinite(item.labTempHighF)) return null;
  return `${roundForInput(item.labTempLowF)}–${roundForInput(item.labTempHighF)} ${tempUnit()}`;
}

// What the Yeast card shows for a strain on the list, as text: its lab,
// product code, ale/lager, lab range and attenuation, the list's current
// figures (item Q5). null for a blank strain or one not on the list (Q4).
export function strainInfo(name) {
  const item = findStrain(name);
  if (!item) return null;
  return {
    lab: item.lab,
    productCode: item.productCode,
    type: YEAST_TYPE[item.type],
    labRange: labRange(item),
    attenuation: pct(item.apparentAttenuation),
  };
}

// The Yeast card's warning (item Y8): text naming the strain's lab range when
// the fermentation temperature (degF) lies outside it, both ends inside;
// otherwise null. A comparison against the list's cells, not brewing math: a
// blank temperature, a strain not on the list, or one with no lab range gives
// none. It changes no number and blocks nothing.
export function fermTempWarning(name, fermTempF) {
  const item = findStrain(name);
  if (!item || !Number.isFinite(fermTempF) || labRange(item) === null) return null;
  if (fermTempF >= item.labTempLowF && fermTempF <= item.labTempHighF) return null;
  return `Outside this strain's lab range, ${labRange(item)}`;
}
