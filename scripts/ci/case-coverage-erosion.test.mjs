// The attacks the M10 re-audit used to walk past the coverage guard.
//
// Each test mutates a copy of the real catalog the way an eroding change
// actually would, then asserts that the semantic rules fire and name the
// coverage that was lost. The point of running them against the shipped
// catalog rather than a fixture is that a fixture would keep passing after
// the real catalog changed shape.
//
// Every attack also asserts the mutation landed. A test that silently stopped
// mutating anything - because a case id was renamed, say - would otherwise
// keep reporting that the guard defends against an attack nobody performed.
//
// The count floor is deliberately not what these assert on. It was the only
// detector that fired before M10.1, and attack B defeats it with three lines
// of padding, so a failure that is only about case count is not evidence the
// coverage rules work.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { activationCoverageViolations } from './case-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CASES_PATH = 'contracts/icon-button/cases.json';
const FLOOR = 29;

/** A fresh deep copy, so one attack cannot leak into the next. */
const loadCases = () => JSON.parse(readFileSync(resolve(repositoryRoot, CASES_PATH), 'utf8')).cases;

const byId = (cases, id) => cases.find((entry) => entry.id === id);

const ENABLED_ENTER = 'icon-button/interaction-enter';
const ENABLED_SPACE = 'icon-button/interaction-space';
const DISABLED_KEYBOARD = 'icon-button/interaction-disabled-keyboard';

/** Removes a case, asserting it was actually there to remove. */
function drop(cases, id) {
  const remaining = cases.filter((entry) => entry.id !== id);
  assert.equal(remaining.length, cases.length - 1, `attack did not apply: ${id} was not in the catalog`);

  return remaining;
}

/** Cases that satisfy nothing: no interaction, no outcome, no activation. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `icon-button/padding-${index}`,
    title: `padding ${index}`,
    props: { icon: 'xmark' },
    attrs: { 'aria-label': 'Close' },
  }));
}

test('the clean catalog passes (attack G)', () => {
  assert.deepEqual(activationCoverageViolations(loadCases()), []);
});

test('deleting the enabled Enter case is caught (attack A)', () => {
  const eroded = drop(loadCases(), ENABLED_ENTER);

  assert.ok(
    activationCoverageViolations(eroded).includes('no shared case proves that Enter activates an enabled button'),
    'the enabled Enter deletion was not reported',
  );
});

test('padding cannot hide the deleted enabled Enter case (attack B)', () => {
  const eroded = [...drop(loadCases(), ENABLED_ENTER), ...padding(3)];

  // The exact shape of the original silent pass: the count floor is satisfied,
  // so if the semantic rules do not fire, nothing does.
  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  assert.ok(
    activationCoverageViolations(eroded).includes('no shared case proves that Enter activates an enabled button'),
    'padding hid the removal of the enabled Enter case',
  );
});

test('a disabled Enter case cannot stand in for the enabled one (attack C)', () => {
  const cases = loadCases();
  const replacement = structuredClone(byId(cases, DISABLED_KEYBOARD));
  replacement.id = 'icon-button/interaction-enter-disabled-substitute';
  const eroded = [...drop(cases, ENABLED_ENTER), replacement];

  // The substitute presses Enter, which is all the original guard checked for.
  assert.ok(presses(replacement, 'Enter'), 'the substitute does not press Enter, so it is not this attack');
  assert.equal(replacement.attrs.disabled, true);
  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  assert.ok(
    activationCoverageViolations(eroded).includes('no shared case proves that Enter activates an enabled button'),
    'a disabled Enter case satisfied the enabled Enter requirement',
  );
});

test('an Enter case that no longer claims activation is caught (attack D)', () => {
  const cases = loadCases();
  const target = byId(cases, ENABLED_ENTER);
  assert.equal(target.interaction.expect.activates, true, 'the case under attack does not claim activation');

  // Two ways to strip the claim: drop the outcome, or flip it.
  const stripped = structuredClone(cases);
  delete byId(stripped, ENABLED_ENTER).interaction.expect;
  const strippedViolations = activationCoverageViolations(stripped);
  assert.ok(
    strippedViolations.includes(`${ENABLED_ENTER} drives the component but declares no expected activation outcome`),
    'a scenario with no declared outcome was accepted',
  );
  assert.ok(
    strippedViolations.includes('no shared case proves that Enter activates an enabled button'),
    'an outcome-less Enter case still counted as enabled Enter coverage',
  );

  const flipped = structuredClone(cases);
  byId(flipped, ENABLED_ENTER).interaction.expect.activates = false;
  assert.ok(
    activationCoverageViolations(flipped).includes('no shared case proves that Enter activates an enabled button'),
    'an Enter case expecting no activation still counted as enabled Enter coverage',
  );
});

test('deleting the disabled keyboard negative case is caught (attack E)', () => {
  const eroded = drop(loadCases(), DISABLED_KEYBOARD);

  // The enabled Enter case is untouched, so this is specifically the negative
  // half of the contract going missing.
  assert.ok(byId(eroded, ENABLED_ENTER), 'the attack removed the wrong case');
  assert.ok(
    activationCoverageViolations(eroded).includes(
      'no shared case proves that a disabled button refuses keyboard activation',
    ),
    'the disabled keyboard negative case can be deleted silently',
  );
});

test('deleting the enabled Space case is caught (attack F)', () => {
  const eroded = drop(loadCases(), ENABLED_SPACE);

  assert.ok(
    activationCoverageViolations(eroded).includes('no shared case proves that Space activates an enabled button'),
    'the enabled Space activation case can be deleted silently',
  );
});

test('a padding case cannot buy coverage by claiming an outcome it never drives', () => {
  // The natural next move once padding stops working: give the padding the
  // field the rules read, without giving it any input to activate on.
  const liar = { ...padding(1)[0], interaction: { steps: [], expect: { activates: true } } };
  const eroded = [...drop(loadCases(), ENABLED_ENTER), liar];

  const violations = activationCoverageViolations(eroded);
  assert.ok(
    violations.includes(`${liar.id} claims it activates but drives no activating input`),
    'a case claiming activation without driving any input was accepted',
  );
  assert.ok(violations.includes('no shared case proves that Enter activates an enabled button'));
});

test('a disabled case cannot relabel itself as activating', () => {
  const cases = loadCases();
  const forged = structuredClone(cases);
  byId(forged, DISABLED_KEYBOARD).interaction.expect.activates = true;

  assert.ok(
    activationCoverageViolations(forged).includes(`${DISABLED_KEYBOARD} is disabled but claims it activates`),
    'a disabled case was allowed to claim it activates',
  );
});

/** Local copy of the predicate, so the attack asserts on catalog data itself. */
function presses(entry, key) {
  return (entry.interaction?.steps ?? []).some((step) => step.action === 'pressKey' && step.key === key);
}
