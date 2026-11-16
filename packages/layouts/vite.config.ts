import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      include: ['src'],
      exclude: ['src/**/*.test.ts'],
      insertTypesEntry: true,
      processor: 'vue',
    }),
  ],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['vue', '@codemonster-ru/ui-runtime/core', '@codemonster-ru/ui-tokens', '@codemonster-ru/ui-vue'],
    },
  },
});
