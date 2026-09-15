// The live-parity stage M22 added to compareCaptures, asserted against the
// real comparator with synthetic captures.
//
// Four things a live stage can silently stop doing, each of which has to be a
// failure rather than a pass:
//
//   - a target produced no post-interaction DOM or accessibility record;
//   - a target's post-interaction DOM does not equal its own render of the
//     case the scenario names (convergence), reported against that target;
//   - the post-interaction DOM differs between targets while the initial DOM
//     is identical - the defect an initial-only comparison cannot see;
//   - an ownership snapshot is missing on a case without a scenario.
//
// And the one thing it must not do: reach a profile that did not opt in.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareCaptures } from './run.mjs';

const dom = (expanded) => [
  {
    tag: 'section',
    classes: ['vf-accordion'],
    consumerClasses: [],
    attributes: {},
    children: [
      {
        tag: 'button',
        classes: ['vf-accordion__trigger'],
        consumerClasses: [],
        attributes: { 'aria-expanded': expanded, type: 'button' },
        children: [],
        text: 'Billing',
        operable: true,
      },
    ],
  },
];

const snapshot = (expanded) => ({
  clip: { x: 0, y: 0, width: 1, height: 1 },
  ownershipPosture: 'component',
  componentControls: [{ role: 'trigger', tag: 'button' }],
  consumerControlCount: 0,
  focusableTotal: 1,
  interactiveRoleTotal: 0,
  expanded,
  panelPresent: expanded === 'true',
  focusRole: 'trigger',
  activations: 1,
  events: [],
  inputEvents: [],
});

const accessibility = (expanded) => ({ trigger: { role: 'button', name: 'Billing', states: { expanded } } });

const profile = {
  id: 'accordion-test',
  snapshot: 'accordion',
  controlOwnership: { trigger: { selector: '.vf-accordion__trigger', tag: 'button' } },
  liveParity: true,
};

const catalog = {
  profile,
  cases: [
    { id: 'a/closed', props: {}, attrs: {}, componentInteractive: 1 },
    { id: 'a/open', props: {}, attrs: {}, componentInteractive: 1 },
    {
      id: 'a/click',
      props: {},
      attrs: {},
      componentInteractive: 1,
      interaction: { steps: [{ action: 'clickButton' }], expect: { expanded: 'true' }, matches: 'a/open' },
    },
  ],
};

const policy = { dimensions: {}, approvedDivergences: [] };

/** A clean capture of one target: two static cases and one scenario that converges. */
function capture() {
  return {
    extracted: {
      'a/closed': { dom: dom('false'), styles: {} },
      'a/open': { dom: dom('true'), styles: {} },
      'a/click': { dom: dom('false'), styles: {} },
    },
    accessibility: {
      'a/closed': accessibility('false'),
      'a/open': accessibility('true'),
      'a/click': accessibility('false'),
    },
    screenshots: {},
    interactions: {
      'a/closed': snapshot('false'),
      'a/open': snapshot('true'),
      'a/click': snapshot('true'),
    },
    interactionScreenshots: { 'a/click': { fileName: 'x', sha256: 'same' } },
    naturalInteractionScreenshots: {},
    transitions: {},
    transitionScreenshots: {},
    interactionDom: { 'a/click': dom('true') },
    interactionConvergence: { 'a/click': dom('true') },
    interactionAccessibility: { 'a/click': accessibility('true') },
    diagnostics: { pageErrors: [] },
  };
}

function captures() {
  return Object.fromEntries(
    ['reference', 'current', 'razor'].map((target) => [target, { light: capture(), dark: capture() }]),
  );
}

test('a clean live capture compares clean, and counts its live comparisons', () => {
  const result = compareCaptures(captures(), catalog, policy);

  assert.deepEqual(result.failures, []);
  // 3 directions x 2 themes x 1 scenario.
  assert.equal(result.summary.liveComparisons, 6);
});

