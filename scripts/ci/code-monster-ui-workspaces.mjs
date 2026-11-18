import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { codeMonsterUiNpmPackages } from './code-monster-ui-package-catalog.mjs';

const contractByName = new Map(
  codeMonsterUiNpmPackages.map((packageContract) => [packageContract.name, packageContract]),
);

export function discoverCodeMonsterUiWorkspaces(packagesDirectory) {
  if (!existsSync(packagesDirectory)) {
    return [];
  }

  const workspaces = [];

  for (const entry of readdirSync(packagesDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const manifestPath = join(packagesDirectory, entry.name, 'package.json');
    if (!existsSync(manifestPath)) {
      continue;
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (!manifest.name?.startsWith('@codemonster-ru/ui-')) {
      continue;
    }

    const packageContract = contractByName.get(manifest.name);
    if (!packageContract) {
      throw new Error(`${manifest.name} is not registered in the CodeMonster UI package catalog.`);
    }

    if (entry.name !== packageContract.directory) {
      throw new Error(`${manifest.name} must use packages/${packageContract.directory}, found packages/${entry.name}.`);
    }

    workspaces.push({ ...packageContract, manifestPath });
  }

  return workspaces.sort(
    (left, right) => left.releaseOrder - right.releaseOrder || left.name.localeCompare(right.name),
  );
}

// Include published dependants in tests and build the prerequisites of everything selected.
export function selectWorkspaceChecks(packages, examples, changedPaths, smoke = false) {
  const all = [...packages, ...examples];
  const markdownOnly = /^(?:docs\/.*\.md|AGENTS\.md|ARCHITECTURE\.md|README\.md)$/u;
  const sharedShowcase = 'examples/shared/';
  const owners = changedPaths?.filter((path) => !markdownOnly.test(path));
  const full =
    !owners ||
    owners.some((path) => !path.startsWith(sharedShowcase) && !all.some(({ path: dir }) => path.startsWith(dir + '/')));
  const affected = new Set(
    all.filter(
      ({ path, private: example }) =>
        full || owners.some((file) => file.startsWith(path + '/') || (example && file.startsWith(sharedShowcase))),
    ),
  );

  for (const workspace of affected) {
    for (const candidate of packages) {
      if (candidate.dependencies.includes(workspace.name)) affected.add(candidate);
    }
  }

  // The shared browser fixture imports every component package except Utilities.
  const browser = full || [...affected].some(({ path }) => path !== 'packages/utilities');
  const builds = new Set(affected);
  if (smoke && browser) {
    for (const workspace of packages) {
      if (workspace.path !== 'packages/utilities') builds.add(workspace);
    }
  }
  for (const workspace of builds) {
    for (const dependency of packages) {
      if (workspace.dependencies.includes(dependency.name)) builds.add(dependency);
    }
  }

  return {
    full,
    tests: all.filter((workspace) => affected.has(workspace)),
    builds: all.filter((workspace) => builds.has(workspace)),
    browser,
  };
}
