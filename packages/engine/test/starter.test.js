// starter.test.js
// Starter band selection, analytic root, and the intentional boundary gaps.

import { describe, it, expect } from 'vitest';
import { solveStarter } from '../src/index.js';

describe('solveStarter band selection', () => {
  it('570B -> exactly the 200B band at ~3.00 L, 345 g DME', () => {
    const options = solveStarter(570);
    expect(options).toHaveLength(1);
    const o = options[0];
    expect(o.band).toBe('200B');
    expect(o.startCells).toBe(200);
    expect(o.neededMultiple).toBeCloseTo(2.85, 6);
    expect(o.volumeL).toBeCloseTo(3.0, 2);
    expect(o.dmeGrams).toBeCloseTo(345.0, 1);
    expect(o.packNote).toBe('');
  });

  it('450B -> both 100B and 200B bands are usable', () => {
    // 400..500 is in range for the 100B band (with an extra pack) AND the
    // 200B band; the user chooses. This overlap is intentional.
    const options = solveStarter(450);
    const bands = options.map((o) => o.band).sort();
    expect(bands).toEqual(['100B', '200B']);

    const b100 = options.find((o) => o.band === '100B');
    // 400<=450<500 -> N = 450-100 = 350, multiple 3.5, plus an extra 100B pack.
    expect(b100.neededMultiple).toBeCloseTo(3.5, 6);
    expect(b100.packNote).toBe('100B starter plus one extra 100B pack');

    const b200 = options.find((o) => o.band === '200B');
    // 400<=450<700 -> N = 450, multiple 2.25, no extra pack.
    expect(b200.neededMultiple).toBeCloseTo(2.25, 6);
    expect(b200.packNote).toBe('');
  });

  it('300B -> only the 100B band, no extra pack', () => {
    const options = solveStarter(300);
    expect(options).toHaveLength(1);
    expect(options[0].band).toBe('100B');
    expect(options[0].neededMultiple).toBeCloseTo(3.0, 6);
    expect(options[0].packNote).toBe('');
  });

  it('850B -> only the 400B band, no extra pack', () => {
    const options = solveStarter(850);
    expect(options).toHaveLength(1);
    expect(options[0].band).toBe('400B');
    expect(options[0].neededMultiple).toBeCloseTo(850 / 400, 6);
  });

  it('900B -> the 400B band alone, N = 900', () => {
    // The owner's rule (2026-09-21): the 400B band serves 800-1000 billion
    // cells inclusive from the pack alone. 900 used to fall in a boundary
    // gap (FLAG, now removed).
    const options = solveStarter(900);
    expect(options).toHaveLength(1);
    expect(options[0].band).toBe('400B');
    expect(options[0].neededMultiple).toBeCloseTo(2.25, 6);
    expect(options[0].volumeL).toBeCloseTo(2.47, 2);
    expect(options[0].packNote).toBe('');
  });

  it('950B -> the 400B band alone, no extra pack', () => {
    const options = solveStarter(950);
    expect(options).toHaveLength(1);
    expect(options[0].band).toBe('400B');
    expect(options[0].neededMultiple).toBeCloseTo(950 / 400, 6);
    expect(options[0].packNote).toBe('');
  });

  it('1000B -> the 400B band alone; 1010B -> with an extra 200B pack, N = 810', () => {
    const at1000 = solveStarter(1000);
    expect(at1000).toHaveLength(1);
    expect(at1000[0].band).toBe('400B');
    expect(at1000[0].neededMultiple).toBeCloseTo(2.5, 6);
    expect(at1000[0].packNote).toBe('');

    const at1010 = solveStarter(1010);
    expect(at1010).toHaveLength(1);
    expect(at1010[0].band).toBe('400B');
    expect(at1010[0].neededMultiple).toBeCloseTo(810 / 400, 6);
    expect(at1010[0].packNote).toBe('400B starter plus one extra 200B pack');
  });

  it('every count from 250 to 1700 in steps of 10 has at least one option', () => {
    for (let cells = 250; cells <= 1700; cells += 10) {
      expect(solveStarter(cells).length, `cells=${cells}`).toBeGreaterThan(0);
    }
  });

  it('below all ranges (200B) -> no options', () => {
    expect(solveStarter(200)).toEqual([]);
  });

  it('very large pitch (2000B) -> 400B quadratic has no real root -> no options', () => {
    // The 400B band rule accepts cells>1000, but neededMultiple 4.5 drives the
    // discriminant negative, so there is no in-model volume.
    expect(solveStarter(2000)).toEqual([]);
  });
});

describe('intentional boundary gaps (strict inequalities, transcribed as-is)', () => {
  // The spreadsheet rules leave exact-boundary gaps at 500 and 800.
  it('exactly 500B matches no band branch -> no options', () => {
    // 500 is >500 false and <500 false for 100B; <400 false / <700 yes for 200B?
    // 200B: 400<=500<700 -> usable. So 500 IS usable by 200B, only the 100B
    // gap is at 500. Confirm 100B is excluded and 200B is present.
    const options = solveStarter(500);
    const bands = options.map((o) => o.band);
    expect(bands).not.toContain('100B'); // 100B boundary gap at 500
    expect(bands).toContain('200B');
  });

  it('exactly 800B falls in the 200B and 400B gaps', () => {
    const options = solveStarter(800);
    const bands = options.map((o) => o.band);
    // 200B: cells>800 false, <800 false -> gap. 400B: 800<=800<=1000 -> usable.
    expect(bands).not.toContain('200B'); // 200B boundary gap at 800
    expect(bands).toContain('400B');
  });
});
