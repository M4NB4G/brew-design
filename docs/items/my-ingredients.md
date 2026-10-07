# My ingredients: Tier B

Status: agreed 2026-10-07 ("agree to all"; MI-Q8 revised to MI-Q8' and
MI-S5, MI-S7 and K revised with it, MI-Q12 to MI-Q14 added, the owner, the
same day), not started. Written by the session after F1; to be built by a new
Opus session as batch S8, on its own (docs/ROADMAP.md, Sessions).

## Why

A brewer whose malt or hop is not on the owner's list types its name and
numbers into every recipe by hand. This item lets them save it once, from
the name box, and be offered it again in that browser (the site has no
server). The saved ingredients belong to the brewery, not to a recipe: they
are kept and carried with My brewery's figures and the brewery file (the
owner, MI-Q8'). The owner's own additions still go in his workbook (MI-Q9).

## Sentences: what must be true afterwards

- **MI-S1** In a malt or boil-hop name box, a typed name that is on neither list gets one extra line under the suggestions, "Save to my ingredients", showing the numbers it would keep: for a malt its FGDB, colour, malt type and the two lab figures; for a hop its alpha.
- **MI-S2** Saving keeps the name and those numbers in this browser. The recipe on screen does not change.
- **MI-S3** From then on the matching boxes offer it, marked as yours: a malt in malt boxes, a hop in boil-hop and dry-hop boxes. Picking it fills the row exactly as a pick from the owner's list does. Weight, time, temperature and price are left as they are.
- **MI-S4** A name already on the owner's list (capitals and accents ignored) cannot be saved, and the line says so. Saving a name already in My ingredients asks first, then replaces it.
- **MI-S5'** My brewery, on the Options tab, lists My ingredients, each with a Delete. Deleting one changes no recipe.
- **MI-S6** No recipe, saved recipe, recipe file, brewery figure or printed sheet changes: a recipe keeps its own copy of every number (SPEC 16).
- **MI-S7'** The brewery file carries My ingredients; there is no separate file. Importing a brewery file replaces them with the file's, under the import's one question.
- **MI-S8** With storage off, or a stored brewery that cannot be read, the boxes offer only the owner's list and nothing throws; saving says the ingredient could not be kept.

## Decisions: agreed 2026-10-07

| id | Question | Decision | Rule |
|---|---|---|---|
| MI-Q1 | Which boxes | Malts and hops. Yeast strains are a roadmap line (Tier B) | The Yeast card reads a strain's lab range and attenuation from the list each time it is drawn; a house strain needs its own design |
| MI-Q2 | Where to save | From the name box, as the last line of its suggestions | The figures are already on the row; the roadmap's "from a searchable box" |
| MI-Q3 | Blank figures | Refused when FGDB, colour or alpha is blank. Malt type and lab figures may be blank, as on the owner's list | A pick never leaves a blank where the owner's list never would |
| MI-Q4 | A name that clashes with the owner's list | Refused; the brewer renames it (e.g. "Pale Malt (lot 42)") | Two suggestions of one name with different numbers would be a guess |
| MI-Q5 | Change or delete the owner's entries | No, only the brewer's own | The list is the owner's workbook (SPEC 16) |
| MI-Q6 | Changing one of your own | No edit boxes: save again from a row, which asks and replaces; delete it in My brewery | Smallest change |
| MI-Q7 | Does the recipe file carry them | No | The recipe already carries every number it uses |
| MI-Q8 | A separate My ingredients file | **Replaced by MI-Q8'** (the owner, 2026-10-07: attach it to My brewery) | (replaced) |
| MI-Q8' | Stored where | In the brewery's stored document, brewery format 6; the brewery file carries them | The brewery file is exactly what storage holds (SPEC 17); one file holds everything about the brewery |
| MI-Q9 | Export as rows for the owner's workbook | No | The roadmap: for the owner, a workbook row covers it |
| MI-Q10 | Keep a price with each ingredient | No | A pick never writes a price (SPEC 8) |
| MI-Q11 | Suggestion order | Yours first, then the owner's list; within each, names starting with the typed text first; yours in the order saved | The agreed search order (searchable boxes, B4) |
| MI-Q12 | Does saving an ingredient end the "set up My brewery" banner | No; only a brewery figure does, as now | The banner asks for the figures a new recipe starts from, and ingredients are not among them |
| MI-Q13 | Importing an older brewery file (no ingredients) | Replaces the list with none; the import's question names how many saved ingredients will go | One import replaces the whole brewery; nothing is lost without a warning |
| MI-Q14 | Does "Forget my brewery figures" delete My ingredients | No: it clears the figures and keeps the ingredients, and its confirm says so; ingredients are deleted one at a time from their list | The button names the figures; a list built over time must not vanish as a side effect |
| M1 | Builder model | Opus, high effort | The Models rule: saved-data items stay on Opus |
| M2 | Inspector model | Opus, default effort, a fresh session | No number is introduced: every figure saved is one the brewer typed or picked, and the version is a format tag, not a recipe value; no hand-calculated pin is owed |
| K' | Silent properties | **Format:** brewery 5 → 6; versions 1 to 5 read with no ingredients and are saved back as 6. **Unreadable:** a brewery copy that cannot be read is set aside, as found, under its own key before anything overwrites it (new for the brewery, as the recipe does). **Multi-tab:** each save re-reads the stored brewery first, and other tabs reload it on change (as today). **Atomicity:** one save, one write. **Idempotence:** saving the same ingredient twice equals saving it once. **Durability:** this browser only; the brewery file is the backup. **Storage off:** MI-S8 | Without the re-read, a figure saved in one tab would drop an ingredient saved in another |

