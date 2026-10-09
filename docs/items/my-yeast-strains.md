# My yeast strains, Tier B

Status: agreed 2026-10-09 ("agree to all", YS-Q1 to YS-Q4); not started.
Written by the S13 session; built in batch S15, item 1 (docs/ROADMAP.md,
Sessions).

## Why

A brewer saves a house strain that is not on the owner's list, as My
ingredients does for malts and hops. Left out of My ingredients (MI-Q1,
2026-10-07): the Yeast card reads a strain's lab range and attenuation from
the list each time it is drawn, so a house strain needs those figures typed
and its own design.

## Sentences: what must be true afterwards

- **YS-S1** In the Yeast card's strain box, a typed name on neither the owner's list nor My ingredients gets one more line under the suggestions, "Save to my ingredients", showing ale or lager (the card's choice) and three boxes, each optional: the lab's attenuation and the low and high ends of its temperature range. The range takes both ends or neither.
- **YS-S2** Saving keeps the strain with My brewery's figures. The recipe on screen does not change.
- **YS-S3** From then on the strain box offers it first, marked as yours. A pick names the strain and sets ale or lager, exactly as a pick from the owner's list does; the attenuation box and the fermentation temperature stay as they are.
- **YS-S4** For a saved strain, the Yeast card's information line shows what was saved (yours, ale or lager, attenuation, range), and the fermentation-temperature warning reads its range; with no range saved, no warning. Both are looked up by name each time the card is drawn, never stored in the recipe (SPEC 16).
- **YS-S5** A name on the owner's list cannot be saved, and the line says so. Saving a name already in My ingredients asks first, then replaces it in its place. A blank name offers nothing.
- **YS-S6** My brewery lists the saved strains with a Delete each; deleting one changes no recipe. The brewery file carries them, and its import's one question counts them with the malts and hops.
- **YS-S7** The brewery's document is version 7: a version-1 to 6 document loads with no saved strains and is saved back as 7. A damaged strain entry makes the document unreadable, as a damaged malt entry does.
- **YS-S8** With storage off, or a stored brewery that cannot be read, the strain box offers only the owner's list, nothing throws, and saving says the strain could not be kept.
- **YS-S9** Nothing else changes: no recipe figure, saved recipe (format 12), recipe file or printed sheet.

## Decisions: agreed 2026-10-09

| id | Question | Decision | Rule |
|---|---|---|---|
| YS-Q1 | What does a saved house strain keep? | Its name and ale or lager (both required); its attenuation and lab temperature range optional, typed on the save line, the range both ends or neither | The Yeast card shows a strain's figures as information and warns only from a range, so a blank figure shows nothing and nothing is guessed |
| YS-Q2 | What does a pick copy into the recipe? | Ale or lager only, as a pick from the owner's list does; attenuation stays the brewer's own box | Same as the owner's strains (Y3, Y4) |
| YS-Q3 | A name already on the owner's list? | Refused, as for malts and hops | MI-Q4 |
| YS-Q4 | The brewery file and saved figures? | Saved strains go with My brewery and its file (brewery format 7); older formats read with no saved strains | As My ingredients (SPEC 17) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Schema migration:** brewery versions 1 to 6 upgraded, then checked, saved back as 7. **Multi-tab:** every save or delete starts from the stored document, read again (SPEC 17, as My ingredients). **Storage disabled:** offered from the owner's list only, said so on a save (YS-S8). **Idempotence:** saving the same name twice asks, then replaces in place; one entry. The recipe's format does not change | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/my-yeast-strains.test.js`, new; jsdom where the card is drawn, as `my-ingredients.test.js`): *a strain on neither list offers to save it* (ale or lager shown, the three boxes; a range with one end refused); *a saved strain is offered first, marked yours, and a pick sets ale or lager only*; *the information line and the warning read the saved strain* (a hand-chosen range 64 to 72 °F: 75 °F warns, 68 °F does not; no range, no warning); *a name on the owner's list is refused, a saved name asks then replaces*; *My brewery lists and deletes saved strains, and no recipe changes*; *the brewery file carries them and the import question counts them*; *a version-6 brewery loads with no saved strains and is saved back as 7; a damaged strain entry makes it unreadable*; *storage off*; *nothing else changes* (the recipe document and sheet byte for byte).

## Notes for the builder

- My ingredients is the model throughout: `ingredient-search.js` (`MINE`, the save offer, `strainInfo`, `fermTempWarning`), `components/IngredientSearch.jsx` and `YeastCard.jsx`, `components/OptionsSection.jsx` (the list with Delete), `state.js` (`emptyMyIngredients` gains `yeasts`), `persistence.js` (brewery version 7, `readMyIngredients` checks strain entries as `ingredients.test.js` checks the owner's: a name; ale or lager; attenuation a fraction 0 to 1 or blank; the range both numbers, low not above high, or both blank), `App.jsx` (the save handler), `breweryImportQuestion`. SPEC 16 and 17.
- A saved strain's entry carries the owner's list's keys (`name`, `lab`, `productCode`, `type`, `apparentAttenuation`, `labTempLowF`, `labTempHighF`), `lab` and `productCode` empty, so the search and the information line read it as they read the owner's. Temperatures typed in °C are stored in °F by the engine's `cToF`, as every temperature box (SPEC 9).
- The attenuation box on the save line is in percent, stored as a fraction (the units table).
- Not decided 2026-10-09, put to the owner before building if it is reached: a strain name in both My ingredients and the owner's list (possible only after the owner's list gains it, "A saved ingredient the owner's list later gains", S15 item 2). Which entry the information line reads then. The item 2 rule (the brewer's offered first) suggests the brewer's.
