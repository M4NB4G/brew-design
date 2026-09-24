// empty-fields.test.js
// Scenarios for "Empty-field handling" (scope table agreed 2026-09-23,
// docs/items/empty-field-handling.md), named from its sentences E-S1 to E-S4
// and decisions E1 to E4. The suite has no DOM: the naming and the line's
// text are checked here, and the boxes' change handlers are called directly
// with the event an emptied box sends; where the line shows (E3) is the far
// end.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  correctVolumeToRef,
  computePostBoilVol,
  computeGrist,
  computeHops,
  selectPitchRate,
  computeCellsNeeded,
  solveStarter,
  mashRatioWarnings,
} from '@brew/engine';
import { defaultRecipeState, DEFAULT_DISPLAY } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import { savePersisted, loadPersisted, exportRecipeDocument, importRecipeFile } from '../src/persistence.js';
import { volumeChange } from '../src/components/VolumesSection.jsx';
import { temperatureChange } from '../src/components/OptionsSection.jsx';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

// The naming module, loaded in each scenario that uses it (it is new: before
// the change only those scenarios fail, not the guard).
let emptyFields;
let emptyFieldsLine;
async function loadNaming() {
  ({ emptyFields, emptyFieldsLine } = await import('../src/empty-fields.js'));
}
const named = (recipe) => emptyFields(recipe, computeRecipe(recipe));
const OUT = " (outside the correction's range)";

// What an emptied number box sends.
const emptied = { target: { value: '' } };
const typed = (text) => ({ target: { value: text } });

// A setter that applies to a recipe the way App.jsx's setField and
// setMeasurementTemp do.
function applying(recipe) {
  const r = { ...recipe, measurementTempF: { ...recipe.measurementTempF } };
  return {
    recipe: r,
    setField: (field, value) => {
      r[field] = value;
    },
    setMeasurementTemp: (kind, value) => {
      r.measurementTempF[kind] = value;
    },
  };
}

