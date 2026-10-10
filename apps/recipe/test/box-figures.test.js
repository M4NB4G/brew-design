// @vitest-environment jsdom
// box-figures.test.js
// Scenarios for "A weight or volume box shows the printed sheet's precision
// while the cursor is elsewhere" (docs/items/boxes-and-access.md, BA1-S1 to
// BA1-S3, S14-Q1). Each malt weight, hop weight and volume box shows its
// figure to the precision the printed sheet prints it; with the cursor in
// the box it shows the full stored figure; the stored figure never changes
// unless the brewer types. The app is drawn whole, in jsdom.
//
// Hand pins. Pro scales the built-in 5.5 gal recipe to 10 bbl = 310 gal, a
// factor of 310 / 5.5 (1 bbl = 31 gal, 1 lb = 16 oz):
//   mash water  5 gal x 310 / 5.5 / 31 = 50 / 5.5   = 9.090909... bbl -> "9.091"
//   pre-boil    7 gal x 310 / 5.5 / 31 = 70 / 5.5   = 12.727272... bbl -> "12.727"
//   boil-off  1.5 gal x 310 / 5.5 / 31 = 15 / 5.5   = 2.727272... bbl -> "2.727"
//   Pale 2-Row 10 lb x 310 / 5.5     = 3100 / 5.5 = 563.636363... lb -> "563.64"
//   Munich      1 lb x 310 / 5.5     = 310 / 5.5  = 56.363636... lb -> "56.36"
//   Magnum      1 oz x 310 / 5.5 / 16 = 310 / 88  = 3.522727... lb -> "3.523"
//   Citra (dry) 2 oz x 310 / 5.5 / 16 = 620 / 88  = 7.045454... lb -> "7.045"
//   My brewery's greyed pre-boil, with every brewery figure blank (a new
//   recipe then opens at Home, unscaled; SPEC rule 17), the built-in 7 gal:
//               7 / 31 = 0.2258064... bbl -> "0.226"
//   sparge typed 8.125 gal at Home -> "8.13"; in Pro 0.2741935 bbl -> "0.274"
// The sheet's precision (recipe-sheet-data.js): malt 0.01 lb; hops 0.01 oz at
// Home, 0.001 lb in Pro; volumes 0.01 gal, 0.001 bbl.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import { STORAGE_KEY } from '../src/persistence.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let host;

