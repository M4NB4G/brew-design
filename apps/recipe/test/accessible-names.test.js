// @vitest-environment jsdom
// accessible-names.test.js
// Scenarios for "Every box has a name a screen reader reads"
// (docs/items/guard-rails.md, item 3, GR3-S1 to GR3-S3, F-Q5, F-Q6). Every
// number box, text box and choice has an accessible name: its visible label,
// and in a table the row's name with it. The app is drawn whole, in jsdom,
// and walked through each tab, screen and unit choice; each state is scanned
// by axe-core's name rules, with its placeholder-as-a-name allowance turned
// off (a greyed hint is not a name). axe-core is a test-only dependency.
//
// The names are strings, pinned here by what the brewer already sees:
//   Grist row "Pale 2-Row", weight column "Weight (lb)" -> "Weight (lb), Pale 2-Row".
//   A malt with no name is the empty-fields line's "Malt 1" (rule 8's line).

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import axe from 'axe-core';
import App from '../src/App.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The name rules only: a box with no name, a choice with no name, a text-like
// box with a role and no name, a button with no name.
const NAME_RULES = ['label', 'select-name', 'aria-input-field-name', 'button-name'];

let root;
let host;

function setScreen({ phone }) {
  window.matchMedia = (query) => ({
    matches: phone,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  });
}

