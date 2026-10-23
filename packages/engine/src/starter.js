// starter.js
// The starter volume, solved directly (no GoalSeek). Three bands, each with a
// starting pack and a validity rule on cells needed; one growth formula for
// all three.
//
// The growth is the yeast starter calculator's own (MoreBeer's calculator,
// C. White stir plate), as Brewer's Friend publishes it: their fit to C.
// White's data, read 2026-10-23 (brewersfriend.com/yeast-pitch-rate-and-
// starter-calculator), sized on a fresh pack, 100 % viable. This is a
// departure from Rev 4's Starter Vol Solver curves, which were fitted to the
// calculator read with a 97 %-viable pack: the owner's decision, 2026-10-23
// (docs/items/starter-calculator-formula.md, SPEC.md rule 2).
//
// Pure functions. The bands' inequalities are reproduced exactly from the
// spreadsheet, except the two limits that keep every starter within 5 L, the
// owner's (SL-2, SL-3): the 200B pack alone below 670 (Rev 4: 700) and the
// top at 1,270 (below). The 400B band's 800-1000 boundary is Rev 4's own rule: the
// owner's correction of Rev 3's N11 (2026-10-08), his rule since 2026-09-21
// (SPEC.md rule 2). Do not alter the boundary logic.

// DME loading: 115 g per liter of starter.
const DME_GRAMS_PER_LITER = 115;

// Growth, cells grown per cell pitched, at the inoculation rate x (billion
// cells per litre = million cells per mL): Brewer's Friend's fit to C.
// White's data, "G = (12.54793776 * x^-0.4594858324) - 0.9994994906", plus
// their "+1.0 boost to growth factor" for a stir plate. Their notes also cap
// growth at 6; no count the bands serve needs more than 3 (the largest
// multiple N / S, below 4, is the 100B pack's just under 400), so the cap is
// never reached and is not applied.
const GROWTH_K = 12.54793776;
const GROWTH_P = 0.4594858324;
const GROWTH_OFFSET = 0.9994994906;
const STIR_PLATE_BOOST = 1.0;

// Saturation, million cells per mL: at this rate and above the starter does
// not grow past one doubling, so no starter is smaller than pack / 200 L.
const SATURATION_RATE = 200;

// No starter is larger than 5 L, the largest a homebrewer makes (the owner,
// 2026-10-23, SL-1; docs/items/starter-calculator-formula.md). The formula
// never runs out, so the bands' limits keep every option within it, each the
// last count in tens whose starter is at most 5 L:
// - the 200B pack alone serves below 670 (660 needs 4.98 L, 670 would need
//   5.22 L), and takes its extra 200B pack from 670 (SL-2);
// - the 400B pack with its extra 200B pack serves through 1,270 (4.99 L;
//   1,280 would need 5.16 L), the top of the range (SL-3).
// FLAG: the 200B limit is set on counts in tens, as the app's cells needed
// always is (computeCellsNeeded rounds to the nearest 10). A count between
// 660 and 670, which the app never asks for, passes 5 L on the 200B pack
// alone: 661-669 need 5.00-5.19 L. Kept as the owner agreed the limit, in
// tens (SL-2). The top is a hard stop: nothing above 1,270 is served.
const SINGLE_200B_BELOW = 670;
const MAX_CELLS = 1270;

/**
 * Band definitions. `effectiveCells(cells)` returns the effective cell count
 * N for that band's solver, plus any pack note, or null when the band is not
 * usable for the given cells-needed value.
 *
 * FLAG: The spreadsheet's validity rules use strict inequalities that leave
 * exact-boundary gaps at 500 and 800 billion -- a value landing exactly on
 * one of those boundaries matches no branch and yields no option from the
 * affected band(s). This is transcribed as-is per the spec (faithfulness over
 * "fixing" it). See each band's effectiveCells() below. The 400B band's
 * boundaries, 800 and 1000, leave no gap -- see its effectiveCells() for the
 * owner's rule.
 */
