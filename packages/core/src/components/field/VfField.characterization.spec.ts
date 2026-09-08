// Characterization of the historical VfField at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// These tests record observable behaviour before a Razor adapter is written
// against it. Where the reference does something surprising, the surprise is
// asserted as-is: the historical implementation is the specification, and M11
// is a migration, not a redesign.
//
// The two behaviours worth reading first, because a Razor port that guessed
// would get both wrong:
//
//  - The field does NOT put `aria-describedby` on anything. It computes the
//    value and hands it to the default slot; whether it ever reaches the
//    control is the consumer's decision.
//  - A floating label is not decided by `labelPlacement` alone. The control
//    inside the slot has to opt in through the field context, so a field with
//    no such control renders a plain top label no matter what was asked for.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, defineComponent, h, inject, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';

import { vfFieldContextKey } from './context';
import VfField from './VfField.vue';

/**
 * A control that opts into floating support the way VfInput does.
 *
 * VfInput calls `setFloatingSupported(true)` during setup and reports its
 * filled state through the same context. Anything standing in for a control
 * has to do the same or the field behaves as though it were empty.
 */
const ControlStub = defineComponent({
  name: 'ControlStub',
  props: {
    controlId: { type: String, default: undefined },
    describedBy: { type: String, default: undefined },
    filled: { type: Boolean, default: false },
    supportsFloating: { type: Boolean, default: true },
  },
  setup(props) {
    const field = inject(vfFieldContextKey, null);

    if (props.supportsFloating) field?.setFloatingSupported(true);
    field?.setFilled(props.filled);

    return () =>
      h('input', {
        class: 'stub-control',
        id: props.controlId,
        'aria-describedby': props.describedBy,
      });
  },
});

/** Mounts a field wrapping a control that behaves like VfInput. */
function mountField(props: Record<string, unknown> = {}, controlProps: Record<string, unknown> = {}) {
  return mount(VfField, {
    attachTo: document.body,
    props,
    slots: {
      default: (scope: Record<string, unknown>) =>
        h(ControlStub, {
          controlId: scope.controlId as string,
          describedBy: scope.describedBy as string | undefined,
          ...controlProps,
        }),
    },
  });
}

describe('VfField characterization: structure and defaults', () => {
  it('renders a div root carrying the canonical class', () => {
    const wrapper = mountField();

    expect(wrapper.element.tagName).toBe('DIV');
    expect(wrapper.classes()).toEqual(['vf-field']);
  });

  it('renders no label, description or error when given none', () => {
    const wrapper = mountField();

    expect(wrapper.find('.vf-field__label').exists()).toBe(false);
    expect(wrapper.find('.vf-field__description').exists()).toBe(false);
    expect(wrapper.find('.vf-field__error').exists()).toBe(false);
  });

  it('always wraps the default slot in a control element', () => {
    const control = mountField().get('.vf-field__control');

    expect(control.element.tagName).toBe('DIV');
    expect(control.find('.stub-control').exists()).toBe(true);
  });

  it('places a top label before the control, as a sibling rather than a wrapper', () => {
    const wrapper = mountField({ label: 'Workspace' });
    const children = [...wrapper.element.children].map((child) => child.className);

    expect(children).toEqual(['vf-field__label', 'vf-field__control']);
    expect(wrapper.get('.vf-field__label').element.tagName).toBe('LABEL');
  });
});

describe('VfField characterization: label and control association', () => {
  it('points the label at the id it handed to the slot', () => {
    const wrapper = mountField({ label: 'Workspace' });
    const forAttribute = wrapper.get('label').attributes('for');

    expect(forAttribute).toBeTruthy();
    expect(wrapper.get('.stub-control').attributes('id')).toBe(forAttribute);
  });

  it('generates a control id under a stable prefix', () => {
    expect(mountField({ label: 'Workspace' }).get('label').attributes('for')).toMatch(/^vf-field-control-/);
  });

  it('gives two fields on one page distinct ids and binds each label to its own control', () => {
    // Mounted inside a single app: Vue's useId counter is per application, so
    // two separate mount() calls would each restart it and prove nothing.
    const Page = defineComponent({
      render: () =>
        h('div', [
          h(
            VfField,
            { label: 'First', description: 'First hint' },
            {
              default: (scope: Record<string, unknown>) =>
                h(ControlStub, { controlId: scope.controlId as string, describedBy: scope.describedBy as string }),
            },
          ),
          h(
            VfField,
            { label: 'Second', description: 'Second hint' },
            {
              default: (scope: Record<string, unknown>) =>
                h(ControlStub, { controlId: scope.controlId as string, describedBy: scope.describedBy as string }),
            },
          ),
        ]),
    });
    const wrapper = mount(Page, { attachTo: document.body });
    const fields = wrapper.findAll('.vf-field');
    const ids = fields.flatMap((field) => [
      field.get('label').attributes('for'),
      field.get('.vf-field__description').attributes('id'),
    ]);

    expect(new Set(ids).size).toBe(ids.length);

    for (const field of fields) {
      expect(field.get('.stub-control').attributes('id')).toBe(field.get('label').attributes('for'));
      expect(field.get('.stub-control').attributes('aria-describedby')).toBe(
        field.get('.vf-field__description').attributes('id'),
      );
    }
  });

  it('renders the label from the label slot when both a slot and a prop are given', () => {
    const wrapper = mount(VfField, {
      props: { label: 'From prop' },
      slots: { label: () => 'From slot', default: () => h(ControlStub) },
    });

    expect(wrapper.get('.vf-field__label').text()).toBe('From slot');
  });

  it('renders a label element for a label slot with no label prop', () => {
    const wrapper = mount(VfField, {
      slots: { label: () => 'Slot only', default: () => h(ControlStub) },
    });

    expect(wrapper.find('.vf-field__label').exists()).toBe(true);
  });
});

