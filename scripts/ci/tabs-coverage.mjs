// What the VfTabs catalog has to prove, read as semantics.
//
// The third coverage module for a component that owns controls, and the first
// for one whose controls carry an explicit interactive role, a roving
// tabindex, aria-selected, a relationship graph and a measured indicator.
// Three halves:
//
//   - the state half: each way the active value can be decided (nothing,
//     defaultValue, modelValue, modelValue beating defaultValue, an unknown
//     value, an empty string, null), disabled first, middle, last and as the
//     seed itself, every item disabled, the count edge cases (none, one), the
//     duplicated value with its duplicate ids, the tabId and panelId
//     overrides with and without a panel slot, a value with a space, the tab
//     slot, the panel slot with and without a consumer control, the consumer's
//     class, style and attributes, dir=rtl, and the overflow states: at the
//     start, with the active tab partly clipped, entirely hidden, and under
//     RTL;
//   - the interaction half: a pointer click on another tab and on the
//     current one (which emits the pair again), Enter and Space that activate
//     *natively* - one click counted, the key not prevented - each of the
//     four arrows, Home and End, wrapping in both directions, skipping a
//     disabled tab in both directions and for End, a disabled tab that takes
//     no focus, focus alone, navigation from a focused but
//     unselected tab, Tab into the panel, Tab into the list from before it -
//     the roving tabindex proved by native focus - the two RTL arrows, a
//     controlled consumer that writes the value back, two siblings sharing
//     values, a click on the clipped tab, the scroll buttons, and a consumer
//     control inside the panel. Each is read as the claim the case makes, not
//     as the keys it presses, and each claim about the selection has to name
//     aria-selected, tabindex, the panel and the focus together;
//   - the ownership half: every case declares how many controls the component
//     renders - one tab per item and two scroll buttons per instance, plus
//     the active panel when a panel slot exists - and how many consumer
//     controls stand before the tabs or inside the panel.
//
// The vocabulary is closed. A prop the reference does not declare (no
// orientation, no size, no activation mode), a slot it does not render, a key
// the driver cannot press, a stepper-shaped claim (`currentValue`,
// `itemStates`) are rejected outright, because a case that drove or claimed
// them would be describing a component the reference is not.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.

const PROPS = ['items', 'modelValue', 'defaultValue'];
const ITEM_KEYS = ['value', 'label', 'disabled', 'tabId', 'panelId'];
const CONTENT_KEYS = ['panel', 'tab', 'before'];
const PANEL_KEYS = ['text', 'control'];
const TAB_KEYS = ['numbered'];
const BEFORE_KEYS = ['control'];
const NAVIGATION_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
const ACTIVATION_KEYS = ['Enter', ' '];
const UNHANDLED_KEYS = ['Tab'];
const KEYS = [...ACTIVATION_KEYS, ...NAVIGATION_KEYS, ...UNHANDLED_KEYS];
const STEP_ACTIONS = ['clickButton', 'focusButton', 'pressKey'];
const TAB = '.vf-tabs__tab';
const SCROLL_LEFT = '.vf-tabs__scroll-button--left';
const SCROLL_RIGHT = '.vf-tabs__scroll-button--right';
const CONSUMER_SELECTORS = ['.parity-before', '.parity-panel-control'];
const SELECTORS = [TAB, SCROLL_LEFT, SCROLL_RIGHT, ...CONSUMER_SELECTORS];
const EXPECT_FIELDS = [
  'activates',
  'selectedValue',
  'selectedValues',
  'ariaSelected',
  'tabindexes',
  'disabledValues',
  'panelPresent',
  'panelLabelledByActive',
  'focusRole',
  'focusValue',
  'focusInstance',
  'indicatorOpacity',
  'indicatorTransform',
  'indicatorWidth',
  'scrollLeft',
  'canScrollLeft',
  'canScrollRight',
  'leftHidden',
  'rightHidden',
  'leftAriaHidden',
  'rightAriaHidden',
  'leftTabindex',
  'rightTabindex',
  'leftDisabled',
  'rightDisabled',
  'fades',
  'scrolling',
  'scrollbarWidth',
  'settled',
  'keydownPrevented',
  'events',
];
const A11Y_ROLES = ['tablist', 'firstTab', 'secondTab', 'thirdTab', 'panel', 'scrollLeft', 'scrollRight'];
const A11Y_STATES = ['disabled', 'focusable', 'selected'];
const FOCUS_ROLES = ['tab', 'panel', 'scroll-left', 'scroll-right', 'body', 'other-inside-case', 'outside-case'];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [props(entry)]);
const itemsOf = (member) => (Array.isArray(member.items) ? member.items : []);
const stepsOf = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const isInteraction = (entry) => entry.interaction !== undefined;
const clicks = (entry, selector = TAB) =>
  stepsOf(entry).filter((step) => step.action === 'clickButton' && step.selector === selector);
const presses = (entry, key) => stepsOf(entry).some((step) => step.action === 'pressKey' && step.key === key);
const focuses = (entry, selector = TAB) =>
  stepsOf(entry).filter((step) => step.action === 'focusButton' && step.selector === selector);
