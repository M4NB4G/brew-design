# Water tab — Tier A + B (two items)

Status: agreed 2026-09-23 ("agree to all"). Item 1 landed 2026-09-24 as
"Every water figure is worked out by the engine and reaches the screen
through the app's one front door, equal to Brew Water Chem's for the same
entries; a blank test result blanks the figures that need it"; item 2
landed 2026-09-24 as "A Water tab beside Recipe and Options carries Brew
Water Chem's four screens in its order and wording; its entries are kept
while the page is open, not saved, and it says so". Written by the S2
session; built in batch S3 (docs/ROADMAP.md, Sessions) as two items, in this
order: **Water figures through the front door** (Tier A + B), then **Water
tab screens** (Tier B). Water program step 3 (`docs/items/water-program.md`,
WP1–WP11, whose decisions this table does not re-open).

## Why

The water chemistry is already in the engine, line for line Brew Water
Chem's, with 135 tests. What is left is the water app's screens. They cannot
be copied as they are: the water app's screens call the chemistry directly
and work out some figures themselves (the recommended lactic dose expressed
as another acid, in its App and Recipe tab), where Brew Design's rules put
every computed figure in the engine and route it through one front door
(SPEC rules 7, 9, 10).

## Sentences — what must be true afterwards

- **W-S1** A Water tab sits beside Recipe and Options and carries Brew Water Chem's four screens — Water In, Style, Salts & Acid (the water app's "Recipe"), Notes — in the water app's order and wording.
- **W-S2** For the same entries, every figure on the Water tab equals Brew Water Chem's: residual alkalinity, the sulfate-to-chloride ratio and its character, the recommended salts and acid, each acid's contribution, the predicted final profile.
- **W-S3** Every water figure is worked out by the engine and reaches the screen through the app's one calculation front door; the screens only display.
- **W-S4** The header's one Home/Pro switch sets the water units: volume gal or bbl, acidulated malt oz or lb; salts in grams and liquid acid in mL in both.
- **W-S5** Nothing on the Water tab changes the recipe, its figures, its saved copy, its recipe file or its printed sheet.
- **W-S6** Water entries are kept while the page is open and are not saved; the Water tab says so.
- **W-S7** A blank water test result stays blank; the figures that need it show "—" and the tab names the missing results.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session, one per item | The Models rule's default |
| W1 | One item or two | Two, each its own commit and inspector: (1) the water figures through the front door, nothing new on screen; (2) the screens | ~1,800 lines is too much for one line-by-line inspection; numbers before screens |
| W2 | Layout | One Water tab beside Recipe and Options; inside it the water app's four screens as a second row of tabs: Water In · Style · Salts & Acid · Notes ("Recipe" renamed so there are not two); the stats bar stays at the top, as on every tab | Port first, change second (WP6d) |
| W3 | Switching Home/Pro | Keep the one water volume and show it in the new unit (5 gal ↔ 0.161 bbl); the water app's reset to 10 bbl / 5 gal is not carried over | One canonical figure in gallons; the display converts (SPEC 8, 9) |
| W4 | Starting water volume | 5 gal (the water app's Home figure; the built-in recipe's mash water); linking it to the recipe comes in S4 | WP6d |
| W5 | A blank water test result | Stays blank (the water app counts it as 0 ppm); the figures that need it show "—" and the tab names the missing results; "Load example" and "RO water" still fill all seven; the "Empty:" line under the stats bar stays about the beer's figures | Never a number the brewer did not enter (SPEC 8) |
| W6 | Saved in S3? | No: kept until the page reloads, as the water app; the tab says "Not saved yet"; saved with the recipe from S4 (format version 5) | Roadmap and WP6d: not yet saved with the recipe |
| W7 | Printing | No water print in S3; Print still prints the recipe sheet; the water app's batch sheet is not carried over; the additions join the recipe sheet in S4 (step 6) | WP1 step 6 |
| W8 | The water app's Notes | Carried over, every reference and assumption word for word; only its version talk ("v1.2 does not predict mash pH… v2", "a future settings page (v1.3)") is replaced by where each stands in Brew Design (e.g. "mash pH: planned, from the grain bill — water program step 5") | Another app's version numbers would mislead |
| W9 | The dose shown as another acid | The engine gains the water app's on-screen step: the recommended lactic dose expressed as an equal-strength (same mEq) dose of the acid picked, pinned by a hand-worked example (88 % lactic as 10 % phosphoric), working shown in the test | SPEC 7; the hand-pin rule |
| K | Silent properties | **Durability:** none — entries are lost on reload (W6), and the tab says so. **Ordering:** as the water app, changing the volume, style or salts on hand clears the brewer's own salt and acid amounts back to the recommendation. **Storage disabled, schema migration, multi-tab, atomicity, idempotence:** none — nothing is saved | — |

