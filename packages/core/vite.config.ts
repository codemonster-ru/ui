import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildThemeCssArtifacts, themeCssArtifactPaths } from './build/theme-css-artifacts';

const rootDir = __dirname;
const stylesDir = resolve(rootDir, 'src/styles');
const styleEntriesDir = resolve(stylesDir, 'entries');
const componentJsEntries = [
  'accordion',
  'alert',
  'badge',
  'breadcrumbs',
  'button',
  'card',
  'checkbox',
  'command-palette',
  'dialog',
  'divider',
  'drawer',
  'dropdown',
  'icon-button',
  'input',
  'link',
  'menu-bar',
  'nav-menu',
  'panel',
  'popover',
  'radio',
  'select',
  'skeleton',
  'skeleton-gate',
  'switch',
  'table',
  'table-of-contents',
  'tabs',
  'tag',
  'textarea',
  'theme-switch',
  'tooltip',
] as const;

function vueforgeStyleArtifactsPlugin(): Plugin[] {
  return [
    {
      name: 'vueforge-generate-theme-css',
      buildStart() {
        buildThemeCssArtifacts();
      },
      configureServer() {
        buildThemeCssArtifacts();
      },
    },
    {
      name: 'vueforge-copy-css-entries',
      writeBundle() {
        const distDir = resolve(rootDir, 'dist');
        const autoDir = resolve(distDir, 'auto');

        mkdirSync(distDir, { recursive: true });
        mkdirSync(autoDir, { recursive: true });

        cpSync(themeCssArtifactPaths.generatedTokensPath, resolve(distDir, 'tokens.css'));
        cpSync(themeCssArtifactPaths.generatedThemePath, resolve(distDir, 'theme.css'));
        cpSync(themeCssArtifactPaths.generatedBreakpointsPath, resolve(distDir, 'generated-breakpoints.css'));
        cpSync(resolve(stylesDir, 'foundation.css'), resolve(distDir, 'foundation.css'));
        cpSync(resolve(stylesDir, 'components/base.css'), resolve(distDir, 'base.css'));
        for (const entryFileName of readdirSync(styleEntriesDir).filter((name) => name.endsWith('.css'))) {
          cpSync(resolve(styleEntriesDir, entryFileName), resolve(distDir, entryFileName));
        }

        // Keep explicit runtime CSS links for component subpath exports.
        // Vite library mode extracts CSS, so source-level imports in src/entries/*
        // do not guarantee a preserved `import './*.css'` in dist component JS.
        // These small proxy files make `@.../core/<component>` auto-load the
        // matching component CSS in consumer apps.
        for (const entryName of componentJsEntries) {
          writeFileSync(
            resolve(autoDir, `${entryName}.js`),
            `import '../${entryName}.css';\nexport * from '../${entryName}.js';\n`
          );
        }
      },
    },
  ];
}

buildThemeCssArtifacts();

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    ...vueforgeStyleArtifactsPlugin(),
    dts({
      include: ['src'],
      exclude: ['src/**/*.spec.ts', 'src/__tests__/**'],
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'foundation-api': resolve(__dirname, 'src/foundation/index.ts'),
        'theme-api': resolve(__dirname, 'src/theme/public.ts'),
        accordion: resolve(__dirname, 'src/entries/accordion.ts'),
        alert: resolve(__dirname, 'src/entries/alert.ts'),
        badge: resolve(__dirname, 'src/entries/badge.ts'),
        breadcrumbs: resolve(__dirname, 'src/entries/breadcrumbs.ts'),
        button: resolve(__dirname, 'src/entries/button.ts'),
        card: resolve(__dirname, 'src/entries/card.ts'),
        checkbox: resolve(__dirname, 'src/entries/checkbox.ts'),
        'command-palette': resolve(__dirname, 'src/entries/command-palette.ts'),
        dialog: resolve(__dirname, 'src/entries/dialog.ts'),
        divider: resolve(__dirname, 'src/entries/divider.ts'),
        drawer: resolve(__dirname, 'src/entries/drawer.ts'),
        dropdown: resolve(__dirname, 'src/entries/dropdown.ts'),
        'icon-button': resolve(__dirname, 'src/entries/icon-button.ts'),
        input: resolve(__dirname, 'src/entries/input.ts'),
        link: resolve(__dirname, 'src/entries/link.ts'),
        'menu-bar': resolve(__dirname, 'src/entries/menu-bar.ts'),
        'nav-menu': resolve(__dirname, 'src/entries/nav-menu.ts'),
        panel: resolve(__dirname, 'src/entries/panel.ts'),
        popover: resolve(__dirname, 'src/entries/popover.ts'),
        radio: resolve(__dirname, 'src/entries/radio.ts'),
        select: resolve(__dirname, 'src/entries/select.ts'),
        skeleton: resolve(__dirname, 'src/entries/skeleton.ts'),
        'skeleton-gate': resolve(__dirname, 'src/entries/skeleton-gate.ts'),
        switch: resolve(__dirname, 'src/entries/switch.ts'),
        table: resolve(__dirname, 'src/entries/table.ts'),
        'table-of-contents': resolve(__dirname, 'src/entries/table-of-contents.ts'),
        tabs: resolve(__dirname, 'src/entries/tabs.ts'),
        tag: resolve(__dirname, 'src/entries/tag.ts'),
        textarea: resolve(__dirname, 'src/entries/textarea.ts'),
        'theme-switch': resolve(__dirname, 'src/entries/theme-switch.ts'),
        tooltip: resolve(__dirname, 'src/entries/tooltip.ts'),
      },
      name: 'VueforgeCore',
      cssFileName: 'styles',
      fileName: (_format, entryName) => `${entryName === 'index' ? 'vueforge-core' : entryName}.js`,
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@codemonster-ru/vueforge-icons',
        '@codemonster-ru/floater.js',
        '@codemonster-ru/vueforge-theme',
      ],
      output: {},
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/__tests__/setup.ts',
    server: {
      deps: {
        inline: ['@codemonster-ru/vueforge-icons'],
      },
    },
  },
});
