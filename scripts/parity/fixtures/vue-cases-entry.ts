// Renders a component's shared cases with the Vue adapter.
//
// One entry serves both Vue targets and every component. Which sources it
// mounts is decided by the build config's tree root: the immutable reference
// checkout for the reference target, the working tree for the current target.
// Which component it renders is decided by the catalog's `component` field. The
// entry itself contains no component implementation and no expectations — it
// only maps the neutral case data onto the historical Vue props and slots.
import { createApp, defineComponent, h, nextTick, reactive, type VNode } from 'vue';
import VfInput from '@parity/core/components/input/VfInput.vue';
import VfIconButton from '@parity/core/components/icon-button/VfIconButton.vue';
import VfField from '@parity/core/components/field/VfField.vue';
import VfButton from '@parity/core/components/button/VfButton.vue';
import VfTextarea from '@parity/core/components/textarea/VfTextarea.vue';
import VfCheckbox from '@parity/core/components/checkbox/VfCheckbox.vue';
import VfRadio from '@parity/core/components/radio/VfRadio.vue';
import VfSwitch from '@parity/core/components/switch/VfSwitch.vue';
import VfBadge from '@parity/core/components/badge/VfBadge.vue';
import VfTag from '@parity/core/components/tag/VfTag.vue';
import VfDivider from '@parity/core/components/divider/VfDivider.vue';
import VfSkeleton from '@parity/core/components/skeleton/VfSkeleton.vue';
import VfAvatar from '@parity/core/components/avatar/VfAvatar.vue';
import VfCard from '@parity/core/components/card/VfCard.vue';
import VfPanel from '@parity/core/components/panel/VfPanel.vue';
import VfAlert from '@parity/core/components/alert/VfAlert.vue';
import VfProgressSpinner from '@parity/core/components/progress-spinner/VfProgressSpinner.vue';
import VfProgressBar from '@parity/core/components/progress-bar/VfProgressBar.vue';
import VfSkeletonGate from '@parity/core/components/skeleton-gate/VfSkeletonGate.vue';
import VfAccordion from '@parity/core/components/accordion/VfAccordion.vue';
import VfStepper from '@parity/core/components/stepper/VfStepper.vue';
import VfTabs from '@parity/core/components/tabs/VfTabs.vue';
import VfLink from '@parity/core/components/link/VfLink.vue';
import VfBreadcrumbs from '@parity/core/components/breadcrumbs/VfBreadcrumbs.vue';
import VfMenu from '@parity/core/components/menu/VfMenu.vue';
import VfMenuItem from '@parity/core/components/menu/VfMenuItem.vue';
import VfDropdown from '@parity/core/components/dropdown/VfDropdown.vue';
import VfGroupBox from '@parity/core/components/group-box/VfGroupBox.vue';
import VfPopover from '@parity/core/components/popover/VfPopover.vue';
import VfTooltip from '@parity/core/components/tooltip/VfTooltip.vue';
import { VueIconify } from '@codemonster-ru/vueforge-icons';
import '@parity/core/styles/components.css';
import cases from '@parity/cases.json';
// A plain script module shared with the Razor fixture, which inlines it (M31).
import { installTooltipLogs } from './tooltip-logs.js';

interface CaseContent {
  text?: string;
}

/**
 * One VfCard slot, as the shared catalog spells it.
 *
 * `control` is a real consumer-provided button. It is what section 23 of the
 * M16 plan is about: the card owns no interaction, its slots may hold as much
 * as a consumer likes, and the static snapshot has to tell the two apart.
 */
interface CardSlot {
  text?: string;
  control?: { text: string };
}

/**
 * One VfPanel slot, as the shared catalog spells it.
 *
 * Its own interface rather than a reuse of `CardSlot`, for the reason the render
 * function below is its own function: a panel slot can carry a `markup` shape -
 * the multi-node case that proves nothing wraps default-slot content - and a
 * card slot cannot, because a card's content is always inside one wrapper. One
 * shared slot type would make that difference unstatable.
 */
interface PanelSlot {
  text?: string;
  markup?: 'paragraphs';
  control?: { text: string };
}

/**
 * One VfAlert slot, as the shared catalog spells it.
 *
 * Its own interface for the reason the render function below is its own
 * function: an alert has an `icon` slot and a `title` slot that no other
 * migrated component has, and a `control` in either is a real consumer
 * button. There is no dismiss control to spell here, because the reference
 * has none.
 */
interface AlertSlot {
  text?: string;
  markup?: 'paragraphs';
  control?: { text: string };
}

interface CaseField {
  label?: string;
  placement?: 'top' | 'floating';
  variant?: string;
  description?: string;
  error?: string;
  invalid?: boolean;
  required?: boolean;
}

/**
 * One VfSkeletonGate slot, as the shared catalog spells it.
 *
 * `markup` names a shape rather than carrying HTML, so the catalog stays plain
 * data and both fixtures build the same elements from the same name. `control`
 * is a real consumer-provided button, unmarked and unwrapped.
 */
interface GateSlot {
  text?: string;
  markup?: 'paragraphs' | 'article' | 'bars';
  control?: { text: string };
}

/**
 * One VfAccordion slot, as the shared catalog spells it.
 *
 * `control` in the body is a real consumer button; in the trigger slot it is a
 * real consumer link, because a button inside the trigger button is not a
 * shape a consumer can write. `accordion` nests a second real VfAccordion.
 */
interface AccordionSlot {
  text?: string;
  markup?: 'article';
  control?: { text: string };
  accordion?: { title?: string; defaultOpen?: boolean; text?: string };
}

/**
 * One VfGroupBox slot, as the shared catalog spells it.
 *
 * `control` in the title slot is a real consumer link - inside the trigger
 * button when the group is collapsible, where a button is not a shape a
 * consumer can write - and in the content a real consumer button. `groupBox`
 * nests a second real VfGroupBox. `markup` names a shape rather than carrying
 * HTML, so both fixtures build the same elements from the same name.
 */
interface GroupBoxSlot {
  text?: string;
  markup?: 'rich' | 'paragraphs';
  control?: { text: string };
  groupBox?: { title?: string; collapsible?: boolean; defaultCollapsed?: boolean; text?: string };
}

/**
 * The VfLink default slot, as the shared catalog spells it.
 *
 * `markup: 'label'` puts the text in a consumer span; `control` is a real
 * consumer button inside the anchor. There is no `to` here and no router
 * component: the catalog is the native branch, and this fixture registers
 * nothing under the name `RouterLink`, so a case that reached the router
 * branch would render Vue's unresolved element and differ from every other
 * target - which is what the coverage gate refuses before it gets that far.
 */
interface LinkSlot {
  text?: string;
  markup?: 'label';
  control?: { text: string };
}

/**
 * The VfBreadcrumbs separator slot, as the shared catalog spells it.
 *
 * `text` is the separator text; `markup: 'label'` wraps it in a consumer
 * span. The slot is scoped with the item and its index in Vue, and no case
 * renders content that depends on the scope: a Razor slot takes no argument,
 * so the same content repeats after every item that has a separator. No
 * control goes in here: it would be focusable inside an aria-hidden wrapper,
 * which the characterization suite pins and the coverage gate keeps out.
 */
interface BreadcrumbsSeparatorSlot {
  text?: string;
  markup?: 'label';
}

/** The consumer content a VfMenu case declares, by name. */
type MenuChildren = 'none' | 'text' | 'spans' | 'nested' | 'button';

interface ParityCase {
  id: string;
  props: Record<string, unknown>;
  attrs: Record<string, unknown>;
  content?: {
    /** VfBreadcrumbs' separator slot. */
    separator?: BreadcrumbsSeparatorSlot;
    leading?: CaseContent;
    trailing?: CaseContent;
    label?: CaseContent | string;
    description?: CaseContent;
    error?: CaseContent;
    /** VfButton writes its icon into the default slot; there is no icon prop. VfAlert's icon slot replaces its glyph. */
    icon?: string | AlertSlot;
    /** VfAlert's title slot, which opens the title paragraph on its own. */
    title?: AlertSlot;
    /** The M15 toned spans and the VfAvatar default slot put their whole content in the default slot. */
    text?: string;
    /** VfCard's three slots. Each may be absent, empty, or carry a consumer control. */
    header?: CardSlot;
    footer?: CardSlot;
    /** VfCard's body slot, VfPanel's default slot, and VfSkeletonGate's default slot. */
    body?: CardSlot & GateSlot & PanelSlot & AlertSlot;
    /** VfSkeletonGate's skeleton slot, which replaces the child component. */
    skeleton?: GateSlot;
    /** VfAccordion's trigger slot. */
    trigger?: AccordionSlot;
    /** VfGroupBox's toggle-icon slot. */
    toggleIcon?: { text?: string };
    /** A consumer control rendered beside VfStepper, which has no slot of its own. */
    beside?: { control?: { text: string } };
    /** VfTabs' panel slot: a paragraph showing the active value, and optionally a consumer control. */
    panel?: { text?: string; control?: { text: string } };
    /** VfLink's default slot, at the top level of `content` because the link has one slot. */
    markup?: 'label' | 'paragraphs' | 'article' | 'bars';
    control?: { text: string };
    /** VfTabs' tab slot: numbered content from the item and its index. */
    tab?: { numbered?: boolean };
    /** A consumer control rendered before VfTabs' root, the origin of the native Tab scenario. */
    before?: { control?: { text: string } };
    /** VfMenu's default slot, named rather than spelled as markup so both fixtures build the same nodes. */
    children?: MenuChildren;
    /** VfDropdown's default slot. See DropdownMenu. */
    menu?: DropdownMenu;
    /** A consumer control rendered after VfDropdown's root: the target of an outside click. */
    after?: { control?: { text: string } };
  };
  /** VfAccordion siblings rendered side by side, each with its own props. */
  group?: Record<string, unknown>[];
  /** The number of component-owned controls the case declares; read by the harness, not by this fixture. */
  componentInteractive?: number;
  /** VfSkeletonGate: the props to set after mount, and the case it must converge on. */
  transition?: { to: Record<string, unknown>; matches: string };
  field?: CaseField;
  /** The VfField catalog splits the control's own props out of `props`. */
  control?: Record<string, unknown>;
  /** Attributes for the field root rather than the control. */
  fieldAttrs?: Record<string, unknown>;
}

