// Playwright config for the browser suite (npm run e2e at the repository root).
// It runs the built app, served with the headers netlify.toml sets, in
// Chromium. Install the browser once with `npx playwright install chromium`;
// BREW_CHROMIUM names a Chromium to use instead.
import { defineConfig } from '@playwright/test';

const PORT = 4175;

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  // Each test starts from a fresh browser context: no saved recipe carries over.
  fullyParallel: true,
  forbidOnly: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1200, height: 900 },
    acceptDownloads: true,
    launchOptions: { executablePath: process.env.BREW_CHROMIUM || undefined },
  },
  webServer: {
    command: 'node serve.mjs',
    cwd: import.meta.dirname,
    port: PORT,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
  },
});
