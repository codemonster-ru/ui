import { readFileSync } from 'node:fs';
import { createVisualFixtureMatrix } from './code-monster-ui-fixtures.mjs';

const identifierPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

export function readCrossPlatformBaselineManifest(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function validateCrossPlatformBaselineManifest(manifest, componentCases) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['Cross-platform baseline manifest must be an object.'];
  }

  const allowedKeys = new Set(['caseIds', 'platforms', 'schemaVersion']);
  for (const key of Object.keys(manifest)) {
    if (!allowedKeys.has(key)) {
      errors.push(`Cross-platform baseline manifest contains unsupported field ${key}.`);
    }
  }
  if (manifest.schemaVersion !== 1) {
    errors.push('Cross-platform baseline manifest schemaVersion must be 1.');
  }

  for (const field of ['platforms', 'caseIds']) {
    const values = manifest[field];
    if (!Array.isArray(values) || values.length === 0) {
      errors.push(`Cross-platform baseline manifest requires at least one ${field}.`);
      continue;
    }
    const seen = new Set();
    for (const value of values) {
      if (!identifierPattern.test(value)) {
        errors.push(`Cross-platform baseline ${field} must use lowercase kebab-case identifiers.`);
      }
      if (seen.has(value)) {
        errors.push(`Duplicate cross-platform baseline ${field} value: ${value}.`);
      }
      seen.add(value);
    }
  }

  if (Array.isArray(manifest.platforms) && manifest.platforms.length < 2) {
    errors.push('Cross-platform baseline manifest requires at least two platforms.');
  }
  for (const platform of ['vue', 'razor']) {
    if (Array.isArray(manifest.platforms) && !manifest.platforms.includes(platform)) {
      errors.push(`Cross-platform baseline manifest must include ${platform}.`);
    }
  }

  const casesById = new Map(componentCases.map((componentCase) => [componentCase.id, componentCase]));
  for (const caseId of manifest.caseIds ?? []) {
    const componentCase = casesById.get(caseId);
    if (!componentCase) {
      errors.push(`Cross-platform baseline references unknown case ${caseId}.`);
    } else if (componentCase.data.visual?.enabled === false) {
      errors.push(`Cross-platform baseline case ${caseId} opts out of visual fixtures.`);
    }
  }

  return errors;
}

export function createCrossPlatformBaselineMatrix(componentCases, config, manifest) {
  const errors = validateCrossPlatformBaselineManifest(manifest, componentCases);
  if (errors.length > 0) {
    throw new Error(`Invalid cross-platform baseline manifest:\n${errors.join('\n')}`);
  }

  const selectedCaseIds = new Set(manifest.caseIds);
  const selectedCases = componentCases.filter((componentCase) => selectedCaseIds.has(componentCase.id));

  return manifest.platforms.flatMap((platform) =>
    createVisualFixtureMatrix(selectedCases, config, { platform }).map((fixture) => ({
      ...fixture,
      baselineId: `${config.reference.commit}/${fixture.id}`,
    })),
  );
}
