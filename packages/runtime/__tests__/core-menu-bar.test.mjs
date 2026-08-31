import assert from 'node:assert/strict';
import test from 'node:test';
import { menuBarKeyAction } from '../dist/core/index.js';

const bar = { isBranch: true, isOpen: false, isTopLevel: true };
const barLeaf = { isBranch: false, isOpen: false, isTopLevel: true };
const inside = { isBranch: false, isOpen: false, isTopLevel: false };
const insideBranch = { isBranch: true, isOpen: false, isTopLevel: false };

test('down opens a branch on the bar, and walks entries inside a submenu', () => {
  assert.deepEqual(menuBarKeyAction('ArrowDown', bar), { focus: 'first', type: 'open' });
  assert.deepEqual(menuBarKeyAction('ArrowDown', inside), { delta: 1, type: 'focus-sibling' });
});

test('up opens a branch at its last entry, and walks backwards inside', () => {
  assert.deepEqual(menuBarKeyAction('ArrowUp', bar), { focus: 'last', type: 'open' });
  assert.deepEqual(menuBarKeyAction('ArrowUp', inside), { delta: -1, type: 'focus-sibling' });
});

test('a leaf on the bar still walks rather than opening', () => {
  assert.deepEqual(menuBarKeyAction('ArrowDown', barLeaf), { delta: 1, type: 'focus-sibling' });
});

test('right moves along the bar, but opens a nested branch', () => {
  assert.deepEqual(menuBarKeyAction('ArrowRight', bar), { delta: 1, type: 'move-top-level' });
  assert.deepEqual(menuBarKeyAction('ArrowRight', insideBranch), { focus: 'first', type: 'open' });
  assert.deepEqual(menuBarKeyAction('ArrowRight', inside), { delta: 1, type: 'move-top-level' });
});

test('left moves back along the bar, but closes to the parent inside', () => {
  assert.deepEqual(menuBarKeyAction('ArrowLeft', bar), { delta: -1, type: 'move-top-level' });
  assert.deepEqual(menuBarKeyAction('ArrowLeft', inside), { type: 'close-to-parent' });
});

test('the horizontal arrows swap under rtl and the vertical ones do not', () => {
  const rtlBar = { ...bar, direction: 'rtl' };
  const rtlInside = { ...inside, direction: 'rtl' };
  assert.deepEqual(menuBarKeyAction('ArrowLeft', rtlBar), { delta: 1, type: 'move-top-level' });
  assert.deepEqual(menuBarKeyAction('ArrowRight', rtlInside), { type: 'close-to-parent' });
  assert.deepEqual(menuBarKeyAction('ArrowDown', rtlBar), { focus: 'first', type: 'open' });
});

test('enter and space open a closed branch and collapse an open one', () => {
  assert.deepEqual(menuBarKeyAction('Enter', bar), { focus: 'first', type: 'open' });
  assert.deepEqual(menuBarKeyAction(' ', { ...bar, isOpen: true }), { type: 'collapse' });
  assert.equal(menuBarKeyAction('Enter', barLeaf), null);
});

test('escape closes everything and home and end jump within the level', () => {
  assert.deepEqual(menuBarKeyAction('Escape', inside), { type: 'close-all' });
  assert.deepEqual(menuBarKeyAction('Home', inside), { edge: 'first', type: 'focus-edge' });
  assert.deepEqual(menuBarKeyAction('End', bar), { edge: 'last', type: 'focus-edge' });
});

test('keys the menu bar does not use are left alone', () => {
  assert.equal(menuBarKeyAction('a', bar), null);
  assert.equal(menuBarKeyAction('Tab', inside), null);
});
