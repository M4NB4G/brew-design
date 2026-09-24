// spec-rules.test.js
// Closes three coverage gaps (S1, 2026-09-23; docs/TEST_COVERAGE.md, "Gaps"):
//   rule 5  — the app imports the engine only through its root, @brew/engine;
//   rule 10 — selectors.js is the only app file that calls engine compute
//             functions (reference-volume.js may call correctVolumeToRef:
//             rule 11 makes it the volume-correction slot; display.js may
//             call the engine's unit conversions: rule 9);
//   rule 9  — hop weight and dry-hop rate convert at the edge by the engine's
//             unit constants, pinned by hand below.
// The engine's own exports decide what is a function: a constant (a range, a
// unit factor) may be imported anywhere.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as engine from '@brew/engine';
import {
  hopWeightToCanonical,
  hopWeightFromCanonical,
  dryHopRateFromCanonical,
} from '../src/display.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(APP, 'src');

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesUnder(path);
    return /\.(js|jsx|mjs)$/.test(path) ? [path] : [];
  });

const appFiles = () => [...filesUnder(SRC), ...filesUnder(join(APP, 'scripts'))];
const name = (file) => relative(SRC, file).replace(/\\/g, '/');

// Every name a file imports from the engine root, e.g. import { a, b as c }.
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

// The engine functions each file other than selectors.js may call.
const UNIT_CONVERSIONS = ['sgToPlato', 'platoToSg', 'volumeToGallons', 'volumeUnit', 'galToL', 'fToC'];
const ALLOWED = {
  'reference-volume.js': ['correctVolumeToRef'],
  'display.js': UNIT_CONVERSIONS,
};

describe('SPEC rules the suite did not yet check', () => {
  it('rule 5: the app imports the engine only through @brew/engine', () => {
    const deep = [];
    for (const file of appFiles()) {
      const text = readFileSync(file, 'utf8');
      for (const [, spec] of text.matchAll(/(?:from\s+|import\s*\(\s*)['"]([^'"]+)['"]/g)) {
        if (/^@brew\/engine\/|packages\/engine/.test(spec)) deep.push(`${name(file)}: ${spec}`);
      }
      if (/import\s+\*\s+as\s+\w+\s+from\s+['"]@brew\/engine['"]/.test(text)) {
        deep.push(`${name(file)}: import * from @brew/engine (hides which functions it calls)`);
      }
    }
    expect(deep).toEqual([]);
  });

  it('rule 10: only selectors.js calls engine compute functions', () => {
    const calls = [];
    for (const file of filesUnder(SRC)) {
      const n = name(file);
      if (n === 'selectors.js') continue;
      for (const id of engineImports(readFileSync(file, 'utf8'))) {
        if (typeof engine[id] !== 'function') continue; // a constant
        if ((ALLOWED[n] ?? []).includes(id)) continue;
        calls.push(`${n}: ${id}`);
      }
    }
    expect(calls).toEqual([]);
    // The check reads real imports: selectors.js does import compute functions.
    expect(engineImports(readFileSync(join(SRC, 'selectors.js'), 'utf8'))).toContain('computeGrist');
  });

  it('rule 9: Pro hop weight and dry-hop rate convert by the engine\'s unit constants, pinned by hand', () => {
    // 16 oz in a lb (engine OZ_PER_LB, a definitional unit factor).
    expect(hopWeightFromCanonical(16, 'pro')).toBe(1);
    expect(hopWeightToCanonical(1, 'pro')).toBe(16);
    expect(hopWeightFromCanonical(2, 'home')).toBe(2);
    // Round trip through the edge, Pro and Home, for the reference recipe's hop weights.
    for (const oz of [2, 1, 0.5, 1.75]) {
      for (const mode of ['home', 'pro']) {
        expect(hopWeightToCanonical(hopWeightFromCanonical(oz, mode), mode)).toBeCloseTo(oz, 12);
      }
    }
    // Dry-hop rate, oz/gal -> lb/bbl: 1 oz/gal x 31 gal/bbl / 16 oz/lb = 31/16 = 1.9375
    // (engine GALLONS_PER_BBL and OZ_PER_LB); the reference recipe's 15 oz in
    // 12 gal = 1.25 oz/gal -> 1.25 x 31 / 16 = 38.75 / 16 = 2.421875 lb/bbl.
    expect(dryHopRateFromCanonical(1, 'pro')).toBe(1.9375);
    expect(dryHopRateFromCanonical(1.25, 'pro')).toBe(2.421875);
    expect(dryHopRateFromCanonical(1.25, 'home')).toBe(1.25);
  });
});
