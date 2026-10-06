// The VfTooltip catalog cannot quietly shrink, cannot invent API the reference
// does not have, cannot buy a control through its ownership declarations,
// cannot end a scenario with a timer still pending, and cannot keep passing
// after a case that proved part of the contract is dropped or rewritten into
// one that proves something easier.
//
// The attacks, each of which has to fail on the rule it erodes:
//
//   A. every distinguishing scenario, removed in turn and replaced by padding;
//   B. vocabulary invented - props, values, content keys, expectations;
//   C. malformed hover and unhover steps, and every other step spelled wrong;
//   D. a scenario that ends before its timer could have fired or settled;
//   E. a scenario that focuses before the headless page has focus;
//   F. ownership budgets bought or lost, a popover's end state unclaimed;
//   G. convergence claimed for an open state or a different shape;
//   H. two cases sharing one teleport target;
//   I. the policy's quirks, boundaries and empty approvals.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import {
  SCHEDULING_BEFORE_DELAY,
  SETTLE_AFTER_DELAY,
  TOOLTIP_REQUIREMENTS,
  stepProblem,
  tooltipCoverageViolations,
  tooltipPolicyViolations,
} from './tooltip-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = () => JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/tooltip/cases.json'), 'utf8')).cases;
const policy = () => JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/tooltip/parity-policy.json'), 'utf8'));

/** Scenarios that satisfy nothing new: hover opens of the default content, with no claims. */
function padding(count) {
  const template = load().find((entry) => entry.id === 'tooltip/interaction-hover-open');
  return Array.from({ length: count }, (unused, index) => {
    const copy = structuredClone(template);
    copy.id = `tooltip/padding-${index}`;
    copy.interaction.expect = { describedStates: ['tooltip'] };
    return copy;
  });
}

const rewrite = (id, change) => load().map((entry) => (entry.id === id ? change(structuredClone(entry)) : entry));

function assertFails(cases, pattern) {
  const violations = tooltipCoverageViolations(cases);
  assert.ok(
    violations.some((violation) => pattern.test(violation)),
    `expected a violation matching ${pattern}, got:\n  ${violations.join('\n  ')}`,
  );
}

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('the committed catalog and policy satisfy the gate', () => {
  assert.deepEqual(tooltipCoverageViolations(load()), []);
  assert.deepEqual(tooltipPolicyViolations(policy()), []);
});

test('A: every distinguishing scenario is load-bearing - removing the cases that satisfy it fails exactly its rule', () => {
  assert.ok(TOOLTIP_REQUIREMENTS.length >= 40, `only ${TOOLTIP_REQUIREMENTS.length} requirements`);
  for (const [message, predicate] of TOOLTIP_REQUIREMENTS) {
    const cases = load();
    const remaining = cases.filter((entry) => !(entry.interaction && predicate(entry)));
    assert.ok(remaining.length < cases.length, `nothing satisfies [${message}]`);
    const eroded = [...remaining, ...padding(cases.length - remaining.length)];
    assertFails(eroded, new RegExp(`^${escape(message)}$`));
  }
});

test('A: the padding itself satisfies no requirement, so it cannot stand in for one', () => {
  for (const [message, predicate] of TOOLTIP_REQUIREMENTS) {
    assert.ok(!padding(1).some(predicate), `the padding satisfies [${message}]`);
  }
});

test('B: vocabulary the reference does not have is refused', () => {
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, props: { ...entry.props, disabled: true } })),
    /prop \[disabled\]/,
  );
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, props: { ...entry.props, placement: 'left' } })),
    /prop \[placement\]/,
  );
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, props: { ...entry.props, openDelay: 'soon' } })),
    /prop \[openDelay\]/,
  );
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, props: { ...entry.props, teleportTo: 'body' } })),
    /prop \[teleportTo\]/,
  );
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, content: { ...entry.content, arrow: true } })),
    /\[arrow\] in the content/,
  );
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, content: { ...entry.content, body: 'bold' } })),
    /\[body\] the value/,
  );
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, content: {} })),
    /renders no trigger slot/,
  );
  assertFails(
    rewrite('tooltip/interaction-hover-open', (entry) => {
      entry.interaction.expect.events = [];
      return entry;
    }),
    /claims \[events\]/,
  );
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, content: { ...entry.content, popoverDelay: 600 } })),
    /popoverDelay without a tooltip inside a popover/,
  );
});

