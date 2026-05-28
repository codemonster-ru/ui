import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@codemonster-ru\/vueforge-core$/,
        replacement: fileURLToPath(new URL('./src/test-shims/vueforge-core.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-codeblock\/view$/,
        replacement: fileURLToPath(new URL('./src/test-shims/vueforge-codeblock.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-playground-core$/,
        replacement: fileURLToPath(new URL('./src/test-shims/vueforge-playground-core.ts', import.meta.url))
      }
    ]
  },
  test: {
    environment: 'jsdom'
  }
});
