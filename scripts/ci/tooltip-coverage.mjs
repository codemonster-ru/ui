// What the VfTooltip catalog has to prove, read as semantics (M31).
//
// The third overlay catalog, and the first whose scenarios need a pointer that
// stays. The gate holds four things at once:
//
//   - the vocabularies are closed. A prop the reference does not have, a
//     teleportTo that is not false or a unique in-case target, a slot key no
//     fixture renders, a step, key or expectation the harness does not drive
//     or measure - and a malformed hover or unhover - each is refused;
//   - the ownership budgets are derived, not trusted. The tooltip owns no
//     control. The consumer's controls are the case's trigger controls, the
//     after control and a popover trigger, plus an open popover's panel and
//     the control of the tooltip inside it;
//   - no scenario ends with an open timer pending. After its last gesture a
//     scenario waits at least the largest openDelay in the case plus the
//     leave (320 ms) plus a 150 ms margin, so a timer that fires during the
//     capture - the reference's or a defect's - cannot make evidence depend on
//     when the snapshot happened to run;
//   - every place the tooltip's contract could be ported wrong is exercised by
//     a case that could only pass if it held: the delay on both paths, its
//     cancellation, its restart, the click that opens nothing, the last event
//     winning both ways, focus moving inside, the pointer moving inside, the
//     pointer onto a teleported and an in-place tooltip, the content quirks,
//     both flips, both shifts, three destinations, two tooltips at once, the
//     escape stack the tooltip is not on and the unmount inside a popover.
//
// Violations are returned rather than asserted so a test can drive this with a
// deliberately eroded catalog and check which rule fired.

const PROPS = {
  text: (value) => typeof value === 'string',
  placement: (value) => value === 'top' || value === 'bottom',
  openDelay: (value) => Number.isInteger(value) && value >= 0,
  teleportTo: (value) => value === false || (typeof value === 'string' && /^#parity-tooltip-target-\d+$/.test(value)),
  disableTeleport: (value) => typeof value === 'boolean',
};
const CONTENT = {
  trigger: (value) =>
    value !== null &&
    typeof value === 'object' &&
    Object.keys(value).length === 1 &&
    (Array.isArray(value.controls)
      ? value.controls.length > 0 && value.controls.every((text) => typeof text === 'string')
      : typeof value.text === 'string'),
  body: (value) => value === 'rich' || value === 'empty',
  after: (value) => value === true,
  popover: (value) => value === 'beside' || value === 'inside',
  popoverDelay: (value) => Number.isInteger(value) && value >= 0,
  layout: (value) => ['top-edge', 'bottom-edge', 'left-edge', 'right-edge'].includes(value),
};
const KEYS = ['Tab', 'Escape', 'Enter', ' '];
const THROUGH_TOOLTIP = { selector: '.vf-tooltip__trigger', attribute: 'aria-describedby' };
const THROUGH_PANEL = { selector: '.vf-popover__trigger', attribute: 'aria-controls' };
const EXPECT_FIELDS = [
  'describedStates',
  'describedTargets',
  'tooltipStates',
  'hoverStates',
  'openings',
  'closings',
  'transitions',
  'bodyTooltips',
  'expandedStates',
  'focusRole',
  'focusInstance',
  'keydownPrevented',
  'settled',
];
/** The leave the snapshot waits out, plus the margin every timing window keeps. */
export const SETTLE_AFTER_DELAY = 320 + 150;
/**
 * What the harness may add between two gestures on top of the wait the catalog
 * names (M35.0a): every step settles on two frames and every CDP call waits for
 * the renderer - 134 ms at 30 frames per second, about 220 at 20. A gesture that
 * must land before a pending delay expires has to fit with this to spare; one
 * that must land late enough only gains from it and needs none. M31 kept 150 ms
 * on both sides, and the re-entry case met it at 500 ms - its leave landed at
 * 634 ms of a 600 ms delay when headless Chrome ran at 30 frames. A 600 ms
 * delay leaves the re-entry no room for both, so its late side keeps none; the
 * activation restart, with 1500 ms, keeps its 150.
 */
export const SCHEDULING_BEFORE_DELAY = 300;

const content = (entry) => entry.content ?? {};
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [entry.props ?? {}]);
const steps = (entry) => entry.interaction?.steps ?? [];
// The gestures that drive a scenario: its steps without the leading unhover a
// focus-first scenario needs to give the headless page focus at all.
const drive = (entry) => (steps(entry)[0]?.action === 'unhover' ? steps(entry).slice(1) : steps(entry));
const expectOf = (entry) => entry.interaction?.expect ?? {};
const delayOf = (member) => member.openDelay ?? 80;
const maxDelay = (entry) =>
  Math.max(
    ...members(entry).map(delayOf),
    content(entry).popover === 'inside' ? (content(entry).popoverDelay ?? 80) : 0,
  );
