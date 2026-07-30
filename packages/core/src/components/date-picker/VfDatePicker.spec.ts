import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import VfSelect from '@/components/select/VfSelect.vue';
import VfDatePicker from './VfDatePicker.vue';

describe('VfDatePicker', () => {
  it('renders a localized value and preserves the ISO value for form submission', () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026-07-30',
        locale: 'en-US',
      },
      attrs: {
        name: 'startsAt',
      },
    });

    expect(wrapper.get('.vf-date-picker__value').text()).toBe('07/30/26');
    expect(wrapper.get('input[type="hidden"]').attributes()).toMatchObject({
      name: 'startsAt',
      value: '2026-07-30',
    });
  });

  it('supports a custom display format without changing the model value', () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026-07-30T14:05',
        showTime: true,
        displayFormat: 'yyyy/MM/dd HH:mm',
      },
      attrs: {
        name: 'startsAt',
      },
    });

    expect(wrapper.get('.vf-date-picker__value').text()).toBe('2026/07/30 14:05');
    expect(wrapper.get('input[type="hidden"]').attributes('value')).toBe('2026-07-30T14:05');
  });

  it('opens the selected month and emits an ISO date when a day is selected', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026-07-15',
        locale: 'en-US',
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('.vf-date-picker__month').text()).toBe('July 2026');
    expect(wrapper.findAll('.vf-date-picker__day')).toHaveLength(35);
    expect(wrapper.get('[data-date="2026-07-15"]').classes()).toContain('vf-button');
    expect(wrapper.get('[data-date="2026-07-15"]').classes()).toContain('vf-button--ghost');
    expect(wrapper.get('[data-date="2026-07-15"]').classes()).not.toContain('vf-button--sm');
    expect(wrapper.get('[aria-label="Previous month"]').classes()).not.toContain('vf-icon-button--sm');
    expect(wrapper.get('[aria-label="Next month"]').classes()).not.toContain('vf-icon-button--sm');
    expect(wrapper.get('[aria-label="Previous month"]').classes()).toContain('vf-date-picker__navigation');
    expect(wrapper.get('[aria-label="Next month"]').classes()).toContain('vf-date-picker__navigation');
    expect(wrapper.get('[data-date="2026-07-15"]').attributes('aria-selected')).toBe('true');
    expect(wrapper.get('.vf-date-picker__calendar').attributes('style')).not.toContain('min-width');

    await wrapper.get('[data-date="2026-07-20"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-07-20']]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(false);
  });

  it('disables dates and month navigation outside min and max', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026-08-15',
        min: '2026-08-10',
        max: '2026-08-20',
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.findAll('.vf-date-picker__day')).toHaveLength(42);
    expect(wrapper.get('[data-date="2026-08-09"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-date="2026-08-21"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Previous month"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Next month"]').attributes('disabled')).toBeDefined();
  });

  it('moves focus through the grid with arrow keys', async () => {
    const wrapper = mount(VfDatePicker, {
      attachTo: document.body,
      props: {
        modelValue: '2026-07-15',
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    const selectedDay = wrapper.get<HTMLElement>('[data-date="2026-07-15"]');
    selectedDay.element.focus();
    await selectedDay.trigger('keydown', { key: 'ArrowRight' });
    await nextTick();

    expect(document.activeElement).toBe(wrapper.get('[data-date="2026-07-16"]').element);
  });

  it('clamps month keyboard navigation to the target month', async () => {
    const wrapper = mount(VfDatePicker, {
      attachTo: document.body,
      props: {
        modelValue: '2024-03-31',
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();
    await wrapper.get<HTMLElement>('[data-date="2024-03-31"]').trigger('keydown', { key: 'PageUp' });
    await nextTick();

    expect(wrapper.get('.vf-date-picker__month').text()).toContain('2024');
    expect(document.activeElement).toBe(wrapper.get('[data-date="2024-02-29"]').element);
  });

  it('clears the current value without opening the calendar', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026-07-15',
        clearable: true,
        disableTeleport: true,
      },
    });

    await wrapper.get('[aria-label="Clear date"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['']]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(false);
  });

  it('toggles multiple dates and keeps the calendar open', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2026-07-15', '2026-07-20'],
        multiple: true,
        locale: 'en-US',
        clearable: true,
        disableTeleport: true,
      },
      attrs: {
        name: 'releaseDates',
      },
    });

    expect(wrapper.get('.vf-date-picker__value').text()).toBe('07/15/26; 07/20/26');
    expect(wrapper.findAll('input[type="hidden"]').map((input) => input.attributes('value'))).toEqual([
      '2026-07-15',
      '2026-07-20',
    ]);

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-date="2026-07-15"]').attributes('aria-selected')).toBe('true');
    expect(wrapper.get('[data-date="2026-07-20"]').attributes('aria-selected')).toBe('true');

    await wrapper.get('[data-date="2026-07-20"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-07-15']]]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(true);

    await wrapper.setProps({ modelValue: ['2026-07-15'] });
    await wrapper.get('[data-date="2026-07-30"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [['2026-07-15']],
      [['2026-07-15', '2026-07-30']],
    ]);
  });

  it('clears multiple dates as an empty array', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2026-07-15', '2026-07-20'],
        multiple: true,
        clearable: true,
      },
    });

    await wrapper.get('[aria-label="Clear date"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[[]]]);
  });

  it('updates the local ISO value immediately when date or time changes', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026-07-15T14:20',
        showTime: true,
        minuteStep: 10,
        locale: 'en-US',
        disableTeleport: true,
      },
    });

    expect(wrapper.get('.vf-date-picker__value').text()).toContain('14:20');

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();
    await wrapper.get('[data-date="2026-07-20"]').trigger('click');

    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-07-20T14:20']]);

    const [hourSelect, minuteSelect] = wrapper.findAllComponents(VfSelect);
    await hourSelect!.setValue('16');
    await minuteSelect!.setValue('30');

    expect(wrapper.emitted('update:modelValue')).toEqual([
      ['2026-07-20T14:20'],
      ['2026-07-20T16:20'],
      ['2026-07-20T16:30'],
    ]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(true);
  });

  it('updates time for the active date in multiple mode', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2026-07-15T14:20', '2026-07-20T10:00'],
        multiple: true,
        showTime: true,
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    const [hourSelect] = wrapper.findAllComponents(VfSelect);
    await hourSelect!.setValue('16');

    expect(wrapper.emitted('update:modelValue')).toEqual([
      [['2026-07-15T16:20', '2026-07-20T10:00']],
    ]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(true);
  });

  it('keeps the calendar open when a time option is selected from a teleported menu', async () => {
    const wrapper = mount(VfDatePicker, {
      attachTo: document.body,
      props: {
        modelValue: '2026-07-15T14:20',
        showTime: true,
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await wrapper.get('[aria-label="Hour"]').trigger('click');
    await nextTick();

    const hourOption = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]'))
      .find((option) => option.textContent?.trim() === '16');

    expect(hourOption).toBeDefined();
    expect(document.body.contains(hourOption ?? null)).toBe(true);
    expect(wrapper.get('.vf-date-picker__calendar').element.contains(hourOption ?? null)).toBe(false);

    hourOption?.click();
    await nextTick();

    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(true);
    expect(wrapper.get('[aria-label="Hour"]').text()).toContain('16');
  });

  it('disables unavailable time options at date-time boundaries', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026-08-10T10:30',
        min: '2026-08-10T10:30',
        max: '2026-08-10T11:00',
        showTime: true,
        minuteStep: 15,
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    const [hourSelect, minuteSelect] = wrapper.findAllComponents(VfSelect);
    const hourOptions = hourSelect!.props('options') as Array<{ value: string; disabled?: boolean }>;
    const minuteOptions = minuteSelect!.props('options') as Array<{ value: string; disabled?: boolean }>;

    expect(hourOptions.find((option) => option.value === '09')?.disabled).toBe(true);
    expect(hourOptions.find((option) => option.value === '10')?.disabled).toBe(false);
    expect(hourOptions.find((option) => option.value === '11')?.disabled).toBe(false);
    expect(hourOptions.find((option) => option.value === '12')?.disabled).toBe(true);
    expect(minuteOptions.find((option) => option.value === '15')?.disabled).toBe(true);
    expect(minuteOptions.find((option) => option.value === '30')?.disabled).toBe(false);
  });
});
