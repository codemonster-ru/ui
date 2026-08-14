import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { collectComponentManifests, validateComponentManifests } from './component-manifests.mjs';

const contractsDirectory = resolve(import.meta.dirname, '../../contracts');
const schema = JSON.parse(readFileSync(resolve(contractsDirectory, 'schema/component-manifest.schema.json'), 'utf8'));

test('validates every component manifest against the published schema', () => {
  const manifests = collectComponentManifests(contractsDirectory);

  assert.equal(manifests.length, 37);
  assert.deepEqual(validateComponentManifests(schema, manifests), []);
});

test('rejects malformed dynamic slots and undeclared manifest fields', () => {
  const manifest = structuredClone(collectComponentManifests(contractsDirectory)[0].manifest);
  manifest.slots['item{lowerCamel}'] = { scopeContract: 'item-state' };
  manifest.slots.default = { implementationDetail: true };

  const errors = validateComponentManifests(schema, [{ manifest, slug: 'example' }]);

  assert.ok(errors.some((error) => error.includes('property name must be valid')));
  assert.ok(errors.some((error) => error.includes("must have required property 'required'")));
  assert.ok(errors.some((error) => error.includes('must NOT have additional properties')));
});
