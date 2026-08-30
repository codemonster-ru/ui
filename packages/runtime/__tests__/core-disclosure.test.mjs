import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmFocusableSelector,
  dropdownKeyAction,
  popoverKeyAction,
  resolveDisclosureOpen,
  resolveTooltipDelay,
} from '../dist/core/index.js';

test('a disabled disclosure cannot be opened', () => {
  assert.equal(resolveDisclosureOpen(true, true), false);
  assert.equal(resolveDisclosureOpen(true, false), true);
  assert.equal(resolveDisclosureOpen(false, false), false);
});

test('the focusable selector covers every control a panel can open onto', () => {
  for (const fragment of ['a[href]', 'button', 'input', 'select', 'textarea', 'tabindex']) {
    assert.equal(cmFocusableSelector.includes(fragment), true, `selector is missing ${fragment}`);
  }
});

test('escape closes a popover and returns focus to the trigger', () => {
  assert.deepEqual(popoverKeyAction('Escape', { open: true }), { restoreFocus: true, type: 'close' });
  assert.equal(popoverKeyAction('Escape', { open: false }), null);
});

test('arrow down opens a popover from its trigger only', () => {
  assert.deepEqual(popoverKeyAction('ArrowDown', { onTrigger: true, open: false }), {
    focus: 'first',
    type: 'open',
  });
  assert.equal(popoverKeyAction('ArrowDown', { onTrigger: false, open: false }), null);
  assert.equal(popoverKeyAction('ArrowDown', { disabled: true, onTrigger: true, open: false }), null);
});

test('a dropdown opens at the end the key implies', () => {
  assert.deepEqual(dropdownKeyAction('ArrowUp', { onTrigger: true, open: false }), {
    focus: 'last',
    type: 'open',
  });
  for (const key of ['ArrowDown', 'Enter', ' ']) {
    assert.deepEqual(dropdownKeyAction(key, { onTrigger: true, open: false }), {
      focus: 'first',
      type: 'open',
    });
  }
});

test('a dropdown ignores keys away from its trigger and while disabled', () => {
  assert.equal(dropdownKeyAction('ArrowDown', { onTrigger: false, open: false }), null);
  assert.equal(dropdownKeyAction('ArrowDown', { disabled: true, onTrigger: true, open: false }), null);
  assert.equal(dropdownKeyAction('a', { onTrigger: true, open: false }), null);
});

test('tooltip delays are named once', () => {
  assert.equal(resolveTooltipDelay('none'), 0);
  assert.equal(resolveTooltipDelay('short'), 300);
  assert.equal(resolveTooltipDelay('long'), 700);
});
