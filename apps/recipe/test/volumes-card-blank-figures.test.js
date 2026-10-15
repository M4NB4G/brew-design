// @vitest-environment jsdom
// volumes-card-blank-figures.test.js
// Scenarios for "Figures that depend on an empty box read '—' on the Volumes
// card" (docs/items/volumes-card-blank-figures.md, NV-S1 to NV-S3, NV-Q1;
// Tier C). The app is drawn whole, in jsdom, from a saved recipe with one box
// emptied (a blank figure, NaN, as SPEC rule 8 stores it), and the Volumes
// card's read-only figures are read as the brewer sees them.
//
// "As before" (NV-S3): the card showed each of these figures as the number
// rounded to three decimals with its trailing zeros dropped ("1.7", not
// "1.700"); the expected text below is worked out that way from the
// selectors' own figure, the rule the card used before the change.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import { savePersisted } from '../src/persistence.js';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let host;
let errors;

function mount(recipe) {
  window.localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => false;
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  savePersisted(window.localStorage, {
    recipe,
    mode: 'home',
    proGravityUnit: 'plato',
    temperatureUnit: 'F',
    proVolumeUnit: 'bbl',
    proMaltUnit: 'lb',
  });
  // React's warning "Received NaN for the `children` attribute" comes here.
  errors = [];
  const original = console.error;
  console.error = (...args) => errors.push(args.join(' '));
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  try {
    act(() => root.render(createElement(App)));
  } finally {
    console.error = original;
  }
}

afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

// The read-only figure on the row whose label starts with `label`.
function readout(label) {
  const span = [...host.querySelectorAll('span')].find((s) => text(s).startsWith(label) && s.children.length === 0);
  if (!span) throw new Error(`no row "${label}"`);
  const row = span.parentElement.parentElement;
  return text(row.lastElementChild);
}
const hasRow = (label) => [...host.querySelectorAll('span')].some((s) => text(s).startsWith(label) && s.children.length === 0);

const MASH_RV = 'Mash Rv (';
const MASH_R = 'Mash R (';
const POST_BOIL_REF = 'Post-boil volume at 60 °F (gal)';
const POST_BOIL_MEASURED = 'Post-boil volume at 200 °F (gal)';

// The built-in recipe with the post-boil volume measured hot, so the
// measured post-boil volume shows beside the one at 60 °F.
const measuredHot = () => {
  const r = defaultRecipeState();
  return { ...r, measurementTempF: { ...r.measurementTempF, postBoil: 200 } };
};

// Today's figure: to three decimals, trailing zeros dropped.
const asBefore = (x) => String(Number(x.toFixed(3)));

describe('figures that depend on an empty box read "—" on the Volumes card', () => {
  it('each emptied box makes the figures that need it read "—", never "NaN"', () => {
    // NV-S1: the mash water emptied.
    mount({ ...measuredHot(), mashWaterGal: NaN });
    expect(readout(MASH_RV)).toBe('—');
    expect(readout(MASH_R)).toBe('—');

    // NV-S2: the pre-boil volume emptied; the measured post-boil volume shows too.
    act(() => root.unmount());
    mount({ ...measuredHot(), preBoilVolGal: NaN });
    expect(readout(POST_BOIL_REF)).toBe('—');
    expect(hasRow(POST_BOIL_MEASURED)).toBe(true);
    expect(readout(POST_BOIL_MEASURED)).toBe('—');

    // NV-S2: the boil time emptied.
    act(() => root.unmount());
    mount({ ...measuredHot(), boilTimeMin: NaN });
    expect(readout(POST_BOIL_REF)).toBe('—');
    expect(readout(POST_BOIL_MEASURED)).toBe('—');

    // NV-S2: the post-boil measurement temperature emptied (the measured
    // volume is not shown then; the one at 60 °F reads "—").
    act(() => root.unmount());
    const r = defaultRecipeState();
    mount({ ...r, measurementTempF: { ...r.measurementTempF, postBoil: NaN } });
    expect(readout(POST_BOIL_REF)).toBe('—');
    expect(hasRow('Post-boil volume at NaN')).toBe(false);
    expect(errors.join('\n')).not.toContain('Received NaN');
  });

  it('with every box filled each figure reads as before', () => {
    // NV-S3: the built-in recipe, the post-boil volume measured hot.
    const recipe = measuredHot();
    const out = computeRecipe(recipe);
    mount(recipe);
    expect(readout(MASH_RV)).toBe(asBefore(out.grist.mashRv));
    expect(readout(MASH_R)).toBe(asBefore(out.grist.mashR));
    expect(readout(POST_BOIL_REF)).toBe(asBefore(out.postBoilVolGal));
    expect(readout(POST_BOIL_MEASURED)).toBe(asBefore(out.postBoilMeasuredGal));
    for (const label of [MASH_RV, MASH_R, POST_BOIL_REF, POST_BOIL_MEASURED]) {
      expect(readout(label), label).not.toBe('—');
      expect(readout(label), label).not.toMatch(/0$/); // no padding to fixed digits
    }
    expect(errors).toEqual([]);
  });
});
