import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildThemeCssArtifacts, themeCssArtifactPaths } from './build/theme-css-artifacts';

const rootDir = __dirname;
const stylesDir = resolve(rootDir, 'src/styles');
const styleEntriesDir = resolve(stylesDir, 'entries');
const componentJsEntries = [
  'async',
  'accordion',
  'alert',
  'avatar',
  'badge',
  'breadcrumbs',
  'button',
  'card',
  'checkbox',
  'command-palette',
  'data-table',
  'dialog',
  'divider',
  'drawer',
  'dropdown',
  'field',
  'fieldset',
  'icon-button',
  'input',
  'link',
  'menu-bar',
  'nav-menu',
  'panel',
  'popover',
  'progress-bar',
  'progress-spinner',
  'radio',
  'select',
  'skeleton',
  'skeleton-gate',
  'stepper',
  'switch',
  'table',
  'table-of-contents',
  'tabs',
  'tag',
  'textarea',
  'theme-switch',
  'tooltip',
] as const;

function inlineCssImports(filePath: string, trace: string[] = []): string {
  if (trace.includes(filePath)) {
    throw new Error(`Circular CSS import detected: ${[...trace, filePath].join(' -> ')}`);
  }

  const source = readFileSync(filePath, 'utf8');

  return source.replace(/^@import\s+['"](.+?)['"];\s*$/gm, (_statement, importPath: string) => {
    if (!importPath.startsWith('.')) {
      return `@import '${importPath}';`;
    }

    return inlineCssImports(resolve(dirname(filePath), importPath), [...trace, filePath]);
  });
}

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

        copyFileSync(themeCssArtifactPaths.generatedTokensPath, resolve(distDir, 'tokens.css'));
        copyFileSync(themeCssArtifactPaths.generatedThemePath, resolve(distDir, 'theme.css'));
        copyFileSync(themeCssArtifactPaths.generatedBreakpointsPath, resolve(distDir, 'generated-breakpoints.css'));
        copyFileSync(resolve(stylesDir, 'foundation.css'), resolve(distDir, 'foundation.css'));
        copyFileSync(resolve(stylesDir, 'components/base.css'), resolve(distDir, 'base.css'));
        for (const entryName of componentJsEntries) {
          writeFileSync(
            resolve(distDir, `${entryName}.css`),
            inlineCssImports(resolve(styleEntriesDir, `${entryName}.css`)),
          );
        }

        // Keep explicit runtime CSS links for component subpath exports.
        // Vite library mode extracts CSS, so source-level imports in src/entries/*
        // do not guarantee a preserved `import './*.css'` in dist component JS.
        // These small proxy files make `@.../core/<component>` auto-load the
        // matching component CSS in consumer apps.
        for (const entryName of componentJsEntries) {
          writeFileSync(
            resolve(autoDir, `${entryName}.js`),
            `import '../${entryName}.css';\nexport * from '../${entryName}.js';\n`,
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
        async: resolve(__dirname, 'src/async.ts'),
        accordion: resolve(__dirname, 'src/entries/accordion.ts'),
        alert: resolve(__dirname, 'src/entries/alert.ts'),
        avatar: resolve(__dirname, 'src/entries/avatar.ts'),
        badge: resolve(__dirname, 'src/entries/badge.ts'),
        breadcrumbs: resolve(__dirname, 'src/entries/breadcrumbs.ts'),
        button: resolve(__dirname, 'src/entries/button.ts'),
        card: resolve(__dirname, 'src/entries/card.ts'),
        checkbox: resolve(__dirname, 'src/entries/checkbox.ts'),
        'command-palette': resolve(__dirname, 'src/entries/command-palette.ts'),
        'data-table': resolve(__dirname, 'src/entries/data-table.ts'),
        dialog: resolve(__dirname, 'src/entries/dialog.ts'),
        divider: resolve(__dirname, 'src/entries/divider.ts'),
        drawer: resolve(__dirname, 'src/entries/drawer.ts'),
        dropdown: resolve(__dirname, 'src/entries/dropdown.ts'),
        field: resolve(__dirname, 'src/entries/field.ts'),
        fieldset: resolve(__dirname, 'src/entries/fieldset.ts'),
        'icon-button': resolve(__dirname, 'src/entries/icon-button.ts'),
        input: resolve(__dirname, 'src/entries/input.ts'),
        link: resolve(__dirname, 'src/entries/link.ts'),
        'menu-bar': resolve(__dirname, 'src/entries/menu-bar.ts'),
        'nav-menu': resolve(__dirname, 'src/entries/nav-menu.ts'),
        panel: resolve(__dirname, 'src/entries/panel.ts'),
        popover: resolve(__dirname, 'src/entries/popover.ts'),
        'progress-bar': resolve(__dirname, 'src/entries/progress-bar.ts'),
        'progress-spinner': resolve(__dirname, 'src/entries/progress-spinner.ts'),
        radio: resolve(__dirname, 'src/entries/radio.ts'),
        select: resolve(__dirname, 'src/entries/select.ts'),
        skeleton: resolve(__dirname, 'src/entries/skeleton.ts'),
        'skeleton-gate': resolve(__dirname, 'src/entries/skeleton-gate.ts'),
        stepper: resolve(__dirname, 'src/entries/stepper.ts'),
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
