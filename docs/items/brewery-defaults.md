# Brewery defaults — Tier B

Status: agreed 2026-09-23 ("agree to all else"); landed 2026-09-23 as "A new
recipe starts from the brewery's figures, kept in this browser apart from any
recipe and set on the Options tab; a blank one is the built-in figure, and
changing them never changes a recipe". Written by the
spec session; to be built by a new session from CLAUDE.md's kickoff prompt,
**after** `docs/items/phone-width.md` has landed. Step 2 of the water program
(`docs/items/water-program.md`, WP3, WP4, WP5, WP10).

## Why

The owner (2026-09-23): "I would like to be able to set the volumes for their
brewery as persistent defaults so the user doesn't have to reenter it every
recipe for their system." Today a new recipe (Reset, or a first visit) always
starts from the app's built-in figures (7 gal pre-boil, 1.5 gal/hr boil-off,
60 min, 5.5 gal fermentation, 60 °F measurements, 75 % efficiency, Home).
The water program's step 4 later adds the water setup to these figures
(WP10).

## Sentences — what must be true afterwards

- **S1** The Options tab has a **My brewery** section holding the brewery's figures: batch (fermentation) volume, pre-boil volume, boil-off rate, boil time, the three measurement temperatures, brewhouse efficiency, Home/Pro, and the Pro gravity unit (°P or SG).
- **S2** "Use this recipe's figures" fills them from the recipe on screen; each can also be typed. They show in the current mode's units (gal or bbl).
- **S3** A new recipe — "Reset to defaults", or a first visit with nothing saved — starts from the brewery's figures; any figure left blank uses the app's built-in one, as today. Everything else in a new recipe is unchanged (malts, hops, yeast, mash water).
- **S4** Changing the brewery's figures never changes the recipe on screen, a saved recipe, or a recipe file.
- **S5** The brewery's figures are kept in this browser, apart from the recipe, and survive a reload. "Forget my brewery figures" (with a confirm) returns to the built-in ones.
- **S6** Nothing is calculated differently: a recipe with the same figures gives the same stats.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default, every tier (the owner, 2026-09-23) |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default. No number is introduced; the built-in figures are unchanged |
| K1 | Where it lives | A My brewery section on the Options tab, below the measurement temperatures | Settings that are not the beer belong on Options |
| K2 | Include the Pro gravity unit? | Yes, with Home/Pro | Reset sets both today; a brewery working in Pro and °P should not switch every time |
| K3 | A figure left blank | Uses the built-in figure; a blank never reaches a new recipe as a blank | A new recipe always computes |
| K4 | Reset's wording | Keep "Reset to defaults"; its confirm reads "…to your brewery's figures" once any are set | Familiar controls; the confirm says what happens |
| K5 | Importing a recipe file | Unaffected: the file's own figures win | A recipe keeps its own copy (WP4) |
| K6 | Silent properties | **Storage:** their own document under their own key, with its own version (1); unreadable, another version, or blocked storage → the built-in figures, never throws. **Multi-tab:** last write wins, as the recipe. **Recipe saved format:** unchanged (version 4) — the recipe already holds every one of these figures. **When they apply:** only when a recipe is created, never to one that exists | The saved format changes, but not the recipe's |
| K7 | Tier and proof | Tier B: inspector and far end | It stores a new document and fills new recipes |

## Scenarios — `apps/recipe/test/brewery-defaults.test.js`, written first, must fail before

1. *with no brewery figures, a new recipe is today's built-in recipe* — S3, K3.
2. *brewery figures fill a new recipe's batch volume, pre-boil volume, boil-off rate, boil time, measurement temperatures and efficiency, and its Home/Pro and gravity unit; every other field is the built-in one* — S1, S3, K2.
3. *a brewery figure left blank gives the built-in figure* — K3.
4. *"use this recipe's figures" takes exactly those figures from the recipe on screen, and nothing else* — S2.
5. *the brewery figures round-trip through their own saved document at version 1; unreadable, another version or blocked storage gives the built-in figures and nothing throws* — S5, K6.
6. *saving brewery figures changes neither the saved recipe nor its document, and a recipe loads as it was saved whatever the brewery figures* — S4, K5, K6.
7. *forgetting the brewery figures returns a new recipe to the built-in one* — S5.
8. *a recipe from brewery figures gives the same stats as the same recipe typed by hand* — S6.

Expected failure before the change: the brewery document and the functions
that build a new recipe from it do not exist.

## Far end — Tier B, on the built app

1. Options tab: My brewery section below the measurement temperatures.
2. Edit a recipe to pre-boil 16, boil-off 1.5, fermentation 12, efficiency
   93, Pro and °P; "Use this recipe's figures": the section shows them
   (Pro: bbl). Reload: they are still there.
