import semver from 'semver';
import {
  codeMonsterUiComposerPackage,
  codeMonsterUiNodeEngine,
  codeMonsterUiNpmPackages,
  codeMonsterUiPackageSizeBudgets,
} from './code-monster-ui-package-catalog.mjs';

const requiredNpmScripts = ['build', 'check', 'format', 'lint', 'prepack', 'test', 'typecheck'];
const forbiddenResolverFields = ['main', 'module', 'style', 'types', 'typesVersions'];
const frameworkPackageNames = new Set(['@angular/core', 'react', 'react-dom', 'vue']);

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateUnique(items, select, label, errors) {
  const seen = new Set();
  for (const item of items) {
    const value = select(item);
    if (seen.has(value)) {
      errors.push(`Duplicate ${label}: ${value}.`);
    }
    seen.add(value);
  }
}

export function validateCodeMonsterUiPackageCatalog() {
  const errors = [];
  validateUnique(codeMonsterUiNpmPackages, ({ directory }) => directory, 'npm package directory', errors);
  validateUnique(codeMonsterUiNpmPackages, ({ name }) => name, 'npm package name', errors);
  validateUnique(
    codeMonsterUiNpmPackages,
    ({ releaseOrder, name }) => `${releaseOrder}:${name}`,
    'release entry',
    errors,
  );

  for (const packageContract of codeMonsterUiNpmPackages) {
    const expectedName = `@codemonster-ru/ui-${packageContract.directory}`;
    if (packageContract.name !== expectedName) {
      errors.push(
        `${packageContract.directory} must use the approved npm name ${expectedName} (received ${packageContract.name}).`,
      );
    }
    if (!Number.isInteger(packageContract.releaseOrder) || packageContract.releaseOrder < 1) {
      errors.push(`${packageContract.name} must have a positive integer release order.`);
    }
    const budget = codeMonsterUiPackageSizeBudgets[packageContract.name];
    if (!isPlainObject(budget)) {
      errors.push(`${packageContract.name} must have an approved package size budget.`);
    } else {
      for (const field of ['cssGzip', 'cssRaw', 'jsGzip']) {
        if (!Number.isInteger(budget[field]) || budget[field] < 0) {
          errors.push(`${packageContract.name} size budget ${field} must be a non-negative integer.`);
        }
      }
    }
  }

  if (codeMonsterUiComposerPackage.name !== 'codemonster-ru/ui-razor') {
    errors.push('The Composer adapter must use the approved codemonster-ru/ui-razor package name.');
  }

  return errors;
}

export function validateCodeMonsterUiNpmManifest(packageContract, manifest) {
  const errors = [];
  const label = packageContract.name;

  if (!isPlainObject(manifest)) {
    return [`${label} manifest must be a JSON object.`];
  }
  if (manifest.name !== label) {
    errors.push(`${label} manifest name must be ${label} (received ${manifest.name}).`);
  }
  if (!semver.valid(manifest.version)) {
    errors.push(`${label} version must be valid SemVer.`);
  }
  if (manifest.private === true) {
    errors.push(`${label} must not be private.`);
  }
  if (manifest.type !== 'module') {
    errors.push(`${label} type must be module.`);
  }
  if (manifest.license !== 'MIT') {
    errors.push(`${label} license must be MIT.`);
  }
  if (typeof manifest.description !== 'string' || manifest.description.trim() === '') {
    errors.push(`${label} description is required.`);
  }
  if (manifest.engines?.node !== codeMonsterUiNodeEngine) {
    errors.push(`${label} engines.node must be ${codeMonsterUiNodeEngine}.`);
  }
  if (manifest.publishConfig?.access !== 'public') {
    errors.push(`${label} publishConfig.access must be public.`);
  }
  if (!Array.isArray(manifest.files) || !manifest.files.includes('dist')) {
    errors.push(`${label} files must include dist.`);
  }
  if (!isPlainObject(manifest.exports) || Object.keys(manifest.exports).length === 0) {
    errors.push(`${label} must declare explicit package exports.`);
  }

  for (const field of forbiddenResolverFields) {
    if (Object.hasOwn(manifest, field)) {
      errors.push(`${label} must resolve through exports instead of ${field}.`);
    }
  }
  for (const scriptName of requiredNpmScripts) {
    if (typeof manifest.scripts?.[scriptName] !== 'string' || manifest.scripts[scriptName].trim() === '') {
      errors.push(`${label} scripts.${scriptName} is required.`);
    }
  }

  const expectedFrameworkPeers = packageContract.frameworkPeers ?? {};
  for (const [packageName, expectedRange] of Object.entries(expectedFrameworkPeers)) {
    if (manifest.peerDependencies?.[packageName] !== expectedRange) {
      errors.push(`${label} peerDependencies.${packageName} must be ${expectedRange}.`);
    }
  }

  for (const dependencyField of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const packageName of Object.keys(manifest[dependencyField] ?? {})) {
      if (!frameworkPackageNames.has(packageName)) {
        continue;
      }
      if (dependencyField !== 'peerDependencies' || !Object.hasOwn(expectedFrameworkPeers, packageName)) {
        errors.push(`${label} must not declare ${packageName} in ${dependencyField}.`);
      }
    }
  }

  return errors;
}

export function validateCodeMonsterUiComposerManifest(packageContract, manifest) {
  const errors = [];
  const label = packageContract.name;

  if (!isPlainObject(manifest)) {
    return [`${label} manifest must be a JSON object.`];
  }
  if (manifest.name !== label) {
    errors.push(`${label} manifest name must be ${label} (received ${manifest.name}).`);
  }
  if (manifest.type !== 'library') {
    errors.push(`${label} type must be library.`);
  }
  if (manifest.license !== 'MIT') {
    errors.push(`${label} license must be MIT.`);
  }
  if (typeof manifest.description !== 'string' || manifest.description.trim() === '') {
    errors.push(`${label} description is required.`);
  }
  if (manifest.require?.php !== packageContract.php) {
    errors.push(`${label} require.php must be ${packageContract.php}.`);
  }
  if (manifest.require?.['codemonster-ru/razor'] !== packageContract.razor) {
    errors.push(`${label} require.codemonster-ru/razor must be ${packageContract.razor}.`);
  }
  if (manifest.autoload?.['psr-4']?.['Codemonster\\Ui\\'] !== 'src/') {
    errors.push(`${label} must map Codemonster\\Ui\\ to src/.`);
  }
  for (const scriptName of ['analyse', 'check', 'test']) {
    if (!manifest.scripts?.[scriptName]) {
      errors.push(`${label} scripts.${scriptName} is required.`);
    }
  }

  return errors;
}
