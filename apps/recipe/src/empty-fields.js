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

const blank = (v) => !Number.isFinite(v);

// A row's name as typed, or '' when it has none.
const typedName = (row) => (typeof row?.name === 'string' ? row.name.trim() : '');

// A row's name as typed, or its place when it has none ("Malt 2").
const rowName = (row, kind, index) => typedName(row) || `${kind} ${index + 1}`;

const MEASUREMENTS = [
  ['preBoil', 'Pre-boil'],
  ['postBoil', 'Post-boil'],
  ['ferment', 'Fermentation'],
];

/**
 * The empty number boxes of `recipe`, in screen order: the Volumes card,
 * the Grist table and its efficiency, the Yeast card's attenuation, the
 * kettle and dry hops, then the Options tab's measurement temperatures.
 * `derived` is computeRecipe(recipe).
 */
export function emptyFields(recipe, derived) {
  const names = [];
  const check = (value, name) => {
    if (blank(value)) names.push(name);
  };

  check(recipe.mashWaterGal, 'Mash water');
  check(recipe.preBoilVolGal, 'Pre-boil volume');
  check(recipe.boilOffRateGalPerHr, 'Boil-off rate');
  check(recipe.boilTimeMin, 'Boil time');
  check(recipe.fermentVolGal, 'Fermentation volume');

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

  // The volume each temperature corrects, as measured.
  const measured = {
    preBoil: recipe.preBoilVolGal,
    postBoil: derived.postBoilMeasuredGal,
    ferment: recipe.fermentVolGal,
  };
  for (const [kind, label] of MEASUREMENTS) {
    const tempF = recipe.measurementTempF?.[kind];
    if (blank(tempF)) {
      names.push(`${label} measurement temperature`);
    } else if (blank(derived.refVolumesGal[kind]) && !blank(measured[kind])) {
      names.push(`${label} measurement temperature (outside the correction's range)`);
    }
  }
  return names;
}

/** The line under the stats bar for `names`, or null when none is empty. */
export function emptyFieldsLine(names) {
  if (names.length === 0) return null;
  const them = names.length === 1 ? 'it' : 'them';
  return `Empty: ${names.join(', ')} — figures that depend on ${them} show —`;
}
