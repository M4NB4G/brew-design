// golden-master.test.js
// Pins the engine to the reference spreadsheet's cached values: the owner's
// Recipe Designer Rev 4 (2026-10-08, docs/sources/). A value Rev 4 changed
// names its cell, with the Rev 3 value it replaced.
// Tolerances per spec: SG abs 1e-6; Plato/SRM/IBU/utilization/tempFactor 1e-4;
// integers exact; starter volume and DME 1e-2 (DME expected at 1e-1).

import { describe, it, expect } from 'vitest';
import {
  computeGrist,
  computeHops,
  selectPitchRate,
  computeCellsNeeded,
  solveStarter,
} from '../src/index.js';

// --- Reference recipe input (60 F reference, no volume correction) ---
const gristInput = {
  malts: [
    { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
    { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
  ],
  efficiency: 0.93,
  preBoilVolGal: 16,
  postBoilVolGal: 14.5,
  mashWaterGal: 13,
  apparentAttenuation: 0.8,
};

const grist = computeGrist(gristInput);

const hopsInput = {
  kettleAdditions: [
    { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 },
    { name: 'Helios', timeMin: 30, wortTempF: 204, weightOz: 1, alphaAcidFraction: 0.19 },
    { name: 'Citra LupoMAX', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.18 },
    { name: 'Hopstiener 9326', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.06 },
    { name: 'Helios', timeMin: 20, wortTempF: 175, weightOz: 1, alphaAcidFraction: 0.19 },
  ],
  preBoilSg: grist.preBoilSg,
  postBoilVolGal: 14.5,
  // Nine dry-hop entries totaling 15 oz.
  dryHops: [
    { weightOz: 2 },
    { weightOz: 2 },
    { weightOz: 2 },
    { weightOz: 2 },
    { weightOz: 1 },
    { weightOz: 1 },
    { weightOz: 2 },
    { weightOz: 2 },
    { weightOz: 1 },
  ],
  fermentVolGal: 12,
};

const hops = computeHops(hopsInput);

describe('grist golden master', () => {
  it('preBoilSg', () => {
    expect(grist.preBoilSg).toBeCloseTo(1.062031, 6);
  });
  it('mashRv (qt/lb)', () => {
    expect(grist.mashRv).toBeCloseTo(1.7931034, 4);
  });
  it('mashR (lb/lb)', () => {
    expect(grist.mashR).toBeCloseTo(3.6848276, 4);
  });
  it('preBoilPlato', () => {
    expect(grist.preBoilPlato).toBeCloseTo(15.2145679, 4);
  });
  it('postBoilPlato', () => {
    // Rev 4, Grist and Pitch Calc's!I2 (Rev 3: 16.6222661, with the 1.01).
    expect(grist.postBoilPlato).toBeCloseTo(16.7884887, 4);
  });
  it('OG', () => {
    // Rev 4, Grist and Pitch Calc's!I3 (Rev 3: 1.0681297).
    expect(grist.OG).toBeCloseTo(1.0688522, 6);
  });
  it('FG', () => {
    // Rev 4, Grist and Pitch Calc's!K7 (Rev 3: 1.0136259).
    expect(grist.FG).toBeCloseTo(1.0137704, 6);
  });
  it('ABV (fraction)', () => {
    // Rev 4, Grist and Pitch Calc's!K8 (Rev 3: 0.0748883).
    expect(grist.ABV).toBeCloseTo(0.0757708, 4);
  });
  it('SRM', () => {
    // Rev 4, Grist and Pitch Calc's!I4 (Rev 3: 4.1236703, with 1.49 and 0.69).
    expect(grist.SRM).toBeCloseTo(4.1048543, 4);
  });
});

describe('hops golden master', () => {
  const bravo = hops.additions[0];
  it('Bravo utilization', () => {
    expect(bravo.utilization).toBeCloseTo(0.2070246, 4);
  });
  it('Bravo tempFactor', () => {
    expect(bravo.tempFactor).toBeCloseTo(0.7468118, 4);
  });
  it('Bravo ibu', () => {
    // Rev 4, Hops!J3 (Rev 3: 23.5111374, with 75 x 100).
    expect(bravo.ibu).toBeCloseTo(23.4769679, 4);
  });
  it('totalIBU', () => {
    // Rev 4, Hops!O2: 46, from 45.6959302 (J3:J7); with the three whirlpool
    // hops held (below) 45.6959302 + 0.2845174 = 45.9804476, still 46.
    expect(hops.totalIBU).toBe(46);
  });
  it('dryHopRatio', () => {
    expect(hops.dryHopRatio).toBeCloseTo(1.25, 6);
  });
});

// The three whirlpool hops are not Rev 4's cached cells: Rev 4 stands them at
// 175 °F (Hops!B5:B7), one degree below the range its own temperature table
// ties the curve to (Hops!M10:O12, 80 to 100 °C), and the factor is held at
// the curve's own figure at 176 °F (SPEC rule 2; the owner's decision H-5,
// docs/items/whirlpool-hop-range.md, WH-S7). Pinned by hand:
//   f(176) = 0.0003858 × 30976 − 0.12885802 × 176 + 10.97839506
//          = 11.9505408 − 22.67901152 + 10.97839506 = 0.24992434
//   (Rev 4, Hops!H5:H7: f(175) = 11.815125 − 22.5501535 + 10.97839506 = 0.24336656)
//   held over Rev 4's: 0.24992434 / 0.24336656 = 1 + 0.00655778 / 0.24336656 = 1.02694610
// Each hop's bitterness is Rev 4's times that, all else in its cell alike:
//   Citra LupoMAX   5.67336256 (J5) × 1.02694610 = 5.67336256 + 0.15287500 = 5.82623756
//   Hopstiener 9326 1.89112085 (J6) × 1.02694610 = 1.89112085 + 0.05095833 = 1.94207918
//   Helios          2.99427468 (J7) × 1.02694610 = 2.99427468 + 0.08068403 = 3.07495871
//   together 0.15287500 + 0.05095833 + 0.08068403 = 0.2845174 more, and the
//   unrounded sum, Rev 4's 45.6959302 (J3:J7), becomes 45.9804476.
describe("hops golden master: the reference recipe's whirlpool hops at 175 °F, held at 176 °F", () => {
  const [citra, hopstiener, helios] = hops.additions.slice(2);
  it('each tempFactor = 0.24992434 (Rev 4, H5:H7: 0.24336656)', () => {
    for (const a of [citra, hopstiener, helios]) expect(a.tempFactor).toBeCloseTo(0.24992434, 4);
  });
  it('Citra LupoMAX ibu = 5.82623756 (Rev 4, J5: 5.67336256)', () => {
    expect(citra.ibu).toBeCloseTo(5.82623756, 4);
  });
  it('Hopstiener 9326 ibu = 1.94207918 (Rev 4, J6: 1.89112085)', () => {
    expect(hopstiener.ibu).toBeCloseTo(1.94207918, 4);
  });
  it('Helios (20 min) ibu = 3.07495871 (Rev 4, J7: 2.99427468)', () => {
    expect(helios.ibu).toBeCloseTo(3.07495871, 4);
  });
  it('the unrounded sum = 45.9804476 (Rev 4: 45.6959302), the total still 46', () => {
    expect(hops.sumIBU).toBeCloseTo(45.9804476, 4);
    expect(hops.totalIBU).toBe(46);
  });
});

describe('yeast golden master', () => {
  it('cellsNeeded = 570 (nearest 10)', () => {
    const pitchRate = selectPitchRate('ale', 'mod');
    expect(pitchRate).toBe(0.75);
    const cells = computeCellsNeeded({
      pitchRate,
      postBoilPlato: grist.postBoilPlato,
      fermentVolGal: 12,
    });
    expect(cells).toBe(570);
  });
});

// The starter is not Rev 4's cached cells: it follows the yeast starter
// calculator's published growth formula on a fresh pack (SPEC.md rule 2,
// docs/items/starter-calculator-formula.md), pinned by hand: 570 / 200 = 2.85,
// g = 1.85; 1.85 - 1.0 + 0.9994994906 = 1.8494994906; / 12.54793776 =
// 0.1473942...; x = 0.1473942^(-1 / 0.4594858324) = 64.517 million cells per
// mL; V = 200 / 64.517 = 3.09998 L; 3.09998 x 115 = 356.498 g.
describe('starter golden master (cellsNeeded 570)', () => {
  const options = solveStarter(570);

  it('exactly one usable option, band 200B', () => {
    expect(options).toHaveLength(1);
    expect(options[0].band).toBe('200B');
  });
  it('neededMultiple = 2.85', () => {
    expect(options[0].neededMultiple).toBeCloseTo(2.85, 6);
  });
  it('volumeL ~ 3.10 (Rev 4: 3.00)', () => {
    expect(options[0].volumeL).toBeCloseTo(3.09998, 2);
  });
  it('dmeGrams ~ 356.5 (Rev 4: 345.0)', () => {
    expect(options[0].dmeGrams).toBeCloseTo(356.498, 1);
  });
});
