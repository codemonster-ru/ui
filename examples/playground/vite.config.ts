import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath, URL } from 'node:url';
import { vueforgePlaygroundVirtualPlugin } from '../../packages/playground-vite-plugin/src/index';
import { expandVfBreakpointQueries, resolveVfBreakpointQuery } from '../../packages/theme/src/breakpoint-queries';

const showcaseSectionPattern = /^\/(overview|colors|core|layouts|icons|codeblock|playground)\/?$/;

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

function vueforgeBreakpointQueriesPlugin(): Plugin {
  return {
    name: 'vueforge-showcase-expand-breakpoint-queries',
    enforce: 'pre',
    transform(code, id) {
      const normalizedId = id.replace(/\\/g, '/').split('?', 1)[0];
      if (!normalizedId.includes('/packages/') || !normalizedId.includes('/src/') || !normalizedId.endsWith('.css')) {
        return null;
      }

      const { transformed, unknownAliases } = expandVfBreakpointQueries(code);
      if (unknownAliases.size > 0) {
        throw new Error(`Unknown breakpoint aliases in ${normalizedId}: ${[...unknownAliases].sort().join(', ')}`);
      }

      return transformed === code ? null : transformed;
    },
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'asset' || !output.fileName.endsWith('.css')) continue;

        const source = typeof output.source === 'string' ? output.source : new TextDecoder().decode(output.source);
        if (/@(?:media|container)[^{]*(--vf-bp-)/i.test(source)) {
          throw new Error(`Unresolved breakpoint alias in ${output.fileName}`);
        }
      }
    },
  };
}

type PostcssAtRule = {
  name: string;
  params: string;
};

function vueforgeBreakpointQueriesPostcssPlugin() {
  return {
    postcssPlugin: 'vueforge-showcase-expand-imported-breakpoint-queries',
    AtRule(atRule: PostcssAtRule) {
      if (atRule.name !== 'media' && atRule.name !== 'container') return;

      const match = atRule.params.match(/^([a-z_][a-z0-9_-]*\s+)?\(\s*(--vf-bp-[a-z0-9-]+)\s*\)$/i);
      if (!match) return;

      const query = resolveVfBreakpointQuery(match[2]);
      if (!query) {
        throw new Error(`Unknown breakpoint alias: ${match[2]}`);
      }

      atRule.params = `${match[1] ?? ''}${query}`;
    },
  };
}

vueforgeBreakpointQueriesPostcssPlugin.postcss = true;

export default defineConfig({
  css: {
    postcss: {
      plugins: [vueforgeBreakpointQueriesPostcssPlugin()],
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5175,
    strictPort: true,
  },
  plugins: [
    vueforgeBreakpointQueriesPlugin(),
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
        find: /^@codemonster-ru\/vueforge-core\/styles\.css$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/styles/components.css', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/foundation$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/foundation/index.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/theme$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/theme/public.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/skeleton$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/entries/skeleton.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/skeleton-gate$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/entries/skeleton-gate.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-layouts$/,
        replacement: fileURLToPath(new URL('../../packages/layouts/src/index.ts', import.meta.url)),
      },
      {
        find: /^@codemonster-ru\/vueforge-layouts\/composables\/useCssVarBreakpoints$/,
        replacement: fileURLToPath(
          new URL('../../packages/layouts/src/composables/useCssVarBreakpoints.ts', import.meta.url),
        ),
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
