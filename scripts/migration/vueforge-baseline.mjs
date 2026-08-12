import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const baselinePath = resolve(repositoryRoot, 'migration/vueforge-feature-baseline.json');

export function readVueForgeBaseline(path = baselinePath) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function discoverVueForgePackages(root = repositoryRoot) {
  const packagesRoot = resolve(root, 'packages');

  return readdirSync(packagesRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const packagePath = resolve(packagesRoot, entry.name, 'package.json');
      if (!existsSync(packagePath)) return [];

      const manifest = JSON.parse(readFileSync(packagePath, 'utf8'));
      if (!String(manifest.name).startsWith('@codemonster-ru/vueforge-')) return [];

      return [
        {
          directory: entry.name,
          name: manifest.name,
          version: manifest.version,
          exports: Object.keys(manifest.exports ?? {}),
        },
      ];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function validateVueForgeBaseline(baseline, actualPackages) {
  const issues = [];

  if (baseline?.schemaVersion !== 1) issues.push('Baseline schemaVersion must be 1.');
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(baseline?.frozenAt ?? '')) {
    issues.push('Baseline frozenAt must use YYYY-MM-DD.');
  }

  const expectedPackages = Array.isArray(baseline?.packages) ? baseline.packages : [];
  const expectedNames = expectedPackages.map(({ name }) => name);
  const duplicateNames = expectedNames.filter((name, index) => expectedNames.indexOf(name) !== index);
  if (duplicateNames.length > 0)
    issues.push(`Baseline contains duplicate package names: ${duplicateNames.join(', ')}.`);

  const actualByName = new Map(actualPackages.map((pkg) => [pkg.name, pkg]));
  const expectedByName = new Map(expectedPackages.map((pkg) => [pkg.name, pkg]));

  for (const expected of expectedPackages) {
    const actual = actualByName.get(expected.name);
    if (!actual) {
      issues.push(`Frozen package is missing: ${expected.name}.`);
      continue;
    }
    if (actual.directory !== expected.directory) {
      issues.push(`${expected.name} moved from packages/${expected.directory} to packages/${actual.directory}.`);
    }
    if (actual.version !== expected.version) {
      issues.push(`${expected.name} version changed from ${expected.version} to ${actual.version}.`);
    }
    if (JSON.stringify(actual.exports) !== JSON.stringify(expected.exports)) {
      issues.push(`${expected.name} public export subpaths changed from the frozen baseline.`);
    }
  }

  for (const actual of actualPackages) {
    if (!expectedByName.has(actual.name)) issues.push(`Unreviewed VueForge package was added: ${actual.name}.`);
  }

  return issues;
}

export function checkVueForgeBaseline(root = repositoryRoot) {
  return validateVueForgeBaseline(
    readVueForgeBaseline(resolve(root, 'migration/vueforge-feature-baseline.json')),
    discoverVueForgePackages(root),
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const baseline = readVueForgeBaseline();
  const issues = checkVueForgeBaseline();
  if (issues.length > 0) {
    for (const issue of issues) console.error(`[vueforge-baseline] ${issue}`);
    process.exitCode = 1;
  } else {
    console.log(
      `[vueforge-baseline] OK: ${baseline.packages.length} package(s) match the ${baseline.frozenAt} feature baseline.`,
    );
  }
}
