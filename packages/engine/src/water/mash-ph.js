// The predicted mash pH, as a cooled sample reads, from the grain bill and the
// treated mash water (docs/items/mash-ph.md, water program step 5).
//
// Kai Troester's model as his 2009 paper publishes it: "The effect of brewing
// water and grist composition on the pH of the mash", braukaiser.com, 2009
// (docs/sources/effect_of_water_and_grist_on_mash_pH.pdf; archived at
// web.archive.org/web/20250906010619/https://braukaiser.com/documents/effect_of_water_and_grist_on_mash_pH.pdf).
// Section numbers below are the paper's. The owner's decisions S5-B12 to B15
// settle how it is read.
//
// Malts in lb, colour in degL, mash water in US gallons as entered, the water
// as the Water tab's treated profile (mg/L; alkalinity as CaCO3). A blank
// figure (NaN) the model needs blanks the pH.

import { LITERS_PER_GALLON, G_PER_LB } from '../units.js';
import { residualAlkalinity } from './ra.js';
import { acidCapacity } from './acids.js';

// mg/L as CaCO3 per mEq/L: the figure the engine's acid sums use (acids.js).
const MG_CACO3_PER_MEQ = 50.04;

// §3.5: a specialty malt counts at the pH its acidity was titrated to.
const SPECIALTY_TITRATION_PH = 5.7;
// §3.4: the grist pH falls 0.14 pH per mEq/L of specialty-malt acidity per
// litre of strike water.
const SPECIALTY_ACIDITY_SLOPE = 0.14;
// §3.3: crystal malts' acidity from colour, mEq/kg = 14 + 0.13 x EBC (r2 0.77).
const CRYSTAL_ACIDITY_BASE = 14;
const CRYSTAL_ACIDITY_PER_EBC = 0.13;
// §3.3: roasted malts, about 40 mEq/kg regardless of colour.
const ROAST_ACIDITY = 40;
// §2: EBC = degL x 2.65 - 1.2.
const EBC_PER_LOVIBOND = 2.65;
const EBC_OFFSET = 1.2;
const ebc = (colorL) => colorL * EBC_PER_LOVIBOND - EBC_OFFSET;
// §3.1, Figure 5: base malts' distilled-water pH over colour, the trend line
// the figure prints, f(x) = -0.02x + 5.82 with x in EBC (S5-B16).
// FLAG: a loose fit (r2 0.54; the paper says a base malt's figure "needs to
// be known" for an accurate prediction), its coefficients as printed to two
// decimals (a refit of Table 2 gives -0.0207 and 5.822), and fitted on base
// malts of 3.5-25 EBC (about 1.8-9.9 degL); a darker malt typed base is
// carried past that range as the line gives it. A measured figure replaces it.
const BASE_PH_AT_ZERO_EBC = 5.82;
const BASE_PH_PER_EBC = -0.02;
// §3.10: the pH over residual alkalinity slope, pH.L/mEq = 0.013 x R + 0.013.
// FLAG: fitted on pulverized grist (§2, §3.11); a two-roller crush made it
// steeper in his tests (0.063 pulverized to 0.094 at a 1.2 mm gap for
// Pilsner malt, Table 18). Kept as published (S5-B15), not adjusted.
const SLOPE_PER_THICKNESS = 0.013;
const SLOPE_AT_ZERO = 0.013;

/** The malt types the model knows; 'none' counts as nothing in the mash (S5-B10). */
export const MALT_TYPES = Object.freeze(['base', 'crystal', 'roast', 'acidulated', 'none']);

const given = (v) => typeof v === 'number' && Number.isFinite(v);

// A specialty malt's acidity, mEq/kg: its measured figure where given (S5-B13),
// otherwise its type's rule (S5-B14).
function specialtyAcidity(m) {
  if (given(m.acidityMeqPerKg)) return m.acidityMeqPerKg;
  if (m.type === 'crystal') {
    return CRYSTAL_ACIDITY_BASE + CRYSTAL_ACIDITY_PER_EBC * ebc(m.colorL);
  }
  if (m.type === 'roast') return ROAST_ACIDITY;
  // Acidulated malt by its lactic acid at the Water tab's figure (S5-B14):
  // mEq/g x 1000 g/kg.
  // FLAG: the acid table's 2 % lactic; Troester titrated Weyermann Sauermalz
  // at 315-358 mEq/kg, ~3 % (§3.3). Roadmap: "Acidulated malt's lactic acid".
  return acidCapacity('acidulated_malt') * 1000;
}

/**
 * The predicted mash pH of a cooled sample (MP-S1).
 *
 * @param {object} p
 * @param {Array<{type, weightLb, colorL, distilledWaterPh?, acidityMeqPerKg?}>} p.malts
 *   type is one of MALT_TYPES; a base or crystal malt needs its colour
 *   unless its distilled-water pH or acidity is measured
 * @param {number} p.mashWaterGal the recipe's mash water, as entered
 * @param {{Alk, Ca, Mg}} p.water the treated mash water (mg/L; Alk as CaCO3)
 * @returns {number} pH; NaN when a figure the model needs is blank
 */
export function mashPh({ malts, mashWaterGal, water }) {
  const inMash = (malts ?? []).filter((m) => m.type !== 'none');
  let grainLb = 0;
  for (const m of inMash) {
    if (!MALT_TYPES.includes(m.type) || !given(m.weightLb)) return NaN;
    grainLb += m.weightLb;
  }
  if (!(grainLb > 0) || !given(mashWaterGal)) return NaN;

  // Mash thickness, L of mash water per kg of grain.
  const r = (mashWaterGal * LITERS_PER_GALLON) / ((grainLb * G_PER_LB) / 1000);

  // §3.5: the grist's distilled-water pH.
  let basePh = 0;
  let specialtyShare = 0;
  let specialtyAcid = 0;
  for (const m of inMash) {
    const share = m.weightLb / grainLb;
    if (m.type === 'base') {
      // Its measured figure where given (S5-B13), otherwise the line (S5-B16).
      const ph = given(m.distilledWaterPh) ? m.distilledWaterPh : BASE_PH_AT_ZERO_EBC + BASE_PH_PER_EBC * ebc(m.colorL);
      if (!given(ph)) return NaN;
      basePh += ph * share;
    } else {
      specialtyShare += share;
      specialtyAcid += specialtyAcidity(m) * share;
    }
  }
  const gristPh = basePh + SPECIALTY_TITRATION_PH * specialtyShare - (SPECIALTY_ACIDITY_SLOPE * specialtyAcid) / r;

  // §3.6, §3.10: the water moves it by its residual alkalinity (the Water
  // tab's, Kolbach: S5-B15), in mEq/L.
  const raMeq = residualAlkalinity(water?.Alk, water?.Ca, water?.Mg) / MG_CACO3_PER_MEQ;
  return gristPh + (SLOPE_PER_THICKNESS * r + SLOPE_AT_ZERO) * raMeq;
}
