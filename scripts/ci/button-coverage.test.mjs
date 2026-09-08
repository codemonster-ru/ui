// The VfButton catalog cannot quietly shrink, and padding cannot hide it.
//
// Same asymmetry as the other catalogs: adding cases is always fine, removing
// one has to be a deliberate edit here, where a reviewer sees the coverage
// claim it breaks. The attacks are the M10.1 ones re-run against the simplest
// component so far - which is exactly why they matter. A button looks trivial,
// so a catalog that quietly stopped proving anything about it would be the
// easiest of the four to believe.
//
// Every attack asserts the mutation landed and names the rule that should fire.
// None of them assert on case count: the floor is secondary protection, and a
// failure that is only about counting is not evidence the semantic rules work.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { buttonCoverageViolations, DOCUMENTED_SIZES, DOCUMENTED_VARIANTS } from './button-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/button/cases.json'), 'utf8'));
const loadCases = () => JSON.parse(JSON.stringify(catalog.cases));
const FLOOR = 34;

const byId = (cases, id) => cases.find((entry) => entry.id === id);

/** Removes a case, asserting it was actually there to remove. */
function drop(cases, id) {
  const remaining = cases.filter((entry) => entry.id !== id);
  assert.equal(remaining.length, cases.length - 1, `attack did not apply: ${id} was not in the catalog`);

  return remaining;
}

/** Cases that satisfy nothing: a default button with no state and no scenario. */
function padding(count) {
  return Array.from({ length: count }, (unused, index) => ({
    id: `button/padding-${index}`,
    title: `padding ${index}`,
    props: {},
    attrs: {},
    content: { label: 'Padding' },
  }));
}

test('the shipped catalog is fully covered', () => {
  assert.deepEqual(buttonCoverageViolations(loadCases()), []);
});

test('the catalog keeps a case count floor as secondary protection', () => {
  assert.ok(catalog.cases.length >= FLOOR, `the button catalog fell to ${catalog.cases.length} cases`);
});

test('every case id is unique and namespaced to the component', () => {
  const ids = catalog.cases.map((entry) => entry.id);

  assert.equal(new Set(ids).size, ids.length, 'the button catalog has duplicate case ids');
  assert.deepEqual(
    ids.filter((id) => !id.startsWith('button/')),
    [],
    'the button catalog has case ids outside its namespace',
  );
});

test('the catalog exercises every documented variant and size', () => {
  const cases = loadCases();

  for (const variant of DOCUMENTED_VARIANTS) {
    assert.ok(
      cases.some((entry) => (entry.props?.variant ?? 'primary') === variant),
      `the catalog stopped rendering the ${variant} variant`,
    );
  }
  for (const size of DOCUMENTED_SIZES) {
    assert.ok(
      cases.some((entry) => entry.props?.size === size),
      `the catalog stopped rendering the ${size} size`,
    );
  }
});

test('deleting the enabled Enter case is caught, and padding cannot hide it', () => {
  const eroded = [...drop(loadCases(), 'button/interaction-enter'), ...padding(4)];

  // The exact shape of the M10.1 silent pass: the count floor is satisfied, so
  // if the semantic rules do not fire, nothing does.
  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  assert.ok(
    buttonCoverageViolations(eroded).includes('no shared case proves that Enter activates an enabled button'),
    'padding hid the removal of the enabled Enter case',
  );
});

test('deleting the loading cases is caught, and padding cannot hide it', () => {
  // The second dimension, and the one a button regression hides behind: a
  // loading button that stopped disabling itself renders identically.
  let eroded = loadCases();
  for (const id of eroded.filter((entry) => entry.props?.loading === true).map((entry) => entry.id)) {
    eroded = drop(eroded, id);
  }
  eroded = [...eroded, ...padding(8)];

  assert.ok(eroded.length >= FLOOR, 'the attack no longer clears the count floor, so it proves nothing');
  const violations = buttonCoverageViolations(eroded);
  assert.ok(violations.includes('no shared case renders a loading button'));
  assert.ok(violations.includes('no shared case proves that a loading button refuses keyboard activation'));
});

test('a disabled Enter case cannot stand in for the enabled one', () => {
  const cases = loadCases();
  const replacement = structuredClone(byId(cases, 'button/interaction-disabled-keyboard'));
  replacement.id = 'button/interaction-enter-disabled-substitute';
  const eroded = [...drop(cases, 'button/interaction-enter'), replacement];

  assert.equal(replacement.attrs.disabled, true);
  assert.ok(eroded.length >= FLOOR - 1);
  assert.ok(
    buttonCoverageViolations(eroded).includes('no shared case proves that Enter activates an enabled button'),
    'a disabled Enter case satisfied the enabled Enter requirement',
  );
});

test('a loading case cannot claim it activates', () => {
  const eroded = loadCases();
  byId(eroded, 'button/interaction-loading-keyboard').interaction.expect.activates = true;

  assert.ok(
    buttonCoverageViolations(eroded).includes(
      'button/interaction-loading-keyboard is not operable but claims it activates',
    ),
    'a loading case was allowed to claim it activates',
  );
});

test('a scenario that drops its declared outcome stops counting as coverage', () => {
  const eroded = loadCases();
  delete byId(eroded, 'button/interaction-space').interaction.expect;

  const violations = buttonCoverageViolations(eroded);
  assert.ok(
    violations.includes('button/interaction-space drives the component but declares no expected activation outcome'),
  );
  assert.ok(violations.includes('no shared case proves that Space activates an enabled button'));
});

test('a padding case cannot buy coverage by claiming an outcome it never drives', () => {
  const liar = { ...padding(1)[0], interaction: { steps: [], expect: { activates: true } } };
  const eroded = [...drop(loadCases(), 'button/interaction-pointer-click'), liar];

  const violations = buttonCoverageViolations(eroded);
  assert.ok(violations.includes(`${liar.id} claims it activates but drives no activating input`));
  assert.ok(violations.includes('no shared case proves that a real pointer click activates an enabled button'));
});

test('deleting the icon-only or consumer-attribute cases is caught', () => {
  for (const [id, message] of [
    ['button/icon-only', 'no shared case renders an icon-only button named by aria-label'],
    ['button/consumer-class', 'no shared case forwards a consumer class'],
    ['button/native-attributes', 'no shared case forwards a native attribute'],
    ['button/block', 'no shared case renders a block button'],
    ['button/type-submit', 'no shared case overrides the rendered type'],
  ]) {
    let eroded = loadCases();
    if (id === 'button/block') {
      for (const carrier of eroded.filter((entry) => entry.props?.block === true).map((entry) => entry.id)) {
        eroded = drop(eroded, carrier);
      }
    } else {
      eroded = drop(eroded, id);
    }

    assert.ok(buttonCoverageViolations(eroded).includes(message), `${id} can be deleted silently`);
  }
});

test('deleting the disabled keyboard negatives is caught', () => {
  assert.ok(
    buttonCoverageViolations(drop(loadCases(), 'button/interaction-disabled-keyboard')).includes(
      'no shared case proves that a disabled button refuses keyboard activation',
    ),
  );
  assert.ok(
    buttonCoverageViolations(drop(loadCases(), 'button/interaction-disabled-space')).includes(
      'no shared case proves that a disabled button refuses Space',
    ),
  );
});
