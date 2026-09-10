// The VfPanel catalog cannot quietly shrink, and it cannot quietly become the
// VfCard catalog with the ids rewritten.
//
// This is the M18 gate. The mandatory attacks are:
//
//   B. remove every case that distinguishes a panel from a card, and pad the
//      count back up with cases that satisfy nothing new;
//   C. replace the catalog outright with Card-derived cases of equal count.
//
// Both keep the count healthy. Both have to fail semantically, naming the rules
// that stopped being proved - because the two components look alike enough that
// a reviewer reading only the count would see nothing wrong.
//
// Attacks A and D - a Card rendering substituted for the panel implementation,
// and a structural change that leaves the panel looking the same - are not
// catalog attacks and are proved elsewhere: A in the parity mutation set and in
// PanelComponentTest, D in the parity mutation set's dom.structure entries.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { panelCoverageViolations } from './panel-coverage.mjs';
import { cardCoverageViolations } from './card-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = (component) =>
  JSON.parse(readFileSync(resolve(repositoryRoot, `contracts/${component}/cases.json`), 'utf8')).cases;

const FLOOR = 24;

/** Cases that satisfy nothing new: a composed panel with no consumer attribute. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `panel/padding-${index}`,
    title: `padding ${index}`,
    props: { title: 'Workspace' },
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

test('the shipped panel catalog is fully covered', () => {
  assert.deepEqual(panelCoverageViolations(load('panel')), []);
});

test('the panel catalog keeps a count floor as secondary protection', () => {
  assert.ok(load('panel').length >= FLOOR, 'the panel catalog shrank');
});

test('every panel case id is unique and namespaced', () => {
  const ids = load('panel').map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => id.startsWith('panel/')));
});

// ------------------------------------------------------------------- attack B

test('dropping every case that distinguishes a panel from a card fails semantically while padding keeps the count up', () => {
  const eroded = dropAll(
    load('panel'),
    (entry) =>
      // The empty default slot, the ignored footer, the multi-node slot and the
      // subtle modifier: the four things a card gets wrong or does differently.
      (entry.content?.body?.text === '' && entry.content?.body?.control === undefined) ||
      entry.content?.footer !== undefined ||
      entry.content?.body?.markup !== undefined ||
      entry.props?.subtle === true,
    'distinguishes a panel from a card',
  );
  const padded = [...eroded, ...padding(12)];

  assert.ok(padded.length >= FLOOR, 'the padding attack must keep the count floor satisfied');
  const violations = panelCoverageViolations(padded);
  for (const expected of [
    'empty default slot',
    'footer slot',
    'several root-level nodes',
    'subtle modifier with content',
    'subtle modifier on an empty panel',
  ]) {
    assert.ok(
      violations.some((violation) => violation.includes(expected)),
      `the panel guard did not notice that "${expected}" is no longer proved: ${violations.join('; ')}`,
    );
  }
});

// ------------------------------------------------------------------- attack C

test('replacing the panel catalog with Card-derived cases of equal count fails coverage', () => {
  // The substitution in its most plausible form: a reviewer, seeing two
  // components that render nearly the same markup, reuses the card catalog and
  // renames the ids. The count is identical or better, every case is a valid
  // case of *something*, and nothing about it looks like a deletion.
  const derived = load('card')
    .slice(0, Math.max(load('panel').length, 0))
    .map((entry) => ({
      ...entry,
      id: entry.id.replace(/^card\//, 'panel/'),
    }));

  assert.ok(derived.length >= FLOOR - 1, 'the derivation attack needs a comparable count to be interesting');

  const violations = panelCoverageViolations(derived);
  assert.ok(violations.length > 0, 'the card catalog satisfied the panel rules');

  // Not just the namespace check, and not just the compact prop: the actual
  // dimension rules have to be the thing that fires, or the guard would accept
  // any card catalog whose ids were rewritten a little more carefully.
  for (const expected of ['no shared panel case', 'compact prop']) {
    assert.ok(
      violations.some((violation) => violation.includes(expected)),
      `the panel guard did not notice a Card-derived catalog: ${violations.join('; ')}`,
    );
  }
});

test('the panel catalog cannot satisfy the card rules either, so the two gates are not interchangeable', () => {
  // The other direction. If the panel catalog passed cardCoverageViolations,
  // one of the two gates would be measuring nothing that the other does not.
  const violations = cardCoverageViolations(load('panel'));

  assert.ok(violations.length > 0, 'the panel catalog satisfied the card rules');
  assert.ok(
    violations.some((violation) => violation.includes('no shared card case')),
    `only the namespace check fired: ${violations.join('; ')}`,
  );
});

// ------------------------------------------------------- the ordinary erosions

test('dropping the header-state cases fails semantically even though composed panels remain', () => {
  const eroded = dropAll(
    load('panel'),
    (entry) => entry.content?.header?.text === '' || entry.props?.title === '',
    'proves an empty header slot or an empty-string title',
  );

  const violations = panelCoverageViolations(eroded);
  for (const expected of ['header slot that renders nothing', 'empty-string title']) {
    assert.ok(
      violations.some((violation) => violation.includes(expected)),
      `the panel guard did not notice that "${expected}" is no longer proved: ${violations.join('; ')}`,
    );
  }
});

test('dropping the single-part cases fails semantically', () => {
  const eroded = dropAll(
    load('panel'),
    (entry) => {
      const parts = [
        Boolean(entry.props?.title) || entry.content?.header !== undefined,
        entry.content?.body !== undefined,
      ].filter(Boolean).length;

      return parts === 1;
    },
    'renders exactly one part',
  );

  const violations = panelCoverageViolations(eroded);
  assert.ok(
    violations.some((violation) => violation.includes('renders the default slot alone')),
    `the panel guard accepted a catalog with no single-part case: ${violations.join('; ')}`,
  );
});

test('dropping the interactive slot fixtures fails semantically', () => {
  const eroded = dropAll(
    load('panel'),
    (entry) => entry.content?.body?.control !== undefined || entry.content?.header?.control !== undefined,
    'puts a consumer control in a slot',
  );

  const violations = panelCoverageViolations(eroded);
  assert.ok(
    violations.some((violation) => violation.includes('consumer control in the default slot')),
    `the panel guard did not notice that slot ownership is no longer exercised: ${violations.join('; ')}`,
  );
});

test('a panel catalog that grew a slot the component does not have is rejected', () => {
  const grown = [
    ...load('panel'),
    { id: 'panel/aside', title: 'aside', props: {}, attrs: {}, content: { aside: { text: 'x' } }, visual: false },
  ];

  assert.ok(
    panelCoverageViolations(grown).some((violation) => violation.includes('[aside]')),
    'the panel guard accepted a slot VfPanel does not declare',
  );
});

test('a panel catalog that declares a control in the ignored footer slot is rejected', () => {
  // A control there would never reach the DOM, so the static budget it declares
  // would be a fiction - and a budget of one with nothing rendered is exactly
  // the cover a component-grown control would need.
  const grown = load('panel').map((entry) =>
    entry.id === 'panel/ignored-footer-slot'
      ? { ...entry, content: { ...entry.content, footer: { control: { text: 'Archive' } } }, consumerInteractive: 1 }
      : entry,
  );

  assert.ok(
    panelCoverageViolations(grown).some((violation) => violation.includes('a panel never renders')),
    'the panel guard accepted a static budget for a control that cannot appear',
  );
});

for (const other of ['skeleton', 'avatar', 'card']) {
  test(`the ${other} catalog cannot satisfy the panel rules`, () => {
    const violations = panelCoverageViolations(load(other));

    assert.ok(violations.length > 0, `the ${other} catalog satisfied the panel rules`);
    assert.ok(
      violations.some((violation) => violation.includes('no shared panel case')),
      `only the namespace check fired, so the dimension rules would accept ${other} cases: ${violations.join('; ')}`,
    );
  });
}
