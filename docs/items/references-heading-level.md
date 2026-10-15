# The References page's heading steps down one level, Tier C

Status: landed 2026-10-15 as "On the References page, "References" is a
level-two heading, and the header's "Brew Design" is the page's only level-one
heading" (agreed 2026-10-15: "agree to all", R-1, RH-Q1, O-1 to O-5). Written
by the S19 session; built in the orchestrated run, batch O1, item 4
(docs/ROADMAP.md, Sessions).

## Why

Since S14 (BA3-S3) the header's "Brew Design" is the page's level-one
heading, and the References page keeps its own "References" heading at that
level, so a screen reader lists two (noticed building "The other
accessibility findings", S14 item 3, 2026-10-10).

## Sentences: what must be true afterwards

- **RH-S1** On the References page, "References" is a level-two heading, and the header's "Brew Design" is the page's only level-one heading.
- **RH-S2** The page looks the same: the heading keeps its style.
- **RH-S3** The browser suite's accessibility scan passes as before.

## Decisions: agreed 2026-10-15

| id | Question | Decision | Rule |
|---|---|---|---|
| RH-Q1 | "References" a second-level heading under the header's "Brew Design"? | Yes | One level-one heading per page, for screen readers |

Tier C (`components/ReferencesPage.jsx`, markup only).

## Scenarios: to be written first, must fail before

App: *the References page has one level-one heading, the header's "Brew
Design", and "References" at level two* (the app drawn whole in jsdom, the
page opened from the footer). Fails before: two level-one headings.

## Notes for the builder

- `ReferencesPage.jsx` draws `<h1 style={{ ...tokens.cardTitle, marginTop: 0 }}>References</h1>`;
  the page's model titles are already `h2`. Keep the style so it looks the
  same (RH-S2); look at it in a browser.
- The References page's byte-for-byte digests (`page-error.before.json`,
  `error-outside-the-tabs.before.json`) change: re-capture as the My
  ingredients item does (reproduce, change, capture; only the References
  digests differ), the old and new listed in the report.
- `npm run e2e` (the accessibility scan) runs on the change.
- `docs/TEST_COVERAGE.md` gets a scenario row; the roadmap line "The
  References page has two level-one headings" is removed.

## Builder's notes (landed 2026-10-15)

- Scenario `the References page has one level-one heading, the header's "Brew
  Design", and "References" at level two`
  (`apps/recipe/test/references-heading-level.test.js`) failed before
  (`expected [ 'Brew Design', 'References' ] to deeply equal [ 'Brew Design' ]`),
  passes after. The change is one tag pair in `ReferencesPage.jsx`, h1 to h2,
  the style object untouched.
- `notes-page.test.js` read the old level in two places and changed with it:
  the page's heading is matched as `<h2>` in place of `<h1>`, and the page's
  cards (split at each `<h2>`) now begin with "References", so the card list
  is checked as "References" followed by the models.
- The capture, re-run on the unchanged code, reproduced both stored digest
  files exactly. After the change only the References page differs:

  | File | Key | Old | New |
  |---|---|---|---|
  | `page-error.before.json` | References | a0de7bbe1d6e240d48414006d8981f04c2df424260818d4ffeaaa7df162c5442 | 9826698e716a321665a76e13685116adc785fb7502f689f87b8483b61c830019 |
  | `error-outside-the-tabs.before.json` | References | cbf0e2792421effeb22b57710053c0e577414bc18b8970943f24eb2c6b350de1 | 100980905358c8c006fe8b3ba96c6d51afe035478e05a3aa52795d77f7089a00 |

- `eslint.config.js` is unchanged (the new test touches no browser global
  itself).
- Far end (RH-S2): the built app in headless Chromium, References opened from
  the footer, the top of the page at 1200 by 900 before and after:
  `screens/O1-4-before.png` and `screens/O1-4-after.png`, byte-identical. The
  document outline in the browser reads H1 "Brew Design", H2 "References", then
  the model cards at H2. The browser suite (23 scenarios, with the
  accessibility scan) passes (RH-S3).
