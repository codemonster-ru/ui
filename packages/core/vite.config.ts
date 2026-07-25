import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { copyFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { inlineCssFiles, inlineCssImports } from './build/css-imports';
import { buildThemeCssArtifacts, themeCssArtifactPaths } from './build/theme-css-artifacts';

const rootDir = __dirname;
const stylesDir = resolve(rootDir, 'src/styles');
const styleEntriesDir = resolve(stylesDir, 'entries');
const themeTransitionGuardPath = resolve(stylesDir, 'components/theme-transition-guard.css');
const accessibilityPreferencesPath = resolve(stylesDir, 'components/accessibility-preferences.css');
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
        writeFileSync(resolve(distDir, 'foundation.css'), inlineCssImports(resolve(stylesDir, 'foundation.css')));
        writeFileSync(resolve(distDir, 'styles.css'), inlineCssImports(resolve(stylesDir, 'styles.css')));
        writeFileSync(resolve(distDir, 'base.css'), inlineCssImports(resolve(stylesDir, 'components/base.css')));
        for (const entryName of componentJsEntries) {
          writeFileSync(
            resolve(distDir, `${entryName}.css`),
            inlineCssFiles([
              themeTransitionGuardPath,
              accessibilityPreferencesPath,
              resolve(styleEntriesDir, `${entryName}.css`),
            ]),
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

function vueforgeCjsArtifactsPlugin(): Plugin {
  return {
    name: 'vueforge-finalize-cjs-artifacts',
    closeBundle() {
      const cjsCssPath = resolve(rootDir, 'dist/cjs-ssr.css');
      if (existsSync(cjsCssPath)) {
        rmSync(cjsCssPath);
      }

      const cjsTypeFacades = [
        ['index.d.cts', './index.js'],
        ['foundation-api.d.cts', './foundation-api.js'],
        ['theme-api.d.cts', './theme-api.js'],
      ] as const;

      for (const [fileName, declarationTarget] of cjsTypeFacades) {
        writeFileSync(
          resolve(rootDir, 'dist', fileName),
          `declare const moduleExports: typeof import('${declarationTarget}');\nexport = moduleExports;\n`,
        );
      }
    },
  };
}

buildThemeCssArtifacts();

export default defineConfig(({ mode }) => {
  const isCjsBuild = mode === 'cjs';
  const buildEntries: Record<string, string> = isCjsBuild
    ? {
        index: resolve(__dirname, 'src/index.ts'),
        'foundation-api': resolve(__dirname, 'src/foundation/index.ts'),
        'theme-api': resolve(__dirname, 'src/theme/public.ts'),
      }
    : {
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
      };

  return {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        ...(isCjsBuild ? { '@codemonster-ru/vueforge-theme': resolve(__dirname, '../theme/src/index.ts') } : {}),
      },
    },
    plugins: [
      vue(),
      ...(isCjsBuild
        ? [vueforgeCjsArtifactsPlugin()]
        : [
            ...vueforgeStyleArtifactsPlugin(),
            dts({
              processor: 'vue',
              entryRoot: 'src',
              include: ['src'],
              exclude: ['src/**/*.spec.ts', 'src/__tests__/**'],
              insertTypesEntry: true,
              aliasesExclude: ['@codemonster-ru/vueforge-theme', '@codemonster-ru/vueforge-icons'],
            }),
          ]),
    ],
    build: {
      emptyOutDir: !isCjsBuild,
      lib: {
        entry: buildEntries,
        name: 'VueforgeCore',
        cssFileName: isCjsBuild ? 'cjs-ssr' : 'styles',
        fileName: (_format, entryName) =>
          `${entryName === 'index' ? 'vueforge-core' : entryName}.${isCjsBuild ? 'cjs' : 'js'}`,
        formats: [isCjsBuild ? 'cjs' : 'es'],
      },
      rollupOptions: {
        external: isCjsBuild
          ? ['vue', '@codemonster-ru/vueforge-icons', '@codemonster-ru/floater.js']
          : ['vue', '@codemonster-ru/vueforge-icons', '@codemonster-ru/floater.js', '@codemonster-ru/vueforge-theme'],
        output: isCjsBuild ? { exports: 'named' } : {},
      },
    },
  };
});
