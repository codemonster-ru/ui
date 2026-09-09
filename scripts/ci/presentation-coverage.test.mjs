// The three M15 catalogs cannot quietly shrink, and padding cannot hide it.
//
// Each component is attacked on its own. The batch-specific attack is the last
// pair: VfBadge and VfTag are near-identical, so the test also proves that one
// catalog cannot satisfy the other's rules - if it could, migrating them
// together would have bought a single component's evidence at twice the price.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { badgeCoverageViolations, dividerCoverageViolations, tagCoverageViolations } from './presentation-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOORS = { badge: 16, tag: 16, divider: 10 };
const GUARDS = {
  badge: badgeCoverageViolations,
  tag: tagCoverageViolations,
  divider: dividerCoverageViolations,
};

/** Cases that satisfy nothing: a bare component with no tone and no consumer attribute. */
function padding(component, count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `${component}/padding-${index}`,
    title: `padding ${index}`,
    props: { tone: 'primary' },
    attrs: {},
    ...(component === 'divider' ? { props: { orientation: 'vertical' } } : { content: { text: 'padding' } }),
  }));
}

/** Removes every case matching `predicate`, asserting at least one was there. */
function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return remaining;
}

for (const component of ['badge', 'tag', 'divider']) {
  test(`the shipped ${component} catalog is fully covered`, () => {
    assert.deepEqual(GUARDS[component](load(component)), []);
  });

  test(`the ${component} catalog keeps a count floor as secondary protection`, () => {
    assert.ok(load(component).length >= FLOORS[component], `the ${component} catalog shrank`);
  });

  test(`every ${component} case id is unique and namespaced`, () => {
    const ids = load(component).map((entry) => entry.id);

    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every((id) => id.startsWith(`${component}/`)));
  });
}

// The padding attacks. In each, the semantic guard must fail while the count
// floor still passes, which is the whole reason the guard exists.
for (const block of ['badge', 'tag']) {
  test(`${block}: dropping the neutral-tone cases fails semantically while padding keeps the count up`, () => {
    const eroded = dropAll(
      load(block),
      (entry) => entry.props?.tone === undefined || entry.props?.tone === 'neutral',
      'renders the neutral tone',
    );
    const padded = [...eroded, ...padding(block, 12)];

    assert.ok(padded.length >= FLOORS[block], 'the padding attack must keep the count floor satisfied');
    const violations = GUARDS[block](padded);
    assert.ok(
      violations.some((violation) => violation.includes('default tone')),
      `the ${block} guard did not notice that neutral suppression is no longer proved: ${violations.join('; ')}`,
    );
  });

  test(`${block}: dropping the consumer-class cases fails semantically`, () => {
    const eroded = dropAll(load(block), (entry) => entry.attrs?.class !== undefined, 'forwards a consumer class');

    assert.ok(
      GUARDS[block]([...eroded, ...padding(block, 12)]).some((violation) => violation.includes('consumer class')),
      `the ${block} guard did not notice the class-merge evidence disappearing`,
    );
  });

  test(`${block}: dropping a single tone fails semantically`, () => {
    const eroded = dropAll(load(block), (entry) => entry.props?.tone === 'contrast', 'renders the contrast tone');

    assert.ok(
      GUARDS[block]([...eroded, ...padding(block, 12)]).some((violation) => violation.includes('contrast')),
      `the ${block} guard did not notice a tone disappearing`,
    );
  });
}

test('divider: dropping the conditional-role cases fails semantically while padding keeps the count up', () => {
  // The historical quirk. Without these cases, a divider "corrected" to expose
  // role=separator on both orientations would pass unnoticed.
  const eroded = dropAll(
    load('divider'),
    (entry) => entry.attrs?.role === undefined && entry.attrs?.['aria-orientation'] === undefined,
    'renders a divider without consumer ARIA',
  );
  const padded = [...eroded, ...padding('divider', 8)];

  assert.ok(padded.length >= FLOORS.divider, 'the padding attack must keep the count floor satisfied');
  const violations = dividerCoverageViolations(padded);
  assert.ok(
    violations.some((violation) => violation.includes('absence of a role') || violation.includes('role=separator')),
    `the divider guard did not notice that the conditional role is no longer proved: ${violations.join('; ')}`,
  );
});

test('divider: dropping the override cases fails semantically', () => {
  const eroded = dropAll(load('divider'), (entry) => entry.attrs?.role !== undefined, 'overrides the role');

  assert.ok(
    dividerCoverageViolations([...eroded, ...padding('divider', 8)]).some((violation) =>
      violation.includes('consumer role'),
    ),
    'the divider guard did not notice the override path disappearing',
  );
});

// One component's cases may never satisfy another's semantic coverage. Stated
// for the pair that could plausibly be confused, and for the odd one out.
test('the badge catalog cannot satisfy the tag rules', () => {
  const violations = tagCoverageViolations(load('badge'));

  assert.ok(violations.length > 0, 'badge cases satisfied the tag guard, so the two catalogs are interchangeable');
  assert.ok(
    violations.some((violation) => violation.includes('cannot count towards tag coverage')),
    `the tag guard accepted badge case ids: ${violations.join('; ')}`,
  );
});

test('the tag catalog cannot satisfy the badge rules', () => {
  const violations = badgeCoverageViolations(load('tag'));

  assert.ok(violations.length > 0, 'tag cases satisfied the badge guard, so the two catalogs are interchangeable');
  assert.ok(
    violations.some((violation) => violation.includes('cannot count towards badge coverage')),
    `the badge guard accepted tag case ids: ${violations.join('; ')}`,
  );
});

test('neither toned-span catalog can satisfy the divider rules', () => {
  assert.ok(dividerCoverageViolations(load('badge')).length > 0);
  assert.ok(dividerCoverageViolations(load('tag')).length > 0);
});

test('the divider catalog cannot satisfy either toned-span rule set', () => {
  assert.ok(badgeCoverageViolations(load('divider')).length > 0);
  assert.ok(tagCoverageViolations(load('divider')).length > 0);
});
