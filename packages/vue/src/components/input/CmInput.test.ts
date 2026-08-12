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
    const wrapper = mount(defineComponent({
      setup: () => () => h(CmInput, { modelValue: 'before', onInput, 'onUpdate:modelValue': onUpdate }),
    }));

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
});
