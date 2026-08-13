import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import semver from 'semver';
import { validateCodeMonsterUiPackageCatalog } from './code-monster-ui-package-metadata.mjs';
import { validateCodeMonsterUiNpmPackageContract } from './code-monster-ui-package-contracts.mjs';
import { discoverCodeMonsterUiWorkspaces } from './code-monster-ui-workspaces.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const expectedRepositoryUrl = 'git+https://github.com/codemonster-ru/vueforge.git';
const expectedBugsUrl = 'https://github.com/codemonster-ru/vueforge/issues';
const releaseTrain = [
  {
    directory: 'theme',
    enginesNode: '>=18',
    name: '@codemonster-ru/vueforge-theme',
    version: '2.0.1',
  },
  {
    directory: 'icons',
    enginesNode: '>=18',
    name: '@codemonster-ru/vueforge-icons',
    version: '3.2.0',
  },
  {
    directory: 'core',
    enginesNode: '>=18',
    name: '@codemonster-ru/vueforge-core',
    version: '2.4.0',
  },
  {
    directory: 'layouts',
    enginesNode: '>=18',
    name: '@codemonster-ru/vueforge-layouts',
    version: '2.1.2',
  },
  {
    directory: 'codeblock',
    enginesNode: '>=20',
    name: '@codemonster-ru/vueforge-codeblock',
    version: '4.0.1',
  },
  {
    directory: 'playground-core',
    enginesNode: '>=18',
    name: '@codemonster-ru/vueforge-playground-core',
    version: '2.1.0',
  },
  {
    directory: 'playground-vite-plugin',
    enginesNode: '>=18',
    name: '@codemonster-ru/vueforge-playground-vite-plugin',
    version: '1.0.0',
  },
  {
    directory: 'playground',
    enginesNode: '>=20',
    name: '@codemonster-ru/vueforge-playground',
    version: '3.0.1',
  },
];
const releaseByName = new Map(releaseTrain.map((packageContract) => [packageContract.name, packageContract]));
const runtimeDependencyFields = ['dependencies', 'optionalDependencies', 'peerDependencies'];
const obsoleteResolverFields = ['main', 'module', 'types', 'style', 'typesVersions'];
const errors = validateCodeMonsterUiPackageCatalog();

