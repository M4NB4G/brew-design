// brewery-placeholders.test.js
// Scenarios for S6c item 2, "Blank brewery figures name the built-in one"
// (docs/items/blank-brewery-figures.md, BB-S1 to BB-S4, decisions BB-Q1 to
// BB-Q3): in My brewery each empty number box shows, greyed inside the box,
// the figure a new recipe gets in its place, in the screen's units; it is
// never a value. The suite has no DOM: the Options tab is rendered to markup
// and each box's placeholder attribute is read. The grey itself is the
// browser's placeholder grey, checked at the far end.
//
// The expected figures are the sentence's own, written here as the pins: the
// built-in recipe's 5.5 gal batch, 7 gal pre-boil, 1.5 gal/hr boil-off, 60 min
// boil, 60 °F, 75 % efficiency, and 0.1 qt/lb grain absorption. In Pro a
// volume is gal / 31 (1 bbl = 31 gal): 5.5 / 31 = 0.17741935 -> 0.177419 and
// 1.5 / 31 = 0.04838710 -> 0.048387, six decimals as the box's own value shows.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { emptyBreweryFigures, breweryBannerShown } from '../src/state.js';
import { exportBreweryDocument } from '../src/persistence.js';

const render = async (brewery, mode = 'home') => {
  const { default: OptionsSection } = await import('../src/components/OptionsSection.jsx');
  return renderToStaticMarkup(
    createElement(OptionsSection, {
      mode,
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
};

// The box on the row labelled `label`: its value and its placeholder.
function box(markup, label) {
  const at = markup.indexOf(`>${label}<`);
  expect(at, `"${label}" is on the tab`).toBeGreaterThan(-1);
  const tag = markup.slice(at).match(/<input[^>]*>/)[0];
  return { value: tag.match(/value="([^"]*)"/)?.[1], placeholder: tag.match(/placeholder="([^"]*)"/)?.[1] };
}

const HOME = [
  ['Batch (fermentation) volume (gal)', '5.5'],
  ['Pre-boil volume (gal)', '7'],
  ['Boil-off rate (gal/hr)', '1.5'],
  ['Boil time (min)', '60'],
  ['Pre-boil volume measured at (°F)', '60'],
  ['Post-boil volume measured at (°F)', '60'],
  ['Fermentation volume measured at (°F)', '60'],
  ['Brewhouse efficiency (%)', '75'],
  ['Grain absorption (qt/lb)', '0.1'],
];

// Boxes whose built-in figure is itself blank (BB-Q1).
const NO_BUILT_IN = [
  'Treated volume (gal)',
  'Top-up level (gal)',
  'Calcium Ion (ppm)',
  'Magnesium Ion (ppm)',
  'Sodium Ion (ppm)',
  'Sulfate Ion (SO₄²⁻) (ppm)',
  'Chloride Ion (ppm)',
  'Total Alkalinity (ppm)',
  'pH (SU)',
];

describe('blank brewery figures name the built-in one', () => {
  // BB-S1, BB-S2, BB-Q1
  it('each blank brewery box shows the built-in figure greyed', async () => {
    const markup = await render(emptyBreweryFigures());
    for (const [label, figure] of HOME) {
      expect(box(markup, label), label).toEqual({ value: '', placeholder: figure });
    }
    // No built-in figure to name: the box stays empty.
    for (const label of NO_BUILT_IN) {
      expect(box(markup, label), label).toEqual({ value: '', placeholder: undefined });
    }

    // In Pro the volumes are in barrels, as the box's own value would show them.
    const pro = await render(emptyBreweryFigures(), 'pro');
    expect(box(pro, 'Batch (fermentation) volume (bbl)').placeholder).toBe('0.177419');
    expect(box(pro, 'Boil-off rate (bbl/hr)').placeholder).toBe('0.048387');
    expect(box(pro, 'Boil time (min)').placeholder).toBe('60');
    expect(box(pro, 'Brewhouse efficiency (%)').placeholder).toBe('75');
  });

  // BB-S3
  it('a set figure shows itself, not the built-in one', async () => {
    const b = { ...emptyBreweryFigures(), fermentVolGal: 12, boilTimeMin: 90, efficiency: 0.93 };
    const markup = await render(b);
    expect(box(markup, 'Batch (fermentation) volume (gal)')).toEqual({ value: '12', placeholder: undefined });
    expect(box(markup, 'Boil time (min)')).toEqual({ value: '90', placeholder: undefined });
    expect(box(markup, 'Brewhouse efficiency (%)')).toEqual({ value: '93', placeholder: undefined });
    // The ones still blank name the built-in figure.
    expect(box(markup, 'Pre-boil volume (gal)').placeholder).toBe('7');
  });

  // BB-S3, BB-S4
  it('the greyed figure is never a value', async () => {
    const b = emptyBreweryFigures();
    const before = exportBreweryDocument(b);
    await render(b);
    await render(b, 'pro');
    // The document the brewery keeps (and exports) is byte for byte the same,
    // and holds no figure: every one is blank.
    expect(exportBreweryDocument(b)).toBe(before);
    const doc = JSON.parse(before).brewery;
    expect(doc.fermentVolGal).toBeNull();
    expect(doc.preBoilVolGal).toBeNull();
    expect(doc.efficiency).toBeNull();
    expect(doc.water.absorptionQtPerLb).toBeNull();
    // The banner still shows while every figure is blank.
    expect(breweryBannerShown(b, false)).toBe(true);
    // No box carries a value.
    const values = [...(await render(b)).matchAll(/<input type="number"[^>]*value="([^"]*)"/g)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(10);
    expect(values.every((v) => v === '')).toBe(true);
  });
});
