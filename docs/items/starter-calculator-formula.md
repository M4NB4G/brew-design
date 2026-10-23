# Starter volumes from the calculator's own growth formula, fresh pack — Tier A (+ the References page)

Status: agreed 2026-10-23 ("agree to all", OQ-1 to OQ-6, M1, M2); landed 2026-10-23 as "The starter is sized on a fresh pack by the calculator's own growth formula, and no starter is larger than 5 L" (inspector PASS after one FAIL round).
Amended 2026-10-23 while building ("agree to all", SL-1 to SL-5): no starter
is larger than 5 L; OQ-4's top at 1,700 is replaced by SL-3's at 1,270, and
the 200B pack takes its extra pack from 670 (SL-2). SC-S2, SC-S4 and SC-S5
are amended, SC-S9 is added, and scenarios 1, 3 and 5 follow; scenario 6 is
new.

## Why

On 2026-10-23 the owner's West Coast Pils workbook gave 2.774 L for a starter
at 910 billion cells, and the app gave 2.60 L. Tracing the difference:

- The app's three starter curves (`packages/engine/src/starter.js`) are Rev 4's
  Starter Vol Solver curves: quadratics fitted to readings from MoreBeer's
  yeast starter calculator (CaptainBrew's widget), C. White stir plate.
- Rev 4's readings were all taken with a **97 %-viable** pack (388 billion
  viable cells for the 400B pack, 194 for the 200B, 97 for the 100B). Re-read on
  2026-10-23 at 97 %, every Rev 4 reading comes back within 0.006×
  (100B: 2.53, 3.11, 3.54, 3.9 at 1–4 L; 200B: 2.12, 2.53, 2.85, 3.11, 3.34 at
  1–5 L; 400B: 2.35, 2.53, 2.698 at 3–5 L).
- The solver divides cells needed by the full pack (100, 200, 400 billion), so
  it applies 97 % growth to a 100 % count: every band recommends too small a
  starter.
- The WC Pils copy mixed one 97 % reading (2.1× at 2 L) with 100 % readings at
  3–5 L, which is where its 2.774 L came from.

The owner's decision (2026-10-23): the starter is sized for a **fresh pack at
100 % viability**. Current labs' packaging holds close to 100 % for the first
months (White Labs' PurePitch table: 99.2 % at 1 month, 98.1 % at 2), and
viability, if ever modelled, is a separate setting, not something hidden in a
curve.

### What the calculator does

The calculator's growth depends only on the inoculation rate, r = pack cells ÷
starter volume (billion cells per litre = million cells per mL). Brewer's
Friend publishes a formula, fitted to C. White's data, that reproduces the
calculator (its calculator notes, read word for word 2026-10-23):

    "G = (12.54793776 * x^-0.4594858324) - 0.9994994906", x the inoculation rate (B/L)
    stir plate: "+1.0 boost to growth factor"   (shaking +0.5; none, no adjustment)
    "The maximum growth factor is 6"
    "The saturation point for a starter is 200 million cells/ml (the starter
     not grow at that inoculation rate)" — with the stir-plate boost, the
     calculator returns exactly one doubling there (g = 1)
    "The growth curve is geared for a starter gravity of 1.036 (9 °P)"
    cells after the starter = pack × (1 + g)

