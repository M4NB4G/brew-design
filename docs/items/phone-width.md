# Phone width — Tier C

Status: agreed 2026-09-23 ("agree to all"); landed 2026-09-23 as "On a phone
the page never scrolls sideways and nothing is cut off at a card's edge:
sections stack, the stats bar is two rows of three, ingredient rows become
blocks, and desktop and print are unchanged". Written by the spec session;
built by a new session from CLAUDE.md's kickoff prompt.

## Why

The owner (2026-09-23, from a phone screenshot of the live site): it "doesn't
look good on mobile". Measured on the live site (main 9a77229, 2026-09-23):

- **360 px:** the page is 26 px wider than the screen. The Volumes card keeps
  Mash and Boil/Ferment side by side, so the whole right column — pre-boil,
  boil-off, boil time, post-boil and fermentation boxes — runs past the
  card's edge.
- **375 px:** the same column is clipped at the card's edge; labels in the
  half columns wrap to three lines ("Mash water (gal)" 66 px tall).
- **Top of the page:** header 166 px (the four action buttons wrap into two
  ragged right-aligned rows beside Home/Pro) plus the sticky stats bar 149 px
  (six tiles in one row; the cells tile's label wraps to five lines and
  stretches every tile) — about 40 % of a 780 px screen.
- **Ingredient tables:** grist 520 px and kettle hops 560 px wide inside a
  300 px card; FGDB, colour, alpha, IBU and remove are reached by a sideways
  swipe. Starter table 340 px.
- **Fine already:** the Options tab at 360 px; the Yeast card's strain box
  and information line at 375 px; the suggestion list opens past the table's
  sideways-scroll edge (searchable boxes far end).

## Sentences — what must be true afterwards

- **P1** On a phone (360–430 px wide) the page never scrolls sideways, and no box or figure is cut off at a card's edge.
- **P2** Side-by-side sections stack in one column on a phone: the Volumes card (Mash, then Boil, then Ferment), the Yeast card's strain and ale/lager, and Pitch & Starter. Labels read on one line and warnings span the card.
- **P3** The stats bar shows its six figures as two even rows of three; the starter note sits under the cells figure.
- **P4** Every malt, kettle-hop and dry-hop row shows all its boxes without sideways swiping.
- **P5** The header fits in tidy rows: the brand and Home/Pro on one, then Export, Import, Print and Reset as four equal buttons.
- **P6** The ingredient and strain suggestion lists open fully on screen, and a tap picks the tapped row.
- **P7** Desktop and the printed sheet look exactly as they do now, and no number anywhere changes.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| D1 | Below what screen width is the phone layout used? | 700 px | Covers every phone held upright; tablets and desktops keep today's layout. The Volumes card needs about 620 px before its labels fit on one line |
| D2 | What do the ingredient tables become on a phone? | Each ingredient becomes a small block: the name on top, its number boxes side by side beneath, then points or IBU and the remove button. Desktop keeps the table | Every figure visible without a hidden swipe |
| D3 | How are the four header buttons laid out? | Two rows of two, labels unchanged | "Reset to defaults" does not fit four across at 360 px, and there is no "More" menu to hide things in |
| D4 | Does the stats bar stay pinned to the top while scrolling on a phone? | Yes, compacted to two rows, from 149 px to about 100 px | It is pinned so the headline numbers stay in view while editing; smaller keeps that and gives the space back |
| D5 | How is it proven? | Suites pass, plus screenshots at 360, 375 and 414 px and at desktop width, plus a look on the owner's own phone after the deploy. No automated layout test | Tier C: suites pass, look at it |
| D6 | Order | Before the water port | The water screens then get built into a phone-ready layout instead of needing this work twice |
| D7 | Scope guard | Layout only. If the work needs to change anything that holds or computes a recipe number, it stops and goes back to the owner | The Tier C boundary |
| D8 | Deploys | One deploy (15 credits) | One item, one push |

Tier C: no inspector and no model rows (CLAUDE.md, change control and
Models). The builder is Opus at high effort by the standing default.

