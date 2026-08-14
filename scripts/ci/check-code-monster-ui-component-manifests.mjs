import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { collectComponentManifests, validateComponentManifests } from '../contracts/component-manifests.mjs';

const contractsDirectory = resolve(import.meta.dirname, '../../contracts');
const schema = JSON.parse(readFileSync(resolve(contractsDirectory, 'schema/component-manifest.schema.json'), 'utf8'));
const manifests = collectComponentManifests(contractsDirectory);
const errors = validateComponentManifests(schema, manifests);

if (errors.length > 0) {
  console.error(`[ui-component-manifests] FAILED with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`[ui-component-manifests] OK: ${manifests.length} component manifest(s).`);
}
