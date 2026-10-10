import assert from 'node:assert/strict';
import { test } from 'node:test';

import { accordionPolicyMutations } from './accordion-mutations.mjs';
import { alertPolicyMutations } from './alert-mutations.mjs';
import { breadcrumbsPolicyMutations } from './breadcrumbs-mutations.mjs';
import { buttonPolicyMutations } from './button-mutations.mjs';
import { checkboxPolicyMutations, radioPolicyMutations, switchPolicyMutations } from './checkable-mutations.mjs';
import { summariseApprovals, validatePolicy } from './compare.mjs';
import { dropdownPolicyMutations } from './dropdown-mutations.mjs';
import { fieldPolicyMutations } from './field-mutations.mjs';
import { fieldsetPolicyMutations } from './fieldset-mutations.mjs';
import { groupBoxPolicyMutations } from './group-box-mutations.mjs';
import { iconButtonPolicyMutations } from './icon-button-mutations.mjs';
import { linkPolicyMutations } from './link-mutations.mjs';
import { avatarPolicyMutations, cardPolicyMutations, skeletonPolicyMutations } from './m16-mutations.mjs';
import { menuItemPolicyMutations, menuPolicyMutations } from './menu-mutations.mjs';
import {
  accountSuite,
  POLICY_REJECTIONS,
  policyMutationsBeforeRun,
  policyMutationsOnRun,
} from './mutation-accounting.mjs';
import { policyMutations } from './mutations.mjs';
import { navMenuPolicyMutations } from './nav-menu-mutations.mjs';
import { panelPolicyMutations } from './panel-mutations.mjs';
import { popoverPolicyMutations } from './popover-mutations.mjs';
import { badgePolicyMutations, dividerPolicyMutations, tagPolicyMutations } from './presentation-mutations.mjs';
import { loadProfile, profiles } from './profiles.mjs';
import { progressBarPolicyMutations } from './progress-bar-mutations.mjs';
import { progressSpinnerPolicyMutations } from './progress-spinner-mutations.mjs';
import { loadCatalog, loadParityPolicy } from './run.mjs';
import { selectPolicyMutations } from './select-mutations.mjs';
import { skeletonGatePolicyMutations } from './skeleton-gate-mutations.mjs';
import { stepperPolicyMutations } from './stepper-mutations.mjs';
import { tablePolicyMutations } from './table-mutations.mjs';
import { tabsPolicyMutations } from './tabs-mutations.mjs';
import { textareaPolicyMutations } from './textarea-mutations.mjs';
import { tooltipPolicyMutations } from './tooltip-mutations.mjs';

/** Every profile's registry mutations, as check-input-parity-mutations.mjs pairs them. */
const policyMutationsByProfile = {
  input: policyMutations,
  'icon-button': iconButtonPolicyMutations,
  field: fieldPolicyMutations,
  button: buttonPolicyMutations,
  textarea: textareaPolicyMutations,
  checkbox: checkboxPolicyMutations,
  radio: radioPolicyMutations,
  switch: switchPolicyMutations,
  badge: badgePolicyMutations,
  tag: tagPolicyMutations,
  divider: dividerPolicyMutations,
  skeleton: skeletonPolicyMutations,
  avatar: avatarPolicyMutations,
  card: cardPolicyMutations,
  panel: panelPolicyMutations,
  alert: alertPolicyMutations,
  'progress-spinner': progressSpinnerPolicyMutations,
  'progress-bar': progressBarPolicyMutations,
  'skeleton-gate': skeletonGatePolicyMutations,
  accordion: accordionPolicyMutations,
  stepper: stepperPolicyMutations,
  tabs: tabsPolicyMutations,
  link: linkPolicyMutations,
  breadcrumbs: breadcrumbsPolicyMutations,
  menu: menuPolicyMutations,
  menuItem: menuItemPolicyMutations,
  dropdown: dropdownPolicyMutations,
  'group-box': groupBoxPolicyMutations,
  popover: popoverPolicyMutations,
  tooltip: tooltipPolicyMutations,
  select: selectPolicyMutations,
  'nav-menu': navMenuPolicyMutations,
  fieldset: fieldsetPolicyMutations,
  table: tablePolicyMutations,
};

function realPolicyPhase(profileId) {
  const profile = loadProfile(profileId);
  const catalog = loadCatalog(profile);
  const policy = loadParityPolicy(profile);
  const caseIds = catalog.cases.map((parityCase) => parityCase.id);
  return { policy, validate: (mutated) => validatePolicy(mutated, caseIds) };
}

