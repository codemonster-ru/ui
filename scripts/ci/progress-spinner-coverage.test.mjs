// The VfProgressSpinner catalog cannot quietly shrink, and it cannot quietly
// become the button's loading catalog under another name.
//
// This is the M20 gate. The mandatory padding attacks, in the milestone's
// letters, are:
//
//   A. remove one size and pad the count;
//   B. remove the accessibility-distinguishing cases and pad;
//   C. remove the attrs/class/style cases and pad;
//   D. replace the cases with button-loading fixtures;
//   E. remove the svg-shape distinction - the stroke cases - and pad.
//
// All keep the count healthy. All have to fail semantically, naming the rules
// that stopped being proved.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { progressSpinnerCoverageViolations } from './progress-spinner-coverage.mjs';
import { skeletonCoverageViolations } from './skeleton-coverage.mjs';
import { alertCoverageViolations } from './alert-coverage.mjs';
import { buttonCoverageViolations } from './button-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 30;

/** Cases that satisfy nothing new: a bare success spinner. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `progress-spinner/padding-${index}`,
    title: `padding ${index}`,
    props: { tone: 'success' },
    attrs: {},
    visual: false,
  }));
}

function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return remaining;
}

function expectRules(violations, expected, attack) {
  for (const rule of expected) {
    assert.ok(
      violations.some((violation) => violation.includes(rule)),
      `the spinner guard did not notice that "${rule}" is no longer proved after ${attack}: ${violations.join('; ')}`,
    );
  }
}

test('the shipped spinner catalog is fully covered', () => {
  assert.deepEqual(progressSpinnerCoverageViolations(load('progress-spinner')), []);
});

test('the spinner catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('progress-spinner').length >= FLOOR, 'the spinner catalog shrank');
});

test('every spinner case id is unique and namespaced', () => {
  const ids = load('progress-spinner').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('progress-spinner/')));
});

test('no shipped spinner case declares a control or a slot, because the component has neither', () => {
  for (const entry of load('progress-spinner')) {
    assert.equal(entry.consumerInteractive ?? 0, 0, `${entry.id} declares a budget for a slot that does not exist`);
    assert.equal(entry.content, undefined, `${entry.id} declares slot content for a component with no slot`);
  }
});

// ------------------------------------------------------------------ attack A

test('dropping one size form fails semantically while padding keeps the count up', () => {
  const cases = load('progress-spinner');
  for (const [what, predicate, rule] of [
    ['size 0', (entry) => entry.props?.size === 0, 'passes size 0'],
    ['a token size', (entry) => String(entry.props?.size ?? '').startsWith('var('), 'token reference as the size'],
    ['an empty size', (entry) => entry.props?.size === '', 'empty-string size'],
    ['a numeric size', (entry) => typeof entry.props?.size === 'number' && entry.props.size > 0, 'numeric size'],
  ]) {
    const eroded = dropAll(cases, predicate, what);
    const padded = [...eroded, ...padding(cases.length - eroded.length)];

    assert.ok(padded.length >= FLOOR);
    expectRules(progressSpinnerCoverageViolations(padded), [rule], `dropping ${what}`);
  }
});

test('dropping one tone fails semantically while padding keeps the count up', () => {
  const cases = load('progress-spinner');
  const eroded = dropAll(cases, (entry) => entry.props?.tone === 'neutral', 'renders neutral');
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(progressSpinnerCoverageViolations(padded), ['neutral tone'], 'dropping the neutral tone');
});

// ------------------------------------------------------------------ attack B

test('dropping the accessibility-distinguishing cases fails semantically', () => {
  const cases = load('progress-spinner');
  const eroded = dropAll(
    cases,
    (entry) => Object.keys(entry.attrs ?? {}).some((key) => key === 'role' || key.startsWith('aria-')),
    'forwards consumer ARIA',
  );
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressSpinnerCoverageViolations(padded),
    ['consumer role', 'consumer aria-label', 'aria-hidden onto the root', 'consumer value attributes'],
    'dropping consumer ARIA',
  );
});

test('a catalog whose every case carries consumer ARIA never measures the component role, and fails', () => {
  const cases = load('progress-spinner').map((entry) => ({ ...entry, attrs: { ...entry.attrs, role: 'status' } }));

  expectRules(
    progressSpinnerCoverageViolations(cases),
    ['own role and name are never measured'],
    'consumer ARIA everywhere',
  );
});

test('dropping the label cases fails semantically', () => {
  const cases = load('progress-spinner');
  const eroded = dropAll(cases, (entry) => entry.props?.label !== undefined, 'passes a label');
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(progressSpinnerCoverageViolations(padded), ['custom label', 'empty label'], 'dropping labels');
});

// ------------------------------------------------------------------ attack C

test('dropping the attrs, class and style cases fails semantically while padding keeps the count up', () => {
  const cases = load('progress-spinner');
  const eroded = dropAll(
    cases,
    (entry) =>
      entry.attrs?.class !== undefined ||
      entry.attrs?.style !== undefined ||
      Object.keys(entry.attrs ?? {}).some((key) => key.startsWith('data-')),
    'forwards a class, style or data attribute',
  );
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressSpinnerCoverageViolations(padded),
    [
      'consumer class at the default tone',
      'consumer class after a tone modifier',
      'inline style beside no size',
      'inline style beside a size',
      'overrides the size custom property',
      'product data attribute',
      'composes size, tone, stroke width',
    ],
    'dropping the consumer contract',
  );
});

// ------------------------------------------------------------------ attack D

test('replacing the spinner catalog with button-loading fixtures of equal count fails coverage', () => {
  // The substitution in its most plausible form: the button already renders a
  // spinner on every loading case, so a reviewer reuses the button catalog,
  // keeps the loading cases, and renames the ids.
  const derived = load('button')
    .filter((entry) => entry.props?.loading === true)
    .map((entry) => ({ ...entry, id: entry.id.replace(/^button\//, 'progress-spinner/') }));
  assert.ok(derived.length > 0, 'the button catalog has no loading case to derive from');
  const padded = [...derived, ...padding(Math.max(0, FLOOR - derived.length))];

  const violations = progressSpinnerCoverageViolations(padded);
  assert.ok(violations.length > 0, 'the button loading cases satisfied the spinner rules');
  // Not only the namespace check: the button's props are refused by name, and
  // the dimension rules fire because a loading button forwards none of them.
  expectRules(
    violations,
    ['declares the loading prop', 'no shared spinner case', 'numeric size', 'neutral tone'],
    'button substitution',
  );
});

test('the whole button catalog cannot satisfy the spinner rules either', () => {
  const violations = progressSpinnerCoverageViolations(load('button'));

  assert.ok(violations.length > 0);
  expectRules(violations, ['no shared spinner case'], 'whole button catalog');
});

test('the spinner catalog cannot satisfy the button rules, so the two gates are not interchangeable', () => {
  assert.ok(
    buttonCoverageViolations(load('progress-spinner')).length > 0,
    'the spinner catalog satisfied the button rules',
  );
});

// ------------------------------------------------------------------ attack E

test('dropping the svg-shape distinction fails semantically while padding keeps the count up', () => {
  // The stroke cases are the catalog's only distinction of the drawing
  // itself: the thick stroke proves the track thickens with the arc, and the
  // zero stroke proves both circles survive with nothing drawn.
  const cases = load('progress-spinner');
  const eroded = dropAll(cases, (entry) => entry.props?.strokeWidth !== undefined, 'passes a stroke width');
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressSpinnerCoverageViolations(padded),
    ['stroke width thicker than the default', 'strokeWidth 0', 'fractional stroke width', 'zero stroke'],
    'dropping the stroke cases',
  );
});

// ------------------------------------------------------- other substitutions

test('a spinner case that grew a slot is rejected', () => {
  const grown = [
    ...load('progress-spinner'),
    {
      id: 'progress-spinner/content',
      title: 'content',
      props: {},
      attrs: {},
      content: { body: { text: 'x' } },
      visual: false,
    },
  ];

  assert.ok(progressSpinnerCoverageViolations(grown).some((violation) => violation.includes('[body] slot')));
});

test('a spinner case that buys a consumer control budget is rejected', () => {
  const grown = [
    ...load('progress-spinner'),
    { id: 'progress-spinner/control', title: 'control', props: {}, attrs: {}, consumerInteractive: 1, visual: false },
  ];

  assert.ok(progressSpinnerCoverageViolations(grown).some((violation) => violation.includes('budget is a fiction')));
});

test("a spinner case carrying the progress bar's props is rejected", () => {
  const grown = [
    ...load('progress-spinner'),
    { id: 'progress-spinner/valued', title: 'valued', props: { value: 40, max: 100 }, attrs: {}, visual: false },
  ];
  const violations = progressSpinnerCoverageViolations(grown);

  assert.ok(violations.some((violation) => violation.includes('declares the value prop')));
  assert.ok(violations.some((violation) => violation.includes('declares the max prop')));
});

for (const [other, otherRules] of [
  ['skeleton', skeletonCoverageViolations],
  ['alert', alertCoverageViolations],
]) {
  test(`the ${other} catalog cannot satisfy the spinner rules, and vice versa`, () => {
    const violations = progressSpinnerCoverageViolations(load(other));

    assert.ok(violations.length > 0);
    assert.ok(violations.some((violation) => violation.includes('no shared spinner case')));
    assert.ok(otherRules(load('progress-spinner')).length > 0, `the spinner catalog satisfied the ${other} rules`);
  });
}
