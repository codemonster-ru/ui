import assert from 'node:assert/strict';
import test from 'node:test';
import {
  collectAncestorValues,
  collectBranchValues,
  expandToActive,
  findSiblings,
  isBranch,
  toggleBranchValue,
} from '../dist/core/index.js';

const tree = [
  { value: 'dashboard' },
  {
    value: 'projects',
    children: [{ value: 'active' }, { value: 'archived', children: [{ value: 'archived-2024' }] }],
  },
  { value: 'settings', children: [{ value: 'members' }] },
];

test('a branch is an item with children', () => {
  assert.equal(isBranch({ value: 'projects', children: [{ value: 'active' }] }), true);
  assert.equal(isBranch({ value: 'dashboard' }), false);
  assert.equal(isBranch({ value: 'empty', children: [] }), false);
});

test('ancestors are the branches that must be open, nearest last', () => {
  assert.deepEqual(collectAncestorValues(tree, 'archived-2024'), ['projects', 'archived']);
  assert.deepEqual(collectAncestorValues(tree, 'active'), ['projects']);
});

test('a top-level item and an absent one have no ancestors', () => {
  assert.deepEqual(collectAncestorValues(tree, 'dashboard'), []);
  assert.deepEqual(collectAncestorValues(tree, 'missing'), []);
  assert.deepEqual(collectAncestorValues(tree, null), []);
});

test('a subtree reports every value inside it', () => {
  assert.deepEqual(collectBranchValues([tree[1]]), ['projects', 'active', 'archived', 'archived-2024']);
});

test('siblings are the items alongside a value at its own level', () => {
  assert.deepEqual(
    findSiblings(tree, 'archived').map(({ value }) => value),
    ['active', 'archived'],
  );
  assert.deepEqual(
    findSiblings(tree, 'settings').map(({ value }) => value),
    ['dashboard', 'projects', 'settings'],
  );
  assert.deepEqual(findSiblings(tree, 'missing'), []);
});

test('multiple mode lets branches accumulate', () => {
  assert.deepEqual(toggleBranchValue(tree, ['projects'], 'settings'), ['projects', 'settings']);
});

test('single mode closes the siblings and everything inside them', () => {
  // Opening settings closes projects, and archived goes with it because it lives inside projects.
  assert.deepEqual(toggleBranchValue(tree, ['projects', 'archived'], 'settings', 'single'), ['settings']);
});

test('single mode still closes a branch that was already open', () => {
  // active is open, so this closes it; the mode only decides what else closes when opening.
  assert.deepEqual(toggleBranchValue(tree, ['active', 'archived'], 'active', 'single'), ['archived']);
});

test('closing a branch leaves its children alone, so reopening returns where it was', () => {
  assert.deepEqual(toggleBranchValue(tree, ['projects', 'archived'], 'projects'), ['archived']);
});

test('expanding to the active item opens the path without closing anything', () => {
  assert.deepEqual(expandToActive(tree, ['settings'], 'archived-2024'), ['settings', 'projects', 'archived']);
  assert.deepEqual(expandToActive(tree, ['projects'], 'active'), ['projects']);
  assert.deepEqual(expandToActive(tree, [], null), []);
});
