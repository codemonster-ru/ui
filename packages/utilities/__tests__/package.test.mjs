import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

test('publishes one framework-independent CSS entry', async () => {
  assert.deepEqual(manifest.exports, { './utilities.css': './dist/utilities.css' });
  assert.deepEqual(manifest.sideEffects, ['./dist/*.css']);
  await access(new URL('../dist/utilities.css', import.meta.url));
});

test('keeps the scaffold free of framework and legacy ownership', async () => {
  const css = await readFile(new URL('../dist/utilities.css', import.meta.url), 'utf8');

  assert.match(css, /@layer cm-utilities/u);
  assert.doesNotMatch(css, /(?:vue|react|angular|--vf-|\.vf-)/iu);
});
