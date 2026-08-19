import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath, URL } from 'node:url';
import { vueforgePlaygroundVirtualPlugin } from '../../packages/playground-vite-plugin/src/index';

const showcaseSectionPattern = /^\/(overview|showcase|colors|core|layouts|icons|codeblock|playground)\/?$/;

function vueforgeShowcaseHistoryFallback(): Plugin {
  const rewriteShowcaseSection = (req: IncomingMessage, _res: ServerResponse, next: (err?: unknown) => void) => {
    if (req.url && showcaseSectionPattern.test(req.url)) {
      req.url = '/';
    }

    next();
  };

  return {
    name: 'vueforge-showcase-history-fallback',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(rewriteShowcaseSection);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(rewriteShowcaseSection);
    },
  };
}

export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
  },
  plugins: [
    vue(),
    vueforgeShowcaseHistoryFallback(),
    vueforgePlaygroundVirtualPlugin({
      entries: {
        'vue-runtime-smoke': fileURLToPath(new URL('./src/vitepress-demos/vue-runtime-smoke.ts', import.meta.url)),
        'custom-resolver-smoke': fileURLToPath(
          new URL('./src/vitepress-demos/custom-resolver-smoke.ts', import.meta.url),
        ),
      },
    }),
  ],
  resolve: {
    dedupe: ['vue'],
    alias: [
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL('../../packages/core/src/', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-core$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-codeblock\/view$/,
        replacement: fileURLToPath(new URL('../../packages/codeblock/src/view.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-codeblock\/highlight$/,
        replacement: fileURLToPath(new URL('../../packages/codeblock/src/highlight.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-playground\/ui$/,
        replacement: fileURLToPath(new URL('../../packages/playground/src/ui.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-playground\/runtime$/,
        replacement: fileURLToPath(new URL('../../packages/playground/src/runtime.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-playground-core$/,
        replacement: fileURLToPath(new URL('../../packages/playground-core/src/index.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-theme$/,
        replacement: fileURLToPath(new URL('../../packages/theme/src/index.ts', import.meta.url)),
      },
    ],
  },
});
