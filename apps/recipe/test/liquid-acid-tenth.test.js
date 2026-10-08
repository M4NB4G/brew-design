// @vitest-environment jsdom
// liquid-acid-tenth.test.js
// Scenarios for "Liquid acid to 0.1 mL at Home, whole mL in Pro"
// (docs/items/liquid-acid-tenth.md, LT-S1 to LT-S4, LT-Q1 to LT-Q4; Tier B).
// The doses are the West Coast Pilsner's, worked by hand in
// west-coast-pils.fixture.js: 12.9642652733193 mL into the mash and
// 22.6874642283088 mL with the salts (the tank's 14 gal). By hand, to 0.1 mL
// they read 13.0 and 22.7 (12.96 rounds up to 13.0, 22.687 to 22.7); to
// whole mL 13 and 23. A dose the brewer types, 2.4 mL, reads 2.4 at Home and
// 2 in Pro. The screens are drawn to markup with react-dom/server; leaving a
// box is driven in jsdom, as accessible-names.test.js draws the app.

import { afterEach, describe, it, expect } from 'vitest';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { computeRecipe, computeWater } from '../src/selectors.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';
import WaterTab from '../src/components/water/WaterTab.jsx';
import { wcPils, MASH_REC_ML, TANK_REC_ML } from './west-coast-pils.fixture.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const LABEL = '75% Phosphoric Acid (mL)';
const props = (recipe, mode, setWater = () => {}) => ({
  water: recipe.water,
  figures: computeWater(recipe.water, recipe),
  mode,
  proVolumeUnit: 'bbl',
  screen: 'salts',
  onScreen: () => {},
  setWater,
});
const tab = (recipe, mode) => renderToStaticMarkup(createElement(WaterTab, props(recipe, mode)));
const text = (html) =>
  html
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ');
// The value in the amount box labelled LABEL.
const boxValue = (html) => {
  const input = html.match(/<input[^>]*aria-label="75% Phosphoric Acid \(mL\)"[^>]*>/);
  return input?.[0].match(/value="([^"]*)"/)?.[1];
};
const sheetOf = (recipe, mode) =>
  recipeSheet({
    recipe,
    derived: computeRecipe(recipe),
    water: computeWater(recipe.water, recipe),
    mode,
    proGravityUnit: 'plato',
    today: new Date(2026, 9, 8),
  });
const acidOnSheet = (recipe, mode) =>
  sheetOf(recipe, mode).water.additions.find((a) => a.name === '75% Phosphoric Acid');

const MASH = wcPils({ acidPlace: 'mash' });
const TANK = wcPils({ acidPlace: 'salts' });
const OWN = wcPils({ acidPlace: 'mash', acidMl: 2.4 });

// What each side shows, by hand (above).
const SHOWN = {
  home: { mash: '13.0', tank: '22.7', own: '2.4' },
  pro: { mash: '13', tank: '23', own: '2' },
};

let host;
let root;
afterEach(() => {
  if (root) act(() => root.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('liquid acid to 0.1 mL at Home, whole mL in Pro', () => {
  it('the recommendations are the hand-worked doses', () => {
    expect(computeWater(MASH.water, MASH).acid.recommended).toBeCloseTo(MASH_REC_ML, 9);
    expect(computeWater(TANK.water, TANK).acid.recommended).toBeCloseTo(TANK_REC_ML, 9);
  });

  for (const mode of ['home', 'pro']) {
    const want = SHOWN[mode];
    const precision = mode === 'home' ? 'to 0.1 mL at Home' : 'to whole mL in Pro';

    it(`a liquid acid dose and its recommendation show on the Salts & Acid screen ${precision}`, () => {
      expect(boxValue(tab(MASH, mode)), 'mash box').toBe(want.mash);
      expect(text(tab(MASH, mode)), 'mash hint').toContain(`rec ${want.mash} mL`);
      expect(boxValue(tab(TANK, mode)), 'tank box').toBe(want.tank);
      expect(text(tab(TANK, mode)), 'tank hint').toContain(`rec ${want.tank} mL`);
      // The brewer's own dose, beside the same recommendation.
      expect(boxValue(tab(OWN, mode)), 'own box').toBe(want.own);
      expect(text(tab(OWN, mode)), 'own hint').toContain(`rec ${want.mash} mL`);
    });

    it(`the printed sheet prints a liquid acid dose ${precision}`, () => {
      expect(acidOnSheet(MASH, mode)).toMatchObject({ place: 'Mash', amount: want.mash, unit: 'mL' });
      expect(acidOnSheet(TANK, mode)).toMatchObject({ place: 'HLT', amount: want.tank, unit: 'mL' });
      expect(acidOnSheet(OWN, mode)).toMatchObject({ place: 'Mash', amount: want.own, unit: 'mL' });
    });

    it(`leaving the acid box without typing saves the dose as the box shows it, ${precision}`, () => {
      // LT-S3: as today, the box saves what it shows; the decimals decide it.
      let saved = null;
      host = document.createElement('div');
      document.body.appendChild(host);
      root = createRoot(host);
      act(() =>
        root.render(createElement(WaterTab, props(TANK, mode, (step) => (saved = step(TANK.water))))),
      );
      const box = host.querySelector(`input[aria-label="${LABEL}"]`);
      expect(box.value).toBe(want.tank);
      expect(TANK.water.acidAmounts).toBeNull(); // following the recommendation
      act(() => {
        box.focus();
        box.blur();
      });
      expect(saved.acidAmounts.phosphoric_75).toBe(Number(want.tank));
    });
  }

  it('salts and acidulated malt keep their precision', () => {
    // LT-S4: salts 0.1 g at Home, whole g in Pro; acidulated malt 0.01 oz or lb.
    const gypsum = (mode) => sheetOf(MASH, mode).water.additions.find((a) => a.name.startsWith('Gypsum'));
    expect(gypsum('home').amount).toMatch(/^\d+\.\d$/);
    expect(gypsum('pro').amount).toMatch(/^\d+$/);
    const malted = { ...MASH, water: { ...MASH.water, primaryAcid: 'acidulated_malt', acidAmounts: null } };
    const maltRow = (mode) => sheetOf(malted, mode).water.additions.find((a) => a.name.startsWith('Acidulated'));
    expect(maltRow('home')).toMatchObject({ unit: 'oz' });
    expect(maltRow('home').amount).toMatch(/^\d+\.\d\d$/);
    expect(maltRow('pro')).toMatchObject({ unit: 'lb' });
    expect(maltRow('pro').amount).toMatch(/^\d+\.\d\d$/);
  });
});
