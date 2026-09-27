// Semantic coverage rules for the shared VfGroupBox catalog.
//
// The M29 gate. A count of cases proves nothing: a catalog can keep its size
// while losing the one case that distinguishes the reference from a plausible
// port. Each rule below names a behaviour of the historical component and
// fails when no case measures it any more. The rules restate the component's
// decisions as data - the title test in JavaScript truthiness, the collapse
// resolution, the one-trigger-per-collapsible-instance ownership - so a case
// that declares a budget the reference would not render is refused too.
//
// Beside the catalog, the policy has to keep declaring the one deliberate
// platform difference - no controlled mode on the server - with both halves'
// coverage named, and the behaviours it keeps outside the catalog with where
// each is covered instead.

const PROPS = ['title', 'collapsible', 'collapsed', 'defaultCollapsed', 'disabled'];
const CONTENT_SLOTS = ['title', 'toggleIcon', 'body'];
const TITLE_KEYS = ['text', 'markup', 'control'];
const BODY_KEYS = ['text', 'markup', 'control', 'groupBox'];
const TOGGLE_ICON_KEYS = ['text'];
const NESTED_KEYS = ['title', 'collapsible', 'defaultCollapsed', 'text'];
const KEYS = ['Enter', ' '];
const STEP_ACTIONS = ['clickButton', 'focusButton', 'pressKey'];
const EXPECT_FIELDS = [
  'activates',
  'keydownPrevented',
  'expanded',
  'expandedStates',
  'panelPresent',
  'panelCount',
  'consumerControlCount',
  'focusRole',
  'controlsResolved',
  'panelLabelledBy',
  'events',
  'a11y:trigger.expanded',
];

const props = (entry) => entry.props ?? {};
const attrs = (entry) => entry.attrs ?? {};
const slot = (entry, name) => entry.content?.[name];
const members = (entry) => (Array.isArray(entry.group) ? entry.group : [props(entry)]);
const stepsOf = (entry) => entry.interaction?.steps ?? [];
const expectOf = (entry) => entry.interaction?.expect ?? {};
const isInteraction = (entry) => entry.interaction !== undefined;
const presses = (entry, key) => stepsOf(entry).some((step) => step.action === 'pressKey' && step.key === key);
const clickCount = (entry) => stepsOf(entry).filter((step) => step.action === 'clickButton').length;

/** The shared rules, restated as data: JavaScript truthiness for the title. */
const hasTitle = (member, titleSlot) => Boolean(member.title) || titleSlot;
const resolvesOpen = (member) => (member.collapsed !== undefined ? !member.collapsed : !member.defaultCollapsed);
const isCollapsible = (member, titleSlot) => member.collapsible === true && hasTitle(member, titleSlot);
const showsContent = (member, titleSlot) => !isCollapsible(member, titleSlot) || resolvesOpen(member);

/** Collapsible instances that reach the DOM: the member(s), and a nested one inside open content. */
function triggerCount(entry) {
  const titleSlot = slot(entry, 'title') !== undefined;
  const nested = slot(entry, 'body')?.groupBox;
  let count = 0;

  for (const member of members(entry)) {
    if (isCollapsible(member, titleSlot)) count += 1;
    if (nested !== undefined && showsContent(member, titleSlot) && isCollapsible(nested, false)) count += 1;
  }

  return count;
}

/** Consumer controls that reach the DOM in the initial state. */
function consumerControlsInDom(entry) {
  const titleSlot = slot(entry, 'title') !== undefined;
  let count = 0;

  for (const member of members(entry)) {
    if (slot(entry, 'title')?.control !== undefined && hasTitle(member, titleSlot)) count += 1;
    if (slot(entry, 'body')?.control !== undefined && showsContent(member, titleSlot)) count += 1;
  }

  return count;
}

const single = (entry) => !isInteraction(entry) && !entry.group && slot(entry, 'body')?.groupBox === undefined;
const collapsibleCase = (entry) => isCollapsible(props(entry), slot(entry, 'title') !== undefined);

