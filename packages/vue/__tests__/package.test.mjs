import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes an SSR-safe empty Vue adapter entry', async () => {
  const entry = await import('../dist/index.js');

  assert.deepEqual(Object.keys(entry), []);
});
