// What the VfDropdown catalog has to prove, read as semantics.
//
// The first catalog of an overlay, and the first whose product DOM is partly
// outside its case. The gate holds three things at once:
//
//   - the vocabularies are closed. A prop the reference does not have, a
//     teleportTo (an element is Vue-only and a selector is the browser gate's),
//     a slot key no fixture renders, a step, key or expectation the harness
//     does not measure - each is refused rather than silently ignored;
//   - the ownership budgets are derived, not trusted. The component owns one
//     trigger wrapper per instance and nothing else. The consumer's controls
//     are what the case renders in the root plus, for every open instance, what
//     its menu holds; its explicit roles are the menu items of the open menus.
//     A case - initially, and after its scenario by the expandedStates it
//     claims - has to declare exactly those numbers, because the ownership
//     stage asserts against the declaration on every target;
//   - every quirk the historical component has, and every dimension the
//     milestone names, is exercised by a case that could only pass if the
//     quirk held: the dangling closed reference, the bidirectional open one,
//     the teleport, keyboard opening, ArrowUp not opening, the disabled item
//     that blocks the walk, Tab not closing, the inside click that closes, the
//     outside click that steals focus, Escape and its LIFO stack, two open
//     instances, the floating flip and scroll, the transitions.
//
// Violations are returned rather than asserted so a test can drive this with a
// deliberately eroded catalog and check which rule fired.

const PROPS = {
  open: (value) => typeof value === 'boolean',
  defaultOpen: (value) => typeof value === 'boolean',
  placement: (value) => value === 'bottom-start' || value === 'bottom-end',
  disableTeleport: (value) => typeof value === 'boolean',
  closeOnSelect: (value) => typeof value === 'boolean',
  variant: (value) => value === 'default' || value === 'pills',
  disabled: (value) => typeof value === 'boolean',
};
const CONTENT_KEYS = {
  trigger: ['text', 'control'],
  menu: ['items', 'menuItems', 'control', 'note'],
  after: ['control'],
};
const STEP_SELECTORS = ['.vf-dropdown__trigger', '.parity-trigger-control', '.parity-after-control'];
const KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Tab', 'Escape'];
const EXPECT_FIELDS = [
  'expandedStates',
  'focusRole',
  'focusInstance',
  'focusItem',
  'events',
  'menuStates',
  'menuRelationships',
  'settled',
  'transitions',
  'keydownPrevented',
];
const A11Y_CLAIMS = /^a11y:(trigger|triggerControl|menu|firstItem|disabledItem)\.(focusable|disabled|hasPopup)$/;

const content = (entry) => entry.content ?? {};
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [entry.props ?? {}]);
const isOpen = (member) => !member.disabled && (member.open ?? member.defaultOpen ?? false) === true;
const menuFocusables = (entry) => {
  const menu = content(entry).menu ?? {};
  return (menu.items?.length ?? 0) + (menu.menuItems?.length ?? 0) + (menu.control ? 1 : 0);
};
const menuRoles = (entry) => {
  const menu = content(entry).menu ?? {};
  return (menu.items?.length ?? 0) + (menu.menuItems?.length ?? 0);
};
const rootConsumers = (entry) =>
  (content(entry).trigger?.control ? members(entry).length : 0) + (content(entry).after?.control ? 1 : 0);
const steps = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const presses = (entry, key) => steps(entry).some((step) => step.action === 'pressKey' && step.key === key);
const clicksThrough = (entry, selector) =>
  steps(entry).some((step) => step.action === 'clickButton' && step.through && step.selector.includes(selector));
const endsClosed = (entry) => (expectOf(entry).expandedStates ?? []).every((state) => state === 'false');
const endsOpen = (entry) => (expectOf(entry).expandedStates ?? []).includes('true');
const menuItemsWithDisabledButton = (entry) =>
  (content(entry).menu?.menuItems ?? []).some((item) => item.disabled && !item.href);
