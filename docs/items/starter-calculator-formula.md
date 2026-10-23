# Starter volumes from the calculator's own growth formula, fresh pack — Tier A (+ the References page)

Status: agreed 2026-10-23 ("agree to all", OQ-1 to OQ-6, M1, M2), not started.

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
| 1700 | 400B + 200B | 15.87 L | 14.69 L |
| 1710 | 400B + 200B | 16.84 L | none (OQ-4) |

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
  intended: 100B 390 → 400 (4.12 L → 1.84 L), 200B 690 → 700 (5.71 L →
  1.96 L), 400B 1,000 → 1,010 (3.93 L → 2.00 L).
- **SC-S3** For each pack, the app's starter for the calculator's own reading
  gives back the calculator's volume, within the calculator's rounding to whole
  billion cells.
- **SC-S4** Every count from 250 to 1,700 billion in steps of 10 has at least
  one option; 1,710 and above have none, and the app shows "No usable starter
  band" (today it answers through 1,710 and stops at 1,720).
- **SC-S5** Nothing else in the starter changes: which band serves which count,
  the extra-pack rules and their notes, the boundaries at 250, 400, 500, 700,
  800 and 1,000, 115 g of dry malt extract per litre, and the option list's
  order.
- **SC-S6** The reference recipe's starter (570 billion, 200B pack) is 3.10 L
  and 356 g of dry malt extract (3.09998 L × 115 = 356.498 g), in place of
  3.00 L and 345 g, everywhere the app and its tests hold it.
- **SC-S7** The References page's Starters section shows the growth formula,
  its constants, the step at 200 million cells per mL and its source (the
  Brewer's Friend notes, C. White's data, MoreBeer's calculator), in place of
  the quadratic, the a, b, c columns of the band table, and the line "A
  quadratic fit to the output of MoreBeer's yeast starter calculator, by
  Persyn Chemical Engineering".
- **SC-S8** `SPEC.md` rule 2 records that the starter follows the calculator's
  published formula at 100 % viability, in place of Rev 4's Starter Vol Solver
  curves, with the owner's decision and its date.

## Decisions — agreed 2026-10-23

| id | Question | Recommended | Rule |
|---|---|---|---|
| OQ-1 | Viability the starter is sized for | 100 %, a fresh pack, for all three packs at once; the about 3 % that Rev 4's 97 % readings hid is not carried over (decided by the owner 2026-10-23) | Current packaging holds about 98–99 % for the first two months; viability is a separate setting if ever wanted |
| OQ-2 | How the volume is worked out | The formula Brewer's Friend publishes, which reproduces the calculator: one formula for all three packs, solved directly; the three fitted curves are retired | It reproduces all 42 readings within the calculator's rounding; a fit only approximates them, and a fit to four points is what produced the 2.774 L |
| OQ-3 | The step at 200 million cells per mL | Never smaller than pack ÷ 200 L; up to 2.1002× growth gets that volume (400B: 800–840 billion → 2.00 L; 200B: 400–420 → 1.00 L) | Below it the pack already saturates the starter and the calculator gives one doubling at any size; the smooth formula meets the step at 2.1002×, so the volume is continuous. The calculator's own step sits at exactly 2.00 L (2.00 L gives 800, 2.01 L gives 841), so for 801–840 the app's 2.00 L is 0.01 L short of where the calculator starts the extra growth |
| OQ-4 | Top of the range | A new cap: answers through 1,700 billion; 1,710 and above get "No usable starter band" | The formula never runs out (7× at about 80 L for a 400B pack). 1,700 is where the 400B item's sentence asked for answers to reach (it set a floor, not a ceiling); a 14.7 L single-step starter is the practical end. Today's answer at 1,710 (16.84 L) goes |
| OQ-5 | The reference recipe's figure | Re-pinned to 3.10 L and 356 g, with the working beside it, everywhere it is held (Files) | The owner's correction, as the engine corrections were re-pinned (EC-Q7); tolerances unchanged (SPEC rule 4) |
| OQ-6 | The workbook | The owner updates Rev 4's Starter Vol Solver to the formula (it needs no Goal Seek); the engine follows the formula either way, and `SPEC.md` rule 2 records the departure | SPEC rule 2 stays true |
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
| 1,700 | OQ-4 | Scenario 5 |
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
   200B 1,382 (N 1,182) → 7. Half a billion cells moves the volume by at most
   0.016 L across these readings; the builder states the tolerance from that.
2. *910 billion → the 400B pack, 2.757 L, 317 g* (SC-S1), the hand pin.
3. *a starter needing up to 2.1× growth gets the step volume* (SC-S2): 400 →
   200B, 1.00 L; 800 and 830 → 400B, 2.00 L; 1,010 → 400B + 200B, 2.00 L;
   850 → about 2.10 L, larger than 2.00; and within each of a band's ranges,
   every count in steps of 10 gives a volume no smaller than the count before
   it.
4. *the reference recipe's starter is 3.10 L and 356 g* (SC-S6), rewriting the
   570B test, the hand pin.
5. *every count from 250 to 1,700 has an option; 1,710 and above have none*
   (SC-S4), rewriting the 250–1,700 test and the 2,000 test.

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

## Builder's notes (filled in by the builder)
