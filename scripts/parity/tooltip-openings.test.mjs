// The tooltip snapshot's opening evidence, directly (M31 closure).
//
// Every opening the fixture log recorded is classified against the instance's
// last activation - early, on-time or late - unless the instance was
// deactivated after that activation: then it is while-inactive, a pending
// timer a leave did not cancel, however on time it looks. Run against the real
// snapshot expression in jsdom, on hand-written log entries, so the rule is
// proved on its own and not only through the mutation runner:
//
//   O1. an opening after a deactivation is while-inactive;
//   O2. an opening while the instance is still active is not;
//   O3. a cancelled pending open writes no reference and records no opening;
//   O4. a reactivation starts a new active interval, and an opening in it is
//       classified from it;
//   O5. one instance's deactivation never marks another instance's opening;
//   O6. the rule's defects - the inactive check removed, or the last
//       deactivation kept for the page instead of per instance - fail O1 and
//       O5 on the same entries.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

import { interactionExpression } from './extract.mjs';
import { profiles } from './profiles.mjs';

const CASE = 'tooltip/opening-evidence';
const EXPRESSION = interactionExpression(CASE, 'tooltip', profiles.tooltip.controlOwnership);

/** A case of closed tooltip instances, each around a consumer button. */
function page(instances) {
  const roots = Array.from(
    { length: instances },
    () =>
      '<span class="vf-tooltip"><span class="vf-tooltip__trigger">' +
      '<button type="button" class="parity-trigger-control">Info</button></span></span>',
  ).join('');
  return `<!doctype html><body><div data-parity-case="${CASE}">${roots}</div></body>`;
}

/** The snapshot's openings and closings for `log`, the entries the fixture log would have kept. */
async function evidence(log, { instances = 1, delays = [], expression = EXPRESSION } = {}) {
  const { window } = new JSDOM(page(instances), { runScripts: 'outside-only', pretendToBeVisual: true });
  try {
    window.__parityTooltipLogs = { [CASE]: log };
    window.__parityTooltipDelays = { [CASE]: delays };
    const result = await window.eval(expression);
    // Through JSON: the jsdom realm's arrays are not this realm's.
    return JSON.parse(JSON.stringify({ openings: result.openings, closings: result.closings }));
  } finally {
    window.close();
  }
}

const activate = (instance, t, via = 'pointer') => ({ kind: 'activate', via, instance, t });
const deactivate = (instance, t, via = 'pointer') => ({ kind: 'deactivate', via, instance, t });
const describe = (instance, t) => ({ kind: 'describe', instance, t });
const undescribe = (instance, t) => ({ kind: 'undescribe', instance, t });

// A leave that did not cancel the pending open: the timer fires 80 ms after
// the enter, 60 ms after the leave - on time from the enter.
const LEAKED = [activate(0, 0), deactivate(0, 20), describe(0, 80)];
// Two instances interleaved: instance 1 is left while instance 0's delay
// runs, and instance 1's own timer then leaks.
const TWO = [activate(0, 0), activate(1, 5), deactivate(1, 30), describe(0, 80), describe(1, 85)];

/** `EXPRESSION` with `from` replaced by `to` exactly once - a defect of the rule itself. */
function defect(from, to) {
  assert.equal(EXPRESSION.split(from).length, 2, `the snapshot no longer contains ${from}`);
  return EXPRESSION.replace(from, to);
}

test('O1: an opening after the instance was deactivated is while-inactive, however on time it looks', async () => {
  const { openings } = await evidence(LEAKED);
  assert.deepEqual(openings, [{ instance: 0, via: 'pointer', latency: 'while-inactive' }]);
  // Late and early leaks alike: the bucket is never consulted.
  for (const t of [30, 400]) {
    const late = await evidence([activate(0, 0), deactivate(0, 20), describe(0, t)]);
    assert.equal(late.openings[0].latency, 'while-inactive');
  }
});

