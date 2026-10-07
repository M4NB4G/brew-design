// water-state.js
// The Water tab's entries (docs/items/water-tab.md): part of the recipe,
// its `water` field, saved and reset with it (docs/items/water-saved.md).
// Canonical units, as the engine's water
// chemistry takes them: the test results in mg/L (ppm; pH in SU), volumes in
// US gal, grain absorption in qt/lb, salts in g, liquid acid in mL and
// acidulated malt in g. A blank test result or setup figure is NaN, never 0
// (W5, SPEC rule 8).
//
// Where the water is treated (docs/items/water-treatment.md): the mash water
// (the recipe's) or the hot-liquor tank's first fill, with salts in the
// kettle as a switch on either, and the brewery setup the sums need. The
// treated volume comes from the recipe or the tank; the typed volume is gone
// (WT-S8).
import { SALT_CONTRIBUTIONS_PER_G_GAL, ACIDS, GRAIN_ABSORPTION_QT_PER_LB, MASH_PH_TARGET } from '@brew/engine';

// The water test report's rows, in its order (Brew Water Chem, WaterInTab.jsx).
export const TEST_RESULT_KEYS = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'Alkalinity', 'pH'];

// Brew Water Chem's "Load Example": Bristlecone Brewing Co. sample
// 20251022-1, HLT, from a Persyn Chemical Engineering test report.
export const EXAMPLE_SOURCE = { Ca: 8, Mg: 2, Na: 22, SO4: 0, Cl: 20, Alkalinity: 50, pH: 7.2 };

// Brew Water Chem's "RO Water": a realistic reverse-osmosis permeate.
export const RO_SOURCE = { Ca: 1, Mg: 1, Na: 1, SO4: 0, Cl: 1, Alkalinity: 5, pH: 6.5 };

// The choices, in the order the Water tab offers them.
export const TREATMENTS = ['mash', 'tank'];
// Where the acid goes with the tank treated (S5b item C, AM-S1): with the
// salts in the tank's first fill, or into the mash.
export const ACID_PLACES = ['salts', 'mash'];
export const SPARGE_METHODS = ['none', 'batch', 'fly'];
export const VESSEL_COUNTS = [1, 2, 3];

// A fresh Water tab: every test result blank; the water app's style,
// alkalinity source, salts on hand and acid; the built-in treatment and setup
// (item Q9): the mash water treated, no kettle salts, three vessels, batch
// sparge, the tank's volumes blank, the owner's grain absorption (Q3) and
// the sparge water blank until typed (S4b item 1: the sparge is typed; the
// water left in the mash tun is worked out).
export function defaultWaterState() {
  return {
    source: Object.fromEntries(TEST_RESULT_KEYS.map((k) => [k, NaN])),
    styleId: 'hoppy_ale',
    raiseAlkSource: 'baking_soda',
    enabledSalts: Object.keys(SALT_CONTRIBUTIONS_PER_G_GAL),
    // The brewer's own salt amounts, g: sparse, a salt absent follows the recommendation.
    saltOverrides: {},
    // The brewer's own acid amounts, one per acid; null follows the recommendation.
    acidAmounts: null,
    primaryAcid: 'lactic_88',
    multiAcid: false,
    // The mash pH the acid aims at, a cooled sample (AA-S2): the engine's
    // default, the middle of the cooled-sample range.
    mashPhTarget: MASH_PH_TARGET,
    treatment: 'mash',
    // The acid with the salts (AM-Q3).
    acidPlace: 'salts',
    kettleSalts: false,
    vessels: 3,
    spargeMethod: 'batch',
    tankTreatedGal: NaN,
    tankTopUpGal: NaN,
    absorptionQtPerLb: GRAIN_ABSORPTION_QT_PER_LB,
    spargeGal: NaN,
  };
}

/**
 * The treatment and sparge the setup can use, and the choices it offers
 * (WT-S7, Q5): one vessel has no sparge, so the mash water is the only
 * treatment; two or three vessels offer both treatments and every sparge.
 * A choice the setup cannot use is not offered, and not used.
 */
export function effectiveSetup(water) {
  const one = water.vessels === 1;
  const treatments = one ? ['mash'] : [...TREATMENTS];
  const treatment = treatments.includes(water.treatment) ? water.treatment : 'mash';
  const offered = {
    treatments,
    spargeMethods: one ? ['none'] : [...SPARGE_METHODS],
    // With the mash water treated the acid and the salts go in the same
    // water: no choice (AM-S1).
    acidPlaces: treatment === 'tank' ? [...ACID_PLACES] : ['salts'],
  };
  return {
    vessels: water.vessels,
    treatment,
    acidPlace: offered.acidPlaces.includes(water.acidPlace) ? water.acidPlace : 'salts',
    spargeMethod: offered.spargeMethods.includes(water.spargeMethod) ? water.spargeMethod : 'none',
    kettleSalts: water.kettleSalts,
    offered,
  };
}

