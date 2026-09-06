// Collects the machine-checkable reference inventory from a repository tree.
//
// The collector is deliberately source-driven: it reads the same barrels,
// manifests and showcase files a consumer sees, so a rename, a dropped export,
// a removed CSS entry or a lost showcase route becomes a diff instead of a
// judgement call.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import ts from 'typescript';
import {
  additionalPublicComponents,
  componentBarrels,
  derivedPublicComponents,
  expectedPublicComponentCount,
  inventoryPackages,
  referenceCommit,
  showcaseExample,
  showcaseRoutes,
} from './reference.mjs';

function readText(treeRoot, relativePath) {
  return readFileSync(resolve(treeRoot, relativePath), 'utf8');
}

function parseModule(treeRoot, relativePath) {
  return ts.createSourceFile(
    relativePath,
    readText(treeRoot, relativePath),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

// Names exported by a barrel, split into value and type exports. Re-exports are
// listed by the name the consumer imports, which is the contract that matters.
// `export * from './relative'` is resolved one module at a time so a star
// barrel still yields concrete consumer-visible names.
function collectExportedNames(treeRoot, relativePath, visited = new Set()) {
  if (visited.has(relativePath)) {
    return { values: [], types: [], starReExports: [] };
  }

  visited.add(relativePath);

  const sourceFile = parseModule(treeRoot, relativePath);
  const values = new Set();
  const types = new Set();
  const starReExports = [];

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (!statement.exportClause) {
        starReExports.push(statement.moduleSpecifier?.text ?? '<unknown>');
        continue;
      }

      if (!ts.isNamedExports(statement.exportClause)) {
        continue;
      }

      for (const element of statement.exportClause.elements) {
        const exportedName = element.name.text;
        const target = statement.isTypeOnly || element.isTypeOnly ? types : values;
        target.add(exportedName);
      }

      continue;
    }

    const modifiers = ts.canHaveModifiers(statement) ? (ts.getModifiers(statement) ?? []) : [];
    if (!modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      continue;
    }

    const isDefault = modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.DefaultKeyword);
    if (isDefault) {
      values.add('default');
      continue;
    }

    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) values.add(declaration.name.text);
      }
    } else if (
      (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement) || ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      values.add(statement.name.text);
    } else if (ts.isTypeAliasDeclaration(statement) || ts.isInterfaceDeclaration(statement)) {
      types.add(statement.name.text);
    }
  }

  for (const specifier of starReExports) {
    const resolved = resolveRelativeModule(treeRoot, relativePath, specifier);
    if (!resolved) {
      continue;
    }

    const nested = collectExportedNames(treeRoot, resolved, visited);
    for (const name of nested.values) values.add(name);
    for (const name of nested.types) types.add(name);
  }

  return {
    values: [...values].sort(),
    types: [...types].sort(),
    starReExports: starReExports.sort(),
  };
}

function resolveRelativeModule(treeRoot, fromRelativePath, specifier) {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const base = resolve(treeRoot, fromRelativePath, '..', specifier);
  for (const candidate of [`${base}.ts`, `${base}/index.ts`]) {
    if (existsSync(candidate)) {
      return relative(treeRoot, candidate);
    }
  }

  return null;
}

// Export condition keys per subpath. Losing the browser auto-CSS entry or the
// Node entry of a component subpath is a packaging regression that plain
// subpath lists cannot see.
function describeExports(exportsField) {
  const described = {};

  for (const [subpath, target] of Object.entries(exportsField ?? {})) {
    described[subpath] = describeExportTarget(target);
  }

  return described;
}

function describeExportTarget(target) {
  if (typeof target === 'string') {
    return target;
  }

  if (target === null || typeof target !== 'object') {
    return null;
  }

  const described = {};
  for (const [condition, value] of Object.entries(target)) {
    described[condition] = describeExportTarget(value);
  }

  return described;
}

