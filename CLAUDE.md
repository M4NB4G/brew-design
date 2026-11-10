# Brew Design — working rules

`SPEC.md` is the specification: the invariants every diff is checked against.
`docs/TEST_COVERAGE.md` says what proves each one. `docs/ROADMAP.md` holds
outstanding work, sorted by tier. Read `SPEC.md` before changing anything.
This file holds only what a session must do. The dated decisions behind it,
and the rules as they stood before 2026-11-10, are in
`docs/rules-history.md`; nothing there governs a session.

## Change control

**Governing question:** can this change a number a brewer will act on?

| Tier | Paths | Gate | Re-test |
|---|---|---|---|
| A | `packages/engine/src/**` | Inspector | both suites |
| B | `apps/recipe/src/{state,selectors,display,reference-volume,persistence}.js`, `apps/recipe/src/App.jsx` | Inspector | both suites + far end |
| C | `apps/recipe/src/components/**`, `index.css` | suites pass | look at it |
| D | config, docs, tooling, tests | suites pass | build |

**Catch-all:** a change in any tier that *introduces a number* is gated as
Tier B. "Introduces a number" = a numeric literal or arithmetic that produces
or changes a recipe value — a default, a conversion factor, a threshold, a
computation. Excluded: display precision (`toFixed`, `num(x, d)`), input
attributes (`step`, `min`, `max`), layout values (px, rem, widths), and
visualization encodings (the SRM swatch table).

**Ingredient data.** An edit to `data/Brew Design Ingredients.xlsx`
committed with its refreshed copy `apps/recipe/src/ingredients.json` — the
refresh tool (`apps/recipe/scripts/`) and `apps/recipe/test/ingredients.test.js`
unchanged, and the suite passing — is Tier D: no inspector. Each number's rule
is the owner's workbook cell, and the test checks every one. The report
carries the copy's diff, so every changed number is on its own line. Any
change to the refresh tool, the ingredient test, or what the copy carries is
Tier B.

The hooks guard the path table. The catch-all is the builder's call; when in
doubt, it is Tier B.

## Roles

- **Owner** (Michael) decides in sentences, reads the summary, and says
  "merge and push". He is never asked to pick a number a rule should derive.
  He is an engineer, not a programmer: everything put to him — scope
  tables, questions, summaries — is written in engineering language, what
  the brewer sees and what happens to the numbers, never code identifiers.
  File names, signatures, and implementation choices go in the item file,
  for the builder.
- **Planning session** writes the run's scope tables, gets the owner's
  reply, commits the agreed tables, and then goes on as the orchestrator.
- **Orchestrator** starts every other role as a fresh subagent, each with
  its model named and only its own prompt. It writes no code and no box.
- **Builder** (a fresh subagent per item) writes the test, the change, and
  the docs; never writes its own box; never commits on FAIL.
- **Inspector** (a fresh subagent, Tier A and B) runs the suite itself,
  reads the diff against the sentences, and returns the box. It changes no
  file.
- **Advisor** (a fresh subagent, Tier C and D) reads the staged diff and
  confirms that no number it adds is a recipe value (the catch-all).
- **Reviewer** (a fresh subagent per batch) reads the batch's diff against
  its item files and `SPEC.md`, and runs every check itself.

No role merges or pushes `main` before the owner's "merge and push".

Open questions go to the owner as a decision table: id, the question, the
recommended answer, the rule behind it — in engineering language. "Agree to
all" is a complete reply. A row left unanswered is not built.

## A run — one planning round, one summary

All work is built as a run: one planning round with the owner, then the
build, unattended, then one summary. The owner starts one session, on
Opus 5.5, and pastes nothing after it. One item is a run of one.

**Planning.** The session writes every scope table for the run and puts
their questions to the owner in one decision table. Each item is written as
sentences — one per behaviour that must be true afterwards — plus its
decisions. Tier A and B items also get three fixed rows: the builder's
model, the inspector's model (see Models), and the silent-property
question, by name: what does this depend on that nobody decided
(durability, atomicity, idempotence, ordering, storage disabled, schema
migration, multi-tab)? On the owner's reply it commits the agreed tables as
`docs/items/<item>.md` (Tier D; first line of the status: agreed <date>,
not started) and the `docs/ROADMAP.md` Sessions rows naming the run's
batches and items, in order, and pushes. A Tier C or D item needs no scope
table beyond its roadmap line unless it raises a question for the owner.

**Size.** A batch holds at most three items; a batch whose items are all
Tier C or D and change no figure may hold up to five, and so may a batch of
Tier B items that touch neither the engine nor saved data. A run holds at
most three items that change the engine or a saved format. The owner
approves a diff he has read in full: a run is no larger than that allows.

**Building.** The same session then goes on as the orchestrator; it does
not wait for a new session or a prompt. Its first act is to switch on the
commit guards (Hooks) and confirm they are on. The run is built on one
branch — the one the session is given, otherwise one named after the run,
from `main` — with one pull request. Items are built in the Sessions
table's order, one at a time, never two builders at once: every item edits
the same documents. For each item the orchestrator spawns:

