import type { Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'unplugin-dts/vite';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import { buildLayoutCssArtifacts, layoutCssArtifactPaths } from './build/layout-css-artifacts';
import { resolveLayoutCustomMedia } from './src/theme/breakpoint-registry';

function expandLayoutCustomMedia(code: string) {
  const mediaAliasPattern = /@media\s*\(\s*(--vf-bp-[a-z0-9-]+)\s*\)/g;
  const unknownAliases = new Set<string>();
  const transformed = code.replace(mediaAliasPattern, (fullMatch, alias: string) => {
    const mediaQuery = resolveLayoutCustomMedia(alias);
    if (!mediaQuery) {
      unknownAliases.add(alias);
      return fullMatch;
    }
    return `@media ${mediaQuery}`;
  });

  return { transformed, unknownAliases };
}

function vueforgeLayoutStyleArtifactsPlugin(): Plugin[] {
  return [
    {
      name: 'vueforge-layouts-expand-custom-media',
      enforce: 'pre',
      transform(code, id) {
        if (!id.includes('/packages/layouts/src/styles.css') && !id.includes('/packages/layouts/src/style-parts/')) {
          return null;
        }

        const { transformed, unknownAliases } = expandLayoutCustomMedia(code);

        if (unknownAliases.size > 0) {
          this.warn('[vueforge-layouts-expand-custom-media] Unknown custom media alias found in styles.css');
        }

        return transformed === code ? null : transformed;
      },
    },
    {
      name: 'vueforge-layouts-generate-css',
      buildStart() {
        buildLayoutCssArtifacts();
      },
      configureServer() {
        buildLayoutCssArtifacts();
      },
    },
    {
      name: 'vueforge-layouts-copy-css-entries',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const autoDir = resolve(distDir, 'auto');

        mkdirSync(distDir, { recursive: true });
        mkdirSync(autoDir, { recursive: true });
        cpSync(layoutCssArtifactPaths.generatedBreakpointsPath, resolve(distDir, 'breakpoints.css'));
        cpSync(layoutCssArtifactPaths.generatedTokensPath, resolve(distDir, 'tokens.css'));
        cpSync(layoutCssArtifactPaths.generatedThemePath, resolve(distDir, 'theme.css'));
        cpSync(resolve(__dirname, 'src/style-parts/base.css'), resolve(distDir, 'base.css'));
        const styleEntriesDir = resolve(__dirname, 'src/style-entries');
        for (const entryFileName of readdirSync(styleEntriesDir).filter((name) => name.endsWith('.css'))) {
          const entryCss = readFileSync(resolve(styleEntriesDir, entryFileName), 'utf8');
          const { transformed, unknownAliases } = expandLayoutCustomMedia(entryCss);
          if (unknownAliases.size > 0) {
            throw new Error(
              `Unknown custom media aliases in ${entryFileName}: ${[...unknownAliases].sort().join(', ')}`,
            );
          }
          writeFileSync(resolve(distDir, entryFileName), transformed);
        }

        const componentEntries: Array<[string, string, string[]]> = [
          ['container', 'VfContainer', ['container.css']],
          ['stack', 'VfStack', ['stack.css']],
          ['inline', 'VfInline', ['inline.css']],
          ['section', 'VfSection', ['section.css']],
          ['grid', 'VfGrid', ['grid.css']],
          ['app-shell', 'VfAppShell', ['app-shell.css']],
          ['document-layout', 'VfDocumentLayout', ['container.css', 'document-layout.css']],
          ['auth-layout', 'VfAuthLayout', ['container.css', 'auth-layout.css']],
          ['error-layout', 'VfErrorLayout', ['error-layout.css']],
          ['header-area', 'VfHeaderArea', ['header-area.css']],
          ['sidebar-area', 'VfSidebarArea', ['sidebar-area.css']],
          ['content-area', 'VfContentArea', ['content-area.css']],
          ['aside-area', 'VfAsideArea', ['aside-area.css']],
          ['footer-area', 'VfFooterArea', ['footer-area.css']],
        ];

        for (const [entryName, exportName, cssFiles] of componentEntries) {
          const cssImports = cssFiles.map((cssFile) => `import '../${cssFile}';`).join('\n');
          writeFileSync(
            resolve(autoDir, `${entryName}.js`),
            `${cssImports}\nexport { ${exportName} as default, ${exportName} } from '../index.js';\n`,
          );
        }
      },
    },
    {
      name: 'vueforge-layouts-strip-custom-media-from-dist',
      closeBundle() {
        const distStylesPath = resolve(__dirname, 'dist/styles.css');
        if (!existsSync(distStylesPath)) {
          return;
        }

        const css = readFileSync(distStylesPath, 'utf8');
        const cleanedCss = css.replace(/@custom-media\s+--vf-bp-[^;]+;/g, '');

        if (cleanedCss !== css) {
          writeFileSync(distStylesPath, cleanedCss);
        }
      },
    },
  ];
}

buildLayoutCssArtifacts();

export default defineConfig({
  plugins: [
    vue(),
    ...vueforgeLayoutStyleArtifactsPlugin(),
    dts({
      processor: 'vue',
      include: ['src'],
      exclude: ['__tests__/**/*'],
      insertTypesEntry: true,
      beforeWriteFile(filePath) {
        if (filePath.endsWith('.d.ts.map')) {
          return false;
        }
      },
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueforgeLayouts',
      cssFileName: 'styles',
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'vue',
        '@codemonster-ru/vueforge-core',
        '@codemonster-ru/vueforge-core/foundation',
        '@codemonster-ru/vueforge-theme',
      ],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './__tests__/setup.ts',
    alias: [
      {
        find: /^@\//,
        replacement: `${resolve(__dirname, '../core/src')}/`,
      },
      {
        find: '@codemonster-ru/vueforge-core/foundation',
        replacement: resolve(__dirname, '../core/src/foundation/index.ts'),
      },
      {
        find: '@codemonster-ru/vueforge-core',
        replacement: resolve(__dirname, '../core/src/index.ts'),
      },
      {
        find: '@codemonster-ru/vueforge-theme',
        replacement: resolve(__dirname, '../theme/src/index.ts'),
      },
      {
        find: '@codemonster-ru/vueforge-icons',
        replacement: resolve(__dirname, '../core/src/__tests__/mocks/vueforge-icons.ts'),
      },
    ],
    server: {
      deps: {
        inline: [
          '@codemonster-ru/vueforge-core',
          '@codemonster-ru/vueforge-core/foundation',
          '@codemonster-ru/vueforge-theme',
          '@codemonster-ru/vueforge-icons',
        ],
      },
    },
  },
});
