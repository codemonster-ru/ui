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
      insertTypesEntry: true,
      processor: 'vue',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(import.meta.dirname, 'src/index.ts'),
        historical: resolve(import.meta.dirname, 'src/historical.ts'),
      },
      fileName: (_, entryName) => `${entryName}.js`,
      formats: ['es'],
    },
    rollupOptions: {
      // Keep shared logic external so a consumer using both adapters can bundle it once.
      external: [
        'vue',
        '@codemonster-ru/ui-runtime/core',
        '@codemonster-ru/ui-runtime/data-table-dom',
        '@codemonster-ru/ui-runtime/native-modal',
        '@codemonster-ru/ui-icons',
        '@codemonster-ru/floater.js',
      ],
    },
  },
});
