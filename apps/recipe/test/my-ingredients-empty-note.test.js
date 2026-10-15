// @vitest-environment jsdom
// my-ingredients-empty-note.test.js
// Scenario for "My ingredients' empty note names the strain box" (scope table
// agreed 2026-10-15, docs/items/my-ingredients-empty-note.md, MN-S1, MN-S2,
// MN-Q1, MN-Q2; Tier C, wording only). With nothing saved, My brewery's My
// ingredients names the three name boxes a brewer saves from: a malt, a boil
// hop and a yeast strain. The Options page is drawn whole in jsdom, as
// my-ingredients.test.js draws it. MN-S2 (nothing else on any page changes)
// is held by the whole-page digests in page-error.test.js and
// error-outside-the-tabs.test.js, re-captured with only this note changed.
//
// No number is introduced.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';

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
  window.localStorage.clear();
});

const text = (el) => el.textContent.replace(/\s+/g, ' ').trim();

function click(label) {
  const found = [...host.querySelectorAll('button')].find((b) => text(b) === label);
  if (!found) throw new Error(`no button "${label}"`);
  act(() => found.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })));
}

describe('My ingredients, nothing saved', () => {
  it('with nothing saved, My ingredients names the malt, boil hop and yeast strain boxes', () => {
    mount();
    click('Options');
    const label = [...host.querySelectorAll('span')].find((s) => text(s) === 'My ingredients');
    expect(label).toBeTruthy();
    // MN-S1: the note under the heading, word for word.
    expect(text(label.nextElementSibling)).toBe(
      'None saved yet. Type a malt, boil hop or yeast strain that is not on the ingredient list in its name box, then choose “Save to my ingredients”.',
    );
  });
});
