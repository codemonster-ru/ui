import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes the Vue Button adapter entry', async () => {
  const entry = await import('../dist/index.js');

  assert.deepEqual(Object.keys(entry), ['CmButton']);
  assert.equal(entry.CmButton.__name, 'CmButton');
});
