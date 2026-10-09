// security-headers.spec.js
// The built app under the headers netlify.toml sets (the browser suite's server
// sends them, serve.mjs). Every other spec already fails on a policy violation;
// these show the policy is live, so a dropped header cannot pass silently.

import http from 'node:http';
import { test, expect } from './fixtures.js';

test('the page is sent the policy and the anti-framing header', async ({ page }) => {
  const response = await page.goto('/');
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("default-src 'self'");
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-frame-options']).toBe('DENY');
});

test('the policy blocks a script and a picture from outside the page', async ({ page, problems }) => {
  await page.goto('/');
  await page.waitForSelector('text=Brew');
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__planted = true';
    document.head.appendChild(script);
    new Image().src = 'https://example.com/planted.png';
  });
  // Chromium reports each block in its own time, and twice (its own message and
  // the page's listener, fixtures.js): wait for the listener's line for each.
  await expect.poll(() => problems.join('\n')).toContain('Content-Security-Policy violation: script-src-elem');
  await expect.poll(() => problems.join('\n')).toContain('Content-Security-Policy violation: img-src');

  expect(await page.evaluate(() => window.__planted)).toBeUndefined();
  problems.splice(0); // expected here, so not a failure
});

test('a page on another address cannot put the app in a frame', async ({ page, baseURL, problems }) => {
  // A parent page on its own port (another origin) frames the app, and frames
  // its own /child as the control: frames work, only the app refuses.
  const parent = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(
      req.url === '/child'
        ? '<body>child page</body>'
        : `<body>parent<iframe src="/child"></iframe><iframe src="${baseURL}/"></iframe></body>`,
    );
  });
  await new Promise((resolve) => parent.listen(0, resolve));
  try {
    await page.goto(`http://localhost:${parent.address().port}/`);
    await expect.poll(() => problems.join('\n')).toContain('frame-ancestors');
    problems.splice(0); // the refusal is expected here, so not a failure

    const child = page.frames().find((f) => f.url().endsWith('/child'));
    await expect(child.locator('body')).toHaveText('child page');
    expect(page.frames().some((f) => f.url().startsWith(baseURL))).toBe(false);
  } finally {
    parent.close();
  }
});
