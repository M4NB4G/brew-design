# Roadmap — outstanding work, by tier

Sorted by consequence, not convenience (CLAUDE.md, change control). Each line
names its tier and the re-test it costs. Sentences are drafts; the real scope
table is written when the item starts. Landed items are removed.

## Tier A — engine

| Item | Sentence (draft) | Re-test |
|---|---|---|
| `correctVolumeToRef` identity | Its doc says the factor is exactly 1 at the reference temperature, but `(v · d) / d` differs from `v` by one ulp for v = 7 or 5 (exact for 16, 14.5, 12, 5.5); compute `v · (d / d)` or short-circuit `tempF === refTempF`; golden values unaffected (noticed writing the Options page table, 2026-09-21) | suites + cross-family inspector |

## Tier B — touches state, selectors, display, or reference-volume

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Options page | An Options tab holds the three volume-measurement temperatures (°F, default 60 — the reference); pre-boil, post-boil, and ferment volumes are corrected through `toReferenceVolume` by the engine's `correctVolumeToRef`; mash water is not; saved recipes are upgraded to schema v2; the Recipe tab gets a Volumes card first. Scope table agreed: `docs/items/options-page.md` | suites + inspector + far end |
| °C display toggle | Every temperature shown (the measurement temperatures, the hop wort temperature) switches °F/°C from a header toggle that persists with the display settings; needs `cToF` in the engine, so Tier A + B (split from Options page, 2026-09-21) | suites + cross-family inspector + far end |
| Empty-field handling | Clearing a field explains why downstream stats are blank and never writes NaN into state | suites + inspector |
| Inverse solver UI | A target OG yields a grain bill via `solveGrist`; the round-trip residual FLAG is shown | suites + inspector |
| Water tab | The water-chemistry solver is reachable from the app | suites + inspector |
| Economics | Cost per batch and per unit via `rollupCost` / `costPerUnit` | suites + inspector |

## Tier C — components, styling

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Footer | Persyn attribution, parity with Brew Water Chem | look at it |
| Phone width | Stats bar and tables degrade without horizontal page scroll | look at it |
| Dead code | `UnitToggle.jsx` removed; unused imports in `MashSection.jsx` removed | suites |

## Tier D — config, docs, tooling, tests

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Netlify config | `netlify.toml`: build `npm test && npm run build`, publish `apps/recipe/dist`, Node 22, SPA redirect | build on Netlify |
| Title + favicon | The browser tab reads "Brew Design" and shows an icon | build |
| `npm audit fix` | Dev-tooling advisories cleared | suites |
| Line endings | `.gitattributes` pins `* text=auto eol=lf` so working copies stay LF on Windows (autocrlf rewrote the docs to CRLF on a branch checkout, 2026-09-20) | none |
| README | Describes the app as it is now, not "later phases" | none |
| Coverage gaps | Close the small items in `docs/TEST_COVERAGE.md` | suites |
| Notes / methodology page · print / batch sheet · JSON export | Later | — |
