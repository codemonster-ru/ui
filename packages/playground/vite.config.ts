import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      {
        find: /^@codemonster-ru\/vueforge-codeblock\/view$/,
        replacement: resolve(__dirname, '../codeblock/src/view.ts')
      }
    ]
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        ui: resolve(__dirname, 'src/ui.ts'),
        runtime: resolve(__dirname, 'src/runtime.ts')
      },
      cssFileName: 'index',
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`
    },
    rollupOptions: {
      external: [
        'vue',
        '@codemonster-ru/vueforge-playground-core',
        '@codemonster-ru/vueforge-codeblock/view',
        '@codemonster-ru/vueforge-core'
      ]
    }
  }
});