The same notes say the stir-plate and shaking boosts are anecdotal ("The
initial study did not address stir plates or shaking methods"). Rev 4's curves
were read from the same calculator on the same setting, so they rested on the
same boost.

Checked 2026-10-23 against 42 readings of the calculator at 100 % viability (the
100B, 200B and 400B packs at 0.5–8 L, stir plate, C. White): every reading
reproduced within 0.5 billion cells, which is the calculator's rounding to whole
billions. Starter gravity (1.037 or 1.040) does not change the calculator's
answer.

Readings (pack, litres → billion cells), the independent pins for the tests:

| Pack | 0.5 | 1 | 1.5 | 2 | 2.5 | 3 | 3.5 | 4 | 4.5 | 5 | 5.5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 100B | 200 | 251 | 282 | 308 | 330 | 351 | 369 | 386 | 402 | 417 | 431 | 445 | 470 | 493 |
| 200B | 400 | 400 | 465 | 503 | 535 | 564 | 591 | 616 | 639 | 661 | 681 | 701 | 738 | 772 |
| 400B | 800 | 800 | 800 | 800 | 888 | 930 | 969 | 1005 | 1039 | 1070 | 1100 | 1129 | 1182 | 1232 |

The step: 400B at 2.00 L gives 800; at 2.01 L, 841. The formula, run smoothly
through r = 200, gives 2.1002× there.

### Today against the proposal (the probe, 2026-10-23)

| Cells needed | Pack | Today (Rev 4) | Proposed |
|---|---|---|---|
| 250 | 100B | 0.95 L | 0.98 L |
| 350 | 100B | 2.87 L | 2.99 L |
| 400 | 200B | 0.71 L | 1.00 L (step) |
| 450 | 200B | 1.30 L | 1.32 L |
| 570 (reference recipe) | 200B | 3.00 L, 345 g | 3.10 L, 356 g |
| 650 | 200B | 4.57 L | 4.75 L |
| 800 | 400B | 1.22 L | 2.00 L (step) |
| 850 | 400B | 1.83 L | 2.10 L |
| 910 | 400B | 2.60 L, 299 g | 2.76 L, 317 g |
| 1000 | 400B | 3.83 L | 3.93 L |
| 1010 | 400B + 200B | 1.34 L | 2.00 L (step) |
| 1500 | 400B + 200B | 9.00 L | 9.49 L |
| 1700 | 400B + 200B | 15.87 L | 14.69 L (none since SL-3) |
| 1710 | 400B + 200B | 16.84 L | none (OQ-4) |

Since SL-1 to SL-3 (amended 2026-10-23): 660 → 200B, 4.98 L; 670 → 200B with
an extra 200B pack, 1.56 L (was 5.22 L from the pack alone); 1,270 → 400B +
200B, 4.99 L; 1,280 and above → none (would be 5.16 L).

## Sentences — what must be true afterwards

- **SC-S1** Above the step (SC-S2), the starter for a pack is the volume at
  which the calculator's stir-plate growth formula, run smoothly (without its
  saturation clause), on the full pack (100 % viable), reaches the cells the
  starter must reach: N = pack × (1 + g(pack ÷ V)), g(r) = 12.54793776 ×
  r^−0.4594858324 − 0.9994994906 + 1.0, solved for V directly, with no fitted
  curve.
- **SC-S2** The starter is never smaller than the step volume, pack ÷ 200 L
  (0.5 L for 100B, 1 L for 200B, 2 L for 400B): a starter needing up to
  2.1002× growth gets the step volume; above that, SC-S1's volume. Within each
  of a band's ranges (the pack alone, or with the extra pack) the figure never
  falls as the cells needed rise. It falls where the extra pack starts, as
  intended: 100B 390 → 400 (4.12 L → 1.84 L), 200B 660 → 670 (4.98 L →
  1.56 L; amended by SL-2, was 690 → 700), 400B 1,000 → 1,010 (3.93 L →
  2.00 L).
- **SC-S3** For each pack, the app's starter for the calculator's own reading
  gives back the calculator's volume, within the calculator's rounding to whole
  billion cells.
- **SC-S4** Every count from 250 to 1,270 billion in steps of 10 has at least
  one option; 1,280 and above have none, and the app shows "No usable starter
  band" (today it answers through 1,710 and stops at 1,720). (Amended by
  SL-3: was 1,700 and 1,710.)
