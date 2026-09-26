// The VfDropdown catalog cannot quietly shrink, cannot invent API the reference
// does not have, cannot buy or lose a control through its ownership
// declarations, and cannot keep passing after the case that proved a quirk is
// dropped or rewritten into one that proves something easier.
//
// The attacks, each of which has to fail on the rule it erodes:
//
//   A. the closed dangling reference;           B. the open teleported menu;
//   C. the in-place destination;                D. keyboard opening;
//   E. ArrowUp not opening;                     F. the disabled item that blocks;
//   G. Tab not closing;                         H. the inside click on no item;
//   I. the outside click;                       J. Escape;
//   K. the LIFO order;                          L. two open instances;
//   M. the floating flip and scroll;            N. the delayed removal;
//   O. ownership budgets bought or lost;        P. vocabulary invented;
//   Q. convergence claimed for an open state;   R. padding in place of a quirk.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { dropdownCoverageViolations } from './dropdown-coverage.mjs';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const load = () => JSON.parse(readFileSync(resolve(repositoryRoot, 'contracts/dropdown/cases.json'), 'utf8')).cases;
const FLOOR = 55;

const fired = (violations, fragment) => violations.some((violation) => violation.includes(fragment));
const without = (...ids) => load().filter((entry) => !ids.includes(entry.id));
const rewrite = (id, change) => load().map((entry) => (entry.id === id ? change(structuredClone(entry)) : entry));
const ids = (predicate) =>
  load()
    .filter(predicate)
    .map((entry) => entry.id);

/** Scenarios that satisfy nothing new: pointer opens of the default content. */
function padding(count) {
  const template = load().find((entry) => entry.id === 'dropdown/interaction-click-open');
  return Array.from({ length: count }, (unused, index) => ({
    ...structuredClone(template),
    id: `dropdown/padding-${index}`,
  }));
}

test('the shipped dropdown catalog satisfies every rule', () => {
  assert.deepEqual(dropdownCoverageViolations(load()), []);
});

test('the catalog carries enough cases to be worth gating', () => {
  assert.ok(load().length >= FLOOR, 'the dropdown catalog has shrunk below its floor');
});

test('A: without a closed single dropdown the dangling aria-controls is never compared', () => {
  // Closed as the component decides it: disabled wins over open and defaultOpen.
  const closedSingles = ids(
    (entry) =>
      !entry.interaction && !entry.group && (entry.props.disabled || !(entry.props.open ?? entry.props.defaultOpen)),
  );
  assert.ok(
    fired(dropdownCoverageViolations(without(...closedSingles)), 'the dangling aria-controls is never compared'),
  );
});

test('B: making every open case in-place loses the followed menu', () => {
  const cases = load().map((entry) =>
    !entry.interaction && (entry.props.defaultOpen || entry.props.open)
      ? { ...entry, props: { ...entry.props, disableTeleport: true } }
      : entry,
  );
  assert.ok(fired(dropdownCoverageViolations(cases), 'the menu outside the case is never followed'));
});

test('C: without an open in-place case the in-place destination is never compared', () => {
  assert.ok(
    fired(dropdownCoverageViolations(without('dropdown/open-in-place')), 'the in-place destination is never compared'),
  );
});

test('D: ArrowDown substituted by ArrowUp in the keyboard-open scenario is caught as a lost keyboard open', () => {
  const cases = rewrite('dropdown/interaction-arrowdown-open', (entry) => {
    entry.interaction.steps[1].key = 'ArrowUp';
    entry.interaction.expect.keydownPrevented = ['ArrowUp:true'];
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(cases), 'with [ArrowDown] on its trigger'));
});

test('E: the ArrowUp scenario dropped, or rewritten to Home, loses the non-opening ArrowUp', () => {
  assert.ok(fired(dropdownCoverageViolations(without('dropdown/interaction-arrowup-closed')), 'ArrowUp does not open'));
  const cases = rewrite('dropdown/interaction-arrowup-closed', (entry) => {
    entry.interaction.steps[1].key = 'Home';
    entry.interaction.expect.keydownPrevented = ['Home:false'];
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(cases), 'ArrowUp does not open'));
});

test('F: a disabled item that is not a button any more stops proving the blocked walk', () => {
  const cases = rewrite('dropdown/interaction-disabled-blocks', (entry) => {
    entry.content.menu.menuItems[1].disabled = false;
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(cases), 'a disabled button blocks the walk'));
});

test('G: Tab scenarios that end closed stop proving that Tab does not close', () => {
  const cases = load().map((entry) =>
    entry.interaction?.steps.some((step) => step.key === 'Tab')
      ? {
          ...entry,
          interaction: { ...entry.interaction, expect: { ...entry.interaction.expect, expandedStates: ['false'] } },
        }
      : entry,
  );
  const violations = dropdownCoverageViolations(cases);
  assert.ok(fired(violations, 'Tab inside the menu does not close it'));
  assert.ok(fired(violations, 'Tab from the trigger enters the teleported menu'));
});

