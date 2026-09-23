# Searchable malt and hop boxes — Tier B

Status: agreed 2026-09-23 ("agree to all else"), not started. Written by the
spec session; to be built by a new session from CLAUDE.md's kickoff prompt.
The first of two items split from the roadmap's "Searchable ingredient boxes"
(decision X1); the second is `docs/items/yeast-card.md`, built after this one.

## Why

The app carries the owner's ingredient list since 62f385b
(`apps/recipe/src/ingredients.json`, SPEC rule 16), but nothing offers it.
The owner's Recipe Designer spreadsheet already picks malts and hops by name
and looks their numbers up; this item gives the app's malt and hop name boxes
the same, with the brewer's own figures always winning. Malts and hops keep
their saved shape — a name plus numbers — so saved recipes, the recipe file
and the printed sheet do not change. Yeast needs a saved-format change and
is its own item (X1).

## Sentences — what must be true afterwards

- **S1** Typing in a malt, boil-hop or dry-hop name box shows matching ingredients from the owner's list, each suggestion with the numbers it would fill in (e.g. "American Crystal 40 — 77 %, 40 °L"; "Bravo — 14.4 %").
- **S2** Picking a malt fills its FGDB and colour and leaves its weight; picking a boil hop fills its alpha and leaves time, temperature and weight; picking a dry hop sets its name only (a dry hop has no other number).
- **S3** Every number stays editable; a number the brewer changes after picking stays as typed, and nothing overwrites it later.
- **S4** A name that is not on the list can still be typed, and leaves the numbers as they are.
- **S5** Picking changes the recipe exactly as if the brewer had typed those numbers: stats, saved recipes, the recipe file and the printed sheet behave as today.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| X1 | One item or two | Two: malts and hops here, no saved-format change; yeast as its own item (`yeast-card.md`), designed by the owner as an information card | Each change small enough to prove alone; only yeast touches the saved format |
| M1 | Builder model | Opus, high effort | The Models rule's default, every tier (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default. Every number a pick fills is a workbook cell (SPEC rule 16, the ingredient item's L5), so no hand-calculated pin is owed |
| B1 | Copy the numbers, or point back to the list | Copy. The recipe keeps its own FGDB, colour and alpha, as today | A later workbook edit never silently changes a recipe already designed or brewed |
| B2 | Does typing a name that exactly matches the list fill the numbers | No. Only an explicit pick from the suggestions fills anything | No number changes without a deliberate act by the brewer |
| B3 | Picking over numbers the brewer already typed | Overwrites them, no prompt; the suggestion showed the numbers first | The brewer sees exactly what they choose; a prompt on every pick is noise |
| B4 | How matching works | Capitals and accents ignored, matches anywhere in the name ("crys" finds every Crystal, "mittelfruh" finds Mittelfrüh); names starting with the typed text first, then the workbook's order | How people search; accents are needed for the owner's Kölsch and Mittelfrüh rows |
| B5 | A new row | Empty name box with the hint "Type to search", and today's starting numbers (FGDB 80 %, 2 °L; alpha 10 %; boil hop 10 min, 212 °F, 1 oz; dry hop 1 oz) | Start typing straight away; the starting numbers do not change |
| B6 | Keyboard and touch | Tap or click to pick; arrow keys, Enter and Escape work too | Works on phone and computer |
| B7 | Home/Pro | Suggestions show FGDB and alpha in percent, as the boxes do, in both modes | Consistent with the boxes |
| B8 | Proof | The search and pick logic in the suite (pure functions, no DOM); the behaviour on screen at the far end on the built app | Same approach as the footer and print sheet; a DOM test kit is its own roadmap line (TEST_COVERAGE gaps) |
| B9 | Phone | The suggestion list is usable at phone width inside today's sideways-scrolling tables and is not clipped by the table's edge; the tidy phone layout stays with the Phone width item | The owner chose this item before Phone width; it must still work on his phone |
| B10 | Specification | SPEC rule 16 gains: "Picking an ingredient copies its numbers into the recipe; the recipe never refers back to the list." | Makes B1 an invariant |
| B11 | Tier and silent properties | Tier B, inspector and far end. **Workbook edits:** after one deploys, new picks use the new numbers; saved recipes are unchanged (B1). **Offline:** the list ships inside the site. **Size:** about 9 KB added to the bundle. **Saved format:** unchanged, no version bump. **Idempotence:** picking the same ingredient twice equals picking it once. **Ordering:** suggestions per B4, deterministic for a given text | Picking puts numbers into the recipe (CLAUDE.md catch-all) |
| B12 | Files | `apps/recipe/src/ingredient-search.js` (new: the pure search, suggestion text and pick functions, reading `ingredients.json`), `apps/recipe/src/components/IngredientSearch.jsx` (new: the name box with its suggestion list), `apps/recipe/src/components/GristTable.jsx`, `apps/recipe/src/components/HopsSection.jsx`, `apps/recipe/src/components/shared/styles.js` (only if the suggestion list needs a token), `apps/recipe/test/ingredient-search.test.js` (new), `SPEC.md` (rule 16, B10), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (this row removed), this file. Not `ingredients.json`, the refresh tool or the ingredient test (a change there is its own Tier B, CLAUDE.md "Ingredient data") | Smallest change |

