// The positive component-ownership proof required by sections 10 and 11 of
// the M22 plan, as evidence rather than as comment.
//
// M15 to M21 proved one direction: a component that owns no control measures
// zero on every case, and a consumer control in a slot is the consumer's. The
// plan's open question was the other direction - can the harness say that a
// component owns *exactly* one control, that it is the historical native
// button, and that a consumer control cannot stand in for it - and every
// static milestone deferred it because no migrated component had one.
//
// VfAccordion has one. What is asserted below, against the real function the
// runner calls, is the list of attacks from section 11:
//
//   A. the expected component button exists           -> PASS
//   B. the component button is removed                 -> FAIL
//   C. a second component button appears               -> FAIL
//   D. the button is replaced by a div with role=button -> FAIL (identity)
//   E. a consumer button beside the component button   -> PASS, separated
//   F. the component button removed, consumer left     -> FAIL
//   G. a consumer button classified as the component's -> FAIL
//   H. the measurement skipped                         -> FAIL CLOSED
//   I. an empty ownership expression                   -> FAIL CLOSED
//   J. count 2 declared and one node counted twice     -> FAIL
//
// F is the one that matters most: the total focusable count is unchanged and a
// count-only measurement would pass.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { OWNERSHIP_SNAPSHOT_FIELDS, controlOwnershipViolations, staticOwnershipViolations } from './extract.mjs';
import { profiles } from './profiles.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/accordion/cases.json'), 'utf8')).cases;
const byId = (id) => cases.find((entry) => entry.id === id);

const profile = profiles.accordion;

/** One component trigger, as the browser expression records it. */
function trigger(overrides = {}) {
  return {
    role: 'trigger',
    tag: 'button',
    type: 'button',
    path: 'section.vf-accordion>button.vf-accordion__trigger',
    expanded: 'false',
    disabled: false,
    focusable: true,
    controls: 'dangling',
    name: 'Billing period',
    ...overrides,
  };
}

/** A snapshot exactly as the browser expression produces it, ownership half only. */
function snapshot({ componentControls = [trigger()], consumerControlCount = 0, interactiveRoleTotal = 0 } = {}) {
  return {
    ownershipPosture: 'component',
    componentControls,
    consumerControlCount,
    focusableTotal: componentControls.length + consumerControlCount,
    interactiveRoleTotal,
  };
}

const plain = byId('accordion/default');
const withConsumer = byId('accordion/consumer-control-open');
const nested = byId('accordion/nested');

test('the fixture cases this proof depends on are still in the shipped catalog', () => {
  assert.equal(plain.componentInteractive, 1);
  assert.equal(withConsumer.componentInteractive, 1);
  assert.equal(withConsumer.consumerInteractive, 1);
  assert.equal(nested.componentInteractive, 2);
  assert.deepEqual(profile.controlOwnership, { trigger: { selector: '.vf-accordion__trigger', tag: 'button' } });
});

// ------------------------------------------------------------- A. the trigger

test('A. the expected component trigger, and nothing else, passes', () => {
  assert.deepEqual(controlOwnershipViolations(plain, snapshot(), profile), []);
});

test('A. a disabled trigger is still the component trigger', () => {
  const disabled = trigger({ disabled: true, focusable: true });
  assert.deepEqual(
    controlOwnershipViolations(byId('accordion/disabled'), snapshot({ componentControls: [disabled] }), profile),
    [],
  );
});

// ------------------------------------------------------------- B. removed

test('B. a missing component trigger fails, even though every target agrees', () => {
  const violations = controlOwnershipViolations(plain, snapshot({ componentControls: [] }), profile);

  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 0 component-owned control\(s\) but the catalog declares 1/);
});

// ------------------------------------------------------------- C. duplicated

test('C. a second component trigger fails', () => {
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: [trigger(), trigger()] }),
    profile,
  );

  assert.match(violations[0], /measured 2 component-owned control\(s\) but the catalog declares 1/);
});

// ------------------------------------------------------------- D. identity

test('D. a div with role=button in place of the trigger fails on identity, not on count', () => {
  const impostor = trigger({ tag: 'div', type: null });
  const violations = controlOwnershipViolations(plain, snapshot({ componentControls: [impostor] }), profile);

  assert.equal(violations.length, 1);
  assert.match(violations[0], /the trigger is a <div>, not the declared <button>/);
  assert.doesNotMatch(violations[0], /declares 1/);
});

test('D. an anchor in place of the trigger fails the same way', () => {
  const link = trigger({ tag: 'a', type: null });
  assert.match(controlOwnershipViolations(plain, snapshot({ componentControls: [link] }), profile)[0], /is a <a>/);
});

