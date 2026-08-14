import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import CmDatePicker from './CmDatePicker.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CmDatePicker', () => {
  it('clears through the native input event and restores focus', async () => {
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: { modelValue: '2026-08-13', clearable: true, clearLabel: 'Remove launch date' },
    });
    const input = wrapper.get<HTMLInputElement>('input');
    const clear = wrapper.get<HTMLButtonElement>('[data-cm-input-clear]');

    expect(clear.attributes('aria-label')).toBe('Remove launch date');
    await clear.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.emitted('valueChange')).toEqual([['']]);
    expect(clear.attributes('hidden')).toBe('');
    expect(document.activeElement).toBe(input.element);
    wrapper.unmount();
  });

  it('omits the clear action when the control is readonly', () => {
    const wrapper = mount(CmDatePicker, { props: { modelValue: '2026-08-13', clearable: true, readonly: true } });
    expect(wrapper.element.tagName).toBe('INPUT');
    expect(wrapper.find('[data-cm-input-clear]').exists()).toBe(false);
  });
});
