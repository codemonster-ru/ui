import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import VfInput from './VfInput.vue';

describe('VfInput', () => {
  it('reactively renders named leading and trailing icons around a native input', async () => {
    const wrapper = mount(VfInput, {
      attrs: { id: 'search', name: 'query', autocomplete: 'off' },
      props: { modelValue: 'before', type: 'search' },
    });

    expect(wrapper.element).toBe(wrapper.get('input').element);
    await wrapper.setProps({ leadingIcon: 'magnifyingGlass', trailingIcon: 'filter' });

    const leading = wrapper.get('.cm-input__leading svg');
    const trailing = wrapper.get('.cm-input__trailing svg');
    expect(leading.attributes('aria-hidden')).toBe('true');
    expect(trailing.attributes('aria-hidden')).toBe('true');
    expect(leading.element.innerHTML).not.toBe(trailing.element.innerHTML);
    const input = wrapper.get('input');
    expect(input.attributes()).toMatchObject({ id: 'search', name: 'query', type: 'search', autocomplete: 'off' });
    expect(input.element.value).toBe('before');
    await input.setValue('after');
    expect(wrapper.emitted('update:modelValue')).toEqual([['after']]);
    expect(wrapper.emitted('input')).toHaveLength(1);

    await wrapper.setProps({ leadingIcon: undefined, trailingIcon: undefined });
    expect(wrapper.element).toBe(wrapper.get('input').element);
    expect(wrapper.get('input').element.value).toBe('after');
  });

  it('gives an explicit slot precedence and keeps the native clear action', async () => {
    const wrapper = mount(VfInput, {
      attachTo: document.body,
      props: { modelValue: '10', leadingIcon: 'magnifyingGlass', trailingIcon: 'filter', clearable: true },
      slots: { leading: '<span>@</span>' },
    });

    try {
      const leading = wrapper.get('.cm-input__leading');
      expect(leading.text()).toBe('@');
      expect(leading.find('svg').exists()).toBe(false);
      expect(wrapper.find('.cm-input__trailing svg').exists()).toBe(true);
      await wrapper.get('[data-cm-input-clear]').trigger('click');
      expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
      expect(wrapper.get('input').element).toBe(document.activeElement);
    } finally {
      wrapper.unmount();
    }
  });
});