test('C: a malformed hover or unhover, and every other step spelled wrong, is refused', () => {
  const malformed = [
    { action: 'hover' },
    { action: 'hover', selector: '.vf-tooltip' },
    { action: 'hover', selector: '.vf-tooltip__trigger', ms: 10 },
    { action: 'hover', selector: '.vf-tooltip__trigger', index: -1 },
    { action: 'hover', selector: 'strong', through: { selector: '.vf-tooltip__trigger', attribute: 'aria-controls' } },
    {
      action: 'hover',
      selector: '.parity-trigger-control',
      through: { selector: '.vf-tooltip__trigger', attribute: 'aria-describedby' },
    },
    { action: 'unhover', selector: '.vf-tooltip__trigger' },
    { action: 'unhover', x: 900, y: 1 },
    { action: 'focusButton', selector: '.vf-tooltip__trigger' },
    { action: 'clickButton', selector: '.vf-tooltip__content' },
    { action: 'pressKey', key: 'ArrowDown' },
    { action: 'wait', ms: 0 },
    { action: 'scrollWindow', y: 16 },
    { action: 'hoverOver', selector: '.vf-tooltip__trigger' },
  ];
  for (const step of malformed) {
    assert.ok(stepProblem(step), `accepted ${JSON.stringify(step)}`);
    assertFails(
      rewrite('tooltip/interaction-hover-open', (entry) => {
        entry.interaction.steps = [step, ...entry.interaction.steps];
        return entry;
      }),
      /a step the harness does not drive/,
    );
  }
  for (const step of [
    { action: 'hover', selector: '.vf-tooltip__trigger' },
    { action: 'hover', selector: '.parity-trigger-control', index: 1 },
    {
      action: 'hover',
      selector: 'strong',
      through: { selector: '.vf-tooltip__trigger', attribute: 'aria-describedby' },
    },
    {
      action: 'hover',
      selector: '.vf-tooltip__trigger',
      through: { selector: '.vf-popover__trigger', attribute: 'aria-controls' },
    },
    { action: 'unhover' },
  ]) {
    assert.equal(stepProblem(step), null, `refused ${JSON.stringify(step)}`);
  }
});

test('D: a scenario that ends before its timer could fire and settle is refused', () => {
  for (const [id, cut] of [
    ['tooltip/interaction-hover-open', 80 + SETTLE_AFTER_DELAY - 1],
    ['tooltip/interaction-long-delay-open', 600 + SETTLE_AFTER_DELAY - 1],
    ['tooltip/interaction-activation-restart', 1500 + SETTLE_AFTER_DELAY - 1],
  ]) {
    assertFails(
      rewrite(id, (entry) => {
        entry.interaction.steps.at(-1).ms = cut;
        return entry;
      }),
      new RegExp(`^${escape(id)} waits ${cut} ms after its last gesture`),
    );
  }
  // The pending popover case: the inner tooltip's delay counts too.
  assertFails(
    rewrite('tooltip/interaction-popover-dispose-pending', (entry) => {
      entry.interaction.steps.at(-1).ms = 600;
      return entry;
    }),
    /interaction-popover-dispose-pending waits 600 ms after its last gesture, less than its 600 ms delay/,
  );
  // A scenario ending on a gesture waits nothing.
  assertFails(
    rewrite('tooltip/interaction-hover-open', (entry) => {
      entry.interaction.steps.pop();
      return entry;
    }),
    /waits 0 ms after its last gesture/,
  );
});

test('D2: a gesture that must land before the delay keeps the scheduling budget, and a re-entry still lands late enough (M35.0a)', () => {
  const secondWait = (id, ms) =>
    rewrite(id, (entry) => {
      entry.interaction.steps[1].ms = ms;
      return entry;
    });
  // The M31 re-entry: a 500 ms wait the harness's own scheduling pushed past
  // the 600 ms delay at 30 frames per second.
  assertFails(
    secondWait('tooltip/interaction-reentry-restart', 500),
    /proves a re-entry after a leave restarts the timer/,
  );
  // Too soon to tell a restarted delay from a surviving one.
  assertFails(
    secondWait('tooltip/interaction-reentry-restart', 250),
    /proves a re-entry after a leave restarts the timer/,
  );
  // Waits the M31 margin accepted and the budget does not.
  assertFails(
    secondWait('tooltip/interaction-pending-cancel-pointer', 600 - SCHEDULING_BEFORE_DELAY + 1),
    /cancels a pending open with a real unhover/,
  );
  assertFails(
    secondWait('tooltip/interaction-activation-restart', 1500 - SCHEDULING_BEFORE_DELAY + 1),
    /proves a second activation restarts the pending timer/,
  );
});

