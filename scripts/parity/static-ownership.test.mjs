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

test('the fixture case this proof depends on is still in the shipped catalog', () => {
  // If someone deletes the case, this proof must stop rather than quietly
  // testing a hypothetical.
  assert.ok(cardWithConsumerButton, 'card/interactive-slot-content is gone from the catalog');
  assert.equal(cardWithConsumerButton.consumerInteractive, 1);
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
