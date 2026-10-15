// water-section-page-break.fixture.js
// The printed sheet's markup for the one recipe that draws every block of the
// Water Treatment section (docs/items/water-section-page-break.md): the owner's
// West Coast Pilsner (west-coast-pils.fixture.js) with the mash water treated,
// the salts and acid going into the mash, kettle salts on, water back on (so
// the fermenter's table prints too) and a note. The date the sheet prints is
// fixed so the markup is the same on any day.
// `water-section-page-break.before.json` holds this markup as the code drew it
// before the item, captured once and never re-made.

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { vi } from 'vitest';
import { REFERENCE_TEMP_F } from '@brew/engine';
import { computeRecipe, computeWater } from '../src/selectors.js';
import RecipeSheet from '../src/components/RecipeSheet.jsx';
import { wcPils } from './west-coast-pils.fixture.js';

export const printedRecipe = () => ({
  ...wcPils({ treatment: 'mash', acidPlace: 'mash' }),
  notes: 'Mash at 148 F for 60 minutes.',
  waterBack: { on: true, volumeGal: 1.5, tempF: REFERENCE_TEMP_F },
});

// The sheet as the print dialog draws it, on 2026-10-15.
export function sheetMarkup(recipe = printedRecipe()) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 15, 12));
  try {
    return renderToStaticMarkup(
      createElement(RecipeSheet, {
        recipe,
        derived: computeRecipe(recipe),
        water: computeWater(recipe.water, recipe),
        mode: 'home',
        proGravityUnit: 'plato',
      }),
    );
  } finally {
    vi.useRealTimers();
  }
}