describe('VfField characterization: required marker', () => {
  it('renders no required marker by default', () => {
    expect(mountField({ label: 'Workspace' }).find('.vf-field__required-mark').exists()).toBe(false);
  });

  it('renders an aria-hidden asterisk inside the label when required', () => {
    const mark = mountField({ label: 'Workspace', required: true }).get('.vf-field__required-mark');

    expect(mark.element.tagName).toBe('SPAN');
    expect(mark.text()).toBe('*');
    expect(mark.attributes('aria-hidden')).toBe('true');
    expect(mark.element.parentElement?.className).toBe('vf-field__label');
  });

  it('renders no marker when required is set but there is no label to carry it', () => {
    // The marker lives inside the label element, so a label-less field drops it.
    expect(mountField({ required: true }).find('.vf-field__required-mark').exists()).toBe(false);
  });

  it('reports required through the slot scope regardless of whether a label exists', () => {
    const seen: unknown[] = [];
    mount(VfField, {
      props: { required: true },
      slots: {
        default: (scope: Record<string, unknown>) => {
          seen.push(scope.required);
          return h(ControlStub);
        },
      },
    });

    expect(seen).toContain(true);
  });
});

describe('VfField characterization: description, error and invalid', () => {
  it('renders the description as a paragraph carrying a generated id', () => {
    const description = mountField({ description: 'Shown to collaborators' }).get('.vf-field__description');

    expect(description.element.tagName).toBe('P');
    expect(description.text()).toBe('Shown to collaborators');
    expect(description.attributes('id')).toMatch(/^vf-field-description-/);
  });

  it('renders the error as a paragraph carrying a generated id', () => {
    const error = mountField({ error: 'Name is taken' }).get('.vf-field__error');

    expect(error.element.tagName).toBe('P');
    expect(error.attributes('id')).toMatch(/^vf-field-error-/);
  });

  it('orders description before error, both after the control', () => {
    const wrapper = mountField({ label: 'L', description: 'D', error: 'E' });

    expect([...wrapper.element.children].map((child) => child.className)).toEqual([
      'vf-field__label',
      'vf-field__control',
      'vf-field__description',
      'vf-field__error',
    ]);
  });

  it('marks the field invalid when an error is present, without the invalid prop', () => {
    expect(mountField({ error: 'Name is taken' }).classes()).toContain('vf-field--invalid');
  });

  it('marks the field invalid from the prop alone, with no error text rendered', () => {
    const wrapper = mountField({ invalid: true });

    expect(wrapper.classes()).toContain('vf-field--invalid');
    expect(wrapper.find('.vf-field__error').exists()).toBe(false);
  });

  it('never puts aria-describedby on the field or the control itself', () => {
    // The field computes the value and hands it to the slot. Applying it is the
    // consumer's job, which is why the harness binds it explicitly.
    const wrapper = mount(VfField, {
      props: { description: 'D', error: 'E' },
      slots: { default: () => h('input', { class: 'bare-control' }) },
    });

    expect(wrapper.attributes('aria-describedby')).toBeUndefined();
    expect(wrapper.get('.bare-control').attributes('aria-describedby')).toBeUndefined();
  });

  it('describes the control with the description id, then the error id, space separated', () => {
    const wrapper = mountField({ description: 'D', error: 'E' });
    const describedBy = wrapper.get('.stub-control').attributes('aria-describedby');

    expect(describedBy).toBe(
      `${wrapper.get('.vf-field__description').attributes('id')} ${wrapper.get('.vf-field__error').attributes('id')}`,
    );
  });

  it('omits describedBy entirely when there is neither description nor error', () => {
    expect(mountField({ label: 'L' }).get('.stub-control').attributes('aria-describedby')).toBeUndefined();
  });
});