function collectPackage(treeRoot, packageContract) {
  const manifestPath = resolve(treeRoot, packageContract.directory, 'package.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const exportSubpaths = Object.keys(manifest.exports ?? {}).sort();

  return {
    directory: packageContract.directory,
    name: manifest.name,
    version: manifest.version,
    enginesNode: manifest.engines?.node ?? null,
    sideEffects: manifest.sideEffects ?? null,
    peerDependencies: Object.keys(manifest.peerDependencies ?? {}).sort(),
    dependencies: Object.keys(manifest.dependencies ?? {}).sort(),
    exportSubpaths,
    cssExportSubpaths: exportSubpaths.filter((subpath) => subpath.endsWith('.css')),
    exports: describeExports(manifest.exports),
    publicExports: Object.fromEntries(
      Object.entries(packageContract.entries).map(([subpath, entryFile]) => [
        subpath,
        { entryFile, ...collectExportedNames(treeRoot, `${packageContract.directory}/${entryFile}`) },
      ]),
    ),
  };
}

function listCssFiles(treeRoot, relativeDirectory) {
  const absolute = resolve(treeRoot, relativeDirectory);
  if (!existsSync(absolute)) {
    return [];
  }

  const found = [];
  const walk = (directory) => {
    for (const entry of readdirSync(directory).sort()) {
      const entryPath = resolve(directory, entry);
      if (statSync(entryPath).isDirectory()) {
        walk(entryPath);
      } else if (entry.endsWith('.css')) {
        found.push(relative(resolve(treeRoot), entryPath));
      }
    }
  };

  walk(absolute);

  return found.sort();
}

// The showcase route table is read from App.vue instead of being asserted from
// memory, so a removed or renamed route fails the gate.
function extractShowcaseSections(treeRoot) {
  const appSource = readText(treeRoot, showcaseExample.appFile);

  const sectionValues = [...appSource.matchAll(/value:\s*'([a-z-]+)',\s*\n\s*label:\s*'([^']+)',/g)].map((match) => ({
    value: match[1],
    label: match[2],
  }));

  const componentMap = [...appSource.matchAll(/(\w+):\s*defineAsyncComponent\(\(\)\s*=>\s*import\('([^']+)'\)\)/g)].map(
    (match) => ({ value: match[1], module: match[2] }),
  );

  const typeMatch = appSource.match(/type SectionValue =\s*([^;]+);/);
  const declaredSectionValues = typeMatch
    ? [...typeMatch[1].matchAll(/'([a-z-]+)'/g)].map((match) => match[1]).sort()
    : [];

  return {
    declaredSectionValues,
    navigationOrder: sectionValues.map((section) => section.value),
    navigationLabels: Object.fromEntries(sectionValues.map((section) => [section.value, section.label])),
    sectionModules: Object.fromEntries(componentMap.map((entry) => [entry.value, entry.module])),
    themeStorageKey: readText(treeRoot, showcaseExample.mainFile).match(/themeStorageKey:\s*'([^']+)'/)?.[1] ?? null,
    defaultTheme: readText(treeRoot, showcaseExample.mainFile).match(/defaultTheme:\s*'([^']+)'/)?.[1] ?? null,
  };
}

function collectComponentSources(treeRoot) {
  const sources = {};
  const componentsDirectory = resolve(treeRoot, 'packages/core/src/components');

  for (const family of readdirSync(componentsDirectory).sort()) {
    const familyPath = resolve(componentsDirectory, family);
    if (!statSync(familyPath).isDirectory()) continue;

    for (const entry of readdirSync(familyPath).sort()) {
      if (entry.endsWith('.vue')) {
        sources[entry.replace(/\.vue$/, '')] = `packages/core/src/components/${family}/${entry}`;
      }
    }
  }

  return sources;
}

export function collectInventory(treeRoot) {
  const packages = inventoryPackages.map((packageContract) => collectPackage(treeRoot, packageContract));

  const componentCatalogue = {};
  for (const barrel of componentBarrels) {
    const { values } = collectExportedNames(treeRoot, barrel.file);
    componentCatalogue[barrel.id] = values.filter((name) => name.startsWith('Vf')).sort();
  }

  const additional = additionalPublicComponents.map((component) => {
    if (!existsSync(resolve(treeRoot, component.file))) {
      throw new Error(`Public component source is missing: ${component.file}`);
    }

    return component.id;
  });

  const publicComponentNames = [
    ...Object.values(componentCatalogue).flat(),
    ...additionalPublicComponents.map((component) => component.name),
    ...derivedPublicComponents.map((component) => component.name),
  ].sort();

  const duplicates = publicComponentNames.filter((name, index) => publicComponentNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicated public component names: ${duplicates.join(', ')}`);
  }

  if (publicComponentNames.length !== expectedPublicComponentCount) {
    throw new Error(
      `Public component catalogue has ${publicComponentNames.length} names, expected ${expectedPublicComponentCount}.`,
    );
  }

  return {
    referenceCommit,
    packages,
    components: {
      publicComponentNames,
      byBarrel: componentCatalogue,
      additionalPublicComponents: additional.sort(),
      derivedPublicComponents: derivedPublicComponents.map((component) => component.name).sort(),
      coreComponentSources: collectComponentSources(treeRoot),
    },
    cssEntrypoints: {
      'packages/core/src/styles': listCssFiles(treeRoot, 'packages/core/src/styles'),
      'packages/layouts/src': listCssFiles(treeRoot, 'packages/layouts/src').filter((file) =>
        /style-entries|style-parts|styles\.css$/.test(file),
      ),
    },
    showcase: {
      routes: showcaseRoutes.map((route) => ({ id: route.id, path: route.path })),
      app: extractShowcaseSections(treeRoot),
    },
  };
}

export { collectExportedNames };
