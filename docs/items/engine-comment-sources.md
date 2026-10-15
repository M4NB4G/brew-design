# Engine comments cite their sources as the owner gave them, Tier A

Status: agreed 2026-10-14 ("agree to all", S18-Q0, EC-Q1, M); landed
2026-10-15 as "Engine comments cite their sources as the owner gave them:
the salt table Appendix C, p. 263, How to Brew 4th edition, The New IPA
self-published, the CRC Handbook for phosphoric acid, the 400B band Rev 4's
own rule". Written by the S17 session; built in batch S18, item 2
(docs/ROADMAP.md, Sessions).

## Why

Comments only, no figure. `water/salts.js` cites Palmer and Kaminski
Appendix A, pp. 281–283 for the salt table (the owner: Appendix C, p. 263,
as the Water Notes say); `water/styles.js` cites *How to Brew* (2006) and
*The New IPA* from White Mule Press (the owner: 4th ed., 2017, and
self-published); `water/acids.js` cites Troester's "An Overview of pH" for
phosphoric acid as monoprotic (the owner: the CRC Handbook). Also
`starter.js`: its "recorded deviation from Rev 3" for the 400B band is Rev
4's own rule since the owner corrected Rev 3's N11 (2026-10-08). Noticed
writing the References page's scope table (RF-Q10, 2026-10-08).

## Sentences: what must be true afterwards

- **EC-S1** The salt table's comment cites Palmer and Kaminski, *Water* (2013), Appendix C, p. 263.
- **EC-S2** The style table's comment cites *How to Brew*, 4th edition (2017), and *The New IPA* as self-published.
- **EC-S3** The comment on phosphoric acid as monoprotic cites the CRC Handbook of Chemistry and Physics.
- **EC-S4** The starter's comment on the 400B band says it is Rev 4's own rule (the owner's correction of Rev 3's N11, 2026-10-08), not a recorded deviation from Rev 3.
- **EC-S5** No figure changes: only comment lines change, and every engine and app test passes as before.

## Decisions: agreed 2026-10-14

| id | Question | Decision | Rule |
|---|---|---|---|
| EC-Q1 | Correct the source notes in the engine as the owner gave them on 2026-10-08? | Yes, as EC-S1 to EC-S4; no figure changes | Comments only; engine path, so inspected |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | None a comment can have: no figure, no saved document, no screen changes | — |

## Scenarios: to be written first, must fail before

Engine (a new test under `packages/engine/test/`): *each corrected citation
is in its file, and the old one is not* (the four files read as text, as
`purity.test.js` reads the engine's sources). It fails before on each old
citation.

## Notes for the builder

- Comments only. The Style screen's "Ref:" lines (`page_ref` in
  `water/styles.js`, e.g. "Palmer How to Brew p.393") are text the brewer
  sees, not comments, and are out of this item; if their pages do not match
  the 4th edition, that is a roadmap line for the owner.
- SPEC rule 2's paragraph on the 400B band already calls it Rev 4's rule;
  no SPEC change is expected.

## Builder's notes (S18, 2026-10-15)

Choices the sentences did not make, each a claim for the inspector:

- **The acid file's references.** Troester's "An Overview of pH" was cited
  for one thing only, phosphoric acid as monoprotic; with that note moved
  under the CRC Handbook's entry (EC-S3), Troester's entry cited nothing in
  this file and is removed. The CRC entry keeps its densities note.
- **The starter's two comments.** Both said "deviation": the file's head
  and the 400B band's own note. Both now say Rev 4's own rule, the owner's
  correction of Rev 3's N11 (2026-10-08), his rule since 2026-09-21, as
  SPEC rule 2 does. The head's "with one exception" goes with it: the
  boundary is now a transcription of Rev 4.
- **How the scenario reads the comments.** Block and line comments only,
  their markers dropped and white space run together, so a citation
  reads the same across a line break; a word in code does not count.
- **EC-S5, no figure.** Besides both suites, each changed file's code with
  its comments stripped was compared with the file before: identical. The
  built app is byte for byte the same (`index-Z8beB3gP.js`, the same
  SHA-256 before and after), so nothing a brewer sees changes; this item
  has no far end beyond that.
- **The Style screen's "Ref:" lines** (`page_ref`, e.g. "Palmer How to Brew
  p.393") are out of this item, as its notes say. Their pages (393, 412,
  414) fall within the 4th edition's Chapter 23, pp. 375-426, as the Water
  Notes cite it; I have no copy to check each page, so no roadmap line.
- **Roadmap.** "Engine comments cite the wrong sources" is removed. Noticed
  while building, outside the sentences: `starter.js`'s note above the
  bands still names Rev 3's 900 boundary ("The starter's FLAG note still
  names a 900 boundary", Tier A, comment only).
