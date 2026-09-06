// Builds the Vue parity page against a chosen tree root.
//
// PARITY_TREE_ROOT selects which VfInput and which stylesheet are compiled: the
// immutable reference checkout for the reference target, the working tree for
// the current target. Only sources move; the compiler is the same in both
// builds, so a difference in the output can only come from the sources.
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const treeRoot = process.env.PARITY_TREE_ROOT;
const outDir = process.env.PARITY_OUT_DIR;

if (!treeRoot || !outDir) {
  throw new Error('PARITY_TREE_ROOT and PARITY_OUT_DIR must be set.');
}

const repositoryRoot = fileURLToPath(new URL('../../../', import.meta.url));

export default defineConfig({
  // Vue's source reads process.env.NODE_ENV; a library build does not define it.
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@parity/cases.json', replacement: resolve(repositoryRoot, 'contracts/input/cases.json') },
      { find: /^@parity\/core\//, replacement: `${resolve(treeRoot, 'packages/core/src')}/` },
      // The core sources use `@/` internally.
      { find: /^@\//, replacement: `${resolve(treeRoot, 'packages/core/src')}/` },
      // The built icons entry, because the icons package uses the same `@/`
      // prefix as core and the two would collide.
      {
        find: '@codemonster-ru/vueforge-icons',
        replacement: resolve(treeRoot, 'packages/icons/dist/index.ts.mjs'),
      },
      { find: '@codemonster-ru/vueforge-theme', replacement: resolve(treeRoot, 'packages/theme/src/index.ts') },
      {
        find: '@codemonster-ru/vueforge-shared-core',
        replacement: resolve(treeRoot, 'packages/shared-core/src/index.ts'),
      },
    ],
  },
  build: {
    lib: {
      entry: fileURLToPath(new URL('vue-cases-entry.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'vue-cases.js',
    },
    outDir,
    emptyOutDir: true,
    cssCodeSplit: false,
  },
});