const catalog = cases as { component?: string; cases: ParityCase[] };

function contentSlots(parityCase: ParityCase): Record<string, () => VNode> {
  const slots: Record<string, () => VNode> = {};

  if (parityCase.content?.leading?.text !== undefined) {
    slots.leading = () => h('span', { class: 'parity-content' }, parityCase.content!.leading!.text);
  }
  if (parityCase.content?.trailing?.text !== undefined) {
    slots.trailing = () => h('span', { class: 'parity-content' }, parityCase.content!.trailing!.text);
  }

  return slots;
}

function renderInput(parityCase: ParityCase, extra: Record<string, unknown> = {}): VNode {
  return h(VfInput, { ...parityCase.props, ...parityCase.attrs, ...extra }, contentSlots(parityCase));
}

/**
 * A field wrapping its control, for the VfField catalog.
 *
 * The consumer binding is what the historical component expects: the field
 * hands the control id, the described-by value and the invalid flag to the
 * default slot, and the caller puts them on the control. A caller that ignored
 * them would produce a label pointing at nothing, which is the reference
 * behaviour and why this is explicit rather than automatic.
 */
function renderField(parityCase: ParityCase): VNode {
  const field = parityCase.field ?? {};
  const controlCase: ParityCase = {
    ...parityCase,
    props: parityCase.control ?? {},
    attrs: parityCase.attrs ?? {},
  };
  const slots: Record<string, unknown> = {
    default: ({ controlId, describedBy, invalid }: Record<string, unknown>) =>
      renderInput(controlCase, { id: controlId, 'aria-describedby': describedBy, invalid }),
  };

  for (const name of ['label', 'description', 'error'] as const) {
    const slotContent = parityCase.content?.[name];
    const text = typeof slotContent === 'string' ? undefined : slotContent?.text;
    if (text !== undefined) {
      slots[name] = () => text;
    }
  }

  return h(
    VfField,
    {
      ...(field.label !== undefined ? { label: field.label } : {}),
      ...(field.placement !== undefined ? { labelPlacement: field.placement } : {}),
      ...(field.variant !== undefined ? { floatingVariant: field.variant } : {}),
      ...(field.description !== undefined ? { description: field.description } : {}),
      ...(field.error !== undefined ? { error: field.error } : {}),
      ...(field.invalid !== undefined ? { invalid: field.invalid } : {}),
      ...(field.required !== undefined ? { required: field.required } : {}),
      ...(parityCase.fieldAttrs ?? {}),
    },
    slots,
  );
}

/**
 * A button whose label is its default slot, for the VfButton catalog.
 *
 * The historical component has no icon props: an icon is slot content the
 * caller writes, so the catalog's `content.icon` becomes a glyph inside the
 * slot rather than a prop, and an icon-only button is simply a slot with no
 * text in it.
 */
function renderButton(parityCase: ParityCase): VNode {
  const content = (parityCase.content ?? {}) as { icon?: string; label?: string };
  const children: unknown[] = [];

  if (content.icon !== undefined) {
    // The catalog names glyphs the way the registry does, and VueIconify takes
    // that name directly. Looking it up in the `icons` map instead would find
    // nothing: that map is keyed by camelCase and its *values* are these names.
    children.push(h(VueIconify, { icon: content.icon, 'aria-hidden': 'true' }));
  }
  if (content.label !== undefined) {
    children.push(content.label);
  }

  return h(VfButton, { ...parityCase.props, ...parityCase.attrs }, { default: () => children });
}

/**
 * A textarea, optionally wrapped in a field.
 *
 * The field binding is the same one the VfField catalog uses: the consumer
 * takes the control id and described-by value from the default slot's scope and
 * puts them on the control, because the field never applies them itself.
 */
function renderTextarea(parityCase: ParityCase): VNode {
  const control = (extra: Record<string, unknown> = {}) =>
    h(VfTextarea, { ...parityCase.props, ...parityCase.attrs, ...extra });

  if (!parityCase.field) return control();

  const field = parityCase.field;

  return h(
    VfField,
    {
      ...(field.label !== undefined ? { label: field.label } : {}),
      ...(field.placement !== undefined ? { labelPlacement: field.placement } : {}),
      ...(field.description !== undefined ? { description: field.description } : {}),
      ...(field.error !== undefined ? { error: field.error } : {}),
      ...(field.required !== undefined ? { required: field.required } : {}),
    },
    {
      default: ({ controlId, describedBy, invalid }: Record<string, unknown>) =>
        control({ id: controlId, 'aria-describedby': describedBy, invalid }),
    },
  );
}

/**
 * One of the three checkable controls, or a whole radio group.
 *
 * A group is a list of members sharing the case's `name`, because mutual
 * exclusion belongs to the group rather than to any one control.
 */
function renderCheckable(component: string, parityCase: ParityCase): VNode {
  const componentFor: Record<string, unknown> = { checkbox: VfCheckbox, radio: VfRadio, switch: VfSwitch };
  const target = componentFor[component];
  const content = (parityCase.content ?? {}) as { label?: string; thumb?: string };
  const slots: Record<string, unknown> = {};

  if (content.label !== undefined) slots.default = () => content.label;
  if (content.thumb !== undefined) slots.thumb = () => content.thumb;

  const group = (parityCase as { group?: Record<string, unknown>[] }).group;

  if (Array.isArray(group)) {
    return h(
      'div',
      { class: 'parity-group' },
      group.map((member, index) =>
        h(target as never, {
          ...parityCase.props,
          ...parityCase.attrs,
          ...member,
          key: index,
        }),
      ),
    );
  }

  return h(target as never, { ...parityCase.props, ...parityCase.attrs }, slots);
}

/**
 * One of the two toned spans, or the divider.
 *
 * Three branches rather than one parameterised "toned span" renderer: the
 * fixture is where a substitution would be easiest to introduce and hardest to
 * see, so each component names its own import. `content.text` is the default
 * slot; VfDivider has no slot and ignores it.
 */
function renderBadge(parityCase: ParityCase): VNode {
  const text = (parityCase.content as { text?: string } | undefined)?.text;

  return h(
    VfBadge,
    { ...parityCase.props, ...parityCase.attrs },
    text === undefined ? undefined : { default: () => text },
  );
}

function renderTag(parityCase: ParityCase): VNode {
  const text = (parityCase.content as { text?: string } | undefined)?.text;

  return h(
    VfTag,
    { ...parityCase.props, ...parityCase.attrs },
    text === undefined ? undefined : { default: () => text },
  );
}

function renderDivider(parityCase: ParityCase): VNode {
  return h(VfDivider, { ...parityCase.props, ...parityCase.attrs });
}

/**
 * VfSkeleton, for the skeleton catalog. No slot at all.
 *
 * `minHeight` reaches the component as the catalog wrote it - a number stays a
 * number - because the prop is typed `string | number` and the two travel
 * different paths through the length rule.
 */
function renderSkeleton(parityCase: ParityCase): VNode {
  return h(VfSkeleton, { ...parityCase.props, ...parityCase.attrs });
}

/**
 * VfAvatar, for the avatar catalog.
 *
 * The default slot is passed only when the case declares slot content, because
 * "no slot" and "a slot rendering nothing" are different inputs to the fallback
 * chain and the catalog distinguishes them.
 */
function renderAvatar(parityCase: ParityCase): VNode {
  const text = (parityCase.content as { text?: string } | undefined)?.text;

  return h(
    VfAvatar,
    { ...parityCase.props, ...parityCase.attrs },
    text === undefined ? undefined : { default: () => text },
  );
}

