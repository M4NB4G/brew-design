// west-coast-pils.test.js
// Scenario for "One West Coast Pilsner for the acid tests" (Tier D, batch F3,
// ROADMAP). The owner's West Coast Pilsner is the recipe the acid's doses are
// worked by hand on, and a hand figure holds only while the recipe a test
// builds matches the one it was worked for. So the recipe is written once, in
// west-coast-pils.fixture.js, and a test that wants it imports it.

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

const DIR = fileURLToPath(new URL('./', import.meta.url));
const FIXTURE = 'west-coast-pils.fixture.js';
const THIS = 'west-coast-pils.test.js';
const read = (file) => readFileSync(`${DIR}${file}`, 'utf8');

// The recipe's name, and its first malt's: where a copy would have to say them.
const WRITTEN_OUT = /Home Grown WC Pils|Pilsner Northstar/;

describe('the West Coast Pilsner', () => {
  it('is written out once, in the shared fixture, and the acid tests read it from there', () => {
    // The search can find it: the fixture writes it out.
    expect(read(FIXTURE)).toMatch(/Home Grown WC Pils/);
    expect(read(FIXTURE)).toMatch(/Pilsner Northstar/);

    // No other test file or fixture writes it out again.
    const others = readdirSync(DIR).filter((f) => f.endsWith('.js') && f !== FIXTURE && f !== THIS);
    expect(others.length).toBeGreaterThan(0);
    expect(others.filter((f) => WRITTEN_OUT.test(read(f)))).toEqual([]);

    // The four that work doses on it import the fixture.
    for (const file of ['acid-in-mash', 'acid-aimed', 'mash-ph', 'liquid-acid-tenth']) {
      expect(read(`${file}.test.js`), file).toContain(`./${FIXTURE.replace('.js', '')}`);
    }
  });
});
