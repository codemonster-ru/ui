// The VfSkeleton catalog cannot quietly shrink, and padding cannot hide it.
//
// The cross-catalog checks at the end are the batch-specific part: M16's three
// components are deliberately unalike, so the useful question is not whether
// one could satisfy another's rules by accident - it is whether the rules would
// even notice. They must.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { skeletonCoverageViolations } from './skeleton-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

/** Secondary protection only. The semantic rules are the primary protection. */
const FLOOR = 17;

/** Cases that satisfy nothing: a skeleton with one prop and no consumer attribute. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `skeleton/padding-${index}`,
    title: `padding ${index}`,
    props: { minHeight: 40 },
    attrs: {},
    visual: false,
  }));
}

/** Removes every case matching `predicate`, asserting at least one was there. */
function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return remaining;
}

test('the shipped skeleton catalog is fully covered', () => {
  assert.deepEqual(skeletonCoverageViolations(load('skeleton')), []);
});

test('the skeleton catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('skeleton').length >= FLOOR, 'the skeleton catalog shrank');
});

test('every skeleton case id is unique and namespaced', () => {
  const ids = load('skeleton').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('skeleton/')));
});

// The mandatory padding attack: remove one real variant dimension, pad the
// count back up. The semantic guard must fail while the floor still passes.
test('dropping the empty-radius cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(load('skeleton'), (entry) => entry.props?.radius === '', 'passes an empty radius');
  const padded = [...eroded, ...padding(6)];

  assert.ok(padded.length >= FLOOR, 'the padding attack must keep the count floor satisfied');
  const violations = skeletonCoverageViolations(padded);
  assert.ok(
    violations.some((violation) => violation.includes('empty radius')),
    `the skeleton guard did not notice that the dropped declaration is no longer proved: ${violations.join('; ')}`,
  );
});

test('dropping the unanimated cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(load('skeleton'), (entry) => entry.props?.animated === false, 'switches the animation off');
  const padded = [...eroded, ...padding(6)];

  assert.ok(padded.length >= FLOOR, 'the padding attack must keep the count floor satisfied');
  const violations = skeletonCoverageViolations(padded);
  assert.ok(
    violations.some((violation) => violation.includes('switches the animation off')),
    `the skeleton guard did not notice that the modifier can no longer be proved absent: ${violations.join('; ')}`,
  );
});

test('dropping the aria-hidden override fails semantically', () => {
  const eroded = dropAll(
    load('skeleton'),
    (entry) => entry.attrs?.['aria-hidden'] !== undefined,
    'overrides aria-hidden',
  );

  assert.ok(
    skeletonCoverageViolations(eroded).some((violation) => violation.includes('overrides aria-hidden')),
    'the skeleton guard did not notice that the override path is no longer measured',
  );
});

// Cross-catalog substitution. Neither of the other two M16 catalogs may satisfy
// these rules, and the id namespace check is only the last line of defence -
// the dimension rules have to fail first.
for (const other of ['avatar', 'card']) {
  test(`the ${other} catalog cannot satisfy the skeleton rules`, () => {
    const violations = skeletonCoverageViolations(load(other));

    assert.ok(violations.length > 0, `the ${other} catalog satisfied the skeleton rules`);
    assert.ok(
      violations.some((violation) => violation.includes('no shared skeleton case')),
      `only the namespace check fired, so the dimension rules would accept ${other} cases: ${violations.join('; ')}`,
    );
  });
}
