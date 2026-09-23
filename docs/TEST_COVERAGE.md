# Test coverage — what proves each rule

Every `SPEC.md` rule and the proof that holds it. "Hook" = `tools/hooks/pre-commit`.
"Inspector" = no mechanical proof; checked by a cold read of the diff. Updated
in the same commit as any change to a proof (CLAUDE.md, procedure step 5).

## SPEC rules

| Rule | Proof | Status |
|---|---|---|
| 1 Engine pure, no I/O | none mechanical; inspector on Tier A | gap |
| 2 Constants exact | `golden-master.test.js` (19), `starter.test.js` (12), `solver.test.js` (4), `units.test.js` (11), `water/**` (135) — a wrong constant fails a pinned value; the 400B band's 800-1000 boundary is a recorded deviation, not a spreadsheet constant (rule 2, 2026-09-21) | proven |
| 3 `// FLAG:` never silent-fix | inspector; box names the FLAG | by design |
| 4 Tolerances never loosened | inspector reads test diffs | gap |
| 5 Public surface is `index.js` only | none; app imports `@brew/engine` root only | gap |
| 6 60 °F reference; mash water as entered | `smoke.test.js` postBoil 14.5, mashRv 1.7931034 at 60 °F; `options.test.js` scenarios 1–4: the 60 °F defaults leave every derived number the engine's for the uncorrected volumes (within 1e-12); a pre-boil, post-boil, or ferment temperature moves only its own volume, to the engine's `correctVolumeToRef`, and mash Rv stays the as-entered value | proven |
| 7 No brewing math in the app | hook grep (formula signatures) + inspector | proven (hook) |
| 8 One canonical state | `smoke.test.js` drives canonical state through `computeRecipe`; `persistence.test.js` asserts the stored document holds canonical field names and units | partial |
| 9 Convert only at the edges | `smoke.test.js` round-trips: volume 16 gal Home/Pro, SG→Plato, cells 570→0.57 T; `percent.test.js` pins fraction↔percent (0.8↔80, 0.147↔14.7, every reference fraction within 1e-12) and reads every component for leftover `* 100` / `/ 100` | partial — hop weight and dry-hop rate unproven |
| 10 Only `selectors.js` calls engine compute | none | gap |
| 11 `toReferenceVolume` routing and correction | `options.test.js` scenarios 2–6: each kind corrected at its own temperature through `computeRecipe` (`refVolumesGal` carries the three); direct: 16 gal at 190 °F equals `correctVolumeToRef(16, 190)`, and NaN, 31, 213, Infinity, a missing map, a missing kind → NaN; an uncorrectable temperature blanks the dependent stats and nothing throws | proven |
| 12 Smoke test passes unchanged | hook runs it on A/B commits; Netlify runs both suites before every build (`apps/recipe/netlify.toml`) | proven |
| 13 Persisted state canonical, one versioned key (3), version 1 read as 60 °F, versions 1 and 2 read with an empty name, style and notes, unreadable → defaults, NaN round-trips | `apps/recipe/test/persistence.test.js` (7); `options.test.js` scenarios 7–9: the document carries version 3 and the temperatures, a cleared one round-trips as NaN; a version-1 document loads as the same recipe at 60/60/60 with an empty name, style and notes and is saved back as version 3; version 2 loads with the three empty, version 3 loads, 0 / 4 / `"1"` / `"2"` / `"3"` → defaults; `identity.test.js` scenario 3: name, style and notes round-trip at version 3; `recipe-file.test.js` scenario 1: an exported recipe file is byte-for-byte the stored document, at version 3, and import reads it with the same reader (a version-2 file reads with an empty name, style and notes). Far end 2026-09-23: a version-2 document the live site wrote (pre-boil 8) loads on the branch build with every number on the Recipe tab identical to the live site and the three empty, and is rewritten as version 3; a typed name, style and two-line notes survive a reload with no number moved. Far end 2026-09-20 on the built app: edit → reload holds; Pro → reload holds; Reset cancel unchanged, accept → reload defaults. Far end 2026-09-21: the version-1 document `main` wrote (pre-boil 8) loads as pre-boil 8 with every stat as on `main` and is rewritten as version 2 | proven |
| 14 No hex outside `styles.js` | hook grep | proven (hook) |
| 15 Read-only values are plain text | none; visual | by design (look at it) |
| 16 The ingredient list is the owner's workbook, generated, unrounded, never recipe state | `apps/recipe/test/ingredients.test.js` scenarios 1–4: the copy equals the list read from the workbook field by field with exact equality, in the workbook's order (42 malts, 43 hops, 32 yeasts; Bravo 0.144 as stored; Rice Hulls 0 and 0 °L; accents kept); a row added, removed or renamed, or a number changed, in the workbook alone is named by sheet and row; an unusable workbook (duplicate name ignoring capitals, blank or non-number required number, percentage outside 0–100% incl. 82 typed without %, negative colour, yeast neither Ale nor Lager, lab range inverted or with one end) is refused naming sheet and row, and the refresh writes nothing; two refreshes are byte-identical and equal the committed copy. Hooks: `pre-commit` runs the suite when the workbook, the copy, the refresh tool or the test is staged; `commit-msg` requires a PASS box for the refresh tool or the test. Far end 2026-09-23: nothing imports the copy — the built app is byte-identical to `main`'s (bundle `index-CQcNJ7jR.js`, the live site's); a one-cell edit in a scratch workbook refreshes to exactly one changed line and the test fails naming Hops row 5 (Bravo). Never in recipe state or a saved recipe: nothing imports the copy (inspector) | proven |

