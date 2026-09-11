// The static slot-ownership proof required by sections 23 and 24 of the M16
// plan, as evidence rather than as comment.
//
// M15 introduced the static snapshot for three components with no slots. M16
// added VfCard, whose slots hold whatever a consumer writes, and the review
// asked whether the M15 measurement can still be trusted for such a component.
//
// The answer was not the one the plan anticipated. The plan expected a *false
// failure*: a harness concluding that a card violates its own static contract
// because a consumer put a button in it. That is not what M15 did. M15 compared
// the counts between targets and required nothing of their value, so a consumer
// button produced focusableCount 1 on all three targets, the comparison was
// clean, and nothing failed. The hole was the opposite of a false failure - it
// was the absolute half of the evidence silently evaporating, leaving a
// snapshot that declares interactionPosture 'none' beside a measurement that
// contradicts it.
//
// So the fix is a scoping, and the two directions it has to get right are:
//
//   1. a control the component itself renders MUST fail, including when every
//      target renders it identically - the case a three-way comparison is
//      structurally blind to;
//   2. a control the consumer put in a slot must NOT fail.
//
// Both are asserted below against the real function the runner calls.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { STATIC_SNAPSHOT_FIELDS, staticOwnershipViolations } from './extract.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

/** A snapshot exactly as the browser expression produces it. */
function snapshot({ focusableCount = 0, interactiveRoleCount = 0, ...rest } = {}) {
  return {
    interactionPosture: 'none',
    caseRendered: true,
    focusRole: 'outside-case',
    focusableCount,
    interactiveRoleCount,
    ...rest,
  };
}

const inert = { id: 'skeleton/default' };
const cardWithConsumerButton = load('card').find((entry) => entry.id === 'card/interactive-slot-content');
const panelWithConsumerButton = load('panel').find((entry) => entry.id === 'panel/interactive-slot-content');
const panelWithHeaderButton = load('panel').find((entry) => entry.id === 'panel/interactive-header-content');

test('the fixture case this proof depends on is still in the shipped catalog', () => {
  // If someone deletes the case, this proof must stop rather than quietly
  // testing a hypothetical.
  assert.ok(cardWithConsumerButton, 'card/interactive-slot-content is gone from the catalog');
  assert.equal(cardWithConsumerButton.consumerInteractive, 1);
});

test('the VfPanel fixture cases this proof depends on are still in the shipped catalog', () => {
  assert.ok(panelWithConsumerButton, 'panel/interactive-slot-content is gone from the catalog');
  assert.equal(panelWithConsumerButton.consumerInteractive, 1);
  assert.ok(panelWithHeaderButton, 'panel/interactive-header-content is gone from the catalog');
  assert.equal(panelWithHeaderButton.consumerInteractive, 1);
});

// ------------------------------------------------- direction 1: component-owned

test('a control the component renders fails, even though every target renders it identically', () => {
  // The whole point. Two identically wrong adapters produce no difference, so
  // the comparison sees nothing; the declared budget is what notices.
  const violations = staticOwnershipViolations(inert, snapshot({ focusableCount: 1 }));

  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 1 focusable element\(s\) but the catalog declares 0/);
});

test('an accidental control inside a skeleton or an avatar fails', () => {
  for (const component of ['skeleton', 'avatar']) {
    for (const parityCase of load(component)) {
      assert.ok(
        staticOwnershipViolations(parityCase, snapshot({ focusableCount: 1 })).length > 0,
        `${parityCase.id} accepted a focusable element the component would have had to render`,
      );
    }
  }
});

test('a component that grew a control beside the consumer button still fails', () => {
  // "At most one" would pass this. The rule is exact equality for exactly this
  // reason: a slot that legitimately holds one control must not become cover
  // for a second one the component added.
  const violations = staticOwnershipViolations(cardWithConsumerButton, snapshot({ focusableCount: 2 }));

  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 2 focusable element\(s\) but the catalog declares 1/);
});

test('a component exposing an interactive ARIA role fails', () => {
  const violations = staticOwnershipViolations(
    cardWithConsumerButton,
    // The declared consumer control is present and correct; the extra role is
    // the only thing wrong, so exactly one violation must be reported.
    snapshot({ focusableCount: 1, interactiveRoleCount: 1 }),
  );

  assert.equal(violations.length, 1);
  assert.match(violations[0], /carrying an interactive role/);
});

// ------------------------------------------------- direction 2: consumer-owned

test('a consumer control inside a card slot does not fail', () => {
  assert.deepEqual(staticOwnershipViolations(cardWithConsumerButton, snapshot({ focusableCount: 1 })), []);
});

