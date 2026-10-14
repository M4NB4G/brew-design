# Engine comments cite their sources as the owner gave them, Tier A

Status: agreed 2026-10-14 ("agree to all", S18-Q0, EC-Q1, M); not started.
Written by the S17 session; built in batch S18, item 2 (docs/ROADMAP.md,
Sessions).

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
