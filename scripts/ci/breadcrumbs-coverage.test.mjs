// The VfBreadcrumbs catalog cannot quietly shrink, cannot quietly grow the Vue
// adapter's router branch, and cannot buy or lose an anchor through its
// ownership declarations.
//
// This is the M26 gate. The attacks that matter here:
//
//   A. an item naming `to`, or a case naming `component` - the router branch
//      smuggled into a three-way catalog two targets cannot render;
//   B. the budget bought for an item the rule renders as a span - the current
//      item, a disabled item, an empty href - or lost for a real link;
//   C. the rule cases dropped and padded back with plain trails of equal
//      count: the dropped href, the explicit current, the two currents, the
//      empty href, the disabled item, the rel cases, the separator cases;
//   D. an interaction, or a consumer control in the separator, declared on a
//      component that handles neither in a shared case.
//
// Each has to fail semantically, naming the rule that stopped being proved.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { breadcrumbsCoverageViolations, expectedOwnedAnchors } from './breadcrumbs-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = () => JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/breadcrumbs/cases.json'), 'utf8')).cases;

const FLOOR = 24;

/** Cases that satisfy nothing new: plain three-item trails. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `breadcrumbs/padding-${index}`,
    title: `padding ${index}`,
    props: { items: [{ label: 'A', href: `/a/${index}` }, { label: 'B', href: `/b/${index}` }, { label: 'C' }] },
    attrs: {},
    componentInteractive: 2,
    visual: false,
  }));
}

function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return remaining;
}

const items = (entry) => entry.props?.items ?? [];
const expectViolation = (violations, fragment) =>
  assert.ok(
    violations.some((violation) => violation.includes(fragment)),
    `the breadcrumbs guard did not report "${fragment}": ${violations.join('; ')}`,
  );

test('the shipped breadcrumbs catalog is fully covered', () => {
  assert.deepEqual(breadcrumbsCoverageViolations(load()), []);
});

test('the breadcrumbs catalog keeps a count floor as secondary protection', () => {
  assert.ok(load().length >= FLOOR, 'the breadcrumbs catalog shrank');
});

test('every breadcrumbs case id is unique and namespaced', () => {
  const ids = load().map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('breadcrumbs/')));
});

test('the restated rule agrees with the shipped budgets item by item', () => {
  // The rule as the gate restates it, on the shapes that make it a rule.
  const budget = (list) => expectedOwnedAnchors({ props: { items: list } });

  assert.equal(budget([]), 0);
  assert.equal(budget([{ label: 'Only', href: '/only' }]), 0);
  assert.equal(
    budget([
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b' },
    ]),
    1,
  );
  assert.equal(
    budget([
      { label: 'A', href: '/a' },
      { label: 'B', href: '/b', current: true },
      { label: 'C', href: '/c' },
    ]),
    2,
  );
  assert.equal(
    budget([
      { label: 'A', href: '/a', current: true },
      { label: 'B', href: '/b', current: true },
      { label: 'C', href: '/c' },
    ]),
    1,
  );
  assert.equal(budget([{ label: 'A', href: '/a' }, { label: 'B', href: '/b', disabled: true }, { label: 'C' }]), 1);
  assert.equal(budget([{ label: 'A', href: '/a' }, { label: 'B', href: '' }, { label: 'C' }]), 1);
});

// ------------------------------------------------------------------- attack A

test('an item naming `to` is rejected as the router branch, not as an unknown key', () => {
  const grown = [
    ...load(),
    {
      id: 'breadcrumbs/routed',
      title: 'routed',
      props: { items: [{ label: 'Home', to: '/' }, { label: 'Leaf' }] },
      attrs: {},
      componentInteractive: 1,
      visual: false,
    },
  ];

  expectViolation(
    breadcrumbsCoverageViolations(grown),
    "item 0 declares [to], which selects the Vue adapter's router branch",
  );
});

test('an item with an object destination is rejected too', () => {
  const grown = [
    ...load(),
    {
      id: 'breadcrumbs/routed-object',
      title: 'routed',
      props: { items: [{ label: 'Home', to: { name: 'home' } }, { label: 'Leaf' }] },
      attrs: {},
      componentInteractive: 1,
      visual: false,
    },
  ];

  expectViolation(breadcrumbsCoverageViolations(grown), 'item 0 declares [to]');
});

test('a case naming `component` is rejected the same way', () => {
  const grown = [
    ...load(),
    {
      id: 'breadcrumbs/custom',
      title: 'custom',
      props: { items: [{ label: 'Home', href: '/' }, { label: 'Leaf' }], component: 'span' },
      attrs: {},
      componentInteractive: 1,
      visual: false,
    },
  ];

  expectViolation(
    breadcrumbsCoverageViolations(grown),
    "declares prop [component], which replaces the Vue adapter's router component",
  );
});

test('an item key the reference does not have is rejected', () => {
  const grown = [
    ...load(),
    {
      id: 'breadcrumbs/icon',
      title: 'icon',
      props: { items: [{ label: 'Home', href: '/', icon: 'home' }, { label: 'Leaf' }] },
      attrs: {},
      componentInteractive: 1,
      visual: false,
    },
  ];

  expectViolation(
    breadcrumbsCoverageViolations(grown),
    'item 0 declares [icon], which the reference VfBreadcrumbItem does not have',
  );
});

// ------------------------------------------------------------------- attack B

test('buying a control for the current item is rejected against the rule', () => {
  const bought = load().map((entry) =>
    entry.id === 'breadcrumbs/last-href-dropped' ? { ...entry, componentInteractive: 2 } : entry,
  );

  expectViolation(
    breadcrumbsCoverageViolations(bought),
    'breadcrumbs/last-href-dropped declares 2 component-owned control(s) but the historical rule renders 1',
  );
});

test('buying a control for a disabled item or an empty href is rejected against the rule', () => {
  for (const id of ['breadcrumbs/disabled', 'breadcrumbs/href-empty']) {
    const bought = load().map((entry) => (entry.id === id ? { ...entry, componentInteractive: 2 } : entry));

    expectViolation(
      breadcrumbsCoverageViolations(bought),
      `${id} declares 2 component-owned control(s) but the historical rule renders 1`,
    );
  }
});

test('losing an anchor by under-declaring is rejected', () => {
  const lost = load().map((entry) => (entry.id === 'breadcrumbs/five' ? { ...entry, componentInteractive: 3 } : entry));

  expectViolation(
    breadcrumbsCoverageViolations(lost),
    'breadcrumbs/five declares 3 component-owned control(s) but the historical rule renders 4',
  );
});

test('a case without a budget is rejected', () => {
  const missing = load().map((entry) => {
    if (entry.id !== 'breadcrumbs/trail') return entry;
    const rest = { ...entry };
    delete rest.componentInteractive;
    return rest;
  });

  expectViolation(breadcrumbsCoverageViolations(missing), 'breadcrumbs/trail declares no componentInteractive budget');
});

// ------------------------------------------------------------------- attack C

test('dropping the dropped-href case fails semantically', () => {
  const eroded = dropAll(
    load(),
    (entry) =>
      items(entry).length >= 2 && items(entry).every((item) => !item.current) && Boolean(items(entry).at(-1).href),
    'has a last-item href without an explicit current',
  );

  expectViolation(breadcrumbsCoverageViolations([...eroded, ...padding(1)]), 'dropped href is never measured');
});

test('dropping the explicit-current and two-currents cases fails semantically', () => {
  const eroded = dropAll(
    load(),
    (entry) => items(entry).some((item) => item.current === true),
    'flags an item current',
  );
  const violations = breadcrumbsCoverageViolations([...eroded, ...padding(2)]);

  expectViolation(violations, 'explicit current beside a last-item link is never measured');
  expectViolation(violations, 'multiple aria-current are never measured');
});

test('dropping the empty-href case fails semantically', () => {
  const eroded = dropAll(load(), (entry) => items(entry).some((item) => item.href === ''), "renders href=''");

  expectViolation(
    breadcrumbsCoverageViolations([...eroded, ...padding(1)]),
    'truthiness rule that differs from VfLink is never measured',
  );
});

test('dropping the disabled cases fails semantically', () => {
  const eroded = dropAll(
    load(),
    (entry) => items(entry).some((item) => item.disabled === true),
    'renders a disabled item',
  );
  const violations = breadcrumbsCoverageViolations([...eroded, ...padding(2)]);

  expectViolation(violations, 'disabled item that is not current');
  expectViolation(violations, 'modifier beside aria-current is never measured');
});

test('dropping the rel cases and padding with plain trails fails semantically', () => {
  const eroded = dropAll(
    load(),
    (entry) => items(entry).some((item) => item.target !== undefined || item.rel !== undefined),
    'renders a target or a rel',
  );
  const violations = breadcrumbsCoverageViolations([...eroded, ...padding(4)]);

  expectViolation(violations, 'derived rel is never measured');
  expectViolation(violations, 'explicit value wins without merging');
  expectViolation(violations, 'derivation is _blank-only');
  expectViolation(violations, 'explicit rel is written on its own');
});

test('dropping the separator slot cases fails semantically', () => {
  const eroded = dropAll(load(), (entry) => entry.content?.separator !== undefined, 'has a separator slot');
  const violations = breadcrumbsCoverageViolations([...eroded, ...padding(2)]);

  expectViolation(violations, 'text in the separator slot');
  expectViolation(violations, 'consumer markup in the separator slot');
});

test('dropping the empty trail, the lone item or the five-item trail fails semantically', () => {
  for (const [predicate, fragment] of [
    [(entry) => items(entry).length === 0, 'empty trail'],
    [(entry) => items(entry).length === 1, 'one item'],
    [(entry) => items(entry).length >= 5, 'five or more items'],
  ]) {
    const eroded = dropAll(load(), predicate, fragment);
    expectViolation(breadcrumbsCoverageViolations([...eroded, ...padding(2)]), fragment);
  }
});

test('dropping the nav label cases fails semantically', () => {
  const eroded = dropAll(load(), (entry) => entry.props?.ariaLabel !== undefined, 'gives the nav a label');
  const violations = breadcrumbsCoverageViolations([...eroded, ...padding(2)]);

  expectViolation(violations, 'prop-driven name is never measured');
  expectViolation(violations, 'empty attribute is never measured');
});

test('dropping every screenshot of the disabled modifier fails', () => {
  const blind = load().map((entry) =>
    items(entry).some((item) => item.disabled === true) ? { ...entry, visual: false } : entry,
  );

  expectViolation(breadcrumbsCoverageViolations(blind), 'a disabled item, whose colour is the whole modifier');
});

// ------------------------------------------------------------------- attack D

test('a case declaring an interaction is rejected', () => {
  const driven = load().map((entry) =>
    entry.id === 'breadcrumbs/trail' ? { ...entry, interaction: { steps: [{ type: 'clickButton' }] } } : entry,
  );

  expectViolation(breadcrumbsCoverageViolations(driven), 'declares an interaction');
});

test('a case declaring a consumer control is rejected', () => {
  const bought = load().map((entry) =>
    entry.id === 'breadcrumbs/separator-text' ? { ...entry, consumerInteractive: 2 } : entry,
  );

  expectViolation(breadcrumbsCoverageViolations(bought), 'declares 2 consumer control(s)');
});

test('the check itself fails when the catalog is padded with something that is not a breadcrumbs case', () => {
  expectViolation(
    breadcrumbsCoverageViolations([...load(), { id: 'link/href', props: { href: '/' }, componentInteractive: 1 }]),
    'is not a breadcrumbs case',
  );
});
