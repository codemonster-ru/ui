// The multi-kind, explicit-role ownership proof required by sections 18, 19
// and 49 of the M24 plan, as evidence rather than as comment.
//
// M22 and M23 proved that the harness can say a component owns exactly the
// native buttons it declares, by identity, and that no owned control carries
// an explicit interactive role. VfTabs is the first migrated component whose
// controls *must* carry one - `button[role=tab]` - and whose one instance owns
// several kinds of control at once: N tabs, two scroll buttons, at most one
// panel. The old invariant (`interactiveRoleTotal === 0`) rejected the correct
// reference render of tabs/default: "measured 3 element(s) carrying an
// explicit interactive role" - the refusal is preserved in the milestone's
// evidence. The narrowest extension is the one asserted here, against the
// real function the runner calls: a rule may declare `ariaRole`, and then
//
//   A. every owned control of that rule carrying exactly it       -> PASS
//   B. a rule without ariaRole and a control with a role           -> FAIL (old rule unchanged)
//   C. the role absent from one tab                                -> FAIL
//   D. the role substituted (role=button) on one tab               -> FAIL, roles total unchanged
//   E. an extra role-bearing owned control (scroll button role=tab) -> FAIL
//   F. the role moved from a tab to a scroll button                -> FAIL, roles total unchanged
//   G. the right role on the wrong tag                             -> FAIL (identity)
//   H. an undeclared role on a node no rule owns                   -> FAIL
//   I. a snapshot that records no role at all                      -> FAIL (fail closed)
//   J. an empty ariaRole in the declaration                        -> FAIL CLOSED
//   K. the panel counted, the scroll buttons counted, by kind      -> PASS / FAIL when one is missing
//   L. one tab removed and one scroll button added, sum unchanged  -> the assertion alone accepts it;
//      the reference direction of the run catches it on ownership.controls and dom.structure,
//      which is recorded here as a limit, not hidden (section 19: no per-role budget)
//
// And the rule the plan makes explicit: the generic code names no tab.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { controlOwnershipViolations } from './extract.mjs';
import { profiles } from './profiles.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/tabs/cases.json'), 'utf8')).cases;
const byId = (id) => cases.find((entry) => entry.id === id);

const profile = profiles.tabs;

/** One owned control, as the browser expression records it. */
function control(role, overrides = {}) {
  const base = {
    tab: { tag: 'button', type: 'button', ariaRole: 'tab', selected: 'false', tabindex: '-1' },
    scrollLeft: { tag: 'button', type: 'button', ariaRole: null, hidden: true, tabindex: '-1' },
    scrollRight: { tag: 'button', type: 'button', ariaRole: null, hidden: true, tabindex: '-1' },
    panel: { tag: 'div', type: null, ariaRole: 'tabpanel', tabindex: '0' },
  }[role];
  return { role, path: `div.vf-tabs>${role}`, disabled: false, focusable: true, name: role, ...base, ...overrides };
}

const tabs = () => [control('tab', { selected: 'true', tabindex: '0' }), control('tab'), control('tab')];
const buttons = () => [control('scrollLeft'), control('scrollRight')];

/** A snapshot exactly as the browser expression produces it, ownership half only. */
function snapshot({
  componentControls = [...tabs(), ...buttons()],
  consumerControlCount = 0,
  focusableTotal,
  interactiveRoleTotal,
} = {}) {
  return {
    ownershipPosture: 'component',
    componentControls,
    consumerControlCount,
    focusableTotal: focusableTotal ?? componentControls.length + consumerControlCount,
    interactiveRoleTotal: interactiveRoleTotal ?? componentControls.filter((entry) => entry.ariaRole === 'tab').length,
  };
}

const plain = byId('tabs/default');
const withPanel = byId('tabs/panel');
const before = byId('tabs/before-consumer-button');

test('the fixture cases this proof depends on are still in the shipped catalog', () => {
  assert.equal(plain.componentInteractive, 5);
  assert.equal(withPanel.componentInteractive, 6);
  assert.equal(before.componentInteractive, 6);
  assert.equal(before.consumerInteractive, 1);
  assert.deepEqual(profile.controlOwnership, {
    tab: { selector: '.vf-tabs__tab', tag: 'button', ariaRole: 'tab' },
    scrollLeft: { selector: '.vf-tabs__scroll-button--left', tag: 'button' },
    scrollRight: { selector: '.vf-tabs__scroll-button--right', tag: 'button' },
    panel: { selector: '.vf-tabs__panel', tag: 'div' },
  });
});

