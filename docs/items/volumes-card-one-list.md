# The Volumes card and the line under the stats bar read one list, Tier B

Status: landed 2026-10-15 in batch O2 as "The line under the stats bar names
the Volumes card's empty boxes in the order the card shows them, read from one
list of the card's rows that the card and the line share" (agreed 2026-10-15:
"agree to all", R-1, VO-Q1, S20-Q2 superseded by the orchestrated run, O-1 to
O-5, M). Written by the S19
session; built in the orchestrated run, batch O2 (docs/ROADMAP.md, Sessions).

## Why

The line under the stats bar names the Volumes card's empty boxes in an
order written out in `empty-fields.js`, beside the card's own layout in
`VolumesSection.jsx`, so a row moved or added on the card puts the line out
of screen order and no test fails. It happened once: the measurement
temperatures moved to the card in S6c, and the line named them last until
S10 (the review of S10, 2026-10-08). Tier B by the catch-all's "when in
doubt": every earlier change to `empty-fields.js` was gated Tier B.

## Sentences: what must be true afterwards

- **VO-S1** The line under the stats bar names the Volumes card's empty boxes in the order the card shows them, read from one list of the card's rows that the card and the line share.
- **VO-S2** No figure, no wording and no screen changes: the line names the same boxes in the same words and order as today, with water back off and on, in Home and in Pro, and the card draws byte for byte as before.
- **VO-S3** A row moved in the shared list moves on the card and in the line together.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| VO-Q1 | Should the line name empty boxes in the order of one list the card also uses? | Yes; no figure or wording changes | It went out of order once already (S6c to S10) |
| M1 | Builder model | Opus, high effort | The Models rule's default; O-3 |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default; O-3 |
| K | Silent properties | **Ordering:** the point of the item; the phone layout (one column, Mash, Boil, Ferment) reads the same order. **Water back on/off:** the list's rows that show only with water back on are skipped when it is off, as today. **Saved data:** none; no saved document, format or figure changes. **Durability, atomicity, multi-tab, storage disabled:** not touched. | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`): *the line's order is the card's order, read from
one list* (the line under the stats bar and the card both follow the shared
list; with a row moved in the list, both move: a test that substitutes a
reordered list and sees the card and the line follow it fails before, the
line keeping its own order) · *nothing changes on screen* (the line's text
for each blank box, water back off and on, Home and Pro, as today; the
byte-for-byte page digests unchanged). Fails before: the line does not read
the card's list.

## Notes for the builder

- `apps/recipe/src/empty-fields.js` (`emptyFields`, its hand-written
  Volumes section) and `apps/recipe/src/components/VolumesSection.jsx`.
  The shared list can be a small module of the card's row keys in order,
  each with its label; keep the change the smallest that makes VO-S1 and
  VO-S3 true, and the card's markup byte for byte (VO-S2).
- The Grist, Yeast and Hops parts of the line keep their own order (out of
  scope).
- SPEC rule 8 says the line is "read from the recipe's own figures": unchanged.
  `docs/TEST_COVERAGE.md` gets a scenario row; the roadmap line "The Volumes
  card's order is written twice" is removed.

## Builder's notes (landed 2026-10-15)

- Builder: Opus 5.5, high effort. Inspector: Opus 5.5, default effort, a fresh
  session: PASS, no FAIL rounds.
- Scenarios (`apps/recipe/test/volumes-card-one-list.test.js`): *the line's
  order is the card's order, read from one list* (VO-S1, VO-S3) failed before:
  with the list substituted (Boil time moved above the pre-boil volume), the
  line kept its own order, Boil time after the boil-off rate. *nothing changes
  on screen* (VO-S2) is a pin of today's behaviour and passed before and after.
- The shared list is `apps/recipe/src/volumes-card-rows.js`: the card's three
  parts (Mash, Boil, Ferment) in screen order, each row a key, a name for a box
  the brewer types in (the line's name for it; worked-out figures, the warning
  and the check have none) and a water-back flag (`true` only with it on,
  `false` only with it off, absent always); `rowsShown` is the one filter both
  readers use. The fermentation measurement temperature sits twice under one
  key, once for each water-back state, as its place differs between them today.
- The card draws each part's shown rows in the list's order from a map of the
  rows' existing markup, unedited, by key; only shown rows are drawn. The parts
  are taken by position, the headings and columns unchanged. The two "less
  wort" warnings became one row whose text follows water back, both strings
  unchanged.
- The line walks the same list and names each empty box with a name; the four
  temperatures share one check (blank, or its volume at 60 °F blank while the
  measured volume is not), the water back's included. Grist, Yeast and Hops
  untouched.
- Byte for byte: `volumes-card-one-list.before.json`, captured from the
  unchanged code by `volumes-card-one-list.fixture.js` (a temporary capture
  test, then deleted): 248 line texts and 408 SHA-256 hashes of the card's
  markup, water back off and on, temperatures at the reference and measured
  hot, Home, Pro in barrels and in gallons, °F and °C; identical after. All
  other page digests unchanged.
- No number added to app code. Suites: engine 260, app 437, browser 23; build
  and lint pass.
- Far end 2026-10-15, built app in Chromium at 1200 px and 390 px, Home and
  Pro, several boxes emptied, water back off, on, off and on again: the line
  reads the boxes in the card's order each time; screenshots
  `O2-{home,pro,phone-home,phone-pro}-water-back-{off,on,off-again,on-again}.png`
  in the session's scratchpad `screens/`.
- Roadmap line added (Tier C): "The boil time box hands its blank figure to
  the page as is" (React's development warning "Received NaN for the `value`
  attribute"; the built app shows the box empty).
