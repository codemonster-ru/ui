import assert from 'node:assert/strict';
import test from 'node:test';

test('publishes the Vue component adapter entries', async () => {
  const entry = await import('../dist/index.js');

  assert.deepEqual(Object.keys(entry), ['CmButton', 'CmCard', 'CmField', 'CmInput']);
  assert.equal(entry.CmButton.__name, 'CmButton');
  assert.equal(entry.CmCard.__name, 'CmCard');
  assert.equal(entry.CmField.__name, 'CmField');
  assert.equal(entry.CmInput.__name, 'CmInput');
});
