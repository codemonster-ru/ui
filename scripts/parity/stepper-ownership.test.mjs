// The multi-control ownership proof required by sections 9 and 10 of the M23
// plan, as evidence rather than as comment.
//
// M22 proved that the harness can say a component owns *exactly one* control
// and that it is the historical native button. VfStepper is the first migrated
// component whose one instance owns several controls of the same role, and
// the open question was whether the same generic assertion - a role, a
// selector, a tag, a budget from the case, and the equation of totals - says
// as much about N buttons as it said about one, without learning what a step
// is. What is asserted below, against the real function the runner calls, is
// the list of attacks from section 10:
//
//   A. one trigger removed, total focusable count unchanged    -> FAIL
//   B. one trigger replaced by a div with role=button           -> FAIL (identity)
//   C. one extra .vf-stepper__trigger                            -> FAIL
//   D. the same trigger counted twice                           -> FAIL (equation)
//   E. an unrelated button included in the owned count          -> FAIL
//   F. a disabled trigger excluded from the component's identity -> FAIL
//   G. items.length as a blind expected count                   -> FAIL (catalog)
//   H. the ownership extraction skipped                         -> FAIL CLOSED
//   I. an empty ownership object                                -> FAIL CLOSED
//   J. the right count with the wrong tag identity              -> FAIL
//
// A is the one that matters most for a component with a neighbouring consumer
// control: the focusable total is unchanged and a count-only measurement
// would pass. F is the one that matters most for a component with disabled
// members: the reference keeps a disabled trigger in the DOM as its own, and
// a measurement that dropped it would agree with a port that dropped it too.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { controlOwnershipViolations } from './extract.mjs';
import { profiles } from './profiles.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/stepper/cases.json'), 'utf8')).cases;
const byId = (id) => cases.find((entry) => entry.id === id);

const profile = profiles.stepper;

/** One component trigger, as the browser expression records it. */
function trigger(value, overrides = {}) {
  return {
    role: 'trigger',
    tag: 'button',
    type: 'button',
    path: 'nav.vf-stepper>ol.vf-stepper__list>li.vf-stepper__item>button.vf-stepper__trigger',
    value,
    current: value === 'account' ? 'step' : null,
    currentClass: value === 'account',
    disabled: false,
    focusable: true,
    name: value,
    ...overrides,
  };
}

const three = () => [trigger('account'), trigger('profile'), trigger('confirm')];

/** A snapshot exactly as the browser expression produces it, ownership half only. */
function snapshot({
  componentControls = three(),
  consumerControlCount = 0,
  focusableTotal,
  interactiveRoleTotal = 0,
} = {}) {
  return {
    ownershipPosture: 'component',
    componentControls,
    consumerControlCount,
    focusableTotal: focusableTotal ?? componentControls.length + consumerControlCount,
    interactiveRoleTotal,
  };
}

const plain = byId('stepper/default');
const beside = byId('stepper/beside-consumer-button');
const disabledMiddle = byId('stepper/disabled-middle');
const empty = byId('stepper/empty-items');
const siblings = byId('stepper/siblings');

test('the fixture cases this proof depends on are still in the shipped catalog', () => {
  assert.equal(plain.componentInteractive, 3);
  assert.equal(beside.componentInteractive, 3);
  assert.equal(beside.consumerInteractive, 1);
  assert.equal(disabledMiddle.componentInteractive, 3);
  assert.equal(empty.componentInteractive, 0);
  assert.equal(siblings.componentInteractive, 5);
  assert.deepEqual(profile.controlOwnership, { trigger: { selector: '.vf-stepper__trigger', tag: 'button' } });
});

test('three triggers, and nothing else, pass', () => {
  assert.deepEqual(controlOwnershipViolations(plain, snapshot(), profile), []);
});

test('a disabled trigger is still the component trigger', () => {
  const controls = [trigger('account'), trigger('profile', { disabled: true }), trigger('confirm')];
  assert.deepEqual(controlOwnershipViolations(disabledMiddle, snapshot({ componentControls: controls }), profile), []);
});

test('an empty list measures zero component controls and passes against a budget of zero', () => {
  assert.deepEqual(controlOwnershipViolations(empty, snapshot({ componentControls: [] }), profile), []);
  // And a budget of zero is not a free pass: one trigger where none is declared fails.
  assert.match(
    controlOwnershipViolations(empty, snapshot({ componentControls: [trigger('a')] }), profile)[0],
    /measured 1 component-owned control\(s\) but the catalog declares 0/,
  );
});

test('two instances owning five triggers between them pass against the summed budget', () => {
  const controls = [...three(), trigger('ship'), trigger('pay')];
  assert.deepEqual(controlOwnershipViolations(siblings, snapshot({ componentControls: controls }), profile), []);
});

test('A. one trigger removed while a consumer button keeps the total unchanged fails', () => {
  // The beside case: three triggers and one consumer button, total four. One
  // trigger loses its identity and stands as a plain button: still four
  // focusable, two component + two consumer.
  const violations = controlOwnershipViolations(
    beside,
    snapshot({
      componentControls: [trigger('account'), trigger('profile')],
      consumerControlCount: 2,
      focusableTotal: 4,
    }),
    profile,
  );
  assert.match(violations[0], /measured 2 component-owned control\(s\) but the catalog declares 3/);
  assert.match(violations[1], /measured 2 consumer control\(s\) but the catalog declares 1/);
});

