# Header unit switches on their own row — Tier C

Status: agreed 2026-10-09 (the owner's answers to H1 and H2 in the F2 batch, asked by the builder); landed in the commit whose subject is "The header's unit switches sit on a row of their own under the four actions, and on a phone only Pro/Home stays beside the brand".

From the roadmap line "Header unit toggles crowd in Pro" (noticed building the Pro unit choices, S6b item 2, 2026-10-05): in Pro the header carries five unit switches (°P/SG, bbl/gal, lb/sacks, °F/°C, Pro/Home) beside the four actions, so on a 1200 px screen the row wraps unevenly and on a phone the five stack down the right of the brand row. Layout only; no figure, saved document or printed sheet changes.

## Sentences — what must be true afterwards

- **HU-S1** On a screen, the four actions (Export, Import, Reset to defaults, Print recipe) are on one row, right-aligned, and the unit switches are together on a row of their own under it, right-aligned, in the order they have today: in Pro °P/SG, bbl/gal, lb/sacks, °F/°C, Pro/Home; at Home °F/°C, Pro/Home.
- **HU-S2** On a phone, Pro/Home stays on the brand row beside the brand, and the other switches (in Pro °P/SG, bbl/gal, lb/sacks and °F/°C; at Home °F/°C) are in a row of their own under the four actions, wrapping onto a second line only when the screen is too narrow for them.
- **HU-S3** Nothing else changes: every switch does what it did, no figure, saved document or printed sheet changes, and the page does not scroll sideways at 375 px.

## Decisions — agreed 2026-10-09

| id | Question | Decision | Rule |
|---|---|---|---|
| H1 | Where the unit switches go on a screen | Their own row under the four actions (not a compact menu) | The owner's answer, with the builder's recommendation: every choice stays one click and in view; a menu needs focus and keyboard handling the accessibility batch (S14) has not settled |
| H2 | On a phone | Pro/Home beside the brand; the other switches in their own row under the four actions | The owner's answer: Pro/Home is the one switch that changes the whole screen |
| M1 | Builder; inspector | Sonnet 5.5 builds, Opus advises; no inspector (Tier C) | CLAUDE.md, Models (Tier C and D trial) |

## Proof — Tier C, "look at it"

A scenario in the new browser suite (`apps/recipe/test/browser/header-layout.spec.js`) measures the header at 1200 px (Pro and Home) and 375 px (Pro and Home); it failed before the change (recorded in the commit). Screenshots of the same four states are in the report.

## Builder's notes (F2 item 3, 2026-10-09)

- Built in `components/Header.jsx` only: the four actions keep their row; the unit switches moved, in the order they had, into a row of their own under it (right-aligned on a screen); on a phone the brand row now holds Pro/Home alone and the other switches follow the 2 x 2 action buttons.
- Choices the sentences did not make (layout only, for the owner to reverse): on a phone the unit row is centred under the full-width action buttons, not right-aligned, since it wraps (in Pro at 375 px, three switches then °F/°C alone on a second line); the gap between the actions row and the unit row is 0.5 rem.
- The jsdom header scenarios read the switches' text order, which is unchanged; no `before.json` capture holds the header.
- Numbers introduced: none that is a recipe value; the only numbers are rem gaps (layout) and the layout spec's pixel tolerances.