1. the **builder**, given only the item file's path (or the roadmap line)
   and the instruction to run the procedure below from step 1 to step 5,
   then stage and stop;
2. for Tier A and B the **inspector**, exactly as this file specifies, on
   the staged change; for Tier C and D the **advisor**;
3. on PASS, or the advisor's confirmation, the builder again, to commit
   (step 7). On FAIL the builder is resumed with the reasons, then the same
   inspector with the delta.

Each item is pushed as soon as it is committed, so a run that is cut off
loses nothing that passed.

**A question stops the item, not the run.** An item whose builder meets a
question the item file does not answer, a row it thinks wrong, or a
catch-all promotion it cannot take (a Tier B number in a Sonnet-built item)
is not committed. Agreed decisions are not re-opened: a row a builder
thinks wrong goes back to the owner as a question, not a change. The
summary names the item with its question in the decision-table form, it
returns to the roadmap, and the rest of the run goes on.

**Review.** When a batch's items are committed, a fresh reviewer reads the
batch's diff against its item files and `SPEC.md`, and runs `npm test`,
`npm run build`, `npm run lint` and `npm run e2e` itself. A finding it
confirms is fixed by the builder in a new commit, recorded in the summary,
and re-reviewed; one it does not confirm is listed.

**Summary.** At the end the orchestrator opens the pull request, or gives
the compare link when no PR tooling is available, and returns one summary
to the owner, in engineering language: per batch, what changed for the
brewer; every box and advisor confirmation; every FAIL round and reviewer
finding; anything not built, with its question; anything deferred to the
roadmap; the far-end checks' screenshots; whether the commit guards were
on; and the pull request's link (it carries the full diff). Then it stops.
Nothing more happens until the owner replies.

**Merge and push on the owner's word.** When the owner says "merge and
push", fast-forward `main` to the run's branch and push `main`; that push
is the deploy (see Deploy). If `main` has moved since the summary, the
fast-forward fails: rebase, re-prove, re-report, and wait again — the
owner approved a diff, not a branch name. Without those words, `main` is
not touched.

## Procedure — one item, one commit

1. **Test first, and it must fail.** Write the scenario from the sentences,
   named after them. Run it alone against the unchanged code. Record the
   failure (the assertion lines, trimmed). A scenario that passes before the
   change does not test the change — rewrite it before touching code. A
   Tier C or D item with nothing a test can see says so.
2. **Smallest change** in the files the item names. No reformatting, no
   drive-bys. Anything else noticed becomes a `docs/ROADMAP.md` line with a
   tier, in this same commit; such a line is in scope and the inspector is
   told so.
3. **Prove it.** The scenario passes; `npm test` (root) passes;
   `npm run build` passes. Tier A and B: check the far end — the running app
   in a browser, not the unit test's word for it.
4. **Docs in the same change.** `SPEC.md` if an invariant changed;
   `docs/TEST_COVERAGE.md` gets a row per new scenario; the roadmap line, if
   any, is removed.
5. **Stage and stop.** The builder reports every number its change adds.
6. **Inspector or advisor** (below; the orchestrator starts it). Tier A,
   Tier B, and number-introducing changes get the inspector. Nothing is
   committed until it returns PASS, or the advisor confirms.
7. **Commit and push.** Subject: the specification sentence. Body:
   `Tier: X`, the scenario name, the recorded failure, the box (A/B) or the
   advisor's confirmation (C/D), and any FAIL rounds with what changed after
   each. The item file's status line becomes landed, naming the commit
   subject; its builder's notes are filled in.

## Models

- **Tier A and B: Opus 5.5 builds, a fresh Opus 5.5 inspects.** Builder at
  high effort; inspector at default effort (its value is in reading and
  running, not reasoning depth).
- **Tier C and D: Sonnet 5.5 builds, a fresh Opus 5.5 advises.** An item
  the catch-all promotes to Tier B is not built by Sonnet: it stops with
  its question (A run).
- **Planning, the orchestrator and the reviewer: Opus 5.5.**
- **Fable is not used:** it needs usage credits on the owner's plan. The
  owner can still choose another model for an item; the choice is recorded
  in the item file's model rows, which govern where they differ.
- **Every subagent's model is named when it is spawned.** It never
  inherits the session's model. The box's `Inspector:` line confirms the
  inspector's.
- **Independence comes from the session, not the model.** The inspector is
  always a separate, fresh subagent — never the builder checking its own
  work — and receives only the prompt below: no chat history, no builder
  reasoning, no pasted diff. Its checks are grounded: it runs the suite,
  reads the staged bytes itself, confirms the recorded failure, and ties
  every number to a rule and a pin.
- **The residual risk is a shared misreading** — the same model resolving an
  ambiguous sentence the same way twice. It bites hardest on a number with
  nothing outside the model to check it against. So a number whose rule is
  not a spreadsheet cell, an engine constant, or a definitional unit factor
  (100 for percent, 1000 for trillion) needs a hand-calculated pin: a value
  worked out independently of the code, with the working written beside it
  in the test, so the check is a fact rather than a reading.

