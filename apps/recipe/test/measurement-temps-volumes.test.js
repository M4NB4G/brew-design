// measurement-temps-volumes.test.js
// Scenarios for S6c item 1, "Measurement temperatures beside their volumes"
// (docs/items/measurement-temps-beside-volumes.md, MV-S1, MV-S2, MV-S5): the
// recipe's three measurement temperatures are entered on the Volumes card
// under the volume each one corrects, each with that volume at 60 °F; the
// Options tab holds only the brewery's figures; nothing else changes.
// The suite has no DOM and no screen width: the cards are rendered to markup,
// and MV-S3 (a phone shows each temperature on its own line) is proved at the
// far end in a browser at phone width.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { correctVolumeToRef, REFERENCE_TEMP_F } from '@brew/engine';
import { defaultRecipeState, emptyBreweryFigures, DEFAULT_DISPLAY } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import { exportRecipeDocument } from '../src/persistence.js';

const TEMPS = { preBoil: 150, postBoil: 180, ferment: 68 };

// The reference recipe's own volumes (pre-boil 16, post-boil 14.5, ferment 12
// gal at the measured figures), the measurement temperatures set.
const recipe = (temps = TEMPS) => ({
  ...defaultRecipeState(),
  preBoilVolGal: 16,
  boilOffRateGalPerHr: 1.5,
  boilTimeMin: 60,
  fermentVolGal: 12,
  measurementTempF: { ...temps },
});

const text = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

// The Volumes card as the Recipe tab draws it, from the same derived values.
async function renderVolumes(r, mode = 'home') {
  const { default: VolumesSection } = await import('../src/components/VolumesSection.jsx');
  const d = computeRecipe(r);
  return renderToStaticMarkup(
    createElement(VolumesSection, {
      recipe: r,
      grist: d.grist,
      postBoilVolGal: d.postBoilVolGal,
      postBoilMeasuredGal: d.postBoilMeasuredGal,
      postBoilMeasuredShown: d.postBoilMeasuredShown,
      refVolumesGal: d.refVolumesGal,
      warnings: d.warnings,
      mode,
      setField: () => {},
      setMeasurementTemp: () => {},
    }),
  );
}

// The Options tab as App draws it.
async function renderOptions(r, brewery = emptyBreweryFigures()) {
  const { default: OptionsSection } = await import('../src/components/OptionsSection.jsx');
  const d = computeRecipe(r);
  return renderToStaticMarkup(
    createElement(OptionsSection, {
      measurementTempF: r.measurementTempF,
      refVolumesGal: d.refVolumesGal,
      mode: 'home',
      setMeasurementTemp: () => {},
      brewery,
      setBreweryFigure: () => {},
      setBreweryTemp: () => {},
      setBreweryWater: () => {},
      onUseRecipeFigures: () => {},
      onForgetBrewery: () => {},
      onExportBrewery: () => {},
      onImportBreweryFile: () => {},
    }),
  );
}

// The value attribute of the first input after the row labelled `label`.
function boxAfter(markup, label) {
  const at = markup.indexOf(`>${label}<`);
  expect(at, `"${label}" is on the card`).toBeGreaterThan(-1);
  const input = markup.slice(at).match(/<input[^>]*>/);
  expect(input, `a box after "${label}"`).not.toBeNull();
  return { at, tag: input[0], value: input[0].match(/value="([^"]*)"/)?.[1] };
}

