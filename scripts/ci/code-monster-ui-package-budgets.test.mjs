import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { measureCodeMonsterUiPackage, validateCodeMonsterUiPackageBudget } from './code-monster-ui-package-budgets.mjs';

function createPackage(context) {
  const packageDirectory = mkdtempSync(join(tmpdir(), 'codemonster-ui-budget-'));
  context.after(() => rmSync(packageDirectory, { recursive: true }));
  mkdirSync(join(packageDirectory, 'dist'));
  writeFileSync(join(packageDirectory, 'dist/index.js'), 'export const value = true;\n');
  writeFileSync(join(packageDirectory, 'dist/styles.css'), '.cm-test { display: block; }\n');
  writeFileSync(join(packageDirectory, 'dist/index.d.ts'), 'export declare const value: true;\n');
  return packageDirectory;
}

test('measures only runtime JavaScript and CSS artifacts', (context) => {
  const packageDirectory = createPackage(context);
  const measurement = measureCodeMonsterUiPackage(packageDirectory);

  assert.equal(measurement.cssFiles, 1);
  assert.equal(measurement.jsFiles, 1);
  assert.ok(measurement.cssRaw > 0);
  assert.ok(measurement.cssGzip > 0);
  assert.ok(measurement.jsRaw > 0);
  assert.ok(measurement.jsGzip > 0);
});

test('reports each exceeded package budget', (context) => {
  const packageDirectory = createPackage(context);
  const result = validateCodeMonsterUiPackageBudget({ name: '@codemonster-ru/ui-test' }, packageDirectory, {
    cssGzip: 1,
    cssRaw: 1,
    jsGzip: 1,
  });

  assert.equal(result.errors.length, 3);
  assert.ok(result.errors.every((message) => message.includes('budget exceeded')));
});

test('requires built artifacts before enforcing budgets', (context) => {
  const packageDirectory = mkdtempSync(join(tmpdir(), 'codemonster-ui-budget-missing-'));
  context.after(() => rmSync(packageDirectory, { recursive: true }));

  assert.deepEqual(
    validateCodeMonsterUiPackageBudget({ name: '@codemonster-ru/ui-test' }, packageDirectory, {
      cssGzip: 1,
      cssRaw: 1,
      jsGzip: 1,
    }).errors,
    ['@codemonster-ru/ui-test dist directory is missing; run the build before size checks.'],
  );
});
