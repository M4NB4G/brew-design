// volumes-card-one-list.test.js
// Scenarios for "The Volumes card and the line under the stats bar read one
// list" (docs/items/volumes-card-one-list.md, VO-S1 to VO-S3, decision VO-Q1
// and K). The line under the stats bar names the Volumes card's empty boxes
// in the order the card shows them, read from one list of the card's rows
// that both share, so a row moved in that list moves on the card and in the
// line together; nothing on screen changes. The suite has no DOM: the card is
// rendered to markup, and where a box sits on it is where its label is in
// that markup. The line's Grist, Yeast and Hops parts keep their own order
// (out of scope). No number is worked out here.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { computeRecipe } from '../src/selectors.js';
import { emptyFields } from '../src/empty-fields.js';
import VolumesSection from '../src/components/VolumesSection.jsx';
import { BOXES, base, setting, capture } from './volumes-card-one-list.fixture.js';

const BEFORE = JSON.parse(readFileSync(new URL('./volumes-card-one-list.before.json', import.meta.url), 'utf8'));

// Each name the line gives a Volumes card box, and that box's label on the
// card as the brewer sees it, in the screen's volume unit `v` (gal or bbl).
const CARD_LABEL = (v) => ({
  'Mash water': `Mash water (${v})`,
  'Pre-boil volume': `Pre-boil volume (${v})`,
  'Pre-boil measurement temperature': 'Pre-boil volume measured at (°F)',
  'Boil-off rate': `Boil-off rate (${v}/hr)`,
  'Boil time': 'Boil time (min)',
  'Post-boil measurement temperature': 'Post-boil volume measured at (°F)',
  'Fermentation volume': `Fermentation volume (${v})`,
  'Wort from kettle': `Wort from kettle (${v})`,
  'Water back': `Water back (${v})`,
  'Water back measurement temperature': 'Water back measured at (°F)',
  'Fermentation measurement temperature': 'Fermentation volume measured at (°F)',
});

const SCREENS = [
  { mode: 'home', v: 'gal' },
  { mode: 'pro', v: 'bbl' },
];

// The card's markup for `recipe`, drawn by `Card` (the card as imported).
function cardHtml(Card, recipe, mode) {
  const d = computeRecipe(recipe);
  return renderToStaticMarkup(
    createElement(Card, {
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
      proVolumeUnit: 'bbl',
      temperatureUnit: 'F',
      setField: () => {},
      setMeasurementTemp: () => {},
      setWaterBack: () => {},
    }),
  );
}

// With every Volumes card box empty: the Volumes boxes the line names, in its
// order, and the same boxes in the order their labels sit on the card.
function lineAndCard(naming, Card, waterBack, mode, v) {
  const recipe = setting(base(waterBack, 'measured'), BOXES, NaN);
  const labels = CARD_LABEL(v);
  const line = naming(recipe, computeRecipe(recipe)).filter((name) => name in labels);
  const html = cardHtml(Card, recipe, mode);
  const at = (name) => html.indexOf(`>${labels[name]}<`);
  const onCard = Object.keys(labels)
    .filter((name) => at(name) >= 0 && (name !== 'Fermentation volume' || waterBack === 'off'))
    .sort((a, b) => at(a) - at(b));
  return { line, onCard };
}

// Row `name` moved to just before row `before`, in whichever part of the
// shared list holds both.
function moved(parts, name, before) {
  return parts.map((part) => {
    const row = part.rows.find((r) => r.name === name);
    if (!row || !part.rows.some((r) => r.name === before)) return part;
    const rows = part.rows.filter((r) => r !== row);
    rows.splice(
      rows.findIndex((r) => r.name === before),
      0,
      row,
    );
    return { ...part, rows };
  });
}

afterEach(() => {
  vi.doUnmock('../src/volumes-card-rows.js');
  vi.resetModules();
});

describe('the Volumes card and the line under the stats bar read one list', () => {
  it("the line's order is the card's order, read from one list", async () => {
    // VO-S1: with the list as it is, every box empty, water back off and on,
    // Home and Pro, the line names every box the card shows, in the card's
    // order (top to bottom, Mash, Boil, Ferment: the phone's one column).
    for (const waterBack of ['off', 'on']) {
      for (const { mode, v } of SCREENS) {
        const { line, onCard } = lineAndCard(emptyFields, VolumesSection, waterBack, mode, v);
        expect(line, `water back ${waterBack}, ${mode}`).toEqual(onCard);
      }
    }

    // VO-S3: a row moved in the shared list moves on the card and in the line
    // together. Boil time moved above the pre-boil volume, and the water
    // back's measurement temperature above the water back.
    vi.resetModules();
    vi.doMock('../src/volumes-card-rows.js', async (importOriginal) => {
      const list = await importOriginal();
      const parts = moved(
        moved(list.VOLUMES_CARD_ROWS, 'Boil time', 'Pre-boil volume'),
        'Water back measurement temperature',
        'Water back',
      );
      return { ...list, VOLUMES_CARD_ROWS: parts };
    });
    const { emptyFields: naming } = await import('../src/empty-fields.js');
    const { default: Card } = await import('../src/components/VolumesSection.jsx');
    const expected = {
      off: [
        'Mash water',
        'Boil time',
        'Pre-boil volume',
        'Pre-boil measurement temperature',
        'Boil-off rate',
        'Post-boil measurement temperature',
        'Fermentation volume',
        'Fermentation measurement temperature',
      ],
      on: [
        'Mash water',
        'Boil time',
        'Pre-boil volume',
        'Pre-boil measurement temperature',
        'Boil-off rate',
        'Post-boil measurement temperature',
        'Wort from kettle',
        'Water back measurement temperature',
        'Water back',
        'Fermentation measurement temperature',
      ],
    };
    for (const waterBack of ['off', 'on']) {
      for (const { mode, v } of SCREENS) {
        const { line, onCard } = lineAndCard(naming, Card, waterBack, mode, v);
        expect(line, `the line, row moved, water back ${waterBack}, ${mode}`).toEqual(expected[waterBack]);
        expect(onCard, `the card, row moved, water back ${waterBack}, ${mode}`).toEqual(expected[waterBack]);
      }
    }
  });

  it('nothing changes on screen', () => {
    // VO-S2: the line's text for each Volumes card box empty alone, every two,
    // all, and each measurement temperature the correction cannot use; and
    // the card's bytes; water back off and on, Home and Pro (barrels and
    // gallons), °F and °C, as captured before the change
    // (volumes-card-one-list.before.json). The other page digests
    // (*.before.json) hold the rest of the page.
    const now = capture();
    expect(now.line).toEqual(BEFORE.line);
    expect(now.card).toEqual(BEFORE.card);
  });
});
