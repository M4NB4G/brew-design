# Roadmap — outstanding work, by tier

Sorted by consequence, not convenience (CLAUDE.md, change control). Each line
names its tier and the re-test it costs. Sentences are drafts; the real scope
table is written when the item starts. Landed items are removed.

## Tier B — touches state, selectors, display, or reference-volume

| Item | Sentence (draft) | Re-test |
|---|---|---|
| Percent helpers | FGDB, efficiency, attenuation, and alpha convert fraction↔percent in `display.js`, round-tripped in the smoke test | suites + inspector |
| Options page | Pre-boil, post-boil, and ferment volumes are corrected to 60 °F from their measurement temperatures via `correctVolumeToRef`; mash water is not; °C display toggle | suites + inspector + far end |
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
| README | Describes the app as it is now, not "later phases" | none |
| Coverage gaps | Close the small items in `docs/TEST_COVERAGE.md` | suites |
| Notes / methodology page · print / batch sheet · JSON export | Later | — |
