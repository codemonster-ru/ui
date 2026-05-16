import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
      entry: resolve(rootDir, 'src/index.ts'),
      name: 'VfCodeBlock',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.umd.cjs'),
      formats: ['es', 'umd'],
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
