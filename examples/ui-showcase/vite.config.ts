import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5177,
    strictPort: true,
  },
  preview: {
    port: 4173,
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        case: resolve(import.meta.dirname, 'case.html'),
      },
    },
  },
  plugins: [vue()],
  resolve: {
    dedupe: ['vue'],
  },
});
