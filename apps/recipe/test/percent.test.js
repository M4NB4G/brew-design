// percent.test.js
// Scenarios for the Percent helpers item (scope table agreed 2026-09-20),
// named from its sentences S1–S5. Percent is fraction × 100 by definition;
// state holds the fraction (SPEC rule 8, unit table) and display.js is the
// only place the conversion lives (SPEC rule 9). S6 (the nine call sites show
// and store what they did before) is smoke.test.js passing unchanged plus the
// far end, in the browser.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { fractionToPercent, percentToFraction, percentUnit } from '../src/display.js';
import { num } from '../src/format.js';

// Every fraction the reference recipe (smoke.test.js) holds: FGDB, efficiency,
// apparent attenuation, and the four distinct alpha acids.
const REFERENCE_FRACTIONS = [0.8, 0.93, 0.147, 0.19, 0.18, 0.06];

const COMPONENTS_DIR = fileURLToPath(new URL('../src/components/', import.meta.url));

function jsxFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return jsxFiles(path);
    return entry.name.endsWith('.jsx') ? [path] : [];
  });
}

describe('percent helpers', () => {
  // S1, S2
  it('a fraction shows as a percent: 0.8 → 80, 0.147 → 14.7', () => {
    expect(fractionToPercent(0.8)).toBeCloseTo(80, 12);
    expect(fractionToPercent(0.147)).toBeCloseTo(14.7, 12);
  });

  // S1, S2
  it('a percent entered parses to the fraction: 80 → 0.8, 14.7 → 0.147', () => {
    expect(percentToFraction(80)).toBeCloseTo(0.8, 12);
    expect(percentToFraction(14.7)).toBeCloseTo(0.147, 12);
  });

  // S1, S5
  it('every reference-recipe fraction round-trips within 1e-12', () => {
    for (const fraction of REFERENCE_FRACTIONS) {
      const back = percentToFraction(fractionToPercent(fraction));
      expect(Math.abs(back - fraction)).toBeLessThanOrEqual(1e-12);
    }
  });

  // S3 — derived, never entered; the % label comes from display.js too (P3).
  it('ABV 0.0748883 shows as 7.49% via num(fractionToPercent(…), 2)', () => {
    expect(num(fractionToPercent(0.0748883), 2)).toBe('7.49');
    expect(percentUnit()).toBe('%');
  });

  // S4 — a whole-line comment (//, *, /*, or a JSX {/* … */}) is excluded, as
  // in the pre-commit hook's rule-7 grep. `max="100"` has no operator and does
  // not match. A hit is reported as file:line so the failure names the site.
  it('no fraction↔percent arithmetic remains in components', () => {
    const COMMENT = /^\s*(\/\/|\*|\/\*|\{\/\*)/;
    const PERCENT_ARITHMETIC = /[*/]\s*100\b/;
    const hits = [];
    for (const file of jsxFiles(COMPONENTS_DIR)) {
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (!COMMENT.test(line) && PERCENT_ARITHMETIC.test(line)) {
            hits.push(`${relative(COMPONENTS_DIR, file)}:${i + 1}: ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });
});
