# Brew Design — working rules

`SPEC.md` is the specification: the invariants every diff is checked against.
`docs/TEST_COVERAGE.md` says what proves each one. `docs/ROADMAP.md` holds
outstanding work, sorted by tier. Read `SPEC.md` before changing anything.
The method these rules implement is Fable's `METHOD.md` (builder and
inspector); where this file is silent, that document governs.

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

The hooks guard the path table. The catch-all is the builder's call; when in
doubt, it is Tier B.

## Roles

- **Owner** (Michael) decides in sentences, reads the report, and says
  "merge and push". He is never asked to pick a number a rule should derive.
  He is an engineer, not a programmer: everything put to him — scope
  tables, questions, reports — is written in engineering language, what the
  brewer sees and what happens to the numbers, never code identifiers. File
  names, signatures, and implementation choices go in the item file, for
  the builder.
- **Builder** (the session) writes the scope table, the test, the change, and
  the docs; starts the inspector; never writes its own box; never commits on
  FAIL; never merges or pushes `main` before the owner's "merge and push".
- **Inspector** (a fresh subagent) runs the suite itself, reads the diff
  against the sentences, and returns the box. It changes no file.

Open questions go to the owner as a decision table: id, the question, the
recommended answer, the rule behind it — in engineering language (Roles).
"Agree to all" is a complete reply. A row left unanswered is not built.

## Procedure — one item, one commit

1. **Scope table first.** Write the item as sentences — one per behaviour
   that must be true afterwards — plus its decisions. Tier A and B items
   also get three fixed rows: the builder's model, the inspector's model
   (see Models), and the silent-property question, by name: what does this
   depend on that nobody decided (durability, atomicity, idempotence,
   ordering, storage disabled, schema migration, multi-tab)? Get the
   owner's reply. Commit the agreed table as `docs/items/<item>.md` (Tier
   D; first line of its status: agreed <date>, not started) and stop: the
   session that writes the table does not build it. Give the owner the
   kickoff prompt (see Handoff) for a new session.
2. **Test first, and it must fail.** Write the scenario from the sentences,
   named after them. Run it alone against the unchanged code. Record the
   failure (the assertion lines, trimmed). A scenario that passes before the
   change does not test the change — rewrite it before touching code.
3. **Smallest change** in the files the item names. No reformatting, no
   drive-bys. Anything else noticed becomes a `docs/ROADMAP.md` line with a
   tier, in this same commit; such a line is in scope and the inspector is
   told so.
4. **Prove it.** The scenario passes; `npm test` (root) passes;
   `npm run build` passes. Tier B: check the far end — the running app in a
   browser, not the unit test's word for it.
5. **Docs in the same change.** `SPEC.md` if an invariant changed;
   `docs/TEST_COVERAGE.md` gets a row per new scenario; the roadmap line, if
   any, is removed.
6. **Stage and run the inspector** (below) — Tier A, Tier B, and
   number-introducing changes. Nothing is committed until it returns PASS.
7. **Commit.** Subject: the specification sentence. Body: `Tier: X`, the
   scenario name, the recorded failure, the box (A/B), and any FAIL rounds
   with what changed after each. The item file's status line becomes
   landed, naming the commit subject; its builder's notes are filled in.
8. **Report and wait.** Push the branch; open the PR, or give the compare
   link when no PR tooling is available. The report carries everything the
   owner needs to decide without opening anything else: what landed, the
   verdict and every box, any FAIL rounds, anything deferred to the
   roadmap, the PR link, and the full diff (`git diff main...<branch>`).
   Then stop. Nothing more happens until the owner replies.
9. **Merge and push on the owner's word.** When the owner says "merge and
   push", fast-forward `main` to the branch and push `main`; that push is
   the deploy (see Deploy). If `main` has moved since the report, the
   fast-forward fails: rebase, re-prove, re-report, and wait again — the
   owner approved a diff, not a branch name. Without those words, `main`
   is not touched.

## Handoff — the session that writes the spec does not build it

After the owner agrees the scope table, the writing session commits
`docs/items/<item>.md` and stops. A new session builds from that file. The
kickoff prompt, with `<item>` filled in:

> You are the builder for one item in Brew Design
> (C:/Users/micha/Documents/Code/Brew-Design). Read, in order: `CLAUDE.md`,
> `SPEC.md`, `docs/items/<item>.md`. The item file holds the sentences, the
> agreed decisions — including your model and the inspector's — the scenario
> names, and notes from the session that wrote it. Do not re-open the
> decisions; a row you think is wrong goes back to the owner as a question,
> not a change.
>
> Then run `CLAUDE.md`'s procedure from step 2: branch `<item>` from `main`;
> write the scenarios first and run them alone — they must fail, and you
> record the failure; make the smallest change in the files the item names;
> prove it (scenario, `npm test`, `npm run build`, and for Tier A/B the far
> end in a browser); update the docs in the same change; stage; run the
> inspector exactly as `CLAUDE.md` specifies, with the model the item file
> names; commit once, with the box(es) in the body; push the branch, open
> the PR (or give the compare link), and report: what landed, the verdict
> and the box(es), any FAIL rounds, anything deferred to the roadmap, the
> PR link, and the full diff. Then stop and wait. `main` is merged and
> pushed only when the owner replies "merge and push" — that push deploys —
> and never on your own initiative. Stop after this one item.

## Models

Both the builder's and the inspector's model are decision rows in every
Tier A/B scope table — proposed by whoever writes the table, agreed by the
owner before building. The box records the inspector's.

- **Default: Opus builds, Opus inspects, every tier** (the owner's decision,
  2026-09-23). Builder at high effort; inspector at default effort — its
  value is in reading and running, not reasoning depth.
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
- **Fable and Sonnet** are not recommended by default. The owner can still
  choose either for an item; the choice is recorded in its model rows.

This departs from METHOD.md's cross-model inspection, on the owner's
decision; where the two differ, this section governs.

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
>    records something noticed while building (procedure step 3) is in
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
14) when a Tier A/B or component file is staged. `tools/hooks/commit-msg`
refuses any commit whose body names no `Tier:`, and any A/B commit whose
body has no `Verdict: PASS`. Activate once per clone:

```
git config core.hooksPath tools/hooks
```

Never bypass them (`--no-verify`).

## Deploy

Netlify deploys `main` (live since 2026-09-20): every push to `main` is a
deploy. The build runs `npm test` first, so a failing suite does not deploy.
The builder works on a branch, opens the PR, and reports (procedure
step 8). The owner reads the report and decides. On the owner's "merge and
push" — in chat, per item, after the report — the session fast-forwards
`main` to the branch and pushes it; that push is the deploy. The session
never pushes `main` before those words, and never merges anything the owner
has not seen in full.

## Verification

```
npm test          # both suites — the canonical entry point the hooks use
npm run build     # apps/recipe production build
```
