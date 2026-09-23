# Header mark — Persyn medallion replaces the flask — Tier C

Status: agreed 2026-09-22 (the owner chose option A), **blocked on artwork the
owner is producing**. Not started. Written by the spec session; to be built by
a new session from CLAUDE.md's kickoff prompt once the asset lands.

## Why

The app header shows a flask mark beside the BREW DESIGN wordmark. The owner
took it for an early-development stand-in and asked for the Persyn logo
instead. It is worth recording what was actually the case, because it changes
what "matches Brew Water Chem" means: the water app's header uses that same
flask in that same slot. The Persyn photo logo lives in the water app's footer
and at the top-left of its printed batch sheet — not in its header.

Told that, the owner chose to put his own mark in the header anyway, and chose
the medallion alone rather than the full lockup: the header already prints
"Persyn Chemical Engineering" as a kicker line under the wordmark, so the full
lockup — which carries the company name in the artwork — would print it twice.

## Sentences — what must be true afterwards

- **S1** The app header shows the Persyn medallion where the flask was, at the same height and in the same position.
- **S2** The wordmark and the "Persyn Chemical Engineering" kicker beneath it are unchanged.
- **S3** The medallion is decorative to assistive technology — the kicker line already names the company in text.
- **S4** The flask artwork is removed from the app; nothing still refers to it.
- **S5** Nothing else changes: no recipe value, no derived number, no layout beyond the mark itself.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, default effort | The Models rule's default, every tier (the owner, 2026-09-23); an asset swap in one component needs no more than default effort |
| M2 | Inspector | Not required. Tier C's gate is "suites pass"; the far end is looking at it | CLAUDE.md change-control table |
| H1 | Which artwork in the header | The medallion alone — the circular monogram without the PERSYN text or the descriptor line (option A) | The kicker already names the company; the full lockup would print it twice |
| H2 | The full lockup | Not used here. It goes on the printed sheet (`docs/items/recipe-print-sheet.md`) and in the footer when that roadmap item runs | Each surface gets the form that fits it |
| H3 | Size and position | Unchanged from the flask: same slot, same height, square | A swap, not a redesign |
| H4 | Color | As supplied. If the artwork arrives as vector, it can be recolored to the wordmark's navy later without new artwork; a flat image cannot | Recorded so the choice stays open |
| H5 | Silent properties | Nothing persisted, computed or measured changes. The header is the only surface touched. If the artwork arrives as a flat image rather than vector, it will look soft on high-resolution screens at any size the source does not cover | Named so they are checked, not discovered |
| H6 | Files and tier | Tier C. `apps/recipe/src/components/Header.jsx`, the new artwork in `apps/recipe/src/assets/`, deletion of `apps/recipe/src/assets/bwc-flask-header.svg`, `docs/ROADMAP.md` (this item's row removed), this file | Components and assets are Tier C paths |

## Artwork owed by the owner — specification

Two files, both with **transparent backgrounds** (the footer sits on a tinted
page background, where a white rectangle would show):

| File | Content | Used by |
|---|---|---|
| Medallion alone | The circular monogram only — no PERSYN text, no descriptor line. Trimmed tight to the circle, then padded equally so the file is exactly square | This item: the app header |
| Full lockup | Medallion + PERSYN + CHEMICAL ENGINEERING AND CONSULTING, as it is today | The printed sheet, and the footer roadmap item |

- **Vector (SVG) is strongly preferred.** The flask it replaces is a 717-byte
  square SVG at a 100×100 viewBox: sharp at every size and screen, and
  recolorable in code. A flat image is neither.
- **If vector is not available:** transparent PNG, medallion at 256×256, full
  lockup at 1200 px wide. The lockup needs that much because it prints at
  about 140 px wide and print wants roughly three times screen resolution.
- The only copy in either repository today is
  `brew-water-chem/public/persyn-logo.jpg` — the full lockup, black line art
  on an opaque white background, about 850 px wide. It traces to vector
  cleanly if the original artwork cannot be found.
- Drop both in `apps/recipe/src/assets/`. Suggested names: `persyn-mark.svg`
  for the medallion, `persyn-logo.svg` for the lockup.

## Scenarios

None in the suite: this is an artwork swap with no behaviour and no number.
The existing suites must still pass, and the build must still succeed with the
new asset bundled and the flask gone.

## Far end — Tier C: look at it

`npm test` at the root; `npm run build`; then the running app in a browser:
the medallion sits where the flask did at the same optical weight, the wordmark
and kicker are unmoved, it is crisp on a high-resolution display, and the
header still reads correctly at phone width.

## Recorded failure (filled in by the builder)

## Builder's notes — choices the sentences did not make (filled in by the builder)
