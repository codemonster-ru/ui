// The VfAccordion catalog cannot quietly shrink, and it cannot quietly change
// which component it describes.
//
// This is the M22 gate. The mandatory padding attacks, in the milestone's
// letters (section 31):
//
//   A. remove the closed-state cases and pad;
//   B. remove the open-state cases and pad;
//   C. remove the disabled cases and pad;
//   D. remove the component-owned-control declaration and pad;
//   E. remove the consumer-control distinction and pad;
//   F. remove the relationship-bearing cases (nested, siblings) and pad;
//   G. remove the keyboard activation cases and pad;
//   H. remove every interaction case and pad;
//   I. replace the accordion cases with panel or card cases of equal count.
//
// All keep the count healthy. All have to fail semantically, naming the rules
// that stopped being proved.
//
// Beyond the letters, the vocabulary is attacked: a case that presses
// ArrowDown, a case that names a `multiple` prop, a case that declares a
// `header` slot, and - the ownership attacks in catalog form - a case that
// declares zero component-owned controls, two for one instance, or a consumer
// control that cannot reach the DOM.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { accordionCoverageViolations } from './accordion-coverage.mjs';
import { panelCoverageViolations } from './panel-coverage.mjs';
import { cardCoverageViolations } from './card-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 34;

/** Cases that satisfy nothing new: a titled, open accordion with a consumer class. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `accordion/padding-${index}`,
    title: `padding ${index}`,
    props: { title: 'Padding', defaultOpen: true },
    attrs: { class: 'padding' },
    content: { body: { text: 'Body' } },
    componentInteractive: 1,
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
      `the accordion guard did not notice that "${rule}" is no longer proved after ${attack}: ${violations.join('; ')}`,
    );
  }
}

const isOpen = (entry) => (entry.props.open !== undefined ? entry.props.open : Boolean(entry.props.defaultOpen));

test('the shipped accordion catalog is fully covered', () => {
  assert.deepEqual(accordionCoverageViolations(load('accordion')), []);
});

test('the accordion catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('accordion').length >= FLOOR);
});

test('every accordion case id is unique and namespaced', () => {
  const ids = load('accordion').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('accordion/')));
});

test('every shipped accordion case declares at least one component-owned control', () => {
  // The other direction from M15-M21, where every case declared zero. This is
  // the catalog half of "expected component-owned controls > 0".
  for (const entry of load('accordion')) {
    assert.ok(Number.isInteger(entry.componentInteractive) && entry.componentInteractive >= 1, entry.id);
  }
  assert.ok(load('accordion').some((entry) => entry.componentInteractive === 2));
});

// ---------------------------------------------------------------- A and B

test('A. dropping the closed-state cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(load('accordion'), (entry) => !isOpen(entry) && !entry.interaction, 'is initially closed');
  const violations = accordionCoverageViolations([...eroded, ...padding(FLOOR)]);

  expectRules(
    violations,
    ['closed by default', 'open=false with defaultOpen=true', 'disabled while closed', 'rich content while closed'],
    'dropping the closed cases',
  );
});

test('B. dropping the open-state cases fails semantically while padding keeps the count up', () => {
  // The padding is itself open, so the padding has to be closed here or the
  // attack refutes itself. What it cannot supply is any of the specific open
  // states.
  const eroded = dropAll(load('accordion'), (entry) => isOpen(entry) && !entry.interaction, 'is initially open');
  const closedPadding = padding(FLOOR).map((entry) => ({ ...entry, props: { title: 'Padding' } }));
  const violations = accordionCoverageViolations([...eroded, ...closedPadding]);

  expectRules(
    violations,
    [
      'defaultOpen alone',
      'controlled prop alone',
      'disabled while open',
      'rich markup content while open',
      'no default slot',
    ],
    'dropping the open cases',
  );
});

// ---------------------------------------------------------------------- C

test('C. dropping the disabled cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(load('accordion'), (entry) => entry.props.disabled === true, 'is disabled');
  const violations = accordionCoverageViolations([...eroded, ...padding(FLOOR)]);

  expectRules(
    violations,
    [
      'disabled while closed',
      'disabled while open',
      'disabled trigger ignores Enter',
      'disabled trigger ignores Space',
    ],
    'dropping the disabled cases',
  );
});

// ---------------------------------------------------------------------- D

test('D. removing the component-owned-control declaration is rejected on every case it is removed from', () => {
  const eroded = load('accordion').map((entry) => {
    const { componentInteractive: dropped, ...rest } = entry;
    void dropped;
    return rest;
  });
  const violations = accordionCoverageViolations([...eroded, ...padding(FLOOR)]);

  assert.ok(
    violations.filter((violation) => violation.includes('declares no componentInteractive budget')).length >= 30,
  );
});

test('D. declaring zero component-owned controls is rejected: an accordion always renders its trigger', () => {
  const eroded = load('accordion').map((entry) => ({ ...entry, componentInteractive: 0 }));
  const violations = accordionCoverageViolations(eroded);

  assert.ok(violations.some((violation) => violation.includes('always renders its trigger')));
});

test('D. declaring two component-owned controls for one instance is rejected, and one for two', () => {
  const eroded = load('accordion').map((entry) =>
    entry.id === 'accordion/default'
      ? { ...entry, componentInteractive: 2 }
      : entry.id === 'accordion/nested'
        ? { ...entry, componentInteractive: 1 }
        : entry,
  );
  const violations = accordionCoverageViolations(eroded);

  assert.ok(violations.some((violation) => violation.startsWith('accordion/default declares 2 component-owned')));
  assert.ok(violations.some((violation) => violation.startsWith('accordion/nested declares 1 component-owned')));
});

// ---------------------------------------------------------------------- E

test('E. dropping the consumer-control cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(
    load('accordion'),
    (entry) => entry.content?.body?.control !== undefined || entry.content?.trigger?.control !== undefined,
    'has a consumer control',
  );
  const violations = accordionCoverageViolations([...eroded, ...padding(FLOOR)]);

  expectRules(
    violations,
    [
      'consumer control in an open panel',
      'consumer control in a closed panel',
      'consumer control inside the trigger slot',
      'opens a panel holding a consumer control',
    ],
    'dropping the consumer-control cases',
  );
});

test('E. a consumer budget that contradicts the state is rejected in both directions', () => {
  const shipped = load('accordion');
  // A control in a closed panel declared as reaching the DOM.
  const overdeclared = shipped.map((entry) =>
    entry.id === 'accordion/consumer-control-closed' ? { ...entry, consumerInteractive: 1 } : entry,
  );
  assert.ok(
    accordionCoverageViolations(overdeclared).some((violation) =>
      violation.startsWith('accordion/consumer-control-closed declares 1 consumer control(s) but its slots put 0'),
    ),
  );
  // A control in an open panel declared as absent.
  const underdeclared = shipped.map((entry) =>
    entry.id === 'accordion/consumer-control-open' ? { ...entry, consumerInteractive: 0 } : entry,
  );
  assert.ok(
    accordionCoverageViolations(underdeclared).some((violation) =>
      violation.startsWith('accordion/consumer-control-open declares 0 consumer control(s) but its slots put 1'),
    ),
  );
  // A consumer control counted as the component's.
  const misclassified = shipped.map((entry) =>
    entry.id === 'accordion/consumer-control-open'
      ? { ...entry, consumerInteractive: 0, componentInteractive: 2 }
      : entry,
  );
  const violations = accordionCoverageViolations(misclassified);
  assert.ok(
    violations.some((violation) => violation.startsWith('accordion/consumer-control-open declares 2 component-owned')),
  );
  assert.ok(
    violations.some((violation) => violation.startsWith('accordion/consumer-control-open declares 0 consumer')),
  );
});

// ---------------------------------------------------------------------- F

test('F. dropping the relationship-bearing cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(
    load('accordion'),
    (entry) => entry.group !== undefined || entry.content?.body?.accordion !== undefined,
    'renders two instances',
  );
  const violations = accordionCoverageViolations([...eroded, ...padding(FLOOR)]);

  expectRules(
    violations,
    ['nests an accordion', 'renders two siblings', 'first of two siblings', 'nested inner trigger'],
    'dropping the nested and sibling cases',
  );
});

// ---------------------------------------------------------------------- G

test('G. dropping the keyboard activation cases fails semantically while the click cases remain', () => {
  const eroded = dropAll(
    load('accordion'),
    (entry) => (entry.interaction?.steps ?? []).some((step) => step.action === 'pressKey'),
    'presses a key',
  );
  const violations = accordionCoverageViolations([...eroded, ...padding(FLOOR)]);

  expectRules(
    violations,
    ['Enter opens a closed accordion', 'Space opens a closed accordion', 'Enter closes an open accordion'],
    'dropping the keyboard cases',
  );
  // Click evidence must not have stood in for keyboard evidence.
  assert.ok(!violations.some((violation) => violation.includes('pointer click opens')));
});

test('G. a keyboard case that keeps the key but drops the claim is not coverage', () => {
  // The M10.1 hardening, repeated: the Enter press stays in the catalog but
  // no longer claims to open anything.
  const eroded = load('accordion').map((entry) =>
    entry.id === 'accordion/interaction-enter-opens'
      ? {
          ...entry,
          interaction: { ...entry.interaction, expect: { activates: false, focusRole: 'trigger' }, matches: undefined },
        }
      : entry,
  );
  const violations = accordionCoverageViolations(eroded);

  expectRules(violations, ['Enter opens a closed accordion'], 'removing the Enter claim');
});

test('G. a keyboard case that claims a native click activated the trigger is rejected as the wrong mechanism', () => {
  // The reference toggles in keydown and prevents the default, so no native
  // click follows. A case claiming activates=true for Enter would be
  // describing a port that relies on native activation.
  const eroded = load('accordion').map((entry) =>
    entry.id === 'accordion/interaction-enter-opens'
      ? { ...entry, interaction: { ...entry.interaction, expect: { ...entry.interaction.expect, activates: true } } }
      : entry,
  );
  expectRules(
    accordionCoverageViolations(eroded),
    ['Enter opens a closed accordion'],
    'claiming a native click on Enter',
  );
});

// ---------------------------------------------------------------------- H

test('H. dropping every interaction case fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(load('accordion'), (entry) => entry.interaction !== undefined, 'has an interaction');
  const violations = accordionCoverageViolations([...eroded, ...padding(FLOOR)]);

  expectRules(
    violations,
    [
      'pointer click opens',
      'pointer click closes',
      'clicks twice',
      'round-trips the controlled prop',
      'focus alone changes nothing',
      'settled transition',
    ],
    'dropping every interaction',
  );
});

test('H. an interaction that expects aria-expanded without the panel, or the two in contradiction, is rejected', () => {
  const shipped = load('accordion');
  const halfClaim = shipped.map((entry) =>
    entry.id === 'accordion/interaction-click-opens'
      ? { ...entry, interaction: { ...entry.interaction, expect: { activates: true, expanded: 'true' } } }
      : entry,
  );
  assert.ok(
    accordionCoverageViolations(halfClaim).some((violation) => violation.includes('two are separate evidence')),
  );

  const contradiction = shipped.map((entry) =>
    entry.id === 'accordion/interaction-click-opens'
      ? {
          ...entry,
          interaction: { ...entry.interaction, expect: { ...entry.interaction.expect, panelPresent: false } },
        }
      : entry,
  );
  assert.ok(
    accordionCoverageViolations(contradiction).some((violation) =>
      violation.includes('aria-expanded=true with no panel'),
    ),
  );
});

test('H. an interaction that converges on a case rendering the other state is rejected', () => {
  const eroded = load('accordion').map((entry) =>
    entry.id === 'accordion/interaction-click-opens'
      ? { ...entry, interaction: { ...entry.interaction, matches: 'accordion/default' } }
      : entry,
  );
  assert.ok(accordionCoverageViolations(eroded).some((violation) => violation.includes('renders the other state')));
});

// ---------------------------------------------------------- the vocabulary

test('a case that presses ArrowDown is rejected: the reference has no arrow behaviour', () => {
  const grown = [
    ...load('accordion'),
    {
      id: 'accordion/arrow',
      title: 'arrow',
      props: { title: 'Arrow' },
      attrs: {},
      content: { body: { text: 'Body' } },
      componentInteractive: 1,
      interaction: {
        steps: [{ action: 'focusButton' }, { action: 'pressKey', key: 'ArrowDown' }],
        expect: { activates: false },
      },
      visual: false,
    },
  ];
  assert.ok(accordionCoverageViolations(grown).some((violation) => violation.includes('presses [ArrowDown]')));
});

test('a case that names a prop, a slot or a step the reference does not have is rejected', () => {
  const base = load('accordion');
  const withProp = [...base, { ...base[0], id: 'accordion/multiple', props: { multiple: true } }];
  assert.ok(accordionCoverageViolations(withProp).some((violation) => violation.includes('declares prop [multiple]')));

  const withSlot = [...base, { ...base[0], id: 'accordion/header', content: { header: { text: 'H' } } }];
  assert.ok(accordionCoverageViolations(withSlot).some((violation) => violation.includes('declares slot [header]')));

  const withStep = [
    ...base,
    { ...base[0], id: 'accordion/drag', interaction: { steps: [{ action: 'drag' }], expect: {} } },
  ];
  assert.ok(accordionCoverageViolations(withStep).some((violation) => violation.includes('drives [drag]')));
});

// ------------------------------------------------------- I. substitutions

for (const [other, otherRules] of [
  ['panel', panelCoverageViolations],
  ['card', cardCoverageViolations],
]) {
  test(`I. replacing the accordion catalog with ${other}-derived cases of equal count fails coverage`, () => {
    const derived = load(other).map((entry) => ({
      ...entry,
      id: entry.id.replace(new RegExp(`^${other}/`), 'accordion/'),
      componentInteractive: 1,
    }));
    const padded = [...derived, ...padding(Math.max(0, FLOOR - derived.length))];
    const violations = accordionCoverageViolations(padded);

    assert.ok(violations.length > 0, `the ${other} catalog satisfied the accordion rules`);
    expectRules(violations, ['no shared accordion case', 'declares slot [header]'], `${other} substitution`);
  });

  test(`I. the accordion catalog cannot satisfy the ${other} rules either, so the two gates are not interchangeable`, () => {
    assert.ok(otherRules(load('accordion')).length > 0, `the accordion catalog satisfied the ${other} rules`);
  });
}
