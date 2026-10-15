# The development tools are upgraded past their security advisories, Tier D

Status: agreed 2026-10-15 ("agree to all", R-4, O-1 to O-5); not started.
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
