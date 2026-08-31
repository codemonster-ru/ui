import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ariaSortFor,
  clampPage,
  formatTemplate,
  nextSortState,
  resolveColumnChooserState,
  resolveSelectionState,
  resolveVisibleColumns,
  sortLabelFor,
  toggleAllColumns,
  toggleColumnVisibility,
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

const columns = ['name', 'owner', 'size', 'updated'];

test('a null request shows every column', () => {
  assert.deepEqual(resolveVisibleColumns(columns, null), columns);
});

test('required columns are shown whether or not they were requested', () => {
  assert.deepEqual(resolveVisibleColumns(columns, ['size'], ['name']), ['name', 'size']);
});

test('visible columns keep declaration order, not the order they were picked', () => {
  assert.deepEqual(resolveVisibleColumns(columns, ['updated', 'name']), ['name', 'updated']);
});

test('an unknown key is ignored', () => {
  assert.deepEqual(resolveVisibleColumns(columns, ['name', 'missing']), ['name']);
  assert.deepEqual(resolveVisibleColumns(columns, ['name'], ['missing']), ['name']);
});

test('toggling shows and hides one column', () => {
  assert.deepEqual(toggleColumnVisibility(columns, ['name'], 'size', true), ['name', 'size']);
  assert.deepEqual(toggleColumnVisibility(columns, ['name', 'size'], 'size', false), ['name']);
});

test('a required column cannot be hidden', () => {
  assert.deepEqual(toggleColumnVisibility(columns, ['name', 'size'], 'name', false, ['name']), ['name', 'size']);
});

test('toggling all keeps the required columns when clearing', () => {
  assert.deepEqual(toggleAllColumns(columns, true), columns);
  assert.deepEqual(toggleAllColumns(columns, false, ['name']), ['name']);
  assert.deepEqual(toggleAllColumns(columns, false), []);
});

test('the chooser reports all, partial, and none', () => {
  assert.deepEqual(resolveColumnChooserState(['owner', 'size'], ['owner', 'size']), { all: true, partial: false });
  assert.deepEqual(resolveColumnChooserState(['owner', 'size'], ['owner']), { all: false, partial: true });
  assert.deepEqual(resolveColumnChooserState(['owner', 'size'], []), { all: false, partial: false });
});

test('a chooser with nothing optional reads as fully shown, unlike row selection', () => {
  // resolveSelectionState answers false here: a table with no selectable rows offers an action
  // there is nothing to perform. A chooser with only required columns is genuinely all shown.
  assert.deepEqual(resolveColumnChooserState([], []), { all: true, partial: false });
  assert.deepEqual(resolveSelectionState([], []), { all: false, partial: false });
});
