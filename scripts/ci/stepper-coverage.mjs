// What the VfStepper catalog has to prove, read as semantics.
//
// The second coverage module for a component that owns controls, and the
// first for one that owns several of the same role. Three halves:
//
//   - the state half: each way the active value can be decided (nothing,
//     defaultValue, modelValue, modelValue beating defaultValue, an unknown
//     value, an empty string), disabled in each position relative to the
//     current step and as the seed itself, every item disabled, the count
//     edge cases (none, one, two) and the fractional factors that only a
//     JavaScript serialisation writes, both orientations with both content
//     positions and a position from the wrong axis, descriptions present and
//     absent, and the consumer's class, style and attributes;
//   - the interaction half: a pointer click forward and backward, a click on
//     the current step that changes nothing, Enter and Space that activate
//     *natively* - one click counted, the key not prevented - each arrow of
//     each axis, each arrow of the wrong axis ignored and not prevented, Home
//     and End, wrapping in both directions, skipping a disabled step in both
//     directions and for Home and End, a disabled trigger that takes no
//     focus, a controlled consumer that writes the value back, a focus that
//     changes nothing, and two siblings whose state stays apart. Each is
//     read as the claim the case makes, not as the keys it presses, and each
//     claim about the selection has to name aria-current, the item classes,
//     the trigger's own modifier and the factor together - four halves of
//     one state that a port can move separately;
//   - the ownership half: every case declares how many controls the
//     component renders - one trigger per item, summed over every instance,
//     zero for an empty list - and whether a consumer control stands beside
//     it. The catalog cannot buy the component a control by naming a slot it
//     does not have, and cannot lose a trigger by declaring `items.length`
//     of a different list.
//
// The vocabulary is closed. A prop the reference does not declare, a slot it
// does not render, a key it does not handle - `Escape`, `PageDown` - and an
// accordion-shaped claim (`expanded`, `panelPresent`) are rejected outright,
// because a case that drove or claimed them would be describing a component
// the reference is not.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.

const PROPS = ['items', 'modelValue', 'defaultValue', 'orientation', 'contentPosition', 'ariaLabel'];
const ITEM_KEYS = ['value', 'label', 'description', 'disabled'];
const CONTENT_KEYS = ['beside'];
const BESIDE_KEYS = ['control'];
const NAVIGATION_KEYS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
const ACTIVATION_KEYS = ['Enter', ' '];
const KEYS = [...ACTIVATION_KEYS, ...NAVIGATION_KEYS];
const STEP_ACTIONS = ['clickButton', 'focusButton', 'pressKey'];
const TRIGGER = '.vf-stepper__trigger';
const EXPECT_FIELDS = [
  'activates',
  'currentValue',
  'currentValues',
  'currentClassValue',
  'itemStates',
  'progressFactor',
  'disabledValues',
  'focusValue',
  'focusRole',
  'keydownPrevented',
  'events',
];
const A11Y_ROLES = ['firstTrigger', 'secondTrigger', 'thirdTrigger', 'nav'];
const A11Y_STATES = ['disabled', 'focusable'];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [props(entry)]);
const itemsOf = (member) => (Array.isArray(member.items) ? member.items : []);
const stepsOf = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const isInteraction = (entry) => entry.interaction !== undefined;
const clicks = (entry) => stepsOf(entry).filter((step) => step.action === 'clickButton');
const presses = (entry, key) => stepsOf(entry).some((step) => step.action === 'pressKey' && step.key === key);
const focuses = (entry) => stepsOf(entry).filter((step) => step.action === 'focusButton');
const orientation = (entry) => props(entry).orientation ?? 'horizontal';
const plain = (entry) => !isInteraction(entry) && !entry.group && entry.content === undefined;
const disabledValues = (member) =>
  itemsOf(member)
    .filter((item) => item.disabled === true)
    .map((item) => item.value);

/** The active value a member's props resolve to - the shared rule, restated as data. */
function activeValue(member) {
  const fallback = itemsOf(member).find((item) => !item.disabled)?.value;

  return member.modelValue ?? member.defaultValue ?? fallback;
}

function activeIndex(member) {
  return itemsOf(member).findIndex((item) => item.value === activeValue(member));
}

/** How many triggers a case renders: one per item, over every instance. */
function triggerCount(entry) {
  return members(entry).reduce((total, member) => total + itemsOf(member).length, 0);
}