test('a missing post-interaction DOM record is a failure, not a skip', () => {
  const broken = captures();
  delete broken.razor.light.interactionDom['a/click'];

  assert.throws(() => compareCaptures(broken, catalog, policy), /razor produced no post-interaction DOM record/);
});

test('a missing post-interaction accessibility record is a failure, not a skip', () => {
  const broken = captures();
  delete broken.current.dark.interactionAccessibility['a/click'];

  assert.throws(
    () => compareCaptures(broken, catalog, policy),
    /current produced no post-interaction accessibility record/,
  );
});

test('a target whose gesture landed on a hybrid fails convergence, attributed to that target', () => {
  const hybrid = captures();
  // Razor's post-interaction DOM keeps aria-expanded=false while the fresh
  // render of a/open has true: the same shape a stale attribute has.
  hybrid.razor.light.interactionDom['a/click'] = dom('false');

  const result = compareCaptures(hybrid, catalog, policy);
  const convergence = result.failures.filter((entry) => entry.dimension === 'interaction.convergence');

  assert.ok(convergence.length > 0);
  assert.ok(convergence.every((entry) => entry.path === 'razor/a/open' && entry.theme === 'light'));
  assert.ok(convergence.every((entry) => entry.direction !== 'reference-vs-current'));
});

test('a post-interaction DOM difference between targets fails on the DOM dimension with a prefixed path', () => {
  const stale = captures();
  stale.razor.light.interactionDom['a/click'] = dom('false');
  stale.razor.light.interactionConvergence['a/click'] = dom('false');

  const result = compareCaptures(stale, catalog, policy);
  const aria = result.failures.filter((entry) => entry.dimension === 'dom.aria' && entry.detail === 'aria-expanded');

  assert.ok(aria.length > 0);
  assert.ok(aria.every((entry) => entry.path.startsWith('post-interaction/')));
  // Initial DOM is identical on every target, so nothing initial moved.
  assert.ok(
    !result.failures.some((entry) => entry.dimension === 'dom.aria' && !entry.path.startsWith('post-interaction/')),
  );
});

test('a post-interaction accessibility difference fails on the a11y dimension', () => {
  const stale = captures();
  stale.current.dark.interactionAccessibility['a/click'] = accessibility('false');

  const result = compareCaptures(stale, catalog, policy);

  assert.ok(
    result.failures.some((entry) => entry.dimension === 'a11y.states' && entry.path === 'post-interaction/trigger'),
  );
});

test('a missing ownership snapshot on a case without a scenario is a failure, not a skip', () => {
  const broken = captures();
  delete broken.reference.light.interactions['a/closed'];

  assert.throws(
    () => compareCaptures(broken, catalog, policy),
    /measures ownership but case a\/closed produced no ownership snapshot on reference/,
  );
});

test('an ownership difference between targets moves ownership.controls', () => {
  const shifted = captures();
  shifted.razor.light.interactions['a/open'] = { ...snapshot('true'), componentControls: [], consumerControlCount: 1 };

  const result = compareCaptures(shifted, catalog, policy);
  const ownership = result.failures.filter((entry) => entry.dimension === 'ownership.controls');

  assert.ok(ownership.some((entry) => entry.path === 'componentControls'));
  assert.ok(ownership.some((entry) => entry.path === 'consumerControlCount'));
});

test('a profile that did not opt in is not reached by the live stage', () => {
  const legacy = { ...catalog, profile: { id: 'legacy', snapshot: 'button' } };
  const withoutLive = captures();
  for (const target of Object.values(withoutLive)) {
    for (const theme of Object.values(target)) {
      theme.interactionDom = {};
      theme.interactionConvergence = {};
      theme.interactionAccessibility = {};
      for (const id of Object.keys(theme.interactions)) {
        theme.interactions[id] = {
          clip: theme.interactions[id].clip,
          activations: 1,
          focusRole: 'button',
          inputEvents: [],
        };
      }
    }
  }

  const result = compareCaptures(withoutLive, legacy, policy);
  assert.deepEqual(result.failures, []);
  assert.equal(result.summary.liveComparisons, 0);
});
