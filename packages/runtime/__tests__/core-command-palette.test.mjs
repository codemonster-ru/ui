import assert from 'node:assert/strict';
import test from 'node:test';
import { commandPaletteKeyAction, filterCommands, normalizeCommandQuery } from '../dist/core/index.js';

const commands = [
  { id: 'open', label: 'Open file' },
  { id: 'save', label: 'Save', keywords: 'write persist' },
  { id: 'quit', label: 'Quit' },
];

test('an empty query keeps every command', () => {
  assert.equal(filterCommands(commands, '').length, 3);
  assert.equal(filterCommands(commands, '   ').length, 3);
});

test('a command is findable by a keyword it never displays', () => {
  assert.deepEqual(
    filterCommands(commands, 'persist').map(({ id }) => id),
    ['save'],
  );
});

test('matching ignores case and surrounding whitespace', () => {
  assert.equal(normalizeCommandQuery('  OPEN  '), 'open');
  assert.deepEqual(
    filterCommands(commands, '  OPEN  ').map(({ id }) => id),
    ['open'],
  );
});

test('enter commits only when a command is active', () => {
  assert.deepEqual(commandPaletteKeyAction('Enter', { activeIndex: 1, count: 3 }), { type: 'commit' });
  assert.equal(commandPaletteKeyAction('Enter', { activeIndex: -1, count: 3 }), null);
});

test('arrow down starts at the first command and wraps', () => {
  assert.deepEqual(commandPaletteKeyAction('ArrowDown', { activeIndex: -1, count: 3 }), {
    index: 0,
    type: 'activate',
  });
  assert.deepEqual(commandPaletteKeyAction('ArrowDown', { activeIndex: 2, count: 3 }), {
    index: 0,
    type: 'activate',
  });
});

test('arrow up reaches the last command from nothing active or from the first', () => {
  assert.deepEqual(commandPaletteKeyAction('ArrowUp', { activeIndex: -1, count: 3 }), {
    index: 2,
    type: 'activate',
  });
  assert.deepEqual(commandPaletteKeyAction('ArrowUp', { activeIndex: 0, count: 3 }), {
    index: 2,
    type: 'activate',
  });
  assert.deepEqual(commandPaletteKeyAction('ArrowUp', { activeIndex: 2, count: 3 }), {
    index: 1,
    type: 'activate',
  });
});

test('home and end jump to the ends', () => {
  assert.deepEqual(commandPaletteKeyAction('Home', { activeIndex: 2, count: 3 }), { index: 0, type: 'activate' });
  assert.deepEqual(commandPaletteKeyAction('End', { activeIndex: 0, count: 3 }), { index: 2, type: 'activate' });
});

test('an empty list never activates anything', () => {
  assert.equal(commandPaletteKeyAction('ArrowDown', { activeIndex: -1, count: 0 }), null);
  assert.equal(commandPaletteKeyAction('a', { activeIndex: 0, count: 3 }), null);
});