describe('VfField characterization: floating label', () => {
  it('does not float without a control that supports it, even when asked to', () => {
    // The quirk that matters most for a port: labelPlacement alone is not
    // enough. The control opts in through the field context.
    const wrapper = mountField({ label: 'Workspace', labelPlacement: 'floating' }, { supportsFloating: false });

    expect(wrapper.classes()).not.toContain('vf-field--floating');
    expect([...wrapper.element.children].map((child) => child.className)).toEqual([
      'vf-field__label',
      'vf-field__control',
    ]);
  });

  it('floats when the control opts in, moving the label inside the control after the slot', async () => {
    const wrapper = mountField({ label: 'Workspace', labelPlacement: 'floating' });
    await nextTick();
    const control = wrapper.get('.vf-field__control');

    expect(wrapper.classes()).toContain('vf-field--floating');
    expect(control.get('label').classes()).toEqual(['vf-field__label', 'vf-field__label--floating']);
    expect([...control.element.children].map((child) => child.tagName)).toEqual(['INPUT', 'LABEL']);
    expect(wrapper.element.querySelector(':scope > .vf-field__label')).toBeNull();
  });

  it('emits the floating variant class, defaulting to in', async () => {
    const inVariant = mountField({ label: 'L', labelPlacement: 'floating' });
    const overVariant = mountField({ label: 'L', labelPlacement: 'floating', floatingVariant: 'over' });
    await nextTick();

    expect(inVariant.classes()).toContain('vf-field--floating-in');
    expect(overVariant.classes()).toContain('vf-field--floating-over');
  });

  it('does not float a field that has no label at all', () => {
    expect(mountField({ labelPlacement: 'floating' }).classes()).not.toContain('vf-field--floating');
  });

  it('marks the control floating and keeps the label association intact', async () => {
    const wrapper = mountField({ label: 'Workspace', labelPlacement: 'floating' });
    await nextTick();

    expect(wrapper.get('.vf-field__control').classes()).toContain('vf-field__control--floating');
    expect(wrapper.get('label').attributes('for')).toBe(wrapper.get('.stub-control').attributes('id'));
  });
});

describe('VfField characterization: filled state', () => {
  it('is not filled by default', () => {
    expect(mountField().get('.vf-field__control').classes()).toEqual(['vf-field__control']);
  });

  it('marks the control filled when the control reports a value', async () => {
    const wrapper = mountField({ label: 'L', labelPlacement: 'floating' }, { filled: true });
    await nextTick();

    expect(wrapper.get('.vf-field__control').classes()).toContain('vf-field__control--filled');
  });

  it('tracks filled independently of floating', async () => {
    // A top-placed field still records filled, so the class is not gated on
    // floating even though only floating layouts use it visually.
    const wrapper = mountField({ label: 'L' }, { filled: true });
    await nextTick();

    expect(wrapper.get('.vf-field__control').classes()).toContain('vf-field__control--filled');
  });
});

describe('VfField characterization: class composition and attribute fallthrough', () => {
  it('emits classes in a fixed order: base, invalid, floating, floating variant', async () => {
    const wrapper = mountField({ label: 'L', labelPlacement: 'floating', invalid: true });
    await nextTick();

    expect(wrapper.classes()).toEqual(['vf-field', 'vf-field--invalid', 'vf-field--floating', 'vf-field--floating-in']);
  });

  it('merges a consumer class onto the root rather than replacing the canonical ones', () => {
    const wrapper = mount(VfField, {
      props: { label: 'L' },
      attrs: { class: 'consumer-field' },
      slots: { default: () => h(ControlStub) },
    });

    expect(wrapper.classes()).toContain('vf-field');
    expect(wrapper.classes()).toContain('consumer-field');
  });

  it('falls a consumer style and data attribute through to the root', () => {
    const wrapper = mount(VfField, {
      props: { label: 'L' },
      attrs: { style: 'margin-top: 8px', 'data-testid': 'field' },
      slots: { default: () => h(ControlStub) },
    });

    expect(wrapper.attributes('style')).toBe('margin-top: 8px;');
    expect(wrapper.attributes('data-testid')).toBe('field');
  });
});

describe('VfField characterization: when floating and filled actually appear', () => {
  // Two timing quirks that a port has to know about, because both decide what
  // the server is allowed to emit.
  it('renders no floating class on the first paint, only after the control has registered', async () => {
    const wrapper = mountField({ label: 'Workspace', labelPlacement: 'floating' });

    // The control opts in during its own setup, which runs while the field is
    // already rendering, so the field's first output cannot include the class.
    expect(wrapper.classes()).toEqual(['vf-field']);

    await nextTick();

    expect(wrapper.classes()).toContain('vf-field--floating');
  });

  it('never emits floating or filled classes from server-side rendering', async () => {
    // The consequence of the same ordering: SSR has no second pass, so a
    // floating field is serialised as a plain top-label field. Vue only
    // corrects it on the client. A server-rendered adapter that emitted the
    // floating class would therefore not be reproducing Vue's SSR output - it
    // would be reproducing Vue's browser output, which is what parity compares.
    const app = createSSRApp({
      render: () =>
        h(VfField, { label: 'L', labelPlacement: 'floating' }, { default: () => h(ControlStub, { filled: true }) }),
    });
    const html = await renderToString(app);

    expect(html).toContain('class="vf-field"');
    expect(html).not.toContain('vf-field--floating');
    expect(html).not.toContain('vf-field__control--filled');
    // The label association survives SSR, because ids are resolved during render.
    expect(html).toMatch(/<label for="vf-field-control-[^"]+" class="vf-field__label">/);
  });
});
