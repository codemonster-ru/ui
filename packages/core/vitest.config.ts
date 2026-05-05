import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

const rootDir = __dirname;

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(rootDir, 'src'),
      '@codemonster-ru/vueforge-theme': resolve(rootDir, '../theme/src/index.ts'),
      '@codemonster-ru/vueforge-icons': resolve(rootDir, 'src/__tests__/mocks/vueforge-icons.ts'),
    },
  },
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
    server: {
      deps: {
        inline: ['@codemonster-ru/vueforge-icons'],
      },
    },
  },
});
