// The VfStepper catalog cannot quietly shrink, and it cannot quietly change
// which component it describes.
//
// This is the M23 gate. The mandatory attacks of section 35, each keeping the
// count healthy and each having to fail semantically, naming the rules that
// stopped being proved:
//
//   - duplicate and pad the cases to preserve the total;
//   - remove the wrong-axis cases;
//   - replace the Home case with another arrow case;
//   - replace the vertical cases with horizontal ones;
//   - remove the disabled-skip cases;
//   - remove the unknown controlled value;
//   - remove the fractional factors;
//   - remove the current re-click;
//   - remove native Enter; remove native Space;
//   - remove the focus assertions;
//   - substitute an accordion-shaped `expanded` case;
//   - replace every ownership budget with `items.length` mechanically.
//
// Beyond the letters, the vocabulary is attacked: a case that presses Escape,
// a `multiple` prop, a `header` slot, a trigger gesture without an index, a
// claim on the tree's `current`, two siblings sharing a value, and a consumer
// budget with nothing beside the stepper.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { stepperCoverageViolations } from './stepper-coverage.mjs';
import { accordionCoverageViolations } from './accordion-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 60;
const ITEMS = [
  { value: 'account', label: 'Account' },
  { value: 'profile', label: 'Profile' },
  { value: 'confirm', label: 'Confirm' },
];

