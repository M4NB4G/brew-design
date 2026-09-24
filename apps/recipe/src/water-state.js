// water-state.js
// The Water tab's entries (docs/items/water-tab.md). Kept beside the recipe,
// never in the recipe state or its saved document, and not saved at all yet
// (W6: saved with the recipe from S4). Canonical units, as the engine's water
// chemistry takes them: the test results in mg/L (ppm; pH in SU), the volume
// in US gal, salts in g, liquid acid in mL and acidulated malt in g. A blank
// test result is NaN, never 0 (W5, SPEC rule 8).
import { SALT_CONTRIBUTIONS_PER_G_GAL } from '@brew/engine';

// The water test report's rows, in its order (Brew Water Chem, WaterInTab.jsx).
export const TEST_RESULT_KEYS = ['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'Alkalinity', 'pH'];

// Brew Water Chem's "Load Example": Bristlecone Brewing Co. sample
// 20251022-1, HLT, from a Persyn Chemical Engineering test report.
export const EXAMPLE_SOURCE = { Ca: 8, Mg: 2, Na: 22, SO4: 0, Cl: 20, Alkalinity: 50, pH: 7.2 };

// Brew Water Chem's "RO Water": a realistic reverse-osmosis permeate.
export const RO_SOURCE = { Ca: 1, Mg: 1, Na: 1, SO4: 0, Cl: 1, Alkalinity: 5, pH: 6.5 };

// A fresh Water tab: every test result blank; the water app's Home volume,
// 5 gal (W4), its style, alkalinity source, salts on hand and acid.
export function defaultWaterState() {
  return {
    source: Object.fromEntries(TEST_RESULT_KEYS.map((k) => [k, NaN])),
    styleId: 'hoppy_ale',
    volumeGal: 5,
    raiseAlkSource: 'baking_soda',
    enabledSalts: Object.keys(SALT_CONTRIBUTIONS_PER_G_GAL),
    // The brewer's own salt amounts, g: sparse, a salt absent follows the recommendation.
    saltOverrides: {},
    // The brewer's own acid amounts, one per acid; null follows the recommendation.
    acidAmounts: null,
    primaryAcid: 'lactic_88',
    multiAcid: false,
  };
}
