# The Water Notes cite the CRC Handbook for phosphoric acid, Tier C

Status: landed 2026-10-15 as "The Notes' line on phosphoric acid ends "Source:
CRC Handbook of Chemistry and Physics, 97th ed." in place of "This follows
standard aqueous acid–base chemistry, not a single proprietary source."" (agreed
2026-10-15: "agree to all", R-1, CR-Q1, O-1 to O-5). Written by the S19
session; built in the orchestrated run, batch O1, item 3 (docs/ROADMAP.md,
Sessions).

## Why

The Water tab's Notes, third Application Assumption, say phosphoric acid as
monoprotic "follows standard aqueous acid–base chemistry, not a single
proprietary source." The owner (2026-10-08, RF-Q10): cite the CRC Handbook
of Chemistry and Physics. The engine already cites it, 97th edition
(`packages/engine/src/water/acids.js`).

## Sentences: what must be true afterwards

- **CR-S1** The Notes' line on phosphoric acid ends "Source: CRC Handbook of Chemistry and Physics, 97th ed." in place of "This follows standard aqueous acid–base chemistry, not a single proprietary source."
- **CR-S2** Nothing else on the Notes screen or any other page changes.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| CR-Q1 | The replacement wording? | "Source: CRC Handbook of Chemistry and Physics, 97th ed." | The owner's call of 2026-10-08 (RF-Q10); the edition the engine cites |

Tier C (`components/water/NotesScreen.jsx`, wording only).

## Scenarios: to be written first, must fail before

App: *the Notes cite the CRC Handbook, 97th edition, for phosphoric acid as
monoprotic, and not "a single proprietary source"*. Fails before on the old
sentence.

## Notes for the builder

- The pK values on the line (2.15, 7.20) stay as they are; only the last
  sentence changes. A test that pins the Notes' text word for word
  (`notes-wording.test.js`, `notes-mash-ph.test.js`) is checked and updated
  if it reads that sentence.
- `docs/TEST_COVERAGE.md` gets a scenario row; the roadmap line "Water Notes
  cite the CRC Handbook for phosphoric acid" is removed.

## Builder's notes (landed 2026-10-15)

- Scenario `the Notes cite the CRC Handbook, 97th edition, for phosphoric acid
  as monoprotic, and not "a single proprietary source"`
  (`apps/recipe/test/notes-cite-crc.test.js`) failed before on the old
  sentence, passes after. It renders the Notes to text with react-dom/server,
  as `notes-wording.test.js` does.
- No digest changed. None of the seven `apps/recipe/test/*.before.json` files
  carries the Notes' text (no "proprietary", no "Application Assumptions" in
  any), so nothing was re-captured.
- Notes tests checked: `notes-wording.test.js`, `notes-mash-ph.test.js`,
  `notes-page.test.js` and `water-tab.test.js` read the Notes; none reads the
  replaced sentence (`water-tab.test.js` pins only "Phosphoric acid is treated
  as effectively monoprotic at mash pH."), so none needed a change.
- `eslint.config.js` is unchanged. The new test renders to text and uses no
  jsdom globals, so lint passes without a line for it (the Opus advisor
  suggested leaving it out; a first draft had added one).
- Far end: the built app in headless Chromium, Water tab, Notes:
  `screens/O1-3-phosphoric-line.png` (the phosphoric acid line alone) and
  `screens/O1-3-notes-page.png` (the Notes page), in the session's scratchpad.