test('every shipped card case passes when its declared consumer controls are the only focusable elements', () => {
  for (const parityCase of load('card')) {
    assert.deepEqual(
      staticOwnershipViolations(parityCase, snapshot({ focusableCount: parityCase.consumerInteractive ?? 0 })),
      [],
      `${parityCase.id} was reported as violating its own static contract`,
    );
  }
});

test('a card slot whose consumer control went missing on one target also fails', () => {
  // The scoping must not become permission to render less than the consumer
  // asked for: the declaration is exact in both directions.
  const violations = staticOwnershipViolations(cardWithConsumerButton, snapshot({ focusableCount: 0 }));

  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 0 focusable element\(s\) but the catalog declares 1/);
});

// ------------------------------------------------------------- fail closed

test('a missing measurement is a failure rather than a skip', () => {
  for (const field of STATIC_SNAPSHOT_FIELDS) {
    const partial = snapshot();
    delete partial[field];

    const violations = staticOwnershipViolations(inert, partial);
    assert.ok(violations.length > 0, `a snapshot missing ${field} was accepted`);
    assert.match(violations[0], /is missing/);
  }
});

test('no snapshot at all is a failure rather than a skip', () => {
  for (const nothing of [undefined, null, 'ok', 42]) {
    assert.ok(
      staticOwnershipViolations(inert, nothing).length > 0,
      `a snapshot of ${JSON.stringify(nothing)} was accepted`,
    );
  }
});

test('a snapshot that stopped declaring its posture fails', () => {
  assert.ok(staticOwnershipViolations(inert, snapshot({ interactionPosture: 'driven' })).length > 0);
  assert.ok(staticOwnershipViolations(inert, snapshot({ caseRendered: false })).length > 0);
});

// --------------------------------------------------------------- M18: VfPanel
//
// The same two directions, asserted for a component whose slot content is
// *unwrapped*. VfCard's consumer controls sit inside a classed div; a panel's
// sit directly in the section, so there is no wrapper an implementation could
// use to tell "the component's own markup" from "whatever the consumer passed".
// The declared budget is the only thing that separates them, which is why both
// panel slots that render get a fixture rather than one standing in for both.

test('a consumer control in the panel default slot does not fail', () => {
  assert.deepEqual(staticOwnershipViolations(panelWithConsumerButton, snapshot({ focusableCount: 1 })), []);
});

test('a consumer control in the panel header slot does not fail either', () => {
  assert.deepEqual(staticOwnershipViolations(panelWithHeaderButton, snapshot({ focusableCount: 1 })), []);
});

test('a panel that grew a control beside the consumer button fails', () => {
  // The M18 version of the case a three-way comparison is structurally blind
  // to: every target renders the extra control identically, so nothing differs
  // and only the declared budget notices.
  const violations = staticOwnershipViolations(panelWithConsumerButton, snapshot({ focusableCount: 2 }));

  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 2 focusable element\(s\) but the catalog declares 1/);
});

test('an accidental control in any panel case that declares none fails', () => {
  for (const parityCase of load('panel')) {
    if ((parityCase.consumerInteractive ?? 0) !== 0) continue;

    assert.ok(
      staticOwnershipViolations(parityCase, snapshot({ focusableCount: 1 })).length > 0,
      `${parityCase.id} accepted a focusable element the component would have had to render`,
    );
  }
});

test('every shipped panel case passes when its declared consumer controls are the only focusable elements', () => {
  for (const parityCase of load('panel')) {
    assert.deepEqual(
      staticOwnershipViolations(parityCase, snapshot({ focusableCount: parityCase.consumerInteractive ?? 0 })),
      [],
      `${parityCase.id} was reported as violating its own static contract`,
    );
  }
});

test('a panel slot whose consumer control went missing on one target also fails', () => {
  const violations = staticOwnershipViolations(panelWithConsumerButton, snapshot({ focusableCount: 0 }));

  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 0 focusable element\(s\) but the catalog declares 1/);
});

test('a missing measurement on a panel case is a failure rather than a skip', () => {
  // Fail-closed, asserted for this component rather than inherited from the
  // skeleton fixture: a component with slots is where "the stage did not run"
  // is easiest to mistake for "the stage found nothing".
  for (const field of STATIC_SNAPSHOT_FIELDS) {
    const partial = snapshot({ focusableCount: 1 });
    delete partial[field];

    const violations = staticOwnershipViolations(panelWithConsumerButton, partial);
    assert.ok(violations.length > 0, `a panel snapshot missing ${field} was accepted`);
    assert.match(violations[0], /is missing/);
  }
});

