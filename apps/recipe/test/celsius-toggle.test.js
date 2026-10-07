// celsius-toggle.test.js
// Scenarios for the °C display toggle (docs/items/celsius-toggle.md, CT-S1 to
// CT-S6, decisions C-Q1 to C-Q4 and K): a °F/°C choice in the header switches
// every temperature the app shows and takes; the recipe stores °F; boxes take
// tenths, readouts show whole degrees but for the 60 °F reference (15.6 °C);
// the printed sheet follows the screen; the choice is saved with the display
// settings (recipe format 9) and is a brewery figure (brewery format 4).
// The suite has no DOM: cards are rendered to markup, and the header toggle's
// clicks are proved at the far end in a browser.
//
// Hand pins (C = (F - 32) x 5/9, F = C x 9/5 + 32):
//   150 °F: 118 x 5/9 = 65.56 -> box 65.6, readout 66
//   180 °F: 148 x 5/9 = 82.22 -> box 82.2, readout 82
//    68 °F:  36 x 5/9 = 20    -> 20
//    77 °F:  45 x 5/9 = 25    -> 25
//   212 °F: 180 x 5/9 = 100   -> 100
//    60 °F:  28 x 5/9 = 15.56 -> 15.6 (the reference, one decimal)
//    72 °F:  40 x 5/9 = 22.22 -> 22 (A07 Flagship's lab range, 60–72 °F -> 16–22 °C)
//    19 °C: 19 x 1.8 = 34.2, + 32 = 66.2 °F

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { defaultRecipeState, DEFAULT_DISPLAY, emptyBreweryFigures, newRecipe, breweryFiguresFromRecipe, hasBreweryFigures } from '../src/state.js';
import {
  exportRecipeDocument,
  loadPersisted,
  importRecipeFile,
  exportBreweryDocument,
  importBreweryFile,
  saveBrewery,
  loadBrewery,
  SCHEMA_VERSION,
  BREWERY_VERSION,
  STORAGE_KEY,
  BREWERY_KEY,
} from '../src/persistence.js';
import { tempToCanonical } from '../src/display.js';
import { strainInfo, fermTempWarning } from '../src/ingredient-search.js';
import { temperatureChange } from '../src/components/VolumesSection.jsx';
import Header from '../src/components/Header.jsx';
import * as f from './celsius-toggle.fixture.js';
import { docWithBlankPrices } from './blank-prices.js';
import { withoutBoxNames as noNames } from './box-names.fixture.js';

const BEFORE = JSON.parse(readFileSync(new URL('./celsius-toggle.before.json', import.meta.url), 'utf8'));

const text = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');

// The box on the row whose label reads `label`: its value and placeholder.
function box(markup, label) {
  const at = markup.indexOf(`>${label}<`);
  expect(at, `"${label}" is shown`).toBeGreaterThan(-1);
  const tag = markup.slice(at).match(/<input[^>]*>/)[0];
  return { value: tag.match(/value="([^"]*)"/)?.[1], placeholder: tag.match(/placeholder="([^"]*)"/)?.[1] };
}

// Every input's value, in order.
const values = (markup) => [...markup.matchAll(/<input[^>]*value="([^"]*)"/g)].map((m) => m[1]);

// A storage that keeps what it is given.
function memoryStorage(initial = {}) {
  const items = { ...initial };
  return {
    getItem: (k) => (k in items ? items[k] : null),
    setItem: (k, v) => {
      items[k] = String(v);
    },
    removeItem: (k) => {
      delete items[k];
    },
    items,
  };
}

const defaults = () => ({ recipe: defaultRecipeState(), ...DEFAULT_DISPLAY });

// The choices My brewery gained since the capture — the temperature unit and
// Pro's volume and malt weight units — which "nothing else changes" leaves out.
const withoutUnitChoice = (markup) =>
  markup.replace(/<div[^>]*><span[^>]*>(Temperature unit|Pro volume unit|Pro malt weight unit)<\/span><select[\s\S]*?<\/select><\/div>/g, '');
// Since My ingredients (MI-S5'): My brewery lists the brewer's saved
// ingredients, here none.
const withoutMyIngredients = (markup) => markup.replace(/<span[^>]*>My ingredients<\/span><p[^>]*>None saved yet[\s\S]*?<\/p>/, '');

