# Persistence — Tier B

Scope table agreed by the owner ("agree to all") on 2026-09-20. Landed in the
commit whose subject is S1. The inspector's box is in that commit's body.

## Sentences — what must be true afterwards

- **S1** A recipe edited in the app is the recipe shown after a page reload in the same browser.
- **S2** The Home/Pro mode and the Pro gravity unit are also restored after a reload.
- **S3** "Reset to defaults" restores the default recipe and display settings and removes the saved copy.
- **S4** With nothing saved, the app starts on the defaults — unchanged from before.
- **S5** With unreadable saved data — not JSON, not an object, or a different schema version — the app starts on the defaults and does not crash.
- **S6** With storage unavailable — disabled, private mode, or throwing on quota — the app behaves exactly as before: nothing persists, nothing crashes.
- **S7** What is stored is the canonical state (SPEC rule 8), under one key, as one JSON document carrying a schema version.
- **S8** Saving is automatic on every change. There is no Save button.

## Decisions

| id | Question | Decision | Rule |
|---|---|---|---|
| M1 | Builder model | Opus, high effort | Models: strongest available for Tier B |
| M2 | Inspector model | Sonnet, default effort | Tier B with no unruled recipe number (`version: 1` is a schema tag, not a recipe value) → the other model |
| P1 | Durability | Per-browser, per-origin; gone if the user clears site data. Cross-device is the JSON-export roadmap item | localStorage is the cheapest thing that satisfies S1 |
| P2 | Schema migration | Payload carries `version: 1`; any other version → defaults. No migration code until a v2 exists | Never load a shape the code wasn't written for; no saved recipes exist yet |
| P3 | Storage unavailable | Every read and write in try/catch; on failure behave as if there is no storage | The app must never be worse than before (S6) |
| P4 | Multi-tab | Last write wins; no live cross-tab sync | Sync is unasked-for and adds a `storage`-event surface |
| P5 | Atomicity | One key, the whole state in one `setItem` call | `setItem` is atomic per key; one key means no partial state |
| P6 | Timing | Write synchronously on every state change; no debounce | State is under 2 KB; a debounce window is a reload that loses the last edit |
| P7 | Key | `brew-design.recipe` | One namespaced key; the version lives inside the payload |
| P8 | What persists | The recipe, `mode`, and `proGravityUnit` | S2 |
| P9 | Reset control | "Reset to defaults" in the header toggle row, with a confirm dialog | S3; destructive, so it confirms |
| P10 | Tier table | `App.jsx` and the new `persistence.js` added to Tier B and the hook regex | Governing question — a load bug changes every number on screen |

## Scenarios — `apps/recipe/test/persistence.test.js`

Written first; failed before the change on import (`Cannot find module '../src/persistence.js'`).

1. a saved recipe is restored on load, in canonical units, under one versioned key — S1, S7
2. a cleared field round-trips as NaN, never as 0 or null — S1 (property found while building; see notes)
3. display settings are restored on load — S2
4. reset removes the saved copy and load returns the defaults — S3
5. nothing saved yields the defaults — S4
6. unreadable saved data yields the defaults — S5, nine cases
7. unavailable storage is a no-op: load yields defaults, save and clear do not throw — S6

S8 and the wiring: far end, on the built app (`vite preview`), 2026-09-20 — edit pre-boil → reload holds; Pro → reload holds; Reset cancel → unchanged; Reset accept → reload defaults.

## Builder's notes — choices the sentences did not make

- **NaN.** JSON has no NaN. A cleared field (NaN in state) would be written as `null` and, on load, `null * x === 0` would silently turn it into 0 — a number a brewer acts on. Load restores `null` → NaN throughout the recipe. Scenario 2 pins it; SPEC rule 13 states it.
- **Readable means the whole document.** Beyond S5's list, a v1 document whose recipe lacks a top-level key of the default recipe (or has the wrong kind of value), or whose `mode` / `proGravityUnit` is outside its enum, is unreadable as a whole → defaults. One uniform rule, no half-loaded state. Array element shapes are not checked.
- **After Reset the autosave re-writes the defaults** under the key. The user's recipe is removed and a reload yields the defaults (S3); the key itself is not left absent.
- **Confirm dialog at the far end.** The browser pane auto-answers native `confirm` with cancel, which exercised the cancel path (no change). The accept path was driven with `window.confirm` stubbed to `true` for that one click; the stub did not survive the reload.
