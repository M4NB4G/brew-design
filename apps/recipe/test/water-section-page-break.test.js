// water-section-page-break.test.js
// Scenarios for "The Water Treatment section may break between its tables on
// the printed sheet" (docs/items/water-section-page-break.md), named from its
// sentences PB-S1 to PB-S4. The suite has no page to print, so these read the
// sheet's markup and the print rules in index.css together: an element is kept
// whole on one page when it carries a class the print rules give
// `break-inside: avoid`. Where the page actually breaks is the far end, in
// print preview.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { sheetMarkup } from './water-section-page-break.fixture.js';

const BEFORE = JSON.parse(readFileSync(new URL('./water-section-page-break.before.json', import.meta.url), 'utf8'));

// The classes the print rules keep whole: every class selector in a rule of
// the `@media print` block that carries `break-inside: avoid`.
const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const printRules = (() => {
  const open = css.indexOf('{', css.indexOf('@media print'));
  let depth = 0;
  let i = open;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}' && --depth === 0) break;
  }
  return css.slice(open + 1, i);
})();
const KEEP_WHOLE = [...printRules.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
  .filter(([, , body]) => /break-inside:\s*avoid/.test(body))
  .flatMap(([, selectors]) => selectors.split(',').map((s) => s.trim()))
  .filter((s) => /^\.[\w-]+$/.test(s))
  .map((s) => s.slice(1));
const keepsWhole = (el) => [...el.classList].some((c) => KEEP_WHOLE.includes(c));

const parse = (html) => new JSDOM(html).window.document;
const document = parse(sheetMarkup());
const sections = [...document.querySelectorAll('section')];
const SECTIONS = ['Predicted', 'Grain Bill', 'Water & Volumes', 'Water Treatment', 'Hop Schedule', 'Yeast & Starter', 'Notes'];
const nameOf = (section) => SECTIONS.find((name) => section.textContent.startsWith(name));

// The nearest element above `el`, inside `section`, that is kept whole.
const wholeAbove = (el, section) => {
  for (let n = el.parentElement; n && section.contains(n); n = n.parentElement) if (keepsWhole(n)) return n;
  return null;
};

describe('the Water Treatment section may break between its tables (docs/items/water-section-page-break.md)', () => {
  it('the Water Treatment section may break between its tables, each kept whole', () => {
    // PB-S1, PB-S2: the sheet is the owner's West Coast Pilsner with water
    // back on, so the section prints all four of its tables.
    const water = sections.find((s) => nameOf(s) === 'Water Treatment');
    expect(water).toBeDefined();
    expect(keepsWhole(water)).toBe(false);

    const tables = [...water.querySelectorAll('table')];
    expect(tables).toHaveLength(4); // additions, treated water, kettle water, fermenter

    // Each table sits in a block kept whole that is not the section, and no
    // two tables share one: the page may break between any two of them.
    const blocks = tables.map((t) => wholeAbove(t, water));
    for (const block of blocks) {
      expect(block).not.toBeNull();
      expect(block).not.toBe(water);
    }
    expect(new Set(blocks).size).toBe(4);

    // The first block is the heading, the caption line, the additions table
    // and the mash pH box, so the heading never prints alone at a page's foot.
    const [additions, treated, kettle, fermenter] = blocks;
    expect(additions.textContent.startsWith('Water Treatment')).toBe(true);
    expect(additions.contains(water.querySelector('p'))).toBe(true);
    expect(additions.textContent).toContain('Mash pH (cooled sample),');

    // Each of the other blocks carries the caption that heads its table.
    for (const [block, table] of [[treated, tables[1]], [kettle, tables[2]], [fermenter, tables[3]]]) {
      expect(table.previousElementSibling.tagName).toBe('P');
      expect(block.contains(table.previousElementSibling)).toBe(true);
    }
  });

  it('every other section stays whole', () => {
    // PB-S3: of the sheet's seven sections only Water Treatment may break;
    // and no table anywhere is left to split mid-row.
    expect(sections.map(nameOf)).toEqual(SECTIONS);
    expect(sections.filter((s) => !keepsWhole(s)).map(nameOf)).toEqual(['Water Treatment']);
    for (const table of document.querySelectorAll('table')) {
      let n = table;
      while (n && !keepsWhole(n)) n = n.parentElement;
      expect(n, 'a table with nothing above it kept whole').not.toBeNull();
    }
  });

  it('nothing else on the sheet changes', () => {
    // PB-S4: the sheet as the code drew it before the item (captured then,
    // water-section-page-break.before.json), equal to it now, every figure,
    // every word, in the same order and style, once the keep-whole classes
    // and the blocks that carry them are taken out.
    const plain = (html) => {
      const doc = parse(html);
      for (const el of [...doc.querySelectorAll('*')]) {
        if (el.tagName === 'SECTION') {
          el.removeAttribute('class');
        } else if (keepsWhole(el)) {
          el.replaceWith(...el.childNodes);
        }
      }
      return doc.body.innerHTML;
    };
    expect(plain(sheetMarkup())).toBe(plain(BEFORE.html));
  });
});