const controlsPerInstance = (entry) => content(entry).trigger?.controls?.length ?? 0;
const described = (entry) => expectOf(entry).describedStates ?? [];
const endsOpen = (entry) => described(entry).includes('tooltip');
const endsClosed = (entry) => described(entry).length > 0 && described(entry).every((state) => state === 'none');
const openings = (entry) => expectOf(entry).openings;
const closings = (entry) => expectOf(entry).closings;
const is = (step, action, selector) => step.action === action && (selector === undefined || step.selector === selector);
const actionsOf = (entry) => drive(entry).map((step) => step.action);
const sameThrough = (left, right) =>
  left !== undefined &&
  Object.keys(left).length === 2 &&
  left.selector === right.selector &&
  left.attribute === right.attribute;
const sameShape = (left, right) =>
  JSON.stringify([left.props ?? {}, left.attrs ?? {}, left.content ?? {}, left.group ?? null]) ===
  JSON.stringify([right.props ?? {}, right.attrs ?? {}, right.content ?? {}, right.group ?? null]);
const onlyOpening = (entry, via) =>
  Array.isArray(openings(entry)) &&
  openings(entry).length === 1 &&
  openings(entry)[0].via === via &&
  openings(entry)[0].latency === 'on-time';
const waitBefore = (entry, index) => (drive(entry)[index - 1]?.action === 'wait' ? drive(entry)[index - 1].ms : 0);

/** Whether a step is one the harness drives, spelled exactly as the vocabulary allows. */
export function stepProblem(step) {
  const keys = Object.keys(step ?? {}).sort();
  const index = step?.index;
  const indexOk = index === undefined || (Number.isInteger(index) && index >= 0);
  const allowed = (...names) => keys.every((key) => ['action', ...names].includes(key));
  switch (step?.action) {
    case 'hover': {
      if (!allowed('selector', 'index', 'through') || !indexOk) return 'a hover takes only selector, index and through';
      if (step.through === undefined) {
        return ['.vf-tooltip__trigger', '.parity-trigger-control', '.vf-tooltip__content strong'].includes(
          step.selector,
        )
          ? null
          : `a hover cannot target [${step.selector}]`;
      }
      if (sameThrough(step.through, THROUGH_TOOLTIP)) {
        return step.selector === 'strong' ? null : 'a hover through the tooltip can only rest on its rich body';
      }
      if (sameThrough(step.through, THROUGH_PANEL)) {
        return step.selector === '.vf-tooltip__trigger'
          ? null
          : 'a hover through a popover panel can only rest on the tooltip inside';
      }
      return 'a hover can only look through a tooltip or a popover panel';
    }
    case 'unhover':
      return keys.length === 1 ? null : 'an unhover takes nothing: it always goes to the neutral point';
    case 'focusButton':
      return allowed('selector', 'index') &&
        indexOk &&
        ['.parity-trigger-control', '.parity-after-control'].includes(step.selector)
        ? null
        : 'a focusButton can only focus a trigger control or the after control';
    case 'clickButton':
      return allowed('selector', 'index') &&
        indexOk &&
        ['.parity-trigger-control', '.vf-popover__trigger'].includes(step.selector)
        ? null
        : 'a clickButton can only click a trigger control or a popover trigger';
    case 'pressKey':
      return keys.join() === 'action,key' && KEYS.includes(step.key)
        ? null
        : 'a pressKey can only press Tab, Escape, Enter or Space';
    case 'wait':
      return keys.join() === 'action,ms' && Number.isFinite(step.ms) && step.ms > 0
        ? null
        : 'a wait takes a positive ms';
    default:
      return `the harness has no [${step?.action}] step for the tooltip`;
  }
}

/**
 * The distinguishing scenarios, each a message and the predicate a case must
 * satisfy. Exported so the test can remove every case that satisfies one and
 * check that exactly its rule fires.
 */
