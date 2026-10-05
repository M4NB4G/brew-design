// pro-unit-choices.test.js
// Scenarios for the Pro unit choices (docs/items/pro-unit-choices.md, PU-S1
// to PU-S6, decisions PU-Q1' to PU-Q4 and K): in Pro, liquid volumes in
// barrels or gallons and malt weights in pounds or 55 lb sacks, beside the
// gravity unit; the printed sheet in the brewery's set units; both saved
// with the display settings (recipe format 10) and as brewery figures
// (brewery format 5). The suite has no DOM: cards are rendered to markup;
// the header's clicks and the sheet following a change made in another tab
// (K) are proved at the far end in a browser.
//
// Hand pins (1 bbl = 31 gal; 1 sack = 55 lb):
//   3.22 sacks x 55 = 177.1 lb; 177.1 lb = 3 x 55 (165) + 12.1 -> "3 sacks + 12.1 lb"
//   55 lb = 1 sack + 0 lb;  1 lb / 55 = 0.018 -> box 0.02, "0 sacks + 1 lb"
//   380 gal = 380 / 31 = 12.258 bbl; in gallons "380.00"

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  defaultRecipeState,
  DEFAULT_DISPLAY,
  emptyBreweryFigures,
  newRecipe,
  breweryFiguresFromRecipe,
  hasBreweryFigures,
} from '../src/state.js';
import {
  exportRecipeDocument,
  loadPersisted,
  importRecipeFile,
  exportBreweryDocument,
  importBreweryFile,
  loadBrewery,
  SCHEMA_VERSION,
  BREWERY_VERSION,
  STORAGE_KEY,
  BREWERY_KEY,
} from '../src/persistence.js';
import { maltWeightToCanonical, maltWeightFromCanonical } from '../src/display.js';
import Header from '../src/components/Header.jsx';
import * as f from './pro-unit-choices.fixture.js';

const BEFORE = JSON.parse(readFileSync(new URL('./pro-unit-choices.before.json', import.meta.url), 'utf8'));

const GAL = { proVolumeUnit: 'gal', proMaltUnit: 'lb' };
const SACK = { proVolumeUnit: 'bbl', proMaltUnit: 'sack' };
const BBL_LB = { proVolumeUnit: 'bbl', proMaltUnit: 'lb' };

const text = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ');

const values = (markup) => [...markup.matchAll(/<input[^>]*value="([^"]*)"/g)].map((m) => m[1]);

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

const header = (mode, units = {}) =>
  text(
    renderToStaticMarkup(
      createElement(Header, {
        mode,
        onMode: () => {},
        proGravityUnit: 'plato',
        onProGravityUnit: () => {},
        temperatureUnit: 'F',
        onTemperatureUnit: () => {},
        ...units,
        onProVolumeUnit: () => {},
        onProMaltUnit: () => {},
        onReset: () => {},
        onExport: () => {},
        onImportFile: () => {},
        fileMessage: '',
      }),
    ),
  );

// My brewery's two new choices, which "nothing else changes" leaves out.
const withoutNewChoices = (markup) =>
  markup.replace(/<div[^>]*><span[^>]*>Pro (volume|malt weight) unit<\/span><select[\s\S]*?<\/select><\/div>/g, '');

