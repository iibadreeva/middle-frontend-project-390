import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const apiProxy = {
  '/api': 'http://localhost:4010',
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(rootDir, 'src/shared'),
      '@features': path.resolve(rootDir, 'src/features'),
      '@entities': path.resolve(rootDir, 'src/entities'),
    },
  },
  server: {
    proxy: apiProxy,
  },
  preview: {
    proxy: apiProxy,
  },
  build: {
    outDir: 'dist',
  },
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./src/shared/test/setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
      {
        extends: true,
        test: {
          name: 'eslint',
          environment: 'node',
          include: ['eslint/**/*.test.mjs'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          environment: 'node',
          include: ['tests/**/*.spec.ts'],
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
