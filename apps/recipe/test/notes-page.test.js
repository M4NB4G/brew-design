// notes-page.test.js
// Scenarios for "Methods and sources page" (docs/items/notes-page.md, NM-S1
// to NM-S4, decisions NM-Q1 to NM-Q3). A "Notes" link in the footer opens a
// page of methods and sources with a way back to the app; the Water tab keeps
// its own Notes. The page states each method in words with its source, and
// every constant it quotes is read from the engine or pinned here against
// the engine. The suite has no DOM: the footer and the page are drawn with
// renderToStaticMarkup; the click there and back is checked at the far end.

import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  computeGrist,
  PITCH_RATES,
  REFERENCE_TEMP_F,
  MASH_RV_RANGE_QT_PER_LB,
  MASH_R_RANGE_LB_PER_LB,
  MASH_PH_RANGE,
  MASH_PH_TESTED_RANGE,
  WATER_DENSITY_TABLE_C,
  fToC,
} from '@brew/engine';

// The page's module, loaded per scenario (it is new with this item).
const page = () => import('../src/components/NotesPage.jsx');

async function pageHtml(props = {}) {
  const { default: NotesPage } = await page();
  return renderToStaticMarkup(createElement(NotesPage, { onBack: () => {}, ...props }));
}

async function footerHtml() {
  const { default: Footer } = await import('../src/components/Footer.jsx');
  const markup = renderToStaticMarkup(createElement(Footer, { onNotes: () => {} }));
  return markup.match(/<footer\b.*<\/footer>/s)?.[0] ?? '';
}

// The text, tags taken out, spaces run together.
const text = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

describe('methods and sources page', () => {
  // NM-S1
  it('the footer links to the notes page, and the page leads back', async () => {
    const footer = await footerHtml();
    expect(footer).toMatch(/<button[^>]*>Notes<\/button>/);
    expect(text(footer)).toContain('Persyn Chemical Engineering and Consulting');

    const html = await pageHtml();
    expect(html).toMatch(/<button[^>]*>← Back to the recipe<\/button>/);
    expect(text(html)).toMatch(/^Methods and sources/);
  });

  // NM-S2
  it('the page names each method and its source', async () => {
    const t = text(await pageHtml());
    const methods = [
      ['Gravity from the grain bill', /FGDB/, /brewhouse efficiency/, /times its weight in pounds, over the pre-boil volume/],
      ['Bitterness', /Tinseth/, /Zymurgy/, /hop weight times its alpha acid/],
      ['Colour', /Morey/],
      ['Alcohol by volume', /final gravity/, /apparent attenuation/],
      ['Pitch rates and starters', /White and Zainasheff/, /starter/],
      ['Volumes at the reference temperature', /IAPWS-95/],
      ['Water chemistry', /Palmer and Kaminski/, /Kolbach/],
      ['Mash pH', /Troester/, /2009/, /braukaiser\.com/],
      ['Where the recipe math comes from', /Experiments Are Fun Recipe Designer/, /Rev 3/, /Persyn Chemical Engineering/],
    ];
    for (const [heading, ...sources] of methods) {
      expect(t, heading).toContain(heading);
      for (const s of sources) expect(t, `${heading}: ${s}`).toMatch(s);
    }
    // The Water tab keeps its own Notes; the page points to them.
    expect(t).toContain("the Water tab's Notes");
  });

  // NM-S3
  it('every constant the page quotes equals the engine\'s', async () => {
    const t = text(await pageHtml());
    const tC = text(await pageHtml({ temperatureUnit: 'C' }));

    // Read from the engine: the reference temperature in the screen's unit.
    expect(t).toContain(`${REFERENCE_TEMP_F} °F`);
    expect(tC).toContain(`${fToC(REFERENCE_TEMP_F).toFixed(1)} °C`);
    // The density table's span, in °C.
    const temps = Object.keys(WATER_DENSITY_TABLE_C).map(Number);
    expect(t).toContain(`${Math.min(...temps)}–${Math.max(...temps)} °C`);
    // The pitch-rate table, each rate as the engine holds it.
    for (const type of ['ale', 'lager']) {
      for (const density of ['high', 'mod', 'low']) {
        expect(t, `${type} ${density}`).toContain(String(PITCH_RATES[type][density]));
      }
    }
    expect(t).toContain(`${PITCH_RATES.ale.high}, ${PITCH_RATES.ale.mod} and ${PITCH_RATES.ale.low}`);
    expect(t).toContain(`${PITCH_RATES.lager.high}, ${PITCH_RATES.lager.mod} and ${PITCH_RATES.lager.low}`);
    // The mash ranges.
    expect(t).toContain(`${MASH_RV_RANGE_QT_PER_LB.low}–${MASH_RV_RANGE_QT_PER_LB.high} qt/lb`);
    expect(t).toContain(`${MASH_R_RANGE_LB_PER_LB.low}–${MASH_R_RANGE_LB_PER_LB.high} lb/lb`);
    expect(t).toContain(`${MASH_PH_RANGE.low}–${MASH_PH_RANGE.high}`);
    const ra = MASH_PH_TESTED_RANGE.residualAlkalinityMeq;
    const th = MASH_PH_TESTED_RANGE.thicknessLPerKg;
    expect(t).toContain(`${ra.low} to ${ra.high} mEq/L`);
    expect(t).toContain(`${th.low}–${th.high} L/kg`);

    // Written on the page and pinned against the engine: 46 points per pound
    // per gallon. One pound of a malt of FGDB 1 at 100 % efficiency in one
    // gallon gives the engine's 46 points.
    expect(t).toContain('46 points per pound per gallon');
    const g = computeGrist({
      malts: [{ name: 'Sucrose', weightLb: 1, fgdb: 1, colorL: 0 }],
      efficiency: 1,
      preBoilVolGal: 1,
      postBoilVolGal: 1,
      mashWaterGal: 1,
      apparentAttenuation: 0.75,
    });
    expect(g.perMalt[0].perMaltMaxPpg).toBe(46);
    expect(g.perMalt[0].perMaltPoints).toBe(46);

    // No other number on the page: every figure in its text is one of these
    // (the sources' years, IAPWS-95 and the Rev 3 name aside).
    const quoted = [
      String(REFERENCE_TEMP_F),
      ...temps.filter((c) => c === Math.min(...temps) || c === Math.max(...temps)).map(String),
      ...Object.values(PITCH_RATES).flatMap((r) => Object.values(r).map(String)),
      ...[MASH_RV_RANGE_QT_PER_LB, MASH_R_RANGE_LB_PER_LB, MASH_PH_RANGE, ra, th].flatMap((r) => [String(r.low), String(r.high)]),
      '46',
    ];
    const allowed = new Set([...quoted, '1953', '2006', '2009', '2013', '2019', '2022', '3', '95']);
    const numbers = t.match(/-?\d+(\.\d+)?/g) ?? [];
    expect(numbers.filter((n) => !allowed.has(n) && !allowed.has(n.replace(/^-/, '')))).toEqual([]);
  });
});
