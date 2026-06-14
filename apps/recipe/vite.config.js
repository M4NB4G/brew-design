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
  },
});
