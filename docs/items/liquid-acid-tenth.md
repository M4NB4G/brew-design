# Liquid acid to 0.1 mL at Home, whole mL in Pro — Tier B

Status: landed 2026-10-08 in batch S10 on branch `claude/hopeful-lamport-u905yx`, as "Liquid acid shows and prints to 0.1 mL at Home and whole mL in Pro"; agreed 2026-10-08 (the owner: "Option A where pro is a whole number"); inspector PASS. Built in the S10 session on the
owner's word, after its first build (S10 item 2, Tier C) was reverted
before merging: the review of S10 found the decimals are not display only.

## Why

Liquid acid shows and prints to whole mL, so a small dose reads well off:
the West Coast Pilsner's recommendation before S9 was 2.42 mL of 75 %
phosphoric for 8 gal of mash water and showed "2" (17 % low). The owner
decided on 2026-10-07 that liquid acid shows and prints to 0.1 mL, and on
2026-10-08 that Pro stays at whole mL, as Pro's salts are whole grams.

It is Tier B by the catch-all: leaving an acid box without typing saves
the figure the box shows as the brewer's own dose (checked on the built app
2026-10-08: the recommendation 12.96 mL, box "13"; focus the box and leave
it, and 13 is saved). So the number of decimals sets a saved dose.

## Sentences — what must be true afterwards

- **LT-S1** At Home, each liquid acid's amount box and its "rec" hint on the Salts & Acid screen show the dose to 0.1 mL, and the printed sheet prints it to 0.1 mL.
- **LT-S2** In Pro, liquid acid shows and prints to whole mL, as today.
- **LT-S3** Leaving an acid box without typing saves the dose as the box shows it, as today: now to 0.1 mL at Home, whole mL in Pro. Changing that is its own roadmap item.
- **LT-S4** Nothing else changes: every dose the engine recommends, the salts (0.1 g at Home, 1 g in Pro), acidulated malt (0.01 oz or lb), and no saved format.

## Decisions

| id | Question | Decision | Rule |
|---|---|---|---|
| LT-Q1 | Liquid acid's precision | Home 0.1 mL (the owner, 2026-10-07); Pro whole mL (the owner, 2026-10-08) | Pro matches its whole-gram salts |
| LT-Q2 | Tier | B | The catch-all: leaving the box saves the figure shown, so the decimals set a saved dose (the review of S10, 2026-10-08) |
| LT-Q3 | Leaving a box without typing saves what it shows | Stays as today; its own roadmap item | Option A (the owner, 2026-10-08): this item changes the decimals only |
| LT-Q4 | A comma typed as the decimal point; a dose that rounds to nothing prints a row | Not in this item; each stays on the roadmap | Neither is made worse: at Home a comma reads as whole mL, as before; a row that rounds to nothing now needs a dose under 0.05 mL, not under 0.5 |
| M1 | Builder model | Opus (the S10 session after its switch to Opus, 2026-10-08) | The Models rule's default for Tier B |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | No saved format changes. A dose saved at Home to 0.1 mL shows in Pro to whole mL and, if the brewer leaves its box in Pro, is saved to whole mL; today both sides save whole mL. Storage disabled, multi-tab and ordering as today | — |

## Scenarios — to be written first, must fail before

`apps/recipe/test/liquid-acid-tenth.test.js`, on the West Coast Pilsner
(`west-coast-pils.fixture.js`; its doses worked by hand there): *at Home a
liquid acid dose shows and prints to 0.1 mL* (into the mash 12.96 mL reads
13.0, with the salts 22.69 mL reads 22.7, a typed 2.4 mL reads 2.4); *in
Pro it shows and prints to whole mL* (13, 23, 2); *leaving the box without
typing saves the dose as shown* (22.7 at Home, 23 in Pro); *salts and
acidulated malt keep their precision*.

## Notes for the builder

- One shared setting for the acid's decimals beside its unit in
  `display.js`, read by the Salts & Acid screen and the printed sheet, so
  the two cannot differ (the review of S10).
- Files: `apps/recipe/src/display.js`, `components/water/SaltsAcidScreen.jsx`,
  `components/recipe-sheet-data.js`; the tests that pin whole mL
  (`water-tab.test.js`, `acid-in-mash.test.js`); `docs/TEST_COVERAGE.md`;
  `docs/ROADMAP.md` (the Tier B line is replaced by the questions left).

## Builder's notes (S10, 2026-10-08)

Claims for the inspector to verify; none is a decision the sentences made.

- One shared setting, `liquidAcidDigits(mode)` in `display.js` beside
  `liquidAcidUnit`: 1 at Home, 0 in Pro. The Salts & Acid screen's acid
  row (box, "rec" hint, and the save on leaving, which formats then reads
  the box) and the printed sheet's acid line both read it. Acidulated malt
  keeps its own 2 decimals in both places.
- The digits 1 and 0 are display precision that, through the save on
  leaving (LT-S3), also set a saved dose. Their rule is LT-Q1 (the owner's
  words); their pins are the hand values in `liquid-acid-tenth.test.js`
  (13.0 / 22.7 / 2.4 at Home, 13 / 23 / 2 in Pro, 22.7 / 23 saved).
- Which scenarios fail before: the Home ones of LT-S1 and LT-S3 (screen,
  sheet, leaving the box). The Pro ones (LT-S2, "as today"), the salts and
  acidulated malt one (LT-S4) and the recommendations-are-the-hand-figures
  one pass before by design: they pin what must not change.
- The West Coast Pilsner moved into a shared fixture,
  `west-coast-pils.fixture.js`, the same recipe as `acid-in-mash.test.js`'s
  copy, its hand working copied beside the two doses. The other copies are
  not moved here (a roadmap line, Tier D).
- `eslint.config.js`: the new jsdom test joins the list of tests granted
  the browser's globals, as `accessible-names.test.js` and
  `my-ingredients.test.js` are.
- Two older pins of whole mL at Home change with it: `water-tab.test.js`
  (the "rec" hint to 0.1) and `acid-in-mash.test.js` ('13' to '13.0').
- Roadmap: the Tier B line this item came from is replaced by the
  questions it leaves (leaving a box without typing, a comma as the
  decimal point: Tier B; a dose that rounds to nothing: Tier C); the S10
  row and the fixture line say what happened.
- SPEC is unchanged: no rule states liquid acid's precision (the Display
  units table gives its unit only).
- Built in the session that wrote this table, on the owner's word
  (option A, 2026-10-08), after the session switched to Opus.
