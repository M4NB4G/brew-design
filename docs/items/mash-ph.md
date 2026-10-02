# Mash pH from the grain bill — Tier A + B (two items)

Status: agreed 2026-10-02 ("agree to all"), not started; the logs and
the archived pages are in hand (S5 decisions below), waiting on the
owner's answers to the model questions the paper raised. Written by the S4 session; to be built in
batch S5 (docs/ROADMAP.md, Sessions). **Sparge acidification**
(`docs/items/sparge-acid.md`) left S5 on 2026-10-02. Water program step 5
(`docs/items/water-program.md`: WP8 the model, WP9 the check against the
owner's logs).

## Why

Brew Water Chem doses acid against alkalinity and says it does not predict
mash pH: that needs the grain bill. Brew Design has the grain bill. The
mash pH is what the water treatment is for, and the figure a brewer checks
with a meter on brew day (the printed sheet now has the box for it).

## Sentences — what must be true afterwards

- **MP-S1** The Water tab shows the predicted mash pH, as a cooled sample reads, worked out from the grain bill, the treated mash water and its salts, and the acid in the mash.
- **MP-S2** Each malt's part comes from its type (base, crystal, roast, acidulated) and its colour by the published model (Troester/Kaiser), cited beside each figure; a malt with lab-measured figures (its distilled-water mash pH and its buffering) uses those instead.
- **MP-S3** The owner's ingredient workbook gains a malt-type column and two optional lab columns; picking a malt copies its type and lab figures into the recipe, as its other figures are copied; a malt typed by hand has its type chosen by the brewer.
- **MP-S4** The model's figures are checked against the owner's logged mash pH for his past batches (cooled samples); each batch's predicted and measured pH and their difference are recorded in this file and pinned by a test.
- **MP-S5** A blank figure the model needs (a malt's type or weight, the mash water, a test result) blanks the predicted pH, shows "—", and is named.
- **MP-S6** The printed sheet prints the predicted mash pH beside the measured mash pH box.
- **MP-S7** A recipe saved before malt types (saved format 6 or earlier; S4b moved it to 6) loads as the same recipe with each malt's type as MP-Q8 decides, and is saved back at the next version.
- **MP-S8** Nothing else changes: every other recipe and water figure is the same for the same entries.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| MP-Q1 | One item or two | Two, built in this order: (1) the model in the engine and its check against your logs (no screen yet); (2) the malt types in the workbook and the recipe, the figure on the Water tab and the sheet, the saved format | Numbers before what shows and saves them; each item deploys alone |
| MP-Q2 | The malt types | Four: base (pale, Pilsner, Munich, Vienna, wheat — any kilned malt), crystal/caramel, roast (roasted malt and barley, chocolate, black), acidulated. You set each malt's type in your workbook | The model has a different rule for each family; wheat and Munich follow the base-malt rule by colour |
| MP-Q3 | Where the model's figures come from | Kai Troester's published mash pH model (braukaiser.com, 2009–2010) — each malt family's distilled-water pH from its colour and its buffering — transcribed as published, cited beside each figure, each pinned by a value worked out by hand. No figure chosen by the builder | SPEC rule 2: every constant reproduced as published; CLAUDE.md hand-pin rule |
| MP-Q4 | Your lab-measured malt figures | Two optional columns in the workbook (distilled-water mash pH; buffering, mEq per kg per pH); where both are filled, they replace the model's for that malt | WP8 as agreed |
| MP-Q5 | Acidulated malt counted twice? | The Water tab's acidulated-malt acid addition is the acid; an acidulated malt row in the grain bill is counted by its lactic acid too. If you list it in both places it is counted twice — so the Water tab warns when the grain bill has an acidulated malt and the Water tab's acid is also acidulated malt | Each gram of acid counted once; the brewer decides where it is listed |
| MP-Q6 | Which water the model uses | The treated mash water, as the Water tab predicts it (its calcium, magnesium and alkalinity after salts and acid), at the recipe's mash water volume — the same for mash-water and tank treatment, since the mash draws the treated water | WP6b: the mash is well mixed; S4's treated profile |
| MP-Q7 | Phosphoric acid's strength | Keep it as today (one proton, as at mash pH 5.4) for the dose and the profile; the model uses the same figure, so the screen stays consistent | Change one thing at a time; a later item can refine it |
| MP-Q8 | An older recipe's malts (no type saved) | Each malt row loads with its type blank; the Water tab names them and shows "—" until the brewer picks types (picking the malt again from the list fills it) | SPEC 16: the recipe never refers back to the ingredient list; no number the brewer did not enter |
| MP-Q9 | Does the acid recommendation aim at a mash pH? | Not in this item: the recommendation stays as today (to the style's residual alkalinity); the predicted pH is shown beside it. Aiming the acid at a target pH is a roadmap line for later | One behaviour change at a time; the model is checked against your logs first |
| MP-Q10 | A mash pH range warning | Yes: a warning when the predicted pH is outside the range your logs and Palmer & Kaminski give for a cooled sample (5.2–5.6), the range cited beside it | A warning changes no number; the range is a published figure |
| MP-Q11 | Checking against your logs (MP-S4) | You supply at least five past batches (grain bill, water report, salts and acid, measured cooled mash pH). The builder reports each difference; no pass/fail line is set by the builder — you judge the result before item 2 is built | WP9; the model is only as good as its check, and the judgment is yours |
| MP-Q12 | Where the figure shows | The Water tab's Salts & Acid screen, at the top of the predicted profile card ("Predicted mash pH (cooled sample)"), and on the printed sheet beside the measured box. Not in the stats bar | The stats bar holds the recipe's figures; the water figures stay on the Water tab |
| K | Silent properties | **Schema migration:** malt rows gain a type and two lab figures — recipe format 7 — S4b took 6 (MP-Q8 for older rows). **Ingredient refresh:** the refresh tool and the ingredient test change (Tier B by CLAUDE.md, Ingredient data). **Ordering, multi-tab, storage disabled:** as today. **Idempotence:** the model is pure; same entries, same pH | — |

## S5 decisions — agreed 2026-10-02 ("agree to all"), before building

Raised by the S5 builder, who found item 1 could not start.

| id | Question | Decision | Rule |
|---|---|---|---|
| S5-B1 | The owner's batch logs | The owner supplies his brewing logs; a log without its own water report uses the most recent report he had at the time, and each batch records which report it used (a known source of error: the tap water may have drifted). A batch is usable only with its grain bill, mash water, salts and acid (or none), and a measured mash pH of a cooled sample | MP-Q11 |
| S5-B2' | MP-Q3's source, braukaiser.com, no longer serves its wiki (the site answers, every wiki page errors) | Troester's archived pages on the Wayback Machine, cited by archive address and date; the owner allows web.archive.org in the environment's network access or attaches the pages as PDFs | MP-Q3: the same published model, read from the original pages |
| S5-B2'' | The archive does not have them | Stop and ask the owner before using any other source | No number from a source nobody checked |
| S5-B4' | Sparge acidification in S5 | Out of S5, unassigned on the roadmap | The owner does not acidify his sparge |
| S5-B6 | Filling in the malt types | The builder proposes each malt's type from its name in a review copy of the workbook, never the workbook itself; the owner reviews it and makes the edit. Malts the four types do not cover (unmalted grains, sugars, hulls, a fermenter addition) and three borderline malts (Victory, Special Roast, Honey Malt) are left blank and marked for his decision | MP-Q2: the owner sets each type |

Second round — agreed 2026-10-02 ("all cooled … always 14 gal. agree to all else"), after the S5 builder found the archive unreachable from the owner's computer and surveyed his logs.

| id | Question | Decision | Rule |
|---|---|---|---|
| S5-B2‴ | How the archived pages reach the builder | The owner saved them as PDFs; they are kept in `docs/sources/` (see Sources below) | S5-B2' |
| S5-B7 | Were the logged mash-tun readings cooled samples? | All cooled: his meter cannot read at mash temperature, and it has automatic temperature compensation | S5-B1 |
| S5-B8 | Which water report goes with each batch | A log carrying its own report uses it (June–September 2022); otherwise the latest Home report on or before brew day (September 2022 – March 2024); from 2025 the Bristlecone reports by the date in their file name. Reports from other places (Barman house, BrewChatter, Slieve, John Lamb, Steve, Matty, Otis, the canned water) are not used; the empty 2023-03-27 Home report is skipped | S5-B1 |
| S5-B9 | Where the salts and acid went | Dissolved in the 14 gal hot-liquor-tank fill; the mash drew its logged volume of that treated water (the Water tab's tank treatment). Always 14 gal, including the two logs without a tank line (Cold IPA 2023-05-14, Nordic Saison 2025-03-22) | MP-Q6 |
| S5-B10 | Grain bills with hulls, sugar or unmalted grain | Rice hulls and sugars count as nothing in the mash (hulls are husk; sugars go in the kettle). Batches with flaked oats, flaked corn, flaked or raw wheat wait until the source says how to count them | S5-B6 left these to the owner |
| S5-B11 | The logs folder | Stays out of the repository (it holds shipping labels with other people's addresses); the test carries each batch's figures and names its log file | Nothing personal goes to GitHub |

## Sources — the archived Troester pages (S5-B2')

Saved by the owner from the Wayback Machine, 2026-10-02, kept in `docs/sources/`:

- `effect_of_water_and_grist_on_mash_pH.pdf` — Kai Troester, *The effect of brewing water and grist composition on the pH of the mash*, braukaiser.com, 2009 (dated Oct 31, 2009 in its footer; CC BY-NC 3.0). Archive address `web.archive.org/web/20250906010619/https://braukaiser.com/documents/effect_of_water_and_grist_on_mash_pH.pdf`, snapshot 2025-09-06 (the archive's index; the saved file carries no page header). The model's figures are in this paper.
- `Mash pH control - German brewing and more.pdf` — braukaiser.com wiki, last modified 4 March 2011. Archive address `web.archive.org/web/20240805161308/http://braukaiser.com/wiki/index.php?title=Mash_pH_control`, snapshot 2024-08-05 (printed in its header). Qualitative; cites the 2009 paper for its numbers.
- `Residual Alkalinity illustrated - German brewing and more.pdf` — what "Understanding Mash pH" became (the page says so). Archive snapshot 2022-08-20 (`web.archive.org/web/20220820014332/…`, printed in its header). Qualitative.

Reading note for the builder: in the paper's equations the plus sign is a private-use glyph (U+E083) that text extraction drops — e.g. the crystal-malt line extracts as "140.13⋅C" for 14 + 0.13·C. The paper's own data confirm the plus (its mash-thickness slope at 4 l/kg, 0.013·4 + 0.013 = 0.065, against the 0.066 it measured).

## Scenarios — to be written first, must fail before

Item 1 (`packages/engine/test/water/mash-ph.test.js`): *each malt family's
figures are the published ones* (hand pins); *the mash pH balances the
grain, the water and the acid* (a worked batch by hand); *lab figures
replace the model's*; *a blank figure blanks the pH*; *the owner's logged
batches* (each predicted figure pinned, the measured beside it).

Item 2 (`apps/recipe/test/mash-ph.test.js`, the ingredient test): *picking
a malt copies its type and lab figures*; *the Water tab shows the predicted
mash pH*; *an older recipe loads with its malt types blank and named*;
*the printed sheet prints the predicted pH beside the measured box*;
*nothing else changes*.

## Notes for the builder

- Needs from the owner before item 1: his logged batches (MP-Q11), and the
  malt-type column filled in his workbook before item 2.
- Files likely touched: `packages/engine/src/water/mash-ph.js` (new),
  `index.js`, engine test; `data/Brew Design Ingredients.xlsx` (owner),
  `apps/recipe/scripts/*`, `ingredients.json`, `apps/recipe/test/ingredients.test.js`,
  `apps/recipe/src/{state,persistence,selectors,display}.js`, `App.jsx`,
  `components/GristTable.jsx`, `components/water/SaltsAcidScreen.jsx`,
  `components/recipe-sheet-data.js`, `RecipeSheet.jsx`, `SPEC.md` (rules 8,
  13, 16), `docs/TEST_COVERAGE.md`.
