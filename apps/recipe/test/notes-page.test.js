// notes-page.test.js
// Scenarios for the References page (docs/items/references-page.md, RF-S1 to
// RF-S8, decisions RF-Q1 to RF-Q13), which replaces the methods and sources
// page of docs/items/notes-page.md. A "References" link in the footer opens a
// page that shows, for each model, its equation in symbols, each symbol with
// its unit, and its citation, with a way back to the app. The file keeps the
// name NotesPage.jsx because App.jsx, a Tier B file, imports it by that name.
//
// The coefficients the engine does not export are written on the page, from
// one list the page exports (COEFFICIENTS); the scenarios below evaluate each
// equation with that list and compare the result with the engine's own
// (RF-S5), so a coefficient typed wrong on the page fails here. What the
// engine exports (pitch rates, ranges, the density table, the reference
// temperature, the unit factors) is read from the engine, and is checked
// here by what the page renders.
//
// The suite has no DOM: the footer and the page are drawn with
// renderToStaticMarkup; the click there and back is in accessible-names.test.js
// (it draws the whole app) and at the far end.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  computeGrist,
  computeHops,
  computeCellsNeeded,
  solveStarter,
  sgToPlato,
  platoToSg,
  fToC,
  correctVolumeToRef,
  residualAlkalinity,
  mashPh,
  PITCH_RATES,
  REFERENCE_TEMP_F,
  LITERS_PER_GALLON,
  QT_PER_GAL,
  G_PER_LB,
  MASH_RV_RANGE_QT_PER_LB,
  MASH_R_RANGE_LB_PER_LB,
  MASH_PH_RANGE,
  MASH_PH_TESTED_RANGE,
  WATER_DENSITY_TABLE_C,
  ACIDS,
} from '@brew/engine';

const page = () => import('../src/components/NotesPage.jsx');

async function pageHtml(props = {}) {
  const { default: ReferencesPage } = await page();
  return renderToStaticMarkup(createElement(ReferencesPage, { onBack: () => {}, ...props }));
}

async function footerHtml() {
  const { default: Footer } = await import('../src/components/Footer.jsx');
  const markup = renderToStaticMarkup(createElement(Footer, { onNotes: () => {} }));
  return markup.match(/<footer\b.*<\/footer>/s)?.[0] ?? '';
}

// The page's one list of written coefficients.
async function coefficients() {
  const { COEFFICIENTS } = await page();
  expect(COEFFICIENTS, 'the page exports its list of written coefficients').toBeTypeOf('object');
  return COEFFICIENTS;
}

