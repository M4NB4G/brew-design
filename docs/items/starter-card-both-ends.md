# The starter card always says what to do, Tier A

Status: agreed 2026-11-10; landed 2026-11-10 as "The starter card always says what to do". Written by the planning session of
the run "wrong-on-first-use"; batch 1, item 2 (docs/ROADMAP.md, Sessions).
It takes the roadmap's Tier C line "What the brewer sees above the largest
starter" with it.

## Why

A new visitor's first recipe, the built-in one, needs 210 billion cells, and
the Yeast card reads "No usable starter band for this cell count", because
no band serves below 250 billion (`packages/engine/src/starter.js`). Most
5 gal ales of ordinary strength land there. At the other end, above 1,270
billion, the card says the same and no more (SL-4, 2026-10-23). The growth
formula already answers below 250: one 100B pack in 0.50 L, the
calculator's smallest starter for it, reaches 210 billion (read-through,
2026-11-10).

## Sentences: what must be true afterwards

- **SB-S1** At or below 100 billion cells the card offers "One 100B pack, no starter".
- **SB-S2** At or below 200 billion cells the card offers "One 200B pack, no starter".
- **SB-S3** Above 100 and below 250 billion cells the card offers one 100B pack in a starter sized by the same growth formula as every other option, never below the calculator's smallest starter for the pack (0.50 L): 0.50 L through 210 billion, then rising to meet today's 0.98 L at 250.
- **SB-S4** From 250 billion cells up every option is as today.
- **SB-S5** Above 1,270 billion cells the card and the printed sheet read: "No single starter of 5 L or less reaches this count. Pitch more packs, or build the starter in steps."
- **SB-S6** The built-in recipe, at 210 billion cells, shows one 100B pack in 0.50 L with 58 g of extract (57.5 g before the card's whole-gram precision).
- **SB-S7** A pack needs no starter only when it holds at least the cells needed: nothing is rounded in the brewer's favour.

## Decisions: agreed 2026-11-10

| id | Question | Decision | Rule |
|---|---|---|---|
| S-1 | Below 250 billion: the rule or only the wording? | The rule changes | Wording alone gives the first visitor no starter size |
| S-2 | The rule below 250 | The owner (2026-11-10): Wyeast still makes 100B packs, he does not use them; "have both a starter with 100b pack and a 'no starter needed for 200B pack' note or something. Open to ideas for simplicity." Settled by the planning session as SB-S1 to SB-S3 and SB-S7; the summary puts it in front of the owner before he merges | The same formula and its 0.50 L floor; no new constant. A pack holds what its name says |
| S-3 | Wording above 1,270 billion | SB-S5's sentence | SL-4: the wording is the owner's |
| S-4 | The built-in recipe's pinned starter changes from none to 0.50 L | Accepted; the old result kept beside the new in the test | SPEC rule 12 |
| M1 | Builder model | Opus 5.5, high effort | CLAUDE.md, Models |
| M2 | Inspector model | Opus 5.5, default effort, a fresh session | CLAUDE.md, Models |
| K | Silent properties | **Saved data:** none; the starter is worked out, never saved. **Counts between the tens:** the app's cells needed is always a multiple of 10, but the rule is stated for every count so no gap opens (100 and below; above 100 and below 250). **A blank cell count:** as today. **Pro:** a batch in thousands of billions shows SB-S5's sentence. **Ordering, multi-tab, storage:** not touched | Named so they are checked, not discovered |
| S-6a | The built-in recipe's extract as the card shows it | 58 g, the 57.5 g at the card's whole-gram precision (the owner, 2026-11-10: "yes"), asked after the inspector's re-inspection; SB-S6 reads so | Every starter option already shows extract in whole grams; no display precision changes |

SB-S6 corrected 2026-11-10 after the inspector's first round: the item file had written the unrounded 57.5 g where the table the owner agreed said 58 g; the correction was put to the owner as S-6a and agreed ("yes", 2026-11-10); no display precision changes.

## Scenarios: to be written first, must fail before

Engine: *below 250 billion cells the 100B pack serves, and a pack that
holds the count needs no starter* (80, 100, 110, 200, 210, 220, 240 and 250
billion). The starter volumes at 220, 230 and 240 billion are pinned by
hand from the formula, the working beside each in the test, as the golden
master pins the others; a figure copied from the code's output does not pin
it. For orientation only, not as pins: about 0.60, 0.72 and 0.85 L.

App: *the Yeast card and the printed sheet say what to do at 210 billion
and above 1,270 billion* (through `computeRecipe`; the built-in recipe; a
Pro batch).

## Notes for the builder

- This is a second departure from Rev 4's starter rule (its 100B band
  starts at 250); SPEC rule 2 records it beside the first, the owner's
  decision of 2026-11-10.
