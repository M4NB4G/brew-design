# A control-character test warns in the linter — Tier B (by path)

Status: agreed 2026-10-08 ("agree to all"); landed 2026-10-09 as "The
file-name pattern's control characters carry a note telling the linter they
are deliberate, and the linter reports nothing". Written by the S11 session;
built in batch S13, item 3 (docs/ROADMAP.md, Sessions).

## Why

`npm run lint` shows one warning, `no-control-regex`, in `persistence.js`:
the pattern that rejects characters a file name cannot hold lists the
control characters on purpose. The linter's configuration keeps it a warning
for that file only (guard-rails F-Q4) until an Opus session settles it
(found building the linter, F1 item 2, 2026-10-06). No figure changes.

## Sentences — what must be true afterwards

- **CR-S1** The file-name pattern stays as it is, with a note on its line telling the linter the control characters are deliberate and why (a file name cannot hold them).
- **CR-S2** The linter's warning-only setting for `persistence.js` is removed: any new finding there is an error, as everywhere else.
- **CR-S3** `npm run lint` reports no errors and no warnings.
- **CR-S4** Nothing else changes: every exported file's name is as today, and no saved format changes.

## Decisions — agreed 2026-10-08 ("agree to all")

| id | Question | Decision | Rule |
|---|---|---|---|
| CR-Q1 | Keep the file-name pattern with a note on that line saying it is deliberate, or rewrite it? | Keep it, with the note | Smallest change; the file names the app writes stay identical (pinned by tests) |
| CR-Q2 | Remove the linter's "warning only" setting for that file, so any new finding there is an error? | Yes | One guard for every file; the warning-only setting existed only until an Opus session fixed this (F-Q4) |
| M1 | Builder model | Opus, high effort | The Models rule's default |
| M2 | Inspector model | Opus, default effort, a fresh session | The Models rule's default |
| K | Silent properties | None: no figure, no saved document, no behaviour changes | — |

## Scenarios — to be written first, must fail before

Tooling: *the linter reports nothing* (`npm run lint`: today 1 warning; afterwards 0 errors, 0 warnings; recorded as the failure). App: *file names are as today* (`recipe-file.test.js`'s file-name scenarios pass unchanged, including a name with control characters).

## Notes for the builder

- `apps/recipe/src/persistence.js` (`REJECTED_IN_FILE_NAME`): an `// eslint-disable-next-line no-control-regex` with its reason on the line before; `eslint.config.js`: the block that sets `no-control-regex` to `warn` for that file goes.
- Tier B by path (`persistence.js`), so inspected, though no number changes.
- Files likely touched: `apps/recipe/src/persistence.js`; `eslint.config.js`; `docs/TEST_COVERAGE.md` (a line if the linter's row names the warning).

## Builder's notes (S13, 2026-10-09)

Claims for the inspector to verify; none is a decision the sentences made.

- `persistence.js`: one line added above `REJECTED_IN_FILE_NAME`, `// eslint-disable-next-line no-control-regex -- …` with its reason (a file name cannot hold them). The pattern is byte for byte as it was (CR-S1, CR-Q1).
- `eslint.config.js`: the block setting `no-control-regex` to `warn` for `persistence.js`, and its comment, removed (CR-S2, CR-Q2). Shown: the same file without the note, linted through ESLint's stdin (no file changed), reports the line as an error, not a warning.
- Recorded failure (CR-S3): `npm run lint` before the change: `573:31 warning Unexpected control character(s) in regular expression: \x00, \x1f no-control-regex` / `1 problem (0 errors, 1 warning)`; after: no output, exit 0.
- CR-S4: `recipe-file.test.js` is unchanged and passes. Its control characters are a tab and a line break, which the collapse of spaces that follows would also remove, so a new guard, `control-character-lint.test.js` "file names are as today", checks characters only the pattern's range removes (\u0000, \u0001, \u0007, \u001f, \u007f) and that \u0080, past it, is kept. It passed before the change, as CR-S4 says nothing changes (a guard).
- `docs/TEST_COVERAGE.md`: the linter's row (F1 item 2) said the finding was set to warn; it now says the setting is gone. A new row for this item.
- Numbers introduced: none.
- Far end 2026-10-09 on the built app in Chromium: Export of a recipe named "Hazy", \u0001, "IPA" downloads "Hazy IPA 2026-10-09.json" (the name box itself dropped a typed \u007f); "Hazy: Take 2/3?" downloads "Hazy Take 2 3 2026-10-09.json"; an unnamed recipe "Brew Design recipe 2026-10-09.json".