// --- Changing the entries ----------------------------------------------------
// Each step returns new entries and leaves the old ones as they were. They
// follow the water app's App.jsx: changing the style, the salts on hand or
// the alkalinity-raising salt returns the brewer's own salt and acid amounts
// to the recommendation (scope table, K ordering); so does changing a treated
// volume (water treatment K); a new test result returns the acid to it (the
// water app re-synced its acid whenever the recommendation changed) and keeps
// the brewer's salts. `current` is the acid amounts on screen
// (computeWater(water, recipe).acid.amounts), for the steps that keep them.
// Home/Pro is not a step: the volumes stay in gallons (W3).

const ACID_KEYS = Object.keys(ACIDS);
const noAcid = () => Object.fromEntries(ACID_KEYS.map((k) => [k, 0]));
const toRecommendation = (water) => ({ ...water, saltOverrides: {}, acidAmounts: null });

export function setTestResult(water, key, value) {
  return { ...water, source: { ...water.source, [key]: value }, acidAmounts: null };
}

// "Load Example" and "RO Water": all seven results at once.
export function fillTestResults(water, values) {
  return { ...water, source: { ...water.source, ...values }, acidAmounts: null };
}

export function setWaterStyle(water, styleId) {
  return toRecommendation({ ...water, styleId });
}

// The setup figures that change what volume is treated: the treatment, the
// vessels (one vessel treats the mash water) and the tank's treated volume.
const CHANGES_TREATED_VOLUME = ['treatment', 'vessels', 'tankTreatedGal'];

// One of the treatment choice and setup: treatment, acidPlace, kettleSalts,
// vessels, spargeMethod, tankTreatedGal, tankTopUpGal, absorptionQtPerLb,
// spargeGal. Moving the acid changes the water it is dosed for: the acid
// returns to the recommendation, the brewer's salts stay.
export function setWaterSetup(water, key, value) {
  const next = { ...water, [key]: value };
  if (key === 'acidPlace') return { ...next, acidAmounts: null };
  return CHANGES_TREATED_VOLUME.includes(key) ? toRecommendation(next) : next;
}

// The recipe's mash water changed: when it is the treated water, the
// brewer's own amounts return to the recommendation (water treatment K);
// when the acid goes into the mash, the acid does (AM-S2).
export function mashWaterChanged(water) {
  const setup = effectiveSetup(water);
  if (setup.treatment === 'mash') return toRecommendation(water);
  return setup.acidPlace === 'mash' ? { ...water, acidAmounts: null } : water;
}

// The target mash pH moves the acid recommendation: the brewer's own acid
// returns to it, the brewer's salts stay (AA-S4).
export function setMashPhTarget(water, mashPhTarget) {
  return { ...water, mashPhTarget, acidAmounts: null };
}

export function setRaiseAlkSource(water, raiseAlkSource) {
  return toRecommendation({ ...water, raiseAlkSource });
}

export function toggleSaltOnHand(water, key) {
  const on = water.enabledSalts.includes(key);
  const enabledSalts = on ? water.enabledSalts.filter((k) => k !== key) : [...water.enabledSalts, key];
  return toRecommendation({ ...water, enabledSalts });
}

export function setSaltAmount(water, key, grams) {
  return { ...water, saltOverrides: { ...water.saltOverrides, [key]: grams } };
}

export function setAcidAmount(water, current, key, amount) {
  return { ...water, acidAmounts: { ...current, [key]: amount } };
}

// One acid: picking another shows the recommendation in it (the same mEq).
// Several acids: the pick only names the primary; every amount stays.
export function setPrimaryAcid(water, current, primaryAcid) {
  return { ...water, primaryAcid, acidAmounts: water.multiAcid ? { ...current } : null };
}

// Back to one acid: only the primary's amount stays, so no hidden acid
// changes the predicted profile.
export function setMultiAcid(water, current, multiAcid) {
  if (multiAcid) return { ...water, multiAcid };
  return {
    ...water,
    multiAcid,
    acidAmounts: { ...noAcid(), [water.primaryAcid]: current[water.primaryAcid] ?? 0 },
  };
}

export function resetToRecommended(water) {
  return toRecommendation(water);
}
