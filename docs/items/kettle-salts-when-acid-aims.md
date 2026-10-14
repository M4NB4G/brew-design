# Kettle salts when the acid drops the raising salt, Tier B

Status: agreed 2026-10-14 ("agree to all", KA-Q1, M); landed 2026-10-14 as
"With kettle salts on, while the acid aims at the mash pH the kettle gets no
alkalinity-raising salt, and its other salts are as before". Written by the
S15c session; built in batch S17, item 2 (docs/ROADMAP.md, Sessions).

## Why

With kettle salts on, the kettle's salts are what the whole kettle water
needs for the style, less what the mash brings. Since the acid aims at a
mash pH (S9), a mash above the target gets no alkalinity-raising salt
(AA-Q7), so the kettle's balance puts that baking soda in the kettle
instead: the amber ale of `acid-aimed.test.js` with kettle salts and a 4 gal
sparge gets 0.46 g of baking soda in the kettle at a target of 5.4, against
0.26 g at 6.0 (noticed building the acid aimed at a mash pH, S9,
2026-10-07). Baking soda carries no sulfate or chloride, so this item does
not move S17 item 1's figures.

## Sentences: what must be true afterwards

- **KA-S1** With kettle salts on and the acid aiming at the mash pH (the mash above the target, so no raising salt in the mash), the kettle gets no alkalinity-raising salt: the amber ale above, 0 g of baking soda in the kettle at a target of 5.4.
- **KA-S2** With the mash at or below the target (no acid; the raising salt follows the style), the kettle's salts are as today (the amber ale at 6.0: 0.26 g).
- **KA-S3** The kettle's other salts, and every other figure, are as today; no saved format changes.

## Decisions: agreed 2026-10-14

| id | Question | Decision | Rule |
|---|---|---|---|
| KA-Q1 | While the acid aims at the mash pH, does the kettle get the raising salt the style's alkalinity asks for? | No: the kettle gets no alkalinity-raising salt; mashes at or below the target keep today's figures | The style's alkalinity serves the mash pH; once the acid aims at it, nothing asks for the raising salt (AA-Q7) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Ordering:** the kettle reads the same "acid aims" condition the salts and the acid card read. Nothing is saved; no saved format changes | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`, a new file, the amber ale of
`acid-aimed.test.js` with kettle salts on and a 4 gal sparge): *at 5.4 the
kettle has no baking soda* (0 g, against 0.46 g today); *at 6.0 as today*
(0.26 g); *the other kettle salts unchanged* (by hand or against today's
figures); *off, nothing changes*.

## Notes for the builder

- `selectors.js` `computeWater`: the kettle block solves the whole kettle
  water with the style's raising salt; the mash's `withoutRaise` /
  `recommendedSalts` already say when the acid aims. Engine untouched
  unless the solver needs a switch.
- Check whether leaving the raising salt out changes the solver's other
  kettle salts (it solves the ions together); KA-S3 asks that they stay as
  today, so drop the raising salt from the result, not from the solve,
  unless the owner is asked again.

## Builder's notes (S17, 2026-10-14)

Choices the sentences did not make, each a claim for the inspector:

- **One condition.** "The acid aims" is the one the salts already read
  (the aimed dose is above 0: the mash above the target without the raising
  salt), named once in `computeWater` (`acidAims`) and read by both the
  mash's salts and the kettle (K).
- **Dropped from the result.** The kettle's balance is solved as before;
  while the acid aims, the raising salt's amount in it is set to 0 (only when
  the balance lists it), so its row stays on the Kettle Salts card reading
  "0.0 g", and the sheet, which prints only what goes in, leaves it off. The
  solve is untouched, so the other kettle salts and the "already over the
  target" list are as before (KA-S3). The raising salt is whichever the tab
  picks (baking soda or pickling lime).
- **FLAG: the kettle water readout.** It counts what is in the kettle, so
  with no raising salt there it is lower than before by what that salt
  added: alkalinity for both (the amber ale at 5.4: 60.2 → 50.0 mg/L),
  sodium for baking soda (26.7 → 22.0 mg/L), calcium for pickling lime
  (76.06 → 71.97 mg/L, its mark against the style's 90 turning from near to
  off). KA-S3 keeps the other salts as before; this readout is the kettle's
  own consequence of KA-S1, marked `// FLAG:` in `selectors.js`.
- **A blank turned 0.** With the acid aiming, the brewer's own raising salt
  in the mash and a blank brewhouse efficiency, the kettle's raising salt
  reads 0 ("0.0 g") where it was blank, while the other kettle salts show
  "—": its amount no longer depends on the blank figure (found by the
  inspector, round 1).
  Item 1's fermenter figures do not move: baking soda carries no sulfate or
  chloride.
- **The pins.** No number is introduced; the figures that stay are the
  unchanged code's, recorded 2026-10-14 (0.4555 and 0.2603 g of baking soda;
  2.1978, 2.0000 and 1.5875 g of the others). Three of the five scenarios are
  guards that held before (at 6.0, the other salts, kettle salts off), as the
  item lists them.
- **FAIL round 1.** The inspector: the FLAG named only sodium and
  alkalinity (pickling lime lowers calcium and can turn its mark off), and
  no scenario pinned the pickling lime path. The FLAG and this note now
  name both salts; a sixth scenario pins lime at 5.4 (0 g, against 0.2003 g
  before) and 6.0 (0.1145 g, as before), the other three salts as before.
  It is a guard added after the recorded failure: on the unchanged code it
  fails at 5.4 ("expected 0.2003000560408912 to be +0").
- **Recorded failure.** 2 of 5: KA-S1 "expected 0.45550159950416597 to be
  +0", K "expected 0.38050159950416595 to be +0". After recording, the K
  scenario's blank-target pin was corrected from 0.4555 to 0.2603 g (with
  no target nothing aims, the mash keeps the style's baking soda, so the
  kettle reads as at 6.0; the code on that path is unchanged); re-run on the
  unchanged code, the same 2 of 5 fail with the same lines.
