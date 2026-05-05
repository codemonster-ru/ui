import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

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
    plugins: [vue(), dts(), libInjectCss(), removeUnnecessaryFiles()],
    resolve: {
      alias: [{ find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) }],
    },
    build: {
      emptyOutDir: true,
      cssCodeSplit: true,
      lib: {
        name: 'index',
        entry: resolve(__dirname, isDevelopment ? './src/main.ts' : './src/lib/index.ts'),
        fileName: 'index.ts',
        formats: ['es', 'umd'],
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
