import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { expandVfBreakpointQueries } from '../theme/src/breakpoint-queries';

function expandPlaygroundBreakpointQueries(code: string, source: string) {
  const { transformed, unknownAliases } = expandVfBreakpointQueries(code);
  if (unknownAliases.size > 0) {
    throw new Error(`Unknown breakpoint aliases in ${source}: ${[...unknownAliases].sort().join(', ')}`);
  }

  return transformed;
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'vueforge-playground-expand-breakpoint-queries',
      enforce: 'pre',
      transform(code, id) {
        const normalizedId = id.replace(/\\/g, '/').split('?', 1)[0];
        if (!normalizedId.includes('/packages/playground/src/') || !normalizedId.endsWith('.css')) {
          return null;
        }

        const transformed = expandPlaygroundBreakpointQueries(code, normalizedId);
        return transformed === code ? null : transformed;
      },
    },
    {
      name: 'vueforge-playground-copy-critical-css',
      closeBundle() {
        for (const fileName of ['tokens.css', 'playground.css', 'critical.css']) {
          const source = readFileSync(resolve(__dirname, 'src', fileName), 'utf8');
          writeFileSync(resolve(__dirname, 'dist', fileName), expandPlaygroundBreakpointQueries(source, fileName));
        }
        const autoDir = resolve(__dirname, 'dist/auto');
        mkdirSync(autoDir, { recursive: true });
        writeFileSync(resolve(autoDir, 'ui.js'), "import '../index.css';\nexport * from '../ui.js';\n");
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: /^@codemonster-ru\/vueforge-codeblock\/view$/,
        replacement: resolve(__dirname, '../codeblock/src/view.ts'),
      },
    ],
  },
  build: {
    lib: {
      entry: {
        ui: resolve(__dirname, 'src/ui.ts'),
        runtime: resolve(__dirname, 'src/runtime.ts'),
      },
      cssFileName: 'index',
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        'vue',
        '@codemonster-ru/vueforge-playground-core',
        '@codemonster-ru/vueforge-codeblock/view',
        /^@codemonster-ru\/vueforge-core(?:\/.*)?$/,
      ],
    },
  },
});