- **SC-S5** Nothing else in the starter changes: which band serves which count,
  the extra-pack rules and their notes, the boundaries at 250, 400, 500, 800
  and 1,000, 115 g of dry malt extract per litre, and the option list's
  order. (Amended by SL-2: the 200B pack's boundary at 700 moves to 670.)
- **SC-S6** The reference recipe's starter (570 billion, 200B pack) is 3.10 L
  and 356 g of dry malt extract (3.09998 L × 115 = 356.498 g), in place of
  3.00 L and 345 g, everywhere the app and its tests hold it.
- **SC-S7** The References page's Starters section shows the growth formula,
  its constants, the step at 200 million cells per mL and its source (the
  Brewer's Friend notes, C. White's data, MoreBeer's calculator), in place of
  the quadratic, the a, b, c columns of the band table, and the line "A
  quadratic fit to the output of MoreBeer's yeast starter calculator, by
  Persyn Chemical Engineering".
- **SC-S9** No starter the app offers is larger than 5 L (SL-1): the 200B pack
  alone serves 400 to below 670 billion and with its extra 200B pack 670 to
  below 800 (SL-2); the 400B pack with its extra 200B pack serves above 1,000
  through 1,270 (SL-3). The References page shows these limits.
- **SC-S8** `SPEC.md` rule 2 records that the starter follows the calculator's
  published formula at 100 % viability, in place of Rev 4's Starter Vol Solver
  curves, with the owner's decision and its date.

## Decisions — agreed 2026-10-23

| id | Question | Recommended | Rule |
|---|---|---|---|
| OQ-1 | Viability the starter is sized for | 100 %, a fresh pack, for all three packs at once; the about 3 % that Rev 4's 97 % readings hid is not carried over (decided by the owner 2026-10-23) | Current packaging holds about 98–99 % for the first two months; viability is a separate setting if ever wanted |
| OQ-2 | How the volume is worked out | The formula Brewer's Friend publishes, which reproduces the calculator: one formula for all three packs, solved directly; the three fitted curves are retired | It reproduces all 42 readings within the calculator's rounding; a fit only approximates them, and a fit to four points is what produced the 2.774 L |
| OQ-3 | The step at 200 million cells per mL | Never smaller than pack ÷ 200 L; up to 2.1002× growth gets that volume (400B: 800–840 billion → 2.00 L; 200B: 400–420 → 1.00 L) | Below it the pack already saturates the starter and the calculator gives one doubling at any size; the smooth formula meets the step at 2.1002×, so the volume is continuous. The calculator's own step sits at exactly 2.00 L (2.00 L gives 800, 2.01 L gives 841), so for 801–840 the app's 2.00 L is 0.01 L short of where the calculator starts the extra growth |
| OQ-4 | Top of the range (**replaced by SL-3**, 2026-10-23) | A new cap: answers through 1,700 billion; 1,710 and above get "No usable starter band" | The formula never runs out (7× at about 80 L for a 400B pack). 1,700 is where the 400B item's sentence asked for answers to reach (it set a floor, not a ceiling); a 14.7 L single-step starter is the practical end. Today's answer at 1,710 (16.84 L) goes |
| OQ-5 | The reference recipe's figure | Re-pinned to 3.10 L and 356 g, with the working beside it, everywhere it is held (Files) | The owner's correction, as the engine corrections were re-pinned (EC-Q7); tolerances unchanged (SPEC rule 4) |
| OQ-6 | The workbook | The owner updates Rev 4's Starter Vol Solver to the formula (it needs no Goal Seek); the engine follows the formula either way, and `SPEC.md` rule 2 records the departure | SPEC rule 2 stays true |
| SL-1 | Largest starter the app offers (amended 2026-10-23) | 5 L; nothing larger is offered | Homebrewers rarely go past a 5 L flask, and the app is not built for professional brewers (the owner, 2026-10-23) |
| SL-2 | The hole at 670–690 billion, where the 200B pack alone needs more than 5 L | The 200B pack takes its extra 200B pack from 670 billion instead of 700 (670 → 1.56 L, 690 → 1.82 L) | No count inside the range is left without a starter; the extra pack starts at the first count (in tens) where the pack alone would pass 5 L: 660 → 4.98 L, 670 → 5.22 L |
| SL-3 | Top of the range | 1,270 billion (400B + 200B, 4.99 L) instead of 1,700; from 1,280 up "No usable starter band" | 1,280 would need 5.16 L |
| SL-4 | What the brewer sees above 1,270 | Today's message; a roadmap line (Tier C) for a message saying what to do instead | Keeps this item to the starter figures and the References page |
| SL-5 | How it lands | In this item and its one commit: OQ-4 replaced, sentences amended, the step and range tests and the References page's limits follow; far end re-checked | Nothing was committed yet |
| M1 | Builder's model | Opus, high effort | CLAUDE.md, Models: Tier A |
| M2 | Inspector's model | Opus, default effort | CLAUDE.md, Models: Tier A |
| SP | Silent properties | Nothing saved changes: the starter is worked out every time, never stored. A printed sheet from before shows the old figures. The formula is fitted for a starter near 1.036; the app's 115 g/L is unchanged and the calculator ignores gravity. The stir-plate boost is anecdotal in the source, as it was for Rev 4's curves. Multi-tab, ordering, durability, schema: not touched | Named so they are checked, not discovered |

## Numbers

| Number | Rule | Pin |
|---|---|---|
| 12.54793776, 0.4594858324, 0.9994994906 | Brewer's Friend's published C. White fit, which reproduces the calculator (Sources) | The readings table (SC-S3), independent of the code; the hand pins below |
| 1.0 | Stir-plate boost, same source | Same |
| 200 | Saturation, million cells per mL, same source; the calculator's step | 400B at 2.00 L → 800, at 2.01 L → 841 (readings); scenario 3 |
| 6 | Growth cap, same source | Never reached through 1,700 (largest growth factor needed 2.775); the builder states this in a comment, no pin |
| 1,700 | OQ-4 (replaced by SL-3) | — |
| 5 | SL-1, litres, the owner's | Scenario 6: every option from 250 to 1,270 is at most 5 L |
| 670 | SL-2, derived from 5 L: 200B alone at 660 → 4.98 L, at 670 → 5.22 L (hand, from the formula) | Scenarios 5 and 6 |
| 1,270 | SL-3, derived from 5 L: 400B + 200B at 1,270 → 4.99 L, at 1,280 → 5.16 L | Scenarios 5 and 6 |
| 115 | Unchanged | Unchanged |

Hand pins, the working written beside each in the test (the builder carries
the working to the digits the test asserts):

- 910 billion (scenario 2): N ÷ pack = 910 ÷ 400 = 2.275, so g = 1.275; the
  no-aeration part is 1.275 − 1.0 = 0.275; 0.275 + 0.9994994906 =
  1.2744994906; ÷ 12.54793776 = 0.1015703…; r = 0.1015703^(−1 ÷
  0.4594858324) = 145.08… million cells per mL; V = 400 ÷ 145.08 = 2.757 L;
  dry malt extract 2.757 × 115 = 317 g.
- 570 billion (scenario 4, the golden master): 570 ÷ 200 = 2.85, g = 1.85;
  0.85 + 0.9994994906 = 1.8494994906; ÷ 12.54793776 = 0.147394…; r =
  0.147394^(−1 ÷ 0.4594858324) = 64.517 million cells per mL; V = 200 ÷
  64.517 = 3.09998 L; 3.09998 × 115 = 356.498 g, shown as 356.

## Scenarios — written first, must fail before

`packages/engine/test/starter.test.js`, named after the sentences:

1. *each pack's starter for the calculator's own reading gives back the
   calculator's volume* (SC-S3): 100B 251 → 1 L, 308 → 2, 351 → 3, 386 → 4;
   200B 465 → 1.5 (the 200B option; 465 also has a 100B option), 503 → 2,
   564 → 3, 616 → 4, 661 → 5; 400B 888 → 2.5, 930 → 3, 969 → 3.5; 400B +
   200B 1,382 (N 1,182) → 7 (amended by SL-3, now beyond the range: 1,205 (N
   1,005) → 4 and 1,270 (N 1,070) → 5). Half a billion cells moves the volume
   by at most 0.016 L across these readings; the builder states the tolerance
   from that.
2. *910 billion → the 400B pack, 2.757 L, 317 g* (SC-S1), the hand pin.
3. *a starter needing up to 2.1× growth gets the step volume* (SC-S2): 400 →
   200B, 1.00 L; 800 and 830 → 400B, 2.00 L; 1,010 → 400B + 200B, 2.00 L;
   850 → about 2.10 L, larger than 2.00; and within each of a band's ranges,
   every count in steps of 10 gives a volume no smaller than the count before
   it (the 200B ranges 400–660 and 670–790, the 400B extra-pack range
   1,010–1,270, since SL-2 and SL-3).
4. *the reference recipe's starter is 3.10 L and 356 g* (SC-S6), rewriting the
   570B test, the hand pin.
5. *every count from 250 to 1,270 has an option; 1,280 and above have none*
   (SC-S4, amended by SL-3), rewriting the 250–1,700 test and the 2,000 test.
6. *no starter is larger than 5 L* (SC-S9, SL-1 and SL-2): every option for
   every count from 250 to 1,270 in steps of 10 is at most 5 L; 660 → the
   200B pack alone, 4.98 L; 670 and 690 → the 200B pack with an extra 200B
   pack, 1.56 L and 1.82 L, hand pins.

Rewritten, not new (SC-S6 and SC-S7): the golden master's 570B block; the
900B test's 2.47 L becomes 2.64 L; `smoke.test.js` (first starter option);
`yeast-card.test.js` (the starter's volume); `print-sheet-legibility.test.js`
(the starter row "200B, 3.00, 345" and its snapshot line); the snapshot
`water-section-page-break.before.json` (a 100B row at 4.01 L); and
`notes-page.test.js`, which checks the References page's Starters section
against the engine through the quadratic and its source line. Unchanged and
must still pass: every band selection and extra-pack test (SC-S5), and
`engine-comment-sources.test.js`, which reads the starter file's comments.

## Files and tier

Tier A: `packages/engine/src/starter.js` (the bands keep their pack, ranges and
notes; the curves give way to the formula and the step), with
`packages/engine/test/starter.test.js` and
`packages/engine/test/golden-master.test.js`.
`apps/recipe/src/components/ReferencesPage.jsx` (the Starters section, its
source line and its copy of the starter coefficients). The app tests and the
snapshot named under Scenarios. `SPEC.md` rule 2; `docs/TEST_COVERAGE.md`
(row 2's description of the golden master as Rev 4's cached cells and of the
starter, the starter rows and the totals); `docs/ROADMAP.md` (its Sessions
row); this file.

## Far end

The running app: the reference recipe's Yeast card reads 3.10 L and 356 g;
counts of 910 (2.76 L), 800 (2.00 L) and 1,700 (14.69 L) on the Yeast card; the
printed sheet's starter row; the References page's Starters section.

## Sources

- Brewer's Friend, Yeast Pitch Rate and Starter Calculator, notes on the C.
  White model: https://brewersfriend.com/yeast-pitch-rate-and-starter-calculator
- MoreBeer's calculator (CaptainBrew widget):
  https://morebeer.com/pages/yeast-pitch-calculator, read 2026-10-23
- White, C., & Zainasheff, J. (2010). *Yeast: The Practical Guide to Beer
  Fermentation*. Brewers Publications.
- White Labs PurePitch viability by age, as Brewfather reproduces it:
  https://docs.brewfather.app/tools/yeast-calculator

## Recorded failure (filled in by the builder)

Run alone against the unchanged engine, 2026-10-23
(`npx vitest run test/starter.test.js test/golden-master.test.js` in
`packages/engine`), trimmed:

```
× the reference recipe's starter is 3.10 L and 356 g
  → expected 3.000000000000001 to be close to 3.09998, received difference is 0.09997999999999907
× 900B -> the 400B band alone, N = 900
  → expected 2.4713797641011324 to be close to 2.64, received difference is 0.16862023589886777
× every count from 250 to 1,700 has an option; 1,710 and above have none
  → cells=1710: expected [ { band: '400B', …(5) } ] to deeply equal []
× each pack's starter for the calculator's own reading gives back the calculator's volume
  → 100B at 251: 0.9613604456122461 L: expected 0.038639554387753905 to be less than or equal to 0.016
× 910 billion -> the 400B pack, 2.757 L, 317 g
  → expected 2.6018869044153528 to be close to 2.757, received difference is 0.15511309558464736
× a starter needing up to 2.1x growth gets the step volume
  → expected 0.7075038391546866 to be close to 1, received difference is 0.2924961608453134
× starter golden master (cellsNeeded 570) > volumeL ~ 3.10 (Rev 4: 3.00)
  → expected 3.000000000000001 to be close to 3.09998, received difference is 0.09997999999999907
× starter golden master (cellsNeeded 570) > dmeGrams ~ 356.5 (Rev 4: 345.0)
  → expected 345.0000000000001 to be close to 356.498, received difference is 11.497999999999877
```

After the amendment (SL-1 to SL-5), the scenarios run alone against main's
engine (`packages/engine/src/starter.js` as on main), 2026-10-23, trimmed;
the five above fail as before, and the amended and new ones:

```
× every count from 250 to 1,270 has an option; 1,280 and above have none
  → cells=1280: expected [ { band: '400B', …(5) } ] to deeply equal []
× each pack's starter for the calculator's own reading gives back the calculator's volume
  → 100B at 251: 0.9613604456122461 L: expected 0.038639554387753905 to be less than or equal to 0.016
× a starter needing up to 2.1x growth gets the step volume
  → expected 0.7075038391546866 to be close to 1, received difference is 0.2924961608453134
× no starter is larger than 5 L
  → 200B at 670: expected 5.0892243377664625 to be less than or equal to 5
```

## Builder's notes (filled in by the builder)

Claims for the inspector to verify:

- **The step and the cap.** The volume is the larger of pack ÷ 200 L and the
  formula's volume; no 2.1002 threshold is written. The cap is written as
  "the 400B band serves the extra-pack range only through 1,270", so a blank
  count (NaN) still has no option, as before (the old curve dropped it only
  by its root filter); scenario 5 now checks that.
- **The growth cap of 6** is named in a comment and not applied. The item's
  Numbers table says the largest growth needed through 1,700 is 2.775; by
  hand it is under 3 (the multiple N ÷ S stays below 4 in every range: the
  100B pack just under 400, 3.99; at counts in tens, 3.9 at 390 and 490;
  1,700 gives 3.75). Either way it never reaches 6, and no figure depends
  on it.
- **FLAG** at the step for 400B counts of 801–840 (OQ-3): the calculator's own
  step is at exactly 2.00 L, so the app's 2.00 L is 0.01 L short of where the
  calculator starts the extra growth; scenario 3's 830 → 2.00 L is that.
- **SC-S3's tolerance** is 0.016 L: half a billion cells (the calculator's
  rounding) moves the volume by at most 0.0152 L across the 13 readings
  (100B at 386). Worked in a separate Node script from the published
  formula, not from the engine.
- **The 5 L limit (SL-1 to SL-3)** is written as two count limits, 670 (the
  200B pack alone below it) and 1,270 (the top), each the last count in tens
  whose starter is at most 5 L, worked by hand in scenarios 5 and 6 (1,270
  → 4.9939 L asserted, 1,280 → 5.1576 L in its comment; 660 → 4.9796 L, 670
  → 5.2183 L alone in its comment and 1.5612 L with the extra pack).
- **Inspection round 1 (FAIL)**: fixed the coverage table's stale counts and
  pins, the hand working for 1,270 and 1,280 and for 670 alone, the engine
  header's claim that every limit is the spreadsheet's, and two stale "700"
  comments in the 450B and 500B tests. A `// FLAG:`
  says the 200B limit is set on counts in tens, as the app's cells needed
  always is: 661–669, which the app never asks for, would need 5.00–5.19 L
  from the pack alone. The calculator's reading 661 → 5 L (scenario 1) is one
  of them, 5.003 L.
- **The References page** shows the stir-plate boost as its own symbol,
  g_stir, defined as "growth a stir plate adds, 1": the page's check that
  every figure on it is a written coefficient reads "1", not "1.0". The
  200B ranges read "400 ≤ C < 670" and "670 ≤ C < 800", and the 400B
  extra-pack range "1000 < C ≤ 1270" (SC-S4, SC-S9); a line under them says
  "No starter is larger than 5 L; the limits keep every starter within it.",
  its 5 a written coefficient. The band table keeps Band and S only. The
  page's test checks the engine's volume against the page's formula and step
  at 27 counts, the step (400, 800, 830, 1,010), the 200B limit (660, 669,
  670) and the top (1,270, 1,271, 1,280, 1,700) among them, and that every
  option at a count in tens is at most the page's 5 L.
- **SPEC rule 2** records the departure, its formula and constants, and that
  the golden master and the smoke test pin the starter by hand from the
  formula, Rev 4's figure beside each; read with rule 12 (the smoke test's
  pins change only when what the engine reproduces does) and the preamble.
- **Files outside the item's list:** `page-error.before.json` and
  `error-outside-the-tabs.before.json` (the References page's digest only,
  re-captured; the "nothing else changes" tests in `page-error`,
  `error-outside-the-tabs` and `way-out-of-page-error` read them; on the
  unchanged code `page-error`'s passed against its stored digest), the
  comment in `water-section-page-break.test.js` naming the hand edit of
  its capture (390 billion, 100B: 4.01 L → 4.12, 462 g → 474), and the
  roadmap's two noticed lines.
- **Time limit (T-1, its own commit before this one):** under Vitest 4 (the
  lockfile since 2026-10-15; this clone ran 3.2.7 until `npm ci` here) the
  app's on-screen tests ran past Vitest's 5-second limit on this computer, so
  `npm test` failed by time-outs alone, on `main` too; the owner agreed a
  2-minute limit (2026-10-23), committed alone ahead of this item.
- **To the roadmap:** `npm audit` reports one high advisory (Vite
  7.0.0–7.3.6), Tier D; what the brewer sees above 1,270 (SL-4), Tier C; and
  yeast propagation in Pro (the owner's request, 2026-10-23), Tier A.
- **Far end**, the built app in the browser, 2026-10-23: 570 billion → 200B,
  3.10 L, 356 g (Yeast card, stats bar "Starter 3.10 L", printed sheet's row
  "200B 3.10 356"); 910 → 400B, 2.76 L, 317 g; 800 → 400B, 2.00 L, 230 g;
  1,700 → 400B, 14.69 L, 1,690 g, "400B starter plus one extra 200B pack";
  1,710 and 1,720 → "No usable starter band for this cell count."; the
  References page's Starters section shows the formula, its constants, the
  step and the Brewer's Friend source. (Before the amendment; re-checked
  after it below.)
- **Far end after the amendment**, the rebuilt app in the browser,
  2026-10-23: 570 → 200B, 3.10 L, 356 g; 660 → 200B, 4.98 L, 573 g; 670 →
  200B, 1.56 L, 180 g, "200B starter plus one extra 200B pack"; 1,270 →
  400B, 4.99 L, 574 g, "400B starter plus one extra 200B pack"; 1,280 and
  1,290 → "No usable starter band for this cell count."; the References
  page's Bands read 400 ≤ C < 670, 670 ≤ C < 800 and 1000 < C ≤ 1270, with
  "No starter is larger than 5 L; the limits keep every starter within it."
