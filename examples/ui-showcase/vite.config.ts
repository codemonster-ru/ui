import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import * as compiler from 'vue/compiler-sfc';
import { showcasePagesPlugin } from './showcase-pages-plugin.mjs';
import { workspaceDevelopment } from './workspace-development';

export default defineConfig(({ command, isPreview }) => ({
  appType: isPreview ? 'mpa' : 'spa',
  server: {
    host: '127.0.0.1',
    port: 5177,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        layout: resolve(import.meta.dirname, 'layout-example.html'),
      },
      output: {
        manualChunks(id) {
          if (/\/contracts\/[^/]+\/(?:manifest|cases\/[^/]+\.case)\.json$/u.test(id)) return 'showcase-cases';
        },
      },
    },
  },
  plugins: [
    // File watcher events can arrive before the plugin's buildStart hook.
    vue({ compiler }),
    command === 'serve' && !isPreview && workspaceDevelopment(),
    isPreview && {
      name: 'codemonster-showcase-preview-build',
      configurePreviewServer({ config }) {
        const entry = resolve(config.root, config.build.outDir, 'index.html');
        if (!existsSync(entry))
          throw new Error(`Missing Vue showcase build at ${entry}. Run npm run build:showcase first.`);
      },
    },
    showcasePagesPlugin(),
  ],
  resolve: {
    dedupe: ['vue'],
  },
}));
