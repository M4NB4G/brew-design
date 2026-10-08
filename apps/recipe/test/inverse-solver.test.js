// inverse-solver.test.js
// Scenarios for "Design to a target OG" (docs/items/inverse-solver-ui.md,
// IS-S1 to IS-S7, decisions IS-Q1 to IS-Q7). The Grist card always shows each
// malt's % of total grain weight; a "Design to target OG" control takes a
// target OG and one % box per malt, and Solve sets every malt's weight through
// the engine's solveGrist, in one step, or changes nothing and says why. The
// suite has no DOM: the Solve step is the selector and the state step the
// card's button calls, and the card is drawn with renderToStaticMarkup (its
// panel drawn open where a scenario reads the boxes); the clicks are checked
// at the far end.
//
// The pins are worked by hand. The built-in recipe's 10 lb Pale and 1 lb
// Munich are 10/11 = 0.909090... -> 90.9 % and 1/11 = 0.090909... -> 9.1 % of
// the 11 lb bill. The smoke test's reference recipe brews 27 lb Golden Promise
// and 2 lb Carafoam (29 lb) to OG 1.0688522 (Rev 4; Rev 3: 1.0681297):
// 27/29 = 93.103 % -> 93.1 and 2/29 = 6.897 % -> 6.9; solving back from that
// OG at 93.1/6.9 % gives ~27.0 and ~2.0 lb, within the engine's pinned round-trip residual (solver.test.js:
// 2e-2 lb, the two gravity conversions not being exact inverses). Mash Rv
// after the solve is 13 gal x 4 qt/gal over the new total: about 52/29 =
// 1.793 qt/lb.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DEFAULT_DISPLAY } from '../src/state.js';
import * as selectors from '../src/selectors.js';
import * as state from '../src/state.js';
import { exportRecipeDocument, SCHEMA_VERSION } from '../src/persistence.js';
import { defaultWaterState } from '../src/water-state.js';
import { solveGrist, correctVolumeToRef } from '@brew/engine';
import * as f from './inverse-solver.fixture.js';
import { docWithBlankPrices } from './blank-prices.js';
import { withoutBoxNames as noNames } from './box-names.fixture.js';
import { docWithTarget } from './acid-aim.js';

const { computeRecipe } = selectors;
const solveTargetOG = (...a) => selectors.solveTargetOG(...a);
const withMaltWeights = (...a) => state.withMaltWeights(...a);
const solveUndoable = (...a) => state.solveUndoable(...a);
// The control's module, loaded per scenario (it is new with this item).
const solver = () => import('../src/components/TargetOgSolver.jsx');

const BEFORE = JSON.parse(readFileSync(new URL('./inverse-solver.before.json', import.meta.url), 'utf8'));

// The smoke test's reference recipe (smoke.test.js), canonical units.
function reference() {
  return {
    name: '',
    style: '',
    notes: '',
    malts: [
      { name: 'Golden Promise', weightLb: 27, fgdb: 0.8, colorL: 2.2, type: 'base', distilledWaterPh: NaN, acidityMeqPerKg: NaN },
      { name: 'Carafoam', weightLb: 2, fgdb: 0.8, colorL: 2.0, type: 'base', distilledWaterPh: NaN, acidityMeqPerKg: NaN },
    ],
    efficiency: 0.93,
    apparentAttenuation: 0.8,
    preBoilVolGal: 16,
    boilOffRateGalPerHr: 1.5,
    boilTimeMin: 60,
    mashWaterGal: 13,
    kettleAdditions: [{ name: 'Bravo', timeMin: 60, wortTempF: 204, weightOz: 2, alphaAcidFraction: 0.147 }],
    dryHops: [{ name: 'DH1', weightOz: 2 }],
    fermentVolGal: 12,
    yeast: { type: 'ale', density: 'mod', name: '', fermTempF: NaN },
    measurementTempF: { preBoil: 60, postBoil: 60, ferment: 60 },
    water: defaultWaterState(),
  };
}

// The panel drawn open, as the brewer sees it after "Design to target OG".
async function panelHtml(r, { mode = 'home', proGravityUnit = 'plato', solved = null } = {}) {
  const d = computeRecipe(r);
  const { default: TargetOgSolver } = await solver();
  return renderToStaticMarkup(
    createElement(TargetOgSolver, {
      malts: r.malts,
      grist: d.grist,
      mode,
      proGravityUnit,
      solved,
      onSolve: () => ({ ok: true }),
      onUndoSolve: () => {},
      defaultOpen: true,
    }),
  );
}

const withoutNew = (html) => noNames(f.withoutTargetOgDesign(html));

