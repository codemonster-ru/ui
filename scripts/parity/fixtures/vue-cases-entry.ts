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
import { VueIconify } from '@codemonster-ru/vueforge-icons';
import '@parity/core/styles/components.css';
import cases from '@parity/cases.json';

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

interface ParityCase {
  id: string;
  props: Record<string, unknown>;
  attrs: Record<string, unknown>;
  content?: {
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
  };
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

createApp(Cases).mount('#parity-root');
document.documentElement.setAttribute('data-parity-ready', 'true');
