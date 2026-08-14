#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverCodeMonsterUiWorkspaces } from './code-monster-ui-workspaces.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const registry = 'https://registry.npmjs.org/';
const keepTemporaryDirectory = process.argv.includes('--keep-temp');

for (const argument of process.argv.slice(2)) {
  if (argument !== '--keep-temp') throw new Error(`Unknown argument: ${argument}`);
}

const workspaces = discoverCodeMonsterUiWorkspaces(join(repositoryRoot, 'packages'));
const expectedNames = [
  '@codemonster-ru/ui-tokens',
  '@codemonster-ru/ui-runtime',
  '@codemonster-ru/ui-css',
  '@codemonster-ru/ui-utilities',
  '@codemonster-ru/ui-vue',
];
assert.deepEqual(
  workspaces.map(({ name }) => name),
  expectedNames,
  'The active Vue release cohort changed; review the registry consumer explicitly.',
);

const releases = new Map(
  workspaces.map((workspace) => {
    const manifest = JSON.parse(readFileSync(workspace.manifestPath, 'utf8'));
    return [workspace.name, manifest.version];
  }),
);
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'codemonster-ui-registry-consumer-'));
const consumerDirectory = join(temporaryDirectory, 'consumer');
const npmCacheDirectory = join(temporaryDirectory, 'npm-cache');

function run(command, arguments_) {
  console.log(`[ui-registry-consumer] $ ${command} ${arguments_.join(' ')}`);
  try {
    return execFileSync(command, arguments_, {
      cwd: consumerDirectory,
      env: {
        ...process.env,
        FORCE_COLOR: '0',
        npm_config_cache: npmCacheDirectory,
        npm_config_color: 'false',
        npm_config_fund: 'false',
        npm_config_registry: registry,
      },
      stdio: 'inherit',
    });
  } catch (error) {
    const cohort = [...releases].map(([name, version]) => `${name}@${version}`).join(', ');
    throw new Error(
      `Registry command failed. Confirm that the complete cohort is published and replicated on npm: ${cohort}.`,
      { cause: error },
    );
  }
}

