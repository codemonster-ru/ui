import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    dts({
      entryRoot: 'src',
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**/*'],
      insertTypesEntry: true,
    }),
    {
      name: 'vueforge-codeblock-copy-critical-css',
      closeBundle() {
        cpSync(resolve(rootDir, 'src/tokens.css'), resolve(rootDir, 'dist/tokens.css'));
        cpSync(resolve(rootDir, 'src/codeblock.css'), resolve(rootDir, 'dist/codeblock.css'));
        cpSync(resolve(rootDir, 'src/critical.css'), resolve(rootDir, 'dist/critical.css'));
        const autoDir = resolve(rootDir, 'dist/auto');
        mkdirSync(autoDir, { recursive: true });
        writeFileSync(
          resolve(autoDir, 'view.js'),
          "import '../view.css';\nexport { default } from '../view.js';\nexport * from '../view.js';\n",
        );
      },
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    alias: {
      '@codemonster-ru/vueforge-icons': resolve(rootDir, 'src/__tests__/mocks/vueforge-icons.ts'),
    },
    server: {
      deps: {
        inline: ['@codemonster-ru/vueforge-icons'],
      },
    },
  },
  build: {
    emptyOutDir: true,
    cssCodeSplit: true,
    lib: {
      entry: {
        view: resolve(rootDir, 'src/view.ts'),
        highlight: resolve(rootDir, 'src/highlight.ts'),
      },
      fileName: (format, entryName) => (format === 'es' ? `${entryName}.js` : `${entryName}.cjs`),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue', '@codemonster-ru/vueforge-icons'],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
          '@codemonster-ru/vueforge-icons': 'VueforgeIcons',
        },
      },
    },
  },
});
