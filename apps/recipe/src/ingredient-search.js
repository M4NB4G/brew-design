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
// percent and the °C readouts come from display.js.
//
// My ingredients (docs/items/my-ingredients.md): the brewer's own malts and
// hops, kept with My brewery's figures, `{ malts, hops }`, each entry with the
// owner's list's keys. The malt and hop boxes offer them first, marked as
// yours (MI-S3, MI-Q11), and a pick copies their numbers as it copies the
// owner's. A malt or boil-hop name box offers to save a typed name that is
// not on the owner's list (MI-S1, MI-S4, MI-Q3).
import { MALT_TYPES } from '@brew/engine';
import ingredients from './ingredients.json';
import { fractionToPercent, percentUnit, tempUnit, tempReadout } from './display.js';
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
// the pitch rate; its attenuation and lab range are never copied (Y3, Y4). A
// malt's type and its two lab figures go with it (mash pH, MP-S3): all three
// always, so no figure of a malt picked before stays.
const PICKED_KEYS = {
  malts: ['fgdb', 'colorL', 'type', 'distilledWaterPh', 'acidityMeqPerKg'],
  kettleAdditions: ['alphaAcidFraction'],
  dryHops: [],
  yeasts: ['type'],
};

const YEAST_TYPE = { ale: 'Ale', lager: 'Lager' };

// A new row: an empty name and today's starting numbers (item B5); a malt's
// type blank until picked or chosen, and no lab figures (mash pH, MP-S3); its
// price blank (cost of a batch, EC-S3). A pick never writes a price.
const NEW_ROW = {
  malts: { name: '', weightLb: 1, fgdb: 0.8, colorL: 2, type: '', distilledWaterPh: NaN, acidityMeqPerKg: NaN, pricePerLb: NaN },
  kettleAdditions: { name: '', timeMin: 10, wortTempF: 212, weightOz: 1, alphaAcidFraction: 0.1, pricePerOz: NaN },
  dryHops: { name: '', weightOz: 1, pricePerOz: NaN },
};

