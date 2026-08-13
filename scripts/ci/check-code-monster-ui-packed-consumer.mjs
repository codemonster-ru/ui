#!/usr/bin/env node

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverCodeMonsterUiWorkspaces } from './code-monster-ui-workspaces.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const supportedManagers = new Set(['npm', 'pnpm', 'yarn']);
const managerArgument = process.argv.find((argument) => argument.startsWith('--manager='));
const manager = managerArgument?.slice('--manager='.length) ?? 'npm';
const keepTemporaryDirectory = process.argv.includes('--keep-temp');

if (!supportedManagers.has(manager)) {
  throw new Error(`Unsupported package manager "${manager}". Use npm, pnpm, or yarn.`);
}
for (const argument of process.argv.slice(2)) {
  if (argument !== '--keep-temp' && !argument.startsWith('--manager=')) {
    throw new Error(`Unknown argument: ${argument}`);
  }
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
  'The active Vue release train changed; review the packed consumer explicitly.',
);

const temporaryDirectory = mkdtempSync(join(tmpdir(), 'codemonster-ui-packed-consumer-'));
const tarballDirectory = join(temporaryDirectory, 'tarballs');
const consumerDirectory = join(temporaryDirectory, 'consumer');
const npmCacheDirectory = join(temporaryDirectory, 'npm-cache');
const yarnCacheDirectory = join(temporaryDirectory, 'yarn-cache');

function portablePath(filePath) {
  return filePath.split(sep).join('/');
}

function run(command, arguments_, options = {}) {
  console.log(`[ui-packed-consumer] $ ${command} ${arguments_.join(' ')}`);
  return execFileSync(command, arguments_, {
    cwd: options.cwd ?? consumerDirectory,
    encoding: options.encoding,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      npm_config_cache: npmCacheDirectory,
      npm_config_color: 'false',
      npm_config_fund: 'false',
    },
    stdio: options.stdio ?? 'inherit',
  });
}

function managerVersion() {
  return run(manager, ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function install(version) {
  if (manager === 'npm') {
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
    return;
  }
  if (manager === 'pnpm') {
    run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile', '--strict-peer-dependencies']);
    return;
  }
  if (Number.parseInt(version, 10) <= 1) {
    run('yarn', [
      'install',
      '--ignore-scripts',
      '--non-interactive',
      '--no-progress',
      '--cache-folder',
      yarnCacheDirectory,
    ]);
    return;
  }
  writeFileSync(join(consumerDirectory, '.yarnrc.yml'), 'enableScripts: false\n');
  run('yarn', ['install']);
}

function writeConsumer(tarballs) {
  const resolutions = Object.fromEntries(
    [...tarballs].map(([name, tarballPath]) => [
      name,
      `file:${portablePath(relative(consumerDirectory, tarballPath))}`,
    ]),
  );
  const manifest = {
    name: 'codemonster-ui-packed-consumer',
    private: true,
    version: '0.0.0',
    type: 'module',
    engines: { node: '^24.15.0 || >=26.0.0' },
    scripts: {
      build: 'vite build',
      typecheck: 'tsc --noEmit',
      ssr: 'node src/ssr.mjs',
    },
    dependencies: {
      ...resolutions,
      '@vue/server-renderer': '3.5.35',
      vue: '3.5.35',
    },
    devDependencies: {
      '@types/node': '^24.0.0',
      typescript: '5.9.3',
      vite: '6.4.3',
    },
  };
  if (manager === 'pnpm') {
    manifest.pnpm = { overrides: resolutions };
  } else if (manager === 'yarn') {
    manifest.resolutions = resolutions;
  }

  writeFileSync(join(consumerDirectory, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
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
      "import '@codemonster-ru/ui-utilities/utilities.css';",
      '',
      'document.documentElement.dataset.cmTheme = cmLightThemePreset.mode;',
      'new CmRuntime().start(document);',
      "createApp({ render: () => h(CmButton, { variant: 'primary' }, () => 'Packed consumer') }).mount('#app');",
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
      "const html = await renderToString(createSSRApp({ render: () => h(CmButton, null, () => 'SSR') }));",
      "assert(html.includes('cm-button') && html.includes('SSR'), 'Vue SSR output is incomplete.');",
      "assert(typeof new CmRuntime().start === 'function', 'Runtime import is not side-effect free.');",
      "assert(cmLightThemePreset.mode === 'light', 'Token runtime export is invalid.');",
      "console.log('[ui-packed-consumer] Node SSR and runtime imports passed.');",
      '',
      'function assert(condition, message) {',
      '  if (!condition) throw new Error(message);',
      '}',
      '',
    ].join('\n'),
  );
}

try {
  mkdirSync(tarballDirectory);
  mkdirSync(consumerDirectory);
  mkdirSync(join(consumerDirectory, 'src'));
  const tarballs = new Map();

  for (const workspace of workspaces) {
    const packageDirectory = dirname(workspace.manifestPath);
    const manifest = JSON.parse(readFileSync(workspace.manifestPath, 'utf8'));
    if (!existsSync(join(packageDirectory, 'dist'))) {
      throw new Error(`${workspace.name} has no dist directory. Run npm run build:ui first.`);
    }
    const output = run(
      'npm',
      ['pack', '--json', '--silent', '--ignore-scripts', '--pack-destination', tarballDirectory],
      { cwd: packageDirectory, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const [metadata] = JSON.parse(output.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/u)?.[0] ?? '[]');
    assert.equal(metadata?.name, workspace.name);
    assert.equal(metadata?.version, manifest.version);
    tarballs.set(workspace.name, join(tarballDirectory, metadata.filename));
  }

  writeConsumer(tarballs);
  const version = managerVersion();
  console.log(`[ui-packed-consumer] Using ${manager} ${version}.`);
  install(version);
  run(join(consumerDirectory, 'node_modules/.bin/tsc'), ['--noEmit']);
  run(join(consumerDirectory, 'node_modules/.bin/vite'), ['build']);
  run(process.execPath, ['src/ssr.mjs']);

  const cssAssets = readdirSync(join(consumerDirectory, 'dist/assets')).filter((fileName) => fileName.endsWith('.css'));
  assert.equal(cssAssets.length, 1, 'Vite must emit one complete consumer stylesheet.');
  const outputCss = readFileSync(join(consumerDirectory, 'dist/assets', cssAssets[0]), 'utf8');
  assert.match(outputCss, /\.cm-button/u);
  assert.match(outputCss, /\.cm-stack/u);
  assert.match(outputCss, /\.cm-grid-cols-2/u);
  for (const name of expectedNames) {
    const installedManifest = JSON.parse(readFileSync(join(consumerDirectory, 'node_modules', name, 'package.json')));
    assert.equal(installedManifest.name, name);
    for (const dependencies of [installedManifest.dependencies, installedManifest.optionalDependencies]) {
      for (const range of Object.values(dependencies ?? {})) {
        assert.ok(!String(range).startsWith('file:'), `${name} leaked a file dependency.`);
      }
    }
  }

  console.log(`[ui-packed-consumer] OK: ${manager} consumed ${workspaces.length} CodeMonster UI tarballs.`);
} finally {
  if (keepTemporaryDirectory) {
    console.log(`[ui-packed-consumer] Kept temporary directory: ${temporaryDirectory}`);
  } else {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
