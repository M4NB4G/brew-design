# Percent helpers — Tier B

Status: landed 2026-09-20, in the commit whose subject is S4 ("No
fraction↔percent arithmetic remains in any component"); the inspector's box
is in that commit's body. Agreed 2026-09-20 ("agree to all"); written by the
spec session, built by a new session from CLAUDE.md's kickoff prompt. R1 (a
Models-rule amendment) was applied to CLAUDE.md in the same commit as this
file, so it is not a builder file.

## Why

Nine call sites in three components do fraction↔percent arithmetic inline
(`* 100` on display, `/ 100` on input). SPEC rule 9 says `display.js` is the
only place canonical↔display conversion lives, and nothing pins the
conversion. This is the change that was committed to `main` without a
second reader and that the method was adopted to prevent.

Call sites on `main` at 2d1bba7:
- `GristTable.jsx` 85/89 (FGDB), 152/153 (efficiency), 161/162 (attenuation)
- `HopsSection.jsx` 204/208 (alpha acid)
- `StatsBar.jsx` 82 (ABV, display only)

## Sentences — what must be true afterwards

- **S1** `display.js` exports `fractionToPercent(fraction)` and `percentToFraction(percent)`. Percent is fraction × 100 by definition; the two are inverses to within floating-point round-off.
- **S2** FGDB, brewhouse efficiency, yeast apparent attenuation, and hop alpha acid are entered and shown as percentages through those helpers. State holds the fraction, unchanged (SPEC rule 8, unit table).
- **S3** ABV is shown as a percentage through `fractionToPercent`. It is derived, never entered.
- **S4** No fraction↔percent arithmetic remains in any component. `display.js` is the only place it lives (SPEC rule 9).
- **S5** A test pins the helpers: 0.8 ↔ 80, 0.147 ↔ 14.7, and every fraction in the reference recipe survives fraction → percent → fraction to within 1e-12.
- **S6** Every value shown at the nine call sites is identical to before the change, and every edit stores the same fraction it did before. `smoke.test.js` passes unchanged.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | Models: strongest available for Tier B |
| M2 | Inspector model | Sonnet, default effort | With R1, the only number (100) is ruled → the other model |
| R1 | Models rule | Definitional unit factors (100 for percent, 1000 for trillion) count as ruled numbers, alongside spreadsheet cells and engine constants. Applied to CLAUDE.md with this file. | `cellsFromCanonical` already uses `/ 1000`, pinned by a round-trip; the rule's letter would otherwise send every percent change to Fable for a number true by definition |
| P1 | Helper shape | `fractionToPercent(fraction) → percent`, `percentToFraction(percent) → fraction`; mode-independent; plain arithmetic, no rounding inside | SPEC unit table: same in both modes. Display precision stays the caller's (`roundForInput`, `num`) — conversions in `display.js`, formatting in `format.js` |
| P2 | ABV included | Yes — the ninth call site | S4 is only true if ABV goes through the helper |
| P3 | Label helper | Add `percentUnit()` → `'%'` and use it for the `%` labels | Symmetry with `maltWeightUnit()`, `tempUnit()`; labels come from `display.js` |
| P4 | Where the scenarios live | New file `apps/recipe/test/percent.test.js` | Rule 12 keeps `smoke.test.js` as the untouched parity gate; a new file fails cleanly on import before the change |
| P5 | Floating-point drift (silent property) | No compensation. `0.147 × 100 = 14.700000000000001`; the display rounds it; state is rewritten only on a user edit — display never writes back. Drift ≤ 1e-15, ten orders inside every engine tolerance. Pinned at 1e-12 by S5 | Rounding inside the helpers would be a new number needing its own rule |
| P6 | Files the item names | `apps/recipe/src/display.js`, `components/GristTable.jsx`, `components/HopsSection.jsx`, `components/StatsBar.jsx`, `test/percent.test.js` (new), `docs/TEST_COVERAGE.md` (rule 9 row; percent gap row removed; scenario row added), `docs/ROADMAP.md` (row removed), this file (status, builder's notes) | Smallest change |

## Scenarios — `apps/recipe/test/percent.test.js`, written first, must fail before

1. *a fraction shows as a percent: 0.8 → 80, 0.147 → 14.7* — S1, S2
2. *a percent entered parses to the fraction: 80 → 0.8, 14.7 → 0.147* — S1, S2
3. *every reference-recipe fraction round-trips within 1e-12* — 0.8, 0.93, 0.147, 0.19, 0.18, 0.06 — S1, S5
4. *ABV 0.0748883 shows as 7.49%* via `num(fractionToPercent(…), 2)` — S3
5. *no fraction↔percent arithmetic remains in components* — reads every `src/components/*.jsx` and asserts no `* 100` or `/ 100` on a code line (comment lines excluded; `max="100"` has no operator and does not match) — S4

Expected failure before the change: 1–4 fail on import (`Cannot find module` or missing export); 5 fails naming the nine call sites. Record both.

## Far end — Tier B

On the built app (`vite preview`), default recipe: FGDB shows 80, efficiency 75, attenuation 77, alpha 12 and 6; ABV shows the same value as on `main` before the change (record the `main` value first). Edit alpha to 14.7 → the stored document's `alphaAcidFraction` is 0.147 (read `localStorage['brew-design.recipe']`).

Result, 2026-09-20, built app (`vite preview`, bundle `index-DgrrMrtC.js`),
default recipe, Home: FGDB 80 and 80, efficiency 75, attenuation 77, alpha
12 and 6, ABV 5.7% — every number input and every `%` label byte-identical
to the `main` snapshot taken first (`main` ABV: 5.7%). Alpha (Magnum) edited
to 14.7 → stored `alphaAcidFraction` 0.147, kettle 56 IBU, both as on
`main`. Extra: efficiency edited to 72 → stored 0.72 (the `InputRow` /
`parseFloat` path).

## Recorded failure (filled in by the builder)

Run alone against the unchanged code (`main` at b466b98), `npx vitest run
test/percent.test.js` from `apps/recipe`: 5 tests, 5 failed.

- 1–4: `TypeError: (0 , fractionToPercent) is not a function` (scenario 2:
  `percentToFraction`). The missing export surfaced per test, not on import:
  vite-node resolves an absent named export to `undefined`, so P4's "fails
  cleanly on import" became "fails cleanly on first call", and scenario 5
  ran in the same pass.
- 5: `AssertionError: expected [ …(9) ] to deeply equal []`, naming
  `GristTable.jsx:85, 89, 152, 153, 161, 162`, `HopsSection.jsx:204, 208`,
  `StatsBar.jsx:82` — the nine call sites listed above.

After the change: 5/5 alone; `npm test` engine 179/179, app 25/25
(`smoke.test.js` 13, unchanged); `npm run build` green.

## Builder's notes — choices the sentences did not make (filled in by the builder)

- **Display precision stayed where it was.** Efficiency and attenuation keep
  their `Number((…).toFixed(4))` wrapper, now around `fractionToPercent`;
  FGDB and alpha go through `NumberField`'s `roundForInput` as before; ABV
  keeps `num(…, 1)`. The helpers are the same two expressions the components
  inlined (`fraction * 100`, `percent / 100`), so every shown value and every
  stored fraction is bit-identical to before (S6); the far end confirmed it
  against a `main` snapshot taken first.
- **Five `%` labels use `percentUnit()`** (P3): the FGDB and Alpha column
  headers, the two `InputRow` `unit` props, and the ABV suffix. It is pinned
  inside scenario 4 ("shows as 7.49%") rather than as a sixth scenario; the
  item lists five.
- **Scenario 5 reads `components/**` recursively** (so `shared/` is
  included): S4 says "any component". A whole-line comment (`//`, `*`, `/*`,
  JSX `{/*`) is excluded, as in the pre-commit hook's rule-7 grep; a trailing
  `// … 100` on a code line would be a visible false positive, never a silent
  miss. `max="100"` / `max={100}` have no operator and do not match.
- **Round-off did not appear.** All six reference fractions round-trip with
  drift exactly 0, and `0.147 * 100` is `14.7` in JS (P5's example
  `14.700000000000001` does not occur); the 1e-12 pin stands and no
  compensation was added (P5).
- **Nothing for the roadmap.** No drive-bys noticed; `.claude/` (untracked
  launch config) stays out of the change.
