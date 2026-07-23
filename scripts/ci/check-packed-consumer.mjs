import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const packageContracts = [
  {
    directory: 'theme',
    entry: '@codemonster-ru/vueforge-theme',
    name: '@codemonster-ru/vueforge-theme',
    version: '2.0.0',
  },
  {
    directory: 'icons',
    entry: '@codemonster-ru/vueforge-icons',
    name: '@codemonster-ru/vueforge-icons',
    version: '2.0.0',
  },
  {
    directory: 'core',
    entry: '@codemonster-ru/vueforge-core',
    name: '@codemonster-ru/vueforge-core',
    version: '2.0.0',
  },
  {
    directory: 'layouts',
    entry: '@codemonster-ru/vueforge-layouts',
    name: '@codemonster-ru/vueforge-layouts',
    version: '2.0.0',
  },
  {
    directory: 'codeblock',
    entry: '@codemonster-ru/vueforge-codeblock/view',
    name: '@codemonster-ru/vueforge-codeblock',
    version: '4.0.0',
  },
  {
    directory: 'playground-core',
    entry: '@codemonster-ru/vueforge-playground-core',
    name: '@codemonster-ru/vueforge-playground-core',
    version: '2.0.0',
  },
  {
    directory: 'playground-vite-plugin',
    entry: '@codemonster-ru/vueforge-playground-vite-plugin',
    name: '@codemonster-ru/vueforge-playground-vite-plugin',
    version: '1.0.0',
  },
  {
    directory: 'playground',
    entry: '@codemonster-ru/vueforge-playground/runtime',
    name: '@codemonster-ru/vueforge-playground',
    version: '3.0.0',
  },
];
const runtimeDependencyFields = ['dependencies', 'optionalDependencies', 'peerDependencies'];
const supportedManagers = new Set(['npm', 'pnpm', 'yarn']);
const temporaryDirectory = mkdtempSync(join(tmpdir(), 'vueforge-packed-consumer-'));
const tarballDirectory = join(temporaryDirectory, 'tarballs');
const consumerDirectory = join(temporaryDirectory, 'consumer');
const npmCacheDirectory = join(temporaryDirectory, 'npm-cache');
const yarnCacheDirectory = join(temporaryDirectory, 'yarn-cache');
const keepTemporaryDirectory = process.env.VUEFORGE_KEEP_PACKED_CONSUMER === '1';

function parseManagerArgument(arguments_) {
  let manager = 'npm';

  for (const argument of arguments_) {
    if (argument.startsWith('--manager=')) {
      manager = argument.slice('--manager='.length);
      continue;
    }
    if (argument === '--keep-temp') {
      continue;
    }
    throw new Error(`Unknown argument: ${argument}`);
  }

  if (!supportedManagers.has(manager)) {
    throw new Error(`Unsupported package manager "${manager}". Use npm, pnpm, or yarn.`);
  }

  return manager;
}

const manager = parseManagerArgument(process.argv.slice(2));
const keepOnCommandLine = process.argv.includes('--keep-temp');

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function displayCommand(command, arguments_) {
  return [command, ...arguments_]
    .map((part) => (/^[A-Za-z0-9_./:=@-]+$/.test(part) ? part : JSON.stringify(part)))
    .join(' ');
}

function run(command, arguments_, options = {}) {
  console.log(`[packed-consumer] $ ${displayCommand(command, arguments_)}`);
  return execFileSync(command, arguments_, {
    cwd: options.cwd ?? consumerDirectory,
    encoding: options.encoding,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      npm_config_cache: npmCacheDirectory,
      npm_config_color: 'false',
      npm_config_fund: 'false',
      ...options.env,
    },
    stdio: options.stdio ?? 'inherit',
  });
}

