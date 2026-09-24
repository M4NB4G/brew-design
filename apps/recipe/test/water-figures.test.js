// water-figures.test.js
// Scenarios for the Water tab item 1, "Water figures through the front door"
// (scope table agreed 2026-09-23, docs/items/water-tab.md), named from its
// sentences W-S2, W-S3, W-S4, W-S5 and W-S7 and decisions W3, W4, W5. The
// water chemistry is Brew Water Chem's, line for line, in the engine; the
// expected figures here are the engine called directly the way the water
// app's screens called it (its App.jsx, WaterInTab.jsx and RecipeTab.jsx),
// never the selector's own output. Nothing is on screen in item 1: the
// screens and the live water app are item 2 and the far end.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from '@brew/engine';
import {
  STYLE_FAMILIES,
  SALT_CONTRIBUTIONS_PER_G_GAL,
  ACIDS,
  acidCapacity,
  acidContribution,
  applyAcids,
  solveAdditions,
  predictFinalProfile,
  residualAlkalinity,
  sulfateChlorideRatio,
  ratioCharacter,
  GALLONS_PER_BBL,
} from '@brew/engine';
import { computeRecipe } from '../src/selectors.js';
import { defaultRecipeState } from '../src/state.js';
import { savePersisted, STORAGE_KEY } from '../src/persistence.js';
import { recipeSheet } from '../src/components/recipe-sheet-data.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(APP, 'src');

// Imported inside each scenario so that, before the water selector exists,
// each scenario fails on its own rather than the whole file failing to load.
const water = async () => {
  const selectors = await import('../src/selectors.js');
  const state = await import('../src/water-state.js');
  return { computeWater: selectors.computeWater, ...state };
};

const SALT_KEYS = Object.keys(SALT_CONTRIBUTIONS_PER_G_GAL);
const ACID_KEYS = Object.keys(ACIDS);
const ZERO_ACIDS = Object.fromEntries(ACID_KEYS.map((k) => [k, 0]));

// Brew Water Chem, WaterInTab.jsx: "Load Example" (Bristlecone Brewing Co.
// sample 20251022-1, HLT) and "RO Water", copied from the water app.
const BWC_EXAMPLE = { Ca: 8, Mg: 2, Na: 22, SO4: 0, Cl: 20, Alkalinity: 50, pH: 7.2 };
const BWC_RO = { Ca: 1, Mg: 1, Na: 1, SO4: 0, Cl: 1, Alkalinity: 5, pH: 6.5 };

// The reference batches the engine's parity test checks against Bru'n Water.
const BATCHES = JSON.parse(
  readFileSync(join(APP, '..', '..', 'packages', 'engine', 'test', 'water', 'reference-batches', 'batches.json'), 'utf8'),
).filter((b) => b.name);

// A water state: the water app's Home defaults with the given entries.
const entries = (patch) => ({
  source: { ...BWC_EXAMPLE },
  styleId: 'hoppy_ale',
  volumeGal: 5,
  raiseAlkSource: 'baking_soda',
  enabledSalts: [...SALT_KEYS],
  saltOverrides: {},
  acidAmounts: null,
  primaryAcid: 'lactic_88',
  multiAcid: false,
  ...patch,
});

