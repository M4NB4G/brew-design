// @vitest-environment jsdom
// target-og-with-water-back.test.js
// Scenarios for batch S15c item 2, "Design to target OG with water back on"
// (docs/items/target-og-with-water-back.md, TO-S1 to TO-S4): with water back
// on, the target typed is the OG at pitch, worked back by the engine to the OG
// from the kettle, and the grain bill solved for that as before.
//
// By hand (the engine scenario, packages/engine/test/target-og-with-water-
// back.test.js, shows the working): the built-in recipe, 5.5 gal from the
// kettle and 1 gal of water back, both at 60 °F, for an OG at pitch of 1.056:
// °P at pitch 13.80468203, OG from the kettle 1.06612427. The OG on the stats
// bar after Solve is the target within the gravity conversions' mismatch the
// solver already carries (SG to °P and back, twice): 1.056 to 0.0001.
// Without water back, as before: 1.056 from the kettle (S7's scenarios).

import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { REFERENCE_TEMP_F } from '@brew/engine';
import { defaultRecipeState, DEFAULT_DISPLAY, withMaltWeights } from '../src/state.js';
import { computeRecipe, solveTargetOG } from '../src/selectors.js';
import { STORAGE_KEY, exportRecipeDocument } from '../src/persistence.js';
import { solveRefusalText } from '../src/components/TargetOgSolver.jsx';
import { mount, unmount, page, text, click, button } from './page-error.fixture.js';

const withWaterBack = (over = {}, r = defaultRecipeState()) => ({
  ...r,
  waterBack: { on: true, volumeGal: 1, tempF: REFERENCE_TEMP_F, ...over },
});
const SHARES = [10 / 11, 1 / 11];
const stored = (recipe) => ({ [STORAGE_KEY]: exportRecipeDocument({ recipe, ...DEFAULT_DISPLAY }) });
const panel = () => page().querySelector('[aria-label="Design to target OG"]');
const statsBar = () => text(page().querySelector('[aria-label="Recipe figures"]'));
function type(el, value) {
  act(() => el.focus());
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  act(() => {
    set.call(el, String(value));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  act(() => el.blur());
}
const targetBox = () => [...panel().querySelectorAll('input')].find((el) => /^Target OG/.test(el.getAttribute('aria-label')));

afterEach(() => unmount());

describe('design to target OG with water back on (S15c item 2)', () => {
  it('TO-S1: the target is the OG at pitch, worked back to the OG from the kettle, and the card says so', () => {
    const r = withWaterBack();
    const out = solveTargetOG(r, 1.056, SHARES);
    expect(out.ok).toBe(true);
    const solved = computeRecipe(withMaltWeights(r, out.weightsLb));
    // The OG from the kettle the bill was solved for, 1.06612427 by hand.
    expect(solved.knockOut.OG).toBeCloseTo(1.06612427, 4);

    mount(stored(r));
    click(button('Design to target OG'));
    expect(text(panel())).toContain('Target OG at pitch');
    unmount();
    mount();
    click(button('Design to target OG'));
    expect(text(panel())).toContain('Target OG');
    expect(text(panel())).not.toContain('at pitch');
  });

  it('TO-S2: after Solve the stats bar\'s OG is the target', () => {
    const r = withWaterBack();
    const out = solveTargetOG(r, 1.056, SHARES);
    expect(computeRecipe(withMaltWeights(r, out.weightsLb)).stats.OG).toBeCloseTo(1.056, 4);
    // Measured hot, the water back at its own temperature: the same.
    const hot = withWaterBack({ tempF: 170 });
    const outHot = solveTargetOG(hot, 1.056, SHARES);
    expect(computeRecipe(withMaltWeights(hot, outHot.weightsLb)).stats.OG).toBeCloseTo(1.056, 4);

    mount(stored(r));
    click(button('Design to target OG'));
    type(targetBox(), '1.056');
    click(button('Solve'));
    expect(statsBar()).toContain('1.056OG');
    // The predicted OG shown after Solve is the one at pitch.
    expect(text(panel())).toMatch(/Predicted OG 1\.056\d for a target of 1\.056/);
  });

  it('TO-S3: a blank or uncorrectable water back, or its temperature, refuses Solve and is named', () => {
    for (const [over, says] of [
      [{ volumeGal: NaN }, 'Blank: the water back.'],
      [{ tempF: NaN }, 'The water back cannot be corrected at its measurement temperature.'],
      [{ tempF: 250 }, 'The water back cannot be corrected at its measurement temperature.'],
    ]) {
      const out = solveTargetOG(withWaterBack(over), 1.056, SHARES);
      expect(out.ok).toBe(false);
      expect(solveRefusalText(out)).toContain(says);
      expect(solveRefusalText(out)).toContain('Nothing changed.');
    }
    // So does the wort from kettle, which the balance also reads.
    const wort = solveTargetOG({ ...withWaterBack(), fermentVolGal: NaN }, 1.056, SHARES);
    expect(solveRefusalText(wort)).toContain('Blank: the wort from kettle.');

    mount(stored(withWaterBack({ volumeGal: NaN })));
    const before = JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe.malts.map((m) => m.weightLb);
    click(button('Design to target OG'));
    type(targetBox(), '1.056');
    click(button('Solve'));
    expect(text(panel())).toContain('Blank: the water back.');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).recipe.malts.map((m) => m.weightLb)).toEqual(before);
  });

  it('TO-S4: with water back off, Solve is as today', () => {
    const today = defaultRecipeState();
    const typed = { ...today, waterBack: { on: false, volumeGal: 1, tempF: 170 } };
    const a = solveTargetOG(today, 1.056, SHARES);
    const b = solveTargetOG(typed, 1.056, SHARES);
    expect(b).toEqual(a);
    expect(computeRecipe(withMaltWeights(today, a.weightsLb)).stats.OG).toBeCloseTo(1.056, 4);
    // Off, a blank water back is not asked for.
    expect(solveTargetOG({ ...today, waterBack: { on: false, volumeGal: NaN, tempF: NaN } }, 1.056, SHARES).ok).toBe(true);
  });
});
