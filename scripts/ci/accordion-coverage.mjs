// What the VfAccordion catalog has to prove, read as semantics.
//
// The first coverage module written for a component that owns a control. Three
// halves, and the third is what is new:
//
//   - the state half: each way the initial state can be decided (nothing,
//     defaultOpen, open, open beating defaultOpen), disabled in both states,
//     the title and trigger-slot forms, the panel with text, with markup, with
//     nothing, and while closed;
//   - the interaction half: a click that opens, a click that closes, Enter and
//     Space that open through the keydown handler, Enter that closes, a
//     disabled trigger that ignores both keys, a controlled consumer that
//     writes the value back, two siblings that stay independent, a nested pair
//     that stays independent, and a focus that changes nothing. Each is read as
//     the claim the case makes, not as the keys it presses;
//   - the ownership half: every case declares how many controls the component
//     itself renders - one trigger per instance, never zero - and how many the
//     consumer's slot content puts in the DOM in that state. The budget follows
//     the state: a consumer button in a closed panel is not in the DOM, so its
//     case declares zero. A catalog cannot buy the component a second control
//     by naming a prop it does not have, and cannot lose the trigger by
//     declaring zero.
//
// The vocabulary is closed. A prop the reference does not declare, a slot it
// does not render, a key it does not handle - `ArrowDown` in particular - is
// rejected outright, because a case that drove it would be describing the
// component the reference is not.
//
// Violations are returned rather than asserted so a test can drive these with
// a deliberately eroded catalog and check which rule fired.

const PROPS = ['open', 'defaultOpen', 'title', 'disabled'];
const CONTENT_SLOTS = ['trigger', 'body'];
const TRIGGER_KEYS = ['text', 'control'];
const BODY_KEYS = ['text', 'markup', 'control', 'accordion'];
const KEYS = ['Enter', ' '];
const STEP_ACTIONS = ['clickButton', 'focusButton', 'pressKey'];
const EXPECT_FIELDS = [
  'activates',
  'expanded',
  'expandedStates',
  'panelPresent',
  'panelCount',
  'consumerControlCount',
  'focusRole',
  'settled',
  'controlsResolved',
  'panelLabelledBy',
  'a11y:trigger.expanded',
];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const slot = (entry, name) => entry.content?.[name];
const hasSlot = (entry, name) => slot(entry, name) !== undefined;
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [props(entry)]);
const stepsOf = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const isInteraction = (entry) => entry.interaction !== undefined;
const clicks = (entry) => stepsOf(entry).some((step) => step.action === 'clickButton');
const presses = (entry, key) => stepsOf(entry).some((step) => step.action === 'pressKey' && step.key === key);
const clickIndex = (entry) => stepsOf(entry).find((step) => step.action === 'clickButton')?.index ?? 0;

/** The open state a member's props resolve to before any interaction - the shared rule, restated as data. */
const resolvesOpen = (member) => (member.open !== undefined ? Boolean(member.open) : Boolean(member.defaultOpen));
const initiallyOpen = (entry) => resolvesOpen(props(entry));
const isDisabled = (entry) => props(entry).disabled === true;

/** How many accordion instances a case renders: the member(s), plus one nested per body. */
function instanceCount(entry) {
  return members(entry).length + (slot(entry, 'body')?.accordion !== undefined ? 1 : 0);
}

/** How many consumer controls reach the DOM in the initial state. */
function consumerControlsInDom(entry) {
  let count = 0;

  if (slot(entry, 'trigger')?.control !== undefined) count += members(entry).length;
  if (slot(entry, 'body')?.control !== undefined && members(entry).some(resolvesOpen)) count += 1;

  return count;
}