/**
 * VfCard, for the card catalog.
 *
 * Each slot is passed only when the case declares it, because every one of the
 * card's wrappers is keyed on the slot being present rather than on what it
 * renders. Passing all three unconditionally would make every card render every
 * wrapper and would delete the component's entire contract from the fixture.
 *
 * A slot declaring an empty string is passed and renders nothing, which is the
 * input that brings the header's fallback heading back.
 */
function renderCard(parityCase: ParityCase): VNode {
  const content = (parityCase.content ?? {}) as { header?: CardSlot; body?: CardSlot; footer?: CardSlot };
  const slots: Record<string, () => unknown> = {};
  const children = (slot: CardSlot) => {
    const nodes: unknown[] = [];

    if (slot.text !== undefined && slot.text !== '') nodes.push(slot.text);
    // A real button, unmarked and unwrapped: the consumer writes what it likes
    // and the harness must not decorate it into something recognisable.
    if (slot.control !== undefined) nodes.push(h('button', { type: 'button' }, slot.control.text));

    return nodes;
  };

  if (content.header !== undefined) slots.header = () => children(content.header!);
  if (content.body !== undefined) slots.default = () => children(content.body!);
  if (content.footer !== undefined) slots.footer = () => children(content.footer!);

  return h(VfCard, { ...parityCase.props, ...parityCase.attrs }, slots);
}

/**
 * VfPanel, for the panel catalog.
 *
 * Its own function, and deliberately not `renderCard` with a different
 * component: the fixture is where a substitution would be easiest to introduce
 * and hardest to see, and these two components are the pair M18 exists to keep
 * apart. Three things differ and all three are visible here:
 *
 *   - the `footer` slot is passed to the panel even though a panel has no
 *     footer. That is the point: the component must drop it, and a slot that is
 *     never handed over is a rule that is never tested;
 *   - the default slot may carry a `markup` shape, which puts several
 *     root-level nodes in it. A card wraps them; a panel does not;
 *   - an empty slot is still passed. For a card that opens an empty classed
 *     wrapper; for a panel it produces nothing at all, and the difference is
 *     only observable if the slot is actually handed over.
 */
function renderPanel(parityCase: ParityCase): VNode {
  const content = (parityCase.content ?? {}) as { header?: PanelSlot; body?: PanelSlot; footer?: PanelSlot };
  const slots: Record<string, () => unknown> = {};
  const children = (slot: PanelSlot) => {
    const nodes: unknown[] = [];

    if (slot.text !== undefined && slot.text !== '') nodes.push(slot.text);
    if (slot.markup === 'paragraphs') {
      nodes.push(h('p', 'Storage, seats and outbound transfer.'), h('p', 'Updated hourly.'));
    }
    // A real button, unmarked and unwrapped: the consumer writes what it likes
    // and the harness must not decorate it into something recognisable.
    if (slot.control !== undefined) nodes.push(h('button', { type: 'button' }, slot.control.text));

    return nodes;
  };

  if (content.header !== undefined) slots.header = () => children(content.header!);
  if (content.body !== undefined) slots.default = () => children(content.body!);
  // Handed over on purpose. VfPanel declares no footer slot, so Vue drops it -
  // which is the behaviour the case is there to measure.
  if (content.footer !== undefined) slots.footer = () => children(content.footer!);

  return h(VfPanel, { ...parityCase.props, ...parityCase.attrs }, slots);
}

/**
 * VfLink, for the link catalog.
 *
 * The native branch only: props and attrs are spread onto the component
 * exactly as a consumer would write them, and the slot is the text, a
 * consumer span, and a real consumer button. Nothing here registers a
 * RouterLink and no case names `to`.
 *
 * The described-by hint is the same paragraph the input fixture appends, so a
 * consumer aria-describedby resolves to an element outside the anchor on every
 * target.
 */
function renderLink(parityCase: ParityCase): VNode[] {
  const content = (parityCase.content ?? {}) as LinkSlot;
  const nodes: unknown[] = [];

  if (content.markup === 'label') {
    nodes.push(h('span', { class: 'consumer-label' }, content.text ?? ''));
  } else if (content.text !== undefined && content.text !== '') {
    nodes.push(content.text);
  }
  if (content.control !== undefined) nodes.push(h('button', { type: 'button' }, content.control.text));

  const children: VNode[] = [h(VfLink, { ...parityCase.props, ...parityCase.attrs }, { default: () => nodes })];

  if (parityCase.attrs['aria-describedby'] === 'aria-described-hint') {
    children.push(h('p', { id: 'aria-described-hint', class: 'parity-hint' }, 'Shown in workspace settings.'));
  }

  return children;
}

/**
 * VfBreadcrumbs, for the breadcrumbs catalog.
 *
 * The native half only: the items are handed to the component as a consumer
 * would write them, with href/target/rel/disabled/current per item, and
 * props and attrs are spread onto the component. Nothing here registers a
 * RouterLink and no item names `to`: the coverage gate refuses one before it
 * gets this far, and a case that reached the router branch would render
 * Vue's unresolved element and differ from every other target.
 *
 * The separator slot, when the case has one, is the text or a consumer span.
 * The described-by hint is the same paragraph the input fixture appends, so a
 * consumer aria-describedby resolves to an element outside the nav on every
 * target.
 */
function renderBreadcrumbs(parityCase: ParityCase): VNode[] {
  const separator = parityCase.content?.separator;
  const slots: Record<string, () => unknown> = {};

  if (separator !== undefined) {
    slots.separator = () =>
      separator.markup === 'label'
        ? h('span', { class: 'consumer-separator' }, separator.text ?? '')
        : (separator.text ?? '');
  }

  const children: VNode[] = [h(VfBreadcrumbs, { ...parityCase.props, ...parityCase.attrs } as never, slots)];

  if (parityCase.attrs['aria-describedby'] === 'aria-described-hint') {
    children.push(h('p', { id: 'aria-described-hint', class: 'parity-hint' }, 'Shown in workspace settings.'));
  }

  return children;
}

/**
 * The consumer content a VfMenu case declares.
 *
 * Named rather than spelled as markup so that this fixture and the Razor one
 * build the same nodes from the same word: a catalog carrying HTML would let
 * the two drift silently. Only `button` is focusable, and nothing here carries
 * an explicit interactive role - the menu's evidence is the static-ownership
 * posture, whose rule is that every focusable element is the consumer's
 * declared budget and that the explicit-role total is zero.
 */
function menuChildren(children: MenuChildren | undefined): VNode[] {
  if (children === 'text') return [h('span', { class: 'parity-menu-text' }, 'Plain content')];
  if (children === 'spans') {
    return ['One', 'Two', 'Three'].map((text) => h('span', { class: 'parity-menu-child' }, text));
  }
  if (children === 'nested') {
    return [h('div', { class: 'parity-menu-group' }, [h('span', { class: 'parity-menu-child' }, 'Deep')])];
  }
  if (children === 'button') {
    return [h('button', { type: 'button', class: 'consumer-control' }, 'Consumer action')];
  }

  return [];
}

/**
 * VfMenu, for the menu catalog.
 *
 * Props and attrs are spread onto the component together, because VfMenu
 * declares no props at all and every one of them is an attr. The described-by
 * hint is the same paragraph the other fixtures append, so a consumer
 * aria-describedby resolves to an element outside the menu on every target.
 */
function renderMenu(parityCase: ParityCase): VNode[] {
  const children: VNode[] = [
    h(VfMenu, { ...parityCase.props, ...parityCase.attrs } as never, {
      default: () => menuChildren(parityCase.content?.children),
    }),
  ];

  if (parityCase.attrs['aria-describedby'] === 'aria-described-hint') {
    children.push(h('p', { id: 'aria-described-hint', class: 'parity-hint' }, 'Shown in workspace settings.'));
  }

  return children;
}

/**
 * VfDropdown's default slot, as the shared catalog spells it.
 *
 * `items` are raw consumer buttons carrying role=menuitem and the dropdown's
 * own `.vf-dropdown__item` class family, `active` adding its modifier;
 * `menuItems` is a real VfMenu of real VfMenuItems; `note` is a plain
 * paragraph - a non-item child to click; `control` is a real consumer input
 * placed first, so focus can sit inside the menu on no item.
 */
interface DropdownMenu {
  control?: { text: string };
  items?: { label: string; active?: boolean }[];
  menuItems?: { label: string; disabled?: boolean; href?: string; tone?: string }[];
  note?: string;
}

/**
 * The reactive props each VfDropdown instance is rendered with. A controlled
 * case (`open` in its props) is rendered the way a v-model consumer renders
 * it, with update:open written back; an uncontrolled one is left alone.
 */
const dropdownProps = reactive<Record<string, Record<string, unknown>>>({});

