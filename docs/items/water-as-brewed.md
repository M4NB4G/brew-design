# Water as brewed — S4b, five items

Status: agreed 2026-10-02 ("agree to all"); item 1 landed 2026-10-02 as "The sparge water is typed for each recipe; the water left in the mash tun is worked out, and a kettle that will be short says so"; item 2 as "Kettle salts bring the kettle water before the boil to the target, the mash's salts reaching it at the recipe's brewhouse efficiency, and the Water tab and the printed sheet show that kettle water"; item 3 as "The hot liquor tank reads HLT on screen and on the printed sheet, spelled out where it is first used"; item 4 as "While every My brewery figure is blank, a banner on every tab recommends setting them up; its Not now is kept in this browser until a figure is set"; item 5 as "The brewery's figures export as a file, byte for byte what this browser keeps, and import asks first, never touches the recipe, and refuses a file that is not one, is damaged or is newer". Written by the S4
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
  *Amended by the owner, 2026-10-02:* the label reads "Kettle water before the boil", followed by "Consider these estimates until confirmed with lab sampling." in place of "— mash salts at the recipe's brewhouse efficiency; the water and its salts, not the wort's minerals".
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

## Item 2 — recorded failure (filled in by the builder)

```
packages/engine/test/water/volumes.test.js, describes "kettle water at the brewhouse efficiency — the engine" and "— the salts in the kettle" (5 failed / 5):
  × the mash salts reach the kettle at the brewhouse efficiency — TypeError: kettleShares is not a function
  × with no sparge the mash is well mixed — TypeError: kettleShares is not a function
  × a share never exceeds the whole — TypeError: kettleShares is not a function
  × a blank figure blanks the shares — TypeError: kettleShares is not a function
  × the salts in the kettle add up — TypeError: sumSalts is not a function
apps/recipe/test/kettle-water.test.js (5 failed / 5):
  × kettle salts bring the kettle water before the boil to the target — AssertionError: expected 10.199999999999998 to be close to 9.24
  × the Water tab shows the kettle water before the boil — TypeError: Cannot read properties of undefined (reading 'ions')
  × the kettle salts card says they bring the kettle water to the target — AssertionError: expected ' Water In Style Salts & Acid Notes Wh…' to contain 'These bring the kettle water (14.00 g…'
  × the printed sheet prints the kettle water — TypeError: Cannot read properties of undefined (reading 'label')
  × a blank figure the readout needs blanks it — AssertionError: expected 10.199999999999998 to be NaN
```

## Item 2 — builder's notes (filled in by the builder)

