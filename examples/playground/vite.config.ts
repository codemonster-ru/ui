import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
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
        find: /^@codemonster-ru\/vueforge-core\/foundation$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/foundation/index.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-core\/theme$/,
        replacement: fileURLToPath(new URL('../../packages/core/src/theme/public.ts', import.meta.url))
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
        find: /^@codemonster-ru\/vueforge-codeblock$/,
        replacement: fileURLToPath(new URL('../../packages/codeblock/src/index.ts', import.meta.url))
      },
      {
        find: /^@codemonster-ru\/vueforge-playground$/,
        replacement: fileURLToPath(new URL('../../packages/playground/src/index.ts', import.meta.url))
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
