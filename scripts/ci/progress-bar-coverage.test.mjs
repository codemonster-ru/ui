// The VfProgressBar catalog cannot quietly shrink, and it cannot quietly
// become the spinner's catalog under another name.
//
// This is the M21 gate. The mandatory padding attacks, in the milestone's
// letters, are:
//
//   A. remove the zero case and pad the count;
//   B. remove the max (full) case and pad;
//   C. remove the custom-max case and pad;
//   D. remove the ARIA override cases and pad;
//   E. replace the catalog with VfProgressSpinner cases;
//   F. remove the label-distinguishing case and pad;
//   G. remove the indeterminate cases and pad.
//
// All keep the count healthy. All have to fail semantically, naming the rules
// that stopped being proved.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { progressBarCoverageViolations } from './progress-bar-coverage.mjs';
import { progressSpinnerCoverageViolations } from './progress-spinner-coverage.mjs';
import { skeletonCoverageViolations } from './skeleton-coverage.mjs';
import { alertCoverageViolations } from './alert-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 50;

/** Cases that satisfy nothing new: a bare success bar at a middle value. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `progress-bar/padding-${index}`,
    title: `padding ${index}`,
    props: { value: 60, tone: 'success' },
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
      `the bar guard did not notice that "${rule}" is no longer proved after ${attack}: ${violations.join('; ')}`,
    );
  }
}

test('the shipped bar catalog is fully covered', () => {
  assert.deepEqual(progressBarCoverageViolations(load('progress-bar')), []);
});

test('the bar catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('progress-bar').length >= FLOOR, 'the bar catalog shrank');
});

test('every bar case id is unique and namespaced', () => {
  const ids = load('progress-bar').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('progress-bar/')));
});

test('no shipped bar case declares a control or a slot, because the component has neither', () => {
  for (const entry of load('progress-bar')) {
    assert.equal(entry.consumerInteractive ?? 0, 0, `${entry.id} declares a budget for a slot that does not exist`);
    assert.equal(entry.content, undefined, `${entry.id} declares slot content for a component with no slot`);
  }
});

// ------------------------------------------------------------------ attack A

test('dropping the zero case fails semantically while padding keeps the count up', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(cases, (entry) => entry.props?.value === 0, 'passes value 0');
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  assert.ok(padded.length >= FLOOR);
  expectRules(progressBarCoverageViolations(padded), ['passes value 0', 'shows the value at zero'], 'dropping zero');
});

// ------------------------------------------------------------------ attack B

test('dropping the full case fails semantically while padding keeps the count up', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(
    cases,
    (entry) =>
      typeof entry.props?.value === 'number' &&
      entry.props.value >= (entry.props.max ?? 100) &&
      (entry.props.max ?? 100) > 0,
    'reaches the maximum',
  );
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressBarCoverageViolations(padded),
    ['value equal to the maximum', 'value above the maximum'],
    'dropping the full and overflow cases',
  );
});

// ------------------------------------------------------------------ attack C

test('dropping the custom-max cases fails semantically while padding keeps the count up', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(cases, (entry) => entry.props?.max !== undefined, 'passes a maximum');
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressBarCoverageViolations(padded),
    ['custom maximum above zero', 'passes max 0', 'negative maximum', 'fractional maximum', 'maximum below one'],
    'dropping every maximum',
  );
});

// ------------------------------------------------------------------ attack D

test('dropping the ARIA override cases fails semantically', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(
    cases,
    (entry) => Object.keys(entry.attrs ?? {}).some((key) => key === 'role' || key.startsWith('aria-')),
    'forwards consumer ARIA',
  );
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressBarCoverageViolations(padded),
    [
      'consumer role',
      'consumer aria-label',
      'aria-labelledby',
      'consumer aria-valuenow on a determinate bar',
      'consumer aria-valuemax',
      'consumer aria-valuemin',
      'aria-valuetext',
      'aria-valuenow onto an indeterminate bar',
      'aria-hidden onto the root',
    ],
    'dropping consumer ARIA',
  );
});

test('a consumer aria-valuenow equal to the prop value proves nothing and is refused', () => {
  // The independence proof needs the attribute and the fill to disagree. A
  // reviewer "tidying" the case to agree would erase it.
  const cases = load('progress-bar').map((entry) =>
    entry.attrs?.['aria-valuenow'] !== undefined && entry.props?.indeterminate !== true
      ? { ...entry, attrs: { ...entry.attrs, 'aria-valuenow': String(entry.props.value) } }
      : entry,
  );

  expectRules(progressBarCoverageViolations(cases), ['measured apart'], 'agreeing valuenow');
});

test('a catalog whose every case carries consumer ARIA never measures the component semantics, and fails', () => {
  const cases = load('progress-bar').map((entry) => ({ ...entry, attrs: { ...entry.attrs, role: 'status' } }));

  expectRules(progressBarCoverageViolations(cases), ['own role, name and value are never measured'], 'ARIA everywhere');
});

// ------------------------------------------------------------------ attack E

test('replacing the bar catalog with spinner cases of equal count fails coverage', () => {
  // The substitution in its most plausible form: the spinner has the same
  // role and the same tones, so a reviewer reuses its catalog and renames
  // the ids.
  const derived = load('progress-spinner').map((entry) => ({
    ...entry,
    id: entry.id.replace(/^progress-spinner\//, 'progress-bar/'),
  }));
  const padded = [...derived, ...padding(Math.max(0, FLOOR - derived.length))];

  const violations = progressBarCoverageViolations(padded);
  assert.ok(violations.length > 0, 'the spinner cases satisfied the bar rules');
  // Not only the namespace check: the spinner's props are refused by name,
  // and the value rules fire because a spinner case carries no value at all.
  expectRules(
    violations,
    ['declares the size prop', 'declares the strokeWidth prop', 'passes value 0', 'custom maximum', 'indeterminate'],
    'spinner substitution',
  );
});

test('the whole spinner catalog cannot satisfy the bar rules, and the bar catalog cannot satisfy the spinner rules', () => {
  const violations = progressBarCoverageViolations(load('progress-spinner'));

  assert.ok(violations.length > 0);
  expectRules(violations, ['is not a progress-bar case'], 'whole spinner catalog');
  assert.ok(
    progressSpinnerCoverageViolations(load('progress-bar')).length > 0,
    'the bar catalog satisfied the spinner rules',
  );
});

// ------------------------------------------------------------------ attack F

test('dropping the label-distinguishing cases fails semantically while padding keeps the count up', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(
    cases,
    (entry) => entry.props?.showValue === true && entry.props?.indeterminate !== true,
    'shows the value',
  );
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressBarCoverageViolations(padded),
    ['label element is never measured', 'half-up rounding', 'reads 0%', 'not the accessible name'],
    'dropping the label cases',
  );
});

test('dropping only the case that separates the label from the name fails semantically', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(
    cases,
    (entry) =>
      entry.props?.showValue === true && typeof entry.props?.label === 'string' && entry.props.label !== 'Progress',
    'shows the value beside a custom label',
  );
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(progressBarCoverageViolations(padded), ['not the accessible name'], 'dropping the label/name case');
});

// ------------------------------------------------------------------ attack G

test('dropping the indeterminate cases fails semantically while padding keeps the count up', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(cases, (entry) => entry.props?.indeterminate === true, 'is indeterminate');
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressBarCoverageViolations(padded),
    ['indeterminate with no consumer attributes', 'beside indeterminate', 'composes indeterminate'],
    'dropping indeterminate',
  );
});

// ------------------------------------------------------- other substitutions

test('dropping one tone fails semantically while padding keeps the count up', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(cases, (entry) => entry.props?.tone === 'neutral', 'renders neutral');
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(progressBarCoverageViolations(padded), ['neutral tone'], 'dropping the neutral tone');
});

test('dropping the height cases fails semantically while padding keeps the count up', () => {
  const cases = load('progress-bar');
  const eroded = dropAll(cases, (entry) => entry.props?.height !== undefined, 'passes a height');
  const padded = [...eroded, ...padding(cases.length - eroded.length)];

  expectRules(
    progressBarCoverageViolations(padded),
    ['numeric height', 'height 0', 'string height', 'empty-string height', 'overrides the height custom property'],
    'dropping the height cases',
  );
});

test('dropping the attrs, class and style cases fails semantically while padding keeps the count up', () => {
  const cases = load('progress-bar');
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
    progressBarCoverageViolations(padded),
    [
      'consumer class at the default',
      'consumer class after a tone and a stripe modifier',
      'inline style beside no height',
      'inline style beside a height',
      'overrides the height custom property',
      'product data attribute',
      'composes a custom maximum',
    ],
    'dropping the consumer contract',
  );
});

test('a bar case that grew a slot is rejected', () => {
  const grown = [
    ...load('progress-bar'),
    {
      id: 'progress-bar/content',
      title: 'content',
      props: {},
      attrs: {},
      content: { body: { text: 'x' } },
      visual: false,
    },
  ];

  assert.ok(progressBarCoverageViolations(grown).some((violation) => violation.includes('[body] slot')));
});

test('a bar case that buys a consumer control budget is rejected', () => {
  const grown = [
    ...load('progress-bar'),
    { id: 'progress-bar/control', title: 'control', props: {}, attrs: {}, consumerInteractive: 1, visual: false },
  ];

  assert.ok(progressBarCoverageViolations(grown).some((violation) => violation.includes('budget is a fiction')));
});

test("a bar case carrying the spinner's props is rejected", () => {
  const grown = [
    ...load('progress-bar'),
    { id: 'progress-bar/sized', title: 'sized', props: { size: 40, strokeWidth: 6 }, attrs: {}, visual: false },
  ];
  const violations = progressBarCoverageViolations(grown);

  assert.ok(violations.some((violation) => violation.includes('declares the size prop')));
  assert.ok(violations.some((violation) => violation.includes('declares the strokeWidth prop')));
});

test('a bar case carrying a numeric string is rejected, because the two adapters read it differently by design', () => {
  const grown = [
    ...load('progress-bar'),
    { id: 'progress-bar/string', title: 'string', props: { value: '40', max: '80' }, attrs: {}, visual: false },
  ];
  const violations = progressBarCoverageViolations(grown);

  assert.ok(violations.some((violation) => violation.includes('non-numeric value')));
  assert.ok(violations.some((violation) => violation.includes('non-numeric max')));
});

for (const [other, otherRules] of [
  ['skeleton', skeletonCoverageViolations],
  ['alert', alertCoverageViolations],
]) {
  test(`the ${other} catalog cannot satisfy the bar rules, and vice versa`, () => {
    const violations = progressBarCoverageViolations(load(other));

    assert.ok(violations.length > 0);
    assert.ok(violations.some((violation) => violation.includes('is not a progress-bar case')));
    assert.ok(otherRules(load('progress-bar')).length > 0, `the bar catalog satisfied the ${other} rules`);
  });
}