## Scenarios — written first, must fail before

Item 1, *Water figures through the front door* — engine `packages/engine/test/water/acids.test.js` (or beside it) and app `apps/recipe/test/water-figures.test.js`:
1. *the recommended dose is expressed as an equal-strength dose of the acid picked* — W9; hand-worked: a lactic 88 % dose to its mEq, then to 10 % phosphoric mL, the working written in the test.
2. *every water figure equals Brew Water Chem's for the same entries* — W-S2; the water selector against the engine called directly (as `options.test.js` does for the recipe), for the example water, RO water, and each of the reference batches in `packages/engine/test/water/reference-batches/`.
3. *a blank test result blanks the figures that need it, and names the missing results* — W-S7, W5.
4. *the water units follow Home/Pro at the display edge* — W-S4, W3: 5 gal ↔ 5/31 bbl; acidulated malt g ↔ oz / lb by the engine's G_PER_OZ, G_PER_LB (hand pins).
5. *only the front door calls the water chemistry* — W-S3; `spec-rules.test.js`'s rule-10 scan covers the new files (it already refuses any engine function outside `selectors.js`; confirm it sees the water components).
6. *the recipe's figures, saved document and printed sheet are unchanged by any water entry* — W-S5, the guard.

Item 2, *Water tab screens* — `apps/recipe/test/water-tab.test.js` (the suite can render to text with `react-dom/server`, as `footer.test.js` does):
1. *the Water tab carries the four screens in the water app's order and wording* — W-S1, W2, W8.
2. *the Water tab says the entries are not saved, and nothing is saved* — W-S6, W6: storage holds the same keys and bytes before and after water entries.
3. *changing the volume, style or salts on hand returns the salt and acid amounts to the recommendation* — K ordering.

Expected failure before: no water selector, no dose step in the engine, no Water tab.

## Far end — on the built app

1. The same entries on the live Brew Water Chem site and on the Water tab — the example water, RO water and one hand-typed report, each at one style, Home and Pro — give every figure identical (residual alkalinity, ratio, each salt, acid dose in each acid, predicted profile).
2. Home ↔ Pro converts the volume (5 gal ↔ 0.161 bbl), not resets it.
3. A blank ion: its figures show "—", the tab names it; the stats bar's "Empty:" line does not.
4. Reload: water entries gone, "Not saved yet" was shown; the recipe, its saved copy and a recipe file byte-identical with and without water entries; Print prints the recipe sheet only.
5. No sideways scroll at 375 px on any water screen; no console errors.
6. A recipe saved by the live site loads with every number as on the live site.

## Notes from the spec session, for the builder

- **Source:** `C:/Users/micha/Documents/Code/brew-water-chem/src` — `App.jsx` (state, the lactic-to-other-acid step `recommendedMeq / acidCapacity(primary)`, the acid re-sync effect), `components/tabs/{WaterInTab,StyleTab,RecipeTab,NotesTab}.jsx`; `BatchSheet.jsx` is not carried over (W7). The engine's `packages/engine/src/water/*` is its `src/chemistry/*` line for line; `STYLE_FAMILIES` is in `water/styles.js`.
- **Front door:** a water selector beside `computeRecipe` in `selectors.js` (rule 10), taking the water state (source, style id, volume in gal, raise-alkalinity salt, salts on hand, overrides, acids, primary acid, multi-acid) and returning every figure the screens show; the components get plain props. `display.js` gains the acid-malt conversion by the engine's `G_PER_OZ` / `G_PER_LB` (add it to `spec-rules.test.js`'s allowed display conversions only if an engine *function* is used there).
- **Blanks (W5):** the water app's `parseFloat(x) || 0` must not come over; a blank is NaN. Check what `solveAdditions` / `predictFinalProfile` do with NaN and blank the recommendation when a result it needs is blank rather than let NaNs leak into grams. pH is shown only.
- **State:** the water state lives in `App.jsx` beside the recipe, never in the recipe state or its saved document (W6); the SPEC display-units table gains salts g, liquid acid mL, acidulated malt oz/lb.
- **Numbers:** the water app's defaults that are numbers (volume 5 gal) are Tier B by the catch-all; the rule for 5 gal is W4. Precision (`toFixed`) is display only.
- **Header:** Brew Design's Home/Pro only; the water app's own header is not carried over.
- **Files likely touched:** item 1 — `packages/engine/src/water/acids.js`, `index.js`, an engine test; `apps/recipe/src/selectors.js`, `display.js`, the new app test, `SPEC.md` (display units; rule 10 names the water selector), `docs/TEST_COVERAGE.md`. Item 2 — `App.jsx`, `components/TabBar.jsx`, new `components/water/*`, the new test, `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (row removed).

## Recorded failure (filled in by the builder)

Item 1, run alone against the unchanged code (2026-09-24), trimmed:

```
packages/engine  test/water/water-figures.test.js
 × the recommended dose is expressed as an equal-strength dose of the acid picked
 × a salt the recommendation adds in two steps is one amount
 × a predicted figure is graded against its target by the water app's bands
