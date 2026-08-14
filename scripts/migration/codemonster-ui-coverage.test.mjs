import assert from 'node:assert/strict';
import test from 'node:test';
import {
  discoverCoverageArtifacts,
  readCodeMonsterCoverage,
  validateCodeMonsterCoverage,
} from './codemonster-ui-coverage.mjs';
import { readVueForgeMapping } from './vueforge-mapping.mjs';

function maturityBacklog(gaps = []) {
  return JSON.stringify({
    schemaVersion: 1,
    coverage: 'migration/codemonster-ui-coverage.json',
    consumerInventory: 'consumer.md',
    documentation: 'backlog.md',
    items:
      gaps.length === 0
        ? []
        : [
            {
              id: 'CMUI-B001',
              order: 1,
              roadmapItem: 'CMUI-177',
              destination: 'phase-17',
              priority: 'P0',
              summary: 'Test backlog item.',
              reason: 'Test consumer evidence.',
              gaps,
            },
          ],
    retainedProducts: [],
  });
}

function cloneArtifacts(artifacts) {
  return {
    contracts: new Set(artifacts.contracts),
    files: new Map(artifacts.files),
    razorComponents: new Map(artifacts.razorComponents),
    vueComponents: new Set(artifacts.vueComponents),
  };
}

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
    backlog: 'backlog.json',
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
      ['backlog.json', maturityBacklog()],
      ['backlog.md', 'Maturity backlog'],
      ['consumer.md', 'Consumer inventory'],
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
    backlog: 'backlog.json',
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
    files: new Map([
      ['backlog.json', maturityBacklog()],
      ['backlog.md', 'Maturity backlog'],
      ['catalog.json', JSON.stringify({ schemaVersion: 1, components: [], migrationGaps: [] })],
      ['consumer.md', 'Consumer inventory'],
    ]),
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
    backlog: 'backlog.json',
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
      ['backlog.json', maturityBacklog(['VfButton:material-portable-gap'])],
      ['backlog.md', 'Maturity backlog'],
      ['button.md', 'CmButton'],
      ['catalog.json', JSON.stringify({ schemaVersion: 1, components: [], migrationGaps: [] })],
      ['consumer.md', 'Consumer inventory'],
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

test('requires every coverage gap exactly once in the maturity backlog', () => {
  const coverage = readCodeMonsterCoverage();
  const mapping = readVueForgeMapping();
  const artifacts = discoverCoverageArtifacts(coverage);
  const backlog = JSON.parse(artifacts.files.get(coverage.backlog));
  const gap = backlog.items.flatMap((item) => item.gaps)[0];
  const item = backlog.items.find((candidate) => candidate.gaps.includes(gap));
  assert.ok(gap);
  assert.ok(item);
  item.gaps = item.gaps.filter((candidate) => candidate !== gap);
  backlog.items[0].gaps = ['VfUnknown:unknown-gap'];
  artifacts.files.set(coverage.backlog, JSON.stringify(backlog));

  const issues = validateCodeMonsterCoverage(coverage, mapping, artifacts);
  assert.ok(issues.includes(`Coverage gap must appear exactly once in the maturity backlog: ${gap}.`));
  assert.ok(issues.includes('Maturity backlog references unknown coverage gap: VfUnknown:unknown-gap.'));
});

test('enforces the M9 migration coverage exit gate', async (context) => {
  const coverage = readCodeMonsterCoverage();
  const mapping = readVueForgeMapping();
  const artifacts = discoverCoverageArtifacts(coverage);
  const buttonDelivery = coverage.components.VfButton.delivery;

  await context.test('rejects an unclassified baseline capability', () => {
    const unclassifiedCoverage = structuredClone(coverage);
    unclassifiedCoverage.components.VfButton.capabilities = [];

    assert.ok(
      validateCodeMonsterCoverage(unclassifiedCoverage, mapping, cloneArtifacts(artifacts)).includes(
        'VfButton must declare at least one capability.',
      ),
    );
  });

  await context.test('rejects a missing Vue or Razor adapter', () => {
    const missingVue = cloneArtifacts(artifacts);
    missingVue.vueComponents.delete(buttonDelivery.target);
    assert.ok(
      validateCodeMonsterCoverage(coverage, mapping, missingVue).includes(
        'VfButton target CmButton is not exported by the Vue adapter.',
      ),
    );

    const missingRazor = cloneArtifacts(artifacts);
    missingRazor.razorComponents.delete(buttonDelivery.target);
    assert.ok(
      validateCodeMonsterCoverage(coverage, mapping, missingRazor).includes(
        'VfButton target CmButton is not registered as Razor tag button.',
      ),
    );
  });

  await context.test('rejects a missing contract', () => {
    const missingContract = cloneArtifacts(artifacts);
    missingContract.contracts.delete(buttonDelivery.contract);

    assert.ok(
      validateCodeMonsterCoverage(coverage, mapping, missingContract).includes(
        'VfButton references missing contract button.',
      ),
    );
  });

  await context.test('rejects a stable component without a showcase target', () => {
    const missingShowcase = cloneArtifacts(artifacts);
    const catalog = JSON.parse(missingShowcase.files.get(coverage.catalog));
    catalog.components.find(({ name }) => name === buttonDelivery.target).demoHref = '#missing-showcase';
    missingShowcase.files.set(coverage.catalog, JSON.stringify(catalog));

    assert.ok(
      validateCodeMonsterCoverage(coverage, mapping, missingShowcase).includes(
        'Catalog component CmButton references missing showcase anchor #missing-showcase.',
      ),
    );
  });
});