/**
 * The neutral logs the harness reads after a dropdown scenario, kept the same
 * way by the Razor fixture page:
 *
 *   - one entry per openChange, with the instance's index in the case, from
 *     the moment the page is ready - so the reference's setup-time emit for a
 *     disabled dropdown given defaultOpen, which has no server counterpart,
 *     is pinned by the characterization suite rather than compared here;
 *   - one entry per keydown reaching the document, with whether it ended up
 *     prevented;
 *   - every enter and leave a menu completes after the first real pointer or
 *     key input, with its duration from the menu's own class changes.
 */
declare global {
  interface Window {
    __parityDropdownEvents?: Record<string, { instance: number; open: boolean }[]>;
    __parityDropdownKeys?: { key: string; prevented: boolean }[];
    __parityDropdownTransitions?: Record<string, { kind: string; start: number; ms: number | null }[]>;
  }
}

function renderDropdownMenu(menu: DropdownMenu | undefined): VNode[] {
  const nodes: VNode[] = [];
  if (menu?.control) nodes.push(h('input', { class: 'parity-menu-control', 'aria-label': menu.control.text }));
  for (const item of menu?.items ?? []) {
    nodes.push(
      h(
        'button',
        { type: 'button', role: 'menuitem', class: ['vf-dropdown__item', item.active && 'vf-dropdown__item--active'] },
        item.label,
      ),
    );
  }
  if (menu?.menuItems) {
    nodes.push(h(VfMenu, null, { default: () => menu.menuItems!.map((item) => h(VfMenuItem, item as never)) }));
  }
  if (menu?.note !== undefined) nodes.push(h('p', { class: 'parity-menu-note' }, menu.note));
  return nodes;
}

function renderDropdownInstance(
  caseId: string,
  key: string,
  instance: number,
  props: Record<string, unknown>,
  attrs: Record<string, unknown>,
  content: NonNullable<ParityCase['content']>,
): VNode {
  dropdownProps[key] ??= reactive({ ...props, ...attrs });
  const live = dropdownProps[key];
  const trigger = content.trigger as AccordionSlot | undefined;
  const slots: Record<string, () => VNode[]> = { default: () => renderDropdownMenu(content.menu) };

  if (trigger?.control) {
    slots.trigger = () => [h('button', { type: 'button', class: 'parity-trigger-control' }, trigger.control!.text)];
  } else if (trigger?.text !== undefined) {
    slots.trigger = () => [h('span', trigger.text)];
  }

  return h(
    VfDropdown,
    {
      ...live,
      key,
      onOpenChange: (open: boolean) => {
        if (document.documentElement.getAttribute('data-parity-ready') !== 'true') return;
        (window.__parityDropdownEvents![caseId] ??= []).push({ instance, open });
      },
      ...('open' in live ? { 'onUpdate:open': (open: boolean) => (live.open = open) } : {}),
    },
    slots,
  );
}

/**
 * VfDropdown, for the dropdown catalog.
 *
 * Its own function. A `group` renders each member as its own instance with
 * the case's content, and the case-level props are ignored for a group, as
 * the catalog says. An `after` control is a real consumer button placed after
 * the roots, inside the case. Nothing here renders a control that is not the
 * consumer's declared one.
 */
function renderDropdown(parityCase: ParityCase): VNode[] {
  const content = parityCase.content ?? {};
  const nodes: VNode[] = Array.isArray(parityCase.group)
    ? parityCase.group.map((member, index) =>
        renderDropdownInstance(parityCase.id, `${parityCase.id}/${index}`, index, member, parityCase.attrs, content),
      )
    : [renderDropdownInstance(parityCase.id, parityCase.id, 0, parityCase.props, parityCase.attrs, content)];

  if (content.after?.control) {
    nodes.push(h('button', { type: 'button', class: 'parity-after-control' }, content.after.control.text));
  }

  return nodes;
}

/**
 * The dropdown's page-level harness logs. Installed before the application
 * mounts; the transition observer records nothing until the first real input.
 */
function installDropdownLogs(): void {
  window.__parityDropdownEvents = {};
  window.__parityDropdownKeys = [];
  window.__parityDropdownTransitions = {};
  let observing = false;
  for (const type of ['pointerdown', 'keydown']) {
    document.addEventListener(type, () => (observing = true), true);
  }
  // The per-key record is filled on window, in the bubble phase, after every
  // product handler - the document's escape stack included - has run. Only
  // then, and only for a navigation key or Escape the product left alone, is
  // the browser's default swallowed: headless Chrome answers an unconsumed
  // one by hiding the tab, with no animation frame again on any later page
  // (reproduced with ArrowUp on a closed trigger, which the reference leaves
  // unhandled). Tab, Enter and Space keep their defaults - focus moves and
  // native activation are behaviour the scenarios measure.
  const entries = new WeakMap<Event, { key: string; prevented: boolean }>();
  const swallowed = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Escape',
  ]);
  document.addEventListener(
    'keydown',
    (event) => {
      const entry = { key: event.key, prevented: false };
      window.__parityDropdownKeys!.push(entry);
      entries.set(event, entry);
    },
    true,
  );
  window.addEventListener('keydown', (event) => {
    const entry = entries.get(event);
    if (entry) entry.prevented = event.defaultPrevented;
    if (!event.defaultPrevented && swallowed.has(event.key)) event.preventDefault();
  });
  const running = new Map<Element, { kind: string; start: number; ms: number | null }>();
  const phase = (element: Element) =>
    !element.isConnected
      ? 'removed'
      : [...element.classList].some((name) => name.startsWith('vf-floating-transition-leave'))
        ? 'leave'
        : [...element.classList].some((name) => name.startsWith('vf-floating-transition-enter'))
          ? 'enter'
          : 'none';
  new MutationObserver((records) => {
    if (!observing) return;
    const now = performance.now();
    for (const record of records) {
      const nodes = record.type === 'childList' ? [...record.addedNodes, ...record.removedNodes] : [record.target];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement) || !node.classList.contains('vf-dropdown__menu')) continue;
        const state = phase(node);
        const current = running.get(node);
        if (current && (current.kind === 'enter' ? state !== 'enter' : state === 'removed')) {
          current.ms = Math.round(now - current.start);
          running.delete(node);
        }
        if (!running.has(node) && (state === 'enter' || state === 'leave')) {
          const entry = { kind: state, start: now, ms: null };
          (window.__parityDropdownTransitions![node.id] ??= []).push(entry);
          running.set(node, entry);
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
}

/**
 * VfPopover's content, as the shared catalog spells it: the trigger slot as
 * for the dropdown, the default slot as `panel`, a real VfDropdown `beside`
 * the roots and a consumer control `after` them.
 */
interface PopoverContent {
  trigger?: { text?: string; control?: { text: string } };
  panel?: {
    note?: string;
    controls?: { text: string; autofocus?: 'attribute' | 'data'; tag?: 'button' | 'span' }[];
    dropdown?: { inPlace?: boolean };
  };
  beside?: { dropdown?: { inPlace?: boolean } };
  after?: { control?: { text: string } };
}

/** The reactive props each VfPopover instance is rendered with; see dropdownProps. */
const popoverProps = reactive<Record<string, Record<string, unknown>>>({});

/**
 * The neutral logs the harness reads after a popover scenario, kept the same
 * way by the Razor fixture page: one entry per open-change of a popover or of
 * a dropdown inside or beside one, with the component and its instance; one
 * entry per keydown with whether it ended up prevented; every enter and leave
 * a panel or a menu completes after the first real input.
 */
declare global {
  interface Window {
    __parityPopoverEvents?: Record<string, { component: string; instance: number; open: boolean }[]>;
    __parityPopoverKeys?: { key: string; prevented: boolean }[];
    __parityPopoverTransitions?: Record<string, { kind: string; start: number; ms: number | null }[]>;
  }
}

function logPopoverEvent(caseId: string, component: string, instance: number, open: boolean): void {
  if (document.documentElement.getAttribute('data-parity-ready') !== 'true') return;
  (window.__parityPopoverEvents![caseId] ??= []).push({ component, instance, open });
}

/** A real VfDropdown beside or inside a popover: consumer content with its own escape entry. */
function renderOverlayDropdown(caseId: string, label: string, inPlace: boolean | undefined): VNode {
  return h(
    VfDropdown,
    {
      ...(inPlace ? { teleportTo: false } : {}),
      onOpenChange: (open: boolean) => logPopoverEvent(caseId, 'dropdown', 0, open),
    },
    {
      trigger: () => [h('span', label)],
      default: () => [
        h('button', { type: 'button', role: 'menuitem', class: 'vf-dropdown__item' }, 'Edit'),
        h('button', { type: 'button', role: 'menuitem', class: 'vf-dropdown__item' }, 'Duplicate'),
      ],
    },
  );
}

function renderPopoverPanel(caseId: string, panel: PopoverContent['panel']): VNode[] {
  const nodes: VNode[] = [];
  if (panel?.note !== undefined) nodes.push(h('p', { class: 'parity-panel-note' }, panel.note));
  for (const control of panel?.controls ?? []) {
    const focus =
      control.autofocus === 'attribute'
        ? { autofocus: '' }
        : control.autofocus === 'data'
          ? { 'data-autofocus': '' }
          : {};
    nodes.push(
      control.tag === 'span'
        ? h('span', { class: 'parity-panel-control', ...focus }, control.text)
        : h('button', { type: 'button', class: 'parity-panel-control', ...focus }, control.text),
    );
  }
  if (panel?.dropdown) nodes.push(renderOverlayDropdown(caseId, 'Inner', panel.dropdown.inPlace));
  return nodes;
}

function renderPopoverInstance(
  caseId: string,
  key: string,
  instance: number,
  props: Record<string, unknown>,
  attrs: Record<string, unknown>,
  content: PopoverContent,
): VNode {
  popoverProps[key] ??= reactive({ ...props, ...attrs });
  const live = popoverProps[key];
  const slots: Record<string, () => VNode[]> = { default: () => renderPopoverPanel(caseId, content.panel) };

  if (content.trigger?.control) {
    slots.trigger = () => [
      h('button', { type: 'button', class: 'parity-trigger-control' }, content.trigger!.control!.text),
    ];
  } else if (content.trigger?.text !== undefined) {
    slots.trigger = () => [h('span', content.trigger!.text)];
  }

  return h(
    VfPopover,
    {
      ...live,
      key,
      onOpenChange: (open: boolean) => logPopoverEvent(caseId, 'popover', instance, open),
      ...('open' in live ? { 'onUpdate:open': (open: boolean) => (live.open = open) } : {}),
    },
    slots,
  );
}

/**
 * VfPopover, for the popover catalog: a `beside` dropdown first, then the
 * popover roots - one, or one per `group` member - then an `after` control.
 */
function renderPopover(parityCase: ParityCase): VNode[] {
  const content = (parityCase.content ?? {}) as unknown as PopoverContent;
  const nodes: VNode[] = [];
  if (content.beside?.dropdown)
    nodes.push(renderOverlayDropdown(parityCase.id, 'Menu', content.beside.dropdown.inPlace));
  if (Array.isArray(parityCase.group)) {
    parityCase.group.forEach((member, index) =>
      nodes.push(
        renderPopoverInstance(parityCase.id, `${parityCase.id}/${index}`, index, member, parityCase.attrs, content),
      ),
    );
  } else {
    nodes.push(renderPopoverInstance(parityCase.id, parityCase.id, 0, parityCase.props, parityCase.attrs, content));
  }
  if (content.after?.control) {
    nodes.push(h('button', { type: 'button', class: 'parity-after-control' }, content.after.control.text));
  }
  return nodes;
}

/**
 * The popover's page-level harness logs, the dropdown's in shape: the key log
 * is filled on window after every product handler, and only then is an
 * unconsumed navigation key's or Escape's default swallowed; the transition
 * observer follows panels and menus alike.
 */
function installPopoverLogs(): void {
  window.__parityPopoverEvents = {};
  window.__parityPopoverKeys = [];
  window.__parityPopoverTransitions = {};
  let observing = false;
  for (const type of ['pointerdown', 'keydown']) {
    document.addEventListener(type, () => (observing = true), true);
  }
  const entries = new WeakMap<Event, { key: string; prevented: boolean }>();
  const swallowed = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Escape',
  ]);
  document.addEventListener(
    'keydown',
    (event) => {
      const entry = { key: event.key, prevented: false };
      window.__parityPopoverKeys!.push(entry);
      entries.set(event, entry);
    },
    true,
  );
  window.addEventListener('keydown', (event) => {
    const entry = entries.get(event);
    if (entry) entry.prevented = event.defaultPrevented;
    if (!event.defaultPrevented && swallowed.has(event.key)) event.preventDefault();
  });
  const running = new Map<Element, { kind: string; start: number; ms: number | null }>();
  const phase = (element: Element) =>
    !element.isConnected
      ? 'removed'
      : [...element.classList].some((name) => name.startsWith('vf-floating-transition-leave'))
        ? 'leave'
        : [...element.classList].some((name) => name.startsWith('vf-floating-transition-enter'))
          ? 'enter'
          : 'none';
  new MutationObserver((records) => {
    if (!observing) return;
    const now = performance.now();
    for (const record of records) {
      const nodes = record.type === 'childList' ? [...record.addedNodes, ...record.removedNodes] : [record.target];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement) || !node.matches('.vf-popover__content, .vf-dropdown__menu')) continue;
        const state = phase(node);
        const current = running.get(node);
        if (current && (current.kind === 'enter' ? state !== 'enter' : state === 'removed')) {
          current.ms = Math.round(now - current.start);
          running.delete(node);
        }
        if (!running.has(node) && (state === 'enter' || state === 'leave')) {
          const entry = { kind: state, start: now, ms: null };
          (window.__parityPopoverTransitions![node.id] ??= []).push(entry);
          running.set(node, entry);
        }
      }
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
}

