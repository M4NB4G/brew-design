// @vitest-environment jsdom
// boil-time-emptied.test.js
// Scenario for "The boil time box hands its blank figure to the page as is"
// (docs/ROADMAP.md, run R1, owner's decision K-1, 2026-11-10; Tier C, display
// only; SPEC rule 8). The app is drawn whole, in jsdom, from a saved recipe
// whose boil time is emptied (a blank figure, NaN, as rule 8 stores it): the
// Volumes card's boil time box is an empty box, as the volume and
// temperature boxes are, and React's development build gives no "Received
// NaN for the `value` attribute" warning.

import { afterEach, describe, expect, it } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/App.jsx';
import { savePersisted } from '../src/persistence.js';
import { defaultRecipeState } from '../src/state.js';

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

const boilBox = () => host.querySelector('input[aria-label="Boil time (min)"]');

describe('the boil time box, emptied, shows an empty box', () => {
  it('an emptied boil time is an empty box and React gives no "Received NaN" warning', () => {
    mount({ ...defaultRecipeState(), boilTimeMin: NaN });
    expect(boilBox().value).toBe('');
    expect(errors.join('\n')).not.toContain('Received NaN');
  });

  it('a filled boil time shows its figure as before', () => {
    mount(defaultRecipeState());
    expect(boilBox().value).toBe('60');
    expect(errors).toEqual([]);
  });
});