test('the card and panel budgets are read from their own catalogs, not from a shared one', () => {
  // Cross-isolation. A card case must not be able to satisfy a panel case's
  // budget by accident: the function takes the case it was given, and the two
  // catalogs are separate files. The one card case with no consumer control
  // must reject the count the panel case declares, and vice versa.
  const cardWithoutControl = load('card').find((entry) => (entry.consumerInteractive ?? 0) === 0);
  const panelWithoutControl = load('panel').find((entry) => (entry.consumerInteractive ?? 0) === 0);

  assert.ok(cardWithoutControl && panelWithoutControl);
  assert.ok(staticOwnershipViolations(cardWithoutControl, snapshot({ focusableCount: 1 })).length > 0);
  assert.ok(staticOwnershipViolations(panelWithoutControl, snapshot({ focusableCount: 1 })).length > 0);
});

// --------------------------------------------------------------- M19: VfAlert
//
// The milestone was planned to prove the direction the model had not yet
// needed: an *expected* component-owned control, declared by contract and
// distinguished from a consumer's. The reference VfAlert has no such control -
// no dismissible prop, no close button, no event - so that direction is not
// exercised here, and the tests below say so rather than pretending: every
// alert case declares a consumer budget only, the function has no field that
// could declare a component-owned control, and a case that tried to add one is
// ignored, which is fail-closed. Four fixture categories are asserted, as the
// milestone asks, with the two "dismissible" ones recorded as not applicable.

const alertStaticContent = load('alert').find((entry) => entry.id === 'alert/title-and-content');
const alertWithConsumerButton = load('alert').find((entry) => entry.id === 'alert/interactive-slot-content');
const alertWithTitleButton = load('alert').find((entry) => entry.id === 'alert/interactive-title-content');
const alertWithHiddenIconButton = load('alert').find(
  (entry) => entry.id === 'alert/interactive-slot-content-hidden-icon',
);

test('the VfAlert fixture cases this proof depends on are still in the shipped catalog', () => {
  assert.ok(alertStaticContent, 'alert/title-and-content is gone from the catalog');
  assert.equal(alertStaticContent.consumerInteractive, undefined);
  assert.ok(alertWithConsumerButton, 'alert/interactive-slot-content is gone from the catalog');
  assert.equal(alertWithConsumerButton.consumerInteractive, 1);
  assert.ok(alertWithTitleButton, 'alert/interactive-title-content is gone from the catalog');
  assert.equal(alertWithTitleButton.consumerInteractive, 1);
  assert.ok(alertWithHiddenIconButton, 'alert/interactive-slot-content-hidden-icon is gone from the catalog');
  assert.equal(alertWithHiddenIconButton.consumerInteractive, 1);
});

test('no alert case declares a component-owned control, and nothing in the snapshot could', () => {
  // The two "dismissible" categories of the M19 matrix, recorded as not
  // applicable by measurement: no case declares a budget the fixture does not
  // render as a consumer control, and the snapshot fields carry no
  // component-owned count for a budget to be declared against.
  for (const parityCase of load('alert')) {
    assert.equal(parityCase.componentOwned, undefined, `${parityCase.id} declares a component-owned budget`);
    assert.equal(parityCase.props?.dismissible, undefined, `${parityCase.id} configures a dismiss control`);
  }
  assert.ok(!STATIC_SNAPSHOT_FIELDS.some((field) => /owned|dismiss/i.test(field)));
});

// category 1: static alert, static consumer content
test('a static alert with static content passes at zero and fails at one', () => {
  assert.deepEqual(staticOwnershipViolations(alertStaticContent, snapshot()), []);
  const violations = staticOwnershipViolations(alertStaticContent, snapshot({ focusableCount: 1 }));
  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 1 focusable element\(s\) but the catalog declares 0/);
});

// category 2: static alert, interactive consumer content
test('a consumer control in the alert default slot does not fail', () => {
  assert.deepEqual(staticOwnershipViolations(alertWithConsumerButton, snapshot({ focusableCount: 1 })), []);
});

test('a consumer control in the alert title slot does not fail either', () => {
  assert.deepEqual(staticOwnershipViolations(alertWithTitleButton, snapshot({ focusableCount: 1 })), []);
});

test('a consumer control in an alert with the icon hidden does not fail', () => {
  assert.deepEqual(staticOwnershipViolations(alertWithHiddenIconButton, snapshot({ focusableCount: 1 })), []);
});

