// empty-fields.js
// The number boxes that are empty, named as the brewer sees them, for the line
// under the stats bar (Empty-field handling, 2026-09-23). An empty box is a
// blank figure (NaN) in the recipe; the figures that depend on it show "—".
//
// Names the boxes, not the figures they blank (E2): tracing which stat each
// blanks would restate the engine's math. Only boxes that feed a figure are
// named: the fermentation temperature feeds none, and text boxes (names,
// style, notes) are never named; My brewery's boxes are not the recipe (E4).
//
// A measurement temperature the volume correction cannot use is named too.
// That is read from the recipe's own figures — its volume at 60 degF is blank
// while the measured volume is not — never from a range written here.
// Computes nothing: every figure is the recipe's or computeRecipe's.
//
// The Volumes card's boxes are named in the order of the shared list of the
// card's rows (volumes-card-rows.js), which the card draws from too
// (docs/items/volumes-card-one-list.md, VO-S1 to VO-S3).

import { VOLUMES_CARD_ROWS, rowsShown } from './volumes-card-rows.js';

const blank = (v) => !Number.isFinite(v);

// A row's name as typed, or '' when it has none.
const typedName = (row) => (typeof row?.name === 'string' ? row.name.trim() : '');

// A row's name as typed, or its place when it has none ("Malt 2").
const rowName = (row, kind, index) => typedName(row) || `${kind} ${index + 1}`;

/**
 * The empty number boxes of `recipe`, in screen order: the Volumes card (each
 * measurement temperature beside the volume it corrects), the Grist table and
 * its efficiency, the Yeast card's attenuation, the kettle and dry hops.
 * `derived` is computeRecipe(recipe).
 */
export function emptyFields(recipe, derived) {
  const names = [];
  const check = (value, name) => {
    if (blank(value)) names.push(name);
  };

  // A measurement temperature box, named when blank, or when the correction
  // cannot use it (see above): its volume at 60 degF blank while the measured
  // volume is not.
  const checkTemp = (name, tempF, refGal, measuredGal) => {
    if (blank(tempF)) {
      names.push(name);
    } else if (blank(refGal) && !blank(measuredGal)) {
      names.push(`${name} (outside the correction's range)`);
    }
  };

  // The Volumes card's boxes, by their keys in the shared list of the card's
  // rows (volumes-card-rows.js), named in that list's order: the order the
  // card shows them. Water back's rows only while it is on (WB-S10), the
  // fermentation volume's box then the wort from kettle (WF-S2).
  const wb = recipe.waterBack;
  const refs = derived.refVolumesGal;
  const boxes = {
    mashWater: recipe.mashWaterGal,
    preBoilVolume: recipe.preBoilVolGal,
    boilOffRate: recipe.boilOffRateGalPerHr,
    boilTime: recipe.boilTimeMin,
    fermentVolume: recipe.fermentVolGal,
    wortFromKettle: recipe.fermentVolGal,
    waterBack: wb?.volumeGal,
  };
  // Each temperature with its volume at 60 degF and the volume it corrects.
  // The post-boil volume is worked out, not entered.
  const temps = {
    preBoilTemp: [recipe.measurementTempF?.preBoil, refs.preBoil, recipe.preBoilVolGal],
    postBoilTemp: [recipe.measurementTempF?.postBoil, refs.postBoil, derived.postBoilMeasuredGal],
    fermentTemp: [recipe.measurementTempF?.ferment, refs.ferment, recipe.fermentVolGal],
    waterBackTemp: [wb?.tempF, refs.waterBack, wb?.volumeGal],
  };
  for (const part of VOLUMES_CARD_ROWS) {
    for (const row of rowsShown(part.rows, Boolean(wb?.on))) {
      if (!row.name) continue;
      if (row.key in temps) checkTemp(row.name, ...temps[row.key]);
      else check(boxes[row.key], row.name);
    }
  }

  recipe.malts.forEach((m, i) => {
    const name = rowName(m, 'Malt', i);
    check(m.weightLb, `${name} weight`);
    check(m.fgdb, `${name} FGDB`);
    check(m.colorL, `${name} color`);
  });
  check(recipe.efficiency, 'Brewhouse efficiency');
  check(recipe.apparentAttenuation, 'Apparent attenuation');

  recipe.kettleAdditions.forEach((a, i) => {
    const name = rowName(a, 'Kettle hop', i);
    check(a.timeMin, `${name} time`);
    check(a.wortTempF, `${name} temperature`);
    check(a.weightOz, `${name} weight`);
    check(a.alphaAcidFraction, `${name} alpha`);
  });
  // A dry hop says so, as the same hop may also be in the kettle.
  recipe.dryHops.forEach((d, i) => {
    const name = typedName(d);
    check(d.weightOz, name ? `${name} dry-hop weight` : `Dry hop ${i + 1} weight`);
  });
  return names;
}

/** The line under the stats bar for `names`, or null when none is empty. */
export function emptyFieldsLine(names) {
  if (names.length === 0) return null;
  const them = names.length === 1 ? 'it' : 'them';
  return `Empty: ${names.join(', ')} — figures that depend on ${them} show —`;
}
