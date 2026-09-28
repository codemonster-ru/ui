// The VfPopover catalog cannot quietly shrink, cannot invent API the reference
// does not have, cannot buy or lose a control through its ownership
// declarations, and cannot keep passing after the case that proved a
// difference from the dropdown - or a cross-component claim - is dropped or
// rewritten into one that proves something easier.
//
// The attacks, each of which has to fail on the rule it erodes:
//
//   A. the closed dangling reference;           B. the open teleported panel;
//   C. the in-place destinations;               D. the pointer open that focuses the panel;
//   E. the autofocus order, both ways;          F. the unfocusable autofocus target;
//   G. the Enter and Space toggle;              H. the ArrowDown re-open;
//   I. the inside click that does nothing;      J. both dismissal switches;
//   K. one escape stack with the dropdown;      L. the closeOnEscape=false shield;
//   M. the nested teardown and the Escape after it;
//   N. ownership budgets bought or lost;        O. vocabulary invented;
//   P. convergence claimed for an open state;   Q. padding in place of a proof;
//   R. the policy's divergence and quirks.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { popoverCoverageViolations, popoverPolicyViolations } from './popover-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = () => JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/popover/cases.json'), 'utf8')).cases;
const policy = () => JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/popover/parity-policy.json'), 'utf8'));
const FLOOR = 70;

/** Scenarios that satisfy nothing new: pointer opens of the default content. */
function padding(count) {
  const template = load().find((entry) => entry.id === 'popover/interaction-click-open');
  return Array.from({ length: count }, (unused, index) => ({
    ...structuredClone(template),
    id: `popover/padding-${index}`,
  }));
}

/** Removes every case the predicate selects and pads the catalog back to its size. */
function attack(predicate) {
  const cases = load();
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, 'the attack removed nothing');
  return [...remaining, ...padding(cases.length - remaining.length)];
}

const rewrite = (id, change) => load().map((entry) => (entry.id === id ? change(structuredClone(entry)) : entry));

function assertFails(cases, pattern) {
  const violations = popoverCoverageViolations(cases);
  assert.ok(
    violations.some((violation) => pattern.test(violation)),
    `expected a violation matching ${pattern}, got:\n  ${violations.join('\n  ')}`,
  );
}

const members = (entry) => entry.group ?? [entry.props ?? {}];
const opens = (entry) => members(entry).some((member) => member.open ?? member.defaultOpen);

test('the shipped popover catalog satisfies every rule and keeps its floor', () => {
  assert.deepEqual(popoverCoverageViolations(load()), []);
  assert.ok(load().length >= FLOOR, `${load().length} cases, floor ${FLOOR}`);
  assert.ok(load().filter((entry) => entry.interaction).length >= 44);
});

test('the shipped policy declares the controlled-mode divergence, the quirks, and approves nothing', () => {
  assert.deepEqual(popoverPolicyViolations(policy()), []);
});

test('A: without a closed single popover the dangling aria-controls is never compared', () => {
  assertFails(
    attack((entry) => !entry.interaction && !entry.group && !opens(entry) && !entry.content?.beside),
    /dangling aria-controls/,
  );
});

test('B: without a teleported open popover the followed panel is never compared', () => {
  const teleportedOpenSingle = (entry) =>
    !entry.interaction &&
    !entry.group &&
    opens(entry) &&
    !entry.props.disableTeleport &&
    entry.props.teleportTo === undefined;
  assertFails(attack(teleportedOpenSingle), /teleported open popover/);
});

test('C: without the in-place renders neither in-place destination is compared', () => {
  assertFails(
    attack((entry) => entry.id === 'popover/open-in-place'),
    /in place with disableTeleport/,
  );
  assertFails(
    attack((entry) => entry.id === 'popover/open-teleport-false'),
    /teleportTo=false/,
  );
});

test("D: a pointer open that keeps focus on the trigger - the dropdown's contract - is refused as proof", () => {
  const pointerOpen = (entry) =>
    entry.interaction?.steps.length === 1 && entry.interaction.steps[0].selector === '.vf-popover__trigger';
  const rewritten = load().map((entry) => {
    if (!pointerOpen(entry)) return entry;
    const copy = structuredClone(entry);
    copy.interaction.expect.focusRole = 'trigger';
    return copy;
  });
  assertFails(rewritten, /pointer open focuses the panel itself/);
});

test('E: removing either autofocus-order scenario fails', () => {
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-autofocus-data-first'),
    /\[data-autofocus\] before \[autofocus\]/,
  );
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-autofocus-attribute-first'),
    /\[autofocus\] before \[data-autofocus\]/,
  );
});

test('F: removing the unfocusable autofocus target fails', () => {
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-autofocus-unfocusable'),
    /unfocusable autofocus target/,
  );
});

test('G: removing the toggle scenarios fails for Enter and for Space', () => {
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-enter-toggles-closed'),
    /\[Enter\] on an open popover/,
  );
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-space-toggles-closed'),
    /\[ \] on an open popover/,
  );
});

test('H: an ArrowDown on an open popover rewritten into a close is refused', () => {
  assertFails(
    rewrite('popover/interaction-arrowdown-reopens', (entry) => {
      entry.interaction.expect.expandedStates = ['false'];
      return entry;
    }),
    /ArrowDown on an open popover notifies again/,
  );
});