// Brew Water Chem's figures for the same entries: its screens' own steps,
// written out here against the engine (App.jsx: the style, the solver, the
// per-salt totals, the equal-strength acid dose; RecipeTab.jsx: the salt list,
// the predicted profile, the acid totals and per-acid mEq, the colour bands;
// WaterInTab.jsx: the source water's status).
function bwc(w) {
  const style = STYLE_FAMILIES.find((s) => s.id === w.styleId) || STYLE_FAMILIES[0];
  const target = { ...style.profile };
  const s = w.source;
  const sourceRatio = sulfateChlorideRatio(s.SO4, s.Cl);
  const out = {
    style,
    source: {
      residualAlkalinity: residualAlkalinity(s.Alkalinity, s.Ca, s.Mg),
      ratio: sourceRatio,
      character: ratioCharacter(sourceRatio),
      alkalinity: s.Alkalinity,
      pH: s.pH,
    },
  };
  const rec = solveAdditions({
    source: s,
    target,
    volumeGallons: w.volumeGal,
    raiseAlkSource: w.raiseAlkSource,
    enabledSalts: new Set(w.enabledSalts),
  });
  const recommendedSalts = {};
  for (const a of rec.additions) recommendedSalts[a.salt] = (recommendedSalts[a.salt] || 0) + a.grams;
  const effectiveSalts = { ...recommendedSalts, ...w.saltOverrides };
  const recommendedMeq = applyAcids(rec.acids, w.volumeGal).total_meq;
  const equivalent = recommendedMeq > 0 ? recommendedMeq / acidCapacity(w.primaryAcid) : 0;
  const userAcids = w.acidAmounts ?? { ...ZERO_ACIDS, [w.primaryAcid]: equivalent };
  const finalIons = predictFinalProfile({
    source: s,
    additions: effectiveSalts,
    acids: userAcids,
    volumeGallons: w.volumeGal,
  });
  const finalRA = residualAlkalinity(finalIons.Alk, finalIons.Ca, finalIons.Mg);
  const finalRatio = sulfateChlorideRatio(finalIons.SO4, finalIons.Cl);
  // RecipeTab.jsx's statColor and raColor, colour by colour.
  const statColor = (val, tgt) => {
    const off = Math.abs(val - tgt);
    const pct = tgt !== 0 ? (off / Math.abs(tgt)) * 100 : 0;
    return pct < 20 ? 'near' : pct < 50 ? 'off' : 'far';
  };
  const raOff = Math.abs(finalRA - target.RA);
  const displayed = [...Object.keys({ ...recommendedSalts, ...effectiveSalts }), ...SALT_KEYS].filter(
    (k, i, arr) => k !== w.raiseAlkSource && arr.indexOf(k) === i && w.enabledSalts.includes(k),
  );
  return {
    ...out,
    target,
    recommendation: rec,
    salts: displayed.map((k) => ({
      key: k,
      name: SALT_CONTRIBUTIONS_PER_G_GAL[k].name,
      recommended: recommendedSalts[k] ?? 0,
      amount: effectiveSalts[k] ?? 0,
      overridden: w.saltOverrides[k] !== undefined,
      reason: rec.additions.find((a) => a.salt === k)?.reason ?? 'User-added salt',
    })),
    raiseSalt: {
      key: w.raiseAlkSource,
      name: SALT_CONTRIBUTIONS_PER_G_GAL[w.raiseAlkSource].name,
      recommended: recommendedSalts[w.raiseAlkSource] ?? 0,
      amount: effectiveSalts[w.raiseAlkSource] ?? recommendedSalts[w.raiseAlkSource] ?? 0,
      overridden: w.saltOverrides[w.raiseAlkSource] !== undefined,
    },
    acid: {
      amounts: userAcids,
      recommendedMeq,
      recommended: equivalent,
      totals: applyAcids(userAcids, w.volumeGal),
      rows: ACID_KEYS.map((k) => {
        const recommended = k === w.primaryAcid ? equivalent : 0;
        return {
          key: k,
          name: ACIDS[k].name,
          amount: userAcids[k] ?? 0,
          meq: acidContribution(k, userAcids[k] ?? 0),
          recommended,
          recommendedMeq: acidContribution(k, recommended),
        };
      }),
    },
    final: {
      ions: finalIons,
      residualAlkalinity: finalRA,
      ratio: finalRatio,
      match: {
        Ca: statColor(finalIons.Ca, target.Ca),
        Mg: statColor(finalIons.Mg, target.Mg),
        Na: statColor(finalIons.Na, target.Na),
        SO4: statColor(finalIons.SO4, target.SO4),
        Cl: statColor(finalIons.Cl, target.Cl),
        Alk: statColor(finalIons.Alk, target.Alk),
        residualAlkalinity: raOff < 20 ? 'near' : raOff < 40 ? 'off' : 'far',
        ratio: statColor(finalRatio, style.so4_cl_target),
      },
    },
  };
}

// The selector's figures against the water app's, field by field.
function expectSameFigures(got, want) {
  expect(got.style).toBe(want.style);
  expect(got.target).toEqual(want.target);
  expect(got.source).toMatchObject(want.source);
  expect(got.recommendation).toEqual(want.recommendation);
  expect(got.salts).toEqual(want.salts);
  expect(got.raiseSalt).toEqual(want.raiseSalt);
  expect(got.acid).toMatchObject(want.acid);
  expect(got.final).toEqual(want.final);
}

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesUnder(path);
    return /\.(js|jsx|mjs)$/.test(path) ? [path] : [];
  });