## Scenarios — `apps/recipe/test/ingredient-search.test.js`, written first, must fail before

1. *typing part of a name finds it: capitals and accents ignored, matched anywhere, names that start with the text first, then the workbook's order* — S1, B4. "crys" → the six Crystal malts in the workbook's order (American Crystal 120, 40, 60, 80, then English Crystal 15, 170); "mittelfruh" → Hallertau Mittelfrüh; "BRAV" → Bravo first; a text matching nothing → no suggestions.
2. *each suggestion shows the numbers a pick would fill, as the boxes show them* — S1, B7. American Crystal 40 shows 77 % and 40 °L; Bravo shows 14.4 %; a dry-hop suggestion shows no number.
3. *picking a malt fills its FGDB and colour and leaves the weight* — S2. A row weighing 3.5 lb picks American Crystal 40: fgdb 0.77, colour 40, weight 3.5, name "American Crystal 40".
4. *picking a boil hop fills its alpha and leaves time, temperature and weight; picking a dry hop sets its name only* — S2.
5. *a pick puts the list's numbers into the recipe exactly, and every stat equals the recipe with those numbers typed* — S5, B1. The reference recipe with a picked malt and hop, through `computeRecipe`, equals the same recipe with the numbers written in, field for field.
6. *editing the name, even to one on the list, leaves every number as it was* — S4, B2.
7. *the recipe keeps its own copy: a picked row does not change when the list does* — B1. Pick, then alter the list object the pick read from; the row is unchanged.
8. *a new row starts with an empty name and today's starting numbers* — B5.

Expected failure before the change: all eight fail at import (the module does not exist). Record the trimmed error. S3 (a number typed after a pick stays) and B6/B9 are proved at the far end.

## Far end — Tier B, on the built app

1. Type "crys" in a malt box: the Crystal malts, each with its FGDB and colour. Pick American Crystal 40: FGDB 77, colour 40, weight unchanged; OG and SRM equal what typing 77 and 40 gives.
2. Change that FGDB to 75: it stays; reload: still 75.
3. Type "My Malt" in a name box: no number changes. Type "American Crystal 40" by hand without picking: no number changes.
4. "brav" in a boil hop: Bravo 14.4 %; pick; alpha 14.4, IBU moves; time, temperature, weight unchanged. A dry hop: pick Citra; weight unchanged.
5. Pro mode: suggestions and boxes still read in percent. Keyboard: arrows, Enter, Escape.
6. At 375 px width: the suggestion list opens fully, not clipped by the table's sideways-scroll edge.
7. A recipe saved on the live site before this change loads with every number unchanged; the recipe file and the printed sheet unchanged for the same recipe.

## Notes from the spec session, for the builder

- **Order of the cards today:** Identity, Volumes, Grist, Hops, Yeast & Starter, Notes (`App.jsx`). Unchanged by this item.
- **Rows today:** malt `{ name, weightLb, fgdb, colorL }` (`EMPTY_MALT` in `GristTable.jsx`); boil hop `{ name, timeMin, wortTempF, weightOz, alphaAcidFraction }` and dry hop `{ name, weightOz }` (`EMPTY_KETTLE`, `EMPTY_DRYHOP` in `HopsSection.jsx`). The list's field names already match (`fgdb`, `colorL`, `alphaAcidFraction`). B5 changes only the starting name to `''`.
- **Row edits** go through `setRow(field, index, key, value)` in `App.jsx`, one key per call. A pick sets two or three keys; call it once per key, or add a row-merge helper — the builder's choice, but `App.jsx` is Tier B and must be named in the diff if touched (add it to B12's files in the builder's notes, as a claim).
- **Percent display** goes through `fractionToPercent` in `display.js` (SPEC rule 9); no `* 100` anywhere (the percent test greps components for it). `fractionToPercent(0.144)` is 14.399999999999999, so the suggestion text needs display precision (`num(x, d)`, excluded from the catch-all): "14.4 %", "77 %", "13.5 %". The number a pick writes into the recipe is the list's fraction itself, never a value re-parsed from that text.
- **Clipping:** the malt and hop tables sit in `overflowX: 'auto'` boxes, which clip an absolutely-positioned child. The suggestion list needs to escape that box (e.g. fixed positioning from the input's rectangle, or a portal).
- **Accents:** fold with `normalize('NFD')` and strip combining marks, on both the typed text and the names, for matching only; names are shown exactly as the list stores them.
- **Owner-facing language:** "your ingredient list", never the file name.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
