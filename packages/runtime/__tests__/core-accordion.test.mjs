import assert from 'node:assert/strict';
import test from 'node:test';
import {
  nextAccordionItem,
  nextRovingIndex,
  resolveAccordionOpenItems,
  toggleAccordionItem,
} from '../dist/core/index.js';

const items = [{ id: 'plan' }, { id: 'billing', disabled: true }, { id: 'team' }, { id: 'limits' }];

test('keeps only known, enabled sections and preserves item order', () => {
  assert.deepEqual(resolveAccordionOpenItems(items, ['limits', 'plan', 'missing'], true), ['plan', 'limits']);
});

test('never opens a disabled section', () => {
  assert.deepEqual(resolveAccordionOpenItems(items, ['billing'], true), []);
});

test('caps a single-open accordion at one section', () => {
  assert.deepEqual(resolveAccordionOpenItems(items, ['team', 'limits'], false), ['team']);
});

test('opening replaces the set when only one may be open', () => {
  assert.deepEqual(toggleAccordionItem(items, ['plan'], 'team', false), ['team']);
});

test('opening adds to the set when several may be open', () => {
  assert.deepEqual(toggleAccordionItem(items, ['plan'], 'team', true), ['plan', 'team']);
});

test('toggling an open section closes it', () => {
  assert.deepEqual(toggleAccordionItem(items, ['plan', 'team'], 'plan', true), ['team']);
  assert.deepEqual(toggleAccordionItem(items, ['team'], 'team', false), []);
});

test('a disabled or unknown section leaves the set untouched', () => {
  assert.deepEqual(toggleAccordionItem(items, ['plan'], 'billing', true), ['plan']);
  assert.deepEqual(toggleAccordionItem(items, ['plan'], 'missing', true), ['plan']);
});

test('moves focus vertically and skips disabled sections', () => {
  assert.equal(nextAccordionItem(items, 'plan', 'ArrowDown'), 'team');
  assert.equal(nextAccordionItem(items, 'team', 'ArrowUp'), 'plan');
});

test('wraps around and jumps to the ends', () => {
  assert.equal(nextAccordionItem(items, 'limits', 'ArrowDown'), 'plan');
  assert.equal(nextAccordionItem(items, 'plan', 'ArrowUp'), 'limits');
  assert.equal(nextAccordionItem(items, 'team', 'Home'), 'plan');
  assert.equal(nextAccordionItem(items, 'plan', 'End'), 'limits');
});

test('ignores horizontal arrows and non-navigation keys', () => {
  assert.equal(nextAccordionItem(items, 'plan', 'ArrowRight'), null);
  assert.equal(nextAccordionItem(items, 'plan', 'Enter'), null);
  assert.equal(nextAccordionItem(items, 'billing', 'ArrowDown'), null);
});

test('the roving primitive reports no move when nothing can be focused', () => {
  assert.equal(nextRovingIndex({ count: 0, current: 0, key: 'Home' }), null);
  assert.equal(nextRovingIndex({ count: 3, current: -1, key: 'Home' }), null);
  assert.equal(nextRovingIndex({ count: 3, current: 5, key: 'Home' }), null);
});

test('the roving primitive swaps horizontal arrows under rtl only', () => {
  assert.equal(nextRovingIndex({ count: 3, current: 0, direction: 'rtl', key: 'ArrowLeft' }), 1);
  assert.equal(
    nextRovingIndex({ count: 3, current: 0, direction: 'rtl', key: 'ArrowDown', orientation: 'vertical' }),
    1,
  );
});
