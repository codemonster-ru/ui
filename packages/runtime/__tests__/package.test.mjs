import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes an empty framework-independent ESM scaffold', async () => {
  const entry = await import('../dist/index.js');

  assert.deepEqual(Object.keys(entry), []);
});
