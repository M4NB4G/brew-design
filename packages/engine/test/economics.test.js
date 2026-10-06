// economics.test.js
// Cost of a batch (docs/items/economics.md, EC-S4, EC-Q3): the cost per unit
// of output is blank (NaN), not 0, when the batch volume is zero, negative or
// blank, since a 0 is a number the brewer did not enter. Otherwise it is the
// total over the batch: $120 over 5.5 gal = 240/11 = 21.818181... $/gal, by
// hand. The roll-up is unchanged (the app's scenarios pin it).

import { describe, it, expect } from 'vitest';
import { costPerUnit } from '../src/index.js';

describe('cost of a batch (engine)', () => {
  it('cost per unit is blank for a zero, negative or blank batch', () => {
    expect(Number.isNaN(costPerUnit(120, 0))).toBe(true);
    expect(Number.isNaN(costPerUnit(120, -5))).toBe(true);
    expect(Number.isNaN(costPerUnit(120, NaN))).toBe(true);
    expect(Number.isNaN(costPerUnit(120, undefined))).toBe(true);
    // 120 / 5.5 = 240/11 = 21.8181818... (by hand).
    expect(costPerUnit(120, 5.5)).toBeCloseTo(21.8181818, 6);
    // A blank total stays blank.
    expect(Number.isNaN(costPerUnit(NaN, 5.5))).toBe(true);
  });

});
