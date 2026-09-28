// The popover profile's followedReferences, and where one hop ends (M30).
//
// The M28.0 edge used as it is: the popover declares its trigger's
// aria-controls, the one reference that reaches the panel it teleports to
// <body>. Run against the real extraction expression and the real comparator
// on pages shaped like popover cases:
//
//   W1. the profile declares exactly the trigger's aria-controls;
//   W2. with it, a correct panel compares equal and a wrong one differs -
//       the wrong role, a panel labelled by nothing, a cross-wired pair;
//   W3. without it, the M28.0 failure returns: a correct panel differs on the
//       generated literal and a wrong one is masked by the same record;
//   W4. a dropdown inside the panel needs no second hop while its menu is
//       closed (its aria-controls dangles inside the followed panel) or in
//       place (its menu is inside the panel): both compare through tokens;
//   W5. the boundary, pinned rather than hidden: an open nested dropdown whose
//       menu is teleported to <body> is a second hop. Its reference compares
//       as a literal, so a correct page differs - which is why no catalog
//       scenario ends in that state, and its presence and ownership are read
//       by the snapshot's nestedMenus and bodyOverlays instead.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';

import { compareDom } from './compare.mjs';
import { extractCasesExpression } from './extract.mjs';
import { profiles } from './profiles.mjs';

const DECLARED = profiles.popover.followedReferences;
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function nestedDropdown(suffix, { open = false, inPlace = false } = {}) {
  const trigger = `<div id="vf-dropdown-trigger-${suffix}1" class="vf-dropdown__trigger" aria-controls="vf-dropdown-menu-${suffix}0" aria-expanded="${open}" aria-haspopup="menu" tabindex="0"><span>Inner</span></div>`;
  const menu = `<div id="vf-dropdown-menu-${suffix}0" class="vf-dropdown__menu vf-dropdown__menu--default" aria-labelledby="vf-dropdown-trigger-${suffix}1" role="menu"><button type="button" role="menuitem">Edit</button></div>`;
  return {
    root: `<div class="vf-dropdown">${trigger}${open && inPlace ? menu : ''}</div>`,
    body: open && !inPlace ? menu : '',
  };
}

/** One popover case: trigger in the case, panel in <body>, optionally a dropdown in the panel. */
function page({ suffix = 'v-', role = 'dialog', labelledBy, swap = false, dropdown } = {}) {
  const triggers = [0, 1].map((index) => `vf-popover-trigger-${suffix}${index * 2 + 1}`);
  const panels = [0, 1].map((index) => `vf-popover-content-${suffix}${index * 2}`);
  const controls = swap ? [panels[1], panels[0]] : panels;
  const inner = dropdown ? nestedDropdown(`n${suffix}`, dropdown) : { root: '', body: '' };
  return (
    `<div data-parity-case="popover/open-two">` +
    [0, 1]
      .map(
        (index) =>
          `<div class="vf-popover"><div id="${triggers[index]}" class="vf-popover__trigger" aria-controls="${controls[index]}" aria-expanded="true" aria-haspopup="dialog" tabindex="0"><span>Details ${index}</span></div></div>`,
      )
      .join('') +
    `</div>` +
    [0, 1]
      .map(
        (index) =>
          `<section id="${panels[index]}" class="vf-popover__content" aria-labelledby="${labelledBy ?? triggers[index]}" role="${role}" tabindex="-1">` +
          `<span class="vf-popover__arrow vf-popover__arrow--bottom" aria-hidden="true"></span><p>Body ${index}</p>${index === 0 ? inner.root : ''}</section>`,
      )
      .join('') +
    inner.body
  );
}

function extract(body, follow) {
  const { window } = new JSDOM(`<!doctype html><body>${body}</body>`, { runScripts: 'outside-only' });
  return window.eval(extractCasesExpression({}, follow)).cases['popover/open-two'].dom;
}

const against = (reference, razor, follow = DECLARED) => compareDom(extract(reference, follow), extract(razor, follow));

test("W1: the popover profile follows exactly its trigger's aria-controls", () => {
  assert.deepEqual(DECLARED, [{ source: '.vf-popover__trigger', attribute: 'aria-controls' }]);
});

test('W2: with the declaration a correct panel compares equal, and a wrong role, label or pairing differs', () => {
  assert.deepEqual(against(page(), page({ suffix: 'r-' })), []);
  assert.ok(against(page(), page({ suffix: 'r-', role: 'menu' })).some((entry) => entry.dimension === 'dom.aria'));
  assert.ok(
    against(page(), page({ suffix: 'r-', labelledBy: 'vf-nowhere' })).some(
      (entry) => entry.dimension === 'dom.relationships',
    ),
  );
  // Cross-wired with identical-looking panels: document-order numbering keeps
  // the swapped pair from being isomorphic to the correct one.
  assert.ok(
    against(page(), page({ suffix: 'r-', swap: true })).some((entry) => entry.dimension === 'dom.relationships'),
  );
});

test('W3: without the declaration a correct panel fails on a literal and a wrong one is masked by it', () => {
  const correct = against(page(), page({ suffix: 'r-' }), []);
  assert.ok(correct.length > 0, 'a correct teleported panel compared equal without the declaration');
  assert.deepEqual(against(page(), page({ suffix: 'r-', role: 'menu' }), []), correct);
});

test('W4: a closed or in-place nested dropdown needs no second hop', () => {
  for (const dropdown of [{ open: false }, { open: true, inPlace: true }]) {
    assert.deepEqual(against(page({ dropdown }), page({ suffix: 'r-', dropdown })), [], JSON.stringify(dropdown));
    // and a wrong nested menu role inside the panel still differs
  }
  const wrong = page({ suffix: 'r-', dropdown: { open: true, inPlace: true } }).replace(
    'role="menu"',
    'role="listbox"',
  );
  assert.ok(against(page({ dropdown: { open: true, inPlace: true } }), wrong).length > 0);
});

test('W5: an open nested menu teleported to <body> is a second hop - compared as a literal - and no scenario ends there', () => {
  const differences = against(page({ dropdown: { open: true } }), page({ suffix: 'r-', dropdown: { open: true } }));
  assert.ok(differences.length > 0 && differences.every((entry) => entry.dimension === 'dom.relationships'));

  const cases = JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/popover/cases.json'), 'utf8')).cases;
  const endsWithTeleportedNestedMenu = cases.filter((entry) =>
    (entry.interaction?.expect?.nestedMenus ?? []).some((menu) => menu.place === 'panel' && menu.menu === 'body'),
  );
  assert.deepEqual(
    endsWithTeleportedNestedMenu.map((entry) => entry.id),
    [],
    'a scenario ending with a teleported open nested menu would need a second hop the extractor does not take',
  );
});