/**
 * The comparison of a clean IconButton run under a registry.
 *
 * The clean VfIconButton comparison has no raw difference at all (zero
 * failures and zero approved divergences, M35.5b), so compareCaptures under
 * any registry approves nothing and fails nothing: its result is exactly the
 * per-rule usage of that registry over no differences. `approved` lets a test
 * feed differences the rule would match.
 */
const cleanIconButtonRun =
  (approved = []) =>
  (mutated) => ({ failures: [], approvalProblems: summariseApprovals(mutated, approved).problems });

const suite = (policy, capture = [], browser = []) => ({
  policy: policy.map((id) => ({ id })),
  capture: capture.map((id) => ({ id })),
  browser: browser.map((id) => ({ id })),
});

// ------------------------------------------------------------------ A. usage

test('smuggled-dead-rule survives validation and is rejected by the usage accounting on the real run', () => {
  const { policy, validate } = realPolicyPhase('icon-button');
  // Zero rules: the unmutated registry approves nothing on any run.
  assert.equal(policy.approvedDivergences.length, 0);

  const before = policyMutationsBeforeRun(iconButtonPolicyMutations, policy, validate);
  assert.deepEqual(
    before.results.map(({ id, status }) => [id, status]),
    [
      ['smuggled-structure-approval', 'rejected'],
      ['smuggled-visual-approval', 'rejected'],
      ['smuggled-wildcard-case', 'rejected'],
    ],
  );
  assert.deepEqual(
    before.pending.map((mutation) => mutation.id),
    ['smuggled-dead-rule'],
  );

  const onRun = policyMutationsOnRun(before.pending, policy, cleanIconButtonRun());
  assert.equal(onRun.length, 1);
  assert.equal(onRun[0].id, 'smuggled-dead-rule');
  assert.equal(onRun[0].status, 'rejected');
  assert.match(onRun[0].detail, /approval "never-matches-anything" matched nothing/);

  const accounting = accountSuite({ policy: iconButtonPolicyMutations, capture: [], browser: [] }, [
    ...before.results,
    ...onRun,
  ]);
  assert.deepEqual(accounting.problems, []);
  assert.equal(accounting.complete, true);
  assert.deepEqual(accounting.passing, { policy: 4, capture: 0, browser: 0 });
});

test('the dead-rule verdict depends on the usage it is given, so it cannot pass by default', () => {
  const { policy } = realPolicyPhase('icon-button');
  const deadRule = iconButtonPolicyMutations.filter((mutation) => mutation.id === 'smuggled-dead-rule');

  // The same rule, fed exactly the four differences it was written for, is
  // accepted by the run: the rejection above came from the usage accounting.
  const matched = Array.from({ length: 4 }, (_, index) => ({
    approvalId: 'never-matches-anything',
    caseId: 'icon-button/default',
    direction: 'reference-vs-razor',
    path: index,
  }));
  const [accepted] = policyMutationsOnRun(deadRule, policy, cleanIconButtonRun(matched));
  assert.equal(accepted.status, 'missed');

  // And a comparison that reports nothing turns every pending mutation into a miss.
  const [silent] = policyMutationsOnRun(deadRule, policy, () => ({ failures: [], approvalProblems: [] }));
  assert.equal(silent.status, 'missed');
});

// ------------------------------------------------------- B. unknown rejection

test('a rejection kind the driver does not run fails before capture and is never applied', () => {
  let applied = false;
  const declared = (rejectedBy) => ({
    id: `declares-${rejectedBy}`,
    description: 'a registry mutation with an unrunnable rejection',
    rejectedBy,
    apply() {
      applied = true;
    },
  });

  for (const rejectedBy of ['usage', 'occurence', undefined]) {
    const mutation = declared(rejectedBy);
    const { results, pending } = policyMutationsBeforeRun([mutation], { approvedDivergences: [] }, () => []);
    assert.deepEqual(pending, []);
    assert.equal(results.length, 1);
    assert.equal(results[0].id, mutation.id);
    assert.equal(results[0].status, 'unsupported-rejection');
    assert.notEqual(results[0].status, 'rejected');
    assert.equal(accountSuite({ policy: [mutation], capture: [], browser: [] }, results).complete, false);
  }
  assert.equal(applied, false);
});

test('every registry mutation of every suite declares a rejection kind the driver runs', () => {
  assert.deepEqual(Object.keys(policyMutationsByProfile).sort(), Object.keys(profiles).sort());
  const unsupported = Object.entries(policyMutationsByProfile).flatMap(([profileId, mutations]) =>
    mutations
      .filter((mutation) => !POLICY_REJECTIONS.includes(mutation.rejectedBy))
      .map((mutation) => `${profileId}/${mutation.id}: ${mutation.rejectedBy}`),
  );
  assert.deepEqual(unsupported, []);
});

