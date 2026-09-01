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
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      // The shared core stays external so a consumer using both adapters gets one copy of the
      // logic rather than an inlined duplicate per adapter.
      external: ['vue', '@codemonster-ru/ui-runtime/core'],
    },
  },
});