/** Every way the VfAccordion catalog's coverage can be eroded. */
export function accordionCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };

  // ------------------------------------------------------------ vocabulary
  for (const entry of cases) {
    for (const name of Object.keys(props(entry))) {
      if (!PROPS.includes(name)) {
        violations.push(`${entry.id} declares prop [${name}], which the reference VfAccordion does not have`);
      }
    }
    for (const member of entry.group ?? []) {
      for (const name of Object.keys(member)) {
        if (!PROPS.includes(name)) {
          violations.push(`${entry.id} declares prop [${name}] on a group member, which the reference does not have`);
        }
      }
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!CONTENT_SLOTS.includes(name)) {
        violations.push(`${entry.id} declares slot [${name}], which the reference VfAccordion does not render`);
      }
    }
    for (const name of Object.keys(slot(entry, 'trigger') ?? {})) {
      if (!TRIGGER_KEYS.includes(name)) violations.push(`${entry.id} puts [${name}] in the trigger slot vocabulary`);
    }
    for (const name of Object.keys(slot(entry, 'body') ?? {})) {
      if (!BODY_KEYS.includes(name)) violations.push(`${entry.id} puts [${name}] in the body slot vocabulary`);
    }
    for (const step of stepsOf(entry)) {
      if (!STEP_ACTIONS.includes(step.action)) {
        violations.push(`${entry.id} drives [${step.action}], which is not an accordion gesture`);
      }
      if (step.action === 'pressKey' && !KEYS.includes(step.key)) {
        violations.push(
          `${entry.id} presses [${step.key}]. The reference handles Enter and Space and nothing else; a case that ` +
            'drove another key would be describing a component the reference is not',
        );
      }
    }
    for (const name of Object.keys(expectOf(entry))) {
      if (!EXPECT_FIELDS.includes(name)) violations.push(`${entry.id} expects [${name}], which no snapshot records`);
    }
  }

  // ------------------------------------------------------------- ownership
  //
  // The component-owned budget is one trigger per instance, on every case,
  // and never zero: the accordion cannot be rendered without its trigger. The
  // consumer budget follows the state.
  for (const entry of cases) {
    const declared = entry.componentInteractive;
    const expected = instanceCount(entry);

    if (!Number.isInteger(declared)) {
      violations.push(
        `${entry.id} declares no componentInteractive budget. Every accordion case owns at least one control, ` +
          'and a case that does not say how many cannot be measured against anything',
      );
    } else if (declared < 1) {
      violations.push(
        `${entry.id} declares ${declared} component-owned controls; an accordion always renders its trigger`,
      );
    } else if (declared !== expected) {
      violations.push(
        `${entry.id} declares ${declared} component-owned control(s) but renders ${expected} instance(s); ` +
          'one trigger per instance, no more and no fewer',
      );
    }

    const consumer = entry.consumerInteractive ?? 0;
    const reaching = consumerControlsInDom(entry);
    if (consumer !== reaching) {
      violations.push(
        `${entry.id} declares ${consumer} consumer control(s) but its slots put ${reaching} in the DOM in the ` +
          'initial state. The budget follows the state: a control in a closed panel is not rendered',
      );
    }

    const afterBudget = entry.interaction?.consumerInteractive;
    if (afterBudget !== undefined) {
      const opensWithControl =
        slot(entry, 'body')?.control !== undefined && expectOf(entry).expanded === 'true' && !initiallyOpen(entry);
      if (!opensWithControl || afterBudget !== 1) {
        violations.push(
          `${entry.id} declares a post-interaction consumer budget of ${afterBudget}, but the scenario does not ` +
            'open a panel holding one consumer control',
        );
      }
    }
  }

  require('no shared accordion case puts a consumer control in an open panel, so component and consumer controls are never measured side by side', (
    entry,
  ) => slot(entry, 'body')?.control !== undefined && initiallyOpen(entry) && !isInteraction(entry));
  require('no shared accordion case puts a consumer control in a closed panel, so nothing proves the consumer budget follows the state', (
    entry,
  ) =>
    slot(entry, 'body')?.control !== undefined &&
    !initiallyOpen(entry) &&
    entry.consumerInteractive === 0 &&
    !isInteraction(entry));
  require('no shared accordion case puts a consumer control inside the trigger slot, so a control nested in the trigger is never told apart from the trigger', (
    entry,
  ) => slot(entry, 'trigger')?.control !== undefined && entry.consumerInteractive === 1);
  require('no shared accordion case nests an accordion, so two component-owned triggers in one tree are never measured', (
    entry,
  ) => slot(entry, 'body')?.accordion !== undefined && entry.componentInteractive === 2 && !isInteraction(entry));
  require('no shared accordion case renders two siblings, so id uniqueness and local relationships are never measured', (
    entry,
  ) => (entry.group?.length ?? 0) === 2 && entry.componentInteractive === 2 && !isInteraction(entry));

  // ---------------------------------------------------------- initial state
  const plain = (entry) => !isInteraction(entry) && !entry.group && !hasSlot(entry, 'trigger');
  require('no shared accordion case is closed by default with neither open nor defaultOpen, so the default itself is never measured', (
    entry,
  ) =>
    plain(entry) &&
    props(entry).open === undefined &&
    props(entry).defaultOpen === undefined &&
    !isDisabled(entry) &&
    hasSlot(entry, 'body'));
  require('no shared accordion case opens through defaultOpen alone', (entry) =>
    plain(entry) && props(entry).defaultOpen === true && props(entry).open === undefined && !isDisabled(entry));
  require('no shared accordion case opens through the controlled prop alone', (entry) =>
    plain(entry) && props(entry).open === true && props(entry).defaultOpen === undefined);
  require('no shared accordion case passes open=false with defaultOpen=true, so the precedence is assumed rather than measured', (
    entry,
  ) => plain(entry) && props(entry).open === false && props(entry).defaultOpen === true);

  // ----------------------------------------------------------------- disabled
  require('no shared accordion case is disabled while closed', (entry) =>
    plain(entry) && isDisabled(entry) && !initiallyOpen(entry));
  require('no shared accordion case is disabled while open, so "disabling does not close" is assumed rather than measured', (
    entry,
  ) => plain(entry) && isDisabled(entry) && initiallyOpen(entry));

  // -------------------------------------------------------------------- title
  require('no shared accordion case renders without a title and without a trigger slot, so the empty fallback span is never measured', (
    entry,
  ) => plain(entry) && props(entry).title === undefined);
  require('no shared accordion case passes an empty-string title', (entry) =>
    plain(entry) && props(entry).title === '');
  require('no shared accordion case passes a title long enough to wrap', (entry) =>
    plain(entry) && typeof props(entry).title === 'string' && props(entry).title.length > 60);
  require('no shared accordion case passes a trigger slot together with a title, so nothing proves the slot suppresses the title', (
    entry,
  ) => Boolean(slot(entry, 'trigger')?.text) && Boolean(props(entry).title) && !isInteraction(entry));
  require('no shared accordion case renders the trigger slot while open, so the slot scope open=true is never measured', (
    entry,
  ) => Boolean(slot(entry, 'trigger')?.text) && initiallyOpen(entry) && !isInteraction(entry));

  // ------------------------------------------------------------------ content
  require('no shared accordion case renders plain text content while open', (entry) =>
    plain(entry) &&
    initiallyOpen(entry) &&
    Boolean(slot(entry, 'body')?.text) &&
    slot(entry, 'body')?.control === undefined);
  require('no shared accordion case renders rich markup content while open', (entry) =>
    plain(entry) && initiallyOpen(entry) && slot(entry, 'body')?.markup !== undefined);
  require('no shared accordion case is open with no default slot, so the unconditional wrappers are never measured empty', (
    entry,
  ) => plain(entry) && initiallyOpen(entry) && !hasSlot(entry, 'body'));
  require('no shared accordion case holds rich content while closed, so "nothing of it reaches the DOM" is never measured', (
    entry,
  ) => plain(entry) && !initiallyOpen(entry) && slot(entry, 'body')?.markup !== undefined);

  // --------------------------------------------------------- consumer attrs
  require('no shared accordion case forwards a consumer class', (entry) => attrs(entry).class !== undefined);
  require('no shared accordion case forwards a consumer style', (entry) => attrs(entry).style !== undefined);
  require('no shared accordion case forwards a consumer id together with a data attribute and an accessible name', (
    entry,
  ) =>
    attrs(entry).id !== undefined &&
    attrs(entry)['aria-label'] !== undefined &&
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared accordion case forwards a consumer role, so nothing proves it lands on the root and not the region', (
    entry,
  ) => attrs(entry).role !== undefined);
  require('no shared accordion case forwards a consumer aria-expanded, so nothing proves it lands on the root and not the trigger', (
    entry,
  ) => attrs(entry)['aria-expanded'] !== undefined);
  require('no shared accordion case renders without any consumer attribute at all', (entry) =>
    plain(entry) && Object.keys(attrs(entry)).length === 0);

  // ------------------------------------------------------------ interactions
  //
  // Read as claims. Each has to name the outcome on the snapshot - the
  // aria-expanded value and the panel's presence together, because the two
  // are separate evidence - and, where it lands on an initial case, name it.
  for (const entry of cases.filter(isInteraction)) {
    const expect = expectOf(entry);
    if (expect.expanded !== undefined && expect.panelPresent === undefined) {
      violations.push(
        `${entry.id} expects aria-expanded without expecting the panel's presence; the two are separate evidence`,
      );
    }
    if (expect.expanded === 'true' && expect.panelPresent !== true) {
      violations.push(
        `${entry.id} expects aria-expanded=true with no panel, which is not a state the reference produces`,
      );
    }
    if (expect.expanded === 'false' && expect.panelPresent !== false) {
      violations.push(
        `${entry.id} expects aria-expanded=false with a panel, which is not a state the reference produces`,
      );
    }
    // The relationship and the tree are separate evidence from the attribute:
    // a scenario that claims a state has to claim what the trigger controls,
    // what labels the panel, and what the tree announces, so a measurement of
    // any of the three that stopped happening fails on every target.
    if (expect.expanded === 'true' || expect.expanded === 'false') {
      const open = expect.expanded === 'true';
      if (expect.controlsResolved !== (open ? 'panel' : 'dangling')) {
        violations.push(
          `${entry.id} claims aria-expanded=${expect.expanded} without claiming what aria-controls resolves to`,
        );
      }
      if (!('panelLabelledBy' in expect) || expect.panelLabelledBy !== (open ? 'trigger' : null)) {
        violations.push(`${entry.id} claims aria-expanded=${expect.expanded} without claiming what labels the panel`);
      }
      if (expect['a11y:trigger.expanded'] !== expect.expanded) {
        violations.push(`${entry.id} claims aria-expanded=${expect.expanded} without claiming the tree announces it`);
      }
    }
    if (entry.interaction.matches !== undefined) {
      const target = cases.find((candidate) => candidate.id === entry.interaction.matches);
      if (!target || isInteraction(target)) {
        violations.push(
          `${entry.id} converges on [${entry.interaction.matches}], which is not an initial case in the catalog`,
        );
      } else if (expect.expanded !== undefined && initiallyOpen(target) !== (expect.expanded === 'true')) {
        violations.push(
          `${entry.id} expects expanded=${expect.expanded} but converges on a case that renders the other state`,
        );
      }
    }
    if (stepsOf(entry).length === 0) violations.push(`${entry.id} declares an interaction with no steps`);
  }

  const opensByClick = (entry) =>
    clicks(entry) &&
    !initiallyOpen(entry) &&
    !isDisabled(entry) &&
    expectOf(entry).expanded === 'true' &&
    expectOf(entry).activates === true;
  require('no shared accordion case proves a pointer click opens a closed accordion and lands on the open case', (
    entry,
  ) =>
    opensByClick(entry) &&
    !entry.group &&
    !hasSlot(entry, 'body')?.control &&
    typeof entry.interaction.matches === 'string');
  require('no shared accordion case proves a pointer click closes an open accordion and lands on the closed case', (
    entry,
  ) =>
    clicks(entry) &&
    initiallyOpen(entry) &&
    expectOf(entry).expanded === 'false' &&
    typeof entry.interaction.matches === 'string');
  require('no shared accordion case clicks twice, so "the panel is destroyed rather than hidden" is never driven', (
    entry,
  ) =>
    stepsOf(entry).filter((step) => step.action === 'clickButton').length === 2 &&
    expectOf(entry).panelPresent === false);
  require('no shared accordion case proves Enter opens a closed accordion through the keydown handler, with no native click', (
    entry,
  ) =>
    presses(entry, 'Enter') &&
    !isDisabled(entry) &&
    !initiallyOpen(entry) &&
    expectOf(entry).expanded === 'true' &&
    expectOf(entry).activates === false);
  require('no shared accordion case proves Space opens a closed accordion through the keydown handler, with no native click', (
    entry,
  ) =>
    presses(entry, ' ') &&
    !isDisabled(entry) &&
    !initiallyOpen(entry) &&
    expectOf(entry).expanded === 'true' &&
    expectOf(entry).activates === false);
  require('no shared accordion case proves Enter closes an open accordion', (entry) =>
    presses(entry, 'Enter') && initiallyOpen(entry) && expectOf(entry).expanded === 'false');
  require('no shared accordion case proves a disabled trigger ignores Enter', (entry) =>
    presses(entry, 'Enter') &&
    isDisabled(entry) &&
    expectOf(entry).expanded === 'false' &&
    expectOf(entry).activates === false);
  require('no shared accordion case proves a disabled trigger ignores Space', (entry) =>
    presses(entry, ' ') &&
    isDisabled(entry) &&
    expectOf(entry).expanded === 'false' &&
    expectOf(entry).activates === false);
  require('no shared accordion case round-trips the controlled prop through a consumer that writes the value back', (
    entry,
  ) =>
    clicks(entry) &&
    props(entry).open === false &&
    expectOf(entry).expanded === 'true' &&
    typeof entry.interaction.matches === 'string');
  require('no shared accordion case opens a panel holding a consumer control, so the consumer budget after the action is never measured', (
    entry,
  ) => entry.interaction?.consumerInteractive === 1 && expectOf(entry).consumerControlCount === 1);
  require('no shared accordion case clicks the first of two siblings and expects the second unchanged', (entry) =>
    (entry.group?.length ?? 0) === 2 &&
    clicks(entry) &&
    clickIndex(entry) === 0 &&
    Array.isArray(expectOf(entry).expandedStates) &&
    expectOf(entry).panelCount === 2);
  require('no shared accordion case clicks a nested inner trigger and expects the outer one unchanged', (entry) =>
    slot(entry, 'body')?.accordion !== undefined &&
    clicks(entry) &&
    clickIndex(entry) === 1 &&
    Array.isArray(expectOf(entry).expandedStates));
  require('no shared accordion case proves focus alone changes nothing and lands on the trigger', (entry) =>
    stepsOf(entry).length === 1 &&
    stepsOf(entry)[0].action === 'focusButton' &&
    expectOf(entry).focusRole === 'trigger' &&
    expectOf(entry).activates === false);
  require('no shared accordion case expects focus to stay on the trigger after a click', (entry) =>
    clicks(entry) && expectOf(entry).focusRole === 'trigger');
  require('no shared accordion case expects a settled transition after opening, so a snapshot taken mid-animation would compare equal to itself', (
    entry,
  ) => expectOf(entry).expanded === 'true' && expectOf(entry).settled === true);

  return violations;
}
