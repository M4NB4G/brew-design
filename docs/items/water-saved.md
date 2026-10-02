# Water saved with the recipe — Tier B

Status: agreed 2026-10-02 ("agree to all"), not started. Written by
the S3 session; to be built in batch S4, second of three items, after
`docs/items/water-treatment.md`. Water program step 4 (WP4, WP5, WP10).

## Why

In S3 the Water tab's entries last until the page is reloaded. A recipe's
water — the report it was brewed with, its style target, where the salts go,
the brewer's own amounts — belongs to the recipe; the brewery's water setup
(vessels, sparge, tank, losses) and usual treatment choice belong with the
brewery's other figures, so a new recipe starts from them (WP4, WP10).

## Sentences — what must be true afterwards

- **WS-S1** The Water tab's entries are part of the recipe: saved with it, carried in the recipe file, restored when it loads, and reset with it. The "Not saved yet" line goes.
- **WS-S2** The brewery's figures gain the water setup, the usual treatment choice and whether salts go in the kettle; a new recipe starts from them, and a blank one is the built-in figure, as for the other brewery figures.
- **WS-S3** A recipe saved before the water (saved format version 4 or earlier) loads as the same recipe with the built-in water entries — never the brewery's — and is saved back as version 5.
- **WS-S4** Brewery figures saved before the water setup (their version 1) load with the water setup blank, and are saved back as version 2.
- **WS-S5** A saved recipe or recipe file whose water entries are damaged is unreadable, like a damaged malt row: storage starts a new recipe and keeps the damaged copy aside; a file is refused with a message.
- **WS-S6** Nothing is calculated differently: a recipe with the same entries gives the same figures, saved or typed.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| S1 | Is the water report a brewery figure? | Yes: the brewery's usual water report (seven results) and the salts it keeps on hand are brewery figures a new recipe copies, editable per recipe; "Use this recipe's figures" takes them too | Most brewers brew with one water; typing it per recipe invites mistakes. The recipe keeps its own copy (WP4) |
| S2 | The style target | Per recipe only (built in American Pale Ale / Bitter) | WP7: chosen per beer |
| S3 | The brewer's own salt and acid amounts | Saved with the recipe, as typed | They are the recipe's additions |
| S4 | An older recipe's water | The built-in water entries: report blank, American Pale Ale, mash only, the built-in setup — checked against the built-in recipe, never the brewery's figures | SPEC 17: a recipe loads as it was saved whatever the brewery's figures |
| S5 | The recipe file | The same document as storage, water included (SPEC 13, unchanged rule) | One reader, one format |
| S6 | Saved format | Recipe document version 5; brewery document version 2 | SPEC 13, 17 |
| S7 | Where the brewery's water figures are set | Options → My brewery, a "Water" group below the existing figures; blank shows the built-in figure's absence as today | Brewery defaults K1 |
| K | Silent properties | **Schema migration:** v1–v4 recipe → v5 with built-in water; brewery v1 → v2 with the water setup blank. **Durability:** saved on every change, as the recipe is (synchronous autosave). **Multi-tab:** last write wins, as today. **Storage disabled:** the Water tab works and nothing is saved, as the recipe. **Idempotence:** load → save → load gives the same bytes | — |

## Scenarios — to be written first, must fail before

`apps/recipe/test/water-saved.test.js`:
1. *the water entries round-trip with the recipe through storage and the recipe file* — WS-S1, S3, S5; a blank result round-trips as blank.
2. *a new recipe starts from the brewery's water figures; a blank one is the built-in* — WS-S2, S1.
3. *an older recipe loads with the built-in water, whatever the brewery's figures* — WS-S3, S4.
4. *older brewery figures load with the water setup blank* — WS-S4.
5. *damaged water entries make a recipe unreadable* — WS-S5.
6. *the same entries give the same figures, saved or typed* — WS-S6.

## Far end — on the built app

1. Water entries survive a reload and an export/import; Reset starts from the brewery's water.
2. A version-4 recipe saved by the live site loads with every number as on the live site and the built-in water; saved back as version 5.
3. Brewery figures saved by the live site load, water setup blank.

## Notes for the builder

- `persistence.js` (SCHEMA_VERSION 5, upgrade chain, `hasShapeOf` / `hasRowsOf` gain the water entries); the brewery reader gains the water setup (BREWERY_VERSION 2). `state.js`: the water entries join `defaultRecipeState()`; `water-state.js` defaults move or are read from there. `SPEC.md` rules 8, 13, 17 change.
- Files likely touched: `apps/recipe/src/{state,persistence,water-state}.js`, `App.jsx`, `components/OptionsSection.jsx`, `components/water/WaterTab.jsx`, the new test, `SPEC.md`, `docs/TEST_COVERAGE.md`.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
