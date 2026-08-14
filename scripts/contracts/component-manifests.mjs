import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

export function collectComponentManifests(contractsDirectory) {
  return readdirSync(contractsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'schema')
    .map((entry) => ({
      manifest: JSON.parse(readFileSync(join(contractsDirectory, entry.name, 'manifest.json'), 'utf8')),
      slug: entry.name,
    }))
    .sort((left, right) => left.slug.localeCompare(right.slug));
}

export function validateComponentManifests(schema, manifests) {
  const ajv = new Ajv2020({ allErrors: true });
  const validate = ajv.compile(schema);
  const errors = [];

  for (const { manifest, slug } of manifests) {
    if (validate(manifest)) continue;
    for (const error of validate.errors ?? []) {
      errors.push(`${slug}${error.instancePath || '/'} ${error.message}.`);
    }
  }

  return errors;
}
