// The VfNavMenu coverage gate, attacked (M33).
//
// The committed catalog passes; every eroded one fails on the rule that was
// eroded. Each requirement is eroded by removing, one at a time, the cases
// that satisfy it until it no longer holds - so a requirement that any single
// surviving case could still satisfy is not reported as eroded when it is not.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import {
  REQUIREMENTS,
  derivedCaseBudget,
  navMenuCoverageViolations,
  simulate,
  stepProblem,
} from './nav-menu-coverage.mjs';

const root = resolve(import.meta.dirname, '../..');
const catalog = JSON.parse(readFileSync(resolve(root, 'contracts/nav-menu/cases.json'), 'utf8'));
const policy = JSON.parse(readFileSync(resolve(root, 'contracts/nav-menu/parity-policy.json'), 'utf8'));
const clone = (value) => structuredClone(value);
const fires = (violations, text) => violations.some((violation) => violation.includes(text));

test('the committed catalog and policy meet every rule', () => {
  assert.deepEqual(navMenuCoverageViolations(catalog, policy), []);
});

test('every requirement is named, and there are enough of them to mean something', () => {
  assert.ok(Object.keys(REQUIREMENTS).length >= 45, Object.keys(REQUIREMENTS).join(', '));
});

for (const [name, requirement] of Object.entries(REQUIREMENTS)) {
  if (['no-controlled-divergence', 'no-approvals'].includes(name)) continue;
  test(`eroding the cases behind [${name}] fails on that rule`, () => {
    const eroded = clone(catalog);
    for (const entry of [...catalog.cases].reverse()) {
      if (!requirement(eroded, policy)) break;
      const without = { ...eroded, cases: eroded.cases.filter((candidate) => candidate.id !== entry.id) };
      if (requirement(without, policy) !== requirement(eroded, policy) || requirement(without, policy)) {
        eroded.cases = without.cases;
      }
    }
    assert.equal(requirement(eroded, policy), false, `could not erode [${name}]`);
    assert.ok(fires(navMenuCoverageViolations(eroded, policy), `requirement [${name}]`));
  });
}

test('a policy without the controlled-mode divergence, missing a half, or with an approval fails', () => {
  const missing = clone(policy);
  missing.platformDivergences = [];
  assert.ok(fires(navMenuCoverageViolations(catalog, missing), 'requirement [no-controlled-divergence]'));
  const halved = clone(policy);
  delete halved.platformDivergences[0].razorHalfCoveredBy;
  assert.ok(fires(navMenuCoverageViolations(catalog, halved), 'requirement [no-controlled-divergence]'));
  const approved = clone(policy);
  approved.approvedDivergences = [{ id: 'anything' }];
  assert.ok(fires(navMenuCoverageViolations(catalog, approved), 'requirement [no-approvals]'));
});

test('an item `to` is refused: the router branch is Vue-only', () => {
  const eroded = clone(catalog);
  eroded.cases[0].props.items[0].to = '/guide';
  assert.ok(fires(navMenuCoverageViolations(eroded, policy), 'uses `to`'));
});

test('a link that would leave the page, an unknown prop and an unknown content key are refused', () => {
  const eroded = clone(catalog);
  eroded.cases[0].props.items[2].href = '/changelog';
  eroded.cases[1].props.dense = true;
  eroded.cases[2].content.height = 10;
  const violations = navMenuCoverageViolations(eroded, policy);
  assert.ok(fires(violations, 'is not a hash link'));
  assert.ok(fires(violations, 'uses prop [dense]'));
  assert.ok(fires(violations, 'uses content [height]'));
});

test('a declared budget that is not the rendered tree fails, initial and at the end', () => {
  const eroded = clone(catalog);
  const scenario = eroded.cases.find((entry) => entry.interaction);
  eroded.cases[0].componentInteractive += 1;
  scenario.interaction.componentInteractive -= 1;
  const violations = navMenuCoverageViolations(eroded, policy);
  assert.ok(fires(violations, `${eroded.cases[0].id} declares`));
  assert.ok(fires(violations, `${scenario.id} declares an end budget`));
});

test('an expectation the reference rules contradict fails', () => {
  const eroded = clone(catalog);
  const scenario = eroded.cases.find((entry) => entry.interaction?.expect?.expandedLabels?.length);
  scenario.interaction.expect.expandedLabels = [];
  assert.ok(fires(navMenuCoverageViolations(eroded, policy), `${scenario.id} expects expandedLabels`));
});

test('clicking a natively disabled control or a _blank link is refused as a step', () => {
  const items = [
    { value: 'a', label: 'A', disabled: true },
    { value: 'b', label: 'B', href: '#b', target: '_blank' },
  ];
  assert.throws(
    () => simulate({ items }, [{ action: 'clickButton', selector: '.vf-nav-menu__item', index: 0 }]),
    /natively disabled/,
  );
  assert.throws(
    () => simulate({ items }, [{ action: 'clickButton', selector: '.vf-nav-menu__item', index: 1 }]),
    /second page/,
  );
  assert.equal(stepProblem({ action: 'pressKey', key: 'Home' }), 'pressKey "Home" is not in the vocabulary');
});

test('the derived budget counts branches, buttons and links and never groups', () => {
  const items = [
    {
      value: 'g',
      kind: 'group',
      label: 'G',
      children: [{ value: 'b', label: 'B', children: [{ value: 'c', label: 'C' }] }],
    },
  ];
  assert.equal(derivedCaseBudget({ props: { items } }), 1);
  assert.equal(derivedCaseBudget({ props: { items, defaultValue: 'c' } }), 2);
});
