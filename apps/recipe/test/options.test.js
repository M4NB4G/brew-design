// options.test.js
// Scenarios for the Options page item (scope table agreed 2026-09-21), named
// from its sentences S1–S3 and S5–S7. Every expected value comes from the
// engine — correctVolumeToRef, computeGrist, computeHops, computeCellsNeeded —
// called with the corrected volume, never from a literal: the scenarios
// assert that the app routes each volume to the engine at its own
// measurement temperature, not what the engine says. S4 and S8 are layout,
// proved at the far end in the browser.

import { describe, it, expect } from 'vitest';
import {
  correctVolumeToRef,
  computePostBoilVol,
  computeGrist,
  computeHops,
  selectPitchRate,
  computeCellsNeeded,
} from '@brew/engine';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import { toReferenceVolume } from '../src/reference-volume.js';
import { loadPersisted, savePersisted, STORAGE_KEY } from '../src/persistence.js';

// The reference recipe (smoke.test.js) in canonical units, measured at the
// engine's 60 °F reference: pre-boil 16 gal, post-boil 14.5 gal, ferment 12 gal.
const REFERENCE = {
  malts: [
    { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2 },
    { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0 },
  ],
  efficiency: 0.93,
  apparentAttenuation: 0.8,
  preBoilVolGal: 16,
  boilOffRateGalPerHr: 1.5,
  boilTimeMin: 60,
  mashWaterGal: 13,
  kettleAdditions: [
    { name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 },
    { name: 'Helios', timeMin: 30, wortTempF: 204, weightOz: 1, alphaAcidFraction: 0.19 },
    { name: 'Citra LupoMAX', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.18 },
    { name: 'Hopstiener 9326', timeMin: 20, wortTempF: 175, weightOz: 2, alphaAcidFraction: 0.06 },
    { name: 'Helios', timeMin: 20, wortTempF: 175, weightOz: 1, alphaAcidFraction: 0.19 },
  ],
  dryHops: [
    { name: 'DH1', weightOz: 2 },
    { name: 'DH2', weightOz: 2 },
    { name: 'DH3', weightOz: 2 },
    { name: 'DH4', weightOz: 2 },
    { name: 'DH5', weightOz: 1 },
    { name: 'DH6', weightOz: 1 },
    { name: 'DH7', weightOz: 2 },
    { name: 'DH8', weightOz: 2 },
    { name: 'DH9', weightOz: 1 },
  ],
  fermentVolGal: 12,
  yeast: { type: 'ale', density: 'mod' },
  measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
};

const AT_REFERENCE = { preBoil: 60, postBoil: 60, ferment: 60 };

// The recipe with some of its measurement temperatures changed.
const withTemps = (state, patch) => ({
  ...state,
  measurementTempF: { ...state.measurementTempF, ...patch },
});

// The engine called directly with the volumes the caller names — the
// expected values the app must reproduce by routing through the same engine.
function engineFor(state, { preBoilVolGal, postBoilVolGal, fermentVolGal }) {
  const grist = computeGrist({
    malts: state.malts,
    efficiency: state.efficiency,
    preBoilVolGal,
    postBoilVolGal,
    mashWaterGal: state.mashWaterGal, // as entered, never corrected
    apparentAttenuation: state.apparentAttenuation,
  });
  const hops = computeHops({
    kettleAdditions: state.kettleAdditions,
    preBoilSg: grist.preBoilSg,
    postBoilVolGal,
    dryHops: state.dryHops,
    fermentVolGal,
  });
  const cells = computeCellsNeeded({
    pitchRate: selectPitchRate(state.yeast.type, state.yeast.density),
    postBoilPlato: grist.postBoilPlato,
    fermentVolGal,
  });
  return { grist, hops, cells };
}

function expectWithin(actual, expected, tolerance) {
  expect(Math.abs(actual - expected), `${actual} vs ${expected}`).toBeLessThanOrEqual(tolerance);
}

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => {
      m.set(k, String(v));
    },
    removeItem: (k) => {
      m.delete(k);
    },
    _map: m,
  };
}

