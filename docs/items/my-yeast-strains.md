# My yeast strains, Tier B

Status: agreed 2026-10-09 ("agree to all", YS-Q1 to YS-Q4); YS-Q5 answered
2026-10-11 ("the brewer's entry"); landed 2026-10-11 on branch `S15` as "A
brewer saves a house yeast strain that is not on the owner's list from the
strain box, with ale or lager and its lab figures optional; it is offered
first and read by the Yeast card (brewery format 7)"; awaiting the owner's
"merge and push".
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
| YS-Q5 | A strain name in both My ingredients and the owner's list (possible once the owner's list gains it, "A saved ingredient the owner's list later gains")? | The Yeast card's information line and fermentation-temperature warning read the brewer's entry, the one the box offers first | The brewer's entry is offered first and marked as theirs (SI-S1); the card then describes the strain the brewer picked. Answered 2026-10-11 |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Schema migration:** brewery versions 1 to 6 upgraded, then checked, saved back as 7. **Multi-tab:** every save or delete starts from the stored document, read again (SPEC 17, as My ingredients). **Storage disabled:** offered from the owner's list only, said so on a save (YS-S8). **Idempotence:** saving the same name twice asks, then replaces in place; one entry. The recipe's format does not change | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/my-yeast-strains.test.js`, new; jsdom where the card is drawn, as `my-ingredients.test.js`): *a strain on neither list offers to save it* (ale or lager shown, the three boxes; a range with one end refused); *a saved strain is offered first, marked yours, and a pick sets ale or lager only*; *the information line and the warning read the saved strain* (a hand-chosen range 64 to 72 °F: 75 °F warns, 68 °F does not; no range, no warning); *a name on the owner's list is refused, a saved name asks then replaces*; *My brewery lists and deletes saved strains, and no recipe changes*; *the brewery file carries them and the import question counts them*; *a version-6 brewery loads with no saved strains and is saved back as 7; a damaged strain entry makes it unreadable*; *storage off*; *nothing else changes* (the recipe document and sheet byte for byte).

## Notes for the builder

- My ingredients is the model throughout: `ingredient-search.js` (`MINE`, the save offer, `strainInfo`, `fermTempWarning`), `components/IngredientSearch.jsx` and `YeastCard.jsx`, `components/OptionsSection.jsx` (the list with Delete), `state.js` (`emptyMyIngredients` gains `yeasts`), `persistence.js` (brewery version 7, `readMyIngredients` checks strain entries as `ingredients.test.js` checks the owner's: a name; ale or lager; attenuation a fraction 0 to 1 or blank; the range both numbers, low not above high, or both blank), `App.jsx` (the save handler), `breweryImportQuestion`. SPEC 16 and 17.
- A saved strain's entry carries the owner's list's keys (`name`, `lab`, `productCode`, `type`, `apparentAttenuation`, `labTempLowF`, `labTempHighF`), `lab` and `productCode` empty, so the search and the information line read it as they read the owner's. Temperatures typed in °C are stored in °F by the engine's `cToF`, as every temperature box (SPEC 9).
- The attenuation box on the save line is in percent, stored as a fraction (the units table).
- A strain name in both My ingredients and the owner's list (possible only after the owner's list gains it, "A saved ingredient the owner's list later gains", S15 item 2): answered 2026-10-11, YS-Q5, the brewer's entry. Item 1 looks a strain up by name in My ingredients first, then the owner's list; item 2's scenario covers a name in both.

## Builder's notes (S15, 2026-10-11)

Claims for the inspector to verify; none is a decision the sentences made.

- **YS-S1 read with YS-S5.** The save line shows for any name not on the owner's list, as for malts and hops; for a name already in My ingredients its save asks, then replaces in place (YS-S5). YS-S1's "on neither list" is the first save; YS-S5's replace needs the line on a saved name too.
- **The save line is a group under the suggestions, not one of them.** A list of suggestions cannot hold boxes, so the list's popup holds the suggestions and, under them, a group "Save to my ingredients · Ale" (or Lager) with the three boxes and a Save button. Focus may move from the strain box into the group without closing it (Tab, or a click); Enter in a box saves; Escape closes it and returns to the strain box. The popup's frame (border, shadow, place) moved from the list to a wrapper around it, so the malt and hop lists look as before; their save line is unchanged and is not shown for a strain.
- **What a save refuses** (each said in the group, Save then does nothing): a range with one end, a low end above the high end, an attenuation outside 0 to 100 %. These are the brewery reader's checks (the item's notes), so a save never keeps what a load would refuse. A name on the owner's list shows the refusal line only, with no boxes.
- **After a kept save** the three boxes clear, so the next strain starts blank.
- **The information line** for the brewer's strain reads "Yours · Ale · lab range 64–72 °F · attenuation 76 %", leaving out a range or attenuation saved blank. The owner's strains' line, and what the card is handed for them, are unchanged.
- **Lookup.** A strain is looked up in My ingredients with MI-Q4's comparison (capitals, accents, surrounding spaces), then on the owner's list as before (capitals and surrounding spaces).
- **Temperatures and percent.** The range boxes take the header's unit; °C is stored by the engine's `cToF` through `display.js` (15.6 °C as the reference, as every temperature box). The attenuation box is in percent, stored as the fraction (percent / 100).
- **Forget my brewery figures** keeps the strains: with only strains saved, the brewery document is kept (the count of saved ingredients now includes strains), as for malts and hops (MI-Q14).
- **Earlier scenarios changed for the format:** the brewery version pins read 7 (acid-aimed, brewery-defaults, celsius-toggle, my-ingredients, pro-unit-choices, sparge-typed, water-saved); the "another" or "newer" brewery versions read 8 (brewery-defaults, brewery-file, my-ingredients, water-saved); hand-built My ingredients gain an empty strain list (brewery-defaults, celsius-toggle, my-ingredients, pro-unit-choices). No assertion loosened; the smoke test untouched; scenario titles unchanged. `eslint.config.js` gives the new jsdom test the browser's globals.
- **Numbers introduced:** none that is a recipe value. The brewery format tag is 7; the 0–1 check on a saved attenuation and the low-not-above-high check are what a saved strain may hold; percent / 100 and `cToF` are display.js's and the engine's; the boxes' step, min and max are input attributes; the rest is layout.
- **Roadmap:** one Tier C line added, in scope: My ingredients' empty note still names malts and boil hops only (its wording is pinned byte for byte by the page-error scenario, so it is its own change).
- **Far end** 2026-10-11, the built app in Chromium served with netlify.toml's headers: 20 checks, all pass (TEST_COVERAGE's row). It found one defect the scenarios had not: the malt and hop save option also showed among a strain's suggestions; fixed before staging, and scenario 1 now asserts it (it fails with the defect).