3. Reset to defaults (confirm names the brewery's figures): the new recipe
   carries those figures, in Pro and °P, with the built-in malts, hops, yeast
   and mash water; stats as for the same recipe typed.
4. Change a brewery figure: the recipe on screen does not move; a saved
   recipe reloaded does not move; an exported file is unchanged.
5. Clear one brewery figure, reset: that figure is the built-in one.
6. Forget my brewery figures (confirm): reset gives today's built-in recipe.
7. A recipe saved by the live site loads with every number as on the live
   site.

## Notes from the spec session, for the builder

- **Today** a new recipe is `defaultRecipeState()` (`apps/recipe/src/state.js`)
  plus `DEFAULT_DISPLAY` (`App.jsx`: Home, °P); `App.jsx` uses them on first
  load (as `loadPersisted`'s fallback), on Reset, and as `importRecipeFile`'s
  template.
- **Trap — old recipes must keep loading at the built-in figures.**
  `persistence.js` reads a version-1 document with `measurementTempF` taken
  from `defaults.recipe` (SPEC rule 13: "loads … with the three at 60 °F"),
  and checks every document's shape against `defaults.recipe`. If the
  brewery's figures were passed in as those defaults, an old recipe would load
  at the brewery's temperatures — a changed number. Keep upgrades and the
  shape check on the built-in recipe; only the "nothing saved / unreadable"
  fallback and Reset start from the brewery's figures. A scenario should pin
  it (a version-1 document loads at 60 °F with brewery temperatures of 150).
- **Files likely touched:** `state.js` (a new recipe from brewery figures),
  `persistence.js` (the brewery document, its key and version), `App.jsx`
  (first load, Reset, the brewery figures' state), `components/OptionsSection.jsx`
  (the section), `test/brewery-defaults.test.js` (new), `SPEC.md` (rule 13,
  or a new rule, for the brewery document), `docs/TEST_COVERAGE.md`,
  `docs/ROADMAP.md` (the Brewery defaults row removed), this file.
- **Units:** the brewery figures are held in the recipe's own units (gal,
  °F, fraction) and converted for display only through `display.js` (SPEC
  rules 8 and 9). Efficiency shows as percent.
- **A cleared recipe field** taken by "use this recipe's figures" is a blank
  brewery figure (K3), not a stored NaN that could reach a recipe.
- **Owner-facing language:** "your brewery's figures", "My brewery".

## Recorded failure (filled in by the builder)

`npx vitest run test/brewery-defaults.test.js` on branch `brewery-defaults`
at `main` 703df21, before any source change — 8 of 8 fail:

```
× with no brewery figures, a new recipe is today's built-in recipe
    TypeError: (0 , emptyBreweryFigures) is not a function
× brewery figures fill a new recipe's batch volume, … every other field is the built-in one
    TypeError: (0 , newRecipe) is not a function
× a brewery figure left blank gives the built-in figure
    TypeError: (0 , newRecipe) is not a function
× "use this recipe's figures" takes exactly those figures from the recipe on screen, and nothing else
    TypeError: (0 , breweryFiguresFromRecipe) is not a function
× the brewery figures round-trip through their own saved document at version 1; …
    TypeError: (0 , saveBrewery) is not a function
× saving brewery figures changes neither the saved recipe nor its document, …
    TypeError: (0 , saveBrewery) is not a function
× forgetting the brewery figures returns a new recipe to the built-in one
    TypeError: (0 , saveBrewery) is not a function
× a recipe from brewery figures gives the same stats as the same recipe typed by hand
    TypeError: (0 , newRecipe) is not a function
Tests  8 failed (8)
```

(Scenario 8's last line read `grist.og` in the first draft; the engine's
field is `OG`. Corrected before any source change; the failure above is
unchanged by it.)

## Builder's notes — choices the sentences did not make (filled in by the builder)

- **Blank is `null`**, in memory and in the saved document. A new recipe
  also treats NaN, or anything that is not a finite number, as blank, so no
  blank can reach a recipe (K3). "Use this recipe's figures" turns a cleared
  (NaN) recipe field into `null`.
- **The brewery document is read strictly**: every figure must be present,
  each `null` or a finite number (Home/Pro and gravity unit: `null` or one of
  the two), or the whole document reads as every figure blank — never a
  partial read.
- **Old recipes keep loading at the built-in figures** (the trap in the
  notes): `loadPersisted` gained an optional third argument, the fallback,
  so upgrades and the shape check still read against the built-in recipe;
  `loadStartingState` (persistence.js) is the one call the app opens with —
  the saved recipe, else a new recipe from the brewery's figures. Import is
  unchanged and still reads against the built-in recipe (K5).
- **The display defaults (Home, °P) moved** from `App.jsx` to `state.js`,
  unchanged, as `DEFAULT_DISPLAY`: a new recipe needs them.
- **Saving**: each edit in My brewery writes the brewery document at once
  (not an effect on load), so nothing is written until the brewer sets a
  figure; Forget removes the key. Multi-tab: each tab writes its whole
  in-memory figures; last write wins; another tab sees them on reload.
- **Confirms**: Reset reads "Reset the recipe and settings to your brewery's
  figures? The saved copy will be removed." once any figure is set, and is
  unchanged otherwise (K4). Forget reads "Forget your brewery's figures? A
  new recipe will start from the built-in figures; the recipe on screen is
  unchanged."
- **The section** is a second card, "My brewery", below the Measurement
  temperatures card: the four boil/batch figures, the three temperatures,
  efficiency (%), then Home/Pro and Pro gravity unit as drop-downs whose
  blank choice reads "Built-in (Home)" / "Built-in (°P)", then the two
  buttons. The gravity unit can be set while the recipe is in Home.
- **Units**: volumes and the boil-off rate convert through `display.js`'s
  volume pair, efficiency through the percent pair; shown to
  `roundForInput`'s 6 places and percent to 4, as the Volumes card and Grist
  do. No number is introduced. A figure typed in bbl stores the existing
  conversion's gallons (0.6 bbl → 18.599999999999998 gal), exactly as the
  Volumes card does today.
- **Deferred**: blank boxes could show the built-in figure greyed — a Tier C
  roadmap line.
