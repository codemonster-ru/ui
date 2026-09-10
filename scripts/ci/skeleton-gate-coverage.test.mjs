// The VfSkeletonGate catalog cannot quietly shrink, and padding cannot hide it.
//
// The mandatory attacks for this component are the four in section 11 of the
// M17 plan, and each is run below against a real eroded catalog rather than
// asserted in prose:
//
//   A. delete every loading case and pad the count back;
//   B. delete every ready case and pad the count back;
//   C. keep both states and delete the cases that distinguish the reserve
//      precedence's null check from a generic truthiness check;
//   D. delete one child-forwarding dimension and pad the count back.
//
// Padding is a fully composed ready gate: it satisfies the ready rule, the
// content rule and nothing else, so it is exactly what an author reaching for
// a healthy-looking count would add.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { skeletonGateCoverageViolations } from './skeleton-gate-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = () =>
  JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/skeleton-gate/cases.json'), 'utf8')).cases;

const FLOOR = 24;

function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `skeleton-gate/padding-${index}`,
    title: `padding ${index}`,
    props: { ready: true },
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

/** Runs an attack and asserts it is reported, not merely that something failed. */
function attack(cases, expected) {
  const violations = skeletonGateCoverageViolations(cases);
  assert.ok(
    violations.some((message) => message.includes(expected)),
    `expected a violation mentioning "${expected}", got:\n${violations.join('\n') || '(none)'}`,
  );

  return violations;
}

test('the shipped skeleton-gate catalog is fully covered', () => {
  assert.deepEqual(skeletonGateCoverageViolations(load()), []);
});

test('the skeleton-gate catalog keeps a count floor as secondary protection', () => {
  assert.ok(load().length >= FLOOR, 'the skeleton-gate catalog shrank');
});

test('every skeleton-gate case id is unique and namespaced', () => {
  const ids = load().map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length, 'duplicate case ids');
  assert.ok(ids.every((id) => id.startsWith('skeleton-gate/')));
});

test('attack A: removing every loading case and padding the count fails', () => {
  const eroded = dropAll(load(), (entry) => entry.props?.ready !== true, 'is loading');
  const padded = [...eroded, ...padding(20)];

  assert.ok(padded.length >= FLOOR, 'the padded catalog must clear the count floor');
  attack(padded, 'no shared skeleton-gate case is in the loading state');
});

test('attack B: removing every ready case and padding the count fails', () => {
  // Padded with loading cases, since ready ones are what the attack removed.
  const eroded = dropAll(load(), (entry) => entry.props?.ready === true, 'is ready');
  const padded = [
    ...eroded,
    ...padding(20).map((entry) => ({ ...entry, props: {}, id: `${entry.id}-loading` })),
  ];

  assert.ok(padded.length >= FLOOR, 'the padded catalog must clear the count floor');
  attack(padded, 'no shared skeleton-gate case is in the ready state');
});

test('attack C: keeping both states but removing the predicate edges fails', () => {
  // Both states survive, the count survives, and the only thing lost is what
  // tells the reserve precedence's null check apart from a truthiness check.
  const eroded = dropAll(
    load(),
    (entry) => entry.props?.reserveHeight === 0 || entry.props?.reserveHeight === '',
    'sits on a reserve edge',
  );
  const padded = [...eroded, ...padding(4)];

  assert.ok(padded.some((entry) => entry.props?.ready === true), 'the ready state must survive attack C');
  assert.ok(padded.some((entry) => entry.props?.ready !== true), 'the loading state must survive attack C');
  assert.ok(padded.length >= FLOOR, 'the padded catalog must clear the count floor');

  const violations = attack(padded, 'no shared skeleton-gate case passes a zero reserveHeight');
  assert.ok(violations.some((message) => message.includes('no shared skeleton-gate case passes an empty reserveHeight')));
});

test('attack D: removing one child-forwarding dimension and padding the count fails', () => {
  const eroded = dropAll(
    load(),
    (entry) => typeof entry.props?.radius === 'string' && entry.props.radius !== '',
    'forwards a radius',
  );
  const padded = [...eroded, ...padding(4)];

  assert.ok(padded.length >= FLOOR, 'the padded catalog must clear the count floor');
  attack(padded, 'no shared skeleton-gate case forwards a radius to the child skeleton');
});

test('removing the empty radius hides the chained child quirk', () => {
  const eroded = dropAll(load(), (entry) => entry.props?.radius === '', 'passes an empty radius');

  attack(eroded, 'no shared skeleton-gate case forwards an empty radius');
});