function assertManagerAvailable() {
  try {
    const version = execFileSync(manager, ['--version'], {
      cwd: consumerDirectory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
    console.log(`[packed-consumer] Using ${manager} ${version}.`);
    return version;
  } catch {
    throw new Error(
      `The requested package manager "${manager}" is not available in PATH. Install or activate it before running this check.`,
    );
  }
}

function parsePackOutput(output, packageName) {
  const jsonTail = output.match(/\[\s*\{[\s\S]*\}\s*\]\s*$/);
  if (!jsonTail) {
    throw new Error(`Unable to parse npm pack JSON output for ${packageName}.`);
  }

  const [packMetadata] = JSON.parse(jsonTail[0]);
  if (!packMetadata?.filename) {
    throw new Error(`npm pack did not return a filename for ${packageName}.`);
  }

  return packMetadata;
}

function packPackages() {
  const tarballs = new Map();
  mkdirSync(tarballDirectory, { recursive: true });

  for (const contract of packageContracts) {
    const packageDirectory = join(repositoryRoot, 'packages', contract.directory);
    if (!existsSync(join(packageDirectory, 'dist'))) {
      throw new Error(`${contract.name} has no dist directory. Run the full build before this check.`);
    }

    const output = run(
      'npm',
      ['pack', '--json', '--silent', '--ignore-scripts', '--pack-destination', tarballDirectory],
      {
        cwd: packageDirectory,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    const metadata = parsePackOutput(output, contract.name);
    if (metadata.name !== contract.name || metadata.version !== contract.version) {
      throw new Error(`Packed ${metadata.name}@${metadata.version}; expected ${contract.name}@${contract.version}.`);
    }

    const tarballPath = join(tarballDirectory, metadata.filename);
    assert.ok(existsSync(tarballPath), `Tarball was not written: ${tarballPath}`);
    tarballs.set(contract.name, tarballPath);
    console.log(`[packed-consumer] Packed ${contract.name}@${contract.version}.`);
  }

  return tarballs;
}

function toPortablePath(filePath) {
  return filePath.split(sep).join('/');
}

function createConsumerManifest(tarballs) {
  const dependencies = {
    '@vue/server-renderer': '3.5.35',
    vue: '3.5.35',
  };
  const packedPackageResolutions = {};

  for (const contract of packageContracts) {
    const tarballPath = tarballs.get(contract.name);
    const tarballSpecifier = `file:${toPortablePath(relative(consumerDirectory, tarballPath))}`;
    dependencies[contract.name] = tarballSpecifier;
    packedPackageResolutions[contract.name] = tarballSpecifier;
  }

  const manifest = {
    name: 'vueforge-packed-consumer-contract',
    private: true,
    version: '0.0.0',
    type: 'module',
    engines: {
      node: '>=20',
    },
    dependencies,
    devDependencies: {
      '@types/node': '^24.0.0',
      typescript: '5.9.3',
      vite: '6.4.3',
    },
  };

  if (manager === 'pnpm') {
    manifest.pnpm = { overrides: packedPackageResolutions };
  } else if (manager === 'yarn') {
    manifest.resolutions = packedPackageResolutions;
  }

  return manifest;
}

function installConsumer(managerVersion) {
  if (manager === 'npm') {
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund']);
    return;
  }

  if (manager === 'pnpm') {
    run('pnpm', ['install', '--ignore-scripts', '--no-frozen-lockfile', '--strict-peer-dependencies']);
    return;
  }

  const yarnMajor = Number.parseInt(managerVersion.split('.')[0], 10);
  if (Number.isFinite(yarnMajor) && yarnMajor <= 1) {
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

function runPackageBinary(binary, arguments_) {
  if (manager === 'npm') {
    run('npm', ['exec', '--', binary, ...arguments_]);
  } else if (manager === 'pnpm') {
    run('pnpm', ['exec', binary, ...arguments_]);
  } else {
    run('yarn', ['exec', binary, '--', ...arguments_]);
  }
}

function runConsumerNode(scriptPath, nodeArguments = []) {
  const relativeScriptPath = toPortablePath(relative(consumerDirectory, scriptPath));
  if (manager === 'npm') {
    run('npm', ['exec', '--', 'node', ...nodeArguments, relativeScriptPath]);
  } else if (manager === 'pnpm') {
    run('pnpm', ['exec', 'node', ...nodeArguments, relativeScriptPath]);
  } else {
    run('yarn', ['node', ...nodeArguments, relativeScriptPath]);
  }
}

function runtimeTarget(exportValue, condition) {
  if (typeof exportValue === 'string') {
    return exportValue;
  }
  if (!exportValue || typeof exportValue !== 'object') {
    return null;
  }

  const branch = exportValue[condition];
  if (typeof branch === 'string') {
    return branch;
  }
  if (branch && typeof branch === 'object') {
    return branch.default ?? null;
  }

  return null;
}

function publicSpecifier(packageName, exportKey) {
  return exportKey === '.' ? packageName : `${packageName}/${exportKey.slice(2)}`;
}

function collectPublicSpecifiers(manifests, condition) {
  const specifiers = [];

  for (const contract of packageContracts) {
    const manifest = manifests.get(contract.name);
    for (const [exportKey, exportValue] of Object.entries(manifest.exports ?? {})) {
      const target = runtimeTarget(exportValue, condition);
      if (typeof target !== 'string' || target.endsWith('.css') || target.endsWith('.json')) {
        continue;
      }
      specifiers.push(publicSpecifier(contract.name, exportKey));
    }
  }

  return specifiers;
}

function collectPublicCssSpecifiers(manifests) {
  const specifiers = [];

  for (const contract of packageContracts) {
    const manifest = manifests.get(contract.name);
    for (const [exportKey, exportValue] of Object.entries(manifest.exports ?? {})) {
      const target = runtimeTarget(exportValue, 'import');
      if (typeof target === 'string' && target.endsWith('.css')) {
        specifiers.push(publicSpecifier(contract.name, exportKey));
      }
    }
  }

  return specifiers;
}

function createInstalledPackageVerification() {
  const embeddedContracts = packageContracts.map(({ entry, name, version }) => ({ entry, name, version }));

  return `import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const contracts = ${JSON.stringify(embeddedContracts, null, 2)};
const contractByName = new Map(contracts.map((contract) => [contract.name, contract]));
const repositoryRoot = ${JSON.stringify(repositoryRoot)};
const temporaryRoot = ${JSON.stringify(temporaryDirectory)};
const canonicalRepositoryRoot = realpathSync(repositoryRoot);
const canonicalTemporaryRoot = realpathSync(temporaryRoot);
const runtimeDependencyFields = ${JSON.stringify(runtimeDependencyFields)};

function isWithin(parent, child) {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..' + sep) && path !== '..');
}

function findPackageRoot(resolvedUrl, expectedName) {
  assert.match(resolvedUrl, /^file:/, expectedName + ' did not resolve to a local installed file');
  let current = dirname(fileURLToPath(resolvedUrl));
  const filesystemRoot = resolve(current, sep);

  while (current !== filesystemRoot) {
    const manifestPath = resolve(current, 'package.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      if (manifest.name === expectedName) {
        return { manifest, manifestPath, root: current };
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error('Could not locate installed manifest for ' + expectedName + ' from ' + resolvedUrl);
}

function resolvePackage(contract, parentUrl = import.meta.url) {
  return findPackageRoot(import.meta.resolve(contract.entry, parentUrl), contract.name);
}

function walkFiles(directory, output = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, output);
    } else if (entry.isFile()) {
      output.push(entryPath);
    }
  }
  return output;
}

const installed = new Map();
for (const contract of contracts) {
  const resolvedPackage = resolvePackage(contract);
  assert.equal(resolvedPackage.manifest.version, contract.version, contract.name + ' resolved to the wrong version');
  const canonicalRoot = realpathSync(resolvedPackage.root);
  assert.equal(isWithin(canonicalRepositoryRoot, canonicalRoot), false, contract.name + ' resolves into the monorepo');
  assert.equal(isWithin(canonicalTemporaryRoot, canonicalRoot), true, contract.name + ' resolves outside the isolated consumer');
  installed.set(contract.name, resolvedPackage);

  const manifestSource = readFileSync(resolvedPackage.manifestPath, 'utf8');
  assert.equal(manifestSource.includes(repositoryRoot), false, contract.name + ' manifest leaks the monorepo path');

  for (const field of runtimeDependencyFields) {
    for (const [dependencyName, dependencyRange] of Object.entries(resolvedPackage.manifest[field] ?? {})) {
      assert.doesNotMatch(
        dependencyRange,
        /^(?:file|link|portal|workspace):/,
        contract.name + ' has a local-path runtime dependency on ' + dependencyName,
      );
      assert.notEqual(dependencyName, 'shiki', contract.name + ' exposes shiki as a production dependency');
      assert.equal(
        dependencyName.startsWith('@shikijs/'),
        false,
        contract.name + ' exposes ' + dependencyName + ' as a production dependency',
      );
    }
  }

  const textExtensions = new Set(['.cjs', '.cts', '.js', '.json', '.map', '.mjs', '.ts']);
  for (const filePath of walkFiles(resolvedPackage.root)) {
    if (!textExtensions.has(extname(filePath)) || statSync(filePath).size > 8 * 1024 * 1024) continue;
    const source = readFileSync(filePath, 'utf8');
    assert.equal(source.includes(repositoryRoot), false, contract.name + ' artifact leaks the monorepo path');
  }
}

for (const [packageName, resolvedPackage] of installed) {
  const parentUrl = pathToFileURL(resolvedPackage.manifestPath).href;
  for (const field of runtimeDependencyFields) {
    for (const dependencyName of Object.keys(resolvedPackage.manifest[field] ?? {})) {
      const dependencyContract = contractByName.get(dependencyName);
      if (!dependencyContract) continue;
      const resolvedDependency = resolvePackage(dependencyContract, parentUrl);
      assert.equal(
        resolvedDependency.manifest.version,
        dependencyContract.version,
        packageName + ' resolves ' + dependencyName + ' outside the release train',
      );
      assert.equal(
        realpathSync(resolvedDependency.root),
        realpathSync(installed.get(dependencyName).root),
        packageName + ' resolves a different installation of ' + dependencyName,
      );
      assert.equal(
        isWithin(canonicalRepositoryRoot, realpathSync(resolvedDependency.root)),
        false,
        packageName + ' resolves ' + dependencyName + ' from the monorepo',
      );
    }
  }
}

const codeblock = installed.get('@codemonster-ru/vueforge-codeblock');
let shikiResolution = null;
try {
  shikiResolution = import.meta.resolve('shiki', pathToFileURL(codeblock.manifestPath).href);
} catch (error) {
  assert.ok(
    error && ['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND'].includes(error.code),
    'Unexpected error while proving that shiki is absent: ' + String(error),
  );
}
assert.equal(shikiResolution, null, 'shiki is installed in the packed production consumer graph');

assert.equal(globalThis.document, undefined);
console.log('[packed-consumer] Installed package graph is isolated, exact, and free of production shiki.');
`;
}

function createTypeFixtures(manifests) {
  const esmSpecifiers = collectPublicSpecifiers(manifests, 'import');
  const cjsSpecifiers = collectPublicSpecifiers(manifests, 'require');
  const typesDirectory = join(consumerDirectory, 'types');
  mkdirSync(typesDirectory, { recursive: true });

  const esmImports = esmSpecifiers
    .map((specifier, index) => `import * as entry${index} from ${JSON.stringify(specifier)};`)
    .join('\n');
  const esmUses = esmSpecifiers.map((_, index) => `  entry${index},`).join('\n');
  writeFileSync(join(typesDirectory, 'public-exports.mts'), `${esmImports}\n\nvoid [\n${esmUses}\n];\n`);

  const cjsImports = cjsSpecifiers
    .map((specifier, index) => `import entry${index} = require(${JSON.stringify(specifier)});`)
    .join('\n');
  const cjsUses = cjsSpecifiers.map((_, index) => `  entry${index},`).join('\n');
  writeFileSync(join(typesDirectory, 'public-requires.cts'), `${cjsImports}\n\nvoid [\n${cjsUses}\n];\n`);

  writeFileSync(
    join(typesDirectory, 'floating-contract.mts'),
    `import type { UseFloatingOptions } from '@codemonster-ru/vueforge-core';

type FloatingMiddlewareArray = Extract<
  NonNullable<UseFloatingOptions['middleware']>,
  readonly unknown[]
>;
type FloatingMiddleware = FloatingMiddlewareArray[number];

const validFloatingMiddleware: FloatingMiddleware = {
  name: 'consumer',
  fn: (context) => {
    const siblingName = context.options.middleware?.[0]?.name;
    void siblingName;
    return {
      x: context.x,
      y: context.y,
      placement: context.placement,
    };
  },
};
const invalidFloatingMiddleware: FloatingMiddleware = {
  name: 'invalid',
  // @ts-expect-error middleware functions must return positioned coordinates
  fn: () => null,
};
const options: UseFloatingOptions = { middleware: [validFloatingMiddleware] };

void [options, invalidFloatingMiddleware];
`,
  );

  const commonCompilerOptions = {
    target: 'ES2022',
    strict: true,
    noEmit: true,
    skipLibCheck: false,
    lib: ['ES2022', 'DOM', 'DOM.Iterable'],
    types: ['node'],
    verbatimModuleSyntax: true,
  };
  writeJson(join(consumerDirectory, 'tsconfig.bundler.json'), {
    compilerOptions: {
      ...commonCompilerOptions,
      module: 'ESNext',
      moduleResolution: 'Bundler',
    },
    include: ['types/public-exports.mts', 'types/floating-contract.mts'],
  });
  writeJson(join(consumerDirectory, 'tsconfig.nodenext.json'), {
    compilerOptions: {
      ...commonCompilerOptions,
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
    },
    include: ['types/public-exports.mts', 'types/public-requires.cts', 'types/floating-contract.mts'],
  });
}

function createViteFixture(manifests) {
  const sourceDirectory = join(consumerDirectory, 'src');
  const cssSpecifiers = collectPublicCssSpecifiers(manifests);
  mkdirSync(sourceDirectory, { recursive: true });
  writeFileSync(
    join(consumerDirectory, 'index.html'),
    '<!doctype html><html><body><main id="app"></main><script type="module" src="/src/main.ts"></script></body></html>\n',
  );
  writeFileSync(join(sourceDirectory, 'virtual-entry.js'), 'export default "virtual-entry-ok";\n');
  writeFileSync(
    join(sourceDirectory, 'main.ts'),
    `import virtualValue from 'virtual:vueforge-playground/consumer';
import { VfButton } from '@codemonster-ru/vueforge-core/button';
import { VfContainer } from '@codemonster-ru/vueforge-layouts/container';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
import { VfPlayground } from '@codemonster-ru/vueforge-playground/ui';

const retainedExports = [VfButton, VfContainer, VueIconify, icons.warning, VfCodeBlock, VfPlayground];
document.querySelector('#app')?.setAttribute(
  'data-vueforge-packed-consumer',
  [virtualValue, retainedExports.length].join(':'),
);
`,
  );
  writeFileSync(
    join(consumerDirectory, 'vite.config.mjs'),
    `import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import { vueforgePlaygroundVirtualPlugin } from '@codemonster-ru/vueforge-playground-vite-plugin';

export default defineConfig({
  plugins: [
    vueforgePlaygroundVirtualPlugin({
      entries: {
        consumer: resolve('src/virtual-entry.js'),
      },
    }),
  ],
  build: {
    outDir: 'dist-vite',
  },
});
`,
  );

  writeFileSync(
    join(sourceDirectory, 'explicit-css.ts'),
    `${cssSpecifiers.map((specifier) => `import ${JSON.stringify(specifier)};`).join('\n')}

export const importedCssEntryCount = ${cssSpecifiers.length};
`,
  );
  writeFileSync(
    join(consumerDirectory, 'vite.explicit-css.config.mjs'),
    `import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: resolve('src/explicit-css.ts'),
      fileName: 'explicit-css',
      formats: ['es'],
    },
    outDir: 'dist-explicit-css',
  },
});
`,
  );

  return cssSpecifiers.length;
}

function createEsmSsrFixture(manifests) {
  const publicImports = collectPublicSpecifiers(manifests, 'import')
    .map((specifier) => `  import(${JSON.stringify(specifier)}),`)
    .join('\n');

  return `import assert from 'node:assert/strict';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { VfButton } from '@codemonster-ru/vueforge-core/button';
import { VfContainer } from '@codemonster-ru/vueforge-layouts/container';
import { VueIconify, icons } from '@codemonster-ru/vueforge-icons';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
import { VfPlayground } from '@codemonster-ru/vueforge-playground/ui';

assert.equal(globalThis.window, undefined);
assert.equal(globalThis.document, undefined);

const publicEntries = await Promise.all([
${publicImports}
]);
assert.ok(publicEntries.every((entry) => entry && typeof entry === 'object'));

const Preview = { render: () => h('span', 'Packed preview') };
const app = createSSRApp({
  render: () => h('main', [
    h(VfButton, { variant: 'primary' }, () => 'Packed button'),
    h(VfContainer, { size: 'md' }, () => 'Packed container'),
    h(VueIconify, { icon: icons.warning, size: 16 }),
    h(VfCodeBlock, { code: 'const packed = true', highlight: false }),
    h(VfPlayground, { mode: 'component', component: Preview }),
  ]),
});
const html = await renderToString(app);
for (const marker of ['vf-button', 'vf-container', 'vf-icon', 'vf-codeblock', 'vf-playground']) {
  assert.match(html, new RegExp(marker), 'SSR output is missing ' + marker);
}
assert.equal(globalThis.document, undefined);
console.log('[packed-consumer] Node ESM imported every public JS entry and rendered all UI packages.');
`;
}

function createCjsSsrFixture(manifests) {
  const publicRequires = collectPublicSpecifiers(manifests, 'require')
    .map((specifier) => `  require(${JSON.stringify(specifier)}),`)
    .join('\n');

  return `const assert = require('node:assert/strict');
const { createSSRApp, h } = require('vue');
const { renderToString } = require('@vue/server-renderer');

assert.equal(globalThis.window, undefined);
assert.equal(globalThis.document, undefined);
const publicEntries = [
${publicRequires}
];
assert.ok(publicEntries.every((entry) => entry && (typeof entry === 'object' || typeof entry === 'function')));

const core = require('@codemonster-ru/vueforge-core');
const layouts = require('@codemonster-ru/vueforge-layouts');
const icons = require('@codemonster-ru/vueforge-icons');
const codeblock = require('@codemonster-ru/vueforge-codeblock/view');

(async () => {
  const app = createSSRApp({
    render: () => h('main', [
      h(core.VfButton, { variant: 'primary' }, () => 'Packed CJS button'),
      h(layouts.VfContainer, { size: 'md' }, () => 'Packed CJS container'),
      h(icons.VueIconify, { icon: icons.icons.warning, size: 16 }),
      h(codeblock.VfCodeBlock, { code: 'const packed = true', highlight: false }),
    ]),
  });
  const html = await renderToString(app);
  for (const marker of ['vf-button', 'vf-container', 'vf-icon', 'vf-codeblock']) {
    assert.match(html, new RegExp(marker), 'CJS SSR output is missing ' + marker);
  }
  assert.equal(globalThis.document, undefined);
  console.log('[packed-consumer] Every declared CommonJS export required successfully and rendered without a DOM.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;
}

function createTreeShakingFixture() {
  const sourceDirectory = join(consumerDirectory, 'src');
  writeFileSync(
    join(sourceDirectory, 'tree-shaking.ts'),
    `export { VfButton } from '@codemonster-ru/vueforge-core/button';\n`,
  );
  writeFileSync(
    join(consumerDirectory, 'vite.tree.config.mjs'),
    `import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    cssCodeSplit: true,
    emptyOutDir: true,
    lib: {
      entry: resolve('src/tree-shaking.ts'),
      fileName: 'tree-shaking',
      formats: ['es'],
    },
    minify: true,
    outDir: 'dist-tree-shaking',
    rollupOptions: {
      external: [
        'vue',
        '@codemonster-ru/floater.js',
        '@codemonster-ru/vueforge-icons',
        '@codemonster-ru/vueforge-theme',
      ],
    },
  },
});
`,
  );
}

function collectFiles(directory, extension, output = []) {
  if (!existsSync(directory)) {
    return output;
  }
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(entryPath, extension, output);
    } else if (entry.isFile() && entry.name.endsWith(extension)) {
      output.push(entryPath);
    }
  }
  return output;
}

function assertViteCss() {
  const cssFiles = collectFiles(join(consumerDirectory, 'dist-vite'), '.css');
  assert.ok(cssFiles.length > 0, 'The packed Vite build emitted no CSS.');
  const css = cssFiles.map((filePath) => readFileSync(filePath, 'utf8')).join('\n');
  for (const marker of ['vf-button', 'vf-container', 'vf-icon', 'vf-codeblock', 'vf-playground']) {
    assert.match(css, new RegExp(`\\.${marker}(?:[^A-Za-z0-9_-]|$)`), `Vite CSS is missing .${marker}.`);
  }
  console.log(`[packed-consumer] Vite retained CSS from all UI package entry points (${cssFiles.length} file(s)).`);
}

function assertExplicitCss(cssExportCount) {
  const cssFiles = collectFiles(join(consumerDirectory, 'dist-explicit-css'), '.css');
  assert.ok(cssFiles.length > 0, 'The explicit CSS export build emitted no CSS.');
  const css = cssFiles.map((filePath) => readFileSync(filePath, 'utf8')).join('\n');
  for (const marker of ['vf-button', 'vf-container', 'vf-icon', 'vf-codeblock', 'vf-playground']) {
    assert.match(css, new RegExp(`\\.${marker}(?:[^A-Za-z0-9_-]|$)`), `Explicit CSS is missing .${marker}.`);
  }
  console.log(`[packed-consumer] Vite resolved all ${cssExportCount} explicit CSS exports.`);
}

function assertTreeShaking() {
  const outputDirectory = join(consumerDirectory, 'dist-tree-shaking');
  const cssFiles = collectFiles(outputDirectory, '.css');
  const jsFiles = [...collectFiles(outputDirectory, '.js'), ...collectFiles(outputDirectory, '.mjs')];
  assert.ok(cssFiles.length > 0, 'Single-component bundle dropped its CSS side effect.');
  assert.ok(jsFiles.length > 0, 'Single-component bundle emitted no JavaScript.');

  const css = cssFiles.map((filePath) => readFileSync(filePath, 'utf8')).join('\n');
  const javascript = jsFiles
    .map((filePath) => readFileSync(filePath))
    .reduce((total, source) => total + source.length, 0);
  const gzipBytes = jsFiles.reduce((total, filePath) => total + zlib.gzipSync(readFileSync(filePath)).length, 0);

  assert.match(css, /\.vf-button(?:[^A-Za-z0-9_-]|$)/, 'Single-component bundle lost button CSS.');
  assert.doesNotMatch(css, /\.vf-accordion(?:[^A-Za-z0-9_-]|$)/, 'Button import retained unrelated accordion CSS.');
  assert.ok(gzipBytes <= 12 * 1024, `Single-component JS is not tree-shaken (${gzipBytes} gzip bytes).`);
  console.log(
    `[packed-consumer] Packed tree shaking retained button CSS: ${javascript} JS bytes, ${gzipBytes} gzip bytes.`,
  );
}

function loadSourceManifests() {
  return new Map(
    packageContracts.map((contract) => [
      contract.name,
      readJson(join(repositoryRoot, 'packages', contract.directory, 'package.json')),
    ]),
  );
}

let completed = false;

try {
  const relativeTempPath = relative(repositoryRoot, temporaryDirectory);
  assert.ok(
    relativeTempPath === '..' || relativeTempPath.startsWith(`..${sep}`),
    'Packed consumer temporary directory must be outside the workspace.',
  );
  mkdirSync(consumerDirectory, { recursive: true });
  const managerVersion = assertManagerAvailable();
  console.log(`[packed-consumer] Isolated workspace: ${temporaryDirectory}`);
  console.log('[packed-consumer] Assumption: all eight package dist directories were built before this command.');

  const tarballs = packPackages();
  writeJson(join(consumerDirectory, 'package.json'), createConsumerManifest(tarballs));
  installConsumer(managerVersion);

  const manifests = loadSourceManifests();
  writeFileSync(join(consumerDirectory, 'verify-installed.mjs'), createInstalledPackageVerification());
  createTypeFixtures(manifests);
  const cssExportCount = createViteFixture(manifests);
  writeFileSync(join(consumerDirectory, 'ssr-esm.mjs'), createEsmSsrFixture(manifests));
  writeFileSync(join(consumerDirectory, 'ssr-cjs.cjs'), createCjsSsrFixture(manifests));
  createTreeShakingFixture();

  runConsumerNode(join(consumerDirectory, 'verify-installed.mjs'), ['--experimental-import-meta-resolve']);
  runPackageBinary('tsc', ['--project', 'tsconfig.bundler.json', '--pretty', 'false']);
  runPackageBinary('tsc', ['--project', 'tsconfig.nodenext.json', '--pretty', 'false']);
  runPackageBinary('vite', ['build', '--config', 'vite.config.mjs']);
  assertViteCss();
  runPackageBinary('vite', ['build', '--config', 'vite.explicit-css.config.mjs']);
  assertExplicitCss(cssExportCount);
  runConsumerNode(join(consumerDirectory, 'ssr-esm.mjs'));
  runConsumerNode(join(consumerDirectory, 'ssr-cjs.cjs'));
  runPackageBinary('vite', ['build', '--config', 'vite.tree.config.mjs']);
  assertTreeShaking();

  completed = true;
  console.log(`[packed-consumer] OK: ${manager} installed and consumed all eight real tarballs.`);
} finally {
  if (keepTemporaryDirectory || keepOnCommandLine) {
    console.log(`[packed-consumer] Kept temporary directory: ${temporaryDirectory}`);
  } else {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }

  if (!completed) {
    console.error(
      '[packed-consumer] FAILED. Re-run with --keep-temp or VUEFORGE_KEEP_PACKED_CONSUMER=1 to inspect the fixture.',
    );
  }
}
