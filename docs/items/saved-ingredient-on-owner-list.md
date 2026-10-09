# A saved ingredient the owner's list later gains, Tier B

Status: agreed 2026-10-09 ("agree to all", SI-Q1, SI-Q2); not started.
Written by the S13 session; built in batch S15, item 2, after My yeast
strains (docs/ROADMAP.md, Sessions).

## Why

My ingredients refuses a name on the owner's list when it is saved (MI-Q4),
but a name saved first and added to the workbook later is offered twice, the
brewer's (marked yours) and the owner's, each with its own numbers; the
brewery document still reads (noticed building My ingredients, 2026-10-07).

## Sentences: what must be true afterwards

- **SI-S1** A malt, hop or strain in My ingredients whose name is now also on the owner's list (capitals, accents and surrounding spaces ignored) is kept with its own numbers, and the boxes still offer it first, marked as yours, beside the owner's entry. A pick of either copies that entry's numbers.
- **SI-S2** My brewery shows, under each such ingredient, "Now also on the owner's list, with its own numbers."
- **SI-S3** Nothing drops or renames it: it goes only when the brewer deletes it.
- **SI-S4** The brewery's document and file still read with it. Saving that name again is refused, as any name on the owner's list is (MI-Q4), and the line says so.
- **SI-S5** Nothing else changes: no recipe, saved recipe, recipe file, brewery format or printed sheet.

## Decisions: agreed 2026-10-09

| id | Question | Decision | Rule |
|---|---|---|---|
| SI-Q1 | A malt or hop the brewer saved later appears on the owner's list: what happens? | Keep the brewer's, still offered first and marked as theirs, with a line in My brewery, "Now also on the owner's list, with its own numbers"; the brewer deletes theirs if they want | What the brewer saved is never dropped or renamed except by the brewer's own action |
| SI-Q2 | Strains too? | Yes, once My yeast strains lands | One rule for every saved ingredient |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Ordering:** the line is worked out from the owner's list each time My brewery is drawn, never stored, so a later workbook refresh shows or clears it with no saved change. **Schema migration:** none, no format changes. **Multi-tab and storage disabled:** as My ingredients today | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/saved-ingredient-on-owner-list.test.js`, new): *a saved malt, hop and strain whose name is on the owner's list is kept and offered first, marked yours* (a stored brewery holding "golden promise pale malt " (the owner's list has "Golden Promise Pale Malt") with its own FGDB and colour, a hop and a strain likewise, standing for entries saved before the list gained them: both offered, the brewer's first, each pick copying its own numbers); *My brewery says it is now also on the owner's list*; *it goes only when the brewer deletes it* (load, reload, a brewery file round trip: still there); *saving the name again is refused*; *nothing else changes*.

## Notes for the builder

- The scenario cannot change the owner's workbook; a stored brewery whose entry has a name on the owner's list stands for one saved before the list gained it. `persistence.js`'s brewery reader must keep reading such an entry (it does today: the roadmap line says so); confirm with the scenario.
- The line's name comparison is MI-Q4's (`sameName` in `ingredient-search.js`).
- If My yeast strains could not land, SI-S1 and SI-S2 cover malts and hops only, and the strain half returns to the roadmap.
