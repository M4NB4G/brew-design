// starter.test.js
// Starter band selection, the calculator's growth formula, the step, the cap,
// and the intentional boundary gaps.

import { describe, it, expect } from 'vitest';
import { solveStarter } from '../src/index.js';

describe('solveStarter band selection', () => {
  it("the reference recipe's starter is 3.10 L and 356 g", () => {
    // SC-S6, hand pin (docs/items/starter-calculator-formula.md), worked
    // without the code: N / S = 570 / 200 = 2.85, so g = 1.85; less the
    // stir-plate boost, 1.85 - 1.0 = 0.85; 0.85 + 0.9994994906 = 1.8494994906;
    // / 12.54793776 = 0.1473942...; x = 0.1473942^(-1 / 0.4594858324) =
    // 64.517 million cells per mL; V = 200 / 64.517 = 3.09998 L;
    // 3.09998 x 115 = 356.498 g, shown as 356.
    // Rev 4's curve gave 3.00 L and 345 g (OQ-5).
    const options = solveStarter(570);
    expect(options).toHaveLength(1);
    const o = options[0];
    expect(o.band).toBe('200B');
    expect(o.startCells).toBe(200);
    expect(o.neededMultiple).toBeCloseTo(2.85, 6);
    expect(o.volumeL).toBeCloseTo(3.09998, 4);
    expect(o.dmeGrams).toBeCloseTo(356.498, 2);
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
    // 400<=450<670 -> N = 450, multiple 2.25, no extra pack.
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
    // The calculator's growth formula (SC-S1): 2.64 L (Rev 4's curve: 2.47 L).
    expect(options[0].volumeL).toBeCloseTo(2.64, 2);
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

  it('every count from 250 to 1,270 has an option; 1,280 and above have none', () => {
    // SC-S4 and SL-3: the formula never runs out, so the top of the range is
    // the largest starter offered, 5 L (SL-1). Rev 4's curve answered through
    // 1,710 and stopped at 1,720. Worked by hand, the 400B pack with an extra
    // 200B pack:
    // 1,270: N = 1,070; 1,070 / 400 = 2.675, g = 1.675; 1.675 - 1.0 +
    // 0.9994994906 = 1.6744994906; / 12.54793776 = 0.1334482; x =
    // 0.1334482^(-1 / 0.4594858324) = 80.098; V = 400 / 80.098 = 4.9939 L.
    // 1,280 (not offered, so not asserted on the engine): N = 1,080; 2.7,
    // g = 1.7; 1.6994994906 / 12.54793776 = 0.1354405; x = 77.556;
    // V = 400 / 77.556 = 5.1576 L, over 5 L.
    expect(solveStarter(1270)[0].volumeL).toBeCloseTo(4.9939, 3);
    for (let cells = 250; cells <= 1270; cells += 10) {
      expect(solveStarter(cells).length, `cells=${cells}`).toBeGreaterThan(0);
    }
    for (const cells of [1280, 1290, 1700, 1710, 2000, 5000]) {
      expect(solveStarter(cells), `cells=${cells}`).toEqual([]);
    }
    // A blank count (NaN) still has no option (SC-S5).
    expect(solveStarter(NaN)).toEqual([]);
  });

  it('below all ranges (200B) -> no options', () => {
    expect(solveStarter(200)).toEqual([]);
  });
});

describe('intentional boundary gaps (strict inequalities, transcribed as-is)', () => {
  // The spreadsheet rules leave exact-boundary gaps at 500 and 800.
  it('exactly 500B matches no band branch -> no options', () => {
    // 500 is >500 false and <500 false for 100B; <400 false / <670 yes for 200B?
    // 200B: 400<=500<670 -> usable. So 500 IS usable by 200B, only the 100B
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


// docs/items/starter-calculator-formula.md: the starter follows the yeast
// starter calculator's published growth formula (Brewer's Friend's fit to
// C. White's data, stir plate) on a fresh pack, 100 % viable.
describe("the calculator's growth formula, fresh pack", () => {
  const optionFor = (cells, band) => solveStarter(cells).find((o) => o.band === band);

  it("each pack's starter for the calculator's own reading gives back the calculator's volume", () => {
    // SC-S3. MoreBeer's calculator (C. White, stir plate, 100 % viability),
    // read 2026-10-23: [cells needed, band, litres it was read at]. The
    // calculator rounds its cells to whole billions, so the reading's true
    // count is within half a billion; across these readings half a billion
    // moves the volume by at most 0.016 L (100B at 386: 0.0152 L), so the
    // app's volume is within 0.016 L of the calculator's.
    const readings = [
      [251, '100B', 1], [308, '100B', 2], [351, '100B', 3], [386, '100B', 4],
      [465, '200B', 1.5], [503, '200B', 2], [564, '200B', 3], [616, '200B', 4], [661, '200B', 5],
      [888, '400B', 2.5], [930, '400B', 3], [969, '400B', 3.5],
      // The 400B pack with an extra 200B pack: N = C - 200, read at 4 L (1,005)
      // and 5 L (1,070).
      [1205, '400B', 4], [1270, '400B', 5],
    ];
    for (const [cells, band, litres] of readings) {
      const o = optionFor(cells, band);
      expect(o, `${band} at ${cells}`).toBeDefined();
      expect(Math.abs(o.volumeL - litres), `${band} at ${cells}: ${o.volumeL} L`).toBeLessThanOrEqual(0.016);
    }
  });

  it('910 billion -> the 400B pack, 2.757 L, 317 g', () => {
    // SC-S1, hand pin, worked without the code: N / S = 910 / 400 = 2.275,
    // so g = 1.275; less the stir-plate boost, 1.275 - 1.0 = 0.275;
    // 0.275 + 0.9994994906 = 1.2744994906; / 12.54793776 = 0.1015703...;
    // x = 0.1015703^(-1 / 0.4594858324) = 145.08 million cells per mL;
    // V = 400 / 145.08 = 2.757 L; 2.757 x 115 = 317 g.
    // Rev 4's curve gave 2.60 L and 299 g.
    const options = solveStarter(910);
    expect(options).toHaveLength(1);
    expect(options[0].band).toBe('400B');
    expect(options[0].volumeL).toBeCloseTo(2.757, 3);
    expect(Math.round(options[0].dmeGrams)).toBe(317);
  });

  it('a starter needing up to 2.1x growth gets the step volume', () => {
    // SC-S2 and OQ-3: never smaller than pack / 200 L, the volume at which
    // the pack alone is 200 million cells per mL. The formula run smoothly
    // meets the step at 2.1002x (400B at 2.00 L: 840 billion), so up to that
    // the step volume is the answer.
    expect(optionFor(400, '200B').volumeL).toBeCloseTo(1.0, 6);
    expect(optionFor(800, '400B').volumeL).toBeCloseTo(2.0, 6);
    expect(optionFor(830, '400B').volumeL).toBeCloseTo(2.0, 6);
    const at1010 = optionFor(1010, '400B'); // N = 810, the extra 200B pack
    expect(at1010.packNote).toBe('400B starter plus one extra 200B pack');
    expect(at1010.volumeL).toBeCloseTo(2.0, 6);
    const at850 = optionFor(850, '400B'); // 2.125x, above the step
    expect(at850.volumeL).toBeGreaterThan(2.0);
    expect(at850.volumeL).toBeCloseTo(2.1, 2); // about 2.10 L (the item's probe)

    // Within each of a band's ranges the volume never falls as the count rises.
    const ranges = [
      ['100B', 250, 390], ['100B', 400, 490],
      ['200B', 400, 660], ['200B', 670, 790],
      ['400B', 800, 1000], ['400B', 1010, 1270],
    ];
    for (const [band, from, to] of ranges) {
      let before = 0;
      for (let cells = from; cells <= to; cells += 10) {
        const v = optionFor(cells, band).volumeL;
        expect(v, `${band} at ${cells}`).toBeGreaterThanOrEqual(before);
        before = v;
      }
    }
  });

  it('no starter is larger than 5 L', () => {
    // SC-S9, SL-1 and SL-2: no option the app offers needs more than 5 L.
    for (let cells = 250; cells <= 1270; cells += 10) {
      for (const o of solveStarter(cells)) {
        expect(o.volumeL, `${o.band} at ${cells}`).toBeLessThanOrEqual(5);
      }
    }
    // Hand pins, worked without the code.
    // 660, the 200B pack alone: N / S = 660 / 200 = 3.3, g = 2.3;
    // 2.3 - 1.0 + 0.9994994906 = 2.2994994906; / 12.54793776 = 0.1832572;
    // x = 0.1832572^(-1 / 0.4594858324) = 40.164; V = 200 / 40.164 = 4.9796 L.
    const at660 = solveStarter(660);
    expect(at660).toHaveLength(1);
    expect(at660[0].packNote).toBe('');
    expect(at660[0].volumeL).toBeCloseTo(4.9796, 3);
    // 670, the 200B pack alone would need 5.22 L (670 / 200 = 3.35, g = 2.35;
    // 2.3494994906 / 12.54793776 = 0.1872419; x = 38.327; V = 200 / 38.327 =
    // 5.2183 L; and the calculator itself reads 661 -> 5 L), so it takes its
    // extra 200B pack (SL-2): N = 670 - 200 = 470; 470 / 200 = 2.35, g = 1.35;
    // 1.35 - 1.0 + 0.9994994906 = 1.3494994906; / 12.54793776 = 0.1075475;
    // x = 0.1075475^(-1 / 0.4594858324) = 128.107; V = 200 / 128.107 = 1.5612 L.
    const at670 = solveStarter(670);
    expect(at670).toHaveLength(1);
    expect(at670[0].band).toBe('200B');
    expect(at670[0].packNote).toBe('200B starter plus one extra 200B pack');
    expect(at670[0].volumeL).toBeCloseTo(1.5612, 3);
    // 690: N = 490; 490 / 200 = 2.45, g = 1.45; 1.4494994906 / 12.54793776 =
    // 0.1155169; x = 0.1155169^(-1 / 0.4594858324) = 109.650;
    // V = 200 / 109.650 = 1.8240 L.
    expect(solveStarter(690)[0].volumeL).toBeCloseTo(1.824, 3);
  });
});