test('H: the click on the arrow retargeted onto an item loses the inside click on no item', () => {
  const cases = rewrite('dropdown/interaction-click-arrow', (entry) => {
    entry.interaction.steps[1].selector = '[role="menuitem"]';
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(cases), 'a click inside the menu on no item closes it'));
});

test('I: the outside click dropped loses the stolen focus', () => {
  assert.ok(
    fired(
      dropdownCoverageViolations(without('dropdown/interaction-outside-click')),
      'an outside click closes the menu and moves focus',
    ),
  );
});

test('J: the Escape scenario dropped loses Escape', () => {
  assert.ok(
    fired(dropdownCoverageViolations(without('dropdown/interaction-escape')), 'closes the dropdown with Escape'),
  );
});

test('K: an Escape that closes the earlier dropdown is not the LIFO order', () => {
  const cases = rewrite('dropdown/interaction-escape-lifo', (entry) => {
    entry.interaction.expect.expandedStates = ['false', 'true'];
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(cases), 'one Escape closes only the most recently opened of two'));
});

test('L: without a case of two open dropdowns, two relationship pairs are never compared', () => {
  const violations = dropdownCoverageViolations(without('dropdown/open-two', 'dropdown/interaction-two-keyboard-open'));
  assert.ok(fired(violations, 'two relationship pairs in one case'));
  assert.ok(fired(violations, 'two keyboard-opened dropdowns open at once'));
});

test('M: the flip and the scroll dropped lose the floating evidence', () => {
  const violations = dropdownCoverageViolations(
    without('dropdown/interaction-flip-top', 'dropdown/interaction-scroll-follow'),
  );
  assert.ok(fired(violations, 'flips the menu above its trigger'));
  assert.ok(fired(violations, 'autoUpdate is never seen to follow'));
});

test('N: transitions that no longer claim a normal leave lose the delayed removal', () => {
  const cases = load().map((entry) =>
    entry.interaction?.expect.transitions
      ? {
          ...entry,
          interaction: {
            ...entry.interaction,
            expect: {
              ...entry.interaction.expect,
              transitions: entry.interaction.expect.transitions.map((list) =>
                list.filter((item) => item !== 'leave:normal'),
              ),
            },
          },
        }
      : entry,
  );
  assert.ok(fired(dropdownCoverageViolations(cases), 'the delayed removal is never measured'));
});

test('O: an ownership budget bought or lost is refused', () => {
  const bought = rewrite('dropdown/default', (entry) => ({ ...entry, componentInteractive: 2 }));
  assert.ok(fired(dropdownCoverageViolations(bought), 'one trigger wrapper per instance'));
  const lostRoles = rewrite('dropdown/open', (entry) => ({ ...entry, consumerInteractiveRoles: 0 }));
  assert.ok(fired(dropdownCoverageViolations(lostRoles), 'consumer role(s) initially'));
  const lostAfter = rewrite('dropdown/interaction-click-open', (entry) => {
    entry.interaction.consumerInteractive = 0;
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(lostAfter), 'after its scenario'));
});

test('P: invented API, steps and expectations are refused', () => {
  const teleport = rewrite('dropdown/default', (entry) => ({ ...entry, props: { teleportTo: '#x' } }));
  assert.ok(fired(dropdownCoverageViolations(teleport), 'declares teleportTo'));
  const prop = rewrite('dropdown/default', (entry) => ({ ...entry, props: { modal: true } }));
  assert.ok(fired(dropdownCoverageViolations(prop), 'declares prop [modal]'));
  const placement = rewrite('dropdown/bottom-end', (entry) => ({ ...entry, props: { placement: 'top-start' } }));
  assert.ok(fired(dropdownCoverageViolations(placement), 'outside its public type'));
  const key = rewrite('dropdown/interaction-escape', (entry) => {
    entry.interaction.steps[2].key = 'PageDown';
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(key), 'a step the harness does not drive'));
  const claim = rewrite('dropdown/interaction-click-open', (entry) => {
    entry.interaction.expect.activeDescendant = 'x';
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(claim), 'claims [activeDescendant]'));
  const slot = rewrite('dropdown/default', (entry) => ({
    ...entry,
    content: { ...entry.content, footer: { text: 'x' } },
  }));
  assert.ok(fired(dropdownCoverageViolations(slot), 'puts [footer] in the content vocabulary'));
});

test('Q: convergence claimed for an open end state is refused', () => {
  const cases = rewrite('dropdown/interaction-click-open', (entry) => {
    entry.interaction.matches = 'dropdown/default';
    return entry;
  });
  assert.ok(fired(dropdownCoverageViolations(cases), 'only a closing gesture on the same content can'));
});

test('R: padding in place of a dropped quirk satisfies nothing', () => {
  for (const [id, fragment] of [
    ['dropdown/interaction-arrowup-closed', 'ArrowUp does not open'],
    ['dropdown/interaction-click-arrow', 'a click inside the menu on no item closes it'],
    ['dropdown/interaction-escape-lifo', 'one Escape closes only the most recently opened of two'],
    ['dropdown/interaction-disabled-blocks', 'a disabled button blocks the walk'],
  ]) {
    assert.ok(fired(dropdownCoverageViolations([...without(id), ...padding(8)]), fragment), id);
  }
});
