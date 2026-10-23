import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vitest reads this same config. The smoke test drives the state model and the
// unit-conversion boundary directly (no DOM rendering), so the 'node'
// environment is sufficient and keeps the correctness gate fast.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['test/**/*.test.js'],
    // Vitest 4 sets up the jsdom page before it puts its own console in
    // place, so jsdom reports to the console it found first; without this,
    // a test that watches the console for jsdom's reports (a reload asked,
    // way-out-of-page-error.test.js) would watch a console jsdom never uses.
    // With it, the tests and jsdom share the one console, as under Vitest 3.
    disableConsoleIntercept: true,
    // Under Vitest 4 the on-screen tests run past Vitest's 5-second limit for
    // one test on the owner's Windows computer (slowest seen 8.5 s warm, 59 s
    // on the first run after an install); this limit covers them with a
    // margin (the owner's decision T-1, 2026-10-23).
    testTimeout: 120000,
  },
});
