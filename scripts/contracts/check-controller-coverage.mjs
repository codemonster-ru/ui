import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  collectDeclaredControllers,
  collectImplementedControllers,
  factoryNameFor,
  findMissingControllers,
} from './controller-coverage.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const contractsDirectory = join(repositoryRoot, 'contracts');

const fixtures = [];
for (const slug of readdirSync(contractsDirectory, { withFileTypes: true })) {
  if (!slug.isDirectory() || slug.name === 'schema') continue;
  const casesDirectory = join(contractsDirectory, slug.name, 'cases');
  let entries = [];
  try {
    entries = readdirSync(casesDirectory);
  } catch {
    continue;
  }
  for (const entry of entries) {
    if (entry.endsWith('.html')) fixtures.push(readFileSync(join(casesDirectory, entry), 'utf8'));
  }
}

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
  console.error('[controller-coverage] Without it the progressive-enhancement adapter renders the markup and does nothing.');
  process.exit(1);
}

console.log(
  `[controller-coverage] OK: all ${declared.size} declared controller(s) are implemented in ui-runtime.`,
);
