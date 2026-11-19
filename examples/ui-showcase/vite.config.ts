import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
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
        case: resolve(import.meta.dirname, 'case.html'),
        layout: resolve(import.meta.dirname, 'layout-example.html'),
      },
    },
  },
  plugins: [
    vue(),
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
