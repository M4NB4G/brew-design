// golden-master.test.js
// Pins the engine to the reference spreadsheet's cached values.
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
    expect(grist.postBoilPlato).toBeCloseTo(16.6222661, 4);
  });
  it('OG', () => {
    expect(grist.OG).toBeCloseTo(1.0681297, 6);
  });
  it('FG', () => {
    expect(grist.FG).toBeCloseTo(1.0136259, 6);
  });
  it('ABV (fraction)', () => {
    expect(grist.ABV).toBeCloseTo(0.0748883, 4);
  });
  it('SRM', () => {
    expect(grist.SRM).toBeCloseTo(4.1236703, 4);
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
    expect(bravo.ibu).toBeCloseTo(23.5111374, 4);
  });
  it('totalIBU', () => {
    expect(hops.totalIBU).toBe(46);
  });
  it('dryHopRatio', () => {
    expect(hops.dryHopRatio).toBeCloseTo(1.25, 6);
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

describe('starter golden master (cellsNeeded 570)', () => {
  const options = solveStarter(570);

  it('exactly one usable option, band 200B', () => {
    expect(options).toHaveLength(1);
    expect(options[0].band).toBe('200B');
  });
  it('neededMultiple = 2.85', () => {
    expect(options[0].neededMultiple).toBeCloseTo(2.85, 6);
  });
  it('volumeL ~ 3.00', () => {
    expect(options[0].volumeL).toBeCloseTo(3.0, 2);
  });
  it('dmeGrams ~ 345.0', () => {
    expect(options[0].dmeGrams).toBeCloseTo(345.0, 1);
  });
});