/** Every way the VfGroupBox catalog's coverage can be eroded. */
export function groupBoxCoverageViolations(cases) {
  const violations = [];
  const require = (message, predicate) => {
    if (!cases.some(predicate)) violations.push(message);
  };
  const ids = new Set(cases.map((entry) => entry.id));

  // ---------------------------------------------------------------- vocabulary
  for (const entry of cases) {
    for (const member of members(entry)) {
      for (const name of Object.keys(member)) {
        if (!PROPS.includes(name)) {
          violations.push(`${entry.id} declares prop [${name}], which the reference VfGroupBox does not have`);
        }
      }
    }
    for (const name of Object.keys(entry.content ?? {})) {
      if (!CONTENT_SLOTS.includes(name)) {
        violations.push(`${entry.id} declares slot [${name}], which the reference VfGroupBox does not render`);
      }
    }
    for (const [name, allowed] of [
      ['title', TITLE_KEYS],
      ['body', BODY_KEYS],
      ['toggleIcon', TOGGLE_ICON_KEYS],
    ]) {
      for (const key of Object.keys(slot(entry, name) ?? {})) {
        if (!allowed.includes(key)) violations.push(`${entry.id} puts [${key}] in the ${name} slot vocabulary`);
      }
    }
    for (const key of Object.keys(slot(entry, 'body')?.groupBox ?? {})) {
      if (!NESTED_KEYS.includes(key)) violations.push(`${entry.id} gives the nested group box [${key}]`);
    }
    for (const step of stepsOf(entry)) {
      if (!STEP_ACTIONS.includes(step.action)) {
        violations.push(`${entry.id} drives [${step.action}], which is not a group box gesture`);
      }
      if (step.action === 'pressKey' && !KEYS.includes(step.key)) {
        violations.push(
          `${entry.id} presses [${step.key}]. The reference reacts to Enter and Space only, through native button ` +
            'activation; another key would describe a component the reference is not',
        );
      }
    }
    for (const name of Object.keys(expectOf(entry))) {
      if (!EXPECT_FIELDS.includes(name)) violations.push(`${entry.id} expects [${name}], which no snapshot records`);
    }
    const matches = entry.interaction?.matches;
    if (matches !== undefined && (!ids.has(matches) || cases.find((c) => c.id === matches)?.interaction)) {
      violations.push(`${entry.id} converges on [${matches}], which is not an initial case of this catalog`);
    }
  }

  // ---------------------------------------------------------------- ownership
  for (const entry of cases) {
    const declared = entry.componentInteractive;
    const expected = triggerCount(entry);

    if (!Number.isInteger(declared)) {
      violations.push(`${entry.id} declares no componentInteractive budget`);
    } else if (declared !== expected) {
      violations.push(
        `${entry.id} declares ${declared} component-owned control(s) but renders ${expected}: one trigger per ` +
          'collapsible, titled instance that reaches the DOM, and none for a static group',
      );
    }

    const consumer = entry.consumerInteractive ?? 0;
    const reaching = consumerControlsInDom(entry);
    if (consumer !== reaching) {
      violations.push(
        `${entry.id} declares ${consumer} consumer control(s) but its slots put ${reaching} in the DOM in the ` +
          'initial state. The budget follows the state: a control in closed content is not rendered',
      );
    }
  }

  // ---------------------------------------------------------------- title presence
  require('no shared group box case renders without a title, so the unnamed group and the unreferenced content id are never measured', (
    entry,
  ) =>
    single(entry) &&
    props(entry).title === undefined &&
    slot(entry, 'title') === undefined &&
    !props(entry).collapsible);
  require('no shared group box case is titled and static', (entry) =>
    single(entry) &&
    typeof props(entry).title === 'string' &&
    props(entry).title.length > 0 &&
    !props(entry).collapsible &&
    !props(entry).disabled &&
    Object.keys(props(entry)).length === 1);
  require('no shared group box case passes an empty-string title', (entry) =>
    single(entry) && props(entry).title === '' && !props(entry).collapsible && slot(entry, 'title') === undefined);
  require('no shared group box case passes an empty-string title with collapsible, so "no title, no trigger" is never measured', (
    entry,
  ) =>
    single(entry) &&
    props(entry).title === '' &&
    props(entry).collapsible === true &&
    slot(entry, 'title') === undefined &&
    entry.componentInteractive === 0);
  require('no shared group box case passes the title "0" to a static group - the PHP truthiness vector', (entry) =>
    single(entry) && props(entry).title === '0' && !props(entry).collapsible);
  require('no shared group box case passes the title "0" with collapsible, so a PHP-truthiness port dropping the trigger passes', (
    entry,
  ) =>
    single(entry) &&
    props(entry).title === '0' &&
    props(entry).collapsible === true &&
    entry.componentInteractive === 1);
  require('no shared group box case titles itself through the slot beside an empty title prop', (entry) =>
    single(entry) &&
    slot(entry, 'title')?.text !== undefined &&
    props(entry).title === '' &&
    entry.componentInteractive === 1);
  require('no shared group box case renders a title slot in a static group', (entry) =>
    single(entry) && slot(entry, 'title') !== undefined && !props(entry).collapsible);
  require('no shared group box case renders rich title markup', (entry) =>
    single(entry) && slot(entry, 'title')?.markup === 'rich');
  require('no shared group box case passes a title long enough to overflow, static', (entry) =>
    single(entry) && (props(entry).title ?? '').length > 60 && !props(entry).collapsible);
  require('no shared group box case passes a title long enough to overflow inside the trigger', (entry) =>
    single(entry) && (props(entry).title ?? '').length > 60 && props(entry).collapsible === true);
  require('no shared group box case is narrow, so the fieldset min-width and legend max-width are never painted under pressure', (
    entry,
  ) => single(entry) && /width:\s*\d+px/.test(attrs(entry).style ?? ''));

  // ---------------------------------------------------------------- collapse resolution
  require('no shared group box case is collapsible and open by default', (entry) =>
    single(entry) &&
    collapsibleCase(entry) &&
    props(entry).collapsed === undefined &&
    props(entry).defaultCollapsed === undefined &&
    !props(entry).disabled &&
    Object.keys(attrs(entry)).length === 0 &&
    slot(entry, 'toggleIcon') === undefined &&
    slot(entry, 'body')?.control === undefined &&
    slot(entry, 'body')?.markup === undefined &&
    slot(entry, 'body') !== undefined);
  require('no shared group box case closes through defaultCollapsed alone', (entry) =>
    single(entry) &&
    collapsibleCase(entry) &&
    props(entry).defaultCollapsed === true &&
    props(entry).collapsed === undefined);
  require('no shared group box case closes through collapsed alone', (entry) =>
    single(entry) &&
    collapsibleCase(entry) &&
    props(entry).collapsed === true &&
    props(entry).defaultCollapsed === undefined &&
    !props(entry).disabled);
  require('no shared group box case passes collapsed=false with defaultCollapsed=true', (entry) =>
    single(entry) &&
    collapsibleCase(entry) &&
    props(entry).collapsed === false &&
    props(entry).defaultCollapsed === true);
  require('no shared group box case passes collapsed=true with defaultCollapsed=false', (entry) =>
    single(entry) &&
    collapsibleCase(entry) &&
    props(entry).collapsed === true &&
    props(entry).defaultCollapsed === false);
  require('no shared group box case shows a titled static group ignoring both state props', (entry) =>
    single(entry) &&
    Boolean(props(entry).title) &&
    !props(entry).collapsible &&
    props(entry).collapsed === true &&
    props(entry).defaultCollapsed === true);
  require('no shared group box case shows collapsible without a title ignoring collapsed', (entry) =>
    single(entry) &&
    props(entry).collapsible === true &&
    !hasTitle(props(entry), slot(entry, 'title') !== undefined) &&
    props(entry).collapsed === true);

  // ---------------------------------------------------------------- disabled
  require('no shared group box case is disabled while open', (entry) =>
    single(entry) && collapsibleCase(entry) && props(entry).disabled === true && resolvesOpen(props(entry)));
  require('no shared group box case is disabled while closed', (entry) =>
    single(entry) && collapsibleCase(entry) && props(entry).disabled === true && !resolvesOpen(props(entry)));
  require('no shared group box case is disabled and static, so "disabled never reaches the fieldset" is never measured', (
    entry,
  ) => single(entry) && !props(entry).collapsible && props(entry).disabled === true);

  // ---------------------------------------------------------------- slots and content
  require('no shared group box case replaces the toggle icon, so the exposed consumer icon is never measured', (
    entry,
  ) => single(entry) && slot(entry, 'toggleIcon')?.text !== undefined && collapsibleCase(entry));
  require('no shared group box case renders rich content', (entry) =>
    single(entry) && slot(entry, 'body')?.markup === 'paragraphs');
  require('no shared group box case renders without a default slot', (entry) =>
    single(entry) && slot(entry, 'body') === undefined);
  require('no shared group box case puts a consumer control in open content', (entry) =>
    single(entry) && slot(entry, 'body')?.control !== undefined && entry.consumerInteractive === 1);
  require('no shared group box case puts a consumer control in closed content', (entry) =>
    single(entry) && slot(entry, 'body')?.control !== undefined && entry.consumerInteractive === 0);
  require('no shared group box case puts a consumer control inside the trigger through the title slot', (entry) =>
    single(entry) &&
    slot(entry, 'title')?.control !== undefined &&
    collapsibleCase(entry) &&
    entry.consumerInteractive === 1);
  require('no shared group box case nests a group box, so two triggers in one tree are never measured', (entry) =>
    !isInteraction(entry) && slot(entry, 'body')?.groupBox !== undefined && entry.componentInteractive === 2);
  require('no shared group box case nests one inside closed content, so the removed inner trigger is never measured', (
    entry,
  ) => !isInteraction(entry) && slot(entry, 'body')?.groupBox !== undefined && entry.componentInteractive === 1);
  require('no shared group box case renders two siblings', (entry) =>
    !isInteraction(entry) && (entry.group?.length ?? 0) === 2 && entry.componentInteractive === 2);

  // ---------------------------------------------------------------- consumer attributes
  require('no shared group box case forwards a consumer class', (entry) => attrs(entry).class !== undefined);
  require('no shared group box case forwards a consumer style', (entry) =>
    attrs(entry).style !== undefined && !/width/.test(attrs(entry).style));
  require('no shared group box case forwards an id, a name, a data attribute and an accessible name together', (
    entry,
  ) =>
    attrs(entry).id !== undefined &&
    attrs(entry).name !== undefined &&
    attrs(entry)['aria-label'] !== undefined &&
    Object.keys(attrs(entry)).some((key) => key.startsWith('data-')));
  require('no shared group box case forwards a consumer aria-expanded, so nothing proves it lands on the fieldset and not the trigger', (
    entry,
  ) => attrs(entry)['aria-expanded'] !== undefined);

  // ---------------------------------------------------------------- interactions
  const clickCase = (entry, from, to) =>
    single({ ...entry, interaction: undefined }) &&
    clickCount(entry) === 1 &&
    stepsOf(entry).length === 1 &&
    collapsibleCase(entry) &&
    props(entry).collapsed === undefined &&
    resolvesOpen(props(entry)) === from &&
    expectOf(entry).expanded === (to ? 'true' : 'false') &&
    expectOf(entry).activates === true;
  require('no shared group box scenario collapses on a click', (entry) => clickCase(entry, true, false));
  require('no shared group box scenario expands on a click', (entry) => clickCase(entry, false, true));
  require('no shared group box scenario clicks twice', (entry) =>
    clickCount(entry) === 2 && (expectOf(entry).events?.length ?? 0) === 2);
  for (const [key, name] of [
    ['Enter', 'Enter'],
    [' ', 'Space'],
  ]) {
    for (const to of [true, false]) {
      require(`no shared group box scenario ${to ? 'expands' : 'collapses'} through ${name}`, (entry) =>
        presses(entry, key) && !props(entry).disabled && expectOf(entry).expanded === (to ? 'true' : 'false'));
    }
  }
  require('no shared group box scenario only focuses the trigger', (entry) =>
    stepsOf(entry).length === 1 && stepsOf(entry)[0].action === 'focusButton' && expectOf(entry).activates === false);
  require('no shared group box scenario presses Enter on a disabled trigger', (entry) =>
    presses(entry, 'Enter') && props(entry).disabled === true);
  require('no shared group box scenario presses Space on a disabled trigger', (entry) =>
    presses(entry, ' ') && props(entry).disabled === true);
  for (const collapsed of [false, true]) {
    require(`no shared group box scenario round-trips the controlled prop from collapsed=${collapsed} through a consumer that writes it back`, (
      entry,
    ) =>
      isInteraction(entry) &&
      props(entry).collapsed === collapsed &&
      clickCount(entry) === 1 &&
      expectOf(entry).expanded === (collapsed ? 'true' : 'false'));
  }
  require('no shared group box scenario toggles the title "0" trigger', (entry) =>
    isInteraction(entry) && props(entry).title === '0' && clickCount(entry) === 1);
  require('no shared group box scenario brings a consumer control into the DOM on expand', (entry) =>
    isInteraction(entry) && entry.interaction.consumerInteractive === 1 && expectOf(entry).consumerControlCount === 1);
  require('no shared group box scenario isolates two siblings', (entry) =>
    isInteraction(entry) && (entry.group?.length ?? 0) === 2);
  require('no shared group box scenario toggles only the inner of a nested pair', (entry) =>
    isInteraction(entry) &&
    slot(entry, 'body')?.groupBox !== undefined &&
    clickCount(entry) === 1 &&
    stepsOf(entry)[0].index === 1);
  require('no shared group box scenario re-renders a nested group box through its parent, so v-if recreation is never measured', (
    entry,
  ) =>
    isInteraction(entry) &&
    slot(entry, 'body')?.groupBox !== undefined &&
    clickCount(entry) >= 3 &&
    JSON.stringify(expectOf(entry).expandedStates) === '["true","false"]' &&
    entry.interaction.matches !== undefined);

  for (const entry of cases.filter(isInteraction)) {
    const expect = expectOf(entry);
    if (expect.events === undefined) {
      violations.push(`${entry.id} makes no claim about the collapsed-change notifications`);
    }
    if (expect.expanded !== undefined) {
      const open = expect.expanded === 'true';
      if (expect.panelPresent !== open) {
        violations.push(
          `${entry.id} expects aria-expanded=${expect.expanded} with panelPresent=${expect.panelPresent}, which the reference never produces`,
        );
      }
      if (expect.controlsResolved !== (open ? 'panel' : 'dangling')) {
        violations.push(
          `${entry.id} expects aria-expanded=${expect.expanded} with controlsResolved=${expect.controlsResolved}`,
        );
      }
      if (expect.panelLabelledBy !== (open ? 'trigger' : null)) {
        violations.push(
          `${entry.id} expects aria-expanded=${expect.expanded} with panelLabelledBy=${expect.panelLabelledBy}`,
        );
      }
    }
    // Native activation, both directions. An enabled trigger's Enter or Space
    // is one native click with the keydown not prevented; a disabled trigger's
    // is none. A catalog claiming the accordion's contract - no click, a
    // prevented keydown - would be describing a different component.
    if (presses(entry, 'Enter') || presses(entry, ' ')) {
      const disabled = props(entry).disabled === true;
      if (expect.activates !== !disabled) {
        violations.push(
          `${entry.id} presses a key on ${disabled ? 'a disabled' : 'an enabled'} trigger but expects activates=${expect.activates}`,
        );
      }
      if (!disabled && JSON.stringify(expect.keydownPrevented) !== '[false]') {
        violations.push(`${entry.id} presses a key but does not claim the keydown was left unprevented`);
      }
      if (disabled && expect.focusRole !== 'body') {
        violations.push(`${entry.id} presses a key on a disabled trigger but does not claim focus stayed on the body`);
      }
    }
  }

  return violations;
}

/** The policy's declarations the catalog relies on. */
export function groupBoxPolicyViolations(policy) {
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
    'controlledWithoutConsumer',
    'dynamicProps',
    'disabledStringQuirk',
    'stateDiscardedOnCollapse',
    'formAttribute',
  ]) {
    if (typeof policy.outsideTheCatalog?.[key] !== 'string') {
      violations.push(`the policy no longer says where [${key}] is covered outside the catalog`);
    }
  }
  if ((policy.approvedDivergences ?? []).length > 0) {
    violations.push('the group box policy approves a divergence; M29 closed with none');
  }

  return violations;
}
