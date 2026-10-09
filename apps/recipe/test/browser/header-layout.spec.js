// header-layout.spec.js
// Where the header puts the unit switches (docs/items/header-unit-toggles.md,
// HU-S1 to HU-S3). Positions are read from the page itself: a switch is on a row
// when its box's top is level with the others', under another when its top is
// below that one's bottom.

import { test, expect } from './fixtures.js';

const ACTIONS = ['Export', 'Import', 'Reset to defaults', 'Print recipe'];

const box = async (page, name) => {
  const b = await page.getByRole('button', { name, exact: true }).first().boundingBox();
  expect(b, `no box for ${name}`).not.toBeNull();
  return b;
};
const boxes = async (page, names) => Promise.all(names.map((name) => box(page, name)));
const tops = (bs) => bs.map((b) => Math.round(b.y));
const level = (bs) => Math.max(...tops(bs)) - Math.min(...tops(bs)) <= 2;
const bottom = (bs) => Math.max(...bs.map((b) => b.y + b.height));
const top = (bs) => Math.min(...bs.map((b) => b.y));
const right = (bs) => Math.max(...bs.map((b) => b.x + b.width));

async function pro(page) {
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Pro', exact: true }).click();
}

test.describe('on a screen, 1200 px', () => {
  test('in Pro the four actions share a row and the five unit switches share a row under it', async ({ page }) => {
    await page.goto('/');
    await pro(page);
    const actions = await boxes(page, ACTIONS);
    const units = await boxes(page, ['°P', 'SG', 'bbl', 'gal', 'lb', 'sacks', '°F', '°C', 'Pro', 'Home']);

    expect(level(actions), `actions at ${tops(actions)}`).toBe(true);
    expect(level(units), `unit switches at ${tops(units)}`).toBe(true);
    expect(top(units)).toBeGreaterThanOrEqual(bottom(actions));
    // Right-aligned, and in the order they have always had: Pro/Home last.
    const lefts = units.map((b) => b.x);
    expect(lefts).toEqual([...lefts].sort((a, b) => a - b));
    expect(Math.abs(right(units) - right(actions))).toBeLessThanOrEqual(4); // a switch sits 3 px inside its pill
  });

  test('at Home the four actions share a row and °F/°C and Pro/Home share a row under it', async ({ page }) => {
    await page.goto('/');
    const actions = await boxes(page, ACTIONS);
    const units = await boxes(page, ['°F', '°C', 'Pro', 'Home']);

    expect(level(actions)).toBe(true);
    expect(level(units), `unit switches at ${tops(units)}`).toBe(true);
    expect(top(units)).toBeGreaterThanOrEqual(bottom(actions));
  });
});


test.describe('on a phone, 375 px', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('in Pro, Pro/Home stays beside the brand and the other switches sit in a row under the actions', async ({ page }) => {
    await page.goto('/');
    await pro(page);
    const brand = await page.getByText('Design', { exact: true }).first().boundingBox();
    const mode = await boxes(page, ['Pro', 'Home']);
    const actions = await boxes(page, ACTIONS);
    const others = await boxes(page, ['°P', 'SG', 'bbl', 'gal', 'lb', 'sacks', '°F', '°C']);

    // Pro/Home is on the brand row, above the actions.
    expect(level(mode)).toBe(true);
    expect(mode[0].y).toBeLessThan(bottom(actions) - 1);
    expect(Math.abs(mode[0].y + mode[0].height / 2 - (brand.y + brand.height / 2))).toBeLessThan(brand.height + 12);
    // The others are all under the four actions, none on the brand row.
    expect(top(others)).toBeGreaterThanOrEqual(bottom(actions));
    // ...and the page does not scroll sideways.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    // A switch that moved still works: °C changes the temperature boxes' labels.
    await page.getByRole('button', { name: '°C', exact: true }).click();
    await expect(page.getByLabel('Pre-boil volume measured at (°C)')).toBeVisible();
  });

  test('at Home, °F/°C sits in a row under the actions and Pro/Home beside the brand', async ({ page }) => {
    await page.goto('/');
    const actions = await boxes(page, ACTIONS);
    const temperature = await boxes(page, ['°F', '°C']);
    const mode = await boxes(page, ['Pro', 'Home']);

    expect(top(temperature)).toBeGreaterThanOrEqual(bottom(actions));
    expect(bottom(mode)).toBeLessThanOrEqual(top(actions) + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});
