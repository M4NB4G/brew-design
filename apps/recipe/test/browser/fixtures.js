// fixtures.js
// Shared setup for the browser suite: a `page` that fails its test on any
// script error, console error or Content-Security-Policy violation, the
// recipe the smoke test pins, and the stats bar's tiles.

import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// A Google Fonts request that cannot reach the network (offline, a proxy) is
// not the app's fault; a request the policy blocks is, and is reported below.
const FONT_HOSTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

// Playwright names the hand-over function `use`; it is `provide` here so the
// linter does not read it as a React hook.
export const test = base.extend({
  // Everything that went wrong in the page so far. A test that expects some of it
  // empties the list (problems.splice(0)).
  // eslint-disable-next-line no-empty-pattern -- Playwright reads the fixtures a function needs from this pattern; it needs none
  problems: async ({}, provide) => {
    const problems = [];
    await provide(problems);
    expect(problems, 'errors or policy violations in the page').toEqual([]);
  },
  page: async ({ page, problems }, provide) => {
    await page.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', (e) =>
        console.error(`Content-Security-Policy violation: ${e.violatedDirective} ${e.blockedURI}`),
      );
    });
    page.on('console', (m) => {
      if (m.type() === 'error' && !FONT_HOSTS.test(m.location().url)) problems.push(m.text());
    });
    page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
    await provide(page);
  },
});

export { expect };

// The value in a stats bar tile, by its label ("OG", "FG", "ABV", "SRM", "IBU",
// "Cells / billion cells").
export const stat = (page, label) =>
  page.locator(`xpath=//div[text()[1]="${label}"]/preceding-sibling::div[1]`);

// Accept the next confirm and return what it asked.
export function acceptNextDialog(page) {
  return new Promise((resolve) => {
    page.once('dialog', async (dialog) => {
      const message = dialog.message();
      await dialog.accept();
      resolve(message);
    });
  });
}

// Export the recipe on screen, as a brewer would: the file's name and text.
export async function exportRecipe(page) {
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export' }).click()]);
  return { name: download.suggestedFilename(), text: readFileSync(await download.path(), 'utf8') };
}

// Import a recipe file through the Import button's file box, accepting the question.
export async function importRecipe(page, text) {
  const asked = acceptNextDialog(page);
  await page.locator('input[type=file]').setInputFiles({ name: 'recipe.json', mimeType: 'application/json', buffer: Buffer.from(text) });
  return asked;
}

// The recipe the smoke test pins (apps/recipe/test/smoke.test.js, referenceState),
// as a recipe file: 27 lb Golden Promise and 2 lb Carafoam, 16 gal pre-boil,
// 12 gal fermented, five kettle hops and nine dry hops. Its figures, pinned
// there from Rev 4's cells and below from the same cells, are what the page
// must show after the file is imported. The file is made from the app's own
// export of its built-in recipe, so it is always in the format the app writes.
export async function referenceRecipeFile(page) {
  const doc = JSON.parse((await exportRecipe(page)).text);
  const { recipe } = doc;
  const malt = (name, weightLb, colorL) => ({ ...recipe.malts[0], name, weightLb, fgdb: 0.8, colorL, type: 'base' });
  const hop = (name, timeMin, wortTempF, weightOz, alphaAcidFraction) => ({
    ...recipe.kettleAdditions[0],
    name,
    timeMin,
    wortTempF,
    weightOz,
    alphaAcidFraction,
  });
  Object.assign(recipe, {
    malts: [malt('Golden Promise', 27, 2.2), malt('Carafoam', 2, 2.0)],
    efficiency: 0.93,
    apparentAttenuation: 0.8,
    preBoilVolGal: 16,
    boilOffRateGalPerHr: 1.5,
    boilTimeMin: 60,
    mashWaterGal: 13,
    kettleAdditions: [
      hop('Bravo', 60, 204, 2, 0.147),
      hop('Helios', 30, 204, 1, 0.19),
      hop('Citra LupoMAX', 20, 175, 2, 0.18),
      hop('Hopstiener 9326', 20, 175, 2, 0.06),
      hop('Helios', 20, 175, 1, 0.19),
    ],
    dryHops: [2, 2, 2, 2, 1, 1, 2, 2, 1].map((weightOz, i) => ({ ...recipe.dryHops[0], name: `DH${i + 1}`, weightOz })),
    fermentVolGal: 12,
  });
  return JSON.stringify(doc);
}
