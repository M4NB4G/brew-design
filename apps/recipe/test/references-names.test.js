// @vitest-environment jsdom
// references-names.test.js
// Scenarios for "The References page's names say References" (scope table
// agreed 2026-10-14, docs/items/references-names.md), named from its
// sentences RN-S1 to RN-S4 and decision RN-Q1. The page's file, and the
// app's names for whether it is open, for opening it and for the footer's
// link to it, say References; the commit check's one exception to its
// brewing-formula search (SPEC rule 7) names the new file, and only it.
//
// The commit check's search is the hook's own: its pattern, its comment
// filter and its command are read from tools/hooks/pre-commit and run, as
// the hook runs them, on a scratch copy of apps/recipe/src staged in a
// scratch repository, so the check is shown on the files as they are.
// RN-S4 (nothing the brewer sees changes) is also held by the byte-for-byte
// page digests of page-error.test.js and error-outside-the-tabs.test.js,
// the References page among them.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { mount, unmount, page, text, click, button } from './page-error.fixture.js';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(APP, 'src');
const ROOT = join(APP, '..', '..');
const HOOK = join(ROOT, 'tools', 'hooks', 'pre-commit');
const NEW_FILE = 'apps/recipe/src/components/ReferencesPage.jsx';

// The hook's rule 7 search, as it is written there: the pattern, the comment
// filter, and the command whose output is the hits.
function hookSearch() {
  const hook = readFileSync(HOOK, 'utf8');
  const rule7 = hook.match(/^\s*RULE7=.*$/m)?.[0];
  const comment = hook.match(/^\s*COMMENT=.*$/m)?.[0];
  const command = hook.match(/^\s*HITS=\$\((.*)\)\s*$/m)?.[1];
  expect(rule7 && comment && command, "the hook's rule 7 search").toBeTruthy();
  return { script: `${rule7}\n${comment}\n${command}\n`, exceptions: [...command.matchAll(/':!([^']+)'/g)].map((m) => m[1]) };
}

// The hook's search run on a scratch repository holding apps/recipe/src as
// it is, staged, plus any `planted` files (path → text); its hits, one per line.
function hitsIn(script, planted = {}) {
  const repo = mkdtempSync(join(tmpdir(), 'rule7-'));
  try {
    cpSync(SRC, join(repo, 'apps', 'recipe', 'src'), { recursive: true });
    for (const [path, body] of Object.entries(planted)) {
      mkdirSync(dirname(join(repo, path)), { recursive: true });
      writeFileSync(join(repo, path), body);
    }
    const git = (...args) => spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
    expect(git('init', '-q').status).toBe(0);
    expect(git('add', '-A').status).toBe(0);
    const out = spawnSync('bash', ['-c', script], { cwd: repo, encoding: 'utf8' });
    return out.stdout.split('\n').filter(Boolean);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
}

afterEach(() => {
  unmount();
  vi.restoreAllMocks();
});

describe("the References page's names say References", () => {
  it('the References page is drawn from its new file and opened from the footer, as before', async () => {
    // RN-S1: the page's file is named for it, and the old file is gone.
    expect(existsSync(join(ROOT, NEW_FILE)), NEW_FILE).toBe(true);
    expect(existsSync(join(SRC, 'components', 'NotesPage.jsx')), 'NotesPage.jsx').toBe(false);
    // Imported by its path on disk, so a missing file fails this test alone.
    const pageFile = join(ROOT, NEW_FILE);
    const { default: ReferencesPage } = await import(/* @vite-ignore */ pageFile);
    expect(renderToStaticMarkup(createElement(ReferencesPage, { onBack: () => {} }))).toContain('Back to the recipe');

    // RN-S1: the app's names for whether the page is open, for opening it
    // and for the footer's link to it say References; none says Notes.
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
    const footer = readFileSync(join(SRC, 'components', 'Footer.jsx'), 'utf8');
    for (const old of ['NotesPage', 'notesOpen', 'setNotesOpen', 'openNotes', 'onNotes']) {
      expect(app, `App.jsx: ${old}`).not.toContain(old);
      expect(footer, `Footer.jsx: ${old}`).not.toContain(old);
    }
    expect(app).toMatch(/import ReferencesPage from '\.\/components\/ReferencesPage\.jsx';/);
    expect(app).toContain('referencesOpen');
    expect(app).toContain('openReferences');
    expect(footer).toContain('onReferences');
    // The footer's link opens the page through its new name.
    const { default: Footer } = await import('../src/components/Footer.jsx');
    const opened = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const { createRoot } = await import('react-dom/client');
    const { act } = await import('react');
    const root = createRoot(host);
    act(() => root.render(createElement(Footer, { onReferences: opened })));
    const link = [...host.querySelectorAll('button')].find((b) => text(b) === 'References');
    act(() => link.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(opened).toHaveBeenCalledTimes(1);
    act(() => root.unmount());
    host.remove();

    // RN-S4: in the whole app, the footer's "References" opens the page and
    // its Back returns to the recipe, as before.
    mount();
    click(button('References'));
    expect(text(page())).toContain('Back to the recipe');
    click(button('← Back to the recipe'));
    expect(text(page())).toContain('Grist');
    expect(text(page())).not.toContain('Back to the recipe');
  });

  it("the commit check's search skips the new file and only it, and finds a formula planted anywhere else", () => {
    // RN-S2: the one exception is the References page's new file.
    const { script, exceptions } = hookSearch();
    expect(exceptions).toEqual([NEW_FILE]);

    // The search, as the hook runs it, on the app as it is: nothing found,
    // though the page writes the equations' coefficients (ABV's 76.08,
    // Tinseth's 0.000125) ...
    expect(hitsIn(script)).toEqual([]);
    // ... which the search finds on the page without its exception.
    const unexcepted = script.replace(` ':!${NEW_FILE}'`, '');
    expect(unexcepted).not.toBe(script);
    expect(hitsIn(unexcepted).some((hit) => hit.startsWith(`${NEW_FILE}:`)), 'the page, without its exception').toBe(true);

    // A formula planted in any other file is found: a component, a top-level
    // file, and a file named like the page in another folder.
    const formula = 'export const og = (ppg) => 46 * ppg;\n';
    for (const path of [
      'apps/recipe/src/components/Planted.jsx',
      'apps/recipe/src/planted.js',
      'apps/recipe/src/components/water/ReferencesPage.jsx',
    ]) {
      const hits = hitsIn(script, { [path]: formula });
      expect(hits.some((hit) => hit.startsWith(`${path}:`)), path).toBe(true);
    }
  });

  it('the coverage table and SPEC rule 7 name the new file', () => {
    // RN-S2: the rule and its proof name the file the hook skips.
    const spec = readFileSync(join(ROOT, 'SPEC.md'), 'utf8');
    const coverage = readFileSync(join(ROOT, 'docs', 'TEST_COVERAGE.md'), 'utf8');
    const rule7 = spec.slice(spec.indexOf('7. **No brewing math in the app.**'), spec.indexOf('8. **One canonical state object**'));
    expect(rule7).toContain('(`ReferencesPage.jsx`)');
    expect(rule7).not.toContain('NotesPage');
    const row = coverage.split('\n').find((line) => line.startsWith('| 7 No brewing math in the app'));
    expect(row).toContain('`ReferencesPage.jsx`');
    expect(row).not.toContain('NotesPage');
  });
});