function writeConsumer() {
  const dependencies = Object.fromEntries([...releases].map(([name, version]) => [name, version]));
  writeFileSync(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(
      {
        name: 'codemonster-ui-registry-consumer',
        private: true,
        version: '0.0.0',
        type: 'module',
        engines: { node: '^24.15.0 || >=26.0.0' },
        scripts: { build: 'vite build', ssr: 'node src/ssr.mjs', typecheck: 'tsc --noEmit' },
        dependencies: {
          ...dependencies,
          '@vue/server-renderer': '3.5.35',
          vue: '3.5.35',
        },
        devDependencies: {
          '@types/node': '24.3.1',
          typescript: '5.9.3',
          vite: '6.4.3',
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(consumerDirectory, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          lib: ['ES2022', 'DOM'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: 'ES2022',
        },
        include: ['src/**/*.ts'],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(consumerDirectory, 'index.html'),
    '<main id="app"></main><script type="module" src="/src/main.ts"></script>\n',
  );
  writeFileSync(
    join(consumerDirectory, 'src/main.ts'),
    [
      "import { createApp, h } from 'vue';",
      "import { CmButton } from '@codemonster-ru/ui-vue';",
      "import { CmRuntime } from '@codemonster-ru/ui-runtime';",
      "import { cmLightThemePreset } from '@codemonster-ru/ui-tokens';",
      "import '@codemonster-ru/ui-tokens/tokens.css';",
      "import '@codemonster-ru/ui-css/styles.css';",
      "import '@codemonster-ru/ui-css/fieldset.css';",
      "import '@codemonster-ru/ui-css/icon-button.css';",
      "import '@codemonster-ru/ui-css/progress-bar.css';",
      "import '@codemonster-ru/ui-css/progress-spinner.css';",
      "import '@codemonster-ru/ui-utilities/utilities.css';",
      '',
      'document.documentElement.dataset.cmTheme = cmLightThemePreset.mode;',
      'new CmRuntime().start(document);',
      "createApp({ render: () => h(CmButton, { variant: 'primary' }, () => 'Registry consumer') }).mount('#app');",
      '',
    ].join('\n'),
  );
  writeFileSync(
    join(consumerDirectory, 'src/ssr.mjs'),
    [
      "import { renderToString } from '@vue/server-renderer';",
      "import { createSSRApp, h } from 'vue';",
      "import { CmButton } from '@codemonster-ru/ui-vue';",
      "import { CmRuntime } from '@codemonster-ru/ui-runtime';",
      "import { cmLightThemePreset } from '@codemonster-ru/ui-tokens';",
      '',
      "const html = await renderToString(createSSRApp({ render: () => h(CmButton, null, () => 'Registry SSR') }));",
      "assert(html.includes('cm-button') && html.includes('Registry SSR'), 'Vue SSR output is incomplete.');",
      "assert(typeof new CmRuntime().start === 'function', 'Runtime import is not side-effect free.');",
      "assert(cmLightThemePreset.mode === 'light', 'Token runtime export is invalid.');",
      "console.log('[ui-registry-consumer] Node SSR and runtime imports passed.');",
      '',
      'function assert(condition, message) {',
      '  if (!condition) throw new Error(message);',
      '}',
      '',
    ].join('\n'),
  );
}

function verifyRegistryResolution() {
  const lock = JSON.parse(readFileSync(join(consumerDirectory, 'package-lock.json'), 'utf8'));
  for (const [name, version] of releases) {
    assert.equal(lock.packages['']?.dependencies?.[name], version, `${name} is not pinned exactly.`);
    const entry = lock.packages[`node_modules/${name}`];
    assert.equal(entry?.version, version, `${name}@${version} did not resolve from npm.`);
    assert.match(entry?.resolved ?? '', /^https:\/\/registry\.npmjs\.org\//u, `${name} did not resolve from npm.`);
    assert.match(entry?.integrity ?? '', /^sha512-/u, `${name} has no sha512 registry integrity.`);

    const manifest = JSON.parse(readFileSync(join(consumerDirectory, 'node_modules', name, 'package.json'), 'utf8'));
    assert.equal(manifest.name, name);
    assert.equal(manifest.version, version);
    for (const dependencies of [manifest.dependencies, manifest.optionalDependencies]) {
      for (const range of Object.values(dependencies ?? {})) {
        assert.doesNotMatch(String(range), /^(?:file:|link:|workspace:)/u, `${name} leaked a local dependency.`);
      }
    }
  }
  assert.doesNotMatch(
    JSON.stringify(lock),
    /(?:file:|link:|workspace:)/u,
    'The registry consumer lockfile contains a local dependency.',
  );
}

try {
  mkdirSync(consumerDirectory);
  mkdirSync(join(consumerDirectory, 'src'));
  writeConsumer();

  console.log(`[ui-registry-consumer] Installing exact release cohort from ${registry}.`);
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
  verifyRegistryResolution();
  run(join(consumerDirectory, 'node_modules/.bin/tsc'), ['--noEmit']);
  run(join(consumerDirectory, 'node_modules/.bin/vite'), ['build']);
  run(process.execPath, ['src/ssr.mjs']);

  const cssFiles = readdirSync(join(consumerDirectory, 'dist/assets')).filter((fileName) => fileName.endsWith('.css'));
  assert.equal(cssFiles.length, 1, 'Vite must emit one complete consumer stylesheet.');
  const css = readFileSync(join(consumerDirectory, 'dist/assets', cssFiles[0]), 'utf8');
  for (const selector of [
    '.cm-button',
    '.cm-fieldset',
    '.cm-icon-button',
    '.cm-progress-bar',
    '.cm-progress-spinner',
    '.cm-grid-cols-2',
  ]) {
    assert.ok(css.includes(selector), `Built registry CSS is missing ${selector}.`);
  }

  run('npm', ['audit', 'signatures']);
  console.log(
    `[ui-registry-consumer] OK: npm consumed ${releases.size} exact registry releases with verified signatures.`,
  );
} finally {
  if (keepTemporaryDirectory) {
    console.log(`[ui-registry-consumer] Kept temporary directory: ${temporaryDirectory}`);
  } else {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
