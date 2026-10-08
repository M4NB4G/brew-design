# References page — Tier C and D

Status: agreed 2026-10-08 ("agree to all", RF-Q1 to RF-Q13), not started.
Written by the session that reviewed the S7 notes page with the owner;
built in batch S10b (docs/ROADMAP.md, Sessions). Replaces the methods and
sources page of `docs/items/notes-page.md` (NM-S1 to NM-S3 are superseded;
NM-S4 stands as RF-S7).

## Why

The owner's intent for the footer page (2026-10-07): an equation reference
with a citation for each model. The S7 page instead describes each method
in words, names the Recipe Designer spreadsheet in a card of its own and in
six of its nine source lines, and shows no equation, because SPEC rule 7 and
NM-S3 kept every model coefficient out of the app. The owner: "All the
modelling equations in there are cited and all the other math is simple
dimensional analysis." The footer link is also too small to read as one.

## Sentences — what must be true afterwards

- **RF-S1** The footer link reads "References", in the size of the page's back button, and opens the page; the page is titled "References" and keeps its way back to the app. The Water tab's own Notes are unchanged.
- **RF-S2** For each model the page shows the equation in symbols, each symbol with its unit, and its citation (the table below): extract and pre-boil gravity; SG to °P and back; boil concentration; FG and ABV; Morey colour; Tinseth utilization, the whirlpool temperature factor and IBU; cells needed and the pitch rates; the starter growth curves, bands and malt extract; the volume correction to 60 °F; the recommended mash thickness; Kolbach residual alkalinity (salts and acids: the Water tab's Notes, pointed to); Troester's mash pH, its range and its tested range.
- **RF-S3** Dimensional analysis (unit factors, gravity points, the 7500 in the IBU, quarts and pounds of water, °F to °C) appears only where a symbol is defined: no citation, no card of its own.
- **RF-S4** The page does not mention the Recipe Designer spreadsheet, and carries no notes about how the app was built (fidelity to a spreadsheet, goal-seek, the starter-band deviation, the round trip of a gravity through °P).
- **RF-S5** Every coefficient on the page is the one the engine computes with: read from the engine where the engine exports it, otherwise written on the page and checked by the scenario against the engine's own results.
- **RF-S6** The page shows the equations as the engine holds them when S10b is built (RF-Q13): after S10a, the boil concentration without the 1.01, Morey's 1.4922 and 0.6859, and the IBU's exact 7489.
- **RF-S7** Nothing else changes: no figure, saved document or printed sheet.
- **RF-S8** SPEC rule 7 gains one sentence: equations shown as reference text on the References page are not brewing math. The pre-commit hook's rule 7 search skips the References page's file, and only that file.

## Citations — as the page gives them (the owner's sheet, 2026-10-08)

| Model | Citation |
|---|---|
| Extract potential (46 points per lb per gal, sucrose), points per malt, pre-boil gravity | Palmer, J. J. (2017). *How to Brew* (4th ed.). Brewers Publications. ISBN 978-1938469350. |
| SG to °P, °P to SG | Brewer's Friend. Plato to SG Conversion Chart (the ASBC polynomial). brewersfriend.com/plato-to-sg-conversion-chart/ |
| Boil concentration | None: the volume ratio (dimensional; the 1.01 removed in S10a, RF-Q6). |
| ABV | Hall, M. L. (1995). Brew by the Numbers: Add Up What's in Your Beer. *Zymurgy*, 18(2), Summer 1995. |
| Colour | Morey, D. (1998). Approximating SRM beer color of homebrew based on recipe formulation. *BrewingTechniques*, 6(1), 42–46. |
| Tinseth utilization | Tinseth, G. Glenn's Hop Utilization Numbers. realbeer.com/hops/research.html |
| Whirlpool temperature factor | Meiners, L., & Cavanna, M. (2022). Skeptical Brewing, Part 3. *Zymurgy*, May/June 2022. |
| Pitch rates, cells needed | White, C., & Zainasheff, J. (2010). *Yeast: The Practical Guide to Beer Fermentation*. Brewers Publications. |
| Starter growth curves | A quadratic fit to the output of MoreBeer's yeast starter calculator (morebeer.com), by Persyn Chemical Engineering. |
| Starter bands | None: the app's rule. |
| Starter malt extract, 115 g/L | Palmer (2017), as above. |
| Volume correction to 60 °F | Wagner, W., & Pruß, A. (2002). The IAPWS formulation 1995 for the thermodynamic properties of ordinary water substance. *J. Phys. Chem. Ref. Data*, 31(2), 387–535. |
| Recommended mash thickness | Palmer (2017), as above. |
| Residual alkalinity | Kolbach, P. (1953). Der Einfluss des Brauwassers auf die Bierfarbe. *Monatsschrift für Brauerei*, 6, 167–171. |
| Mash pH model, Lovibond to EBC | Troester, K. (2009). The effect of brewing water and grist composition on the pH of the mash. braukaiser.com (archived: web.archive.org/web/20250906010619/https://braukaiser.com/documents/effect_of_water_and_grist_on_mash_pH.pdf). Sections 2, 3.1, 3.3 to 3.6, 3.10; the acid-side slope is the app's fit to Table 3, and the page says so. |
| Mash pH range 5.2–5.6 | Palmer, J. J., & Kaminski, C. (2013). *Water: A Comprehensive Guide for Brewers*. Brewers Publications. (No page yet: the owner, "fine for now".) |
| Tested range | Troester (2009), Tables 3, 15 and 16. |

## Decisions — agreed 2026-10-07 and 2026-10-08 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| RF-Q1 | The link's label | "References" | The page is citations; "About" suggests app or company information |
| RF-Q2 | How the coefficients reach the page | Written as text on the page; the scenario checks each against the engine's results; engine-exported values (pitch rates, ranges, reference temperature, density table span) still read from the engine. Not by the engine exporting new coefficients (the owner, 2026-10-07: "this version works") | A page of text changes no figure: Tier C, not A |
| RF-Q3 | Equation display | Plain text with superscripts and subscripts; no math library | No new dependency |
| RF-Q4 | Citations | The owner's sheet (table above) | The page cites what each model came from |
| RF-Q5 | Tier and session | Tier C (the page, the footer) and D (the hook, SPEC's sentence); batch S10b, the Tier C and D trial | CLAUDE.md, Change control and Models |
| RF-Q6 | The 1.01 boil factor | Removed in its own Tier A item (roadmap); until then the page shows it, flagged | A figure a brewer acts on goes through the inspector |
| RF-Q7 | Morey's coefficients | The owner checks which pair the 1998 paper prints; if 1.4922 and 0.6859, a Tier A roadmap item; the page shows what the app uses | As RF-Q6 |
| RF-Q8 | The whirlpool article | Meiners and Cavanna, Skeptical Brewing, Part 3, *Zymurgy* May/June 2022 | The owner: the issue is right |
| RF-Q9 | The IBU's 7500 against the exact 7489 | A roadmap line for the owner to decide; not in this item | A number change is its own item |
| RF-Q10 | Wrong sources in the engine's comments and the Water Notes' phosphoric line | Roadmap lines; not in this item | Engine files are Tier A by path |
| RF-Q11 | When the boil factor and Morey change are built | Together with the IBU in an Opus batch, S10a, before S10b (2026-10-08) | The page shows the corrected equations; no "to be removed" flag is built |
| RF-Q12 | The IBU's 7500 against 7489 | 7489, in S10a (2026-10-08) | One deploy for the three number changes |
| RF-Q13 | RF-S6 | The page shows the equations as the engine holds them when S10b is built (2026-10-08) | RF-S5 ties the page to the engine |
| M1 | Builder model | Sonnet 5.5, Opus advising; the report lists every number the change adds, confirmed by the advisor as no recipe value | CLAUDE.md, Models (Tier C and D trial) |
| M2 | Inspector model | None: Tier C and D, no recipe value introduced (RF-S5, RF-S7) | CLAUDE.md, Change control |

## Scenarios — to be written first, must fail before

`apps/recipe/test/notes-page.test.js`, rewritten (its NM scenarios are
superseded): *the footer's References link opens the page, and the page
leads back*; *the page shows each model's equation with its citation*; *the
page does not mention the spreadsheet*; *every coefficient on the page
reproduces the engine's result*. `footer.test.js` reads "References" in
place of "Notes". A hook scenario, if the hook has a test; otherwise the
report shows the hook refusing a stray `0.000125` in another app file and
passing the References page.

## Notes for the builder

- Equations and every coefficient, as the engine holds them today: `packages/engine/src/grist.js` (46, 1.01, the ABV's 76.08, 1.775, 0.794, Morey's 1.49 and 0.69, the 4 qt/gal and 2.055), `units.js` (the two Plato conversions, the density table, 3.785411784), `hops.js` (Tinseth's 1.65, 0.000125, 0.04, 4.15; the whirlpool 0.0003858, 0.12885802, 10.97839506; 75 × 100), `yeast.js`, `starter.js` (the three bands' a, b, c; 115 g/L; the band limits), `water/ra.js` (1.4, 1.7), `water/mash-ph.js` (every constant at the top of the file, with its paper section). The owner's sheet (2026-10-08) lists 48 rows; the model rows are those in RF-S2.
- Pinning (RF-S5): for each equation, the scenario reads the coefficients as the page renders them and evaluates the equation at two or three inputs, then compares with the engine function's result (`computeGrist`, `computeHops`, `sgToPlato`, `platoToSg`, `solveStarter`, `computeCellsNeeded`, `residualAlkalinity`, `mashPh`). A coefficient typed wrong on the page then fails. Keep the coefficients in one data list in the page's file so the scenario can find them.
- The hook (RF-S8): in `tools/hooks/pre-commit`, exclude the page's file from the `git grep` of RULE7 by pathspec (`':!apps/recipe/src/components/<file>'`), nothing else. SPEC rule 7's sentence goes under rule 7.
- The file may be renamed to `ReferencesPage.jsx` (and App's `notesOpen` left as it is, to keep `App.jsx`, a Tier B file, out of the diff); the builder's choice, recorded here. If `App.jsx` must change, the item stops: it returns to the owner, since a Tier B file needs an inspector this trial does not have.
- The symbol for the starter volume is V (the owner), not Q.
- Phone width: equations wrap; no horizontal page scroll at 390 px.

## Builder's notes

(none yet)