// ------------------------------------------------------------- E. consumer

test('E. a consumer button beside the component trigger passes, with the two separated', () => {
  assert.deepEqual(controlOwnershipViolations(withConsumer, snapshot({ consumerControlCount: 1 }), profile), []);
});

test('E. the same consumer button in the closed case measures zero, and a snapshot that still counts it fails', () => {
  const closed = byId('accordion/consumer-control-closed');

  assert.deepEqual(controlOwnershipViolations(closed, snapshot(), profile), []);
  const violations = controlOwnershipViolations(closed, snapshot({ consumerControlCount: 1 }), profile);
  assert.match(violations[0], /measured 1 consumer control\(s\) but the catalog declares 0/);
});

// ------------------------------------------------------------- F. substituted

test('F. the component trigger removed with the consumer button left fails, although the total is unchanged', () => {
  // The count-only gap, closed. focusableTotal is 1 before and after; the
  // ownership evidence has to say the one that remains is not the component's.
  const before = snapshot({ componentControls: [trigger()], consumerControlCount: 0 });
  const after = snapshot({ componentControls: [], consumerControlCount: 1 });
  assert.equal(before.focusableTotal, after.focusableTotal);

  const violations = controlOwnershipViolations(plain, after, profile);
  assert.ok(violations.some((violation) => /measured 0 component-owned/.test(violation)));
  assert.ok(
    violations.some((violation) => /measured 1 consumer control\(s\) but the catalog declares 0/.test(violation)),
  );
});

test('F. in the case that declares a consumer control, removing the trigger still fails while the total stays two minus one', () => {
  const violations = controlOwnershipViolations(
    withConsumer,
    snapshot({ componentControls: [], consumerControlCount: 1 }),
    profile,
  );
  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 0 component-owned control\(s\) but the catalog declares 1/);
});

// ------------------------------------------------------------- G. misclassified

test("G. a consumer button classified as the component's fails on both counts", () => {
  const violations = controlOwnershipViolations(
    withConsumer,
    snapshot({ componentControls: [trigger(), trigger({ name: 'Retry', controls: 'none' })], consumerControlCount: 0 }),
    profile,
  );
  assert.ok(violations.some((violation) => /measured 2 component-owned/.test(violation)));
  assert.ok(
    violations.some((violation) => /measured 0 consumer control\(s\) but the catalog declares 1/.test(violation)),
  );
});

test("G. the component trigger classified as the consumer's fails on both counts too", () => {
  const violations = controlOwnershipViolations(
    withConsumer,
    snapshot({ componentControls: [], consumerControlCount: 2 }),
    profile,
  );
  assert.ok(violations.some((violation) => /measured 0 component-owned/.test(violation)));
  assert.ok(
    violations.some((violation) => /measured 2 consumer control\(s\) but the catalog declares 1/.test(violation)),
  );
});

// ------------------------------------------------------------- H. skipped