describe('°C display toggle (docs/items/celsius-toggle.md)', () => {
  // CT-S1, C-Q2, CT-S3
  it('every temperature switches', () => {
    const r = f.recipe();

    // The header carries the choice beside Home/Pro, in both modes.
    for (const mode of ['home', 'pro']) {
      const header = text(
        renderToStaticMarkup(
          createElement(Header, {
            mode,
            onMode: () => {},
            proGravityUnit: 'plato',
            onProGravityUnit: () => {},
            temperatureUnit: 'C',
            onTemperatureUnit: () => {},
            onReset: () => {},
            onExport: () => {},
            onImportFile: () => {},
            fileMessage: '',
          }),
        ),
      );
      expect(header).toMatch(/°F °C/);
      expect(header).toMatch(/Pro Home/);
    }

    // Volumes card: the three measurement temperatures, the reference and the
    // measured post-boil readout.
    const vol = f.volumesHtml(r, 'home', 'C');
    expect(box(vol, 'Pre-boil volume measured at (°C)').value).toBe('65.6');
    expect(box(vol, 'Post-boil volume measured at (°C)').value).toBe('82.2');
    expect(box(vol, 'Fermentation volume measured at (°C)').value).toBe('20');
    expect(text(vol)).toContain('corrected to the 15.6 °C reference');
    expect(text(vol)).toContain('Pre-boil volume at 15.6 °C (gal)');
    expect(text(vol)).toContain('Fermentation volume at 15.6 °C (gal)');
    expect(text(vol)).toContain('Post-boil volume at 15.6 °C (gal)');
    expect(text(vol)).toContain('Post-boil volume at 82 °C (gal)');
    expect(vol).not.toContain('°F');

    // Kettle hops: the wort temperature column, 212 and 180 °F.
    const hops = f.hopsHtml(r, 'home', 'C');
    expect(text(hops)).toContain('Temp (°C)');
    expect(values(hops)).toContain('100');
    expect(values(hops)).toContain('82.2');
    expect(hops).not.toContain('°F');

    // Yeast card: the fermentation temperature, the strain's lab range and
    // the warning that names it.
    const yeast = f.yeastHtml(r, 'C');
    expect(box(yeast, 'Fermentation temperature').value).toBe('25');
    expect(text(yeast)).toContain('Fermentation temperature °C');
    expect(text(yeast)).toContain('lab range 16–22 °C');
    expect(text(yeast)).toContain("Outside this strain's lab range, 16–22 °C");
    expect(yeast).not.toContain('°F');
    expect(strainInfo('A07 Flagship', 'C').labRange).toBe('16–22 °C');
    expect(fermTempWarning('A07 Flagship', 77, 'C')).toBe("Outside this strain's lab range, 16–22 °C");

    // My brewery: its three temperatures, a blank one naming the built-in
    // 60 °F as 15.6 °C, and the choice itself.
    const opts = f.optionsHtml(f.brewery(), 'home', 'C');
    expect(box(opts, 'Pre-boil volume measured at (°C)').value).toBe('65.6');
    expect(box(opts, 'Post-boil volume measured at (°C)')).toEqual({ value: '', placeholder: '15.6' });
    expect(box(opts, 'Fermentation volume measured at (°C)')).toEqual({ value: '', placeholder: '15.6' });
    expect(text(opts)).toMatch(/Temperature unit Built-in \(°F\) °F °C/);
  });

  // CT-S2, K (round trip, each kind)
  it('a temperature typed in °C reads back as typed', () => {
    // Stored as the engine's conversion: 19 °C is 66.2 °F (hand pin above).
    expect(tempToCanonical(19, 'C')).toBeCloseTo(66.2, 12);
    expect(tempToCanonical(19, 'F')).toBe(19);
    expect(Number.isNaN(tempToCanonical(NaN, 'C'))).toBe(true);

    // The Volumes card's box: typing 19 in °C stores 66.2 °F; an emptied box is blank.
    const got = [];
    temperatureChange((kind, t) => got.push([kind, t]), 'ferment', 'C')({ target: { value: '19' } });
    temperatureChange((kind, t) => got.push([kind, t]), 'preBoil', 'C')({ target: { value: '' } });
    expect(got[0][0]).toBe('ferment');
    expect(got[0][1]).toBeCloseTo(66.2, 12);
    expect(got[1][0]).toBe('preBoil');
    expect(Number.isNaN(got[1][1])).toBe(true);

    for (const typed of [19, 19.5, 65.6, 0, -2.3, 100]) {
      const stored = tempToCanonical(typed, 'C');
      const r = f.recipe();
      r.measurementTempF = { preBoil: stored, postBoil: stored, ferment: stored };
      r.kettleAdditions = r.kettleAdditions.map((a) => ({ ...a, wortTempF: stored }));
      r.yeast = { ...r.yeast, fermTempF: stored };

      // Saved and read back, through a recipe file, with the choice.
      const doc = exportRecipeDocument({ recipe: r, mode: 'home', proGravityUnit: 'plato', temperatureUnit: 'C' });
      const read = importRecipeFile(doc, defaults(), () => true);
      expect(read.outcome).toBe('replaced');
      expect(read.state.temperatureUnit).toBe('C');
      const back = read.state.recipe;

      // In °C every box reads as typed; switched to °F, the stored °F; back
      // to °C, as typed again.
      const shown = String(typed);
      const vol = f.volumesHtml(back, 'home', 'C');
      for (const label of ['Pre-boil volume measured at (°C)', 'Post-boil volume measured at (°C)', 'Fermentation volume measured at (°C)']) {
        expect(box(vol, label).value, `${label} ${typed}`).toBe(shown);
      }
      expect(values(f.hopsHtml(back, 'home', 'C')).filter((v) => v === shown).length, `hops ${typed}`).toBe(2);
      expect(box(f.yeastHtml(back, 'C'), 'Fermentation temperature').value, `yeast ${typed}`).toBe(shown);

      const inF = Number(box(f.volumesHtml(back, 'home', 'F'), 'Fermentation volume measured at (°F)').value);
      expect(inF).toBeCloseTo(typed * 1.8 + 32, 6);
      expect(box(f.volumesHtml(back, 'home', 'C'), 'Fermentation volume measured at (°C)').value).toBe(shown);

      // The brewery's temperatures, saved and read back in this browser.
      const storage = memoryStorage();
      saveBrewery(storage, { ...emptyBreweryFigures(), measurementTempF: { preBoil: stored, postBoil: stored, ferment: stored }, temperatureUnit: 'C' });
      const b = loadBrewery(storage);
      expect(b.temperatureUnit).toBe('C');
      const opts = f.optionsHtml(b, 'home', 'C');
      expect(box(opts, 'Pre-boil volume measured at (°C)').value, `brewery ${typed}`).toBe(shown);
    }
  });

  // CT-S4, C-Q4
  it('the sheet prints the screen\'s unit', () => {
    const r = f.recipe();
    const c = f.sheetData(r, 'home', 'C');
    expect(c.hops.tempUnit).toBe('°C');
    expect(c.hops.kettle.map((a) => a.temp)).toEqual(['100', '82']);
    expect(c.yeast.tempUnit).toBe('°C');
    expect(c.yeast.fermTemp).toBe('25');
    const rows = Object.fromEntries(c.volumes.rows.map((row) => [row.key, row]));
    expect(rows.preBoil.tempNote).toBe('measured at 66 °C');
    expect(rows.postBoil.tempNote).toBe('measured at 82 °C');
    expect(rows.postBoil.value).toMatch(/ at 15\.6 °C\)$/);
    expect(rows.ferment.tempNote).toBe('measured at 20 °C');
    expect(JSON.stringify(c)).not.toContain('°F');

    // With every temperature at the reference, the post-boil label names it.
    const atRef = defaultRecipeState();
    const ref = f.sheetData(atRef, 'home', 'C');
    expect(ref.volumes.rows.find((row) => row.key === 'postBoil').label).toBe('Post-boil volume at 15.6 °C');

    // The sheet as drawn: the hop and yeast headings carry °C.
    const html = text(f.sheetHtml(r, 'home', 'C'));
    expect(html).toContain('Temp (°C)');
    expect(html).toContain('Fermentation temp (°C)');
    expect(html).not.toContain('°F');
  });

  // CT-S5, C-Q1, PU-Q4
  it('the choice is saved and older documents read as °F', () => {
    expect(SCHEMA_VERSION).toBe(11);
    expect(BREWERY_VERSION).toBe(6);
    expect(DEFAULT_DISPLAY.temperatureUnit).toBe('F');

    // Saved with the display settings, read back as saved.
    const r = defaultRecipeState();
    const doc = JSON.parse(exportRecipeDocument({ recipe: r, mode: 'pro', proGravityUnit: 'sg', temperatureUnit: 'C' }));
    expect(doc.version).toBe(11);
    expect(doc.temperatureUnit).toBe('C');
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify(doc) });
    expect(loadPersisted(storage, defaults()).temperatureUnit).toBe('C');

    // A version-8 document (no choice) reads as °F; so does a version-7 one.
    const { temperatureUnit, ...v8 } = { ...doc, version: 8 };
    expect(loadPersisted(memoryStorage({ [STORAGE_KEY]: JSON.stringify(v8) }), defaults()).temperatureUnit).toBe('F');
    const v7 = { ...v8, version: 7, recipe: { ...v8.recipe, water: { ...v8.recipe.water } } };
    delete v7.recipe.water.acidPlace;
    const read7 = loadPersisted(memoryStorage({ [STORAGE_KEY]: JSON.stringify(v7) }), defaults(), null);
    expect(read7).not.toBeNull();
    expect(read7.temperatureUnit).toBe('F');

    // A version-9 document whose choice is missing or not a unit is unreadable.
    const fallback = { fell: true };
    for (const bad of [undefined, 'K', null, 1]) {
      const d = { ...doc, temperatureUnit: bad };
      expect(loadPersisted(memoryStorage({ [STORAGE_KEY]: JSON.stringify(d) }), defaults(), fallback)).toBe(fallback);
    }
    // A later version is refused as newer.
    const newer = importRecipeFile(JSON.stringify({ ...doc, version: SCHEMA_VERSION + 1 }), defaults(), () => true);
    expect(newer.outcome).toBe('refused');
    expect(newer.message).toContain(`reads up to version ${SCHEMA_VERSION}`);

    // A brewery figure: saved, read back, blank by default and in a version-1 to 3 document.
    expect(emptyBreweryFigures().temperatureUnit).toBeNull();
    const b = { ...emptyBreweryFigures(), temperatureUnit: 'C' };
    expect(hasBreweryFigures(b)).toBe(true);
    const bDoc = JSON.parse(exportBreweryDocument(b));
    expect(bDoc.version).toBe(6);
    expect(bDoc.brewery.temperatureUnit).toBe('C');
    expect(importBreweryFile(JSON.stringify(bDoc), () => true).brewery.temperatureUnit).toBe('C');
    const bStorage = memoryStorage({ [BREWERY_KEY]: JSON.stringify(bDoc) });
    expect(loadBrewery(bStorage).temperatureUnit).toBe('C');
    const { temperatureUnit: _, ...v3brewery } = bDoc.brewery;
    for (const version of [3, 2, 1]) {
      const old = memoryStorage({ [BREWERY_KEY]: JSON.stringify({ version, brewery: v3brewery }) });
      const loaded = loadBrewery(old);
      expect(loaded.temperatureUnit, `brewery version ${version}`).toBeNull();
      expect(JSON.parse(old.items[BREWERY_KEY]).version).toBe(6);
    }
    for (const bad of ['K', 1]) {
      const d = { ...bDoc, brewery: { ...bDoc.brewery, temperatureUnit: bad } };
      expect(importBreweryFile(JSON.stringify(d), () => true).outcome).toBe('refused');
    }

    // A new recipe takes the brewery's choice when set, otherwise °F.
    expect(newRecipe(b).temperatureUnit).toBe('C');
    expect(newRecipe(emptyBreweryFigures()).temperatureUnit).toBe('F');
    expect(breweryFiguresFromRecipe(r, 'home', 'plato', 'C').temperatureUnit).toBe('C');
  });

  // CT-S6
  it('nothing else changes in °F', () => {
    const r = f.recipe();
    for (const mode of ['home', 'pro']) {
      expect(noNames(f.volumesHtml(r, mode, 'F')), `volumes ${mode}`).toBe(noNames(BEFORE[`volumes-${mode}`]));
      expect(f.sheetData(r, mode, 'F'), `sheet ${mode}`).toEqual(BEFORE[`sheet-data-${mode}`]);
    }
    expect(noNames(f.hopsHtml(r, 'home', 'F'))).toBe(noNames(BEFORE.hops));
    expect(noNames(f.yeastHtml(r, 'F'))).toBe(noNames(BEFORE.yeast));
    expect(noNames(withoutMyIngredients(withoutUnitChoice(f.optionsHtml(f.brewery(), 'home', 'F'))))).toBe(noNames(BEFORE.options));

    // The saved documents: as before, at the new versions, with the choice.
    const before = JSON.parse(BEFORE['recipe-document']);
    const after = JSON.parse(exportRecipeDocument({ recipe: r, mode: 'home', proGravityUnit: 'plato', temperatureUnit: 'F' }));
    // Since cost of a batch: version 11, with blank prices (economics EC-S3).
    expect(after).toEqual({ ...before, version: 11, recipe: docWithBlankPrices(before.recipe), temperatureUnit: 'F', proVolumeUnit: 'bbl', proMaltUnit: 'lb' });
    const bBefore = JSON.parse(BEFORE['brewery-document']);
    const bAfter = JSON.parse(exportBreweryDocument({ ...f.brewery(), temperatureUnit: null }));
    // Since My ingredients: version 6, with none saved (MI-Q8').
    expect(bAfter).toEqual({
      version: 6,
      brewery: { ...bBefore.brewery, temperatureUnit: null, proVolumeUnit: null, proMaltUnit: null, ingredients: { malts: [], hops: [] } },
    });

    // Switching the unit changes no stored figure: the recipe saved in °C is
    // the recipe saved in °F, but for the choice.
    const inC = JSON.parse(exportRecipeDocument({ recipe: r, mode: 'home', proGravityUnit: 'plato', temperatureUnit: 'C' }));
    expect(inC.recipe).toEqual(after.recipe);
  });
});
