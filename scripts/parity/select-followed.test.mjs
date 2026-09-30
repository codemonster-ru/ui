// The VfSelect profile's one-hop edge, attacked (M32).
//
// The select's listbox is teleported to <body> and reached through the
// trigger's aria-controls - the dropdown's edge, under the select's own
// declaration. Run against the real extraction expression, the real
// comparator and the real select snapshot, on pages shaped like select cases:
//
//   S1. the profile declares exactly the trigger's aria-controls, one hop;
//   S2. with it, a correct teleported listbox compares equal and a wrong one
//       differs;
//   X1-X6. two selects cross-wired every way the plan names - swapped
//       aria-controls, both triggers naming one listbox, duplicate listbox
//       ids, correct ids with the option bodies swapped, the listboxes in the
//       wrong body order - each differs from the correctly wired page;
//   X7. an orphan listbox in <body> that no trigger names is invisible to the
//       followed-reference extraction by design - nothing names it - and is
//       caught by the snapshot's bodyListboxes census instead;
//   S3. a source the case does not render is refused outright.
//
// Two selects with identical labels at different places are identical DOM;
// the geometry that tells them apart is measured by the snapshot in a real
// browser and attacked by scripts/parity/select-mutations.mjs.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

import { compareDom } from './compare.mjs';
import { extractCasesExpression, interactionExpression } from './extract.mjs';
import { profiles } from './profiles.mjs';

const DECLARED = profiles.select.followedReferences;
const CASE = 'select/two';
const PLANS = ['Starter', 'Pro', 'Team'];

const trigger = (id, controls, label) =>
  `<div class="vf-select-wrap"><button id="${id}" type="button" class="vf-select vf-select--open" aria-controls="${controls}" aria-expanded="true" aria-haspopup="listbox">` +
  `<span class="vf-select__value">${label}</span></button></div>`;
const listbox = (id, labelledBy, labels, selected) =>
  `<div id="${id}" class="vf-dropdown__menu vf-select__menu" aria-labelledby="${labelledBy}" role="listbox">` +
  labels
    .map(
      (label) =>
        `<button type="button" class="vf-dropdown__item vf-select__option${label === selected ? ' vf-select__option--selected' : ''}" role="option" aria-selected="${label === selected}" tabindex="-1">${label}</button>`,
    )
    .join('') +
  `</div>`;

/**
 * Two open selects in one case and their two listboxes in <body>. `wiring`
 * says which listbox id each trigger names; `bodies` which listbox (by its
 * own id and content) comes first in <body>.
 */
function page({ prefix = 'v', wiring = [0, 1], order = [0, 1], ids = [0, 1], contents = [0, 1], extra = '' } = {}) {
  const triggerId = (index) => `vf-select-trigger-${prefix}-${index * 2}`;
  const listboxId = (index) => `vf-select-listbox-${prefix}-${index * 2 + 1}`;
  const selected = ['Pro', 'Team'];
  const bodies = order.map((index) =>
    listbox(listboxId(ids[index]), triggerId(index), PLANS, selected[contents[index]]),
  );
  return (
    `<div data-parity-case="${CASE}">` +
    trigger(triggerId(0), listboxId(wiring[0]), 'Pro') +
    trigger(triggerId(1), listboxId(wiring[1]), 'Team') +
    `</div>` +
    bodies.join('') +
    extra
  );
}

function window(body) {
  return new JSDOM(`<!doctype html><body>${body}</body>`, { runScripts: 'outside-only', pretendToBeVisual: true })
    .window;
}
const extract = (body, follow = DECLARED) => window(body).eval(extractCasesExpression({}, follow)).cases[CASE].dom;
const against = (body) => compareDom(extract(page()), extract(body));
const razorCorrect = page({ prefix: 'r' });

test("S1: the select profile follows exactly its trigger's aria-controls, one hop", () => {
  assert.deepEqual(DECLARED, [{ source: 'button.vf-select', attribute: 'aria-controls' }]);
});

test('S2: a correct teleported listbox compares equal across renderers, a wrong one differs', () => {
  assert.deepEqual(against(razorCorrect), []);
  const wrong = page({ prefix: 'r', contents: [0, 0] });
  assert.ok(against(wrong).length > 0);
});

test('X1: trigger A naming listbox B and B naming A differs', () => {
  const differences = against(page({ prefix: 'r', wiring: [1, 0] }));
  assert.ok(
    differences.some((entry) => entry.dimension === 'dom.relationships'),
    JSON.stringify(differences),
  );
});

test('X2: both triggers naming one listbox differs', () => {
  assert.ok(against(page({ prefix: 'r', wiring: [0, 0] })).length > 0);
});

test('X3: duplicate listbox ids differ', () => {
  assert.ok(against(page({ prefix: 'r', ids: [0, 0] })).length > 0);
});

test('X4: correct ids with the option bodies swapped differ', () => {
  const differences = against(page({ prefix: 'r', contents: [1, 0] }));
  assert.ok(
    differences.some((entry) => ['dom.aria', 'dom.canonicalClasses'].includes(entry.dimension)),
    JSON.stringify(differences),
  );
});

test('X5: the listboxes in the wrong body order differ', () => {
  assert.ok(against(page({ prefix: 'r', order: [1, 0] })).length > 0);
});

test('X6: a correct page and a cross-wired one are not isomorphic even when both are consistent', () => {
  // Every trigger names a listbox labelled by that trigger - consistently
  // wrong: the tokens are numbered by document position, not by reach order.
  const consistent = page({ prefix: 'r', wiring: [1, 0], order: [1, 0], contents: [1, 0] });
  assert.ok(against(consistent).length > 0);
});

test('X7: an orphan body listbox nothing names is invisible to the extraction and caught by the census', async () => {
  const orphan = page({ prefix: 'r', extra: listbox('vf-select-listbox-r-99', 'nobody', PLANS, 'Pro') });
  assert.deepEqual(against(orphan), [], 'the followed-reference extraction does not see an unnamed node');

  const census = async (body) => {
    const view = window(body);
    const snapshot = await view.eval(interactionExpression(CASE, 'select', profiles.select.controlOwnership));
    // Out of the page's realm, so deepEqual compares values, not prototypes.
    return JSON.parse(JSON.stringify(snapshot.bodyListboxes));
  };
  assert.deepEqual(await census(page()), ['listbox:0', 'listbox:1']);
  assert.deepEqual(await census(orphan), ['listbox:0', 'listbox:1', 'orphan']);
});

test('S3: a declared source the case does not render is refused', () => {
  assert.throws(
    () => extract(`<div data-parity-case="${CASE}"><p>nothing</p></div>`),
    /followed source button\.vf-select matched nothing/,
  );
});