const defaults = () => ({ recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' });

describe('options page', () => {
  // S1, S7
  it("the default temperatures are 60 °F and leave every derived number the engine's for the uncorrected volumes, within 1e-12", () => {
    const s = defaultRecipeState();
    expect(s.measurementTempF).toEqual(AT_REFERENCE);

    const d = computeRecipe(s);
    const raw = engineFor(s, {
      preBoilVolGal: s.preBoilVolGal,
      postBoilVolGal: computePostBoilVol(s.preBoilVolGal, s.boilOffRateGalPerHr, s.boilTimeMin),
      fermentVolGal: s.fermentVolGal,
    });
    expectWithin(d.grist.preBoilSg, raw.grist.preBoilSg, 1e-12);
    expectWithin(d.grist.OG, raw.grist.OG, 1e-12);
    expectWithin(d.grist.SRM, raw.grist.SRM, 1e-12);
    expectWithin(d.grist.mashRv, raw.grist.mashRv, 1e-12);
    expectWithin(d.hops.totalIBU, raw.hops.totalIBU, 1e-12);
    expectWithin(d.hops.dryHopRatio, raw.hops.dryHopRatio, 1e-12);
    expectWithin(d.cells, raw.cells, 1e-12);
  });

  // S2
  it('a pre-boil temperature corrects only the pre-boil volume', () => {
    const d = computeRecipe(withTemps(REFERENCE, { preBoil: 190 }));
    const preBoilRef = correctVolumeToRef(16, 190);
    const e = engineFor(REFERENCE, { preBoilVolGal: preBoilRef, postBoilVolGal: 14.5, fermentVolGal: 12 });

    expect(d.grist.preBoilSg).toBeCloseTo(e.grist.preBoilSg, 12);
    expect(d.grist.OG).toBeCloseTo(e.grist.OG, 12);
    // The other two volumes are untouched: post-boil stays 14.5 gal, ferment 12 gal.
    expect(d.postBoilVolGal).toBeCloseTo(14.5, 12);
    expect(d.hops.dryHopRatio).toBeCloseTo(e.hops.dryHopRatio, 12);
    // Mash water is used as entered: mash Rv is what it is at the reference.
    expect(d.grist.mashRv).toBeCloseTo(computeRecipe(REFERENCE).grist.mashRv, 12);
    expect(d.grist.mashRv).toBeCloseTo(e.grist.mashRv, 12);
  });

  // S2
  it('a post-boil temperature corrects the post-boil volume', () => {
    const d = computeRecipe(withTemps(REFERENCE, { postBoil: 212 }));
    const postBoilRef = correctVolumeToRef(14.5, 212);
    const e = engineFor(REFERENCE, { preBoilVolGal: 16, postBoilVolGal: postBoilRef, fermentVolGal: 12 });

    expect(d.postBoilVolGal).toBeCloseTo(postBoilRef, 12);
    expect(d.grist.OG).toBeCloseTo(e.grist.OG, 12);
    expect(d.hops.totalIBU).toBe(e.hops.totalIBU);
  });

  // S2
  it('a fermentation temperature corrects the fermentation volume', () => {
    const d = computeRecipe(withTemps(REFERENCE, { ferment: 40 }));
    const fermentRef = correctVolumeToRef(12, 40);
    const e = engineFor(REFERENCE, { preBoilVolGal: 16, postBoilVolGal: 14.5, fermentVolGal: fermentRef });

    expect(d.refVolumesGal.ferment).toBeCloseTo(fermentRef, 12);
    expect(d.hops.dryHopRatio).toBeCloseTo(e.hops.dryHopRatio, 12);
    expect(d.cells).toBe(e.cells);
  });

  // S2, S3
  it('toReferenceVolume corrects at the temperature of its kind and returns NaN for one the engine cannot correct', () => {
    const temps = { preBoil: 190, postBoil: 60, ferment: 60 };
    expect(toReferenceVolume(16, 'preBoil', temps)).toBeCloseTo(correctVolumeToRef(16, 190), 12);
    expect(toReferenceVolume(14.5, 'postBoil', temps)).toBeCloseTo(correctVolumeToRef(14.5, 60), 12);
    expect(toReferenceVolume(12, 'ferment', temps)).toBeCloseTo(correctVolumeToRef(12, 60), 12);

    // Cleared, below 32 °F, above 212 °F, infinite: outside the engine's table.
    for (const t of [NaN, 31, 213, Infinity]) {
      expect(toReferenceVolume(16, 'preBoil', { ...temps, preBoil: t }), `temperature ${t}`).toBeNaN();
    }
    // A missing map, and a map missing the kind.
    expect(toReferenceVolume(16, 'preBoil', undefined)).toBeNaN();
    expect(toReferenceVolume(16, 'preBoil', { postBoil: 60, ferment: 60 })).toBeNaN();

    // computeRecipe carries the three corrected volumes.
    const d = computeRecipe(withTemps(REFERENCE, { preBoil: 190, postBoil: 212, ferment: 40 }));
    expect(d.refVolumesGal.preBoil).toBeCloseTo(correctVolumeToRef(16, 190), 12);
    expect(d.refVolumesGal.postBoil).toBeCloseTo(correctVolumeToRef(14.5, 212), 12);
    expect(d.refVolumesGal.ferment).toBeCloseTo(correctVolumeToRef(12, 40), 12);
  });

  // S3
  it('an uncorrectable temperature blanks the dependent stats and nothing throws', () => {
    let d;
    expect(() => {
      d = computeRecipe(withTemps(REFERENCE, { preBoil: NaN }));
    }).not.toThrow();
    expect(d.grist.preBoilSg).toBeNaN();

    expect(() => {
      d = computeRecipe(withTemps(REFERENCE, { ferment: 213 }));
    }).not.toThrow();
    expect(d.cells).toBeNaN();
    expect(d.starter).toEqual([]);
  });

  // S5
  it('the saved document carries version 3 and the temperatures; a cleared one round-trips as NaN', () => {
    const s = fakeStorage();
    const recipe = {
      ...defaultRecipeState(),
      measurementTempF: { preBoil: 170, postBoil: NaN, ferment: 60 },
    };
    savePersisted(s, { recipe, mode: 'home', proGravityUnit: 'plato' });

    const doc = JSON.parse(s._map.get(STORAGE_KEY));
    expect(doc.version).toBe(3);
    expect(doc.recipe.measurementTempF.preBoil).toBe(170);
    expect(doc.recipe.measurementTempF.ferment).toBe(60);
    expect('postBoil' in doc.recipe.measurementTempF).toBe(true);

    const loaded = loadPersisted(s, defaults());
    expect(loaded.recipe.measurementTempF.preBoil).toBe(170);
    expect(loaded.recipe.measurementTempF.postBoil).toBeNaN();
    expect(loaded.recipe.measurementTempF.ferment).toBe(60);
  });

  // S6
  it('a version-1 document loads as the same recipe with the reference temperatures and an empty name, style and notes, and is saved back as version 3', () => {
    const s = fakeStorage();
    // What the app saved before this change: no measurement temperatures, and
    // no name, style or notes (Recipe identity, version 3).
    const v1Recipe = { ...defaultRecipeState(), preBoilVolGal: 16 };
    delete v1Recipe.measurementTempF;
    delete v1Recipe.name;
    delete v1Recipe.style;
    delete v1Recipe.notes;
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, recipe: v1Recipe, mode: 'pro', proGravityUnit: 'sg' }));

    const loaded = loadPersisted(s, defaults());
    expect(loaded.recipe.preBoilVolGal).toBe(16);
    expect(loaded.recipe.measurementTempF).toEqual(AT_REFERENCE);
    expect(loaded.recipe).toEqual({
      ...v1Recipe,
      measurementTempF: AT_REFERENCE,
      name: '',
      style: '',
      notes: '',
    });
    expect(loaded.mode).toBe('pro');
    expect(loaded.proGravityUnit).toBe('sg');

    savePersisted(s, loaded);
    expect(JSON.parse(s._map.get(STORAGE_KEY)).version).toBe(3);
  });

  // S6
  it('a version-2 document loads with an empty name, style and notes; a version-3 document loads; any other version yields the defaults', () => {
    const recipe = { ...defaultRecipeState(), measurementTempF: { preBoil: 170, postBoil: 60, ferment: 60 } };
    const docFor = (version, r = recipe) => JSON.stringify({ version, recipe: r, mode: 'home', proGravityUnit: 'plato' });

    // What the app saved before Recipe identity: no name, style or notes.
    const v2Recipe = { ...recipe };
    delete v2Recipe.name;
    delete v2Recipe.style;
    delete v2Recipe.notes;
    const s = fakeStorage();
    s.setItem(STORAGE_KEY, docFor(2, v2Recipe));
    expect(loadPersisted(s, defaults()).recipe).toEqual({ ...v2Recipe, name: '', style: '', notes: '' });

    const v3Recipe = { ...recipe, name: 'Big IPA', style: '21A American IPA', notes: 'Mash 152 °F.' };
    const t3 = fakeStorage();
    t3.setItem(STORAGE_KEY, docFor(3, v3Recipe));
    expect(loadPersisted(t3, defaults()).recipe).toEqual(v3Recipe);

    for (const version of [0, 4, '1', '2', '3']) {
      const t = fakeStorage();
      t.setItem(STORAGE_KEY, docFor(version));
      expect(loadPersisted(t, defaults()), `version ${JSON.stringify(version)}`).toEqual(defaults());
    }
  });
});
