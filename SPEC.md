# Brew Design — specification

The rules every change is checked against. The source of truth for all math is
the reference spreadsheet, the owner's Experiments Are Fun Recipe Designer
Rev 4 (Persyn Chemical Engineering, 2026-10-08), in `docs/sources/`; its
cached values are pinned by the golden-master tests.

## 1. Engine (`packages/engine`)

1. Pure functions only. No DOM, no network, no I/O, no global state.
2. Every constant is reproduced exactly from the spreadsheet / Phase 1 Port
   Spec. Do not round, simplify, or "improve" a constant.
   Rev 4 is Rev 3 with the owner's corrections, as the spreadsheet's author
   (2026-10-08): the boil concentration carries no 1.01, the original
   gravity being the pre-boil °P times the pre-boil over the post-boil
   volume, both at 60 °F (Grist and Pitch Calc's!I2); colour is Morey's
   SRM = 1.4922 × MCU^0.6859 (I4), in place of 1.49 and 0.69; each kettle
   addition's IBU converts oz/gal to mg/L by 7489.1 (Hops!J3), in place of
   75 × 100; and the 400B starter band serves 800-1000 billion cells
   inclusive from the pack alone, and above 1000 with one extra 200B pack
   (Starter Vol Solver N11, whose strict boundary at 900 disagreed with its
   own note; the owner's rule since 2026-09-21,
   `packages/engine/src/starter.js`).
3. When faithful transcription produces a result that looks wrong, keep it and
   add a `// FLAG:` comment saying what and why. Never silently fix.
4. Golden-master tolerances are fixed and never loosened:
   SG abs 1e-6 · Plato / SRM / IBU / utilization / tempFactor 1e-4 ·
   integers exact · starter volume and DME 1e-2.
5. The public surface is `src/index.js` only. Nothing imports engine internals.
6. `computeGrist` / `computeHops` take volumes at the 60 °F reference
   (`REFERENCE_TEMP_F`, stated once in `units.js`); the caller corrects first. `mashWaterGal` is used as entered — the 2.055 qt→lb
   constant embeds its own density assumption.

## 2. App (`apps/recipe`)

7. **No brewing math in the app.** Every computed number comes from
   `@brew/engine`. A formula like `46 * fgdb`, a Tinseth term, or an ABV
   expression anywhere in `apps/` is a defect. Equations shown as reference
   text on the References page are not brewing math: nothing there is
   computed, and the pre-commit hook's rule 7 search skips that page's file
   (`NotesPage.jsx`), and only that file.
8. **One canonical state object** in engine units: US gal, lb, oz, °F, SG,
   billion cells, L. State never holds display units. An emptied number
   box is a blank figure (NaN), never replaced by a number the brewer did
   not enter. A line under the stats bar, on both tabs and never on the
   printed sheet, names every empty number box that feeds a figure, and
   any measurement temperature the correction cannot use — read from the
   recipe's own figures, not from a range written in the app.
   The recipe carries prices, typed by the brewer and read by no recipe
   figure: each malt's per lb, each kettle and dry hop's per oz, the yeast's
   per batch, and the Cost card's other lines, each a name and a cost per
   batch; a blank price is NaN, and a pick from the ingredient list leaves
   it as it was.
   Each malt row carries its type for the mash pH model — base, crystal,
   roast, acidulated, none, or blank (`''`) — and its two lab figures, the
   distilled-water mash pH and the acidity in mEq/kg (NaN when blank); a
   pick from the ingredient list sets all three, and a type chosen by hand
   clears the lab figures. No recipe figure reads them.
   The Water tab's entries are part of the recipe, its `water` field, saved
   and reset with it and read by no recipe figure: the test results in mg/L
   (pH in SU); the style family; the salts on hand and the brewer's own salt
   and acid amounts (none while they follow the recommendation); the target
   mash pH the acid aims at (a cooled sample, 5.4 by default); where the
   water is treated (the mash water or the hot-liquor tank's first fill),
   whether salts also go in the kettle, where the acid goes with the tank
   treated (with the salts or into the mash), and the setup the water sums need —
   vessels, sparge method, the tank's treated volume and top-up level and
   the sparge water in US gal, grain absorption in qt/lb;
   salts and acidulated malt in g, liquid acid in mL; a blank test result,
   setup figure or target is NaN. The volume treated is the recipe's mash water or
   the tank's treated volume; the sparge water is typed and the water left
   in the mash tun is worked out.
   Switching Home ↔ Pro asks whether to scale the recipe to that side's
   batch — My brewery's batch volume when it is set, in either direction;
   where it is blank, 10 bbl (310 gal) for Pro and the built-in recipe's
   5.5 gal for Home — and changes no figure without the brewer's yes. Yes
   multiplies, by the engine, every amount by the batch ÷ the recipe's
   fermentation volume: each malt weight, each kettle and dry hop weight,
   the mash water, the pre-boil and sparge volumes, the boil-off rate, the
   tank's treated volume and top-up level, and the brewer's own salt and
   acid amounts; the fermentation volume becomes the batch. Percents,
   times, temperatures, the efficiency, the attenuation and the yeast stay,
   so OG, FG, ABV, SRM and IBU stay; nothing is rounded. Nothing is asked
   when the recipe is already at the batch, or when its fermentation volume
   or the batch is blank, zero or negative: the switch then changes units
   only. The yeast's price and the other cost lines are per batch and stay
   as typed; when any of them is priced (a number, 0 included), the
   question says so. A scale is one step and one autosave; no saved format
   changes.
9. **Convert only at the edges.** `display.js` is the only place that converts
   between canonical and display units, using engine constants and functions
   (`GALLONS_PER_BBL`, `OZ_PER_LB`, `G_PER_OZ`, `sgToPlato`, `platoToSg`,
   `fToC`, `cToF`, `LB_PER_SACK`, `splitSacks`, …). No new conversion
   constants anywhere in the app.
   Temperatures are stored in °F and shown in the header's choice, °F or
   °C: a °C entry is stored as the engine's `cToF` of it and shows back as
   typed, except the reference as its box shows it (15.6), which is stored
   as the reference itself; boxes take tenths of a degree, readouts show
   whole degrees, except the reference, shown in °C as 15.6. The printed sheet uses the screen's
   unit. Switching the unit changes no stored figure.
   In Pro two more choices sit beside the gravity unit: liquid volumes in
   barrels or gallons — gallons covers every volume except the dry-hop
   rate, which stays lb/bbl, and shows to 0.01 as at Home — and malt weights
   in pounds or 55 lb sacks, entered as decimal sacks to two decimals and
   stored in pounds, the whole sacks and the pounds left shown beside each
   box; hops stay in pounds. Home shows neither. The printed sheet prints
   these two in the brewery's set units, each where set (else the screen's),
   and malt in sacks as the split ("3 sacks + 12.10 lb"); Home prints
   gallons and pounds.
10. `selectors.js` is the only place the app calls engine compute functions.
    The UI renders from `computeRecipe(state)`; tests assert through it.
    The Water tab renders from `computeWater(water, recipe)` beside it: every
    water figure, including the acid's dose as the acid picked, how near
    each predicted figure is to its target, the water volumes from the
    recipe (its grain, mash water and pre-boil volume at 60 °F), the
    hot-liquor tank's draws and the kettle salts, comes from the engine
    through it. No wort mineral figure is worked out. The hot-liquor tank
    is never topped up below the treated water the mash leaves: with the
    top-up level below it, the tank holds only that water, all treated, the
    sparge and the water left drawn from it, and a warning says no untreated
    water is added; mash water more than the treated volume takes all of it
    and every salt, the sparge liquor's treated share 0 (warned); each share
    of the tank's salts is held between 0 and 1, and the shares add to 1.
    Beside the treated
    water's predicted profile, with kettle salts on, the kettle water before
    the boil: the source water plus the salts in the kettle over the pre-boil
    volume, the mash's salts reaching it at the recipe's brewhouse
    efficiency with a sparge (no sparge: the mash well mixed), each share held
    between 0 and 1 and the card and sheet saying when one is. At the top of
    the predicted profile, the predicted mash pH of a cooled sample, from the
    malts, the mash water as entered and the treated mash water's predicted
    profile, with a warning outside the engine's cooled-sample range and when
    acidulated malt is in the grain bill and is also the acid, and a note
    naming each limit crossed when the water's residual alkalinity or the
    mash thickness is beyond the range the engine's model was tested on (the
    figure still shown); the tab names each blank malt figure it needs. The
    printed sheet prints it, the recipe's target and that note, beside the
    measured mash pH box.
    The acid recommended is the engine's dose that brings the predicted mash
    pH to the recipe's target, for the water the mash draws before the acid —
    the salts on screen, less the alkalinity-raising salt the style's
    alkalinity recommends — dosed where the acid goes. Above the target
    without that salt, no raising salt is recommended; at or below it, no
    acid, and the raising salt follows the style's alkalinity. While the mash
    pH cannot be predicted, the acid is the solver's for the style's
    alkalinity, and a note names what the pH needs. A blank target blanks the
    acid recommendation, and what reads it while the brewer follows it, and
    the tab names it; changing the target returns the brewer's own acid to the
    recommendation. The salts follow the style's mineral targets; its
    alkalinity and residual alkalinity show as targets beside the profile.
    With the hot-liquor tank treated and the acid going into the mash, the
    salts stay in the tank as before, the acid recommended is dosed for the
    recipe's mash water, the predicted profile and mash pH are
    the water the mash draws — the tank's treated water with the acid over
    the mash water — and the sparge, the tank's leftover and the kettle carry
    no acid; the printed sheet names the acid's place, Mash or HLT.
    The Cost card renders from `computeCost(recipe)`: each line's cost, the
    total of the priced lines (counting the rest) and the cost per gal at the
    fermentation volume at 60 °F, by the engine's `rollupCost` and
    `costPerUnit`, blank for a zero, negative or blank volume. With no line
    priced, the total and the cost per gal are blank ("—"), not $0.00. It is
    not on the printed sheet.
    The Grist card shows each malt's % of total grain weight, the engine's
    share ("—" where blank). "Design to target OG" sets every malt's weight,
    in one step, by the engine's `solveGrist` from a target OG in the screen's
    gravity unit, one % per malt (filled from the shares) and the recipe's
    brewhouse efficiency and boil, worked as the recipe works it: the
    measured pre-boil volume boiled off at the boil-off rate and boil time,
    the post-boil volume then corrected to 60 °F at its own measurement
    temperature and the pre-boil volume at its own (rule 11), so the weights
    give the target through the recipe's own calculation whatever the
    temperatures, within the gravity conversions' mismatch; it changes
    nothing, and says why, when the percents' total, shown to one decimal, is
    not 100.0, a figure it needs is blank, or the pre- or post-boil
    measurement temperature cannot be used. The mash water
    is not touched. The target and the percents are never saved; "Undo solve"
    restores the weights until the next edit.