describe('Pro unit choices (docs/items/pro-unit-choices.md)', () => {
  // PU-S1, PU-S2, PU-Q2
  it('Pro volumes in gallons', () => {
    // The two choices sit beside the gravity unit in Pro; Home shows neither.
    expect(header('pro', BBL_LB)).toMatch(/°P SG bbl gal lb sacks/);
    expect(header('home', BBL_LB)).not.toMatch(/bbl|sacks/);

    const r = f.recipe();
    // The Volumes card in Pro gallons is the card at Home: every volume and
    // readout in gallons, to Home's precision.
    expect(f.volumesHtml(r, 'pro', GAL)).toBe(f.volumesHtml(r, 'home', GAL));
    expect(f.volumesHtml(r, 'pro', GAL)).toBe(BEFORE['volumes-home']);
    expect(text(f.volumesHtml(r, 'pro', GAL))).not.toContain('bbl');

    // My brewery's volumes and water setup in gallons, as at Home.
    const opts = f.optionsHtml(f.brewery(), 'pro', GAL);
    expect(opts).toBe(f.optionsHtml(f.brewery(), 'home', GAL));
    expect(text(opts)).toContain('Batch (fermentation) volume (gal)');
    expect(values(opts)).toContain('380');

    // The Water tab's volumes in gallons to 0.01; salts keep Pro's whole grams.
    const water = text(f.waterHtml(r, 'pro', GAL));
    const waterBbl = text(f.waterHtml(r, 'pro', BBL_LB));
    expect(water).not.toMatch(/\bbbl\b/);
    expect(waterBbl).toMatch(/\bbbl\b/);
    expect(values(f.waterHtml(r, 'pro', GAL))).toEqual(expect.arrayContaining(['460', '500', '310']));
    expect(water).toContain('460.00 gal');
    expect(waterBbl).toContain('14.839 bbl'); // 460 / 31 = 14.839

    // The dry-hop rate stays lb/bbl and hop weights stay in pounds.
    expect(f.hopsHtml(r, 'pro', GAL)).toBe(BEFORE.hops);
    expect(text(f.hopsHtml(r, 'pro', GAL))).toContain('lb/bbl');

    // The sheet: every volume as Home prints it; the dry-hop rate lb/bbl.
    const pro = f.sheetData(r, 'pro', GAL);
    const home = f.sheetData(r, 'home', GAL);
    expect(pro.volumes).toEqual(home.volumes);
    expect(pro.volumes.unit).toBe('gal');
    expect(pro.meta.find((m) => m.label === 'Batch volume').value).toBe('380.00 gal');
    expect(pro.water.volumes).toEqual(home.water.volumes);
    expect(pro.water.volumeUnit).toBe('gal');
    expect(pro.hops.dryRateUnit).toBe('lb/bbl');
    expect(pro.hops.weightUnit).toBe('lb');
  });

  // PU-S3, PU-Q1', PU-Q1a, PU-Q1b, PU-Q3
  it('malt weights in sacks', () => {
    // Typed as decimal sacks, stored in pounds: 3.22 x 55 = 177.1.
    expect(maltWeightToCanonical(3.22, 'pro', 'sack')).toBeCloseTo(177.1, 9);
    expect(maltWeightFromCanonical(177.1, 'pro', 'sack')).toBeCloseTo(3.22, 9);
    expect(maltWeightToCanonical(3.22, 'pro', 'lb')).toBe(3.22);
    expect(maltWeightToCanonical(3.22, 'home', 'sack')).toBe(3.22);
    expect(Number.isNaN(maltWeightToCanonical(NaN, 'pro', 'sack'))).toBe(true);

    const r = f.recipe();
    r.malts = [...r.malts, { ...r.malts[0], name: 'New', weightLb: 1 }];
    const grist = f.gristHtml(r, 'pro', SACK);
    expect(text(grist)).toContain('Weight (sacks)');
    expect(values(grist)).toEqual(expect.arrayContaining(['3.22', '1', '0.02']));
    // Whole sacks and the pounds left show beside each box.
    expect(text(grist)).toContain('3 sacks + 12.1 lb');
    expect(text(grist)).toContain('1 sack + 0 lb');
    expect(text(grist)).toContain('0 sacks + 1 lb');

    // Home ignores the choice; hops stay in pounds.
    const plain = f.recipe();
    expect(f.gristHtml(plain, 'home', SACK)).toBe(BEFORE['grist-home']);
    expect(f.hopsHtml(plain, 'pro', SACK)).toBe(BEFORE.hops);

    // The sheet prints the split, not the decimal.
    const s = f.sheetData(plain, 'pro', SACK);
    expect(s.grain.rows.map((row) => row.weight)).toEqual(['3 sacks + 12.10 lb', '1 sack + 0.00 lb']);
    expect(s.grain.weightUnit).toBe('55 lb sacks');
    expect(s.hops.weightUnit).toBe('lb');
  });

  // PU-S4, K
  it('the sheet prints the brewery\'s units', () => {
    const r = f.recipe();
    const brewery = (units) => ({ ...emptyBreweryFigures(), ...units });

    // The brewery's set units win over the screen's for these two choices.
    const set = f.sheetData(r, 'pro', BBL_LB, brewery({ proVolumeUnit: 'gal', proMaltUnit: 'sack' }));
    expect(set.volumes.unit).toBe('gal');
    expect(set.volumes).toEqual(f.sheetData(r, 'home').volumes);
    expect(set.grain.rows[0].weight).toBe('3 sacks + 12.10 lb');

    // Where the brewery has set none, the screen's.
    const screen = f.sheetData(r, 'pro', { proVolumeUnit: 'gal', proMaltUnit: 'sack' }, emptyBreweryFigures());
    expect(screen.volumes.unit).toBe('gal');
    expect(screen.grain.rows[0].weight).toBe('3 sacks + 12.10 lb');

    // One set, one not: each choice on its own.
    const mixed = f.sheetData(r, 'pro', { proVolumeUnit: 'gal', proMaltUnit: 'lb' }, brewery({ proMaltUnit: 'sack' }));
    expect(mixed.volumes.unit).toBe('gal');
    expect(mixed.grain.rows[0].weight).toBe('3 sacks + 12.10 lb');

    // The brewery's barrels and pounds over a screen in gallons and sacks:
    // the sheet as before.
    const back = f.sheetData(r, 'pro', { proVolumeUnit: 'gal', proMaltUnit: 'sack' }, brewery(BBL_LB));
    expect(back).toEqual(BEFORE['sheet-data-pro']);

    // Home prints gallons and pounds, whatever the brewery's Pro choices.
    expect(f.sheetData(r, 'home', BBL_LB, brewery({ proVolumeUnit: 'bbl', proMaltUnit: 'sack' }))).toEqual(
      BEFORE['sheet-data-home'],
    );
  });

  // PU-S5, PU-Q4
  it('the choices are saved and older documents read as barrels and pounds', () => {
    expect(SCHEMA_VERSION).toBe(10);
    expect(BREWERY_VERSION).toBe(5);
    expect(DEFAULT_DISPLAY.proVolumeUnit).toBe('bbl');
    expect(DEFAULT_DISPLAY.proMaltUnit).toBe('lb');

    const r = defaultRecipeState();
    const state = { recipe: r, mode: 'pro', proGravityUnit: 'sg', temperatureUnit: 'C', proVolumeUnit: 'gal', proMaltUnit: 'sack' };
    const doc = JSON.parse(exportRecipeDocument(state));
    expect(doc.version).toBe(10);
    expect(doc.proVolumeUnit).toBe('gal');
    expect(doc.proMaltUnit).toBe('sack');
    const loaded = loadPersisted(memoryStorage({ [STORAGE_KEY]: JSON.stringify(doc) }), defaults());
    expect(loaded.proVolumeUnit).toBe('gal');
    expect(loaded.proMaltUnit).toBe('sack');
    expect(importRecipeFile(JSON.stringify(doc), defaults(), () => true).state.proMaltUnit).toBe('sack');

    // Version 9 and 8 documents read as barrels and pounds.
    const { proVolumeUnit, proMaltUnit, ...v9 } = { ...doc, version: 9 };
    for (const old of [v9, { ...v9, version: 8, temperatureUnit: undefined }]) {
      const read = loadPersisted(memoryStorage({ [STORAGE_KEY]: JSON.stringify(old) }), defaults(), null);
      expect(read, `version ${old.version}`).not.toBeNull();
      expect(read.proVolumeUnit).toBe('bbl');
      expect(read.proMaltUnit).toBe('lb');
    }

    // A version-10 document without the choices, or with others, is unreadable.
    const fallback = { fell: true };
    for (const bad of [{ proVolumeUnit: undefined }, { proMaltUnit: 'kg' }, { proVolumeUnit: 'hl' }, { proMaltUnit: null }]) {
      const d = { ...doc, ...bad };
      expect(loadPersisted(memoryStorage({ [STORAGE_KEY]: JSON.stringify(d) }), defaults(), fallback)).toBe(fallback);
    }
    const newer = importRecipeFile(JSON.stringify({ ...doc, version: 11 }), defaults(), () => true);
    expect(newer.outcome).toBe('refused');
    expect(newer.message).toContain('reads up to version 10');

    // Brewery figures: blank by default; saved and read back; older read blank.
    const e = emptyBreweryFigures();
    expect(e.proVolumeUnit).toBeNull();
    expect(e.proMaltUnit).toBeNull();
    const b = { ...e, proVolumeUnit: 'gal', proMaltUnit: 'sack' };
    expect(hasBreweryFigures({ ...e, proVolumeUnit: 'gal' })).toBe(true);
    expect(hasBreweryFigures({ ...e, proMaltUnit: 'sack' })).toBe(true);
    const bDoc = JSON.parse(exportBreweryDocument(b));
    expect(bDoc.version).toBe(5);
    expect(loadBrewery(memoryStorage({ [BREWERY_KEY]: JSON.stringify(bDoc) }))).toEqual(b);
    const { proVolumeUnit: _v, proMaltUnit: _m, ...v4brewery } = bDoc.brewery;
    for (const version of [4, 3, 2, 1]) {
      const old = memoryStorage({ [BREWERY_KEY]: JSON.stringify({ version, brewery: v4brewery }) });
      const loadedB = loadBrewery(old);
      expect(loadedB.proVolumeUnit, `brewery version ${version}`).toBeNull();
      expect(loadedB.proMaltUnit, `brewery version ${version}`).toBeNull();
      expect(JSON.parse(old.items[BREWERY_KEY]).version).toBe(5);
    }
    for (const bad of [{ proVolumeUnit: 'hl' }, { proMaltUnit: 'kg' }]) {
      const d = { ...bDoc, brewery: { ...bDoc.brewery, ...bad } };
      expect(importBreweryFile(JSON.stringify(d), () => true).outcome).toBe('refused');
    }

    // A new recipe takes the brewery's choices when set, otherwise barrels and pounds.
    expect(newRecipe(b)).toMatchObject({ proVolumeUnit: 'gal', proMaltUnit: 'sack' });
    expect(newRecipe(e)).toMatchObject({ proVolumeUnit: 'bbl', proMaltUnit: 'lb' });
    expect(breweryFiguresFromRecipe(r, 'pro', 'plato', 'F', 'gal', 'sack')).toMatchObject({ proVolumeUnit: 'gal', proMaltUnit: 'sack' });
  });

  // PU-S6
  it('nothing else changes with barrels and pounds', () => {
    const r = f.recipe();
    for (const units of [BBL_LB, {}]) {
      for (const mode of ['home', 'pro']) {
        expect(f.volumesHtml(r, mode, units), `volumes ${mode}`).toBe(BEFORE[`volumes-${mode}`]);
        expect(f.gristHtml(r, mode, units), `grist ${mode}`).toBe(BEFORE[`grist-${mode}`]);
        expect(f.sheetData(r, mode, units), `sheet ${mode}`).toEqual(BEFORE[`sheet-data-${mode}`]);
      }
      expect(f.hopsHtml(r, 'pro', units)).toBe(BEFORE.hops);
      expect(f.waterHtml(r, 'pro', units)).toBe(BEFORE.water);
      expect(withoutNewChoices(f.optionsHtml(f.brewery(), 'pro', units))).toBe(BEFORE.options);
    }

    // The saved documents: as before, at the new versions, with the choices.
    const before = JSON.parse(BEFORE['recipe-document']);
    const after = JSON.parse(exportRecipeDocument({ recipe: r, mode: 'pro', proGravityUnit: 'plato', temperatureUnit: 'F', ...BBL_LB }));
    expect(after).toEqual({ ...before, version: 10, ...BBL_LB });
    const bBefore = JSON.parse(BEFORE['brewery-document']);
    const bAfter = JSON.parse(exportBreweryDocument({ ...f.brewery(), proVolumeUnit: null, proMaltUnit: null }));
    expect(bAfter).toEqual({ version: 5, brewery: { ...bBefore.brewery, proVolumeUnit: null, proMaltUnit: null } });

    // Switching the choices changes no stored figure.
    const inGal = JSON.parse(exportRecipeDocument({ recipe: r, mode: 'pro', proGravityUnit: 'plato', temperatureUnit: 'F', proVolumeUnit: 'gal', proMaltUnit: 'sack' }));
    expect(inGal.recipe).toEqual(after.recipe);
  });
});
