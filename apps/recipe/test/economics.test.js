// economics.test.js
// Scenarios for "Cost of a batch" (docs/items/economics.md, EC-S1 to EC-S5,
// decisions EC-Q1 to EC-Q6, K). A Cost card on the Recipe tab lists each
// malt, kettle hop and dry hop, the yeast and the brewer's other lines, each
// with a price box; each line costs its quantity times its price and the
// batch its total, by the engine's rollupCost, and a gal (Home) or bbl (Pro)
// costs the total over the fermentation volume, by the engine's costPerUnit.
// Prices are saved with the recipe (recipe format 11). The suite has no DOM:
// the card is drawn with renderToStaticMarkup; typing is checked at the far end.
//
// The pins are worked by hand.
//   10 lb Pale at $1.20/lb = $12.00; 1 lb Munich at $1.50 = $1.50;
//   1 oz Magnum at $2.00/oz = $2.00; 1 oz Cascade at $1.80 = $1.80;
//   2 oz Citra (dry) at $2.50/oz = $5.00; the yeast $8.00 a batch;
//   an other line, CO2, $3.70 a batch.
//   Total 12 + 1.5 + 2 + 1.8 + 5 + 8 + 3.7 = $34.00.
//   Per gal at 5.5 gal: 34 / 5.5 = 6.1818... -> $6.18.
//   Per bbl (1 bbl = 31 gal): 34 / (5.5 / 31) = 1054 / 5.5 = 191.6363... -> $191.64.
//   Munich unpriced: 34 - 1.5 = $32.50, "1 line unpriced"; per gal 32.5 / 5.5 = 5.9090... -> $5.91.
//   Pro: a 1 lb hop (16 oz) at $40/lb = $40.00.
//   Sacks: 3.22 sacks (177.1 lb) at $60/sack = 3.22 x 60 = $193.20.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_DISPLAY, defaultRecipeState } from '../src/state.js';
import * as selectors from '../src/selectors.js';
import * as display from '../src/display.js';
import { computeRecipe } from '../src/selectors.js';
import {
  exportRecipeDocument,
  importRecipeFile,
  loadPersisted,
  savePersisted,
  STORAGE_KEY,
  SCHEMA_VERSION,
} from '../src/persistence.js';
import { emptyFields, emptyFieldsLine } from '../src/empty-fields.js';
import { newRow, pickIngredient } from '../src/ingredient-search.js';
import * as f from './economics.fixture.js';

const BEFORE = JSON.parse(readFileSync(new URL('./economics.before.json', import.meta.url), 'utf8'));
const computeCost = (...a) => selectors.computeCost(...a);
// The card's module, loaded per scenario (it is new with this item).
const card = () => import('../src/components/CostCard.jsx');

// The built-in recipe with every line priced as in the header.
function priced() {
  const r = f.recipe();
  return {
    ...r,
    malts: [
      { ...r.malts[0], pricePerLb: 1.2 },
      { ...r.malts[1], pricePerLb: 1.5 },
    ],
    kettleAdditions: [
      { ...r.kettleAdditions[0], pricePerOz: 2 },
      { ...r.kettleAdditions[1], pricePerOz: 1.8 },
    ],
    dryHops: [{ ...r.dryHops[0], pricePerOz: 2.5 }],
    yeast: { ...r.yeast, pricePerBatch: 8 },
    otherCosts: [{ name: 'CO2', costPerBatch: 3.7 }],
  };
}

async function cardHtml(r, mode = 'home', units = {}) {
  const { default: CostCard } = await card();
  return renderToStaticMarkup(
    createElement(CostCard, {
      recipe: r,
      cost: computeCost(r),
      mode,
      proVolumeUnit: 'bbl',
      proMaltUnit: 'lb',
      ...units,
      setRow: () => {},
      setYeast: () => {},
      addRow: () => {},
      removeRow: () => {},
    }),
  );
}

// The card's text, tags taken out, spaces run together.
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _map: m,
  };
}

