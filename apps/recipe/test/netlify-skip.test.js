// netlify-skip.test.js
// Scenarios for the Netlify skips unchanged builds item (scope table agreed
// 2026-09-23, docs/items/netlify-skip-unchanged.md), named from its
// sentences S1–S3 and decisions N2, N4, N5. Netlify's `ignore` command
// cancels the build when it exits 0 and builds otherwise. This suite also
// runs inside Netlify's build, whose clone may not hold old history, so no
// scenario depends on a past commit; the skip path against real history is
// proved at the far end.

import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { decide } from '../../../tools/netlify/skip-unchanged.mjs';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const A = 'a'.repeat(40);
const B = 'b'.repeat(40);

describe('Netlify skips unchanged builds', () => {
  // S1, N2, N5
  it('a push that changes only documents, the workbook, tooling or tests does not build', () => {
    const onlyUnbuilt = [
      'docs/items/yeast-card.md',
      'docs/ROADMAP.md',
      'SPEC.md',
      'CLAUDE.md',
      'data/Brew Design Ingredients.xlsx',
      'data/README.md',
      'tools/hooks/pre-commit',
      'apps/recipe/test/smoke.test.js',
      'packages/engine/test/golden-master.test.js',
      '.gitattributes',
    ];
    for (const file of onlyUnbuilt) {
      expect(decide({ previous: A, current: B, changedFiles: [file] }), file).toBe('skip');
    }
    expect(decide({ previous: A, current: B, changedFiles: onlyUnbuilt })).toBe('skip');
  });

  // S2, N5
  it('a push that changes the app, the engine or the package files builds', () => {
    const built = [
      'apps/recipe/src/App.jsx',
      'apps/recipe/src/ingredients.json',
      'apps/recipe/index.html',
      'apps/recipe/netlify.toml',
      'apps/recipe/package.json',
      'apps/recipe/vite.config.js',
      'packages/engine/src/grist.js',
      'packages/engine/package.json',
      'package.json',
      'package-lock.json',
    ];
    for (const file of built) {
      expect(decide({ previous: A, current: B, changedFiles: [file] }), file).toBe('build');
      // One such file among documents is enough.
      expect(decide({ previous: A, current: B, changedFiles: ['docs/ROADMAP.md', file] }), file).toBe('build');
    }
  });

  // S3, N4
  it('when Netlify cannot tell what changed, it builds', () => {
    // No previous build.
    expect(decide({ previous: '', current: B, changedFiles: [] })).toBe('build');
    expect(decide({ previous: undefined, current: B, changedFiles: [] })).toBe('build');
    // The same commit as the last build.
    expect(decide({ previous: B, current: B, changedFiles: [] })).toBe('build');
    // No current commit.
    expect(decide({ previous: A, current: '', changedFiles: [] })).toBe('build');
    // The history does not hold one of the commits (the comparison failed).
    expect(decide({ previous: A, current: B, changedFiles: null })).toBe('build');
  });

  // S1, S3 — the command netlify.toml names, run from the repository root as
  // Netlify runs it (exit 0 cancels the build, anything else builds).
  it('Netlify runs the skip rule before every build', () => {
    const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
    const ignore = toml.match(/^\s*ignore\s*=\s*"([^"]+)"/m);
    expect(ignore?.[1]).toBe('node tools/netlify/skip-unchanged.mjs');

    const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
    const run = (env) => {
      const { CACHED_COMMIT_REF: _c, COMMIT_REF: _r, ...rest } = process.env;
      return spawnSync('node', ['tools/netlify/skip-unchanged.mjs'], {
        cwd: ROOT,
        env: { ...rest, ...env },
        encoding: 'utf8',
      }).status;
    };
    expect(run({ COMMIT_REF: head })).toBe(1); // no previous build
    expect(run({ CACHED_COMMIT_REF: head, COMMIT_REF: head })).toBe(1); // same commit
    expect(run({ CACHED_COMMIT_REF: 'f'.repeat(40), COMMIT_REF: head })).toBe(1); // unknown commit
  });
});
