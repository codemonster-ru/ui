import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: [
        'vue',
        '@codemonster-ru/vueforge-playground-core',
        '@codemonster-ru/vueforge-codeblock',
        '@codemonster-ru/vueforge-core'
      ]
    }
  }
});