11. `toReferenceVolume(measuredGal, kind, measurementTempF)` is the
    volume-correction slot. Pre-boil, post-boil, and ferment volumes route
    through it and reach the engine corrected to the engine's reference
    (`REFERENCE_TEMP_F`, 60 °F) by `correctVolumeToRef` at the measurement
    temperature of their kind (`measurementTempF[kind]`, °F, held in the
    recipe state, the reference by default); mash water does not. Every
    "at 60 °F" the app shows or prints, and the printed sheet's rule for
    when to note a measurement temperature, read `REFERENCE_TEMP_F` (in °C
    shown as its `fToC`, 15.6); no app file writes the figure itself. A temperature the engine cannot correct — cleared
    (NaN) or outside its density table (0–100 °C) — yields a NaN volume;
    nothing throws, and no clamping or fallback to the measured volume.
12. The smoke test (`apps/recipe/test/smoke.test.js`) pins the reference
    recipe through the UI's own selectors. Its tolerances never change; its
    pinned figures change only when the spreadsheet the engine reproduces
    does (rule 2), each re-read from the same cell as the golden master's,
    the old figure kept beside it (the owner, 2026-10-08); its reference state is a canonical state and gains a field
    only when the canonical state does, at the value that leaves every pinned
    number the same.
13. Persisted state is the canonical state, under one key, in one JSON
    document carrying a schema version (12). A version-1 document — saved
    before the measurement temperatures existed — loads as the same recipe
    with the three at 60 °F; a version-1 or version-2 document — saved
    before the recipe had a name, style and notes — loads with those three
    empty; a version-1, 2 or 3 document — saved before the yeast had a
    strain and a fermentation temperature — loads with an empty strain and a
    blank fermentation temperature; a version-1 to 4 document — saved before
    the water was part of the recipe — loads with the built-in water
    entries, never the brewery's; a version-5 document — saved with the
    water kept in the mash tun — loads with the sparge water blank; a
    version-1 to 6 document — saved before malt types — loads with each
    malt's type blank and its lab figures blank; a version-1 to 7 document
    — saved before the acid could go into the mash — loads with the acid
    with the salts; a version-1 to 8 document — saved before the temperature
    unit was a display setting — loads in °F; a version-1 to 9 document —
    saved before Pro's volume and malt weight choices — loads in barrels and
    pounds; a version-1 to 10 document — saved before prices — loads with
    every price blank and no other cost lines; a version-1 to 11 document —
    saved before the target mash pH — loads with the target 5.4; each is
    saved back as version 12. Unreadable data,
    any other version, or unavailable storage yields a new recipe (rule 17) and never
    throws. A document is readable only if, after its upgrade, every malt,
    kettle-hop and dry-hop row and the yeast carry every field of the
    built-in recipe's, each of its kind — text as text, a number as a
    number or blank — with ale/lager and the yeast character among the
    engine's pitch-rate choices, each malt's type blank or one the mash pH
    model knows, each other cost line a name and a cost (a number or blank), the
    three measurement temperatures each a number or blank, and the water
    entries carry every field,
    each of its kind — a number as a number or blank, a choice among the
    Water tab's, a salt, acid or style the engine knows; extra fields are
    ignored. A saved copy in
    storage that cannot be read is kept aside, as found, under its own key
    (`brew-design.recipe.unreadable`), replacing any copy kept before;
    nothing reads it back, and failing to keep it never stops a load.
    A cleared field (NaN) round-trips as NaN, never as 0 or null.
    The recipe file is the same document: an export is byte-for-byte what
    storage holds, and an import reads it with the same reader, versions
    and upgrades included. They differ only in failure: a file that is not
    a recipe, is damaged, or carries a newer version is refused with a
    message, nothing is asked, and the recipe on screen is untouched,
    where storage falls back silently.
