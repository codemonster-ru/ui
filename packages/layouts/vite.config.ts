import type { Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'unplugin-dts/vite';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
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
      apply: 'build',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const autoDir = resolve(distDir, 'auto');
        const nodeDir = resolve(distDir, 'node');

        mkdirSync(distDir, { recursive: true });
        mkdirSync(autoDir, { recursive: true });
        mkdirSync(nodeDir, { recursive: true });
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

        const componentEntries: Array<[string, string, string, string[]]> = [
          ['container', 'VfContainer', './layouts/src/primitives/VfContainer.vue', ['container.css']],
          ['stack', 'VfStack', './layouts/src/primitives/VfStack.vue', ['stack.css']],
          ['inline', 'VfInline', './layouts/src/primitives/VfInline.vue', ['inline.css']],
          ['section', 'VfSection', './layouts/src/primitives/VfSection.vue', ['section.css']],
          ['grid', 'VfGrid', './layouts/src/primitives/VfGrid.vue', ['grid.css']],
          ['app-shell', 'VfAppShell', './layouts/src/shell/VfAppShell.vue', ['app-shell.css']],
          ['admin-layout', 'VfAdminLayout', './layouts/src/shell/VfAdminLayout.vue', ['admin-layout.css']],
          ['admin-shell', 'VfAdminShell', './layouts/src/shell/VfAdminShell.vue', ['admin-shell.css']],
          [
            'document-layout',
            'VfDocumentLayout',
            './layouts/src/shell/VfDocumentLayout.vue',
            ['container.css', 'document-layout.css'],
          ],
          ['auth-layout', 'VfAuthLayout', './layouts/src/shell/VfAuthLayout.vue', ['container.css', 'auth-layout.css']],
          ['error-layout', 'VfErrorLayout', './layouts/src/shell/VfErrorLayout.vue', ['error-layout.css']],
          [
            'setup-layout',
            'VfSetupLayout',
            './layouts/src/shell/VfSetupLayout.vue',
            ['container.css', 'setup-layout.css'],
          ],
          ['header-area', 'VfHeaderArea', './layouts/src/shell/VfHeaderArea.vue', ['header-area.css']],
          ['sidebar-area', 'VfSidebarArea', './layouts/src/shell/VfSidebarArea.vue', ['sidebar-area.css']],
          ['content-area', 'VfContentArea', './layouts/src/shell/VfContentArea.vue', ['content-area.css']],
          ['aside-area', 'VfAsideArea', './layouts/src/shell/VfAsideArea.vue', ['aside-area.css']],
          ['footer-area', 'VfFooterArea', './layouts/src/shell/VfFooterArea.vue', ['footer-area.css']],
        ];

        for (const [entryName, exportName, declarationSource, cssFiles] of componentEntries) {
          const cssImports = cssFiles.map((cssFile) => `import '../${cssFile}';`).join('\n');
          const typeExports =
            entryName === 'admin-layout'
              ? "export type { VfAdminLayoutExposed, VfAdminLayoutMobileSidebarScope, VfAdminLayoutMobileToggleAttrs, VfAdminLayoutProps, VfAdminLayoutScope } from './layouts/src/shell/admin-layout.types';\n"
              : '';
          writeFileSync(
            resolve(autoDir, `${entryName}.js`),
            `${cssImports}\nexport { ${exportName} as default, ${exportName} } from '../index.js';\n`,
          );
          writeFileSync(
            resolve(nodeDir, `${entryName}.js`),
            `export { ${exportName} as default, ${exportName} } from '../index.js';\n`,
          );
          writeFileSync(
            resolve(distDir, `${entryName}.d.ts`),
            `export { default } from '${declarationSource}';\nexport { default as ${exportName} } from '${declarationSource}';\n${typeExports}`,
          );
        }
      },
    },
    {
      name: 'vueforge-layouts-finalize-dist-styles',
      apply: 'build',
      closeBundle() {
        const distStylesPath = resolve(__dirname, 'dist/styles.css');
        if (!existsSync(distStylesPath)) {
          return;
        }

        const css = readFileSync(distStylesPath, 'utf8');
        const strippedCss = css.replace(/@custom-media\s+--vf-bp-[^;]+;/g, '');
        const { transformed, unknownAliases } = expandLayoutCustomMedia(strippedCss);

        if (unknownAliases.size > 0) {
          throw new Error(`Unknown custom media aliases in dist/styles.css: ${[...unknownAliases].sort().join(', ')}`);
        }

        if (transformed !== css) {
          writeFileSync(distStylesPath, transformed);
        }
      },
    },
  ];
}

