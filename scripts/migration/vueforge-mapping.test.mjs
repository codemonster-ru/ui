import assert from 'node:assert/strict';
import test from 'node:test';
import {
  discoverCodeMonsterComponents,
  discoverLegacyComponents,
  readVueForgeMapping,
  validateVueForgeMapping,
} from './vueforge-mapping.mjs';
import { readVueForgeBaseline } from './vueforge-baseline.mjs';

test('covers every frozen package and public VueForge component', () => {
  assert.deepEqual(
    validateVueForgeMapping(
      readVueForgeMapping(),
      readVueForgeBaseline(),
      discoverLegacyComponents(),
      discoverCodeMonsterComponents(),
    ),
    [],
  );
});

test('reports missing mappings and unavailable replacement targets', () => {
  const mapping = {
    schemaVersion: 1,
    packageMappings: [],
    componentMappings: [{ source: 'VfButton', action: 'replace', targets: ['CmMissing'] }],
  };
  const baseline = { packages: [{ name: '@codemonster-ru/vueforge-core' }] };

  assert.deepEqual(validateVueForgeMapping(mapping, baseline, new Set(['VfButton', 'VfCard']), new Set(['CmButton'])), [
    'Frozen package must have exactly one mapping: @codemonster-ru/vueforge-core.',
    'Public component must have exactly one mapping: VfCard.',
    'Component VfButton references unavailable target CmMissing.',
  ]);
});
