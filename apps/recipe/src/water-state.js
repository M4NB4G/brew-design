// water-state.js
// The Water tab's entries (docs/items/water-tab.md). Kept beside the recipe,
// never in the recipe state or its saved document, and not saved at all yet
// (W6: saved with the recipe from S4). Canonical units, as the engine's water
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
import { SALT_CONTRIBUTIONS_PER_G_GAL, ACIDS, GRAIN_ABSORPTION_QT_PER_LB } from '@brew/engine';

// The water test report's rows, in its order (Brew Water Chem, WaterInTab.jsx).
export const TEST_RESULT_KEYS = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'Alkalinity', 'pH'];

// Brew Water Chem's "Load Example": Bristlecone Brewing Co. sample
// 20251022-1, HLT, from a Persyn Chemical Engineering test report.
export const EXAMPLE_SOURCE = { Ca: 8, Mg: 2, Na: 22, SO4: 0, Cl: 20, Alkalinity: 50, pH: 7.2 };

// Brew Water Chem's "RO Water": a realistic reverse-osmosis permeate.
export const RO_SOURCE = { Ca: 1, Mg: 1, Na: 1, SO4: 0, Cl: 1, Alkalinity: 5, pH: 6.5 };

// The choices, in the order the Water tab offers them.
export const TREATMENTS = ['mash', 'tank'];
export const SPARGE_METHODS = ['none', 'batch', 'fly'];
export const VESSEL_COUNTS = [1, 2, 3];

// A fresh Water tab: every test result blank; the water app's style,
// alkalinity source, salts on hand and acid; the built-in treatment and setup
// (item Q9): the mash water treated, no kettle salts, three vessels, batch
// sparge, the tank's volumes blank, the owner's grain absorption (Q3) and
// nothing kept in the mash tun (Q4).
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
    treatment: 'mash',
    kettleSalts: false,
    vessels: 3,
    spargeMethod: 'batch',
    tankTreatedGal: NaN,
    tankTopUpGal: NaN,
    absorptionQtPerLb: GRAIN_ABSORPTION_QT_PER_LB,
    keptInTunGal: 0,
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
  const offered = {
    treatments: one ? ['mash'] : [...TREATMENTS],
    spargeMethods: one ? ['none'] : [...SPARGE_METHODS],
  };
  return {
    vessels: water.vessels,
    treatment: offered.treatments.includes(water.treatment) ? water.treatment : 'mash',
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

// One of the treatment choice and setup: treatment, kettleSalts, vessels,
// spargeMethod, tankTreatedGal, tankTopUpGal, absorptionQtPerLb, keptInTunGal.
export function setWaterSetup(water, key, value) {
  const next = { ...water, [key]: value };
  return CHANGES_TREATED_VOLUME.includes(key) ? toRecommendation(next) : next;
}

// The recipe's mash water changed: when it is the treated water, the
// brewer's own amounts return to the recommendation (water treatment K).
export function mashWaterChanged(water) {
  return effectiveSetup(water).treatment === 'mash' ? toRecommendation(water) : water;
}

// The recipe replaced (Import, Reset): as mashWaterChanged when its mash
// water is not the one before; otherwise the entries as they are.
export function recipeReplaced(water, before, after) {
  return Object.is(before.mashWaterGal, after.mashWaterGal) ? water : mashWaterChanged(water);
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