1. **The shares** (engine): with a sparge, the mash's salts reach the kettle at the efficiency; the kettle then holds efficiency × mash water gal-worth of mash liquor and the rest of its pre-boil volume is sparge water, so the sparge's salts reach it in the share (pre-boil − efficiency × mash water) ÷ sparge water. With no sparge, pre-boil ÷ mash water (C11). The shares are kept as the arithmetic gives them, past 0 and 1, with a FLAG and the roadmap line "Kettle shares past their limits" for the owner (the first build held them at 0 and 1; its inspector sent that choice back to the owner).
2. **The C11/C16 overlap** (as the table's notes say): no sparge uses pre-boil ÷ mash water, not the efficiency.
3. **The kettle salts**: the solver for the pre-boil volume of source water, less the mash's and sparge's shares (S4's salt balance function, unchanged), never below zero; no acid. "Already over the target" names a salt whose mash-and-sparge share is above the kettle's need (zero when the kettle needs none of it).
4. **The kettle water's figures**: the source water plus every salt in the kettle (the three shares added) over the pre-boil volume, by the engine's predicted-profile function with no acid; calcium, magnesium, sodium, sulfate, chloride and their ratio, each against the target with the screen's colours. A blank efficiency, pre-boil volume, sparge water (with a sparge) or test result blanks the kettle salts and the readout.
5. **Screen**: the Kettle Salts card's first line now reads "These bring the kettle water (X gal) to the <style> target."; the readout is its own "Kettle Water" card under the treated profile, with the label, the sparge assumption ("No sparge, the mash well mixed" / "Batch sparge, well mixed" / "Fly sparge, plug flow"), the boil and calcium/magnesium notes, and — with a sparge, where the efficiency is used — C17's bias note ("…the kettle salts come out slightly generous"), which the sheet prints too. **Sheet**: a caption with the label, assumption and boil note, and a Predicted / Target table, under the treated profile.
6. **SPEC rule 10** now describes the kettle water beside the treated profile; no wort mineral figure.
7. **Earlier scenarios** re-pinned by hand: S4's kettle salts at the built-in 75 % (10.5 g, 6.125 g; never below zero now with 25 g), the no-sparge shortfall now the mash-well-mixed case (3.25 g), the S4 scenario "no choice shows a kettle mineral figure" renamed "… a wort mineral figure; the kettle water only with kettle salts", the sheet's kettle line at its recipe's 93 % (9.0 g). S4's engine kettle-balance pins (10.2 g, 5.95 g) stand: the function is unchanged.
8. The engine comment the item-1 inspector noted ("comes to −1.8e-15") now says it does so at a pre-boil volume corrected to 60 °F.

## Item 3 — recorded failure (filled in by the builder)

```
apps/recipe/test/hlt-wording.test.js (1 failed / 1):
  × the hot liquor tank reads HLT, spelled out where it is first used — AssertionError: expected ' Water In Style Salts & Acid Notes Wh…' to contain 'The Hot Liquor Tank (HLT) first fill'
```

## Item 3 — builder's notes (filled in by the builder)

1. Wording only (Tier C): every "hot-liquor tank" and "tank" a brewer sees reads "HLT"; the treatment choice reads "The Hot Liquor Tank (HLT) first fill" wherever it is offered (Water tab, My brewery); a line "HLT = Hot Liquor Tank" sits under the Where the Water Goes heading, always; the printed sheet adds "(HLT = Hot Liquor Tank)" after the treatment in its Water caption when the HLT is treated. Names inside the code (the "tank" treatment choice, saved as before) are unchanged, so no saved recipe or brewery file changes.
2. Earlier scenarios' wording assertions updated to the new text; their figures unchanged.

## Item 4 — recorded failure (filled in by the builder)

```
apps/recipe/test/brewery-banner.test.js (3 failed / 3):
  × a banner recommends setting up My brewery while every figure is blank — TypeError: breweryBannerShown is not a function
  × "Not now" hides it in this browser until a figure is set and cleared again — TypeError: breweryBannerShown is not a function
  × setting any brewery figure hides the banner, and nothing else changes — TypeError: breweryBannerShown is not a function
```

## Item 4 — builder's notes (filled in by the builder)

1. The rule lives in the app's state module (shown while every brewery figure is blank and not dismissed; a set figure ends a dismissal); the dismissal in the persistence module under its own key, `brew-design.banner.brewery-not-now`, best-effort; the banner is its own small component; App draws it at the top of the page's content, so on every tab, and wires "Set up My brewery" to the Options tab and "Not now" to the dismissal.
2. "Until a figure is set and then cleared again" (BB-S2) is built as: any brewery change that leaves a figure set removes the stored dismissal; Forget then clears the figures and the banner returns. A dismissal while blank stays across reloads.
3. The banner's test reads App's wiring from its source (the suite has no DOM; App itself needs one), as earlier scenarios do.
4. SPEC rule 17 gains a sentence on the banner and its key.
5. While writing the scenario, its check that the banner touches no recipe first matched the banner's own words ("new recipes"); it was narrowed to code that could change a recipe before the build was judged.

## Item 5 — recorded failure (filled in by the builder)

```
apps/recipe/test/brewery-file.test.js (3 failed / 3):
  × the brewery file is the document this browser keeps — TypeError: p.exportBreweryDocument is not a function
  × importing a brewery file asks first and never touches the recipe — TypeError: p.exportBreweryDocument is not a function
  × a file that is not a brewery file, is damaged, or is newer is refused; an older one is read as storage reads it — TypeError: p.importBreweryFile is not a function
```

## Item 5 — builder's notes (filled in by the builder)

1. One reader for the brewery document, shared by storage and the file (versions 1, 2 and 3, upgraded as storage reads them); storage's save now writes the same text the export gives. A document with no brewery section (a recipe file, say) is "not a brewery file", not "newer", whatever its version.
2. Messages follow the recipe file's: "Not imported: this file is not a Brew Design brewery file, or it is damaged. Your brewery figures are unchanged." and "…saved by a newer version of Brew Design (file version N; this app reads up to version 3)…". The confirm reads "Replace your brewery's figures with those in "<file>"? The recipe on screen is unchanged."
3. Options: "Export my brewery figures" and "Import my brewery figures" beside the existing two buttons; a refusal shows under them until the next brewery-file action. The file is named "Brew Design brewery YYYY-MM-DD.json" (local date).
4. Import replaces the brewery's figures through the usual brewery change, so it is saved at once and ends a banner "Not now" when it brings a figure (item 4).
5. SPEC rule 17 gains the brewery file.
