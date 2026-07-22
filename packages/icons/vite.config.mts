import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath, URL } from 'url';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

const esOnlyCssInjection = (): Plugin => {
  const cssPlugin = libInjectCss();
  const generateBundle = cssPlugin.generateBundle;

  if (typeof generateBundle !== 'function') {
    throw new TypeError('vite-plugin-lib-inject-css must expose a generateBundle hook');
  }

  return {
    ...cssPlugin,
    generateBundle(outputOptions, bundle, isWrite) {
      if (outputOptions.format !== 'es') {
        return;
      }

      return generateBundle.call(this, outputOptions, bundle, isWrite);
    },
  };
};

const removeUnnecessaryFiles = () => {
  return {
    name: 'remove-files',
    writeBundle(outputOptions) {
      const outDir = outputOptions.dir;

      if (!outDir) {
        return;
      }

      for (const file of ['main.d.ts', 'App.vue.d.ts']) {
        rmSync(resolve(outDir, file), { force: true });
      }
    },
  };
};

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';

  return {
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    plugins: [vue(), dts(), esOnlyCssInjection(), removeUnnecessaryFiles()],
    resolve: {
      alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
    },
    build: {
      emptyOutDir: true,
      cssCodeSplit: true,
      lib: {
        name: 'index',
        entry: resolve(__dirname, isDevelopment ? './src/main.ts' : './src/lib/index.ts'),
        fileName: (format) => {
          if (format === 'es') {
            return 'index.ts.mjs';
          }

          if (format === 'cjs') {
            return 'index.cjs';
          }

          return 'index.ts.umd.js';
        },
        formats: ['es', 'cjs', 'umd'],
      },
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: {
            vue: 'Vue',
          },
        },
      },
    },
  };
});