/**
 * VfTooltip's content, as the shared catalog spells it: the default slot as
 * `trigger`, the content slot as `body`, a consumer control `after` the roots,
 * a real VfPopover `beside` them or holding a tooltip `inside`, and a `layout`
 * the case root's page chrome takes.
 */
interface TooltipContent {
  trigger?: { controls?: string[]; text?: string };
  body?: 'rich' | 'empty';
  after?: boolean;
  popover?: 'beside' | 'inside';
  popoverDelay?: number;
  layout?: string;
}

function renderTooltipInstance(
  key: string,
  props: Record<string, unknown>,
  attrs: Record<string, unknown>,
  content: TooltipContent,
): VNode {
  const slots: Record<string, () => unknown> = {
    default: () =>
      content.trigger?.controls
        ? content.trigger.controls.map((text) => h('button', { type: 'button', class: 'parity-trigger-control' }, text))
        : (content.trigger?.text ?? ''),
  };
  if (content.body === 'rich') slots.content = () => [h('strong', 'Rich'), ' body'];
  else if (content.body === 'empty') slots.content = () => [];
  return h(VfTooltip, { ...props, ...attrs, key }, slots);
}

/**
 * VfTooltip, for the tooltip catalog: a popover, the tooltip roots - one, or
 * one per `group` member - and an `after` control.
 */
function renderTooltip(parityCase: ParityCase): VNode[] {
  const content = (parityCase.content ?? {}) as unknown as TooltipContent;
  const members = Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props];
  const nodes: VNode[] = [];
  if (content.popover) {
    const inside = content.popover === 'inside';
    nodes.push(
      h(
        VfPopover,
        {},
        {
          trigger: () => [h('span', 'Host')],
          default: () =>
            inside
              ? [
                  renderTooltipInstance(
                    `${parityCase.id}/inside`,
                    {
                      text: 'Inside hint',
                      ...(content.popoverDelay !== undefined ? { openDelay: content.popoverDelay } : {}),
                    },
                    {},
                    { trigger: { controls: ['Inside'] } },
                  ),
                ]
              : [h('p', { class: 'parity-panel-note' }, 'Host body')],
        },
      ),
    );
  }
  members.forEach((member, index) =>
    nodes.push(renderTooltipInstance(`${parityCase.id}/${index}`, member, parityCase.attrs, content)),
  );
  if (content.after) nodes.push(h('button', { type: 'button', class: 'parity-after-control' }, 'After'));
  return nodes;
}

/** Each instance's openDelay, in the snapshot's instance order, for the latency buckets. */
function tooltipDelays(): Record<string, number[]> {
  return Object.fromEntries(
    catalog.cases.map((parityCase) => {
      const content = (parityCase.content ?? {}) as unknown as TooltipContent;
      const members = Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props];
      const delays = members.map((member) => Number(member.openDelay ?? 80));
      if (content.popover === 'inside') delays.push(Number(content.popoverDelay ?? 80));
      return [parityCase.id, delays];
    }),
  );
}

/**
 * VfMenuItem, for the menu-item catalog.
 *
 * One component, props and attrs spread onto it. There is no slot to pass -
 * the component has none, and its label is a prop - and no router to register:
 * unlike VfLink and VfBreadcrumbs this component has no second branch, so
 * every case here renders the whole contract.
 */
function renderMenuItem(parityCase: ParityCase): VNode[] {
  const children: VNode[] = [h(VfMenuItem, { ...parityCase.props, ...parityCase.attrs } as never)];

  if (parityCase.attrs['aria-describedby'] === 'aria-described-hint') {
    children.push(h('p', { id: 'aria-described-hint', class: 'parity-hint' }, 'Shown in workspace settings.'));
  }

  return children;
}

/**
 * VfAlert, for the alert catalog.
 *
 * Its own function, and deliberately not renderBadge or renderTag with a
 * different component: the three share eight tone names and the fixture is
 * where a substitution would be easiest to introduce and hardest to see.
 *
 * Each slot is passed only when the case declares it, because "no slot" and
 * "a slot rendering nothing" are different inputs to both fallbacks: an icon
 * slot yielding nothing brings the tone glyph back, and a title slot yielding
 * nothing brings the prop text back. An empty-string text is passed as a slot
 * that renders nothing.
 *
 * A control is a real button, unmarked and unwrapped. The static snapshot is
 * asserted against the number the case declares, so there is nothing here for
 * the component to imitate - and nothing here that renders a dismiss control,
 * because the reference has none.
 */