// The text as a reader sees it: inline tags dropped, a subscript shown as
// "_x" and a superscript as "^x", other tags as a space, spaces run together.
const text = (html) =>
  html
    .replace(/<sub\b[^>]*>/g, '_')
    .replace(/<sup\b[^>]*>/g, '^')
    .replace(/<\/(?:sub|sup)>/g, '')
    .replace(/<\/?(?:em|i|b|strong|span|cite|var|code)\b[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

// The page's cards, by heading: { heading: markup after it }.
function cardsOf(html) {
  const out = {};
  for (const part of html.split(/<h2\b[^>]*>/).slice(1)) {
    const [heading, ...rest] = part.split('</h2>');
    out[text(heading)] = rest.join('</h2>');
  }
  return out;
}

// A symbol's entries in a card: [{ symbol, unit, line }] from its <dt>/<dd> pairs.
function symbolsOf(cardHtml) {
  return [...cardHtml.matchAll(/<dt\b[^>]*>(.*?)<\/dt><dd\b[^>]*>(.*?)<\/dd>/gs)].map(([, dt, dd]) => ({
    symbol: text(dt),
    line: text(dd),
    unit: text(dd).match(/\(([^()]*)\)$/)?.[1],
  }));
}

// A number as the page writes it, with a true minus; a signed term.
const m = (x) => String(x).replace('-', '−');
const plus = (x) => (x < 0 ? `− ${Math.abs(x)}` : `+ ${x}`);

// The citations as the owner's sheet gives them (references-page.md), italics dropped.
const PALMER = 'Palmer, J. J. (2017). How to Brew (4th ed.). Brewers Publications. ISBN 978-1938469350.';
const BREWERS_FRIEND =
  "Brewer's Friend. Plato to SG Conversion Chart (the ASBC polynomial). brewersfriend.com/plato-to-sg-conversion-chart/";
const HALL = "Hall, M. L. (1995). Brew by the Numbers: Add Up What's in Your Beer. Zymurgy, 18(2), Summer 1995.";
const MOREY =
  'Morey, D. (1998). Approximating SRM beer color of homebrew based on recipe formulation. BrewingTechniques, 6(1), 42–46.';
const TINSETH = "Tinseth, G. Glenn's Hop Utilization Numbers. realbeer.com/hops/research.html";
const MEINERS = 'Meiners, L., & Cavanna, M. (2022). Skeptical Brewing, Part 3. Zymurgy, May/June 2022.';
const WHITE =
  'White, C., & Zainasheff, J. (2010). Yeast: The Practical Guide to Beer Fermentation. Brewers Publications.';
const STARTER_CURVES =
  "A quadratic fit to the output of MoreBeer's yeast starter calculator (morebeer.com), by Persyn Chemical Engineering.";
const WAGNER =
  'Wagner, W., & Pruß, A. (2002). The IAPWS formulation 1995 for the thermodynamic properties of ordinary water substance. J. Phys. Chem. Ref. Data, 31(2), 387–535.';
const KOLBACH =
  'Kolbach, P. (1953). Der Einfluss des Brauwassers auf die Bierfarbe. Monatsschrift für Brauerei, 6, 167–171.';
const TROESTER =
  'Troester, K. (2009). The effect of brewing water and grist composition on the pH of the mash. braukaiser.com (archived: web.archive.org/web/20250906010619/https://braukaiser.com/documents/effect_of_water_and_grist_on_mash_pH.pdf). Sections 2, 3.1, 3.3 to 3.6, 3.10;';
const PALMER_KAMINSKI =
  'Palmer, J. J., & Kaminski, C. (2013). Water: A Comprehensive Guide for Brewers. Brewers Publications.';

// A starter band's rule for the cells needed, C, as the page writes it.
const rangeText = (r) =>
  r.to === Infinity
    ? `C ${r.fromIncluded === false ? '>' : '≥'} ${r.from}`
    : `${r.from} ≤ C ${r.toIncluded ? '≤' : '<'} ${r.to}`;
const effectiveText = (r) => (r.takes ? `N = C − ${r.takes}` : 'N = C');

describe('the References page', () => {
  // RF-S1
  it('the footer\'s References link opens the page, and the page leads back', async () => {
    const footer = await footerHtml();
    expect(footer).toMatch(/<button[^>]*>References<\/button>/);
    expect(text(footer)).toContain('Persyn Chemical Engineering and Consulting');

    const html = await pageHtml();
    expect(html).toMatch(/<button[^>]*>← Back to the recipe<\/button>/);
    expect(text(html)).toMatch(/^References/);
    expect(html).toMatch(/<h1\b[^>]*>References<\/h1>/);

    // The link is in the size of the page's back button.
    const sizeOf = (markup, label) =>
      (markup.match(new RegExp(`<button[^>]*>${label}</button>`))?.[0] ?? '').match(/font-size:([^;"]+)/)?.[1];
    expect(sizeOf(footer, 'References')).toBeTruthy();
    expect(sizeOf(footer, 'References')).toBe(sizeOf(html, '← Back to the recipe'));
  });

  // RF-S2, RF-S3
  it('the page shows each model\'s equation with its citation', async () => {
    const k = await coefficients();
    const html = await pageHtml();
    const cards = cardsOf(html);
    const ale = PITCH_RATES.ale;
    const lager = PITCH_RATES.lager;
    const ra = MASH_PH_TESTED_RANGE.residualAlkalinityMeq;
    const th = MASH_PH_TESTED_RANGE.thicknessLPerKg;
    const lactic = ACIDS.acidulated_malt;

    // symbols: [symbol, a piece of the unit in the closing parentheses].
    const models = [
      {
        heading: 'Gravity from the grain bill',
        equations: [
          `points_i = ${k.ppg} × FGDB_i × η × W_i / V_pre`,
          'SG_pre = 1 + Σ points_i / 1000',
          `P(SG) = ${m(k.sgToPlato.c0)} ${plus(k.sgToPlato.c1)} SG ${plus(k.sgToPlato.c2)} SG^2 ${plus(k.sgToPlato.c3)} SG^3`,
          `SG(P) = 1 + P / (${k.platoToSg.a} − (P / ${k.platoToSg.b}) × ${k.platoToSg.c})`,
          'P_pre = P(SG_pre)',
          'P_post = P_pre × V_pre / V_post',
          'OG = SG(P_post)',
        ],
        symbols: [
          [String(k.ppg), 'points per lb per gal'],
          ['1000', 'points'],
          ['points_i', 'points'],
          ['FGDB_i', 'fraction'],
          ['η', 'fraction'],
          ['W_i', 'lb'],
          ['V_pre', 'gal'],
          ['SG_pre', 'SG'],
          ['SG', 'SG'],
          ['P', '°P'],
          ['P_pre', '°P'],
          ['P_post', '°P'],
          ['V_post', 'gal'],
          ['OG', 'SG'],
        ],
        citations: [PALMER, BREWERS_FRIEND],
      },
      {
        heading: 'Final gravity and alcohol by volume',
        equations: [
          'FG = OG − AA × (OG − 1)',
          `ABV = ${k.abv.k} × (OG − FG) / (${k.abv.upper} − OG) × (FG / ${k.abv.divisor})`,
        ],
        symbols: [
          ['OG', 'SG'],
          ['FG', 'SG'],
          ['AA', 'fraction'],
          ['ABV', '%'],
        ],
        citations: [HALL],
      },
      {
        heading: 'Colour',
        equations: ['MCU = Σ L_i × W_i / V_post', `SRM = ${k.morey.k} × MCU^${k.morey.p}`],
        symbols: [
          ['L_i', '°L'],
          ['W_i', 'lb'],
          ['V_post', 'gal'],
          ['MCU', 'lb/gal'],
          ['SRM', 'SRM'],
        ],
        citations: [MOREY],
      },
      {
        heading: 'Bitterness',
        equations: [
          `U(t) = ${k.tinseth.k} × ${k.tinseth.base}^(SG_pre − 1) × (1 − e^(−${k.tinseth.rate} t)) / ${k.tinseth.divisor}`,
          `f(T) = ${k.whirlpool.c2} T^2 ${plus(k.whirlpool.c1)} T ${plus(k.whirlpool.c0)}`,
          `IBU_i = H_i × α_i × U_i × f_i × ${k.mgPerLPerOzPerGal} / V_post`,
          'IBU = Σ IBU_i',
        ],
        symbols: [
          ['U', 'fraction'],
          ['t', 'min'],
          ['U_i', 'fraction'],
          ['SG_pre', 'SG'],
          ['f', 'fraction'],
          ['T', '°F'],
          ['f_i', 'fraction'],
          ['H_i', 'oz'],
          ['α_i', 'fraction'],
          ['V_post', 'gal'],
          [String(k.mgPerLPerOzPerGal), 'mg/L per oz/gal'],
          ['IBU_i', 'IBU'],
          ['IBU', 'IBU'],
        ],
        citations: [TINSETH, MEINERS],
      },
      {
        heading: 'Pitch rates and cells needed',
        equations: [`C = r × P_post × ${LITERS_PER_GALLON} × V_ferm`],
        symbols: [
          ['C', 'billion cells'],
          ['r', 'billion/L/°P'],
          ['P_post', '°P'],
          ['V_ferm', 'gal'],
          [String(LITERS_PER_GALLON), 'L/gal'],
        ],
        citations: [WHITE],
        also: [
          `Ale ${ale.high} ${ale.mod} ${ale.low}`,
          `Lager ${lager.high} ${lager.mod} ${lager.low}`,
          'nearest 10',
        ],
      },
      {
        heading: 'Starters',
        equations: [
          'G(V) = a V^2 + b V + c',
          'V = (−b ± √(b^2 − 4 a (c − N / S))) / (2 a)',
          `m = ${k.starter.dmeGPerL} × V`,
        ],
        symbols: [
          ['G', '×'],
          ['V', 'L'],
          ['a', 'L²'],
          ['b', '/L'],
          ['c', '×'],
          ['N', 'billion cells'],
          ['S', 'billion cells'],
          ['C', 'billion cells'],
          ['m', 'g'],
          [String(k.starter.dmeGPerL), 'g/L'],
        ],
        citations: [STARTER_CURVES, PALMER, "none; the bands are the app's own rule"],
        also: k.starter.bands.flatMap((b) => [
          `${b.band} ${b.packCells} ${m(b.a)} ${m(b.b)} ${m(b.c)}`,
          ...b.ranges.map((r) => `${rangeText(r)}: ${effectiveText(r)}`),
        ]),
      },
      {
        heading: 'Volumes at the reference temperature',
        equations: ['V_ref = V_T × ρ(T_C) / ρ(T_ref)', 'T_C = (T_F − 32) × 5 / 9'],
        symbols: [
          ['V_ref', 'gal'],
          ['V_T', 'gal'],
          ['ρ', 'kg/m³'],
          ['T_C', '°C'],
          ['T_F', '°F'],
          ['T_ref', '°F'],
        ],
        citations: [WAGNER],
        also: Object.entries(WATER_DENSITY_TABLE_C).map(([c, rho]) => `${c} °C: ${rho}`),
      },
      {
        heading: 'Mash thickness',
        equations: [`R_v = ${QT_PER_GAL} × V_mash / W_grain`, `R = ${k.waterLbPerQt} × R_v`],
        symbols: [
          ['R_v', 'qt/lb'],
          ['R', 'lb/lb'],
          ['V_mash', 'gal'],
          ['W_grain', 'lb'],
          [String(QT_PER_GAL), 'qt/gal'],
          [String(k.waterLbPerQt), 'lb/qt'],
        ],
        citations: [PALMER],
        also: [
          `${MASH_RV_RANGE_QT_PER_LB.low}–${MASH_RV_RANGE_QT_PER_LB.high} qt/lb`,
          `${MASH_R_RANGE_LB_PER_LB.low}–${MASH_R_RANGE_LB_PER_LB.high} lb/lb`,
        ],
      },
      {
        heading: 'Residual alkalinity',
        equations: [`RA = Alk − (Ca / ${k.ra.ca} + Mg / ${k.ra.mg})`],
        symbols: [
          ['RA', 'mg/L as CaCO3'],
          ['Alk', 'mg/L as CaCO3'],
          ['Ca', 'mg/L'],
          ['Mg', 'mg/L'],
        ],
        citations: [KOLBACH],
        also: ["the Water tab's Notes"],
      },
      {
        heading: 'Mash pH',
        equations: [
          `EBC = ${k.mashPh.ebcPerLovibond} L − ${k.mashPh.ebcOffset}`,
          `pH_i = ${k.mashPh.baseAtZero} ${plus(k.mashPh.basePerEbc)} EBC_i`,
          `A_i = ${k.mashPh.crystalBase} + ${k.mashPh.crystalPerEbc} EBC_i`,
          `A_i = ${k.mashPh.roastAcidity}`,
          'A_i = 1000 × (1000 x / M)',
          `R_kg = ${LITERS_PER_GALLON} V_mash / (${G_PER_LB} W_grain / 1000)`,
          `pH_grist = Σ_base s_i pH_i + ${k.mashPh.titrationPh} s_sp − ${k.mashPh.specialtySlope} Σ_sp s_i A_i / R_kg`,
          `S(R_kg) = ${k.mashPh.slopePerThickness} R_kg + ${k.mashPh.slopeAtZero}`,
          'pH = pH_grist + S(R_kg) × RA_mEq',
          'pH = pH_grist + S(R_kg) × H + S_a(R_kg) × Alk_mEq',
          `RA_mEq = RA / ${k.mashPh.mgCaCO3PerMeq}`,
          `Alk_mEq = Alk / ${k.mashPh.mgCaCO3PerMeq}`,
          `H = −(Ca / ${k.ra.ca} + Mg / ${k.ra.mg}) / ${k.mashPh.mgCaCO3PerMeq}`,
          `S_a(R_kg) = ${k.mashPh.acidSide} × S(R_kg) / S(${k.mashPh.acidSideThickness})`,
        ],
        symbols: [
          ['L', '°L'],
          ['EBC', 'EBC'],
          ['pH_i', 'pH'],
          ['A_i', 'mEq/kg'],
          ['x', 'fraction'],
          ['M', 'g/mol'],
          ['V_mash', 'gal'],
          ['W_grain', 'lb'],
          ['R_kg', 'L/kg'],
          ['s_i', 'fraction'],
          ['s_sp', 'fraction'],
          ['pH_grist', 'pH'],
          ['S', 'pH L/mEq'],
          ['S_a', 'pH L/mEq'],
          ['RA', 'mg/L as CaCO3'],
          ['Alk', 'mg/L as CaCO3'],
          ['RA_mEq', 'mEq/L'],
          ['Alk_mEq', 'mEq/L'],
          ['H', 'mEq/L'],
          ['pH', 'pH'],
          [String(k.mashPh.mgCaCO3PerMeq), 'mg/L as CaCO3 per mEq/L'],
          [String(G_PER_LB), 'g/lb'],
        ],
        citations: [TROESTER, 'the acid-side slope is the app\'s fit to Table 3.', PALMER_KAMINSKI, 'Troester (2009), Tables 3, 15 and 16.'],
        also: [
          `${MASH_PH_RANGE.low}–${MASH_PH_RANGE.high}`,
          `${m(ra.low)} to ${ra.high} mEq/L`,
          `${th.low}–${th.high} L/kg`,
          `${lactic.weight_fraction_lactic} by weight`,
          `${lactic.mw_lactic} (g/mol)`,
        ],
      },
    ];

    // Dimensional analysis has no card of its own (RF-S3): the cards are the models.
    expect(Object.keys(cards)).toEqual(models.map((x) => x.heading));

    for (const model of models) {
      const card = cards[model.heading];
      const t = text(card);
      for (const eq of model.equations) expect(t, `${model.heading}: ${eq}`).toContain(eq);
      for (const c of model.citations) expect(t, `${model.heading}: citation ${c}`).toContain(c);
      for (const a of model.also ?? []) expect(t, `${model.heading}: ${a}`).toContain(a);

      // Each symbol is defined with its unit in the closing parentheses.
      const defined = symbolsOf(card);
      for (const [symbol, unit] of model.symbols) {
        const found = defined.find((d) => d.symbol === symbol);
        expect(found, `${model.heading}: the symbol ${symbol} is defined`).toBeTruthy();
        expect(found.unit, `${model.heading}: ${symbol} (${found?.line})`).toContain(unit);
      }
    }

    // Every definition on the page ends with a unit.
    const lines = symbolsOf(html);
    expect(lines.length).toBeGreaterThan(60);
    expect(lines.filter((d) => !d.unit).map((d) => `${d.symbol}: ${d.line}`)).toEqual([]);
  });

  // RF-S4
  it('the page does not mention the spreadsheet', async () => {
    const t = text(await pageHtml());
    const mentions = [
      /spreadsheet/i,
      /Recipe Designer/i,
      /Experiments Are Fun/i,
      /\bRev\.? ?[0-9]/i,
      /goal.?seek/i,
      /deviat/i,
      /round.?trip/i,
      /Excel/i,
      /Design to target OG/i,
      /faithful/i,
    ];
    expect(mentions.filter((re) => re.test(t)).map(String)).toEqual([]);
    // The one note about the app's own fit is the acid-side slope's.
    expect(t).toContain("the acid-side slope is the app's fit to Table 3");
  });
});

// RF-S5, RF-S6: the page's written coefficients reproduce the engine's results.
describe('every coefficient on the page reproduces the engine\'s result', () => {
  const near = (a, b, tol = 1e-9) => expect(Math.abs(a - b), `${a} against ${b}`).toBeLessThan(tol);

  const malts = [
    { name: 'Pale', weightLb: 10, fgdb: 0.8, colorL: 2 },
    { name: 'Crystal', weightLb: 1.25, fgdb: 0.74, colorL: 60 },
    { name: 'Roast', weightLb: 0.4, fgdb: 0.7, colorL: 500 },
  ];
  const grists = [
    { malts, efficiency: 0.7, preBoilVolGal: 7, postBoilVolGal: 6, mashWaterGal: 4, apparentAttenuation: 0.77 },
    { malts: malts.slice(0, 2), efficiency: 0.82, preBoilVolGal: 14.5, postBoilVolGal: 12, mashWaterGal: 8.5, apparentAttenuation: 0.7 },
  ];

  it('the gravity chain: extract, SG and °P, boil concentration, FG and ABV, colour, mash thickness', async () => {
    const k = await coefficients();
    const P = (sg) => k.sgToPlato.c0 + k.sgToPlato.c1 * sg + k.sgToPlato.c2 * sg ** 2 + k.sgToPlato.c3 * sg ** 3;
    const SG = (p) => 1 + p / (k.platoToSg.a - (p / k.platoToSg.b) * k.platoToSg.c);
    for (const sg of [1.04, 1.05, 1.09]) near(P(sg), sgToPlato(sg));
    for (const p of [8, 12.5, 22]) near(SG(p), platoToSg(p));

    for (const input of grists) {
      const g = computeGrist(input);
      const { efficiency, preBoilVolGal: vPre, postBoilVolGal: vPost, apparentAttenuation: aa, mashWaterGal } = input;
      const points = input.malts.reduce((s, x) => s + k.ppg * x.fgdb * efficiency * (x.weightLb / vPre), 0);
      const sgPre = 1 + points / 1000;
      near(sgPre, g.preBoilSg);
      const pPre = P(sgPre);
      const pPost = pPre * (vPre / vPost);
      near(pPost, g.postBoilPlato);
      const og = SG(pPost);
      near(og, g.OG);
      const fg = og - aa * (og - 1);
      near(fg, g.FG);
      const abv = k.abv.k * (og - fg) / (k.abv.upper - og) * (fg / k.abv.divisor);
      near(abv, g.ABV * 100);
      const mcu = input.malts.reduce((s, x) => s + (x.colorL * x.weightLb) / vPost, 0);
      near(k.morey.k * mcu ** k.morey.p, g.SRM);
      const grainLb = input.malts.reduce((s, x) => s + x.weightLb, 0);
      const rv = (QT_PER_GAL * mashWaterGal) / grainLb;
      near(rv, g.mashRv);
      near(k.waterLbPerQt * rv, g.mashR);
    }
  });

  it('bitterness: Tinseth utilization, the whirlpool temperature factor and the IBU', async () => {
    const k = await coefficients();
    const U = (t, sgPre) => k.tinseth.k * k.tinseth.base ** (sgPre - 1) * ((1 - Math.exp(-k.tinseth.rate * t)) / k.tinseth.divisor);
    const f = (T) => k.whirlpool.c2 * T * T + k.whirlpool.c1 * T + k.whirlpool.c0;
    const additions = [
      { name: 'Bittering', timeMin: 60, wortTempF: 212, weightOz: 1.5, alphaAcidFraction: 0.12 },
      { name: 'Flavour', timeMin: 15, wortTempF: 180, weightOz: 2, alphaAcidFraction: 0.055 },
      { name: 'Whirlpool', timeMin: 30, wortTempF: 160, weightOz: 3, alphaAcidFraction: 0.09 },
    ];
    for (const [preBoilSg, postBoilVolGal] of [[1.05, 6], [1.07, 12.5]]) {
      const h = computeHops({ kettleAdditions: additions, preBoilSg, postBoilVolGal, dryHops: [], fermentVolGal: 5.5 });
      let sum = 0;
      additions.forEach((a, i) => {
        near(U(a.timeMin, preBoilSg), h.additions[i].utilization);
        near(f(a.wortTempF), h.additions[i].tempFactor);
        const ibu = a.weightOz * a.alphaAcidFraction * U(a.timeMin, preBoilSg) * f(a.wortTempF) * (k.mgPerLPerOzPerGal / postBoilVolGal);
        near(ibu, h.additions[i].ibu);
        sum += ibu;
      });
      expect(Math.round(sum)).toBe(h.totalIBU);
    }
  });

  it('pitch rates and cells needed: the rate times the °P times the litres, to the nearest 10', async () => {
    // Read as the page renders them: the litres per gallon in the equation and
    // the rate table's rows.
    const t = text(cardsOf(await pageHtml())['Pitch rates and cells needed'] ?? '');
    const litresPerGal = Number(t.match(/C = r × P_post × ([\d.]+) × V_ferm/)?.[1]);
    const rates = (type) => (t.match(new RegExp(`${type} ([\\d.]+) ([\\d.]+) ([\\d.]+)`)) ?? []).slice(1).map(Number);
    const [aleHigh, aleMod, aleLow] = rates('Ale');
    const [lagerHigh] = rates('Lager');
    expect(litresPerGal, 'the litres per gallon on the page').toBeGreaterThan(0);
    expect([aleHigh, aleMod, aleLow, lagerHigh], 'the rates on the page').not.toContain(undefined);
    for (const [rate, plato, gal] of [[aleMod, 12.5, 5.5], [lagerHigh, 15.2, 310], [aleLow, 19, 5]]) {
      const cells = Math.round((rate * plato * litresPerGal * gal) / 10) * 10;
      expect(cells).toBe(computeCellsNeeded({ pitchRate: rate, postBoilPlato: plato, fermentVolGal: gal }));
    }
  });

  it('starters: each band\'s curve and limits, and the malt extract per litre', async () => {
    const k = await coefficients();
    const covers = (r, cells) => {
      const lo = r.fromIncluded === false ? cells > r.from : cells >= r.from;
      const hi = r.to === Infinity ? true : r.toIncluded ? cells <= r.to : cells < r.to;
      return lo && hi;
    };
    // The bands present at each cells-needed count, with the limits' neighbours.
    const counts = [249, 250, 300, 399, 400, 450, 499, 500, 699, 700, 750, 799, 800, 900, 1000, 1001, 1100];
    for (const cells of counts) {
      const options = solveStarter(cells);
      for (const band of k.starter.bands) {
        const range = band.ranges.find((r) => covers(r, cells));
        const option = options.find((o) => o.band === band.band);
        expect(Boolean(option), `${band.band} at ${cells}`).toBe(Boolean(range));
        if (!range) continue;
        expect(option.startCells).toBe(band.packCells);
        const n = cells - (range.takes ?? 0);
        const v = option.volumeL;
        // The engine's volume sits on the page's curve at the multiple N / S, as its smaller positive root.
        near(band.a * v * v + band.b * v + band.c, n / band.packCells);
        const disc = band.b ** 2 - 4 * band.a * (band.c - n / band.packCells);
        const roots = [(-band.b + Math.sqrt(disc)) / (2 * band.a), (-band.b - Math.sqrt(disc)) / (2 * band.a)].filter((x) => x > 0);
        near(Math.min(...roots), v);
        near(k.starter.dmeGPerL * v, option.dmeGrams);
      }
    }
  });

  it('the volume at the reference temperature: the ratio of water densities, and °F to °C', async () => {
    // Read as the page renders them: the density table's entries and the
    // factors of the °F to °C equation.
    const t = text(cardsOf(await pageHtml())['Volumes at the reference temperature'] ?? '');
    const table = [...t.matchAll(/(\d+) °C: ([\d.]+)/g)].map(([, c, rho]) => [Number(c), Number(rho)]);
    const [, offset, num, den] = (t.match(/T_C = \(T_F − ([\d.]+)\) × ([\d.]+) \/ ([\d.]+)/) ?? []).map(Number);
    expect(table.length, 'the density table on the page').toBe(Object.keys(WATER_DENSITY_TABLE_C).length);
    expect([offset, num, den], 'the °F to °C factors on the page').not.toContain(undefined);
    const rho = (c) => {
      for (let i = 0; i < table.length - 1; i++) {
        const [c0, r0] = table[i];
        const [c1, r1] = table[i + 1];
        if (c >= c0 && c <= c1) return r0 + ((c - c0) / (c1 - c0)) * (r1 - r0);
      }
      return NaN;
    };
    const toC = (f) => ((f - offset) * num) / den;
    for (const f of [REFERENCE_TEMP_F, 68, 150, 180, 212]) near(toC(f), fToC(f));
    for (const [vol, f] of [[7, 150], [6, 180], [5.5, 68], [310, 60]]) {
      near((vol * rho(toC(f))) / rho(toC(REFERENCE_TEMP_F)), correctVolumeToRef(vol, f), 1e-9);
    }
  });

  it('residual alkalinity: alkalinity less calcium over 1.4 and magnesium over 1.7', async () => {
    const k = await coefficients();
    for (const [alk, ca, mg] of [[180, 45, 12], [20, 120, 30], [-40, 60, 10]]) {
      near(alk - (ca / k.ra.ca + mg / k.ra.mg), residualAlkalinity(alk, ca, mg));
    }
  });

  it('mash pH: the grist, the thickness and the slope, on both sides of zero alkalinity', async () => {
    const k = (await coefficients()).mashPh;
    const ra = (await coefficients()).ra;
    const lactic = ACIDS.acidulated_malt;
    const ebc = (l) => k.ebcPerLovibond * l - k.ebcOffset;
    const slope = (r) => k.slopePerThickness * r + k.slopeAtZero;
    const acidity = (x) => {
      if (Number.isFinite(x.acidityMeqPerKg)) return x.acidityMeqPerKg;
      if (x.type === 'crystal') return k.crystalBase + k.crystalPerEbc * ebc(x.colorL);
      if (x.type === 'roast') return k.roastAcidity;
      return 1000 * ((1000 * lactic.weight_fraction_lactic) / lactic.mw_lactic);
    };
    const evaluate = ({ malts: list, mashWaterGal, water }) => {
      const inMash = list.filter((x) => x.type !== 'none');
      const grain = inMash.reduce((s, x) => s + x.weightLb, 0);
      const rKg = (LITERS_PER_GALLON * mashWaterGal) / ((G_PER_LB / 1000) * grain);
      let grist = 0;
      let spShare = 0;
      let spAcid = 0;
      for (const x of inMash) {
        const s = x.weightLb / grain;
        if (x.type === 'base') {
          const ph = Number.isFinite(x.distilledWaterPh) ? x.distilledWaterPh : k.baseAtZero + k.basePerEbc * ebc(x.colorL);
          grist += s * ph;
        } else {
          spShare += s;
          spAcid += s * acidity(x);
        }
      }
      grist += k.titrationPh * spShare - (k.specialtySlope * spAcid) / rKg;
      const alkMeq = water.Alk / k.mgCaCO3PerMeq;
      if (water.Alk >= 0) {
        const raMeq = (water.Alk - (water.Ca / ra.ca + water.Mg / ra.mg)) / k.mgCaCO3PerMeq;
        return grist + slope(rKg) * raMeq;
      }
      const h = -(water.Ca / ra.ca + water.Mg / ra.mg) / k.mgCaCO3PerMeq;
      const acidSlope = (k.acidSide * slope(rKg)) / slope(k.acidSideThickness);
      return grist + slope(rKg) * h + acidSlope * alkMeq;
    };

    const bill = [
      { type: 'base', weightLb: 9, colorL: 2 },
      { type: 'base', weightLb: 1, colorL: 3.5, distilledWaterPh: 5.71 },
      { type: 'crystal', weightLb: 1, colorL: 60 },
      { type: 'crystal', weightLb: 0.5, colorL: 120, acidityMeqPerKg: 55 },
      { type: 'roast', weightLb: 0.4, colorL: 500 },
      { type: 'acidulated', weightLb: 0.5, colorL: 2 },
      { type: 'none', weightLb: 3, colorL: 40 },
    ];
    const cases = [
      { malts: bill, mashWaterGal: 5, water: { Alk: 120, Ca: 50, Mg: 10 } }, // alkaline water
      { malts: bill, mashWaterGal: 8.5, water: { Alk: 0, Ca: 40, Mg: 5 } }, // zero alkalinity: the published side
      { malts: bill, mashWaterGal: 3, water: { Alk: -80, Ca: 60, Mg: 10 } }, // acid beyond the alkalinity
      { malts: bill.slice(0, 3), mashWaterGal: 4.2, water: { Alk: -150, Ca: 20, Mg: 4 } },
    ];
    for (const c of cases) near(evaluate(c), mashPh(c), 1e-9);
  });

  it('the page renders each written coefficient, and no number that is not one', async () => {
    const k = await coefficients();
    const leaves = (v) =>
      typeof v === 'number' ? (Number.isFinite(v) ? [v] : []) : Array.isArray(v) ? v.flatMap(leaves) : v && typeof v === 'object' ? Object.values(v).flatMap(leaves) : [];
    const written = leaves(k).map((x) => String(Math.abs(x)));
    expect(written.length).toBeGreaterThan(40);

    // The citations are the owner's, in <cite>; every figure outside them is traced.
    const body = (await pageHtml()).replace(/<cite\b.*?<\/cite>/gs, '');
    const bodyC = (await pageHtml({ temperatureUnit: 'C' })).replace(/<cite\b.*?<\/cite>/gs, '');
    const tokens = (t) => t.match(/\d+(\.\d+)?/g) ?? [];
    const seen = new Set(tokens(text(body)));
    for (const w of written) expect(seen.has(w), `the page renders ${w}`).toBe(true);

    const engineValues = [
      REFERENCE_TEMP_F,
      fToC(REFERENCE_TEMP_F).toFixed(1),
      LITERS_PER_GALLON,
      QT_PER_GAL,
      G_PER_LB,
      ...Object.values(PITCH_RATES).flatMap((r) => Object.values(r)),
      ...[MASH_RV_RANGE_QT_PER_LB, MASH_R_RANGE_LB_PER_LB, MASH_PH_RANGE].flatMap((r) => [r.low, r.high]),
      ...[MASH_PH_TESTED_RANGE.residualAlkalinityMeq, MASH_PH_TESTED_RANGE.thicknessLPerKg].flatMap((r) => [r.low, r.high]),
      ...Object.entries(WATER_DENSITY_TABLE_C).flat(),
      ACIDS.acidulated_malt.weight_fraction_lactic,
      ACIDS.acidulated_malt.mw_lactic,
    ].map((x) => String(Math.abs(Number(x))));
    // Definitional unit factors and exponents, where a symbol is defined (RF-S3):
    // 1 and 2 and 3 (the 1 in 1 + x, squares and the cube), 5/9 and 32 (°F to
    // °C), 10 (cells to the nearest 10), 1000 (gravity points to the SG unit,
    // g to kg, mEq to eq).
    const unitFactors = ['1', '2', '3', '5', '9', '10', '32', '1000'];
    const allowed = new Set([...written, ...engineValues, ...unitFactors]);
    for (const t of [text(body), text(bodyC)]) {
      expect(tokens(t).filter((n) => !allowed.has(n))).toEqual([]);
    }
    // In °C the reference reads as the screen's unit.
    expect(text(bodyC)).toContain(`${fToC(REFERENCE_TEMP_F).toFixed(1)} °C`);
    expect(text(body)).toContain(`${REFERENCE_TEMP_F} °F`);
  });
});