## Scenarios

None in the suite (D5): the suite has no DOM, and this item changes no
number. Proof is the far end below, with screenshots in the report. The
existing suites must pass unchanged — any test edit is outside this item.

## Far end — on the built app

1. At 360, 375 and 414 px: no sideways page scroll (page width equals screen
   width), and no box or figure past a card's edge, on Recipe and Options.
2. Volumes, Yeast and Pitch & Starter read in one column; each label on one
   line; the design warnings (mash water 3, fermentation 6) and the Yeast
   card's temperature warning span the card.
3. Stats bar: two rows of three, starter note under the cells figure, about
   100 px tall, still pinned while scrolling.
4. A malt, a kettle hop and a dry hop: every box visible and editable without
   a sideways swipe; add and remove still work; points and IBU shown.
5. Header: brand and Home/Pro on one row, then the four actions two by two.
6. The malt, hop and strain suggestion lists open fully on screen at 360 px;
   a tap picks the tapped row.
7. Desktop (1024 px and wider) and the print preview: identical to main by
   screenshot; every stat identical on a recipe saved by the live site.
8. After the deploy: the owner's own phone.

## Notes from the spec session, for the builder

- **Where layout lives.** `apps/recipe/src/index.css` says it owns only
  resets, the font and print rules ("Do not add component rules here"), and
  every component styles itself inline from `components/shared/styles.js`
  (SPEC rule 14). Inline styles cannot hold a media query, so the phone
  switch is most naturally one small shared piece under `components/shared/`
  that reports whether the screen is narrower than 700 px, read by the
  components that change. The builder's call; record it.
- **Files likely touched** (all Tier C): `components/Header.jsx`,
  `StatsBar.jsx`, `shared/StatBox.jsx`, `VolumesSection.jsx`,
  `YeastCard.jsx`, `YeastSection.jsx`, `GristTable.jsx`, `HopsSection.jsx`,
  `IngredientSearch.jsx` (only if P6 needs it), `shared/InputRow.jsx`,
  `shared/styles.js`. `App.jsx` holds the stats bar's sticky wrapper and the
  page padding; it is Tier B by path — touch it only for layout values, and
  say so (the hooks will run the suite).
- **Nothing numeric moves (P7, D7).** No change to `state.js`,
  `selectors.js`, `display.js`, `persistence.js` or the engine. Display
  precision stays as it is.
- **Print.** The print rules hide the app root; the sheet is portaled beside
  it. Nothing here should reach the sheet, but check print preview (far end 7).
- **The roadmap's Tier C "One warning style" line** (the Yeast card's
  warning reading the shared warning style) is not part of this item. Leave
  it on the roadmap, even though the Yeast card is touched here.
- **Owner-facing language:** screen widths in px, "phone", "desktop"; no
  component names in the report's narrative.

## Recorded failure (filled in by the builder)

No scenario (D5), so the failure is the far end measured on the unchanged
app (branch `phone-width` at `main` 4a83841, built and served locally, the
same app as the live site), in phone emulation at 360 × 780 px, Pro mode:

```
page width 386 px on a 360 px screen          (P1)
49 boxes or figures past a card's edge        (P1: 7 on Volumes with no scroll,
                                               the rest behind sideways swipes
                                               in Grist and Hops)
labels on 2–3 lines: Mash water (bbl) 66 px, Pre-boil volume, Boil-off rate,
  Boil time, Post-boil volume, Fermentation volume, Mash Rv 43 px   (P2)
stats bar 166 px, one row of six; the cells tile 5 lines tall       (P3)
header 212 px: four actions and two toggles in three ragged rows    (P5)
```

The headless live site at 360 px, taken again after the change for the
report: page width 386 px.

## Builder's notes — choices the sentences did not make (filled in by the builder)

1. **The phone switch.** One shared piece, `components/shared/usePhone.js`,
   reports whether the screen is narrower than 700 px (D1) through the
   browser's media query (`max-width: 699.98px`) and follows it when the
   width changes (a phone turned sideways). Components that lay out
   differently read it; with it false every component renders exactly what it
   rendered before, so desktop and tablets are untouched. Where nothing
   answers (no window), it is false.
