import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { resolveContainedPath, resolveVirtualFilePath } from './documentation-example-paths.mjs';

const fixtureDirectory = path.resolve('/tmp/vueforge-documentation-fixture');

test('resolves documentation files inside their fixture', () => {
  assert.equal(
    resolveVirtualFilePath(fixtureDirectory, '/src/App.vue'),
    path.join(fixtureDirectory, 'src/App.vue'),
  );
  assert.equal(
    resolveContainedPath(path.join(fixtureDirectory, 'src'), './Example.vue'),
    path.join(fixtureDirectory, 'src/Example.vue'),
  );
});

test('rejects paths that escape a documentation fixture', () => {
  for (const candidate of ['/../../outside.vue', '/../outside.vue']) {
    assert.throws(() => resolveVirtualFilePath(fixtureDirectory, candidate), /escapes its fixture/u);
  }

  for (const candidate of ['../../outside.vue', '../outside.vue', '/outside.vue']) {
    assert.throws(() => resolveContainedPath(fixtureDirectory, candidate), /escapes its fixture/u);
  }
});

test('rejects ambiguous cross-platform path syntax', () => {
  assert.throws(
    () => resolveVirtualFilePath(fixtureDirectory, '/..\\..\\outside.vue'),
    /Unsafe documentation example path/u,
  );
  assert.throws(
    () => resolveVirtualFilePath(fixtureDirectory, '//server/share.vue'),
    /Invalid documentation virtual file path/u,
  );
});