// ------------------------------------------------------------- A. control

test('A. three tabs carrying exactly the declared role, two scroll buttons, no panel, passes', () => {
  assert.deepEqual(controlOwnershipViolations(plain, snapshot(), profile), []);
});

test('A. the panel is the sixth owned control, by its own kind', () => {
  const controls = [...tabs(), ...buttons(), control('panel')];
  assert.deepEqual(controlOwnershipViolations(withPanel, snapshot({ componentControls: controls }), profile), []);
});

test("A. a consumer button before the tabs is the consumer's and the sum still holds", () => {
  const controls = [...tabs(), ...buttons(), control('panel')];
  assert.deepEqual(
    controlOwnershipViolations(before, snapshot({ componentControls: controls, consumerControlCount: 1 }), profile),
    [],
  );
});

// ------------------------------------------- B. the old rule unchanged

test('B. a profile whose rules declare no ariaRole still rejects any explicit interactive role', () => {
  const stepperLike = { id: 'x', controlOwnership: { trigger: { selector: '.t', tag: 'button' } } };
  const owned = [{ role: 'trigger', tag: 'button', ariaRole: 'button' }];
  const violations = controlOwnershipViolations(
    { id: 'c', componentInteractive: 1 },
    snapshot({ componentControls: owned, interactiveRoleTotal: 1 }),
    stepperLike,
  );
  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 1 element\(s\) carrying an explicit interactive role/);
});

test('B. the accepted stepper profile is unchanged by the extension: its clean snapshot still passes and a role still fails', () => {
  const stepper = profiles.stepper;
  const stepperCase = { id: 'stepper/x', componentInteractive: 1 };
  const clean = { role: 'trigger', tag: 'button', type: 'button', disabled: false, focusable: true };
  assert.deepEqual(
    controlOwnershipViolations(stepperCase, snapshot({ componentControls: [clean], interactiveRoleTotal: 0 }), stepper),
    [],
  );
  assert.equal(
    controlOwnershipViolations(
      stepperCase,
      snapshot({ componentControls: [{ ...clean, ariaRole: 'tab' }], interactiveRoleTotal: 1 }),
      stepper,
    ).length,
    1,
  );
});

// ------------------------------------------------------------ C. absent

test('C. a tab without its role fails on identity, with the count untouched', () => {
  const controls = [...tabs(), ...buttons()];
  controls[1] = control('tab', { ariaRole: null });
  const violations = controlOwnershipViolations(plain, snapshot({ componentControls: controls }), profile);
  assert.ok(
    violations.some((entry) => /the tab carries role=null, not the declared role="tab"/.test(entry)),
    violations.join('; '),
  );
});

// ------------------------------------------------------- D. substituted

test('D. a tab carrying role=button fails, although the total of explicit roles is unchanged', () => {
  const controls = [...tabs(), ...buttons()];
  controls[1] = control('tab', { ariaRole: 'button' });
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: controls, interactiveRoleTotal: 3 }),
    profile,
  );
  assert.equal(violations.length, 1);
  assert.match(violations[0], /carries role="button", not the declared role="tab"/);
});

// ------------------------------------------------------- E. extra role

test('E. a scroll button carrying role=tab fails: an explicit role no rule declared for it', () => {
  const controls = [...tabs(), ...buttons()];
  controls[3] = control('scrollLeft', { ariaRole: 'tab' });
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: controls, interactiveRoleTotal: 4 }),
    profile,
  );
  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 4 element\(s\) carrying an explicit interactive role/);
});

// ------------------------------------------------- F. role moved across

test('F. the role moved from a tab to a scroll button fails on the tab, with the roles total unchanged', () => {
  const controls = [...tabs(), ...buttons()];
  controls[1] = control('tab', { ariaRole: null });
  controls[3] = control('scrollLeft', { ariaRole: 'tab' });
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: controls, interactiveRoleTotal: 3 }),
    profile,
  );
  assert.equal(violations.length, 1);
  assert.match(violations[0], /carries role=null, not the declared role="tab"/);
});

// --------------------------------------------------------- G. wrong tag

test('G. a div with role=tab in place of a tab fails on tag identity before its role is even looked at', () => {
  const controls = [...tabs(), ...buttons()];
  controls[1] = control('tab', { tag: 'div', type: null });
  const violations = controlOwnershipViolations(plain, snapshot({ componentControls: controls }), profile);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /the tab is a <div>, not the declared <button>/);
});