function vueforgeLayoutsCjsArtifactsPlugin(): Plugin {
  return {
    name: 'vueforge-layouts-finalize-cjs-artifacts',
    closeBundle() {
      const cjsCssPath = resolve(__dirname, 'dist/cjs-ssr.css');
      if (existsSync(cjsCssPath)) {
        rmSync(cjsCssPath);
      }

      writeFileSync(
        resolve(__dirname, 'dist/index.d.cts'),
        "declare const moduleExports: typeof import('./index.js');\nexport = moduleExports;\n",
      );
    },
  };
}

buildLayoutCssArtifacts();

export default defineConfig(({ mode }) => {
  const isCjsBuild = mode === 'cjs';

  return {
    resolve: {
      alias: isCjsBuild
        ? {
            '@codemonster-ru/vueforge-theme': resolve(__dirname, '../theme/src/index.ts'),
          }
        : {},
    },
    plugins: [
      vue(),
      ...(isCjsBuild
        ? [vueforgeLayoutsCjsArtifactsPlugin()]
        : [
            ...vueforgeLayoutStyleArtifactsPlugin(),
            dts({
              processor: 'vue',
              include: ['src'],
              exclude: ['__tests__/**/*'],
              insertTypesEntry: true,
              aliasesExclude: [
                '@codemonster-ru/vueforge-core',
                '@codemonster-ru/vueforge-core/foundation',
                '@codemonster-ru/vueforge-theme',
              ],
              beforeWriteFile(filePath, content) {
                if (filePath.endsWith('.d.ts.map')) {
                  return false;
                }

                const normalizedPath = filePath.replaceAll('\\', '/');
                const dependencyImport = normalizedPath.endsWith('/layouts/src/theme/types.d.ts')
                  ? '@codemonster-ru/vueforge-core'
                  : normalizedPath.endsWith('/layouts/src/index.d.ts') ||
                      normalizedPath.endsWith('/layouts/src/composables/useCssVarBreakpoints.d.ts')
                    ? '@codemonster-ru/vueforge-core/foundation'
                    : null;

                if (dependencyImport && content.includes('deps-shim.d.ts')) {
                  return {
                    filePath,
                    content: content.replace(/(['"])(?:\.\.?\/)+types\/deps-shim\.d\.ts\1/g, `'${dependencyImport}'`),
                  };
                }
              },
            }),
          ]),
    ],
    build: {
      emptyOutDir: !isCjsBuild,
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'VueforgeLayouts',
        cssFileName: isCjsBuild ? 'cjs-ssr' : 'styles',
        fileName: () => (isCjsBuild ? 'index.cjs' : 'index.js'),
        formats: [isCjsBuild ? 'cjs' : 'es'],
      },
      rollupOptions: {
        external: isCjsBuild
          ? ['vue', '@codemonster-ru/vueforge-core', '@codemonster-ru/vueforge-core/foundation']
          : [
              'vue',
              '@codemonster-ru/vueforge-core',
              '@codemonster-ru/vueforge-core/foundation',
              '@codemonster-ru/vueforge-theme',
            ],
        output: {
          exports: 'named',
          ...(isCjsBuild ? { interop: 'auto' as const } : {}),
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
  };
});
