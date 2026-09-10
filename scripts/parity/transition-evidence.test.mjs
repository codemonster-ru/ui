// The transition stage's fail-closed guards, as evidence rather than as comment.
//
// M15 established the convention this file follows: the guard the runner calls
// is a pure exported function, and it gets its own test asserting both
// directions against that real function. `staticOwnershipViolations` has had
// such a file since M16. M17 added a whole new measurement stage and shipped
// its guard, `transitionViolations`, with no test at all - so the stage's
// fail-closed behaviour was asserted only by the comment above it.
//
// The M17.1 audit found what that costs. Two of the three things this file now
// pins were not enforced anywhere:
//
//   1. `transition.identity` could measure nothing and pass. The identity
//      expression marks the nodes a transition must not destroy, and the
//      comparator only reports a difference for a node that was marked *and*
//      came back recreated. A run where nothing was marked therefore produced
//      an empty result, no difference, and a clean pass - a live-looking
//      dimension measuring zero. Proven in a real browser during the audit:
//      against a case whose markup is not a skeleton gate, mark and read both
//      returned {contentChild: 'absent', overlayChild: 'absent'} and the
//      comparator reported nothing. For VfSkeletonGate this was unreachable
//      only because the *snapshot* expression happens to throw on missing gate
//      elements a few lines later. Nothing designed that protection;
//   2. the declared-capability assertion had no adversarial coverage at all.
//      It is the guard M17 relied on to make `transitionTargets` mean
//      something in both directions, and nothing had ever made it fire.
//
// Both are asserted below against the real functions the runner calls.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { transitionCapabilityViolation, transitionViolations } from './extract.mjs';

const parityCase = {
  id: 'skeleton-gate/loading-content',
  transition: { to: { ready: true }, matches: 'skeleton-gate/ready-content' },
};

/** A transition result that is correct in every respect. */
function healthy(overrides = {}) {
  return {
    supported: true,
    declared: true,
    applied: true,
    state: { contentReady: true },
    identityBefore: { contentChild: 'marked', overlayChild: 'marked' },
    identity: { contentChild: 'same-node', overlayChild: 'same-node' },
    ...overrides,
  };
}

const dom = [{ tag: 'div', classes: ['vf-skeleton-gate'] }];

test('a healthy transition reports no violations', () => {
  assert.deepEqual(transitionViolations(parityCase, healthy(), dom, dom), []);
});

test('a missing result is a failure, never a skip', () => {
  assert.equal(transitionViolations(parityCase, undefined, dom, dom).length, 1);
  assert.match(transitionViolations(parityCase, null, dom, dom)[0], /produced no transition result at all/);
});

test('a target that cannot drive the transition fails rather than passing quietly', () => {
  const problems = transitionViolations(parityCase, healthy({ supported: false }), dom, dom);

  assert.equal(problems.length, 1);
  assert.match(problems[0], /exposes no way to drive it/);
});

test('a transition that did not apply fails', () => {
  assert.ok(
    transitionViolations(parityCase, healthy({ applied: false }), dom, dom).some((problem) =>
      problem.includes('applied=false'),
    ),
  );
});

test('a transition that did not reach the state it was driven to fails', () => {
  assert.ok(
    transitionViolations(parityCase, healthy({ state: { contentReady: false } }), dom, dom).some((problem) =>
      problem.includes('contentReady=false'),
    ),
  );
});

test('a transition that lands on a hybrid rather than the named state fails', () => {
  const hybrid = [{ tag: 'div', classes: ['vf-skeleton-gate'], consumerClasses: ['stale'] }];

  assert.ok(
    transitionViolations(parityCase, healthy(), hybrid, dom).some((problem) =>
      problem.includes('did not converge on skeleton-gate/ready-content'),
    ),
  );
});

// ---------------------------------------------------------------- identity
//
// The M17.1 finding. Each of these fails against M17 HEAD, where
// transitionViolations did not look at the identity measurement at all.

test('an identity measurement that marked nothing is a failure, not a clean pass', () => {
  // What the audit reproduced in a real browser: selectors that match nothing
  // produce an all-absent mark, an all-absent read, and a comparator that
  // reports no difference. Without this the dimension is decoration.
  const problems = transitionViolations(
    parityCase,
    healthy({
      identityBefore: { contentChild: 'absent', overlayChild: 'absent' },
      identity: { contentChild: 'absent', overlayChild: 'absent' },
    }),
    dom,
    dom,
  );

  assert.ok(
    problems.some((problem) => problem.includes('marked no node')),
    `expected a "marked no node" violation, got: ${JSON.stringify(problems)}`,
  );
});

test('a partially blind identity measurement fails on the role that went unmeasured', () => {
  // Stricter than "at least one node was marked". A component whose overlay
  // stopped being found would otherwise keep passing on the strength of the
  // half that still works.
  const problems = transitionViolations(
    parityCase,
    healthy({
      identityBefore: { contentChild: 'marked', overlayChild: 'absent' },
      identity: { contentChild: 'same-node', overlayChild: 'absent' },
    }),
    dom,
    dom,
  );

  assert.ok(
    problems.some((problem) => problem.includes('overlayChild')),
    `expected the unmeasured role to be named, got: ${JSON.stringify(problems)}`,
  );
});

test('a missing identity measurement entirely is a failure', () => {
  const problems = transitionViolations(parityCase, healthy({ identityBefore: undefined }), dom, dom);

  assert.ok(problems.some((problem) => problem.includes('marked no node')));
});

test('a recreated node is left to the comparator rather than reported here', () => {
  // The runner's throw would abort the mutation harness before it could report
  // the recreation it was built to find, so this guard checks only that the
  // measurement happened - the value is a difference for the comparator.
  assert.deepEqual(
    transitionViolations(
      parityCase,
      healthy({ identity: { contentChild: 'recreated', overlayChild: 'same-node' } }),
      dom,
      dom,
    ),
    [],
  );
});

// -------------------------------------------------------------- capability
//
// M17 enforced this inline in run.mjs, where nothing could test it. Extracted
// so both directions are asserted against the function the runner calls.

const gateProfile = { id: 'skeleton-gate', transitionTargets: ['reference', 'current'] };

test('a target the profile expects to transition, and does, is accepted', () => {
  assert.equal(transitionCapabilityViolation(gateProfile, 'current', true, 'case'), null);
  assert.equal(transitionCapabilityViolation(gateProfile, 'razor', false, 'case'), null);
});

test('a Vue target that quietly lost its transition mechanism fails', () => {
  const problem = transitionCapabilityViolation(gateProfile, 'current', false, 'skeleton-gate/loading-content');

  assert.ok(problem, 'a declared target reporting no support must be a violation');
  assert.match(problem, /expects current to drive/);
});

test('a Razor target that unexpectedly gained client behaviour fails', () => {
  // The other direction, and the one an inline check is most likely to omit.
  // A Razor gate that started driving itself would be an adapter growing an
  // API the reference component never had.
  const problem = transitionCapabilityViolation(gateProfile, 'razor', true, 'skeleton-gate/loading-content');

  assert.ok(problem, 'an undeclared target reporting support must be a violation');
  assert.match(problem, /does not expect razor to drive/);
});

test('a profile that declares no transition targets expects every target to transition', () => {
  // The default the runner falls back to. Stated here so a future profile that
  // forgets the field gets the strict reading rather than a silent exemption.
  const permissive = { id: 'other' };

  assert.equal(transitionCapabilityViolation(permissive, 'razor', true, 'case'), null);
  assert.ok(transitionCapabilityViolation(permissive, 'razor', false, 'case'));
});
