// celsius-toggle.fixture.js
// The recipe, the brewery figures and the renders the °C display toggle's
// scenarios share (celsius-toggle.test.js), and from which
// `celsius-toggle.before.json` was captured before the change (2026-10-05):
// "nothing else changes in °F" compares against bytes the change did not write.

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState, emptyBreweryFigures } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import VolumesSection from '../src/components/VolumesSection.jsx';
import HopsSection from '../src/components/HopsSection.jsx';
import YeastCard from '../src/components/YeastCard.jsx';
import OptionsSection from '../src/components/OptionsSection.jsx';
import RecipeSheet from '../src/components/RecipeSheet.jsx';

export const TODAY = new Date(2026, 9, 5);

// Every kind of temperature set away from the reference: pre-boil 150 °F,
// post-boil 180 °F, fermentation volume 68 °F; boil hops at 212 °F and a
// whirlpool hop at 180 °F; A07 Flagship (lab range 60–72 °F) fermented at 77 °F.
export function recipe() {
  const r = defaultRecipeState();
  return {
    ...r,
    measurementTempF: { preBoil: 150, postBoil: 180, ferment: 68 },
    kettleAdditions: [
      { ...r.kettleAdditions[0] },
      { ...r.kettleAdditions[1], wortTempF: 180 },
    ],
    yeast: { ...r.yeast, name: 'A07 Flagship', fermTempF: 77 },
  };
}

// The brewery's pre-boil temperature set, the other two blank.
export function brewery() {
  const b = emptyBreweryFigures();
  return { ...b, measurementTempF: { preBoil: 150, postBoil: null, ferment: null } };
}

export function volumesHtml(r, mode, temperatureUnit) {
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
      temperatureUnit,
      setField: () => {},
      setMeasurementTemp: () => {},
    }),
  );
}

export function hopsHtml(r, mode, temperatureUnit) {
  const d = computeRecipe(r);
  return renderToStaticMarkup(
    createElement(HopsSection, {
      kettleAdditions: r.kettleAdditions,
      dryHops: r.dryHops,
      hops: d.hops,
      mode,
      temperatureUnit,
      setRow: () => {},
      addRow: () => {},
      removeRow: () => {},
    }),
  );
}

export function yeastHtml(r, temperatureUnit) {
  return renderToStaticMarkup(
    createElement(YeastCard, {
      yeast: r.yeast,
      apparentAttenuation: r.apparentAttenuation,
      temperatureUnit,
      setYeast: () => {},
      setField: () => {},
    }),
  );
}

export function optionsHtml(b, mode, temperatureUnit) {
  return renderToStaticMarkup(
    createElement(OptionsSection, {
      mode,
      temperatureUnit,
      brewery: b,
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

export function sheetData(r, mode, temperatureUnit) {
  return recipeSheet({
    recipe: r,
    derived: computeRecipe(r),
    water: computeWater(r.water, r),
    mode,
    proGravityUnit: 'plato',
    temperatureUnit,
    today: TODAY,
  });
}

export function sheetHtml(r, mode, temperatureUnit) {
  return renderToStaticMarkup(
    createElement(RecipeSheet, {
      recipe: r,
      derived: computeRecipe(r),
      water: computeWater(r.water, r),
      mode,
      proGravityUnit: 'plato',
      temperatureUnit,
    }),
  );
}
