# Figures that depend on an empty box read "—" on the Volumes card, Tier C

Status: agreed 2026-10-15 ("agree to all", S19-Q0, NV-Q1); not started.
Written by the S18 session; built in batch S19, item 3 (docs/ROADMAP.md,
Sessions).

## Why

With the mash water emptied, Mash Rv and Mash R read "NaN"; with the
pre-boil volume or the boil time emptied, the post-boil volume at 60 °F
reads "NaN", and so with the post-boil measurement temperature emptied
(React also warns "Received NaN for the `children` attribute"). The line
under the stats bar says such figures show "—", and the stats bar and the
Fermentation and Pre-boil rows do (roadmap, Tier C, noticed in S10 item 3
and by the inspector of S11 item 2, 2026-10-08).

## Sentences: what must be true afterwards

- **NV-S1** With the mash water emptied, Mash Rv and Mash R read "—".
- **NV-S2** With the pre-boil volume, the boil time or the post-boil measurement temperature emptied, the post-boil volume at 60 °F reads "—", as does the measured post-boil volume where it is shown.
- **NV-S3** With every box filled, each figure reads as before, to the same digits; no figure changes.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| NV-Q1 | Mash Rv, Mash R and the post-boil volume at 60 °F read "—" in place of "NaN" when a box they need is empty? | Yes, as the stats bar does; no figure changes | SPEC rule 8: the line under the stats bar names such figures and says they show "—" |

Tier C (`components/VolumesSection.jsx`, display only); no inspector
unless building it introduces a number (the catch-all).

## Scenarios: to be written first, must fail before

App (`apps/recipe/test/`, the app drawn whole in jsdom): *each emptied box
makes the figures that need it read "—", never "NaN"* · *with every box
filled each figure reads as before*. Fails before on "NaN".

## Notes for the builder

- The four readouts use `Number(x.toFixed(3))` (`VolumesSection.jsx`,
  lines 176, 183, 211 and 218, at S18's `main`): a NaN passes through as
  NaN. `format.js`'s `num` gives "—" for a blank, but
  pads to fixed digits ("1.700" where the card shows "1.7" today), which
  NV-S3 does not allow: keep today's figure when it is a number, "—" when
  it is not.
- The page-error and error-outside-the-tabs digests draw the built-in
  recipe, every box filled, so they must stay unchanged.