/** Every way the VfStepper catalog's coverage can be eroded. */
export function stepperCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    for (const member of members(entry)) {
      for (const name of Object.keys(member)) {
        if (!PROPS.includes(name)) {
          violations.push(`${entry.id} declares prop [${name}], which the reference VfStepper does not have`);
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
          `${entry.id} declares slot [${name}]. The reference VfStepper renders no slot; a consumer control can only stand beside it`,
        );
      }
    }
    for (const name of Object.keys(entry.content?.beside ?? {})) {
      if (!BESIDE_KEYS.includes(name)) violations.push(`${entry.id} puts [${name}] in the beside vocabulary`);
    }
    for (const step of stepsOf(entry)) {
      if (!STEP_ACTIONS.includes(step.action)) {
        violations.push(`${entry.id} drives [${step.action}], which is not a stepper gesture`);
      }
      if ((step.action === 'clickButton' || step.action === 'focusButton') && step.selector !== TRIGGER) {
        violations.push(
          `${entry.id} ${step.action} targets [${step.selector}]; the only stepper control is ${TRIGGER}`,
        );
      }
      if ((step.action === 'clickButton' || step.action === 'focusButton') && !Number.isInteger(step.index)) {
        violations.push(
          `${entry.id} ${step.action} names no index. A stepper owns several triggers, and a gesture that does not say which one it drives is not a claim`,
        );
      }
      if (step.action === 'pressKey' && !KEYS.includes(step.key)) {
        violations.push(
          `${entry.id} presses [${step.key}]. The reference handles the six navigation keys and leaves Enter and Space to the browser; a case that drove another key would be describing a component the reference is not`,
        );
      }
    }
    for (const name of Object.keys(expectOf(entry))) {
      const a11y = name.startsWith('a11y:') ? name.slice('a11y:'.length).split('.') : null;
      if (a11y) {
        if (!A11Y_ROLES.includes(a11y[0]) || !A11Y_STATES.includes(a11y[1])) {
          violations.push(
            `${entry.id} expects [${name}]. The tree exposes disabled and focusable for a trigger; it does not expose the current step (Chrome 153 derives no changing property from aria-current=step), so a claim on it would be vacuous`,
          );
        }
        continue;
      }
      if (!EXPECT_FIELDS.includes(name))
        violations.push(`${entry.id} expects [${name}], which no stepper snapshot records`);
    }
  }

  // ------------------------------------------------------------- ownership
  for (const entry of cases) {
    const declared = entry.componentInteractive;
    const expected = triggerCount(entry);

    if (!Number.isInteger(declared)) {
      violations.push(
        `${entry.id} declares no componentInteractive budget. Every stepper case owns one trigger per item, and a case that does not say how many cannot be measured against anything`,
      );
    } else if (declared !== expected) {
      violations.push(
        `${entry.id} declares ${declared} component-owned control(s) but renders ${expected} trigger(s); one per item over every instance, disabled ones included`,
      );
    }

    const consumer = entry.consumerInteractive ?? 0;
    const beside = entry.content?.beside?.control !== undefined ? 1 : 0;
    if (consumer !== beside) {
      violations.push(
        `${entry.id} declares ${consumer} consumer control(s) but ${beside} stand(s) beside the stepper. The component has no slot to put one in`,
      );
    }
    if (entry.interaction?.consumerInteractive !== undefined) {
      violations.push(`${entry.id} declares a post-interaction consumer budget; nothing a stepper does can change it`);
    }

    const values = members(entry).map((member) => itemsOf(member).map((item) => item.value));
    const seen = new Set();
    for (const list of values) {
      for (const value of list) {
        if (seen.has(value)) {
          violations.push(
            `${entry.id} shares the value [${value}] between two triggers. The reference moves keyboard focus with a document-wide lookup, so a shared value makes the case order-dependent; the quirk is pinned by the characterization suite, not the catalog`,
          );
        }
        seen.add(value);
      }
    }
  }

  require('no shared stepper case renders an empty items list, so a component-owned budget of zero is never measured', (
    entry,
  ) => plain(entry) && itemsOf(props(entry)).length === 0 && entry.componentInteractive === 0);
  require('no shared stepper case renders two siblings, so two instances owning five triggers between them are never measured', (
    entry,
  ) =>
    (entry.group?.length ?? 0) === 2 &&
    entry.componentInteractive === triggerCount(entry) &&
    !isInteraction(entry) &&
    entry.componentInteractive >= 4);
  require('no shared stepper case puts a consumer control beside the stepper, so the ownership classification is never measured against a neighbour', (
    entry,
  ) => entry.consumerInteractive === 1 && entry.componentInteractive >= 1 && !isInteraction(entry));

  // ---------------------------------------------------------- initial state
  require('no shared stepper case is rendered with neither modelValue nor defaultValue, so the fallback itself is never measured', (
    entry,
  ) =>
    plain(entry) &&
    props(entry).modelValue === undefined &&
    props(entry).defaultValue === undefined &&
    disabledValues(props(entry)).length === 0 &&
    itemsOf(props(entry)).length === 3 &&
    orientation(entry) === 'horizontal' &&
    props(entry).contentPosition === undefined);
  require('no shared stepper case seeds a middle step through defaultValue alone', (entry) =>
    plain(entry) &&
    props(entry).defaultValue !== undefined &&
    props(entry).modelValue === undefined &&
    activeIndex(props(entry)) === 1 &&
    itemsOf(props(entry)).length === 3 &&
    orientation(entry) === 'horizontal');
  require('no shared stepper case seeds the last step through defaultValue alone', (entry) =>
    plain(entry) &&
    props(entry).defaultValue !== undefined &&
    props(entry).modelValue === undefined &&
    activeIndex(props(entry)) === itemsOf(props(entry)).length - 1 &&
    itemsOf(props(entry)).length === 3);
  require('no shared stepper case selects through the controlled modelValue alone', (entry) =>
    plain(entry) &&
    props(entry).modelValue !== undefined &&
    props(entry).defaultValue === undefined &&
    activeIndex(props(entry)) >= 0);
  require('no shared stepper case passes modelValue together with a different defaultValue, so the precedence is assumed rather than measured', (
    entry,
  ) =>
    plain(entry) &&
    props(entry).modelValue !== undefined &&
    props(entry).defaultValue !== undefined &&
    props(entry).modelValue !== props(entry).defaultValue);
  require('no shared stepper case passes an unknown controlled modelValue, so "no current step, factor 0" is never measured', (
    entry,
  ) =>
    plain(entry) &&
    typeof props(entry).modelValue === 'string' &&
    props(entry).modelValue !== '' &&
    activeIndex(props(entry)) === -1);
  require('no shared stepper case passes an empty-string modelValue, so the ?? boundary is never measured', (entry) =>
    plain(entry) && props(entry).modelValue === '');

  // ----------------------------------------------------------------- disabled
  const disabledAt = (entry, position) => {
    const member = props(entry);
    const disabled = disabledValues(member);
    if (!plain(entry) || disabled.length !== 1) return false;
    const index = itemsOf(member).findIndex((item) => item.value === disabled[0]);
    const active = activeIndex(member);
    return position === 'before' ? index < active : position === 'after' ? index > active : index === active;
  };
  require('no shared stepper case disables a step before the current one, so "disabled beats complete" is never measured', (
    entry,
  ) => disabledAt(entry, 'before'));
  require('no shared stepper case disables a step after the current one', (entry) => disabledAt(entry, 'after'));
  require('no shared stepper case disables the first step with nothing seeded, so the fallback skipping it is never measured', (
    entry,
  ) =>
    plain(entry) &&
    disabledValues(props(entry))[0] === itemsOf(props(entry))[0]?.value &&
    props(entry).defaultValue === undefined &&
    props(entry).modelValue === undefined);
  require('no shared stepper case seeds a disabled step, so "the seed survives, complete before it, no aria-current" is never measured', (
    entry,
  ) => disabledAt(entry, 'at'));
  require('no shared stepper case disables every step', (entry) =>
    plain(entry) &&
    itemsOf(props(entry)).length > 0 &&
    disabledValues(props(entry)).length === itemsOf(props(entry)).length);

  // -------------------------------------------------------- counts and factor
  const factorOf = (entry) => {
    const member = props(entry);
    const count = itemsOf(member).length;
    if (count <= 1) return null;
    return String(Math.max(0, activeIndex(member)) / (count - 1));
  };
  require('no shared stepper case renders a single item, so "the count only, no factor" is never measured', (entry) =>
    plain(entry) && itemsOf(props(entry)).length === 1);
  require('no shared stepper case renders two items with the second current, so factor 1 with the smallest count is never measured', (
    entry,
  ) => plain(entry) && itemsOf(props(entry)).length === 2 && factorOf(entry) === '1');
  require('no shared stepper case writes a factor of 1/3, so a fourteen-digit serialisation would never be measured', (
    entry,
  ) => plain(entry) && factorOf(entry) === '0.3333333333333333');
  require('no shared stepper case writes a factor of 2/3', (entry) =>
    plain(entry) && factorOf(entry) === '0.6666666666666666');
  require('no shared stepper case writes a seventeen-digit factor (1/6), so the round-trip length itself is never measured', (
    entry,
  ) => plain(entry) && factorOf(entry) === '0.16666666666666666');
  require('no shared stepper case writes a factor whose last digit rounds up (5/6)', (entry) =>
    plain(entry) && factorOf(entry) === '0.8333333333333334');

  // ---------------------------------------------------------------- layout
  require('no shared stepper case is vertical with the default content position', (entry) =>
    plain(entry) &&
    orientation(entry) === 'vertical' &&
    props(entry).contentPosition === undefined &&
    disabledValues(props(entry)).length === 0);
  require('no shared stepper case is vertical with content-start', (entry) =>
    plain(entry) && orientation(entry) === 'vertical' && props(entry).contentPosition === 'start');
  require('no shared stepper case is horizontal with content-above', (entry) =>
    plain(entry) && orientation(entry) === 'horizontal' && props(entry).contentPosition === 'above');
  require('no shared stepper case passes a horizontal position to a vertical stepper, so the axis fallback is never measured', (
    entry,
  ) => plain(entry) && orientation(entry) === 'vertical' && ['above', 'below'].includes(props(entry).contentPosition));
  require('no shared stepper case passes a vertical position to a horizontal stepper', (entry) =>
    plain(entry) && orientation(entry) === 'horizontal' && ['start', 'end'].includes(props(entry).contentPosition));
  require('no shared stepper case carries a description on every item', (entry) =>
    plain(entry) &&
    itemsOf(props(entry)).length >= 3 &&
    itemsOf(props(entry)).every((item) => typeof item.description === 'string' && item.description !== '') &&
    orientation(entry) === 'horizontal');
  require('no shared stepper case carries no description at all, so the absent span is never measured on every item', (
    entry,
  ) =>
    plain(entry) &&
    itemsOf(props(entry)).length >= 3 &&
    itemsOf(props(entry)).every((item) => item.description === undefined));
  require('no shared stepper case is vertical with descriptions', (entry) =>
    plain(entry) && orientation(entry) === 'vertical' && itemsOf(props(entry)).some((item) => item.description));
  require('no shared stepper case passes a label long enough to wrap', (entry) =>
    plain(entry) && itemsOf(props(entry)).some((item) => typeof item.label === 'string' && item.label.length > 60));

  // --------------------------------------------------------- consumer attrs
  require('no shared stepper case passes a custom ariaLabel', (entry) =>
    plain(entry) && props(entry).ariaLabel !== undefined);
  require('no shared stepper case forwards a consumer class', (entry) => attrs(entry).class !== undefined);
  require('no shared stepper case forwards a consumer style', (entry) => attrs(entry).style !== undefined);
  require('no shared stepper case forwards a consumer id together with a data attribute, so their landing on the nav is never measured', (
    entry,
  ) => attrs(entry).id !== undefined && Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared stepper case forwards a consumer aria-current, so nothing proves it lands on the nav and not a trigger', (
    entry,
  ) => attrs(entry)['aria-current'] !== undefined);

  // ------------------------------------------------------------ interactions
  //
  // Read as claims. A claim about the selection has to name all four halves
  // - aria-current, the trigger modifier, the item classes and the factor -
  // because a port can move any one without the others; and every scenario
  // has to name its event log, its focus and whether each key was prevented.
  for (const entry of cases.filter(isInteraction)) {
    const expect = expectOf(entry);
    const single = !entry.group;
    if (single && expect.currentValue === undefined) {
      violations.push(`${entry.id} claims nothing about which trigger carries aria-current after the gesture`);
    }
    if (single && !Array.isArray(expect.itemStates)) {
      violations.push(`${entry.id} claims nothing about the item classes after the gesture`);
    }
    if (single && expect.events !== undefined && expect.events.length > 0) {
      if (expect.currentClassValue !== expect.currentValue) {
        violations.push(
          `${entry.id} claims a selection change without claiming the trigger's own current modifier moved with aria-current`,
        );
      }
      if (typeof expect.progressFactor !== 'string') {
        violations.push(`${entry.id} claims a selection change without claiming the progress factor moved with it`);
      }
      const last = expect.events.at(-1)?.value;
      if (last !== expect.currentValue) {
        violations.push(
          `${entry.id} claims the last change notification carried [${last}] but aria-current sits on [${expect.currentValue}]`,
        );
      }
      const states = expect.itemStates ?? [];
      const current = states.indexOf('current');
      if (
        current === -1 ||
        states.slice(0, current).some((state) => state === 'upcoming') ||
        states.slice(current + 1).some((state) => state === 'complete')
      ) {
        violations.push(
          `${entry.id} claims item classes that are not a state the reference produces: ${states.join(', ')}`,
        );
      }
    }
    if (!entry.group && expect.currentValues !== undefined) {
      violations.push(`${entry.id} claims per-instance values with a single instance; claim currentValue`);
    }
    if (entry.group && !Array.isArray(expect.currentValues)) {
      violations.push(`${entry.id} drives two instances without claiming the current step of each`);
    }
    if (!Array.isArray(expect.events)) {
      violations.push(
        `${entry.id} claims nothing about the change log; a correct state with a missing or doubled notification would pass`,
      );
    }
    const keyPresses = stepsOf(entry).filter((step) => step.action === 'pressKey');
    if (keyPresses.length > 0) {
      // A key pressed while focus is on the body reaches no trigger and is
      // recorded by nothing inside the case: the truthful claim is an empty
      // list, and the disabled-trigger scenario is the one that makes it.
      const reaching = expect.focusRole === 'body' ? 0 : keyPresses.length;
      if (!Array.isArray(expect.keydownPrevented) || expect.keydownPrevented.length !== reaching) {
        violations.push(
          `${entry.id} presses ${keyPresses.length} key(s) without claiming whether each keydown was prevented`,
        );
      } else {
        keyPresses.slice(0, reaching).forEach((step, index) => {
          const handled = NAVIGATION_KEYS.includes(step.key) && onAxis(entry, step.key);
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
        keyPresses.every((step) => NAVIGATION_KEYS.includes(step.key)) &&
        clicks(entry).length === 0 &&
        expect.activates !== false
      ) {
        violations.push(`${entry.id} navigates by key without claiming that no native click occurred`);
      }
    }
    if (focuses(entry).length > 0 || keyPresses.length > 0 || clicks(entry).length > 0) {
      if (expect.focusValue === undefined && expect.focusRole === undefined) {
        violations.push(`${entry.id} claims nothing about where focus ended`);
      }
    }
    if (clicks(entry).length > 0 && expect.activates !== true) {
      violations.push(`${entry.id} clicks a trigger without claiming a native activation`);
    }
    if (entry.interaction.matches !== undefined) {
      const target = cases.find((candidate) => candidate.id === entry.interaction.matches);
      if (!target || isInteraction(target)) {
        violations.push(
          `${entry.id} converges on [${entry.interaction.matches}], which is not an initial case in the catalog`,
        );
      } else if (
        single &&
        !target.group &&
        activeValueOfCurrent(expect) !== activeValue(props(target)) &&
        expect.currentValue !== null
      ) {
        violations.push(
          `${entry.id} expects currentValue=${expect.currentValue} but converges on a case that renders ${activeValue(props(target))}`,
        );
      }
    } else if (single) {
      violations.push(
        `${entry.id} names no initial case to converge on; a gesture on a persistent DOM has to land on a fresh render's DOM`,
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
    single(entry) && stepsOf(entry).length === 2 && stepsOf(entry)[0].action === 'focusButton' && presses(entry, key);
  const from = (entry) => focuses(entry)[0]?.index;
  const disabledMiddle = (entry) =>
    disabledValues(props(entry)).length === 1 && itemsOf(props(entry)).findIndex((item) => item.disabled) === 1;

  require('no shared stepper case proves a pointer click moves the selection forward and lands on the target case', (
    entry,
  ) =>
    single(entry) &&
    clickAt(entry, 1) &&
    moved(entry) &&
    activeIndex(props(entry)) === 0 &&
    typeof entry.interaction.matches === 'string');
  require('no shared stepper case proves a pointer click moves the selection backward', (entry) =>
    single(entry) && clickAt(entry, 0) && moved(entry) && activeIndex(props(entry)) === 2);
  require('no shared stepper case clicks the current trigger, so "the click is counted and the change suppressed" is never driven', (
    entry,
  ) =>
    single(entry) &&
    clickAt(entry, 0) &&
    stayed(entry) &&
    activeIndex(props(entry)) === 0 &&
    expectOf(entry).activates === true);
  require('no shared stepper case proves Enter activates natively - one click counted, the key not prevented', (
    entry,
  ) =>
    navigates(entry, 'Enter') &&
    moved(entry) &&
    expectOf(entry).activates === true &&
    expectOf(entry).keydownPrevented?.[0] === false);
  require('no shared stepper case proves Space activates natively - one click counted, the key not prevented', (
    entry,
  ) =>
    navigates(entry, ' ') &&
    moved(entry) &&
    expectOf(entry).activates === true &&
    expectOf(entry).keydownPrevented?.[0] === false);
  require('no shared stepper case proves ArrowRight on a horizontal stepper activates and focuses the next step without a native click', (
    entry,
  ) =>
    navigates(entry, 'ArrowRight') &&
    orientation(entry) === 'horizontal' &&
    from(entry) === 0 &&
    moved(entry) &&
    expectOf(entry).activates === false &&
    expectOf(entry).focusValue === expectOf(entry).currentValue &&
    disabledValues(props(entry)).length === 0);
  require('no shared stepper case proves ArrowLeft on a horizontal stepper goes to the previous step', (entry) =>
    navigates(entry, 'ArrowLeft') &&
    orientation(entry) === 'horizontal' &&
    from(entry) === 2 &&
    moved(entry) &&
    disabledValues(props(entry)).length === 0);
  require('no shared stepper case proves ArrowDown on a horizontal stepper is ignored and not prevented', (entry) =>
    navigates(entry, 'ArrowDown') &&
    orientation(entry) === 'horizontal' &&
    stayed(entry) &&
    expectOf(entry).keydownPrevented?.[0] === false);
  require('no shared stepper case proves ArrowDown on a vertical stepper activates and focuses the next step', (
    entry,
  ) =>
    navigates(entry, 'ArrowDown') &&
    orientation(entry) === 'vertical' &&
    moved(entry) &&
    expectOf(entry).focusValue === expectOf(entry).currentValue);
  require('no shared stepper case proves ArrowUp on a vertical stepper goes to the previous step', (entry) =>
    navigates(entry, 'ArrowUp') && orientation(entry) === 'vertical' && moved(entry));
  require('no shared stepper case proves ArrowRight on a vertical stepper is ignored and not prevented', (entry) =>
    navigates(entry, 'ArrowRight') &&
    orientation(entry) === 'vertical' &&
    stayed(entry) &&
    expectOf(entry).keydownPrevented?.[0] === false);
  require('no shared stepper case proves Home activates and focuses the first enabled step', (entry) =>
    navigates(entry, 'Home') && moved(entry) && from(entry) === 2 && disabledValues(props(entry)).length === 0);
  require('no shared stepper case proves End activates and focuses the last enabled step', (entry) =>
    navigates(entry, 'End') && moved(entry) && from(entry) === 0 && disabledValues(props(entry)).length === 0);
  require('no shared stepper case proves Home on the already-current first step is prevented and emits nothing', (
    entry,
  ) =>
    navigates(entry, 'Home') && stayed(entry) && from(entry) === 0 && expectOf(entry).keydownPrevented?.[0] === true);
  require('no shared stepper case proves ArrowRight skips a disabled step', (entry) =>
    navigates(entry, 'ArrowRight') &&
    disabledMiddle(entry) &&
    from(entry) === 0 &&
    expectOf(entry).currentValue === itemsOf(props(entry))[2]?.value);
  require('no shared stepper case proves ArrowLeft skips a disabled step', (entry) =>
    navigates(entry, 'ArrowLeft') &&
    disabledMiddle(entry) &&
    from(entry) === 2 &&
    expectOf(entry).currentValue === itemsOf(props(entry))[0]?.value);
  require('no shared stepper case proves ArrowRight wraps from the last step to the first', (entry) =>
    navigates(entry, 'ArrowRight') &&
    from(entry) === 2 &&
    expectOf(entry).currentValue === itemsOf(props(entry))[0]?.value &&
    disabledValues(props(entry)).length === 0);
  require('no shared stepper case proves ArrowLeft wraps from the first step to the last', (entry) =>
    navigates(entry, 'ArrowLeft') &&
    from(entry) === 0 &&
    expectOf(entry).currentValue === itemsOf(props(entry))[2]?.value &&
    disabledValues(props(entry)).length === 0);
  require('no shared stepper case proves Home skips a disabled first step', (entry) =>
    navigates(entry, 'Home') &&
    disabledValues(props(entry))[0] === itemsOf(props(entry))[0]?.value &&
    expectOf(entry).currentValue === itemsOf(props(entry))[1]?.value);
  require('no shared stepper case proves End skips a disabled last step', (entry) =>
    navigates(entry, 'End') &&
    disabledValues(props(entry))[0] === itemsOf(props(entry))[2]?.value &&
    expectOf(entry).currentValue === itemsOf(props(entry))[1]?.value);
  require('no shared stepper case proves a disabled trigger takes no focus, so a key from it reaches nothing', (
    entry,
  ) =>
    single(entry) &&
    focuses(entry).some((step) => disabledValues(props(entry)).includes(itemsOf(props(entry))[step.index]?.value)) &&
    expectOf(entry).focusRole === 'body' &&
    stayed(entry));
  require('no shared stepper case round-trips the controlled prop through a consumer that writes the value back', (
    entry,
  ) =>
    single(entry) &&
    props(entry).modelValue !== undefined &&
    clicks(entry).length === 1 &&
    moved(entry) &&
    typeof entry.interaction.matches === 'string');
  require('no shared stepper case proves focus alone changes nothing and lands on the trigger', (entry) =>
    single(entry) &&
    stepsOf(entry).length === 1 &&
    stepsOf(entry)[0].action === 'focusButton' &&
    expectOf(entry).focusRole === 'trigger' &&
    stayed(entry) &&
    expectOf(entry).activates === false);
  require('no shared stepper case clicks in the second of two siblings and expects the first unchanged', (entry) =>
    (entry.group?.length ?? 0) === 2 &&
    clicks(entry).length === 1 &&
    clicks(entry)[0].index >= itemsOf(entry.group[0]).length &&
    Array.isArray(expectOf(entry).currentValues) &&
    expectOf(entry).currentValues[0] === activeValue(entry.group[0]));
  require('no shared stepper case navigates by key inside the second of two siblings and expects focus to land there', (
    entry,
  ) =>
    (entry.group?.length ?? 0) === 2 &&
    focuses(entry).length === 1 &&
    focuses(entry)[0].index >= itemsOf(entry.group[0]).length &&
    itemsOf(entry.group[1]).some((item) => item.value === expectOf(entry).focusValue) &&
    expectOf(entry).currentValues?.[0] === activeValue(entry.group[0]));
  require('no shared stepper case drives two selection changes in one scenario, so a persistent DOM carrying successive states is never measured', (
    entry,
  ) => single(entry) && (expectOf(entry).events?.length ?? 0) >= 2 && typeof entry.interaction.matches === 'string');
  require('no shared stepper case expects the second trigger focusable in the tree after a gesture', (entry) =>
    expectOf(entry)['a11y:secondTrigger.focusable'] === 'true');
  require('no shared stepper case expects a trigger disabled in the tree after a gesture', (entry) =>
    expectOf(entry)['a11y:secondTrigger.disabled'] === 'true');

  return violations;
}

/** Whether a navigation key belongs to the case's orientation axis. */
function onAxis(entry, key) {
  if (key === 'Home' || key === 'End') return true;
  const vertical = orientation(entry) === 'vertical' || (entry.group ? true : false);
  if (entry.group) {
    // A group case names the instance by the focused index; the second
    // member's orientation decides for a focus past the first member's items.
    const index = focuses(entry)[0]?.index ?? 0;
    const first = itemsOf(entry.group[0]).length;
    const member = index >= first ? entry.group[1] : entry.group[0];
    return (member.orientation ?? 'horizontal') === 'vertical'
      ? key === 'ArrowDown' || key === 'ArrowUp'
      : key === 'ArrowRight' || key === 'ArrowLeft';
  }
  return vertical ? key === 'ArrowDown' || key === 'ArrowUp' : key === 'ArrowRight' || key === 'ArrowLeft';
}

function activeValueOfCurrent(expect) {
  return expect.currentValue;
}
