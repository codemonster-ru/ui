import { exec } from 'node:child_process';
import { resolve, sep } from 'node:path';
import { promisify } from 'node:util';
import type { Plugin } from 'vite';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const packageDirectory = (name: string) => resolve(repositoryRoot, 'packages', name);
const run = promisify(exec);

const sourceEntries = {
  'ui-css/fonts.css': 'css/src/fonts.css',
  'ui-css/styles.css': 'css/src/styles.css',
  'ui-icons': 'icons/src/index.ts',
  'ui-icons/catalog': 'icons/src/catalog.ts',
  'ui-icons/controls': 'icons/src/controls.ts',
  'ui-layouts': 'layouts/src/index.ts',
  'ui-runtime': 'runtime/src/index.ts',
  'ui-runtime/anchored-position': 'runtime/src/anchored-position.ts',
  'ui-runtime/core': 'runtime/src/core/index.ts',
  'ui-runtime/data-table-dom': 'runtime/src/data-table-dom.ts',
  'ui-runtime/native-modal': 'runtime/src/native-modal.ts',
  'ui-runtime/tabs-scroll': 'runtime/src/tabs-scroll.ts',
  'ui-tokens': 'tokens/src/index.ts',
  'ui-vue': 'vue/src/index.ts',
  'ui-vue/historical': 'vue/src/historical.ts',
};

async function buildStyles(name: string) {
  await run(`npm run build --workspace @codemonster-ru/ui-${name}`, { cwd: repositoryRoot });
}

export function workspaceDevelopment(): Plugin {
  return {
    name: 'codemonster-showcase-workspace-development',
    config() {
      return {
        resolve: {
          alias: Object.entries(sourceEntries).map(([specifier, path]) => ({
            find: new RegExp(`^@codemonster-ru/${specifier.replaceAll('.', '\\.')}$`, 'u'),
            replacement: packageDirectory(path),
          })),
        },
      };
    },
    async configureServer(server) {
      // The utilities generator imports tokens from its built package.
      await buildStyles('tokens');
      await buildStyles('utilities');

      const inputs = ['tokens', 'utilities'].flatMap((name) =>
        ['src', 'scripts'].map((directory) => [resolve(packageDirectory(name), directory), name] as const),
      );
      const pending = new Set<string>();
      let running = false;

      async function rebuild() {
        running = true;
        while (pending.size > 0) {
          const rebuildTokens = pending.has('tokens');
          pending.clear();
          try {
            if (rebuildTokens) await buildStyles('tokens');
            await buildStyles('utilities');
          } catch (error) {
            server.config.logger.error(String(error), { error: error instanceof Error ? error : undefined });
          }
        }
        running = false;
      }

      server.watcher.add(inputs.map(([directory]) => directory));
      server.watcher.on('all', (_event, file) => {
        const input = inputs.find(([directory]) => file.startsWith(`${directory}${sep}`));
        if (!input) return;
        pending.add(input[1]);
        if (!running) void rebuild();
      });
    },
  };
}
