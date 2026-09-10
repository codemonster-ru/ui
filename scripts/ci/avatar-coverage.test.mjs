// The VfAvatar catalog cannot quietly shrink, and padding cannot hide it.
//
// The mandatory attack for this component is removing an entire fallback branch
// and padding the count back with cases from another branch. That is the
// realistic erosion: someone deletes the icon cases because "the icon path is
// covered by VfIconButton", the count stays healthy, and the branch nothing
// exercises is the one a reordering breaks.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { avatarCoverageViolations, branchOf, FALLBACK_BRANCHES } from './avatar-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 31;

/** Cases that satisfy nothing: a plain label avatar with no consumer attribute. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `avatar/padding-${index}`,
    title: `padding ${index}`,
    props: { label: 'MC' },
    attrs: {},
    visual: false,
  }));
}

function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return remaining;
}

test('the shipped avatar catalog is fully covered', () => {
  assert.deepEqual(avatarCoverageViolations(load('avatar')), []);
});

test('the avatar catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('avatar').length >= FLOOR, 'the avatar catalog shrank');
});

test('every avatar case id is unique and namespaced', () => {
  const ids = load('avatar').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('avatar/')));
});

test('the shipped catalog reaches every branch of the fallback chain', () => {
  const reached = new Set(load('avatar').map(branchOf));

  assert.deepEqual([...reached].sort(), [...FALLBACK_BRANCHES].sort());
});

// The mandatory padding attack: remove one entire fallback branch.
test('dropping the whole icon branch fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(load('avatar'), (entry) => entry.props?.icon !== undefined, 'mentions an icon');
  const padded = [...eroded, ...padding(12)];

  assert.ok(padded.length >= FLOOR, 'the padding attack must keep the count floor satisfied');
  const violations = avatarCoverageViolations(padded);
  assert.ok(
    violations.some((violation) => violation.includes('renders the icon branch')),
    `the avatar guard did not notice that a whole branch is gone: ${violations.join('; ')}`,
  );
});

// Padding with cases from a *different* branch is the subtler version of the
// same attack: the branch counts stay non-zero, so only the pair rules notice.
test('dropping the ordering evidence while keeping every branch present still fails', () => {
  const eroded = dropAll(
    load('avatar'),
    (entry) =>
      [entry.props?.image, entry.props?.label, entry.props?.icon].filter((value) => value !== undefined && value !== '')
        .length > 1,
    'holds two competing channels at once',
  );

  const violations = avatarCoverageViolations(eroded);
  assert.ok(
    violations.some((violation) => violation.includes('nothing proves the label wins')),
    `the avatar guard accepted a catalog that covers four branches and proves no ordering: ${violations.join('; ')}`,
  );
});

test('dropping the empty-string cases fails semantically', () => {
  const eroded = dropAll(
    load('avatar'),
    (entry) => entry.props?.image === '' || entry.props?.label === '' || entry.props?.icon === '',
    'passes an empty channel',
  );

  assert.ok(
    avatarCoverageViolations(eroded).some((violation) => violation.includes('empty')),
    'the avatar guard did not notice that truthiness is no longer proved',
  );
});

test('dropping the alt-less image case fails semantically', () => {
  const eroded = dropAll(
    load('avatar'),
    (entry) => branchOf(entry) === 'image' && entry.props?.imageAlt === undefined,
    'renders an image without an imageAlt',
  );

  assert.ok(
    avatarCoverageViolations(eroded).some((violation) => violation.includes('alt=""')),
    'the avatar guard did not notice that the decorative default is no longer proved',
  );
});

for (const other of ['skeleton', 'card']) {
  test(`the ${other} catalog cannot satisfy the avatar rules`, () => {
    const violations = avatarCoverageViolations(load(other));

    assert.ok(violations.length > 0, `the ${other} catalog satisfied the avatar rules`);
    assert.ok(
      violations.some((violation) => violation.includes('no shared avatar case')),
      `only the namespace check fired, so the dimension rules would accept ${other} cases: ${violations.join('; ')}`,
    );
  });
}