test('removing every case that leaves the radius unset hides a hardcoded child default', () => {
  const eroded = load().map((entry) =>
    entry.props?.radius === undefined ? { ...entry, props: { ...entry.props, radius: '4px' } } : entry,
  );

  attack(eroded, 'nothing proves the child supplies its own default');
});

test('removing the matched loading/ready pair fails even when both states remain', () => {
  // Both states survive; what is lost is the same gate rendered in both, which
  // is what tells a hidden half from a removed one.
  // Every ready case is nudged so that none of them is any loading case's twin
  // any more. The catalog still holds both states and still holds content in
  // both, which is what makes this the interesting attack: the count, the
  // states and the slots all survive, and only the comparison does not.
  const eroded = load().map((entry) =>
    entry.props?.ready === true ? { ...entry, props: { ...entry.props, minHeight: 999 } } : entry,
  );

  assert.ok(eroded.some((entry) => entry.props?.ready === true), 'the ready state must survive');
  assert.ok(eroded.some((entry) => entry.props?.ready !== true), 'the loading state must survive');
  attack(eroded, 'no two shared skeleton-gate cases differ only in `ready`');
});

test('removing every transition leaves the state measured only as rendered', () => {
  const eroded = load().map((entry) => {
    const copy = { ...entry };
    delete copy.transition;

    return copy;
  });

  attack(eroded, 'no shared skeleton-gate case declares a transition');
});

test('a transition naming a case that is not in the catalog fails', () => {
  const eroded = load().map((entry) =>
    entry.transition ? { ...entry, transition: { ...entry.transition, matches: 'skeleton-gate/nonexistent' } } : entry,
  );

  attack(eroded, 'that is not in the catalog');
});

test('a transition naming a case in the wrong state fails', () => {
  const eroded = load().map((entry) =>
    entry.id === 'skeleton-gate/loading-content'
      ? { ...entry, transition: { to: { ready: true }, matches: 'skeleton-gate/default' } }
      : entry,
  );

  attack(eroded, 'differ in more than `ready`');
});

test('a transition that does not change the state fails', () => {
  const eroded = load().map((entry) =>
    entry.id === 'skeleton-gate/loading-content'
      ? { ...entry, transition: { to: { ready: false }, matches: 'skeleton-gate/loading-content' } }
      : entry,
  );

  attack(eroded, 'declares a transition to the state it already renders in');
});

test('only one transition direction is not enough', () => {
  const eroded = load().map((entry) =>
    entry.transition?.to.ready === false ? { ...entry, transition: undefined } : entry,
  );

  attack(eroded, 'drives the ready-to-loading transition');
});

test('losing the interactive slot case in either state fails', () => {
  attack(
    dropAll(load(), (entry) => entry.content?.body?.control !== undefined && entry.props?.ready === true, 'is a ready interactive case'),
    'puts a consumer control in the content slot of a ready gate',
  );
  attack(
    dropAll(load(), (entry) => entry.content?.body?.control !== undefined && entry.props?.ready !== true, 'is a loading interactive case'),
    'puts a consumer control in the content slot of a loading gate',
  );
});

test('a case whose declared consumer budget does not match what it renders fails', () => {
  // The declaration is what the static snapshot is asserted against, so a case
  // that over-declares would let a component-grown control hide inside the
  // budget on every target at once.
  const eroded = load().map((entry) =>
    entry.id === 'skeleton-gate/default' ? { ...entry, consumerInteractive: 1 } : entry,
  );

  attack(eroded, 'declares consumerInteractive 1');
});

test('a case borrowed from another component cannot count towards this catalog', () => {
  const eroded = [...load(), { id: 'skeleton/default', title: 'borrowed', props: {}, attrs: {}, visual: false }];

  attack(eroded, 'is not a skeleton-gate case');
});

test('a slot the component does not have cannot count as coverage', () => {
  const eroded = load().map((entry) =>
    entry.id === 'skeleton-gate/default' ? { ...entry, content: { footer: { text: 'Footer' } } } : entry,
  );

  attack(eroded, 'and VfSkeletonGate has only default and skeleton');
});

test('losing a visual case is reported even when the semantic rule still passes', () => {
  const eroded = load().map((entry) =>
    entry.content?.body?.control !== undefined ? { ...entry, visual: false } : entry,
  );

  attack(eroded, 'no skeleton-gate screenshot renders consumer slot content that is interactive');
});