function mount() {
  window.localStorage.clear();
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
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

const shown = (name) => box(name).value;
const greyed = (name) => box(name).getAttribute('placeholder');

function focus(name) {
  act(() => box(name).focus());
}

function blur(name) {
  act(() => box(name).blur());
}

// Types into a box as the brewer does: the cursor is in it.
function type(name, value) {
  const el = box(name);
  act(() => el.focus());
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

const saved = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe;

describe("a weight or volume box shows the printed sheet's precision while the cursor is elsewhere (BA1-S1)", () => {
  it('Pro at 10 bbl: volumes to 0.001 bbl, malt to 0.01 lb, hops to 0.001 lb', () => {
    mount();
    click(button('Pro'));
    expect(shown('Mash water (bbl)')).toBe('9.091');
    expect(shown('Pre-boil volume (bbl)')).toBe('12.727');
    expect(shown('Boil-off rate (bbl/hr)')).toBe('2.727');
    expect(shown('Fermentation volume (bbl)')).toBe('10');
    expect(shown('Weight (lb), Pale 2-Row')).toBe('563.64');
    expect(shown('Weight (lb), Munich')).toBe('56.36');
    expect(shown('Wt (lb), Magnum')).toBe('3.523');
    expect(shown('Wt (lb), Citra')).toBe('7.045');
  });

  it('Home: a figure typed to more decimals shows to 0.01 once the cursor leaves', () => {
    mount();
    type('Weight (lb), Pale 2-Row', '10.125');
    blur('Weight (lb), Pale 2-Row');
    expect(shown('Weight (lb), Pale 2-Row')).toBe('10.13');
    type('Wt (oz), Magnum', '1.125');
    blur('Wt (oz), Magnum');
    expect(shown('Wt (oz), Magnum')).toBe('1.13');
    type('Pre-boil volume (gal)', '7.125');
    blur('Pre-boil volume (gal)');
    expect(shown('Pre-boil volume (gal)')).toBe('7.13');
  });
});

describe("the Water tab's and My brewery's volume boxes likewise (BA1-S1, BA1-S2)", () => {
  it('the sparge water at Home and in Pro', () => {
    mount();
    click(button('Water'));
    click(button('Salts & Acid'));
    type('Sparge water gal', '8.125');
    blur('Sparge water gal');
    expect(shown('Sparge water gal')).toBe('8.13');
    focus('Sparge water gal');
    expect(shown('Sparge water gal')).toBe('8.125');
    blur('Sparge water gal');
    click(button('Pro'));
    click(button('Water'));
    click(button('Salts & Acid'));
    type('Sparge water bbl', '0.2741935');
    blur('Sparge water bbl');
    expect(shown('Sparge water bbl')).toBe('0.274');
  });

  it("My brewery's greyed pre-boil in Pro", () => {
    mount();
    click(button('Pro'));
    click(button('Options'));
    expect(shown('Pre-boil volume (bbl)')).toBe('');
    expect(greyed('Pre-boil volume (bbl)')).toBe('0.226');
    focus('Pre-boil volume (bbl)');
    expect(greyed('Pre-boil volume (bbl)')).toBe('0.225806');
  });
});

describe('with the cursor in the box it shows the full stored figure (BA1-S2)', () => {
  it('Pro at 10 bbl: the box shows six decimals while it has the cursor', () => {
    mount();
    click(button('Pro'));
    focus('Mash water (bbl)');
    expect(shown('Mash water (bbl)')).toBe('9.090909');
    blur('Mash water (bbl)');
    expect(shown('Mash water (bbl)')).toBe('9.091');
    focus('Weight (lb), Pale 2-Row');
    expect(shown('Weight (lb), Pale 2-Row')).toBe('563.636364');
    blur('Weight (lb), Pale 2-Row');
    focus('Wt (lb), Magnum');
    expect(shown('Wt (lb), Magnum')).toBe('3.522727');
  });

  it('Home: a figure being typed is never cut short', () => {
    mount();
    type('Weight (lb), Pale 2-Row', '10.125');
    expect(shown('Weight (lb), Pale 2-Row')).toBe('10.125');
    type('Pre-boil volume (gal)', '7.125');
    expect(shown('Pre-boil volume (gal)')).toBe('7.125');
  });
});

describe('the stored figure never changes unless the brewer types (BA1-S3)', () => {
  it('entering and leaving boxes without typing keeps every stored weight and volume exact', () => {
    mount();
    type('Weight (lb), Pale 2-Row', '10.125');
    type('Pre-boil volume (gal)', '7.125');
    type('Wt (oz), Magnum', '1.125');
    for (const name of ['Weight (lb), Pale 2-Row', 'Pre-boil volume (gal)', 'Wt (oz), Magnum']) {
      focus(name);
      blur(name);
    }
    const r = saved();
    expect(r.malts[0].weightLb).toBe(10.125);
    expect(r.preBoilVolGal).toBe(7.125);
    expect(r.kettleAdditions[0].weightOz).toBe(1.125);
  });

  it('Pro at 10 bbl: the scaled figures stay unrounded after the boxes are entered and left', () => {
    mount();
    click(button('Pro'));
    for (const name of ['Mash water (bbl)', 'Weight (lb), Pale 2-Row', 'Wt (lb), Magnum']) {
      focus(name);
      blur(name);
    }
    const r = saved();
    // 5 x 310 / 5.5 gal; 10 x 310 / 5.5 lb; 1 x 310 / 5.5 oz (the scale is the engine's).
    expect(r.mashWaterGal).toBeCloseTo((5 * 310) / 5.5, 9);
    expect(r.malts[0].weightLb).toBeCloseTo((10 * 310) / 5.5, 9);
    expect(r.kettleAdditions[0].weightOz).toBeCloseTo(310 / 5.5, 9);
  });
});
