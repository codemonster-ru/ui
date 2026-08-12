import assert from 'node:assert/strict';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';

const frameworkPackages = ['@angular/core', 'react', 'react-dom', 'vue'];
const runtimeDependencyFields = ['dependencies', 'optionalDependencies', 'peerDependencies'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function collectCssTargets(value, output) {
  if (typeof value === 'string') {
    if (value.endsWith('.css')) {
      output.add(value);
    }
    return;
  }
  if (!isPlainObject(value)) {
    return;
  }
  for (const child of Object.values(value)) {
    collectCssTargets(child, output);
  }
}

export function collectCssExports(packageName, manifest) {
  const cssExports = [];
  for (const [exportKey, exportValue] of Object.entries(manifest.exports ?? {})) {
    const targets = new Set();
    collectCssTargets(exportValue, targets);
    for (const target of targets) {
      cssExports.push({
        specifier: exportKey === '.' ? packageName : `${packageName}/${exportKey.slice(2)}`,
        target,
      });
    }
  }
  return cssExports;
}

export function selectCssConsumerPackages(workspaces, manifests) {
  const workspaceByName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const selected = new Set();

  function selectWithDependencies(packageName) {
    if (selected.has(packageName)) {
      return;
    }
    const workspace = workspaceByName.get(packageName);
    const manifest = manifests.get(packageName);
    if (!workspace || !manifest || workspace.frameworkPeers) {
      return;
    }
    selected.add(packageName);
    for (const dependencyName of Object.keys(manifest.dependencies ?? {})) {
      if (workspaceByName.has(dependencyName)) {
        selectWithDependencies(dependencyName);
      }
    }
  }

  for (const workspace of workspaces) {
    const manifest = manifests.get(workspace.name);
    if (!workspace.frameworkPeers && manifest && collectCssExports(workspace.name, manifest).length > 0) {
      selectWithDependencies(workspace.name);
    }
  }

  return workspaces.filter(({ name }) => selected.has(name));
}

function isWithin(parent, child) {
  const path = relative(parent, child);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`));
}

function verifyCssImportGraph(entryPath, packageRoot, visited = new Set()) {
  const canonicalEntryPath = realpathSync(entryPath);
  if (visited.has(canonicalEntryPath)) {
    return;
  }
  visited.add(canonicalEntryPath);

  const source = readFileSync(canonicalEntryPath, 'utf8');
  const imports = [...source.matchAll(/@import\s+(?:url\(\s*)?(['"])([^'"]+)\1\s*\)?[^;]*;/g)];
  assert.equal(
    imports.length,
    source.match(/@import\b/g)?.length ?? 0,
    `${relative(packageRoot, canonicalEntryPath)} contains an unsupported CSS import form.`,
  );

  for (const [, , specifier] of imports) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(specifier)) {
      continue;
    }
    assert.ok(
      specifier.startsWith('.'),
      `${relative(packageRoot, canonicalEntryPath)} uses non-portable package CSS import ${specifier}.`,
    );
    const importedPath = resolve(dirname(canonicalEntryPath), specifier);
    assert.equal(isWithin(packageRoot, importedPath), true, `${specifier} escapes its installed package.`);
    assert.ok(
      existsSync(importedPath),
      `${relative(packageRoot, canonicalEntryPath)} imports missing CSS ${specifier}.`,
    );
    const canonicalImportedPath = realpathSync(importedPath);
    assert.equal(isWithin(packageRoot, canonicalImportedPath), true, `${specifier} escapes its installed package.`);
    verifyCssImportGraph(canonicalImportedPath, packageRoot, visited);
  }
}

export function verifyInstalledCssConsumer({ consumerDirectory, packages, repositoryRoot }) {
  const canonicalConsumerRoot = realpathSync(consumerDirectory);
  const canonicalRepositoryRoot = realpathSync(repositoryRoot);
  let cssExportCount = 0;

  for (const packageContract of packages) {
    const packageDirectory = join(consumerDirectory, 'node_modules', ...packageContract.name.split('/'));
    const manifestPath = join(packageDirectory, 'package.json');
    assert.ok(existsSync(manifestPath), `${packageContract.name} is not installed in the isolated consumer.`);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const canonicalPackageRoot = realpathSync(packageDirectory);
    assert.equal(isWithin(canonicalConsumerRoot, canonicalPackageRoot), true);
    assert.equal(isWithin(canonicalRepositoryRoot, canonicalPackageRoot), false);

    for (const dependencyField of runtimeDependencyFields) {
      for (const frameworkPackage of frameworkPackages) {
        assert.equal(
          Object.hasOwn(manifest[dependencyField] ?? {}, frameworkPackage),
          false,
          `${packageContract.name} exposes ${frameworkPackage} through ${dependencyField}.`,
        );
      }
    }

    for (const { specifier, target } of collectCssExports(packageContract.name, manifest)) {
      const cssPath = resolve(packageDirectory, target);
      assert.ok(existsSync(cssPath), `${specifier} resolves to missing CSS target ${target}.`);
      assert.equal(
        isWithin(canonicalPackageRoot, realpathSync(cssPath)),
        true,
        `${specifier} escapes its installed package.`,
      );
      assert.ok(readFileSync(cssPath, 'utf8').trim().length > 0, `${specifier} resolves to empty CSS.`);
      verifyCssImportGraph(cssPath, canonicalPackageRoot);
      cssExportCount += 1;
    }
  }

  for (const frameworkPackage of frameworkPackages) {
    const frameworkDirectory = join(consumerDirectory, 'node_modules', ...frameworkPackage.split('/'));
    assert.equal(existsSync(frameworkDirectory), false, `CSS-only install unexpectedly contains ${frameworkPackage}.`);
  }

  assert.ok(cssExportCount > 0, 'The CSS-only consumer found no public CSS exports.');
  return cssExportCount;
}

export function portableRelativeSpecifier(fromDirectory, targetPath) {
  return `file:${relative(fromDirectory, targetPath).split(sep).join('/')}`;
}

export function packageRootFromManifest(manifestPath) {
  return dirname(manifestPath);
}
