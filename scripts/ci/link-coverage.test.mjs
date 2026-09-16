// The VfLink catalog cannot quietly shrink, cannot quietly grow the Vue
// adapter's router branch, and cannot buy or lose the anchor through its
// ownership declarations.
//
// This is the M25 gate. The attacks that matter here:
//
//   A. a case naming `to` or `component` - the router branch smuggled into a
//      three-way catalog two targets cannot render;
//   B. the no-destination case dropped, so an inert anchor is never measured,
//      or declared as owning a control, so the ownership stage would count an
//      unfocusable element;
//   C. the rel cases dropped and padded back with plain links of equal count;
//   D. an interaction declared on a component that handles none.
//
// Each has to fail semantically, naming the rule that stopped being proved.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { linkCoverageViolations } from './link-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 15;

/** Cases that satisfy nothing new: plain links with a consumer class. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `link/padding-${index}`,
    title: `padding ${index}`,
    props: { href: `/padding/${index}` },
    attrs: {},
    content: { text: 'Padding' },
    componentInteractive: 1,
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
    `the link guard did not report "${fragment}": ${violations.join('; ')}`,
  );

test('the shipped link catalog is fully covered', () => {
  assert.deepEqual(linkCoverageViolations(load('link')), []);
});

test('the link catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('link').length >= FLOOR, 'the link catalog shrank');
});

test('every link case id is unique and namespaced', () => {
  const ids = load('link').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('link/')));
});

// ------------------------------------------------------------------- attack A

test('a case naming `to` is rejected as the router branch, not as an unknown prop', () => {
  const grown = [
    ...load('link'),
    {
      id: 'link/routed',
      title: 'routed',
      props: { to: '/docs' },
      attrs: {},
      content: { text: 'Docs' },
      componentInteractive: 0,
      visual: false,
    },
  ];

  const violations = linkCoverageViolations(grown);
  expectViolation(violations, "declares prop [to], which selects the Vue adapter's router branch");
});

test('a case naming `component` is rejected the same way', () => {
  const grown = [
    ...load('link'),
    {
      id: 'link/custom',
      title: 'custom',
      props: { href: '/docs', component: 'span' },
      attrs: {},
      content: { text: 'Docs' },
      componentInteractive: 1,
      visual: false,
    },
  ];

  expectViolation(
    linkCoverageViolations(grown),
    "declares prop [component], which selects the Vue adapter's router branch",
  );
});

test('a case with an object destination is rejected too', () => {
  const grown = [
    ...load('link'),
    {
      id: 'link/routed-object',
      title: 'routed',
      props: { to: { name: 'docs' } },
      attrs: {},
      content: { text: 'Docs' },
      componentInteractive: 0,
      visual: false,
    },
  ];

  expectViolation(linkCoverageViolations(grown), 'declares prop [to]');
});

// ------------------------------------------------------------------- attack B

test('dropping the no-destination case fails semantically', () => {
  const eroded = dropAll(load('link'), (entry) => entry.props?.href === undefined, 'has no href');

  expectViolation(linkCoverageViolations([...eroded, ...padding(1)]), 'anchor with no destination');
});

test('declaring the no-destination anchor as a control is rejected', () => {
  const bought = load('link').map((entry) =>
    entry.props?.href === undefined ? { ...entry, componentInteractive: 1 } : entry,
  );

  expectViolation(linkCoverageViolations(bought), 'has no href, so its anchor is inert');
});

test('declaring zero controls for an anchor with an href is rejected', () => {
  const lost = load('link').map((entry) => (entry.id === 'link/href' ? { ...entry, componentInteractive: 0 } : entry));

  expectViolation(linkCoverageViolations(lost), 'has an href, so its anchor is a control');
});

test('a case with no ownership declaration at all is rejected rather than defaulted', () => {
  const undeclared = load('link').map((entry) => {
    if (entry.id !== 'link/href') return entry;
    const { componentInteractive, ...rest } = entry;
    void componentInteractive;
    return rest;
  });

  expectViolation(linkCoverageViolations(undeclared), 'declares no componentInteractive budget');
});

test('a consumer budget that disagrees with the slot is rejected in both directions', () => {
  const inflated = load('link').map((entry) =>
    entry.id === 'link/href' ? { ...entry, consumerInteractive: 1 } : entry,
  );
  expectViolation(linkCoverageViolations(inflated), 'declares 1 consumer control(s) but its slot puts 0');

  const deflated = load('link').map((entry) =>
    entry.id === 'link/consumer-control' ? { ...entry, consumerInteractive: 0 } : entry,
  );
  expectViolation(linkCoverageViolations(deflated), 'declares 0 consumer control(s) but its slot puts 1');
});

// ------------------------------------------------------------------- attack C

test('dropping every rel case fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(
    load('link'),
    (entry) => entry.props?.target !== undefined || entry.props?.rel !== undefined,
    'names target or rel',
  );
  const padded = [...eroded, ...padding(6)];

  assert.ok(padded.length >= FLOOR, 'the padding attack must keep the count floor satisfied');
  const violations = linkCoverageViolations(padded);
  for (const expected of [
    'target=_blank without rel',
    'target=_blank with an explicit rel',
    'another target without rel',
    'rel without target',
  ]) {
    expectViolation(violations, expected);
  }
});

test('dropping the modifier cases fails semantically', () => {
  const eroded = dropAll(
    load('link'),
    (entry) => entry.props?.underline !== undefined || entry.props?.tone !== undefined,
    'names a modifier',
  );

  const violations = linkCoverageViolations([...eroded, ...padding(6)]);
  for (const expected of ['underline=hover', 'underline=always', 'tone=muted', 'both modifiers']) {
    expectViolation(violations, expected);
  }
});

test('dropping the consumer ARIA cases fails semantically', () => {
  const eroded = dropAll(
    load('link'),
    (entry) => Object.keys(entry.attrs ?? {}).some((key) => key.startsWith('aria-')),
    'forwards ARIA',
  );

  const violations = linkCoverageViolations(eroded);
  for (const expected of ['aria-label', 'aria-current', 'aria-describedby']) {
    expectViolation(violations, expected);
  }
});

test('dropping the consumer control case fails semantically', () => {
  const eroded = dropAll(load('link'), (entry) => entry.content?.control !== undefined, 'puts a control in the anchor');

  expectViolation(linkCoverageViolations(eroded), 'consumer control in the anchor');
});

// ------------------------------------------------------------------- attack D

test('a case that declares an interaction is rejected', () => {
  const grown = load('link').map((entry) =>
    entry.id === 'link/href'
      ? { ...entry, interaction: { steps: [{ action: 'clickButton' }], expect: { activates: true } } }
      : entry,
  );

  expectViolation(linkCoverageViolations(grown), 'declares an interaction');
});

test('a case that grew a slot the component does not have is rejected', () => {
  const grown = [
    ...load('link'),
    {
      id: 'link/icon',
      title: 'icon',
      props: { href: '/docs' },
      attrs: {},
      content: { icon: 'x' },
      componentInteractive: 1,
      visual: false,
    },
  ];

  expectViolation(linkCoverageViolations(grown), 'puts [icon] in the slot vocabulary');
});

for (const other of ['badge', 'panel', 'button']) {
  test(`the ${other} catalog cannot satisfy the link rules`, () => {
    const violations = linkCoverageViolations(load(other));

    assert.ok(violations.length > 0, `the ${other} catalog satisfied the link rules`);
    assert.ok(
      violations.some((violation) => violation.includes('no shared link case')),
      `only the namespace check fired, so the dimension rules would accept ${other} cases: ${violations.join('; ')}`,
    );
  });
}
