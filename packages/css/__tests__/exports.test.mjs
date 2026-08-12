import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const packageUrl = new URL('../package.json', import.meta.url);
const manifest = JSON.parse(await readFile(packageUrl, 'utf8'));

test('publishes only the approved CSS subpath exports', async () => {
  assert.deepEqual(manifest.exports, {
    './accordion.css': './dist/components/accordion.css',
    './button.css': './dist/components/button.css',
    './card.css': './dist/components/card.css',
    './field.css': './dist/components/field.css',
    './foundation.css': './dist/foundation.css',
    './input.css': './dist/components/input.css',
    './styles.css': './dist/styles.css',
  });

  for (const target of Object.values(manifest.exports)) {
    await access(new URL(`..${target.slice(1)}`, import.meta.url));
  }
});

test('marks only distributed CSS as side effects', () => {
  assert.deepEqual(manifest.sideEffects, ['./dist/*.css']);
  assert.equal(
    Object.keys(manifest.exports).some((name) => name.includes('foundation/')),
    false,
  );
  assert.equal(
    Object.keys(manifest.exports).some((name) => name.includes('primitives/')),
    false,
  );
});
