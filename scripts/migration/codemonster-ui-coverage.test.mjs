import assert from 'node:assert/strict';
import test from 'node:test';
import {
  discoverCoverageArtifacts,
  readCodeMonsterCoverage,
  validateCodeMonsterCoverage,
} from './codemonster-ui-coverage.mjs';
import { readVueForgeMapping } from './vueforge-mapping.mjs';

test('tracks every mapped component and delivered artifact', () => {
  const coverage = readCodeMonsterCoverage();
  assert.deepEqual(
    validateCodeMonsterCoverage(coverage, readVueForgeMapping(), discoverCoverageArtifacts(coverage)),
    [],
  );
});

test('reports mapping, capability, and delivery drift', () => {
  const coverage = {
    schemaVersion: 2,
    baseline: 'other',
    audits: { composeAndManual: 'complete', directReplacements: 'complete' },
    catalog: 'catalog.json',
    components: {
      VfButton: {
        disposition: 'manual',
        capabilities: [{ id: 'legacy-api', status: 'supported' }],
        delivery: {
          target: 'CmMissing',
          contract: 'missing',
          razorTag: 'missing',
          documentation: 'docs/components/missing.md',
          showcase: 'examples/missing.vue',
        },
      },
      VfUnknown: {
        disposition: 'manual',
        capabilities: [{ id: 'migration-outcome', status: 'pending' }],
      },
    },
  };
  const mapping = {
    baseline: 'vueforge-test',
    componentMappings: [
      { source: 'VfButton', action: 'replace', targets: ['CmButton'] },
      { source: 'VfCard', action: 'replace', targets: ['CmCard'] },
    ],
  };
  const artifacts = {
    contracts: new Set(['button', 'orphan']),
    files: new Map([
      [
        'catalog.json',
        JSON.stringify({
          schemaVersion: 1,
          components: [
            { name: 'CmButton', group: 'Actions', demoHref: '/core' },
            { name: 'CmCard', group: 'Content', demoHref: '/core' },
          ],
          migrationGaps: [],
        }),
      ],
    ]),
    razorComponents: new Map([
      ['CmButton', 'button'],
      ['CmOrphan', 'orphan'],
    ]),
    vueComponents: new Set(['CmButton', 'CmOrphan']),
  };

  assert.deepEqual(validateCodeMonsterCoverage(coverage, mapping, artifacts), [
    'Coverage schemaVersion must be 1.',
    'Coverage baseline must match mapping baseline vueforge-test.',
    'VfButton classified capability legacy-api must provide evidence.',
    'VfUnknown pending capability migration-outcome must name a roadmap item.',
    'VfButton coverage disposition manual does not match mapping action replace.',
    'VfButton delivery must target CmButton.',
    'Mapped component is missing from coverage: VfCard.',
    'Coverage references unknown component: VfUnknown.',
    'Vue component is missing from coverage delivery: CmButton.',
    'Vue component is missing from coverage delivery: CmOrphan.',
    'Razor component is missing from coverage delivery: CmButton.',
    'Razor component is missing from coverage delivery: CmOrphan.',
    'Contract is missing from coverage delivery: button.',
    'Contract is missing from coverage delivery: orphan.',
  ]);
});

test('rejects pending entries after the compose and manual audit is complete', () => {
  const coverage = {
    schemaVersion: 1,
    baseline: 'vueforge-test',
    audits: { composeAndManual: 'complete', directReplacements: 'complete' },
    catalog: 'catalog.json',
    components: {
      VfLegacy: {
        disposition: 'manual',
        capabilities: [{ id: 'migration-outcome', status: 'pending', roadmapItem: 'CMUI-173' }],
      },
    },
  };
  const mapping = {
    baseline: 'vueforge-test',
    componentMappings: [{ source: 'VfLegacy', action: 'manual', targets: [] }],
  };
  const artifacts = {
    contracts: new Set(),
    files: new Map([['catalog.json', JSON.stringify({ schemaVersion: 1, components: [], migrationGaps: [] })]]),
    razorComponents: new Map(),
    vueComponents: new Set(),
  };

  assert.deepEqual(validateCodeMonsterCoverage(coverage, mapping, artifacts), [
    'VfLegacy has an incomplete compose/manual disposition audit.',
  ]);
});

test('requires stable components and unresolved gaps in the playground catalog', () => {
  const coverage = {
    schemaVersion: 1,
    baseline: 'vueforge-test',
    audits: { composeAndManual: 'complete', directReplacements: 'complete' },
    catalog: 'catalog.json',
    components: {
      VfButton: {
        disposition: 'replace',
        capabilities: [
          {
            id: 'material-portable-gap',
            status: 'missing',
            roadmapItem: 'CMUI-177',
            notes: 'Missing capability.',
            evidence: ['evidence.md'],
          },
        ],
        delivery: {
          target: 'CmButton',
          contract: 'button',
          razorTag: 'button',
          documentation: 'button.md',
          showcase: 'showcase.vue',
        },
      },
    },
  };
  const mapping = {
    baseline: 'vueforge-test',
    componentMappings: [{ source: 'VfButton', action: 'replace', targets: ['CmButton'] }],
  };
  const artifacts = {
    contracts: new Set(['button']),
    files: new Map([
      ['button.md', 'CmButton'],
      ['catalog.json', JSON.stringify({ schemaVersion: 1, components: [], migrationGaps: [] })],
      ['evidence.md', 'Evidence'],
      ['showcase.vue', 'CmButton ./component-catalog.json catalog.components catalog.migrationGaps'],
    ]),
    razorComponents: new Map([['CmButton', 'button']]),
    vueComponents: new Set(['CmButton']),
  };

  assert.deepEqual(validateCodeMonsterCoverage(coverage, mapping, artifacts), [
    'Stable component must appear exactly once in the catalog: CmButton.',
    'Migration gap must appear exactly once in the catalog: VfButton:material-portable-gap.',
  ]);
});