16. **The ingredient list is the owner's workbook.** `apps/recipe/src/ingredients.json`
    is generated from `data/Brew Design Ingredients.xlsx` by the refresh tool
    and never edited by hand; every name and number equals its workbook cell,
    unrounded, and `apps/recipe/test/ingredients.test.js` fails otherwise. It is
    reference data: never part of the recipe state, never saved with a recipe.
    Each malt carries its type for the mash pH model and its two optional lab
    figures (the workbook's "Malt type", "Distilled-water pH" and "Acidity
    (mEq/kg)"; a blank type is `""` and a blank lab figure null), and a lab
    figure on a type that does not use it is refused.
    Picking an ingredient copies its numbers into the recipe; the recipe never
    refers back to the list. One display reads it again: the Yeast card's
    information line and fermentation-temperature warning look the strain
    up by name each time they are drawn and show the list's current
    figures; they are never stored and never feed a number.
    My ingredients are the brewer's own malts and hops, beside the owner's
    list and never in it. A malt or boil-hop name box whose typed name is not
    on the owner's list of its kind (capitals, accents and surrounding spaces
    ignored) offers to save it, showing what it keeps: a malt's FGDB, colour,
    type and two lab figures, a hop's alpha; a dry hop is never saved. A
    blank FGDB, colour or alpha refuses the save, and a name on the owner's
    list is refused with a line saying so; saving a name already in My
    ingredients asks, then replaces it in its place. The malt boxes offer the
    brewer's malts, and the boil-hop and dry-hop boxes their hops, first,
    marked as yours, in the order saved; a pick copies their numbers as a
    pick from the owner's list does. Saving or deleting one changes no
    recipe. They are kept with the brewery's figures (rule 17).
