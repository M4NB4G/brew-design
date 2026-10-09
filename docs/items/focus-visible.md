# Keyboard focus and hover visible, Tier C

Status: agreed 2026-10-09 ("agree to all", FV-Q1 to FV-Q3); not started.
Written by the S13 session; built in batch S14, item 2 (docs/ROADMAP.md,
Sessions).

## Why

All styling is inline (347 style objects), which cannot express focus or
hover states, so every box and button relies on the browser's default focus
ring (structural review, 2026-10-06; WCAG 2.2 criterion 2.4.7).

## Sentences: what must be true afterwards

- **FV-S1** Every button, box, choice, tab and link that has keyboard focus shows a 2 px outline in the input-focus blue, set slightly off its edge. A mouse click does not draw it; the keyboard does.
- **FV-S2** Buttons and tabs shade slightly under the mouse.
- **FV-S3** The outline's colour comes from the shared style file; no colour is written in the stylesheet, and SPEC rule 14 says so.
- **FV-S4** Nothing else changes: no figure, saved document or printed sheet; the page looks as today when nothing is focused or hovered.

## Decisions: agreed 2026-10-09

| id | Question | Decision | Rule |
|---|---|---|---|
| FV-Q1 | How is keyboard focus made visible? | One page-wide rule: a 2 px outline in the input-focus blue around whichever button, box or choice has focus; the inline styling stays | WCAG 2.4.7 asks for a visible focus; one rule covers every element; moving 347 inline styles changes every file for no visible gain |
| FV-Q2 | Buttons and tabs shade under the mouse? | Yes, by the same rule | It shows what a click will hit; WCAG does not require it |
| FV-Q3 | Where does the page-wide rule get its colour? | From the shared style file; SPEC 14 gains a sentence saying so | Rule 14 keeps one colour source |
| M1 | Builder; inspector | Sonnet 5.5 builds, Opus advises; no inspector (Tier C) | CLAUDE.md, Models (Tier C and D trial) |

## Proof: Tier C, "look at it"

A browser scenario (`apps/recipe/test/browser/`) that fails before: Tab from
the page's start reaches Export, a tab, a number box and a choice, and each
shows an outline 2 px wide in the focus colour; a mouse click on a button
shows none; a hovered button's background differs from its resting one.
Screenshots of a focused box, button and tab, before and after.

## Notes for the builder

- `index.css` takes the rule (`:focus-visible` for the outline, `button:hover` for the shade, for example a small brightness change, which needs no colour). Its header comment ("Do not add component rules here") allows a global rule; say in the comment that this is one.
- The colour: `colors.inputBorderFocus` in `components/shared/styles.js`, handed to the stylesheet as a CSS custom property set from a component (a `<style>` element or the root's style), so the stylesheet names the property and no hex. The pre-commit hook's rule 14 grep reads `components/` only; `index.css` already holds two colours from before (the body's), which this item does not touch. Keep any setter in `components/**`: `main.jsx` and `App.jsx` are outside Tier C (App.jsx is Tier B).
- SPEC rule 14 gains one sentence: the stylesheet's page-wide rules take their colours from `styles.js`. SPEC is Tier D.
- The printed sheet is unaffected: the rule applies on screen only (`@media screen`, or the sheet has no focusable elements).
