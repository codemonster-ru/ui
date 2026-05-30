import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';
import { vueforgePlaygroundVirtualPlugin } from '@codemonster-ru/vueforge-playground-vite-plugin';

export default defineConfig({
  plugins: [
    vue(),
    vueforgePlaygroundVirtualPlugin({
      entries: {
        'vue-runtime-smoke': fileURLToPath(new URL('./src/vitepress-demos/vue-runtime-smoke.ts', import.meta.url)),
        'custom-resolver-smoke': fileURLToPath(
          new URL('./src/vitepress-demos/custom-resolver-smoke.ts', import.meta.url)
        )
      }
    })
  ],
  resolve: {
    dedupe: ['vue'],
    alias: [
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL('../../packages/core/src/', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-core$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/styles\.css$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/styles/components.css', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/foundation$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/foundation/index.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/theme$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/theme/public.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/skeleton$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/entries/skeleton.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/skeleton-gate$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/entries/skeleton-gate.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-layouts$/,
        replacement: fileURLToPath(new URL('../../packages/layouts/src/index.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-layouts\/composables\/useCssVarBreakpoints$/,
        replacement: fileURLToPath(new URL('../../packages/layouts/src/composables/useCssVarBreakpoints.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-codeblock\/view$/,
        replacement: fileURLToPath(new URL('../../packages/codeblock/src/view.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-codeblock\/highlight$/,
        replacement: fileURLToPath(new URL('../../packages/codeblock/src/highlight.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-playground\/ui$/,
        replacement: fileURLToPath(new URL('../../packages/playground/src/ui.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-playground\/runtime$/,
        replacement: fileURLToPath(new URL('../../packages/playground/src/runtime.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-playground-core$/,
        replacement: fileURLToPath(new URL('../../packages/playground-core/src/index.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-theme$/,
        replacement: fileURLToPath(new URL('../../packages/theme/src/index.ts', import.meta.url))
      }
    ]
  }
});
