// inverse-solver.fixture.js
// The recipes and the Grist card render the "Design to a target OG"
// scenarios share (inverse-solver.test.js), and from which
// `inverse-solver.before.json` was captured before the change (2026-10-06):
// "nothing else changes" compares against bytes the change did not write.

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import GristTable from '../src/components/GristTable.jsx';

// The built-in recipe: 10 lb Pale 2-Row and 1 lb Munich.
export function recipe() {
  return defaultRecipeState();
}

// The Grist card as the Recipe tab draws it, with no Solve.
export function gristHtml(r, { mode = 'home', proMaltUnit = 'lb', proGravityUnit = 'plato', solved = null } = {}) {
  const d = computeRecipe(r);
  return renderToStaticMarkup(
    createElement(GristTable, {
      malts: r.malts,
      efficiency: r.efficiency,
      grist: d.grist,
      setRow: () => {},
      addRow: () => {},
      removeRow: () => {},
      setField: () => {},
      mode,
      proMaltUnit,
      proGravityUnit,
      recipe: r,
      solved,
      onSolve: () => {},
      onUndoSolve: () => {},
    }),
  );
}

// The Grist card with this item's additions taken out: the "% of total"
// heading and cells, and the closed "Design to target OG" control (IS-S7).
// Earlier items' before-captures of the card compare through it.
export function withoutTargetOgDesign(html) {
  return html
    .replace(/<th[^>]*>% of total<\/th>/g, '')
    .replace(/<td[^>]*data-share[^>]*>[^<]*<\/td>/g, '')
    .replace(/<section aria-label="Design to target OG".*<\/section>/s, '');
}
