// main-paths.spec.js
// The brewer's main paths, run in a real browser on the built app: edit, save
// and reload, Home and Pro, Solve, the Cost card, print, export and import.
// The pins are outside the app's own code: Rev 4's cells (the smoke test's
// reference recipe, imported below) and figures worked by hand beside the
// assertion. The built-in recipe's own readings (OG 1.056, IBU 47) are today's
// output, used only to show that a step leaves them alone.

import { test, expect, stat, acceptNextDialog, exportRecipe, importRecipe, referenceRecipeFile } from './fixtures.js';

const maltRow = (page, malt) => page.locator('tr', { has: page.getByLabel(`Weight (lb), ${malt}`) });

test('a typed malt weight moves the grain shares and the gravity', async ({ page }) => {
  await page.goto('/');
  await expect(stat(page, 'OG')).toHaveText('1.056');
  await expect(maltRow(page, 'Pale 2-Row')).toContainText('90.9'); // 10 / (10 + 1) = 90.909 %

  await page.getByLabel('Weight (lb), Pale 2-Row').fill('12');
  await page.getByLabel('Weight (lb), Pale 2-Row').blur();

  await expect(maltRow(page, 'Pale 2-Row')).toContainText('92.3'); // 12 / (12 + 1) = 92.308 %
  const og = Number(await stat(page, 'OG').innerText());
  expect(og).toBeGreaterThan(1.056);
});

test('an edit is saved and is still there after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Weight (lb), Pale 2-Row').fill('12');
  await page.getByLabel('Weight (lb), Pale 2-Row').blur();
  await page.getByLabel('Pre-boil volume (gal)').fill('7.5');
  await page.getByLabel('Pre-boil volume (gal)').blur();
  const og = await stat(page, 'OG').innerText();

  await page.reload();

  await expect(page.getByLabel('Weight (lb), Pale 2-Row')).toHaveValue('12');
  await expect(page.getByLabel('Pre-boil volume (gal)')).toHaveValue('7.5');
  await expect(stat(page, 'OG')).toHaveText(og);
});

test('Pro scales the recipe on a yes, keeps its gravity, and Home scales it back', async ({ page }) => {
  await page.goto('/');

  const toPro = acceptNextDialog(page);
  await page.getByRole('button', { name: 'Pro', exact: true }).click();
  expect(await toPro).toContain('Scale this recipe to the Pro batch, 10 bbl?');

  // 10 bbl is 310 gal; the recipe's 5.5 gal become 310 gal, so every amount is
  // multiplied by 310 / 5.5 = 56.3636...: Pale 10 lb -> 563.636 lb.
  // The box shows 563.64 (the sheet's 0.01 lb) and the full figure with the
  // cursor in it (docs/items/boxes-and-access.md, BA1).
  const pale = page.getByLabel('Weight (lb), Pale 2-Row');
  await expect(pale).toHaveValue('563.64');
  await pale.focus();
  expect(Number(await pale.inputValue())).toBeCloseTo(563.6364, 3);
  await pale.blur();
  // Gravity, colour and bitterness stay (SPEC rule 8): OG is still 1.056 in SG.
  await page.getByRole('button', { name: 'SG', exact: true }).click();
  await expect(stat(page, 'OG')).toHaveText('1.056');
  await expect(stat(page, 'IBU')).toHaveText('47');

  const toHome = acceptNextDialog(page);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await toHome;
  expect(Number(await pale.inputValue())).toBeCloseTo(10, 6); // 563.6364 * 5.5 / 310
  await expect(stat(page, 'OG')).toHaveText('1.056');
});

test('Design to target OG writes weights that give the target', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Design to target OG').first().click();
  await page.getByLabel('Target OG SG').fill('1.050');
  await page.getByRole('button', { name: 'Solve', exact: true }).click();

  await expect(page.getByText(/for a target of 1\.050/)).toBeVisible();
  await expect(stat(page, 'OG')).toHaveText('1.050');
  // Lower than the built-in 1.056, so the weights came down.
  expect(Number(await page.getByLabel('Weight (lb), Pale 2-Row').inputValue())).toBeLessThan(10);

  await page.getByRole('button', { name: 'Undo solve' }).click();
  await expect(page.getByLabel('Weight (lb), Pale 2-Row')).toHaveValue('10');
  await expect(stat(page, 'OG')).toHaveText('1.056');
});

test('the Cost card prices a line, totals it and gives the cost per gallon', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Total —/)).toBeVisible(); // nothing priced yet

  await page.getByLabel('Price of Pale 2-Row ($/lb)').fill('1.2');
  await page.getByLabel('Price of Pale 2-Row ($/lb)').blur();

  // 10 lb at $1.20/lb = $12.00; over the 5.5 gal fermented, 12 / 5.5 = $2.18 a gallon.
  await expect(page.getByText('$12.00').first()).toBeVisible();
  await expect(page.getByText(/Total \$12\.00 · 5 lines unpriced/)).toBeVisible();
  await expect(page.getByText(/Per gal \$2\.18/)).toBeVisible();
});

test('Print recipe opens the print dialog on a sheet that replaces the page', async ({ page }) => {
  await page.addInitScript(() => {
    window.__printCalls = 0;
    window.print = () => {
      window.__printCalls += 1;
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Print recipe' }).click();
  expect(await page.evaluate(() => window.__printCalls)).toBe(1);

  // On screen the sheet is hidden; printed, it alone is shown.
  await expect(page.locator('.print-sheet')).toBeHidden();
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#root')).toBeHidden();
  const sheet = page.locator('.print-sheet');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('Recipe sheet', { ignoreCase: true });
  await expect(sheet).toContainText('Pale 2-Row');
  await expect(sheet).toContainText('10.00'); // the 10 lb of Pale, to the sheet's two decimals
});

test('Export writes the recipe file and Import reads it back', async ({ page }) => {
  await page.goto('/');
  const exported = await exportRecipe(page);
  expect(exported.name).toMatch(/\.json$/);
  const doc = JSON.parse(exported.text);
  expect(Number.isInteger(doc.version)).toBe(true);
  expect(doc.recipe.malts[0]).toMatchObject({ name: 'Pale 2-Row', weightLb: 10 });

  // The recipe the smoke test pins, imported: Rev 4's figures (Grist and Pitch Calc's
  // I3, K7, K8, I4 as the golden master reads them; IBU and cells exact).
  const asked = await importRecipe(page, await referenceRecipeFile(page));
  expect(asked).toMatch(/replace/i);
  await expect(stat(page, 'OG')).toHaveText('1.069'); // 1.0688522
  await expect(stat(page, 'FG')).toHaveText('1.014'); // 1.0137704
  await expect(stat(page, 'ABV')).toHaveText('7.6%'); // 0.0757708
  await expect(stat(page, 'SRM')).toHaveText('4.1'); // 4.1048543
  await expect(stat(page, 'IBU')).toHaveText('46');
  await expect(stat(page, 'Cells / billion cells')).toHaveText('570');
  await expect(page.getByLabel('Weight (lb), Golden Promise')).toHaveValue('27');
});

test('a file that is not a recipe is refused and the recipe on screen stays', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type=file]').setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a recipe') });

  await expect(page.getByRole('alert')).toContainText('Not imported');
  await expect(stat(page, 'OG')).toHaveText('1.056');
});