17. **The brewery's figures are not a recipe.** The brewery's batch
    (fermentation) volume, pre-boil volume, boil-off rate, boil time, three
    measurement temperatures, brewhouse efficiency, Home/Pro, Pro gravity,
    volume and malt weight units, temperature unit (°F/°C), and their water — the usual water report, the salts on hand, the
    usual treatment choice and kettle switch, and the water setup (vessels,
    sparge, the tank's treated volume and top-up level, grain absorption)
    — are kept in their own JSON document, under
    their own key, carrying their own version (6), in the recipe's units; a
    blank figure is null. The same document carries My ingredients (rule
    16), each entry checked as the owner's list is; a damaged entry makes the
    document unreadable. A version-1 document — saved before the water —
    loads with every water figure blank, a version-2 one without the
    water kept in the mash tun, a version-1 to 3 one with the temperature
    unit blank, a version-1 to 4 one with Pro's volume and malt weight
    units blank, and a version-1 to 5 one with no saved ingredients; each
    is saved back as version 6. The sparge
    water is never a brewery figure.
    Unreadable data, any other version, or unavailable storage yields every
    figure blank and no saved ingredients, and never throws; a stored copy
    that cannot be read is kept aside, as found, under its own key
    (`brew-design.brewery.unreadable`), replacing any copy kept before, and
    failing to keep it never stops a load. Every change to the brewery — a
    figure, an ingredient saved or deleted — starts from the stored
    document, read again, so a change made in another tab is kept; an
    ingredient is never saved over a stored copy that cannot be read (a
    figure is, the copy kept aside first); an ingredient that storage could
    not keep — saved, or imported with a brewery file — is said so and not
    offered. My
    ingredients neither show nor end the banner, and "Forget my brewery
    figures" and "Use this recipe's figures" change the figures and keep
    them. The water style, where the acid goes,
    the brewer's own amounts and the prices are never brewery figures. While every one is blank, a banner on
    every tab recommends setting them up; its "Not now" is kept in this
    browser under its own key, never part of a recipe or the brewery's
    figures, and ends when a figure is set. The brewery file is the same
    document: an export is byte for byte what storage holds, and an import
    reads it with the same reader, versions and upgrades included, asks
    before it replaces the brewery's figures and My ingredients — naming how
    many saved ingredients go, all of them when the file has none — and
    never touches the recipe; a
    file that is not a brewery file, is damaged or is newer is refused with
    a message. A new recipe — Reset, or a load with no
    readable saved recipe — is the built-in recipe and display settings with
    each figure that is set in place of the built-in one; a blank figure
    never reaches a recipe. A new recipe starts from the built-in recipe
    scaled (rule 8's scale) to the brewery's batch volume when it is set, in
    Pro and in Home; with it blank, one that opens in Pro starts scaled to
    10 bbl and one that opens in Home at the built-in 5.5 gal; the figures
    that are set then take their places, unscaled. With Home/Pro blank it
    opens in Home. They are copied only when a recipe is created:
    changing them never changes a recipe, its saved document or a recipe
    file, and an older saved recipe is upgraded and checked against the
    built-in recipe, never against them.
    In My brewery an empty number box shows, greyed, the figure a new recipe
    gets in its place (scaled to the batch it starts at), in the screen's units (none where the built-in figure
    is itself blank): a placeholder, never a value, so never saved, never
    exported and never ending the banner.

### Display units

| Quantity | Home | Pro |
|---|---|---|
| Volume | gal | bbl (1 bbl = 31 gal), or gal by Pro's choice |
| Malt weight | lb | lb, or 55 lb sacks by Pro's choice (state holds lb) |
| Hop weight | oz | lb |
| Gravity | SG | °P default, SG optional |
| Mash Rv / Mash R | qt/lb · lb/lb | same |
| Pitch rate | billion/L/°P | same |
| Cells per batch | billion | trillion (= billion / 1000) |
| Starter volume | L | L |
| Dry-hop rate | oz/gal | lb/bbl |
| Temperature | °F, or °C by the header's choice (state holds °F) | same |
| Water volume | gal | bbl, or gal by Pro's choice |
| Grain absorption | qt/lb | same |
| Water test results | mg/L (ppm); pH in SU | same |
| Salts | g | g |
| Liquid acid | mL | mL |
| Acidulated malt | oz | lb (state holds g) |
| FGDB, efficiency, attenuation, hop alpha | shown as %; state holds the fraction | same |
| Malt price | $/lb | $/lb, or $/sack with sacks (state holds $/lb) |
| Hop price (kettle and dry) | $/oz | $/lb (state holds $/oz) |
| Yeast and other cost lines | $/batch | $/batch |
| Cost per unit | $/gal | $/bbl, or $/gal by Pro's choice (worked out per gal) |

## 3. Design

14. `apps/recipe/src/components/shared/styles.js` is the only styling source.
    No hex or rgb literals outside it, except data-driven colors (the SRM
    swatch). The visual language matches Brew Water Chem.
15. Read-only computed values render as plain text, never as an input box.

## 4. Verification

```
npm test --workspace @brew/engine
npm test --workspace @brew/recipe
npm run build --workspace @brew/recipe
```
