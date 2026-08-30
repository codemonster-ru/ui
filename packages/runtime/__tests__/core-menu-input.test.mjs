import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isInputClearVisible,
  isMenuCloseKey,
  menuTabStopId,
  nextMenuItem,
  resolveInputClearable,
  resolvePasswordReveal,
} from '../dist/core/index.js';

const items = [{ id: 'open', disabled: true }, { id: 'rename' }, { id: 'duplicate' }, { id: 'delete' }];

test('moves through enabled menu items and skips the disabled ones', () => {
  assert.equal(nextMenuItem(items, 'rename', 'ArrowDown'), 'duplicate');
  assert.equal(nextMenuItem(items, 'rename', 'ArrowUp'), 'delete');
  assert.equal(nextMenuItem(items, 'delete', 'ArrowDown'), 'rename');
});

test('jumps to the first and last enabled menu item', () => {
  assert.equal(nextMenuItem(items, 'delete', 'Home'), 'rename');
  assert.equal(nextMenuItem(items, 'rename', 'End'), 'delete');
});

test('ignores keys that do not navigate a menu', () => {
  assert.equal(nextMenuItem(items, 'rename', 'ArrowRight'), null);
  assert.equal(nextMenuItem(items, 'open', 'ArrowDown'), null);
});

test('a menu is one tab stop, carried by its first enabled item', () => {
  assert.equal(menuTabStopId(items), 'rename');
  assert.equal(menuTabStopId([{ id: 'only', disabled: true }]), null);
  assert.equal(menuTabStopId([]), null);
});

test('escape asks the menu owner to close', () => {
  assert.equal(isMenuCloseKey('Escape'), true);
  assert.equal(isMenuCloseKey('Enter'), false);
});

test('the password reveal names the action it performs', () => {
  const labels = { hide: 'Hide password', show: 'Show password' };
  assert.deepEqual(resolvePasswordReveal(false, labels), {
    ariaPressed: false,
    label: 'Show password',
    type: 'password',
  });
  assert.deepEqual(resolvePasswordReveal(true, labels), {
    ariaPressed: true,
    label: 'Hide password',
    type: 'text',
  });
});

test('a disabled or read-only field does not offer to clear itself', () => {
  assert.equal(resolveInputClearable({ clearable: true }), true);
  assert.equal(resolveInputClearable({ clearable: true, disabled: true }), false);
  assert.equal(resolveInputClearable({ clearable: true, readonly: true }), false);
  assert.equal(resolveInputClearable({ clearable: false }), false);
});

test('the clear button appears only once there is something to clear', () => {
  assert.equal(isInputClearVisible(true, 'draft'), true);
  assert.equal(isInputClearVisible(true, ''), false);
  assert.equal(isInputClearVisible(false, 'draft'), false);
});
