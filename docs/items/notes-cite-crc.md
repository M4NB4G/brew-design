# The Water Notes cite the CRC Handbook for phosphoric acid, Tier C

Status: agreed 2026-10-15 ("agree to all", R-1, CR-Q1, O-1 to O-5); not
started. Written by the S19 session; built in the orchestrated run, batch O1,
item 3 (docs/ROADMAP.md, Sessions).

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
