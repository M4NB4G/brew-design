# Mash pH from the grain bill — Tier A + B (two items)

Status: agreed 2026-10-02 ("agree to all"); item 1 landed: "The engine predicts the mash
pH of a cooled sample from the grain bill and the treated mash water by
Troester's published model, checked against the owner's logged batches"
(S5 decisions below). Item 2 waits on the owner's judgment of the check
(MP-Q11) and his malt types in the workbook (S5-B6). Written by the S4 session; to be built in
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

Third round — agreed 2026-10-02 ("agree to all"), after the builder read the 2009 paper (Sources below) and found it disagrees with MP-S2, MP-Q3 and MP-Q4 on base malts and on the lab figures. These rows govern where they differ from the earlier ones.

| id | Question | Decision | Rule |
|---|---|---|---|
| S5-B12 | How a base malt's distilled-water pH is found — the paper gives no colour rule for base malts (it measured eleven named malts, found a loose link to colour, and says a base malt's figure "needs to be known") | A figure in the owner's workbook that he sets for each base malt: Troester's measured figure where he judges the malt matches one Troester tested (paper Table 2), otherwise a maltster's analysis. A base malt with no figure blanks the predicted pH and is named. Replaces "by its colour" for base malts in MP-S2; Troester's beer-colour method (his "Beer color, alkalinity and mash pH" page and water-calculator spreadsheet) is not used | MP-Q3: no figure chosen by the builder; the paper's own finding |
| S5-B13 | What the two lab columns hold (MP-Q4 said distilled-water pH and buffering) | Distilled-water mash pH (base malts) and acidity in mEq per kg titrated to pH 5.7 (crystal, roast, acidulated malts); a specialty malt with a measured acidity uses it instead of the rule for its type. The model has no per-malt buffering figure | MP-Q4, matched to the published model |
| S5-B14 | The specialty-malt rules | As published: crystal acidity = 14 + 0.13 × colour (EBC) mEq/kg; roast acidity ≈ 40 mEq/kg at any colour; each specialty malt counts at pH 5.7 in the grist's average, which is then lowered by 0.14 × Σ(acidity × share of grist) ÷ mash thickness (L/kg); °L converts to EBC by the paper's EBC = 2.65 × °L − 1.2. An acidulated-malt row in the grain bill counts by its lactic acid at the Water tab's existing 2 % (not the paper's ~3 %), so the app carries one figure; a roadmap line to revisit it | SPEC rule 2: transcribe as published; MP-Q7: one figure on screen |
| S5-B15 | The water's effect | Mash pH = the grist's distilled-water pH + slope × the treated mash water's residual alkalinity (mEq/L). The residual alkalinity is the Water tab's, after salts and acid (Kolbach's 3.5 for calcium, 7 for magnesium, which the paper calls close to its measurements); the slope is 0.013 × mash thickness (L/kg) + 0.013 as published, fitted on finely ground grist (a coarser crush made it steeper in his tests) — kept and marked in the engine, never adjusted | MP-Q6; SPEC rules 2 and 3 |

Fourth round — the owner's word, 2026-10-02: "the base model of f(x)=-0.02x+5.82 is all i can think of to go off of. also all my color numbers are in lovibond."

| id | Question | Decision | Rule |
|---|---|---|---|
| S5-B16 | Base malts without a measured figure (supersedes S5-B12's "a figure the owner sets") | The trend line printed on the paper's Figure 5: distilled-water pH = 5.82 − 0.02 × colour in EBC, the colour converted from the workbook's °L by EBC = 2.65 × °L − 1.2 (S5-B14). The builder confirmed the line's unit by refitting Table 2: slope −0.0207, intercept 5.822, r² 0.54 against EBC (the paper states 0.54); against °L the slope would be −0.055. A measured distilled-water pH still replaces it (S5-B13). The coefficients are used as printed, two decimals | The owner's word; SPEC rule 2: as published |

Fifth round — the owner's word, 2026-10-02, with Weyermann's Barke Pilsner specification attached: "s5-b19 treat as a very light crystal. c20 has a mEQ/kg of 14.2 and a DI pH of 5.22. i think go with that unless you are super opposed. s5-B20 i would also assume a light crystal. assume similar to c40? s5-b21 see attached".

| id | Question | Decision | Rule |
|---|---|---|---|
| S5-B17 | Malts Troester measured himself (Weyermann Pilsner, Munich I and II): his measured figure or the line? | The line, for every base malt: S5-B16 is the owner's one rule for base malts, and no measured figure is set in his workbook. Not answered separately; recorded as following from S5-B16 | S5-B16 |
| S5-B18 | The maltsters' lot analyses in the logs give a congress "wort pH" (Rahr North Star 5.89, 5.92; Rahr white wheat 5.95; Rahr 2-row 6.01) | Not used: a thinner, longer standard lab mash than Troester's (on Rahr 2-row the two differ by 0.45). Colours come from the workbook, not the lot sheets. Not answered separately; recorded as following from S5-B16 | S5-B16; SPEC rule 16 |
| S5-B19 | Aromatic malt (20 °L, past the line's fitted range) | A very light crystal malt with a measured acidity of 14.2 mEq/kg — Troester's Briess Crystal 20L (paper, Table 4) as its stand-in | The owner's word |
| S5-B20 | Special Roast malt (borderline) | A light crystal malt "similar to C40": the builder reads that, as for Aromatic, as Troester's Briess Crystal 40L measured acidity, 25.6 mEq/kg (Table 4) — the colour rule at 40 °L would give 27.6 | The owner's word, the builder's reading stated in the report |
| S5-B21 | Malts the logs don't identify | 2022 Holy Hefe "Pilsener" is Rahr North Star (its folder holds the North Star lot sheet). Weyermann Barke Pilsner (2024 Kölsch): the attached sheet is Weyermann's specification, a colour range (1.2–1.8 °L malt colour), not one figure — the 2024 Kölsch waits for the owner's one colour. The 2023 Baltic Porter's "Pilsner" waits until named | No number the owner did not enter |

Sixth round — the owner's word, 2026-10-02, after the item 1 report: "why cant we do flaked or raw? Baltic was made with Weyermann i believe. for the barke, assume 1.5L. Carafoam is a dextrin malt that is very pale. not a crystal. midnight wheat is roasted. rice hulls and sugar are good to be none. use c40 Acidity for special roast. use 2%. I can probably do some testing though later on".

| id | Question | Decision | Rule |
|---|---|---|---|
| S5-B22 | Carafoam's type (the builder had proposed crystal) | Not a crystal: a very pale dextrin malt. The builder reads that as a base malt by the line (2 °L = 4.1 EBC → 5.738), since it is a malt and the four types leave base as the only other one that counts; stated in the report for the owner to correct | The owner's word, the builder's reading stated |
| S5-B23 | The other proposed types used in the check | Midnight Wheat roast; rice hulls and sugars "none" — confirmed | The owner's word; S5-B10 |
| S5-B24 | Special Roast's acidity | Troester's Briess Crystal 40L measured acidity, 25.6 mEq/kg — confirms S5-B20 | The owner's word |
| S5-B25 | The 2023 Baltic Porter's Pilsner and the 2024 Kölsch's Barke | Weyermann Pilsner (1.8 °L, the workbook's); Barke at 1.5 °L. Both batches join the check. The Baltic Porter's folder holds an app screenshot of its adjusted water (Ca 59, Mg 14), not a report, so it takes the latest Home report before brew day, 2023-08-18 (S5-B8), which the screenshot matches (the engine's salt sums give Ca 59.3, Mg 14.6) | The owner's word; S5-B8 |
| S5-B26 | The acidulated malt's lactic acid | 2 %, as the Water tab uses; the owner may test it later | The owner's word |

Still open: flaked and raw grains (S5-B10) — the owner asked why they cannot be counted; put back to him as a question.

The builder computes no prediction for the owner's batches before these rules are fixed, so no rule is chosen by how well it fits his logs.

## Item 1 — the check against the owner's logs (MP-S4)

Run 2026-10-02 on the rules above, fixed before any prediction was worked out. Each prediction is worked by hand in the scenario *the owner's logged batches*; the measured pH is a cooled sample (S5-B7). Difference = predicted − measured. No pass/fail line is set: the owner judges it before item 2 is built (MP-Q11).

| Batch | Water report | Predicted | Measured | Difference |
|---|---|---|---|---|
| 2022-06-11 Holy Hefe | its log | 5.68 | 5.30 | +0.38 |
| 2022-09-05 Marple Hill Wet Hop IPA | its log | 5.64 | 5.40 | +0.24 |
| 2022-09-27 Holy Hefe | its log | 5.68 | 5.78 | −0.10 |
| 2022-10-17 Orange Grenade JPA | Home 2022-09-23 | 5.69 | 5.78 | −0.09 |
| 2022-12-10 Night is Darkest B-IPA | Home 2022-09-23 | 5.76 | 6.05 | −0.29 |
| 2023-01-21 O'Neill Kolsch | Home 2022-12-31 | 5.68 | 5.95 | −0.27 |
| 2023-03-15 Best Bitter | Home 2022-12-31 | 5.64 | 5.87 | −0.23 |
| 2023-06-17 Hop Rapids | Home 2023-06-17 | 5.59 | 5.60 | −0.01 |
| 2023-07-08 Belgian Single | Home 2023-06-17 | 5.67 | 5.79 | −0.12 |
| 2023-08-03 Oktoberfest | Home 2023-06-17 | 5.49 | 5.80 | −0.31 |
| 2023-10-04 Baltic Porter | Home 2023-08-18 | 5.43 | 5.66 | −0.23 |
| 2023-11-03 Bob's Your Uncle ESB | Home 2023-11-03 | 5.60 | 5.70 | −0.10 |
| 2023-12-02 Time Warp DIPA | Home 2023-11-03 | 5.66 | 5.60 | +0.06 |
| 2024-03-23 Holy Hefe | Home 2024-03-20 | 5.68 | 5.65 | +0.03 |
| 2024-04-28 Kolsch | Home 2024-03-20 | 5.73 | 5.58 | +0.15 |
| 2024-09-17 Experiments Are Fun WCIPA | Home 2024-03-20 | 5.69 | 5.36 | +0.33 |
| 2025-03-22 Nordic Saison | Home 2024-03-20 | 5.72 | 5.54 | +0.18 |

Across the 17: mean difference −0.02, mean size of the difference 0.18, largest 0.38; 5 within 0.10, 9 within 0.20. Updated 2026-10-02 after the sixth round (Carafoam as base; the Baltic Porter and 2024 Kölsch added); the first run, 15 batches with Carafoam as crystal, gave −0.02, 0.18 and 0.38.

Not checked: batches with flaked or raw grain (S5-B10, open); logs without a mash water volume or a pH reading.

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

Item 1, builder's notes (choices the sentences did not make, for the inspector to check):

- The model is one engine function, the mash pH from the malts, the mash water and the treated water profile, with the malt types as a list; it lives in a new water module and is exported from the engine's public surface. Nothing in the app calls it yet (item 2), so the built site is unchanged.
- A fifth type, "none", carries S5-B10 (hulls and sugars count as nothing): such a row is left out of the grain weight and the shares, and its blank figures do not blank the pH. A blank type, or any other type, blanks the pH (MP-S5).
- The treated water enters as the Water tab predicts it (alkalinity after salts and acid, calcium, magnesium); the model takes the engine's existing residual alkalinity (Kolbach) and converts it to mEq/L by the engine's 50.04 mg/L as CaCO3 per mEq/L, the figure its acid sums use, not the paper's rounded 50.
- Mash thickness R is the mash water as entered (US gal × 3.785411784 L) over the grain in the mash (lb × the engine's 453.592 g/lb).
- A specialty malt's acidity: its measured figure where given, else crystal by colour, roast 40, acidulated at the acid table's 2 % lactic. A measured figure for a base malt is its distilled-water pH.
- The check takes each batch's calcium and magnesium from its report's hardness by the owner's own template formulas (Ca = Ca hardness × 0.4, Mg = Mg hardness × 0.24); the reports from 2023-08 on carry only the hardness. The salts and acid go in the 14 gal tank; the mash draws its logged volume (the log's actual column, not its plan).
- FLAGs in the engine: the water slope fitted on ground grist (S5-B15); the base-malt line's loose fit, printed rounding and fitted colour range (S5-B16); the acidulated malt's 2 % against the paper's ~3 % (S5-B14, roadmap).
- No SPEC rule changes in item 1: the engine gains a model and no app rule moves; item 2 changes rules 8, 13 and 16.


- Needs from the owner before item 1: his logged batches (MP-Q11), and the
  malt-type column filled in his workbook before item 2.
- Files likely touched: `packages/engine/src/water/mash-ph.js` (new),
  `index.js`, engine test; `data/Brew Design Ingredients.xlsx` (owner),
  `apps/recipe/scripts/*`, `ingredients.json`, `apps/recipe/test/ingredients.test.js`,
  `apps/recipe/src/{state,persistence,selectors,display}.js`, `App.jsx`,
  `components/GristTable.jsx`, `components/water/SaltsAcidScreen.jsx`,
  `components/recipe-sheet-data.js`, `RecipeSheet.jsx`, `SPEC.md` (rules 8,
  13, 16), `docs/TEST_COVERAGE.md`.
