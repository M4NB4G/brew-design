# Water as brewed — S4b, five items

Status: agreed 2026-10-02 ("agree to all"); item 1 landed 2026-10-02 as "The sparge water is typed for each recipe; the water left in the mash tun is worked out, and a kettle that will be short says so". Written by the S4
session after the owner previewed S4 (deploy preview of PR #28); built by
the same session on the owner's word (decision P), as batch S4b, in this
order: **Sparge water typed** (A + B), **Kettle water at the brewhouse
efficiency** (A + B), **HLT wording** (C), **My brewery banner** (B: it sits
in App), **Brewery file** (B).

## Why

Previewing S4, the owner asked for four changes (2026-10-02):
1. He sets the sparge water; the water left in the mash tun, and in the
   HLT, are worked out.
2. A banner recommends setting up My brewery while it is blank; and a
   recipe file never carried the brewery's figures, so they need their own
   file to move between sites and devices.
3. A readout of the kettle water after the kettle salts, on screen and on
   the sheet. He set the mixing rules: no sparge and batch sparge well
   mixed, fly sparge plug flow (the sparge water is hotter and has no sugar,
   so it floats). With no published salt-transfer data, the recipe's own
   brewhouse efficiency (against FGDB, to the full kettle — his definition,
   from Palmer, and the app's) stands for the share of the mash's dissolved
   salts that reach the kettle with a sparge (C16).
4. "HLT" for the hot liquor tank everywhere, spelled out where it is first
   used.

## Item 1 — Sparge water typed (Tier A + B)

- **SW-S1** The sparge water is typed for each recipe on the Where the Water Goes card (A1); blank until typed; a blank sparge water blanks what needs it, shows "—", and is named.
- **SW-S2** The water left in the mash tun is worked out: mash water + sparge water − grain absorption − the pre-boil volume at 60 °F (A2). Below zero, a warning says the kettle will be short by that much.
- **SW-S3** No sparge (full volume): no sparge water and no sparge box; the water left in the mash tun is mash water − grain absorption − pre-boil volume (A5).
- **SW-S4** HLT treated: the water left in the HLT is the top-up level less the sparge water, as before (A3); mash water treated: no HLT figure.
- **SW-S5** "Water kept in the mash tun" is no longer typed: it leaves the Water tab and My brewery (A4). The sparge water is not a brewery figure.
- **SW-S6** A recipe saved with the water kept in the mash tun (format 5) loads with the sparge water blank and is saved back at format 6; brewery figures saved with it (format 2) load without it and are saved back at format 3.
- **SW-S7** The total water is the mash water plus the sparge water; the HLT's draws, its warnings and the treated share use the typed sparge water.

## Item 2 — Kettle water at the brewhouse efficiency (Tier A + B)

- **KW-S1** With a sparge (batch or fly), the share of the mash's salts that reaches the kettle is the recipe's brewhouse efficiency (C16); with no sparge it is the share of the mash water that reaches the kettle, pre-boil volume ÷ mash water, the mash being well mixed (C11). The sparge's salts (the HLT's treated share) reach the kettle in proportion to the sparge water that reaches it: the pre-boil volume less the mash's share of it.
- **KW-S2** Kettle salts bring the kettle water before the boil (the pre-boil volume at 60 °F) to the target: for each salt, what the source water at that volume needs, less what reaches the kettle from the mash and the sparge, never below zero; no acid (C7). This replaces S4's balance over the mash plus sparge water.
- **KW-S3** The Water tab shows the predicted kettle water before the boil — calcium, magnesium, sodium, sulfate, chloride and their ratio, each against the target — labelled "Kettle water before the boil — mash salts at the recipe's brewhouse efficiency; the water and its salts, not the wort's minerals" with the sparge method's assumption (C8′, C9, C17, C18). No alkalinity or residual alkalinity. A note says the boil concentrates each figure by pre-boil ÷ post-boil volume (C10), and that calcium may read lower and magnesium higher in a sample (C18).
- **KW-S4** A line on the Kettle Salts card says they bring the kettle water (its volume) to the style's target, and names any salt already over target from the mash (C2).
- **KW-S5** The kettle readout shows only while kettle salts are on; the treated-water profile stays as it is.
- **KW-S6** The printed sheet prints the kettle readout and its label beside the treated-water profile (C3, C13).
- **KW-S7** A blank figure the readout needs (the brewhouse efficiency, the pre-boil volume, the sparge water) blanks it.

## Item 3 — HLT wording (Tier C)

- **HL-S1** "Hot-liquor tank" and "tank" meaning it read "HLT" everywhere on screen and on the printed sheet (D).
- **HL-S2** Where it is first used it is spelled out: the treatment choice reads "The Hot Liquor Tank (HLT) first fill"; a line under "Where the Water Goes" reads "HLT = Hot Liquor Tank"; the sheet's Water section says the same (D2).

## Item 4 — My brewery banner (Tier B, in App)

- **BB-S1** While every My brewery figure is blank, a banner on every tab says "Set up My brewery so new recipes start from your equipment", with a button that opens Options and a "Not now" (B1).
- **BB-S2** "Not now" hides the banner in this browser until a figure is set and then cleared again; it is never part of a recipe or the brewery's figures.
- **BB-S3** Setting any brewery figure hides the banner; nothing else changes.

## Item 5 — Brewery file (Tier B)

- **BF-S1** Options → My brewery exports the brewery's figures as a file, byte for byte the document kept in this browser (B2).
- **BF-S2** Importing a brewery file asks before it replaces the brewery's figures; it never changes the recipe on screen or its saved copy.
- **BF-S3** A file that is not a brewery file, is damaged, or is newer is refused with a message, and nothing changes; an older brewery file is read as storage reads it.

## Decisions — agreed

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | Models default |
| M2 | Inspector model | Opus, default effort, a fresh session per Tier A/B item | Models default |
| P | When | Build in this session as batch S4b, one branch, one report, one deploy. S4 itself was merged first on the owner's later word | The owner, 2026-10-02 |
| A1–A5 | Sparge and the mash tun | As the item 1 sentences | The owner, 2026-10-02 |
| B1, B2 | Banner and brewery file | As the item 4 and 5 sentences | The owner, 2026-10-02 |
| C7, C8′, C9–C13, C16–C18 | The kettle | As the item 2 sentences; C1–C3 are carried into them; C4–C6 and C15 are replaced by C16 | The owner, 2026-10-02 |
| C14 | Checking the kettle readout | The owner sends a pre-boil kettle sample per sparge method to his lab; measured against predicted is recorded here when it comes; it does not block the build | WP9's practice |
| D, D2 | HLT | As the item 3 sentences | The owner, 2026-10-02 |
| F | Saved formats | Item 1 moves the recipe format to 6 and the brewery's to 3; S5's agreed tables move theirs on by one (recipe 7, brewery 4) — still once each in S5 | One change per item that needs it |
| K | Silent properties | **Migration:** SW-S6. **Banner dismissal:** its own key in this browser, best-effort, never read by a recipe. **Brewery file:** the same reader as storage (versions, upgrades); import never touches the recipe. **Idempotence:** pure sums | — |

## Notes for the builder

- C11 (no sparge: the kettle water at the treated mash water's figures)
  and C16 (the brewhouse efficiency "for every sparge method") overlap for
  no sparge: with no sparge water to dilute, the kettle cannot be weaker
  than the mash liquor, so no sparge uses pre-boil ÷ mash water (KW-S1).
  Reported to the owner with the item.
- The kettle water's ions are the source water's plus the salts in the
  kettle over the pre-boil volume: every litre is source water, so the
  water held back in the grain and the tun changes only the salts.

## Item 1 — recorded failure (filled in by the builder)

```
packages/engine/test/water/volumes.test.js, describe "sparge water typed — the engine" (3 failed / 3):
  × the water left in the mash tun is worked out from the typed sparge water — AssertionError: expected NaN to be 8.5
  × with no sparge the mash water is all the water — AssertionError: expected undefined to be close to 1
  × a blank typed sparge blanks what needs it — AssertionError: expected undefined to be NaN
apps/recipe/test/sparge-typed.test.js (5 failed / 5):
  × the sparge water is typed and the water left in the mash tun is worked out — AssertionError: expected undefined to be NaN
  × a kettle that will be short warns — AssertionError: expected undefined to be close to 0.5
  × with no sparge there is no sparge box — AssertionError: expected undefined to be close to 1
  × the HLT draws use the typed sparge water — AssertionError: expected 4.499999999999998 to be close to 3.5
  × older recipes and brewery figures load without the water kept in the mash tun — AssertionError: expected undefined to be NaN
```

## Item 1 — builder's notes (filled in by the builder)

1. The engine's water volumes take the typed sparge water; they return the water left in the mash tun (mash + sparge − absorption − pre-boil at 60 °F) and how short the kettle will be (the negative of it, or 0). The S4 figures "what the kettle needs" and "mash water differs from it" go: the shortfall warning replaces the latter, and the negative-sparge FLAG goes with them (the roadmap line keeps the over-100 % share).
2. The sparge box is a number box on the card, under grain absorption, with "untreated" or "from the tank" beneath it; it is hidden, and not named when blank, with no sparge. The "Sparge water" read-only row becomes this box; "Water left in the mash tun" is a new read-only row; the printed sheet's volumes gain it too.
3. Changing the sparge water keeps the brewer's own salt and acid amounts (it changes no treated volume, as the S4 K row reads).
4. A format-5 recipe loads with the sparge blank (A1: blank until typed), its kept-in-tun figure dropped; format-2 brewery figures drop theirs; both are written back at 6 and 3.
5. Earlier scenarios: the S4 and S4b fixtures that typed 1 gal kept in the mash tun now type 8.5 gal of sparge (the same worked example); the assertions about the computed sparge and the "differs" warning become the left-in-tun figure and the shortfall warning; version pins move to recipe 6 and brewery 3.
