// Renders a component's shared cases with the Vue adapter.
//
// One entry serves both Vue targets and every component. Which sources it
// mounts is decided by the build config's tree root: the immutable reference
// checkout for the reference target, the working tree for the current target.
// Which component it renders is decided by the catalog's `component` field. The
// entry itself contains no component implementation and no expectations — it
// only maps the neutral case data onto the historical Vue props and slots.
import { createApp, defineComponent, h, type VNode } from 'vue';
import VfInput from '@parity/core/components/input/VfInput.vue';
import VfIconButton from '@parity/core/components/icon-button/VfIconButton.vue';
import VfField from '@parity/core/components/field/VfField.vue';
import VfButton from '@parity/core/components/button/VfButton.vue';
import VfTextarea from '@parity/core/components/textarea/VfTextarea.vue';
import VfCheckbox from '@parity/core/components/checkbox/VfCheckbox.vue';
import VfRadio from '@parity/core/components/radio/VfRadio.vue';
import VfSwitch from '@parity/core/components/switch/VfSwitch.vue';
import { VueIconify } from '@codemonster-ru/vueforge-icons';
import '@parity/core/styles/components.css';
import cases from '@parity/cases.json';

interface CaseContent {
  text?: string;
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
    /** VfButton writes its icon into the default slot; there is no icon prop. */
    icon?: string;
  };
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

function renderIconButton(parityCase: ParityCase): VNode {
  // No slots and no wrapper: the historical VfIconButton renders one button
  // carrying one glyph, and the case root is the only element around it.
  return h(VfIconButton, { ...parityCase.props, ...parityCase.attrs } as Record<string, unknown>);
}

function renderCase(parityCase: ParityCase): VNode {
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

const theme = new URLSearchParams(window.location.search).get('theme') ?? 'light';
document.documentElement.setAttribute('data-vf-theme', theme);

createApp(Cases).mount('#parity-root');
document.documentElement.setAttribute('data-parity-ready', 'true');
