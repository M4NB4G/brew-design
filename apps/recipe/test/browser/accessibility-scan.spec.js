// accessibility-scan.spec.js
// The other accessibility findings (docs/items/boxes-and-access.md, BA3-S1 to
// BA3-S5, S14-Q3, S14-Q4): an automated scan (axe-core, every rule it runs by
// default) of each tab and Water screen, in Home and in Pro, at 1200 and
// 375 px, finds nothing: no colour contrast below 4.5:1, no empty table
// header, no content outside a landmark, a level-one heading. axe-core is a
// test-only dependency; it is served from the page's own address, so the
// page's policy stays on.
//
// The greys on the page's gradient (the inactive tabs, the footer), which
// axe reports as "incomplete" rather than a finding, are proven by
// test/contrast.test.js's ratios worked from the colours.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test, expect } from './fixtures.js';

const AXE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

async function scan(page) {
  await page.addScriptTag({ url: '/__axe.js' });
  return page.evaluate(async () => {
    // No preload: axe would fetch the page's stylesheets itself, which the policy refuses.
    const result = await window.axe.run(document, { resultTypes: ['violations'], preload: false });
    return result.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.html.slice(0, 100)}`));
  });
}

for (const width of [1200, 375]) {
  for (const mode of ['Home', 'Pro']) {
    test(`${mode} at ${width} px: every tab and Water screen scans clean (BA3-S5)`, async ({ page }) => {
      await page.route('**/__axe.js', (route) => route.fulfill({ contentType: 'text/javascript', body: AXE }));
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      if (mode === 'Pro') {
        page.once('dialog', (d) => d.accept());
        await page.getByRole('button', { name: 'Pro', exact: true }).click();
      }
      const found = {};
      await page.getByRole('button', { name: 'Design to target OG' }).click();
      found.Recipe = await scan(page);
      await page.getByRole('button', { name: 'Water', exact: true }).first().click();
      for (const screen of ['Water In', 'Style', 'Salts & Acid', 'Notes']) {
        await page.getByRole('button', { name: screen, exact: true }).first().click();
        found[`Water, ${screen}`] = await scan(page);
      }
      await page.getByRole('button', { name: 'Options', exact: true }).first().click();
      found.Options = await scan(page);
      await page.getByRole('button', { name: 'References' }).click();
      found.References = await scan(page);
      expect(found).toEqual({
        Recipe: [],
        'Water, Water In': [],
        'Water, Style': [],
        'Water, Salts & Acid': [],
        'Water, Notes': [],
        Options: [],
        References: [],
      });
    });
  }
}
