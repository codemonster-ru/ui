// Vitest config used only by check-input-characterization.mjs.
//
// It mirrors packages/core/vitest.config.ts and adds a plugin that rewrites
// VfInput.vue in memory when VUEFORGE_INPUT_MUTATION names a mutation. The file
// on disk is never touched, so a failed or interrupted run cannot leave an
// intentional defect behind in the source tree.
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';
import { componentMutations, inputSourcePath } from './input-mutations.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const corePackage = resolve(repositoryRoot, 'packages/core');
const defaultMutationFile = resolve(repositoryRoot, inputSourcePath);
const mutationId = process.env.VUEFORGE_INPUT_MUTATION ?? '';

function inputMutationPlugin() {
  if (!mutationId) {
    return { name: 'vueforge-input-mutation-disabled' };
  }

  const mutation = componentMutations.find((candidate) => candidate.id === mutationId);
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
      // A mutation is one find/replace, or - since M21, for a defect that
      // cannot be expressed in one place - a list of them, each of which must
      // still match.
      const edits = mutation.edits ?? [mutation];
      for (const edit of edits) {
        if (!source.includes(edit.find)) {
          throw new Error(`Mutation ${mutation.id} no longer matches ${mutation.file ?? inputSourcePath}.`);
        }
      }

      // Records that the mutation really reached the module under test. Without
      // this the driver cannot tell "a test caught the defect" from "the run
      // failed for some other reason", and a mutation that stopped applying
      // would be counted as a detection - the defect the independent review
      // found in this harness.
      const marker = process.env.VUEFORGE_INPUT_MUTATION_MARKER;
      if (marker) {
        appendFileSync(marker, `${mutation.id}\n`);
      }

      return edits.reduce(
        (mutated, edit) =>
          edit.all ? mutated.replaceAll(edit.find, edit.replace) : mutated.replace(edit.find, edit.replace),
        source,
      );
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
      'src/components/icon-button/VfIconButton.characterization.spec.ts',
      'src/components/field/VfField.characterization.spec.ts',
      'src/components/button/VfButton.characterization.spec.ts',
      'src/components/textarea/VfTextarea.characterization.spec.ts',
      'src/components/checkbox/VfCheckbox.characterization.spec.ts',
      'src/components/radio/VfRadio.characterization.spec.ts',
      'src/components/switch/VfSwitch.characterization.spec.ts',
      'src/components/badge/VfBadge.characterization.spec.ts',
      'src/components/tag/VfTag.characterization.spec.ts',
      'src/components/divider/VfDivider.characterization.spec.ts',
      'src/components/skeleton/VfSkeleton.characterization.spec.ts',
      'src/components/avatar/VfAvatar.characterization.spec.ts',
      'src/components/card/VfCard.characterization.spec.ts',
      'src/components/panel/VfPanel.characterization.spec.ts',
      'src/components/alert/VfAlert.characterization.spec.ts',
      'src/components/progress-spinner/VfProgressSpinner.characterization.spec.ts',
      'src/components/progress-bar/VfProgressBar.characterization.spec.ts',
      'src/components/accordion/VfAccordion.characterization.spec.ts',
      'src/components/stepper/VfStepper.characterization.spec.ts',
      'src/components/tabs/VfTabs.characterization.spec.ts',
      'src/components/link/VfLink.characterization.spec.ts',
      'src/components/breadcrumbs/VfBreadcrumbs.characterization.spec.ts',
      'src/components/menu/VfMenu.characterization.spec.ts',
      'src/components/menu/VfMenuItem.characterization.spec.ts',
      'src/components/dropdown/VfDropdown.characterization.spec.ts',
      'src/components/popover/VfPopover.characterization.spec.ts',
      'src/components/tooltip/VfTooltip.characterization.spec.ts',
      'src/components/select/VfSelect.characterization.spec.ts',
      'src/components/group-box/VfGroupBox.characterization.spec.ts',
      'src/components/skeleton-gate/VfSkeletonGate.characterization.spec.ts',
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
