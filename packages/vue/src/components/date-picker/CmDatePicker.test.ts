import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';

import CmDatePicker from './CmDatePicker.vue';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CmDatePicker', () => {
  it('renders the selected date through the component-owned trigger', () => {
    const wrapper = mount(CmDatePicker, {
      props: { id: 'launch-date', modelValue: '2026-08-13' },
      attrs: { name: 'launch_date' },
    });

    expect(wrapper.get('.cm-date-picker__value').text()).toBe('08/13/26');
    expect(wrapper.get('button.cm-date-picker').attributes('aria-haspopup')).toBe('dialog');
    expect(wrapper.get('input[type="hidden"]').attributes('value')).toBe('2026-08-13');
    wrapper.unmount();
  });

  it('clears the value and restores focus to the trigger', async () => {
    const wrapper = mount(CmDatePicker, {
      attachTo: document.body,
      props: { id: 'launch-date', modelValue: '2026-08-13', clearable: true, clearLabel: 'Remove launch date' },
    });
    const trigger = wrapper.get<HTMLButtonElement>('button.cm-date-picker');
    const clear = wrapper.get<HTMLButtonElement>('[data-cm-date-picker-clear]');

    expect(clear.attributes('aria-label')).toBe('Remove launch date');
    await clear.trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.emitted('valueChange')).toEqual([['']]);
    expect(clear.attributes('hidden')).toBe('');
    expect(document.activeElement).toBe(trigger.element);
    wrapper.unmount();
  });

  it('selects a day from the calendar and closes it', async () => {
    const wrapper = mount(CmDatePicker, { props: { id: 'launch-date', modelValue: '2026-08-13' } });
    await wrapper.get('button.cm-date-picker').trigger('click');

    expect(wrapper.get('.cm-date-picker__calendar').attributes('hidden')).toBeUndefined();
    await wrapper.get('[data-cm-date-picker-value="2026-08-20"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-08-20']]);
    expect(wrapper.get('.cm-date-picker__calendar').attributes('hidden')).toBe('');
    wrapper.unmount();
  });

  it('omits the clear action when the control is readonly', () => {
    const wrapper = mount(CmDatePicker, {
      props: { id: 'launch-date', modelValue: '2026-08-13', clearable: true, readonly: true },
    });

    expect(wrapper.find('[data-cm-date-picker-clear]').exists()).toBe(false);
    wrapper.unmount();
  });
});
