// engine-comment-sources.test.js
// Scenario for "Engine comments cite their sources as the owner gave them"
// (scope table agreed 2026-10-14, docs/items/engine-comment-sources.md),
// named from its sentences EC-S1 to EC-S5. Comments only: the four engine
// files are read as text, as purity.test.js reads the engine's sources, and
// only their comment lines are searched. Each corrected citation is there,
// and the old one is not. EC-S5 (no figure changes) is every other test in
// both suites passing as before.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

// A file's comment text, the comment markers dropped and each run of white
// space read as one space, so a citation reads the same across line breaks.
function comments(file) {
  const text = readFileSync(join(SRC, file), 'utf8');
  const blocks = [...text.matchAll(/\/\*[\s\S]*?\*\//g)].map((m) => m[0].replace(/^\s*\/?\*+\/?/gm, ''));
  const lines = [...text.matchAll(/(?:^|[^:])\/\/(.*)$/gm)].map((m) => m[1]);
  return [...blocks, ...lines].join(' ').replace(/\s+/g, ' ');
}

describe('engine comments cite their sources as the owner gave them', () => {
  it('the salt table cites Palmer and Kaminski, Water (2013), Appendix C, p. 263 (EC-S1)', () => {
    const c = comments('water/salts.js');
    expect(c).toMatch(/Palmer, J\.J\. & Kaminski, C\. \(2013\)\. Water: A Comprehensive Guide for Brewers\. Brewers Publications\. Appendix C, p\. 263\./);
    expect(c).not.toContain('Appendix A');
    expect(c).not.toContain('281');
  });

  it('the style table cites How to Brew, 4th edition (2017), and The New IPA as self-published (EC-S2)', () => {
    const c = comments('water/styles.js');
    expect(c).toContain('Palmer, J.J. (2017). How to Brew (4th ed.). Brewers Publications.');
    expect(c).toContain('Janish, S. (2019). The New IPA. Self-published.');
    expect(c).not.toContain('(2006)');
    expect(c).not.toContain('White Mule');
  });

  it('phosphoric acid as monoprotic cites the CRC Handbook of Chemistry and Physics (EC-S3)', () => {
    const c = comments('water/acids.js');
    // The CRC Handbook's entry carries the monoprotic note.
    expect(c).toMatch(/CRC Handbook of Chemistry and Physics[^—]*— Phosphoric acid is treated as monoprotic/);
    expect(c).not.toContain('An Overview of pH');
    expect(c).not.toContain('Troester');
  });

  it("the 400B band is Rev 4's own rule, not a recorded deviation from Rev 3 (EC-S4)", () => {
    const c = comments('starter.js');
    expect(c).toContain("Rev 4's own rule");
    expect(c).toContain("the owner's correction of Rev 3's N11 (2026-10-08)");
    expect(c).not.toMatch(/deviation/i);
  });

  it("the starter's note says the 400B band's boundaries leave no gap and names no 900 (SF-S1)", () => {
    // "The starter's note says the 400B band's boundaries leave no gap"
    // (docs/items/starter-flag-note.md): the FLAG note above the bands names
    // the band's boundaries, 800 and 1000, as leaving no gap, and no longer
    // Rev 3's boundary at 900. SF-S2 (no figure changes) is every other test
    // in both suites passing as before.
    const c = comments('starter.js');
    expect(c).toContain("The 400B band's boundaries, 800 and 1000, leave no gap");
    expect(c).not.toContain('boundary at 900');
  });
});