const menuItemsWithDisabledLink = (entry) =>
  (content(entry).menu?.menuItems ?? []).some((item) => item.disabled && item.href);
const sameShape = (left, right) =>
  JSON.stringify([left.props ?? {}, left.attrs ?? {}, left.content ?? {}, left.group ?? null]) ===
  JSON.stringify([right.props ?? {}, right.attrs ?? {}, right.content ?? {}, right.group ?? null]);

/** Every way the VfDropdown catalog's coverage can be eroded. */
export function dropdownCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };
  const byId = new Map(cases.map((entry) => [entry.id, entry]));

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    if (!entry.id?.startsWith('dropdown/')) {
      violations.push(`${entry.id} is not a dropdown case, so it cannot count towards dropdown coverage`);
    }
    if (Array.isArray(entry.group) && Object.keys(entry.props ?? {}).length > 0) {
      violations.push(`${entry.id} is a group and declares case-level props, which a group ignores`);
    }
    for (const member of members(entry)) {
      for (const [name, value] of Object.entries(member)) {
        if (name === 'teleportTo') {
          violations.push(
            `${entry.id} declares teleportTo. An element target is Vue-only and a selector target is exercised by the ` +
              'Razor browser gate and the characterization suite; every catalog case teleports to <body> or renders in place',
          );
        } else if (!PROPS[name]) {
          violations.push(`${entry.id} declares prop [${name}], which the reference VfDropdown does not have`);
        } else if (!PROPS[name](value)) {
          violations.push(
            `${entry.id} gives prop [${name}] the value ${JSON.stringify(value)}, outside its public type`,
          );
        }
      }
    }
    for (const [slot, value] of Object.entries(content(entry))) {
      if (!CONTENT_KEYS[slot]) {
        violations.push(`${entry.id} puts [${slot}] in the content vocabulary, which no fixture renders`);
        continue;
      }
      for (const key of Object.keys(value ?? {})) {
        if (!CONTENT_KEYS[slot].includes(key)) {
          violations.push(`${entry.id} names [${slot}.${key}], which no fixture renders`);
        }
      }
    }
  }

  // ------------------------------------------------------------- ownership
  //
  // One trigger wrapper per instance, always. The consumer's controls and
  // roles follow from the content and from which instances are open - before
  // the scenario from the props, after it from the expandedStates it claims.
  for (const entry of cases) {
    if (entry.componentInteractive !== members(entry).length) {
      violations.push(
        `${entry.id} declares ${entry.componentInteractive} component-owned control(s) for ${members(entry).length} ` +
          'instance(s). The dropdown owns exactly one trigger wrapper per instance - the menu is a structural node and ' +
          "every item in it is the consumer's",
      );
    }
    const openInitially = members(entry).filter(isOpen).length;
    const initialConsumers = rootConsumers(entry) + openInitially * menuFocusables(entry);
    const initialRoles = openInitially * menuRoles(entry);
    if (entry.consumerInteractive !== initialConsumers || entry.consumerInteractiveRoles !== initialRoles) {
      violations.push(
        `${entry.id} declares ${entry.consumerInteractive} consumer control(s) and ${entry.consumerInteractiveRoles} ` +
          `consumer role(s) initially, but its content renders ${initialConsumers} and ${initialRoles}`,
      );
    }
    if (!entry.interaction) continue;

    if (openInitially > 0) {
      violations.push(`${entry.id} starts open. Every scenario starts closed, so its gesture is what opens anything`);
    }
    const expected = expectOf(entry).expandedStates;
    if (!Array.isArray(expected) || expected.length !== members(entry).length) {
      violations.push(`${entry.id} does not say which of its ${members(entry).length} instance(s) end open`);
      continue;
    }
    const openAfter = expected.filter((state) => state === 'true').length;
    const afterConsumers = rootConsumers(entry) + openAfter * menuFocusables(entry);
    const afterRoles = openAfter * menuRoles(entry);
    if (
      entry.interaction.consumerInteractive !== afterConsumers ||
      entry.interaction.consumerInteractiveRoles !== afterRoles
    ) {
      violations.push(
        `${entry.id} declares ${entry.interaction.consumerInteractive} consumer control(s) and ` +
          `${entry.interaction.consumerInteractiveRoles} role(s) after its scenario, but ending with ${openAfter} open ` +
          `menu(s) it renders ${afterConsumers} and ${afterRoles}`,
      );
    }
  }

  // ------------------------------------------------------------- scenarios
  for (const entry of cases.filter((candidate) => candidate.interaction)) {
    for (const step of steps(entry)) {
      const known =
        (['clickButton', 'focusButton'].includes(step.action) &&
          (step.through
            ? step.through.selector === '.vf-dropdown__trigger' && step.through.attribute === 'aria-controls'
            : STEP_SELECTORS.includes(step.selector))) ||
        (step.action === 'pressKey' && KEYS.includes(step.key)) ||
        (step.action === 'wait' && Number.isFinite(step.ms)) ||
        (step.action === 'scrollWindow' && Number.isFinite(step.y));
      if (!known) violations.push(`${entry.id} has a step the harness does not drive: ${JSON.stringify(step)}`);
    }
    for (const key of Object.keys(expectOf(entry))) {
      if (!EXPECT_FIELDS.includes(key) && !A11Y_CLAIMS.test(key)) {
        violations.push(`${entry.id} claims [${key}], which the dropdown snapshot and tree do not record`);
      }
    }
    const keyCount = steps(entry).filter((step) => step.action === 'pressKey').length;
    const prevented = expectOf(entry).keydownPrevented;
    if (prevented !== undefined && prevented.length !== keyCount) {
      violations.push(`${entry.id} claims ${prevented.length} keydown record(s) for ${keyCount} key press(es)`);
    }
    const matches = entry.interaction.matches;
    if (matches !== undefined) {
      const target = byId.get(matches);
      if (!target || target.interaction) {
        violations.push(`${entry.id} converges on ${matches}, which is not an initial case of the catalog`);
      } else if (!endsClosed(entry) || members(target).some(isOpen) || !sameShape(entry, target)) {
        violations.push(
          `${entry.id} converges on ${matches}, but only a closing gesture on the same content can: an open menu's ` +
            'inline position is in viewport coordinates and the isolated scenario sits elsewhere',
        );
      }
    }
  }

  // ------------------------------------------------------ initial states
  require('no shared case renders a closed dropdown, so the dangling aria-controls is never compared', (entry) =>
    !entry.interaction && members(entry).length === 1 && !members(entry).some(isOpen));
  require('no shared case renders a teleported open dropdown, so the menu outside the case is never followed', (
    entry,
  ) =>
    !entry.interaction &&
    members(entry).length === 1 &&
    isOpen(members(entry)[0]) &&
    !members(entry)[0].disableTeleport);
  require('no shared case renders an open dropdown in place, so the in-place destination is never compared', (entry) =>
    !entry.interaction && members(entry).some((member) => isOpen(member) && member.disableTeleport));
  require('no shared case renders two open dropdowns, so two relationship pairs in one case are never compared', (
    entry,
  ) => !entry.interaction && members(entry).filter(isOpen).length >= 2);
  require('no shared case renders one open dropdown beside a closed one, so a resolved and a dangling reference never meet', (
    entry,
  ) => !entry.interaction && members(entry).length >= 2 && members(entry).filter(isOpen).length === 1);
  require('no shared case renders the pills variant open', (entry) =>
    !entry.interaction && members(entry).some((member) => isOpen(member) && member.variant === 'pills'));
  require('no shared case renders bottom-end open, so the end placement is never positioned', (entry) =>
    !entry.interaction && members(entry).some((member) => isOpen(member) && member.placement === 'bottom-end'));
  require('no shared case renders a menu of VfMenuItems with a disabled button and a disabled link', (entry) =>
    !entry.interaction &&
    members(entry).some(isOpen) &&
    menuItemsWithDisabledButton(entry) &&
    menuItemsWithDisabledLink(entry));
  require('no shared case renders a disabled dropdown', (entry) =>
    !entry.interaction && members(entry).some((member) => member.disabled));
  require('no shared case renders a disabled dropdown given defaultOpen, so "disabled wins" is never compared', (
    entry,
  ) => !entry.interaction && members(entry).some((member) => member.disabled && member.defaultOpen));
  require('no shared case forwards consumer attrs to the root', (entry) =>
    !entry.interaction && ['id', 'class', 'data-testid', 'aria-label'].every((name) => name in (entry.attrs ?? {})));
  require('no shared case puts a consumer control inside the trigger', (entry) =>
    !entry.interaction && Boolean(content(entry).trigger?.control));
  require('no shared case renders an empty trigger slot', (entry) =>
    !entry.interaction && content(entry).trigger === undefined);
  require('no shared case is photographed open, so the menu is never compared as pixels', (entry) =>
    !entry.interaction && entry.visual === true && members(entry).some(isOpen));

  // ------------------------------------------------------------ keyboard
  for (const key of ['ArrowDown', 'Enter', ' ']) {
    require(`no scenario opens the dropdown with [${key}] on its trigger, prevented, focusing the first item`, (
      entry,
    ) =>
      steps(entry).length === 2 &&
      presses(entry, key) &&
      endsOpen(entry) &&
      expectOf(entry).focusRole === 'item' &&
      (expectOf(entry).keydownPrevented ?? [])[0] === `${key}:true`);
  }
  require('no scenario proves ArrowUp does not open a closed dropdown', (entry) =>
    presses(entry, 'ArrowUp') &&
    !presses(entry, 'ArrowDown') &&
    endsClosed(entry) &&
    (expectOf(entry).keydownPrevented ?? []).includes('ArrowUp:false'));
  require('no scenario proves Home and End do not open a closed dropdown', (entry) =>
    presses(entry, 'Home') && presses(entry, 'End') && !presses(entry, 'ArrowDown') && endsClosed(entry));
  require('no scenario walks past the last item back to the first', (entry) =>
    steps(entry).filter((step) => step.key === 'ArrowDown').length >= 4 &&
    menuRoles(entry) === 3 &&
    expectOf(entry).focusItem === content(entry).menu?.items?.[0]?.label);
  require('no scenario wraps ArrowUp from the first item to the last', (entry) =>
    presses(entry, 'ArrowUp') &&
    presses(entry, 'ArrowDown') &&
    !presses(entry, 'End') &&
    expectOf(entry).focusItem === content(entry).menu?.items?.at(-1)?.label);
  require('no scenario focuses the last item with End', (entry) =>
    presses(entry, 'End') &&
    !presses(entry, 'Home') &&
    !presses(entry, 'ArrowUp') &&
    expectOf(entry).focusItem === content(entry).menu?.items?.at(-1)?.label);
  require('no scenario returns to the first item with Home', (entry) =>
    presses(entry, 'Home') &&
    presses(entry, 'End') &&
    endsOpen(entry) &&
    expectOf(entry).focusItem === content(entry).menu?.items?.[0]?.label);
  require('no scenario proves a disabled button blocks the walk where it stands', (entry) =>
    menuItemsWithDisabledButton(entry) &&
    steps(entry).filter((step) => step.key === 'ArrowDown').length >= 2 &&
    !presses(entry, 'End') &&
    expectOf(entry).focusItem === content(entry).menu.menuItems[0].label);
  require('no scenario proves a disabled link is walked onto', (entry) =>
    menuItemsWithDisabledLink(entry) &&
    expectOf(entry).focusItem === content(entry).menu.menuItems.find((item) => item.disabled && item.href)?.label);
  require('no scenario proves a disabled first item leaves focus on the trigger and ArrowDown there notifies again', (
    entry,
  ) =>
    content(entry).menu?.menuItems?.[0]?.disabled === true &&
    expectOf(entry).focusRole === 'trigger' &&
    (expectOf(entry).events ?? []).filter((event) => event.open).length === 2);
  require('no scenario proves an opening key on an open dropdown notifies again', (entry) =>
    !content(entry).menu?.menuItems &&
    (expectOf(entry).events ?? []).filter((event) => event.open).length === 2 &&
    endsOpen(entry) &&
    expectOf(entry).focusRole === 'item');
  require('no scenario starts the walk from -1: ArrowUp from a control in the menu lands on the second to last item', (
    entry,
  ) =>
    Boolean(content(entry).menu?.control) &&
    steps(entry).some((step) => step.through && step.action === 'focusButton') &&
    presses(entry, 'ArrowUp') &&
    expectOf(entry).focusItem === content(entry).menu.items?.at(-2)?.label);
  require('no scenario proves Tab inside the menu does not close it', (entry) =>
    presses(entry, 'Tab') &&
    presses(entry, 'ArrowDown') &&
    endsOpen(entry) &&
    (expectOf(entry).keydownPrevented ?? []).includes('Tab:false'));
  require('no scenario proves Tab from the trigger enters the teleported menu and does not close it', (entry) =>
    presses(entry, 'Tab') && !presses(entry, 'ArrowDown') && endsOpen(entry) && expectOf(entry).focusRole === 'item');
  require('no scenario proves a disabled trigger ignores an opening key', (entry) =>
    members(entry).some((member) => member.disabled) &&
    presses(entry, 'ArrowDown') &&
    endsClosed(entry) &&
    (expectOf(entry).keydownPrevented ?? []).includes('ArrowDown:false'));
  require('no scenario opens the dropdown with Enter on a consumer control inside the trigger', (entry) =>
    Boolean(content(entry).trigger?.control) && presses(entry, 'Enter') && endsOpen(entry));

  // ------------------------------------------------------------- pointer
  require('no scenario opens the dropdown with a pointer and keeps focus on the trigger', (entry) =>
    steps(entry).length === 1 &&
    steps(entry)[0].action === 'clickButton' &&
    endsOpen(entry) &&
    expectOf(entry).focusRole === 'trigger' &&
    (expectOf(entry).menuStates ?? [])[0]?.location === 'body');
  require('no scenario closes the dropdown with a second pointer click and removes its menu', (entry) =>
    steps(entry).length === 2 &&
    steps(entry).every((step) => step.action === 'clickButton' && !step.through) &&
    endsClosed(entry) &&
    (expectOf(entry).menuRelationships ?? [])[0]?.controls === 'dangling');
  require('no scenario proves a click on an item closes the menu', (entry) =>
    clicksThrough(entry, 'menuitem') && endsClosed(entry));
  require('no scenario proves a click inside the menu on no item closes it', (entry) =>
    clicksThrough(entry, '.vf-dropdown__arrow') && endsClosed(entry));
  require('no scenario proves a click on a disabled item reaches nothing and leaves the menu open', (entry) =>
    clicksThrough(entry, '[disabled]') && endsOpen(entry) && expectOf(entry).focusRole === 'body');
  require('no scenario proves closeOnSelect=false keeps the menu open on an item click', (entry) =>
    members(entry).some((member) => member.closeOnSelect === false) &&
    clicksThrough(entry, 'menuitem') &&
    endsOpen(entry));
  require('no scenario proves an outside click closes the menu and moves focus to the trigger', (entry) =>
    members(entry).length === 1 &&
    steps(entry).some((step) => step.selector === '.parity-after-control') &&
    endsClosed(entry) &&
    expectOf(entry).focusRole === 'trigger');
  require('no scenario opens the dropdown by a click on a consumer control inside the trigger', (entry) =>
    steps(entry).some((step) => step.selector === '.parity-trigger-control' && step.action === 'clickButton') &&
    endsOpen(entry) &&
    expectOf(entry).focusRole === 'trigger-control');
  require('no scenario proves a disabled trigger opens nothing on a click', (entry) =>
    members(entry).some((member) => member.disabled) &&
    steps(entry).some((step) => step.action === 'clickButton') &&
    endsClosed(entry));

  // --------------------------------------------------- Escape and instances
  require('no scenario closes the dropdown with Escape, prevented, focusing the trigger', (entry) =>
    members(entry).length === 1 &&
    presses(entry, 'Escape') &&
    endsClosed(entry) &&
    (expectOf(entry).keydownPrevented ?? []).includes('Escape:true') &&
    expectOf(entry).focusRole === 'trigger');
  require('no scenario proves one Escape closes only the most recently opened of two', (entry) =>
    members(entry).length === 2 &&
    steps(entry).filter((step) => step.key === 'Escape').length === 1 &&
    JSON.stringify(expectOf(entry).expandedStates) === '["true","false"]');
  require('no scenario proves a second Escape closes the earlier one', (entry) =>
    members(entry).length === 2 &&
    steps(entry).filter((step) => step.key === 'Escape').length === 2 &&
    endsClosed(entry));
  require('no scenario leaves two keyboard-opened dropdowns open at once', (entry) =>
    members(entry).length === 2 &&
    !presses(entry, 'Escape') &&
    JSON.stringify(expectOf(entry).expandedStates) === '["true","true"]');
  require('no scenario proves a pointer open closes an open neighbour, which focuses its own trigger', (entry) =>
    members(entry).length === 2 &&
    steps(entry).filter((step) => step.action === 'clickButton').length === 2 &&
    JSON.stringify(expectOf(entry).expandedStates) === '["false","true"]' &&
    expectOf(entry).focusInstance === 0);
  require('no scenario proves an outside click closes two open dropdowns', (entry) =>
    members(entry).length === 2 &&
    steps(entry).some((step) => step.selector === '.parity-after-control') &&
    endsClosed(entry));

  // ------------------------------------------ floating, destination, time
  require('no scenario opens a dropdown in place', (entry) =>
    members(entry).some((member) => member.disableTeleport) &&
    (expectOf(entry).menuStates ?? [])[0]?.location === 'in-place');
  require('no scenario opens a bottom-end dropdown', (entry) =>
    members(entry).some((member) => member.placement === 'bottom-end') && endsOpen(entry));
  require('no scenario flips the menu above its trigger', (entry) =>
    (expectOf(entry).menuStates ?? []).some((state) => state?.classes?.includes('vf-dropdown__menu--top')));
  require('no scenario scrolls an open menu, so autoUpdate is never seen to follow its trigger', (entry) =>
    steps(entry).some((step) => step.action === 'scrollWindow') && endsOpen(entry));
  require('no scenario claims a completed enter of the normal duration', (entry) =>
    (expectOf(entry).transitions ?? []).some((list) => list.includes('enter:normal')));
  require('no scenario claims a completed leave of the normal duration, so the delayed removal is never measured', (
    entry,
  ) => (expectOf(entry).transitions ?? []).some((list) => list.includes('leave:normal')));
  require('no scenario reopens a dropdown, so a leave cut short by a new enter is never measured', (entry) =>
    (expectOf(entry).transitions ?? []).some((list) => list.includes('leave:short') && list.at(-1) === 'enter:normal'));
  require('no scenario opens the pills variant', (entry) =>
    members(entry).some((member) => member.variant === 'pills') && endsOpen(entry));
  require('no scenario claims a state of an item in the teleported menu, read through the tree where the menu is', (
    entry,
  ) => expectOf(entry)['a11y:disabledItem.disabled'] === 'true');
  require("no scenario claims the trigger's exposed popup type in the accessibility tree", (entry) =>
    expectOf(entry)['a11y:trigger.hasPopup'] === 'menu');

  return violations;
}
