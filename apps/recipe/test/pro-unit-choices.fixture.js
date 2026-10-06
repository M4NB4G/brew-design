// pro-unit-choices.fixture.js
// The recipe, the brewery figures and the renders the Pro unit choices'
// scenarios share (pro-unit-choices.test.js), and from which
// `pro-unit-choices.before.json` was captured before the change (2026-10-05):
// "nothing else changes with barrels and pounds" compares against bytes the
// change did not write.

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState, emptyBreweryFigures } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import VolumesSection from '../src/components/VolumesSection.jsx';
import GristTable from '../src/components/GristTable.jsx';
import HopsSection from '../src/components/HopsSection.jsx';
import OptionsSection from '../src/components/OptionsSection.jsx';
import SaltsAcidScreen from '../src/components/water/SaltsAcidScreen.jsx';

export const TODAY = new Date(2026, 9, 5);

// A brewery-sized recipe: 177.1 lb of base malt (3.22 sacks) and 55 lb of
// Munich (1 sack), 400 gal pre-boil, 15 gal/hr boil-off, 380 gal in the
// fermenter, 150 gal of mash water; its water treated in the hot-liquor tank
// (460 gal treated, topped up to 500), with a fly sparge of 310 gal, a water
// report entered and the kettle salts on.
export function recipe() {
  const r = defaultRecipeState();
  return {
    ...r,
    malts: [
      { ...r.malts[0], weightLb: 177.1 },
      { ...r.malts[1], weightLb: 55 },
    ],
    preBoilVolGal: 400,
    boilOffRateGalPerHr: 15,
    fermentVolGal: 380,
    mashWaterGal: 150,
    kettleAdditions: r.kettleAdditions.map((a) => ({ ...a, weightOz: 80 })),
    dryHops: [{ name: 'Citra', weightOz: 240, pricePerOz: NaN }],
    measurementTempF: { preBoil: 150, postBoil: 180, ferment: 68 },
    water: {
      ...r.water,
      source: { Ca: 40, Mg: 8, Na: 12, SO4: 30, Cl: 25, Alkalinity: 80, pH: 7.8 },
      vessels: 3,
      treatment: 'tank',
      kettleSalts: true,
      spargeMethod: 'fly',
      tankTreatedGal: 460,
      tankTopUpGal: 500,
      spargeGal: 310,
    },
  };
}

// The brewery's batch volume set (380 gal), the rest blank.
export function brewery() {
  return { ...emptyBreweryFigures(), fermentVolGal: 380, mode: 'pro' };
}

export function volumesHtml(r, mode, units = {}) {
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
      ...units,
      setField: () => {},
      setMeasurementTemp: () => {},
    }),
  );
}

export function gristHtml(r, mode, units = {}) {
  const d = computeRecipe(r);
  return renderToStaticMarkup(
    createElement(GristTable, {
      malts: r.malts,
      efficiency: r.efficiency,
      grist: d.grist,
      mode,
      ...units,
      setRow: () => {},
      addRow: () => {},
      removeRow: () => {},
      setField: () => {},
    }),
  );
}

export function hopsHtml(r, mode, units = {}) {
  const d = computeRecipe(r);
  return renderToStaticMarkup(
    createElement(HopsSection, {
      kettleAdditions: r.kettleAdditions,
      dryHops: r.dryHops,
      hops: d.hops,
      mode,
      ...units,
      setRow: () => {},
      addRow: () => {},
      removeRow: () => {},
    }),
  );
}

export function waterHtml(r, mode, units = {}) {
  return renderToStaticMarkup(
    createElement(SaltsAcidScreen, {
      water: r.water,
      figures: computeWater(r.water, r),
      mode,
      ...units,
      setWater: () => {},
    }),
  );
}

export function optionsHtml(b, mode, units = {}) {
  return renderToStaticMarkup(
    createElement(OptionsSection, {
      mode,
      ...units,
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

export function sheetData(r, mode, units = {}, brewery = emptyBreweryFigures()) {
  return recipeSheet({
    recipe: r,
    derived: computeRecipe(r),
    water: computeWater(r.water, r),
    mode,
    proGravityUnit: 'plato',
    ...units,
    brewery,
    today: TODAY,
  });
}
