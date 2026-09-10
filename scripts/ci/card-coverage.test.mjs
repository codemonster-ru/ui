// The VfCard catalog cannot quietly shrink, and padding cannot hide it.
//
// The mandatory attack for this component is removing the cases that prove the
// optional wrappers - the empty body, the empty footer, the header slot that
// renders nothing - and padding with fully composed cards. A composed card
// exercises every wrapper at once and proves nothing about when each appears,
// so the count stays healthy while the component's actual rules go unmeasured.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { cardCoverageViolations } from './card-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 25;

/** Cases that satisfy nothing new: a fully composed card with no consumer attribute. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `card/padding-${index}`,
    title: `padding ${index}`,
    props: { title: 'Workspace' },
    attrs: {},
    content: { body: { text: 'Body' }, footer: { text: 'Footer' } },
    visual: false,
  }));
}

function dropAll(cases, predicate, what) {
  const remaining = cases.filter((entry) => !predicate(entry));
  assert.ok(remaining.length < cases.length, `attack did not apply: no case ${what}`);

  return remaining;
}

test('the shipped card catalog is fully covered', () => {
  assert.deepEqual(cardCoverageViolations(load('card')), []);
});

test('the card catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('card').length >= FLOOR, 'the card catalog shrank');
});

test('every card case id is unique and namespaced', () => {
  const ids = load('card').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('card/')));
});

// The mandatory padding attack: remove every case proving optional wrapper and
// slot behaviour, pad with composed cards.
test('dropping the optional-wrapper cases fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(
    load('card'),
    (entry) =>
      entry.content?.body?.text === '' ||
      entry.content?.footer?.text === '' ||
      entry.content?.header?.text === '' ||
      entry.props?.title === '',
    'proves an optional wrapper or an empty slot',
  );
  const padded = [...eroded, ...padding(10)];

  assert.ok(padded.length >= FLOOR, 'the padding attack must keep the count floor satisfied');
  const violations = cardCoverageViolations(padded);
  for (const expected of [
    'empty body slot',
    'empty footer slot',
    'header slot that renders nothing',
    'empty-string title',
  ]) {
    assert.ok(
      violations.some((violation) => violation.includes(expected)),
      `the card guard did not notice that "${expected}" is no longer proved: ${violations.join('; ')}`,
    );
  }
});

test('dropping the single-region cases fails semantically even though composed cards remain', () => {
  // A composed card renders every region at once. Keeping only composed cards
  // would pass a component that had lost the ability to render a region alone.
  const eroded = dropAll(
    load('card'),
    (entry) => {
      const regions = [
        Boolean(entry.props?.title) || entry.content?.header !== undefined,
        entry.content?.body !== undefined,
        entry.content?.footer !== undefined,
      ].filter(Boolean).length;

      return regions === 1;
    },
    'renders exactly one region',
  );

  const violations = cardCoverageViolations(eroded);
  assert.ok(
    violations.some((violation) => violation.includes('renders the footer alone')),
    `the card guard accepted a catalog with no single-region case: ${violations.join('; ')}`,
  );
});

test('dropping the interactive slot fixtures fails semantically', () => {
  // Without these the static snapshot never has to tell consumer interaction
  // from component interaction, which is the question M16 exists to answer.
  const eroded = dropAll(
    load('card'),
    (entry) => entry.content?.body?.control !== undefined || entry.content?.footer?.control !== undefined,
    'puts a consumer control in a slot',
  );

  const violations = cardCoverageViolations(eroded);
  assert.ok(
    violations.some((violation) => violation.includes('consumer control in the body slot')),
    `the card guard did not notice that slot ownership is no longer exercised: ${violations.join('; ')}`,
  );
});

test('a card catalog that grew a slot the component does not have is rejected', () => {
  const grown = [
    ...load('card'),
    { id: 'card/aside', title: 'aside', props: {}, attrs: {}, content: { aside: { text: 'x' } }, visual: false },
  ];

  assert.ok(
    cardCoverageViolations(grown).some((violation) => violation.includes('[aside]')),
    'the card guard accepted a slot VfCard does not declare',
  );
});

for (const other of ['skeleton', 'avatar']) {
  test(`the ${other} catalog cannot satisfy the card rules`, () => {
    const violations = cardCoverageViolations(load(other));

    assert.ok(violations.length > 0, `the ${other} catalog satisfied the card rules`);
    assert.ok(
      violations.some((violation) => violation.includes('no shared card case')),
      `only the namespace check fired, so the dimension rules would accept ${other} cases: ${violations.join('; ')}`,
    );
  });
}
