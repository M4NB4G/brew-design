// cost-card-no-price.test.js
// Scenarios for "A Cost card with no price reads '—'", batch S11 item 3
// (docs/items/cost-card-no-price.md, CC-S1 to CC-S3, decision CC-Q1). With
// no line priced, the Cost card's total and cost per gal (per bbl in Pro)
// read "—", with the count of unpriced lines as before; once one line is
// priced they add the priced lines as before (EC-Q6). The suite has no DOM:
// the card is drawn with renderToStaticMarkup.
//
// The pins are worked by hand, on the built-in recipe (10 lb Pale 2-Row,
// 5.5 gal in the fermenter at 60 °F; six lines: two malts, two kettle hops,
// one dry hop, the yeast):
//   Pale at $1.50/lb: 10 x 1.50 = $15.00; five lines left unpriced.
//   Per gal: 15 / 5.5 = 2.7272... -> $2.73.
//   Per bbl (1 bbl = 31 gal): 15 / (5.5 / 31) = 465 / 5.5 = 84.5454... -> $84.55.
//   Pale at $0/lb, typed: 10 x 0 = $0.00, a figure the brewer entered.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState } from '../src/state.js';
import { computeCost, computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import { exportRecipeDocument, SCHEMA_VERSION } from '../src/persistence.js';

async function cardText(r, mode = 'home', proVolumeUnit = 'bbl') {
  const { default: CostCard } = await import('../src/components/CostCard.jsx');
  const html = renderToStaticMarkup(
    createElement(CostCard, {
      recipe: r,
      cost: computeCost(r),
      mode,
      proVolumeUnit,
      proMaltUnit: 'lb',
      setRow: () => {},
      setYeast: () => {},
      addRow: () => {},
      removeRow: () => {},
    }),
  );
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const palePricedAt = (price) => {
  const r = defaultRecipeState();
  return { ...r, malts: [{ ...r.malts[0], pricePerLb: price }, r.malts[1]] };
};

describe('a Cost card with no price reads "—"', () => {
  // CC-S1, CC-Q1
  it('with no line priced the total reads "—"', async () => {
    const r = defaultRecipeState();
    // What the card shows, gathered so each figure is named.
    const shown = async (mode, unit) => (await cardText(r, mode, unit)).match(/Total .*$/)[0];
    expect({
      home: await shown('home'),
      proBbl: await shown('pro', 'bbl'),
      proGal: await shown('pro', 'gal'),
    }).toEqual({
      home: 'Total — · 6 lines unpriced Per gal —',
      proBbl: 'Total — · 6 lines unpriced Per bbl —',
      proGal: 'Total — · 6 lines unpriced Per gal —',
    });
    const cost = computeCost(r);
    expect(cost.total).toBeNaN();
    expect(cost.perGal).toBeNaN();
    expect(cost.unpriced).toBe(6);

    // An other line with no cost is unpriced too.
    const withOther = { ...r, otherCosts: [{ name: 'CO2', costPerBatch: NaN }] };
    expect(await cardText(withOther)).toContain('Total — · 7 lines unpriced');
  });

  // CC-S2
  it('one priced line gives its sum', async () => {
    const r = palePricedAt(1.5);
    const cost = computeCost(r);
    expect(cost.total).toBeCloseTo(15, 9);
    expect(cost.unpriced).toBe(5);
    expect(cost.perGal).toBeCloseTo(15 / 5.5, 9);
    const home = await cardText(r);
    expect(home).toContain('Total $15.00 · 5 lines unpriced');
    expect(home).toContain('Per gal $2.73');
    expect(await cardText(r, 'pro')).toContain('Per bbl $84.55');

    // A price typed as 0 is a priced line: the brewer entered it.
    const free = palePricedAt(0);
    expect(computeCost(free).total).toBe(0);
    expect(await cardText(free)).toContain('Total $0.00 · 5 lines unpriced');
    expect(await cardText(free)).toContain('Per gal $0.00');
  });

  // CC-S3
  it('nothing else changes', async () => {
    // Each line's cost: blank where unpriced, quantity x price where priced.
    const none = computeCost(defaultRecipeState());
    expect(none.lines).toHaveLength(6);
    for (const line of none.lines) expect(line.cost).toBeNaN();
    const one = computeCost(palePricedAt(1.5));
    expect(one.lines[0].cost).toBeCloseTo(15, 9);
    for (const line of one.lines.slice(1)) expect(line.cost).toBeNaN();
    expect(await cardText(defaultRecipeState())).toMatch(/Pale 2-Row 10\.00 lb \$\/lb —/);

    // The printed sheet carries no cost.
    const r = defaultRecipeState();
    const sheet = recipeSheet({
      recipe: r,
      derived: computeRecipe(r),
      water: computeWater(r.water, r),
      mode: 'home',
      proGravityUnit: 'plato',
      temperatureUnit: 'F',
      today: new Date(2026, 9, 8),
    });
    expect(JSON.stringify(sheet)).not.toMatch(/\$|Cost|unpriced/);

    // The saved document: version 12, prices blank as before.
    const doc = JSON.parse(exportRecipeDocument({ recipe: r, mode: 'home', proGravityUnit: 'plato', temperatureUnit: 'F', proVolumeUnit: 'bbl', proMaltUnit: 'lb' }));
    expect(doc.version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(12);
    expect(doc.recipe.malts[0].pricePerLb).toBeNull();
    expect(doc.recipe.otherCosts).toEqual([]);
  });
});
