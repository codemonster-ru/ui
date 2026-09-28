// What the VfPopover catalog has to prove, read as semantics.
//
// The second overlay catalog, and the first whose cases hold another overlay.
// The gate holds three things at once, as the dropdown's does:
//
//   - the vocabularies are closed. A prop the reference does not have, a
//     teleportTo other than false (an element is Vue-only and a selector is
//     the browser gate's), a slot key no fixture renders, a step, key or
//     expectation the harness does not measure - each is refused;
//   - the ownership budgets are derived, not trusted. The component owns one
//     trigger wrapper per instance and one panel per open instance - the panel
//     takes focus. The consumer's controls are what the case renders in the
//     root plus what every open panel holds, plus the items of every open
//     dropdown menu, which are also its explicit roles. A scenario declares the
//     counts it ends with, derived from the expandedStates and nestedMenus it
//     claims; a scenario that opens or closes a panel declares its owned count;
//   - every place the popover differs from the dropdown, and every
//     cross-component claim the milestone makes, is exercised by a case that
//     could only pass if it held: focus into the panel on a pointer open, the
//     autofocus order both ways, the unfocusable autofocus target, the toggle
//     on Enter and Space, the re-open on ArrowDown, the inside click that does
//     nothing, both dismissal switches, one escape stack with the dropdown in
//     both orders, the closeOnEscape=false shield, and the unmount of an open
//     nested dropdown by a close that gives it no outside click.
//
// Violations are returned rather than asserted so a test can drive this with a
// deliberately eroded catalog and check which rule fired.

const PROPS = {
  open: (value) => typeof value === 'boolean',
  defaultOpen: (value) => typeof value === 'boolean',
  placement: (value) => value === 'bottom-start' || value === 'bottom-end',
  teleportTo: (value) => value === false,
  disableTeleport: (value) => typeof value === 'boolean',
  closeOnOutsideClick: (value) => typeof value === 'boolean',
  closeOnEscape: (value) => typeof value === 'boolean',
};
const CONTENT_KEYS = {
  trigger: ['text', 'control'],
  panel: ['note', 'controls', 'dropdown'],
  beside: ['dropdown'],
  after: ['control'],
};
const STEP_SELECTORS = [
  '.vf-popover__trigger',
  '.vf-dropdown__trigger',
  '.parity-trigger-control',
  '.parity-after-control',
];
const THROUGH_SELECTORS = ['.parity-panel-control', '.parity-panel-note', '.vf-dropdown__trigger'];
const KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' ', 'Tab', 'Escape'];
const EXPECT_FIELDS = [
  'expandedStates',
  'focusRole',
  'focusInstance',
  'focusItem',
  'events',
  'panelStates',
  'panelRelationships',
  'nestedMenus',
  'bodyOverlays',
  'settled',
  'transitions',
  'keydownPrevented',
];
const A11Y_CLAIMS = /^a11y:(trigger|triggerControl|panel|panelControl)\.(focusable|hasPopup)$/;

const content = (entry) => entry.content ?? {};
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [entry.props ?? {}]);
const isOpen = (member) => (member.open ?? member.defaultOpen ?? false) === true;
const panelFocusables = (entry) =>
  (content(entry).panel?.controls ?? []).filter((control) => (control.tag ?? 'button') === 'button').length +
  (content(entry).panel?.dropdown ? 1 : 0);
const rootConsumers = (entry) =>
  (content(entry).trigger?.control ? members(entry).length : 0) +
  (content(entry).after?.control ? 1 : 0) +
  (content(entry).beside?.dropdown ? 1 : 0);
