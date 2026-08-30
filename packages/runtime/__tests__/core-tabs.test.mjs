import assert from 'node:assert/strict';
import test from 'node:test';
import { nextTabsValue, resolveTabsValue } from '../dist/core/index.js';

const items = [
  { value: 'overview' },
  { value: 'billing', disabled: true },
  { value: 'members' },
  { value: 'settings' },
];

test('prefers a requested value that names an enabled tab', () => {
  assert.equal(resolveTabsValue(items, 'members'), 'members');
});

test('falls back to the first enabled tab for a disabled or unknown request', () => {
  assert.equal(resolveTabsValue(items, 'billing'), 'overview');
  assert.equal(resolveTabsValue(items, 'missing'), 'overview');
  assert.equal(resolveTabsValue(items, null), 'overview');
});

test('reports no selection when every tab is disabled', () => {
  assert.equal(resolveTabsValue([{ value: 'only', disabled: true }], 'only'), null);
  assert.equal(resolveTabsValue([], null), null);
});

test('moves across enabled tabs and skips the disabled ones', () => {
  assert.equal(nextTabsValue(items, 'overview', 'ArrowRight'), 'members');
  assert.equal(nextTabsValue(items, 'members', 'ArrowLeft'), 'overview');
});

test('wraps around both ends', () => {
  assert.equal(nextTabsValue(items, 'settings', 'ArrowRight'), 'overview');
  assert.equal(nextTabsValue(items, 'overview', 'ArrowLeft'), 'settings');
});

test('swaps the arrow keys under rtl', () => {
  assert.equal(nextTabsValue(items, 'overview', 'ArrowLeft', 'rtl'), 'members');
  assert.equal(nextTabsValue(items, 'members', 'ArrowRight', 'rtl'), 'overview');
});

test('jumps to the first and last enabled tab', () => {
  assert.equal(nextTabsValue(items, 'members', 'Home'), 'overview');
  assert.equal(nextTabsValue(items, 'overview', 'End'), 'settings');
});

test('ignores keys that do not navigate', () => {
  assert.equal(nextTabsValue(items, 'overview', 'Enter'), null);
  assert.equal(nextTabsValue(items, 'overview', 'a'), null);
});

test('ignores navigation from a tab that is not enabled', () => {
  assert.equal(nextTabsValue(items, 'billing', 'ArrowRight'), null);
  assert.equal(nextTabsValue(items, 'missing', 'Home'), null);
});

test('stays put when one enabled tab remains', () => {
  const single = [{ value: 'only' }, { value: 'off', disabled: true }];
  assert.equal(nextTabsValue(single, 'only', 'ArrowRight'), 'only');
  assert.equal(nextTabsValue(single, 'only', 'ArrowLeft'), 'only');
});