test('E: a scenario that focuses before any pointer or key input is refused', () => {
  assertFails(
    rewrite('tooltip/interaction-focus-open', (entry) => {
      entry.interaction.steps.shift();
      return entry;
    }),
    /focuses before any pointer or key input/,
  );
});

test('F: ownership budgets cannot be bought or lost', () => {
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, componentInteractive: 1 })),
    /component-owned control/,
  );
  assertFails(
    rewrite('tooltip/default', (entry) => ({ ...entry, consumerInteractive: 2 })),
    /consumer control\(s\)/,
  );
  assertFails(
    rewrite('tooltip/interaction-hover-open', (entry) => {
      entry.interaction.componentInteractive = 0;
      return entry;
    }),
    /overrides the owned count/,
  );
  assertFails(
    rewrite('tooltip/interaction-popover-escape', (entry) => {
      delete entry.interaction.expect.expandedStates;
      return entry;
    }),
    /does not say whether it ends open/,
  );
  assertFails(
    rewrite('tooltip/interaction-popover-escape', (entry) => {
      entry.interaction.expect.expandedStates = ['true'];
      return entry;
    }),
    /after its scenario, but it ends rendering 3/,
  );
  assertFails(
    rewrite('tooltip/interaction-two-different-open', (entry) => {
      entry.interaction.expect.describedStates = ['tooltip'];
      return entry;
    }),
    /does not say which of its 2 instance/,
  );
});

test('G: convergence can be claimed only by a closing gesture on the same shape', () => {
  assertFails(
    rewrite('tooltip/interaction-hover-open', (entry) => {
      entry.interaction.matches = 'tooltip/default';
      return entry;
    }),
    /only a closing gesture on the same case shape/,
  );
  assertFails(
    rewrite('tooltip/interaction-unhover-close', (entry) => {
      entry.interaction.matches = 'tooltip/with-after';
      return entry;
    }),
    /only a closing gesture on the same case shape/,
  );
  assertFails(
    rewrite('tooltip/interaction-unhover-close', (entry) => {
      entry.interaction.matches = 'tooltip/interaction-hover-open';
      return entry;
    }),
    /not an initial case of the catalog/,
  );
});

test('H: two cases cannot share one teleport target', () => {
  assertFails(
    rewrite('tooltip/interaction-selector-open', (entry) => ({
      ...entry,
      props: { ...entry.props, teleportTo: '#parity-tooltip-target-1' },
    })),
    /teleports into #parity-tooltip-target-1, which tooltip\/selector-target renders too/,
  );
});

test('I: the policy keeps its quirks, its boundaries and no approval', () => {
  const eroded = policy();
  eroded.historicalQuirks = eroded.historicalQuirks.filter((entry) => entry.id !== 'not-on-the-escape-stack');
  assert.ok(tooltipPolicyViolations(eroded).some((violation) => /not-on-the-escape-stack/.test(violation)));

  const flipped = policy();
  flipped.historicalQuirks.find((entry) => entry.id === 'last-event-wins').razorDiffers = true;
  assert.ok(tooltipPolicyViolations(flipped).some((violation) => /last-event-wins/.test(violation)));

  const unbounded = policy();
  delete unbounded.outsideTheCatalog.teleportToElement;
  assert.ok(tooltipPolicyViolations(unbounded).some((violation) => /teleportToElement/.test(violation)));

  const approving = policy();
  approving.approvedDivergences.push({ id: 'x' });
  assert.ok(tooltipPolicyViolations(approving).some((violation) => /approves a divergence/.test(violation)));

  const diverging = policy();
  diverging.platformDivergences.push({ id: 'x' });
  assert.ok(tooltipPolicyViolations(diverging).some((violation) => /platform divergence/.test(violation)));
});
