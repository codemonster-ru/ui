import assert from 'node:assert/strict';
import test from 'node:test';
import { selectClosedKeyAction, selectOpenKeyAction } from '../dist/core/index.js';

test('arrow up opens a closed select at its last option', () => {
  assert.deepEqual(selectClosedKeyAction('ArrowUp'), { focus: 'last', type: 'open' });
});

test('the other opening keys start from the current selection', () => {
  for (const key of ['ArrowDown', 'Enter', ' ']) {
    assert.deepEqual(selectClosedKeyAction(key), { focus: 'selected', type: 'open' });
  }
});

test('a closed select ignores everything else', () => {
  assert.equal(selectClosedKeyAction('Escape'), null);
  assert.equal(selectClosedKeyAction('a'), null);
});

test('escape closes an open select', () => {
  assert.deepEqual(selectOpenKeyAction('Escape', { activeIndex: 2, count: 4 }), { type: 'close' });
});

test('arrows wrap around the options', () => {
  assert.deepEqual(selectOpenKeyAction('ArrowDown', { activeIndex: 3, count: 4 }), { index: 0, type: 'focus' });
  assert.deepEqual(selectOpenKeyAction('ArrowUp', { activeIndex: 0, count: 4 }), { index: 3, type: 'focus' });
});

test('both arrows land on the first option when nothing is focused yet', () => {
  assert.deepEqual(selectOpenKeyAction('ArrowDown', { activeIndex: -1, count: 4 }), { index: 0, type: 'focus' });
  assert.deepEqual(selectOpenKeyAction('ArrowUp', { activeIndex: -1, count: 4 }), { index: 0, type: 'focus' });
});

test('home and end jump to the ends', () => {
  assert.deepEqual(selectOpenKeyAction('Home', { activeIndex: 2, count: 4 }), { index: 0, type: 'focus' });
  assert.deepEqual(selectOpenKeyAction('End', { activeIndex: 2, count: 4 }), { index: 3, type: 'focus' });
});

test('enter and space commit the focused option only', () => {
  assert.deepEqual(selectOpenKeyAction('Enter', { activeIndex: 1, count: 4 }), { index: 1, type: 'commit' });
  assert.deepEqual(selectOpenKeyAction(' ', { activeIndex: 1, count: 4 }), { index: 1, type: 'commit' });
  assert.equal(selectOpenKeyAction('Enter', { activeIndex: -1, count: 4 }), null);
});

test('an empty listbox still closes but never navigates', () => {
  assert.deepEqual(selectOpenKeyAction('Escape', { activeIndex: -1, count: 0 }), { type: 'close' });
  assert.equal(selectOpenKeyAction('ArrowDown', { activeIndex: -1, count: 0 }), null);
  assert.equal(selectOpenKeyAction('Home', { activeIndex: -1, count: 0 }), null);
});
