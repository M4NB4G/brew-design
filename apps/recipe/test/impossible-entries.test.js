// @vitest-environment jsdom
// impossible-entries.test.js
// Scenarios for "An entry that cannot be is refused"
// (docs/items/impossible-entries.md, IE-S1 to IE-S8; Tier B). The app is
// drawn whole, in jsdom, from a saved recipe; the saved-recipe scenario also
// reads the UI's own selectors (computeRecipe, computeCost, computeWater,
// solveTargetOG) and the line under the stats bar (empty-fields.js).
//
// The limits (the item's notes): 0, definitional (nothing is less than none);
// 100 %, definitional, a fraction of 1 as the recipe holds a percent; and
// 213 °F, the owner's (H-3).
//
// Hand figures for the hop temperature in °C (IE-S3, IE-S6, IE-Q1), by
// °F = °C × 9 / 5 + 32:
//   213 °F = (213 − 32) × 5 / 9 = 181 × 5 / 9 = 905 / 9 = 100.5555... °C,
//     "100.56" to two decimals;
//   100.5 °C = 100.5 × 1.8 + 32 = 180.9 + 32 = 212.9 °F: not above 213, taken;
//   100.6 °C = 100.6 × 1.8 + 32 = 181.08 + 32 = 213.08 °F: above 213, refused;
//   101 °C = 101 × 1.8 + 32 = 181.8 + 32 = 213.8 °F: refused;
//   −5 °C = −9 + 32 = 23 °F: a negative °C is real (N-2), taken.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import { defaultRecipeState, switchMode, emptyBreweryFigures } from '../src/state.js';
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  savePersisted,
  loadStartingState,
  exportRecipeDocument,
  importRecipeFile,
} from '../src/persistence.js';
import { computeRecipe, computeCost, computeWater, solveTargetOG } from '../src/selectors.js';
import * as lineUnderStats from '../src/empty-fields.js';
import { solveRefusalText } from '../src/components/TargetOgSolver.jsx';
import { wcPils } from './west-coast-pils.fixture.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The line under the stats bar's three steps (empty-fields.js), read through
// the module so a step missing before the change fails its assertion.
const { emptyFields, emptyFieldsLine } = lineUnderStats;
const outsideFields = (recipe) => lineUnderStats.outsideFields?.(recipe) ?? [];

let root;
let host;

const display = (temperatureUnit = 'F') => ({
  mode: 'home',
  proGravityUnit: 'plato',
  temperatureUnit,
  proVolumeUnit: 'bbl',
  proMaltUnit: 'lb',
});

// Saves the recipe as the app saves it, then draws the app.
function mount(recipe = defaultRecipeState(), temperatureUnit = 'F') {
  window.localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => false;
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  savePersisted(window.localStorage, { recipe, ...display(temperatureUnit) });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(App)));
}

afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

