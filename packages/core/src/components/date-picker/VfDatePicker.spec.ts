import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
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

    expect(wrapper.get('.vf-date-picker__value').text()).toBe('Jul 30, 2026');
    expect(wrapper.get('input[type="hidden"]').attributes()).toMatchObject({
      name: 'startsAt',
      value: '2026-07-30',
    });
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
});