## Scenarios

| Scenario | File | Count |
|---|---|---|
| grist golden master · hops golden master · yeast golden master · starter golden master (cellsNeeded 570) | `packages/engine/test/golden-master.test.js` | 19 |
| solveStarter band selection (900B/950B/1000B/1010B the 400B band's 800-1000 rule; every count 250-1700 has an option) · intentional boundary gaps (strict inequalities, transcribed as-is) | `packages/engine/test/starter.test.js` | 12 |
| solveGrist round-trip (pinned residual, see solver.js FLAG) | `packages/engine/test/solver.test.js` | 4 |
| grain-bill share per malt: each malt's share is its weight over the bill total, for the reference recipe (10/11 and 1/11, worked by hand) · the shares sum to 1 for a bill with a positive total weight · a zero-weight malt is listed with a share of 0 · an empty bill and a cleared weight yield shares that are not numbers, and nothing throws | `packages/engine/test/grist.test.js` | 4 |
| basic conversions · water density table · correctVolumeToRef | `packages/engine/test/units.test.js` | 11 |
| unit constants · volumeToGallons · volumeUnit · acidMaltUnits | `packages/engine/test/water/units.test.js` | 21 |
| saltContribution · first-principles hand-calculations | `packages/engine/test/water/salts.test.js` | 20 |
| acidCapacity · acidAlkalinityReduction · acidContribution · applyAcids — multi-acid linearity | `packages/engine/test/water/acids.test.js` | 32 |
| residualAlkalinity · sulfateChlorideRatio · ratioCharacter — Palmer-Kaminski Table 5.2 · first-principles (Kolbach) | `packages/engine/test/water/ra.test.js` | 21 |
| solveAdditions — smoke, return shape, alkalinity branch, ion targeting, traced hand-calculations · predictFinalProfile | `packages/engine/test/water/solver.test.js` | 23 |
| reference batches parity | `packages/engine/test/water/reference-batches/parity.test.js` | 18 |
| parity through the UI selector (computeRecipe) · unit-conversion boundary round-trips | `apps/recipe/test/smoke.test.js` | 13 |
| persistence: saved recipe restored (canonical, one versioned key) · cleared field round-trips as NaN · display settings restored · reset removes the saved copy · nothing saved → defaults · unreadable data → defaults · unavailable storage is a no-op | `apps/recipe/test/persistence.test.js` | 7 |
| percent: a fraction shows as a percent · a percent entered parses to the fraction · every reference-recipe fraction round-trips within 1e-12 · ABV 0.0748883 shows as 7.49% · no fraction↔percent arithmetic remains in components | `apps/recipe/test/percent.test.js` | 5 |
| options page: the default temperatures are 60 °F and leave every derived number the engine's for the uncorrected volumes, within 1e-12 · a pre-boil temperature corrects only the pre-boil volume · a post-boil temperature corrects the post-boil volume · a fermentation temperature corrects the fermentation volume · `toReferenceVolume` corrects at the temperature of its kind and returns NaN for one the engine cannot correct · an uncorrectable temperature blanks the dependent stats and nothing throws · the saved document carries version 3 and the temperatures; a cleared one round-trips as NaN · a version-1 document loads as the same recipe with the reference temperatures and an empty name, style and notes, and is saved back as version 3 · a version-2 document loads with an empty name, style and notes; a version-3 document loads; any other version yields the defaults | `apps/recipe/test/options.test.js` | 9 |
| recipe identity: a new recipe has an empty name, style and notes · the three fields reach no calculation: every derived number is identical with them empty and filled · name, style and notes round-trip through save and load at version 3 | `apps/recipe/test/identity.test.js` | 3 |
| recipe file: export produces the same document the app saves, at the current version · the file name is the recipe name plus today's date; an unnamed recipe uses the fallback · importing a valid file replaces the recipe and the display settings, and becomes the working copy · importing a file that is not a Brew Design recipe is refused and leaves the current recipe untouched · importing a damaged file is refused and leaves the current recipe untouched · importing a file with a newer version is refused, naming that reason · exporting changes no recipe value and no derived number | `apps/recipe/test/recipe-file.test.js` | 7 |
| print sheet: the sheet renders every recipe value from the derived values it is given, computing nothing (the reference recipe against `computeRecipe` through the display boundary, hand-checked shares 93.1/6.9 % and mash Rv 1.79; altered derived values print as given; a blank prints a dash) · an empty notes box produces no notes section · a recipe with no name prints no title, never an invented one · a volume measured at the reference temperature prints no temperature note; one measured elsewhere does · the sheet's numbers follow the display mode: Home and Pro produce different volume and hop-weight text for the same recipe. Far end 2026-09-23: print preview (headless Chrome, Letter) shows the sheet alone; hidden on screen; Home/Pro changes the printed units | `apps/recipe/test/print-sheet.test.js` | 5 |
| footer: the footer names Persyn Chemical Engineering and Consulting beside the logo, and nothing else · screen readers skip the footer logo (empty text alternative, hidden from assistive technology) · the white-background logo file is gone and nothing under `apps/recipe/src` refers to it. Far end 2026-09-23: the footer below the last section on Recipe and Options, see-through on the tint, water-app spacing, no sideways scroll at 375 px; print preview (headless Chrome, Letter) shows the sheet alone with the see-through logo | `apps/recipe/test/footer.test.js` | 3 |
| ingredient list: the app's ingredient list is exactly the workbook's: every row, every number, in the workbook's order · a row added, removed or renamed, or a number changed, in the workbook but not the copy fails the match and names the row · an unusable workbook is refused, naming the sheet and row: duplicate name, blank or non-number required number, percentage outside 0–100%, negative colour, yeast neither Ale nor Lager, lab range inverted · refreshing twice gives an identical copy | `apps/recipe/test/ingredients.test.js` | 4 |

Total: engine 185, app 56.

## Gaps and the cost of closing each

| Gap | Cost | Tier when closed |
|---|---|---|
| Hop weight and dry-hop rate round-trips (rule 9) | small: 2 assertions | D |
| Only `selectors.js` imports engine compute functions (rule 10) | small: hook grep | D |
| App imports only the `@brew/engine` root (rule 5) | small: hook grep | D |
| Engine has no I/O imports (rule 1) | small: hook grep for `fs`, `fetch`, `document`, `window` | D |
| Component input→state round trip at the UI (rules 8/9) | medium: jsdom + testing-library | D |

## Re-tests owed

None. Netlify deploys `main` at https://brew-design.netlify.app (live since
2026-09-20; 277ad62 the first live commit). Percent helpers re-tested there
2026-09-21: Netlify's bundle is `index-DgrrMrtC.js`, the same content hash
as the builder's local build; FGDB 80/80, efficiency 75, attenuation 77,
alpha 12/6, ABV 5.7%; alpha 14.7 → stored `alphaAcidFraction` 0.147, 56 IBU.
Netlify config re-tested there 2026-09-21 (`main@965d3eb`): the deploy log
shows `npm test` running both suites (engine 179/179, app 34/34) and
passing before `vite build`; the deployed bundle `index-D6fkUgun.js` carries
the same content hash as the local build; the live site loaded and computed
a recipe normally straight after. Rule 12's gap is closed (see the rule
table above); see `docs/items/netlify-config.md` for the full log excerpt.