function mount({ phone = false, stored } = {}) {
  window.localStorage.clear();
  if (stored) for (const [key, value] of Object.entries(stored)) window.localStorage.setItem(key, value);
  window.scrollTo = () => {};
  window.confirm = () => true;
  setScreen({ phone });
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

beforeEach(() => {
  // A greyed placeholder is not a name (F-Q6).
  axe.configure({
    rules: [{ id: 'label', any: ['implicit-label', 'explicit-label', 'aria-label', 'aria-labelledby', 'non-empty-title'] }],
  });
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

function click(el) {
  act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

// A button, found by its visible text.
function button(label) {
  const found = [...host.querySelectorAll('button')].find((b) => text(b) === label);
  if (!found) throw new Error(`no button "${label}"`);
  return found;
}

// A choice, found by an option it offers; chosen by that option's text.
function choose(optionText, selectText) {
  const found = [...host.querySelectorAll('select')].find((s) =>
    [...s.options].some((o) => text(o) === optionText) && (!selectText || text(s.closest('label') ?? s.parentElement).includes(selectText)),
  );
  if (!found) throw new Error(`no choice offering "${optionText}"`);
  const option = [...found.options].find((o) => text(o) === optionText);
  act(() => {
    found.value = option.value;
    found.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

// A number box, found by its name, given a value.
function type(name, value) {
  const box = boxes().find((el) => el.getAttribute('aria-label') === name);
  if (!box) throw new Error(`no box named "${name}"`);
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(box, String(value));
    box.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

// A check box, found by the text of the label around it.
function tick(labelText) {
  const label = [...host.querySelectorAll('label')].find((l) => text(l).includes(labelText) && l.querySelector('input[type=checkbox]'));
  if (!label) throw new Error(`no check box "${labelText}"`);
  const box = label.querySelector('input[type=checkbox]');
  if (!box.checked) click(box);
}

// The boxes the name rules found without a name, as "html" lines.
async function nameless() {
  const result = await axe.run(host, { runOnly: { type: 'rule', values: NAME_RULES }, resultTypes: ['violations'] });
  return result.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 140)}`));
}

const boxes = () => [...host.querySelectorAll('input, select, textarea')].filter((el) => el.type !== 'file');

describe('every box has an accessible name (GR3-S1, GR3-S3)', () => {
  it('the Recipe tab, Home, on a screen and on a phone', async () => {
    mount();
    expect(boxes().length).toBeGreaterThan(40);
    expect(await nameless()).toEqual([]);
    click(button('Design to target OG'));
    expect(await nameless()).toEqual([]);
    act(() => root.unmount());
    host.remove();
    mount({ phone: true });
    expect(await nameless()).toEqual([]);
    click(button('Design to target OG'));
    expect(await nameless()).toEqual([]);
  });

  it('the Recipe tab in Pro, with the unit choices changed, and the Cost card and Design to target OG', async () => {
    mount();
    click(button('Pro'));
    expect(await nameless()).toEqual([]);
    for (const unit of ['SG', 'gal', 'sacks', '°C']) click(button(unit));
    expect(await nameless()).toEqual([]);
    // Another cost line, so its boxes are drawn.
    click(button('+ Add line'));
    expect(boxes().some((el) => el.getAttribute('aria-label') === 'Line 1 name')).toBe(true);
    // Design to target OG: opened, its target box and a percent box per malt are drawn, and scanned.
    click(button('Design to target OG'));
    const labels = boxes().map((el) => el.getAttribute('aria-label') ?? '');
    expect(labels.some((n) => n.startsWith('Target OG'))).toBe(true);
    expect(labels).toContain('% Pale 2-Row');
    expect(await nameless()).toEqual([]);
    act(() => root.unmount());
    host.remove();
    mount({ phone: true });
    click(button('Pro'));
    for (const unit of ['sacks', '°C']) click(button(unit));
    click(button('Design to target OG'));
    expect(await nameless()).toEqual([]);
  });

  it('the Water tab: each screen, the tank treated, the acid into the mash, the kettle salts on', async () => {
    mount();
    click(button('Water'));
    expect(await nameless()).toEqual([]);
    // With test results in, the Salts & Acid screen draws its salt, acid and alkalinity boxes.
    click(button('Load Example'));
    for (const screen of ['Style', 'Notes', 'Salts & Acid']) {
      click(button(screen));
      expect(await nameless(), screen).toEqual([]);
    }
    // Where the water goes sits on Salts & Acid: the kettle salts and the tank.
    tick('Salts also go in the kettle');
    expect(await nameless(), 'kettle salts').toEqual([]);
    choose('The Hot Liquor Tank (HLT) first fill', 'Treat');
    choose('Into the mash', 'Acid');
    expect(await nameless(), 'tank treated, acid into the mash').toEqual([]);
    // The sums need the tank's volumes and the sparge water before the additions are drawn.
    type('Treated volume gal', 10);
    type('Top-up level gal', 12);
    type('Sparge water gal', 4);
    expect(await nameless(), 'volumes typed').toEqual([]);
    expect(host.textContent).toContain('Salt Additions');
    // The acid rows: acidulated malt (a solid, in oz) and several acids at once.
    choose('Acidulated Malt (Weyermann, ~2% lactic)');
    expect(await nameless(), 'acidulated malt').toEqual([]);
    tick('Use multiple acids');
    expect(await nameless(), 'multiple acids').toEqual([]);
  });

  it('the Options tab, and the References page', async () => {
    mount();
    click(button('Options'));
    expect(await nameless()).toEqual([]);
    click(button('References'));
    expect(host.textContent).toContain('Back to the recipe');
    expect(await nameless()).toEqual([]);
  });
});

describe('the names are the visible labels, with the row in a table (F-Q5)', () => {
  const named = (name) => boxes().find((el) => el.getAttribute('aria-label') === name);

  it('a Grist weight box is named by its column and its malt', () => {
    mount();
    click(button('Recipe'));
    expect(named('Weight (lb), Pale 2-Row')).toBeTruthy();
    expect(named('FGDB (%), Pale 2-Row')).toBeTruthy();
    expect(named('Color (°L), Pale 2-Row')).toBeTruthy();
  });

  it('a hop box is named by its column and its hop', () => {
    mount();
    const names = boxes().map((el) => el.getAttribute('aria-label'));
    expect(names).toContain('Time (min), Magnum');
    expect(names).toContain('Alpha (%), Magnum');
    expect(names).toContain('Wt (oz), Cascade');
  });

  it('a labelled box is named by its label and unit', () => {
    mount();
    const names = boxes().map((el) => el.getAttribute('aria-label'));
    expect(names).toContain('Brewhouse efficiency %');
    expect(names).toContain('Boil time (min)');
  });
});
