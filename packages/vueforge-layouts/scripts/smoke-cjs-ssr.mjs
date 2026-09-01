/* global process, console */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, parse } from 'node:path';

const nodeRequire = createRequire(import.meta.url);
const packageDir = process.cwd();
const corePackageDir = join(packageDir, '../core');
const iconsPackageDir = join(packageDir, '../icons');
const tempDir = mkdtempSync(join(tmpdir(), 'vueforge-layouts-cjs-ssr-'));
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
    throw new Error(`Unable to parse npm pack JSON output for ${packageRoot}.`);
  }

  const [packMeta] = JSON.parse(jsonTail[0]);
  if (!packMeta?.filename) {
    throw new Error(`Unable to resolve npm pack filename for ${packageRoot}.`);
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
  const packedLayoutsDir = extractPackage(packPackage(packageDir), join(tempDir, 'layouts'));
  const packedCoreDir = extractPackage(packPackage(corePackageDir), join(tempDir, 'core'));
  const packedIconsDir = extractPackage(packPackage(iconsPackageDir), join(tempDir, 'icons'));

  const runtimeNodeModules = join(tempDir, 'node_modules');
  for (const dependency of ['vue', '@vue/server-renderer', '@codemonster-ru/floater.js']) {
    linkPackage(runtimeNodeModules, dependency, resolvePackageRoot(dependency));
  }
  linkPackage(runtimeNodeModules, '@codemonster-ru/vueforge-icons', packedIconsDir);
  linkPackage(runtimeNodeModules, '@codemonster-ru/vueforge-core', packedCoreDir);
  linkPackage(runtimeNodeModules, '@codemonster-ru/vueforge-layouts', packedLayoutsDir);

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
const layouts = require('@codemonster-ru/vueforge-layouts');

assert.equal(typeof core.default.install, 'function');
assert.equal(typeof foundation.useBreakpoint, 'function');
assert.equal(typeof layouts.default.install, 'function');
assert.equal(typeof layouts.VfContainer, 'object');
assert.equal(typeof layouts.createLayoutsPreset, 'function');
assert.equal(typeof globalThis.document, 'undefined');

(async () => {
  const app = createSSRApp({
    render: () => h(layouts.VfContainer, { size: 'md' }, () => 'Layouts CJS SSR'),
  });
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.join(' '));
  try {
    app.use(layouts.default);
  } finally {
    console.warn = originalWarn;
  }
  assert.deepEqual(warnings, []);
  const html = await renderToString(app);
  assert.match(html, /vf-container/);
  assert.match(html, /Layouts CJS SSR/);
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
  console.log('Layouts packed CommonJS require and DOM-free SSR smoke passed.');
} finally {
  rmSync(tempDir, { force: true, recursive: true });
  for (const tarballPath of tarballPaths) {
    rmSync(tarballPath, { force: true });
  }
}
