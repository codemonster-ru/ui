#!/usr/bin/env node
// Gate: the Razor adapter and its build only read neutral packages.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeAssetBoundary, analyzePhpIncludes, neutralPackages } from './asset-boundary.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// Tracked files only, so untracked leftovers and vendor trees never influence
// the result. An exported tree has no .git and contains only tracked content by
// construction, so walking it is equivalent; the source is reported either way.
function listFiles() {
  try {
    return {
      source: 'git ls-files',
      files: execFileSync('git', ['-C', repositoryRoot, 'ls-files'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        .split('\n')
        .filter(Boolean),
    };
  } catch {
    const walk = (directory) =>
      readdirSync(resolve(repositoryRoot, directory), { withFileTypes: true }).flatMap((entry) => {
        const path = `${directory}/${entry.name}`;
        if (['node_modules', 'vendor', 'dist', '.git', '.release'].includes(entry.name)) return [];
        return entry.isDirectory() ? walk(path) : [path];
      });

    return { source: 'exported tree walk', files: walk('packages/razor') };
  }
}

const { source: fileSource, files } = listFiles();

const { violations, edges } = analyzeAssetBoundary({ rootDir: repositoryRoot, files });
const phpViolations = analyzePhpIncludes({ rootDir: repositoryRoot, files });
const all = [...violations, ...phpViolations];

if (edges.length > 0) {
  process.stdout.write('[asset-boundary] Razor reads these neutral sources:\n');
  for (const edge of edges) process.stdout.write(`  - ${edge.file} -> ${edge.path}\n`);
}

if (all.length > 0) {
  process.stderr.write(`\n[asset-boundary] FAILED with ${all.length} violation(s):\n`);
  for (const violation of all) process.stderr.write(`  - ${violation}\n`);
  process.exit(1);
}

process.stdout.write(
  `\n[asset-boundary] OK: the Razor adapter reads only ${neutralPackages.join(', ')} ` +
    `(${edges.length} neutral edge(s), ${files.length} files from ${fileSource}).\n`,
);
