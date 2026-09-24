// water-tab.test.js
// Scenarios for the Water tab item 2, "Water tab screens" (scope table
// agreed 2026-09-23, docs/items/water-tab.md), named from its sentences W-S1,
// W-S4, W-S6, W-S7, decisions W2, W3, W5, W6, W7, W8 and the ordering row K.
// The suite has no browser DOM, so the screens are rendered to markup with
// react-dom/server (as footer.test.js does) and the entries are changed
// through the Water tab's own state steps (water-state.js). The wording is
// Brew Water Chem's (its src/components/tabs/*.jsx); the figures are the
// front door's (item 1), shown at the water app's precision. Layout, phone
// width, Print and a real reload are the far end.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STYLE_FAMILIES, SALT_CONTRIBUTIONS_PER_G_GAL, ACIDS } from '@brew/engine';
import { computeWater } from '../src/selectors.js';
import { defaultWaterState, EXAMPLE_SOURCE } from '../src/water-state.js';
import { defaultRecipeState, emptyBreweryFigures } from '../src/state.js';
import { savePersisted, saveBrewery, STORAGE_KEY, BREWERY_KEY } from '../src/persistence.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const ACID_KEYS = Object.keys(ACIDS);
const ZERO_ACIDS = Object.fromEntries(ACID_KEYS.map((k) => [k, 0]));