## Scenarios: `apps/recipe/test/my-ingredients.test.js`, written first, must fail before

1. *the save line is offered for a malt or boil-hop name on neither list, with the numbers it would keep, and never on a dry-hop row* (MI-S1, MI-Q2).
2. *saving a malt keeps its name, FGDB, colour, type and lab figures, and the recipe does not change* (MI-S2).
3. *a saved malt is offered in malt boxes and a saved hop in boil-hop and dry-hop boxes, marked as yours, ahead of the owner's list* (MI-S3, MI-Q11).
4. *picking a saved ingredient fills the row as a pick from the owner's list does, leaving weight, time, temperature and price* (MI-S3).
5. *a name on the owner's list cannot be saved, capitals and accents ignored* (MI-S4, MI-Q4).
6. *saving a name already saved replaces it, and saving the same ingredient twice equals saving it once* (MI-S4, K').
7. *a blank FGDB, colour or alpha refuses the save; a blank type or lab figure is kept blank* (MI-Q3).
8. *deleting a saved ingredient changes no recipe* (MI-S5', MI-S6).
9. *the brewery document carries My ingredients at version 6; a version 1 to 5 document loads with none and is saved back as 6* (MI-Q8', K').
10. *the brewery file carries them; importing one replaces them, and an older file empties the list with the question naming how many go* (MI-S7', MI-Q13).
11. *an unreadable brewery copy is set aside under its own key before anything overwrites it* (K').
12. *a save re-reads the stored brewery first, so an ingredient saved in another tab is kept* (K').
13. *with storage off or an unreadable brewery, the boxes offer the owner's list only, nothing throws, and saving says it could not keep it* (MI-S8).
14. *saving an ingredient does not end the banner, and "Forget my brewery figures" keeps the ingredients* (MI-Q12, MI-Q14).
15. *nothing else changes: the recipe document, the recipe file, the printed sheet and a new recipe are as before* (MI-S6).

Expected failure before the change: the scenarios fail at import or on the
missing functions; record the trimmed error.

## Far end: Tier B, on the built app

1. Type "House Pale" in a malt box with FGDB 79, colour 3: the save line shows those numbers; save; nothing on the recipe changes.
2. A new malt row: "house" offers House Pale first, marked as yours; pick it: FGDB 79, colour 3, weight unchanged.
3. Save a hop "Farm Cascade" at 6.2 %; it is offered in a boil-hop and a dry-hop box.
4. Type "Bravo": no save line, and the line says it is on the list. Blank the FGDB of a new name: the save is refused.
5. Two tabs: save one ingredient in each; reload both: both are there.
6. My brewery lists both; Delete one: the recipe is unchanged. "Forget my brewery figures": the figures clear, the ingredients stay.
7. Export the brewery file; delete an ingredient; import the file: it asks, then the ingredient is back. Import a brewery file saved before this change: the question names how many will go.
8. The banner (with no brewery figures set) still shows after saving an ingredient.
9. Storage blocked: the boxes offer the owner's list and saving says it could not keep it.
10. At 375 px the save line is reachable in a malt row.

## Notes from the spec session, for the builder

- **Files likely touched:** `apps/recipe/src/persistence.js` (brewery version 6, reading 1 to 5 with no ingredients, the unreadable brewery copy set aside under its own key, e.g. `brew-design.brewery.unreadable`; "Forget" clears the figures and keeps the ingredients), `apps/recipe/src/state.js` (`emptyBreweryFigures` gains the list; `hasBreweryFigures` and `breweryBannerShown` ignore it, MI-Q12; `breweryFiguresFromRecipe` keeps it), `apps/recipe/src/ingredient-search.js` (search over the brewer's list then the owner's; the save check), `apps/recipe/src/components/IngredientSearch.jsx` (the save line, the "yours" mark), `apps/recipe/src/components/OptionsSection.jsx` (the list with Delete; Forget's confirm wording), `apps/recipe/src/App.jsx` (save through a re-read of the stored brewery), the tests that pin `BREWERY_VERSION` at 5 (`brewery-defaults`, `celsius-toggle`, `pro-unit-choices`, and the brewery-file tests), `SPEC.md` rules 16 and 17, `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (the My ingredients row removed), this file.
- **Shape:** the stored list can mirror the owner's list, `{ malts: [...], hops: [...] }`, each entry with the same keys as `ingredients.json` (a malt's blank type `""`, a blank lab figure null; a hop's `alphaAcidFraction`), so `pickIngredient` works on either list unchanged. The reader checks each entry as the ingredient test checks the owner's (a type the mash pH model knows; a lab figure on a type that does not use it refused). A damaged entry makes the document unreadable, as a damaged row does a recipe.
- **"Use this recipe's figures"** rewrites the brewery's figures; it keeps My ingredients as they are (the owner, MI-Q14's discussion).
- **Re-read before write:** every brewery save (a figure, an ingredient, a delete) starts from the stored brewery, not the copy on screen, or a stale tab drops another tab's change. App.jsx already reloads the brewery on the `storage` event.
- **Name matching** for the clash (MI-Q4) and the replace (MI-S4) uses the search's fold: capitals and accents ignored, surrounding spaces trimmed.
- **The save line** shows the numbers as the suggestions do (`suggestionDetail`), in percent in both modes.
- **Owner-facing language:** "My ingredients", "your ingredient list"; never a key or file name.
