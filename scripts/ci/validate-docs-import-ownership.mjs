#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(new URL('../..', import.meta.url).pathname);

const packageEntrypoints = {
  '@codemonster-ru/vueforge-core': path.join(repoRoot, 'packages/core/src/index.ts'),
  '@codemonster-ru/vueforge-layouts': path.join(repoRoot, 'packages/layouts/src/index.ts'),
};

const scanRoots = [
  path.join(repoRoot, 'docs'),
  path.join(repoRoot, 'packages/playground/src'),
  path.join(repoRoot, 'examples/playground/src'),
];

const scanExtensions = new Set(['.md', '.vue', '.ts']);

function listFilesRecursive(rootDir) {
  const files = [];
  for (const entry of readdirSync(rootDir)) {
    const fullPath = path.join(rootDir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
      continue;
    }
    if (scanExtensions.has(path.extname(fullPath))) {
      files.push(fullPath);
    }
  }
  return files;
}

function toExportSet(entrypointPath) {
  const source = readFileSync(entrypointPath, 'utf8');
  const exportsSet = new Set();
  const reExportBlock = /export\s+(?:type\s+)?\{([\s\S]*?)\}\s*from\s*['"][^'"]+['"]/g;
  for (const match of source.matchAll(reExportBlock)) {
    const block = match[1];
    for (const rawItem of block.split(',')) {
      const item = rawItem.trim();
      if (!item) {
        continue;
      }
      const normalized = item.replace(/^type\s+/, '');
      const namePart = normalized.includes(' as ')
        ? normalized.split(/\s+as\s+/).at(-1)
        : normalized;
      const name = namePart?.trim();
      if (name) {
        exportsSet.add(name);
      }
    }
  }
  return exportsSet;
}

function toRelative(absolutePath) {
  return path.relative(repoRoot, absolutePath).split(path.sep).join('/');
}

function getLineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

const exportsByPackage = Object.fromEntries(
  Object.entries(packageEntrypoints).map(([pkgName, entrypoint]) => [pkgName, toExportSet(entrypoint)])
);

const allFiles = scanRoots.flatMap((dir) => listFilesRecursive(dir));
const importPattern =
  /import\s+(?:type\s+)?(?:[A-Za-z_$][\w$]*\s*,\s*)?\{([^}]*)\}\s*from\s*['"](@codemonster-ru\/vueforge-(core|layouts))['"]/g;

const issues = [];

for (const filePath of allFiles) {
  const source = readFileSync(filePath, 'utf8');
  const relativePath = toRelative(filePath);

  for (const match of source.matchAll(importPattern)) {
    const symbolsBlock = match[1];
    const packageName = match[2];
    const expectedExports = exportsByPackage[packageName] ?? new Set();
    const importedSymbols = symbolsBlock
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^type\s+/, ''))
      .map((item) => (item.includes(' as ') ? item.split(/\s+as\s+/)[0].trim() : item))
      .filter(Boolean);

    for (const symbol of importedSymbols) {
      if (expectedExports.has(symbol)) {
        continue;
      }

      const ownerPackage = Object.entries(exportsByPackage).find(([, symbols]) => symbols.has(symbol))?.[0];
      const line = getLineNumber(source, match.index ?? 0);
      issues.push({
        file: relativePath,
        line,
        packageName,
        symbol,
        ownerPackage,
      });
    }
  }
}

if (issues.length > 0) {
  console.error('Import ownership validation failed:\n');
  for (const issue of issues) {
    const suggestion = issue.ownerPackage
      ? ` Expected owner: ${issue.ownerPackage}.`
      : ' Symbol is not exported by the known public entrypoints.';
    console.error(
      `- ${issue.file}:${issue.line} imports ${issue.symbol} from ${issue.packageName}.${suggestion}`
    );
  }
  process.exit(1);
}

console.log(`Import ownership validation passed for ${allFiles.length} files.`);
