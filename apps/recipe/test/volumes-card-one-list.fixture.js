// volumes-card-one-list.fixture.js
// The recipes and renders the scenarios of "The Volumes card and the line
// under the stats bar read one list" share (volumes-card-one-list.test.js,
// docs/items/volumes-card-one-list.md), and from which
// `volumes-card-one-list.before.json` was captured before the change
// (2026-10-15): "nothing changes on screen" (VO-S2) compares against text and
// bytes the change did not write. The captures are never re-made.
//
// What is captured: the line under the stats bar for each Volumes card box
// left empty alone, for every two of them, for all of them (and a malt weight
// with them, which the line names after the card), and for each measurement
// temperature the correction cannot use; and the card's markup, as a SHA-256
// of the bytes, for each box empty alone, all of them, each temperature the
// correction cannot use, and with the card's two warnings showing. Each with
// water back off and on, every measurement temperature at the reference and
// measured hot; the card also in Home, Pro in barrels and Pro in gallons, in
// °F and °C.

import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState } from '../src/state.js';
import { computeRecipe } from '../src/selectors.js';
import { emptyFields, emptyFieldsLine } from '../src/empty-fields.js';
import VolumesSection from '../src/components/VolumesSection.jsx';

// Every number box on the Volumes card, as a path into the recipe.
export const BOXES = [
  'mashWaterGal',
  'preBoilVolGal',
  'measurementTempF.preBoil',
  'boilOffRateGalPerHr',
  'boilTimeMin',
  'measurementTempF.postBoil',
  'fermentVolGal',
  'measurementTempF.ferment',
  'waterBack.volumeGal',
  'waterBack.tempF',
];
const TEMPS = BOXES.filter((b) => b.startsWith('measurementTempF') || b === 'waterBack.tempF');

// A temperature outside the engine's density table (0–100 °C, 32–212 °F).
const OUT_OF_RANGE_F = 250;

/** The built-in recipe, water back off or on (1 gal), temperatures at the reference or measured hot. */
export function base(waterBack, temps) {
  const r = defaultRecipeState();
  const hot = temps === 'measured';
  return {
    ...r,
    measurementTempF: hot ? { preBoil: 150, postBoil: 180, ferment: 68 } : { ...r.measurementTempF },
    waterBack: { on: waterBack === 'on', volumeGal: 1, tempF: hot ? 68 : r.waterBack.tempF },
  };
}

/** `recipe` with each box in `paths` set to `value`. */
export function setting(recipe, paths, value) {
  const r = { ...recipe, measurementTempF: { ...recipe.measurementTempF }, waterBack: { ...recipe.waterBack } };
  for (const p of paths) {
    const [a, b] = p.split('.');
    if (b) r[a][b] = value;
    else r[a] = value;
  }
  return r;
}

/** The line under the stats bar for `recipe`, as App.jsx makes it. */
export const line = (recipe) => emptyFieldsLine(emptyFields(recipe, computeRecipe(recipe)));

/** The Volumes card's markup for `recipe`, as App.jsx draws it. */
export function cardHtml(recipe, mode, proVolumeUnit, temperatureUnit) {
  const d = computeRecipe(recipe);
  return renderToStaticMarkup(
    createElement(VolumesSection, {
      recipe,
      grist: d.grist,
      postBoilVolGal: d.postBoilVolGal,
      postBoilMeasuredGal: d.postBoilMeasuredGal,
      postBoilMeasuredShown: d.postBoilMeasuredShown,
      refVolumesGal: d.refVolumesGal,
      warnings: d.warnings,
      fermentGal: d.fermentGal,
      pitchGal: d.pitchGal,
      knockOut: d.knockOut,
      mode,
      proGravityUnit: 'plato',
      proVolumeUnit,
      temperatureUnit,
      setField: () => {},
      setMeasurementTemp: () => {},
      setWaterBack: () => {},
    }),
  );
}

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

// The line's cases: each box alone, every two, all (and a malt weight with
// them), each temperature the correction cannot use, and all four of them.
function lineCases(r) {
  const cases = {};
  BOXES.forEach((a, i) => {
    cases[a] = setting(r, [a], NaN);
    BOXES.slice(i + 1).forEach((b) => {
      cases[`${a} + ${b}`] = setting(r, [a, b], NaN);
    });
  });
  cases.all = setting(r, BOXES, NaN);
  const withMalt = setting(r, BOXES, NaN);
  withMalt.malts = [{ ...withMalt.malts[0], weightLb: NaN }, ...withMalt.malts.slice(1)];
  cases['all + a malt weight'] = withMalt;
  for (const t of TEMPS) cases[`${t} out of range`] = setting(r, [t], OUT_OF_RANGE_F);
  cases['every temperature out of range'] = setting(r, TEMPS, OUT_OF_RANGE_F);
  return cases;
}

// The card's cases: nothing empty, the two warnings showing (50 gal of mash
// water and of fermentation volume), each box alone, all, and each
// temperature the correction cannot use.
function cardCases(r) {
  const cases = { none: r, warnings: setting(setting(r, ['mashWaterGal'], 50), ['fermentVolGal'], 50) };
  for (const b of BOXES) cases[b] = setting(r, [b], NaN);
  cases.all = setting(r, BOXES, NaN);
  for (const t of TEMPS) cases[`${t} out of range`] = setting(r, [t], OUT_OF_RANGE_F);
  return cases;
}

const SCREENS = [
  ['home', 'bbl'],
  ['pro', 'bbl'],
  ['pro', 'gal'],
];

/** Everything VO-S2 compares, drawn now. */
export function capture() {
  const out = { line: {}, card: {} };
  for (const wb of ['off', 'on']) {
    for (const temps of ['reference', 'measured']) {
      const r = base(wb, temps);
      for (const [name, recipe] of Object.entries(lineCases(r))) {
        out.line[`water back ${wb}, ${temps}: ${name}`] = line(recipe);
      }
      for (const [mode, unit] of SCREENS) {
        for (const tu of ['F', 'C']) {
          for (const [name, recipe] of Object.entries(cardCases(r))) {
            const screen = mode === 'home' ? 'home' : `pro ${unit}`;
            out.card[`water back ${wb}, ${temps}, ${screen}, °${tu}: ${name}`] = sha256(cardHtml(recipe, mode, unit, tu));
          }
        }
      }
    }
  }
  return out;
}
