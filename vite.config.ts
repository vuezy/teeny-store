import { defineConfig } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      exclude: ['dev/**', ...coverageConfigDefaults.exclude],
    },
  },
});