function renderAlert(parityCase: ParityCase): VNode {
  const content = (parityCase.content ?? {}) as { icon?: AlertSlot; title?: AlertSlot; body?: AlertSlot };
  const slots: Record<string, () => unknown> = {};
  const children = (slot: AlertSlot) => {
    const nodes: unknown[] = [];

    if (slot.text !== undefined && slot.text !== '') nodes.push(slot.text);
    if (slot.markup === 'paragraphs') {
      nodes.push(h('p', 'Storage, seats and outbound transfer.'), h('p', 'Updated hourly.'));
    }
    if (slot.control !== undefined) nodes.push(h('button', { type: 'button' }, slot.control.text));

    return nodes;
  };

  if (content.icon !== undefined) slots.icon = () => children(content.icon!);
  if (content.title !== undefined) slots.title = () => children(content.title!);
  if (content.body !== undefined) slots.default = () => children(content.body!);

  return h(VfAlert, { ...parityCase.props, ...parityCase.attrs }, slots);
}

/**
 * VfProgressSpinner, for the progress-spinner catalog.
 *
 * No slots and no wrapper: the historical component is a leaf, and the case
 * root is the only element around it. Props and attrs are merged the way every
 * other leaf's are - `size`, `strokeWidth`, `tone` and `label` reach the
 * component as props, and everything else falls through onto its root.
 *
 * Its own function, and deliberately not renderButton with `loading: true`:
 * the button renders this component, and the fixture is where "the standalone
 * catalog is really the button's loading catalog" would be easiest to
 * introduce and hardest to see.
 */
function renderProgressSpinner(parityCase: ParityCase): VNode {
  return h(VfProgressSpinner, { ...parityCase.props, ...parityCase.attrs } as Record<string, unknown>);
}

/**
 * VfProgressBar, for the progress-bar catalog.
 *
 * No slots and no wrapper: the historical component is a leaf. Props and
 * attrs are merged the way every other leaf's are - `value`, `max`,
 * `indeterminate`, `label`, `height`, `showValue`, `tone`, `striped` and
 * `animated` reach the component as props, and everything else falls through
 * onto its root.
 *
 * Its own function, and deliberately not a branch of renderProgressSpinner:
 * the two components share a role name, and the fixture is where "the bar's
 * catalog is really the spinner's with a value bolted on" would be easiest to
 * introduce and hardest to see. The labelledby case needs the element it
 * points at to exist, or the name cannot be resolved on any side; the
 * heading is appended after the bar, as the describedby hint is for VfInput.
 */
function renderProgressBar(parityCase: ParityCase): VNode[] {
  const nodes: VNode[] = [h(VfProgressBar, { ...parityCase.props, ...parityCase.attrs } as Record<string, unknown>)];

  if (parityCase.attrs['aria-labelledby'] === 'progress-bar-heading') {
    nodes.push(h('p', { id: 'progress-bar-heading', class: 'parity-hint' }, 'Upload progress'));
  }

  return nodes;
}

/**
 * The consumer markup a gate case names, built the same way in both fixtures.
 *
 * Real elements with no marker on them: the static snapshot is asserted against
 * the number the case declares, not against anything recognisable here, so
 * there is nothing for the component to imitate.
 */
function gateSlotChildren(slot: GateSlot): unknown[] {
  const nodes: unknown[] = [];

  if (slot.text !== undefined && slot.text !== '') nodes.push(slot.text);

  if (slot.markup === 'paragraphs') {
    nodes.push(h('p', 'Storage, seats and outbound transfer.'), h('p', 'Updated hourly.'));
  }
  if (slot.markup === 'article') {
    nodes.push(
      h('h4', 'Billing period'),
      h('p', 'Storage, seats and outbound transfer for the current period.'),
      h('ul', [h('li', 'Storage: 42 GB'), h('li', 'Seats: 12')]),
    );
  }
  if (slot.markup === 'bars') {
    nodes.push(
      h('div', { class: 'parity-bar', style: 'height: 12px; background: #ccc' }),
      h('div', { class: 'parity-bar', style: 'height: 12px; background: #ccc; margin-top: 6px' }),
    );
  }
  if (slot.control !== undefined) nodes.push(h('button', { type: 'button' }, slot.control.text));

  return nodes;
}

/**
 * The reactive props each VfSkeletonGate case is rendered with.
 *
 * A gate case is the first in the harness whose props are not constant: the
 * transition stage sets `ready` on the live component and the component
 * re-renders, which is what the historical component actually does when a
 * consumer's data arrives. Holding them in one reactive map here - rather than
 * re-mounting or re-rendering the page - is what makes the measurement a
 * transition rather than a second static render.
 */
const gateProps = reactive<Record<string, Record<string, unknown>>>({});

/**
 * VfSkeletonGate, for the skeleton-gate catalog.
 *
 * Each slot is passed only when the case declares it, because "no skeleton
 * slot" and "a skeleton slot" are different inputs: the first renders the
 * canonical child component and the second replaces it. Passing the slot
 * unconditionally would delete the gate's whole composition contract from the
 * fixture, which is the one thing this milestone exists to measure.
 */
function renderSkeletonGate(parityCase: ParityCase): VNode {
  const content = (parityCase.content ?? {}) as { body?: GateSlot; skeleton?: GateSlot };
  const slots: Record<string, () => unknown> = {};

  if (content.body !== undefined) slots.default = () => gateSlotChildren(content.body!);
  if (content.skeleton !== undefined) slots.skeleton = () => gateSlotChildren(content.skeleton!);

  gateProps[parityCase.id] ??= reactive({ ...parityCase.props, ...parityCase.attrs });

  return h(VfSkeletonGate, gateProps[parityCase.id], slots);
}

/**
 * The reactive props each VfAccordion instance is rendered with.
 *
 * Held reactively for one reason: a controlled case (`open` in its props) is
 * rendered the way a v-model consumer renders it, with update:open written
 * back into the prop. That is the historical public protocol, and the only
 * way a controlled accordion visibly changes state. An uncontrolled case is
 * left to the component.
 */
const accordionProps = reactive<Record<string, Record<string, unknown>>>({});

/**
 * The neutral event log the harness reads after a scenario.
 *
 * One entry per openChange the component emitted, for every instance in the
 * case - nested and sibling instances included - so the log says how many
 * times, and to which value, the case's accordions told their consumer they
 * changed. The Razor fixture keeps the same log from its controller's event.
 */
declare global {
  interface Window {
    __parityAccordionEvents?: Record<string, { open: boolean }[]>;
  }
}
window.__parityAccordionEvents = {};

function accordionSlotChildren(slot: AccordionSlot, caseId: string, inTrigger: boolean): unknown[] {
  const nodes: unknown[] = [];

  if (slot.text !== undefined && slot.text !== '') nodes.push(slot.text);
  if (slot.markup === 'article') {
    nodes.push(
      h('h4', 'Billing period'),
      h('p', 'Storage, seats and outbound transfer for the current period.'),
      h('ul', [h('li', 'Storage: 42 GB'), h('li', 'Seats: 12')]),
    );
  }
  // A real consumer control, unmarked and unwrapped: a link inside the
  // trigger, a button inside the panel.
  if (slot.control !== undefined) {
    nodes.push(
      inTrigger ? h('a', { href: '#' }, slot.control.text) : h('button', { type: 'button' }, slot.control.text),
    );
  }
  if (slot.accordion !== undefined) {
    const { text, ...props } = slot.accordion;
    nodes.push(
      renderAccordionInstance(caseId, `${caseId}/nested`, props, {}, text === undefined ? {} : { body: { text } }),
    );
  }

  return nodes;
}

function renderAccordionInstance(
  caseId: string,
  key: string,
  props: Record<string, unknown>,
  attrs: Record<string, unknown>,
  content: { trigger?: AccordionSlot; body?: AccordionSlot },
): VNode {
  const slots: Record<string, (scope: { open: boolean }) => unknown> = {};
  if (content.trigger !== undefined) slots.trigger = () => accordionSlotChildren(content.trigger!, caseId, true);
  if (content.body !== undefined) slots.default = () => accordionSlotChildren(content.body!, caseId, false);

  accordionProps[key] ??= reactive({ ...props, ...attrs });
  const live = accordionProps[key];
  const log = (window.__parityAccordionEvents![caseId] ??= []);

  return h(
    VfAccordion,
    {
      ...live,
      key,
      onOpenChange: (open: boolean) => log.push({ open }),
      // v-model:open, spelled out. A consumer that binds `open` writes the
      // emitted value back; an uncontrolled instance never has the prop and
      // the write is inert.
      ...('open' in live ? { 'onUpdate:open': (open: boolean) => (live.open = open) } : {}),
    },
    slots,
  );
}