// Imported inside each scenario so that, before the screens exist, each
// scenario fails on its own rather than the whole file failing to load.
const steps = () => import('../src/water-state.js');
const renderWater = async (water, screen, mode = 'home') => {
  const { default: WaterTab } = await import('../src/components/water/WaterTab.jsx');
  return renderToStaticMarkup(
    createElement(WaterTab, {
      water,
      figures: computeWater(water),
      mode,
      screen,
      onScreen: () => {},
      setWater: () => {},
    }),
  );
};
const text = (markup) =>
  markup
    .replace(/<!--[^>]*-->/g, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ');

const example = () => ({ ...defaultWaterState(), source: { ...EXAMPLE_SOURCE } });

describe('water tab screens', () => {
  it('the Water tab carries the four screens in the water app\'s order and wording', async () => {
    // W2: a Water tab in the top row beside Recipe and Options.
    const { default: TabBar } = await import('../src/components/TabBar.jsx');
    const bar = text(renderToStaticMarkup(createElement(TabBar, { tab: 'water', onTab: () => {} })));
    expect(bar.trim().split(' ')).toEqual(['Recipe', 'Water', 'Options']);

    // The second row: the water app's four screens, its "Recipe" renamed.
    const water = text(await renderWater(example(), 'water'));
    expect(water).toMatch(/Water In Style Salts & Acid Notes/);
    expect(water).not.toMatch(/\bRecipe\b/);

    // Water In, as WaterInTab.jsx.
    for (const words of [
      'Enter values directly from your water test report.',
      'Inputs match the bottom rows of the Persyn Chemical Engineering test results table (ion concentrations, not Hardness as CaCO₃). Total Alkalinity is the only value reported as CaCO₃.',
      'Source Water Test Results',
      'Load Example',
      'RO Water',
      'Calcium Ion ppm',
      'Magnesium Ion ppm',
      'Sodium Ion ppm',
      'Sulfate Ion (SO₄²⁻) ppm',
      'Chloride Ion ppm',
      'Total Alkalinity ppm as CaCO₃',
      'pH SU',
      'Hardness values from the test report (Total Hardness, Calcium Hardness, Magnesium Hardness) are not required — the calculator uses ion concentrations directly.',
      'Current Status',
      'Source Water',
      'RA per Kolbach (1953): TotalAlk − (Ca/1.4 + Mg/1.7).',
    ]) {
      expect(water).toContain(words);
    }
    // The example water's status, at the water app's precision: RA
    // 50 − (8/1.4 + 2/1.7) = 50 − 6.8908 = 43.1 → "43"; ratio 0/20 = 0 → "0.00";
    // alkalinity "50"; pH "7.2"; character of a ratio under 0.4.
    expect(water).toMatch(/43 Residual Alk \(CaCO₃\)/);
    expect(water).toMatch(/0\.00 SO₄ : Cl ratio/);
    expect(water).toMatch(/50 Alkalinity/);
    expect(water).toMatch(/7\.2 pH/);
    expect(water).toContain('Character: very malty, full.');

    // Style, as StyleTab.jsx: every family, the chosen one's targets.
    const style = text(await renderWater(example(), 'style'));
    expect(style).toContain('BJCP 2021 Style Family');
    for (const s of STYLE_FAMILIES) expect(style).toContain(s.name);
    expect(style).toContain('Target Water Profile (mg/L)');
    // American Pale Ale / Bitter: Ca 70, Mg 15, Na 35, SO4 110, Cl 55, Alk 29, RA −30, 2.00.
    expect(style).toMatch(/Calcium 70 mg\/L Magnesium 15 mg\/L Sodium 35 mg\/L Sulfate 110 mg\/L Chloride 55 mg\/L Alkalinity \(as CaCO₃\) 29 mg\/L/);
    expect(style).toMatch(/Residual Alkalinity \(target\) -30 mg\/L/);
    expect(style).toMatch(/Target SO₄:Cl ratio 2\.00/);
    expect(style).toContain('Ref: Palmer-Kaminski p. 158-159 Table 19');
    expect(style).toContain('Targets from Palmer & Kaminski (2013). RA derived from beer color per Kolbach (1953) — see p. 121, Fig. 5.1. Tweak based on recipe specifics.');

    // Salts & Acid, as RecipeTab.jsx, without its batch sheet or its print
    // button (W7: Print prints the recipe sheet).
    const salts = text(await renderWater(example(), 'salts'));
    for (const words of [
      'Mash Volume',
      'Volume gal',
      'Available Salts',
      'Check the salts you have on hand. The solver will only use enabled salts.',
      'Salt Additions',
      'American Pale Ale / Bitter',
      'Acid Dose',
      'Use multiple acids',
      'Phosphoric acid treated as monoprotic at mash pH 5.4 (pKa₁=2.15, pKa₂=7.20). See Troester (2009), Braukaiser.com.',
      'Alkalinity Raise',
      'Source (if needed)',
      'Baking Soda (NaHCO₃) — adds Na⁺',
      'Pickling Lime (Ca(OH)₂) — adds Ca²⁺',
      'Raise alkalinity to target (adds Na⁺)',
      'Predicted Final Profile',
      'Mash Chemistry',
      'Flavor',
      'RA per Kolbach (1953): Alk − (Ca/1.4 + Mg/1.7), all as CaCO₃.',
    ]) {
      expect(salts).toContain(words);
    }
    for (const s of Object.values(SALT_CONTRIBUTIONS_PER_G_GAL)) expect(salts).toContain(s.name);
    expect(salts).not.toMatch(/Print Batch Sheet|Batch Sheet/);
    // Every recommended salt, at the water app's Home precision (0.1 g), with its reason.
    const f = computeWater(example());
    for (const s of f.salts) {
      expect(salts).toContain(`rec ${s.recommended.toFixed(1)} g`);
      expect(salts).toContain(s.reason);
    }
    // The acid dose line: the recommended lactic dose, and what it neutralises.
    expect(salts).toContain(`rec ${f.acid.recommended.toFixed(0)} mL`);
    if (f.acid.recommendedMeq > 0) {
      expect(salts).toContain(
        `Neutralize ${f.acid.totals.ppm_alk_reduced.toFixed(0)} mg/L alkalinity (${f.acid.totals.total_meq.toFixed(1)} mEq total)`,
      );
    } else {
      expect(salts).toContain('No acid required by solver — adjust if desired.');
    }
    // The predicted profile, each against its target.
    expect(salts).toContain(`${f.final.ions.Ca.toFixed(0)} Calcium tgt 70`);
    expect(salts).toContain(`${f.final.ions.SO4.toFixed(0)} Sulfate tgt 110`);
    expect(salts).toContain(`${f.final.ratio.toFixed(2)} SO₄:Cl Ratio tgt 2.00`);

    // Several acids at once: the water app's multi-acid card.
    const multi = text(await renderWater({ ...example(), multiAcid: true }, 'salts'));
    expect(multi).toContain('Acid Additions');
    expect(multi).toContain('Primary');
    expect(multi).toContain('Add secondary acids (optional)');
    expect(multi).toMatch(/Total acid: \d+\.\d mEq → −\d+ ppm Alk/);

    // Notes, as NotesTab.jsx: every reference and assumption word for word;
    // only the water app's version talk is replaced by where each stands here (W8).
    const notes = text(await renderWater(example(), 'notes'));
    for (const words of [
      'Scientific References & Data Sources',
      'Beer Judge Certification Program. (2021). BJCP Style Guidelines. https://www.bjcp.org/style/2021/',
      'Palmer, J. J., & Kaminski, C. (2013). Water: A Comprehensive Guide for Brewers. Brewers Publications. ISBN 978-0937381991.',
      'Salt ion contributions (Appendix C, p. 263); style water adjustment (Chapter 7, “Adjusting Water for Style,” pp. 139–178).',
      'Palmer, J. J. (2017). How to Brew: Everything You Need to Know to Brew Great Beer Every Time (4th ed.). Brewers Publications. ISBN 978-1938469350.',
      'Kolbach, P. (1953). Der Einfluss des Brauwassers auf die Bierfarbe. Monatsschrift für Brauerei , 6, 167–171.',
      'Residual alkalinity formula: RA = Total Alkalinity − (Ca/1.4 + Mg/1.7), all as CaCO₃.',
      'Janish, S. (2019). The New IPA: Scientific Guide to Hop Aroma and Flavor. Self-published. ISBN 978-0578477862.',
      'CRC Handbook of Chemistry and Physics. CRC Press.',
      'Standard aqueous acid solution densities at 25 °C (e.g., 85% phosphoric acid ≈ 1.685 g/mL).',
      'Application Assumptions',
      'Acidulated malt (Sauermalz) lactic acid content is modeled at 2.0% by weight. Weyermann publishes a range of approximately 1–2%; this app uses 2.0% as a documented, conservative value.',
      'Calcium chloride is modeled as the dihydrate form (CaCl₂·2H₂O), the form most commonly sold for brewing, consistent with Palmer & Kaminski (2013).',
      'Phosphoric acid is treated as effectively monoprotic at mash pH.',
      'Residual alkalinity is calculated per the Kolbach (1953) formulation.',
      'This application calculates salt and acid additions to reach a target ion profile. It does not predict mash pH (which requires grain bill data).',
      'Validation & Methodology',
      "Salt and acid chemistry has been validated against Bru'n Water 1.25 and Palmer's water adjustment spreadsheet across multiple reference water profiles.",
      'Commercial Use & Liability Disclaimer',
      'THIS TOOL IS PROVIDED FOR INFORMATIONAL PURPOSES ONLY.',
      'Compute residual alkalinity per Kolbach (1953)',
      'mEq combines linearly across acids with no cross-terms.',
    ]) {
      expect(notes).toContain(words);
    }
    expect(notes).not.toMatch(/\bv1\.[0-9]|\bv2\b/);
    expect(notes).toContain('water program step 5');
  });

  it('the Water tab says the entries are not saved, and nothing is saved', async () => {
    const s = await steps();

    // Every screen says so (W6).
    for (const screen of ['water', 'style', 'salts', 'notes']) {
      expect(text(await renderWater(defaultWaterState(), screen))).toContain('Not saved yet');
    }

    // A browser's storage holding a saved recipe and brewery figures keeps
    // the same keys and bytes through every water entry.
    const map = new Map();
    const storage = {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, String(v)),
      removeItem: (k) => map.delete(k),
    };
    savePersisted(storage, { recipe: defaultRecipeState(), mode: 'home', proGravityUnit: 'plato' });
    saveBrewery(storage, { ...emptyBreweryFigures(), fermentVolGal: 12 });
    const before = JSON.stringify([...map.entries()]);
    const hadStorage = 'localStorage' in globalThis;
    const saved = globalThis.localStorage;
    globalThis.localStorage = storage;
    try {
      let w = defaultWaterState();
      const current = () => computeWater(w).acid.amounts;
      w = s.fillTestResults(w, EXAMPLE_SOURCE);
      w = s.setTestResult(w, 'Ca', 40);
      w = s.setWaterStyle(w, 'ipa');
      w = s.setWaterVolume(w, 310);
      w = s.setRaiseAlkSource(w, 'pickling_lime');
      w = s.toggleSaltOnHand(w, 'chalk');
      w = s.setSaltAmount(w, 'gypsum', 12);
      w = s.setAcidAmount(w, current(), 'lactic_88', 4);
      w = s.setMultiAcid(w, current(), true);
      w = s.setPrimaryAcid(w, current(), 'phosphoric_10');
      w = s.setMultiAcid(w, current(), false);
      w = s.resetToRecommended(w);
      computeWater(w);
    } finally {
      if (hadStorage) globalThis.localStorage = saved;
      else delete globalThis.localStorage;
    }
    expect(JSON.stringify([...map.entries()])).toBe(before);
    expect([...map.keys()].sort()).toEqual([BREWERY_KEY, STORAGE_KEY].sort());

    // The app saves the recipe and its display settings alone, as before;
    // the water entries reach no save, export or brewery call.
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
    expect(app).toMatch(/savePersisted\(browserStorage\(\), \{ recipe, mode, proGravityUnit \}\);\s*\}, \[recipe, mode, proGravityUnit\]\);/);
    for (const call of app.matchAll(/\b(savePersisted|exportRecipeDocument|saveBrewery|breweryFiguresFromRecipe)\(([^)]*)\)/g)) {
      expect(call[2], call[0]).not.toMatch(/water/i);
    }
    expect(app).toMatch(/useState\(defaultWaterState\)/);
  });

  it('changing the volume, style or salts on hand returns the salt and acid amounts to the recommendation', async () => {
    const s = await steps();
    // The brewer's own amounts: 9 g gypsum and 3 mL lactic.
    const own = {
      ...example(),
      saltOverrides: { gypsum: 9 },
      acidAmounts: { ...ZERO_ACIDS, lactic_88: 3 },
    };
    expect(computeWater(own).customized).toBe(true);

    const followsRecommendation = (w) => {
      const f = computeWater(w);
      expect(w.saltOverrides).toEqual({});
      expect(w.acidAmounts).toBeNull();
      for (const salt of f.salts) expect(salt.amount).toBe(salt.recommended);
      expect(f.raiseSalt.amount).toBe(f.raiseSalt.recommended);
      expect(f.acid.amounts[f.acid.primary]).toBe(f.acid.recommended);
      expect(f.customized).toBe(false);
    };
    followsRecommendation(s.setWaterVolume(own, 10));
    followsRecommendation(s.setWaterStyle(own, 'stout'));
    followsRecommendation(s.toggleSaltOnHand(own, 'epsom'));
    followsRecommendation(s.toggleSaltOnHand(s.toggleSaltOnHand(own, 'epsom'), 'epsom'));
    followsRecommendation(s.setRaiseAlkSource(own, 'pickling_lime'));
    followsRecommendation(s.resetToRecommended(own));

    // As the water app: a new test result returns the acid to the
    // recommendation and keeps the brewer's salts.
    const newResult = s.setTestResult(own, 'Alkalinity', 120);
    expect(newResult.saltOverrides).toEqual({ gypsum: 9 });
    expect(newResult.acidAmounts).toBeNull();
    expect(s.fillTestResults(own, EXAMPLE_SOURCE).acidAmounts).toBeNull();

    // The brewer's own salt keeps the brewer's acid, and the other way round.
    expect(s.setSaltAmount(own, 'epsom', 1).acidAmounts).toEqual(own.acidAmounts);
    const acidOwn = s.setAcidAmount(own, computeWater(own).acid.amounts, 'lactic_88', 5);
    expect(acidOwn.saltOverrides).toEqual({ gypsum: 9 });
    expect(acidOwn.acidAmounts.lactic_88).toBe(5);

    // Salts on hand: turning one off and on again leaves the same set.
    expect(s.toggleSaltOnHand(s.toggleSaltOnHand(own, 'epsom'), 'epsom').enabledSalts.sort()).toEqual(
      [...own.enabledSalts].sort(),
    );
    expect(s.toggleSaltOnHand(own, 'epsom').enabledSalts).not.toContain('epsom');

    // One acid: picking another shows the recommendation in it (same mEq).
    const hard = { ...defaultWaterState(), source: { ...EXAMPLE_SOURCE, Alkalinity: 150 } };
    const picked = s.setPrimaryAcid(hard, computeWater(hard).acid.amounts, 'phosphoric_10');
    const pf = computeWater(picked);
    expect(pf.acid.primary).toBe('phosphoric_10');
    expect(pf.acid.amounts.phosphoric_10).toBe(pf.acid.recommended);
    expect(pf.acid.amounts.lactic_88).toBe(0);
    expect(pf.acid.recommendedMeq).toBeGreaterThan(0);
    // Several acids: picking another primary keeps every amount.
    const multi = s.setMultiAcid(hard, computeWater(hard).acid.amounts, true);
    const mf = computeWater(multi).acid.amounts;
    const relabelled = s.setPrimaryAcid(multi, mf, 'phosphoric_10');
    expect(computeWater(relabelled).acid.amounts).toEqual(mf);
    // Back to one acid: only the primary's amount stays.
    const one = s.setMultiAcid(
      relabelled,
      { ...mf, acidulated_malt: 50 },
      false,
    );
    expect(one.multiAcid).toBe(false);
    expect(one.acidAmounts).toEqual({ ...ZERO_ACIDS, phosphoric_10: mf.phosphoric_10 ?? 0 });
  });

  it('a blank test result shows "—" and the tab names the missing results', async () => {
    // Nothing entered: all seven named; no source status card; the Salts &
    // Acid figures show "—" (W5, W-S7).
    const none = text(await renderWater(defaultWaterState(), 'water'));
    expect(none).toContain(
      'Blank test results: Calcium Ion, Magnesium Ion, Sodium Ion, Sulfate Ion (SO₄²⁻), Chloride Ion, Total Alkalinity, pH',
    );
    expect(none).not.toContain('Current Status');
    const noneSalts = text(await renderWater(defaultWaterState(), 'salts'));
    expect(noneSalts).toContain('Blank test results:');
    expect(noneSalts).toContain('rec — g');
    expect(noneSalts).toContain('rec — mL');
    expect(noneSalts).toMatch(/— Calcium tgt 70/);
    expect(noneSalts).toMatch(/— SO₄:Cl Ratio tgt 2\.00/);
    // An empty result box is empty, not 0.
    expect(await renderWater(defaultWaterState(), 'water')).not.toMatch(/<input[^>]*value="0"/);

    // Chloride blank in the example water: named alone; the ratio "—".
    const noCl = { ...example(), source: { ...EXAMPLE_SOURCE, Cl: NaN } };
    const w = text(await renderWater(noCl, 'water'));
    expect(w).toContain('Blank test results: Chloride Ion');
    expect(w).toMatch(/— SO₄ : Cl ratio/);
    expect(w).toContain('Character: —.');
    expect(w).toMatch(/43 Residual Alk \(CaCO₃\)/);
    // Everything entered: no line.
    expect(text(await renderWater(example(), 'water'))).not.toContain('Blank test results');
  });

  it('the water volume and acidulated malt show in the Home/Pro unit', async () => {
    // W3: the one volume, 5 gal, shows as 5 / 31 = 0.161290 bbl in Pro;
    // salts stay g and liquid acid mL; the water app's Pro precision (1 g).
    const pro = await renderWater(example(), 'salts', 'pro');
    expect(text(pro)).toContain('Volume bbl');
    expect(pro).toMatch(/value="0\.16129/);
    expect(text(pro)).not.toContain('Volume gal');
    const f = computeWater(example());
    for (const s of f.salts) expect(text(pro)).toContain(`rec ${s.recommended.toFixed(0)} g`);
    const home = await renderWater(example(), 'salts', 'home');
    expect(home).toMatch(/value="5"/);

    // Acidulated malt picked: oz at Home, lb in Pro (the dose in grams
    // shown by the engine's G_PER_OZ, G_PER_LB — pinned in water-figures.test.js).
    const malt = { ...defaultWaterState(), source: { ...EXAMPLE_SOURCE, Alkalinity: 150 }, primaryAcid: 'acidulated_malt' };
    expect(text(await renderWater(malt, 'salts', 'home'))).toMatch(/rec \d+\.\d\d oz/);
    expect(text(await renderWater(malt, 'salts', 'pro'))).toMatch(/rec \d+\.\d\d lb/);
  });
});
