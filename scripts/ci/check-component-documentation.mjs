import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { collectExportedComponents, findUndocumentedComponents } from './component-documentation.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const indexes = ['packages/vue/src/index.ts', 'packages/layouts/src/index.ts'].map((path) =>
  readFileSync(join(repositoryRoot, path), 'utf8'),
);
const guidesDirectory = join(repositoryRoot, 'docs/components');
const guides = readdirSync(guidesDirectory)
  .filter((entry) => entry.endsWith('.md'))
  .map((entry) => readFileSync(join(guidesDirectory, entry), 'utf8'));

const exported = collectExportedComponents(indexes);
const undocumented = findUndocumentedComponents(exported, guides);

if (undocumented.length > 0) {
  console.error('[component-documentation] Exported components no guide in docs/components mentions:');
  for (const name of undocumented) console.error(`[component-documentation]   ${name}`);
  console.error('[component-documentation] The guides are the public migration boundary the release notes point at,');
  console.error('[component-documentation] so a component missing from them is one a consumer cannot migrate to.');
  process.exit(1);
}

console.log(`[component-documentation] OK: all ${exported.size} exported component(s) appear in the guides.`);
