// The VfTextarea catalog cannot quietly shrink, and padding cannot hide it.
//
// Same asymmetry as the other catalogs: adding cases is always fine, removing
// one has to be a deliberate edit here, where a reviewer sees the coverage
// claim it breaks.
//
// Two attacks are mandatory for this component. The first is the M10.1 one -
// delete an interaction case, pad back over the floor. The second targets field
// integration, because that is where a textarea's contract mostly lives: a
// catalog that stopped composing the control inside a real field would still
// render a perfectly ordinary textarea and prove nothing about labels,
// descriptions or floating.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { DOCUMENTED_SIZES, textareaCoverageViolations } from './textarea-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/textarea/cases.json'), 'utf8'));
const loadCases = () => JSON.parse(JSON.stringify(catalog.cases));
const FLOOR = 37;

const byId = (cases, id) => cases.find((entry) => entry.id === id);

/** Removes a case, asserting it was actually there to remove. */
function drop(cases, id) {
  const remaining = cases.filter((entry) => entry.id !== id);
  assert.equal(remaining.length, cases.length - 1, `attack did not apply: ${id} was not in the catalog`);

  return remaining;
}

/** Cases that satisfy nothing: a bare control with no state and no field. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `textarea/padding-${index}`,
    title: `padding ${index}`,
    props: {},
    attrs: {},
  }));
}

test('the shipped catalog is fully covered', () => {
  assert.deepEqual(textareaCoverageViolations(loadCases()), []);
});

test('the catalog keeps a case count floor as secondary protection', () => {
  assert.ok(catalog.cases.length >= FLOOR, `the textarea catalog fell to ${catalog.cases.length} cases`);
});

test('every case id is unique and namespaced to the component', () => {
  const ids = catalog.cases.map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length, 'the textarea catalog has duplicate case ids');
  assert.deepEqual(
    ids.filter((id) => !id.startsWith('textarea/')),
    [],
  );
});

test('the catalog exercises every documented size', () => {
  for (const size of DOCUMENTED_SIZES) {
    assert.ok(
      loadCases().some((entry) => entry.props?.size === size),
      `the ${size} size stopped being rendered`,
    );
  }
});

test('deleting the empty-to-filled proof is caught, and padding cannot hide it', () => {
  // Every carrier, not one of them: the catalog proves this rule from more than
  // one case, so deleting a single one leaves the coverage intact - which is
  // the guard being precise rather than lenient.
  let eroded = loadCases();
  for (const id of eroded
    .filter((entry) => {
      const value = entry.interaction?.steps?.find((step) => step.action === 'typeTextarea')?.value;
      return value !== undefined && value !== '' && entry.interaction?.expect?.filled === true;
    })
    .map((entry) => entry.id)) {
    eroded = drop(eroded, id);
  }
  eroded = [...eroded, ...padding(6)];

  // The exact shape of the M10.1 silent pass: the count floor is satisfied, so
  // if the semantic rules do not fire, nothing does.
  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  assert.ok(
    textareaCoverageViolations(eroded).includes(
      'no shared case proves that typing moves the field from empty to filled',
    ),
    'padding hid the removal of the empty-to-filled proof',
  );
});

test('deleting every field case is caught, and padding cannot hide it', () => {
  // The field-integration attack. A textarea with no field around it still
  // renders; what disappears is every relationship it is supposed to have.
  let eroded = loadCases();
  for (const id of eroded.filter((entry) => entry.field !== undefined).map((entry) => entry.id)) {
    eroded = drop(eroded, id);
  }
  eroded = [...eroded, ...padding(24)];

  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  const violations = textareaCoverageViolations(eroded);
  for (const message of [
    'no shared case wraps the control in a field',
    'no shared case renders a floating field',
    'no shared case renders a field description',
    'no shared case renders a field error',
    'no shared case proves that clicking the field label focuses its control',
  ]) {
    assert.ok(violations.includes(message), `field erosion went unreported: ${message}`);
  }
});

test('deleting the floating cases alone is caught', () => {
  let eroded = loadCases();
  for (const id of eroded.filter((entry) => entry.field?.placement === 'floating').map((entry) => entry.id)) {
    eroded = drop(eroded, id);
  }
  eroded = [...eroded, ...padding(12)];

  assert.ok(eroded.length >= FLOOR);
  const violations = textareaCoverageViolations(eroded);
  assert.ok(violations.includes('no shared case renders a floating field'));
  assert.ok(violations.includes('no shared case renders a floating field holding a value'));
});

test('deleting the multiline or escaping cases is caught', () => {
  let eroded = loadCases();
  for (const id of eroded
    .filter((entry) => typeof entry.props?.modelValue === 'string' && entry.props.modelValue.includes('\n'))
    .map((entry) => entry.id)) {
    eroded = drop(eroded, id);
  }
  assert.ok(
    textareaCoverageViolations(eroded).includes(
      'no shared case renders a multiline value, which is the only thing that makes this a textarea',
    ),
  );

  assert.ok(
    textareaCoverageViolations(drop(loadCases(), 'textarea/markup-like-value')).includes(
      'no shared case renders a value containing markup characters, so escaping is never compared',
    ),
  );
});

test('a scenario that drops its declared outcome stops counting as coverage', () => {
  const eroded = loadCases();
  delete byId(eroded, 'textarea/interaction-label-click').interaction.expect;

  const violations = textareaCoverageViolations(eroded);
  assert.ok(
    violations.includes('textarea/interaction-label-click drives the component but declares no expected outcome'),
  );
  assert.ok(violations.includes('no shared case proves that clicking the field label focuses its control'));
});

test('inverting a declared outcome stops it counting as coverage', () => {
  const eroded = loadCases();
  // Inverted on every carrier, for the same reason as the deletion attack.
  for (const entry of eroded) {
    const value = entry.interaction?.steps?.find((step) => step.action === 'typeTextarea')?.value;
    if (value !== undefined && value !== '' && entry.interaction?.expect?.filled === true) {
      entry.interaction.expect.filled = false;
    }
  }

  assert.ok(
    textareaCoverageViolations(eroded).includes(
      'no shared case proves that typing moves the field from empty to filled',
    ),
  );
});

test('deleting either uneditable case is caught, and they are not interchangeable', () => {
  // disabled and readonly differ: readonly still takes focus, so one cannot
  // stand in for the other.
  assert.ok(
    textareaCoverageViolations(drop(loadCases(), 'textarea/interaction-disabled-typing')).includes(
      'no shared case proves that a disabled control cannot be typed into',
    ),
  );
  assert.ok(
    textareaCoverageViolations(drop(loadCases(), 'textarea/interaction-readonly-typing')).includes(
      'no shared case proves that a readonly control keeps its value and still takes focus',
    ),
  );
});

test('deleting the emptied or blur cases is caught', () => {
  assert.ok(
    textareaCoverageViolations(drop(loadCases(), 'textarea/interaction-emptied')).includes(
      'no shared case proves that emptying a filled control returns the field to empty',
    ),
  );
  assert.ok(
    textareaCoverageViolations(drop(loadCases(), 'textarea/interaction-blur')).includes(
      'no shared case proves that focus leaves the control without losing the filled state',
    ),
  );
});

test('deleting every carrier of a native attribute is caught', () => {
  for (const [attribute, message] of [
    ['rows', 'no shared case sets an explicit row count'],
    ['readonly', 'no shared case renders a readonly control'],
    ['maxlength', 'no shared case sets a length limit'],
    ['placeholder', 'no shared case sets a placeholder'],
  ]) {
    let eroded = loadCases();
    for (const id of eroded.filter((entry) => entry.attrs?.[attribute] !== undefined).map((entry) => entry.id)) {
      eroded = drop(eroded, id);
    }

    assert.ok(textareaCoverageViolations(eroded).includes(message), `${attribute} can be dropped silently`);
  }

  let eroded = loadCases();
  for (const id of eroded
    .filter((entry) => Object.keys(entry.attrs ?? {}).some((name) => name.startsWith('data-')))
    .map((entry) => entry.id)) {
    eroded = drop(eroded, id);
  }
  assert.ok(textareaCoverageViolations(eroded).includes('no shared case forwards a data attribute'));
});
