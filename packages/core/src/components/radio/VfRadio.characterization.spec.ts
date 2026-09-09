// Characterization of the historical VfRadio at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// Deliberately not derived from the VfCheckbox suite. The two differ in the
// place that matters most: a checkbox's model is a boolean it owns, while a
// radio's model is a value it *compares itself against* with ===, and it emits
// its own `value` rather than a boolean. A radio also never emits on being
// unchecked - the browser unchecks it as a side effect of another radio being
// chosen, and this component stays silent about that.
import { mount } from '@vue/test-utils';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it } from 'vitest';

import VfRadio from './VfRadio.vue';

type RadioProps = InstanceType<typeof VfRadio>['$props'];

function mountRadio({
  props = { value: 'a' },
  attrs = {},
  slots = {},
}: {
  props?: Partial<RadioProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, string>;
} = {}) {
  return mount(VfRadio, { attachTo: document.body, props: props as RadioProps, attrs, slots });
}

describe('VfRadio characterization: structure', () => {
  it('renders a label as its root', () => {
    expect(mountRadio().element.tagName).toBe('LABEL');
  });

  it('renders a native radio input', () => {
    const input = mountRadio().get('input');

    expect(input.attributes('type')).toBe('radio');
    expect(input.classes()).toEqual(['vf-radio__input']);
  });

  it('renders an aria-hidden control holding a dot', () => {
    const control = mountRadio().get('.vf-radio__control');

    expect(control.attributes('aria-hidden')).toBe('true');
    expect(control.find('.vf-radio__dot').exists()).toBe(true);
  });

  it('renders content only when a label or slot is given', () => {
    expect(mountRadio().find('.vf-radio__content').exists()).toBe(false);
    expect(
      mountRadio({ props: { value: 'a', label: 'Alpha' } })
        .get('.vf-radio__content')
        .text(),
    ).toBe('Alpha');
  });

  it('carries no aria-checked, unlike VfCheckbox', () => {
    // The two components disagree here, and the difference is preserved.
    expect(mountRadio().get('input').attributes('aria-checked')).toBeUndefined();
  });
});

describe('VfRadio characterization: value and checked', () => {
  it('renders its value onto the input', () => {
    expect(
      mountRadio({ props: { value: 'alpha' } })
        .get('input')
        .attributes('value'),
    ).toBe('alpha');
  });

  it('is checked when the model strictly equals its value', () => {
    const checked = mountRadio({ props: { value: 'a', modelValue: 'a' } });

    expect((checked.get('input').element as HTMLInputElement).checked).toBe(true);
    expect(checked.classes()).toContain('vf-radio--checked');
  });

  it('is not checked when the model differs', () => {
    const wrapper = mountRadio({ props: { value: 'a', modelValue: 'b' } });

    expect((wrapper.get('input').element as HTMLInputElement).checked).toBe(false);
    expect(wrapper.classes()).not.toContain('vf-radio--checked');
  });

  it('compares strictly, so a number model does not match a string value', () => {
    // A quirk: === means 1 and '1' are different radios.
    expect(mountRadio({ props: { value: '1', modelValue: 1 } }).classes()).not.toContain('vf-radio--checked');
    expect(mountRadio({ props: { value: 1, modelValue: 1 } }).classes()).toContain('vf-radio--checked');
  });

  it('accepts boolean values', () => {
    expect(mountRadio({ props: { value: false, modelValue: false } }).classes()).toContain('vf-radio--checked');
  });

  it('is unchecked when the model is left undefined', () => {
    expect(mountRadio({ props: { value: 'a' } }).classes()).not.toContain('vf-radio--checked');
  });
});

describe('VfRadio characterization: classes', () => {
  it('always emits a size modifier, including at the default size', () => {
    expect(mountRadio().classes()).toEqual(['vf-radio', 'vf-radio--md']);
  });

  it('emits state modifiers in a fixed order', () => {
    const classes = mountRadio({
      props: { value: 'a', modelValue: 'a', invalid: true, disabled: true, size: 'lg' },
    }).classes();

    expect(classes).toEqual([
      'vf-radio',
      'vf-radio--lg',
      'vf-radio--checked',
      'vf-radio--invalid',
      'vf-radio--disabled',
    ]);
  });

  it('puts a consumer class and style on the root label', () => {
    const wrapper = mountRadio({ attrs: { class: 'consumer-radio', style: 'margin: 4px' } });

    expect(wrapper.classes()).toContain('consumer-radio');
    expect(wrapper.attributes('style')).toBe('margin: 4px;');
    expect(wrapper.get('input').classes()).toEqual(['vf-radio__input']);
  });
});

