# A water box keeps its figure until typed in, Tier B

Status: agreed 2026-10-12 ("agree to all", S16-Q0, LB-Q1, LB-Q2); landed
2026-10-13 as "Leaving a salt or acid box without typing changes nothing,
and a typed dose is kept as typed, shown to the screen's precision away
from the cursor and in full in it". Written by the S15b session; built in
batch S16, item 1 (docs/ROADMAP.md, Sessions).

## Why

Each salt and acid box on the Salts & Acid screen saves the figure it shows
when the brewer leaves it, even without typing: the West Coast Pilsner's
recommendation of 22.69 mL of 75 % phosphoric becomes the brewer's own
22.7 mL at Home (23 in Pro), the dose stops following the recommendation,
and later edits that move the recommendation no longer move it; in Pro a
dose saved at Home as 2.4 mL becomes 2 (found by the review of S10,
2026-10-08; LT-Q3). Tier B by the catch-all: the component changes a dose
the brewer acts on.

## Sentences: what must be true afterwards

- **LB-S1** Leaving a salt or acid box without typing in it changes nothing: a dose that follows the recommendation keeps following it, and the brewer's own dose stays as saved, to the last digit.
- **LB-S2** A dose the brewer types is kept as typed, every digit; the box shows the screen's precision while the cursor is elsewhere (salts 0.1 g Home, 1 g Pro; liquid acid 0.1 mL Home, whole mL Pro; acidulated malt 0.01 oz or lb) and the full figure while the cursor is in it, as the volume boxes do (BA1).
- **LB-S3** Emptying a box and leaving it gives the same figure it gives today (no change to what an empty box means).
- **LB-S4** Nothing else changes: the recommendation, every water figure, the printed sheet and the saved format (recipe format stays as it is).

## Decisions: agreed 2026-10-12

| id | Question | Decision | Rule |
|---|---|---|---|
| S16-Q0 | Which items in S16? | This one, a comma typed as the decimal point, and the HLT's figures when the sparge is more than the tank holds | Numbers a brewer acts on first; the first two are in the same boxes |
| LB-Q1 | Leaving a salt or acid box without typing | Changes nothing: following the recommendation stays following it; a saved dose stays as saved | A stored figure changes only by typing (SPEC 9, the volume boxes' rule) |
| LB-Q2 | A typed dose | Kept as typed, shown to the screen's precision away from the cursor and in full in the box | The same rule as the volume boxes (BA1) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | **Ordering:** a recommendation that moves while the cursor is in a box the brewer has not typed in moves the box with it. **Idempotence:** focusing and leaving any number of times changes nothing. **Schema migration:** none; no saved format changes. **Storage disabled:** as today | — |

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/water-box-keeps-its-figure.test.js`, jsdom, the
West Coast Pilsner fixture): *leaving a box without typing keeps the
recommendation* (22.69 mL recommended, focus and leave, the saved recipe's
acid still follows it, and a later edit that moves the recommendation moves
the dose); *a saved dose stays as saved* (2.45 mL saved, Pro then Home,
focus and leave: 2.45); *a typed dose keeps every digit* (2.45 typed shows
2.5 at Home away from the cursor, 2.45 in it, 2.45 saved); *an emptied box
is as today*; *nothing else changes*.

## Notes for the builder

- `apps/recipe/src/components/water/SaltsAcidScreen.jsx`, `DraftInput`: its
  `onBlur` writes `parse(draft) ?? 0` back even when nothing was typed; the
  box's draft is the formatted (rounded) figure.
- The salt and acid boxes are the only text boxes on the Water tab; the
  other Water tab boxes are number boxes.
- With the comma item (S16 item 2) in the same boxes, build this one first.

## Builder's notes (S16, 2026-10-13)

Choices the sentences did not make, each a claim for the inspector:

- **The full figure** with the cursor in the box is the figure to six
  decimals, as the volume boxes show it (`NumberField`, BA1): the
  Pilsner's 22.6874642283088 mL reads 22.687464; acidulated malt shows its
  oz or lb figure that way. Display only.
- **Until the brewer types**, the box draws its figure from the recipe
  each time, so the old step that copied a new recommendation into the
  box's text is gone; that is what makes a moved recommendation move an
  untouched box (row K, ordering).
- **What typing does is unchanged**: each readable entry is stored as it is
  typed; on leaving, the typed text is read once more (an emptied box, or
  text that does not read, gives 0, as before; a box whose figure was
  blank and is left empty stays blank). The comma item (S16 item 2)
  changes the text that does not read.
- **The earlier scenario that pinned the old behaviour**,
  `liquid-acid-tenth.test.js`'s "leaving the acid box without typing saves
  the dose as the box shows it" (LT-S3), now asserts the opposite, citing
  LB-Q1; its count stays 8.
- **Tooling**: the new jsdom test is added to `eslint.config.js`'s list of
  tests that read the browser's globals (Tier D).