export const TOOLTIP_REQUIREMENTS = [
  // --------------------------------------------------------- the delay
  [
    'no scenario opens the tooltip with a real hover, on time from the enter',
    (entry) =>
      actionsOf(entry).join() === 'hover,wait' &&
      maxDelay(entry) === 80 &&
      endsOpen(entry) &&
      onlyOpening(entry, 'pointer') &&
      (expectOf(entry).hoverStates ?? [])[0] === 'true',
  ],
  [
    'no scenario opens the tooltip with real focus, on time from the focus',
    (entry) => actionsOf(entry).join() === 'focusButton,wait' && endsOpen(entry) && onlyOpening(entry, 'focus'),
  ],
  [
    'no scenario opens the tooltip with a real Tab',
    (entry) => drive(entry)[0]?.key === 'Tab' && endsOpen(entry) && expectOf(entry).focusRole === 'control',
  ],
  [
    'no scenario measures a delay of at least 600 ms on time, so an immediate open is separated by less than 150 ms',
    (entry) => maxDelay(entry) >= 600 && actionsOf(entry).join() === 'hover,wait' && onlyOpening(entry, 'pointer'),
  ],
  [
    'no scenario cancels a pending open with a real unhover',
    (entry) =>
      actionsOf(entry).join() === 'hover,wait,unhover,wait' &&
      waitBefore(entry, 2) + SCHEDULING_BEFORE_DELAY <= maxDelay(entry) &&
      endsClosed(entry) &&
      JSON.stringify(openings(entry)) === '[]',
  ],
  [
    'no scenario cancels a pending open with a focusout',
    (entry) =>
      actionsOf(entry).join() === 'focusButton,wait,focusButton,wait' &&
      drive(entry)[2].selector === '.parity-after-control' &&
      waitBefore(entry, 2) + SCHEDULING_BEFORE_DELAY <= maxDelay(entry) &&
      endsClosed(entry) &&
      JSON.stringify(openings(entry)) === '[]',
  ],
  [
    'no scenario proves a re-entry after a leave restarts the timer, late enough that a surviving one would be early',
    (entry) =>
      actionsOf(entry).join() === 'hover,wait,unhover,hover,wait' &&
      waitBefore(entry, 2) >= maxDelay(entry) / 2 &&
      waitBefore(entry, 2) + SCHEDULING_BEFORE_DELAY <= maxDelay(entry) &&
      endsOpen(entry) &&
      onlyOpening(entry, 'pointer'),
  ],
  [
    'no scenario proves a second activation restarts the pending timer, late enough that a kept one would be early',
    (entry) =>
      actionsOf(entry).join() === 'hover,wait,focusButton,wait' &&
      waitBefore(entry, 2) >= maxDelay(entry) / 2 + 150 &&
      waitBefore(entry, 2) + SCHEDULING_BEFORE_DELAY <= maxDelay(entry) &&
      endsOpen(entry) &&
      onlyOpening(entry, 'focus'),
  ],
  [
    'no scenario proves a real click opens nothing: enter, focus and leave in one gesture',
    (entry) =>
      actionsOf(entry).join() === 'clickButton,wait' &&
      drive(entry)[0].selector === '.parity-trigger-control' &&
      endsClosed(entry) &&
      expectOf(entry).focusRole === 'control' &&
      JSON.stringify(openings(entry)) === '[]',
  ],
  [
    'no scenario proves hover, focus and leave leave no timer behind',
    (entry) =>
      actionsOf(entry).join() === 'hover,focusButton,unhover,wait' &&
      maxDelay(entry) >= 600 &&
      endsClosed(entry) &&
      JSON.stringify(openings(entry)) === '[]',
  ],
  // ------------------------------------------------ the last event wins
  [
    'no scenario proves a mouseleave closes the tooltip while its control keeps focus',
    (entry) =>
      actionsOf(entry).join() === 'focusButton,hover,wait,unhover,wait' &&
      endsClosed(entry) &&
      expectOf(entry).focusRole === 'control',
  ],
  [
    'no scenario proves a focusout closes the tooltip while the pointer stays inside',
    (entry) =>
      actionsOf(entry).join() === 'hover,focusButton,wait,focusButton,wait' &&
      drive(entry)[3].selector === '.parity-after-control' &&
      endsClosed(entry) &&
      (expectOf(entry).hoverStates ?? [])[0] === 'true',
  ],
  [
    'no scenario proves focus moving between two controls inside closes and reopens the tooltip',
    (entry) =>
      controlsPerInstance(entry) === 2 &&
      actionsOf(entry).join() === 'focusButton,wait,focusButton,wait' &&
      (drive(entry)[2].index ?? 0) === 1 &&
      endsOpen(entry) &&
      openings(entry)?.length === 2 &&
      closings(entry)?.length === 1,
  ],
  [
    'no scenario proves the pointer moving between two controls inside does nothing',
    (entry) =>
      controlsPerInstance(entry) === 2 &&
      steps(entry).filter((step) => is(step, 'hover', '.parity-trigger-control')).length === 2 &&
      endsOpen(entry) &&
      openings(entry)?.length === 1 &&
      JSON.stringify(closings(entry)) === '[]',
  ],
  [
    'no scenario proves a hover over an open, focused tooltip opens nothing new',
    (entry) =>
      actionsOf(entry).join() === 'focusButton,wait,hover,wait' && endsOpen(entry) && onlyOpening(entry, 'focus'),
  ],
  // ------------------------------------------------------------ closing
  [
    'no scenario closes the tooltip with a real unhover through a full leave',
    (entry) =>
      actionsOf(entry).join() === 'hover,wait,unhover,wait' &&
      endsClosed(entry) &&
      JSON.stringify(expectOf(entry).transitions) === '["0:enter:normal","0:leave:normal"]' &&
      JSON.stringify(closings(entry)) === '[{"instance":0,"via":"pointer","lag":"immediate"}]',
  ],
  [
    'no scenario closes the tooltip with a focusout through a full leave',
    (entry) =>
      actionsOf(entry).join() === 'focusButton,wait,focusButton,wait' &&
      endsClosed(entry) &&
      JSON.stringify(expectOf(entry).transitions) === '["0:enter:normal","0:leave:normal"]' &&
      closings(entry)?.[0]?.via === 'focus',
  ],
  [
    'no scenario proves Tab out of the wrapper closes the tooltip without being handled',
    (entry) =>
      steps(entry).some((step) => step.key === 'Tab') &&
      endsClosed(entry) &&
      (expectOf(entry).keydownPrevented ?? []).includes('Tab:false'),
  ],
  [
    'no scenario moves the pointer onto a teleported tooltip, which closes it',
    (entry) =>
      steps(entry).some((step) => step.action === 'hover' && sameThrough(step.through, THROUGH_TOOLTIP)) &&
      endsClosed(entry),
  ],
  [
    'no scenario moves the pointer onto an in-place tooltip, which stays open',
    (entry) =>
      steps(entry).some((step) => is(step, 'hover', '.vf-tooltip__content strong')) &&
      members(entry).every((member) => member.disableTeleport === true) &&
      endsOpen(entry),
  ],
  [
    'no closing scenario claims every tooltip node gone, so an orphan left in <body> could go unseen',
    (entry) =>
      endsClosed(entry) && (openings(entry)?.length ?? 0) > 0 && JSON.stringify(expectOf(entry).bodyTooltips) === '[]',
  ],
  // ------------------------------------------------------------ content
  [
    'no scenario opens a whitespace-only text',
    (entry) => members(entry).some((member) => member.text === '   ') && endsOpen(entry),
  ],
  [
    'no scenario opens the text "0"',
    (entry) => members(entry).some((member) => member.text === '0') && endsOpen(entry),
  ],
  [
    'no scenario opens a tooltip with no text and no slot, so the dangling reference is never compared',
    (entry) =>
      members(entry).some((member) => !('text' in member)) &&
      content(entry).body === undefined &&
      described(entry).includes('dangling'),
  ],
  [
    'no scenario opens an empty text, which dangles like no text',
    (entry) => members(entry).some((member) => member.text === '') && described(entry).includes('dangling'),
  ],
  [
    'no scenario opens a content slot without a text',
    (entry) =>
      content(entry).body === 'rich' && members(entry).every((member) => !('text' in member)) && endsOpen(entry),
  ],
  [
    'no scenario proves the content slot wins over the text',
    (entry) => content(entry).body === 'rich' && members(entry).some((member) => 'text' in member) && endsOpen(entry),
  ],
  ['no scenario opens an empty content slot', (entry) => content(entry).body === 'empty' && endsOpen(entry)],
  [
    'no scenario hovers a plain-text trigger with nothing focusable',
    (entry) => typeof content(entry).trigger?.text === 'string' && endsOpen(entry),
  ],
  // ----------------------------------------------------- floating
  [
    'no scenario opens a bottom tooltip where it fits',
    (entry) =>
      members(entry).some((member) => member.placement === 'bottom') && !content(entry).layout && endsOpen(entry),
  ],
  [
    'no scenario flips a top tooltip at the viewport top',
    (entry) => content(entry).layout === 'top-edge' && members(entry).every((member) => member.placement !== 'bottom'),
  ],
  [
    'no scenario flips a bottom tooltip at the viewport bottom',
    (entry) =>
      content(entry).layout === 'bottom-edge' && members(entry).every((member) => member.placement === 'bottom'),
  ],
  [
    'no scenario shifts a long tooltip at the left edge',
    (entry) =>
      content(entry).layout === 'left-edge' &&
      members(entry).some((member) => (member.text ?? '').length > 60) &&
      endsOpen(entry),
  ],
  [
    'no scenario shifts a long tooltip at the right edge',
    (entry) =>
      content(entry).layout === 'right-edge' && members(entry).some((member) => (member.text ?? '').length > 60),
  ],
  // ----------------------------------------------------- destinations
  [
    'no scenario opens a tooltip in place with disableTeleport',
    (entry) => members(entry).some((member) => member.disableTeleport === true) && endsOpen(entry),
  ],
  [
    'no scenario opens a tooltip in place with teleportTo=false',
    (entry) => members(entry).some((member) => member.teleportTo === false) && endsOpen(entry),
  ],
  [
    'no scenario opens a tooltip into a selector target',
    (entry) => members(entry).some((member) => typeof member.teleportTo === 'string') && endsOpen(entry),
  ],
  // ---------------------------------------------------- relationships
  [
    'no scenario holds two tooltips with different texts open at once',
    (entry) =>
      members(entry).length === 2 &&
      members(entry)[0].text !== members(entry)[1].text &&
      JSON.stringify(described(entry)) === '["tooltip","tooltip"]' &&
      JSON.stringify(expectOf(entry).describedTargets) === '[0,1]',
  ],
  [
    'no scenario holds two tooltips with identical texts open at once, so a swap is caught only by position',
    (entry) =>
      members(entry).length === 2 &&
      typeof members(entry)[0].text === 'string' &&
      members(entry)[0].text === members(entry)[1].text &&
      JSON.stringify(described(entry)) === '["tooltip","tooltip"]',
  ],
  [
    'no scenario opens the second tooltip first, so <body> order is never compared against mount order',
    (entry) =>
      members(entry).length === 2 &&
      drive(entry)[0]?.action === 'hover' &&
      drive(entry)[0].index === 1 &&
      JSON.stringify(expectOf(entry).describedTargets) === '[0,1]',
  ],
  // ----------------------------------------------------- integration
  [
    'no scenario proves an Escape reaches a popover open beside an open tooltip',
    (entry) =>
      content(entry).popover === 'beside' &&
      steps(entry).some((step) => step.key === 'Escape') &&
      JSON.stringify(expectOf(entry).expandedStates) === '["false"]' &&
      endsOpen(entry) &&
      (expectOf(entry).keydownPrevented ?? []).includes('Escape:true'),
  ],
  [
    'no scenario proves closing a popover removes the open tooltip inside it without a leave',
    (entry) =>
      content(entry).popover === 'inside' &&
      steps(entry).some((step) => step.action === 'hover' && sameThrough(step.through, THROUGH_PANEL)) &&
      JSON.stringify(expectOf(entry).expandedStates) === '["false"]' &&
      (openings(entry)?.length ?? 0) > 0 &&
      Array.isArray(expectOf(entry).transitions) &&
      !expectOf(entry).transitions.some((record) => record.includes(':leave:')) &&
      JSON.stringify(expectOf(entry).bodyTooltips) === '[]',
  ],
  [
    'no scenario proves closing a popover cancels a tooltip timer pending inside it',
    (entry) =>
      content(entry).popover === 'inside' &&
      steps(entry).some((step) => step.action === 'hover' && sameThrough(step.through, THROUGH_PANEL)) &&
      JSON.stringify(openings(entry)) === '[]',
  ],
  // ------------------------------------------------------------ keys
  [
    'no scenario proves Escape, Enter and Space on an open tooltip are neither handled nor prevented',
    (entry) =>
      ['Escape:false', 'Enter:false', ' :false'].every((record) =>
        (expectOf(entry).keydownPrevented ?? []).includes(record),
      ) && endsOpen(entry),
  ],
];

