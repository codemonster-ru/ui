// The scenario-level owned-control budget (M30), against the real function the
// runner calls.
//
// Until M30 a scenario could declare the consumer counts it ends with, but the
// component's own count was the case's, fixed. Every earlier owning component
// renders the same controls before and after its gestures - a trigger stays a
// trigger, a tab panel is patched, not removed. VfPopover owns its panel, a
// section[role=dialog][tabindex=-1] that takes focus, and the panel exists only
// while open: a click that opens it ends with two owned controls where the
// closed case declared one. Reproduced below on the unmodified rule - the
// reference itself fails the ownership assertion.
//
// The budget is the same kind of declaration as the consumer's: explicit, on
// the scenario, never inferred from what was measured. What is asserted:
//
//   - the refusal it removes, reproduced with the override absent;
//   - a declared count must be exactly met - an extra control and a missing
//     one both fail, and so does a count that merely matches the case;
//   - a malformed declaration fails closed rather than falling back;
//   - the identity rows and the totals equation are not weakened by it;
//   - every existing profile is untouched: none of its scenarios declares the
//     field, and an absent field gives exactly the old result.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { controlOwnershipViolations } from './extract.mjs';
import { profiles } from './profiles.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = (name) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${name}/cases.json`), 'utf8')).cases;
const popoverCases = catalog('popover');
const clickOpen = popoverCases.find((entry) => entry.id === 'popover/interaction-click-open');
const profile = profiles.popover;

const trigger = { role: 'trigger', tag: 'div', ariaRole: null, tabindex: '0', focusable: true, name: 'Details' };
const panel = { role: 'panel', tag: 'section', ariaRole: 'dialog', tabindex: '-1', focusable: true, name: 'Invite' };

/** The ownership half of a snapshot after the click-open scenario: trigger, panel, one consumer button. */
function openSnapshot({ controls = [trigger, panel], consumer = 1, roles = 0 } = {}) {
  return {
    ownershipPosture: 'component',
    componentControls: controls,
    consumerControlCount: consumer,
    focusableTotal: controls.length + consumer,
    interactiveRoleTotal: roles,
  };
}

const scenarioBudget = (entry) => ({
  componentInteractive: entry.interaction.componentInteractive,
  consumerInteractive: entry.interaction.consumerInteractive,
  consumerInteractiveRoles: entry.interaction.consumerInteractiveRoles,
});

test('the catalog declares the budget the open scenario ends with', () => {
  assert.equal(clickOpen.componentInteractive, 1);
  assert.equal(clickOpen.interaction.componentInteractive, 2);
});