- No app file writes 100, 200, 250 or 1,270: the card and the sheet show
  what the engine returns. How the engine hands back a no-starter option
  and the top of the range is the builder's choice; say which in the notes.
- The card's and the sheet's old sentence, "No usable starter band for this
  cell count", stays only where the cell count itself is blank.
- The References page's starter text follows the rule (it names the bands).
- `docs/TEST_COVERAGE.md` gains a row per scenario; the roadmap's Tier C
  line is removed.
- Far end: the built app in a browser on a fresh visit (no saved recipe),
  Home and Pro, and the printed sheet.

## Builder's notes

Built 2026-11-10 (Opus 5.5, high effort). Choices the sentences did not make:

- **How the engine hands back a pack with no starter.** As an option like
  any other, in its band's place in the list: volume 0 L, extract 0 g, and
  its note naming the pack — "One 100B pack, no starter", "One 200B pack, no
  starter" — written in the engine beside its other pack notes, so no app
  file writes 100 or 200. The card and the sheet show it as "100B · 0.00 ·
  0 · One 100B pack, no starter". The test is the pack's own size: at or
  below it, no starter (SB-S7; 100.5 gets a starter, 199.9 takes the 200B
  pack with none, 200.1 offers no 200B pack). Only the 100B and 200B packs
  get a no-starter option; the 400B band is as before (SB-S4).
- **Above 100 and below 250** the 100B band's existing rule, N = C, now runs
  from above 100 to below 400; the volume is the existing formula and its
  existing floor, pack ÷ 200 = 0.50 L. No new constant.
- **How the engine hands back the top of the range.** A new engine function,
  `starterAboveRange(cells)`, true above the existing top (1,270), false
  through it and for a blank count. `selectors.js` calls it and the derived
  figures carry it as `starterAboveRange`; the printed sheet's data carries
  it only when true (as the hops' `totalFromKettle`). The card and the sheet
  show SB-S5's sentence when it is true, and the old sentence otherwise when
  there is no option — which, every finite count through 1,270 having an
  option, is only a blank count.
- **SB-S6's 58 g** (as corrected after the first round, below): the engine's
  figure is 57.5 g (0.50 × 115); the card and the sheet show extract in
  whole grams, as for every option, so they read 58. The precision is not
  changed. The test asserts both.
- **A count not above zero** (a zero or negative batch) has no option, as
  before (N-4): the card and the sheet read "No usable starter band for this
  cell count." (round 2; in round 1 it was offered both packs with no
  starter).
- **The multiple of a pack with no starter** is the count over the pack, N /
  S with N = C, at most 1 (80 ÷ 100 = 0.8); pinned by hand in the engine
  scenario (round 2).
- **The stats bar** is not named by the sentences and is left as it was: it
  now shows "Starter 0.50 L" for the built-in recipe, "Starter 0.00 L" at or
  below 100 billion, and still "No starter band" above 1,270 and when blank.
  A Tier C roadmap line asks what it should say.
