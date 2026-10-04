// The VfFieldset catalog cannot quietly shrink, and padding cannot hide it.
//
// The attacks are the ones that would leave a plausible port green: removing
// the JavaScript truthiness edges, the slot precedence and fallback cases, the
// relationship cases and the two-instance case, then padding the catalog back
// over its floor with composed fieldsets that exercise everything at once and
// prove nothing about when each part appears.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { staticOwnershipViolations, STATIC_SNAPSHOT_FIELDS } from '../parity/extract.mjs';
import { profiles } from '../parity/profiles.mjs';
import { fieldsetCoverageViolations } from './fieldset-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 30;

function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `fieldset/padding-${index}`,
    title: `padding ${index}`,
    props: { label: 'Plan', description: 'D', error: 'E' },
    attrs: {},
    content: { body: { text: 'Body' } },
    visual: false,
  }));
}

function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);
  return remaining;
}

const expectViolation = (violations, fragment) =>
  assert.ok(
    violations.some((violation) => violation.includes(fragment)),
    `the fieldset guard did not report "${fragment}": ${violations.join('; ')}`,
  );

test('the shipped fieldset catalog is fully covered', () => {
  assert.deepEqual(fieldsetCoverageViolations(load('fieldset')), []);
});

test('the fieldset catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('fieldset').length >= FLOOR, 'the fieldset catalog shrank');
});

test('every fieldset case id is unique and namespaced', () => {
  const ids = load('fieldset').map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('fieldset/')));
});

test('dropping the truthiness and slot-fallback cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(
    load('fieldset'),
    (entry) =>
      Object.values(entry.props ?? {}).some((value) => value === '' || value === '0') ||
      Object.values(entry.content ?? {}).some((slot) => slot.text === ''),
    'proves "" or "0" or an empty slot',
  );
  const padded = [...eroded, ...padding(20)];
  assert.ok(padded.length >= FLOOR);
  const violations = fieldsetCoverageViolations(padded);
  expectViolation(violations, 'label "0"');
  expectViolation(violations, 'empty label slot over a label prop');
  expectViolation(violations, 'empty error slot alone');
});

test('dropping the relationship cases fails semantically', () => {
  const eroded = dropAll(
    load('fieldset'),
    (entry) => entry.attrs?.['aria-describedby'] !== undefined || Array.isArray(entry.group),
    'forwards aria-describedby or renders two instances',
  );
  const violations = fieldsetCoverageViolations([...eroded, ...padding(10)]);
  expectViolation(violations, 'replaces it');
  expectViolation(violations, 'cross-wired ids would pass');
});

test('dropping the native-attribute and group-box cases fails semantically', () => {
  const eroded = dropAll(
    load('fieldset'),
    (entry) =>
      entry.attrs?.disabled !== undefined ||
      entry.attrs?.form !== undefined ||
      // Every case with the group box shape - a label around plain content and
      // nothing else - not only the one named for it.
      (Object.keys(entry.props ?? {}).join() === 'label' &&
        Object.keys(entry.content ?? {}).join() === 'body' &&
        typeof entry.content.body.text === 'string' &&
        Object.keys(entry.attrs ?? {}).length === 0),
    'proves native attributes or the group box shape',
  );
  const violations = fieldsetCoverageViolations([...eroded, ...padding(10)]);
  expectViolation(violations, 'disables the fieldset natively');
  expectViolation(violations, 'form and name');
  expectViolation(violations, 'group box shape');
});

test('a consumerInteractive budget that disagrees with the rendered controls is rejected', () => {
  const lying = load('fieldset').map((entry) =>
    entry.id === 'fieldset/full' ? { ...entry, consumerInteractive: 3 } : entry,
  );
  expectViolation(fieldsetCoverageViolations(lying), 'fieldset/full renders 2 consumer control(s)');
});

test('a fieldset catalog that grew a slot the component does not have is rejected', () => {
  const grown = [...load('fieldset'), { id: 'fieldset/hint', props: {}, attrs: {}, content: { hint: { text: 'x' } } }];
  expectViolation(fieldsetCoverageViolations(grown), '[hint]');
});

test('the group box catalog cannot satisfy the fieldset rules', () => {
  const violations = fieldsetCoverageViolations(load('group-box'));
  assert.ok(violations.some((violation) => violation.includes('no shared fieldset case')));
});

// ------------------------------------------------------------ static ownership

const snapshot = (overrides = {}) => ({
  interactionPosture: 'none',
  caseRendered: true,
  focusableCount: 0,
  interactiveRoleCount: 0,
  focusRole: 'outside-case',
  ...overrides,
});

test('the fieldset profile is static and owns no control', () => {
  assert.equal(profiles.fieldset.snapshot, 'static');
  assert.equal(profiles.fieldset.staticOwnership, true);
  assert.equal(profiles.fieldset.controlOwnership, undefined);
  assert.deepEqual(Object.keys(snapshot()).sort(), [...STATIC_SNAPSHOT_FIELDS].sort());
});

test('every shipped fieldset case passes when its declared consumer controls are the only focusable elements', () => {
  for (const parityCase of load('fieldset')) {
    assert.deepEqual(
      staticOwnershipViolations(parityCase, snapshot({ focusableCount: parityCase.consumerInteractive ?? 0 })),
      [],
      parityCase.id,
    );
  }
});

test('a control the fieldset grew beside the consumer controls fails even when every target grows it', () => {
  for (const parityCase of load('fieldset')) {
    const grown = snapshot({ focusableCount: (parityCase.consumerInteractive ?? 0) + 1 });
    assert.ok(staticOwnershipViolations(parityCase, grown).length > 0, parityCase.id);
  }
});
