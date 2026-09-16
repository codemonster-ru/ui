// The VfTabs catalog cannot quietly shrink, and it cannot quietly change
// which component it describes.
//
// This is the M24 gate. The mandatory attacks of section 37, each keeping the
// count healthy and each having to fail semantically, naming the rules that
// stopped being proved:
//
//   - remove every ArrowDown case; replace ArrowDown with ArrowRight while
//     preserving the count;
//   - remove the current re-activation;
//   - remove the unknown-value case; remove the duplicate-value case;
//   - remove the no-panel case; remove the panel case;
//   - remove the tabId override; remove the panelId override;
//   - remove the overflow cases; remove the sibling isolation;
//   - remove the selected-vs-focused split; remove the tabindex pathology;
//   - remove RTL; remove the scroll interactions; remove the indicator clipping.
//
// Beyond the letters, the vocabulary and the claim shapes are attacked: an
// orientation prop, a PageDown key, a stepper-shaped claim, a claim on a hidden
// scroll button's tree node, a gesture without an index, `items.length` as the
// budget, a post-only scenario that did not scroll, a scenario that both
// converges and claims post-only, aria-selected that disagrees with tabindex,
// a focused-tab value with focus elsewhere, a scroll claim without the settled
// state, and a consumer control the catalog forgot to count.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { tabsCoverageViolations } from './tabs-coverage.mjs';
import { stepperCoverageViolations } from './stepper-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 65;
const ITEMS = [
  { value: 'overview', label: 'Overview' },
  { value: 'settings', label: 'Settings' },
  { value: 'billing', label: 'Billing' },
];