function report(message) {
  errors.push(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    report(`${relative(repositoryRoot, filePath)} is not valid JSON: ${error.message}`);
    return null;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function packageFilePath(packageDirectory, target) {
  if (typeof target !== 'string' || !target.startsWith('./')) {
    return null;
  }

  return resolve(packageDirectory, target.slice(2));
}

function assertTargetExists(packageContract, packageDirectory, location, target) {
  if (typeof target !== 'string') {
    report(`${packageContract.name} ${location} must resolve to a string target.`);
    return;
  }

  if (!target.startsWith('./dist/')) {
    report(`${packageContract.name} ${location} must point inside ./dist (received ${target}).`);
    return;
  }

  const targetPath = packageFilePath(packageDirectory, target);
  const targetRelativePath = relative(packageDirectory, targetPath);
  if (targetRelativePath.startsWith(`..${sep}`) || targetRelativePath === '..') {
    report(`${packageContract.name} ${location} escapes the package directory (${target}).`);
    return;
  }

  const distDirectory = resolve(packageDirectory, 'dist');
  const targetRelativeToDist = relative(distDirectory, targetPath);
  if (targetRelativeToDist.startsWith(`..${sep}`) || targetRelativeToDist === '..') {
    report(`${packageContract.name} ${location} resolves outside ./dist (${target}).`);
    return;
  }

  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
    report(`${packageContract.name} ${location} target is missing after build: ${target}.`);
  }
}

function collectExportTargets(value, location, conditions, output) {
  if (typeof value === 'string') {
    output.push({ conditions, location, target: value });
    return;
  }

  if (!isPlainObject(value)) {
    report(`${location} must be a string or condition object.`);
    return;
  }

  for (const [condition, child] of Object.entries(value)) {
    collectExportTargets(child, `${location}.${condition}`, [...conditions, condition], output);
  }
}

function resolveConditionalTarget(value, activeConditions) {
  if (typeof value === 'string') {
    return value;
  }

  if (!isPlainObject(value)) {
    return null;
  }

  for (const [condition, child] of Object.entries(value)) {
    if (condition === 'default' || activeConditions.has(condition)) {
      const resolvedTarget = resolveConditionalTarget(child, activeConditions);
      if (resolvedTarget) {
        return resolvedTarget;
      }
    }
  }

  return null;
}

function hasStaticCssImport(filePath) {
  if (!existsSync(filePath)) {
    return false;
  }

  const source = readFileSync(filePath, 'utf8');
  return /(?:^|[;\n])\s*import\s*(?:[^'";]+\s+from\s*)?['"][^'"]+\.css['"]/m.test(source);
}

function validateConditionOrder(packageContract, exportKey, value, path = []) {
  if (!isPlainObject(value)) {
    return;
  }

  const keys = Object.keys(value);
  const typesIndex = keys.indexOf('types');
  if (typesIndex > 0) {
    report(
      `${packageContract.name} export ${exportKey} ${[...path, 'types'].join('.')} must precede runtime conditions.`,
    );
  }

  const nodeIndex = keys.indexOf('node');
  const defaultIndex = keys.indexOf('default');
  if (nodeIndex !== -1 && defaultIndex !== -1 && nodeIndex > defaultIndex) {
    report(`${packageContract.name} export ${exportKey} node must precede default.`);
  }

  for (const [condition, child] of Object.entries(value)) {
    validateConditionOrder(packageContract, exportKey, child, [...path, condition]);
  }
}

function validateRuntimeBranch(packageContract, exportKey, condition, branch, exportValue) {
  if (condition === 'import' && typeof branch === 'string') {
    if (typeof exportValue.types !== 'string' || !exportValue.types.endsWith('.d.ts')) {
      report(
        `${packageContract.name} export ${exportKey} with a simple import target requires a top-level ESM .d.ts types condition.`,
      );
    }
    if (!/\.(?:js|mjs)$/.test(branch)) {
      report(`${packageContract.name} export ${exportKey} import must use an ESM JS runtime.`);
    }
    return;
  }

  if (!isPlainObject(branch)) {
    report(`${packageContract.name} export ${exportKey} ${condition} must be a nested condition object.`);
    return;
  }

  const typeTarget = branch.types;
  const runtimeTarget = branch.default;
  if (typeof typeTarget !== 'string') {
    report(`${packageContract.name} export ${exportKey} ${condition}.types is required.`);
  } else if (condition === 'require' && !typeTarget.endsWith('.d.cts')) {
    report(`${packageContract.name} export ${exportKey} require.types must use a .d.cts facade.`);
  } else if (condition === 'import' && !typeTarget.endsWith('.d.ts')) {
    report(`${packageContract.name} export ${exportKey} import.types must use an ESM .d.ts declaration.`);
  }

  if (typeof runtimeTarget !== 'string') {
    report(`${packageContract.name} export ${exportKey} ${condition}.default is required.`);
  } else if (condition === 'require' && !runtimeTarget.endsWith('.cjs')) {
    report(`${packageContract.name} export ${exportKey} require.default must use a .cjs runtime.`);
  } else if (condition === 'import' && !/\.(?:js|mjs)$/.test(runtimeTarget)) {
    report(`${packageContract.name} export ${exportKey} import.default must use an ESM JS runtime.`);
  }
}

function validateNodeEsmCondition(packageContract, packageDirectory, exportKey, exportValue) {
  if (!isPlainObject(exportValue) || !isPlainObject(exportValue.import)) {
    return;
  }

  const browserTarget = resolveConditionalTarget(exportValue.import, new Set(['import']));
  if (typeof browserTarget !== 'string') {
    return;
  }

  const browserPath = packageFilePath(packageDirectory, browserTarget);
  if (!browserTarget.includes('/auto/') && !hasStaticCssImport(browserPath)) {
    return;
  }

  const nodeTarget = exportValue.import.node;
  if (typeof nodeTarget !== 'string') {
    report(
      `${packageContract.name} export ${exportKey} injects browser CSS and requires import.node for direct Node ESM SSR.`,
    );
    return;
  }

  if (nodeTarget === browserTarget) {
    report(`${packageContract.name} export ${exportKey} import.node must differ from its browser auto-CSS target.`);
    return;
  }

  const nodePath = packageFilePath(packageDirectory, nodeTarget);
  if (nodePath && hasStaticCssImport(nodePath)) {
    report(`${packageContract.name} export ${exportKey} import.node is not CSS-free (${nodeTarget}).`);
  }
}

function validateExports(packageContract, packageDirectory, manifest) {
  if (!isPlainObject(manifest.exports) || Object.keys(manifest.exports).length === 0) {
    report(`${packageContract.name} must define a non-empty exports map.`);
    return;
  }

  for (const [exportKey, exportValue] of Object.entries(manifest.exports)) {
    if (exportKey !== '.' && !exportKey.startsWith('./')) {
      report(`${packageContract.name} has an invalid export key: ${exportKey}.`);
    }

    const targets = [];
    collectExportTargets(exportValue, `${packageContract.name} exports[${JSON.stringify(exportKey)}]`, [], targets);
    for (const { conditions, location, target } of targets) {
      assertTargetExists(packageContract, packageDirectory, location, target);
      if (conditions.includes('types') && !/\.d\.(?:ts|cts)$/.test(target)) {
        report(`${location} is a types condition but does not target a declaration file (${target}).`);
      }
    }

    validateConditionOrder(packageContract, exportKey, exportValue);
    if (isPlainObject(exportValue) && 'import' in exportValue) {
      validateRuntimeBranch(packageContract, exportKey, 'import', exportValue.import, exportValue);
    }
    if (isPlainObject(exportValue) && 'require' in exportValue) {
      validateRuntimeBranch(packageContract, exportKey, 'require', exportValue.require, exportValue);
    }
    validateNodeEsmCondition(packageContract, packageDirectory, exportKey, exportValue);
  }
}

function validateMetadata(packageContract, manifest) {
  const expectedHomepage = `https://github.com/codemonster-ru/vueforge/tree/main/packages/${packageContract.directory}#readme`;

  if (manifest.name !== packageContract.name) {
    report(`${packageContract.directory} package name must be ${packageContract.name}.`);
  }
  if (manifest.version !== packageContract.version) {
    report(`${packageContract.name} version must be ${packageContract.version} for this release train.`);
  }
  if (manifest.private === true) {
    report(`${packageContract.name} must be publishable, not private.`);
  }
  if (typeof manifest.description !== 'string' || manifest.description.trim() === '') {
    report(`${packageContract.name} must have a non-empty description.`);
  }
  if (typeof manifest.license !== 'string' || manifest.license.trim() === '') {
    report(`${packageContract.name} must declare a license.`);
  }
  if (!Array.isArray(manifest.keywords) || manifest.keywords.length === 0) {
    report(`${packageContract.name} must have non-empty keywords.`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes('dist')) {
    report(`${packageContract.name} files must include dist.`);
  }
  if (manifest.publishConfig?.access !== 'public') {
    report(`${packageContract.name} publishConfig.access must be public.`);
  }
  if (manifest.repository?.type !== 'git' || manifest.repository?.url !== expectedRepositoryUrl) {
    report(`${packageContract.name} must use the canonical git repository metadata.`);
  }
  if (manifest.repository?.directory !== `packages/${packageContract.directory}`) {
    report(`${packageContract.name} repository.directory is incorrect.`);
  }
  if (manifest.homepage !== expectedHomepage) {
    report(`${packageContract.name} homepage must point to its package README.`);
  }
  if (manifest.bugs?.url !== expectedBugsUrl) {
    report(`${packageContract.name} bugs.url must point to the repository issue tracker.`);
  }
  if (manifest.engines?.node !== packageContract.enginesNode) {
    report(`${packageContract.name} engines.node must be ${packageContract.enginesNode}.`);
  }
  for (const field of obsoleteResolverFields) {
    if (Object.hasOwn(manifest, field)) {
      report(`${packageContract.name} must resolve ${field} through exports, not top-level resolver metadata.`);
    }
  }
}

function walkFiles(directory, output = []) {
  if (!existsSync(directory)) {
    return output;
  }

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, output);
    } else if (entry.isFile()) {
      output.push(entryPath);
    }
  }

  return output;
}

function validateNoShimReferences(packageContract, packageDirectory) {
  const distDirectory = join(packageDirectory, 'dist');
  if (!existsSync(distDirectory)) {
    report(`${packageContract.name} dist directory is missing; run the build first.`);
    return;
  }

  const textExtensions = new Set(['.cjs', '.cts', '.js', '.json', '.map', '.mjs', '.ts']);
  const forbiddenShimReference = /(?:deps-shim|test-shims|shims-vue|vueforge-icons-shim)/;
  const forbiddenAmbientModule = /declare\s+module\s+['"]@codemonster-ru\/vueforge-/;
  const declarationImportPattern = /\b(?:from\s*|import\s*(?:\(\s*)?)['"](\.{1,2}(?:\/[^'"]*)?)['"]/g;
  const runtimeSafeDeclarationExtension = /\.(?:js|mjs|cjs|json|d\.ts|d\.mts|d\.cts)$/;

  for (const filePath of walkFiles(distDirectory)) {
    if (!textExtensions.has(extname(filePath))) {
      continue;
    }

    const source = readFileSync(filePath, 'utf8');
    if (forbiddenShimReference.test(source)) {
      report(
        `${packageContract.name} build contains a dependency shim reference in ${relative(packageDirectory, filePath)}.`,
      );
    }
    if (/\.d\.(?:ts|mts|cts)$/.test(filePath)) {
      const declarationPath = relative(packageDirectory, filePath);
      if (forbiddenAmbientModule.test(source)) {
        report(`${packageContract.name} build contains an ambient internal-package shim in ${declarationPath}.`);
      }

      declarationImportPattern.lastIndex = 0;
      for (const match of source.matchAll(declarationImportPattern)) {
        const specifier = match[1].replace(/[?#].*$/, '');
        if (specifier.endsWith('.css')) {
          report(
            `${packageContract.name} declaration ${declarationPath} contains a CSS side-effect import (${match[1]}).`,
          );
        } else if (!runtimeSafeDeclarationExtension.test(specifier)) {
          report(
            `${packageContract.name} declaration ${declarationPath} has an extensionless relative import (${match[1]}).`,
          );
        }
      }
    }
  }
}

function validateStylePreprocessorDependencies(packageContract, packageDirectory, manifest) {
  const sourceDirectory = join(packageDirectory, 'src');
  const usesSass = walkFiles(sourceDirectory).some((filePath) => {
    if (extname(filePath) !== '.vue') {
      return false;
    }

    return /<style\b[^>]*\blang=["']s[ac]ss["']/i.test(readFileSync(filePath, 'utf8'));
  });

  if (!usesSass) {
    return;
  }

  const buildDependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
  };
  if (!buildDependencies.sass && !buildDependencies['sass-embedded']) {
    report(
      `${packageContract.name} uses Sass in Vue sources but does not declare sass or sass-embedded as a build dependency.`,
    );
  }
}

function validateInternalDependencies(manifests) {
  const graph = new Map(releaseTrain.map(({ name }) => [name, new Set()]));

  for (const [packageName, manifest] of manifests) {
    for (const field of runtimeDependencyFields) {
      const dependencies = manifest[field] ?? {};
      if (!isPlainObject(dependencies)) {
        report(`${packageName} ${field} must be an object.`);
        continue;
      }

      for (const [dependencyName, range] of Object.entries(dependencies)) {
        const dependencyContract = releaseByName.get(dependencyName);
        if (!dependencyContract) {
          continue;
        }

        graph.get(packageName).add(dependencyName);
        if (typeof range !== 'string' || !semver.satisfies(dependencyContract.version, range)) {
          report(
            `${packageName} ${field}.${dependencyName} must accept the current ${dependencyContract.version} version (received ${range}).`,
          );
        }
      }
    }

    for (const [dependencyName, range] of Object.entries(manifest.devDependencies ?? {})) {
      const dependencyContract = releaseByName.get(dependencyName);
      if (dependencyContract && range !== `file:../${dependencyContract.directory}`) {
        report(`${packageName} dev dependency ${dependencyName} must use its sibling file: workspace path.`);
      }
    }
  }

  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(packageName) {
    if (visiting.has(packageName)) {
      const cycleStart = stack.indexOf(packageName);
      report(`Internal dependency cycle: ${[...stack.slice(cycleStart), packageName].join(' -> ')}.`);
      return;
    }
    if (visited.has(packageName)) {
      return;
    }

    visiting.add(packageName);
    stack.push(packageName);
    for (const dependencyName of graph.get(packageName)) {
      visit(dependencyName);
    }
    stack.pop();
    visiting.delete(packageName);
    visited.add(packageName);
  }

  for (const packageName of graph.keys()) {
    visit(packageName);
  }
}

const manifests = new Map();
let codeMonsterUiPackageCount = 0;

for (const packageContract of releaseTrain) {
  const packageDirectory = join(repositoryRoot, 'packages', packageContract.directory);
  const manifestPath = join(packageDirectory, 'package.json');
  const manifest = readJson(manifestPath);
  if (!manifest) {
    continue;
  }

  manifests.set(packageContract.name, manifest);
  validateMetadata(packageContract, manifest);
  validateExports(packageContract, packageDirectory, manifest);
  validateNoShimReferences(packageContract, packageDirectory);
  validateStylePreprocessorDependencies(packageContract, packageDirectory, manifest);
}

if (manifests.size !== releaseTrain.length) {
  report(`Expected ${releaseTrain.length} publishable package manifests, found ${manifests.size}.`);
} else {
  validateInternalDependencies(manifests);
}

try {
  const codeMonsterUiWorkspaces = discoverCodeMonsterUiWorkspaces(join(repositoryRoot, 'packages'));
  codeMonsterUiPackageCount = codeMonsterUiWorkspaces.length;

  for (const packageContract of codeMonsterUiWorkspaces) {
    const packageDirectory = join(repositoryRoot, 'packages', packageContract.directory);
    const manifest = readJson(packageContract.manifestPath);
    if (manifest) {
      errors.push(...validateCodeMonsterUiNpmPackageContract(packageContract, packageDirectory, manifest));
    }
  }
} catch (error) {
  report(error.message);
}

if (errors.length > 0) {
  console.error(`[package-contracts] FAILED with ${errors.length} contract error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `[package-contracts] OK: ${releaseTrain.length} VueForge and ${codeMonsterUiPackageCount} CodeMonster UI package manifest(s) and their built exports are publishable.`,
  );
}
