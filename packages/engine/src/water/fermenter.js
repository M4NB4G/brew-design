// The fermenter's sulfate and chloride with water back on
// (docs/items/fermenter-sulfate-chloride.md, FM-S2, FM-S3, FM-S5): the water
// and salts only, the malt's own not counted, as the style's targets do not
// count it (FM-Q6r). Water back is not in Rev 4: no constant of its own; the
// salt table is Palmer and Kaminski's (salts.js), every figure pinned by hand
// in test/water/fermenter-sulfate-chloride.test.js.
//
// Volumes in US gallons, all at the 60 degF reference (the caller corrects
// them, FM-Q4); concentrations in mg/L. A blank figure (NaN) blanks every
// figure that needs it.

import { SALT_CONTRIBUTIONS_PER_G_GAL } from './salts.js';
import { sulfateChlorideRatio } from './ra.js';
import { volumeAtPitch } from '../water-back.js';

const IONS = ['SO4', 'Cl'];

/**
 * The fermenter's sulfate, chloride and SO4:Cl ratio (FM-S2, FM-S3): the
 * kettle water before the boil, concentrated by the boil (x pre-boil /
 * post-boil volume), then mixed with the water back at the wort from
 * kettle's and the water back's volumes. Sulfate and chloride are kept by
 * mass: what is in the fermenter is what went in the kettle and the water
 * back (K).
 *
 * @param {object} p
 * @param {{SO4, Cl}} p.kettle     the kettle water before the boil, mg/L
 * @param {number} p.preBoilGal    the pre-boil volume
 * @param {number} p.postBoilGal   the post-boil volume
 * @param {number} p.wortGal       the wort from kettle
 * @param {{SO4, Cl}} p.waterBack  the water back's own, mg/L
 * @param {number} p.waterBackGal  the water back
 * @returns {{ SO4, Cl, ratio, pitchGal }} pitchGal: the fermentation volume
 */
export function fermenterSulfateChloride({ kettle, preBoilGal, postBoilGal, wortGal, waterBack, waterBackGal }) {
  const pitchGal = volumeAtPitch(wortGal, waterBackGal);
  const out = { pitchGal };
  for (const ion of IONS) {
    const boiled = (kettle[ion] * preBoilGal) / postBoilGal;
    out[ion] = (boiled * wortGal + waterBack[ion] * waterBackGal) / pitchGal;
  }
  out.ratio = Number.isNaN(out.SO4) || Number.isNaN(out.Cl) ? NaN : sulfateChlorideRatio(out.SO4, out.Cl);
  return out;
}

/**
 * The grams to add to the water back that bring the fermenter to the
 * style's sulfate and chloride (FM-S5, FM-Q9): gypsum for sulfate, calcium
 * chloride for chloride, each the shortfall times the fermentation volume
 * over the salt's mg/L per g per gal; nothing (0) at or above target.
 * Gypsum adds no chloride and calcium chloride no sulfate, so each is
 * worked alone.
 *
 * @param {object} p
 * @param {{SO4, Cl}} p.fermenter  as fermenterSulfateChloride gives them
 * @param {{SO4, Cl}} p.target     the style's, mg/L
 * @param {number} p.pitchGal      the fermentation volume
 * @returns {{ gypsum, calcium_chloride }} g
 */
export function waterBackSaltsToTarget({ fermenter, target, pitchGal }) {
  const grams = (ion, salt) =>
    Math.max(0, ((target[ion] - fermenter[ion]) * pitchGal) / SALT_CONTRIBUTIONS_PER_G_GAL[salt][ion]);
  return { gypsum: grams('SO4', 'gypsum'), calcium_chloride: grams('Cl', 'calcium_chloride') };
}
