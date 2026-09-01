import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  collectDeclaredControllers,
  collectImplementedControllers,
  collectSsrCoveredSlugs,
  factoryNameFor,
  findContractsWithoutSsrCoverage,
  findInteractiveContractsWithoutScenarios,
  findMissingControllers,
} from './controller-coverage.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const contractsDirectory = join(repositoryRoot, 'contracts');

const contracts = [];
for (const slug of readdirSync(contractsDirectory, { withFileTypes: true })) {
  if (!slug.isDirectory() || slug.name === 'schema') continue;
  const casesDirectory = join(contractsDirectory, slug.name, 'cases');
  let entries = [];
  try {
    entries = readdirSync(casesDirectory);
  } catch {
    continue;
  }

  const sources = entries
    .filter((entry) => entry.endsWith('.html'))
    .map((entry) => readFileSync(join(casesDirectory, entry), 'utf8'));
  let hasScenarios = false;
  try {
    hasScenarios = readdirSync(join(contractsDirectory, slug.name, 'behavior')).some((entry) =>
      entry.endsWith('.scenario.json'),
    );
  } catch {
    hasScenarios = false;
  }

  contracts.push({ fixtures: sources, hasScenarios, slug: slug.name });
}

const fixtures = contracts.flatMap(({ fixtures: sources }) => sources);

const declared = collectDeclaredControllers(fixtures);
const implemented = collectImplementedControllers(
  readFileSync(join(repositoryRoot, 'packages/runtime/src/index.ts'), 'utf8'),
);
const missing = findMissingControllers(declared, implemented);

if (missing.length > 0) {
  console.error('[controller-coverage] Canonical markup names controllers the runtime does not provide:');
  for (const controller of missing) {
    console.error(`[controller-coverage]   data-cm-controller="${controller}" needs ${factoryNameFor(controller)}`);
  }
  console.error(
    '[controller-coverage] Without it the progressive-enhancement adapter renders the markup and does nothing.',
  );
  process.exit(1);
}

const withoutScenarios = findInteractiveContractsWithoutScenarios(contracts);

if (withoutScenarios.length > 0) {
  console.error('[controller-coverage] Interactive contracts with no behaviour scenarios:');
  for (const slug of withoutScenarios) {
    console.error(`[controller-coverage]   contracts/${slug}/behavior/ is empty or missing`);
  }
  console.error(
    '[controller-coverage] Without one, the Vue component and the controller are tested apart and nothing checks they agree.',
  );
  process.exit(1);
}

const vueTestsDirectory = join(repositoryRoot, 'packages/vue/__tests__');
const ssrSources = readdirSync(vueTestsDirectory)
  .filter((entry) => entry.endsWith('.test.mjs'))
  .map((entry) => readFileSync(join(vueTestsDirectory, entry), 'utf8'));
const withoutSsr = findContractsWithoutSsrCoverage(
  contracts.map(({ slug }) => slug),
  collectSsrCoveredSlugs(ssrSources),
);

if (withoutSsr.length > 0) {
  console.error('[controller-coverage] Contracts whose Vue output is never compared to the canonical fixture:');
  for (const slug of withoutSsr) {
    console.error(`[controller-coverage]   contracts/${slug} has no Vue SSR comparison`);
  }
  console.error(
    '[controller-coverage] The Razor adapter is compared against every fixture, so these are enforced on one side only.',
  );
  process.exit(1);
}

console.log(
  `[controller-coverage] OK: all ${declared.size} declared controller(s) are implemented in ui-runtime, ` +
    `every interactive contract states its behaviour, and all ${contracts.length} contract(s) are compared on both adapters.`,
);