const steps = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const presses = (entry, key) => steps(entry).filter((step) => step.action === 'pressKey' && step.key === key).length;
const endsClosed = (entry) => (expectOf(entry).expandedStates ?? []).every((state) => state === 'false');
const endsOpen = (entry) => (expectOf(entry).expandedStates ?? []).includes('true');
const events = (entry) => expectOf(entry).events ?? [];
const prevented = (entry) => expectOf(entry).keydownPrevented ?? [];
const nested = (entry) => Boolean(content(entry).panel?.dropdown);
const beside = (entry) => Boolean(content(entry).beside?.dropdown);
const autofocus = (entry) => (content(entry).panel?.controls ?? []).map((control) => control.autofocus ?? null);
const sameShape = (left, right) =>
  JSON.stringify([left.props ?? {}, left.attrs ?? {}, left.content ?? {}, left.group ?? null]) ===
  JSON.stringify([right.props ?? {}, right.attrs ?? {}, right.content ?? {}, right.group ?? null]);

/** Every way the VfPopover catalog's coverage can be eroded. */
export function popoverCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };
  const byId = new Map(cases.map((entry) => [entry.id, entry]));

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    if (!entry.id?.startsWith('popover/')) {
      violations.push(`${entry.id} is not a popover case, so it cannot count towards popover coverage`);
    }
    if (Array.isArray(entry.group) && Object.keys(entry.props ?? {}).length > 0) {
      violations.push(`${entry.id} is a group and declares case-level props, which a group ignores`);
    }
    for (const member of members(entry)) {
      for (const [name, value] of Object.entries(member)) {
        if (!PROPS[name]) {
          violations.push(`${entry.id} declares prop [${name}], which the reference VfPopover does not have`);
        } else if (!PROPS[name](value)) {
          violations.push(
            `${entry.id} gives prop [${name}] the value ${JSON.stringify(value)}, outside what the catalog can render ` +
              "(teleportTo: an element is Vue-only and a selector is the Razor browser gate's)",
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
        if (!CONTENT_KEYS[slot].includes(key))
          violations.push(`${entry.id} names [${slot}.${key}], which no fixture renders`);
      }
    }
  }

  // ------------------------------------------------------------- ownership
  for (const entry of cases) {
    const openInitially = members(entry).filter(isOpen).length;
    if (entry.componentInteractive !== members(entry).length + openInitially) {
      violations.push(
        `${entry.id} declares ${entry.componentInteractive} component-owned control(s) for ${members(entry).length} ` +
          `instance(s) with ${openInitially} open. The popover owns one trigger wrapper per instance and one panel ` +
          'per open instance',
      );
    }
    const initialConsumers = rootConsumers(entry) + openInitially * panelFocusables(entry);
    if (entry.consumerInteractive !== initialConsumers || entry.consumerInteractiveRoles !== 0) {
      violations.push(
        `${entry.id} declares ${entry.consumerInteractive} consumer control(s) and ${entry.consumerInteractiveRoles} ` +
          `role(s) initially, but its content renders ${initialConsumers} and 0 - no dropdown is open initially`,
      );
    }
    if (!entry.interaction) continue;

    if (openInitially > 0 && !members(entry).some((member) => member.open === true)) {
      violations.push(`${entry.id} starts open without a controlled open; every uncontrolled scenario starts closed`);
    }
    const expected = expectOf(entry).expandedStates;
    if (!Array.isArray(expected) || expected.length !== members(entry).length) {
      violations.push(`${entry.id} does not say which of its ${members(entry).length} instance(s) end open`);
      continue;
    }
    const openAfter = expected.filter((state) => state === 'true').length;
    const componentAfter = members(entry).length + openAfter;
    const declaredComponent = entry.interaction.componentInteractive ?? entry.componentInteractive;
    if (declaredComponent !== componentAfter) {
      violations.push(
        `${entry.id} ends with ${openAfter} open panel(s), so ${componentAfter} owned control(s), but declares ` +
          `${declaredComponent}`,
      );
    }
    if (entry.interaction.componentInteractive === entry.componentInteractive) {
      violations.push(
        `${entry.id} declares a scenario owned count equal to its case's; an unneeded override hides nothing`,
      );
    }
    // Open dropdown menus after the scenario: a beside dropdown's is known
    // from nestedMenus; a nested one's only if the claim says so.
    const openMenus = (expectOf(entry).nestedMenus ?? []).filter((menu) => menu.expanded === 'true').length;
    const afterConsumers = rootConsumers(entry) + openAfter * panelFocusables(entry) + openMenus * 2;
    if (
      entry.interaction.consumerInteractive !== afterConsumers ||
      entry.interaction.consumerInteractiveRoles !== openMenus * 2
    ) {
      violations.push(
        `${entry.id} declares ${entry.interaction.consumerInteractive} consumer control(s) and ` +
          `${entry.interaction.consumerInteractiveRoles} role(s) after its scenario, but ending with ${openAfter} open ` +
          `panel(s) and ${openMenus} open menu(s) it renders ${afterConsumers} and ${openMenus * 2}`,
      );
    }
    if ((nested(entry) || beside(entry)) && !Array.isArray(expectOf(entry).nestedMenus) && openMenus === 0) {
      if (steps(entry).some((step) => step.selector === '.vf-dropdown__trigger')) {
        violations.push(`${entry.id} drives a dropdown but does not claim where its menus end`);
      }
    }
  }

  // ------------------------------------------------------------- scenarios
  for (const entry of cases.filter((candidate) => candidate.interaction)) {
    for (const step of steps(entry)) {
      const known =
        (['clickButton', 'focusButton'].includes(step.action) &&
          (step.through
            ? step.through.selector === '.vf-popover__trigger' &&
              step.through.attribute === 'aria-controls' &&
              THROUGH_SELECTORS.includes(step.selector)
            : STEP_SELECTORS.includes(step.selector))) ||
        (step.action === 'pressKey' && KEYS.includes(step.key)) ||
        (step.action === 'wait' && Number.isFinite(step.ms)) ||
        (step.action === 'scrollWindow' && Number.isFinite(step.y));
      if (!known) violations.push(`${entry.id} has a step the harness does not drive: ${JSON.stringify(step)}`);
    }
    for (const key of Object.keys(expectOf(entry))) {
      if (!EXPECT_FIELDS.includes(key) && !A11Y_CLAIMS.test(key)) {
        violations.push(`${entry.id} claims [${key}], which the popover snapshot and tree do not record`);
      }
    }
    const keyCount = steps(entry).filter((step) => step.action === 'pressKey').length;
    if (expectOf(entry).keydownPrevented !== undefined && prevented(entry).length !== keyCount) {
      violations.push(`${entry.id} claims ${prevented(entry).length} keydown record(s) for ${keyCount} key press(es)`);
    }
    const matches = entry.interaction.matches;
    if (matches !== undefined) {
      const target = byId.get(matches);
      if (!target || target.interaction) {
        violations.push(`${entry.id} converges on ${matches}, which is not an initial case of the catalog`);
      } else if (
        !endsClosed(entry) ||
        members(target).some(isOpen) ||
        !sameShape({ ...entry, props: {}, group: null }, { ...target, props: {}, group: null })
      ) {
        violations.push(
          `${entry.id} converges on ${matches}, but only a closing gesture on the same content can: an open panel's ` +
            'inline position is in viewport coordinates and the isolated scenario sits elsewhere',
        );
      }
    }
  }

  // ------------------------------------------------------ initial states
  require('no shared case renders a closed popover, so the dangling aria-controls is never compared', (entry) =>
    !entry.interaction && members(entry).length === 1 && !members(entry).some(isOpen) && !beside(entry));
  require('no shared case renders a teleported open popover, so the panel outside the case is never followed', (
    entry,
  ) =>
    !entry.interaction &&
    members(entry).length === 1 &&
    isOpen(members(entry)[0]) &&
    !members(entry)[0].disableTeleport &&
    members(entry)[0].teleportTo === undefined);
  require('no shared case renders an open popover in place with disableTeleport', (entry) =>
    !entry.interaction && members(entry).some((member) => isOpen(member) && member.disableTeleport));
  require('no shared case renders an open popover in place with teleportTo=false', (entry) =>
    !entry.interaction && members(entry).some((member) => isOpen(member) && member.teleportTo === false));
  require('no shared case renders two open popovers, so two relationship pairs in one case are never compared', (
    entry,
  ) => !entry.interaction && members(entry).filter(isOpen).length >= 2);
  require('no shared case renders one controlled open popover beside a closed one', (entry) =>
    !entry.interaction && members(entry).length >= 2 && members(entry).some((member) => member.open === true));
  require('no shared case renders bottom-end open, so the end placement is never positioned', (entry) =>
    !entry.interaction && members(entry).some((member) => isOpen(member) && member.placement === 'bottom-end'));
  require('no shared case renders an open panel with an empty slot', (entry) =>
    !entry.interaction && members(entry).some(isOpen) && Object.keys(content(entry).panel ?? {}).length === 0);
  require('no shared case renders an open panel holding a closed dropdown', (entry) =>
    !entry.interaction && members(entry).some(isOpen) && nested(entry));
  require('no shared case forwards consumer attrs to the root', (entry) =>
    !entry.interaction && ['id', 'class', 'data-testid', 'aria-label'].every((name) => name in (entry.attrs ?? {})));
  require('no shared case puts a consumer control inside the trigger', (entry) =>
    !entry.interaction && Boolean(content(entry).trigger?.control));
  require('no shared case renders an empty trigger slot', (entry) =>
    !entry.interaction && content(entry).trigger === undefined);
  require('no shared case is photographed open, so the panel is never compared as pixels', (entry) =>
    !entry.interaction && entry.visual === true && members(entry).some(isOpen));

  // ------------------------------------------------------------ keyboard
  for (const key of ['ArrowDown', 'Enter', ' ']) {
    require(`no scenario opens the popover with [${key}] on its trigger, prevented, focusing the panel`, (entry) =>
      steps(entry).length === 2 &&
      presses(entry, key) === 1 &&
      endsOpen(entry) &&
      expectOf(entry).focusRole === 'panel' &&
      prevented(entry)[0] === `${key}:true`);
  }
  for (const key of ['Enter', ' ']) {
    require(`no scenario proves [${key}] on an open popover's trigger toggles it closed`, (entry) =>
      presses(entry, key) === 2 &&
      endsClosed(entry) &&
      events(entry)
        .map((event) => event.open)
        .join() === 'true,false' &&
      prevented(entry).every((record) => record === `${key}:true`));
  }
  require('no scenario proves ArrowDown on an open popover notifies again instead of closing', (entry) =>
    members(entry).length === 1 &&
    presses(entry, 'ArrowDown') === 2 &&
    !nested(entry) &&
    !beside(entry) &&
    endsOpen(entry) &&
    events(entry)
      .map((event) => event.open)
      .join() === 'true,true');
  require('no scenario proves ArrowUp, Home and End do nothing on a closed trigger', (entry) =>
    ['ArrowUp', 'Home', 'End'].every((key) => prevented(entry).includes(`${key}:false`)) && endsClosed(entry));
  require('no scenario proves ArrowUp, Home and End do nothing on an open trigger', (entry) =>
    ['ArrowUp', 'Home', 'End'].every((key) => prevented(entry).includes(`${key}:false`)) && endsOpen(entry));
  require('no scenario proves Tab from the trigger does not close the popover', (entry) =>
    prevented(entry).includes('Tab:false') && endsOpen(entry));
  require("no scenario proves a key on a control inside the panel is not the trigger's", (entry) =>
    steps(entry).some(
      (step) => step.through && step.selector === '.parity-panel-control' && step.action === 'focusButton',
    ) &&
    endsOpen(entry) &&
    prevented(entry).every((record) => record.endsWith(':false')));
  require('no scenario toggles the popover with Enter on a consumer control inside the trigger', (entry) =>
    Boolean(content(entry).trigger?.control) && presses(entry, 'Enter') === 1 && endsOpen(entry));

  // ------------------------------------------------------------- pointer
  require('no scenario proves a pointer open focuses the panel itself - the dropdown keeps the trigger', (entry) =>
    steps(entry).length === 1 &&
    steps(entry)[0].action === 'clickButton' &&
    steps(entry)[0].selector === '.vf-popover__trigger' &&
    endsOpen(entry) &&
    expectOf(entry).focusRole === 'panel');
  require('no scenario closes the popover with a second pointer click, focusing the trigger', (entry) =>
    steps(entry).filter((step) => step.action === 'clickButton' && step.selector === '.vf-popover__trigger').length ===
      2 &&
    members(entry).length === 1 &&
    endsClosed(entry) &&
    expectOf(entry).focusRole === 'trigger');
  require('no scenario proves a click on a control inside the panel does not close it', (entry) =>
    steps(entry).some(
      (step) => step.through && step.selector === '.parity-panel-control' && step.action === 'clickButton',
    ) &&
    endsOpen(entry) &&
    events(entry).length === 1);
  require('no scenario proves a click on plain panel content does not close it', (entry) =>
    steps(entry).some((step) => step.through && step.selector === '.parity-panel-note') && endsOpen(entry));
  require('no scenario proves an outside click closes the popover and focuses the trigger', (entry) =>
    members(entry).every((member) => member.closeOnOutsideClick !== false) &&
    steps(entry).some((step) => step.selector === '.parity-after-control') &&
    endsClosed(entry) &&
    expectOf(entry).focusRole === 'trigger');
  require('no scenario proves closeOnOutsideClick=false keeps it open and leaves focus where the click put it', (
    entry,
  ) =>
    members(entry).some((member) => member.closeOnOutsideClick === false) &&
    steps(entry).some((step) => step.selector === '.parity-after-control') &&
    endsOpen(entry) &&
    expectOf(entry).focusRole === 'other-inside-case');
  require('no scenario opens the popover by a click on a consumer control inside the trigger', (entry) =>
    steps(entry).some((step) => step.selector === '.parity-trigger-control' && step.action === 'clickButton') &&
    endsOpen(entry));

  // ----------------------------------------------------------- focus
  const openedWith = (entry, forms, focusRole, focusItem) =>
    JSON.stringify(autofocus(entry)) === JSON.stringify(forms) &&
    endsOpen(entry) &&
    expectOf(entry).focusRole === focusRole &&
    (focusItem === undefined || expectOf(entry).focusItem === focusItem);
  require('no scenario proves an [autofocus] target wins over an earlier plain button', (entry) =>
    openedWith(entry, [null, 'attribute'], 'panel-control', 'Chosen'));
  require('no scenario proves a [data-autofocus] target wins over an earlier plain button', (entry) =>
    openedWith(entry, [null, 'data'], 'panel-control', 'Chosen'));
  require('no scenario proves [data-autofocus] before [autofocus] wins by document order', (entry) =>
    openedWith(entry, ['data', 'attribute'], 'panel-control', 'Data'));
  require('no scenario proves [autofocus] before [data-autofocus] wins by document order', (entry) =>
    openedWith(entry, ['attribute', 'data'], 'panel-control', 'Attribute'));
  require('no scenario proves an unfocusable autofocus target stops the focus move', (entry) =>
    (content(entry).panel?.controls ?? []).some((control) => control.tag === 'span' && control.autofocus) &&
    endsOpen(entry) &&
    expectOf(entry).focusRole === 'trigger');
  require('no scenario proves the panel itself takes focus when nothing in it can', (entry) =>
    content(entry).panel?.note !== undefined &&
    !content(entry).panel?.controls &&
    !nested(entry) &&
    endsOpen(entry) &&
    expectOf(entry).focusRole === 'panel');

  // --------------------------------------------------- Escape and instances
  require('no scenario closes the popover with Escape, prevented, focusing the trigger', (entry) =>
    members(entry).length === 1 &&
    !nested(entry) &&
    !beside(entry) &&
    presses(entry, 'Escape') === 1 &&
    endsClosed(entry) &&
    prevented(entry).includes('Escape:true'));
  require('no scenario proves closeOnEscape=false takes Escape unprevented and stays open', (entry) =>
    members(entry).some((member) => member.closeOnEscape === false) &&
    !beside(entry) &&
    endsOpen(entry) &&
    prevented(entry).includes('Escape:false'));
  require('no scenario proves one Escape closes only the most recently opened of two popovers', (entry) =>
    members(entry).length === 2 &&
    presses(entry, 'Escape') === 1 &&
    JSON.stringify(expectOf(entry).expandedStates) === '["true","false"]');
  require('no scenario leaves two keyboard-opened popovers open at once', (entry) =>
    members(entry).length === 2 &&
    !presses(entry, 'Escape') &&
    JSON.stringify(expectOf(entry).expandedStates) === '["true","true"]');
  require('no scenario proves a pointer open closes an open neighbour as an outside click', (entry) =>
    members(entry).length === 2 && JSON.stringify(expectOf(entry).expandedStates) === '["false","true"]');

  // ------------------------------------------- one stack with the dropdown
  const dropdownEvent = (entry, open) =>
    events(entry).some((event) => event.component === 'dropdown' && event.open === open);
  require('no scenario proves a dropdown opened inside the popover takes the first Escape', (entry) =>
    nested(entry) &&
    events(entry).filter((event) => event.component === 'popover' && event.open).length === 1 &&
    presses(entry, 'Escape') === 1 &&
    endsOpen(entry) &&
    dropdownEvent(entry, false) &&
    expectOf(entry).nestedMenus?.[0]?.expanded === 'false');
  require('no scenario proves the second Escape then closes the popover', (entry) =>
    nested(entry) && presses(entry, 'Escape') === 2 && endsClosed(entry) && dropdownEvent(entry, false));
  require('no scenario opens a sibling dropdown first and a popover second, and Escape closes the popover', (entry) =>
    beside(entry) &&
    members(entry).every((member) => member.closeOnEscape !== false) &&
    events(entry)[0]?.component === 'dropdown' &&
    endsClosed(entry) &&
    expectOf(entry).nestedMenus?.[0]?.expanded === 'true');
  require('no scenario opens a popover first and a sibling dropdown second, and Escape closes the dropdown', (entry) =>
    beside(entry) &&
    members(entry).every((member) => member.closeOnEscape !== false) &&
    events(entry)[0]?.component === 'popover' &&
    endsOpen(entry) &&
    expectOf(entry).nestedMenus?.[0]?.expanded === 'false');
  require('no scenario proves a closeOnEscape=false popover on top shields the dropdown below', (entry) =>
    beside(entry) &&
    members(entry).some((member) => member.closeOnEscape === false) &&
    events(entry)[0]?.component === 'dropdown' &&
    prevented(entry).at(-1) === 'Escape:false' &&
    endsOpen(entry) &&
    expectOf(entry).nestedMenus?.[0]?.expanded === 'true');
  require('no scenario proves a closeOnEscape=false popover below an open dropdown does not stop the dropdown closing', (
    entry,
  ) =>
    beside(entry) &&
    members(entry).some((member) => member.closeOnEscape === false) &&
    events(entry)[0]?.component === 'popover' &&
    prevented(entry).at(-1) === 'Escape:true' &&
    expectOf(entry).nestedMenus?.[0]?.expanded === 'false');

  // ------------------------------------------------------ nested teardown
  const noOverlays = (entry) => JSON.stringify(expectOf(entry).bodyOverlays) === '[]';
  require('no scenario closes the popover with Enter over an open nested dropdown and claims no overlay left in <body>', (
    entry,
  ) =>
    nested(entry) &&
    presses(entry, 'Enter') === 1 &&
    !presses(entry, 'Escape') &&
    endsClosed(entry) &&
    !dropdownEvent(entry, false) &&
    noOverlays(entry));
  // The Escape after a teardown must land on an entry the case owns: every
  // case the scenario isolation removed is still mounted in Vue, and one that
  // a click could not close stays on the page-wide stack below it.
  require('no scenario presses Escape after that teardown and proves it reaches the popover below, not the unmounted dropdown', (
    entry,
  ) =>
    nested(entry) &&
    members(entry).length === 2 &&
    presses(entry, 'Enter') === 1 &&
    prevented(entry).at(-1) === 'Escape:true' &&
    endsClosed(entry) &&
    !dropdownEvent(entry, false) &&
    JSON.stringify(events(entry).at(-1)) === JSON.stringify({ component: 'popover', instance: 0, open: false }) &&
    noOverlays(entry));
  require('no scenario proves an item activated in the nested menu closes the popover too', (entry) =>
    nested(entry) &&
    prevented(entry).at(-1) === 'Enter:false' &&
    endsClosed(entry) &&
    dropdownEvent(entry, false) &&
    noOverlays(entry));
  require('no scenario reopens the popover after a teardown and drives a fresh nested dropdown', (entry) => {
    const list = events(entry);
    const reopened = list.findLastIndex((event) => event.component === 'popover' && event.open);
    return (
      nested(entry) &&
      endsOpen(entry) &&
      list.filter((event) => event.component === 'popover' && event.open).length === 2 &&
      list.slice(reopened + 1).some((event) => event.component === 'dropdown' && event.open)
    );
  });

  // ------------------------------------------ floating, destination, time
  require('no scenario opens a popover in place', (entry) =>
    members(entry).some((member) => member.disableTeleport) && endsOpen(entry));
  require('no scenario opens a bottom-end popover', (entry) =>
    members(entry).some((member) => member.placement === 'bottom-end') && endsOpen(entry));
  require('no scenario flips the panel above its trigger', (entry) =>
    /margin-top/.test(entry.attrs?.style ?? '') && endsOpen(entry));
  require('no scenario scrolls an open panel, so autoUpdate is never seen to follow its trigger', (entry) =>
    steps(entry).some((step) => step.action === 'scrollWindow') && endsOpen(entry));
  require('no scenario drives the controlled mode through v-model both ways', (entry) =>
    members(entry).some((member) => member.open === false) && endsOpen(entry));
  require('no scenario closes a controlled popover through v-model', (entry) =>
    members(entry).some((member) => member.open === true) && endsClosed(entry));

  return violations;
}