/**
 * The reactive props each VfStepper instance is rendered with, for the same
 * reason the accordion's are: a controlled case (`modelValue` in its props) is
 * rendered the way a v-model consumer renders it, with update:modelValue
 * written back into the prop. An uncontrolled case is left to the component.
 */
const stepperProps = reactive<Record<string, Record<string, unknown>>>({});

/**
 * The neutral change log the harness reads after a stepper scenario: one entry
 * per `change` the component emitted, for every instance in the case. The
 * Razor fixture keeps the same log from its controller's `vf-stepper:change`.
 * The `update:modelValue` emit that precedes each `change` is the v-model
 * transport, pinned with its order by the characterization suite.
 */
declare global {
  interface Window {
    __parityStepperEvents?: Record<string, { value: string }[]>;
  }
}
window.__parityStepperEvents = {};

function renderStepperInstance(
  caseId: string,
  key: string,
  props: Record<string, unknown>,
  attrs: Record<string, unknown>,
): VNode {
  stepperProps[key] ??= reactive({ ...props, ...attrs });
  const live = stepperProps[key];
  const log = (window.__parityStepperEvents![caseId] ??= []);

  return h(VfStepper, {
    ...live,
    key,
    onChange: (value: string) => log.push({ value }),
    // v-model, spelled out. A consumer that binds `modelValue` writes the
    // emitted value back; an uncontrolled instance never has the prop and
    // the write is inert.
    ...('modelValue' in live ? { 'onUpdate:modelValue': (value: string) => (live.modelValue = value) } : {}),
  });
}

/**
 * VfStepper, for the stepper catalog.
 *
 * Its own function. The stepper has no slot, so the only consumer control a
 * case can hold is the `beside` one, rendered as a real sibling button after
 * the stepper's root - a control the consumer placed, never a trigger. A
 * `group` renders each member as its own instance; the case-level props are
 * ignored for a group, as the catalog says.
 */
function renderStepper(parityCase: ParityCase): VNode[] {
  const nodes: VNode[] = Array.isArray(parityCase.group)
    ? parityCase.group.map((member, index) =>
        renderStepperInstance(parityCase.id, `${parityCase.id}/${index}`, member, parityCase.attrs),
      )
    : [renderStepperInstance(parityCase.id, parityCase.id, parityCase.props, parityCase.attrs)];

  if (parityCase.content?.beside?.control !== undefined) {
    nodes.push(h('button', { type: 'button' }, parityCase.content.beside.control.text));
  }

  return nodes;
}

/**
 * The reactive props each VfTabs instance is rendered with, for the same
 * reason the stepper's are: a controlled case (`modelValue` in its props) is
 * rendered the way a v-model consumer renders it, with update:modelValue
 * written back into the prop. An uncontrolled case is left to the component.
 */
const tabsProps = reactive<Record<string, Record<string, unknown>>>({});

/**
 * The neutral change log the harness reads after a tabs scenario: one entry
 * per `change` the component emitted, for every instance in the case. The
 * Razor fixture keeps the same log from its controller's `vf-tabs:change`.
 * The `update:modelValue` emit that precedes each `change` is the v-model
 * transport, pinned with its order by the characterization suite.
 */
declare global {
  interface Window {
    __parityTabsEvents?: Record<string, { value: string }[]>;
  }
}
window.__parityTabsEvents = {};

function renderTabsInstance(
  caseId: string,
  key: string,
  props: Record<string, unknown>,
  attrs: Record<string, unknown>,
  content: NonNullable<ParityCase['content']>,
): VNode {
  tabsProps[key] ??= reactive({ ...props, ...attrs });
  const live = tabsProps[key];
  const log = (window.__parityTabsEvents![caseId] ??= []);
  const slots: Record<string, (scope: never) => VNode | VNode[]> = {};

  // The panel slot, as the catalog spells it: the text followed by the active
  // value in one paragraph - so the slot's activeValue is visible - and a
  // real consumer button after it when the case declares one. The Razor
  // fixture writes the same paragraph per item into `panel{index}` slots.
  if (content.panel !== undefined) {
    const panel = content.panel;
    slots.panel = ({ activeValue }: { activeValue: string }) => {
      const nodes = [h('p', `${panel.text ?? ''} ${activeValue}`)];
      if (panel.control) nodes.push(h('button', { type: 'button', class: 'parity-panel-control' }, panel.control.text));
      return nodes;
    };
  }
  if (content.tab?.numbered) {
    slots.tab = ({ item, index }: { item: { label: string }; index: number }) =>
      h('span', `${index + 1}. ${item.label}`);
  }

  return h(
    VfTabs,
    {
      ...live,
      key,
      onChange: (value: string) => log.push({ value }),
      ...('modelValue' in live ? { 'onUpdate:modelValue': (value: string) => (live.modelValue = value) } : {}),
    },
    slots,
  );
}

/**
 * VfTabs, for the tabs catalog.
 *
 * Its own function. A `before` control is a real consumer button written
 * before the root; a `group` renders each member as its own instance with the
 * case's content, and the case-level props are ignored for a group, as the
 * catalog says. Nothing here renders a button that is not the consumer's
 * declared control.
 */
function renderTabs(parityCase: ParityCase): VNode[] {
  const content = parityCase.content ?? {};
  const nodes: VNode[] = [];

  if (content.before?.control !== undefined) {
    nodes.push(h('button', { type: 'button', class: 'parity-before' }, content.before.control.text));
  }
  if (Array.isArray(parityCase.group)) {
    parityCase.group.forEach((member, index) => {
      nodes.push(renderTabsInstance(parityCase.id, `${parityCase.id}/${index}`, member, parityCase.attrs, content));
    });
  } else {
    nodes.push(renderTabsInstance(parityCase.id, parityCase.id, parityCase.props, parityCase.attrs, content));
  }

  return nodes;
}

/**
 * VfAccordion, for the accordion catalog.
 *
 * Its own function, and deliberately not renderPanel or renderCard with a
 * trigger bolted on: the accordion is the first component with a control of
 * its own, and the fixture is where "the trigger is really a consumer button
 * the fixture wrote" would be easiest to introduce and hardest to see. Nothing
 * here renders a button that is not the consumer's declared control.
 *
 * A `group` renders each member as its own instance with the case's content;
 * the case-level props are ignored for a group, as the catalog says.
 */
function renderAccordion(parityCase: ParityCase): VNode[] {
  const content = (parityCase.content ?? {}) as { trigger?: AccordionSlot; body?: AccordionSlot };

  if (Array.isArray(parityCase.group)) {
    return parityCase.group.map((member, index) =>
      renderAccordionInstance(parityCase.id, `${parityCase.id}/${index}`, member, parityCase.attrs, content),
    );
  }

  return [renderAccordionInstance(parityCase.id, parityCase.id, parityCase.props, parityCase.attrs, content)];
}

/**
 * The reactive props each VfGroupBox instance is rendered with, for the reason
 * the accordion's are: a controlled case (`collapsed` in its props) is
 * rendered the way a v-model consumer renders it, with update:collapsed
 * written back into the prop. An uncontrolled case is left to the component.
 */
const groupBoxProps = reactive<Record<string, Record<string, unknown>>>({});

/**
 * The neutral collapsed-change log the harness reads after a group box
 * scenario: one entry per collapsedChange, for every instance in the case -
 * nested and sibling instances included. The update:collapsed emit that
 * precedes each one is the v-model transport, pinned with its order by the
 * characterization suite. The Razor fixture keeps the same log from its
 * controller's `vf-group-box:collapsed-change`.
 */
declare global {
  interface Window {
    __parityGroupBoxEvents?: Record<string, { collapsed: boolean }[]>;
  }
}
window.__parityGroupBoxEvents = {};

function groupBoxSlotChildren(slot: GroupBoxSlot, caseId: string, inTitle: boolean): unknown[] {
  const nodes: unknown[] = [];

  if (slot.text !== undefined && slot.text !== '') nodes.push(slot.text);
  if (slot.markup === 'rich') nodes.push(h('strong', 'Invoice'), ' ', h('em', '#1024'));
  if (slot.markup === 'paragraphs') {
    nodes.push(h('p', 'Invoice #1024 · Design service.'), h('p', 'Due on receipt.'));
  }
  if (slot.control !== undefined) {
    nodes.push(inTitle ? h('a', { href: '#' }, slot.control.text) : h('button', { type: 'button' }, slot.control.text));
  }
  if (slot.groupBox !== undefined) {
    const { text, ...props } = slot.groupBox;
    nodes.push(
      renderGroupBoxInstance(caseId, `${caseId}/nested`, props, {}, text === undefined ? {} : { body: { text } }),
    );
  }

  return nodes;
}

