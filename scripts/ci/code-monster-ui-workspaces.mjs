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
