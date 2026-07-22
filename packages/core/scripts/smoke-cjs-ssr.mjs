/* global process, console */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, parse } from 'node:path';

const nodeRequire = createRequire(import.meta.url);
const packageDir = process.cwd();
const iconsPackageDir = join(packageDir, '../icons');
const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-core-cjs-ssr-'));
const tarballPaths = [];

function resolvePackageRoot(packageName) {
  let currentDir = dirname(nodeRequire.resolve(packageName));

  while (currentDir !== parse(currentDir).root) {
    const packageJsonPath = join(currentDir, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      if (packageJson.name === packageName) {
        return currentDir;
      }
    }
    currentDir = dirname(currentDir);
  }

  throw new Error(`Unable to resolve package root for ${packageName}.`);
}

function linkPackage(nodeModulesDir, packageName, sourceDir) {
  const targetPath = join(nodeModulesDir, ...packageName.split('/'));
  mkdirSync(dirname(targetPath), { recursive: true });
  symlinkSync(sourceDir, targetPath, 'dir');
}

function packPackage(packageRoot) {
  const packedOutput = execFileSync('npm', ['pack', '--json', '--silent'], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_color: 'false',
      FORCE_COLOR: '0',
    },
  });
  const jsonTail = packedOutput.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/);
  if (!jsonTail) {
    throw new Error('Unable to parse npm pack JSON output.');
  }

  const [packMeta] = JSON.parse(jsonTail[0]);
  if (!packMeta?.filename) {
    throw new Error('Unable to resolve npm pack filename.');
  }

  const tarballPath = join(packageRoot, packMeta.filename);
  tarballPaths.push(tarballPath);
  return tarballPath;
}

function extractPackage(tarballPath, targetRoot) {
  mkdirSync(targetRoot, { recursive: true });
  execFileSync('tar', ['-xzf', tarballPath, '-C', targetRoot], { stdio: 'pipe' });
  return join(targetRoot, 'package');
}

try {
  const packedIconsDir = extractPackage(packPackage(iconsPackageDir), join(tempDir, 'icons'));
  const packedCoreDir = extractPackage(packPackage(packageDir), join(tempDir, 'core'));

  const runtimeNodeModules = join(tempDir, 'node_modules');
  for (const dependency of ['vue', '@vue/server-renderer', '@codemonster-ru/floater.js']) {
    linkPackage(runtimeNodeModules, dependency, resolvePackageRoot(dependency));
  }
  linkPackage(runtimeNodeModules, '@codemonster-ru/vueforge-icons', packedIconsDir);
  linkPackage(runtimeNodeModules, '@codemonster-ru/vueforge-core', packedCoreDir);

  const consumerDir = join(tempDir, 'consumer');
  mkdirSync(consumerDir, { recursive: true });
  const consumerPath = join(consumerDir, 'consumer.cjs');
  writeFileSync(
    consumerPath,
    `const assert = require('node:assert/strict');
const { createSSRApp, h } = require('vue');
const { renderToString } = require('@vue/server-renderer');

assert.equal(typeof globalThis.window, 'undefined');
assert.equal(typeof globalThis.document, 'undefined');
assert.throws(
  () => require.resolve('@codemonster-ru/vueforge-theme'),
  (error) => error && error.code === 'MODULE_NOT_FOUND',
);

const core = require('@codemonster-ru/vueforge-core');
const foundation = require('@codemonster-ru/vueforge-core/foundation');
const theme = require('@codemonster-ru/vueforge-core/theme');

assert.equal(typeof core.default.install, 'function');
assert.equal(typeof core.VfButton, 'object');
assert.equal(typeof foundation.useBreakpoint, 'function');
assert.equal(typeof theme.createThemePreset, 'function');
assert.ok(theme.defaultThemePreset);
assert.equal(typeof globalThis.document, 'undefined');

(async () => {
  const app = createSSRApp({
    render: () => h(core.VfButton, { variant: 'primary' }, () => 'Core CJS SSR'),
  });
  app.use(core.default);
  const html = await renderToString(app);
  assert.match(html, /vf-button/);
  assert.match(html, /Core CJS SSR/);
  assert.equal(typeof globalThis.document, 'undefined');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`,
  );

  execFileSync(process.execPath, [consumerPath], {
    cwd: consumerDir,
    stdio: 'inherit',
  });
  console.log('Core packed CommonJS require and DOM-free SSR smoke passed.');
} finally {
  rmSync(tempDir, { force: true, recursive: true });
  for (const tarballPath of tarballPaths) {
    rmSync(tarballPath, { force: true });
  }
}