test('I: an inside click claimed to close is refused', () => {
  assertFails(
    rewrite('popover/interaction-click-inside', (entry) => {
      entry.interaction.expect.expandedStates = ['false'];
      return entry;
    }),
    /click on a control inside the panel does not close/,
  );
});

test('J: removing either dismissal switch scenario fails', () => {
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-outside-click-kept'),
    /closeOnOutsideClick=false keeps it open/,
  );
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-escape-kept'),
    /closeOnEscape=false takes Escape unprevented/,
  );
});

test('K: removing the cross-component stack scenarios fails in both orders and for the nested pair', () => {
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-beside-popover-last'),
    /sibling dropdown first and a popover second/,
  );
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-beside-dropdown-last'),
    /popover first and a sibling dropdown second/,
  );
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-nested-escape-inner'),
    /opened inside the popover takes the first Escape/,
  );
});

test('L: a shield rewritten to fall through - the dropdown closing under it - is refused', () => {
  assertFails(
    rewrite('popover/interaction-shield', (entry) => {
      entry.interaction.expect.nestedMenus = [{ place: 'case', expanded: 'false', menu: null }];
      return entry;
    }),
    /shields the dropdown below/,
  );
});

test('M: removing the teardown, or claiming the Escape after it stayed on a stale entry, fails', () => {
  assertFails(
    attack((entry) => entry.id === 'popover/interaction-nested-enter-teardown'),
    /Enter over an open nested dropdown/,
  );
  assertFails(
    rewrite('popover/interaction-nested-teardown-escape', (entry) => {
      entry.interaction.expect.expandedStates = ['true', 'false'];
      entry.interaction.expect.events = entry.interaction.expect.events.slice(0, -1);
      return entry;
    }),
    /reaches the popover below, not the unmounted dropdown/,
  );
  assertFails(
    rewrite('popover/interaction-nested-enter-teardown', (entry) => {
      entry.interaction.expect.bodyOverlays = ['orphan'];
      return entry;
    }),
    /no overlay left in <body>/,
  );
});

test('N: ownership budgets bought or lost are refused', () => {
  assertFails(
    rewrite('popover/open', (entry) => ({ ...entry, componentInteractive: 1 })),
    /one panel per open instance/,
  );
  assertFails(
    rewrite('popover/interaction-click-open', (entry) => {
      delete entry.interaction.componentInteractive;
      return entry;
    }),
    /ends with 1 open panel/,
  );
  assertFails(
    rewrite('popover/interaction-shield', (entry) => {
      entry.interaction.consumerInteractiveRoles = 0;
      return entry;
    }),
    /open menu\(s\) it renders/,
  );
  assertFails(
    rewrite('popover/interaction-click-close', (entry) => {
      entry.interaction.componentInteractive = 1;
      return entry;
    }),
    /unneeded override/,
  );
});

test('O: invented props, slots, steps, keys and claims are refused', () => {
  assertFails(
    rewrite('popover/default', (entry) => ({ ...entry, props: { disabled: true } })),
    /does not have/,
  );
  assertFails(
    rewrite('popover/default', (entry) => ({ ...entry, props: { teleportTo: '#x' } })),
    /outside what the catalog can render/,
  );
  assertFails(
    rewrite('popover/default', (entry) => ({ ...entry, content: { ...entry.content, footer: { text: 'x' } } })),
    /content vocabulary/,
  );
  assertFails(
    rewrite('popover/interaction-escape', (entry) => {
      entry.interaction.steps.push({ action: 'pressKey', key: 'PageDown' });
      return entry;
    }),
    /does not drive/,
  );
  assertFails(
    rewrite('popover/interaction-escape', (entry) => {
      entry.interaction.expect.menuStates = [];
      return entry;
    }),
    /do not record/,
  );
});

test('P: convergence claimed for an open end state is refused', () => {
  assertFails(
    rewrite('popover/interaction-click-open', (entry) => {
      entry.interaction.matches = 'popover/default';
      return entry;
    }),
    /only a closing gesture on the same content/,
  );
});

test('Q: padding cannot replace a removed proof', () => {
  const eroded = attack((entry) => entry.id === 'popover/interaction-shield-below');
  assert.equal(eroded.length, load().length);
  assertFails(eroded, /below an open dropdown does not stop the dropdown closing/);
});

test('R: removing the controlled-mode divergence, a coverage field, a cross-component quirk, or adding an approval is refused', () => {
  const removed = policy();
  removed.platformDivergences = [];
  assert.ok(popoverPolicyViolations(removed).some((violation) => /controlled-mode divergence/.test(violation)));

  const thin = policy();
  delete thin.platformDivergences[0].razorHalfCoveredBy;
  assert.ok(popoverPolicyViolations(thin).some((violation) => /razorHalfCoveredBy/.test(violation)));

  const quirkless = policy();
  quirkless.historicalQuirks = quirkless.historicalQuirks.filter((entry) => entry.id !== 'one-stack-with-the-dropdown');
  assert.ok(popoverPolicyViolations(quirkless).some((violation) => /one-stack-with-the-dropdown/.test(violation)));

  const approved = policy();
  approved.approvedDivergences = [{ id: 'x' }];
  assert.ok(popoverPolicyViolations(approved).some((violation) => /approves a divergence/.test(violation)));
});
