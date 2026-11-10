// impossible-entries.spec.js
// "An entry that cannot be is refused" (docs/items/impossible-entries.md,
// IE-S1 to IE-S6; Tier B), typed key by key in a real browser, where a
// number box reports a minus sign alone as no figure at all (K, Typing): the
// jsdom scenarios (impossible-entries.test.js) cannot see that. The built-in
// recipe's readings (IBU 47, OG 1.056, efficiency 75 %) are today's output,
// used only to show that a refused entry leaves them alone.
//
// In °C (IE-S6, IE-Q1): 213 °F = (213 − 32) × 5 / 9 = 905 / 9 = 100.556 °C,
// "100.56"; 101 °C = 101 × 1.8 + 32 = 213.8 °F, refused.

import { test, expect, stat, exportRecipe, importRecipe } from './fixtures.js';

const lineUnder = (page, label) => page.getByLabel(label).locator('xpath=ancestor::*[.//*[@role="alert"]][1]').getByRole('alert');

test('a minus sign typed key by key saves nothing, and −1 is refused with a line under the box', async ({ page }) => {
  await page.goto('/');
  const box = page.getByLabel('Wt (oz), Magnum');
  await box.click();
  await box.press('Control+a');
  await box.pressSequentially('-');
  await expect(stat(page, 'IBU'), 'a minus sign alone is no figure, so nothing is saved').toHaveText('47');
  await box.pressSequentially('1');
  await expect(lineUnder(page, 'Wt (oz), Magnum')).toHaveText('Negative: nothing is saved.');
  await expect(stat(page, 'IBU')).toHaveText('47');
  await box.blur();
  await expect(box).toHaveValue('1');

  await page.reload();
  await expect(page.getByLabel('Wt (oz), Magnum'), 'nothing was saved').toHaveValue('1');
});

test('120 typed in the efficiency is refused and the efficiency stays 75 %', async ({ page }) => {
  await page.goto('/');
  const box = page.getByLabel('Brewhouse efficiency %');
  await box.click();
  await box.press('Control+a');
  await box.pressSequentially('120');
  await expect(lineUnder(page, 'Brewhouse efficiency %')).toHaveText('Above 100 %: nothing is saved.');
  await box.blur();
  await expect(box).toHaveValue('75');
  await expect(stat(page, 'OG')).toHaveText('1.056');
});

test('a hop at 214 °F is refused, and at 101 °C as "Above 100.56 °C"', async ({ page }) => {
  await page.goto('/');
  const f = page.getByLabel('Temp (°F), Magnum');
  await f.click();
  await f.press('Control+a');
  await f.pressSequentially('214');
  await expect(lineUnder(page, 'Temp (°F), Magnum')).toHaveText('Above 213 °F: nothing is saved.');
  await f.blur();
  await expect(f).toHaveValue('212');

  await page.getByRole('button', { name: '°C', exact: true }).click();
  const c = page.getByLabel('Temp (°C), Magnum');
  await c.click();
  await c.press('Control+a');
  await c.pressSequentially('101');
  await expect(lineUnder(page, 'Temp (°C), Magnum')).toHaveText('Above 100.56 °C: nothing is saved.');
  await c.blur();
  await expect(c).toHaveValue('100');
});

test('a recipe file holding a negative loads as saved, is named, and its bitterness reads "—"', async ({ page }) => {
  await page.goto('/');
  const doc = JSON.parse((await exportRecipe(page)).text);
  doc.recipe.kettleAdditions[0].weightOz = -1;
  await importRecipe(page, JSON.stringify(doc));
  await expect(page.getByLabel('Wt (oz), Magnum')).toHaveValue('-1');
  await expect(page.getByRole('region', { name: 'Recipe figures' }).getByRole('status')).toHaveText(
    'Negative: Magnum weight — figures that depend on it show —',
  );
  await expect(stat(page, 'IBU')).toHaveText('—');
  await expect(stat(page, 'OG')).toHaveText('1.056');
});