TypeError: (0 , equivalentAcidDose) is not a function
TypeError: (0 , saltTotals) is not a function
TypeError: (0 , targetMatch) is not a function
      Tests  3 failed (3)
apps/recipe  test/water-figures.test.js
 × every water figure equals Brew Water Chem's for the same entries
 × a blank test result blanks the figures that need it, and names the missing results
 × the water units follow Home/Pro at the display edge
 × only the front door calls the water chemistry
 × the recipe's figures, saved document and printed sheet are unchanged by any water entry
Error: Cannot find module '../src/water-state.js' (scenarios 2, 3 and 6)
TypeError: display.saltUnit is not a function
AssertionError: equivalentAcidDose: expected 'undefined' to be 'function'
      Tests  5 failed (5)
```

Item 2, run alone against item 1's commit (2026-09-24), trimmed:

```
apps/recipe  test/water-tab.test.js
 × the Water tab carries the four screens in the water app's order and wording
 × the Water tab says the entries are not saved, and nothing is saved
 × changing the volume, style or salts on hand returns the salt and acid amounts to the recommendation
 × a blank test result shows "—" and the tab names the missing results
 × the water volume and acidulated malt show in the Home/Pro unit
AssertionError: expected [ 'Recipe', 'Options' ] to deeply equal [ 'Recipe', 'Water', 'Options' ]
Error: Cannot find module '../src/components/water/WaterTab.jsx' (scenarios 2, 4, 5)
TypeError: s.setWaterVolume is not a function
      Tests  5 failed (5)
```

## Builder's notes — choices the sentences did not make (filled in by the builder)

Item 1 (claims for the inspector to verify):

- **Four engine functions, not one.** Besides W9's equal-strength dose
  (`equivalentAcidDose`), the water app did three more steps on its screens
  that W-S3 and SPEC rule 7 put in the engine: the solver's additions summed
  per salt (`saltTotals`, its App.jsx `recommendedSalts`), and the colour
  bands of the predicted profile (`targetMatch`: under 20 % of the target
  near, under 50 % off, else far — RecipeTab.jsx `statColor`;
  `residualAlkalinityMatch`: under 20 mg/L near, under 40 off, else far —
  `raColor`). The thresholds are the water app's, pinned by hand at each
  edge. A zero target grades near, as in the water app: a `// FLAG:`
  comment says so (no style has one). `findStyle` (already in the engine)
  is now exported, so the selector looks the style up the water app's way.
- **The dose sums in `applyAcids`'s order**, through `acidContribution`,
  so it is the water app's `recommendedMeq / acidCapacity(primary)` to the
  last bit (scenario 2 compares with `toEqual`, not a tolerance).
- **What a blank blanks (W5).** The solver reads several ions at each step
  (the sodium cap, the calcium and magnesium in the alkalinity step), so the
  recommendation needs all six ions; a blank one blanks every recommended
  amount, the acid dose and the predicted profile. The source water's
  residual alkalinity needs calcium, magnesium and alkalinity; its ratio
  needs sulfate and chloride (sulfate blank with chloride 0 is blank, not
  the water app's endless ratio). pH is shown only and blanks nothing else.
- **No positive volume, no recommendation** — as the water app, which shows
  no addition cards then.
- **The water entries** live in a new `apps/recipe/src/water-state.js`
  beside `state.js` (the recipe state is untouched): the seven results
  (NaN blank), style, volume in gal (5, W4), alkalinity-raising salt, salts
  on hand, the brewer's own salt amounts (sparse) and acid amounts (null =
  follow the recommendation — item 2 uses it in place of the water app's
  re-sync effect), the acid picked, and the several-acids switch. Its
  "Load example" and "RO water" figures are the water app's
  (WaterInTab.jsx), pinned in scenario 2. SPEC rule 8 gains a sentence
  saying the entries are a second object, never in the recipe or its saved
  document; rule 10 names `computeWater`; the units table gains the water
  rows.
- **"Customized"** (whether Reset to recommended shows) compares acid
  amounts within 1e-6, the water app's tolerance; it decides a button, not a
  figure.
