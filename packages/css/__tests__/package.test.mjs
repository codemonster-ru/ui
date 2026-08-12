import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

test('publishes a non-empty framework-independent CSS entry', async () => {
  const css = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');

  assert.ok(css.trim().length > 0);
  assert.doesNotMatch(css, /(?:vue|react|angular|--vf-|\.vf-)/i);
});

test('separates foundation-only and complete stylesheet compositions', async () => {
  const foundationCss = await readFile(new URL('../dist/foundation.css', import.meta.url), 'utf8');
  const stylesCss = await readFile(new URL('../dist/styles.css', import.meta.url), 'utf8');

  assert.match(foundationCss, /@import '\.\/foundation\/reset\.css';/);
  assert.match(foundationCss, /@import '\.\/foundation\/preferences\.css';/);
  assert.doesNotMatch(foundationCss, /primitives|components/);
  assert.match(stylesCss, /^@import '\.\/foundation\.css';/);
  assert.match(stylesCss, /@import '\.\/primitives\/control\.css';/);
  assert.match(stylesCss, /@import '\.\/primitives\/surface\.css';/);
  assert.match(stylesCss, /@import '\.\/components\/button\.css';/);
});
