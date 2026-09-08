// The VfField catalog cannot quietly shrink, and padding cannot hide it.
//
// Same asymmetry as the other catalogs: adding cases is always fine, removing
// one has to be a deliberate edit here, where a reviewer sees the coverage
// claim it breaks. The attacks are the M10.1 ones re-run against a component
// whose contract is mostly relationships, because that is what a padded catalog
// hides best - thirty cases that all render a label prove nothing about whether
// any label reaches its control.
//
// Every attack asserts the mutation landed and names the rule that should fire.
// None of them assert on case count: the floor is secondary protection, and a
// failure that is only about counting is not evidence the semantic rules work.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { fieldCoverageViolations } from './field-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/field/cases.json'), 'utf8'));
const loadCases = () => JSON.parse(JSON.stringify(catalog.cases));
const FLOOR = 33;

const byId = (cases, id) => cases.find((entry) => entry.id === id);

/** Removes a case, asserting it was actually there to remove. */
function drop(cases, id) {
  const remaining = cases.filter((entry) => entry.id !== id);
  assert.equal(remaining.length, cases.length - 1, `attack did not apply: ${id} was not in the catalog`);

  return remaining;
}

/** Cases that satisfy nothing: a bare labelled field with no relationships. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `field/padding-${index}`,
    title: `padding ${index}`,
    field: { label: 'Padding' },
    control: {},
  }));
}

test('the shipped catalog is fully covered', () => {
  assert.deepEqual(fieldCoverageViolations(loadCases()), []);
});

test('the catalog keeps a case count floor as secondary protection', () => {
  assert.ok(catalog.cases.length >= FLOOR, `the field catalog fell to ${catalog.cases.length} cases`);
});

test('every case id is unique and namespaced to the component', () => {
  const ids = catalog.cases.map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length, 'the field catalog has duplicate case ids');
  assert.deepEqual(
    ids.filter((id) => !id.startsWith('field/')),
    [],
    'the field catalog has case ids outside its namespace',
  );
});

test('deleting the label click case is caught, and padding cannot hide it', () => {
  const eroded = [...drop(loadCases(), 'field/interaction-label-click'), ...padding(4)];

  // The exact shape of the M10.1 silent pass: the count floor is satisfied, so
  // if the semantic rules do not fire, nothing does.
  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  assert.ok(
    fieldCoverageViolations(eroded).includes('no shared case proves that clicking a top label focuses its control'),
    'padding hid the removal of the label/control association proof',
  );
});

test('deleting the floating cases is caught, and padding cannot hide it', () => {
  let eroded = loadCases();
  for (const id of eroded.filter((entry) => entry.field?.placement === 'floating').map((entry) => entry.id)) {
    eroded = drop(eroded, id);
  }
  eroded = [...eroded, ...padding(12)];

  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  const violations = fieldCoverageViolations(eroded);
  assert.ok(violations.includes('no shared case renders a floating label'));
  assert.ok(violations.includes('no shared case asks for a floating label without supplying one'));
  assert.ok(
    violations.includes(
      'no shared case proves that typing fills a floating field, which is what the floating label depends on',
    ),
  );
});

test('deleting the description association case is caught, and padding cannot hide it', () => {
  let eroded = loadCases();
  for (const id of eroded.filter((entry) => entry.field?.description !== undefined).map((entry) => entry.id)) {
    eroded = drop(eroded, id);
  }
  eroded = [...eroded, ...padding(6)];

  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  const violations = fieldCoverageViolations(eroded);
  assert.ok(violations.includes('no shared case renders a description'));
  assert.ok(
    violations.includes(
      'no shared case renders a description and an error together, which is the only case that proves their order',
    ),
  );
});

test('a scenario that drops its declared outcome stops counting as coverage', () => {
  const eroded = loadCases();
  const target = byId(eroded, 'field/interaction-type-fills');
  assert.equal(target.interaction.expect.filled, true, 'the case under attack does not claim it fills');
  delete target.interaction.expect;

  const violations = fieldCoverageViolations(eroded);
  assert.ok(
    violations.includes('field/interaction-type-fills drives the component but declares no expected outcome'),
    'a scenario with no declared outcome was accepted',
  );
  assert.ok(
    violations.includes(
      'no shared case proves that typing fills a floating field, which is what the floating label depends on',
    ),
    'an outcome-less case still counted as filled coverage',
  );
});

test('inverting a declared outcome stops it counting as coverage', () => {
  const eroded = loadCases();
  byId(eroded, 'field/interaction-label-click').interaction.expect.focusRole = 'body';

  assert.ok(
    fieldCoverageViolations(eroded).includes('no shared case proves that clicking a top label focuses its control'),
    'a label click expecting no focus still counted as association coverage',
  );
});

test('replacing a relationship case with a plain one is caught', () => {
  // The M10.1 substitution attack: keep the gesture, lose the proof. Here the
  // label click survives but only on a floating field, so the top-label edge is
  // no longer proved by anything.
  const eroded = drop(loadCases(), 'field/interaction-label-click');

  assert.ok(byId(eroded, 'field/interaction-floating-label-click'), 'the attack removed the wrong case');
  assert.ok(
    fieldCoverageViolations(eroded).includes('no shared case proves that clicking a top label focuses its control'),
    'a floating label click stood in for the top one',
  );
});

test('deleting the required or the consumer-attribute cases is caught', () => {
  for (const [id, message] of [
    ['field/top-label-required', 'no shared case renders the required marker'],
    ['field/consumer-class', 'no shared case forwards a consumer class to the field root'],
    ['field/consumer-data', 'no shared case forwards a consumer data attribute to the field root'],
    ['field/disabled', 'no shared case renders a disabled control'],
  ]) {
    let eroded = loadCases();
    // Required appears on more than one case, so remove every carrier.
    if (id === 'field/top-label-required') {
      for (const carrier of eroded.filter((entry) => entry.field?.required === true).map((entry) => entry.id)) {
        eroded = drop(eroded, carrier);
      }
    } else {
      eroded = drop(eroded, id);
    }

    assert.ok(fieldCoverageViolations(eroded).includes(message), `${id} can be deleted silently`);
  }
});
