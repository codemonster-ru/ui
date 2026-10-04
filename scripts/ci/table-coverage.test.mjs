// The VfTable catalog cannot quietly shrink, and padding cannot hide it.
//
// The attacks remove what a plausible port would get wrong - the single and
// paired row-group cases, the empty-slot case, the caption edges and the cases
// that put attributes on the wrapper - and pad back with fully composed tables
// that open every row group at once.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { staticOwnershipViolations } from '../parity/extract.mjs';
import { profiles } from '../parity/profiles.mjs';
import { tableCoverageViolations } from './table-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 25;

function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `table/padding-${index}`,
    title: `padding ${index}`,
    props: { caption: 'Members' },
    attrs: {},
    content: { header: { rows: 1 }, body: { rows: 3 }, footer: { rows: 1 } },
    visual: false,
  }));
}

function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);
  return remaining;
}

const sectionCount = (entry) =>
  ['header', 'body', 'footer'].filter((name) => entry.content?.[name] !== undefined).length;
const expectViolation = (violations, fragment) =>
  assert.ok(
    violations.some((violation) => violation.includes(fragment)),
    `the table guard did not report "${fragment}": ${violations.join('; ')}`,
  );

test('the shipped table catalog is fully covered', () => {
  assert.deepEqual(tableCoverageViolations(load('table')), []);
});

test('the table catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('table').length >= FLOOR, 'the table catalog shrank');
});

test('every table case id is unique and namespaced', () => {
  const ids = load('table').map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('table/')));
});

test('dropping the partial row-group cases fails semantically while composed tables keep the count up', () => {
  const eroded = dropAll(
    load('table'),
    (entry) => sectionCount(entry) === 1 || sectionCount(entry) === 2,
    'opens one or two row groups',
  );
  const padded = [...eroded, ...padding(20)];
  assert.ok(padded.length >= FLOOR);
  const violations = tableCoverageViolations(padded);
  expectViolation(violations, 'opens head and foot without a body');
  expectViolation(violations, 'opens the footer slot alone');
});

test('dropping the empty-slot and caption-edge cases fails semantically', () => {
  const eroded = dropAll(
    load('table'),
    (entry) =>
      Object.values(entry.content ?? {}).some((slot) => slot.rows === 0 || slot.text === '') ||
      entry.props?.caption === '' ||
      entry.props?.caption === '0',
    'proves an empty slot or a caption edge',
  );
  const violations = tableCoverageViolations([...eroded, ...padding(10)]);
  expectViolation(violations, 'keying row groups on content would pass');
  expectViolation(violations, 'caption "0"');
  expectViolation(violations, 'empty caption slot over the prop');
});

test('dropping the cases that put attributes on the wrapper fails semantically', () => {
  const eroded = dropAll(
    load('table'),
    (entry) => Object.keys(entry.attrs ?? {}).length > 0,
    'forwards a consumer attribute',
  );
  const violations = tableCoverageViolations([...eroded, ...padding(10)]);
  expectViolation(violations, 'consumer class, style, id and data attribute');
  expectViolation(violations, 'role, accessible name and tabindex');
});

test('a consumerInteractive budget that disagrees with the rendered focusable elements is rejected', () => {
  const lying = load('table').map((entry) =>
    entry.id === 'table/consumer-aria' ? { ...entry, consumerInteractive: 0 } : entry,
  );
  expectViolation(tableCoverageViolations(lying), 'table/consumer-aria renders 1 consumer focusable element(s)');
});

test('a table catalog that grew a slot the component does not have is rejected', () => {
  const grown = [...load('table'), { id: 'table/colgroup', props: {}, attrs: {}, content: { colgroup: { rows: 1 } } }];
  expectViolation(tableCoverageViolations(grown), '[colgroup]');
});

test('the card catalog cannot satisfy the table rules', () => {
  assert.ok(tableCoverageViolations(load('card')).some((violation) => violation.includes('no shared table case')));
});

const snapshot = (focusableCount) => ({
  interactionPosture: 'none',
  caseRendered: true,
  focusableCount,
  interactiveRoleCount: 0,
  focusRole: 'outside-case',
});

test('the table profile is static and owns no control', () => {
  assert.equal(profiles.table.snapshot, 'static');
  assert.equal(profiles.table.staticOwnership, true);
  assert.equal(profiles.table.controlOwnership, undefined);
});

test('every shipped table case passes with its declared budget, and fails with one more focusable element', () => {
  for (const parityCase of load('table')) {
    const declared = parityCase.consumerInteractive ?? 0;
    assert.deepEqual(staticOwnershipViolations(parityCase, snapshot(declared)), [], parityCase.id);
    assert.ok(staticOwnershipViolations(parityCase, snapshot(declared + 1)).length > 0, parityCase.id);
  }
});
