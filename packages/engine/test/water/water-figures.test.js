// water-figures.test.js
// The Water tab's figures that Brew Water Chem worked out on its screens, now
// in the engine (docs/items/water-tab.md, item 1 "Water figures through the
// front door"; SPEC rule 7). Each is pinned by a value worked out by hand,
// with the working beside it (CLAUDE.md, Models: the hand-pin rule).

import { describe, it, expect } from 'vitest';
import { equivalentAcidDose, saltTotals, targetMatch, residualAlkalinityMatch } from '../../src/index.js';

describe('water figures the water app worked out on screen', () => {
  it('the recommended dose is expressed as an equal-strength dose of the acid picked', () => {
    // W9, by hand. mEq per mL = density x weight fraction x 1000 / molecular weight
    // (acids.js, CRC densities, IUPAC weights):
    //   88 % lactic:     1.209 x 0.88 x 1000 / 90.08 = 1063.92 / 90.08 = 11.81083 mEq/mL
    //   10 % phosphoric: 1.054 x 0.10 x 1000 / 97.99 =  105.4  / 97.99 =  1.07562 mEq/mL
    // A 2 mL lactic dose carries 2 x 11.81083 = 23.62167 mEq; the same mEq of
    // 10 % phosphoric is 23.62167 / 1.07562 = 21.96098 mL. In one fraction:
    //   2 x 1063.92 x 97.99 / (90.08 x 105.4) = 208507.0416 / 9494.432 = 21.960981 mL
    expect(equivalentAcidDose({ lactic_88: 2 }, 'phosphoric_10')).toBeCloseTo(21.960981, 5);
    // The same acid picked gives the dose back.
    expect(equivalentAcidDose({ lactic_88: 2 }, 'lactic_88')).toBeCloseTo(2, 12);
    // Acidulated malt, 2 % lactic: 0.02 x 1000 / 90.08 = 0.222025 mEq/g, so the
    // 23.62167 mEq is 23.62167 / 0.222025 = 106.3920 g — that is,
    // 2 x 1063.92 / 90.08 x 90.08 / 20 = 2 x 1063.92 / 20 = 106.392 g.
    expect(equivalentAcidDose({ lactic_88: 2 }, 'acidulated_malt')).toBeCloseTo(106.392, 9);
    // No acid recommended: no dose, of any acid (the water app's `meq > 0 ? … : 0`).
    expect(equivalentAcidDose({}, 'phosphoric_85')).toBe(0);
  });

  it('a salt the recommendation adds in two steps is one amount', () => {
    // The water app's App.jsx summed the solver's steps per salt on screen.
    // By hand: calcium chloride 1.25 g + 0.5 g = 1.75 g; gypsum 3 g alone.
    const additions = [
      { salt: 'calcium_chloride', grams: 1.25 },
      { salt: 'gypsum', grams: 3 },
      { salt: 'calcium_chloride', grams: 0.5 },
    ];
    expect(saltTotals(additions)).toEqual({ calcium_chloride: 1.75, gypsum: 3 });
    expect(Object.keys(saltTotals(additions))).toEqual(['calcium_chloride', 'gypsum']);
    expect(saltTotals([])).toEqual({});
  });

  it('a predicted figure is graded against its target by the water app\'s bands', () => {
    // RecipeTab.jsx statColor: off-target as a percent of the target; under 20 %
    // near, under 50 % off, else far. Target 100 mg/L, by hand:
    //   119 -> 19 % near; 120 -> 20 % off (20 is not under 20); 81 -> 19 % near;
    //   149 -> 49 % off; 150 -> 50 % far; 40 -> 60 % far.
    expect(targetMatch(119, 100)).toBe('near');
    expect(targetMatch(81, 100)).toBe('near');
    expect(targetMatch(120, 100)).toBe('off');
    expect(targetMatch(149, 100)).toBe('off');
    expect(targetMatch(150, 100)).toBe('far');
    expect(targetMatch(40, 100)).toBe('far');
    // A ratio, target 2.0: 1.7 is 15 % near; 2.6 is 30 % off.
    expect(targetMatch(1.7, 2)).toBe('near');
    expect(targetMatch(2.6, 2)).toBe('off');
    // No chloride: an endless ratio is far off.
    expect(targetMatch(Infinity, 2)).toBe('far');
    // A target of 0 grades near whatever the figure (the water app's rule).
    expect(targetMatch(35, 0)).toBe('near');
    // RecipeTab.jsx raColor: residual alkalinity by mg/L off the target;
    // under 20 near, under 40 off, else far. Target -30, by hand:
    //   -11 -> 19 near; -10 -> 20 off; -49 -> 19 near; 9 -> 39 off; 10 -> 40 far.
    expect(residualAlkalinityMatch(-11, -30)).toBe('near');
    expect(residualAlkalinityMatch(-49, -30)).toBe('near');
    expect(residualAlkalinityMatch(-10, -30)).toBe('off');
    expect(residualAlkalinityMatch(9, -30)).toBe('off');
    expect(residualAlkalinityMatch(10, -30)).toBe('far');
  });
});
