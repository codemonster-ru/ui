import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

test('contains custom thumb content without changing switch geometry', async () => {
  const css = await readFile(new URL('../src/components/switch.css', import.meta.url), 'utf8');
  const thumbRule = css.match(/\.cm-switch__thumb\s*\{(?<declarations>[^}]*)\}/u)?.groups?.declarations;

  assert.ok(thumbRule);
  assert.match(thumbRule, /display: inline-flex;/u);
  assert.match(thumbRule, /align-items: center;/u);
  assert.match(thumbRule, /justify-content: center;/u);
  assert.match(thumbRule, /overflow: hidden;/u);
});
