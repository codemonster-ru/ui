// The anchor ownership proof required by section 23 of the M26 plan, as
// evidence rather than as comment.
//
// VfLink proved the harness can say a component owns exactly one anchor, by
// identity, and that an anchor without a destination is not a control.
// VfBreadcrumbs is the first component that owns N anchors at once with N
// decided per item by a rule, and the first whose *count-preserving* attacks
// matter: removing one anchor and duplicating another, swapping two
// destinations, or exchanging the current span with an earlier link all leave
// the number of owned controls intact. What is asserted here, against the real
// function the runner calls, is which of these the generic declaration check
// can see on its own and which need the independent evidence the run has
// beside it - the ordered DOM comparison and the ordered snapshot records -
// so that nothing is claimed for the aggregate count that it does not do:
//
//   A. the expected anchors, and nothing else                       -> PASS
//   B. the lone current item with zero owned and zero focusable      -> PASS
//   C. the current item counted as a control (budget still zero)     -> FAIL on count
//   D. an anchor missing from the snapshot                           -> FAIL on count
//   E. a button in place of an anchor, found by the selector         -> FAIL on identity, not on count
//   F. a div with role=link in place of an anchor                    -> FAIL on identity and on the role total
//   G. the first anchor removed and the second duplicated            -> PASS on count (recorded as a limit);
//      the run differs on dom.text, dom.nativeAttributes and ownership.controls
//   H. two destinations swapped                                      -> PASS on count (recorded as a limit);
//      the run differs on dom.nativeAttributes at two ordered paths and on ownership.controls
//   I. the current span and an earlier link exchanged                -> PASS on count (recorded as a limit);
//      the run differs on dom.structure, which is never approvable
//   J. an extra owned anchor                                         -> FAIL on count
//   K. a consumer anchor bought into the budget                      -> FAIL on the consumer count; the coverage gate refuses the budget
//   L. a consumer button bought into the focusable budget            -> FAIL on the equation
//   M. a skipped measurement, in every shape a skip can take         -> FAIL CLOSED
//
// And the rule the plan makes explicit: the generic code names no anchor and
// no breadcrumb.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { controlOwnershipViolations, OWNERSHIP_SNAPSHOT_FIELDS } from './extract.mjs';
import { profiles } from './profiles.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/breadcrumbs/cases.json'), 'utf8')).cases;
const byId = (id) => cases.find((entry) => entry.id === id);

const profile = profiles.breadcrumbs;

/** One owned anchor, as the browser expression records it. */
function anchor(href, name, overrides = {}) {
  return {
    role: 'link',
    tag: 'a',
    ariaRole: null,
    href,
    target: null,
    rel: null,
    classes: ['vf-breadcrumbs__link'],
    focusable: true,
    name,
    ...overrides,
  };
}

const trailAnchors = () => [anchor('/', 'Home'), anchor('/docs', 'Docs')];

