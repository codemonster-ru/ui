import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from 'vite';
import vue from '@vitejs/plugin-vue';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath, URL } from 'node:url';
import { vueforgePlaygroundVirtualPlugin } from '../../packages/playground-vite-plugin/src/index';
import { expandVfBreakpointQueries, resolveVfBreakpointQuery } from '../../packages/theme/src/breakpoint-queries';

const showcaseSectionPattern = /^\/(overview|colors|core|layouts|icons|codeblock|playground)\/?$/;
// The Input showcase (M08) is a separate document, not a section of the shell,
// so the six historical routes keep rendering exactly the markup the frozen
// baseline recorded.
const inputShowcasePattern = /^\/input\/?(\?.*)?$/;
const iconButtonShowcasePattern = /^\/icon-button\/?(\?.*)?$/;
const fieldShowcasePattern = /^\/field\/?(\?.*)?$/;
const buttonShowcasePattern = /^\/button\/?(\?.*)?$/;
const textareaShowcasePattern = /^\/textarea\/?(\?.*)?$/;
const checkboxShowcasePattern = /^\/checkbox\/?(\?.*)?$/;
const radioShowcasePattern = /^\/radio\/?(\?.*)?$/;
const switchShowcasePattern = /^\/switch\/?(\?.*)?$/;

function vueforgeShowcaseHistoryFallback(): Plugin {
  const rewriteShowcaseSection = (req: IncomingMessage, _res: ServerResponse, next: (err?: unknown) => void) => {
    if (req.url && showcaseSectionPattern.test(req.url)) {
      req.url = '/';
    } else if (req.url && inputShowcasePattern.test(req.url)) {
      const [, query = ''] = req.url.split('?');
      req.url = query ? `/input.html?${query}` : '/input.html';
    } else if (req.url && iconButtonShowcasePattern.test(req.url)) {
      const [, query = ''] = req.url.split('?');
      req.url = query ? `/icon-button.html?${query}` : '/icon-button.html';
    } else if (req.url && fieldShowcasePattern.test(req.url)) {
      const [, query = ''] = req.url.split('?');
      req.url = query ? `/field.html?${query}` : '/field.html';
    } else if (req.url && buttonShowcasePattern.test(req.url)) {
      const [, query = ''] = req.url.split('?');
      req.url = query ? `/button.html?${query}` : '/button.html';
    } else if (req.url && textareaShowcasePattern.test(req.url)) {
      const [, query = ''] = req.url.split('?');
      req.url = query ? `/textarea.html?${query}` : '/textarea.html';
    } else if (req.url && checkboxShowcasePattern.test(req.url)) {
      const [, query = ''] = req.url.split('?');
      req.url = query ? `/checkbox.html?${query}` : '/checkbox.html';
    } else if (req.url && radioShowcasePattern.test(req.url)) {
      const [, query = ''] = req.url.split('?');
      req.url = query ? `/radio.html?${query}` : '/radio.html';
    } else if (req.url && switchShowcasePattern.test(req.url)) {
      const [, query = ''] = req.url.split('?');
      req.url = query ? `/switch.html?${query}` : '/switch.html';
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
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        input: fileURLToPath(new URL('./input.html', import.meta.url)),
        iconButton: fileURLToPath(new URL('./icon-button.html', import.meta.url)),
        field: fileURLToPath(new URL('./field.html', import.meta.url)),
        button: fileURLToPath(new URL('./button.html', import.meta.url)),
        textarea: fileURLToPath(new URL('./textarea.html', import.meta.url)),
        checkbox: fileURLToPath(new URL('./checkbox.html', import.meta.url)),
        radio: fileURLToPath(new URL('./radio.html', import.meta.url)),
        switch: fileURLToPath(new URL('./switch.html', import.meta.url)),
        badge: fileURLToPath(new URL('./badge.html', import.meta.url)),
        tag: fileURLToPath(new URL('./tag.html', import.meta.url)),
        divider: fileURLToPath(new URL('./divider.html', import.meta.url)),
        skeleton: fileURLToPath(new URL('./skeleton.html', import.meta.url)),
        avatar: fileURLToPath(new URL('./avatar.html', import.meta.url)),
        card: fileURLToPath(new URL('./card.html', import.meta.url)),
        skeletonGate: fileURLToPath(new URL('./skeleton-gate.html', import.meta.url)),
        panel: fileURLToPath(new URL('./panel.html', import.meta.url)),
        alert: fileURLToPath(new URL('./alert.html', import.meta.url)),
        progressSpinner: fileURLToPath(new URL('./progress-spinner.html', import.meta.url)),
      },
    },
  },
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
      // Shared plain data. The showcase reads the files that own this data; a
      // copy inside the example could disagree with the parity gate.
      {
        find: /^@vueforge\/input-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/input/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/icon-button-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/icon-button/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/field-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/field/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/button-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/button/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/textarea-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/textarea/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/checkbox-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/checkbox/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/radio-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/radio/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/switch-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/switch/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/badge-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/badge/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/tag-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/tag/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/divider-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/divider/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/skeleton-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/skeleton/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/avatar-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/avatar/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/card-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/card/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/skeleton-gate-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/skeleton-gate/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/panel-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/panel/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/alert-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/alert/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/progress-spinner-cases$/,
        replacement: fileURLToPath(new URL('../../contracts/progress-spinner/cases.json', import.meta.url)),
      },
      {
        find: /^@vueforge\/showcase-index$/,
        replacement: fileURLToPath(new URL('../shared/showcase-index.json', import.meta.url)),
      },
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
