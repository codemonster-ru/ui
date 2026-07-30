import { mount } from '@vue/test-utils';
import { defineComponent, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import VfField from '@/components/field/VfField.vue';
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

  it('integrates with floating field labels and suppresses the empty placeholder', async () => {
    const wrapper = mount(
      defineComponent({
        components: {
          VfDatePicker,
          VfField,
        },
        data() {
          return {
            value: '',
          };
        },
        template: `
          <VfField label="Release date" label-placement="floating">
            <template #default="{ controlId, describedBy, invalid }">
              <VfDatePicker
                :id="controlId"
                v-model="value"
                placeholder="Choose a date"
                :invalid="invalid"
                :aria-describedby="describedBy"
                disable-teleport
              />
            </template>
          </VfField>
        `,
      }),
    );

    await nextTick();

    expect(wrapper.get('.vf-field').classes()).toContain('vf-field--floating');
    expect(wrapper.get('.vf-date-picker').classes()).toContain('vf-date-picker--floating');
    expect(wrapper.get('.vf-date-picker__value').text()).toBe('');
    expect(wrapper.get('.vf-field__control').classes()).not.toContain('vf-field__control--filled');

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('.vf-field__control').classes()).toContain('vf-field__control--filled');
  });

  it('selects a month and preserves the YYYY-MM model value', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026-07',
        monthPicker: true,
        locale: 'en-US',
        showTime: true,
        disableTeleport: true,
      },
      attrs: {
        name: 'billingMonth',
      },
    });

    expect(wrapper.get('.vf-date-picker__value').text()).toBe('07/26');
    expect(wrapper.get('input[type="hidden"]').attributes('value')).toBe('2026-07');

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('.vf-date-picker__month').text()).toBe('2026');
    expect(wrapper.findAll('.vf-date-picker__month-option')).toHaveLength(12);
    expect(wrapper.get('[data-month="2026-07"]').attributes('aria-selected')).toBe('true');
    expect(wrapper.find('.vf-date-picker__time').exists()).toBe(false);

    await wrapper.get('[data-month="2026-09"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2026-09']]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(false);
  });

  it('applies month constraints and navigates between years', async () => {
    const wrapper = mount(VfDatePicker, {
      attachTo: document.body,
      props: {
        modelValue: '2026-07',
        monthPicker: true,
        min: '2026-04',
        max: '2027-02',
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-month="2026-03"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-month="2026-04"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('[aria-label="Previous year"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Next year"]').attributes('disabled')).toBeUndefined();

    const selectedMonth = wrapper.get<HTMLElement>('[data-month="2026-07"]');
    selectedMonth.element.focus();
    await selectedMonth.trigger('keydown', { key: 'ArrowRight' });
    await nextTick();

    expect(document.activeElement).toBe(wrapper.get('[data-month="2026-08"]').element);

    await wrapper.get('[aria-label="Next year"]').trigger('click');
    await nextTick();

    expect(wrapper.get('.vf-date-picker__month').text()).toBe('2027');
    expect(document.activeElement).toBe(wrapper.get('[data-month="2027-02"]').element);
    expect(wrapper.get('[data-month="2027-03"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Next year"]').attributes('disabled')).toBeDefined();
  });

  it('supports multiple month selection', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2026-05', '2026-07'],
        monthPicker: true,
        multiple: true,
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();
    await wrapper.get('[data-month="2026-05"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-07']]]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(true);
  });

  it('selects and renders a month range', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2026-04', '2026-08'],
        monthPicker: true,
        range: true,
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-month="2026-04"]').classes()).toContain('vf-date-picker__day--range-start');
    expect(wrapper.get('[data-month="2026-06"]').classes()).toContain('vf-date-picker__day--in-range');
    expect(wrapper.get('[data-month="2026-08"]').classes()).toContain('vf-date-picker__day--range-end');

    await wrapper.get('[data-month="2026-04"]').trigger('click');
    await wrapper.setProps({ modelValue: ['2026-04'] });
    await wrapper.get('[data-month="2026-02"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-04']], [['2026-02', '2026-04']]]);
  });

  it('selects a year and preserves the YYYY model value', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: '2026',
        yearPicker: true,
        locale: 'en-US',
        showTime: true,
        disableTeleport: true,
      },
      attrs: {
        name: 'fiscalYear',
      },
    });

    expect(wrapper.get('.vf-date-picker__value').text()).toBe('2026');
    expect(wrapper.get('input[type="hidden"]').attributes('value')).toBe('2026');

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('.vf-date-picker__month').text()).toBe('2020–2031');
    expect(wrapper.findAll('.vf-date-picker__year-option')).toHaveLength(12);
    expect(wrapper.findAll('.vf-date-picker__year-row')).toHaveLength(4);
    expect(wrapper.get('[data-year="2026"]').attributes('aria-selected')).toBe('true');
    expect(wrapper.find('.vf-date-picker__time').exists()).toBe(false);

    await wrapper.get('[data-year="2028"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([['2028']]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(false);
  });

  it('applies year constraints and navigates between decades', async () => {
    const wrapper = mount(VfDatePicker, {
      attachTo: document.body,
      props: {
        modelValue: '2026',
        yearPicker: true,
        min: '2024',
        max: '2032',
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-year="2023"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[data-year="2024"]').attributes('disabled')).toBeUndefined();
    expect(wrapper.get('[aria-label="Previous decade"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Next decade"]').attributes('disabled')).toBeUndefined();

    const selectedYear = wrapper.get<HTMLElement>('[data-year="2026"]');
    selectedYear.element.focus();
    await selectedYear.trigger('keydown', { key: 'ArrowRight' });
    await nextTick();

    expect(document.activeElement).toBe(wrapper.get('[data-year="2027"]').element);

    await wrapper.get('[aria-label="Next decade"]').trigger('click');
    await nextTick();

    expect(wrapper.get('.vf-date-picker__month').text()).toBe('2032–2043');
    expect(document.activeElement).toBe(wrapper.get('[data-year="2032"]').element);
    expect(wrapper.get('[data-year="2033"]').attributes('disabled')).toBeDefined();
    expect(wrapper.get('[aria-label="Next decade"]').attributes('disabled')).toBeDefined();
  });

  it('supports multiple year selection', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2025', '2027'],
        yearPicker: true,
        multiple: true,
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();
    await wrapper.get('[data-year="2025"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2027']]]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(true);
  });

  it('selects and renders a year range', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2023', '2027'],
        yearPicker: true,
        range: true,
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-year="2023"]').classes()).toContain('vf-date-picker__day--range-start');
    expect(wrapper.get('[data-year="2025"]').classes()).toContain('vf-date-picker__day--in-range');
    expect(wrapper.get('[data-year="2027"]').classes()).toContain('vf-date-picker__day--range-end');

    await wrapper.get('[data-year="2023"]').trigger('click');
    await wrapper.setProps({ modelValue: ['2023'] });
    await wrapper.get('[data-year="2021"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2023']], [['2021', '2023']]]);
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

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-07-15']], [['2026-07-15', '2026-07-30']]]);
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

  it('renders range boundaries and the dates between them', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2026-07-15', '2026-07-20'],
        range: true,
        locale: 'en-US',
        disableTeleport: true,
      },
      attrs: {
        name: 'bookingRange',
      },
    });

    expect(wrapper.get('.vf-date-picker__value').text()).toBe('07/15/26 – 07/20/26');
    expect(wrapper.findAll('input[type="hidden"]').map((input) => input.attributes('value'))).toEqual([
      '2026-07-15',
      '2026-07-20',
    ]);

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();

    expect(wrapper.get('[data-date="2026-07-15"]').classes()).toContain('vf-date-picker__day--range-start');
    expect(wrapper.get('[data-date="2026-07-20"]').classes()).toContain('vf-date-picker__day--range-end');
    expect(wrapper.get('[data-date="2026-07-16"]').classes()).toContain('vf-date-picker__day--in-range');
    expect(wrapper.get('[data-date="2026-07-16"]').attributes('aria-selected')).toBe('false');
  });

  it('selects and sorts range boundaries', async () => {
    const wrapper = mount(VfDatePicker, {
      props: {
        modelValue: ['2026-07-20', '2026-07-25'],
        range: true,
        disableTeleport: true,
      },
    });

    await wrapper.get('.vf-date-picker').trigger('click');
    await nextTick();
    await wrapper.get('[data-date="2026-07-20"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-07-20']]]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(true);

    await wrapper.setProps({ modelValue: ['2026-07-20'] });
    await wrapper.get('[data-date="2026-07-15"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-07-20']], [['2026-07-15', '2026-07-20']]]);
    expect(wrapper.find('.vf-date-picker__calendar').exists()).toBe(false);
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

    expect(wrapper.emitted('update:modelValue')).toEqual([[['2026-07-15T16:20', '2026-07-20T10:00']]]);
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

    const hourOption = Array.from(document.body.querySelectorAll<HTMLElement>('[role="option"]')).find(
      (option) => option.textContent?.trim() === '16',
    );

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
