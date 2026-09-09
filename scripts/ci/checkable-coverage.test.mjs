// The three checkable catalogs cannot quietly shrink, and padding cannot hide it.
//
// Each component is attacked on its own, and one attack in each pair is the
// batch-specific one: erode the state that only this component has. A batch is
// the easiest place for evidence to thin out, because three catalogs that each
// look plausible can collectively stop proving anything the others cover.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  checkboxCoverageViolations,
  radioCoverageViolations,
  switchCoverageViolations,
} from './checkable-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOORS = { checkbox: 24, radio: 21, switch: 22 };
const GUARDS = {
  checkbox: checkboxCoverageViolations,
  radio: radioCoverageViolations,
  switch: switchCoverageViolations,
};

/** Cases that satisfy nothing: a bare control with no state and no scenario. */
function padding(component, count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `${component}/padding-${index}`,
    title: `padding ${index}`,
    props: component === 'radio' ? { value: 'padding' } : {},
    attrs: {},
  }));
}

/** Removes every case matching `predicate`, asserting at least one was there. */
function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return remaining;
}

for (const component of ['checkbox', 'radio', 'switch']) {
  test(`the shipped ${component} catalog is fully covered`, () => {
    assert.deepEqual(GUARDS[component](load(component)), []);
  });

  test(`the ${component} catalog keeps a count floor as secondary protection`, () => {
    assert.ok(load(component).length >= FLOORS[component], `the ${component} catalog shrank`);
  });

  test(`every ${component} case id is unique and namespaced`, () => {
    const ids = load(component).map((entry) => entry.id);

    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(
      ids.filter((id) => !id.startsWith(`${component}/`)),
      [],
    );
  });

  test(`deleting the ${component} pointer proof is caught, and padding cannot hide it`, () => {
    const eroded = [
      ...dropAll(
        load(component),
        (entry) =>
          (entry.interaction?.steps ?? []).some((step) => step.action === 'clickCheckable') &&
          entry.interaction?.expect?.liveChecked === true,
        'proves a pointer click checks the control',
      ),
      ...padding(component, 6),
    ];

    // The count floor is satisfied, so if the semantic rules do not fire,
    // nothing does.
    assert.ok(eroded.length >= FLOORS[component], 'the attack no longer clears the count floor');
    assert.ok(
      GUARDS[component](eroded).includes(
        `no shared ${component} case proves that a real pointer click checks the control`,
      ),
      'padding hid the removal of the pointer proof',
    );
  });
}

test('deleting every indeterminate case is caught, and padding cannot hide it', () => {
  // The checkbox-only attack: indeterminate is the state no other checkable
  // control has, and a catalog without it still renders perfectly good
  // checkboxes.
  const eroded = [
    ...dropAll(load('checkbox'), (entry) => entry.props?.indeterminate === true, 'is indeterminate'),
    ...padding('checkbox', 8),
  ];

  assert.ok(eroded.length >= FLOORS.checkbox);
  const violations = checkboxCoverageViolations(eroded);
  assert.ok(violations.includes('no shared case renders an indeterminate checkbox'));
  assert.ok(violations.includes('no shared checkbox case proves that clicking an indeterminate box resolves it'));
});

test('deleting every radio group is caught, and padding cannot hide it', () => {
  // The radio-only attack: mutual exclusion is a property of a group, so a
  // catalog of lone radios proves nothing about the contract that matters.
  const eroded = [
    ...dropAll(load('radio'), (entry) => Array.isArray(entry.group), 'renders a group'),
    ...padding('radio', 8),
  ];

  assert.ok(eroded.length >= FLOORS.radio);
  const violations = radioCoverageViolations(eroded);
  assert.ok(violations.includes('no shared radio case renders a real group, so mutual exclusion is never compared'));
  assert.ok(violations.includes('no shared radio case proves that choosing one member unselects the others'));
});

test('deleting the switch-only presentation cases is caught, and padding cannot hide it', () => {
  // The switch-only attack: static and thumb contrast exist on no other
  // checkable control, and a catalog without them still renders switches.
  const eroded = [
    ...dropAll(
      load('switch'),
      (entry) => entry.props?.static === true || (entry.props?.thumbContrast ?? 'auto') !== 'auto',
      'renders a switch-only presentation prop',
    ),
    ...padding('switch', 8),
  ];

  assert.ok(eroded.length >= FLOORS.switch);
  const violations = switchCoverageViolations(eroded);
  assert.ok(violations.includes('no shared case renders the static presentation'));
  assert.ok(violations.includes('no shared case renders a non-auto thumb contrast'));
});

test('deleting the whitespace-slot case is caught, because it is the only VNode-walk proof', () => {
  const eroded = dropAll(
    load('switch'),
    (entry) => typeof entry.content?.label === 'string' && entry.content.label.trim() === '',
    'renders a whitespace-only slot',
  );

  assert.ok(
    switchCoverageViolations(eroded).includes(
      'no shared case renders a whitespace-only slot, so the content rule is never compared',
    ),
  );
});

test('deleting the strict-comparison case is caught', () => {
  const eroded = dropAll(load('radio'), (entry) => entry.id === 'radio/strict-mismatch', 'proves strict comparison');

  assert.ok(
    radioCoverageViolations(eroded).includes(
      'no shared case proves the selection comparison is strict rather than loose',
    ),
  );
});

test('a scenario that drops its declared outcome stops counting as coverage', () => {
  // Stripped from every carrier, not one: more than one case proves this rule,
  // so removing a single outcome leaves the coverage intact - which is the
  // guard being precise rather than lenient.
  const eroded = load('checkbox');
  const stripped = eroded.filter(
    (entry) =>
      (entry.interaction?.steps ?? []).some((step) => step.action === 'clickCheckable') &&
      entry.interaction?.expect?.liveChecked === true,
  );
  assert.ok(stripped.length > 0, 'no case proves the pointer rule');
  for (const entry of stripped) delete entry.interaction.expect;

  const violations = checkboxCoverageViolations(eroded);
  for (const entry of stripped) {
    assert.ok(violations.includes(`${entry.id} drives the component but declares no expected outcome`));
  }
  assert.ok(violations.includes('no shared checkbox case proves that a real pointer click checks the control'));
});

test('one catalog cannot cover for another', () => {
  // Batch isolation attack D, at the coverage level: erode the checkbox
  // catalog and pad the switch one. The checkbox still fails, and the switch
  // stays clean, so the two are audited independently.
  const erodedCheckbox = dropAll(load('checkbox'), (entry) => entry.props?.indeterminate === true, 'is indeterminate');
  const paddedSwitch = [...load('switch'), ...padding('switch', 12)];

  assert.ok(checkboxCoverageViolations(erodedCheckbox).length > 0, 'the eroded checkbox catalog passed');
  assert.deepEqual(switchCoverageViolations(paddedSwitch), [], 'padding the switch catalog broke it');
});
