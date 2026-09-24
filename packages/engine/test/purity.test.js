// purity.test.js
// SPEC.md rule 1: the engine is pure — no DOM, no network, no I/O, no global
// state. Closes the coverage gap "Engine has no I/O imports" (S1,
// 2026-09-23): every engine source file imports only other engine files, and
// no code line names a browser, network, file-system or process global.
// Comments are stripped first: a word in a comment does no I/O.

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

const filesUnder = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : path.endsWith('.js') ? [path] : [];
  });

// Block and line comments removed; strings are left (none names a global).
const code = (text) => text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const IO_GLOBALS = /\b(fetch|document|window|globalThis|localStorage|sessionStorage|XMLHttpRequest|WebSocket|process|require|navigator)\b/;

describe('engine purity (SPEC rule 1)', () => {
  const files = filesUnder(SRC);

  it('every engine source file imports only other engine files', () => {
    expect(files.length).toBeGreaterThan(0);
    const outside = [];
    for (const file of files) {
      for (const [, spec] of code(readFileSync(file, 'utf8')).matchAll(/\bfrom\s+['"]([^'"]+)['"]|\bimport\s*\(\s*['"]([^'"]+)['"]/g)) {
        if (spec && !spec.startsWith('./') && !spec.startsWith('../')) outside.push(`${relative(SRC, file)}: ${spec}`);
      }
    }
    expect(outside).toEqual([]);
  });

  it('no engine code line names a browser, network, file-system or process global', () => {
    const hits = [];
    for (const file of files) {
      code(readFileSync(file, 'utf8'))
        .split('\n')
        .forEach((line, i) => {
          if (IO_GLOBALS.test(line)) hits.push(`${relative(SRC, file)}:${i + 1}: ${line.trim()}`);
        });
    }
    expect(hits).toEqual([]);
  });
});