2. **Pro's °P/SG toggle** (the sentences name only Home/Pro): on a phone it
   sits under Home/Pro at the right of the brand row, so the brand row stays
   one row and the actions stay four. Both toggles are a little narrower on a
   phone (0.7 rem side padding instead of 0.95) so Home/Pro fits beside the
   brand at 360 px, and the "Persyn Chemical Engineering" line may wrap to
   two lines under the wordmark (it does at 360 and 375 px, not at 414).
3. **Action order** on a phone follows P5: Export, Import / Print recipe,
   Reset to defaults — Reset moves from third to last. The labels are
   unchanged (D3). The buttons are a little taller on a phone (36 px) for a
   thumb.
4. **Header height.** The header is 181–183 px at 360 px in Home and 205 px in
   Pro (the gravity toggle adds a row beside the brand), against 166 px
   measured by the spec session. The header is not pinned — it scrolls away;
   the pinned part is the stats bar.
5. **Stats bar: 108 px, not 100.** Two even rows of three (OG, FG, ABV /
   SRM, IBU, cells). The gravity unit sits beside its label ("OG SG") to
   keep the top row two lines; the cells tile carries a third line, the
   starter note, which sets the bottom row's height. 100 px would need
   smaller type than the figures should have; D4 says "about 100". The bar's
   top and bottom padding lives in `App.jsx`, which is Tier B by path, and the
   commit-msg hook refuses any commit touching it without an inspector's PASS
   box — which this Tier C item does not have. So `App.jsx` is untouched: on a
   phone the stats grid carries a negative top and bottom margin
   (−0.35 rem) that takes the bar's 0.65 rem padding down to 0.3 rem.
6. **Ingredient blocks** (D2): one shared piece,
   `components/shared/IngredientBlock.jsx`, used by Grist and Hops. Each
   number box sits under its own label, the labels the table's headings
   (Weight (lb), FGDB (%), Color (°L); Time (min), Temp (°F), Wt, Alpha
   (%)). To keep one definition of every box, each row's boxes are now listed
   once in the component and rendered either into the table's cells or into
   the block — same boxes, same conversions, same handlers; the desktop table
   renders element for element as before. A dry hop has no points or IBU, so
   its last line holds only the remove button. Alternate blocks carry the
   table's alternate-row tint.
7. **Pitch & Starter.** Besides the character selector, the two tiles (pitch
   rate, cells needed) stack too: side by side, "Cells needed / billion
   cells" wraps. The starter table stays a table but loses its 340 px
   minimum, its fixed column widths and some cell padding and heading letter
   spacing on a phone, so the note column reads in three lines rather than
   six; no sideways scroll.
8. **Suggestion lists (P6):** nothing changed. The list already places
   itself inside the window, below the box or above it when the box is near
   the screen's foot; at 360 px all three lists open fully on screen and a
   tap picks the tapped row.
9. **Proof, and one limit of it.** The emulator never sends a width-change
   event (a plain resize listener stays silent too), so each width was
   loaded fresh; a real browser sends it. Desktop proof is byte-identical
   full-page screenshots of the live site and the branch (700, 1024, 1280,
   1440 px; print media at 360 and 1280 px) plus an element-by-element
   comparison. Phone screenshots used true device emulation over the Chrome
   DevTools protocol; plain headless Chrome keeps a window of about 500 px,
   which lays the page out too wide.
10. **For the owner's phone (far end 8):** the suggestion list places itself
    from the window's height; on a real phone the on-screen keyboard covers
    the lower part of the screen, which the emulator cannot show. Worth a
    look when searching a hop near the foot of the screen.
11. **Not touched:** `InputRow.jsx`, `IngredientSearch.jsx`, `styles.js`,
    `index.css`, the Options tab (its long labels wrap to two lines at 360
    and 375 px, as before — "fine already"), and the roadmap's "One warning
    style" line.