/** Cases that satisfy nothing new: a horizontal stepper with a consumer class and the middle step seeded. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `stepper/padding-${index}`,
    title: `padding ${index}`,
    props: { items: ITEMS, defaultValue: 'profile' },
    attrs: { class: 'padding' },
    componentInteractive: 3,
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
      `the stepper guard did not notice that "${rule}" is no longer proved after ${attack}: ${violations.join('; ')}`,
    );
  }
}

const presses = (entry, key) =>
  (entry.interaction?.steps ?? []).some((step) => step.action === 'pressKey' && step.key === key);
const orientation = (entry) => entry.props?.orientation ?? 'horizontal';
const stayed = (entry) => entry.interaction?.expect?.events?.length === 0;

test('the shipped stepper catalog is fully covered', () => {
  assert.deepEqual(stepperCoverageViolations(load('stepper')), []);
});

test('the stepper catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('stepper').length >= FLOOR);
});

test('every stepper case id is unique and namespaced', () => {
  const ids = load('stepper').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('stepper/')));
});

test('every shipped stepper case declares its trigger budget, and the budgets span zero, several and two instances', () => {
  const budgets = load('stepper').map((entry) => entry.componentInteractive);

  assert.ok(budgets.every((budget) => Number.isInteger(budget) && budget >= 0));
  assert.ok(budgets.includes(0), 'the empty list case');
  assert.ok(budgets.includes(7), 'the seven-item cases');
  assert.ok(budgets.includes(5), 'the sibling cases');
  assert.ok(
    load('stepper').some((entry) => entry.consumerInteractive === 1),
    'the beside case',
  );
});

// ------------------------------------------------------------ padding

test('duplicating and padding the catalog to the same count does not restore anything that was dropped', () => {
  const shipped = load('stepper');
  const kept = shipped.filter((entry) => !entry.interaction).slice(0, 10);
  const duplicated = kept.map((entry, index) => ({ ...entry, id: `${entry.id}-copy-${index}` }));
  const violations = stepperCoverageViolations([...kept, ...duplicated, ...padding(shipped.length - kept.length * 2)]);

  assert.ok(violations.length >= 20, `only ${violations.length} rule(s) fired: ${violations.join('; ')}`);
  expectRules(
    violations,
    ['Enter activates natively', 'ArrowDown on a horizontal stepper is ignored', 'Home activates'],
    'padding',
  );
});

// ------------------------------------------------------------ interactions

test('removing the wrong-axis cases fails, and padding does not help', () => {
  const eroded = dropAll(
    load('stepper'),
    (entry) =>
      (orientation(entry) === 'horizontal' && presses(entry, 'ArrowDown')) ||
      (orientation(entry) === 'vertical' && presses(entry, 'ArrowRight')),
    'presses the wrong axis',
  );
  expectRules(
    stepperCoverageViolations([...eroded, ...padding(4)]),
    [
      'ArrowDown on a horizontal stepper is ignored and not prevented',
      'ArrowRight on a vertical stepper is ignored and not prevented',
    ],
    'dropping the wrong-axis cases',
  );
});

test('replacing the Home case with another arrow case fails', () => {
  const shipped = load('stepper');
  const arrow = shipped.find((entry) => entry.id === 'stepper/interaction-arrow-right');
  const replaced = shipped.map((entry) =>
    entry.id === 'stepper/interaction-home' ? { ...arrow, id: 'stepper/interaction-home' } : entry,
  );
  expectRules(
    stepperCoverageViolations(replaced),
    ['Home activates and focuses the first enabled step'],
    'replacing Home',
  );
});

test('replacing the vertical cases with horizontal ones fails', () => {
  const shipped = load('stepper');
  const replaced = shipped.map((entry) =>
    orientation(entry) === 'vertical' && !entry.group
      ? {
          ...entry,
          props: { ...entry.props, orientation: 'horizontal' },
          interaction: entry.interaction
            ? {
                ...entry.interaction,
                steps: entry.interaction.steps.map((step) =>
                  step.action === 'pressKey'
                    ? {
                        ...step,
                        key:
                          { ArrowDown: 'ArrowRight', ArrowUp: 'ArrowLeft', ArrowRight: 'ArrowDown' }[step.key] ??
                          step.key,
                      }
                    : step,
                ),
              }
            : undefined,
        }
      : entry,
  );
  expectRules(
    stepperCoverageViolations(replaced),
    [
      'ArrowDown on a vertical stepper activates',
      'ArrowUp on a vertical stepper',
      'ArrowRight on a vertical stepper is ignored',
      'vertical with the default content position',
      'vertical with content-start',
    ],
    'flattening the vertical cases',
  );
});

test('removing the disabled-skip cases fails', () => {
  const eroded = dropAll(
    load('stepper'),
    (entry) => entry.interaction && (entry.props.items ?? []).some((item) => item.disabled),
    'navigates past a disabled step',
  );
  expectRules(
    stepperCoverageViolations([...eroded, ...padding(6)]),
    [
      'ArrowRight skips a disabled step',
      'ArrowLeft skips a disabled step',
      'Home skips a disabled first step',
      'End skips a disabled last step',
      'disabled trigger takes no focus',
    ],
    'dropping the disabled-skip cases',
  );
});

test('removing the unknown controlled value fails', () => {
  const eroded = dropAll(
    load('stepper'),
    (entry) => entry.props?.modelValue === 'missing',
    'passes an unknown modelValue',
  );
  expectRules(
    stepperCoverageViolations([...eroded, ...padding(1)]),
    ['unknown controlled modelValue'],
    'dropping the unknown value',
  );
});

test('removing the fractional factors fails', () => {
  const eroded = dropAll(load('stepper'), (entry) => (entry.props?.items?.length ?? 0) >= 4, 'has four or more items');
  expectRules(
    stepperCoverageViolations([...eroded, ...padding(4)]),
    ['factor of 1/3', 'factor of 2/3', 'seventeen-digit factor', 'last digit rounds up'],
    'dropping the fractional factors',
  );
});

test('removing the current re-click fails', () => {
  const eroded = dropAll(
    load('stepper'),
    (entry) => entry.id === 'stepper/interaction-click-current',
    'clicks the current step',
  );
  expectRules(
    stepperCoverageViolations([...eroded, ...padding(1)]),
    ['clicks the current trigger'],
    'dropping the re-click',
  );
});

test('removing native Enter fails', () => {
  const eroded = dropAll(load('stepper'), (entry) => presses(entry, 'Enter') && !stayed(entry), 'presses Enter');
  expectRules(stepperCoverageViolations([...eroded, ...padding(1)]), ['Enter activates natively'], 'dropping Enter');
});

test('removing native Space fails', () => {
  const eroded = dropAll(load('stepper'), (entry) => presses(entry, ' '), 'presses Space');
  expectRules(stepperCoverageViolations([...eroded, ...padding(1)]), ['Space activates natively'], 'dropping Space');
});

test('turning native Enter into a handled key - activates false, prevented - fails', () => {
  const mutated = load('stepper').map((entry) =>
    entry.id === 'stepper/interaction-enter'
      ? {
          ...entry,
          interaction: {
            ...entry.interaction,
            expect: { ...entry.interaction.expect, activates: false, keydownPrevented: [true] },
          },
        }
      : entry,
  );
  expectRules(
    stepperCoverageViolations(mutated),
    [
      'presses Enter or Space without claiming a native activation',
      'the reference does not prevent it',
      'Enter activates natively',
    ],
    'handling Enter',
  );
});

test('removing the focus assertions fails', () => {
  const mutated = load('stepper').map((entry) => {
    if (!entry.interaction) return entry;
    const { focusValue, focusRole, ...expect } = entry.interaction.expect;
    void focusValue;
    void focusRole;
    return { ...entry, interaction: { ...entry.interaction, expect } };
  });
  const violations = stepperCoverageViolations(mutated);
  expectRules(
    violations,
    [
      'claims nothing about where focus ended',
      'ArrowRight on a horizontal stepper activates and focuses',
      'focus alone changes nothing',
    ],
    'dropping focus',
  );
  assert.ok(violations.filter((violation) => violation.includes('where focus ended')).length >= 20);
});

test('removing the prevented-key assertions fails', () => {
  const mutated = load('stepper').map((entry) => {
    if (!entry.interaction) return entry;
    const { keydownPrevented, ...expect } = entry.interaction.expect;
    void keydownPrevented;
    return { ...entry, interaction: { ...entry.interaction, expect } };
  });
  expectRules(
    stepperCoverageViolations(mutated),
    ['without claiming whether each keydown was prevented'],
    'dropping keydownPrevented',
  );
});

test('claiming aria-current moved while the trigger modifier stayed fails', () => {
  const mutated = load('stepper').map((entry) =>
    entry.id === 'stepper/interaction-click-forward'
      ? {
          ...entry,
          interaction: { ...entry.interaction, expect: { ...entry.interaction.expect, currentClassValue: 'account' } },
        }
      : entry,
  );
  expectRules(
    stepperCoverageViolations(mutated),
    ["trigger's own current modifier moved with aria-current"],
    'splitting the state',
  );
});

test('claiming a selection change without the factor fails', () => {
  const mutated = load('stepper').map((entry) => {
    if (entry.id !== 'stepper/interaction-click-forward') return entry;
    const { progressFactor, ...expect } = entry.interaction.expect;
    void progressFactor;
    return { ...entry, interaction: { ...entry.interaction, expect } };
  });
  expectRules(
    stepperCoverageViolations(mutated),
    ['without claiming the progress factor moved'],
    'dropping the factor claim',
  );
});

test('claiming item classes the reference cannot produce fails', () => {
  const mutated = load('stepper').map((entry) =>
    entry.id === 'stepper/interaction-click-forward'
      ? {
          ...entry,
          interaction: {
            ...entry.interaction,
            expect: { ...entry.interaction.expect, itemStates: ['upcoming', 'current', 'complete'] },
          },
        }
      : entry,
  );
  expectRules(stepperCoverageViolations(mutated), ['not a state the reference produces'], 'inverting the classes');
});

test('removing the event log claims fails', () => {
  const mutated = load('stepper').map((entry) => {
    if (!entry.interaction) return entry;
    const { events, ...expect } = entry.interaction.expect;
    void events;
    return { ...entry, interaction: { ...entry.interaction, expect } };
  });
  expectRules(stepperCoverageViolations(mutated), ['claims nothing about the change log'], 'dropping events');
});

test('converging on a case that renders another state fails', () => {
  const mutated = load('stepper').map((entry) =>
    entry.id === 'stepper/interaction-click-forward'
      ? { ...entry, interaction: { ...entry.interaction, matches: 'stepper/default-value-confirm' } }
      : entry,
  );
  expectRules(stepperCoverageViolations(mutated), ['converges on a case that renders'], 'mis-converging');
});

test('removing the convergence target from a single-instance scenario fails', () => {
  const mutated = load('stepper').map((entry) => {
    if (entry.id !== 'stepper/interaction-arrow-right') return entry;
    const { matches, ...interaction } = entry.interaction;
    void matches;
    return { ...entry, interaction };
  });
  expectRules(stepperCoverageViolations(mutated), ['names no initial case to converge on'], 'dropping matches');
});

test('removing the sibling cases fails', () => {
  const eroded = dropAll(load('stepper'), (entry) => Array.isArray(entry.group), 'renders siblings');
  expectRules(
    stepperCoverageViolations([...eroded, ...padding(3)]),
    [
      'renders two siblings',
      'clicks in the second of two siblings',
      'navigates by key inside the second of two siblings',
    ],
    'dropping the siblings',
  );
});

// ------------------------------------------------------------- substitution

test('substituting an accordion-shaped expanded case fails on vocabulary', () => {
  const accordion = load('accordion').find((entry) => entry.id === 'accordion/interaction-click-opens');
  const disguised = {
    ...accordion,
    id: 'stepper/interaction-click-opens',
    props: { items: ITEMS },
    content: undefined,
    componentInteractive: 3,
    interaction: {
      ...accordion.interaction,
      steps: [{ action: 'clickButton', selector: '.vf-stepper__trigger', index: 0 }],
      matches: 'stepper/default',
    },
  };
  delete disguised.content;
  const violations = stepperCoverageViolations([...load('stepper'), disguised]);
  expectRules(
    violations,
    [
      'expects [expanded], which no stepper snapshot records',
      'expects [panelPresent]',
      'expects [a11y:trigger.expanded]',
    ],
    'smuggling an accordion case',
  );
  // And the accordion guard refuses the stepper catalog wholesale.
  assert.ok(accordionCoverageViolations(load('stepper')).length > 30);
});

test('replacing every ownership budget with items.length mechanically fails on the group cases', () => {
  const mutated = load('stepper').map((entry) => ({
    ...entry,
    componentInteractive: (entry.props?.items ?? []).length,
  }));
  const violations = stepperCoverageViolations(mutated);
  expectRules(
    violations,
    ['stepper/siblings declares 3 component-owned control(s) but renders 5'],
    'items.length as the budget',
  );
  assert.equal(violations.filter((violation) => violation.includes('renders 5 trigger(s)')).length, 3);
});

test('declaring a consumer budget with nothing beside the stepper fails, and vice versa', () => {
  const invented = load('stepper').map((entry) =>
    entry.id === 'stepper/default' ? { ...entry, consumerInteractive: 1 } : entry,
  );
  expectRules(
    stepperCoverageViolations(invented),
    ['declares 1 consumer control(s) but 0 stand(s) beside'],
    'inventing a consumer control',
  );

  const dropped = load('stepper').map((entry) =>
    entry.id === 'stepper/beside-consumer-button' ? { ...entry, consumerInteractive: 0 } : entry,
  );
  expectRules(
    stepperCoverageViolations(dropped),
    ['declares 0 consumer control(s) but 1 stand(s) beside'],
    'hiding the consumer control',
  );
});

test('a zero budget on a case with items, or a budget that excludes disabled items, fails', () => {
  const zero = load('stepper').map((entry) =>
    entry.id === 'stepper/default' ? { ...entry, componentInteractive: 0 } : entry,
  );
  expectRules(
    stepperCoverageViolations(zero),
    ['stepper/default declares 0 component-owned control(s) but renders 3'],
    'zero budget',
  );

  const enabledOnly = load('stepper').map((entry) =>
    entry.id === 'stepper/disabled-middle' ? { ...entry, componentInteractive: 2 } : entry,
  );
  expectRules(
    stepperCoverageViolations(enabledOnly),
    ['renders 3 trigger(s); one per item over every instance, disabled ones included'],
    'excluding disabled',
  );
});

// -------------------------------------------------------------- vocabulary

test('a case that presses Escape is rejected', () => {
  const escape = {
    ...load('stepper').find((entry) => entry.id === 'stepper/interaction-arrow-right'),
    id: 'stepper/interaction-escape',
  };
  escape.interaction = {
    ...escape.interaction,
    steps: [escape.interaction.steps[0], { action: 'pressKey', key: 'Escape' }],
  };
  expectRules(stepperCoverageViolations([...load('stepper'), escape]), ['presses [Escape]'], 'pressing Escape');
});

test('a case that names a prop, an item key or a slot the reference does not have is rejected', () => {
  const multiple = { ...load('stepper')[0], id: 'stepper/multiple', props: { items: ITEMS, multiple: true } };
  const header = { ...load('stepper')[0], id: 'stepper/header', content: { header: { text: 'x' } } };
  const icon = {
    ...load('stepper')[0],
    id: 'stepper/icon',
    props: { items: [{ ...ITEMS[0], icon: 'check' }] },
    componentInteractive: 1,
  };
  const violations = stepperCoverageViolations([...load('stepper'), multiple, header, icon]);
  expectRules(
    violations,
    ['declares prop [multiple]', 'declares slot [header]', 'puts [icon] in an item'],
    'vocabulary',
  );
});

test('a trigger gesture without an index is rejected', () => {
  const noIndex = {
    ...load('stepper').find((entry) => entry.id === 'stepper/interaction-click-forward'),
    id: 'stepper/no-index',
  };
  noIndex.interaction = {
    ...noIndex.interaction,
    steps: [{ action: 'clickButton', selector: '.vf-stepper__trigger' }],
  };
  expectRules(stepperCoverageViolations([...load('stepper'), noIndex]), ['names no index'], 'omitting the index');
});

test('a claim on the tree exposing the current step is rejected as vacuous', () => {
  const current = {
    ...load('stepper').find((entry) => entry.id === 'stepper/interaction-click-forward'),
    id: 'stepper/tree-current',
  };
  current.interaction = {
    ...current.interaction,
    expect: { ...current.interaction.expect, 'a11y:secondTrigger.current': 'true' },
  };
  expectRules(
    stepperCoverageViolations([...load('stepper'), current]),
    ['does not expose the current step'],
    'claiming tree current',
  );
});

test('two siblings sharing a value are rejected: the document-wide focus quirk stays out of the catalog', () => {
  const shared = load('stepper').map((entry) =>
    entry.id === 'stepper/interaction-sibling-keyboard'
      ? { ...entry, group: [entry.group[0], { ...entry.group[1], items: ITEMS.slice(0, 2) }] }
      : entry,
  );
  expectRules(stepperCoverageViolations(shared), ['shares the value [account] between two triggers'], 'sharing values');
});
