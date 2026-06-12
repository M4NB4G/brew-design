// starter.js
// Analytic replacement for the Excel GoalSeek starter macro.
// Three solver bands, each with a starting cell count, a validity rule on
// cells needed, and a fitted growth curve P(Q) = aQ^2 + bQ + c (Q in liters).
//
// Pure functions. Every constant and inequality reproduced exactly from the
// spreadsheet. Do not alter the boundary logic.

// DME loading: 115 g per liter of starter.
const DME_GRAMS_PER_LITER = 115;

/**
 * Band definitions. `effectiveCells(cells)` returns the effective cell count
 * N for that band's solver, plus any pack note, or null when the band is not
 * usable for the given cells-needed value.
 *
 * FLAG: The spreadsheet's validity rules use strict inequalities that leave
 * exact-boundary gaps at 500, 800, and 900 billion -- a value landing exactly
 * on one of those boundaries matches no branch and yields no option from the
 * affected band(s). This is transcribed as-is per the spec (faithfulness over
 * "fixing" it). See each band's effectiveCells() below.
 */
const BANDS = [
  {
    band: '100B',
    startCells: 100,
    a: -0.055,
    b: 0.729,
    c: 1.86,
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
    a: -0.03,
    b: 0.482,
    c: 1.674,
    effectiveCells(cells) {
      // cells<400 -> not usable
      // 400<=cells<700 -> N=cells
      // 700<=cells<800 -> N=cells-200 (200B starter + one extra 200B pack)
      // cells>800 -> not usable
      // FLAG: cells===800 falls through every branch (boundary gap at 800).
      if (cells < 400) return null;
      if (cells < 700) return { N: cells, packNote: '' };
      if (cells < 800) {
        return { N: cells - 200, packNote: '200B starter plus one extra 200B pack' };
      }
      return null;
    },
  },
  {
    band: '400B',
    startCells: 400,
    a: -0.006,
    b: 0.222,
    c: 1.738,
    effectiveCells(cells) {
      // cells<800 -> not usable
      // 800<=cells<900 -> N=cells
      // cells>900 -> N=cells-200 (400B starter + one extra 200B pack)
      // else not usable
      // FLAG: cells===900 falls through every branch (boundary gap at 900).
      if (cells < 800) return null;
      if (cells < 900) return { N: cells, packNote: '' };
      if (cells > 900) {
        return { N: cells - 200, packNote: '400B starter plus one extra 200B pack' };
      }
      return null;
    },
  },
];

/**
 * Solve a*Q^2 + b*Q + (c - neededMultiple) = 0 and return the smallest
 * positive real root, or null when there is no usable root.
 */
function solveVolume(a, b, c, neededMultiple) {
  const cc = c - neededMultiple;
  const disc = b * b - 4 * a * cc;
  if (disc < 0) return null; // band yields no solution
  const sqrtDisc = Math.sqrt(disc);
  const root1 = (-b + sqrtDisc) / (2 * a);
  const root2 = (-b - sqrtDisc) / (2 * a);
  const positive = [root1, root2].filter((r) => r > 0);
  if (positive.length === 0) return null;
  return Math.min(...positive); // smallest root that is > 0 (in-range branch)
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
    const volumeL = solveVolume(band.a, band.b, band.c, neededMultiple);
    if (volumeL === null) continue;
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
