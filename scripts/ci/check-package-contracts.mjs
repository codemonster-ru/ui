import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateCodeMonsterUiPackageCatalog } from './code-monster-ui-package-metadata.mjs';
import { validateCodeMonsterUiNpmPackageContract } from './code-monster-ui-package-contracts.mjs';
import { discoverCodeMonsterUiWorkspaces } from './code-monster-ui-workspaces.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const errors = validateCodeMonsterUiPackageCatalog();

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

let codeMonsterUiPackageCount = 0;

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
  errors.push(error.message);
}

if (errors.length > 0) {
  console.error(`[package-contracts] FAILED with ${errors.length} contract error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `[package-contracts] OK: ${codeMonsterUiPackageCount} CodeMonster UI package manifest(s) and their built exports are publishable.`,
  );
}
