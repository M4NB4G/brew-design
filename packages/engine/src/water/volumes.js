// The water volumes from the recipe, the hot-liquor tank's draws, and the
// kettle salt balance (docs/items/water-treatment.md, water program step 4).
//
// Where the water is treated — the mash water, or the hot-liquor tank's first
// fill — and whether salts also go in the kettle. Nothing here assumes the
// lauter mixes: salts are conserved, every gram put in the mash water reaches
// the kettle, and the sparge brings only what it carries (WP6b, Q7). No
// kettle or wort mineral figure is predicted.
//
// Volumes in US gallons; the pre-boil volume at the 60 degF reference (the
// caller corrects it); mash water as entered; grain in lb; salts in g.
// A blank figure (NaN) blanks every figure that needs it.

import { SALT_CONTRIBUTIONS_PER_G_GAL } from './salts.js';
import { QT_PER_GAL } from '../units.js';

// Water the grain absorbs, qt per lb of grain: the owner's figure
// (2026-10-02, item Q3), superseding Palmer's 0.5 qt/lb (water program WP11),
// which he judged far too high. He checks it on his next brew: total water in
// less pre-boil collected. A brewery sets its own.
export const GRAIN_ABSORPTION_QT_PER_LB = 0.1;

// Volumes typed and summed that come to the same figure differ by no more
// than floating-point round-off (gal), far below any shown precision: a
// kettle filled exactly is not short (7 + 7.5 - 0.5 - 14 at a pre-boil volume
// corrected to 60 degF comes to -1.8e-15).
const SAME_VOLUME_GAL = 1e-9;

/**
 * The water volumes a brew needs (S4b item 1: the brewer types the sparge
 * water; the water left in the mash tun is worked out).
 *
 * @param {object} p
 * @param {Array<{weightLb}>} p.malts  the grain bill
 * @param {number} p.absorptionQtPerLb water the grain absorbs, qt/lb
 * @param {number} p.preBoilGal        the kettle's pre-boil volume at 60 degF
 * @param {number} p.mashWaterGal      the recipe's mash water
 * @param {number} p.spargeGal         the sparge water, as typed
 * @param {'none'|'batch'|'fly'} p.spargeMethod
 * @returns {{ grainLb, absorptionGal, spargeGal, totalGal, mashTunLeftGal, kettleShortGal }}
 *   With none (full volume), there is no sparge water and the mash water is
 *   all the water. The water left in the mash tun is what the mash and
 *   sparge water leave after the grain's absorption and the kettle's
 *   pre-boil volume; below zero (beyond round-off), the kettle is short by
 *   kettleShortGal.
 */
export function waterVolumes({ malts, absorptionQtPerLb, preBoilGal, mashWaterGal, spargeGal, spargeMethod }) {
  const grainLb = malts.reduce((s, m) => s + m.weightLb, 0);
  const absorptionGal = (grainLb * absorptionQtPerLb) / QT_PER_GAL;
  const sparge = spargeMethod !== 'none' ? spargeGal : 0;
  const totalGal = mashWaterGal + sparge;
  const mashTunLeftGal = totalGal - absorptionGal - preBoilGal;
  return {
    grainLb,
    absorptionGal,
    spargeGal: sparge,
    totalGal,
    mashTunLeftGal,
    kettleShortGal: Number.isNaN(mashTunLeftGal) ? NaN : mashTunLeftGal < -SAME_VOLUME_GAL ? -mashTunLeftGal : 0,
  };
}

/**
 * The hot-liquor tank: its first fill is treated; the mash draws its water
 * from it; it is topped up with untreated water to the top-up level (a heated
 * tank is well mixed); the sparge draws the sparge water from it; what the
 * sparge leaves is discarded, never emptied into the mash tun (item B, C).
 *
 * @returns {{ remainingGal, treatedShare, leftGal, toMash, toSparge, left,
 *   mashOverTreated, spargeOverTopUp }}
 *   remainingGal: treated water left after the mash draws; treatedShare: its
 *   share of the topped-up tank, the sparge liquor's treated share; leftGal:
 *   the water left after the sparge, not used. toMash, toSparge and left are
 *   the shares of everything put in the tank (salts and acid) that go to the
 *   mash, are carried by the sparge, and are left. The two warnings: more mash
 *   water than the treated volume; more sparge water than the top-up level.
 *   FLAG: a top-up level below the treated water left gives a share over 1;
 *   kept as the arithmetic gives it (the item's sentences do not say).
 */