describe('measurement temperatures beside their volumes', () => {
  // MV-S1
  it('each temperature sits under its volume on the Volumes card, with that volume at 60 °F beside it', async () => {
    const r = recipe();
    const markup = await renderVolumes(r);
    const shown = text(markup);
    const ref = `${REFERENCE_TEMP_F} °F`;

    const preBoil = boxAfter(markup, 'Pre-boil volume (gal)');
    const preBoilTemp = boxAfter(markup, 'Pre-boil volume measured at (°F)');
    const fermentTemp = boxAfter(markup, 'Fermentation volume measured at (°F)');
    const postBoilTemp = boxAfter(markup, 'Post-boil volume measured at (°F)');

    // Each box holds the recipe's own temperature.
    expect(preBoilTemp.value).toBe('150');
    expect(postBoilTemp.value).toBe('180');
    expect(fermentTemp.value).toBe('68');

    // Under its volume: pre-boil box between the pre-boil volume and the
    // boil-off rate; fermentation box after the fermentation volume.
    expect(preBoil.at).toBeLessThan(preBoilTemp.at);
    expect(preBoilTemp.at).toBeLessThan(markup.indexOf('>Boil-off rate (gal/hr)<'));
    expect(markup.indexOf('>Fermentation volume (gal)<')).toBeLessThan(fermentTemp.at);
    // Post-boil: under the worked-out volume's readouts.
    expect(markup.indexOf(`>Post-boil volume at ${ref} (gal)<`)).toBeLessThan(postBoilTemp.at);

    // Each volume at 60 °F is the engine's correction of the measured volume.
    const refs = computeRecipe(r).refVolumesGal;
    expect(refs.preBoil).toBe(correctVolumeToRef(16, 150));
    expect(shown).toContain(`Pre-boil volume at ${ref} (gal) ${refs.preBoil.toFixed(3)}`);
    expect(shown).toContain(`Fermentation volume at ${ref} (gal) ${refs.ferment.toFixed(3)}`);
    expect(shown).toContain(`Post-boil volume at ${ref} (gal) ${refs.postBoil.toFixed(3)}`);

    // Order: the pre-boil temperature's 60 °F volume follows the box, then the
    // fermentation block; each temperature is its own box (its own row).
    expect(preBoilTemp.at).toBeLessThan(markup.indexOf(`>Pre-boil volume at ${ref} (gal)<`));
    expect(markup.indexOf(`>Fermentation volume at ${ref} (gal)<`)).toBeGreaterThan(fermentTemp.at);
    const temperatureBoxes = [preBoilTemp.tag, postBoilTemp.tag, fermentTemp.tag];
    expect(new Set(temperatureBoxes).size).toBe(3);
  });

  it('a cleared temperature shows an empty box and its volume at 60 °F as "—"', async () => {
    const markup = await renderVolumes(recipe({ preBoil: NaN, postBoil: 60, ferment: 213 }));
    expect(boxAfter(markup, 'Pre-boil volume measured at (°F)').value).toBe('');
    const shown = text(markup);
    expect(shown).toContain(`Pre-boil volume at ${REFERENCE_TEMP_F} °F (gal) —`);
    expect(shown).toContain(`Fermentation volume at ${REFERENCE_TEMP_F} °F (gal) —`);
  });

  // MV-S2
  it("the Options tab holds only the brewery's figures", async () => {
    const shown = text(await renderOptions(recipe()));
    expect(shown).not.toContain('This recipe');
    expect(shown).not.toContain(`at ${REFERENCE_TEMP_F} °F (gal)`);
    expect(shown).toContain('My brewery');
    // The brewery's own three temperatures stay (they are new recipes' figures).
    expect(shown).toContain('Pre-boil volume measured at (°F)');
    // And no recipe temperature is on the tab: its three boxes are the brewery's.
    const markup = await renderOptions(recipe());
    expect(markup).not.toContain('value="150"');
    expect(markup).not.toContain('value="180"');
  });

  // MV-S5
  it('nothing else changes: every figure and the saved document are the same for the same entries', () => {
    const r = recipe();
    const d = computeRecipe(r);
    // The engine called directly with the volumes as measured.
    expect(d.refVolumesGal.preBoil).toBe(correctVolumeToRef(16, 150));
    expect(d.refVolumesGal.ferment).toBe(correctVolumeToRef(12, 68));
    // The saved document is the canonical state, its temperatures in °F, at the same version.
    const doc = JSON.parse(exportRecipeDocument({ recipe: r, ...DEFAULT_DISPLAY }));
    expect(doc.version).toBe(9);
    expect(doc.recipe.measurementTempF).toEqual(TEMPS);
    expect(Object.keys(doc.recipe).sort()).toEqual(Object.keys(r).sort());
  });
});