describe('design to a target OG', () => {
  // IS-S1
  it("each malt's % of total always shows", () => {
    // 10 lb and 1 lb: 10/11 -> 90.9, 1/11 -> 9.1 (by hand).
    const html = f.gristHtml(f.recipe());
    expect(html).toContain('% of total');
    expect(html).toMatch(/data-share[^>]*>90\.9<\/td>/);
    expect(html).toMatch(/data-share[^>]*>9\.1<\/td>/);

    // In Pro with sacks too: the share is of the weight, whatever its unit.
    const sacks = f.gristHtml(f.recipe(), { mode: 'pro', proMaltUnit: 'sack' });
    expect(sacks).toMatch(/data-share[^>]*>90\.9<\/td>/);

    // A blank weight blanks every share: "—".
    const r = f.recipe();
    const blankWeight = { ...r, malts: [{ ...r.malts[0], weightLb: NaN }, r.malts[1]] };
    const blankHtml = f.gristHtml(blankWeight);
    expect(blankHtml).toMatch(/data-share[^>]*>—<\/td>/);
    expect(blankHtml).not.toMatch(/data-share[^>]*>\d/);
  });

  // IS-S2, IS-Q7
  it("the control offers a target OG in the screen's gravity unit and one % box per malt, filled from the shares", async () => {
    const home = await panelHtml(f.recipe());
    expect(home).toContain('Target OG');
    expect(home).toMatch(/Target OG<\/span><span[^>]*>SG</);
    // One % box per malt, filled from its share to one decimal: 90.9 and 9.1.
    expect(home).toMatch(/aria-label="% Pale 2-Row"[^>]*value="90.9"|value="90.9"[^>]*aria-label="% Pale 2-Row"/);
    expect(home).toMatch(/aria-label="% Munich"[^>]*value="9.1"|value="9.1"[^>]*aria-label="% Munich"/);
    // The boxes' total, to one decimal: the exact shares total 100.0.
    expect(home).toContain('Total 100.0 %');
    expect(home).toContain('>Solve<');

    // Pro in °P, and in SG when chosen.
    expect(await panelHtml(f.recipe(), { mode: 'pro', proGravityUnit: 'plato' })).toMatch(/Target OG<\/span><span[^>]*>°P</);
    expect(await panelHtml(f.recipe(), { mode: 'pro', proGravityUnit: 'sg' })).toMatch(/Target OG<\/span><span[^>]*>SG</);

    // A blank weight leaves its % box blank.
    const r = f.recipe();
    const blank = await panelHtml({ ...r, malts: [r.malts[0], { ...r.malts[1], weightLb: NaN }] });
    expect(blank).toMatch(/aria-label="% Munich"[^>]*value=""|value=""[^>]*aria-label="% Munich"/);

    // The closed control on the card is one button.
    expect(f.gristHtml(f.recipe())).toContain('Design to target OG');
  });

  // IS-S3, IS-Q7, K (idempotence)
  it('Solve sets the weights from the target and the percents', () => {
    const r = reference();
    // 93.1 and 6.9 % as typed: they total 100.0.
    const out = solveTargetOG(r, 1.0688522, [0.931, 0.069]);
    expect(out.ok).toBe(true);
    const solved = withMaltWeights(r, out.weightsLb);
    // ~27.0 and ~2.0 lb, within the solver's pinned residual (2e-2 lb).
    expect(Math.abs(solved.malts[0].weightLb - 27)).toBeLessThan(2e-2);
    expect(Math.abs(solved.malts[1].weightLb - 2)).toBeLessThan(2e-2);
    // Only the weights change: the mash water stays 13 gal; every other field as it was.
    expect(solved.mashWaterGal).toBe(13);
    expect({ ...solved, malts: solved.malts.map(({ weightLb, ...m }) => m) }).toEqual({
      ...r,
      malts: r.malts.map(({ weightLb, ...m }) => m),
    });
    // Mash Rv follows the new weights: 52 qt over ~29 lb, ~1.793 qt/lb.
    expect(computeRecipe(solved).grist.mashRv).toBeCloseTo(52 / 29, 2);
    // The original recipe object is untouched (the step returns a new one).
    expect(r.malts[0].weightLb).toBe(27);

    // The exact shares as filled (IS-Q7) total 100 and solve.
    const shares = computeRecipe(r).grist.perMalt.map((m) => m.perMaltWeightFraction);
    expect(solveTargetOG(r, 1.0688522, shares).ok).toBe(true);

    // Idempotence: Solve again with the same target and percents, same weights.
    const again = solveTargetOG(solved, 1.0688522, [0.931, 0.069]);
    expect(again.weightsLb).toEqual(out.weightsLb);

    // The pre-boil volume reaches the solver at 60 °F: measured hot (212 °F),
    // the weights are the engine's for correctVolumeToRef(16, 212), not for the
    // measured 16 gal (which would be about 4 % lighter). Since S12 item 3
    // (docs/items/solve-volumes-measured-hot.md, SH-S1) the post-boil volume
    // is the measured 16 gal boiled off, 16 - 1.5 = 14.5 gal, corrected at
    // its own temperature (60 °F here: 14.5), as the recipe works it; before,
    // it was the corrected pre-boil volume boiled off.
    const hot = { ...r, measurementTempF: { ...r.measurementTempF, preBoil: 212 } };
    const engineAt60 = (preBoilVolGal, postBoilVolGal) =>
      solveGrist({
        malts: [{ fgdb: 0.8, percent: 0.931 }, { fgdb: 0.8, percent: 0.069 }],
        targetOG: 1.0688522,
        efficiency: 0.93,
        preBoilVolGal,
        boilOffRateGalPerHr: 1.5,
        boilTimeMin: 60,
        postBoilVolGal,
      }).weights.map((w) => w.weightLb);
    const hotOut = solveTargetOG(hot, 1.0688522, [0.931, 0.069]);
    expect(hotOut.weightsLb).toEqual(engineAt60(correctVolumeToRef(16, 212), 14.5));
    expect(hotOut.weightsLb[0]).not.toBeCloseTo(engineAt60(16)[0], 1);

    // In Pro the weights are still pounds in the recipe (sacks are shown at the edge).
    expect(solved.malts.every((m) => Number.isFinite(m.weightLb))).toBe(true);
  });

  // IS-S3: a blank weight needs only a % typed (IS-Q2').
  it('Solve fills a blank weight from its %', () => {
    const r = reference();
    const blank = { ...r, malts: [r.malts[0], { ...r.malts[1], weightLb: NaN }] };
    const out = solveTargetOG(blank, 1.0688522, [0.931, 0.069]);
    expect(out.ok).toBe(true);
    expect(Math.abs(out.weightsLb[1] - 2)).toBeLessThan(2e-2);
  });

  // IS-S4, IS-Q5, IS-Q7
  it('Solve refuses and names what is missing', async () => {
    const { solveRefusalText } = await solver();
    const r = reference();
    // 93.1 + 5.9 = 99.0: refused, naming the total.
    const short = solveTargetOG(r, 1.0688522, [0.931, 0.059]);
    expect(short.ok).toBe(false);
    expect(short.weightsLb).toBeUndefined();
    expect(solveRefusalText(short)).toBe('The percents total 99.0 %, not 100 %. Nothing changed.');
    // 99.96 reads 100.0: solves.
    expect(solveTargetOG(r, 1.0688522, [0.9306, 0.069]).ok).toBe(true);

    // Each blank figure, named.
    const named = (recipe, target, pct) => solveRefusalText(solveTargetOG(recipe, target, pct));
    expect(named(r, NaN, [0.931, 0.069])).toBe('Blank: the target OG. Nothing changed.');
    expect(named(r, 1.068, [0.931, NaN])).toBe('Blank: the % for Carafoam. Nothing changed.');
    expect(named({ ...r, malts: [{ ...r.malts[0], fgdb: NaN }, r.malts[1]] }, 1.068, [0.931, 0.069])).toBe(
      'Blank: the FGDB of Golden Promise. Nothing changed.',
    );
    expect(named({ ...r, efficiency: NaN }, 1.068, [0.931, 0.069])).toBe('Blank: the brewhouse efficiency. Nothing changed.');
    expect(named({ ...r, preBoilVolGal: NaN }, 1.068, [0.931, 0.069])).toBe('Blank: the pre-boil volume. Nothing changed.');
    expect(named({ ...r, boilOffRateGalPerHr: NaN }, 1.068, [0.931, 0.069])).toBe('Blank: the boil-off rate. Nothing changed.');
    expect(named({ ...r, boilTimeMin: NaN }, 1.068, [0.931, 0.069])).toBe('Blank: the boil time. Nothing changed.');
    // Several at once, in the card's order; an unnamed malt by its row.
    const many = {
      ...r,
      efficiency: NaN,
      boilTimeMin: NaN,
      malts: [r.malts[0], { ...r.malts[1], name: '', fgdb: NaN }],
    };
    expect(named(many, NaN, [0.931, 0.069])).toBe(
      'Blank: the target OG, the FGDB of Malt 2, the brewhouse efficiency, the boil time. Nothing changed.',
    );
    // A blank % names the % (the total of a blank is not a total).
    expect(solveRefusalText(solveTargetOG(r, 1.068, [NaN, NaN]))).toBe(
      'Blank: the % for Golden Promise, the % for Carafoam. Nothing changed.',
    );
    // A refused solve carries no weights to write.
    for (const out of [short, solveTargetOG({ ...r, efficiency: NaN }, 1.068, [0.931, 0.069])]) {
      expect(out.ok).toBe(false);
      expect(out.weightsLb).toBeUndefined();
    }
  });

  // IS-S5
  it('the predicted OG and the residual line show', async () => {
    const r = reference();
    const out = solveTargetOG(r, 1.068, [0.931, 0.069]);
    const solved = withMaltWeights(r, out.weightsLb);
    const og = computeRecipe(solved).grist.OG;
    // The forward OG from the solved weights, near the target but not on it
    // (within 1e-4: the engine's ~0.0034 °P residual is ~1.4e-5 SG).
    expect(Math.abs(og - 1.068)).toBeLessThan(1e-4);
    expect(og).not.toBe(1.068);

    const html = await panelHtml(solved, { solved: { target: '1.068' } });
    expect(html).toContain(`Predicted OG ${og.toFixed(4)} for a target of 1.068`);
    expect(html).toContain('two gravity conversions');
    expect(html).toContain('Undo solve');

    // In °P, the target as typed and the prediction in °P.
    const plato = await panelHtml(solved, { mode: 'pro', proGravityUnit: 'plato', solved: { target: '16.60' } });
    expect(plato).toMatch(/Predicted OG \d+\.\d{3} °P for a target of 16\.60 °P/);

    // No solve: no prediction line, no undo.
    const none = await panelHtml(solved);
    expect(none).not.toContain('Predicted OG');
    expect(none).not.toContain('Undo solve');
  });

  // IS-S6, K (undo until the next edit)
  it('undo restores the weights; the target and the percents are not saved', () => {
    const r = reference();
    const out = solveTargetOG(r, 1.068, [0.931, 0.069]);
    const after = withMaltWeights(r, out.weightsLb);
    const undo = { before: r.malts.map((m) => m.weightLb), after, target: '1.068' };

    // Undo is offered while the recipe is the one the solve wrote …
    expect(solveUndoable(undo, after)).toBe(true);
    // … and not after the next edit, or with no solve.
    expect(solveUndoable(undo, { ...after, boilTimeMin: 90 })).toBe(false);
    expect(solveUndoable(null, after)).toBe(false);

    // Undo puts back exactly the weights from before.
    const undone = withMaltWeights(after, undo.before);
    expect(undone.malts.map((m) => m.weightLb)).toEqual([27, 2]);
    expect(undone).toEqual(r);

    // The saved document carries no target and no percents, at the same version.
    const doc = JSON.parse(exportRecipeDocument({ recipe: after, ...DEFAULT_DISPLAY }));
    expect(doc.version).toBe(SCHEMA_VERSION);
    expect(SCHEMA_VERSION).toBe(12);
    expect(Object.keys(doc.recipe).sort()).toEqual(Object.keys(r).sort());
    expect(Object.keys(doc.recipe.malts[0]).sort()).toEqual(Object.keys(r.malts[0]).sort());
    // The Water tab's target mash pH (S9, AA-S2) is a recipe figure, saved
    // under its own name; no other target is.
    const { mashPhTarget, ...waterWithout } = doc.recipe.water;
    expect(mashPhTarget).toBe(5.4);
    expect(JSON.stringify({ ...doc, recipe: { ...doc.recipe, water: waterWithout } })).not.toMatch(/target|percent/i);
  });

  // IS-S7
  it('nothing else changes', () => {
    const r = f.recipe();
    // The card gains the % of total column and the closed control, and only those.
    const home = f.gristHtml(r);
    expect(home).toContain('% of total');
    expect(home).toContain('Design to target OG');
    expect(withoutNew(home)).toBe(noNames(BEFORE['grist-home']));
    expect(withoutNew(f.gristHtml(r, { mode: 'pro' }))).toBe(noNames(BEFORE['grist-pro-lb']));
    expect(withoutNew(f.gristHtml(r, { mode: 'pro', proMaltUnit: 'sack' }))).toBe(noNames(BEFORE['grist-pro-sack']));
    // Since cost of a batch: version 11, with blank prices (economics EC-S3);
    // since the acid aimed at a mash pH, version 12 with the target 5.4 (AA-Q4).
    const before = JSON.parse(BEFORE.document);
    expect(JSON.parse(exportRecipeDocument({ recipe: r, ...DEFAULT_DISPLAY }))).toEqual({
      ...before,
      version: 12,
      recipe: docWithTarget(docWithBlankPrices(before.recipe)),
    });
  });
});
