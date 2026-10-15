# The development tools are upgraded past their security advisories, Tier D

Status: landed 2026-10-15 in batch O3 of run S20, as "The development tools are upgraded past their security advisories, and npm audit reports none",
awaiting the owner's "merge and push". Was: agreed 2026-10-15 ("agree to
all", R-4, O-1 to O-5), not started.
Written by the S19 session; built in the orchestrated run, batch O3, last
(docs/ROADMAP.md, Sessions).

## Why

`npm audit` reports advisories in the development tools, each needing a
major version (S1, 2026-09-23, five; on 2026-10-15, seven: 1 low, 3
moderate, 1 high, 2 critical, in `@vitest/mocker`, `esbuild`,
`source-map-js`, `tinypool` and `uuid`). The test runner (vitest 3), esbuild
under Vite 7, and the workbook reader's `uuid` (exceljs). None reaches the
built app a visitor loads.

## Sentences: what must be true afterwards

- **DT-S1** `npm audit` reports no advisory that an upgrade can clear; any that cannot be cleared without breaking a tool is named in the summary with why, and nothing else is done about it.
- **DT-S2** Both suites pass with the same tests and the same counts; no test is skipped, loosened or rewritten to pass, and no tolerance changes (SPEC rule 4).
- **DT-S3** The app works as before: `npm run build` passes, the browser suite passes on the new build, and `npm run lint` passes.
- **DT-S4** The ingredient list is unchanged: the refresh tool, run on the workbook, writes `apps/recipe/src/ingredients.json` byte for byte as it is.
- **DT-S5** Netlify's build and the GitHub check run as before (the Node version they use is unchanged, or changed in their config in the same commit).

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| R-4 | Build the dev-tool upgrades? | Yes, as the last batch | The only held item with a reason to act: the advisories |
| M1 | Builder model | Opus, medium effort | The owner's decision of 2026-10-02: this item is built on Opus, not in the Sonnet trial, because it replaces the test runner every check relies on (the roadmap's line) |
| M2 | Inspector | None by tier (Tier D); the batch's Opus reviewer reads it | O-3 |

## Scenarios

No scenario a test can see (a Tier D change); the proof is DT-S1 to DT-S5:
`npm audit` before and after, the suite counts before and after (they must
match), the build, the browser suite, the linter, and the refresh tool's
output compared byte for byte.

## Notes for the builder

- The smallest upgrades that clear the advisories: vitest (and
  `@vitest/*`) to the major that clears them, in both workspaces; Vite only
  if esbuild's advisory needs it. `exceljs`'s `uuid`: the S1 note says the
  fix is a breaking downgrade; if no non-breaking route exists, it is named
  (DT-S1), not forced.
- A test that breaks under the new runner's API is fixed in how it runs
  (imports, config), never in what it asserts; if one cannot be, the item
  is not committed and the summary says why.
- Bundle: if the build's bundle changes (a new Vite), the browser suite on
  the new build is the proof; say so in the summary.
- The roadmap line "Dev-tooling major upgrades" is removed.

## Builder's notes (landed 2026-10-15)

- Builder: Opus 5.5, medium effort (M1). No inspector (Tier D, M2); the Opus
  advisor confirmed no number is added outside package versions and no test
  file changed.
- Versions: vitest 3.2.7 → 4.1.12 in both workspaces (`^3.0.0` →
  `^4.1.12`), with `@vitest/*` 3.2.7 → 4.1.12. 4.1.12 is the first release
  past the advisory range (≤ 4.1.10), so major 4 clears it; the old roadmap
  line's "→ 5" was not needed. tinypool (the two critical advisories) leaves
  the tree with vitest 3, as do vite-node, cac, check-error, deep-eql,
  js-tokens, loupe, pathval, strip-literal and tinyspy. source-map-js 1.2.1
  → 1.2.2 (`npm audit fix`, no `--force`).
- esbuild 0.27.7 → 0.27.2, a patch-level step down by `npm audit fix`: the
  advisory covers 0.27.3–0.28.0, and 0.27.2 is the newest version below it
  that Vite 7.3.5's range allows. Vite was left at 7.3.5, since the advisory
  did not need a newer Vite (a newer Vite 7.3.x would have taken esbuild
  0.28.2 instead).
- uuid under exceljs 8.3.2 → 11.1.1, by a root `package.json` override
  (`"overrides": { "exceljs": { "uuid": "^11.1.1" } }`). exceljs uses only
  `require('uuid').v4`, which uuid 11 still exports for CommonJS. Proof
  (DT-S4): the refresh tool, run on the workbook after the override, writes
  `apps/recipe/src/ingredients.json` byte for byte as committed (42 malts,
  43 hops, 32 yeasts; `git diff --exit-code` clean).
- `npm audit`: before, 7 (1 low esbuild; 3 moderate @vitest/mocker, uuid,
  exceljs; 1 high source-map-js; 2 critical tinypool, vitest); after, 0.
- npm 10.9.4 crashes installing vitest 4 here ("Cannot read properties of
  null (reading 'edgesOut')", a bug in its peer-dependency resolver). The
  installs were run with `npx npm@11` (11.21.1). `npm ci` with npm 10 then
  installs the lockfile cleanly; CI and Netlify (Node 24) use npm 11.
- Suites: engine 260 (28 files) and app 437 (80 files), before and after;
  the JSON reports of both runners list the same test names with the same
  statuses. Vitest 4 prints the engine as "258 passed | 2 expected fail
  (260)": the two are the existing `it.fails` water-parity tests, which
  Vitest 3 counted as passed.
- One fix in how tests run: Vitest 4 creates the jsdom page before it puts
  its own console in place, so jsdom's "Not implemented: navigation" report
  went to a console the spy in `way-out-of-page-error.test.js` never saw,
  and two NW scenarios failed. `disableConsoleIntercept: true` in
  `apps/recipe/vite.config.js` (commented) makes tests and jsdom share one
  console, as under Vitest 3. No test file changed.
- Build: the bundle is byte-identical (sha256 of every file in `dist/`):
  `index-Dlpo0psv.js` 414.43 kB, `index-CZEm_GL8.css` 0.99 kB, both logos
  and `index.html` unchanged. Lint passes; the browser suite passes on the
  new build, 23 of 23.
- Node: Netlify (`apps/recipe/netlify.toml`, `NODE_VERSION = "24"`) and the
  GitHub check (`.github/workflows/ci.yml`, Node 24) are unchanged; vitest
  4.1.12 needs ^20, ^22 or ≥ 24, and esbuild 0.27.2 ≥ 18. No new deprecation
  warnings in the test output.
