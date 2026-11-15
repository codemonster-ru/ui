import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import test from 'node:test';

test('generates exact Vite aliases for each historical component subpath', async () => {
  const source = execFileSync(
    process.execPath,
    [resolve(import.meta.dirname, 'print-vueforge-component-aliases.mjs')],
    { encoding: 'utf8' },
  );
  const { default: aliases } = await import('data:text/javascript,' + encodeURIComponent(source));
  const matching = (path) => aliases.filter(({ find }) => find.test(path));
  assert.equal(aliases.length, 63);
  for (const { find, replacement } of aliases) {
    const legacy = find.source.slice(1, -1).replaceAll('\\/', '/');
    assert.equal(matching(legacy).length, 1);
    assert.equal(replacement.split('/').at(-1), legacy.split('/').at(-1));
  }
  for (const path of [
    '@codemonster-ru/vueforge-core',
    '@codemonster-ru/vueforge-layouts',
    '@codemonster-ru/vueforge-theme',
    '@codemonster-ru/vueforge-icons',
    '@codemonster-ru/vueforge-core/foundation',
    '@codemonster-ru/vueforge-core/theme',
    '@codemonster-ru/vueforge-core/button.css',
    '@codemonster-ru/vueforge-core/button/private',
    '@codemonster-ru/vueforge-layouts/container-extra',
  ]) {
    assert.deepEqual(matching(path), [], path);
  }
  assert.equal(
    matching('@codemonster-ru/vueforge-core/data-table')[0].replacement,
    '@codemonster-ru/ui-vue/historical/data-table',
  );
  assert.equal(
    matching('@codemonster-ru/vueforge-layouts/container')[0].replacement,
    '@codemonster-ru/ui-layouts/historical/container',
  );
});
