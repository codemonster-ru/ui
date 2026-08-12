import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';
import semver from 'semver';
import { codeMonsterUiNpmPackages } from './code-monster-ui-package-catalog.mjs';
import { validateCodeMonsterUiNpmManifest } from './code-monster-ui-package-metadata.mjs';

const contractByName = new Map(codeMonsterUiNpmPackages.map((contract) => [contract.name, contract]));
const dependencyFields = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
const requiredPackageFiles = ['CHANGELOG.md', 'LICENSE', 'README.md'];
const sourceExtensions = new Set(['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx', '.vue']);
const vueForgeReference = /@codemonster-ru\/vueforge-/;
const relativeImportPattern = /\b(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*)['"](\.{1,2}\/[^'"]+)['"]/g;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
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

function collectExportTargets(value, location, conditions, targets, errors) {
  if (typeof value === 'string') {
    targets.push({ conditions, location, target: value });
    return;
  }

  if (!isPlainObject(value)) {
    errors.push(`${location} must be a string or condition object.`);
    return;
  }

  for (const [condition, child] of Object.entries(value)) {
    collectExportTargets(child, `${location}.${condition}`, [...conditions, condition], targets, errors);
  }
}

function validateExportTargets(packageContract, packageDirectory, manifest, errors) {
  if (!isPlainObject(manifest.exports)) {
    return;
  }

  for (const [exportKey, exportValue] of Object.entries(manifest.exports)) {
    if (exportKey !== '.' && !exportKey.startsWith('./')) {
      errors.push(`${packageContract.name} has an invalid export key: ${exportKey}.`);
    }

    const targets = [];
    collectExportTargets(
      exportValue,
      `${packageContract.name} exports[${JSON.stringify(exportKey)}]`,
      [],
      targets,
      errors,
    );

    for (const { conditions, location, target } of targets) {
      if (!target.startsWith('./dist/')) {
        errors.push(`${location} must point inside ./dist (received ${target}).`);
        continue;
      }

      const targetPath = resolve(packageDirectory, target.slice(2));
      const targetRelativePath = relative(packageDirectory, targetPath);
      if (targetRelativePath === '..' || targetRelativePath.startsWith(`..${sep}`)) {
        errors.push(`${location} escapes the package directory (${target}).`);
        continue;
      }
      const targetRelativeToDist = relative(join(packageDirectory, 'dist'), targetPath);
      if (targetRelativeToDist === '..' || targetRelativeToDist.startsWith(`..${sep}`)) {
        errors.push(`${location} resolves outside ./dist (${target}).`);
        continue;
      }
      if (!existsSync(targetPath) || !statSync(targetPath).isFile()) {
        errors.push(`${location} target is missing after build: ${target}.`);
      }
      if (conditions.includes('types') && !/\.d\.(?:cts|mts|ts)$/.test(target)) {
        errors.push(`${location} is a types condition but does not target a declaration file (${target}).`);
      }
      if (conditions.includes('require') && !conditions.includes('types') && !target.endsWith('.cjs')) {
        errors.push(`${location} must use a .cjs CommonJS runtime (${target}).`);
      }
      if (conditions.includes('import') && !conditions.includes('types') && !/\.(?:css|js|mjs)$/.test(target)) {
        errors.push(`${location} must use an ESM JavaScript or CSS target (${target}).`);
      }
    }
  }
}

function validateDependencies(packageContract, manifest, errors) {
  for (const dependencyField of dependencyFields) {
    const dependencies = manifest[dependencyField] ?? {};
    if (!isPlainObject(dependencies)) {
      errors.push(`${packageContract.name} ${dependencyField} must be an object.`);
      continue;
    }

    for (const [dependencyName, range] of Object.entries(dependencies)) {
      if (vueForgeReference.test(dependencyName)) {
        errors.push(`${packageContract.name} must not depend on VueForge package ${dependencyName}.`);
      }
      if (!dependencyName.startsWith('@codemonster-ru/ui-')) {
        continue;
      }

      const dependencyContract = contractByName.get(dependencyName);
      if (!dependencyContract) {
        errors.push(`${packageContract.name} has an unregistered CodeMonster UI dependency: ${dependencyName}.`);
        continue;
      }
      if (dependencyContract.releaseOrder >= packageContract.releaseOrder) {
        errors.push(`${packageContract.name} must not depend on same-level or later package ${dependencyName}.`);
      }
      if (dependencyField === 'devDependencies' && range !== `file:../${dependencyContract.directory}`) {
        errors.push(
          `${packageContract.name} devDependencies.${dependencyName} must use file:../${dependencyContract.directory}.`,
        );
      } else if (dependencyField !== 'devDependencies' && (typeof range !== 'string' || !semver.validRange(range))) {
        errors.push(`${packageContract.name} ${dependencyField}.${dependencyName} must use a valid SemVer range.`);
      }
    }
  }
}

function validateNoVueForgeImports(packageContract, packageDirectory, errors) {
  for (const ownedDirectory of ['src', 'dist']) {
    for (const filePath of walkFiles(join(packageDirectory, ownedDirectory))) {
      if (!sourceExtensions.has(extname(filePath))) {
        continue;
      }
      const source = readFileSync(filePath, 'utf8');
      if (vueForgeReference.test(source)) {
        errors.push(`${packageContract.name} contains a VueForge import in ${relative(packageDirectory, filePath)}.`);
      }
      for (const match of source.matchAll(relativeImportPattern)) {
        const importedPath = resolve(filePath, '..', match[1]);
        const importedRelativePath = relative(packageDirectory, importedPath);
        if (importedRelativePath === '..' || importedRelativePath.startsWith(`..${sep}`)) {
          errors.push(
            `${packageContract.name} contains a cross-package relative import in ${relative(packageDirectory, filePath)} (${match[1]}).`,
          );
        }
      }
    }
  }
}

export function validateCodeMonsterUiNpmPackageContract(packageContract, packageDirectory, manifest) {
  const errors = validateCodeMonsterUiNpmManifest(packageContract, manifest);
  if (!isPlainObject(manifest)) {
    return errors;
  }

  for (const fileName of requiredPackageFiles) {
    if (!existsSync(join(packageDirectory, fileName))) {
      errors.push(`${packageContract.name} must include ${fileName}.`);
    }
  }

  validateExportTargets(packageContract, packageDirectory, manifest, errors);
  validateDependencies(packageContract, manifest, errors);
  validateNoVueForgeImports(packageContract, packageDirectory, errors);
  return errors;
}