/** Every way the VfTooltip catalog's coverage can be eroded. */
export function tooltipCoverageViolations(cases) {
  const violations = [];
  const byId = new Map(cases.map((entry) => [entry.id, entry]));

  // ------------------------------------------------------------ vocabulary
  const targets = new Map();
  for (const entry of cases) {
    if (!entry.id?.startsWith('tooltip/')) {
      violations.push(`${entry.id} is not a tooltip case, so it cannot count towards tooltip coverage`);
    }
    if (Array.isArray(entry.group) && Object.keys(entry.props ?? {}).length > 0) {
      violations.push(`${entry.id} is a group and declares case-level props, which a group ignores`);
    }
    for (const member of members(entry)) {
      for (const [name, value] of Object.entries(member)) {
        if (!PROPS[name])
          violations.push(`${entry.id} declares prop [${name}], which the reference VfTooltip does not have`);
        else if (!PROPS[name](value)) {
          violations.push(
            `${entry.id} gives prop [${name}] the value ${JSON.stringify(value)}, outside what the catalog can render`,
          );
        }
      }
      if (typeof member.teleportTo === 'string') {
        const owner = targets.get(member.teleportTo);
        if (owner && owner !== entry.id) {
          violations.push(
            `${entry.id} teleports into ${member.teleportTo}, which ${owner} renders too: one page, two ids`,
          );
        }
        targets.set(member.teleportTo, entry.id);
      }
    }
    for (const [name, value] of Object.entries(content(entry))) {
      if (!CONTENT[name])
        violations.push(`${entry.id} puts [${name}] in the content vocabulary, which no fixture renders`);
      else if (!CONTENT[name](value)) violations.push(`${entry.id} gives [${name}] the value ${JSON.stringify(value)}`);
    }
    if (content(entry).trigger === undefined) violations.push(`${entry.id} renders no trigger slot`);
    if (content(entry).popoverDelay !== undefined && content(entry).popover !== 'inside') {
      violations.push(`${entry.id} sets popoverDelay without a tooltip inside a popover`);
    }
  }

  // ------------------------------------------------------------- ownership
  for (const entry of cases) {
    const rootConsumers =
      members(entry).length * controlsPerInstance(entry) +
      (content(entry).after ? 1 : 0) +
      (content(entry).popover ? 1 : 0);
    if (entry.componentInteractive !== 0) {
      violations.push(
        `${entry.id} declares ${entry.componentInteractive} component-owned control(s); the tooltip owns none`,
      );
    }
    if (entry.consumerInteractive !== rootConsumers || entry.consumerInteractiveRoles !== 0) {
      violations.push(
        `${entry.id} declares ${entry.consumerInteractive} consumer control(s) and ${entry.consumerInteractiveRoles} ` +
          `role(s) initially, but its content renders ${rootConsumers} and 0 - every popover starts closed`,
      );
    }
    if (!entry.interaction) continue;

    if ('componentInteractive' in entry.interaction) {
      violations.push(`${entry.id} overrides the owned count in its scenario; the tooltip owns none before or after`);
    }
    const expanded = expectOf(entry).expandedStates;
    if (content(entry).popover && (!Array.isArray(expanded) || expanded.length !== 1)) {
      violations.push(`${entry.id} drives a case with a popover but does not say whether it ends open`);
      continue;
    }
    const popoverOpen = content(entry).popover !== undefined && expanded[0] === 'true';
    const afterConsumers = rootConsumers + (popoverOpen ? 1 + (content(entry).popover === 'inside' ? 1 : 0) : 0);
    if (entry.interaction.consumerInteractive !== afterConsumers || entry.interaction.consumerInteractiveRoles !== 0) {
      violations.push(
        `${entry.id} declares ${entry.interaction.consumerInteractive} consumer control(s) and ` +
          `${entry.interaction.consumerInteractiveRoles} role(s) after its scenario, but it ends rendering ${afterConsumers} and 0`,
      );
    }
    const instancesAfter = members(entry).length + (popoverOpen && content(entry).popover === 'inside' ? 1 : 0);
    if (described(entry).length !== instancesAfter) {
      violations.push(`${entry.id} does not say which of its ${instancesAfter} instance(s) end described, and by what`);
    }
  }

  // ------------------------------------------------------------- scenarios
  for (const entry of cases.filter((candidate) => candidate.interaction)) {
    if (steps(entry)[0]?.action === 'focusButton') {
      violations.push(
        `${entry.id} focuses before any pointer or key input: a headless tab has no window focus yet, so focus() ` +
          'fires no focus or focusin and the tooltip never sees it. Start with unhover',
      );
    }
    for (const step of steps(entry)) {
      const problem = stepProblem(step);
      if (problem)
        violations.push(`${entry.id} has a step the harness does not drive (${problem}): ${JSON.stringify(step)}`);
    }
    for (const key of Object.keys(expectOf(entry))) {
      if (!EXPECT_FIELDS.includes(key))
        violations.push(`${entry.id} claims [${key}], which the tooltip snapshot does not record`);
    }
    const keyCount = steps(entry).filter((step) => step.action === 'pressKey').length;
    if (expectOf(entry).keydownPrevented !== undefined && expectOf(entry).keydownPrevented.length !== keyCount) {
      violations.push(
        `${entry.id} claims ${expectOf(entry).keydownPrevented.length} keydown record(s) for ${keyCount} key press(es)`,
      );
    }
    // No timer may still be pending when the snapshot runs.
    const lastGesture = steps(entry).findLastIndex((step) => step.action !== 'wait');
    const settle = steps(entry)
      .slice(lastGesture + 1)
      .reduce((sum, step) => sum + (step.action === 'wait' ? step.ms : 0), 0);
    if (lastGesture < 0 || settle < maxDelay(entry) + SETTLE_AFTER_DELAY) {
      violations.push(
        `${entry.id} waits ${settle} ms after its last gesture, less than its ${maxDelay(entry)} ms delay + ` +
          `${SETTLE_AFTER_DELAY} ms: a timer could still be pending when the snapshot runs`,
      );
    }
    const matches = entry.interaction.matches;
    if (matches !== undefined) {
      const target = byId.get(matches);
      if (!target || target.interaction) {
        violations.push(`${entry.id} converges on ${matches}, which is not an initial case of the catalog`);
      } else if (!endsClosed(entry) || !sameShape(entry, target)) {
        violations.push(`${entry.id} converges on ${matches}, but only a closing gesture on the same case shape can`);
      }
    }
  }

  // ------------------------------------------------------ initial states
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };
  require('no shared case renders the closed default: one trigger control, no reference', (entry) =>
    !entry.interaction && members(entry).length === 1 && controlsPerInstance(entry) === 1 && entry.visual === true);
  require('no shared case forwards consumer attrs to the root', (entry) =>
    !entry.interaction && ['id', 'class', 'data-testid', 'aria-label'].every((name) => name in (entry.attrs ?? {})));
  require('no shared case renders two closed tooltips side by side', (entry) =>
    !entry.interaction && members(entry).length === 2);
  require('no shared case renders a plain-text trigger', (entry) =>
    !entry.interaction && typeof content(entry).trigger?.text === 'string');
  for (const [message, predicate] of TOOLTIP_REQUIREMENTS) {
    require(message, (entry) => Boolean(entry.interaction) && predicate(entry));
  }

  return violations;
}

