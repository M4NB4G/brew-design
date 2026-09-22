# Starter solver, 400B band — Tier A

Status: landed 2026-09-21, "Starter 400B band: the pack alone serves 800-1000
billion cells inclusive, closing the gap at exactly 900". Written by the spec
session; built by a new session from CLAUDE.md's kickoff prompt.

## Why

The owner found it on 2026-09-21: at exactly 900 billion cells needed the
app says "No usable starter band". `starter.js` transcribes the
spreadsheet's 400B band with strict inequalities — `800 <= cells < 900` →
N = cells; `cells > 900` → N = cells − 200 with an extra 200B pack — so
900 matches neither, and no other band covers it (100B serves 250–<500,
200B serves 400–<800). It is flagged in the code (`FLAG: cells===900`).
`computeCellsNeeded` rounds to the nearest 10, so 900 is a reachable value.

The owner's rule, as the spreadsheet's author: the 400B band serves 800 to
1000 billion inclusive from the pack alone, and above 1000 with one extra
200B pack. Probed on `main` at 1ce3ac2 (the quadratic a = −0.006,
b = 0.222, c = 1.738, N/400; the engine's `solveVolume`):

| cells needed | today | owner's rule |
|---|---|---|
| 890 | 400B, N 890, 2.34 L | same |
| 900 | no option | 400B, N 900, 2.47 L, 284 g |
| 910 | 400B + 200B pack, N 710, 0.17 L | 400B, N 910, 2.60 L |
| 950 | + pack, N 750, 0.63 L | 400B, N 950, 3.13 L, 361 g |
| 1000 | + pack, N 800, 1.22 L | 400B, N 1000, 3.83 L, 440 g |
| 1010 | + pack, N 810, 1.34 L | same |
| 1500 | + pack, N 1300, 9.00 L | same |
| 2000 | no option (discriminant < 0 at N 1800) | same |

Today's 910–1000 answers apply the extra-pack rule a hundred billion cells
early (a 0.17 L starter); the owner's rule makes the progression
continuous. The 400B quadratic has a real root for N ≤ 1516.6, i.e. cells
≤ 1716 with the pack — the "no option" region above that is unchanged.

## Sentences — what must be true afterwards

- **S1** For 800 ≤ cells ≤ 1000 (billion, the value `solveStarter` receives), the 400B band returns one option grown from the 400B pack alone: `N = cells`, `packNote = ''`.
- **S2** For cells > 1000, the 400B band returns `N = cells − 200` with `packNote = '400B starter plus one extra 200B pack'`.
- **S3** Every cells value from 250 to 1700 in steps of 10 yields at least one option. Below 250, and where a band's quadratic has no real root (2000 → none), the result is empty, as today.
- **S4** Nothing else changes: the 100B and 200B bands and their strict-inequality edges at exactly 500 and 800 (their `FLAG` comments stay — another band covers those counts), every band constant, `DME_GRAMS_PER_LITER`, `solveVolume`, and the 570B golden master (200B band, multiple 2.85, 3.00 L, 345 g).
- **S5** The `FLAG` at 900 is removed; the 400B band's comment states the rule and names its source (the owner's decision of 2026-09-21, superseding Rev 3's strict 900). `SPEC.md` rule 2 gains one line recording the deviation and its date. `docs/TEST_COVERAGE.md`'s starter rows carry the new scenario names and counts.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Sonnet, high effort | The inspector is Opus and the two are never the same model; the change is a few lines |
| M2 | Inspector model | Opus, default effort | The owner's choice for this item (2026-09-21): no Fable; the same-family read is accepted in place of the Models rule's cross-family preference for Tier A |
| D1 | The 400B rule | `if (cells < 800) return null; if (cells <= 1000) return { N: cells, packNote: '' }; return { N: cells - 200, packNote: '400B starter plus one extra 200B pack' };` | The owner's statement, 2026-09-21, as the spreadsheet's author. The boundary 1000 belongs to the pack-alone rule (`<=`), so no count is unanswered |
| D2 | The other two edges | Left as transcribed: 100B at exactly 500 and 200B at exactly 800 keep their strict inequalities and `FLAG` comments | Another band covers those counts (200B covers 500; 400B covers 800), so no number a brewer acts on changes; SPEC rule 3 |
| D3 | Source of truth | The engine follows D1. The owner updates the spreadsheet's 400B validity rule to match; either way `SPEC.md` rule 2 records the deviation and its date so a future comparison against Rev 3 is not mistaken for a transcription error | SPEC rule 2 must stay true |
| D4 | Silent properties | The recommended volume drops at the 1000 → 1010 step (3.83 L → 1.34 L plus a pack): intended by D1, named so the inspector does not flag it. The app's "No usable starter band" text is unchanged and still appears below 250 and beyond the curve's reach. No app file changes; `YeastSection.jsx` renders whatever the engine returns. Persistence is untouched | Named so they are checked, not discovered |
| D5 | Numbers | 1000 — the band threshold; rule D1 (the owner's statement); pinned by scenarios 1–3. `<=` — the inclusive edge; rule D1; pinned by scenario 1 (900) and scenario 3 (1000). 200 — the extra-pack subtraction, unchanged | Every number has a rule and a pin |
| D6 | Files and tier | Tier A. `packages/engine/src/starter.js` (the 400B band's `effectiveCells` and comment), `packages/engine/test/starter.test.js`, `SPEC.md` (rule 2, one line), `docs/TEST_COVERAGE.md` (starter scenario row and totals), `docs/ROADMAP.md` (this item's row removed), this file (status, recorded failure, builder's notes). No app files | Smallest change; the engine path is in the hook regex |

## Scenarios — `packages/engine/test/starter.test.js`, written first, must fail before

Rewrites of the two tests that pin the old rule, plus two new ones, named
after the sentences:

1. *900B → the 400B band alone, N = 900* — S1 (replaces "exactly 900B falls in the 400B gap → no options"; `neededMultiple` 2.25, `packNote` '', `volumeL` ≈ 2.47)
2. *950B → the 400B band alone, no extra pack* — S1 (rewrites the 950B test: `neededMultiple` 950/400, `packNote` '')
3. *1000B → the 400B band alone; 1010B → with an extra 200B pack, N = 810* — S1, S2 (new; 1010: `neededMultiple` 810/400, the pack note)
4. *every count from 250 to 1700 in steps of 10 has at least one option* — S3 (new)

Unchanged and must still pass: 570B (band selection and the golden master),
450B, 300B, 850B, 200B → none, 2000B → none (its comment updated: the 400B
rule accepts cells > 1000), exactly 500 and exactly 800 (the "intentional
boundary gaps" describe keeps those two; its header comment drops 900).

Expected failure before the change: 1 — `expect([]).toHaveLength(1)`;
2 — `packNote` is the extra-pack note, `neededMultiple` 1.875 ≠ 2.375;
3 — 1000 gives `neededMultiple` 2 ≠ 2.5 with the pack note; 4 — fails at
900. Record the assertion lines.

## Far end — Tier A: both suites

`npm test` at the root; `npm run build` (the app bundle does not change —
the engine's source is bundled, so the content hash will differ; the app's
numbers do not). No browser step is required by the tier table. Optional
look: none needed — the app renders whatever the engine returns.

## Recorded failure (filled in by the builder)

Run alone against unchanged `main` (`npx vitest run packages/engine/test/starter.test.js`), 4 failed / 8 passed:

1. *900B → the 400B band alone, N = 900* — `expected [] to have a length of 1 but got +0` (the count had no option at all, matching the "no option" bug the owner found)
2. *950B → the 400B band alone, no extra pack* — `expected 1.875 to be close to 2.375, received difference is 0.5` (today's code still applies the extra-pack subtraction a hundred billion cells early)
3. *1000B → the 400B band alone; 1010B → with an extra 200B pack* — `expected 2 to be close to 2.5, received difference is 0.5` (fails at the 1000 count, before reaching 1010)
4. *every count 250-1700 has an option* — `cells=900: expected 0 to be greater than 0`

## Builder's notes — choices the sentences did not make (filled in by the builder)

- The 900B scenario replaces the old "falls in the 400B gap" test and moves
  from the boundary-gaps group into the band-selection group (it is no
  longer a gap); the two remaining boundary-gap tests (500, 800) are
  untouched except the describe block's header comment, which now names only
  500 and 800.
- The module-level `FLAG` docblock above `BANDS` also named 900 as a
  boundary gap; it now lists only 500 and 800 and points to the 400B band's
  own comment for the 900 boundary, so a future reader is not told a gap
  exists where the code no longer has one.
- The 400B band's `effectiveCells` comment states the owner's rule inline
  (800-1000 pack alone, above 1000 with a pack) and names the date and that
  it supersedes Rev 3, matching sentence S5's wording for where the rule's
  source lives.
- `SPEC.md` rule 2's new line names the file and repeats the same "owner,
  2026-09-21, superseding Rev 3's 900" wording used in the code comment, so
  the two stay consistent if either is read alone.
- The "every count 250-1700" scenario loops in steps of 10 (matching
  `computeCellsNeeded`'s rounding) and attaches the failing count to the
  assertion message so a future regression names the count, not just "some
  count failed".