/** The policy's declarations the catalog relies on. */
export function popoverPolicyViolations(policy) {
  const violations = [];
  const divergence = (policy.platformDivergences ?? []).find((entry) => entry.id === 'razor-has-no-controlled-mode');

  if (!divergence) {
    violations.push(
      'the policy no longer declares the Razor controlled-mode divergence, so the difference would be hidden in the implementation',
    );
  } else {
    for (const field of [
      'description',
      'reason',
      'comparedAs',
      'vueHalfCoveredBy',
      'razorHalfCoveredBy',
      'mutationCoveredBy',
    ]) {
      if (typeof divergence[field] !== 'string' || divergence[field].length === 0) {
        violations.push(`the controlled-mode divergence does not say [${field}]`);
      }
    }
  }
  for (const key of [
    'scopedSlotProps',
    'teleportToElement',
    'parentWrite',
    'focusScopeBranch',
    'initiallyOpenDropdowns',
    'leavingPanelContent',
  ]) {
    if (typeof policy.outsideTheCatalog?.[key] !== 'string') {
      violations.push(`the policy no longer says where [${key}] is covered outside the catalog`);
    }
  }
  for (const quirk of [
    'one-stack-with-the-dropdown',
    'close-on-escape-false-swallows',
    'close-unmounts-a-nested-dropdown',
  ]) {
    if (!(policy.historicalQuirks ?? []).some((entry) => entry.id === quirk && entry.razorDiffers === false)) {
      violations.push(`the policy no longer records the [${quirk}] quirk as reproduced by Razor`);
    }
  }
  if ((policy.approvedDivergences ?? []).length > 0) {
    violations.push('the popover policy approves a divergence; M30 closed with none');
  }

  return violations;
}
