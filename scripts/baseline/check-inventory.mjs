#!/usr/bin/env node
// Gate: the working tree must still expose the frozen reference inventory.
//
// Usage:
//   node scripts/baseline/check-inventory.mjs            compare against the baseline
//   node scripts/baseline/check-inventory.mjs --write    write the baseline (reference tree only)
//
// The baseline can only be written from a tree whose tracked content matches
// the reference commit. Current output can never become the new baseline by
// accident.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { relative } from 'node:path';
import { collectInventory } from './inventory.mjs';
import { inventoryBaselinePath, readJson, referenceCommit, repositoryRoot, writeBaselineJson } from './reference.mjs';

const shouldWrite = process.argv.includes('--write');

function git(...args) {
  return execFileSync('git', ['-C', repositoryRoot, ...args], { encoding: 'utf8' }).trim();
}

// Read-only comparison of the inventoried product tree against the reference
// commit. Only `packages/` and `examples/` are compared: those are the sources
// the collector reads. Harness and tooling files live outside them, so adding
// the baseline harness itself does not unlock a drifted product baseline.
// Untracked files are ignored on purpose; they cannot change what the collector
// reads out of tracked sources.
function inventoriedTreeMatchesReference() {
  const diff = git('diff', '--name-only', referenceCommit, '--', 'packages', 'examples');
  return { clean: diff.length === 0, diff: diff ? diff.split('\n') : [] };
}

// Identity key used to line array entries up before comparing them, so a
// changed package reports the field that changed instead of dumping both
// objects.
function identityKey(item) {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }

  for (const key of ['directory', 'id', 'name', 'path']) {
    if (typeof item[key] === 'string') return `${key}=${item[key]}`;
  }

  return null;
}

function diffInventories(expected, actual, path = '$') {
  const differences = [];

  if (Array.isArray(expected) && Array.isArray(actual)) {
    const expectedKeys = expected.map(identityKey);

    if (expectedKeys.every((key) => key !== null)) {
      const expectedByKey = new Map(expected.map((item, index) => [expectedKeys[index], item]));
      const actualByKey = new Map(actual.map((item) => [identityKey(item), item]));

      for (const [key, item] of expectedByKey) {
        if (!actualByKey.has(key)) {
          differences.push(`${path}: missing entry ${key}`);
          continue;
        }
        differences.push(...diffInventories(item, actualByKey.get(key), `${path}[${key}]`));
      }
      for (const key of actualByKey.keys()) {
        if (!expectedByKey.has(key)) differences.push(`${path}: unexpected entry ${key}`);
      }

      const expectedOrder = expectedKeys.join(',');
      const actualOrder = actual.map(identityKey).join(',');
      if (differences.length === 0 && expectedOrder !== actualOrder) {
        differences.push(`${path}: order changed`);
      }

      return differences;
    }

    const expectedSet = new Set(expected.map((item) => JSON.stringify(item)));
    const actualSet = new Set(actual.map((item) => JSON.stringify(item)));

    for (const item of expectedSet) {
      if (!actualSet.has(item)) differences.push(`${path}: missing ${item}`);
    }
    for (const item of actualSet) {
      if (!expectedSet.has(item)) differences.push(`${path}: unexpected ${item}`);
    }
    if (differences.length === 0 && JSON.stringify(expected) !== JSON.stringify(actual)) {
      differences.push(`${path}: order changed`);
    }

    return differences;
  }

  const expectedIsObject = expected !== null && typeof expected === 'object' && !Array.isArray(expected);
  const actualIsObject = actual !== null && typeof actual === 'object' && !Array.isArray(actual);

  if (expectedIsObject && actualIsObject) {
    for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
      if (!(key in expected)) {
        differences.push(`${path}.${key}: unexpected entry`);
        continue;
      }
      if (!(key in actual)) {
        differences.push(`${path}.${key}: missing entry`);
        continue;
      }
      differences.push(...diffInventories(expected[key], actual[key], `${path}.${key}`));
    }

    return differences;
  }

  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    differences.push(`${path}: expected ${JSON.stringify(expected)}, found ${JSON.stringify(actual)}`);
  }

  return differences;
}

const inventory = collectInventory(repositoryRoot);

if (shouldWrite) {
  const { clean, diff } = inventoriedTreeMatchesReference();
  if (!clean) {
    process.stderr.write(
      `Refusing to write the reference inventory: packages/ or examples/ differ from ${referenceCommit}.\n` +
        `Changed paths:\n  ${diff.join('\n  ')}\n`,
    );
    process.exit(1);
  }

  await writeBaselineJson(inventoryBaselinePath, inventory);
  process.stdout.write(`Wrote ${relative(repositoryRoot, inventoryBaselinePath)} from ${referenceCommit}.\n`);
  process.exit(0);
}

if (!existsSync(inventoryBaselinePath)) {
  process.stderr.write(
    `Missing ${relative(repositoryRoot, inventoryBaselinePath)}. Run with --write from the reference tree.\n`,
  );
  process.exit(1);
}

const baseline = readJson(inventoryBaselinePath);

if (baseline.referenceCommit !== referenceCommit) {
  process.stderr.write(
    `Baseline provenance mismatch: file records ${baseline.referenceCommit}, harness expects ${referenceCommit}.\n`,
  );
  process.exit(1);
}

const differences = diffInventories(baseline, inventory);

if (differences.length > 0) {
  process.stderr.write(`Reference inventory drifted from ${referenceCommit}:\n`);
  for (const difference of differences) {
    process.stderr.write(`  - ${difference}\n`);
  }
  process.stderr.write(`\n${differences.length} difference(s).\n`);
  process.exit(1);
}

process.stdout.write(
  `Reference inventory matches ${referenceCommit}: ` +
    `${inventory.packages.length} packages, ` +
    `${inventory.components.publicComponentNames.length} public component names, ` +
    `${inventory.showcase.routes.length} showcase routes.\n`,
);