function click(el) {
  act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

function button(label) {
  const found = [...host.querySelectorAll('button')].find((b) => text(b) === label);
  if (!found) throw new Error(`no button "${label}"`);
  return found;
}

function box(name) {
  const found = [...host.querySelectorAll('input')].find((el) => el.getAttribute('aria-label') === name);
  if (!found) throw new Error(`no box named "${name}"`);
  return found;
}

// Sets a box's text as typing does.
function setText(el, value) {
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// Types into a box as the brewer does, one keystroke at a time: the cursor is
// in it and each keystroke is an entry ("120" is "1", "12", "120").
function type(name, value) {
  act(() => box(name).focus());
  const s = String(value);
  for (let i = 1; i <= s.length; i++) setText(box(name), s.slice(0, i));
}
const leave = (name) => act(() => box(name).blur());

// The line under a box: the refusal line nearest it.
function lineUnder(name) {
  let el = box(name).parentElement;
  for (let i = 0; i < 3 && el; i++, el = el.parentElement) {
    const line = el.querySelector('[role="alert"]');
    if (line) return text(line);
  }
  return null;
}

const savedDoc = () => window.localStorage.getItem(STORAGE_KEY);

// The line under the stats bar, as the app shows it.
const statsLine = () => {
  const region = host.querySelector('[role="region"][aria-label="Recipe figures"]');
  const line = region.querySelector('p[role="status"]');
  return line ? text(line) : null;
};

describe('a negative entry is refused and nothing is saved (IE-S1, IE-S5)', () => {
  // Every Recipe-tab box IE-S1 names, by its accessible name, on the built-in
  // recipe (Pale 2-Row and Munich; Magnum and Cascade in the kettle; Citra dry)
  // with one other cost line added; the wort from kettle and water back with
  // water back on, below.
  const BOXES = [
    'Weight (lb), Pale 2-Row',
    'FGDB (%), Pale 2-Row',
    'Color (°L), Munich',
    'Mash water (gal)',
    'Pre-boil volume (gal)',
    'Boil-off rate (gal/hr)',
    'Boil time (min)',
    'Fermentation volume (gal)',
    'Time (min), Magnum',
    'Wt (oz), Magnum',
    'Alpha (%), Cascade',
    'Wt (oz), Citra',
    'Brewhouse efficiency %',
    'Apparent attenuation %',
    'Price of Pale 2-Row ($/lb)',
    'Price of Magnum ($/oz)',
    'Price of Citra ($/oz)',
    'Price of Yeast ($/batch)',
    'Price of Line 1 ($/batch)',
  ];

  it('each box refuses −1: a line says why, nothing is saved, the box shows its figure again once left', () => {
    mount({ ...defaultRecipeState(), otherCosts: [{ name: '', costPerBatch: 4 }] });
    for (const name of BOXES) {
      const before = savedDoc();
      const shownBefore = box(name).value;
      type(name, '-1');
      expect(lineUnder(name), name).toBe('Negative: nothing is saved.');
      expect(savedDoc(), `${name}: nothing is saved`).toBe(before);
      expect(box(name).value, `${name}: the entry stays while the cursor is in it`).toBe('-1');
      leave(name);
      expect(box(name).value, `${name}: its figure again once left`).toBe(shownBefore);
      expect(savedDoc(), `${name}: leaving changes nothing`).toBe(before);
    }
    expect(statsLine(), 'nothing is named under the stats bar').toBeNull();
  });

  it('with water back on, the wort from kettle and the water back refuse −1 too', () => {
    mount({ ...defaultRecipeState(), waterBack: { on: true, volumeGal: 1, tempF: 60 } });
    for (const name of ['Wort from kettle (gal)', 'Water back (gal)']) {
      const before = savedDoc();
      type(name, '-0.5');
      expect(lineUnder(name), name).toBe('Negative: nothing is saved.');
      expect(savedDoc(), `${name}: nothing is saved`).toBe(before);
      leave(name);
      expect(savedDoc()).toBe(before);
    }
  });

  it('zero and a blank are taken as today, and an entry typed after a refusal is taken (IE-S5)', () => {
    mount();
    type('Wt (oz), Magnum', '-2');
    expect(lineUnder('Wt (oz), Magnum')).toBe('Negative: nothing is saved.');
    setText(box('Wt (oz), Magnum'), '0');
    expect(lineUnder('Wt (oz), Magnum'), 'a figure the box takes ends the line').toBeNull();
    expect(JSON.parse(savedDoc()).recipe.kettleAdditions[0].weightOz).toBe(0);
    leave('Wt (oz), Magnum');

    type('Boil time (min)', '');
    setText(box('Boil time (min)'), '');
    expect(JSON.parse(savedDoc()).recipe.boilTimeMin, 'an emptied box is a blank figure').toBeNull();
    leave('Boil time (min)');
    expect(statsLine()).toBe('Empty: Boil time — figures that depend on it show —');
  });

  it('the Water tab and My brewery still take a negative entry (IE-S5, N-2)', () => {
    mount(wcPils());
    click(button('Water'));
    click(button('Salts & Acid'));
    const absorption = [...host.querySelectorAll('input')].find((el) => /absorption/i.test(el.getAttribute('aria-label') ?? ''));
    expect(absorption, 'the grain absorption box').toBeTruthy();
    act(() => absorption.focus());
    setText(absorption, '-1');
    expect(JSON.parse(savedDoc()).recipe.water.absorptionQtPerLb).toBe(-1);

    click(button('Options'));
    const batch = [...host.querySelectorAll('input')].find((el) => /^Batch \(fermentation\) volume/.test(el.getAttribute('aria-label') ?? ''));
    expect(batch, "My brewery's batch volume box").toBeTruthy();
    act(() => batch.focus());
    setText(batch, '-3');
    expect(JSON.parse(window.localStorage.getItem('brew-design.brewery')).brewery.fermentVolGal).toBe(-3);
  });
});

describe('a percent above 100 and a hop above 213 °F are refused (IE-S2, IE-S3, IE-S6)', () => {
  it('120 typed in the efficiency is refused, and the efficiency is as it was before the typing began', () => {
    mount();
    const before = savedDoc();
    type('Brewhouse efficiency %', '120'); // "1" and "12" are taken as typed, "120" refused
    expect(lineUnder('Brewhouse efficiency %')).toBe('Above 100 %: nothing is saved.');
    expect(savedDoc(), 'the recipe as it was when the typing began').toBe(before);
    leave('Brewhouse efficiency %');
    expect(box('Brewhouse efficiency %').value).toBe('75');
    expect(JSON.parse(savedDoc()).recipe.efficiency).toBe(0.75);
  });

  it('each percent box refuses an entry above 100 % and takes 100 %', () => {
    mount();
    const percents = [
      ['FGDB (%), Pale 2-Row', 'malts', 0, 'fgdb'],
      ['Alpha (%), Magnum', 'kettleAdditions', 0, 'alphaAcidFraction'],
      ['Apparent attenuation %', null, null, 'apparentAttenuation'],
      ['Brewhouse efficiency %', null, null, 'efficiency'],
    ];
    for (const [name, list, i, key] of percents) {
      const before = savedDoc();
      type(name, '100.1');
      expect(lineUnder(name), name).toBe('Above 100 %: nothing is saved.');
      expect(savedDoc(), `${name}: nothing is saved`).toBe(before);
      setText(box(name), '100');
      expect(lineUnder(name), `${name}: 100 % is taken`).toBeNull();
      const r = JSON.parse(savedDoc()).recipe;
      expect(list ? r[list][i][key] : r[key], `${name}: 100 % is a fraction of 1`).toBe(1);
      leave(name);
    }
  });

  it('a kettle hop at 214 °F is refused; 213 °F and a whirlpool hop are taken', () => {
    mount();
    const name = 'Temp (°F), Magnum';
    const before = savedDoc();
    type(name, '214');
    expect(lineUnder(name)).toBe('Above 213 °F: nothing is saved.');
    expect(savedDoc()).toBe(before);
    leave(name);
    expect(box(name).value).toBe('212');

    type(name, '213');
    expect(lineUnder(name)).toBeNull();
    expect(JSON.parse(savedDoc()).recipe.kettleAdditions[0].wortTempF).toBe(213);
    leave(name);
  });

  it('in °C the same temperature: 101 and 100.6 refused as "Above 100.56 °C", 100.5 and −5 taken', () => {
    mount(defaultRecipeState(), 'C');
    const name = 'Temp (°C), Cascade';
    const before = savedDoc();
    type(name, '101'); // 213.8 °F
    expect(lineUnder(name)).toBe('Above 100.56 °C: nothing is saved.');
    expect(savedDoc()).toBe(before);
    setText(box(name), '100.6'); // 213.08 °F
    expect(lineUnder(name)).toBe('Above 100.56 °C: nothing is saved.');
    expect(savedDoc()).toBe(before);
    setText(box(name), '100.5'); // 212.9 °F
    expect(lineUnder(name)).toBeNull();
    expect(JSON.parse(savedDoc()).recipe.kettleAdditions[1].wortTempF).toBeCloseTo(212.9, 9);
    setText(box(name), '-5'); // 23 °F
    expect(JSON.parse(savedDoc()).recipe.kettleAdditions[1].wortTempF).toBeCloseTo(23, 9);
    leave(name);
  });

  it('every other temperature box takes an entry above 213 °F as today (IE-S5)', () => {
    mount();
    type('Pre-boil volume measured at (°F)', '214');
    expect(lineUnder('Pre-boil volume measured at (°F)')).toBeNull();
    expect(JSON.parse(savedDoc()).recipe.measurementTempF.preBoil).toBe(214);
    leave('Pre-boil volume measured at (°F)');
    type('Fermentation temperature °F', '250');
    expect(JSON.parse(savedDoc()).recipe.yeast.fermTempF).toBe(250);
  });
});

describe('a saved recipe holding one loads, is named, and its figures are blank (IE-S4, IE-S6 to IE-S8)', () => {
  // The built-in recipe saved before this change with a Magnum weight of −1
  // oz, a brewhouse efficiency of 120 % (a fraction of 1.2), Cascade at
  // 250 °F and Pale 2-Row priced at −2 $/lb (Magnum at 3 $/oz).
  const saved = () => {
    const r = defaultRecipeState();
    return {
      ...r,
      efficiency: 1.2,
      malts: [{ ...r.malts[0], pricePerLb: -2 }, r.malts[1]],
      kettleAdditions: [
        { ...r.kettleAdditions[0], weightOz: -1, pricePerOz: 3 },
        { ...r.kettleAdditions[1], wortTempF: 250 },
      ],
    };
  };

  it('loads as saved from storage and from a file: nothing refused, the saved format unchanged', () => {
    window.localStorage.clear();
    savePersisted(window.localStorage, { recipe: saved(), ...display() });
    const doc = JSON.parse(savedDoc());
    expect(doc.version, 'no new version').toBe(SCHEMA_VERSION);
    expect(doc.version).toBe(13);
    const loaded = loadStartingState(window.localStorage).recipe;
    expect(loaded.kettleAdditions[0].weightOz).toBe(-1);
    expect(loaded.efficiency).toBe(1.2);
    expect(loaded.kettleAdditions[1].wortTempF).toBe(250);
    expect(loaded.malts[0].pricePerLb).toBe(-2);

    const file = exportRecipeDocument({ recipe: saved(), ...display() });
    const result = importRecipeFile(file, { recipe: defaultRecipeState(), ...display() }, () => true);
    expect(result.outcome).toBe('replaced');
    expect(result.state.recipe.kettleAdditions[0].weightOz).toBe(-1);
    expect(result.state.recipe.efficiency).toBe(1.2);
  });

  it('the line under the stats bar names each such box, in °F and in °C', () => {
    const r = saved();
    const names = emptyFields(r, computeRecipe(r));
    expect(names).toEqual([]);
    const outside = outsideFields(r);
    expect(emptyFieldsLine(names, outside, 'F')).toBe(
      'Negative: Magnum weight, Pale 2-Row price; Above 100 %: Brewhouse efficiency; Above 213 °F: Cascade temperature — figures that depend on them show —',
    );
    expect(emptyFieldsLine(names, outside, 'C')).toBe(
      'Negative: Magnum weight, Pale 2-Row price; Above 100 %: Brewhouse efficiency; Above 100.56 °C: Cascade temperature — figures that depend on them show —',
    );
    // One alone: "it".
    const one = { ...defaultRecipeState(), kettleAdditions: [{ ...defaultRecipeState().kettleAdditions[0], weightOz: -1 }] };
    expect(emptyFieldsLine(emptyFields(one, computeRecipe(one)), outsideFields(one), 'F')).toBe(
      'Negative: Magnum weight — figures that depend on it show —',
    );
    // Beside an empty box.
    const both = { ...one, boilTimeMin: NaN };
    expect(emptyFieldsLine(emptyFields(both, computeRecipe(both)), outsideFields(both), 'F')).toBe(
      'Empty: Boil time; Negative: Magnum weight — figures that depend on them show —',
    );
  });

  it('every figure that depends on one shows "—"; a figure that does not is as before', () => {
    const base = computeRecipe(defaultRecipeState());

    // A hop weight of −1: the hop's IBU and the recipe's IBU blank; the
    // gravity, colour and the other hop's IBU as before.
    const hop = { ...defaultRecipeState(), kettleAdditions: [{ ...defaultRecipeState().kettleAdditions[0], weightOz: -1 }, defaultRecipeState().kettleAdditions[1]] };
    const h = computeRecipe(hop);
    expect(h.hops.additions[0].ibu).toBeNaN();
    expect(h.stats.IBU).toBeNaN();
    expect(h.hops.additions[1].ibu).toBe(base.hops.additions[1].ibu);
    expect(h.stats.OG).toBe(base.stats.OG);
    expect(h.stats.SRM).toBe(base.stats.SRM);

    // An efficiency of 120 %: the gravity and all that reads it blank.
    const eff = computeRecipe({ ...defaultRecipeState(), efficiency: 1.2 });
    for (const k of ['OG', 'FG', 'ABV', 'IBU']) expect(eff.stats[k], k).toBeNaN();
    expect(eff.cells).toBeNaN();

    // A hop at 250 °F: its IBU blank (no factor is drawn for it).
    const hot = computeRecipe({ ...defaultRecipeState(), kettleAdditions: [defaultRecipeState().kettleAdditions[0], { ...defaultRecipeState().kettleAdditions[1], wortTempF: 250 }] });
    expect(hot.hops.additions[1].ibu).toBeNaN();
    expect(hot.stats.IBU).toBeNaN();

    // A pre-boil volume of −1: the boil's figures blank, and its measurement
    // temperature is not named as one the correction cannot use.
    const pre = { ...defaultRecipeState(), preBoilVolGal: -1 };
    const p = computeRecipe(pre);
    expect(p.refVolumesGal.preBoil).toBeNaN();
    expect(p.postBoilVolGal).toBeNaN();
    expect(p.stats.OG).toBeNaN();
    expect(emptyFields(pre, p)).toEqual([]);
    expect(outsideFields(pre).map((o) => o.name)).toEqual(['Pre-boil volume']);
  });

  it('a negative price blanks its line, the total and the cost per gal; the box keeps its figure (IE-N)', () => {
    const cost = computeCost(saved());
    const pale = cost.lines.find((l) => l.kind === 'malts' && l.index === 0);
    expect(pale.cost).toBeNaN();
    expect(pale.unitPrice, 'the box shows the price as saved').toBe(-2);
    // Magnum: −1 oz saved, so its line's cost is blank too.
    const magnum = cost.lines.find((l) => l.kind === 'kettleAdditions' && l.index === 0);
    expect(magnum.cost).toBeNaN();
    expect(magnum.quantity, 'the quantity as saved').toBe(-1);
    expect(cost.total).toBeNaN();
    expect(cost.perGal).toBeNaN();
    // Two lines priced (Pale, Magnum) of six: four unpriced, as before.
    expect(cost.unpriced).toBe(4);

    // The negative price alone, Magnum at 1 oz × 3 $/oz = 3 $: Pale's line
    // blank, and so the total.
    const priced = { ...defaultRecipeState(), malts: [{ ...defaultRecipeState().malts[0], pricePerLb: -2 }, defaultRecipeState().malts[1]], kettleAdditions: [{ ...defaultRecipeState().kettleAdditions[0], pricePerOz: 3 }, defaultRecipeState().kettleAdditions[1]] };
    const c = computeCost(priced);
    expect(c.lines.find((l) => l.kind === 'kettleAdditions' && l.index === 0).cost).toBe(3);
    expect(c.total).toBeNaN();
  });

  it('Design to target OG refuses, naming the figure, only while a figure it reads is outside its limits (IE-S7)', () => {
    const shares = [10 / 11, 1 / 11];
    const target = 1.056;
    const eff = solveTargetOG({ ...defaultRecipeState(), efficiency: 1.2 }, target, shares);
    expect(eff.ok).toBe(false);
    expect(solveRefusalText(eff)).toBe('Above 100 %: the brewhouse efficiency. Nothing changed.');

    const fgdb = solveTargetOG({ ...defaultRecipeState(), malts: [{ ...defaultRecipeState().malts[0], fgdb: 1.1 }, defaultRecipeState().malts[1]] }, target, shares);
    expect(solveRefusalText(fgdb)).toBe('Above 100 %: the FGDB of Pale 2-Row. Nothing changed.');

    const boil = solveTargetOG({ ...defaultRecipeState(), boilTimeMin: -60, preBoilVolGal: -7 }, target, shares);
    expect(solveRefusalText(boil)).toBe('Negative: the pre-boil volume, the boil time. Nothing changed.');

    const wb = { ...defaultRecipeState(), waterBack: { on: true, volumeGal: -1, tempF: 60 } };
    expect(solveRefusalText(solveTargetOG(wb, target, shares))).toBe('Negative: the water back. Nothing changed.');

    // A figure Solve does not read leaves it working: a hop weight, a price,
    // a malt weight (which Solve replaces).
    const working = {
      ...defaultRecipeState(),
      malts: [{ ...defaultRecipeState().malts[0], weightLb: -10, pricePerLb: -1 }, defaultRecipeState().malts[1]],
      kettleAdditions: [{ ...defaultRecipeState().kettleAdditions[0], weightOz: -1 }, defaultRecipeState().kettleAdditions[1]],
    };
    const out = solveTargetOG(working, target, shares);
    expect(out.ok).toBe(true);
    expect(out.weightsLb).toEqual(solveTargetOG(defaultRecipeState(), target, shares).weightsLb);
  });

  it("the Water tab's figures that read one show \"—\", and the Water tab does not call it blank (IE-S8)", () => {
    // The West Coast Pilsner, the tank treated: its predicted mash pH reads
    // the mash water and each malt's weight.
    const ok = computeWater(wcPils().water, wcPils());
    expect(Number.isFinite(ok.mashPh.ph)).toBe(true);

    const negWater = wcPils({ mashWaterGal: -8 });
    const w = computeWater(negWater.water, negWater);
    expect(w.mashPh.ph).toBeNaN();
    expect(w.volumes.mashWaterGal).toBeNaN();
    expect(w.blank, 'not named blank by the Water tab').not.toContain('mashWaterGal');
    expect(w.acid.styleBecause.map((b) => b.field)).not.toContain('mashWaterGal');

    const malts = wcPils().malts.map((m, i) => (i === 0 ? { ...m, weightLb: -12 } : m));
    const negMalt = wcPils({ malts });
    const m = computeWater(negMalt.water, negMalt);
    expect(m.mashPh.ph).toBeNaN();
    expect(m.mashPh.needs, 'the predicted mash pH does not call it blank').toEqual([]);
    expect(m.blank).not.toContain('malts');
  });

  it('drawn from storage: the line names it on the Recipe tab and the Water tab, the stats read "—"', () => {
    mount(saved());
    const line = 'Negative: Magnum weight, Pale 2-Row price; Above 100 %: Brewhouse efficiency; Above 213 °F: Cascade temperature — figures that depend on them show —';
    expect(statsLine()).toBe(line);
    const region = host.querySelector('[role="region"][aria-label="Recipe figures"]');
    expect(text(region), 'OG, FG, ABV and IBU read "—"; SRM reads no efficiency').toMatch(/^—OGSG—FGSG—%ABV[0-9.]+SRM—IBU/);
    expect(box('Wt (oz), Magnum').value, 'the box shows its figure as saved').toBe('-1');
    click(button('Water'));
    expect(statsLine()).toBe(line);
  });

  it('the Home/Pro scale keeps a saved negative negative, still named (N-5)', () => {
    const r = { ...defaultRecipeState(), kettleAdditions: [{ ...defaultRecipeState().kettleAdditions[0], weightOz: -1 }, defaultRecipeState().kettleAdditions[1]] };
    // 10 bbl = 310 gal over the recipe's 5.5 gal: −1 oz × 310 / 5.5 = −56.3636... oz.
    const out = switchMode({ recipe: r, mode: 'home', proVolumeUnit: 'bbl' }, 'pro', emptyBreweryFigures(), () => true);
    expect(out.recipe.kettleAdditions[0].weightOz).toBeCloseTo(-310 / 5.5, 9);
    expect(outsideFields(out.recipe).map((o) => o.name)).toEqual(['Magnum weight']);
  });
});