test('O2: an opening while the instance is still active is classified by its latency, not as inactive', async () => {
  assert.deepEqual((await evidence([activate(0, 0), describe(0, 80)])).openings, [
    { instance: 0, via: 'pointer', latency: 'on-time' },
  ]);
  assert.deepEqual((await evidence([activate(0, 0, 'focus'), describe(0, 10)])).openings, [
    { instance: 0, via: 'focus', latency: 'early' },
  ]);
  assert.equal((await evidence([activate(0, 0), describe(0, 600)], { delays: [600] })).openings[0].latency, 'on-time');
  // A deactivation at the same instant as the activation is not after it.
  assert.equal((await evidence([deactivate(0, 0), activate(0, 0), describe(0, 80)])).openings[0].latency, 'on-time');
  // Closing after an active opening leaves the opening as it was.
  const closed = await evidence([activate(0, 0), describe(0, 80), deactivate(0, 200), undescribe(0, 201)]);
  assert.deepEqual(closed.openings, [{ instance: 0, via: 'pointer', latency: 'on-time' }]);
  assert.deepEqual(closed.closings, [{ instance: 0, via: 'pointer', lag: 'immediate' }]);
});

test('O3: a cancelled pending open records no opening', async () => {
  for (const log of [
    [activate(0, 0), deactivate(0, 20)],
    [activate(0, 0, 'focus'), deactivate(0, 20, 'focus')],
    [activate(0, 0), deactivate(0, 20), activate(0, 40), deactivate(0, 60)],
  ]) {
    assert.deepEqual(await evidence(log), { openings: [], closings: [] });
  }
});

test('O4: a reactivation starts a new active interval, and the opening in it is classified from it', async () => {
  // The re-entry case's shape: enter, leave before the delay, enter again.
  const reentry = await evidence([activate(0, 0), deactivate(0, 500), activate(0, 520), describe(0, 1120)], {
    delays: [600],
  });
  assert.deepEqual(reentry.openings, [{ instance: 0, via: 'pointer', latency: 'on-time' }]);
  // Reactivated by focus after a pointer leave: the new activation's path.
  const refocused = await evidence([activate(0, 0), deactivate(0, 20), activate(0, 40, 'focus'), describe(0, 120)]);
  assert.deepEqual(refocused.openings, [{ instance: 0, via: 'focus', latency: 'on-time' }]);
  // The old timer leaking into the new interval is early from the new
  // activation - caught by latency, not mislabelled inactive.
  const leakedIntoNew = await evidence([activate(0, 0), deactivate(0, 50), activate(0, 70), describe(0, 80)]);
  assert.deepEqual(leakedIntoNew.openings, [{ instance: 0, via: 'pointer', latency: 'early' }]);
  // A second activate/deactivate cycle after a legitimate opening: the next
  // opening in its active interval is on time again.
  const cycles = await evidence([
    activate(0, 0),
    describe(0, 80),
    deactivate(0, 200),
    undescribe(0, 200),
    activate(0, 300),
    describe(0, 380),
  ]);
  assert.deepEqual(
    cycles.openings.map((opening) => opening.latency),
    ['on-time', 'on-time'],
  );
});

test("O5: one instance's deactivation never marks another instance's opening", async () => {
  const { openings } = await evidence(TWO, { instances: 2 });
  assert.deepEqual(openings, [
    { instance: 0, via: 'pointer', latency: 'on-time' },
    { instance: 1, via: 'pointer', latency: 'while-inactive' },
  ]);
  // Each instance's delay is its own.
  const delays = await evidence([activate(0, 0), activate(1, 0), describe(0, 80), describe(1, 600)], {
    instances: 2,
    delays: [80, 600],
  });
  assert.deepEqual(
    delays.openings.map((opening) => opening.latency),
    ['on-time', 'on-time'],
  );
});

test('O6: the rule with its inactive check removed fails O1, and with a page-wide deactivation fails O5', async () => {
  const unchecked = defect(
    "(inactive ? 'while-inactive' : latency(entry.t - from.t, delays[entry.instance] ?? 80))",
    '(latency(entry.t - from.t, delays[entry.instance] ?? 80))',
  );
  assert.notDeepEqual((await evidence(LEAKED, { expression: unchecked })).openings, (await evidence(LEAKED)).openings);
  assert.equal((await evidence(LEAKED, { expression: unchecked })).openings[0].latency, 'on-time');

  const pageWide = defect('(lastDeactivation.get(entry.instance)?.t ?? -1)', '(lastDeactivation.get(1)?.t ?? -1)');
  const wrong = (await evidence(TWO, { instances: 2, expression: pageWide })).openings;
  assert.equal(wrong[0].latency, 'while-inactive', "instance 1's leave marked instance 0's opening");
  assert.notDeepEqual(wrong, (await evidence(TWO, { instances: 2 })).openings);
});