function renderGroupBoxInstance(
  caseId: string,
  key: string,
  props: Record<string, unknown>,
  attrs: Record<string, unknown>,
  content: { title?: GroupBoxSlot; toggleIcon?: { text?: string }; body?: GroupBoxSlot },
): VNode {
  const slots: Record<string, () => unknown> = {};
  if (content.title !== undefined) slots.title = () => groupBoxSlotChildren(content.title!, caseId, true);
  if (content.toggleIcon !== undefined) slots['toggle-icon'] = () => content.toggleIcon!.text ?? '';
  if (content.body !== undefined) slots.default = () => groupBoxSlotChildren(content.body!, caseId, false);

  groupBoxProps[key] ??= reactive({ ...props, ...attrs });
  const live = groupBoxProps[key];
  const log = (window.__parityGroupBoxEvents![caseId] ??= []);

  return h(
    VfGroupBox,
    {
      ...live,
      key,
      onCollapsedChange: (collapsed: boolean) => log.push({ collapsed }),
      // v-model:collapsed, spelled out. A consumer that binds `collapsed`
      // writes the emitted value back; an uncontrolled instance never has the
      // prop and the write is inert.
      ...('collapsed' in live ? { 'onUpdate:collapsed': (collapsed: boolean) => (live.collapsed = collapsed) } : {}),
    },
    slots,
  );
}

/**
 * VfGroupBox, for the group box catalog.
 *
 * Its own function, not the accordion's with a legend bolted on: nothing here
 * renders a button that is not the consumer's declared control. A `group`
 * renders each member as its own instance with the case's content.
 */
function renderGroupBox(parityCase: ParityCase): VNode[] {
  const content = (parityCase.content ?? {}) as {
    title?: GroupBoxSlot;
    toggleIcon?: { text?: string };
    body?: GroupBoxSlot;
  };

  if (Array.isArray(parityCase.group)) {
    return parityCase.group.map((member, index) =>
      renderGroupBoxInstance(parityCase.id, `${parityCase.id}/${index}`, member, parityCase.attrs, content),
    );
  }

  return [renderGroupBoxInstance(parityCase.id, parityCase.id, parityCase.props, parityCase.attrs, content)];
}

function renderIconButton(parityCase: ParityCase): VNode {
  // No slots and no wrapper: the historical VfIconButton renders one button
  // carrying one glyph, and the case root is the only element around it.
  return h(VfIconButton, { ...parityCase.props, ...parityCase.attrs } as Record<string, unknown>);
}

function renderCase(parityCase: ParityCase): VNode {
  if (catalog.component === 'badge') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderBadge(parityCase)]);
  }

  if (catalog.component === 'tag') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderTag(parityCase)]);
  }

  if (catalog.component === 'divider') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderDivider(parityCase)]);
  }

  // Three branches rather than one parameterised renderer, for the reason the
  // M15 toned spans got three: the fixture is where a substitution would be
  // easiest to introduce and hardest to see.
  if (catalog.component === 'skeleton') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderSkeleton(parityCase)]);
  }

  if (catalog.component === 'avatar') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderAvatar(parityCase)]);
  }

  if (catalog.component === 'card') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderCard(parityCase)]);
  }

  if (catalog.component === 'panel') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderPanel(parityCase)]);
  }

  if (catalog.component === 'alert') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderAlert(parityCase)]);
  }

  if (catalog.component === 'progress-spinner') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderProgressSpinner(parityCase)]);
  }

  if (catalog.component === 'progress-bar') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderProgressBar(parityCase));
  }

  if (catalog.component === 'skeleton-gate') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderSkeletonGate(parityCase)]);
  }

  if (catalog.component === 'accordion') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderAccordion(parityCase));
  }

  if (catalog.component === 'stepper') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderStepper(parityCase));
  }

  if (catalog.component === 'tabs') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderTabs(parityCase));
  }

  if (catalog.component === 'link') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderLink(parityCase));
  }

  if (catalog.component === 'breadcrumbs') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderBreadcrumbs(parityCase));
  }

  if (catalog.component === 'menu') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderMenu(parityCase));
  }

  if (catalog.component === 'menu-item') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderMenuItem(parityCase));
  }

  if (catalog.component === 'dropdown') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderDropdown(parityCase));
  }

  if (catalog.component === 'group-box') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderGroupBox(parityCase));
  }

  if (catalog.component === 'popover') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, renderPopover(parityCase));
  }

  if (catalog.component === 'tooltip') {
    const layout = ((parityCase.content ?? {}) as unknown as TooltipContent).layout;
    return h(
      'div',
      { class: ['parity-case', layout && `parity-tooltip-${layout}`], 'data-parity-case': parityCase.id },
      renderTooltip(parityCase),
    );
  }

  if (catalog.component === 'icon-button') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderIconButton(parityCase)]);
  }

  if (['checkbox', 'radio', 'switch'].includes(catalog.component ?? '')) {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [
      renderCheckable(catalog.component as string, parityCase),
    ]);
  }

  if (catalog.component === 'textarea') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderTextarea(parityCase)]);
  }

  if (catalog.component === 'button') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderButton(parityCase)]);
  }

  if (catalog.component === 'field') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderField(parityCase)]);
  }

  const children: VNode[] = [];

  if (parityCase.field) {
    const field = parityCase.field;
    children.push(
      h(
        VfField,
        {
          label: field.label,
          labelPlacement: field.placement,
          ...(field.variant ? { floatingVariant: field.variant } : {}),
          ...(field.description ? { description: field.description } : {}),
          ...(field.error ? { error: field.error } : {}),
        },
        {
          default: ({ controlId, describedBy, invalid }: Record<string, unknown>) =>
            renderInput(parityCase, { id: controlId, 'aria-describedby': describedBy, invalid }),
        },
      ),
    );
  } else {
    children.push(renderInput(parityCase));
  }

  // The described-by case needs the element it points at to exist, or the
  // relationship cannot be resolved on either side.
  if (parityCase.attrs['aria-describedby'] === 'aria-described-hint') {
    children.push(h('p', { id: 'aria-described-hint', class: 'parity-hint' }, 'Shown in workspace settings.'));
  }

  return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, children);
}

const Cases = defineComponent({
  render: () => h('div', { class: 'parity-cases' }, catalog.cases.map(renderCase)),
});

/**
 * The transition mechanism, exposed to the harness.
 *
 * Sets props on a mounted component and waits for the render to flush. This is
 * the historical public API - a consumer changes `ready` and the gate reacts -
 * and it is the only thing the harness is given: it cannot reach into the
 * component, cannot re-render the page, and cannot fabricate a state the
 * component did not produce.
 *
 * Declared on window rather than exported because the harness drives it through
 * CDP, from outside the module graph.
 */
declare global {
  interface Window {
    __parityTransition?: (caseId: string, to: Record<string, unknown>) => Promise<boolean>;
  }
}

window.__parityTransition = async (caseId, to) => {
  const props = gateProps[caseId];
  if (!props) return false;

  Object.assign(props, to);
  await nextTick();

  return true;
};

const theme = new URLSearchParams(window.location.search).get('theme') ?? 'light';
document.documentElement.setAttribute('data-vf-theme', theme);

if (catalog.component === 'dropdown') installDropdownLogs();
if (catalog.component === 'popover') installPopoverLogs();
if (catalog.component === 'tooltip') {
  installTooltipLogs(tooltipDelays());
  // A Teleport resolves a selector when it mounts, so every selector target
  // exists in <body>, outside every case, before the app does - where the
  // Razor fixture renders them too.
  for (const parityCase of catalog.cases) {
    const members = Array.isArray(parityCase.group) ? parityCase.group : [parityCase.props];
    for (const member of members) {
      if (typeof member.teleportTo !== 'string' || document.querySelector(member.teleportTo)) continue;
      const target = document.body.appendChild(document.createElement('div'));
      target.id = member.teleportTo.slice(1);
      target.className = 'parity-tooltip-target';
    }
  }
}

createApp(Cases).mount('#parity-root');

// A dropdown page is ready once every overlay that entered on mount - the
// initially open menus' appear transition - has finished, so the initial
// extraction measures a settled menu rather than one frame of its enter.
// Bounded; every other catalog is ready at once, as before. The popover page
// (M30) waits the same way for the same reason.
if (catalog.component === 'dropdown' || catalog.component === 'popover') {
  void (async () => {
    const deadline = performance.now() + 2000;
    while (document.querySelector('[class*="vf-floating-transition-"]') && performance.now() < deadline) {
      await new Promise((tick) => setTimeout(tick, 20));
    }
    // One resize, answered by autoUpdate on the next frame, so every open
    // menu stands at its settled position before anything is captured: the
    // screenshot's beyond-viewport resize would otherwise race that update.
    window.dispatchEvent(new Event('resize'));
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done))));
    // And one full repaint, so every open menu is rasterised afresh at its
    // settled position - see the dropdown snapshot in extract.mjs.
    document.body.style.opacity = '0.999';
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    document.body.removeAttribute('style');
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    document.documentElement.setAttribute('data-parity-ready', 'true');
  })();
} else {
  document.documentElement.setAttribute('data-parity-ready', 'true');
}
