/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser';
import license from 'rollup-plugin-license';

const LICENSE = `/*!
Teeny Store v<%= pkg.version %>
(c) 2025-PRESENT <%= pkg.author %>
Released under the MIT License
*/`;

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      fileName: 'teeny-store',
    },
    rollupOptions: {
      output: [
        {
          format: 'es',
          entryFileNames: 'teeny-store.esm.js',
        },
        {
          format: 'umd',
          entryFileNames: 'teeny-store.umd.js',
          name: 'TeenyStore',
          plugins: [
            license({ banner: LICENSE }),
          ],
        },
        {
          format: 'umd',
          entryFileNames: 'teeny-store.umd.min.js',
          name: 'TeenyStore',
          plugins: [
            terser() as any,
            license({ banner: LICENSE }),
          ],
        },
      ],
    },
    minify: false,
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['dev/**', 'docs/**', 'src/index.ts', ...coverageConfigDefaults.exclude],
    },
    reporters: ['default', 'junit'],
    outputFile: 'test-results.xml',
  },
  plugins: [dts({
    tsconfigPath: 'tsconfig.json',
    rollupTypes: true,
    outDir: 'dist/types',
  })],
});