const hasPanel = (entry) => entry.content?.panel !== undefined;
const isRtl = (entry) => attrs(entry).dir === 'rtl';
const plain = (entry) => !isInteraction(entry) && !entry.group;
const disabledValues = (member) =>
  itemsOf(member)
    .filter((item) => item.disabled === true)
    .map((item) => item.value);

/** The active value a member's props resolve to - the shared rule, restated as data. */
function activeValue(member) {
  const fallback = itemsOf(member).find((item) => !item.disabled)?.value;
  const modelValue = 'modelValue' in member ? member.modelValue : undefined;

  return modelValue ?? member.defaultValue ?? fallback;
}

function activeIndex(member) {
  return itemsOf(member).findIndex((item) => item.value === activeValue(member));
}

/** How many controls a case's component renders: tabs, two scroll buttons, the active panel. */
function controlCount(entry) {
  return members(entry).reduce(
    (total, member) => total + itemsOf(member).length + 2 + (hasPanel(entry) && activeIndex(member) >= 0 ? 1 : 0),
    0,
  );
}

function consumerCount(entry) {
  const before = entry.content?.before?.control !== undefined ? 1 : 0;
  const inPanel =
    entry.content?.panel?.control !== undefined && members(entry).some((member) => activeIndex(member) >= 0) ? 1 : 0;

  return before + inPanel;
}