- **Scenario 6** (the recipe unchanged) fails before only because the water
  modules do not exist; with nothing on screen in item 1 it is a guard.
  Item 2's storage scenario is the stronger check.

Item 2 (claims for the inspector to verify):

- **Two scenarios beyond the three named**: *a blank test result shows "—"
  and the tab names the missing results* (W-S7, W5 on screen) and *the water
  volume and acidulated malt show in the Home/Pro unit* (W-S4, W3 on
  screen). Item 1 proved both as figures; these prove the screens show them.
- **The top row reads Recipe · Water · Options.** W2 puts the Water tab
  beside both; it sits between them, the Options tab staying last as the
  settings. One line in the tab bar to move it.
- **Inside the tab:** the water app's tab row one size smaller (wrapping on a
  phone), then "Not saved yet: the water entries last until the page is
  reloaded." on every screen (W6), then — only while a result is blank — a
  line in the warning style, "Blank test results: …", naming them by the
  water app's own row labels (W5). The stats bar and its "Empty:" line stay
  as they are. The screen open inside the tab is kept while the page is open.
- **The water app's handlers are steps in `water-state.js`**, each a pure
  function: the volume, style, salts on hand and alkalinity-raising salt
  return the brewer's own salts and acid to the recommendation (K); a new
  test result returns the acid and keeps the salts (the water app re-synced
  its acid whenever the recommendation changed, and did not clear its salt
  overrides); one acid: picking another re-expresses the dose; several acids:
  picking only renames the primary; back to one acid keeps the primary's
  amount. "Acid amounts = none" follows the recommendation, in place of the
  water app's re-sync effect. Home/Pro is not a step: it clears nothing,
  because the volume no longer changes with it (W3; the water app cleared
  the brewer's amounts only because it reset the volume).
- **Salt and acid boxes** are the water app's draft boxes: a box emptied
  and left reads 0, shown as 0, as in the water app (W5 covers test
  results). While the recommendation is blank the boxes show empty and stay
  empty when left untouched. Boxes are keyed by Home/Pro so acidulated malt
  and gram precision re-show in the new unit.
- **Display only, as the water app:** grams whole in Pro and to 0.1 g at
  Home; liquid acid whole mL; acidulated malt 0.01 oz or lb; mEq 0.1. The
  ratio with no chloride shows "∞" on both screens (the water app showed
  "∞" on Water In and "Infinity" on its Recipe tab). With no positive volume
  the addition cards are not shown, as in the water app.
- **Notes (W8):** every reference, assumption, the validation note and the
  disclaimers word for word; the version talk replaced ("Scope &
  Limitations"; "Mash pH is not predicted yet … planned … water program
  step 5"; "What the Water tab does do"; the solver's own acid "not yet
  planned"; the v1.1 paragraph as "all here … Brew Water Chem's, unchanged");
  "the Recipe tab" reads "the Salts & Acid screen" (W2's rename). The
  disclaimers still call the tool "Brew Water Chem": kept word for word, and
  a roadmap line (Tier C) asks the owner.
- **Colours:** the three band colours are the water app's, added to
  `styles.js` (SPEC 14); the checkboxes keep the water app's accent.
- **No number that produces a recipe value** is introduced in item 2: the
  default volume and example figures landed in item 1; the rest is display
  precision and layout.

Far end, item 2 (2026-09-24, the built app at localhost:4173 against the live
Brew Water Chem site, brew-water-chem.netlify.app, driven by the same script
in both): the example water (American Pale Ale), RO water (Stout) and a
hand-typed report (Ca 45, Mg 12, Na 18, SO4 30, Cl 25, alkalinity 180, pH
7.8; West Coast IPA), each Home 5 gal and Pro 10 bbl: the source status,
every salt row and reason, every box, the dose in each of the five acids and
the predicted profile identical in all six cases (e.g. Pro, the hand-typed
report: 281 mL 88 % lactic, 3085 mL 10 % phosphoric, 32.95 lb acidulated
malt, "Neutralize 142 mg/L alkalinity (3318.6 mEq total)"), and the
near/off/far colours identical. Home ↔ Pro: 5 gal ↔ 0.16129 bbl ↔ 5.
Chloride blank: ratio and character "—", "Blank test results: Chloride
Ion", every addition figure "—", the stats bar's "Empty:" line absent.
Reload: entries gone, volume 5 gal, the saved copy byte-identical to the one
saved while water entries were on screen, one storage key. Print: the app
root (the Water tab with it) is hidden, only the recipe sheet prints. 375 px:
no sideways scroll on any water screen, Home or Pro, one or several acids.
No console messages. A recipe saved by the live Brew Design site (Pro, SG,
150/60/68 °F) loads with every box and every stats figure the same and is
saved back byte-identical.