// --------------------------------------------------- H. undeclared node

test('H. an explicit role on a node no rule owns fails on the roles total', () => {
  const violations = controlOwnershipViolations(plain, snapshot({ interactiveRoleTotal: 4 }), profile);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /measured 4 element\(s\) carrying an explicit interactive role/);
});

// ----------------------------------------------------- I/J. fail closed

test('I. a snapshot whose records carry no ariaRole field fails for a rule that declares one', () => {
  const controls = [...tabs(), ...buttons()].map((entry) => {
    const stripped = { ...entry };
    delete stripped.ariaRole;
    return stripped;
  });
  const violations = controlOwnershipViolations(
    plain,
    snapshot({ componentControls: controls, interactiveRoleTotal: 3 }),
    profile,
  );
  assert.ok(violations.some((entry) => /carries role=null, not the declared role="tab"/.test(entry)));
});

test('J. an empty ariaRole in the declaration is unusable and fails closed', () => {
  const broken = { id: 'tabs', controlOwnership: { tab: { selector: '.vf-tabs__tab', tag: 'button', ariaRole: '' } } };
  const violations = controlOwnershipViolations(plain, snapshot(), broken);
  assert.equal(violations.length, 1);
  assert.match(violations[0], /declares control \[tab\] without a selector and a tag, or with an empty ariaRole/);
});

// ----------------------------------------------------------- K. by kind

test('K. a missing scroll button fails on the count, and a missing panel too', () => {
  const noLeft = [...tabs(), control('scrollRight')];
  assert.match(
    controlOwnershipViolations(plain, snapshot({ componentControls: noLeft }), profile)[0],
    /measured 4 component-owned control\(s\) but the catalog declares 5/,
  );
  const noPanel = [...tabs(), ...buttons()];
  assert.match(
    controlOwnershipViolations(withPanel, snapshot({ componentControls: noPanel }), profile)[0],
    /measured 5 component-owned control\(s\) but the catalog declares 6/,
  );
});

test('K. a scroll button that became a div fails on identity', () => {
  const controls = [...tabs(), control('scrollLeft', { tag: 'div', type: null }), control('scrollRight')];
  assert.match(
    controlOwnershipViolations(plain, snapshot({ componentControls: controls }), profile)[0],
    /the scrollLeft is a <div>, not the declared <button>/,
  );
});

test("K. the consumer's button counted as a tab fails on the consumer budget and the roles total", () => {
  const controls = [...tabs(), ...buttons(), control('panel'), control('tab', { name: 'Before' })];
  const violations = controlOwnershipViolations(
    before,
    snapshot({ componentControls: controls, consumerControlCount: 0, focusableTotal: 7 }),
    profile,
  );
  assert.ok(
    violations.some((entry) => /measured 7 component-owned control\(s\) but the catalog declares 6/.test(entry)),
  );
  assert.ok(violations.some((entry) => /measured 0 consumer control\(s\) but the catalog declares 1/.test(entry)));
});

// --------------------------------------------------------- L. the limit

test('L. one tab removed and one scroll button added, sum and roles consistent, passes the assertion alone - a recorded limit', () => {
  // Section 19, attack O. The standalone assertion is count + per-control
  // identity, and this substitution keeps both. It is not a hole in the gate:
  // the run compares the ownership record and the DOM across targets, and
  // the reference direction fails on ownership.controls (three tab records
  // against two) and dom.structure - proved by the browser mutation
  // browser-tabs-tab-removed-scroll-button-added. A per-role budget would
  // close it in the assertion at the price of a new generic concept, which
  // section 19 forbids while the reference direction already sees it.
  const controls = [
    control('tab', { selected: 'true', tabindex: '0' }),
    control('tab'),
    control('scrollLeft'),
    control('scrollLeft'),
    control('scrollRight'),
  ];
  assert.deepEqual(controlOwnershipViolations(plain, snapshot({ componentControls: controls }), profile), []);
});

// ------------------------------------------------- the generic code names no tab

test('the generic ownership code names neither tab nor VfTabs', () => {
  const source = readFileSync(resolve(repositoryRoot, 'scripts/parity/extract.mjs'), 'utf8');
  const start = source.indexOf('const OWNERSHIP_CHECKS');
  const end = source.indexOf('function accordionInteractionExpression');
  assert.ok(start > 0 && end > start);
  const generic = source.slice(start, end);
  assert.doesNotMatch(generic, /['"]tab['"]|VfTabs|vf-tabs/);
});
