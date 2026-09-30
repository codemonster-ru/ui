// The VfSelect coverage gate, attacked (M32).
//
// The committed catalog passes; every eroded one fails on the rule that was
// eroded. Each requirement is eroded by removing, one at a time, the cases
// that satisfy it until it no longer holds - so a requirement that any single
// surviving case could still satisfy is not reported as eroded when it is not.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';

import { REQUIREMENTS, derivedCaseBudget, selectCoverageViolations, stepProblem } from './select-coverage.mjs';

const root = resolve(import.meta.dirname, '../..');
const catalog = JSON.parse(readFileSync(resolve(root, 'contracts/select/cases.json'), 'utf8'));
const policy = JSON.parse(readFileSync(resolve(root, 'contracts/select/parity-policy.json'), 'utf8'));
const clone = (value) => structuredClone(value);
const fires = (violations, text) => violations.some((violation) => violation.includes(text));

test('the committed catalog and policy meet every rule', () => {
  assert.deepEqual(selectCoverageViolations(catalog, policy), []);
});

test('every requirement is named, and there are enough of them to mean something', () => {
  assert.ok(Object.keys(REQUIREMENTS).length >= 30, Object.keys(REQUIREMENTS).join(', '));
});

for (const [name, requirement] of Object.entries(REQUIREMENTS)) {
  if (['no-writeback-divergence', 'no-activedescendant'].includes(name)) continue;
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
    assert.ok(fires(selectCoverageViolations(eroded, policy), `requirement [${name}]`));
  });
}

test('a policy without the controlled-mode divergence, or missing one of its halves, fails', () => {
  const missing = clone(policy);
  missing.platformDivergences = [];
  assert.ok(fires(selectCoverageViolations(catalog, missing), 'requirement [no-writeback-divergence]'));

  const halved = clone(policy);
  delete halved.platformDivergences[0].razorHalfCoveredBy;
  assert.ok(fires(selectCoverageViolations(catalog, halved), 'requirement [no-writeback-divergence]'));
});

test('an expected aria-activedescendant anywhere fails', () => {
  const eroded = clone(catalog);
  const scenario = eroded.cases.find((entry) => entry.interaction?.expect?.listboxRelationships);
  scenario.interaction.expect.listboxRelationships[0].activedescendant = true;
  assert.ok(fires(selectCoverageViolations(eroded, policy), 'requirement [no-activedescendant]'));
});

test('the vocabularies are closed', () => {
  const eroded = clone(catalog);
  eroded.cases[0].props.teleportTo = '#elsewhere';
  eroded.cases[1].props.options = [{ value: 1, label: 'One' }];
  eroded.cases[2].content = { slot: { text: 'x' } };
  const violations = selectCoverageViolations(eroded, policy);
  assert.ok(fires(violations, 'prop [teleportTo] is not in the select vocabulary'));
  assert.ok(fires(violations, 'prop [options] has a value the vocabulary refuses'));
  assert.ok(fires(violations, 'content [slot] is not in the select vocabulary'));
});

test('steps outside the vocabulary are refused, and Tab only from an in-place listbox', () => {
  const teleported = { props: { options: [] } };
  const inPlace = { props: { options: [], disableTeleport: true } };
  assert.match(stepProblem({ action: 'pressKey', key: 'Tab' }, teleported), /leaves the document/);
  assert.equal(stepProblem({ action: 'pressKey', key: 'Tab' }, inPlace), null);
  assert.match(stepProblem({ action: 'pressKey', key: 'PageDown' }, inPlace), /does not press/);
  assert.match(stepProblem({ action: 'clickButton', selector: '.vf-select__value' }, inPlace), /cannot target/);
  assert.match(
    stepProblem(
      {
        action: 'clickButton',
        selector: '.vf-select__option',
        through: { selector: 'button.vf-select', attribute: 'aria-controls' },
      },
      inPlace,
    ),
    /only land on an option/,
  );
  assert.match(stepProblem({ action: 'hover', selector: 'button.vf-select' }, inPlace), /unknown step/);
});

test('a budget the catalog types instead of deriving is refused, at the case and at the end of a scenario', () => {
  const eroded = clone(catalog);
  const clearable = eroded.cases.find((entry) => entry.id === 'select/clearable');
  assert.equal(derivedCaseBudget(clearable).componentInteractive, 2);
  clearable.componentInteractive = 1;
  const open = eroded.cases.find((entry) => entry.id === 'select/interaction-click-open');
  open.interaction.componentInteractive = 1;
  const violations = selectCoverageViolations(eroded, policy);
  assert.ok(fires(violations, 'select/clearable: componentInteractive 1 is not the derived 2'));
  assert.ok(fires(violations, 'select/interaction-click-open: the scenario ends with componentInteractive 1'));
});

test('a claim about something the snapshot does not record, or a scenario not settled, fails', () => {
  const eroded = clone(catalog);
  const scenario = eroded.cases.find((entry) => entry.interaction);
  scenario.interaction.expect.caret = 0;
  scenario.interaction.expect.settled = false;
  const violations = selectCoverageViolations(eroded, policy);
  assert.ok(fires(violations, 'the snapshot does not record [caret]'));
  assert.ok(fires(violations, 'a scenario ends settled'));
});

test('a convergence onto a missing or interactive case fails', () => {
  const eroded = clone(catalog);
  const closing = eroded.cases.find((entry) => entry.matches);
  closing.matches = 'select/interaction-click-open';
  assert.ok(fires(selectCoverageViolations(eroded, policy), 'matches names no static case'));
});
