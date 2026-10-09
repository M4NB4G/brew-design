# Browser suite

The brewer's main paths, run in a real Chromium on the built app, served with
the response headers `apps/recipe/netlify.toml` sets: edit, save and reload,
Home and Pro, Design to target OG, the Cost card, print, export and import,
and the security headers. It is not part of `npm test`: Netlify's build, the
pre-commit hook and the GitHub check run `npm test`, and none has a browser.

```
npx playwright install chromium   # once per machine
npm run e2e                       # at the repository root: builds, then runs
```

`npm run e2e` builds the app first, so the suite never runs a stale `dist/`.
`BREW_CHROMIUM=<path>` runs a Chromium already on the machine instead of the
one Playwright installs. Any page error, console error or Content-Security-
Policy violation fails the test that caused it (`fixtures.js`).

The pins are outside the app's code: Rev 4's cells through the smoke test's
reference recipe, and figures worked by hand beside the assertion. The built-in
recipe's own readings (OG 1.056, IBU 47) are today's output, used only to show
that a step leaves them alone.
