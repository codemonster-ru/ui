#!/usr/bin/env node
// Gate: the multiplatform package boundaries hold.
//
// Runs the boundary analyzer over git-tracked files only, so untracked
// first-migration leftovers such as packages/razor/ and examples/razor/ cannot
// influence the verdict (plan appendix V.4).
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeBoundaries, boundaryRules } from './boundaries.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const files = execFileSync('git', ['-C', repositoryRoot, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  .split('\n')
  .filter(Boolean);

const { violations, notes, edges } = analyzeBoundaries({ rootDir: repositoryRoot, files });

if (notes.length > 0) {
  process.stdout.write('[boundaries] notes:\n');
  for (const note of notes) {
    process.stdout.write(`  - ${note}\n`);
  }
  process.stdout.write('\n');
}

if (violations.length > 0) {
  process.stderr.write(`[boundaries] FAILED with ${violations.length} violation(s):\n`);
  for (const violation of violations) {
    process.stderr.write(`  - ${violation}\n`);
  }
  process.exit(1);
}

const enforced = boundaryRules.map((rule) => rule.id).join(', ');
process.stdout.write(
  `[boundaries] OK: ${boundaryRules.length} enforced packages (${enforced}); ` +
    `${files.length} tracked files scanned, ${edges.length} internal edge(s) resolved.\n`,
);
