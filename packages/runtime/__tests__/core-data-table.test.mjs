import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ariaSortFor,
  clampPage,
  formatTemplate,
  nextSortState,
  resolveSelectionState,
  sortLabelFor,
  toggleAllSelection,
} from '../dist/core/index.js';

test('one column cycles ascending, descending, unsorted', () => {
  assert.deepEqual(nextSortState(null, 'name'), { direction: 'ascending', key: 'name' });
  assert.deepEqual(nextSortState({ direction: 'ascending', key: 'name' }, 'name'), {
    direction: 'descending',
    key: 'name',
  });
  assert.equal(nextSortState({ direction: 'descending', key: 'name' }, 'name'), null);
});

test('moving to another column starts that column at ascending', () => {
  assert.deepEqual(nextSortState({ direction: 'descending', key: 'name' }, 'size'), {
    direction: 'ascending',
    key: 'size',
  });
});

test('the sort label names what activating the header will do next', () => {
  assert.equal(sortLabelFor(null, 'name'), 'ascending');
  assert.equal(sortLabelFor({ direction: 'ascending', key: 'name' }, 'name'), 'descending');
  assert.equal(sortLabelFor({ direction: 'descending', key: 'name' }, 'name'), 'clear');
  assert.equal(sortLabelFor({ direction: 'descending', key: 'other' }, 'name'), 'ascending');
});

test('aria-sort reports only the sorted column', () => {
  assert.equal(ariaSortFor({ direction: 'descending', key: 'name' }, 'name'), 'descending');
  assert.equal(ariaSortFor({ direction: 'descending', key: 'name' }, 'size'), 'none');
  assert.equal(ariaSortFor(null, 'name'), 'none');
});

test('templates substitute every occurrence and tolerate a missing placeholder', () => {
  assert.equal(formatTemplate('Sort {column} ascending', { column: 'Name' }), 'Sort Name ascending');
  assert.equal(formatTemplate('{a} and {a}', { a: 1 }), '1 and 1');
  assert.equal(formatTemplate('No placeholder', { column: 'Name' }), 'No placeholder');
});

test('select-all is checked only when every selectable row is selected', () => {
  assert.deepEqual(resolveSelectionState(['a', 'b'], ['a', 'b']), { all: true, partial: false });
  assert.deepEqual(resolveSelectionState(['a', 'b'], ['a']), { all: false, partial: true });
  assert.deepEqual(resolveSelectionState(['a', 'b'], []), { all: false, partial: false });
});

test('a table with nothing selectable is neither checked nor indeterminate', () => {
  assert.deepEqual(resolveSelectionState([], []), { all: false, partial: false });
  assert.deepEqual(resolveSelectionState([], ['a']), { all: false, partial: false });
});

test('toggling all keeps the rendered row order and leaves locked rows alone', () => {
  assert.deepEqual(toggleAllSelection(['a', 'b', 'c'], ['a', 'c'], ['c'], true), ['a', 'c']);
  assert.deepEqual(toggleAllSelection(['a', 'b', 'c'], ['a', 'c'], ['a', 'b', 'c'], false), ['b']);
});

test('a requested page is clamped into the pages that exist', () => {
  assert.equal(clampPage(0, 5), 1);
  assert.equal(clampPage(9, 5), 5);
  assert.equal(clampPage(3, 5), 3);
  assert.equal(clampPage(2, 0), 1);
});
