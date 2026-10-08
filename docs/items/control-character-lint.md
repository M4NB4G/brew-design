# A control-character test warns in the linter — Tier B (by path)

Status: agreed 2026-10-08 ("agree to all"); not started. Written by the S11
session; built in batch S13, item 3 (docs/ROADMAP.md, Sessions).

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
