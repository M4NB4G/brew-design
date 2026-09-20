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

- **Owner** (Michael) decides in sentences, merges, and deploys. He is never
  asked to pick a number a rule should derive.
- **Builder** (the session) writes the scope table, the test, the change, and
  the docs; starts the inspector; never writes its own box; never commits on
  FAIL.
- **Inspector** (a fresh subagent) runs the suite itself, reads the diff
  against the sentences, and returns the box. It changes no file.

Open questions go to the owner as a decision table: id, the question, the
recommended answer, the rule behind it. "Agree to all" is a complete reply.
A row left unanswered is not built.

## Procedure — one item, one commit

1. **Scope table first.** Write the item as sentences — one per behaviour
   that must be true afterwards — plus its decisions. Tier A and B items
   also get three fixed rows: the builder's model, the inspector's model
   (see Models), and the silent-property question, by name: what does this
   depend on that nobody decided (durability, atomicity, idempotence,
   ordering, storage disabled, schema migration, multi-tab)? Get the
   owner's reply.
2. **Test first, and it must fail.** Write the scenario from the sentences,
   named after them. Run it alone against the unchanged code. Record the
   failure (the assertion lines, trimmed). A scenario that passes before the
   change does not test the change — rewrite it before touching code.
3. **Smallest change** in the files the item names. No reformatting, no
   drive-bys. Anything else noticed becomes a `docs/ROADMAP.md` line with a
   tier.
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
   with what changed after each.

## Models

Both the builder's and the inspector's model are decision rows in every
Tier A/B scope table — proposed by whoever writes the table, agreed by the
owner before building. They are never the same model. The box records the
inspector's.

- **Builder.** Recommend the strongest available model — Opus or Fable —
  for Tier A and B, at high effort. Sonnet is acceptable for Tier C and D.
- **Inspector.** Recommend a cross-family read when warranted — Tier A, or
  any number whose rule is not a spreadsheet cell or an engine constant:
  Fable when the builder is Opus or Sonnet, Opus when the builder is Fable.
  Otherwise recommend Sonnet when the builder is Opus, and Opus when the
  builder is Sonnet or Fable. Default effort; its value is in reading and
  running, not reasoning depth.

## Inspector — standing rule, do not ask, just run it

Run it to completion before continuing (`run_in_background: false`).

**Prompt.** Contains only: the scope-table sentences, the decisions, the
scenario name and recorded failure, the full `git diff --cached`, the
builder's notes (choices the sentences did not make, as claims to verify),
and the instruction below. No chat history.

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
> 2. Read `SPEC.md`. Read the diff line by line against the sentences and
>    against `SPEC.md`. Note every file the diff touches outside those the
>    item names.
> 3. For every numeric literal or arithmetic the diff adds or changes that
>    produces or changes a recipe value: name its rule (the spreadsheet cell,
>    the engine constant, or the arithmetic) and the test that pins it, or
>    write UNPINNED.
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

Netlify deploys `main`. The builder works on a branch and opens a PR; the
owner merges, and the merge is the deploy. The session never pushes `main`
and never triggers a deploy.

## Verification

```
npm test          # both suites — the canonical entry point the hooks use
npm run build     # apps/recipe production build
```
