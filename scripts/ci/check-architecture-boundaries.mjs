#!/usr/bin/env node
// Gate: the multiplatform package boundaries hold.
//
// Runs the boundary analyzer over git-tracked files only, so untracked
// first-migration leftovers such as packages/razor/ and examples/razor/ cannot
// influence the verdict (plan appendix V.4).
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeBoundaries, boundaryRules } from './boundaries.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const skippedDirectories = new Set(['.git', 'node_modules', 'dist', 'coverage', '.npm-cache', 'vendor']);

function listTrackedFiles() {
  return execFileSync('git', ['-C', repositoryRoot, 'ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n')
    .filter(Boolean);
}

// Fallback for a tree exported without .git, such as a release tarball. Such a
// tree contains only tracked content by construction, so the "tracked files
// only" guarantee still holds.
function listWorkedTreeFiles(directory = repositoryRoot, collected = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!skippedDirectories.has(entry.name)) {
        listWorkedTreeFiles(resolve(directory, entry.name), collected);
      }
      continue;
    }

    if (entry.isFile()) {
      collected.push(relative(repositoryRoot, resolve(directory, entry.name)).split('\\').join('/'));
    }
  }

  return collected;
}

let files;
let source = 'git-tracked files';

try {
  files = listTrackedFiles();
} catch {
  files = listWorkedTreeFiles();
  source = 'working-tree walk (no git repository found)';
}

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
    `${files.length} files scanned from ${source}, ${edges.length} internal edge(s) resolved.\n`,
);