/** Cases that satisfy nothing new: three tabs with a consumer class and the middle tab seeded. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `tabs/padding-${index}`,
    title: `padding ${index}`,
    props: { items: ITEMS, defaultValue: 'settings' },
    attrs: { class: 'padding' },
    componentInteractive: 5,
    visual: false,
  }));
}

function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return remaining;
}

function expectRules(violations, expected, attack) {
  for (const rule of expected) {
    assert.ok(
      violations.some((violation) => violation.includes(rule)),
      `the tabs guard did not notice that "${rule}" is no longer proved after ${attack}: ${violations.join('; ')}`,
    );
  }
}

const presses = (entry, key) =>
  (entry.interaction?.steps ?? []).some((step) => step.action === 'pressKey' && step.key === key);
const clicksSelector = (entry, selector) =>
  (entry.interaction?.steps ?? []).some((step) => step.action === 'clickButton' && step.selector === selector);
const shippedCase = (id) => structuredClone(load('tabs').find((entry) => entry.id === id));
const withCase = (mutated) => load('tabs').map((entry) => (entry.id === mutated.id ? mutated : entry));

test('the shipped tabs catalog is fully covered', () => {
  assert.deepEqual(tabsCoverageViolations(load('tabs')), []);
});

test('the tabs catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('tabs').length >= FLOOR);
});

test('every tabs case id is unique and namespaced', () => {
  const ids = load('tabs').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('tabs/')));
});

test('every shipped tabs case declares its control budget, and the budgets span the scroll buttons alone, a panel, an overflow and two instances', () => {
  const budgets = load('tabs').map((entry) => entry.componentInteractive);

  assert.ok(budgets.every((budget) => Number.isInteger(budget) && budget >= 2));
  assert.ok(budgets.includes(2), 'the empty list case: two scroll buttons and nothing else');
  assert.ok(budgets.includes(5), 'three tabs, two buttons, no panel');
  assert.ok(budgets.includes(6), 'three tabs, two buttons, one panel');
  assert.ok(budgets.includes(9), 'seven tabs, two buttons');
  assert.ok(budgets.includes(12), 'the sibling cases with a panel each');
  assert.ok(
    load('tabs').filter((entry) => entry.consumerInteractive === 1).length >= 2,
    'a consumer control before the tabs and one inside the panel',
  );
});

// ------------------------------------------------------------ padding

test('duplicating and padding the catalog to the same count does not restore anything that was dropped', () => {
  const shipped = load('tabs');
  const kept = shipped.filter((entry) => !entry.interaction).slice(0, 10);
  const duplicated = kept.map((entry, index) => ({ ...entry, id: `${entry.id}-copy-${index}` }));
  const violations = tabsCoverageViolations([...kept, ...duplicated, ...padding(shipped.length - kept.length * 2)]);

  assert.ok(violations.length >= 25, `only ${violations.length} rule(s) fired: ${violations.join('; ')}`);
  expectRules(violations, ['Enter activates natively', 'ArrowDown moves forward', 'Home activates'], 'padding');
});

// ------------------------------------------------------------ interactions

test('removing every ArrowDown case fails, and padding does not help', () => {
  const eroded = dropAll(load('tabs'), (entry) => presses(entry, 'ArrowDown'), 'presses ArrowDown');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(1)]),
    ['ArrowDown moves forward on the horizontal tablist, prevented'],
    'dropping ArrowDown',
  );
});

test('replacing ArrowDown with ArrowRight while keeping the count fails', () => {
  const replaced = load('tabs').map((entry) =>
    presses(entry, 'ArrowDown')
      ? {
          ...entry,
          interaction: {
            ...entry.interaction,
            steps: entry.interaction.steps.map((step) =>
              step.action === 'pressKey' ? { ...step, key: 'ArrowRight' } : step,
            ),
          },
        }
      : entry,
  );
  expectRules(tabsCoverageViolations(replaced), ['ArrowDown moves forward'], 'replacing ArrowDown');
});

test('removing the current re-activation fails', () => {
  const eroded = dropAll(
    load('tabs'),
    (entry) => entry.id === 'tabs/interaction-click-current',
    'clicks the current tab',
  );
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(1)]),
    ['the pair is emitted again and nothing changes'],
    'dropping the current re-click',
  );
});

test('suppressing the pair on the current re-activation fails: the claim has to name one notification', () => {
  const mutated = shippedCase('tabs/interaction-click-current');
  mutated.interaction.expect.events = [];
  expectRules(tabsCoverageViolations(withCase(mutated)), ['the pair is emitted again'], 'an empty log on the re-click');
});

test('removing the unknown controlled value fails', () => {
  const eroded = dropAll(load('tabs'), (entry) => entry.id === 'tabs/model-value-unknown', 'passes an unknown value');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(1)]),
    ['no selected tab, zero tabindex=0, no panel'],
    'dropping the unknown value',
  );
});

test('removing the duplicate-value case fails', () => {
  const eroded = dropAll(load('tabs'), (entry) => entry.id === 'tabs/duplicate-values', 'duplicates a value');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(1)]),
    ['duplicate ids, two selected tabs and two tabindex=0'],
    'dropping the duplicate value',
  );
});

test('removing the no-panel case fails', () => {
  const eroded = dropAll(load('tabs'), (entry) => entry.id === 'tabs/default', 'renders without a panel slot');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(1)]),
    ['the fallback and the no-aria-controls half'],
    'dropping the no-panel case',
  );
});

test('removing the panel case fails', () => {
  const eroded = dropAll(load('tabs'), (entry) => entry.id === 'tabs/panel', 'renders the fallback with a panel');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(1)]),
    ['the aria-controls graph with a dangling reference'],
    'dropping the panel case',
  );
});

test('removing the tabId and panelId overrides fails', () => {
  const eroded = dropAll(
    load('tabs'),
    (entry) => (entry.props.items ?? []).some((item) => item.tabId !== undefined || item.panelId !== undefined),
    'overrides an id',
  );
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(3)]),
    ['overrides tabId', 'overrides panelId with a panel slot', 'overrides panelId without a panel slot'],
    'dropping the id overrides',
  );
});

test('removing the overflow cases fails', () => {
  const eroded = dropAll(load('tabs'), (entry) => (entry.props.items ?? []).length >= 4, 'overflows');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(8)]),
    [
      'the start scroll state',
      'a fractional clipped indicator',
      'the hidden indicator that keeps its offset',
      'the mirrored scroll state and the LTR-frame indicator',
      'the clamped scroll and the left-clipped indicator',
      'both buttons, both fades and a hidden indicator',
      'a scroll gesture converging on the fresh render',
    ],
    'dropping the overflow cases',
  );
});

test('removing the sibling cases fails', () => {
  const eroded = dropAll(load('tabs'), (entry) => Array.isArray(entry.group), 'renders two instances');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(5)]),
    ['twelve component-owned controls', 'the first unchanged', 'expects focus to stay there'],
    'dropping the siblings',
  );
});

test('removing the selected-vs-focused split fails', () => {
  const eroded = dropAll(
    load('tabs'),
    (entry) => ['tabs/interaction-focus-only', 'tabs/interaction-focused-not-selected-navigates'].includes(entry.id),
    'splits focus from selection',
  );
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(2)]),
    ['focus alone changes nothing', 'navigation starts from the focused tab'],
    'dropping the split',
  );
});

test('removing the tabindex pathologies fails: zero tabbable tabs and two tabbable tabs each have a case', () => {
  const eroded = dropAll(
    load('tabs'),
    (entry) => ['tabs/model-value-unknown', 'tabs/model-value-empty', 'tabs/duplicate-values'].includes(entry.id),
    'renders a tabindex pathology',
  );
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(3)]),
    ['zero tabindex=0', 'two tabindex=0', 'the ?? boundary'],
    'dropping the pathologies',
  );
});

test('removing the native Tab scenarios fails: the roving tabindex stops being load-bearing', () => {
  const eroded = dropAll(load('tabs'), (entry) => presses(entry, 'Tab'), 'presses Tab');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(2)]),
    ['lands on the panel', 'the roving tabindex is never load-bearing'],
    'dropping Tab',
  );
});

test('removing RTL fails', () => {
  const eroded = dropAll(load('tabs'), (entry) => entry.attrs?.dir === 'rtl', 'is rtl');
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(6)]),
    [
      'right to left without overflow',
      'ArrowLeft under dir=rtl moves forward',
      'ArrowRight under dir=rtl moves backward',
      'overflows under dir=rtl',
    ],
    'dropping RTL',
  );
});

test('removing the scroll interactions fails', () => {
  const eroded = dropAll(
    load('tabs'),
    (entry) =>
      clicksSelector(entry, '.vf-tabs__scroll-button--right') || clicksSelector(entry, '.vf-tabs__scroll-button--left'),
    'scrolls',
  );
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(3)]),
    ['the clamped scroll', 'both buttons, both fades', 'converging on the fresh render'],
    'dropping the scroll gestures',
  );
});

test('removing the indicator clipping fails', () => {
  const eroded = dropAll(
    load('tabs'),
    (entry) =>
      ['tabs/overflow-active-clipped', 'tabs/interaction-click-clipped', 'tabs/overflow-end-hidden'].includes(entry.id),
    'clips the indicator',
  );
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(3)]),
    ['a fractional clipped indicator', 'clicks the partly clipped tab', 'the hidden indicator that keeps its offset'],
    'dropping the clipping',
  );
});

test('removing native Enter or Space fails', () => {
  const eroded = dropAll(
    load('tabs'),
    (entry) => presses(entry, 'Enter') || presses(entry, ' '),
    'presses Enter or Space',
  );
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(2)]),
    ['Enter activates natively', 'Space activates natively'],
    'dropping Enter and Space',
  );
});

test('turning native Enter into a handled key fails: the claim has to say the keydown was not prevented', () => {
  const mutated = shippedCase('tabs/interaction-enter');
  mutated.interaction.expect.keydownPrevented = [true];
  expectRules(
    tabsCoverageViolations(withCase(mutated)),
    ['the reference does not prevent it', 'Enter activates natively'],
    'a prevented Enter',
  );
});

test('removing the tree claim on the selected state fails', () => {
  const mutated = shippedCase('tabs/interaction-click-settings');
  delete mutated.interaction.expect['a11y:secondTab.selected'];
  expectRules(
    tabsCoverageViolations(withCase(mutated)),
    ['the exposed selected state is never an independent proof'],
    'dropping the tree claim',
  );
});

test('removing the disabled-keyboard, focus-only and consumer-panel scenarios fails', () => {
  const eroded = dropAll(
    load('tabs'),
    (entry) =>
      [
        'tabs/interaction-disabled-focus',
        'tabs/interaction-panel-consumer-click',
        'tabs/interaction-controlled-model',
      ].includes(entry.id),
    'is one of the three',
  );
  expectRules(
    tabsCoverageViolations([...eroded, ...padding(3)]),
    [
      'a disabled tab takes no focus',
      'consumer control inside the panel and expects the tabs untouched',
      'round-trips the controlled prop',
    ],
    'dropping the three',
  );
});

// ------------------------------------------------------------ vocabulary

test('an orientation prop, a PageDown key, a stepper-shaped claim and a hidden-button tree claim are rejected', () => {
  const orientation = { ...padding(1)[0], id: 'tabs/vertical', props: { items: ITEMS, orientation: 'vertical' } };
  const escape = shippedCase('tabs/interaction-arrow-right');
  escape.interaction.steps[1] = { action: 'pressKey', key: 'PageDown' };
  const stepperShaped = shippedCase('tabs/interaction-arrow-right');
  stepperShaped.interaction.expect.currentValue = 'settings';
  const hiddenTree = shippedCase('tabs/interaction-arrow-right');
  hiddenTree.interaction.expect['a11y:scrollLeft.hidden'] = 'true';
  const violations = tabsCoverageViolations([...load('tabs'), orientation, escape, stepperShaped, hiddenTree]);

  expectRules(
    violations,
    [
      'declares prop [orientation]',
      'presses [PageDown]',
      'expects [currentValue], which no tabs snapshot records',
      'expects [a11y:scrollLeft.hidden]',
    ],
    'the vocabulary attacks',
  );
});

test('a gesture without an index, a foreign selector and a foreign slot are rejected', () => {
  const noIndex = shippedCase('tabs/interaction-click-settings');
  delete noIndex.interaction.steps[0].index;
  const foreign = shippedCase('tabs/interaction-click-settings');
  foreign.interaction.steps[0].selector = '.vf-stepper__trigger';
  const slot = { ...padding(1)[0], id: 'tabs/header', content: { header: { text: 'x' } } };
  const violations = tabsCoverageViolations([...load('tabs'), noIndex, foreign, slot]);

  expectRules(
    violations,
    ['names no index', 'targets [.vf-stepper__trigger]', 'declares slot [header]'],
    'the gesture attacks',
  );
});

test("items.length as the budget is rejected: the scroll buttons and the panel are the component's too", () => {
  const replaced = load('tabs').map((entry) => ({
    ...entry,
    componentInteractive: (entry.group ?? [entry.props]).reduce(
      (total, member) => total + (member.items ?? []).length,
      0,
    ),
  }));
  const violations = tabsCoverageViolations(replaced);

  assert.ok(violations.length >= 60, `only ${violations.length} budget rule(s) fired`);
  expectRules(violations, ['two scroll buttons per instance, and the active panel'], 'items.length as the budget');
});

test('a consumer control the catalog forgot to count, and a hidden one it invented, are rejected', () => {
  const forgotten = shippedCase('tabs/before-consumer-button');
  delete forgotten.consumerInteractive;
  const invented = shippedCase('tabs/panel');
  invented.consumerInteractive = 1;
  const violations = tabsCoverageViolations(
    withCase(forgotten).map((entry) => (entry.id === invented.id ? invented : entry)),
  );

  expectRules(
    violations,
    ['declares 0 consumer control(s) but 1', 'declares 1 consumer control(s) but 0'],
    'the consumer budget attacks',
  );
});

test('aria-selected that disagrees with tabindex, or with the selected value, is rejected', () => {
  const inverted = shippedCase('tabs/interaction-click-settings');
  inverted.interaction.expect.tabindexes = ['0', '-1', '-1'];
  const wrongTab = shippedCase('tabs/interaction-click-settings');
  wrongTab.interaction.expect.ariaSelected = ['true', 'false', 'false'];
  wrongTab.interaction.expect.tabindexes = ['0', '-1', '-1'];
  const violations = tabsCoverageViolations([...withCase(inverted), { ...wrongTab, id: 'tabs/interaction-wrong-tab' }]);

  expectRules(
    violations,
    ['the reference keys both to the value', 'while selectedValue is [settings]'],
    'the split claims',
  );
});

test('a panel claim that contradicts the slot, and a focused-tab value with focus elsewhere, are rejected', () => {
  const noPanel = shippedCase('tabs/interaction-arrow-right');
  noPanel.interaction.expect.panelPresent = false;
  const elsewhere = shippedCase('tabs/interaction-tab-to-panel');
  elsewhere.interaction.expect.focusValue = 'overview';
  const violations = tabsCoverageViolations([...withCase(noPanel), { ...elsewhere, id: 'tabs/interaction-elsewhere' }]);

  expectRules(
    violations,
    ['renders the panel only for a selected tab with a panel slot', 'a focused tab value with focus elsewhere'],
    'the panel and focus claims',
  );
});

test('a post-only scenario that did not scroll, one that both converges and claims post-only, and a scroll claim without the settled state are rejected', () => {
  const unscrolled = shippedCase('tabs/interaction-arrow-right');
  delete unscrolled.interaction.matches;
  unscrolled.interaction.postOnly = 'because';
  const both = shippedCase('tabs/interaction-scroll-right-then-left');
  both.interaction.postOnly = 'because';
  const unsettled = shippedCase('tabs/interaction-scroll-right');
  unsettled.interaction.expect.scrolling = true;
  const bare = shippedCase('tabs/interaction-scroll-right');
  delete bare.interaction.expect.scrollLeft;
  const violations = tabsCoverageViolations([
    ...load('tabs'),
    { ...unscrolled, id: 'tabs/interaction-unscrolled' },
    { ...both, id: 'tabs/interaction-both' },
    { ...unsettled, id: 'tabs/interaction-unsettled' },
    { ...bare, id: 'tabs/interaction-bare' },
  ]);

  expectRules(
    violations,
    [
      'post-only without leaving the viewport scrolled',
      'both converges and claims to be post-only',
      'the 140 ms scrolling state ended',
      'scrolls without claiming scrollLeft',
    ],
    'the post-only attacks',
  );
});

test('a convergence target that renders another value, or that is itself an interaction, is rejected', () => {
  const wrongTarget = shippedCase('tabs/interaction-click-settings');
  wrongTarget.interaction.matches = 'tabs/default-value-billing';
  const interactionTarget = shippedCase('tabs/interaction-click-settings');
  interactionTarget.interaction.matches = 'tabs/interaction-enter';
  const violations = tabsCoverageViolations([
    ...withCase(wrongTarget),
    { ...interactionTarget, id: 'tabs/interaction-target' },
  ]);

  expectRules(
    violations,
    ['converges on a case that renders billing', 'which is not an initial case'],
    'the convergence attacks',
  );
});

test('the stepper catalog is not a tabs catalog: the tabs guard rejects it wholesale, and the stepper guard rejects the tabs catalog', () => {
  assert.ok(tabsCoverageViolations(load('stepper')).length > 50);
  assert.ok(stepperCoverageViolations(load('tabs')).length > 50);
});
