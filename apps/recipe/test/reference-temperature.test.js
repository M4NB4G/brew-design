// reference-temperature.test.js
// Scenarios for "The 60 °F reference held in one place" (scope table agreed
// 2026-09-23, docs/items/reference-temperature.md), named from its sentences
// R-S2, R-S3 and R-S4. The engine's own scenario (R-S1) is in
// packages/engine/test/units.test.js.
//
// The suite has no DOM, so the screen's labels (Volumes card, Options tab)
// are checked by reading the app's source: no file writes a 60 °F reference
// of its own. The printed sheet's text is checked directly.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REFERENCE_TEMP_F } from '@brew/engine';
import { computeRecipe } from '../src/selectors.js';
import { defaultRecipeState, emptyBreweryFigures, newRecipe, DEFAULT_DISPLAY } from '../src/state.js';
import { loadStartingState, STORAGE_KEY } from '../src/persistence.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import { tempUnit } from '../src/display.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesUnder(path);
    return /\.(js|jsx|mjs)$/.test(path) ? [path] : [];
  });

// A file's code with its comments removed: a comment that mentions 60 °F
// writes no figure the brewer sees.
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

// Ways a file could write its own 60 °F reference: a label "60 °F" or
// "60 {tUnit}" / "60 ${tempUnit()}", a temperature constant or comparison set
// to 60, or a measurement temperature defaulting to 60. Minutes (boil time,
// hop time) are not temperatures and do not match.
const OWN_REFERENCE = [
  /\b60\s*(°F|degF|\$?\{\s*(tUnit|tempUnit\(\))\s*\})/,
  /\w*(TEMP|[Tt]emp)\w*\s*(=|===|!==|==|!=)\s*60\b/,
  /\b(preBoil|postBoil|ferment)\s*:\s*60\b/,
];

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

// The smoke test's reference recipe (test/smoke.test.js), in canonical units,
// at a new recipe's measurement temperatures.
const referenceState = () => ({
  name: '',
  style: '',
  notes: '',
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
  yeast: { type: 'ale', density: 'mod', name: '', fermTempF: NaN },
  measurementTempF: { ...defaultRecipeState().measurementTempF },
});

const sheetFor = (recipe) =>
  recipeSheet({ recipe, derived: computeRecipe(recipe), mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 8, 23) });
const row = (sheet, key) => sheet.volumes.rows.find((r) => r.key === key);

describe('the 60 °F reference held in one place', () => {
  it('every "at 60 °F" label and the sheet\'s temperature-note rule read the engine\'s reference', () => {
    // R-S2: the printed post-boil label carries the engine's figure.
    const atRef = sheetFor(referenceState());
    expect(row(atRef, 'postBoil').label).toBe(`Post-boil volume at ${REFERENCE_TEMP_F} ${tempUnit()}`);

    // A volume measured at the engine's reference prints no note; one
    // measured elsewhere does.
    for (const kind of ['preBoil', 'postBoil', 'ferment']) {
      expect(row(atRef, kind).tempNote).toBeNull();
      const r = referenceState();
      r.measurementTempF[kind] = 150;
      expect(row(sheetFor(r), kind).tempNote).toBe(`measured at 150 ${tempUnit()}`);
    }

    // No app source file writes a 60 °F reference of its own.
    const own = [];
    for (const file of filesUnder(SRC)) {
      const lines = code(readFileSync(file, 'utf8')).split(/\r?\n/);
      lines.forEach((line, i) => {
        if (OWN_REFERENCE.some((re) => re.test(line))) {
          own.push(`${relative(SRC, file).replace(/\\/g, '/')}:${i + 1}: ${line.trim()}`);
        }
      });
    }
    expect(own).toEqual([]);
  });

  it('a new recipe\'s measurement temperatures, and a version-1 recipe\'s, are the engine\'s reference', () => {
    // R-S3: the built-in recipe, and a new recipe with no brewery figures.
    const ref = { preBoil: REFERENCE_TEMP_F, postBoil: REFERENCE_TEMP_F, ferment: REFERENCE_TEMP_F };
    expect(defaultRecipeState().measurementTempF).toEqual(ref);
    expect(newRecipe(emptyBreweryFigures()).recipe.measurementTempF).toEqual(ref);

    // R1: a version-1 recipe, saved before the temperatures existed.
    const v1 = defaultRecipeState();
    delete v1.measurementTempF;
    delete v1.name;
    delete v1.style;
    delete v1.notes;
    v1.yeast = { type: v1.yeast.type, density: v1.yeast.density };
    const s = fakeStorage();
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, recipe: { ...v1, preBoilVolGal: 8 }, ...DEFAULT_DISPLAY }));
    const loaded = loadStartingState(s);
    expect(loaded.recipe.preBoilVolGal).toBe(8); // the saved recipe, not a new one
    expect(loaded.recipe.measurementTempF).toEqual(ref);
  });

  it('every derived number is unchanged (the guard)', () => {
    // R-S4: the smoke test's pinned values, at its own tolerances, for the
    // reference recipe at a new recipe's measurement temperatures.
    const d = computeRecipe(referenceState());
    expect(d.postBoilVolGal).toBeCloseTo(14.5, 6);
    expect(d.grist.preBoilSg).toBeCloseTo(1.062031, 6);
    expect(d.grist.OG).toBeCloseTo(1.0681297, 6);
    expect(d.grist.FG).toBeCloseTo(1.0136259, 6);
    expect(d.grist.ABV).toBeCloseTo(0.0748883, 4);
    expect(d.grist.SRM).toBeCloseTo(4.1236703, 4);
    expect(d.grist.mashRv).toBeCloseTo(1.7931034, 4);
    expect(d.hops.totalIBU).toBe(46);
    expect(d.cells).toBe(570);
  });
});