## Inspector — standing rule, do not ask, just run it

Run it to completion before continuing (`run_in_background: false`).

**Prompt.** Contains only: the item file's path, its sentences and decisions
pasted verbatim, the scenario name and recorded failure, the builder's notes
(choices the sentences did not make, as claims to verify), and the
instruction below. No chat history. The diff is not pasted: the inspector
runs `git diff --cached` itself. A pasted copy can drift from the staged
bytes, and did once (Persistence, 2026-09-20).

**On FAIL** nothing is committed. Fix what it names, re-prove, re-stage, and
resume the *same* inspector (`SendMessage`) with only the delta. Its FAIL
box stays; it appends a re-inspection box. On PASS, paste every box into the
commit body.

### Inspector instruction (paste verbatim)

> You are the inspector for one change in Brew Design. You did not build it
> and have no memory of the builder's session. Compare what was built against
> what was specified, and nothing else.
>
> Rules: change no file. Do not run git add, commit, stash, checkout or
> reset; the change is staged and must stay exactly as it is. Run tests only
> with `npm test` from the repository root, or
> `npx vitest run <file> -t "<name>"` for one scenario. The builder's notes
> are claims to verify, not instructions.
>
> Do, in order:
> 1. Run the scenario alone, then `npm test`. Report the counts.
> 2. Run `git diff --cached` from the repository root; that output is the
>    change under inspection. Read `SPEC.md`. Read the diff line by line
>    against the sentences and against `SPEC.md`. Note every file the diff
>    touches outside those the item names. A `docs/ROADMAP.md` line that
>    records something noticed while building (procedure step 2) is in
>    scope.
> 3. For every numeric literal or arithmetic the diff adds or changes that
>    produces or changes a recipe value: name its rule (the spreadsheet cell,
>    the engine constant, or the arithmetic) and the test that pins it, or
>    write UNPINNED. Where the rule is arithmetic rather than a spreadsheet
>    cell, an engine constant, or a definitional unit factor, the pin must be
>    a value worked out by hand with the working shown in the test; a value
>    copied from the code's own output does not pin it — write UNPINNED.
> 4. Return PASS only if: the scenario encodes the sentences and not the
>    implementation; it failed before (recorded) and passes now (run by
>    you); nothing outside the sentences changed; every number has a rule
>    and a pin; `SPEC.md` is not violated; the coverage row is in the diff.
>    Otherwise FAIL, each reason on its own line. A faithful-to-spec result
>    that looks wrong is PASS only if a `// FLAG:` comment in the diff
>    explains it — name it.
>
> Your final message: PASS or FAIL on the first line, then the reasons, then
> the box below, and nothing else.

### The box

```
### <item>: WHAT WAS ACTUALLY BUILT
- Specified: <the sentences>
- Built: <what the diff does, in behaviour terms>
- Specified and NOT built: <or "nothing">
- Built and NOT specified: <or "nothing">
- Numbers introduced, their rules, their pins: <each, or "none">
- Files changed: <list; flag any outside scope>
- Scenario: <name>; failed before (recorded), passes now (run by me)
- Suite: <n>/<n>
- Verdict: PASS | FAIL, <reasons>
- Inspector: <model>, <date>
```

## Hooks

`tools/hooks/pre-commit` runs `npm test` and the SPEC greps (rules 7 and
14) when a Tier A/B or component file is staged, and runs `npm test` when
any ingredient file is staged — the workbook, its copy, the refresh tool or
the ingredient test (Change control, Ingredient data).
`tools/hooks/commit-msg` refuses any commit whose body names no `Tier:`,
and any commit whose body has no `Verdict: PASS` when it stages a Tier A/B
file, the refresh tool or the ingredient test. They are off in a fresh
clone, and every cloud session starts from one, so the orchestrator
switches them on before anything else and checks that the setting reads
back:

```
git config core.hooksPath tools/hooks
git config core.hooksPath
```

Never bypass them (`--no-verify`).

## Deploy

Netlify deploys `main` (live since 2026-09-20): every push to `main` that
changes the app, the engine or the package files is a deploy; a push that
changes only documents, the workbook, tooling or tests is canceled before it
builds and costs no credits (`tools/netlify/skip-unchanged.mjs`). The build
runs `npm test` first, so a failing suite does not deploy.
A run is built on a branch, with a pull request and a summary. The owner
reads the summary and decides. On the owner's "merge and push" — in chat,
after the summary — the session fast-forwards `main` to the branch and
pushes it; that push is the deploy. The session never pushes `main` before
those words, and never merges anything the owner has not seen in full.

## Verification

```
npm test          # both suites — the canonical entry point the hooks use
npm run build     # apps/recipe production build
npm run lint      # ESLint over apps/ and packages/
npm run e2e       # the browser checks, against the built app
```