describe('cost of a batch', () => {
  // EC-S1
  it('the Cost card lists each malt, hop, dry hop, the yeast and other lines, each with a price box', async () => {
    const html = await cardHtml(priced());
    const t = text(html);
    expect(t).toMatch(/^Cost/);
    for (const name of ['Pale 2-Row', 'Munich', 'Magnum', 'Cascade', 'Citra', 'Yeast']) expect(t).toContain(name);
    // The other line's name is its own box.
    expect(html).toMatch(/value="CO2"/);
    // A price box per line, each in its unit: malt per lb, hop per oz, the
    // yeast and the other line per batch.
    expect(html.match(/aria-label="Price[^"]*"/g)).toEqual([
      'aria-label="Price of Pale 2-Row ($/lb)"',
      'aria-label="Price of Munich ($/lb)"',
      'aria-label="Price of Magnum ($/oz)"',
      'aria-label="Price of Cascade ($/oz)"',
      'aria-label="Price of Citra ($/oz)"',
      'aria-label="Price of Yeast ($/batch)"',
      'aria-label="Price of CO2 ($/batch)"',
    ]);
    expect(t).toContain('+ Add line');

    // Pro: a hop per lb; with sacks, a malt per sack.
    const pro = await cardHtml(priced(), 'pro');
    expect(pro).toContain('aria-label="Price of Magnum ($/lb)"');
    expect(pro).toContain('aria-label="Price of Pale 2-Row ($/lb)"');
    const sacks = await cardHtml(priced(), 'pro', { proMaltUnit: 'sack' });
    expect(sacks).toContain('aria-label="Price of Pale 2-Row ($/sack)"');

    // A named strain is the yeast line's name.
    const strain = { ...priced(), yeast: { ...priced().yeast, name: 'US-05' } };
    expect(await cardHtml(strain)).toContain('aria-label="Price of US-05 ($/batch)"');
  });

  // EC-S2
  it('each line costs its quantity times its price', async () => {
    const r = priced();
    const cost = computeCost(r);
    // 10 lb x $1.20 = $12.00; 2 oz x $2.50 = $5.00 (by hand).
    expect(cost.lines.map((l) => l.cost.toFixed(2))).toEqual(['12.00', '1.50', '2.00', '1.80', '5.00', '8.00', '3.70']);
    const t = text(await cardHtml(r));
    expect(t).toMatch(/Pale 2-Row 10\.00 lb \$\/lb \$12\.00/);
    expect(t).toMatch(/Citra 2\.00 oz \$\/oz \$5\.00/);

    // Pro: a 1 lb hop at $40/lb is $40.00; the box shows $40.
    const pro = {
      ...r,
      kettleAdditions: [{ ...r.kettleAdditions[0], weightOz: 16, pricePerOz: display.hopPriceToCanonical(40, 'pro') }],
    };
    expect(computeCost(pro).lines[2].cost).toBeCloseTo(40, 9);
    const proHtml = await cardHtml(pro, 'pro');
    expect(proHtml).toMatch(/aria-label="Price of Magnum \(\$\/lb\)"[^>]*value="40"|value="40"[^>]*aria-label="Price of Magnum/);
    expect(text(proHtml)).toMatch(/Magnum 1\.00 lb \$\/lb \$40\.00/);

    // Sacks: 3.22 sacks (177.1 lb) at $60/sack is $193.20.
    const sacks = {
      ...r,
      malts: [{ ...r.malts[0], weightLb: 177.1, pricePerLb: display.maltPriceToCanonical(60, 'pro', 'sack') }],
    };
    expect(computeCost(sacks).lines[0].cost).toBeCloseTo(193.2, 9);
    const sackHtml = await cardHtml(sacks, 'pro', { proMaltUnit: 'sack' });
    expect(sackHtml).toMatch(/value="60"/);
    expect(text(sackHtml)).toMatch(/Pale 2-Row 3\.22 sacks \$\/sack \$193\.20/);
  });

  // EC-S2, EC-S4, EC-Q6
  it('the total and the cost per unit', async () => {
    const r = priced();
    const cost = computeCost(r);
    expect(cost.total).toBeCloseTo(34, 9);
    expect(cost.unpriced).toBe(0);
    // Per gal at Home: 34 / 5.5 = 6.1818... -> $6.18.
    expect(cost.perGal).toBeCloseTo(34 / 5.5, 9);
    let t = text(await cardHtml(r));
    expect(t).toContain('Total $34.00');
    expect(t).toContain('Per gal $6.18');
    expect(t).not.toContain('unpriced');

    // Pro in barrels: 34 / (5.5 / 31) = 191.6363... -> $191.64; Pro in gallons: per gal.
    t = text(await cardHtml(r, 'pro'));
    expect(t).toContain('Per bbl $191.64');
    t = text(await cardHtml(r, 'pro', { proVolumeUnit: 'gal' }));
    expect(t).toContain('Per gal $6.18');

    // An unpriced line shows "—"; the total adds the priced lines and counts it.
    const munich = { ...r, malts: [r.malts[0], { ...r.malts[1], pricePerLb: NaN }] };
    const m = computeCost(munich);
    expect(m.total).toBeCloseTo(32.5, 9);
    expect(m.unpriced).toBe(1);
    t = text(await cardHtml(munich));
    expect(t).toMatch(/Munich 1\.00 lb \$\/lb —/);
    expect(t).toContain('Total $32.50 · 1 line unpriced');
    expect(t).toContain('Per gal $5.91');
    // Every line unpriced (a new recipe): the count says so.
    const none = computeCost(f.recipe());
    expect(none.unpriced).toBe(6);
    expect(text(await cardHtml(f.recipe()))).toContain('6 lines unpriced');

    // A zero, negative or blank fermentation volume: the cost per unit is blank, "—".
    for (const v of [0, -5, NaN]) {
      const c = computeCost({ ...r, fermentVolGal: v });
      expect(Number.isNaN(c.perGal)).toBe(true);
      expect(text(await cardHtml({ ...r, fermentVolGal: v }))).toContain('Per gal —');
    }
  });

  // EC-S3, K
  it('prices are saved and older documents read blank', () => {
    expect(SCHEMA_VERSION).toBe(11);
    const r = priced();
    const s = memoryStorage();
    savePersisted(s, { recipe: r, ...DEFAULT_DISPLAY });
    expect(JSON.parse(s._map.get(STORAGE_KEY)).version).toBe(11);
    const back = loadPersisted(s, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY });
    expect(back.recipe).toEqual(r);
    // A blank price round-trips as blank.
    const blank = { ...r, yeast: { ...r.yeast, pricePerBatch: NaN } };
    savePersisted(s, { recipe: blank, ...DEFAULT_DISPLAY });
    expect(Number.isNaN(loadPersisted(s, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }).recipe.yeast.pricePerBatch)).toBe(true);

    // The recipe file is the same document, read by the same reader.
    const file = exportRecipeDocument({ recipe: r, ...DEFAULT_DISPLAY });
    const imported = importRecipeFile(file, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }, () => true);
    expect(imported.outcome).toBe('replaced');
    expect(imported.state.recipe).toEqual(r);

    // A version-10 document (captured before the change) reads with every price blank and no other lines.
    const old = memoryStorage();
    old.setItem(STORAGE_KEY, BEFORE.document);
    const read = loadPersisted(old, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }, null);
    expect(read).not.toBeNull();
    expect(read.recipe.malts.every((m) => Number.isNaN(m.pricePerLb))).toBe(true);
    expect(read.recipe.kettleAdditions.every((a) => Number.isNaN(a.pricePerOz))).toBe(true);
    expect(read.recipe.dryHops.every((d) => Number.isNaN(d.pricePerOz))).toBe(true);
    expect(Number.isNaN(read.recipe.yeast.pricePerBatch)).toBe(true);
    expect(read.recipe.otherCosts).toEqual([]);
    expect(read.recipe).toEqual(defaultRecipeState());
    // An older one too (version 9: no Pro unit choices).
    const v9 = JSON.parse(BEFORE.document);
    delete v9.proVolumeUnit;
    delete v9.proMaltUnit;
    old.setItem(STORAGE_KEY, JSON.stringify({ ...v9, version: 9 }));
    expect(loadPersisted(old, { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }, null).recipe).toEqual(defaultRecipeState());

    // Each price is checked as a number or blank, like the row's other figures;
    // an other line carries a name and a cost.
    const doc = JSON.parse(file);
    const damaged = [
      (d) => (d.recipe.malts[0].pricePerLb = '1.2'),
      (d) => delete d.recipe.kettleAdditions[1].pricePerOz,
      (d) => (d.recipe.dryHops[0].pricePerOz = 'x'),
      (d) => delete d.recipe.yeast.pricePerBatch,
      (d) => (d.recipe.otherCosts = 'CO2'),
      (d) => (d.recipe.otherCosts[0] = { name: 'CO2' }),
      (d) => (d.recipe.otherCosts[0] = { name: 3, costPerBatch: 3.7 }),
      (d) => delete d.recipe.otherCosts,
    ];
    for (const damage of damaged) {
      const d = structuredClone(doc);
      damage(d);
      const out = importRecipeFile(JSON.stringify(d), { recipe: defaultRecipeState(), ...DEFAULT_DISPLAY }, () => true);
      expect(out.outcome, String(damage)).toBe('refused');
    }

    // Picking an ingredient leaves the row's price; a new row's price is blank.
    const malt = { ...r.malts[0] };
    expect(pickIngredient('malts', malt, { name: 'Munich', fgdb: 0.78, colorL: 9, type: 'base', distilledWaterPh: null, acidityMeqPerKg: null }).pricePerLb).toBe(1.2);
    const hop = { ...r.kettleAdditions[0] };
    expect(pickIngredient('kettleAdditions', hop, { name: 'Citra', alphaAcidFraction: 0.12 }).pricePerOz).toBe(2);
    expect(Number.isNaN(newRow('malts').pricePerLb)).toBe(true);
    expect(Number.isNaN(newRow('kettleAdditions').pricePerOz)).toBe(true);
    expect(Number.isNaN(newRow('dryHops').pricePerOz)).toBe(true);
    // A new recipe's prices are blank and it has no other lines.
    const fresh = defaultRecipeState();
    expect(Number.isNaN(fresh.malts[0].pricePerLb)).toBe(true);
    expect(Number.isNaN(fresh.yeast.pricePerBatch)).toBe(true);
    expect(fresh.otherCosts).toEqual([]);
  });

  // EC-S5, EC-Q5, EC-Q6
  it('nothing else changes', () => {
    const r = priced();
    const sack = { proVolumeUnit: 'bbl', proMaltUnit: 'sack' };
    // The Recipe tab's other cards, with every price set, as before.
    expect(f.recipeTabHtml(r, 'home')).toEqual(BEFORE['recipe-tab-home']);
    expect(f.recipeTabHtml(r, 'pro', sack)).toEqual(BEFORE['recipe-tab-pro']);
    // The printed sheet as before, with no cost on it.
    const sheet = JSON.parse(JSON.stringify(f.sheetData(r, 'home')));
    expect(sheet).toEqual(BEFORE['sheet-home']);
    expect(JSON.parse(JSON.stringify(f.sheetData(r, 'pro', sack)))).toEqual(BEFORE['sheet-pro']);
    expect(JSON.stringify(sheet)).not.toContain('$');
    // Every recipe figure as before.
    const plain = f.recipe();
    const strip = (d) => JSON.parse(JSON.stringify(d));
    expect(strip(computeRecipe(r))).toEqual(strip(computeRecipe(plain)));
    // A blank price is not named under the stats bar.
    expect(emptyFieldsLine(emptyFields(plain, computeRecipe(plain)))).toBeNull();
    // The saved document: as before, at version 11, with blank prices and no other lines.
    const before = JSON.parse(BEFORE.document);
    const after = JSON.parse(exportRecipeDocument({ recipe: plain, ...DEFAULT_DISPLAY }));
    expect(after).toEqual({
      ...before,
      version: 11,
      recipe: {
        ...before.recipe,
        malts: before.recipe.malts.map((m) => ({ ...m, pricePerLb: null })),
        kettleAdditions: before.recipe.kettleAdditions.map((a) => ({ ...a, pricePerOz: null })),
        dryHops: before.recipe.dryHops.map((d) => ({ ...d, pricePerOz: null })),
        yeast: { ...before.recipe.yeast, pricePerBatch: null },
        otherCosts: [],
      },
    });
  });
});
