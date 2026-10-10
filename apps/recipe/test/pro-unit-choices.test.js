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
// The Grist card gained its % of total and "Design to target OG" after this
// capture (docs/items/inverse-solver-ui.md, IS-S7): compared without them.
import { withoutTargetOgDesign } from './inverse-solver.fixture.js';
import { docWithBlankPrices } from './blank-prices.js';
import { withoutBoxNames as noNames } from './box-names.fixture.js';
// The weight and volume boxes show the sheet's precision since BA1 (S14).
import { withBoxFiguresAsDrawn as asDrawn } from './box-figures.fixture.js';
import { docWithTarget, sheetWithAimedAcid, withoutAcidCards } from './acid-aim.js';

// Since the engine follows Rev 4 (docs/items/engine-corrections.md, EC-Q7),
// the printed sheet's figures it moves are re-pinned in the captured bytes:
// cells 4660 -> 4710 billion (4.66 -> 4.71 trillion); in Pro, OG 4.32 -> 4.36 °P
// and FG 1.00 -> 1.01 °P. With the IBU's 7489.1 (item 3), Magnum's IBU
// 60.1 -> 60.0 on the sheet and the Hops card.
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
// Since My ingredients (MI-S5'): My brewery lists the brewer's saved
// ingredients, here none.
const withoutMyIngredients = (markup) => markup.replace(/<span[^>]*>My ingredients<\/span><p[^>]*>None saved yet[\s\S]*?<\/p>/, '');
// Since a new recipe at the brewery's batch (NB-S4): this brewery's batch is
// set, 380 gal, so the greyed pre-boil and boil-off are the built-in ones
// scaled to it. By hand: 7 gal x 380/5.5 = 2660/5.5 gal, / 31 = 2660/170.5 =
// 15.601173 bbl; 1.5 gal/hr x 380/5.5 = 570/5.5, / 31 = 570/170.5 = 3.343109
// bbl/hr (six decimals), in place of 7/31 = 0.225806 and 1.5/31 = 0.048387.
const withScaledGreyed = (markup) =>
  markup.replace('placeholder="0.225806"', 'placeholder="15.601173"').replace('placeholder="0.048387"', 'placeholder="3.343109"');

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
    expect(noNames(f.volumesHtml(r, 'pro', GAL))).toBe(noNames(BEFORE['volumes-home']));
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
    expect(noNames(f.hopsHtml(r, 'pro', GAL))).toBe(noNames(BEFORE.hops));
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
    expect(noNames(withoutTargetOgDesign(f.gristHtml(plain, 'home', SACK)))).toBe(noNames(BEFORE['grist-home']));
    expect(noNames(f.hopsHtml(plain, 'pro', SACK))).toBe(noNames(BEFORE.hops));

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
    expect(back).toEqual(sheetWithAimedAcid(BEFORE['sheet-data-pro'], back));

    // Home prints gallons and pounds, whatever the brewery's Pro choices.
    const homeSheet = f.sheetData(r, 'home', BBL_LB, brewery({ proVolumeUnit: 'bbl', proMaltUnit: 'sack' }));
    expect(homeSheet).toEqual(
      sheetWithAimedAcid(BEFORE['sheet-data-home'], homeSheet),
    );
  });

  // PU-S5, PU-Q4
  it('the choices are saved and older documents read as barrels and pounds', () => {
    expect(SCHEMA_VERSION).toBe(12);
    expect(BREWERY_VERSION).toBe(6);
    expect(DEFAULT_DISPLAY.proVolumeUnit).toBe('bbl');
    expect(DEFAULT_DISPLAY.proMaltUnit).toBe('lb');

    const r = defaultRecipeState();
    const state = { recipe: r, mode: 'pro', proGravityUnit: 'sg', temperatureUnit: 'C', proVolumeUnit: 'gal', proMaltUnit: 'sack' };
    const doc = JSON.parse(exportRecipeDocument(state));
    expect(doc.version).toBe(12);
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
    const newer = importRecipeFile(JSON.stringify({ ...doc, version: SCHEMA_VERSION + 1 }), defaults(), () => true);
    expect(newer.outcome).toBe('refused');
    expect(newer.message).toContain(`reads up to version ${SCHEMA_VERSION}`);

    // Brewery figures: blank by default; saved and read back; older read blank.
    const e = emptyBreweryFigures();
    expect(e.proVolumeUnit).toBeNull();
    expect(e.proMaltUnit).toBeNull();
    const b = { ...e, proVolumeUnit: 'gal', proMaltUnit: 'sack' };
    expect(hasBreweryFigures({ ...e, proVolumeUnit: 'gal' })).toBe(true);
    expect(hasBreweryFigures({ ...e, proMaltUnit: 'sack' })).toBe(true);
    const bDoc = JSON.parse(exportBreweryDocument(b));
    expect(bDoc.version).toBe(6);
    expect(loadBrewery(memoryStorage({ [BREWERY_KEY]: JSON.stringify(bDoc) }))).toEqual(b);
    const { proVolumeUnit: _v, proMaltUnit: _m, ...v4brewery } = bDoc.brewery;
    for (const version of [4, 3, 2, 1]) {
      const old = memoryStorage({ [BREWERY_KEY]: JSON.stringify({ version, brewery: v4brewery }) });
      const loadedB = loadBrewery(old);
      expect(loadedB.proVolumeUnit, `brewery version ${version}`).toBeNull();
      expect(loadedB.proMaltUnit, `brewery version ${version}`).toBeNull();
      expect(JSON.parse(old.items[BREWERY_KEY]).version).toBe(6);
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
        const volumes = f.volumesHtml(r, mode, units);
        expect(noNames(volumes), `volumes ${mode}`).toBe(noNames(asDrawn(BEFORE[`volumes-${mode}`], volumes)));
        const grist = withoutTargetOgDesign(f.gristHtml(r, mode, units));
        expect(noNames(grist), `grist ${mode}`).toBe(noNames(asDrawn(BEFORE[`grist-${mode}`], grist)));
        // Since the acid aimed at a mash pH: the acid's figures and the target (AA-S1, AA-S5).
        const sheet = f.sheetData(r, mode, units);
        expect(sheet, `sheet ${mode}`).toEqual(sheetWithAimedAcid(BEFORE[`sheet-data-${mode}`], sheet));
      }
      const hops = f.hopsHtml(r, 'pro', units);
      expect(noNames(hops)).toBe(noNames(asDrawn(BEFORE.hops, hops)));
      // Since the acid aimed at a mash pH: all but the acid's and the predicted profile's cards (AA-S1).
      const water = withoutAcidCards(f.waterHtml(r, 'pro', units));
      expect(noNames(water)).toBe(noNames(asDrawn(withoutAcidCards(BEFORE.water), water)));
      const options = withoutMyIngredients(withoutNewChoices(f.optionsHtml(f.brewery(), 'pro', units)));
      expect(noNames(options)).toBe(noNames(asDrawn(withScaledGreyed(BEFORE.options), options)));
    }

    // The saved documents: as before, at the new versions, with the choices.
    const before = JSON.parse(BEFORE['recipe-document']);
    const after = JSON.parse(exportRecipeDocument({ recipe: r, mode: 'pro', proGravityUnit: 'plato', temperatureUnit: 'F', ...BBL_LB }));
    // Since cost of a batch: version 11, with blank prices (economics EC-S3).
    // Since the acid aimed at a mash pH: version 12, with the target 5.4 (AA-Q4).
    expect(after).toEqual({ ...before, version: 12, recipe: docWithTarget(docWithBlankPrices(before.recipe)), ...BBL_LB });
    const bBefore = JSON.parse(BEFORE['brewery-document']);
    const bAfter = JSON.parse(exportBreweryDocument({ ...f.brewery(), proVolumeUnit: null, proMaltUnit: null }));
    // Since My ingredients: version 6, with none saved (MI-Q8').
    expect(bAfter).toEqual({ version: 6, brewery: { ...bBefore.brewery, proVolumeUnit: null, proMaltUnit: null, ingredients: { malts: [], hops: [] } } });

    // Switching the choices changes no stored figure.
    const inGal = JSON.parse(exportRecipeDocument({ recipe: r, mode: 'pro', proGravityUnit: 'plato', temperatureUnit: 'F', proVolumeUnit: 'gal', proMaltUnit: 'sack' }));
    expect(inGal.recipe).toEqual(after.recipe);
  });
});