describe('VfRadio characterization: events', () => {
  it('emits its own value, not a boolean, when it becomes checked', async () => {
    const wrapper = mountRadio({ props: { value: 'alpha' } });
    const input = wrapper.get('input');
    (input.element as HTMLInputElement).checked = true;
    await input.trigger('change');

    expect(wrapper.emitted('update:modelValue')).toEqual([['alpha']]);
    expect(wrapper.emitted('change')).toEqual([['alpha']]);
  });

  it('stays silent when the change event finds it unchecked', async () => {
    // The quirk that makes a group work: being unchecked is something another
    // radio caused, so this one does not announce it.
    const wrapper = mountRadio({ props: { value: 'alpha', modelValue: 'alpha' } });
    const input = wrapper.get('input');
    (input.element as HTMLInputElement).checked = false;
    await input.trigger('change');

    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(wrapper.emitted('change')).toBeUndefined();
  });
});

describe('VfRadio characterization: real groups', () => {
  /** Two radios sharing a name, the way a consumer builds a group. */
  const Group = defineComponent({
    setup() {
      const chosen = ref<string | undefined>('a');

      return () =>
        h('div', [
          h(VfRadio, {
            name: 'pick',
            value: 'a',
            label: 'Alpha',
            modelValue: chosen.value,
            'onUpdate:modelValue': (value: string) => (chosen.value = value),
          }),
          h(VfRadio, {
            name: 'pick',
            value: 'b',
            label: 'Beta',
            modelValue: chosen.value,
            'onUpdate:modelValue': (value: string) => (chosen.value = value),
          }),
        ]);
    },
  });

  it('shares a name across the group and gives each member its own value', () => {
    const inputs = mount(Group, { attachTo: document.body }).findAll('input');

    expect(inputs.map((input) => input.attributes('name'))).toEqual(['pick', 'pick']);
    expect(inputs.map((input) => input.attributes('value'))).toEqual(['a', 'b']);
  });

  it('starts with exactly the member matching the model checked', () => {
    const inputs = mount(Group, { attachTo: document.body }).findAll('input');

    expect(inputs.map((input) => (input.element as HTMLInputElement).checked)).toEqual([true, false]);
  });

  it('moves the selection when a second member is chosen, unchecking the first', async () => {
    const wrapper = mount(Group, { attachTo: document.body });
    const [first, second] = wrapper.findAll('input');
    (second.element as HTMLInputElement).checked = true;
    await second.trigger('change');

    expect((second.element as HTMLInputElement).checked).toBe(true);
    expect((first.element as HTMLInputElement).checked).toBe(false);
    expect(wrapper.findAll('.vf-radio').map((radio) => radio.classes().includes('vf-radio--checked'))).toEqual([
      false,
      true,
    ]);
  });
});

describe('VfRadio characterization: attribute forwarding', () => {
  it('forwards everything except class and style onto the input', () => {
    const input = mountRadio({
      props: { value: 'a' },
      attrs: { id: 'pick-a', name: 'pick', required: true, 'data-testid': 'pick-a' },
    }).get('input');

    expect(input.attributes('id')).toBe('pick-a');
    expect(input.attributes('name')).toBe('pick');
    expect(input.attributes('required')).toBeDefined();
    expect(input.attributes('data-testid')).toBe('pick-a');
  });

  it('keeps the value prop authoritative, because value is declared rather than inherited', () => {
    // Worth pinning: `value` is a declared prop, so it never reaches attrs and
    // a consumer cannot decouple the rendered value from the one this radio
    // emits. Contrast aria-invalid below, which is not a prop and can be
    // overridden.
    expect(
      mountRadio({ props: { value: 'a' }, attrs: { value: 'override' } })
        .get('input')
        .attributes('value'),
    ).toBe('a');
  });

  it('lets a consumer override an attribute the component does not declare', () => {
    expect(
      mountRadio({ props: { value: 'a', invalid: true }, attrs: { 'aria-invalid': 'false' } })
        .get('input')
        .attributes('aria-invalid'),
    ).toBe('false');
  });
});
