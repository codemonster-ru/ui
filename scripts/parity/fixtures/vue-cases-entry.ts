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
import '@parity/core/styles/components.css';
import cases from '@parity/cases.json';

interface CaseContent {
  text?: string;
}

interface CaseField {
  label: string;
  placement: 'top' | 'floating';
  variant?: string;
  description?: string;
  error?: string;
}

interface ParityCase {
  id: string;
  props: Record<string, unknown>;
  attrs: Record<string, unknown>;
  content?: { leading?: CaseContent; trailing?: CaseContent };
  field?: CaseField;
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

function renderIconButton(parityCase: ParityCase): VNode {
  // No slots and no wrapper: the historical VfIconButton renders one button
  // carrying one glyph, and the case root is the only element around it.
  return h(VfIconButton, { ...parityCase.props, ...parityCase.attrs } as Record<string, unknown>);
}

function renderCase(parityCase: ParityCase): VNode {
  if (catalog.component === 'icon-button') {
    return h('div', { class: 'parity-case', 'data-parity-case': parityCase.id }, [renderIconButton(parityCase)]);
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