// ------------------------------------------------- C, D. missing and duplicate

test('a registered mutation without a result fails the suite', () => {
  const accounting = accountSuite(suite(['p'], ['c'], ['b']), [
    { id: 'p', status: 'rejected' },
    { id: 'c', status: 'detected' },
  ]);
  assert.deepEqual(accounting.missing, ['b']);
  assert.deepEqual(accounting.problems, ['b: registered, but produced no result']);
  assert.equal(accounting.complete, false);
});

test('a mutation with two results fails the suite, even when both pass', () => {
  const accounting = accountSuite(suite(['p'], ['c']), [
    { id: 'p', status: 'rejected' },
    { id: 'c', status: 'detected' },
    { id: 'c', status: 'detected' },
  ]);
  assert.deepEqual(accounting.duplicates, ['c']);
  assert.deepEqual(accounting.problems, ['c: produced 2 results']);
  assert.equal(accounting.complete, false);
});

test('a result nobody registered, a registration made twice and a pass of the wrong kind each fail the suite', () => {
  assert.deepEqual(
    accountSuite(suite(['p']), [
      { id: 'p', status: 'rejected' },
      { id: 'ghost', status: 'detected' },
    ]).problems,
    ['ghost: a result for a mutation that is not registered'],
  );
  const twice = accountSuite(suite(['p'], ['p']), [{ id: 'p', status: 'rejected' }]);
  assert.equal(twice.registered, 2);
  assert.ok(twice.problems.includes('p: registered more than once'));
  assert.equal(twice.complete, false);
  assert.deepEqual(accountSuite(suite(['p']), [{ id: 'p', status: 'detected' }]).problems, [
    'p: a policy mutation reported detected, it can only pass as rejected',
  ]);
});

// --------------------------------------------------------- E. aggregate counts

test('every count is read from the results, and registered = detected + rejected only when each passed once', () => {
  const mutations = suite(['p1', 'p2'], ['c1', 'c2', 'c3'], ['b1']);
  const passing = [
    { id: 'p1', status: 'rejected' },
    { id: 'p2', status: 'rejected' },
    { id: 'c1', status: 'detected' },
    { id: 'c2', status: 'detected' },
    { id: 'c3', status: 'detected' },
    { id: 'b1', status: 'detected' },
  ];
  const accounting = accountSuite(mutations, passing);
  assert.equal(accounting.registered, 6);
  assert.equal(accounting.accounted, 6);
  assert.deepEqual(accounting.byStatus, { rejected: 2, detected: 4 });
  assert.deepEqual(accounting.passing, { policy: 2, capture: 3, browser: 1 });
  assert.equal(accounting.registered, accounting.byStatus.detected + accounting.byStatus.rejected);
  assert.equal(accounting.complete, true);

  // A miss is a result, counted as such, and never as a pass.
  const withMiss = passing.map((result) => (result.id === 'b1' ? { ...result, status: 'missed' } : result));
  const missed = accountSuite(mutations, withMiss);
  assert.deepEqual(missed.byStatus, { rejected: 2, detected: 3, missed: 1 });
  assert.deepEqual(missed.passing, { policy: 2, capture: 3, browser: 0 });
  assert.deepEqual(missed.problems, []);
  assert.equal(missed.complete, false);
});

// ------------------------------------------------------ F. existing behaviour

test('every other registry mutation keeps its pre-capture verdict on the real registries', () => {
  for (const [profileId, mutations] of Object.entries(policyMutationsByProfile)) {
    const { policy, validate } = realPolicyPhase(profileId);
    const { results, pending } = policyMutationsBeforeRun(mutations, policy, validate);

    for (const mutation of mutations) {
      const decided = results.filter((result) => result.id === mutation.id);
      const waiting = pending.filter((entry) => entry.id === mutation.id);
      if (mutation.rejectedBy === 'validation') {
        assert.deepEqual(
          decided.map((result) => result.status),
          ['rejected'],
          `${profileId}/${mutation.id}: ${decided[0]?.detail}`,
        );
        assert.equal(waiting.length, 0);
      } else {
        assert.equal(decided.length, 0, `${profileId}/${mutation.id}: ${decided[0]?.detail}`);
        assert.equal(waiting.length, 1, `${profileId}/${mutation.id} is not left for the run`);
      }
    }
    assert.equal(results.length + pending.length, mutations.length);
  }
});