describe('empty-field handling', () => {
  it('the empty number boxes are named, in screen order, by the row they belong to', async () => {
    await loadNaming();
    // A new recipe: nothing is empty. Its fermentation temperature is blank
    // but feeds no figure; names, style and notes are text: none is named.
    const fresh = defaultRecipeState();
    expect(Number.isNaN(fresh.yeast.fermTempF)).toBe(true);
    expect(named(fresh)).toEqual([]);
    expect(named({ ...fresh, name: '', style: '', notes: '' })).toEqual([]);

    // Every number box empty, in screen order: the Volumes card (Mash, Boil,
    // Ferment), the Grist table and its efficiency, the Yeast card's
    // attenuation, the kettle hops, the dry hops; then the Options tab's
    // measurement temperatures. An unnamed row is named by its place.
    const r = defaultRecipeState();
    Object.assign(r, {
      mashWaterGal: NaN,
      preBoilVolGal: NaN,
      boilOffRateGalPerHr: NaN,
      boilTimeMin: NaN,
      fermentVolGal: NaN,
      efficiency: NaN,
      apparentAttenuation: NaN,
      malts: [
        { name: 'Pale 2-Row', weightLb: NaN, fgdb: NaN, colorL: NaN },
        { name: '  ', weightLb: NaN, fgdb: 0.8, colorL: 9 },
      ],
      kettleAdditions: [
        { name: 'Magnum', timeMin: NaN, wortTempF: NaN, weightOz: NaN, alphaAcidFraction: NaN },
        { name: '', timeMin: 10, wortTempF: 212, weightOz: 1, alphaAcidFraction: NaN },
      ],
      dryHops: [
        { name: 'Citra', weightOz: NaN },
        { name: '', weightOz: NaN },
      ],
      measurementTempF: { preBoil: NaN, postBoil: NaN, ferment: NaN },
    });
    expect(named(r)).toEqual([
      'Mash water',
      'Pre-boil volume',
      'Boil-off rate',
      'Boil time',
      'Fermentation volume',
      'Pale 2-Row weight',
      'Pale 2-Row FGDB',
      'Pale 2-Row color',
      'Malt 2 weight',
      'Brewhouse efficiency',
      'Apparent attenuation',
      'Magnum time',
      'Magnum temperature',
      'Magnum weight',
      'Magnum alpha',
      'Kettle hop 2 alpha',
      'Citra dry-hop weight',
      'Dry hop 2 weight',
      'Pre-boil measurement temperature',
      'Post-boil measurement temperature',
      'Fermentation measurement temperature',
    ]);

    // One or two empty: the line under the stats bar names them.
    const two = { ...defaultRecipeState(), boilTimeMin: NaN };
    two.malts = [{ ...two.malts[0], weightLb: NaN }, two.malts[1]];
    expect(named(two)).toEqual(['Boil time', 'Pale 2-Row weight']);
    expect(emptyFieldsLine(named(two))).toBe('Empty: Boil time, Pale 2-Row weight — figures that depend on them show —');
    expect(emptyFieldsLine(['Boil time'])).toBe('Empty: Boil time — figures that depend on it show —');
    expect(emptyFieldsLine([])).toBeNull();
  });

  it('a measurement temperature the correction cannot use is named with the empty boxes', async () => {
    await loadNaming();
    const at = (kind, tempF, patch = {}) => {
      const r = { ...defaultRecipeState(), ...patch };
      r.measurementTempF = { ...r.measurementTempF, [kind]: tempF };
      return named(r);
    };
    // The engine's density table runs 0–100 °C, 32–212 °F: 212 and 32 are
    // usable, 213 and 31 are not. The app reads this from the recipe's own
    // figures (a volume at 60 °F that is blank while the measured one is not).
    expect(at('preBoil', 212)).toEqual([]);
    expect(at('preBoil', 213)).toEqual([`Pre-boil measurement temperature${OUT}`]);
    expect(at('postBoil', 250)).toEqual([`Post-boil measurement temperature${OUT}`]);
    expect(at('ferment', 32)).toEqual([]);
    expect(at('ferment', 31)).toEqual([`Fermentation measurement temperature${OUT}`]);
    // With its volume empty, only the volume is named: nothing says the
    // temperature is out of range.
    expect(at('preBoil', 250, { preBoilVolGal: NaN })).toEqual(['Pre-boil volume']);
    // The line names it the same way.
    expect(emptyFieldsLine(at('postBoil', 250))).toBe(
      `Empty: Post-boil measurement temperature${OUT} — figures that depend on it show —`,
    );

    // No range is written in the naming: its only numbers are counting ones —
    // none named (0), one named (1), a row's place (+ 1).
    const code = readFileSync(join(SRC, 'empty-fields.js'), 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    const literals = [...code.matchAll(/\b\d+(\.\d+)?\b/g)].map((m) => m[0]);
    expect(literals.filter((n) => n !== '0' && n !== '1')).toEqual([]);
  });

  it('emptying a volume box or a measurement temperature makes that figure blank', async () => {
    for (const mode of ['home', 'pro']) {
      for (const field of ['mashWaterGal', 'preBoilVolGal', 'boilOffRateGalPerHr', 'fermentVolGal']) {
        const a = applying(defaultRecipeState());
        volumeChange(a.setField, field, mode)(emptied);
        expect(a.recipe[field], `${mode} ${field}`).toBeNaN();
        // A typed figure is still converted: 7.5 gal, or 7.5 bbl x 31 gal/bbl = 232.5 gal.
        volumeChange(a.setField, field, mode)(typed('7.5'));
        expect(a.recipe[field], `${mode} ${field}`).toBe(mode === 'pro' ? 232.5 : 7.5);
      }
    }
    for (const kind of ['preBoil', 'postBoil', 'ferment']) {
      const a = applying(defaultRecipeState());
      temperatureChange(a.setMeasurementTemp, kind)(emptied);
      expect(a.recipe.measurementTempF[kind], kind).toBeNaN();
      temperatureChange(a.setMeasurementTemp, kind)(typed('150'));
      expect(a.recipe.measurementTempF[kind], kind).toBe(150);
    }
    // The emptied figure is blank, not the old number: the stats that depend on it blank too.
    const a = applying(defaultRecipeState());
    volumeChange(a.setField, 'preBoilVolGal', 'home')(emptied);
    expect(computeRecipe(a.recipe).grist.OG).toBeNaN();
    await loadNaming();
    expect(named(a.recipe)).toEqual(['Pre-boil volume']);
  });

  it('a blank round-trips as blank through saving, the recipe file and reloading', async () => {
    const a = applying(defaultRecipeState());
    for (const field of ['mashWaterGal', 'preBoilVolGal', 'boilOffRateGalPerHr', 'fermentVolGal']) {
      volumeChange(a.setField, field, 'home')(emptied);
    }
    for (const kind of ['preBoil', 'postBoil', 'ferment']) {
      temperatureChange(a.setMeasurementTemp, kind)(emptied);
    }
    const state = { recipe: a.recipe, ...DEFAULT_DISPLAY };
    await loadNaming();
    const expectBlank = (r, how) => {
      for (const field of ['mashWaterGal', 'preBoilVolGal', 'boilOffRateGalPerHr', 'fermentVolGal']) {
        expect(r[field], `${how}: ${field}`).toBeNaN();
      }
      for (const kind of ['preBoil', 'postBoil', 'ferment']) {
        expect(r.measurementTempF[kind], `${how}: ${kind}`).toBeNaN();
      }
      expect(named(r), how).toEqual(named(a.recipe));
    };

    // Saved: blank is null in the document, never 0.
    const s = fakeStorage();
    savePersisted(s, state);
    const doc = JSON.parse(exportRecipeDocument(state));
    expect(doc.recipe.preBoilVolGal).toBeNull();
    expect(doc.recipe.measurementTempF.postBoil).toBeNull();
    expectBlank(loadPersisted(s, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }).recipe, 'reloaded');

    // Exported and imported.
    const imported = importRecipeFile(exportRecipeDocument(state), { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }, () => true);
    expect(imported.outcome).toBe('replaced');
    expectBlank(imported.state.recipe, 'imported');
  });

  it('with boxes empty, every figure that does not depend on them is the engine\'s (the guard)', () => {
    // Boil time and the fermentation volume empty: every figure computeRecipe
    // gives equals the engine called directly with the same blanks, so the
    // mash ratios, the pre-boil volume and the pitch rate stand while the
    // figures that depend on the blanks are blank.
    const r = { ...defaultRecipeState(), boilTimeMin: NaN, fermentVolGal: NaN };
    const d = computeRecipe(r);
    const preBoilVolGal = correctVolumeToRef(r.preBoilVolGal, 60);
    const postBoilMeasuredGal = computePostBoilVol(r.preBoilVolGal, r.boilOffRateGalPerHr, r.boilTimeMin);
    const postBoilVolGal = correctVolumeToRef(postBoilMeasuredGal, 60);
    const fermentVolGal = correctVolumeToRef(r.fermentVolGal, 60);
    const grist = computeGrist({
      malts: r.malts,
      efficiency: r.efficiency,
      preBoilVolGal,
      postBoilVolGal,
      mashWaterGal: r.mashWaterGal,
      apparentAttenuation: r.apparentAttenuation,
    });
    const hops = computeHops({ kettleAdditions: r.kettleAdditions, preBoilSg: grist.preBoilSg, postBoilVolGal, dryHops: r.dryHops, fermentVolGal });
    const pitchRate = selectPitchRate(r.yeast.type, r.yeast.density);
    const cells = computeCellsNeeded({ pitchRate, postBoilPlato: grist.postBoilPlato, fermentVolGal });
    expect(d).toEqual({
      postBoilVolGal,
      postBoilMeasuredGal,
      postBoilMeasuredShown: false,
      refVolumesGal: { preBoil: preBoilVolGal, postBoil: postBoilVolGal, ferment: fermentVolGal },
      grist,
      hops,
      pitchRate,
      cells,
      starter: solveStarter(cells),
      warnings: { ...mashRatioWarnings(grist), postBoilBelowFerment: false },
    });
    expect(d.grist.mashRv).toBeCloseTo((5 * 4) / 11, 12); // 5 gal x 4 qt/gal over 11 lb, as entered
    expect(d.grist.OG).toBeNaN();
  });
});
