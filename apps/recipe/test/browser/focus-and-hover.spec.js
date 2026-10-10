// focus-and-hover.spec.js
// Keyboard focus and hover (docs/items/boxes-and-access.md, BA2-S1 to BA2-S4,
// S14-Q2): one ring for every box, button and choice that has the keyboard's
// focus, 2 px of the app's navy with a 2 px gap; buttons and tabs darken
// slightly under the pointer. Read from the page's computed styles.
//
// The navy is styles.js's textPrimary, #1f3147 = rgb(31, 49, 71), read by
// hand from the hex: 0x1f = 31, 0x31 = 49, 0x47 = 71.

import { test, expect } from './fixtures.js';

const NAVY = 'rgb(31, 49, 71)';

// The focused element's outline, as the browser draws it.
const ring = (page) =>
  page.evaluate(() => {
    const s = getComputedStyle(document.activeElement);
    return { style: s.outlineStyle, width: s.outlineWidth, color: s.outlineColor, offset: s.outlineOffset };
  });
const RING = { style: 'solid', width: '2px', color: NAVY, offset: '2px' };
// The tabs and pills ease every change over 0.15 s, so the ring is read once settled.

test('the keyboard ring is the same on a button, a tab, a number box, a text box and a choice (BA2-S1)', async ({ page }) => {
  await page.goto('/');
  // The first stop the keyboard reaches in the header is Export.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Export' })).toBeFocused();
  await expect.poll(() => ring(page)).toEqual(RING);

  // On by the keyboard to the Water tab (a button the script focused would not
  // show the ring: the browser shows it for the keyboard).
  const tab = page.getByRole('button', { name: 'Water', exact: true });
  for (let i = 0; i < 20 && !(await tab.evaluate((b) => b === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(tab).toBeFocused();
  await expect.poll(() => ring(page)).toEqual(RING);

  for (const name of ['Mash water (gal)', 'Weight (lb), Pale 2-Row', 'Malt type, Pale 2-Row', 'Name']) {
    const el = page.getByLabel(name, { exact: true });
    await el.focus();
    await expect(el).toBeFocused();
    await expect.poll(() => ring(page), { message: name }).toEqual(RING);
  }
});

test('a button and a tab darken slightly under the pointer, and only there (BA2-S2)', async ({ page }) => {
  await page.goto('/');
  const filter = (name) => page.getByRole('button', { name, exact: true }).first().evaluate((b) => getComputedStyle(b).filter);
  // The tabs and pills ease their changes over 0.15 s, so each is read once settled.
  expect(await filter('Export')).toBe('none');
  await page.getByRole('button', { name: 'Export' }).hover();
  await expect.poll(() => filter('Export')).toBe('brightness(0.94)');
  await page.getByRole('button', { name: 'Water', exact: true }).hover();
  await expect.poll(() => filter('Water')).toBe('brightness(0.94)');
  await expect.poll(() => filter('Export')).toBe('none');
});

test.describe('on a touch screen', () => {
  test.use({ isMobile: true, hasTouch: true, viewport: { width: 375, height: 800 } });

  test('a tapped button does not stay darkened (BA2-S2)', async ({ page }) => {
    await page.goto('/');
    const water = page.getByRole('button', { name: 'Water', exact: true });
    await water.tap();
    await expect(page.getByText('Water In', { exact: true })).toBeVisible();
    await expect.poll(() => water.evaluate((b) => getComputedStyle(b).filter)).toBe('none');
  });
});
