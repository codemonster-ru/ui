import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeAccessibility, assertNoAccessibilityViolations } from './accessibility.mjs';

test('accepts an accessible labelled control', async () => {
  const result = await analyzeAccessibility(`
    <label for="email">Email</label>
    <input id="email" name="email" type="email">
  `);

  assert.deepEqual(result.violations, []);
});

test('reports axe violations through a platform-independent result', async () => {
  const result = await analyzeAccessibility('<button></button>');

  assert.ok(result.violations.some(({ id, source }) => id === 'button-name' && source === 'axe'));
});

test('reports duplicate IDs and unresolved relationships', async () => {
  const result = await analyzeAccessibility(`
    <button id="trigger" aria-controls="missing">Toggle</button>
    <div id="trigger">Panel</div>
  `);

  assert.ok(result.violations.some(({ id }) => id === 'cm-duplicate-id'));
  assert.ok(result.violations.some(({ id }) => id === 'cm-unresolved-id-reference'));
});

test('reports positive tabindex values', async () => {
  const result = await analyzeAccessibility('<button tabindex="2">Save</button>');

  assert.ok(result.violations.some(({ id }) => id === 'cm-positive-tabindex'));
});

test('throws a concise assertion error for adapter harnesses', async () => {
  await assert.rejects(
    assertNoAccessibilityViolations('<img src="avatar.png">', { label: 'Avatar default case' }),
    /Avatar default case has 1 accessibility violation.*image-alt/su,
  );
});