export function tankDraws({ treatedGal, topUpGal, mashWaterGal, spargeGal }) {
  const remainingGal = treatedGal - mashWaterGal;
  const leftGal = topUpGal - spargeGal;
  const stays = remainingGal / treatedGal; // share of the additions the mash leaves in the tank
  return {
    remainingGal,
    treatedShare: remainingGal / topUpGal,
    leftGal,
    toMash: mashWaterGal / treatedGal,
    toSparge: stays * (spargeGal / topUpGal),
    left: stays * (leftGal / topUpGal),
    mashOverTreated: mashWaterGal > treatedGal,
    spargeOverTopUp: spargeGal > topUpGal,
  };
}

/** Each amount ({ [key]: amount }) times the same share. */
export function shareOfSalts(amounts, share) {
  const out = {};
  for (const [k, v] of Object.entries(amounts ?? {})) out[k] = v * share;
  return out;
}

/**
 * The kettle salts (item Q7): each salt the whole water (mash plus sparge)
 * needs to reach the target, less what reaches the kettle from the mash and
 * what the sparge carries, never below zero. Salts only: no acid goes in the
 * kettle.
 *
 * @param {object} p
 * @param {{[saltKey]: g}} p.needed     the whole water's salts
 * @param {{[saltKey]: g}} p.fromMash   the salts that reach the kettle from the mash
 * @param {{[saltKey]: g}} p.fromSparge the salts the sparge carries
 * @returns {{[saltKey]: g}} in the order needed, then mash, then sparge first name each salt
 */
export function kettleSalts({ needed, fromMash, fromSparge }) {
  const keys = [...Object.keys(needed ?? {}), ...Object.keys(fromMash ?? {}), ...Object.keys(fromSparge ?? {})]
    .filter((k, i, all) => all.indexOf(k) === i && k in SALT_CONTRIBUTIONS_PER_G_GAL);
  const out = {};
  for (const k of keys) {
    out[k] = Math.max(0, (needed?.[k] ?? 0) - (fromMash?.[k] ?? 0) - (fromSparge?.[k] ?? 0));
  }
  return out;
}

/**
 * The shares of the salts that reach the kettle (S4b item 2, KW-S1): with a
 * sparge (batch or fly), the mash's salts reach it at the recipe's
 * brewhouse efficiency (into the kettle, against FGDB — the owner's measured,
 * equipment-specific figure, standing in for the lauter's recovery of what is
 * dissolved; it also holds the mash's conversion, so it understates salts a
 * little and the kettle salts come out a little generous). The kettle then
 * holds that share of the mash liquor, and the rest of its pre-boil volume is
 * sparge water: the sparge's salts reach it in that proportion. With no
 * sparge the mash is well mixed: the kettle draws pre-boil / mash water of it.
 *
 * @returns {{ mash, sparge }} shares of the mash's and the sparge's salts
 *   FLAG: kept as the arithmetic gives them, past 0 and 1 (the item's
 *   sentences set no limit; the owner decides — roadmap "Kettle shares past
 *   their limits"). A low efficiency against the volumes asks for more
 *   sparge water than there is (a sparge share above 1: at 75 % in the
 *   worked example, 8.75 gal of an 8.5 gal sparge); a high one leaves the
 *   kettle more mash liquor than it holds (a sparge share below 0); with no
 *   sparge, a kettle larger than the mash water — a short kettle, which the
 *   water volumes warn of — gives a mash share above 1. The efficiency holds
 *   the mash's conversion too, so neither limit is a figure the brewer typed.
 */
export function kettleShares({ efficiency, mashWaterGal, spargeGal, preBoilGal, spargeMethod }) {
  if (spargeMethod === 'none') return { mash: preBoilGal / mashWaterGal, sparge: 0 };
  const spargeInKettle = preBoilGal - efficiency * mashWaterGal;
  return { mash: efficiency, sparge: spargeInKettle / spargeGal };
}

/** Amounts of the same salts added together ({ [key]: amount } each). */
export function sumSalts(...lists) {
  const out = {};
  for (const list of lists) {
    for (const [k, v] of Object.entries(list ?? {})) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}
