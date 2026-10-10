// page-error.fixture.js
// The whole app drawn in jsdom, as the page-error scenarios use it
// (page-error.test.js), and the page's HTML on each tab, whose SHA-256
// digests `page-error.before.json` holds, captured before the change
// (2026-10-09): "nothing else changes when nothing goes wrong" compares every
// tab's page against bytes the change did not write.

import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createHash } from 'node:crypto';
import App from '../src/App.jsx';
import { BA1_BOX } from './box-figures.fixture.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root;
let host;

export const page = () => host;

// Draw the app on a screen (not a phone), with `stored` in storage first.
export function mount(stored = {}) {
  window.localStorage.clear();
  for (const [key, value] of Object.entries(stored)) window.localStorage.setItem(key, value);
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.matchMedia = (query) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(createElement(App)));
}

export function unmount() {
  if (root) act(() => root.unmount());
  host?.remove();
  root = undefined;
  host = undefined;
}

export const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

export function click(el) {
  act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

// A button, found by its visible text (the first, in page order).
export function button(label) {
  const found = [...host.querySelectorAll('button')].find((b) => text(b) === label);
  if (!found) throw new Error(`no button "${label}"`);
  return found;
}

// The malt weight, hop weight and volume boxes show the printed sheet's
// precision since "A weight or volume box shows the printed sheet's precision
// while the cursor is elsewhere" (docs/items/boxes-and-access.md, BA1, S14),
// and the full figure, as the capture holds it, with the cursor in the box (My
// brewery's greyed figures likewise). The page is drawn for its digest with
// each of those boxes showing what it shows with the cursor in it, read box by
// box; every other byte is as drawn.

function withFullBoxFigures(serialize) {
  const boxes = [...document.querySelectorAll('input[type=number]')].filter((b) => BA1_BOX.test(b.getAttribute('aria-label') ?? ''));
  const full = boxes.map((b) => {
    act(() => b.focus());
    const figures = { value: b.value, placeholder: b.getAttribute('placeholder') };
    act(() => b.blur());
    return figures;
  });
  const shown = boxes.map((b) => ({ value: b.getAttribute('value'), placeholder: b.getAttribute('placeholder') }));
  const write = (b, figures) => {
    for (const [name, figure] of Object.entries(figures)) if (figure !== null) b.setAttribute(name, figure);
  };
  boxes.forEach((b, i) => write(b, full[i]));
  const out = serialize();
  boxes.forEach((b, i) => write(b, shown[i]));
  return out;
}

// The page as drawn, the app's own HTML and the printed sheet beside it, as
// its SHA-256 digest. React numbers the ids it makes (`_r_0_`, …) in the
// order parts are first drawn in this test file, so they are renumbered in
// the order they appear on the page.
function drawn() {
  const ids = new Map();
  const html = withFullBoxFigures(() => document.body.innerHTML).replace(/_r_[0-9a-z]+_/g, (id) => {
    if (!ids.has(id)) ids.set(id, `_id${ids.size}_`);
    return ids.get(id);
  });
  return createHash('sha256').update(html).digest('hex');
}

// Every tab's page, in Home and in Pro, and the References page, each as its
// digest. The date is the caller's to fix (the printed sheet shows today's).
export function pageDigests() {
  mount();
  const out = {};
  for (const mode of ['Home', 'Pro']) {
    click(button(mode));
    for (const tab of ['Recipe', 'Water', 'Options']) {
      click(button(tab));
      out[`${mode} ${tab}`] = drawn();
    }
  }
  click(button('References'));
  out.References = drawn();
  unmount();
  return out;
}
