# Test coverage — what proves each rule

Every `SPEC.md` rule and the proof that holds it. "Hook" = `tools/hooks/pre-commit`.
"Inspector" = no mechanical proof; checked by a cold read of the diff. Updated
in the same commit as any change to a proof (CLAUDE.md, procedure step 5).

## SPEC rules

| Rule | Proof | Status |
|---|---|---|
| 1 Engine pure, no I/O | none mechanical; inspector on Tier A | gap |
| 2 Constants exact | `golden-master.test.js` (19), `starter.test.js` (10), `solver.test.js` (4), `units.test.js` (11), `water/**` (135) — a wrong constant fails a pinned value | proven |
| 3 `// FLAG:` never silent-fix | inspector; box names the FLAG | by design |
| 4 Tolerances never loosened | inspector reads test diffs | gap |
| 5 Public surface is `index.js` only | none; app imports `@brew/engine` root only | gap |
| 6 60 °F reference; mash water as entered | `smoke.test.js` postBoil 14.5, mashRv 1.7931034 — `toReferenceVolume` is a no-op, so routing is not yet distinguishable | partial |
| 7 No brewing math in the app | hook grep (formula signatures) + inspector | proven (hook) |
| 8 One canonical state | `smoke.test.js` drives canonical state through `computeRecipe`; `persistence.test.js` asserts the stored document holds canonical field names and units | partial |
| 9 Convert only at the edges | `smoke.test.js` round-trips: volume 16 gal Home/Pro, SG→Plato, cells 570→0.57 T | partial — hop weight, dry-hop rate, and percent (FGDB/efficiency/attenuation/alpha) unproven |
| 10 Only `selectors.js` calls engine compute | none | gap |
| 11 `toReferenceVolume` routing | none (no-op) | gap |
| 12 Smoke test passes unchanged | hook runs it on A/B commits; no CI | partial |
| 13 Persisted state canonical, one versioned key, unreadable → defaults, NaN round-trips | `apps/recipe/test/persistence.test.js` (7); far end 2026-09-20 on the built app: edit → reload holds; Pro → reload holds; Reset cancel unchanged, accept → reload defaults | proven |
| 14 No hex outside `styles.js` | hook grep | proven (hook) |
| 15 Read-only values are plain text | none; visual | by design (look at it) |

## Scenarios

| Scenario | File | Count |
|---|---|---|
| grist golden master · hops golden master · yeast golden master · starter golden master (cellsNeeded 570) | `packages/engine/test/golden-master.test.js` | 19 |
| solveStarter band selection · intentional boundary gaps (strict inequalities, transcribed as-is) | `packages/engine/test/starter.test.js` | 10 |
| solveGrist round-trip (pinned residual, see solver.js FLAG) | `packages/engine/test/solver.test.js` | 4 |
| basic conversions · water density table · correctVolumeToRef | `packages/engine/test/units.test.js` | 11 |
| unit constants · volumeToGallons · volumeUnit · acidMaltUnits | `packages/engine/test/water/units.test.js` | 21 |
| saltContribution · first-principles hand-calculations | `packages/engine/test/water/salts.test.js` | 20 |
| acidCapacity · acidAlkalinityReduction · acidContribution · applyAcids — multi-acid linearity | `packages/engine/test/water/acids.test.js` | 32 |
| residualAlkalinity · sulfateChlorideRatio · ratioCharacter — Palmer-Kaminski Table 5.2 · first-principles (Kolbach) | `packages/engine/test/water/ra.test.js` | 21 |
| solveAdditions — smoke, return shape, alkalinity branch, ion targeting, traced hand-calculations · predictFinalProfile | `packages/engine/test/water/solver.test.js` | 23 |
| reference batches parity | `packages/engine/test/water/reference-batches/parity.test.js` | 18 |
| parity through the UI selector (computeRecipe) · unit-conversion boundary round-trips | `apps/recipe/test/smoke.test.js` | 13 |
| persistence: saved recipe restored (canonical, one versioned key) · cleared field round-trips as NaN · display settings restored · reset removes the saved copy · nothing saved → defaults · unreadable data → defaults · unavailable storage is a no-op | `apps/recipe/test/persistence.test.js` | 7 |

Total: engine 179, app 20.

## Gaps and the cost of closing each

| Gap | Cost | Tier when closed |
|---|---|---|
| Percent display helpers (rule 9) live in components with no round-trip test | small: two helpers in `display.js` + 2 assertions | B |
| Hop weight and dry-hop rate round-trips (rule 9) | small: 2 assertions | D |
| `toReferenceVolume` routing (rule 11) | small: spy the module; assert 3 calls, none for mash water | D |
| Only `selectors.js` imports engine compute functions (rule 10) | small: hook grep | D |
| App imports only the `@brew/engine` root (rule 5) | small: hook grep | D |
| Engine has no I/O imports (rule 1) | small: hook grep for `fs`, `fetch`, `document`, `window` | D |
| No CI (rule 12) | small: `npm test` in the Netlify build command | D |
| Component input→state round trip at the UI (rules 8/9) | medium: jsdom + testing-library | D |

## Re-tests owed

None. Nothing is deployed.
