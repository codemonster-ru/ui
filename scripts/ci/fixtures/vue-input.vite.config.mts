// Builds the Vue half of the mixed-ownership fixture.
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const repositoryRoot = new URL('../../../', import.meta.url);

export default defineConfig({
  // Vue's source checks process.env.NODE_ENV; a library build does not define
  // it, so the bundle would throw before mounting.
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^@\//, replacement: fileURLToPath(new URL('packages/core/src/', repositoryRoot)) },
      {
        find: '@codemonster-ru/vueforge-core/src/components/input/VfInput.vue',
        replacement: fileURLToPath(new URL('packages/core/src/components/input/VfInput.vue', repositoryRoot)),
      },
      {
        find: '@codemonster-ru/vueforge-shared-core',
        replacement: fileURLToPath(new URL('packages/shared-core/src/index.ts', repositoryRoot)),
      },
      {
        // The built icons entry, not its source: the icons package uses the
        // same `@/` alias prefix as core and the two would collide here.
        find: '@codemonster-ru/vueforge-icons',
        replacement: fileURLToPath(new URL('packages/icons/dist/index.ts.mjs', repositoryRoot)),
      },
      {
        find: '@codemonster-ru/vueforge-theme',
        replacement: fileURLToPath(new URL('packages/theme/src/index.ts', repositoryRoot)),
      },
    ],
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('vue-input-entry.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'vue-input.js',
    },
    outDir: fileURLToPath(new URL('packages/razor/dist', repositoryRoot)),
    emptyOutDir: false,
    cssCodeSplit: false,
  },
});
