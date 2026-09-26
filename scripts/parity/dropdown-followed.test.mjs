// Attack V of the M28 plan: the dropdown profile's followedReferences removed
// or misdeclared.
//
// M28.0 proved the extractor follows a declared edge; this proves the edge the
// dropdown profile declares is the one that makes its menus part of the
// comparison. Run against the real extraction expression and the real
// comparator, on a page shaped like a dropdown case - a trigger wrapper in the
// case, its menu teleported to <body>:
//
//   V1. the profile declares exactly the trigger's aria-controls;
//   V2. with that declaration, a wrong teleported menu differs;
//   V3. with the declaration removed, the M28.0 failure returns in both of
//       its halves: a correct Razor page differs from the reference on the
//       generated literal of #outside-case: (the false FAIL), and a Razor page
//       with a wrong menu differs by exactly the same record - the defect is
//       masked (the false PASS);
//   V4. misdeclared onto an attribute that names no menu, the defect is masked
//       the same way - which is why V1 pins the declaration rather than
//       trusting any declaration to be the right one;
//   V5. a source that does not exist in the case is refused outright.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

import { compareDom } from './compare.mjs';
import { extractCasesExpression } from './extract.mjs';
import { profiles } from './profiles.mjs';

const DECLARED = profiles.dropdown.followedReferences;

function page({
  role = 'menu',
  items = ['Edit', 'Duplicate'],
  triggerId = 'vf-dropdown-trigger-v-1',
  menuId = 'vf-dropdown-menu-v-0',
} = {}) {
  return (
    `<div data-parity-case="dropdown/open"><div class="vf-dropdown">` +
    `<div id="${triggerId}" class="vf-dropdown__trigger" aria-controls="${menuId}" aria-expanded="true" aria-haspopup="menu" tabindex="0"><span>Actions</span></div>` +
    `</div></div>` +
    `<div id="${menuId}" class="vf-dropdown__menu vf-dropdown__menu--default" aria-labelledby="${triggerId}" role="${role}">` +
    `<span class="vf-dropdown__arrow vf-dropdown__arrow--bottom" aria-hidden="true"></span>` +
    items.map((label) => `<button type="button" role="menuitem">${label}</button>`).join('') +
    `</div>`
  );
}

function extract(body, follow) {
  const { window } = new JSDOM(`<!doctype html><body>${body}</body>`, { runScripts: 'outside-only' });
  return window.eval(extractCasesExpression({}, follow)).cases['dropdown/open'].dom;
}

const reference = page();
const razorDefect = page({
  role: 'listbox',
  items: ['Edit'],
  triggerId: 'vf-dropdown-trigger-r-1',
  menuId: 'vf-dropdown-menu-r-0',
});
const razorCorrect = page({ triggerId: 'vf-dropdown-trigger-r-1', menuId: 'vf-dropdown-menu-r-0' });

test("V1: the dropdown profile follows exactly its trigger's aria-controls", () => {
  assert.deepEqual(DECLARED, [{ source: '.vf-dropdown__trigger', attribute: 'aria-controls' }]);
});

test('V2: with the declaration, a correct teleported menu compares equal and a wrong one differs', () => {
  assert.deepEqual(compareDom(extract(reference, DECLARED), extract(razorCorrect, DECLARED)), []);
  const differences = compareDom(extract(reference, DECLARED), extract(razorDefect, DECLARED));
  assert.ok(
    differences.some((entry) => entry.dimension === 'dom.aria'),
    JSON.stringify(differences),
  );
  assert.ok(
    differences.some((entry) => entry.dimension === 'dom.structure'),
    JSON.stringify(differences),
  );
});

/** The differences a declaration leaves between the reference and a Razor page. */
const against = (razor, follow) => compareDom(extract(reference, follow), extract(razor, follow));

test('V3: with the declaration removed, a correct menu fails on a literal and a wrong one is masked by it', () => {
  const correct = against(razorCorrect, []);
  assert.ok(correct.length > 0, 'a correct teleported menu compared equal without the declaration');
  assert.ok(
    correct.every((entry) => entry.dimension === 'dom.relationships'),
    JSON.stringify(correct),
  );
  assert.deepEqual(against(razorDefect, []), correct);
});

test("V4: misdeclared onto the trigger's aria-labelledby, the wrong menu is masked the same way", () => {
  const misdeclared = [{ source: '.vf-dropdown__trigger', attribute: 'aria-labelledby' }];
  assert.deepEqual(against(razorDefect, misdeclared), against(razorCorrect, misdeclared));
});

test('V5: a declared source the case does not render is refused', () => {
  assert.throws(
    () => extract(reference, [{ source: '.vf-dropdown__toggle', attribute: 'aria-controls' }]),
    /matched nothing/,
  );
});
