import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { collectExportedComponents, findUndocumentedComponents } from './component-documentation.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const indexes = ['packages/vue/src/index.ts', 'packages/layouts/src/index.ts'].map((path) =>
  readFileSync(join(repositoryRoot, path), 'utf8'),
);
const guidesDirectory = join(repositoryRoot, 'docs/components');
const catalogFiles = new Set(['index.md', 'quality-matrix.md']);
const guidePaths = readdirSync(guidesDirectory)
  .filter((entry) => entry.endsWith('.md') && !catalogFiles.has(entry))
  .map((entry) => join(guidesDirectory, entry));
guidePaths.push(
  join(repositoryRoot, 'docs/recipes/confirm-dialog.md'),
  join(repositoryRoot, 'docs/recipes/theme-switch.md'),
);
const guides = guidePaths.map((path) => readFileSync(path, 'utf8'));

const exported = collectExportedComponents(indexes);
const undocumented = findUndocumentedComponents(exported, guides);

if (undocumented.length > 0) {
  console.error(
    '[component-documentation] Exported components missing from the component guides and maintained recipes:',
  );
  for (const name of undocumented) console.error(`[component-documentation]   ${name}`);
  process.exit(1);
}

console.log(`[component-documentation] OK: all ${exported.size} exported component(s) appear in the guides.`);