/** A snapshot exactly as the browser expression produces it, ownership half only. */
function snapshot({
  componentControls = trailAnchors(),
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

const trail = byId('breadcrumbs/trail');
const lone = byId('breadcrumbs/one-with-href');

test('A. the expected anchors and nothing else pass', () => {
  assert.equal(trail.componentInteractive, 2);
  assert.deepEqual(controlOwnershipViolations(trail, snapshot(), profile), []);
});

test('B. the lone current item owns nothing and is focusable nowhere', () => {
  assert.equal(lone.componentInteractive, 0);
  assert.deepEqual(controlOwnershipViolations(lone, snapshot({ componentControls: [] }), profile), []);
});

test('C. the current item counted as a control fails on count', () => {
  const [violation] = controlOwnershipViolations(
    lone,
    snapshot({ componentControls: [anchor('/only', 'Only')] }),
    profile,
  );
  assert.match(violation, /measured 1 component-owned control\(s\) but the catalog declares 0/);
});

test('D. an anchor missing from the snapshot fails on count', () => {
  const [violation] = controlOwnershipViolations(
    trail,
    snapshot({ componentControls: [anchor('/', 'Home')] }),
    profile,
  );
  assert.match(violation, /measured 1 component-owned control\(s\) but the catalog declares 2/);
});

test('E. a button in place of an anchor fails on identity, not on count', () => {
  const [violation] = controlOwnershipViolations(
    trail,
    snapshot({ componentControls: [anchor('/', 'Home', { tag: 'button' }), anchor('/docs', 'Docs')] }),
    profile,
  );
  assert.match(violation, /the link is a <button>, not the declared <a>/);
  assert.doesNotMatch(violation, /declares 2/);
});

test('F. a div with role=link in place of an anchor fails on identity and on the role total', () => {
  const violations = controlOwnershipViolations(
    trail,
    snapshot({
      componentControls: [anchor('/', 'Home', { tag: 'div', ariaRole: 'link' }), anchor('/docs', 'Docs')],
      interactiveRoleTotal: 1,
    }),
    profile,
  );
  assert.equal(violations.length, 2);
  assert.match(violations[0], /is a <div>, not the declared <a>/);
  assert.match(violations[1], /measured 1 element\(s\) carrying an explicit interactive role/);
});

test('G. the first anchor removed and the second duplicated passes the count - a recorded limit the run covers elsewhere', () => {
  // Two anchors, both /docs: the same number the catalog declares. The
  // declaration check sees a count and a tag and nothing else - the ordered
  // DOM comparison reports dom.text and dom.nativeAttributes at the first
  // anchor's path, and the ordered componentControls records differ on
  // ownership.controls in the three-way comparison. This test states the
  // limit so the aggregate check is never credited with catching it.
  assert.deepEqual(
    controlOwnershipViolations(
      trail,
      snapshot({ componentControls: [anchor('/docs', 'Docs'), anchor('/docs', 'Docs')] }),
      profile,
    ),
    [],
  );
});

test('H. two destinations swapped pass the count - a recorded limit the ordered DOM comparison covers', () => {
  // The exact attack section 24 names. Caught by
  // breadcrumbs-hrefs-swapped and browser-breadcrumbs-hrefs-swapped on
  // dom.nativeAttributes at li[0]/a and li[1]/a, and on ownership.controls
  // through the ordered records. Not by this function.
  assert.deepEqual(
    controlOwnershipViolations(
      trail,
      snapshot({ componentControls: [anchor('/docs', 'Home'), anchor('/', 'Docs')] }),
      profile,
    ),
    [],
  );
});

test('I. the current span and an earlier link exchanged pass the count - a recorded limit dom.structure covers', () => {
  // Docs becomes the current span and Breadcrumbs becomes an anchor to /docs:
  // still two owned anchors. Caught by dom.structure (span vs a at two
  // paths), which is never approvable, and by the snapshot's currentIndices.
  assert.deepEqual(
    controlOwnershipViolations(
      trail,
      snapshot({ componentControls: [anchor('/', 'Home'), anchor('/docs', 'Breadcrumbs')] }),
      profile,
    ),
    [],
  );
});

test('J. an extra owned anchor fails on count', () => {
  const [violation] = controlOwnershipViolations(
    trail,
    snapshot({ componentControls: [...trailAnchors(), anchor('/breadcrumbs', 'Breadcrumbs')] }),
    profile,
  );
  assert.match(violation, /measured 3 component-owned control\(s\) but the catalog declares 2/);
});

test('K. a consumer anchor in the separator cannot buy the component a control', () => {
  // A consumer anchor is focusable and not the component's: it lands in the
  // consumer count, which the catalog declares as zero for every shared case.
  const [violation] = controlOwnershipViolations(trail, snapshot({ consumerControlCount: 1 }), profile);
  assert.match(violation, /measured 1 consumer control\(s\) but the catalog declares 0/);
  // And the coverage gate refuses a catalog that declared it.
  assert.equal(trail.consumerInteractive, undefined);
});

test('L. a consumer button counted as neither breaks the equation', () => {
  const [violation] = controlOwnershipViolations(trail, snapshot({ focusableTotal: 3 }), profile);
  assert.match(violation, /2 component \+ 0 consumer controls do not add up to the 3 focusable element\(s\) measured/);
});

test('M. a skipped measurement fails closed in every shape', () => {
  assert.match(controlOwnershipViolations(trail, undefined, profile)[0], /produced no ownership snapshot at all/);
  assert.match(controlOwnershipViolations(trail, {}, profile)[0], /is missing \[/);
  for (const field of OWNERSHIP_SNAPSHOT_FIELDS) {
    const partial = snapshot();
    delete partial[field];
    assert.match(controlOwnershipViolations(trail, partial, profile)[0], new RegExp(`is missing \\[${field}\\]`));
  }
  assert.match(
    controlOwnershipViolations(trail, { ...snapshot(), ownershipPosture: 'none' }, profile)[0],
    /reports posture="none"/,
  );
});

test('the profile declares the anchor with a destination, by class and tag, and no anchor without one', () => {
  assert.deepEqual(profile.controlOwnership, { link: { selector: '.vf-breadcrumbs__link[href]', tag: 'a' } });
});

test('every shipped budget is what the historical rule renders, and none is N-1 by assumption', () => {
  const budgets = Object.fromEntries(cases.map((entry) => [entry.id, entry.componentInteractive]));

  assert.equal(budgets['breadcrumbs/trail'], 2);
  assert.equal(budgets['breadcrumbs/one-with-href'], 0);
  assert.equal(budgets['breadcrumbs/last-href-dropped'], 1);
  assert.equal(budgets['breadcrumbs/explicit-current'], 2);
  assert.equal(budgets['breadcrumbs/two-currents'], 1);
  assert.equal(budgets['breadcrumbs/disabled'], 1);
  assert.equal(budgets['breadcrumbs/href-empty'], 1);
  assert.equal(budgets['breadcrumbs/five'], 4);
});

test('the generic ownership code names no anchor and no breadcrumb', () => {
  const source = readFileSync(resolve(repositoryRoot, 'scripts/parity/extract.mjs'), 'utf8');
  const start = source.indexOf('const OWNERSHIP_CHECKS');
  const end = source.indexOf('export function controlOwnershipViolations');
  const generic =
    source.slice(start, end) + source.slice(end, source.indexOf('}', source.indexOf('return OWNERSHIP_CHECKS')));

  assert.doesNotMatch(generic, /breadcrumb/i);
  assert.doesNotMatch(generic, /anchor|<a>|href/);
});
