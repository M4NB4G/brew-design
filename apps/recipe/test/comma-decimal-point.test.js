// @vitest-environment jsdom
// comma-decimal-point.test.js
// Scenarios for "A comma typed as the decimal point"
// (docs/items/comma-decimal-point.md, CM-S1 to CM-S4, CM-Q1, CM-Q2; Tier B).
// The app is drawn whole, in jsdom, from a saved West Coast Pilsner
// (west-coast-pils.fixture.js), the acid with the salts in the tank. Each
// entry is typed one key at a time, as the brewer types it.
//
// Hand figures. "2,4" is two and four tenths, 2.4; "14,4" is 14.4; ",5" is
// 0.5. The recommended 75 % phosphoric reads 22.7 mL to 0.1 mL at Home
// (22.6874642283088 mL, worked in the fixture), gypsum 3.7 g (3.720139... g).

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import { STORAGE_KEY, savePersisted } from '../src/persistence.js';
import { wcPils } from './west-coast-pils.fixture.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ACID = '75% Phosphoric Acid (mL)';
const GYPSUM = 'Gypsum (CaSO₄·2H₂O) (g)';
const REFUSED = 'Not a number, so nothing is saved. Type it as 2.4 or 2,4.';

let root;
let host;

function mount(recipe = wcPils({ acidPlace: 'salts' })) {
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
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(App)));
  click(button('Water'));
  click(button('Salts & Acid'));
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
const blur = (name) => act(() => box(name).blur());

// Types an entry one key at a time, the cursor in the box, replacing what
// was there (the box selects its figure when the cursor comes in).
function type(name, entry) {
  const el = box(name);
  act(() => el.focus());
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  // An emptied box is one key: the figure deleted.
  for (let i = entry === '' ? 0 : 1; i <= entry.length; i++) {
    act(() => {
      set.call(el, entry.slice(0, i));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }
}

// The refusal lines on the screen.
const refusals = () => [...host.querySelectorAll('[role="alert"]')].map(text).filter((t) => t === REFUSED);
const savedDoc = () => window.localStorage.getItem(STORAGE_KEY);
const savedWater = () => JSON.parse(savedDoc()).recipe.water;

describe('a comma is the decimal point (CM-S1)', () => {
  it('"2,4" mL saves 2.4 and "14,4" g saves 14.4', () => {
    mount();
    type(ACID, '2,4');
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(2.4);
    expect(shown(ACID)).toBe('2.4');

    type(GYPSUM, '14,4');
    blur(GYPSUM);
    expect(savedWater().saltOverrides.gypsum).toBe(14.4);
    expect(shown(GYPSUM)).toBe('14.4');

    type(ACID, ',5');
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(0.5);
    expect(refusals()).toEqual([]);
  });
});

describe('anything else that is not a number is refused and named (CM-S2)', () => {
  for (const entry of ['2,4,6', '2,4.1', 'abc', '2.4.1', '1e3']) {
    it(`"${entry}" in the acid box: the line under the box, the saved recipe unchanged`, () => {
      mount();
      const before = savedDoc();
      type(ACID, entry);
      expect(refusals()).toEqual([REFUSED]);
      blur(ACID);
      expect(savedDoc(), 'nothing is saved').toBe(before);
      expect(savedWater().acidAmounts).toBeNull(); // still following the recommendation
      expect(shown(ACID), 'the box keeps what was there before').toBe('22.7');
    });
  }

  it('in a salt box, and over a dose of the brewer’s own: the dose stays as it was', () => {
    mount(wcPils({ acidPlace: 'salts', acidMl: 2.45 }));
    const before = savedDoc();
    type(GYPSUM, '3,7,5');
    expect(refusals()).toEqual([REFUSED]);
    blur(GYPSUM);
    type(ACID, '2,4.1');
    blur(ACID);
    expect(savedDoc()).toBe(before);
    expect(shown(GYPSUM)).toBe('3.7');
    expect(shown(ACID)).toBe('2.5'); // 2.45 at 0.1 mL
    expect(savedWater().acidAmounts.phosphoric_75).toBe(2.45);
  });

  it('the line clears on the next entry the box can read (ordering)', () => {
    mount();
    type(ACID, 'abc');
    blur(ACID);
    expect(refusals(), 'the line stays once the brewer leaves').toEqual([REFUSED]);
    type(ACID, '3,1');
    expect(refusals()).toEqual([]);
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(3.1);
  });
});

describe('a point reads as today (CM-S3)', () => {
  it('"2.4" mL saves 2.4, "14.4" g saves 14.4, ".5" saves 0.5', () => {
    mount();
    type(ACID, '2.4');
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(2.4);
    type(GYPSUM, '14.4');
    blur(GYPSUM);
    expect(savedWater().saltOverrides.gypsum).toBe(14.4);
    type(ACID, '.5');
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(0.5);
    expect(refusals()).toEqual([]);
  });
});

describe('nothing else changes (CM-S4)', () => {
  it('an emptied box still reads 0, and the screen draws as before with no entry refused', () => {
    mount();
    expect(refusals()).toEqual([]);
    type(ACID, '');
    blur(ACID);
    expect(savedWater().acidAmounts.phosphoric_75).toBe(0);
    expect(JSON.parse(savedDoc()).version).toBe(13);
  });
});
