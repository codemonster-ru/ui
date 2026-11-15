import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@codemonster-ru/ui-runtime/core': resolve(import.meta.dirname, '../runtime/src/core/index.ts'),
      '@codemonster-ru/ui-tokens': resolve(import.meta.dirname, '../tokens/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
  },
});
