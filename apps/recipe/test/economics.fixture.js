// economics.fixture.js
// The recipe and the renders the cost-of-a-batch scenarios share
// (economics.test.js), and from which `economics.before.json` was captured
// before the change (2026-10-06): "nothing else changes" compares the Recipe
// tab's cards, the printed sheet and the saved document against bytes the
// change did not write.

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import IdentitySection, { NotesSection } from '../src/components/IdentitySection.jsx';
import VolumesSection from '../src/components/VolumesSection.jsx';
import GristTable from '../src/components/GristTable.jsx';
import HopsSection from '../src/components/HopsSection.jsx';
import YeastCard from '../src/components/YeastCard.jsx';
import YeastSection from '../src/components/YeastSection.jsx';

export const TODAY = new Date(2026, 9, 6);

// The built-in recipe: 10 lb Pale 2-Row and 1 lb Munich, 1 oz Magnum and
// 1 oz Cascade in the kettle, 2 oz Citra dry, 5.5 gal in the fermenter.
export function recipe() {
  return defaultRecipeState();
}

const noop = () => {};

// The Recipe tab's cards, in screen order, as App draws them.
export function recipeTabHtml(r, mode, units = {}) {
  const d = computeRecipe(r);
  const html = (c, props) => renderToStaticMarkup(createElement(c, props));
  return {
    identity: html(IdentitySection, { name: r.name, style: r.style, setField: noop }),
    volumes: html(VolumesSection, {
      recipe: r,
      grist: d.grist,
      postBoilVolGal: d.postBoilVolGal,
      postBoilMeasuredGal: d.postBoilMeasuredGal,
      postBoilMeasuredShown: d.postBoilMeasuredShown,
      refVolumesGal: d.refVolumesGal,
      warnings: d.warnings,
      mode,
      ...units,
      setField: noop,
      setMeasurementTemp: noop,
    }),
    grist: html(GristTable, {
      malts: r.malts,
      efficiency: r.efficiency,
      grist: d.grist,
      mode,
      ...units,
      setRow: noop,
      addRow: noop,
      removeRow: noop,
      setField: noop,
      onSolve: noop,
      onUndoSolve: noop,
    }),
    yeastCard: html(YeastCard, {
      yeast: r.yeast,
      apparentAttenuation: r.apparentAttenuation,
      setYeast: noop,
      setField: noop,
    }),
    hops: html(HopsSection, {
      kettleAdditions: r.kettleAdditions,
      dryHops: r.dryHops,
      hops: d.hops,
      mode,
      setRow: noop,
      addRow: noop,
      removeRow: noop,
    }),
    pitch: html(YeastSection, { yeast: r.yeast, derived: d, mode, setYeast: noop }),
    notes: html(NotesSection, { notes: r.notes, setField: noop }),
  };
}

export function sheetData(r, mode, units = {}) {
  return recipeSheet({
    recipe: r,
    derived: computeRecipe(r),
    water: computeWater(r.water, r),
    mode,
    proGravityUnit: 'plato',
    temperatureUnit: 'F',
    ...units,
    today: TODAY,
  });
}