/** The policy's declarations the catalog relies on. */
export function tooltipPolicyViolations(policy) {
  const violations = [];
  if ((policy.platformDivergences ?? []).length > 0) {
    violations.push('the tooltip policy declares a platform divergence; M31 closed with none');
  }
  for (const key of [
    'reactiveProps',
    'teleportToElement',
    'missingTeleportTarget',
    'untypedProps',
    'scrollUnderPointer',
  ]) {
    if (typeof policy.outsideTheCatalog?.[key] !== 'string') {
      violations.push(`the policy no longer says where [${key}] is covered outside the catalog`);
    }
  }
  for (const quirk of [
    'last-event-wins',
    'every-activation-restarts',
    'descendant-focus-flickers',
    'dangling-description',
    'javascript-truthiness',
    'description-on-the-wrapper',
    'teleported-tooltip-is-not-hoverable',
    'not-on-the-escape-stack',
    'unmount-without-leave',
  ]) {
    if (!(policy.historicalQuirks ?? []).some((entry) => entry.id === quirk && entry.razorDiffers === false)) {
      violations.push(`the policy no longer records the [${quirk}] quirk as reproduced by Razor`);
    }
  }
  if ((policy.approvedDivergences ?? []).length > 0) {
    violations.push('the tooltip policy approves a divergence; M31 closed with none');
  }

  return violations;
}
