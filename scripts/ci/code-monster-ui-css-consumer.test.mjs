import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  collectCssExports,
  selectCssConsumerPackages,
  verifyInstalledCssConsumer,
} from './code-monster-ui-css-consumer.mjs';

function createInstalledConsumer(
  context,
  { css = '.cm-button { display: inline-flex; }\n', importedCss, withVue = false } = {},
) {
  const root = mkdtempSync(join(tmpdir(), 'codemonster-ui-css-consumer-'));
  const repositoryRoot = join(root, 'repository');
  const consumerDirectory = join(root, 'consumer');
  const packageDirectory = join(consumerDirectory, 'node_modules/@codemonster-ru/ui-css');
  context.after(() => rmSync(root, { recursive: true }));
  mkdirSync(repositoryRoot);
  mkdirSync(join(packageDirectory, 'dist'), { recursive: true });
  writeFileSync(join(packageDirectory, 'dist/styles.css'), css);
  if (importedCss !== undefined) {
    mkdirSync(join(packageDirectory, 'dist/parts'));
    writeFileSync(join(packageDirectory, 'dist/parts/base.css'), importedCss);
  }
  writeFileSync(
    join(packageDirectory, 'package.json'),
    `${JSON.stringify({
      name: '@codemonster-ru/ui-css',
      exports: { './styles.css': './dist/styles.css' },
    })}\n`,
  );
  if (withVue) {
    mkdirSync(join(consumerDirectory, 'node_modules/vue'), { recursive: true });
  }
  return { consumerDirectory, repositoryRoot };
}

test('collects direct CSS export specifiers', () => {
  assert.deepEqual(
    collectCssExports('@codemonster-ru/ui-css', {
      exports: {
        '.': { types: './dist/index.d.ts', import: './dist/index.js' },
        './styles.css': './dist/styles.css',
      },
    }),
    [{ specifier: '@codemonster-ru/ui-css/styles.css', target: './dist/styles.css' }],
  );
});

test('selects framework-independent CSS packages and their dependencies', () => {
  const workspaces = [
    { name: '@codemonster-ru/ui-tokens', releaseOrder: 1 },
    { name: '@codemonster-ru/ui-css', releaseOrder: 3 },
    { name: '@codemonster-ru/ui-vue', releaseOrder: 4, frameworkPeers: { vue: '^3.5.0' } },
  ];
  const manifests = new Map([
    ['@codemonster-ru/ui-tokens', { exports: { '.': './dist/index.js' } }],
    [
      '@codemonster-ru/ui-css',
      {
        dependencies: { '@codemonster-ru/ui-tokens': '^0.1.0' },
        exports: { './styles.css': './dist/styles.css' },
      },
    ],
    ['@codemonster-ru/ui-vue', { exports: { './styles.css': './dist/styles.css' } }],
  ]);

  assert.deepEqual(
    selectCssConsumerPackages(workspaces, manifests).map(({ name }) => name),
    ['@codemonster-ru/ui-tokens', '@codemonster-ru/ui-css'],
  );
});

test('verifies isolated non-empty CSS exports without framework installs', (context) => {
  const paths = createInstalledConsumer(context, {
    css: "@import './parts/base.css';\n.cm-button { display: inline-flex; }\n",
    importedCss: '.cm-control { box-sizing: border-box; }\n',
  });
  assert.equal(
    verifyInstalledCssConsumer({
      ...paths,
      packages: [{ name: '@codemonster-ru/ui-css' }],
    }),
    1,
  );
});

test('rejects missing and non-portable CSS imports', (context) => {
  const missingPaths = createInstalledConsumer(context, { css: "@import './missing.css';\n" });
  assert.throws(
    () =>
      verifyInstalledCssConsumer({
        ...missingPaths,
        packages: [{ name: '@codemonster-ru/ui-css' }],
      }),
    /imports missing CSS/,
  );

  const packagePaths = createInstalledConsumer(context, {
    css: "@import '@codemonster-ru/ui-tokens/tokens.css';\n",
  });
  assert.throws(
    () =>
      verifyInstalledCssConsumer({
        ...packagePaths,
        packages: [{ name: '@codemonster-ru/ui-css' }],
      }),
    /non-portable package CSS import/,
  );
});

test('rejects framework leakage in a CSS-only consumer', (context) => {
  const paths = createInstalledConsumer(context, { withVue: true });
  assert.throws(
    () => verifyInstalledCssConsumer({ ...paths, packages: [{ name: '@codemonster-ru/ui-css' }] }),
    /unexpectedly contains vue/,
  );
});