test('reproduction: without the scenario budget the reference open fails the ownership assertion', () => {
  const violations = controlOwnershipViolations(clickOpen, openSnapshot(), profile, {
    consumerInteractive: clickOpen.interaction.consumerInteractive,
    consumerInteractiveRoles: clickOpen.interaction.consumerInteractiveRoles,
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 2 component-owned control\(s\) but the catalog declares 1/);
});

test('with the declared budget the same measurement passes', () => {
  assert.deepEqual(controlOwnershipViolations(clickOpen, openSnapshot(), profile, scenarioBudget(clickOpen)), []);
});

test('an undeclared extra component control fails against the scenario budget', () => {
  const extra = openSnapshot({ controls: [trigger, panel, { ...panel, name: 'Second' }] });
  const violations = controlOwnershipViolations(clickOpen, extra, profile, scenarioBudget(clickOpen));
  assert.ok(violations.some((line) => /measured 3 component-owned control\(s\) but the catalog declares 2/.test(line)));
});

test('a missing expected component control fails against the scenario budget', () => {
  const missing = openSnapshot({ controls: [trigger], consumer: 2 });
  const violations = controlOwnershipViolations(clickOpen, missing, profile, scenarioBudget(clickOpen));
  assert.ok(violations.some((line) => /measured 1 component-owned control\(s\) but the catalog declares 2/.test(line)));
});

test('the budget is a count, not a licence: a panel of the wrong tag still fails its identity row', () => {
  const div = openSnapshot({ controls: [trigger, { ...panel, tag: 'div' }] });
  const violations = controlOwnershipViolations(clickOpen, div, profile, scenarioBudget(clickOpen));
  assert.ok(violations.some((line) => /the panel is a <div>, not the declared <section>/.test(line)));
});

test('the totals equation still holds: a node counted twice fails whatever the budget says', () => {
  const twice = { ...openSnapshot(), focusableTotal: 4 };
  const violations = controlOwnershipViolations(clickOpen, twice, profile, scenarioBudget(clickOpen));
  assert.ok(violations.some((line) => /do not add up/.test(line)));
});

test('a malformed declaration fails closed instead of falling back to the case', () => {
  for (const malformed of [null, '2', 1.5, Number.NaN]) {
    const violations = controlOwnershipViolations(clickOpen, openSnapshot(), profile, {
      ...scenarioBudget(clickOpen),
      componentInteractive: malformed,
    });
    assert.ok(
      violations.some((line) => /declares no componentInteractive budget/.test(line)),
      `${String(malformed)} was accepted`,
    );
  }
});

test('an absent declaration is exactly the old rule for every existing owning profile', () => {
  // The popover (M30), the select (M32) and the nav menu (M33) are the
  // catalogs that declare a scenario's end count; every other owning catalog
  // passes undefined.
  const owning = Object.entries(profiles).filter(
    ([id, entry]) => entry.controlOwnership && id !== 'popover' && id !== 'select' && id !== 'nav-menu',
  );
  assert.ok(owning.length >= 8);
  for (const [id, entry] of owning) {
    for (const parityCase of catalog(entry.component)) {
      // No earlier catalog declares the field: the runner passes undefined.
      assert.equal(parityCase.interaction?.componentInteractive, undefined, `${parityCase.id} declares a budget`);
      if (!parityCase.interaction) continue;
      const measured = {
        ownershipPosture: 'component',
        componentControls: [],
        consumerControlCount: parityCase.interaction.consumerInteractive ?? 0,
        focusableTotal: parityCase.interaction.consumerInteractive ?? 0,
        interactiveRoleTotal: parityCase.interaction.consumerInteractiveRoles ?? 0,
      };
      const budget = {
        consumerInteractive: parityCase.interaction.consumerInteractive,
        consumerInteractiveRoles: parityCase.interaction.consumerInteractiveRoles,
      };
      assert.deepEqual(
        controlOwnershipViolations(parityCase, measured, entry, { ...budget, componentInteractive: undefined }),
        controlOwnershipViolations(parityCase, measured, entry, budget),
        `${id}: ${parityCase.id}`,
      );
    }
  }
});

test('every popover scenario that opens or closes a panel declares the count it ends with', () => {
  for (const entry of popoverCases.filter((parityCase) => parityCase.interaction)) {
    const declared = entry.interaction.componentInteractive ?? entry.componentInteractive;
    assert.ok(Number.isInteger(declared), entry.id);
    assert.ok(declared >= entry.componentInteractive - 1 && declared <= entry.componentInteractive * 2, entry.id);
  }
});

test('every select scenario declares the count it ends with (M32)', () => {
  const selectCases = catalog('select');
  const scenarios = selectCases.filter((parityCase) => parityCase.interaction);
  assert.ok(scenarios.length > 0);
  for (const entry of scenarios) {
    assert.ok(Number.isInteger(entry.interaction.componentInteractive), entry.id);
    assert.ok(Number.isInteger(entry.interaction.consumerInteractive), entry.id);
  }
});

test('every nav menu scenario declares the count it ends with (M33)', () => {
  // A toggle renders or removes a subtree of owned controls, so every
  // scenario declares its own end count, derived from the visible tree.
  const scenarios = catalog('nav-menu').filter((parityCase) => parityCase.interaction);
  assert.ok(scenarios.length > 0);
  for (const entry of scenarios) {
    assert.ok(Number.isInteger(entry.interaction.componentInteractive), entry.id);
    assert.equal(entry.interaction.consumerInteractive, 0, entry.id);
  }
});
