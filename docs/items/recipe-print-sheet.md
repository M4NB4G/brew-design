# Printed recipe sheet — Tier C

Status: agreed 2026-09-22 ("A is good. Agree to all."), not started. Written by
the spec session; to be built by a new session from CLAUDE.md's kickoff prompt.
Depends on `docs/items/recipe-identity.md` (the name, style and notes it
prints) and `docs/items/grist-percent.md` (the percentage column) landing
first. The Persyn lockup artwork is owed by the owner — see
`docs/items/header-persyn-mark.md` for the asset specification.

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
| M1 | Builder model | Opus, high effort | Not required by the tier table for Tier C, but the sheet is a large component with fiddly print layout |
| M2 | Inspector | Not required. Tier C's gate is "suites pass", and the far end is looking at it in print preview | CLAUDE.md change-control table. The sheet introduces no recipe number — see P8 |
| P1 | How it is produced | A control that opens the browser's print dialog; the owner chooses "Save as PDF" or a printer there | Same mechanism as the water app; no new dependency, and it prints on paper too |
| P2 | What is on it | The list in S5 | Everything carried to the kettle, in the reference sheet's order |
| P3 | Units | Whatever mode the screen is in | What you see is what you print; a third unit rule would be a third thing to keep true |
| P4 | Changes from the reference | Blank "measured" boxes beside predicted starting gravity, final gravity and each volume, so the sheet doubles as a brew-day worksheet | The owner asked for clarity over fidelity; those are exactly the numbers a brewer writes down on the day |
| P5 | Length | One page if it fits; flow to a second rather than shrink below readable size | A sheet that cannot be read at the kettle is not a sheet |
| P6 | Branding | The full Persyn lockup, top-left, as the water app's sheet does it | The owner's decision of 2026-09-22 |
| P7 | The percentage column | Included; the number comes from the calculation engine (`docs/items/grist-percent.md`), never from the sheet | SPEC rule 7 — no brewing math in the app |
| P8 | Numbers on the sheet | None introduced. Every value is an existing derived number put through the existing display boundary; the only literals the sheet adds are type sizes, spacing and column widths | The change-control catch-all excludes display precision and layout values, so the sheet stays Tier C |
| P9 | Print colors and SPEC rule 14 | The sheet's palette goes into the shared styling source with the rest of the app's colors, not into the sheet file. The water app's sheet defines its own constants at the top; copying that here would break rule 14 | SPEC rule 14: the shared styling source is the only styling source, and no hex lives outside it |
| P10 | App version on the sheet | Omitted. The water app's sheet prints one; Brew Design has no meaningful version number today, and a wrong version is worse than none | A number nobody decided is not printed |
| P11 | Measurement temperatures | Printed beside a volume only where that volume was measured at something other than the 60 °F reference; a sheet of three "60 °F" notes is noise | The Options page already exposes them; the sheet reports only what departs from the default |
| P12 | Silent properties | Printing is a read: it touches no state, triggers no save, and leaves the working copy alone. The sheet re-renders from the same derived values the screen holds, so what prints is what is on screen at that moment. The browser's dialog — including whether "Save as PDF" is offered — is the operating system's, not the app's. No page-break control beyond letting content flow | Named so they are checked, not discovered |
| P13 | Files and tier | Tier C. A new `apps/recipe/src/components/RecipeSheet.jsx`, `apps/recipe/src/components/Header.jsx` (the control), `apps/recipe/src/App.jsx` (rendering the sheet), `apps/recipe/src/index.css` (the print rules), `apps/recipe/src/components/shared/styles.js` (the print palette), `docs/TEST_COVERAGE.md`, `docs/ROADMAP.md` (this item's row removed), this file | Components and styling are Tier C paths |

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

## Far end — Tier C: look at it

`npm test` at the root; `npm run build`; then the running app in a browser:
open print preview and confirm the sheet appears alone with no interface
around it, that it is not visible on screen at any point, that it fits Letter
portrait at half-inch margins, that the measured boxes are writable-sized, and
that switching Home/Pro changes the printed units. Save one as a PDF and read
it at the size it prints.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