test('H. a skipped measurement fails closed, in every shape a skip can take', () => {
  assert.match(controlOwnershipViolations(plain, undefined, profile)[0], /produced no ownership snapshot at all/);
  assert.match(controlOwnershipViolations(plain, {}, profile)[0], /is missing \[ownershipPosture/);

  for (const field of OWNERSHIP_SNAPSHOT_FIELDS) {
    const partial = snapshot();
    delete partial[field];
    assert.match(controlOwnershipViolations(plain, partial, profile)[0], new RegExp(`missing \\[.*${field}`), field);
  }

  const wrongPosture = { ...snapshot(), ownershipPosture: 'none' };
  assert.match(controlOwnershipViolations(plain, wrongPosture, profile)[0], /posture="none"/);
});

test('H. a case that declares no component budget fails rather than defaulting to zero', () => {
  const undeclared = { ...plain, componentInteractive: undefined };
  const violations = controlOwnershipViolations(undeclared, snapshot(), profile);

  assert.match(violations[0], /declares no componentInteractive budget/);
});

// ------------------------------------------------------------- I. empty expression

test('I. an empty ownership expression fails closed', () => {
  for (const controlOwnership of [{}, undefined, null]) {
    const violations = controlOwnershipViolations(plain, snapshot(), { ...profile, controlOwnership });
    assert.equal(violations.length, 1);
    assert.match(violations[0], /declares no component-owned control/);
  }
});

test('I. a role declared without a selector or without a tag fails closed', () => {
  for (const rule of [{ selector: '.vf-accordion__trigger' }, { tag: 'button' }, { selector: '', tag: 'button' }]) {
    const violations = controlOwnershipViolations(plain, snapshot(), {
      ...profile,
      controlOwnership: { trigger: rule },
    });
    assert.match(violations[0], /without a selector and a tag/);
  }
});

// ------------------------------------------------------------- J. double count

test('J. the same node counted twice fails, even when the declared count is two', () => {
  // The nested case declares two triggers. A measurement that found one node
  // and listed it twice satisfies the count and breaks the total: the plain
  // focusable count still sees one element.
  const doubled = {
    ...snapshot({ componentControls: [trigger(), trigger()] }),
    focusableTotal: 1,
  };
  const violations = controlOwnershipViolations(nested, doubled, profile);

  assert.equal(violations.length, 1);
  assert.match(violations[0], /do not add up/);
});

test("J. a node counted as both the component's and the consumer's fails the same equation", () => {
  const both = { ...snapshot({ consumerControlCount: 1 }), focusableTotal: 1 };
  const violations = controlOwnershipViolations(withConsumer, both, profile);

  assert.match(violations[0], /do not add up/);
});

// ------------------------------------------------------------- roles & scenarios

test('an explicit interactive role fails: the historical trigger needs none', () => {
  const violations = controlOwnershipViolations(plain, snapshot({ interactiveRoleTotal: 1 }), profile);

  assert.match(violations[0], /explicit interactive role/);
});

test('a control with a role the profile does not declare fails', () => {
  const stranger = trigger({ role: 'dismiss' });
  const violations = controlOwnershipViolations(plain, snapshot({ componentControls: [stranger] }), profile);

  assert.match(violations[0], /role \[dismiss\] the profile does not declare/);
});

test('a scenario budget overrides the case budget after the gesture', () => {
  // accordion/interaction-consumer-control-appears: zero before, one after.
  const scenario = byId('accordion/interaction-consumer-control-appears');
  assert.equal(scenario.consumerInteractive, 0);
  assert.equal(scenario.interaction.consumerInteractive, 1);

  assert.deepEqual(controlOwnershipViolations(scenario, snapshot(), profile), []);
  assert.deepEqual(
    controlOwnershipViolations(scenario, snapshot({ consumerControlCount: 1 }), profile, { consumerInteractive: 1 }),
    [],
  );
  assert.match(
    controlOwnershipViolations(scenario, snapshot(), profile, { consumerInteractive: 1 })[0],
    /measured 0 consumer control\(s\) but the catalog declares 1/,
  );
});

// ------------------------------------------------------------- the static rule

test('the static rule is unchanged: a zero-budget component still fails on a single focusable', () => {
  // M15/M16 must keep proving their direction with the function they always
  // used; M22 added beside it, not inside it.
  const violations = staticOwnershipViolations(
    { id: 'skeleton/default' },
    {
      interactionPosture: 'none',
      caseRendered: true,
      focusRole: 'outside-case',
      focusableCount: 1,
      interactiveRoleCount: 0,
    },
  );
  assert.equal(violations.length, 1);
  assert.match(violations[0], /declares 0 consumer-provided control/);
});

test('every shipped accordion case passes with the snapshot its declarations describe', () => {
  for (const entry of cases) {
    const controls = Array.from({ length: entry.componentInteractive }, () => trigger());
    assert.deepEqual(
      controlOwnershipViolations(
        entry,
        snapshot({ componentControls: controls, consumerControlCount: entry.consumerInteractive ?? 0 }),
        profile,
      ),
      [],
      entry.id,
    );
  }
});

test('only the accordion, the stepper, the tabs, the link, the breadcrumbs, the menu item, the dropdown, the group box and the popover declare component-owned controls, and none of the static ones can', () => {
  const owning = Object.values(profiles).filter((entry) => entry.controlOwnership !== undefined);
  assert.deepEqual(
    owning.map((entry) => entry.id),
    ['accordion', 'stepper', 'tabs', 'link', 'breadcrumbs', 'menuItem', 'dropdown', 'group-box', 'popover'],
  );
  for (const entry of Object.values(profiles)) {
    assert.ok(!(entry.staticOwnership && entry.controlOwnership), `${entry.id} declares both ownership models`);
  }
});

test('the menu declares no owned control, because it owns none', () => {
  // The other half of the M27 pair, and the reason the two are separate
  // profiles. VfMenu renders no button and no anchor: what a menu holds is
  // VfMenuItem's or the consumer's, and a controlOwnership rule here would be
  // the menu claiming credit for a control it does not render. Its evidence is
  // the static posture, where every focusable element is measured against the
  // number the catalog declares the consumer put there.
  assert.equal(profiles.menu.controlOwnership, undefined);
  assert.equal(profiles.menu.snapshot, 'static');
  assert.notEqual(profiles.menuItem.controlOwnership, undefined);
  assert.notEqual(profiles.menuItem.snapshot, 'static');
});
