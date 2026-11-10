# The starter card always says what to do, Tier A

Status: agreed 2026-11-10, not started. Written by the planning session of
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
- **SB-S6** The built-in recipe, at 210 billion cells, shows one 100B pack in 0.50 L with 57.5 g of extract.
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

(to be filled in)
