# Printed recipe sheet — Tier B

Status: agreed 2026-09-22 ("A is good. Agree to all."); model rows agreed
2026-09-23 (Opus builds, Opus inspects). Re-tiered C → B on 2026-09-23: the
sheet is rendered from the app's top-level file, which the path table and the
commit hook treat as Tier B. Landed 2026-09-23 on branch `recipe-print-sheet`
as "Print recipe opens the browser's print dialog on a sheet never shown on
screen: the recipe in the screen's units, computing nothing, with boxes for
the measured values"; awaiting the owner's "merge and push". Written by the
spec session; built by a new session from CLAUDE.md's kickoff prompt. Depends on
`docs/items/recipe-identity.md` (the name, style and notes it prints) and
`docs/items/grist-percent.md` (the percentage column) landing first. It does
**not** wait on the owner's new artwork — see P14.

## Why

The owner has been designing a real recipe in the app and wants to carry it to
the kettle and keep a copy: a printed sheet, or "Save as PDF" from the print
dialog. Brew Water Chem already does exactly this — a print-only batch sheet,
hidden on screen, rendered to paper by the browser's own print command. The
owner supplied its printed output as the formatting reference and asked for
similar formatting, with changes where they buy clarity.

The mechanism is the browser's: no PDF library, no new dependency, and it
prints on paper as readily as to a file.

## Sentences — what must be true afterwards

