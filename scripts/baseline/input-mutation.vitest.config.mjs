// Vitest config used only by check-input-characterization.mjs.
//
// It mirrors packages/core/vitest.config.ts and adds a plugin that rewrites
// VfInput.vue in memory when VUEFORGE_INPUT_MUTATION names a mutation. The file
// on disk is never touched, so a failed or interrupted run cannot leave an
// intentional defect behind in the source tree.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { inputMutations, inputSourcePath } from './input-mutations.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const corePackage = resolve(repositoryRoot, 'packages/core');
const defaultMutationFile = resolve(repositoryRoot, inputSourcePath);
const mutationId = process.env.VUEFORGE_INPUT_MUTATION ?? '';

function inputMutationPlugin() {
  if (!mutationId) {
    return { name: 'vueforge-input-mutation-disabled' };
  }

  const mutation = inputMutations.find((candidate) => candidate.id === mutationId);
  if (!mutation) {
    throw new Error(`Unknown VfInput mutation: ${mutationId}`);
  }

  return {
    name: 'vueforge-input-mutation',
    enforce: 'pre',
    load(id) {
      // A mutation may target the SFC or, since M05, a shared rule it consumes.
      const mutationFile = mutation.file ? resolve(repositoryRoot, mutation.file) : defaultMutationFile;
      const [path] = id.split('?', 1);
      if (path !== mutationFile) {
        return null;
      }

      const source = readFileSync(mutationFile, 'utf8');
      if (!source.includes(mutation.find)) {
        throw new Error(`Mutation ${mutation.id} no longer matches ${mutation.file ?? inputSourcePath}.`);
      }

      return mutation.all
        ? source.replaceAll(mutation.find, mutation.replace)
        : source.replace(mutation.find, mutation.replace);
    },
  };
}

export default defineConfig({
  root: corePackage,
  resolve: {
    alias: {
      '@': resolve(corePackage, 'src'),
      '@codemonster-ru/vueforge-theme': resolve(corePackage, '../theme/src/index.ts'),
      '@codemonster-ru/vueforge-icons': resolve(corePackage, 'src/__tests__/mocks/vueforge-icons.ts'),
      '@codemonster-ru/vueforge-shared-core': resolve(corePackage, '../shared-core/src/index.ts'),
    },
  },
  plugins: [inputMutationPlugin(), vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: resolve(corePackage, 'src/__tests__/setup.ts'),
    include: [
      'src/components/input/VfInput.characterization.spec.ts',
      'src/__tests__/fixtures/historical-input-consumer.spec.ts',
      'src/components/components.spec.ts',
    ],
    server: {
      deps: {
        inline: ['@codemonster-ru/vueforge-icons'],
      },
    },
  },
});
