// The M28 ownership proof: a component that owns one control per instance - a
// trigger wrapper with no role - while every item in its menu is the
// consumer's, and those items carry an explicit interactive role.
//
// Before M28 the explicit-role total had one reading: the number of owned
// controls whose rule declares a role. For the dropdown that is zero, and the
// reference itself failed it - `dropdown/open measured 3 element(s) carrying
// an explicit interactive role` on the first capture of the correct render,
// because the consumer's role=menuitem buttons are in the case. Declaring the
// items as the component's would have made the equation pass by claiming
// controls the component does not own. The rule instead reads a second budget
// the case declares - its consumer roles - and the total must equal the two
// added. What is asserted here, against the real function the runner calls:
//
//   A. the shipped catalog's numbers pass with the menu open and closed;
//   B. consumer roles measured but not declared                 -> FAIL
//   C. consumer roles declared but not measured                 -> FAIL
//   D. a role grown on the trigger, consumer roles unchanged     -> FAIL
//   E. the role moved from an item to the trigger, total equal   -> FAIL on
//      identity? No - on the trigger's own record: the ariaRole field of the
//      component control, compared three ways; the equation alone cannot see
//      it, which is the limit recorded here and closed by the reference
//      direction on ownership.controls;
//   F. the scenario's own budget overrides the case's, as for controls;
//   G. a profile that declares no consumer roles keeps the pre-M28 rule;
//   H. the generic rule names no dropdown, menu or menuitem.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { controlOwnershipViolations } from './extract.mjs';
import { profiles } from './profiles.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/dropdown/cases.json'), 'utf8')).cases;
const byId = (id) => cases.find((entry) => entry.id === id);
const profile = profiles.dropdown;

function trigger(overrides = {}) {
  return {
    role: 'trigger',
    tag: 'div',
    ariaRole: null,
    expanded: 'false',
    hasPopup: 'menu',
    ariaDisabled: null,
    tabindex: '0',
    focusable: true,
    name: 'Actions',
    ...overrides,
  };
}

function snapshot({ controls = [trigger()], consumer = 0, roles = 0 } = {}) {
  return {
    ownershipPosture: 'component',
    componentControls: controls,
    consumerControlCount: consumer,
    focusableTotal: controls.length + consumer,
    interactiveRoleTotal: roles,
  };
}

const open = byId('dropdown/open');
const closed = byId('dropdown/default');
const clickOpen = byId('dropdown/interaction-click-open');

test('A: the shipped numbers pass, open and closed', () => {
  assert.equal(open.consumerInteractiveRoles, 3);
  assert.deepEqual(
    controlOwnershipViolations(
      open,
      snapshot({ controls: [trigger({ expanded: 'true' })], consumer: 3, roles: 3 }),
      profile,
    ),
    [],
  );
  assert.deepEqual(controlOwnershipViolations(closed, snapshot(), profile), []);
});

test('B: consumer roles measured but not declared fail', () => {
  const undeclared = { ...open, consumerInteractiveRoles: undefined };
  const violations = controlOwnershipViolations(undeclared, snapshot({ consumer: 3, roles: 3 }), profile);
  assert.ok(
    violations.some((violation) => violation.includes('carrying an explicit interactive role')),
    violations.join('\n'),
  );
});

test('C: consumer roles declared but not measured fail', () => {
  const violations = controlOwnershipViolations(open, snapshot({ consumer: 3, roles: 0 }), profile);
  assert.ok(violations.some((violation) => violation.includes('carrying an explicit interactive role')));
});

test('D: a role grown on the trigger fails although the consumer roles are right', () => {
  const violations = controlOwnershipViolations(
    open,
    snapshot({ controls: [trigger({ ariaRole: 'button' })], consumer: 3, roles: 4 }),
    profile,
  );
  assert.ok(violations.some((violation) => violation.includes('carrying an explicit interactive role')));
});

test("E: a role moved from an item to the trigger keeps the equation, and is the trigger record's to show", () => {
  // The limit, recorded rather than hidden: two items with a role and a
  // trigger with one add up to the declared three. The equation passes; what
  // fails is the trigger's own record, whose ariaRole the comparator reads on
  // ownership.controls against the reference's null.
  const moved = snapshot({ controls: [trigger({ ariaRole: 'menuitem' })], consumer: 3, roles: 3 });
  assert.deepEqual(controlOwnershipViolations(open, moved, profile), []);
  assert.equal(moved.componentControls[0].ariaRole, 'menuitem');
});

test("F: the scenario's own budget overrides the case's", () => {
  assert.equal(clickOpen.consumerInteractiveRoles, 0);
  assert.equal(clickOpen.interaction.consumerInteractiveRoles, 3);
  const after = snapshot({ controls: [trigger({ expanded: 'true' })], consumer: 3, roles: 3 });
  assert.ok(controlOwnershipViolations(clickOpen, after, profile).length > 0);
  assert.deepEqual(
    controlOwnershipViolations(clickOpen, after, profile, {
      consumerInteractive: clickOpen.interaction.consumerInteractive,
      consumerInteractiveRoles: clickOpen.interaction.consumerInteractiveRoles,
    }),
    [],
  );
});

test('G: a profile whose cases declare no consumer roles keeps the pre-M28 rule', () => {
  const accordion = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/accordion/cases.json'), 'utf8')).cases;
  const plain = accordion.find((entry) => entry.id === 'accordion/default');
  const measured = {
    ownershipPosture: 'component',
    componentControls: [{ role: 'trigger', tag: 'button', name: 'x' }],
    consumerControlCount: 0,
    focusableTotal: 1,
    interactiveRoleTotal: 1,
  };
  assert.ok(
    controlOwnershipViolations(plain, measured, profiles.accordion).some((violation) =>
      violation.includes('carrying an explicit interactive role'),
    ),
  );
});

test('H: the generic rule names no dropdown, menu or menuitem', () => {
  const source = readFileSync(resolve(repositoryRoot, 'scripts/parity/extract.mjs'), 'utf8');
  const start = source.indexOf('const OWNERSHIP_CHECKS = [');
  const end = source.indexOf('function accordionInteractionExpression');
  const region = source.slice(start, end);
  for (const word of ['dropdown', 'VfDropdown', 'menuitem', 'role="menu', 'teleport']) {
    assert.ok(!region.includes(word), `the generic ownership rule mentions ${word}`);
  }
});