function engineImports(text) {
  const names = [];
  for (const [, list] of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@brew\/engine['"]/g)) {
    for (const part of list.split(',')) {
      const id = part.trim().split(/\s+as\s+/)[0];
      if (id) names.push(id);
    }
  }
  return names;
}

describe('water figures through the front door', () => {
  it('every water figure equals Brew Water Chem\'s for the same entries', async () => {
    const { computeWater, defaultWaterState, EXAMPLE_SOURCE, RO_SOURCE } = await water();

    // The water app's buttons fill all seven results with its own figures.
    expect(EXAMPLE_SOURCE).toEqual(BWC_EXAMPLE);
    expect(RO_SOURCE).toEqual(BWC_RO);

    // The starting entries are the water app's Home ones (W4: 5 gal), with
    // every test result blank (W5).
    const start = defaultWaterState();
    expect(start).toEqual({ ...entries({}), source: start.source });
    expect(Object.values(start.source).every(Number.isNaN)).toBe(true);
    expect(Object.keys(start.source)).toEqual(['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'Alkalinity', 'pH']);

    // Every style, both ways of raising alkalinity, Home and Pro volumes
    // (5 gal; 10 bbl = 310 gal), for the example water and RO water.
    let cases = 0;
    for (const source of [BWC_EXAMPLE, BWC_RO]) {
      for (const style of STYLE_FAMILIES) {
        for (const raiseAlkSource of ['baking_soda', 'pickling_lime']) {
          for (const volumeGal of [5, 10 * GALLONS_PER_BBL]) {
            const w = entries({ source: { ...source }, styleId: style.id, raiseAlkSource, volumeGal });
            expectSameFigures(computeWater(w), bwc(w));
            cases += 1;
          }
        }
      }
    }
    expect(cases).toBe(2 * 13 * 2 * 2);

    // Salts not on hand, the brewer's own amounts, another acid picked, and
    // several acids at once.
    const variants = [
      entries({ enabledSalts: ['gypsum', 'epsom', 'table_salt', 'baking_soda'] }),
      entries({ enabledSalts: [], styleId: 'stout' }),
      entries({ saltOverrides: { gypsum: 4, chalk: 1.5 } }),
      entries({ styleId: 'ipa', primaryAcid: 'phosphoric_10' }),
      entries({ styleId: 'ipa', source: { ...BWC_EXAMPLE, Alkalinity: 180 }, primaryAcid: 'acidulated_malt' }),
      entries({
        styleId: 'pilsner',
        multiAcid: true,
        acidAmounts: { ...ZERO_ACIDS, lactic_88: 1.5, acidulated_malt: 60, phosphoric_85: 0.5 },
      }),
      entries({ raiseAlkSource: 'pickling_lime', saltOverrides: { pickling_lime: 2 }, styleId: 'porter' }),
    ];
    for (const w of variants) expectSameFigures(computeWater(w), bwc(w));

    // Each reference batch: its water, volume, salts and acids as the brewer's
    // own amounts; the predicted profile is the engine's for those additions.
    const batches = BATCHES.filter((b) => b.source && b.volume_gallons);
    expect(batches.length).toBeGreaterThan(0);
    for (const b of batches) {
      const w = entries({
        source: { pH: NaN, ...b.source },
        volumeGal: b.volume_gallons,
        saltOverrides: { ...b.applied_additions_g },
        acidAmounts: { ...ZERO_ACIDS, ...(b.applied_acids ?? {}) },
        multiAcid: true,
      });
      const got = computeWater(w);
      expectSameFigures(got, bwc(w));
      expect(got.final.ions).toEqual(
        predictFinalProfile({
          source: b.source,
          additions: b.applied_additions_g,
          acids: b.applied_acids ?? {},
          volumeGallons: b.volume_gallons,
        }),
      );
    }
  });

  it('a blank test result blanks the figures that need it, and names the missing results', async () => {
    const { computeWater, defaultWaterState } = await water();

    // Nothing entered: all seven named, in the report's order; no figure.
    const none = computeWater(defaultWaterState());
    expect(none.missing).toEqual(['Ca', 'Mg', 'Na', 'SO4', 'Cl', 'Alkalinity', 'pH']);
    expect(none.source.hasValues).toBe(false);
    for (const k of ['residualAlkalinity', 'ratio', 'alkalinity', 'pH']) expect(none.source[k]).toBeNaN();
    expect(none.source.character).toBeNull();
    expect(none.recommendation).toBeNull();
    expect(none.final).toBeNull();
    for (const s of none.salts) {
      expect(s.recommended).toBeNaN();
      expect(s.amount).toBeNaN();
    }
    expect(none.raiseSalt.recommended).toBeNaN();
    expect(none.acid.recommended).toBeNaN();
    expect(none.acid.recommendedMeq).toBeNaN();
    expect(none.acid.totals.total_meq).toBeNaN();
    expect(none.acid.totals.ppm_alk_reduced).toBeNaN();

    const full = computeWater(entries({}));
    const without = (key) => computeWater(entries({ source: { ...BWC_EXAMPLE, [key]: NaN } }));

    // pH is shown only: a blank pH blanks the pH alone.
    const noPh = without('pH');
    expect(noPh.missing).toEqual(['pH']);
    expect(noPh.source.pH).toBeNaN();
    expect({ ...noPh, missing: [], source: { ...noPh.source, pH: 7.2 } }).toEqual({ ...full, missing: [] });

    // Sodium: the additions need every ion (the solver's sodium cap), so the
    // recommendation, the amounts and the predicted profile are blank; the
    // source water's residual alkalinity and ratio do not need it.
    const noNa = without('Na');
    expect(noNa.missing).toEqual(['Na']);
    expect(noNa.source.residualAlkalinity).toBe(full.source.residualAlkalinity);
    expect(noNa.source.ratio).toBe(full.source.ratio);
    expect(noNa.recommendation).toBeNull();
    expect(noNa.final).toBeNull();
    expect(noNa.acid.recommended).toBeNaN();

    // Chloride: no ratio and no character; residual alkalinity stands.
    const noCl = without('Cl');
    expect(noCl.source.ratio).toBeNaN();
    expect(noCl.source.character).toBeNull();
    expect(noCl.source.residualAlkalinity).toBe(full.source.residualAlkalinity);
    expect(noCl.final).toBeNull();
    // Sulfate blank with no chloride is no ratio either, not an endless one.
    const noSo4 = computeWater(entries({ source: { ...BWC_EXAMPLE, SO4: NaN, Cl: 0 } }));
    expect(noSo4.source.ratio).toBeNaN();
    expect(noSo4.source.character).toBeNull();

    // Calcium, magnesium, alkalinity: no residual alkalinity; the ratio stands.
    for (const key of ['Ca', 'Mg', 'Alkalinity']) {
      const r = without(key);
      expect(r.missing).toEqual([key]);
      expect(r.source.residualAlkalinity).toBeNaN();
      expect(r.source.ratio).toBe(full.source.ratio);
      expect(r.recommendation).toBeNull();
    }
    expect(without('Alkalinity').source.alkalinity).toBeNaN();

    // A zero is a result, not a blank (the example's sulfate is 0).
    expect(full.missing).toEqual([]);
    expect(full.source.hasValues).toBe(true);
    expect(computeWater(entries({ source: { ...BWC_EXAMPLE, Ca: 0 } })).missing).toEqual([]);
  });

  it('the water units follow Home/Pro at the display edge', async () => {
    const display = await import('../src/display.js');

    // W3: one volume in gallons, shown in the mode's unit. 5 gal in Pro is
    // 5 / 31 = 0.1612903 bbl (engine GALLONS_PER_BBL, 31 gal to the barrel);
    // 10 bbl is 310 gal.
    expect(display.volumeFromCanonical(5, 'pro')).toBeCloseTo(0.1612903, 7);
    expect(display.volumeFromCanonical(5, 'home')).toBe(5);
    expect(display.volumeToCanonical(10, 'pro')).toBe(310);

    // W-S4: salts in grams and liquid acid in mL in both modes.
    for (const mode of ['home', 'pro']) {
      expect(display.saltUnit(mode)).toBe('g');
      expect(display.liquidAcidUnit(mode)).toBe('mL');
    }

    // Acidulated malt: canonical grams; Home oz by the engine's G_PER_OZ
    // (28.3495 g), Pro lb by G_PER_LB (16 x 28.3495 = 453.592 g). By hand:
    //   56.699 g = 2 x 28.3495 = 2 oz;   226.796 g = 453.592 / 2 = 0.5 lb;
    //   100 g = 100 / 28.3495 = 3.527399 oz = 100 / 453.592 = 0.2204624 lb.
    expect(display.acidMaltUnit('home')).toBe('oz');
    expect(display.acidMaltUnit('pro')).toBe('lb');
    expect(display.acidMaltFromCanonical(56.699, 'home')).toBeCloseTo(2, 12);
    expect(display.acidMaltFromCanonical(226.796, 'pro')).toBeCloseTo(0.5, 12);
    expect(display.acidMaltFromCanonical(100, 'home')).toBeCloseTo(3.527399, 6);
    expect(display.acidMaltFromCanonical(100, 'pro')).toBeCloseTo(0.2204624, 7);
    expect(display.acidMaltToCanonical(2, 'home')).toBeCloseTo(56.699, 10);
    expect(display.acidMaltToCanonical(0.5, 'pro')).toBeCloseTo(226.796, 10);
    for (const mode of ['home', 'pro']) {
      for (const g of [0, 12.5, 100, 1234.5]) {
        expect(display.acidMaltToCanonical(display.acidMaltFromCanonical(g, mode), mode)).toBeCloseTo(g, 9);
      }
    }
  });

  it('only the front door calls the water chemistry', async () => {
    // The water chemistry the screens need, all engine functions.
    const WATER = [
      'solveAdditions',
      'predictFinalProfile',
      'applyAcids',
      'acidContribution',
      'equivalentAcidDose',
      'saltTotals',
      'residualAlkalinity',
      'sulfateChlorideRatio',
      'ratioCharacter',
      'targetMatch',
      'residualAlkalinityMatch',
      'findStyle',
    ];
    for (const id of WATER) expect(typeof engine[id], id).toBe('function');

    // selectors.js calls every one of them; no other app file imports one.
    expect(engineImports(readFileSync(join(SRC, 'selectors.js'), 'utf8'))).toEqual(expect.arrayContaining(WATER));
    const elsewhere = [];
    const files = filesUnder(SRC);
    for (const file of files) {
      const n = relative(SRC, file).replace(/\\/g, '/');
      if (n === 'selectors.js') continue;
      for (const id of engineImports(readFileSync(file, 'utf8'))) {
        if (WATER.includes(id)) elsewhere.push(`${n}: ${id}`);
      }
    }
    expect(elsewhere).toEqual([]);
    // The scan reaches into the component folders (rule 10's scan is the same walk).
    expect(files.map((f) => relative(SRC, f).replace(/\\/g, '/'))).toContain('components/shared/styles.js');
  });

  it('the recipe\'s figures, saved document and printed sheet are unchanged by any water entry', async () => {
    const { computeWater, defaultWaterState, EXAMPLE_SOURCE } = await water();
    const recipe = defaultRecipeState();
    const store = () => {
      const m = new Map();
      return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), map: m };
    };
    const snapshot = () => {
      const s = store();
      savePersisted(s, { recipe, mode: 'home', proGravityUnit: 'plato' });
      const derived = computeRecipe(recipe);
      return {
        derived: JSON.stringify(derived),
        saved: s.map.get(STORAGE_KEY),
        keys: [...s.map.keys()],
        sheet: JSON.stringify(recipeSheet({ recipe, derived, mode: 'home', proGravityUnit: 'plato', today: new Date(2026, 8, 24) })),
      };
    };
    const before = snapshot();
    const recipeBytes = JSON.stringify(recipe);

    const states = [
      defaultWaterState(),
      { ...defaultWaterState(), source: { ...EXAMPLE_SOURCE } },
      entries({ volumeGal: 310, styleId: 'stout', saltOverrides: { gypsum: 9 } }),
      entries({ multiAcid: true, acidAmounts: { ...ZERO_ACIDS, lactic_88: 3 } }),
    ];
    for (const w of states) {
      const input = JSON.stringify(w);
      computeWater(w);
      // The selector reads its entries and changes none of them.
      expect(JSON.stringify(w)).toBe(input);
    }

    expect(JSON.stringify(recipe)).toBe(recipeBytes);
    expect(snapshot()).toEqual(before);
    expect(before.keys).toEqual([STORAGE_KEY]);
    // No water entry is part of the recipe or its saved document.
    expect(before.saved).not.toMatch(/Alkalinity|saltOverrides|acidAmounts|styleId/);
  });
});
