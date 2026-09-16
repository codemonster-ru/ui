// The anchor ownership proof required by sections 17 and 18 of the M25 plan,
// as evidence rather than as comment.
//
// M22 to M24 proved that the harness can say a component owns exactly the
// native buttons it declares, by identity. VfLink is the first migrated
// component whose owned control is an anchor, and the first whose anchor is
// sometimes *not* a control: an `<a>` with no href is inert, not focusable and
// absent from the accessibility tree, and the reference renders exactly that
// for a link with no destination. The generic equation `owned + consumer ===
// focusable` would reject that render if the anchor were counted, so the
// profile's selector carries `[href]` and the no-destination case declares a
// budget of zero. Nothing generic changed for it. What is asserted here,
// against the real function the runner calls:
//
//   A. the expected anchor, and nothing else                        -> PASS
//   B. the no-destination case with zero owned and zero focusable    -> PASS
//   C. the inert anchor counted as a control (budget still zero)     -> FAIL on count
//   D. the inert anchor counted, budget bought up to one             -> the assertion accepts it;
//      the coverage gate refuses the budget, and the run differs on ownership.controls,
//      interaction.state and a11y.role against the reference (recorded as a limit, not hidden)
//   E. the anchor with an href missing from the snapshot             -> FAIL on count
//   F. a button in place of the anchor, found by the selector        -> FAIL on identity, not on count
//   G. a div with role=link and tabindex in place of the anchor      -> FAIL on identity and on the role total
//   H. a consumer button inside the anchor, separated                -> PASS
//   I. the consumer button classified as the component's            -> FAIL on both counts
//   J. a second owned anchor                                         -> FAIL on count
//   K. a skipped measurement, in every shape a skip can take          -> FAIL CLOSED
//   L. the same node counted twice                                    -> FAIL on the equation
//
// And the rule the plan makes explicit: the generic code names no anchor.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { controlOwnershipViolations, OWNERSHIP_SNAPSHOT_FIELDS } from './extract.mjs';
import { profiles } from './profiles.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/link/cases.json'), 'utf8')).cases;
const byId = (id) => cases.find((entry) => entry.id === id);

const profile = profiles.link;

/** One owned anchor, as the browser expression records it. */
function anchor(overrides = {}) {
  return {
    role: 'anchor',
    tag: 'a',
    ariaRole: null,
    href: '/docs',
    target: null,
    rel: null,
    classes: ['vf-link'],
    focusable: true,
    name: 'Documentation',
    ...overrides,
  };
}

/** A snapshot exactly as the browser expression produces it, ownership half only. */
function snapshot({
  componentControls = [anchor()],
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

const plain = byId('link/href');
const none = byId('link/no-destination');
const withControl = byId('link/consumer-control');

test('the fixture cases this proof depends on are still in the shipped catalog', () => {
  assert.equal(plain?.componentInteractive, 1);
  assert.equal(none?.componentInteractive, 0);
  assert.equal(withControl?.componentInteractive, 1);
  assert.equal(withControl?.consumerInteractive, 1);
});

test('the profile owns the anchor with a destination, by tag, and declares no explicit role', () => {
  assert.deepEqual(profile.controlOwnership, { anchor: { selector: '.vf-link[href]', tag: 'a' } });
  assert.equal(profile.liveParity, undefined);
});

test('A. the expected anchor, and nothing else, passes', () => {
  assert.deepEqual(controlOwnershipViolations(plain, snapshot(), profile), []);
});

test('B. the no-destination case passes with zero owned controls and zero focusable elements', () => {
  assert.deepEqual(controlOwnershipViolations(none, snapshot({ componentControls: [] }), profile), []);
});

test('C. the inert anchor counted as a control fails on count while the budget stays zero', () => {
  const violations = controlOwnershipViolations(
    none,
    snapshot({ componentControls: [anchor({ href: null, focusable: false, name: 'Nowhere' })], focusableTotal: 0 }),
    profile,
  );
  assert.ok(
    violations.some((violation) =>
      /measured 1 component-owned control\(s\) but the catalog declares 0/.test(violation),
    ),
  );
});

test('D. the inert anchor counted with a bought budget is accepted by the assertion alone - the limit the plan records', () => {
  // The assertion checks the snapshot against the declaration; it cannot know
  // the anchor has no href. What refuses this is the coverage gate (a case
  // with no href may not declare a budget of one) and the run itself, where
  // the snapshot, the DOM and the accessibility tree all differ from the
  // reference's inert anchor.
  const bought = { ...none, componentInteractive: 1 };
  assert.deepEqual(
    controlOwnershipViolations(
      bought,
      snapshot({ componentControls: [anchor({ href: '#', name: 'Nowhere' })] }),
      profile,
    ),
    [],
  );
});

test('E. an anchor with an href that the snapshot does not find fails on count', () => {
  const violations = controlOwnershipViolations(plain, snapshot({ componentControls: [] }), profile);
  assert.ok(
    violations.some((violation) =>
      /measured 0 component-owned control\(s\) but the catalog declares 1/.test(violation),
    ),
  );
});

test('F. a button in place of the anchor fails on identity, not on count', () => {
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: [anchor({ tag: 'button' })] }),
    profile,
  );
  assert.equal(violations.length, 1);
  assert.match(violations[0], /the anchor is a <button>, not the declared <a>/);
});

