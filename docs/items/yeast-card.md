# Yeast card — Tier B

Status: agreed 2026-09-23 ("Q6 i like the warning … agree to all else"), not
started. Written by the spec session; to be built by a new session from
CLAUDE.md's kickoff prompt, **after** `docs/items/searchable-malt-hop-boxes.md`
has landed (Q8): it reuses that item's search box.

## Why

The owner's design (2026-09-23): "a new card in between grist and hops called
Yeast that when a strain is selected the temp ranges and attenuation are given
as info for the brewer to then type in the spec temps and attenuation." His
Recipe Designer records a yeast brand, strain, apparent attenuation and an
initial fermentation temperature ("Grist and Pitch Calc's" J2–K6); the app
stores only ale/lager and the pitch-rate choice, and keeps attenuation on the
Grist card. The ingredient list carries each strain's lab, product code,
ale/lager, lab temperature range and attenuation (SPEC rule 16). This item
gives yeast its own card: the strain is searched from the list, the list's
figures are shown as information, and the brewer types their own.

## Sentences — what must be true afterwards

- **Y1** A new **Yeast** card sits between Grist and Hops.
- **Y2** Its strain box searches the owner's list by name, lab or product code ("US-05", "WLP001" both work); a strain not on the list can still be typed.
- **Y3** When the strain is on the list, the card shows its lab, product code, ale/lager, lab temperature range and attenuation as plain text; none of it is copied into a box.
- **Y4** The brewer types their own attenuation and fermentation temperature on this card; picking a strain never changes either. Attenuation moves here from the Grist card — the same number, the same effect on FG and ABV.
- **Y5** Saved recipes and recipe files carry the strain and the fermentation temperature; a recipe saved before loads with an empty strain and a blank fermentation temperature, every number as before.
- **Y6** The printed sheet shows the strain, ale/lager, the attenuation and the fermentation temperature.
- **Y7** Nothing calculated changes: FG, ABV, pitch rate, cells and starter are the same for the same attenuation and ale/lager.
- **Y8** When the strain is on the list and the fermentation temperature is outside its lab range, the card shows a warning naming the range. It changes no number and blocks nothing.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default, every tier (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default. No number is computed: the lab range and attenuation shown are workbook cells (SPEC rule 16); the warning is a comparison against them; the schema tag is a version, not a recipe value |
| Q1 | One fermentation temperature, or a range | One temperature (°F), like the "Initial Ferm Temp" / "Your ferm temp" figure in the owner's workbooks | Matches how his recipes record it; a range can be added later |
| Q2 | Ale/lager | The ale/lager choice moves to the Yeast card; **picking a strain sets it**, still changeable. Nothing else is set by a pick | Ale/lager is a fact of the strain and sets the pitch rate (lager pitches at twice the ale rate for the same character); a lager strain left on "Ale" would silently under-pitch |
| Q3 | The existing "Yeast & Starter" card | Renamed **"Pitch & Starter"**; keeps "desired yeast character", pitch rate, cells and starter options; stays where it is | Two cards named yeast would confuse |
| Q4 | A strain not on the list | The card says "not on your list" and shows no figures | Nothing is invented |
| Q5 | The information after a workbook edit | Shows the list's current figures (it is guidance, not a recipe number); what the brewer typed never changes | Up-to-date lab figures are what the brewer wants |
| Q6 | Warn when the fermentation temperature is outside the lab range | **Yes, in this item** (Y8) — the owner, 2026-09-23 | His call |
| Q7 | A new recipe | Empty strain, blank fermentation temperature, attenuation 77 % as today | The app never invents a strain |
| Q8 | Order | After the searchable malt and hop boxes | Each its own commit and deploy; this item reuses that search box |
| Q9 | Tier and silent properties | Tier B, inspector and far end. **Schema:** version 3 → 4; versions 1–3 stay readable (strain empty, temperature blank, everything else as today) and are saved back as 4. **Newer file on an older site:** refused as newer, as today. **Encoding:** a typed strain keeps its accents and capitals exactly. **Durability:** one key, one document, last write wins across tabs — unchanged. **Blank temperature:** NaN in state, `null` in the document, NaN again on load (SPEC rule 13) | The saved format changes |
| Q10 | Files | `apps/recipe/src/state.js` (yeast gains the strain and the fermentation temperature), `apps/recipe/src/persistence.js` (version 4, reading 1–3), `apps/recipe/src/App.jsx` (card order), `apps/recipe/src/ingredient-search.js` (strain search by name, lab or product code; the information and the warning check), `apps/recipe/src/components/YeastCard.jsx` (new), `apps/recipe/src/components/YeastSection.jsx` (renamed Pitch & Starter; ale/lager removed), `apps/recipe/src/components/GristTable.jsx` (attenuation removed), `apps/recipe/src/components/recipe-sheet-data.js` and `RecipeSheet.jsx` (Y6), `apps/recipe/test/yeast-card.test.js` (new), the existing app tests that pin the version or the reference state (`smoke`, `persistence`, `options`, `identity`, `recipe-file`, `print-sheet`), `SPEC.md` (rule 13), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (this row removed), this file | Smallest change |

## Scenarios — `apps/recipe/test/yeast-card.test.js`, written first, must fail before

1. *picking a strain names it and sets ale or lager, and changes no other number* — Y2, Q2, Y4. Pick SafLager W-34/70 on an ale recipe with attenuation 0.8 and 67 °F: strain named, type lager, attenuation and temperature unchanged.
2. *the strain search finds a strain by name, lab or product code* — Y2. "us-05" → SafAle US-05; "WLP001" → WLP001 California Ale; "fermentis" → the Fermentis strains in list order; "kolsch" → WLP4061 Rhine Kölsch Ale.
3. *a strain on the list shows its lab, product code, ale/lager, lab range and attenuation as information; one not on the list shows none* — Y3, Q4. A07 Flagship → Imperial, A07, Ale, 60–72 °F, 80 %; "House strain" → not on the list.
4. *a fermentation temperature outside the strain's lab range warns; inside, at either end, blank, or with a strain not on the list, it does not* — Y8. A07 Flagship (60–72): 59 and 73 warn; 60, 67, 72 do not; blank does not; "House strain" at 90 does not.
5. *moving the yeast changes no stat: the same attenuation and ale/lager give the same FG, ABV, pitch rate, cells and starter* — Y7. The reference recipe with a strain and a temperature, through `computeRecipe`, equals the reference recipe without them, field for field.
6. *the saved document carries version 4 with the strain and the fermentation temperature; a blank temperature round-trips as blank* — Y5, Q9.
7. *a version 1, 2 or 3 document loads with an empty strain and a blank fermentation temperature, every number as before, and is saved back as version 4* — Y5.
8. *the printed sheet shows the strain, ale/lager, attenuation and fermentation temperature; a blank prints a dash* — Y6.
9. *a new recipe has an empty strain, a blank fermentation temperature and attenuation 77 %* — Q7.

Expected failure before the change: the strain and temperature fields do not exist, the version is 3, and the search has no strain lookup. Record each scenario's trimmed failure.

## Far end — Tier B, on the built app

1. The Yeast card sits between Grist and Hops; attenuation is on it and no longer on Grist; the old card reads "Pitch & Starter".
2. Type "us-05": SafAle US-05; pick it: the information line (Fermentis, US-05, Ale, 64–79 °F, 80 %) shows; ale/lager reads Ale; attenuation and temperature unchanged.
3. Pick SafLager W-34/70: ale/lager becomes Lager; pitch rate and cells change as the engine gives for lager at the same character; FG and ABV unchanged.
4. Fermentation temperature 50: warning naming 54–64 °F; 54: no warning; blank: no warning. "House strain": "not on your list", no warning at any temperature.
5. A recipe the live site saved (version 3) loads with every number identical to the live site, strain empty, temperature blank, and is rewritten as version 4. An exported file carries version 4; `main`'s build refuses it as newer.
6. Print preview: the yeast lines on the sheet.

## Notes from the spec session, for the builder

- **State today:** `yeast: { type: 'ale' | 'lager', density: 'high' | 'mod' | 'low' }`; `apparentAttenuation` is top-level and stays there (only its box moves). Suggested new fields: `yeast.strain` (text, `''`) and `yeast.fermTempF` (°F, `NaN` blank) — the builder's choice of names, recorded in the builder's notes.
- **Reading old documents** (`persistence.js`): `hasShapeOf` checks top-level keys only; the new fields live inside `yeast`, so the version-1/2/3 branch must add them explicitly, as version 3 added name, style and notes.
- **"On the list":** the strain's name equals a list name, capitals and surrounding spaces ignored. The information shows for a typed name that matches; only a pick sets ale/lager (the malt-and-hop item's B2 applies: typing changes no number, and ale/lager selects a pitch rate).
- **The warning** compares the typed temperature with the list's `labTempLowF`/`labTempHighF`, both ends inside. A list row with no range (allowed as a blank pair, SPEC rule 16) gives no warning. It is not brewing math (SPEC rule 7); it lives with the search module, not in `selectors.js`.
- **Printed sheet:** attenuation prints today on the grain line ("Brewhouse efficiency … · Apparent attenuation …"). Y6 moves it into the sheet's yeast section with the strain and temperature, mirroring the screen.
- **Smoke test** (SPEC rule 12): the reference state gains the two fields at values that leave every pinned number the same (strain `''`, temperature `NaN` or a number — nothing reads them).
- **Owner-facing language:** "your ingredient list", never the file name.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