- **The References page** lists "0 < C ≤ 100: no starter, the pack alone" (100B),
  "100 < C < 400: N = C" (in place of 250 ≤ C < 400), "0 < C ≤ 200: no
  starter, the pack alone" (200B; the 100B line likewise "0 < C ≤ 100"), and a line under the 5 L sentence: "Above C = 1270,
  no single starter reaches C: pitch more packs, or build the starter in
  steps." (the 1270 read from the band list, not written again).
- **Tests changed with it**: the captured sheets and cards of
  `celsius-toggle`, `economics`, `sparge-in-volumes` and `pro-unit-choices`
  (their starter rows re-pinned, the old beside the new in each test's
  comment); the page digests `page-error.before.json` and
  `error-outside-the-tabs.before.json`, every entry re-captured after
  comparing the drawn pages line by line before and after: only the
  starter's lines differ (the card's and sheet's options or SB-S5's
  sentence, the stats bar's starter note, the References page's bands).
  Old digests: page-error Home Recipe 0b79a8f7…, Home Water 5333a349…, Home
  Options 46e2afc2…, Pro Recipe 3319c9ca…, Pro Water 387e9eb6…, Pro Options
  f66b5591…, References daa1d27b…; error-outside-the-tabs Home Recipe
  0e8ddb7c…, Home Water d2780c12…, Home Options c9771f79…, Pro Recipe
  274b5324…, Pro Water 99551004…, Pro Options aa5d1f16…, References
  51b1211a…. The derived figures listed in `design-warnings` and
  `empty-fields` gain the engine's `starterAboveRange` beside `solveStarter`.
  `notes-page.test.js` reads the new ranges and checks a no-starter option at
  0 L and 0 g at 9 more counts. The engine's old test "below all ranges
  (200B) -> no options" is removed; its count is now served.
- **Far end**, the built app in Chromium, 2026-11-10, a fresh visit: Home,
  210 billion → 100B, 0.50 L, 58 g, note "—", stats bar "Starter 0.50 L";
  the printed sheet's row 100B, 0.50, 58, blank note; Pro (scaled to 10 bbl)
  → 12.10 trillion, card and sheet read SB-S5's sentence; back in Home 210 →
  0.50 L again; 2 gal → 80 billion, both packs with no starter; a blank
  fermentation volume → "No usable starter band for this cell count."; the
  References page's bands as above; no console errors or warnings.
- **FAIL round 1** (inspector, Opus 5.5, 2026-11-10), three reasons, and what
  changed after it:
  1. SB-S6 read 57.5 g where the card and the sheet show 58 g. The planning
     session corrected SB-S6 to the agreed 58 g (57.5 g before the card's
     whole-gram precision), with a line under Decisions; no precision change.
  2. A zero or negative count was offered both packs with no starter, where
     it read "No usable starter band for this cell count." before, unflagged
     (N-4: zero as today). Now a count not above 0 has no option (the engine,
     both packs), and the card and sheet read as before; pinned in the engine
     scenario (0, −10, −250: no option, not above the range) and the app
     scenario (a 0 gal fermentation volume: 0 cells, no option, the old
     sentence on the card and the sheet). The References page reads
     "0 < C ≤ 100" and "0 < C ≤ 200", and its test checks −10 and 0, so the
     References entry of both page-digest files is re-captured again (only
     that entry changed). SPEC rule 2 says so.
  3. The multiple returned for a pack with no starter was unpinned. Kept as
     the count over the pack and pinned by hand in the engine scenario (80 ÷
     100 = 0.8, 80 ÷ 200 = 0.4, 100 ÷ 100 = 1, 100 ÷ 200 = 0.5, 110 ÷ 200 =
     0.55, 200 ÷ 200 = 1).
- **FAIL round 2** (the same inspector's re-inspection, 2026-11-10), one
  reason: SB-S6's correction had no owner record. It was put to the owner as
  S-6a ("For the built-in recipe the starter card shows 58 g of extract,
  which is 57.5 g shown at the card's whole-gram precision. Agree that the
  card shows 58 g?") and he answered "yes" (2026-11-10). What changed after
  it: the S-6a row in the Decisions table and the line under it, in this
  file only; no code, test or other document changed.