/** Every way the VfTabs catalog's coverage can be eroded. */
export function tabsCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    for (const member of members(entry)) {
      for (const name of Object.keys(member)) {
        if (!PROPS.includes(name)) {
          violations.push(`${entry.id} declares prop [${name}], which the reference VfTabs does not have`);
        }
      }
      if (!Array.isArray(member.items)) {
        violations.push(`${entry.id} declares no items list; the reference requires one`);
      }
      for (const item of itemsOf(member)) {
        for (const name of Object.keys(item)) {
          if (!ITEM_KEYS.includes(name)) violations.push(`${entry.id} puts [${name}] in an item, which no item has`);
        }
      }
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!CONTENT_KEYS.includes(name)) {
        violations.push(
          `${entry.id} declares slot [${name}]. The reference VfTabs renders a tab slot and a panel slot; a consumer control can only stand before it or inside the panel`,
        );
      }
    }
    for (const [slot, keys] of [
      ['panel', PANEL_KEYS],
      ['tab', TAB_KEYS],
      ['before', BEFORE_KEYS],
    ]) {
      for (const name of Object.keys(entry.content?.[slot] ?? {})) {
        if (!keys.includes(name)) violations.push(`${entry.id} puts [${name}] in the ${slot} vocabulary`);
      }
    }
    for (const step of stepsOf(entry)) {
      if (!STEP_ACTIONS.includes(step.action)) {
        violations.push(`${entry.id} drives [${step.action}], which is not a tabs gesture`);
      }
      if ((step.action === 'clickButton' || step.action === 'focusButton') && !SELECTORS.includes(step.selector)) {
        violations.push(
          `${entry.id} ${step.action} targets [${step.selector}]; a tabs gesture lands on a tab, a scroll button or a declared consumer control`,
        );
      }
      if ((step.action === 'clickButton' || step.action === 'focusButton') && !Number.isInteger(step.index)) {
        violations.push(
          `${entry.id} ${step.action} names no index. A tabs owns several controls, and a gesture that does not say which one it drives is not a claim`,
        );
      }
      if (step.action === 'pressKey' && !KEYS.includes(step.key)) {
        violations.push(
          `${entry.id} presses [${step.key}]. The reference handles the six navigation keys and leaves Enter, Space and Tab to the browser; a key the page itself leaves to the browser cannot be driven deterministically and is pinned by the characterization suite`,
        );
      }
    }
    for (const name of Object.keys(expectOf(entry))) {
      const a11y = name.startsWith('a11y:') ? name.slice('a11y:'.length).split('.') : null;
      if (a11y) {
        if (!A11Y_ROLES.includes(a11y[0]) || !A11Y_STATES.includes(a11y[1])) {
          violations.push(
            `${entry.id} expects [${name}]. The tree exposes disabled, focusable and selected for a tab, and nothing for a hidden scroll button`,
          );
        }
        continue;
      }
      if (!EXPECT_FIELDS.includes(name))
        violations.push(`${entry.id} expects [${name}], which no tabs snapshot records`);
    }
    if (expectOf(entry).focusRole !== undefined && !FOCUS_ROLES.includes(expectOf(entry).focusRole)) {
      violations.push(
        `${entry.id} expects focusRole=${JSON.stringify(expectOf(entry).focusRole)}, which nothing measures`,
      );
    }
  }

  // ------------------------------------------------------------- ownership
  for (const entry of cases) {
    const declared = entry.componentInteractive;
    const expected = controlCount(entry);

    if (!Number.isInteger(declared)) {
      violations.push(
        `${entry.id} declares no componentInteractive budget. Every tabs case owns one tab per item, two scroll buttons and at most one panel per instance, and a case that does not say how many cannot be measured against anything`,
      );
    } else if (declared !== expected) {
      violations.push(
        `${entry.id} declares ${declared} component-owned control(s) but renders ${expected}: one per item, two scroll buttons per instance, and the active panel when a panel slot exists`,
      );
    }

    const consumer = entry.consumerInteractive ?? 0;
    if (consumer !== consumerCount(entry)) {
      violations.push(
        `${entry.id} declares ${consumer} consumer control(s) but ${consumerCount(entry)} stand(s) before the tabs or inside the rendered panel`,
      );
    }
    if (entry.interaction?.consumerInteractive !== undefined) {
      violations.push(`${entry.id} declares a post-interaction consumer budget; nothing a tabs does can change it`);
    }
  }

  require('no shared tabs case renders an empty items list, so a component-owned budget of two scroll buttons alone is never measured', (
    entry,
  ) => plain(entry) && itemsOf(props(entry)).length === 0 && entry.componentInteractive === 2);
  require('no shared tabs case renders two siblings sharing values with a panel each, so twelve component-owned controls are never measured', (
    entry,
  ) =>
    (entry.group?.length ?? 0) === 2 &&
    !isInteraction(entry) &&
    hasPanel(entry) &&
    itemsOf(entry.group[0]).some((item) => itemsOf(entry.group[1]).some((other) => other.value === item.value)) &&
    entry.componentInteractive === controlCount(entry));
  require('no shared tabs case puts a consumer control before the tabs', (entry) =>
    plain(entry) && entry.content?.before?.control !== undefined && entry.consumerInteractive === 1);
  require('no shared tabs case puts a consumer control inside the panel slot, so the ownership classification is never measured inside component-owned markup', (
    entry,
  ) => plain(entry) && entry.content?.panel?.control !== undefined && entry.consumerInteractive === 1);

  // ---------------------------------------------------------- initial state
  const three = (entry) =>
    itemsOf(props(entry)).length === 3 &&
    new Set(itemsOf(props(entry)).map((item) => item.value)).size === 3 &&
    itemsOf(props(entry)).every(
      (item) => item.disabled === undefined && item.tabId === undefined && item.panelId === undefined,
    );
  const untouched = (entry) =>
    plain(entry) &&
    Object.keys(attrs(entry)).length === 0 &&
    entry.content?.tab === undefined &&
    entry.content?.before === undefined &&
    entry.content?.panel?.control === undefined;
  require('no shared tabs case is rendered with neither modelValue nor defaultValue and no panel slot, so the fallback and the no-aria-controls half are never measured', (
    entry,
  ) =>
    untouched(entry) &&
    three(entry) &&
    !('modelValue' in props(entry)) &&
    props(entry).defaultValue === undefined &&
    !hasPanel(entry));
  require('no shared tabs case is rendered with the fallback and a panel slot, so the aria-controls graph with a dangling reference is never measured', (
    entry,
  ) =>
    untouched(entry) &&
    three(entry) &&
    !('modelValue' in props(entry)) &&
    props(entry).defaultValue === undefined &&
    hasPanel(entry));
  require('no shared tabs case seeds a middle tab through defaultValue alone', (entry) =>
    untouched(entry) &&
    three(entry) &&
    !('modelValue' in props(entry)) &&
    activeIndex(props(entry)) === 1 &&
    hasPanel(entry));
  require('no shared tabs case seeds the last tab through defaultValue alone', (entry) =>
    untouched(entry) &&
    three(entry) &&
    !('modelValue' in props(entry)) &&
    activeIndex(props(entry)) === 2 &&
    hasPanel(entry));
  require('no shared tabs case selects through the controlled modelValue alone', (entry) =>
    untouched(entry) &&
    typeof props(entry).modelValue === 'string' &&
    props(entry).defaultValue === undefined &&
    activeIndex(props(entry)) >= 0);
  require('no shared tabs case passes modelValue together with a different defaultValue, so the precedence is assumed rather than measured', (
    entry,
  ) =>
    untouched(entry) &&
    typeof props(entry).modelValue === 'string' &&
    props(entry).defaultValue !== undefined &&
    props(entry).modelValue !== props(entry).defaultValue);
  require('no shared tabs case passes an unknown controlled modelValue with a panel slot, so "no selected tab, zero tabindex=0, no panel" is never measured', (
    entry,
  ) =>
    untouched(entry) &&
    typeof props(entry).modelValue === 'string' &&
    props(entry).modelValue !== '' &&
    activeIndex(props(entry)) === -1 &&
    hasPanel(entry));
  require('no shared tabs case passes an empty-string modelValue, so the ?? boundary is never measured', (entry) =>
    untouched(entry) && props(entry).modelValue === '');
  require('no shared tabs case passes a null modelValue beside a defaultValue, so "null is an absence" is never measured', (
    entry,
  ) =>
    untouched(entry) &&
    'modelValue' in props(entry) &&
    props(entry).modelValue === null &&
    props(entry).defaultValue !== undefined);

  // ----------------------------------------------------------------- disabled
  const disabledAt = (entry, position) => {
    const member = props(entry);
    const disabled = disabledValues(member);
    if (!plain(entry) || disabled.length !== 1 || itemsOf(member).length !== 3) return false;
    const index = itemsOf(member).findIndex((item) => item.value === disabled[0]);
    const active = activeIndex(member);
    return position === 'before' ? index < active : position === 'after' ? index > active : index === active;
  };
  require('no shared tabs case disables the first tab with nothing seeded, so the fallback skipping it is never measured', (
    entry,
  ) => disabledAt(entry, 'before') && props(entry).defaultValue === undefined && !('modelValue' in props(entry)));
  require('no shared tabs case disables a tab after the selected one', (entry) => disabledAt(entry, 'after'));
  require('no shared tabs case seeds a disabled tab, so "selected, tabindex 0, panel rendered" on a disabled tab is never measured', (
    entry,
  ) => disabledAt(entry, 'at') && hasPanel(entry));
  require('no shared tabs case disables every tab', (entry) =>
    plain(entry) &&
    itemsOf(props(entry)).length > 0 &&
    disabledValues(props(entry)).length === itemsOf(props(entry)).length);
  require('no shared tabs case renders a single item', (entry) => plain(entry) && itemsOf(props(entry)).length === 1);

  // ------------------------------------------------------ ids and relations
  const duplicates = (member) => new Set(itemsOf(member).map((item) => item.value)).size < itemsOf(member).length;
  require('no shared tabs case duplicates a value with a panel slot, so duplicate ids, two selected tabs and two tabindex=0 are never measured', (
    entry,
  ) => plain(entry) && duplicates(props(entry)) && hasPanel(entry));
  require('no shared tabs case overrides tabId with a panel slot, so the tab id and the panel aria-labelledby taking it are never measured', (
    entry,
  ) =>
    plain(entry) &&
    hasPanel(entry) &&
    itemsOf(props(entry)).some((item) => typeof item.tabId === 'string' && item.value === activeValue(props(entry))));
  require('no shared tabs case overrides panelId with a panel slot', (entry) =>
    plain(entry) &&
    hasPanel(entry) &&
    itemsOf(props(entry)).some((item) => typeof item.panelId === 'string' && item.value === activeValue(props(entry))));
  require('no shared tabs case overrides panelId without a panel slot, so aria-controls on that tab alone is never measured', (
    entry,
  ) => plain(entry) && !hasPanel(entry) && itemsOf(props(entry)).some((item) => typeof item.panelId === 'string'));
  require('no shared tabs case embeds a space in a value, so the raw-value id is never measured', (entry) =>
    plain(entry) && itemsOf(props(entry)).some((item) => /\s/.test(item.value)));

  // ------------------------------------------------------------------ slots
  require('no shared tabs case renders the tab slot', (entry) => plain(entry) && entry.content?.tab?.numbered === true);

  // --------------------------------------------------------- consumer attrs
  require('no shared tabs case forwards a consumer class together with a style', (entry) =>
    plain(entry) && attrs(entry).class !== undefined && attrs(entry).style !== undefined);
  require('no shared tabs case forwards a consumer id together with a data attribute and an aria-label, so their landing on the root is never measured', (
    entry,
  ) =>
    plain(entry) &&
    attrs(entry).id !== undefined &&
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')) &&
    attrs(entry)['aria-label'] !== undefined);

  // --------------------------------------------------------------- overflow
  const overflows = (entry) => itemsOf(props(entry)).length >= 4;
  require('no shared tabs case lays out right to left without overflow', (entry) =>
    plain(entry) && isRtl(entry) && !overflows(entry) && hasPanel(entry));
  require('no shared tabs case overflows with the first tab selected, so the start scroll state - right button, right fade, unclipped indicator - is never measured', (
    entry,
  ) => plain(entry) && overflows(entry) && !isRtl(entry) && activeIndex(props(entry)) === 0);
  require('no shared tabs case selects a tab that is partly clipped by the right scroll button, so a fractional clipped indicator is never measured', (
    entry,
  ) => plain(entry) && !isRtl(entry) && itemsOf(props(entry)).length === 4 && activeIndex(props(entry)) === 3);
  require('no shared tabs case selects a tab entirely out of view, so the hidden indicator that keeps its offset is never measured', (
    entry,
  ) =>
    plain(entry) &&
    !isRtl(entry) &&
    itemsOf(props(entry)).length >= 7 &&
    activeIndex(props(entry)) === itemsOf(props(entry)).length - 1);
  require('no shared tabs case overflows under dir=rtl, so the mirrored scroll state and the LTR-frame indicator are never measured', (
    entry,
  ) => plain(entry) && overflows(entry) && isRtl(entry));

  // ------------------------------------------------------------ interactions
  //
  // Read as claims. A claim about the selection has to name aria-selected,
  // tabindex, the panel and the focus together, because a port can move any
  // one without the others; and every scenario has to name its event log and
  // whether each key was prevented.
  for (const entry of cases.filter(isInteraction)) {
    const expect = expectOf(entry);
    const single = !entry.group;
    const tabsOfFirst = itemsOf(members(entry)[0]);
    if (expect.selectedValue === undefined) {
      violations.push(`${entry.id} claims nothing about which tab is selected after the gesture`);
    }
    if (!Array.isArray(expect.ariaSelected) || expect.ariaSelected.length !== tabsOfFirst.length) {
      violations.push(`${entry.id} claims nothing about aria-selected on every tab after the gesture`);
    }
    if (!Array.isArray(expect.tabindexes) || expect.tabindexes.length !== tabsOfFirst.length) {
      violations.push(`${entry.id} claims nothing about tabindex on every tab after the gesture`);
    }
    if (Array.isArray(expect.ariaSelected) && Array.isArray(expect.tabindexes)) {
      expect.ariaSelected.forEach((selected, index) => {
        const tabindex = selected === 'true' ? '0' : '-1';
        if (expect.tabindexes[index] !== tabindex) {
          violations.push(
            `${entry.id} claims aria-selected=${selected} with tabindex=${expect.tabindexes[index]} on tab ${index}; the reference keys both to the value`,
          );
        }
        const item = tabsOfFirst[index];
        if (item && (selected === 'true') !== (item.value === expect.selectedValue)) {
          violations.push(
            `${entry.id} claims aria-selected=${selected} on [${item.value}] while selectedValue is [${expect.selectedValue}]`,
          );
        }
      });
    }
    if (expect.panelPresent === undefined || expect.panelLabelledByActive === undefined) {
      violations.push(`${entry.id} claims nothing about the panel after the gesture`);
    } else if (expect.panelPresent !== (hasPanel(entry) && expect.selectedValue !== null)) {
      violations.push(
        `${entry.id} claims panelPresent=${expect.panelPresent}; the reference renders the panel only for a selected tab with a panel slot`,
      );
    } else if (expect.panelLabelledByActive !== (expect.panelPresent ? true : null)) {
      violations.push(
        `${entry.id} claims panelLabelledByActive=${expect.panelLabelledByActive}; a rendered panel is labelled by the selected tab`,
      );
    }
    if (!Array.isArray(expect.events)) {
      violations.push(
        `${entry.id} claims nothing about the change log; a correct state with a missing or doubled notification would pass`,
      );
    } else if (expect.events.length > 0 && expect.events.at(-1)?.value !== expect.selectedValue) {
      violations.push(
        `${entry.id} claims the last change notification carried [${expect.events.at(-1)?.value}] but the selection sits on [${expect.selectedValue}]`,
      );
    }
    if (typeof expect.activates !== 'boolean') {
      violations.push(`${entry.id} claims nothing about native activation`);
    }
    if (expect.focusRole === undefined) {
      violations.push(`${entry.id} claims nothing about where focus ended`);
    }
    if (expect.focusRole === 'tab' && typeof expect.focusValue !== 'string') {
      violations.push(`${entry.id} claims focus on a tab without naming which`);
    }
    if (expect.focusRole !== 'tab' && expect.focusValue !== null && expect.focusValue !== undefined) {
      violations.push(`${entry.id} claims a focused tab value with focus elsewhere`);
    }
    if (!single && !Array.isArray(expect.selectedValues)) {
      violations.push(`${entry.id} drives two instances without claiming the selection of each`);
    }
    if (single && expect.selectedValues !== undefined) {
      violations.push(`${entry.id} claims per-instance selections with a single instance; claim selectedValue`);
    }
    if (!single && expect.focusInstance === undefined) {
      violations.push(`${entry.id} drives two instances without claiming which one holds focus`);
    }
    const keyPresses = stepsOf(entry).filter((step) => step.action === 'pressKey');
    if (keyPresses.length > 0) {
      // A key pressed while focus is on the body reaches no tab and is recorded
      // by nothing inside the case: the truthful claim is an empty list, and
      // the disabled-tab scenario is the one that makes it.
      const allFocuses = stepsOf(entry).filter((step) => step.action === 'focusButton');
      const reaches =
        clicks(entry).length > 0 ||
        (allFocuses.length > 0 &&
          !focuses(entry).some((focus) => disabledValues(members(entry)[0]).includes(tabsOfFirst[focus.index]?.value)));
      const reaching = reaches ? keyPresses.length : 0;
      if (!Array.isArray(expect.keydownPrevented) || expect.keydownPrevented.length !== reaching) {
        violations.push(
          `${entry.id} presses ${keyPresses.length} key(s) without claiming whether each keydown was prevented`,
        );
      } else {
        keyPresses.slice(0, reaching).forEach((step, index) => {
          const handled = NAVIGATION_KEYS.includes(step.key);
          if (expect.keydownPrevented[index] !== handled) {
            violations.push(
              `${entry.id} claims keydownPrevented=${expect.keydownPrevented[index]} for ${JSON.stringify(step.key)}; the reference ${handled ? 'prevents' : 'does not prevent'} it`,
            );
          }
        });
      }
      if (keyPresses.some((step) => ACTIVATION_KEYS.includes(step.key)) && expect.activates !== true) {
        violations.push(
          `${entry.id} presses Enter or Space without claiming a native activation; the reference has no handler for either`,
        );
      }
      if (
        keyPresses.every((step) => !ACTIVATION_KEYS.includes(step.key)) &&
        clicks(entry).length === 0 &&
        expect.activates !== false
      ) {
        violations.push(`${entry.id} navigates by key without claiming that no native click occurred`);
      }
    }
    if (clicks(entry).length > 0 && expect.activates !== true) {
      violations.push(`${entry.id} clicks a tab without claiming a native activation`);
    }
    const scrolls = [...clicks(entry, SCROLL_LEFT), ...clicks(entry, SCROLL_RIGHT)];
    if (scrolls.length > 0) {
      for (const field of [
        'scrollLeft',
        'canScrollLeft',
        'canScrollRight',
        'leftHidden',
        'rightHidden',
        'fades',
        'indicatorOpacity',
        'indicatorTransform',
        'scrolling',
        'scrollbarWidth',
        'settled',
      ]) {
        if (expect[field] === undefined) {
          violations.push(
            `${entry.id} scrolls without claiming ${field}; the scroller state after a button is the whole point of the gesture`,
          );
        }
      }
      if (expect.scrolling !== false || expect.scrollbarWidth !== 'none' || expect.settled !== true) {
        violations.push(
          `${entry.id} scrolls without claiming that the 140 ms scrolling state ended before the measurement`,
        );
      }
    }
    if (entry.interaction.matches !== undefined) {
      const target = cases.find((candidate) => candidate.id === entry.interaction.matches);
      if (!target || isInteraction(target)) {
        violations.push(
          `${entry.id} converges on [${entry.interaction.matches}], which is not an initial case in the catalog`,
        );
      } else if (single && !target.group && expect.selectedValue !== (activeValue(props(target)) ?? null)) {
        violations.push(
          `${entry.id} expects selectedValue=${expect.selectedValue} but converges on a case that renders ${activeValue(props(target))}`,
        );
      } else if (!single && (!target.group || target.group.length !== entry.group.length)) {
        violations.push(
          `${entry.id} drives ${entry.group.length} instances but converges on a case with a different shape`,
        );
      } else if (entry.interaction.postOnly !== undefined) {
        violations.push(`${entry.id} both converges and claims to be post-only`);
      }
    } else if (typeof entry.interaction.postOnly !== 'string' || entry.interaction.postOnly === '') {
      violations.push(
        `${entry.id} names no initial case to converge on and gives no reason; a gesture on a persistent DOM has to land on a fresh render's DOM`,
      );
    } else if (!(expect.scrollLeft > 0)) {
      violations.push(
        `${entry.id} is post-only without leaving the viewport scrolled; only a scrolled viewport has no fresh render`,
      );
    }
    if (stepsOf(entry).length === 0) violations.push(`${entry.id} declares an interaction with no steps`);
  }

  const single = (entry) => isInteraction(entry) && !entry.group;
  const moved = (entry) => (expectOf(entry).events?.length ?? 0) > 0;
  const stayed = (entry) => expectOf(entry).events?.length === 0;
  const clickAt = (entry, index) =>
    clicks(entry).length === 1 && clicks(entry)[0].index === index && stepsOf(entry).length === 1;
  const navigates = (entry, key) =>
    single(entry) &&
    stepsOf(entry).length === 2 &&
    stepsOf(entry)[0].action === 'focusButton' &&
    stepsOf(entry)[0].selector === TAB &&
    presses(entry, key);
  const from = (entry) => focuses(entry)[0]?.index;
  const disabledMiddle = (entry) =>
    disabledValues(props(entry)).length === 1 && itemsOf(props(entry)).findIndex((item) => item.disabled) === 1;
  const clean = (entry) =>
    disabledValues(props(entry)).length === 0 && !isRtl(entry) && itemsOf(props(entry)).length === 3;
  const selects = (entry, index) => expectOf(entry).selectedValue === itemsOf(props(entry))[index]?.value;
  const focusesSelected = (entry) =>
    expectOf(entry).focusValue === expectOf(entry).selectedValue && expectOf(entry).focusRole === 'tab';

  require('no shared tabs case proves a pointer click on another tab moves the selection and lands on the target case', (
    entry,
  ) =>
    single(entry) &&
    clean(entry) &&
    hasPanel(entry) &&
    clickAt(entry, 1) &&
    moved(entry) &&
    activeIndex(props(entry)) === 0 &&
    selects(entry, 1) &&
    focusesSelected(entry) &&
    typeof entry.interaction.matches === 'string');
  require('no shared tabs case clicks the current tab, so "the pair is emitted again and nothing changes" is never driven', (
    entry,
  ) =>
    single(entry) &&
    clean(entry) &&
    clickAt(entry, 0) &&
    activeIndex(props(entry)) === 0 &&
    expectOf(entry).events?.length === 1 &&
    expectOf(entry).events[0].value === expectOf(entry).selectedValue &&
    expectOf(entry).activates === true);
  require('no shared tabs case claims aria-selected in the tree after a click, so the exposed selected state is never an independent proof', (
    entry,
  ) =>
    single(entry) &&
    clicks(entry).length > 0 &&
    expectOf(entry)['a11y:secondTab.selected'] === 'true' &&
    expectOf(entry)['a11y:firstTab.selected'] === 'false');
  require('no shared tabs case proves Enter activates natively - one click counted, the key not prevented', (entry) =>
    navigates(entry, 'Enter') &&
    moved(entry) &&
    expectOf(entry).activates === true &&
    expectOf(entry).keydownPrevented?.[0] === false);
  require('no shared tabs case proves Space activates natively - one click counted, the key not prevented', (entry) =>
    navigates(entry, ' ') &&
    moved(entry) &&
    expectOf(entry).activates === true &&
    expectOf(entry).keydownPrevented?.[0] === false);
  require('no shared tabs case proves ArrowRight activates and focuses the next tab without a native click', (entry) =>
    navigates(entry, 'ArrowRight') &&
    clean(entry) &&
    from(entry) === 0 &&
    selects(entry, 1) &&
    focusesSelected(entry) &&
    expectOf(entry).activates === false);
  require('no shared tabs case proves ArrowLeft goes to the previous tab', (entry) =>
    navigates(entry, 'ArrowLeft') && clean(entry) && from(entry) === 1 && selects(entry, 0) && focusesSelected(entry));
  require('no shared tabs case proves ArrowDown moves forward on the horizontal tablist, prevented', (entry) =>
    navigates(entry, 'ArrowDown') &&
    clean(entry) &&
    from(entry) === 0 &&
    selects(entry, 1) &&
    focusesSelected(entry) &&
    expectOf(entry).keydownPrevented?.[0] === true);
  require('no shared tabs case proves ArrowUp moves backward on the horizontal tablist, prevented', (entry) =>
    navigates(entry, 'ArrowUp') &&
    clean(entry) &&
    from(entry) === 1 &&
    selects(entry, 0) &&
    focusesSelected(entry) &&
    expectOf(entry).keydownPrevented?.[0] === true);
  require('no shared tabs case proves Home activates and focuses the first tab', (entry) =>
    navigates(entry, 'Home') && clean(entry) && from(entry) === 2 && selects(entry, 0) && focusesSelected(entry));
  require('no shared tabs case proves End activates and focuses the last tab', (entry) =>
    navigates(entry, 'End') && clean(entry) && from(entry) === 0 && selects(entry, 2) && focusesSelected(entry));
  require('no shared tabs case proves ArrowRight wraps from the last tab to the first', (entry) =>
    navigates(entry, 'ArrowRight') && clean(entry) && from(entry) === 2 && selects(entry, 0) && focusesSelected(entry));
  require('no shared tabs case proves ArrowLeft wraps from the first tab to the last', (entry) =>
    navigates(entry, 'ArrowLeft') && clean(entry) && from(entry) === 0 && selects(entry, 2) && focusesSelected(entry));
  require('no shared tabs case proves ArrowRight skips a disabled tab', (entry) =>
    navigates(entry, 'ArrowRight') &&
    disabledMiddle(entry) &&
    from(entry) === 0 &&
    selects(entry, 2) &&
    focusesSelected(entry));
  require('no shared tabs case proves ArrowLeft skips a disabled tab', (entry) =>
    navigates(entry, 'ArrowLeft') &&
    disabledMiddle(entry) &&
    from(entry) === 2 &&
    selects(entry, 0) &&
    focusesSelected(entry));
  require('no shared tabs case proves End skips a disabled last tab', (entry) =>
    navigates(entry, 'End') &&
    disabledValues(props(entry))[0] === itemsOf(props(entry))[2]?.value &&
    selects(entry, 1));
  require('no shared tabs case proves a disabled tab takes no focus', (entry) =>
    single(entry) &&
    stepsOf(entry).length === 1 &&
    focuses(entry).some((step) => disabledValues(props(entry)).includes(itemsOf(props(entry))[step.index]?.value)) &&
    expectOf(entry).focusRole === 'body' &&
    stayed(entry) &&
    expectOf(entry)['a11y:secondTab.disabled'] === 'true');
  require('no shared tabs case proves focus alone changes nothing: the focused tab and the selected tab differ', (
    entry,
  ) =>
    single(entry) &&
    stepsOf(entry).length === 1 &&
    stepsOf(entry)[0].action === 'focusButton' &&
    expectOf(entry).focusRole === 'tab' &&
    expectOf(entry).focusValue !== expectOf(entry).selectedValue &&
    stayed(entry));
  require('no shared tabs case proves navigation starts from the focused tab and not the selected one', (entry) =>
    navigates(entry, 'ArrowLeft') &&
    clean(entry) &&
    from(entry) === 2 &&
    activeIndex(props(entry)) === 0 &&
    selects(entry, 1) &&
    focusesSelected(entry));
  require('no shared tabs case proves Tab from the selected tab lands on the panel - unhandled, not prevented, nothing selected', (
    entry,
  ) =>
    navigates(entry, 'Tab') &&
    hasPanel(entry) &&
    expectOf(entry).focusRole === 'panel' &&
    stayed(entry) &&
    expectOf(entry).keydownPrevented?.[0] === false);
  require('no shared tabs case proves Tab from a consumer control before the tabs lands on the tabindex=0 tab and skips the first, so the roving tabindex is never load-bearing', (
    entry,
  ) =>
    single(entry) &&
    entry.content?.before?.control !== undefined &&
    focuses(entry, '.parity-before').length === 1 &&
    presses(entry, 'Tab') &&
    activeIndex(props(entry)) >= 1 &&
    focusesSelected(entry) &&
    stayed(entry));
  require('no shared tabs case proves ArrowLeft under dir=rtl moves forward', (entry) =>
    navigates(entry, 'ArrowLeft') && isRtl(entry) && from(entry) === 0 && selects(entry, 1) && focusesSelected(entry));
  require('no shared tabs case proves ArrowRight under dir=rtl moves backward', (entry) =>
    navigates(entry, 'ArrowRight') && isRtl(entry) && from(entry) === 0 && selects(entry, 2) && focusesSelected(entry));
  require('no shared tabs case round-trips the controlled prop through a consumer that writes the value back', (
    entry,
  ) =>
    single(entry) &&
    typeof props(entry).modelValue === 'string' &&
    clicks(entry).length === 1 &&
    moved(entry) &&
    typeof entry.interaction.matches === 'string');
  require('no shared tabs case clicks in the second of two siblings sharing values and expects the first unchanged', (
    entry,
  ) =>
    (entry.group?.length ?? 0) === 2 &&
    clicks(entry).length === 1 &&
    clicks(entry)[0].index >= itemsOf(entry.group[0]).length &&
    Array.isArray(expectOf(entry).selectedValues) &&
    expectOf(entry).selectedValues[0] === activeValue(entry.group[0]) &&
    expectOf(entry).focusInstance === 1);
  require('no shared tabs case navigates by key inside the second of two siblings sharing values and expects focus to stay there', (
    entry,
  ) =>
    (entry.group?.length ?? 0) === 2 &&
    focuses(entry).length === 1 &&
    focuses(entry)[0].index >= itemsOf(entry.group[0]).length &&
    presses(entry, 'ArrowRight') &&
    expectOf(entry).focusInstance === 1 &&
    expectOf(entry).selectedValues?.[0] === activeValue(entry.group[0]));
  require('no shared tabs case drives two selection changes in one scenario, so a panel patched twice is never measured', (
    entry,
  ) =>
    single(entry) &&
    clicks(entry).length === 2 &&
    (expectOf(entry).events?.length ?? 0) === 2 &&
    typeof entry.interaction.matches === 'string');
  require('no shared tabs case clicks the partly clipped tab of an overflowing list and claims the scrolled indicator after it', (
    entry,
  ) =>
    single(entry) &&
    itemsOf(props(entry)).length === 4 &&
    clickAt(entry, 3) &&
    selects(entry, 3) &&
    expectOf(entry).indicatorOpacity === '1' &&
    typeof expectOf(entry).indicatorTransform === 'string' &&
    typeof expectOf(entry).indicatorWidth === 'string' &&
    expectOf(entry).scrollLeft > 0);
  require('no shared tabs case scrolls a list to its end with the right button, so the clamped scroll and the left-clipped indicator are never measured', (
    entry,
  ) =>
    single(entry) &&
    clicks(entry, SCROLL_RIGHT).length === 1 &&
    stepsOf(entry).length === 1 &&
    expectOf(entry).canScrollRight === false &&
    expectOf(entry).canScrollLeft === true &&
    expectOf(entry).indicatorTransform === 'translateX(28px)' &&
    expectOf(entry).indicatorOpacity === '1');
  require('no shared tabs case scrolls a long list into its middle, so both buttons, both fades and a hidden indicator are never measured', (
    entry,
  ) =>
    single(entry) &&
    clicks(entry, SCROLL_RIGHT).length === 1 &&
    stepsOf(entry).length === 1 &&
    expectOf(entry).canScrollRight === true &&
    expectOf(entry).canScrollLeft === true &&
    expectOf(entry).indicatorOpacity === '0' &&
    expectOf(entry).fades?.length === 2);
  require('no shared tabs case scrolls right and back left, so a scroll gesture converging on the fresh render is never measured', (
    entry,
  ) =>
    single(entry) &&
    clicks(entry, SCROLL_RIGHT).length === 1 &&
    clicks(entry, SCROLL_LEFT).length === 1 &&
    expectOf(entry).scrollLeft === 0 &&
    typeof entry.interaction.matches === 'string');
  require('no shared tabs case clicks the consumer control inside the panel and expects the tabs untouched', (entry) =>
    single(entry) &&
    clicks(entry, '.parity-panel-control').length === 1 &&
    stayed(entry) &&
    expectOf(entry).activates === false &&
    expectOf(entry).focusRole === 'other-inside-case');

  return violations;
}
