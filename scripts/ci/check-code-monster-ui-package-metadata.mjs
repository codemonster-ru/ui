import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { codeMonsterUiComposerPackage, codeMonsterUiNpmPackages } from './code-monster-ui-package-catalog.mjs';
import {
  validateCodeMonsterUiComposerManifest,
  validateCodeMonsterUiNpmManifest,
  validateCodeMonsterUiPackageCatalog,
} from './code-monster-ui-package-metadata.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const packagesDirectory = join(repositoryRoot, 'packages');
const npmContractByDirectory = new Map(codeMonsterUiNpmPackages.map((item) => [item.directory, item]));
const npmContractByName = new Map(codeMonsterUiNpmPackages.map((item) => [item.name, item]));
const errors = validateCodeMonsterUiPackageCatalog();
let discoveredNpmPackages = 0;
let discoveredComposerPackages = 0;

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(`${filePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

for (const entry of readdirSync(packagesDirectory, { withFileTypes: true })) {
  if (!entry.isDirectory()) {
    continue;
  }

  const manifestPath = join(packagesDirectory, entry.name, 'package.json');
  if (!existsSync(manifestPath)) {
    continue;
  }

  const manifest = readJson(manifestPath);
  if (!manifest || typeof manifest.name !== 'string' || !manifest.name.startsWith('@codemonster-ru/ui-')) {
    continue;
  }

  discoveredNpmPackages += 1;
  const packageContract = npmContractByName.get(manifest.name);
  if (!packageContract) {
    errors.push(`Unregistered CodeMonster UI npm package: ${manifest.name}.`);
    continue;
  }
  if (packageContract.directory !== entry.name) {
    errors.push(`${manifest.name} must live in packages/${packageContract.directory}, not packages/${entry.name}.`);
    continue;
  }
  errors.push(...validateCodeMonsterUiNpmManifest(packageContract, manifest));
}

for (const [directory, packageContract] of npmContractByDirectory) {
  const manifestPath = join(packagesDirectory, directory, 'package.json');
  if (!existsSync(manifestPath)) {
    continue;
  }
  const manifest = readJson(manifestPath);
  if (manifest?.name?.startsWith('@codemonster-ru/ui-') && manifest.name !== packageContract.name) {
    errors.push(`packages/${directory} must use ${packageContract.name}, not ${manifest.name}.`);
  }
}

const composerManifestPath = join(packagesDirectory, codeMonsterUiComposerPackage.directory, 'composer.json');
if (existsSync(composerManifestPath)) {
  discoveredComposerPackages += 1;
  const manifest = readJson(composerManifestPath);
  if (manifest) {
    errors.push(...validateCodeMonsterUiComposerManifest(codeMonsterUiComposerPackage, manifest));
  }
}

if (errors.length > 0) {
  console.error(`[ui-package-metadata] FAILED with ${errors.length} error(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `[ui-package-metadata] OK: catalog defines ${codeMonsterUiNpmPackages.length} npm package(s) and 1 Composer package; discovered ${discoveredNpmPackages} npm and ${discoveredComposerPackages} Composer manifest(s).`,
  );
}