- **S1** A "Print recipe" control opens the browser's print dialog. What prints is the recipe sheet alone; no part of the on-screen interface appears on the page.
- **S2** The sheet is never visible on screen — before, during or after printing.
- **S3** The sheet computes nothing. Every number on it is one the screen already derives, formatted at the same display boundary the screen uses.
- **S4** The sheet prints in whatever units the screen is set to: Home prints gallons and ounces, Pro prints barrels and pounds, and gravity follows the Pro gravity setting.
- **S5** The sheet carries, in order: a header band (Persyn lockup left; BREW DESIGN and "Recipe Sheet" right); a line of recipe name, style, batch volume and today's date; the six headline numbers; the grain bill with weight, share of the bill, yield and color per malt; the water volumes with the mash ratio; the kettle hop schedule with each addition's bitterness contribution and the dry hops with their rate; yeast with pitch rate, cells needed and the starter recommendation; the notes if any; and a footer.
- **S6** Blank boxes for writing a measured value sit beside the predicted starting gravity, the predicted final gravity, and each water volume.
- **S7** An empty notes box prints no notes section at all, and a recipe with no name prints the sheet without a title rather than printing an invented one.
- **S8** The footer carries the process-guidance disclaimer and blank "Brewer" and "Date brewed" lines.
- **S9** The page is Letter portrait with half-inch margins. Content that does not fit flows to a second page; nothing is shrunk below the sheet's type sizes to force one page.
- **S10** Printing changes no recipe value, no derived number, and no saved copy.
- **S11** A volume measured at the 60 °F reference prints no temperature note; a volume measured at any other temperature prints that temperature beside it.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | The Models rule's default (the owner, 2026-09-23); high effort because the sheet is a large component with fiddly print layout |
| M2 | Inspector model | Opus, default effort, a fresh session | Required: rendering the sheet changes the app's top-level file, a Tier B path, and the commit hook refuses a Tier B commit without a PASS box. The sheet introduces no recipe number (P8), so no hand-calculated pin is owed |
| P1 | How it is produced | A control that opens the browser's print dialog; the owner chooses "Save as PDF" or a printer there | Same mechanism as the water app; no new dependency, and it prints on paper too |
| P2 | What is on it | The list in S5 | Everything carried to the kettle, in the reference sheet's order |
| P3 | Units | Whatever mode the screen is in | What you see is what you print; a third unit rule would be a third thing to keep true |
| P4 | Changes from the reference | Blank "measured" boxes beside predicted starting gravity, final gravity and each volume, so the sheet doubles as a brew-day worksheet | The owner asked for clarity over fidelity; those are exactly the numbers a brewer writes down on the day |
| P5 | Length | One page if it fits; flow to a second rather than shrink below readable size | A sheet that cannot be read at the kettle is not a sheet |
| P6 | Branding | The full Persyn lockup, top-left, as the water app's sheet does it | The owner's decision of 2026-09-22 |
| P7 | The percentage column | Included; the number comes from the calculation engine (`docs/items/grist-percent.md`), never from the sheet | SPEC rule 7 — no brewing math in the app |
| P8 | Numbers on the sheet | None introduced. Every value is an existing derived number put through the existing display boundary; the only literals the sheet adds are type sizes, spacing and column widths | The change-control catch-all excludes display precision and layout values, so no number raises the tier; the tier comes from the files (P13) |
| P9 | Print colors and SPEC rule 14 | The sheet's palette goes into the shared styling source with the rest of the app's colors, not into the sheet file. The water app's sheet defines its own constants at the top; copying that here would break rule 14 | SPEC rule 14: the shared styling source is the only styling source, and no hex lives outside it |
| P10 | App version on the sheet | Omitted. The water app's sheet prints one; Brew Design has no meaningful version number today, and a wrong version is worse than none | A number nobody decided is not printed |
| P11 | Measurement temperatures | Printed beside a volume only where that volume was measured at something other than the 60 °F reference; a sheet of three "60 °F" notes is noise | The Options page already exposes them; the sheet reports only what departs from the default |
| P12 | Silent properties | Printing is a read: it touches no state, triggers no save, and leaves the working copy alone. The sheet re-renders from the same derived values the screen holds, so what prints is what is on screen at that moment. The browser's dialog — including whether "Save as PDF" is offered — is the operating system's, not the app's. No page-break control beyond letting content flow | Named so they are checked, not discovered |
| P13 | Files and tier | Tier B. A new `apps/recipe/src/components/RecipeSheet.jsx` (its data shaping may sit in that file or a sibling module under `components/`, so the suite can test it without a DOM), a new `apps/recipe/test/print-sheet.test.js`, `apps/recipe/src/components/Header.jsx` (the control), `apps/recipe/src/App.jsx` (rendering the sheet), `apps/recipe/src/index.css` (the print rules), `apps/recipe/src/components/shared/styles.js` (the print palette), the lockup artwork in `apps/recipe/src/assets/` (P14), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (this item's row removed), this file | `App.jsx` is on the Tier B path list; everything else here is a Tier C path |
| P14 | Artwork source | Use the owner's transparent full-lockup artwork if it has landed in `apps/recipe/src/assets/`. Otherwise copy `brew-water-chem/public/persyn-logo.jpg` into `apps/recipe/src/assets/` and import it from there. The sheet prints on white, so the JPG's opaque white background does not show. Never reference the other repository's path at build or run time | P6 — the same file the water app's sheet uses; and the sheet must not wait on artwork it does not need |

## The reference sheet's visual language

Read from `brew-water-chem/src/components/tabs/BatchSheet.jsx` (the component
that produced the PDF the owner supplied) and its print rules in
`brew-water-chem/src/styles/globals.css`. Worth matching:

- Header band: lockup left at about 140 px wide; right-aligned product name at
  16 px bold navy, subtitle at 9 px grey, uppercase, wide letter-spacing.
- Metadata row: small uppercase grey labels over 10 px semibold navy values.
- Section headings: 9 px bold uppercase navy, wide letter-spacing, with a
  1.5 px navy rule beneath.
- Tables: 10 px body, 8 px uppercase headers on a pale blue fill, 1 px borders,
  alternating row tint.
- Footer: 8 px grey disclaimer, then a dashed rule and 10 px signature lines.
- The sheet is hidden with a screen-only rule and revealed by a print-only
  rule that also hides the application root, so no blank pages appear.

## Scenarios — `apps/recipe/test/print-sheet.test.js`, written first, must fail before

The suite runs without a DOM, so these test the sheet's data shaping, not its
appearance:

1. *the sheet renders every recipe value from the derived values it is given, computing nothing* — S3 (assert against `computeRecipe` output for the reference recipe)
2. *an empty notes box produces no notes section* — S7
3. *a volume measured at the reference temperature prints no temperature note; one measured elsewhere does* — S11
4. *the sheet's numbers follow the display mode: Home and Pro produce different volume and hop-weight text for the same recipe* — S4

Appearance, page size and the print-only behaviour are the far end, not the
suite.

## Notes from the spec session — traps checked 2026-09-23

- **The engine already supplies everything the sheet prints.** Each kettle
  addition's bitterness contribution and the dry-hop rate come back from the
  hop calculation; mash ratios, gravities, color and ABV from the grain
  calculation; pitch rate, cells and the starter from the yeast path. Only the
  grain-bill share is missing, and that is `docs/items/grist-percent.md`. If
  the sheet seems to need any other number, it is a question for the owner,
  not arithmetic in the sheet (SPEC rule 7).
- **Per-addition bitterness is unrounded; the total is the engine's rounded
  integer.** Printed at whole numbers, the additions can visibly fail to sum
  to the total (40 + 12 beside a total of 53). Pick a precision that
  reconciles, or say on the sheet that the total is computed, not summed —
  and record the choice in the builder's notes.
- **Blank inputs.** The screen's bitterness readout shows "NaN" for a blank
  input (a Tier C roadmap line). The sheet must not copy that: format every
  number through the same dash-producing formatter the other stats use.
- **No DOM in the suite.** The app's tests run in plain Node, so the sheet's
  data shaping must be importable and callable without rendering.

## Far end — Tier B

`npm test` at the root; `npm run build`; then the running app in a browser:
open print preview and confirm the sheet appears alone with no interface
around it, that it is not visible on screen at any point, that it fits Letter
portrait at half-inch margins, that the measured boxes are writable-sized, and
that switching Home/Pro changes the printed units. Save one as a PDF and read
it at the size it prints.

## Recorded failure (filled in by the builder)

Run alone against the unchanged code, 2026-09-23
(`npx vitest run test/print-sheet.test.js` in `apps/recipe`): the file failed
to load and no scenario ran. The unchanged code has no sheet, so every
scenario fails at the first line that asks for its text:

    FAIL test/print-sheet.test.js
    Error: Cannot find module '../src/components/recipe-sheet-data.js'
      imported from '.../apps/recipe/test/print-sheet.test.js'
     > test/print-sheet.test.js:20:1
       import { recipeSheet } from '../src/components/recipe-sheet-data.js';
    Test Files  1 failed (1)
         Tests  no tests

After the change: 5 passed alone; `npm test` engine 185/185, app 49/49;
`npm run build` passes.

## Builder's notes — choices the sentences did not make (filled in by the builder)

1. **Which item file.** `main` carried the first draft of this file (Tier C,
   no P14); the kickoff named the revision on the `items-ready` branch (Tier
   B, Opus inspector, P14), which is the one built. It is brought onto this
   branch unchanged except for this status, the recorded failure and these
   notes.
2. **Shape.** The sheet's text is made in a sibling module under
   `components/` (`recipe-sheet-data.js`, as P13 allows) that the suite calls
   without a DOM; `RecipeSheet.jsx` only lays it out. The module imports the
   display boundary and the formatter, never the engine.
3. **Five scenarios, not four.** S7 has two halves; the no-name half has its
   own scenario (*a recipe with no name prints no title, never an invented
   one*). Scenario 1 also checks S10 at the data level (neither input
   changes) and that a blank prints a dash.
4. **Precision** (display only). Where the screen shows a number, the sheet
   uses the screen's digits: gravity 3 as SG and 2 as °P, ABV 1, SRM 1, total
   IBU 0, each addition's IBU 1, cells 0 (billion) or 2 (trillion), dry-hop
   rate 2, pitch rate 2, starter volume 2, DME 0. Where the screen shows an
   input box, the sheet chooses: volumes 2 (gal) or 3 (bbl); hop weights 2
   (oz) or 3 (lb); malt weight 2; share, yield, alpha, efficiency,
   attenuation 1; color 1; mash Rv and R 2; temperatures as typed (whole, or
   one decimal).
5. **Bitterness.** Additions print at one decimal, as the screen's badges do;
   the total is the engine's rounded total, labelled "the rounded total of
   the unrounded additions", so 23.1 + 11.5 + 5.6 + 1.9 + 2.9 beside 45 reads
   as intended. The sheet never sums anything.
6. **Blanks.** Every number, the IBU total included, goes through the
   dash-producing formatter; the screen's own IBU "NaN" is the existing Tier
   C roadmap line and is not touched here.
7. **The name line.** Title = the recipe name when it has any non-blank text,
   otherwise no title. Style prints only when it has text; a blank style is
   omitted rather than shown as "—". Batch volume = the fermentation volume
   (what goes into the fermenter), in the screen's unit. Date = today, US
   long form ("September 23, 2026"), refreshed as the print dialog opens so a
   tab left open overnight prints the right day. Notes of only blanks count
   as empty (S7).
8. **Volumes.** Printed as the screen shows them: mash water, pre-boil and
   fermentation as entered; post-boil at the 60 °F reference (the screen's
   read-only value). The temperature note (S11) goes on pre-boil, post-boil
   and fermentation when their measurement temperature is not 60 °F; a
   cleared temperature is not 60 and prints "measured at — °F"; mash water is
   never corrected and never noted. The 60 is a named comparison value in the
   data module — the engine's default reference temperature, not a recipe
   value; a Tier A roadmap line proposes the engine export it. A second
   roadmap line (Tier B) records that the post-boil box invites a hot reading
   against a 60 °F prediction.
9. **Beyond the S5 list** — recipe inputs the screen shows, printed so the
   sheet reproduces the recipe: brewhouse efficiency and apparent attenuation
   under the grain bill; boil time and boil-off rate beside the mash ratio;
   each kettle hop's time, temperature and alpha; yeast type and character.
   Nothing derived is added beyond S5.
10. **Measured boxes** (S6): 80 × 24 px (about 0.83 × 0.25 in on paper) under
    OG and FG in the headline table, and a Measured column in the volumes
    table, one box per volume.
11. **Print mechanics.** The sheet is portaled into `<body>` beside the app
    root; the screen rule hides it; the print rule hides the root and shows
    the sheet, so the browser's own print command (Ctrl+P, the menu) also
    prints the sheet alone, not only the button. Header fills and row tints
    are forced to print (`print-color-adjust: exact`) so they survive a
    dialog with "Background graphics" off. No page-break rules (P12): the
    yeast facts are a one-row table rather than a label/value strip, because a
    table row moves whole to the next page while the strip split its labels
    from its values; a section heading can still end a page with its table on
    the next (seen with the nine-dry-hop reference recipe).
12. **Palette and rule 14.** The print palette is `printColors` in the shared
    styling source (P9); `index.css` gains only the print rules and uses the
    named colour `white`, no hex. Its header comment now says it owns them.
13. **Artwork (P14).** The owner's transparent lockup has not landed, so the
    water app's `persyn-logo.jpg` is copied into `apps/recipe/src/assets/`
    and imported from there; nothing refers to the other repository.
14. **Words on the sheet.** Product line "BREW DESIGN" / "Recipe Sheet"; the
    disclaimer adapts the water app's: "For process guidance only. Verify
    gravities and volumes by measurement before production use. Persyn
    Chemical Engineering and Consulting assumes no liability for brewing
    outcomes." The water app's line of chemistry citations is not carried.
    The control reads "Print recipe" and sits after Reset in the header's
    outlined style.
15. **Far end, 2026-09-23** (built app, `vite preview`). Browser pane: the
    sheet exists in `<body>`, computed display none and zero height on
    screen; the button calls the browser's print once; the saved copy is
    byte-identical before and after; the sheet's headline equals the stats
    bar; Home → Pro switches the printed batch volume, volume column, hop
    weights and gravity, and back. Print to PDF (headless Chrome, the app's
    own print rules) for the reference recipe in Home and in Pro with SG, and
    for a fresh unnamed recipe: the sheet alone, Letter portrait, half-inch
    margins; the long recipe flows to a second page at full type size; the
    fresh one fits one page with no title, style or notes.
