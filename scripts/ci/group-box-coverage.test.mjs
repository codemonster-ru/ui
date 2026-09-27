// The VfGroupBox catalog cannot quietly shrink, and it cannot quietly change
// which component it describes.
//
// The M29 gate, attacked. Each padding attack removes one family of cases and
// pads the catalog back to its size with cases that satisfy nothing new; each
// has to fail semantically, naming the rule that stopped being proved:
//
//   A. remove the closed-state cases;       B. remove the "" title cases;
//   C. remove the "0" title cases;          D. remove the keyboard scenarios;
//   E. remove the controlled scenarios;     F. remove nesting and siblings;
//   G. remove the disabled cases;           H. remove every scenario;
//   I. replace the catalog with accordion cases of equal count.
//
// Then the vocabulary (a pressed ArrowDown, an invented prop, an invented
// slot), the ownership budget (a trigger claimed for a static group, none for
// a collapsible one, a consumer control in closed content), the expectations
// (the accordion's keyboard contract, expanded without content) and the
// policy (the controlled-mode divergence removed, an approval added).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { groupBoxCoverageViolations, groupBoxPolicyViolations } from './group-box-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;
const policy = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/group-box/parity-policy.json'), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));

const FLOOR = 50;

/** Cases that satisfy nothing new: an open collapsible group with a consumer class. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `group-box/padding-${index}`,
    title: `padding ${index}`,
    props: { title: 'Padding', collapsible: true },
    attrs: { class: 'padding' },
    content: { body: { text: 'Body' } },
    componentInteractive: 1,
    visual: false,
  }));
}

function attack(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return [...remaining, ...padding(cases.length - remaining.length)];
}

function assertFails(cases, pattern) {
  const violations = groupBoxCoverageViolations(cases);
  assert.ok(
    violations.some((violation) => pattern.test(violation)),
    `expected a violation matching ${pattern}, got:\n  ${violations.join('\n  ')}`,
  );
}

const cases = load('group-box');

test('the committed catalog satisfies every rule and keeps its floor', () => {
  assert.deepEqual(groupBoxCoverageViolations(cases), []);
  assert.ok(cases.length >= FLOOR, `${cases.length} cases, floor ${FLOOR}`);
  assert.ok(cases.filter((entry) => entry.interaction).length >= 17);
});

test('the committed policy declares the controlled-mode divergence and approves nothing', () => {
  assert.deepEqual(groupBoxPolicyViolations(policy), []);
});

test('A: removing the closed-state cases fails', () => {
  const closed = (entry) =>
    !entry.interaction &&
    (entry.props?.collapsed === true || entry.props?.defaultCollapsed === true) &&
    entry.props?.collapsible;
  assertFails(attack(cases, closed, 'closed'), /closes through|disabled while closed|collapsed=true with/);
});

test('B: removing the empty-title cases fails', () => {
  assertFails(
    attack(cases, (entry) => entry.props?.title === '', 'with an empty title'),
    /empty-string title/,
  );
});

test('C: removing the "0" title cases fails - the PHP truthiness vector', () => {
  assertFails(
    attack(cases, (entry) => entry.props?.title === '0', 'titled "0"'),
    /title "0"/,
  );
});

test('D: removing the keyboard scenarios fails', () => {
  const keyboard = (entry) => (entry.interaction?.steps ?? []).some((step) => step.action === 'pressKey');
  assertFails(attack(cases, keyboard, 'with a key press'), /through Enter|through Space/);
});

test('E: removing the controlled scenarios fails', () => {
  const controlled = (entry) => entry.interaction && entry.props?.collapsed !== undefined;
  assertFails(attack(cases, controlled, 'controlled'), /controlled prop/);
});

test('F: removing nesting and siblings fails', () => {
  const relational = (entry) => entry.group || entry.content?.body?.groupBox;
  assertFails(attack(cases, relational, 'nested or sibling'), /nests a group box|two siblings|re-renders a nested/);
});

test('G: removing the disabled cases fails', () => {
  assertFails(
    attack(cases, (entry) => entry.props?.disabled === true, 'disabled'),
    /disabled/,
  );
});

test('H: removing every scenario fails', () => {
  assertFails(
    attack(cases, (entry) => entry.interaction, 'with an interaction'),
    /scenario/,
  );
});

test('I: an accordion catalog of equal count is refused', () => {
  const accordion = load('accordion').slice(0, cases.length);
  assertFails(accordion, /does not have|does not render|no shared group box case/);
});

test('an ArrowDown press is refused: the reference has no keyboard handling of its own', () => {
  const tampered = clone(cases);
  tampered.find((entry) => entry.id === 'group-box/interaction-enter-collapses').interaction.steps[1].key = 'ArrowDown';
  assertFails(tampered, /presses \[ArrowDown\]/);
});

test('an invented prop and an invented slot are refused', () => {
  const tampered = clone(cases);
  tampered[0].props.variant = 'outlined';
  tampered[1].content.header = { text: 'Header' };
  assertFails(tampered, /prop \[variant\]/);
  assertFails(tampered, /slot \[header\]/);
});

test('ownership: a trigger claimed for a static group, none for a collapsible one, and an unrendered consumer control are refused', () => {
  const tampered = clone(cases);
  tampered.find((entry) => entry.id === 'group-box/title-zero').componentInteractive = 1;
  tampered.find((entry) => entry.id === 'group-box/collapsible-open').componentInteractive = 0;
  tampered.find((entry) => entry.id === 'group-box/consumer-control-closed').consumerInteractive = 1;
  assertFails(tampered, /title-zero declares 1 component-owned/);
  assertFails(tampered, /collapsible-open declares 0 component-owned/);
  assertFails(tampered, /consumer-control-closed declares 1 consumer/);
});

test('ownership counts "" as no title and "0" as a title, as the reference does', () => {
  const tampered = clone(cases);
  tampered.find((entry) => entry.id === 'group-box/empty-title-collapsible').componentInteractive = 1;
  tampered.find((entry) => entry.id === 'group-box/title-zero-collapsible').componentInteractive = 0;
  assertFails(tampered, /empty-title-collapsible declares 1/);
  assertFails(tampered, /title-zero-collapsible declares 0/);
});

test("the accordion's keyboard contract is refused: no native click and a prevented keydown", () => {
  const tampered = clone(cases);
  const enter = tampered.find((entry) => entry.id === 'group-box/interaction-enter-collapses');
  enter.interaction.expect.activates = false;
  enter.interaction.expect.keydownPrevented = [true];
  assertFails(tampered, /expects activates=false/);
  assertFails(tampered, /left unprevented/);
});

test('expanded without content, and a scenario without an event claim, are refused', () => {
  const tampered = clone(cases);
  const click = tampered.find((entry) => entry.id === 'group-box/interaction-click-expands');
  click.interaction.expect.panelPresent = false;
  delete tampered.find((entry) => entry.id === 'group-box/interaction-focus-only').interaction.expect.events;
  assertFails(tampered, /aria-expanded=true with panelPresent=false/);
  assertFails(tampered, /no claim about the collapsed-change/);
});

test('a scenario converging on a case that does not exist is refused', () => {
  const tampered = clone(cases);
  tampered.find((entry) => entry.id === 'group-box/interaction-click-collapses').interaction.matches =
    'group-box/nowhere';
  assertFails(tampered, /converges on \[group-box\/nowhere\]/);
});

test('policy: removing the controlled-mode divergence, one of its coverage fields, or adding an approval is refused', () => {
  const removed = clone(policy);
  removed.platformDivergences = [];
  assert.ok(
    groupBoxPolicyViolations(removed).some((v) => /no longer declares the Razor controlled-mode divergence/.test(v)),
  );

  const thin = clone(policy);
  delete thin.platformDivergences[0].razorHalfCoveredBy;
  assert.ok(groupBoxPolicyViolations(thin).some((v) => /razorHalfCoveredBy/.test(v)));

  const approved = clone(policy);
  approved.approvedDivergences.push({ id: 'x' });
  assert.ok(groupBoxPolicyViolations(approved).some((v) => /approves a divergence/.test(v)));

  const silent = clone(policy);
  delete silent.outsideTheCatalog.dynamicProps;
  assert.ok(groupBoxPolicyViolations(silent).some((v) => /dynamicProps/.test(v)));
});
