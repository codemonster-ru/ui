import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import CmInput from './CmInput.vue';

describe('CmInput', () => {
  it('renders one native controlled input with forwarded form attributes', () => {
    const wrapper = mount(CmInput, {
      attrs: { class: ['consumer', 'cm-input'], id: 'email', name: 'email', autocomplete: 'email' },
      props: { modelValue: 'team@example.com', type: 'email', size: 'lg' },
    });

    expect(wrapper.element.tagName).toBe('INPUT');
    expect(wrapper.attributes('class')).toBe('cm-input cm-input--lg consumer');
    expect(wrapper.attributes()).toMatchObject({
      id: 'email',
      name: 'email',
      autocomplete: 'email',
      type: 'email',
      value: 'team@example.com',
    });
  });

  it('emits the current DOM value from native input', async () => {
    const onInput = vi.fn();
    const onUpdate = vi.fn();
    const wrapper = mount(
      defineComponent({
        setup: () => () => h(CmInput, { modelValue: 'before', onInput, 'onUpdate:modelValue': onUpdate }),
      }),
    );

    await wrapper.get('input').setValue('after');

    expect(onInput).toHaveBeenCalledOnce();
    expect((onInput.mock.calls[0]?.[0] as Event).type).toBe('input');
    expect(onUpdate).toHaveBeenCalledWith('after');
  });

  it('owns native and aria state attributes', () => {
    const wrapper = mount(CmInput, {
      attrs: { disabled: false, readonly: false, required: false, 'aria-invalid': 'false' },
      props: { invalid: true, disabled: true, readonly: true, required: true },
    });

    expect(wrapper.attributes()).toMatchObject({
      disabled: '',
      readonly: '',
      required: '',
      'aria-invalid': 'true',
    });
    expect(wrapper.classes()).toContain('cm-input--invalid');
  });

  it('renders adornments and clears the native value through model events', async () => {
    const wrapper = mount(CmInput, {
      attachTo: document.body,
      props: { modelValue: 'query', clearable: true },
      slots: { leading: '<span>@</span>', trailing: '<span>required</span>' },
    });

    expect(wrapper.find('.cm-input__leading').text()).toBe('@');
    expect(wrapper.find('.cm-input__trailing').text()).toBe('required');
    await wrapper.get('[data-cm-input-clear]').trigger('click');

    const updates = wrapper.emitted('update:modelValue');
    expect(updates?.[updates.length - 1]).toEqual(['']);
    expect(wrapper.get('input').element).toBe(document.activeElement);
    expect(wrapper.get('[data-cm-input-clear]').attributes()).toHaveProperty('hidden');
    wrapper.unmount();
  });

  it('reveals passwords without changing their value or selection', async () => {
    const wrapper = mount(CmInput, {
      props: {
        modelValue: 'secret',
        type: 'password',
        passwordReveal: true,
        showPasswordLabel: 'Show secret',
        hidePasswordLabel: 'Hide secret',
      },
    });
    const input = wrapper.get('input').element;
    input.setSelectionRange(1, 4);

    await wrapper.get('[data-cm-input-password]').trigger('click');

    expect(input.type).toBe('text');
    expect(input.value).toBe('secret');
    expect([input.selectionStart, input.selectionEnd]).toEqual([1, 4]);
    expect(wrapper.get('[data-cm-input-password]').attributes()).toMatchObject({
      'aria-label': 'Hide secret',
      'aria-pressed': 'true',
    });
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
