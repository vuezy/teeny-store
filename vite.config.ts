/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineConfig } from 'vite';
import { coverageConfigDefaults } from 'vitest/config';
import dts from 'vite-plugin-dts';
import terser from '@rollup/plugin-terser';

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
          format: 'cjs',
          entryFileNames: 'teeny-store.cjs.js',
        },
        {
          format: 'umd',
          entryFileNames: 'teeny-store.umd.js',
          name: 'TeenyStore',
        },
        {
          format: 'iife',
          entryFileNames: 'teeny-store.iife.js',
          name: 'TeenyStore',
        },
        {
          format: 'umd',
          entryFileNames: 'teeny-store.umd.min.js',
          name: 'TeenyStore',
          plugins: [terser() as any],
        },
        {
          format: 'iife',
          entryFileNames: 'teeny-store.iife.min.js',
          name: 'TeenyStore',
          plugins: [terser() as any],
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
      exclude: ['dev/**', 'src/index.ts', ...coverageConfigDefaults.exclude],
    },
  },
  plugins: [dts({
    tsconfigPath: 'tsconfig.json',
    rollupTypes: true,
    outDir: 'dist/types',
  })],
});