test('G. a div with role=link and a tabindex in place of the anchor fails on identity and on the role total', () => {
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: [anchor({ tag: 'div', ariaRole: 'link' })], interactiveRoleTotal: 1 }),
    profile,
  );
  assert.ok(violations.some((violation) => /the anchor is a <div>, not the declared <a>/.test(violation)));
  assert.ok(
    violations.some((violation) => /measured 1 element\(s\) carrying an explicit interactive role/.test(violation)),
  );
});

test('H. a consumer button inside the anchor passes, with the two separated', () => {
  assert.deepEqual(controlOwnershipViolations(withControl, snapshot({ consumerControlCount: 1 }), profile), []);
});

test("I. the consumer button classified as the component's fails on both counts", () => {
  const violations = controlOwnershipViolations(
    withControl,
    snapshot({
      componentControls: [anchor(), anchor({ tag: 'button', href: null, classes: [], name: 'Pin' })],
      consumerControlCount: 0,
    }),
    profile,
  );
  assert.ok(violations.some((violation) => /measured 2 component-owned/.test(violation)));
  assert.ok(
    violations.some((violation) => /measured 0 consumer control\(s\) but the catalog declares 1/.test(violation)),
  );
});

test('J. a second owned anchor fails on count', () => {
  const violations = controlOwnershipViolations(plain, snapshot({ componentControls: [anchor(), anchor()] }), profile);
  assert.ok(
    violations.some((violation) =>
      /measured 2 component-owned control\(s\) but the catalog declares 1/.test(violation),
    ),
  );
});

test('K. a skipped measurement fails closed, in every shape a skip can take', () => {
  for (const nothing of [undefined, null, 'ok', 42]) {
    assert.ok(controlOwnershipViolations(plain, nothing, profile).length > 0);
  }
  for (const field of OWNERSHIP_SNAPSHOT_FIELDS) {
    const partial = snapshot();
    delete partial[field];
    assert.ok(
      controlOwnershipViolations(plain, partial, profile).some((violation) => violation.includes(field)),
      `a snapshot without ${field} passed`,
    );
  }
});

test('L. the same anchor counted twice fails the equation even when the declared count is two', () => {
  const doubled = { ...plain, componentInteractive: 2 };
  const violations = controlOwnershipViolations(
    doubled,
    snapshot({ componentControls: [anchor(), anchor()], focusableTotal: 1 }),
    profile,
  );
  assert.ok(violations.some((violation) => /do not add up/.test(violation)));
});

test('every shipped link case passes with the snapshot its declarations describe', () => {
  for (const entry of cases) {
    const controls = entry.componentInteractive === 1 ? [anchor({ href: entry.props.href })] : [];
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

test('the generic ownership code names no anchor', () => {
  const source = readFileSync(resolve(repositoryRoot, 'scripts/parity/extract.mjs'), 'utf8');
  // From the check table to the first component-specific expression: the
  // ownership assertion and everything it reads.
  const generic = source.slice(
    source.indexOf('const OWNERSHIP_CHECKS'),
    source.indexOf('function accordionInteractionExpression'),
  );
  assert.ok(generic.length > 0);
  assert.ok(!/vf-link|anchor/.test(generic));
});