const BANDS = [
  {
    band: '100B',
    startCells: 100,
    effectiveCells(cells) {
      // cells<250 -> not usable
      // 250<=cells<400 -> N=cells
      // 400<=cells<500 -> N=cells-100 (100B starter + one extra 100B pack)
      // cells>500 -> not usable
      // FLAG: cells===500 falls through every branch (boundary gap at 500).
      if (cells < 250) return null;
      if (cells < 400) return { N: cells, packNote: '' };
      if (cells < 500) {
        return { N: cells - 100, packNote: '100B starter plus one extra 100B pack' };
      }
      return null;
    },
  },
  {
    band: '200B',
    startCells: 200,
    effectiveCells(cells) {
      // cells<400 -> not usable
      // 400<=cells<670 -> N=cells
      // 670<=cells<800 -> N=cells-200 (200B starter + one extra 200B pack)
      // The pack alone up to 670 (SINGLE_200B_BELOW), not Rev 4's 700: above
      // it the starter would pass 5 L (SL-2).
      // cells>800 -> not usable
      // FLAG: cells===800 falls through every branch (boundary gap at 800).
      if (cells < 400) return null;
      if (cells < SINGLE_200B_BELOW) return { N: cells, packNote: '' };
      if (cells < 800) {
        return { N: cells - 200, packNote: '200B starter plus one extra 200B pack' };
      }
      return null;
    },
  },
  {
    band: '400B',
    startCells: 400,
    effectiveCells(cells) {
      // cells<800 -> not usable
      // 800<=cells<=1000 -> N=cells (400B starter alone)
      // 1000<cells<=1270 -> N=cells-200 (400B starter + one extra 200B pack)
      // cells>1270 -> not usable (MAX_CELLS, the 5 L limit)
      // Rev 4's own rule (Starter Vol Solver N11): the owner's correction of
      // Rev 3's strict 900 boundary (2026-10-08), his rule since 2026-09-21.
      // The 400B band serves 800-1000 billion cells inclusive from the pack
      // alone, and above 1000 with one extra 200B pack (SPEC.md rule 2).
      if (cells < 800) return null;
      if (cells <= 1000) return { N: cells, packNote: '' };
      if (cells <= MAX_CELLS) {
        return { N: cells - 200, packNote: '400B starter plus one extra 200B pack' };
      }
      return null;
    },
  },
];

/**
 * The starter volume, in litres, at which a pack of startCells reaches
 * neededMultiple times itself: N = S * (1 + g(S / V)), g as above, solved for
 * V directly. Never smaller than the step volume, S / SATURATION_RATE; the
 * formula run smoothly meets the step at 2.1002x, so the volume is continuous
 * and never falls as the multiple rises.
 *
 * FLAG: the calculator's own step sits at exactly S / 200 (400B: 2.00 L gives
 * 800 billion, 2.01 L gives 841), so for 400B counts of 801-840 the step
 * volume, 2.00 L, is 0.01 L short of where the calculator starts the extra
 * growth. Kept as the owner agreed (OQ-3).
 */
function solveVolume(startCells, neededMultiple) {
  const growth = neededMultiple - 1;
  const rate = ((growth - STIR_PLATE_BOOST + GROWTH_OFFSET) / GROWTH_K) ** (-1 / GROWTH_P);
  return Math.max(startCells / SATURATION_RATE, startCells / rate);
}

/**
 * solveStarter(cellsNeededBillion) -> array of all usable options.
 * Each option: { band, startCells, neededMultiple, volumeL, dmeGrams, packNote }.
 *
 * Note: 400..500 billion is usable by BOTH the 100B and 200B bands, so more
 * than one option can be returned; the user chooses. Returns an empty array
 * when no band is usable.
 */
export function solveStarter(cellsNeededBillion) {
  const options = [];
  for (const band of BANDS) {
    const eff = band.effectiveCells(cellsNeededBillion);
    if (!eff) continue;
    const neededMultiple = eff.N / band.startCells;
    const volumeL = solveVolume(band.startCells, neededMultiple);
    options.push({
      band: band.band,
      startCells: band.startCells,
      neededMultiple,
      volumeL,
      dmeGrams: volumeL * DME_GRAMS_PER_LITER,
      packNote: eff.packNote,
    });
  }
  return options;
}