test('B. one trigger replaced by a div with role=button fails on identity, not on count', () => {
  const controls = [trigger('account'), trigger('profile', { tag: 'div' }), trigger('confirm')];
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: controls, interactiveRoleTotal: 1 }),
    profile,
  );
  assert.equal(violations.length, 2);
  assert.match(violations[0], /the trigger is a <div>, not the declared <button>/);
  assert.match(violations[1], /1 element\(s\) carrying an explicit interactive role/);
});

test('C. one extra trigger fails', () => {
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: [...three(), trigger('extra')] }),
    profile,
  );
  assert.match(violations[0], /measured 4 component-owned control\(s\) but the catalog declares 3/);
});

test('D. the same trigger counted twice fails on the count and on the equation', () => {
  const twice = [...three(), trigger('confirm')];
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: twice, focusableTotal: 3 }),
    profile,
  );
  assert.match(violations[0], /measured 4 component-owned control\(s\) but the catalog declares 3/);
  assert.match(violations[1], /do not add up/);
  // With a budget of four declared, the equation alone still catches it.
  const budgeted = { ...plain, componentInteractive: 4 };
  assert.match(
    controlOwnershipViolations(budgeted, snapshot({ componentControls: twice, focusableTotal: 3 }), profile)[0],
    /do not add up/,
  );
});

test('E. an unrelated button included in the owned count fails on both counts', () => {
  const controls = [
    ...three(),
    trigger('continue', { path: 'button', name: 'Continue', current: null, currentClass: false }),
  ];
  const violations = controlOwnershipViolations(
    beside,
    snapshot({ componentControls: controls, consumerControlCount: 0, focusableTotal: 4 }),
    profile,
  );
  assert.match(violations[0], /measured 4 component-owned control\(s\) but the catalog declares 3/);
  assert.match(violations[1], /measured 0 consumer control\(s\) but the catalog declares 1/);
});

test("F. a disabled trigger excluded from the component's identity fails, although the DOM still owns it", () => {
  // The disabled trigger is focusable-by-selector and in the DOM; a
  // measurement that reclassified it as the consumer's keeps the total at
  // three and moves the two counts.
  const violations = controlOwnershipViolations(
    disabledMiddle,
    snapshot({
      componentControls: [trigger('account'), trigger('confirm')],
      consumerControlCount: 1,
      focusableTotal: 3,
    }),
    profile,
  );
  assert.match(violations[0], /measured 2 component-owned control\(s\) but the catalog declares 3/);
  assert.match(violations[1], /measured 1 consumer control\(s\) but the catalog declares 0/);
  // Dropped altogether, the count still fails.
  const dropped = controlOwnershipViolations(
    disabledMiddle,
    snapshot({ componentControls: [trigger('account'), trigger('confirm')] }),
    profile,
  );
  assert.match(dropped[0], /measured 2 component-owned control\(s\) but the catalog declares 3/);
});

test('G. items.length as a blind expected count fails on the sibling case, where the rendered identity is five', () => {
  const blind = { ...siblings, componentInteractive: siblings.props.items.length };
  const controls = [...three(), trigger('ship'), trigger('pay')];
  assert.match(
    controlOwnershipViolations(blind, snapshot({ componentControls: controls }), profile)[0],
    /measured 5 component-owned control\(s\) but the catalog declares 3/,
  );
});

test('H. a skipped ownership extraction fails closed, in every shape a skip can take', () => {
  assert.match(controlOwnershipViolations(plain, undefined, profile)[0], /produced no ownership snapshot at all/);
  assert.match(controlOwnershipViolations(plain, null, profile)[0], /produced no ownership snapshot at all/);
  const partial = snapshot();
  delete partial.componentControls;
  assert.match(controlOwnershipViolations(plain, partial, profile)[0], /missing \[componentControls\]/);
  assert.match(
    controlOwnershipViolations(plain, { ...snapshot(), ownershipPosture: 'static' }, profile)[0],
    /posture="static"/,
  );
});

test('I. an empty ownership object fails closed', () => {
  assert.match(
    controlOwnershipViolations(plain, snapshot(), { ...profile, controlOwnership: {} })[0],
    /declares no component-owned control/,
  );
  assert.match(
    controlOwnershipViolations(plain, { ...snapshot(), componentControls: [] }, profile)[0],
    /measured 0 component-owned control\(s\) but the catalog declares 3/,
  );
});

test('J. the right count with the wrong tag identity fails on every control', () => {
  const anchors = three().map((control) => ({ ...control, tag: 'a' }));
  const violations = controlOwnershipViolations(plain, snapshot({ componentControls: anchors }), profile);
  assert.equal(violations.length, 1);
  assert.equal((violations[0].match(/not the declared <button>/g) ?? []).length, 3);
});

test('every shipped stepper case passes with the snapshot its declarations describe', () => {
  for (const entry of cases) {
    const members = Array.isArray(entry.group) ? entry.group : [entry.props];
    const controls = members.flatMap((member) =>
      member.items.map((item) => trigger(item.value, { disabled: item.disabled === true })),
    );
    const violations = controlOwnershipViolations(
      entry,
      snapshot({ componentControls: controls, consumerControlCount: entry.consumerInteractive ?? 0 }),
      profile,
    );
    assert.deepEqual(violations, [], entry.id);
  }
});
