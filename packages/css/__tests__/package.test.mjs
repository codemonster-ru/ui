import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

test('publishes a non-empty framework-independent CSS entry', async () => {
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');

  assert.ok(css.trim().length > 0);
  assert.doesNotMatch(css, /(?:vue|react|angular|--vf-|\.vf-)/i);
});
