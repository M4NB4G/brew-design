# The References page's heading steps down one level, Tier C

Status: agreed 2026-10-15 ("agree to all", R-1, RH-Q1, O-1 to O-5); not
started. Written by the S19 session; built in the orchestrated run, batch O1,
item 4 (docs/ROADMAP.md, Sessions).

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