test('an alert that grew a dismiss button beside the consumer button fails', () => {
  // Matrix F. Every target renders the extra control identically, so nothing
  // differs and only the declared budget notices.
  const violations = staticOwnershipViolations(alertWithConsumerButton, snapshot({ focusableCount: 2 }));

  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 2 focusable element\(s\) but the catalog declares 1/);
});

test('an alert whose consumer control went missing on one target also fails', () => {
  const violations = staticOwnershipViolations(alertWithConsumerButton, snapshot({ focusableCount: 0 }));

  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 0 focusable element\(s\) but the catalog declares 1/);
});

test('an accidental control in any alert case that declares none fails', () => {
  // Matrix A, across the whole catalog rather than one fixture.
  for (const parityCase of load('alert')) {
    if ((parityCase.consumerInteractive ?? 0) !== 0) continue;

    assert.ok(
      staticOwnershipViolations(parityCase, snapshot({ focusableCount: 1 })).length > 0,
      `${parityCase.id} accepted a focusable element the component would have had to render`,
    );
  }
});

test('every shipped alert case passes when its declared consumer controls are the only focusable elements', () => {
  for (const parityCase of load('alert')) {
    assert.deepEqual(
      staticOwnershipViolations(parityCase, snapshot({ focusableCount: parityCase.consumerInteractive ?? 0 })),
      [],
      `${parityCase.id} was reported as violating its own static contract`,
    );
  }
});

// categories 3 and 4: dismissible alert - not applicable, and not buyable
test('a case cannot buy a component-owned control by declaring one', () => {
  // Matrix G against the real function. A field the function does not read
  // changes nothing: the measured count is still held to the consumer budget,
  // so a catalog edit cannot make room for a dismiss button.
  const bought = { ...alertStaticContent, componentOwned: 1, expectedControls: ['dismiss'] };

  assert.ok(staticOwnershipViolations(bought, snapshot({ focusableCount: 1 })).length > 0);
  assert.deepEqual(staticOwnershipViolations(bought, snapshot()), []);
});

test('an element exposing an interactive role inside an alert fails', () => {
  const violations = staticOwnershipViolations(alertStaticContent, snapshot({ interactiveRoleCount: 1 }));

  assert.equal(violations.length, 1);
  assert.match(violations[0], /carrying an interactive role/);
});

test('a missing or empty measurement on an alert case is a failure rather than a skip', () => {
  assert.ok(staticOwnershipViolations(alertWithConsumerButton, undefined).length > 0);
  assert.ok(staticOwnershipViolations(alertWithConsumerButton, {}).length > 0);
  assert.match(staticOwnershipViolations(alertWithConsumerButton, {})[0], /is missing/);
  for (const field of STATIC_SNAPSHOT_FIELDS) {
    const partial = snapshot({ focusableCount: 1 });
    delete partial[field];

    const violations = staticOwnershipViolations(alertWithConsumerButton, partial);
    assert.ok(violations.length > 0, `an alert snapshot missing ${field} was accepted`);
    assert.match(violations[0], /is missing/);
  }
});

test('the alert budgets are read from their own catalog, not from the badge or tag catalogs', () => {
  // Cross-isolation with the two components whose tone names the alert shares.
  // Neither span catalog declares any consumer budget; an alert case with one
  // must not be satisfiable by a span-shaped snapshot, and vice versa.
  for (const other of ['badge', 'tag']) {
    for (const parityCase of load(other)) {
      assert.equal(parityCase.consumerInteractive, undefined);
      assert.ok(staticOwnershipViolations(parityCase, snapshot({ focusableCount: 1 })).length > 0);
    }
  }
  assert.ok(staticOwnershipViolations(alertWithConsumerButton, snapshot()).length > 0);
});

// ------------------------------------------------------ M15 is not weakened

test('every M15 static case is still asserted against exactly zero', () => {
  // The M16 change had to be strictly stronger than M15, not a loosening that
  // bought VfCard its pass. M15 compared the counts and required nothing of
  // their value; now every one of those cases must measure zero.
  for (const component of ['badge', 'tag', 'divider']) {
    for (const parityCase of load(component)) {
      assert.equal(
        parityCase.consumerInteractive,
        undefined,
        `${parityCase.id} acquired a consumer-interaction budget it never had`,
      );
      assert.deepEqual(staticOwnershipViolations(parityCase, snapshot()), []);
      assert.ok(staticOwnershipViolations(parityCase, snapshot({ focusableCount: 1 })).length > 0);
    }
  }
});
