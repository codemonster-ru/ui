// The VfAlert catalog cannot quietly shrink, and it cannot quietly buy the
// component a control it does not have.
//
// This is the M19 gate. The mandatory padding attacks, in the milestone's
// letters, are:
//
//   A/B. remove every "dismissible" or every "non-dismissible" case and pad
//        the count. Neither applies literally - the reference has no dismiss
//        control, so every case is non-dismissible and there is nothing to
//        remove on one side and everything on the other. What applies instead
//        is the refusal below: a catalog cannot *introduce* a dismissible case;
//   C.   remove the role/ARIA-distinguishing cases and pad;
//   D.   remove the consumer-interaction cases and pad;
//   E.   remove one tone and pad.
//
// All keep the count healthy. All have to fail semantically, naming the rules
// that stopped being proved.
//
// The substitution attack from M18 is repeated for the two components whose
// tone vocabulary the alert shares: a Badge- or Tag-derived catalog of equal
// count with the ids rewritten has to fail on the dimension rules, not only on
// the namespace check.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { alertCoverageViolations } from './alert-coverage.mjs';
import { badgeCoverageViolations, tagCoverageViolations } from './presentation-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 34;

/** Cases that satisfy nothing new: a composed success alert with no consumer attribute. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `alert/padding-${index}`,
    title: `padding ${index}`,
    props: { tone: 'success', title: 'Saved' },
    attrs: {},
    content: { body: { text: 'Body' } },
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
      `the alert guard did not notice that "${rule}" is no longer proved after ${attack}: ${violations.join('; ')}`,
    );
  }
}

test('the shipped alert catalog is fully covered', () => {
  assert.deepEqual(alertCoverageViolations(load('alert')), []);
});

test('the alert catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('alert').length >= FLOOR, 'the alert catalog shrank');
});

test('every alert case id is unique and namespaced', () => {
  const ids = load('alert').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('alert/')));
});

test('no shipped alert case declares a component-owned control, because the component has none', () => {
  // The catalog's whole ownership claim: every budget is a consumer budget,
  // and every budget agrees with a real consumer control in the fixture.
  for (const entry of load('alert')) {
    const rendered = ['title', 'body'].filter((name) => entry.content?.[name]?.control !== undefined).length;
    assert.equal(entry.consumerInteractive ?? 0, rendered, `${entry.id} declares a budget its fixture does not render`);
    assert.equal(entry.props?.dismissible, undefined, `${entry.id} names a prop the reference does not have`);
  }
});

// ------------------------------------------------------------------ attack A/B

test('a catalog that introduces a dismissible case is rejected, whatever its count', () => {
  // The literal A/B attacks cannot be run - there is no dismissible case to
  // remove - so the direction that can be run is asserted: a case that names
  // the prop a completed alert would have is a case for a component that does
  // not exist, and a budget declared under it is the cover a grown button
  // would need.
  const grown = [
    ...load('alert'),
    {
      id: 'alert/dismissible',
      title: 'dismissible',
      props: { dismissible: true, title: 'Saved' },
      attrs: {},
      content: { body: { text: 'Body' } },
      visual: false,
    },
  ];

  assert.ok(
    alertCoverageViolations(grown).some((violation) => violation.includes('dismissible prop')),
    'the alert guard accepted a case configured for a dismiss control the component does not have',
  );
});

test('overdeclaring a consumer budget without a fixture control is rejected', () => {
  // The other way to buy a control: keep the props honest and lie about the
  // count. A budget of one with nothing rendered is exactly the room a
  // component-grown dismiss button needs.
  const grown = load('alert').map((entry) =>
    entry.id === 'alert/title-and-content' ? { ...entry, consumerInteractive: 1 } : entry,
  );

  assert.ok(
    alertCoverageViolations(grown).some((violation) =>
      violation.includes('renders 0 consumer control(s) but declares consumerInteractive 1'),
    ),
    'the alert guard accepted a static budget nothing in the fixture renders',
  );
});

test('a control declared in the icon slot is rejected', () => {
  // aria-hidden, and gone entirely under hideIcon: a control there is one
  // assistive technology cannot reach and one hideIcon deletes, so a budget
  // for it would be a fiction on some cases and a lie on others.
  const grown = load('alert').map((entry) =>
    entry.id === 'alert/icon-slot'
      ? { ...entry, content: { ...entry.content, icon: { control: { text: 'x' } } }, consumerInteractive: 1 }
      : entry,
  );

  assert.ok(
    alertCoverageViolations(grown).some((violation) => violation.includes('control in the icon slot')),
    'the alert guard accepted a static budget for a control inside the decorative container',
  );
});

// -------------------------------------------------------------------- attack C

test('dropping the role/ARIA-distinguishing cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(
    load('alert'),
    (entry) =>
      entry.attrs?.role !== undefined ||
      entry.attrs?.['aria-live'] !== undefined ||
      entry.attrs?.['aria-label'] !== undefined,
    'forwards consumer ARIA',
  );
  const padded = [...eroded, ...padding(load('alert').length - eroded.length + 2)];

  assert.ok(padded.length > load('alert').length, 'padding did not keep the count up');
  expectRules(
    alertCoverageViolations(padded),
    ['forwards a consumer role', 'consumer live-region attributes', 'consumer accessible name'],
    'attack C',
  );
});

test('a catalog whose every case carries consumer ARIA never measures the component role, and fails', () => {
  // The inverse erosion: the component's own role can only be measured on a
  // case with no consumer ARIA, and a catalog that forwards a role everywhere
  // would compare consumer roles on every case and the component's on none.
  const smothered = load('alert').map((entry) => ({ ...entry, attrs: { ...entry.attrs, role: 'status' } }));

  expectRules(
    alertCoverageViolations(smothered),
    ["the section's own role is never measured", 'danger is still role=alert'],
    'smothering every case with a consumer role',
  );
});

// -------------------------------------------------------------------- attack D

test('dropping the consumer-interaction cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(
    load('alert'),
    (entry) => entry.content?.body?.control !== undefined || entry.content?.title?.control !== undefined,
    'puts a consumer control in a slot',
  );
  const padded = [...eroded, ...padding(load('alert').length - eroded.length + 2)];

  expectRules(
    alertCoverageViolations(padded),
    ['consumer control in the default slot', 'consumer control in the title slot', 'with the icon hidden'],
    'attack D',
  );
});

// -------------------------------------------------------------------- attack E

for (const tone of ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast']) {
  test(`dropping the ${tone} tone fails semantically while padding keeps the count up`, () => {
    const eroded = dropAll(load('alert'), (entry) => (entry.props?.tone ?? 'primary') === tone, `renders ${tone}`);
    const padded = [...eroded, ...padding(load('alert').length - eroded.length + 2)];

    expectRules(alertCoverageViolations(padded), [`renders the ${tone} tone`], `dropping ${tone}`);
  });
}

// ------------------------------------------------------- the ordinary erosions

test('dropping the title-state cases fails semantically even though composed alerts remain', () => {
  const eroded = dropAll(
    load('alert'),
    (entry) => entry.content?.title?.text === '' || entry.props?.title === '',
    'proves an empty title slot or an empty-string title',
  );
  const padded = [...eroded, ...padding(load('alert').length - eroded.length + 2)];

  expectRules(
    alertCoverageViolations(padded),
    ['title slot that renders nothing', 'empty-string title alone', 'empty paragraph is never rendered'],
    'dropping the title states',
  );
});

test('dropping the icon-state cases fails semantically', () => {
  const eroded = dropAll(
    load('alert'),
    (entry) => entry.props?.hideIcon === true || entry.content?.icon !== undefined || entry.props?.icon !== undefined,
    'exercises the icon',
  );
  const padded = [...eroded, ...padding(load('alert').length - eroded.length + 2)];

  expectRules(
    alertCoverageViolations(padded),
    ['explicit icon', 'icon slot with content', 'icon slot that renders nothing', 'hides the icon'],
    'dropping the icon states',
  );
});

test('an alert catalog that grew a slot the component does not have is rejected', () => {
  const grown = [
    ...load('alert'),
    { id: 'alert/actions', title: 'actions', props: {}, attrs: {}, content: { actions: { text: 'x' } }, visual: false },
  ];

  assert.ok(
    alertCoverageViolations(grown).some((violation) => violation.includes('[actions]')),
    'the alert guard accepted a slot VfAlert does not declare',
  );
});

// ------------------------------------------------------- the substitutions

for (const [other, otherRules] of [
  ['badge', badgeCoverageViolations],
  ['tag', tagCoverageViolations],
]) {
  test(`replacing the alert catalog with ${other}-derived cases of equal count fails coverage`, () => {
    // The substitution in its most plausible form: a reviewer, seeing three
    // components with the same eight tone names, reuses a span catalog and
    // renames the ids.
    const derived = load(other).map((entry) => ({
      ...entry,
      id: entry.id.replace(new RegExp(`^${other}/`), 'alert/'),
    }));
    const padded = [...derived, ...padding(Math.max(0, FLOOR - derived.length))];

    const violations = alertCoverageViolations(padded);
    assert.ok(violations.length > 0, `the ${other} catalog satisfied the alert rules`);
    // Not only the namespace check: the dimension rules have to be what fires.
    expectRules(violations, ['no shared alert case', 'consumer control in the default slot'], `${other} substitution`);
  });

  test(`the alert catalog cannot satisfy the ${other} rules either, so the two gates are not interchangeable`, () => {
    const violations = otherRules(load('alert'));

    assert.ok(violations.length > 0, `the alert catalog satisfied the ${other} rules`);
  });
}

for (const other of ['panel', 'card', 'avatar']) {
  test(`the ${other} catalog cannot satisfy the alert rules`, () => {
    const violations = alertCoverageViolations(load(other));

    assert.ok(violations.length > 0, `the ${other} catalog satisfied the alert rules`);
    assert.ok(
      violations.some((violation) => violation.includes('no shared alert case')),
      `only the namespace check fired, so the dimension rules would accept ${other} cases: ${violations.join('; ')}`,
    );
  });
}
