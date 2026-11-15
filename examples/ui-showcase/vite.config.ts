import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { vueforgePlaygroundVirtualPlugin } from '@codemonster-ru/vueforge-playground-vite-plugin';
import { guidesPlugin } from './guides-plugin.mjs';

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
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          // Keep historical components and icon data out of the main gallery's startup path.
          if (/\/node_modules\/@codemonster-ru\/vueforge-(?:core|theme)\//u.test(id))
            return 'vueforge-playground-support';
          if (id.includes('/node_modules/@codemonster-ru/vueforge-icons/')) return 'vueforge-icons';
        },
      },
    },
  },
  plugins: [
    vue(),
    guidesPlugin(),
    vueforgePlaygroundVirtualPlugin({
      entries: {
        'vue-runtime-smoke': resolve(import.meta.dirname, 'src/playground/vue-runtime-smoke.ts'),
        'custom-resolver-smoke': resolve(import.meta.dirname, 'src/playground/custom-resolver-smoke.ts'),
      },
    }),
  ],
  resolve: {
    dedupe: ['vue'],
  },
});