// For matching only: capitals and accents ignored ("Mittelfrüh" ~ "mittelfruh").
function fold(text) {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

// Which of My ingredients' lists each kind of row offers; a strain has none (MI-Q1).
const MINE = { malts: 'malts', kettleAdditions: 'hops', dryHops: 'hops' };

// Two names are the same with capitals, accents and surrounding spaces ignored (MI-Q4).
const sameName = (a, b) => fold(String(a)).trim() === fold(String(b)).trim();

// `items` whose searched texts contain `q`, those starting with it first,
// each group in the list's order.
function ranked(field, items, q) {
  const starts = [];
  const contains = [];
  for (const item of items) {
    const texts = SEARCHED[field].map((key) => fold(String(item[key])));
    if (texts.some((t) => t.startsWith(q))) starts.push(item);
    else if (texts.some((t) => t.includes(q))) contains.push(item);
  }
  return [...starts, ...contains];
}

// Ingredients whose name (for a strain: name, lab or product code) contains
// the typed text: the brewer's own first (`mine`, My ingredients), each marked
// `yours`, in the order saved; then the owner's list in the workbook's order;
// within each, those starting with the text first (MI-Q11). Blank text
// suggests nothing.
export function searchIngredients(field, text, mine) {
  const q = fold(text).trim();
  if (q === '') return [];
  const yours = (MINE[field] && mine?.[MINE[field]]) || [];
  return [...ranked(field, yours, q).map((item) => ({ ...item, yours: true })), ...ranked(field, LIST[field], q)];
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
// every other number of the row left as it was. A lab figure the list leaves
// blank (null) is a blank figure (NaN) in the recipe (SPEC rule 8).
export function pickIngredient(field, row, item) {
  const picked = { ...row, name: item.name };
  for (const key of PICKED_KEYS[field]) picked[key] = item[key] === null ? NaN : item[key];
  return picked;
}

// --- My ingredients -----------------------------------------------------------

// What a save keeps of a row: its name and the numbers a pick copies (MI-S1);
// a dry hop has none to keep, so is never saved. The figures a save cannot be
// without (MI-Q3), as the refusal names them.
const SAVED = {
  malts: { list: 'malts', required: [['fgdb', 'FGDB'], ['colorL', 'colour']] },
  kettleAdditions: { list: 'hops', required: [['alphaAcidFraction', 'alpha']] },
};

// The mash pH model reads a lab figure only on its types (as the owner's
// list is checked, mash pH item 2): the distilled-water pH a base malt's, the
// acidity a crystal, roast or acidulated malt's.
const LAB_TYPES = { distilledWaterPh: ['base'], acidityMeqPerKg: ['crystal', 'roast', 'acidulated'] };

const isRecord = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

/**
 * One entry of My ingredients' `list` ('malts' or 'hops'), checked as the
 * owner's list is: a name; a malt's FGDB and colour numbers, its type blank
 * ('') or one the mash pH model knows, each lab figure blank (null) or a
 * number on a type that reads it; a hop's alpha a number. Returns the entry
 * with those keys only, or null when it is not one. The brewery document's
 * reader and the save both use it, so a save never keeps what a load refuses.
 */
export function myIngredientOf(list, entry) {
  if (!isRecord(entry) || typeof entry.name !== 'string' || entry.name.trim() === '') return null;
  if (list === 'hops') {
    return Number.isFinite(entry.alphaAcidFraction) ? { name: entry.name, alphaAcidFraction: entry.alphaAcidFraction } : null;
  }
  const { name, fgdb, colorL, type, distilledWaterPh, acidityMeqPerKg } = entry;
  if (!Number.isFinite(fgdb) || !Number.isFinite(colorL)) return null;
  if (type !== '' && !MALT_TYPES.includes(type)) return null;
  for (const [key, types] of Object.entries(LAB_TYPES)) {
    const v = entry[key];
    if (v !== null && !(Number.isFinite(v) && types.includes(type))) return null;
  }
  return { name, fgdb, colorL, type, distilledWaterPh, acidityMeqPerKg };
}

const shownOrBlank = (v) => (Number.isFinite(v) ? roundForInput(v) : '—');

// The numbers a save keeps, as the save line shows them (MI-S1): a malt's
// FGDB and colour as its suggestion shows them, its type and the two lab
// figures, "—" where blank; a hop's alpha.
function keptDetail(field, entry) {
  if (field === 'kettleAdditions') return `alpha ${suggestionDetail(field, entry)}`;
  const type = entry.type ? entry.type[0].toUpperCase() + entry.type.slice(1) : '—';
  const acidity = Number.isFinite(entry.acidityMeqPerKg) ? `${roundForInput(entry.acidityMeqPerKg)} mEq/kg` : '—';
  return `${suggestionDetail(field, entry)}, type ${type}, distilled-water pH ${shownOrBlank(entry.distilledWaterPh)}, acidity ${acidity}`;
}

/**
 * The line under a malt or boil-hop name box that offers to save the typed
 * name to My ingredients (`mine`), or null for none: a dry hop, a strain, a
 * blank name. A name on the owner's list is refused, and so is a row with a
 * blank FGDB, colour or alpha: { refused: text } (MI-S4, MI-Q3). Otherwise
 * { entry, detail, replaces }: what a save keeps, as text, and whether it
 * replaces one of the brewer's own of the same name (MI-S4).
 */
export function saveOffer(field, row, mine) {
  const saved = SAVED[field];
  const name = String(row.name ?? '').trim();
  if (!saved || name === '') return null;
  if (LIST[field].some((item) => sameName(item.name, name))) {
    return { refused: 'Already on the ingredient list: rename it to save your own' };
  }
  const blank = saved.required.filter(([key]) => !Number.isFinite(row[key])).map(([, label]) => label);
  if (blank.length > 0) {
    return { refused: `Can't save to my ingredients: ${blank.join(' and ')} ${blank.length === 1 ? 'is' : 'are'} blank` };
  }
  const figures = Object.fromEntries(PICKED_KEYS[field].map((key) => [key, Number.isFinite(row[key]) || typeof row[key] === 'string' ? row[key] : null]));
  const entry = myIngredientOf(saved.list, { name, ...figures });
  if (!entry) return { refused: "Can't save to my ingredients: a lab figure does not fit its malt type" };
  return {
    entry,
    detail: keptDetail(field, entry),
    replaces: (mine?.[saved.list] ?? []).some((item) => sameName(item.name, name)),
  };
}

/**
 * My ingredients with `entry` saved from a `field` row: in place of the one of
 * the same name, if any (MI-S4), else last (MI-Q11: in the order saved).
 * Saving the same entry twice gives the same list (K').
 */
export function withMyIngredient(mine, field, entry) {
  const list = SAVED[field].list;
  const items = mine[list];
  const at = items.findIndex((item) => sameName(item.name, entry.name));
  const next = at === -1 ? [...items, entry] : items.map((item, i) => (i === at ? entry : item));
  return { ...mine, [list]: next };
}

/** My ingredients without the `list` entry named `name` (MI-S5'). */
export function withoutMyIngredient(mine, list, name) {
  return { ...mine, [list]: mine[list].filter((item) => item.name !== name) };
}

// The malt row after the brewer chooses its type by hand (MP-S3): the type,
// and no lab figures — a measured figure belongs to the malt it was picked
// as, not to a type chosen in its place.
export function chooseMaltType(row, type) {
  return { ...row, type, distilledWaterPh: NaN, acidityMeqPerKg: NaN };
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

// A strain's lab range as text in the header's unit, "60–72 °F" or
// "16–22 °C" (whole degrees, CT-S3); null when the list gives none.
function labRange(item, temperatureUnit) {
  if (!Number.isFinite(item.labTempLowF) || !Number.isFinite(item.labTempHighF)) return null;
  const end = (tempF) => (temperatureUnit === 'C' ? tempReadout(tempF, 'C') : roundForInput(tempF));
  return `${end(item.labTempLowF)}–${end(item.labTempHighF)} ${tempUnit(temperatureUnit)}`;
}

// What the Yeast card shows for a strain on the list, as text: its lab,
// product code, ale/lager, lab range and attenuation, the list's current
// figures (item Q5), its range in the header's unit. null for a blank strain
// or one not on the list (Q4).
export function strainInfo(name, temperatureUnit) {
  const item = findStrain(name);
  if (!item) return null;
  return {
    lab: item.lab,
    productCode: item.productCode,
    type: YEAST_TYPE[item.type],
    labRange: labRange(item, temperatureUnit),
    attenuation: pct(item.apparentAttenuation),
  };
}

// The Yeast card's warning (item Y8): text naming the strain's lab range when
// the fermentation temperature (degF) lies outside it, both ends inside;
// otherwise null. A comparison against the list's cells in degF, not brewing
// math; the range it names is in the header's unit. A blank temperature, a
// strain not on the list, or one with no lab range gives none. It changes no
// number and blocks nothing.
export function fermTempWarning(name, fermTempF, temperatureUnit) {
  const item = findStrain(name);
  if (!item || !Number.isFinite(fermTempF) || labRange(item) === null) return null;
  if (fermTempF >= item.labTempLowF && fermTempF <= item.labTempHighF) return null;
  return `Outside this strain's lab range, ${labRange(item, temperatureUnit)}`;
}
